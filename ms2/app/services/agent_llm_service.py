"""
AgentLLMService — Tool-calling conversation agent for voice order-taking.

Supported providers (set MODEL_PROVIDER in .env):
    - "openai"     : OpenAI API  (gpt-4o-mini, gpt-4o, etc.)
    - "openrouter" : OpenRouter  (openai/gpt-4o-mini, etc.) — key starts with sk-or-
    - "groq"       : Groq API    (llama-3.3-70b-versatile, etc.) — free, fast
    - "gemini"     : Google Gemini (gemini-flash-latest, etc.)

Auto-detection: if API_KEY starts with "sk-or-", OpenRouter base URL is used
automatically even if MODEL_PROVIDER=openai.

Unlike LLMService (one-shot JSON extraction for the old pipeline), this
service always forces exactly one tool call per turn — respond_message,
confirm_order, or create_shop_request — and normalizes the result to the
same shape regardless of provider.
"""

import json

from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


class AgentLLMService:
    """Runs one turn of the tool-calling conversation agent."""

    def __init__(self):
        self._provider = settings.MODEL_PROVIDER.lower()
        self._model    = settings.MODEL_NAME
        self._client   = self._build_client()
        logger.info(
            f"AgentLLMService ready | provider={self._provider} | model={self._model}"
        )

    # ── Client Factory (identical pattern to LLMService) ────────────────────────

    def _build_client(self):
        if self._provider == "groq":
            from groq import Groq
            return Groq(api_key=settings.API_KEY)

        if self._provider in ("openai", "openrouter"):
            from openai import OpenAI
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

    def run_turn(
        self,
        system_prompt: str,
        conversation_history: list[dict],
        tools: list[dict],
    ) -> dict:
        """
        Sends system prompt + history to the LLM with the 3 agent tools and
        forces exactly one tool call. Always returns. Never raises.

        Returns: { "tool_name": str, "arguments": dict }
        """
        try:
            logger.info(
                f"Agent LLM call | provider={self._provider} | model={self._model} | "
                f"turns={len(conversation_history)}"
            )

            tool_name, arguments = self._call_llm(system_prompt, conversation_history, tools)

            safe_name = str(tool_name)[:60]
            logger.info(f"Agent tool selected: {safe_name} | args_keys={list(arguments.keys())}")

            return {"tool_name": tool_name, "arguments": arguments}

        except Exception as e:
            err = str(e)[:200].encode("ascii", "replace").decode("ascii")
            logger.error(f"Agent LLM failed [{type(e).__name__}]: {err}")
            return self._fallback()

    # ── Provider Dispatch ─────────────────────────────────────────────────────

    def _call_llm(
        self, system_prompt: str, conversation_history: list[dict], tools: list[dict]
    ) -> tuple[str, dict]:
        """Call the configured LLM with tools and return (tool_name, arguments)."""

        # OpenAI / OpenRouter / Groq — all use chat completions API with tools
        if self._provider in ("openai", "openrouter", "groq"):
            messages = [{"role": "system", "content": system_prompt}] + conversation_history
            response = self._client.chat.completions.create(
                model=self._model,
                messages=messages,
                tools=tools,
                tool_choice="required",
                temperature=0,
            )
            tool_call = response.choices[0].message.tool_calls[0]
            return tool_call.function.name, json.loads(tool_call.function.arguments)

        # Gemini — function calling uses a different SDK shape
        if self._provider == "gemini":
            from google.genai import types

            gemini_tools = [
                types.Tool(
                    function_declarations=[
                        types.FunctionDeclaration(
                            name=t["function"]["name"],
                            description=t["function"]["description"],
                            parameters=t["function"]["parameters"],
                        )
                        for t in tools
                    ]
                )
            ]

            history_text = "\n".join(
                f"{turn.get('role')}: {turn.get('content', '')}" for turn in conversation_history
            )
            full_prompt = f"{system_prompt}\n\nConversation so far:\n{history_text}"

            response = self._client.models.generate_content(
                model=self._model,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    temperature=0,
                    tools=gemini_tools,
                    tool_config=types.ToolConfig(
                        function_calling_config=types.FunctionCallingConfig(mode="ANY")
                    ),
                ),
            )
            call = response.candidates[0].content.parts[0].function_call
            return call.name, dict(call.args)

        raise ValueError(f"No _call_llm handler for provider: {self._provider}")

    # ── Fallback ──────────────────────────────────────────────────────────────

    def _fallback(self) -> dict:
        """Safe default when the LLM call fails entirely — never crashes the graph."""
        return {
            "tool_name": "respond_message",
            "arguments": {
                "message_en": "Sorry, I didn't catch that. Could you repeat?",
                "message_local": "Maaf kijiye, samajh nahi aaya. Dobara boliye?",
            },
        }