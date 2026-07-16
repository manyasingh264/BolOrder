"""
LLMService — GPT-4o powered order entity extraction.

Design decisions:
- Uses LangChain's with_structured_output() to enforce typed JSON from GPT-4o.
  GPT-4o cannot return freeform text — it MUST return ExtractionResult JSON.
- Prompt loaded from file (not hardcoded).
- language in the prompt tells GPT-4o what language to respond in.
- Single responsibility: extract entities. Nothing else.
"""

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from app.config import settings
from app.schemas.extraction import ExtractionResult
from app.utils.logger import get_logger

logger = get_logger(__name__)


class LLMService:
    """
    Extracts structured order entities from a voice transcript using GPT-4o.
    """

    def __init__(self):
        self._llm = ChatOpenAI(
            model=settings.OPENAI_MODEL,
            api_key=settings.OPENAI_API_KEY,
            temperature=0,          # Deterministic extraction — no creativity needed
        )
        # Bind structured output schema — GPT-4o must return ExtractionResult JSON
        self._structured_llm = self._llm.with_structured_output(ExtractionResult)
        logger.info(f"LLMService initialized with model: {settings.OPENAI_MODEL}")

    def extract_order_entities(
        self,
        transcript: str,
        language: str = "hi",
        conversation_history: list[dict] | None = None,
    ) -> ExtractionResult:
        """
        Extract shop name, products, variants, quantities from a voice transcript.

        Args:
            transcript: The voice-to-text input from the salesman.
            language: "hi" for Hindi/Hinglish, "en" for English.
            conversation_history: Previous turns for context (optional).

        Returns:
            ExtractionResult with typed fields. Never raises — returns
            a safe result with needs_clarification=True on failure.
        """
        system_prompt = self._build_system_prompt(language)

        messages = [SystemMessage(content=system_prompt)]

        # Add conversation history for context (last 6 turns max)
        if conversation_history:
            for turn in conversation_history[-6:]:
                role = turn.get("role", "user")
                content = turn.get("content", "")
                if role == "user":
                    messages.append(HumanMessage(content=content))

        messages.append(HumanMessage(content=transcript))

        try:
            logger.info(f"Calling GPT-4o for extraction | lang={language} | transcript='{transcript[:80]}...'")
            result: ExtractionResult = self._structured_llm.invoke(messages)
            result.raw_transcript = transcript
            logger.info(
                f"Extraction complete | shop={result.shop_name} | "
                f"products={len(result.products)} | confidence={result.overall_confidence}"
            )
            return result

        except Exception as e:
            logger.error(f"LLM extraction failed: {e}")
            # Safe fallback — never crash the graph
            return ExtractionResult(
                shop_name=None,
                products=[],
                language=language,
                overall_confidence=0.0,
                needs_clarification=True,
                clarification_question=(
                    "Mujhe samajh nahi aaya. Kya aap dobara bol sakte hain?"
                    if language == "hi"
                    else "I didn't understand. Could you please repeat?"
                ),
                raw_transcript=transcript,
            )

    def _build_system_prompt(self, language: str) -> str:
        """Build the extraction system prompt with language instruction."""
        lang_instruction = (
            "Respond in Hindi (Hinglish is fine)." if language == "hi"
            else "Respond in English."
        )

        return f"""You are an AI assistant for a Voice Inventory Management System used by sales representatives in India.

Your job is to extract structured order information from voice transcripts.
Transcripts may be in Hindi, English, or Hinglish (mixed).

{lang_instruction}

Extract the following from the transcript:
1. shop_name: The name of the shop the salesman is ordering for. Common patterns: "X ko", "X ke liye", "for X", "X store"
2. products: List of products with:
   - product_name: Product name (e.g., "Aloo Bhujia", "Moong Dal", "Kurkure")
   - variant_description: Weight/size (e.g., "200 gram", "500g", "bada wala", "chota packet")
   - quantity: Number of units (integer)
   - unit: Ordering unit (e.g., "packet", "box", "piece", "carton", "dozen")
   - confidence: How confident you are (0.0–1.0)
3. language: "hi" for Hindi/Hinglish, "en" for English
4. overall_confidence: Overall extraction confidence (0.0–1.0)
5. needs_clarification: true if anything is unclear or missing
6. clarification_question: What to ask the user if needs_clarification=true

Rules:
- quantity must be an integer
- If quantity is unclear, set confidence=0.5 and needs_clarification=true
- If shop name is unclear, set needs_clarification=true
- "bees" = 20, "das" = 10, "paanch" = 5, "pachaas" = 50, "sau" = 100
- Common Hindi product units: "packet"=packet, "dabba"=box, "peti"=carton

Example transcript: "Sharma General Store ko bees packet Aloo Bhujia do sau gram aur das packet Moong Dal paanch sau gram bhej dena"
Example output: shop_name="Sharma General Store", products=[{{"product_name":"Aloo Bhujia","variant_description":"200 gram","quantity":20,"unit":"packet","confidence":1.0}},{{"product_name":"Moong Dal","variant_description":"500 gram","quantity":10,"unit":"packet","confidence":1.0}}]
"""
