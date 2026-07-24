"""
graph/tools.py — Complete tool definitions for the AI conversation agent.

Every LLM response is represented as a tool call. The agent never returns
free-form JSON — it always selects one of these tools.

Tools (15 total):
  respondMessage      — General clarification / question / reply
  extractOrder        — LLM parsed shop + products from transcript
  clarifyShop         — Ask user to clarify which shop
  clarifyProduct      — Ask user about an unrecognized product
  clarifyQuantity     — Ask user about a missing/unclear quantity
  chooseShop          — Multiple shops found, ask user to choose
  previewOrder        — Show draft order for confirmation
  confirmOrder        — User confirmed — create order via MS1
  confirmCreateShop   — Ask user if they want to create a missing shop
  createShop          — Create new shop via MS1 internal API
  repeatVoice         — Low confidence audio — ask to repeat
  shopNotFound        — Shop truly not found after attempts
  productNotFound     — Product truly not found
  cancelConversation  — User wants to cancel
  finishConversation  — Conversation complete (order created)

Tool format: OpenAI function-calling schema.
"""

AGENT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "respondMessage",
            "description": (
                "Send a general message to the salesman. Use when asking for clarification, "
                "acknowledging input, or when no other tool fits the situation. "
                "This keeps the conversation going."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "message_en": {
                        "type": "string",
                        "description": "Message in English"
                    },
                    "message_local": {
                        "type": "string",
                        "description": "Message in the salesman's language (Hindi/Hinglish/Bengali/Marathi)"
                    },
                },
                "required": ["message_en", "message_local"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "extractOrder",
            "description": (
                "Called when you have successfully extracted a shop name AND at least one product "
                "with quantity from the transcript. Use this to confirm what you understood "
                "before showing the preview."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "shop_name": {
                        "type": "string",
                        "description": "Extracted shop name in English"
                    },
                    "items": {
                        "type": "array",
                        "description": "List of extracted order items",
                        "items": {
                            "type": "object",
                            "properties": {
                                "product_name": {
                                    "type": "string",
                                    "description": "Product name in English"
                                },
                                "variant_description": {
                                    "type": "string",
                                    "description": "Size/weight spoken (e.g. '200 gram', '500g', 'bada wala')"
                                },
                                "quantity": {
                                    "type": "integer",
                                    "description": "Number of units ordered"
                                },
                                "unit": {
                                    "type": "string",
                                    "description": "Unit type (e.g. packet, box, dabba, peti)"
                                },
                            },
                            "required": ["product_name", "quantity"],
                        },
                    },
                    "message_en": {
                        "type": "string",
                        "description": "Confirmation message in English"
                    },
                    "message_local": {
                        "type": "string",
                        "description": "Confirmation message in local language"
                    },
                },
                "required": ["shop_name", "items", "message_en", "message_local"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "clarifyShop",
            "description": (
                "Ask the salesman to clarify or repeat the shop name. "
                "Use when the shop name is unclear, partially heard, or ambiguous."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "message_en": {
                        "type": "string",
                        "description": "Question asking to clarify shop name, in English"
                    },
                    "message_local": {
                        "type": "string",
                        "description": "Same question in the salesman's language"
                    },
                },
                "required": ["message_en", "message_local"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "clarifyProduct",
            "description": (
                "Ask the salesman to clarify a product name that could not be matched. "
                "Mention the product name you heard and ask them to confirm or correct it."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "product_name_heard": {
                        "type": "string",
                        "description": "The product name as you understood it"
                    },
                    "message_en": {
                        "type": "string",
                        "description": "Clarification question in English"
                    },
                    "message_local": {
                        "type": "string",
                        "description": "Clarification question in local language"
                    },
                },
                "required": ["product_name_heard", "message_en", "message_local"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "clarifyQuantity",
            "description": (
                "Ask the salesman to specify or confirm a quantity that is missing or unclear."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "product_name": {
                        "type": "string",
                        "description": "Product whose quantity is unclear"
                    },
                    "message_en": {
                        "type": "string",
                        "description": "Question asking for quantity in English"
                    },
                    "message_local": {
                        "type": "string",
                        "description": "Question in local language"
                    },
                },
                "required": ["product_name", "message_en", "message_local"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "clarifyVariant",
            "description": (
                "The product EXISTS in the catalog, but the size/weight/variant the salesman "
                "mentioned does NOT match any available variant for that product. "
                "Use this tool to inform the salesman which variants ARE available and ask them to choose one. "
                "NEVER silently substitute a different variant — always ask using this tool. "
                "Example: salesman says 'chana dal 100g' but only 200g and 500g exist — call clarifyVariant."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "product_name": {
                        "type": "string",
                        "description": "The product name that was found in the catalog"
                    },
                    "spoken_variant": {
                        "type": "string",
                        "description": "The size/weight the salesman said (e.g. '100 gram')"
                    },
                    "available_variants": {
                        "type": "array",
                        "description": "All available variants for this product from the catalog",
                        "items": {
                            "type": "object",
                            "properties": {
                                "variant_id": {
                                    "type": "string",
                                    "description": "UUID of the variant"
                                },
                                "size": {
                                    "type": "string",
                                    "description": "Size value (e.g. '200')"
                                },
                                "unit": {
                                    "type": "string",
                                    "description": "Unit (e.g. 'gram', 'kg', 'packet')"
                                },
                                "price": {
                                    "type": "string",
                                    "description": "Price of this variant"
                                },
                            },
                            "required": ["variant_id", "size", "unit"],
                        },
                    },
                    "message_en": {
                        "type": "string",
                        "description": "Message in English listing the available sizes and asking which one"
                    },
                    "message_local": {
                        "type": "string",
                        "description": "Same message in Hinglish/Hindi — list the sizes clearly"
                    },
                },
                "required": ["product_name", "spoken_variant", "available_variants", "message_en", "message_local"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "chooseShop",
            "description": (
                "Multiple shops match the spoken name. Present options and ask the salesman "
                "to choose which one they mean."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "matches": {
                        "type": "array",
                        "description": "List of shop matches to present",
                        "items": {
                            "type": "object",
                            "properties": {
                                "shop_id": {"type": "string"},
                                "shop_name": {"type": "string"},
                                "owner_name": {"type": "string"},
                                "address": {"type": "string"},
                            },
                            "required": ["shop_id", "shop_name"],
                        },
                    },
                    "message_en": {
                        "type": "string",
                        "description": "Message presenting choices in English"
                    },
                    "message_local": {
                        "type": "string",
                        "description": "Message presenting choices in local language"
                    },
                },
                "required": ["matches", "message_en", "message_local"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "previewOrder",
            "description": (
                "Show the complete draft order to the salesman and ask for confirmation. "
                "Use this when you have matched the shop and all products. "
                "The salesman will reply 'yes'/'haan' to confirm or 'no'/'nahi' to cancel."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "shop_id": {
                        "type": "string",
                        "description": "UUID of the matched shop"
                    },
                    "shop_name": {
                        "type": "string",
                        "description": "Display name of the shop"
                    },
                    "items": {
                        "type": "array",
                        "description": "Order line items",
                        "items": {
                            "type": "object",
                            "properties": {
                                "product_variant_id": {
                                    "type": "string",
                                    "description": "UUID of the matched product variant"
                                },
                                "product_name": {"type": "string"},
                                "variant_description": {"type": "string"},
                                "quantity": {"type": "integer"},
                            },
                            "required": ["product_variant_id", "product_name", "quantity"],
                        },
                    },
                    "message_en": {
                        "type": "string",
                        "description": "Order summary message in English"
                    },
                    "message_local": {
                        "type": "string",
                        "description": "Order summary in local language"
                    },
                },
                "required": ["shop_id", "shop_name", "items", "message_en", "message_local"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "confirmOrder",
            "description": (
                "The salesman has confirmed the draft order (said 'yes'/'haan'). "
                "The system will now create the order in MS1. "
                "Only call this when the salesman has explicitly confirmed."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "shop_id": {"type": "string"},
                    "shop_name": {"type": "string"},
                    "items": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "product_variant_id": {"type": "string"},
                                "product_name": {"type": "string"},
                                "quantity": {"type": "integer"},
                            },
                            "required": ["product_variant_id", "product_name", "quantity"],
                        },
                    },
                    "message_en": {"type": "string"},
                    "message_local": {"type": "string"},
                },
                "required": ["shop_id", "shop_name", "items", "message_en", "message_local"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "confirmCreateShop",
            "description": (
                "The shop was not found in the catalog. Ask the salesman if they want "
                "to create a new shop with the spoken name. Wait for their confirmation."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "shop_name": {
                        "type": "string",
                        "description": "The shop name to potentially create"
                    },
                    "message_en": {"type": "string"},
                    "message_local": {"type": "string"},
                },
                "required": ["shop_name", "message_en", "message_local"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "createShop",
            "description": (
                "The salesman confirmed they want to create a new shop. "
                "Call this to create the shop in MS1. The shop will start as unverified."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "shop_name": {"type": "string"},
                    "owner_name": {"type": "string", "description": "Optional owner name"},
                    "phone": {"type": "string", "description": "Optional phone number"},
                    "message_en": {"type": "string"},
                    "message_local": {"type": "string"},
                },
                "required": ["shop_name", "message_en", "message_local"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "repeatVoice",
            "description": (
                "The audio was unclear or the transcript was empty/garbled. "
                "Ask the salesman to repeat their order more clearly."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "message_en": {"type": "string"},
                    "message_local": {"type": "string"},
                },
                "required": ["message_en", "message_local"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "shopNotFound",
            "description": (
                "The shop was not found and the salesman does not want to create a new one, "
                "or the shop name remains unclear after multiple attempts."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "message_en": {"type": "string"},
                    "message_local": {"type": "string"},
                },
                "required": ["message_en", "message_local"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "productNotFound",
            "description": (
                "A product was mentioned that does not exist in the catalog and "
                "could not be matched even after clarification."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "product_name": {"type": "string"},
                    "message_en": {"type": "string"},
                    "message_local": {"type": "string"},
                },
                "required": ["product_name", "message_en", "message_local"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "cancelConversation",
            "description": (
                "The salesman wants to cancel the order or end the conversation. "
                "Use when they say 'cancel', 'band karo', 'nahi chahiye', etc."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "message_en": {"type": "string"},
                    "message_local": {"type": "string"},
                },
                "required": ["message_en", "message_local"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "finishConversation",
            "description": (
                "The order has been successfully created. Use this to close the conversation "
                "and give the salesman a success confirmation."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {
                        "type": "string",
                        "description": "The created order ID from MS1"
                    },
                    "message_en": {"type": "string"},
                    "message_local": {"type": "string"},
                },
                "required": ["message_en", "message_local"],
            },
        },
    },
]

# Map tool name → conversation status for the API response
TOOL_STATUS_MAP = {
    "respondMessage":     "clarifying",
    "extractOrder":       "clarifying",
    "clarifyShop":        "clarifying",
    "clarifyProduct":     "clarifying",
    "clarifyQuantity":    "clarifying",
    "clarifyVariant":     "clarifying",
    "chooseShop":         "clarifying",
    "previewOrder":       "confirming",
    "confirmOrder":       "confirming",
    "confirmCreateShop":  "clarifying",
    "createShop":         "clarifying",
    "repeatVoice":        "clarifying",
    "shopNotFound":       "clarifying",
    "productNotFound":    "clarifying",
    "cancelConversation": "cancelled",
    "finishConversation": "completed",
}