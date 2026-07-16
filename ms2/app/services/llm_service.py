"""
LLMService — Gemini-powered entity extraction.

Responsibility:
    Extract structured order data (shop name, products, quantities) from a
    voice transcript. Nothing else. No DB access. No MS1 calls.

Design:
    - Uses google.genai SDK directly (already installed via langchain-google-genai).
    - response_mime_type="application/json" forces JSON output — no function calling issues.
    - JSON is parsed manually into ExtractionResult.
    - On any failure: returns safe ExtractionResult with needs_clarification=True.

Why not LangChain with_structured_output()?
    gemini-2.0-flash uses a different function-calling mechanism that causes
    with_structured_output() to return empty responses. Direct SDK + JSON parsing
    is simpler, reliable, and viva-friendly.
"""

import json
import re

import google.genai as genai
from google.genai import types

from app.config import settings
from app.prompts.extraction import build_extraction_prompt
from app.schemas.extraction import ExtractionResult, ExtractedProduct
from app.utils.logger import get_logger

logger = get_logger(__name__)


class LLMService:
    """
    Extracts structured order entities from a voice transcript.
    Instantiate once per request — the client is lightweight.
    """

    def __init__(self):
        self._client = genai.Client(api_key=settings.API_KEY)
        self._model  = settings.MODEL_NAME   # e.g., "gemini-2.0-flash"
        logger.info(f"LLMService ready | model={self._model}")

    def extract_order_entities(
        self,
        transcript: str,
        language: str = "hi",
        conversation_history: list[dict] | None = None,
    ) -> ExtractionResult:
        """
        Extract shop name, products, variants, quantities from a transcript.

        Returns ExtractionResult — ALWAYS. Never raises. Falls back to safe result.
        """
        system_prompt = build_extraction_prompt(language)

        # Build full prompt
        parts = [system_prompt, "\n\n"]
        if conversation_history:
            for turn in conversation_history[-6:]:
                if turn.get("role") == "user":
                    parts.append(f"Previous input: {turn.get('content', '')}\n")
        parts.append(f"Current transcript: {transcript}")
        full_prompt = "".join(parts)

        try:
            logger.info(
                f"LLM extraction | model={self._model} | "
                f"lang={language} | preview='{transcript[:60]}'"
            )

            response = self._client.models.generate_content(
                model=self._model,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    temperature=0,                        # Deterministic
                    response_mime_type="application/json",  # Force JSON — no empty response issue
                ),
            )

            raw_text = response.text.strip()
            logger.info(f"LLM raw response (first 300): {raw_text[:300]}")

            result_dict = self._parse_json(raw_text)
            result      = self._dict_to_result(result_dict, transcript, language)

            logger.info(
                f"Extraction done | shop='{result.shop_name}' | "
                f"products={len(result.products)} | "
                f"needs_clarification={result.needs_clarification}"
            )
            return result

        except Exception as e:
            logger.error(f"LLM extraction failed: {type(e).__name__}: {str(e)[:200]}")
            return self._fallback_result(transcript, language)

    # ── Private Helpers ───────────────────────────────────────────────────────

    def _parse_json(self, raw: str) -> dict:
        """Parse JSON, stripping markdown code fences if present."""
        cleaned = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
        cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE)
        return json.loads(cleaned.strip())

    def _dict_to_result(
        self, data: dict, transcript: str, language: str
    ) -> ExtractionResult:
        """Convert parsed JSON dict → ExtractionResult Pydantic schema."""
        products = []
        for p in data.get("products", []):
            products.append(ExtractedProduct(
                product_name        = str(p.get("product_name", "")),
                variant_description = str(p.get("variant_description", "")),
                quantity            = float(p.get("quantity", 0)),
                unit                = str(p.get("unit", "packet")),
                confidence          = float(p.get("confidence", 0.8)),
            ))

        return ExtractionResult(
            shop_name             = data.get("shop_name") or None,
            products              = products,
            language              = data.get("language", language),
            overall_confidence    = float(data.get("overall_confidence", 0.8)),
            needs_clarification   = bool(data.get("needs_clarification", False)),
            clarification_question= data.get("clarification_question"),
            raw_transcript        = transcript,
        )

    def _fallback_result(self, transcript: str, language: str) -> ExtractionResult:
        """Safe fallback — always requests clarification on failure."""
        question = (
            "Mujhe samajh nahi aaya. Kya aap dobara bol sakte hain?"
            if language == "hi"
            else "I didn't understand. Could you please repeat?"
        )
        return ExtractionResult(
            shop_name             = None,
            products              = [],
            language              = language,
            overall_confidence    = 0.0,
            needs_clarification   = True,
            clarification_question= question,
            raw_transcript        = transcript,
        )
