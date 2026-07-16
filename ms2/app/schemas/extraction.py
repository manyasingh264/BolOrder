"""
LLM Extraction Schemas.

These define the structured JSON that GPT-4o must return.
LangChain's structured output feature enforces this contract.
No freeform text allowed — only typed JSON.
"""

from typing import Optional
from pydantic import BaseModel, Field


class ExtractedProduct(BaseModel):
    """
    A single product+variant+quantity extracted from the voice transcript.
    Example: "20 packet Aloo Bhujia 200 gram"
    """
    product_name: str = Field(description="Product name as spoken, e.g. 'Aloo Bhujia'")
    variant_description: Optional[str] = Field(
        default=None,
        description="Weight/size as spoken, e.g. '200 gram', '500g', 'bada wala'"
    )
    quantity: int = Field(description="Number of units ordered")
    unit: Optional[str] = Field(
        default="packet",
        description="Unit of ordering, e.g. 'packet', 'box', 'piece', 'carton'"
    )
    confidence: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="LLM confidence that this extraction is correct (0.0–1.0)"
    )


class ExtractionResult(BaseModel):
    """
    Full structured output from GPT-4o for a voice transcript.

    The LLM extracts:
    - Shop name (as spoken)
    - List of products with variants and quantities
    - Detected language
    - Whether clarification is needed
    - What to ask if clarification is needed
    """
    shop_name: Optional[str] = Field(
        default=None,
        description="Shop name as spoken, e.g. 'Sharma General Store'"
    )
    products: list[ExtractedProduct] = Field(
        default_factory=list,
        description="All products extracted from the transcript"
    )
    language: str = Field(
        default="hi",
        description="Detected language: 'en' for English, 'hi' for Hindi/Hinglish"
    )
    overall_confidence: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Overall extraction confidence (0.0–1.0)"
    )
    needs_clarification: bool = Field(
        default=False,
        description="True if LLM couldn't extract something clearly"
    )
    clarification_question: Optional[str] = Field(
        default=None,
        description="Question to ask user if needs_clarification=True"
    )
    raw_transcript: Optional[str] = Field(
        default=None,
        description="Original transcript for reference"
    )
