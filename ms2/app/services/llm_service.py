"""
LLMService — Entity extraction using configurable LLM provider.

Supported providers (set MODEL_PROVIDER in .env):
    - "openai"     : OpenAI API  (gpt-4o-mini, gpt-4o, etc.)
    - "openrouter" : OpenRouter  (openai/gpt-4o-mini, etc.) — key starts with sk-or-
    - "groq"       : Groq API    (llama-3.3-70b-versatile, etc.) — free, fast
    - "gemini"     : Google Gemini (gemini-flash-latest, etc.)

Auto-detection: if API_KEY starts with "sk-or-", OpenRouter base URL is used
automatically even if MODEL_PROVIDER=openai.
"""

import json
import re

from app.config import settings
from app.prompts.extraction import build_extraction_prompt
from app.schemas.extraction import ExtractionResult, ExtractedProduct
from app.utils.logger import get_logger

logger = get_logger(__name__)


class LLMService:
    """Extracts structured order entities from a voice transcript."""

    def __init__(self):
        self._provider = settings.MODEL_PROVIDER.lower()
        self._model    = settings.MODEL_NAME
        self._client   = self._build_client()
        logger.info(
            f"LLMService ready | provider={self._provider} | model={self._model}"
        )

    # ── Client Factory ────────────────────────────────────────────────────────

    def _build_client(self):
        if self._provider == "groq":
            from groq import Groq
            return Groq(api_key=settings.API_KEY)

        if self._provider in ("openai", "openrouter"):
            from openai import OpenAI
            # Auto-detect OpenRouter by key prefix
            is_openrouter = (
                self._provider == "openrouter"
                or settings.API_KEY.startswith("sk-or-")
            )
            if is_openrouter:
                self._provider = "openrouter"
                logger.info("OpenRouter detected — using https://openrouter.ai/api/v1")
                return OpenAI(
                    api_key=settings.API_KEY,
                    base_url="https://openrouter.ai/api/v1",
                )
            return OpenAI(api_key=settings.API_KEY)

        if self._provider == "gemini":
            import google.genai as genai
            return genai.Client(api_key=settings.API_KEY)

        raise ValueError(
            f"Unknown MODEL_PROVIDER='{self._provider}'. "
            "Use: openai, openrouter, groq, or gemini."
        )

    # ── Public API ────────────────────────────────────────────────────────────

    def extract_order_entities(
        self,
        transcript: str,
        language: str = "hi",
        conversation_history: list[dict] | None = None,
    ) -> ExtractionResult:
        """Extract shop name, products, quantities. Always returns. Never raises."""
        system_prompt = build_extraction_prompt(language)

        history_text = ""
        if conversation_history:
            for turn in conversation_history[-6:]:
                if turn.get("role") == "user":
                    history_text += f"Previous input: {turn.get('content', '')}\n"
        user_message = history_text + f"Current transcript: {transcript}"

        try:
            preview = transcript[:60].encode("ascii", "replace").decode("ascii")
            logger.info(
                f"LLM call | provider={self._provider} | model={self._model} | "
                f"lang={language} | transcript='{preview}'"
            )

            raw_text = self._call_llm(system_prompt, user_message)

            safe = raw_text[:300].encode("ascii", "replace").decode("ascii")
            logger.info(f"LLM response: {safe}")

            data   = self._parse_json(raw_text)
            result = self._dict_to_result(data, transcript, language)

            shop = str(result.shop_name or "").encode("ascii", "replace").decode("ascii")
            logger.info(
                f"Extracted | shop='{shop}' | products={len(result.products)} | "
                f"clarify={result.needs_clarification}"
            )
            return result

        except Exception as e:
            err = str(e)[:200].encode("ascii", "replace").decode("ascii")
            logger.error(f"LLM failed [{type(e).__name__}]: {err}")
            return self._fallback(transcript, language)

    # ── Provider Dispatch ─────────────────────────────────────────────────────

    def _call_llm(self, system_prompt: str, user_message: str) -> str:
        """Call the configured LLM and return raw text."""

        # OpenAI / OpenRouter / Groq — all use chat completions API
        if self._provider in ("openai", "openrouter", "groq"):
            response = self._client.chat.completions.create(
                model=self._model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": user_message
                        + "\n\nRespond ONLY with a valid JSON object.",
                    },
                ],
                temperature=0,
                response_format={"type": "json_object"},
            )
            return response.choices[0].message.content

        # Gemini
        if self._provider == "gemini":
            from google.genai import types
            full = (
                system_prompt
                + "\n\n"
                + user_message
                + "\n\nIMPORTANT: Respond ONLY with a valid JSON object."
            )
            response = self._client.models.generate_content(
                model=self._model,
                contents=full,
                config=types.GenerateContentConfig(temperature=0),
            )
            return response.text

        raise ValueError(f"No _call_llm handler for provider: {self._provider}")

    # ── JSON Parsing ──────────────────────────────────────────────────────────

    def _parse_json(self, raw: str) -> dict:
        cleaned = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
        cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError(f"No JSON in response: {cleaned[:200]}")

    def _dict_to_result(self, data: dict, transcript: str, language: str) -> ExtractionResult:
        products = [
            ExtractedProduct(
                product_name        = str(p.get("product_name", "")),
                variant_description = str(p.get("variant_description", "")),
                quantity            = float(p.get("quantity", 0)),
                unit                = str(p.get("unit", "packet")),
                confidence          = float(p.get("confidence", 0.8)),
            )
            for p in data.get("products", [])
        ]
        return ExtractionResult(
            shop_name             = data.get("shop_name") or None,
            products              = products,
            language              = data.get("language", language),
            overall_confidence    = float(data.get("overall_confidence", 0.8)),
            needs_clarification   = bool(data.get("needs_clarification", False)),
            clarification_question= data.get("clarification_question"),
            raw_transcript        = transcript,
        )

    def _fallback(self, transcript: str, language: str) -> ExtractionResult:
        q = (
            "Mujhe samajh nahi aaya. Kya aap dobara bol sakte hain?"
            if language == "hi"
            else "I didn't understand. Could you please repeat?"
        )
        return ExtractionResult(
            shop_name=None, products=[], language=language,
            overall_confidence=0.0, needs_clarification=True,
            clarification_question=q, raw_transcript=transcript,
        )
