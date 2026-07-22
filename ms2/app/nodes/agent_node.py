"""
nodes/agent_node.py — The single AI agent node for the voice order conversation.

Key design principles (revised):
  1. SERVER-SIDE SHORTCUTS run BEFORE the LLM — no wasted API call for simple yes/no
  2. CLARIFICATION LIMITER — if clarify_count >= 2, force resolution (no more loops)
  3. DIRECT PATH — if first transcript has shop + products clear, skip to previewOrder
  4. createShop shortcut — when step=awaiting_shop_creation_confirm + "yes" → create shop directly
  5. confirmOrder shortcut — when step=awaiting_confirmation + "yes" → create order directly
"""

import json
from typing import Optional

from app.graph.state import VoiceOrderState
from app.graph.tools import AGENT_TOOLS, TOOL_STATUS_MAP
from app.prompts.agent_prompt import build_agent_messages
from app.services.ms1_client import MS1Client, MS1ClientError
from app.utils.logger import get_logger

logger = get_logger(__name__)

# ── Keyword sets for yes/no detection ─────────────────────────────────────────
CONFIRM_WORDS = {
    "yes", "haan", "ha", "han", "haa", "confirm", "theek hai", "thik hai",
    "kar do", "ok", "okay", "bilkul", "done", "sahi hai", "bana do",
    "naya", "chahiye", "registration", "register kar", "bana",
}
CANCEL_WORDS = {
    "no", "nahi", "na", "naa", "cancel", "band karo", "nahi chahiye",
    "mat karo", "rok do", "chodo", "rehne do",
}


def _matches_confirm(text: str) -> bool:
    t = text.lower().strip()
    return any(w in t for w in CONFIRM_WORDS)


def _matches_cancel(text: str) -> bool:
    t = text.lower().strip()
    return any(w in t for w in CANCEL_WORDS)


def _call_llm(messages: list[dict], tools: list[dict], api_key: str, model: str, base_url: Optional[str]) -> dict:
    """Call the LLM with tool-calling. Returns { tool_name, arguments }."""
    from openai import OpenAI

    client = OpenAI(api_key=api_key, base_url=base_url)
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        tools=tools,
        tool_choice="required",
        temperature=0.1,  # Lower temp = more deterministic
    )

    message = response.choices[0].message

    if not message.tool_calls:
        logger.warning("LLM returned no tool call — falling back to respondMessage")
        return {
            "tool_name": "respondMessage",
            "arguments": {
                "message_en": message.content or "I didn't understand. Please repeat.",
                "message_local": "Samajh nahi aaya. Dobara boliye.",
            }
        }

    tool_call = message.tool_calls[0]
    tool_name = tool_call.function.name
    try:
        arguments = json.loads(tool_call.function.arguments)
    except (json.JSONDecodeError, TypeError):
        arguments = {}

    logger.info(f"LLM selected tool: {tool_name}")
    return {"tool_name": tool_name, "arguments": arguments}


async def agent_node(state: VoiceOrderState) -> dict:
    """
    Main agent node — executes one complete conversation turn.
    """
    from app.config import settings

    session_id     = state.get("session_id", "")
    salesman_id    = state.get("salesman_id", "")
    auth_token     = state.get("auth_token")
    transcript     = state.get("transcript", "")
    reply_language = state.get("reply_language", "hinglish")
    session_store  = state.get("_session_store")

    # ── 1. Load or refresh business context cache ──────────────────────────────
    shops    = state.get("shops_cache") or []
    products = state.get("products_cache") or []

    if not shops or not products:
        logger.info(f"Loading business context from MS1 | session={session_id[:8]}")
        async with MS1Client(auth_token=auth_token) as client:
            context  = await client.get_context(salesman_id=salesman_id)
            shops    = context.get("shops", [])
            products = context.get("products", [])
        if session_store:
            session_store.update_cache(session_id, shops=shops, products=products)

    # ── 2. Load memory from session store ─────────────────────────────────────
    memory          = {}
    recent_messages = state.get("conversation_history", [])
    if session_store:
        session_data = session_store.get(session_id)
        if session_data:
            memory          = session_data.get("memory", {})
            recent_messages = memory.get("recent_messages", [])

    current_step   = memory.get("current_step", "idle")
    clarify_count  = memory.get("clarify_count", 0)
    draft_order    = state.get("draft_order")
    api_response   = state.get("api_response")

    # ── 3. SERVER-SIDE SHORTCUTS (run BEFORE LLM — no API call wasted) ────────
    # These intercept simple yes/no replies without touching the LLM at all.
    shortcut_tool = None
    shortcut_args = {}

    # ── Shortcut A: awaiting_confirmation + yes/no ────────────────────────────
    if current_step == "awaiting_confirmation" and transcript:
        draft_mem = memory.get("draft_order") or {}
        if _matches_confirm(transcript):
            # Build confirmOrder args directly from saved draft
            shortcut_tool = "confirmOrder"
            shortcut_args = {
                "shop_id": draft_mem.get("shopId", ""),
                "items": [
                    {
                        "product_variant_id": i.get("productVariantId", ""),
                        "quantity": i.get("quantity", 0),
                    }
                    for i in (draft_mem.get("items") or [])
                ],
                "message_en":    "Order confirmed! Creating now.",
                "message_local": "Order ban raha hai!",
            }
            logger.info(f"SHORTCUT: awaiting_confirmation + yes → confirmOrder | session={session_id[:8]}")
        elif _matches_cancel(transcript):
            shortcut_tool = "cancelConversation"
            shortcut_args = {
                "message_en":    "Order cancelled.",
                "message_local": "Order cancel kar diya.",
            }
            logger.info(f"SHORTCUT: awaiting_confirmation + no → cancelConversation | session={session_id[:8]}")

    # ── Shortcut B: awaiting_shop_creation_confirm + yes/no ───────────────────
    elif current_step == "awaiting_shop_creation_confirm" and transcript:
        clarif = memory.get("clarification_state") or {}
        pending_shop_name = clarif.get("shop_name", "")
        if _matches_confirm(transcript):
            shortcut_tool = "createShop"
            shortcut_args = {
                "shop_name":     pending_shop_name,
                "message_en":    f"Creating shop '{pending_shop_name}'. What would you like to order?",
                "message_local": f"'{pending_shop_name}' dukaan register ho rahi hai. Kya order dena hai?",
            }
            logger.info(f"SHORTCUT: awaiting_shop_creation_confirm + yes → createShop '{pending_shop_name}' | session={session_id[:8]}")
        elif _matches_cancel(transcript):
            shortcut_tool = "confirmCreateShop"  # Ask for different name / go back
            shortcut_args = {
                "shop_name":     pending_shop_name,
                "message_en":    "Okay, please tell me the correct shop name.",
                "message_local": "Theek hai, sahi dukaan ka naam batao.",
            }
            logger.info(f"SHORTCUT: awaiting_shop_creation_confirm + no → ask again | session={session_id[:8]}")

    # ── Shortcut C: clarify_count >= 3 — force resolution ─────────────────────
    # If the LLM has been asking the same question 3+ times, break the loop.
    if shortcut_tool is None and clarify_count >= 3:
        clarif = memory.get("clarification_state") or {}
        clarif_type = clarif.get("type", "")
        if clarif_type == "confirmCreateShop":
            pending_shop_name = clarif.get("shop_name", "Naya Store")
            shortcut_tool = "createShop"
            shortcut_args = {
                "shop_name":     pending_shop_name,
                "message_en":    f"Creating shop '{pending_shop_name}'. What products do you need?",
                "message_local": f"'{pending_shop_name}' dukaan bana raha hoon. Kya order dena hai?",
            }
            logger.info(f"SHORTCUT: clarify_count={clarify_count} >= 3, forcing createShop | session={session_id[:8]}")
        elif clarif_type == "chooseShop":
            matches = clarif.get("matches", [])
            if matches:
                best = matches[0]
                shortcut_tool = "respondMessage"
                shortcut_args = {
                    "message_en":    f"Selecting '{best.get('shop_name', '')}' for you.",
                    "message_local": f"'{best.get('shop_name', '')}' select kar raha hoon.",
                }
                # Update selected_shop immediately
                memory["selected_shop"] = {"shop_id": best.get("shop_id", ""), "shop_name": best.get("shop_name", "")}
                logger.info(f"SHORTCUT: clarify_count>=3, auto-selecting first shop | session={session_id[:8]}")

    # ── 4. LLM call (only if no shortcut matched) ─────────────────────────────
    if shortcut_tool:
        tool = shortcut_tool
        args = shortcut_args
    else:
        # Build prompt and call LLM
        messages = build_agent_messages(
            memory=memory,
            recent_messages=recent_messages,
            shops=shops,
            products=products,
            current_transcript=transcript,
            reply_language=reply_language,
        )

        api_key  = settings.API_KEY
        model    = settings.MODEL_NAME
        provider = settings.MODEL_PROVIDER.lower()

        base_url = None
        if provider == "openrouter" or (api_key and api_key.startswith("sk-or-")):
            base_url = "https://openrouter.ai/api/v1"
        elif provider == "groq":
            base_url = "https://api.groq.com/openai/v1"

        try:
            result = _call_llm(messages, AGENT_TOOLS, api_key, model, base_url)
            tool   = result["tool_name"]
            args   = result["arguments"]
        except Exception as e:
            logger.error(f"LLM call failed: {e}")
            tool = "respondMessage"
            args = {
                "message_en":    "Sorry, I'm having trouble. Please try again.",
                "message_local": "Kuch dikkat aa rahi hai. Dobara try kariye.",
            }

    # ── 5. Execute tool ────────────────────────────────────────────────────────
    response_status = TOOL_STATUS_MAP.get(tool, "clarifying")
    message_en      = args.get("message_en", "")
    message_local   = args.get("message_local", "")

    memory_updates = {
        "pending_tool":   tool,
        "reply_language": reply_language,
    }

    # ── previewOrder ───────────────────────────────────────────────────────────
    if tool == "previewOrder":
        draft_order = {
            "shopId":   args.get("shop_id", ""),
            "shopName": args.get("shop_name", ""),
            "items": [
                {
                    "productVariantId":    item.get("product_variant_id", ""),
                    "productName":         item.get("product_name", ""),
                    "variant_description": item.get("variant_description", ""),
                    "quantity":            item.get("quantity", 0),
                }
                for item in args.get("items", [])
            ],
        }
        memory_updates["draft_order"]           = draft_order
        memory_updates["current_step"]          = "awaiting_confirmation"
        memory_updates["selected_shop"]         = {
            "shop_id":   args.get("shop_id", ""),
            "shop_name": args.get("shop_name", ""),
        }
        memory_updates["clarify_count"]         = 0
        memory_updates["clarification_state"]   = None
        response_status = TOOL_STATUS_MAP.get("previewOrder", "confirming")

    # ── confirmOrder ───────────────────────────────────────────────────────────
    elif tool == "confirmOrder":
        draft_mem  = memory.get("draft_order") or {}
        shop_id    = args.get("shop_id") or draft_mem.get("shopId", "")
        items_args = args.get("items") or [
            {
                "product_variant_id": i.get("productVariantId", ""),
                "quantity": i.get("quantity", 0),
            }
            for i in (draft_mem.get("items") or [])
        ]

        try:
            async with MS1Client(auth_token=auth_token) as client:
                order = await client.create_internal_order(
                    shop_id=shop_id,
                    salesman_id=salesman_id,
                    items=[
                        {
                            "productVariantId": i.get("product_variant_id", ""),
                            "quantity":         i.get("quantity", 0),
                        }
                        for i in items_args
                    ],
                )
            api_response    = order
            response_status = "completed"
            memory_updates["current_step"]  = "completed"
            memory_updates["clarify_count"] = 0
            message_en    = "Order created successfully!"
            message_local = "Order ban gaya! Shukriya."
            logger.info(f"Order created | session={session_id[:8]} | order={order.get('id', '')}")

        except MS1ClientError as e:
            logger.error(f"Order creation failed: {e}")
            response_status = "clarifying"
            message_en    = f"Sorry, order could not be created: {str(e)}"
            message_local = "Maaf kijiye, order nahi ban paya. Dobara try kariye."
            tool          = "respondMessage"

    # ── createShop ────────────────────────────────────────────────────────────
    elif tool == "createShop":
        shop_name  = args.get("shop_name", "")
        owner_name = args.get("owner_name")
        phone      = args.get("phone")

        try:
            async with MS1Client(auth_token=auth_token) as client:
                new_shop = await client.create_internal_shop(
                    shop_name=shop_name,
                    salesman_id=salesman_id,
                    owner_name=owner_name,
                    phone=phone,
                )
            shops.append(new_shop)
            if session_store:
                session_store.update_cache(session_id, shops=shops, products=products)

            memory_updates["selected_shop"] = {
                "shop_id":   new_shop.get("id", ""),
                "shop_name": new_shop.get("shopName") or shop_name,
            }
            memory_updates["current_step"]          = "shop_selected"
            memory_updates["clarify_count"]         = 0
            memory_updates["clarification_state"]   = None
            response_status = "clarifying"
            message_en    = args.get("message_en", f"Shop '{shop_name}' registered! What would you like to order?")
            message_local = args.get("message_local", f"'{shop_name}' dukaan register ho gayi! Ab kya order dena hai?")
            logger.info(f"Shop created | id={new_shop.get('id')} | name={shop_name}")

        except MS1ClientError as e:
            logger.error(f"Shop creation failed: {e}")
            response_status = "clarifying"
            message_en    = f"Shop could not be created: {str(e)}"
            message_local = "Dukaan register nahi hui. Dobara try kariye."
            tool          = "respondMessage"

    # ── chooseShop ────────────────────────────────────────────────────────────
    elif tool == "chooseShop":
        memory_updates["clarification_state"] = {
            "type":    "chooseShop",
            "matches": args.get("matches", []),
        }
        memory_updates["current_step"]  = "choosing_shop"
        memory_updates["clarify_count"] = clarify_count + 1

    # ── confirmCreateShop ─────────────────────────────────────────────────────
    elif tool == "confirmCreateShop":
        memory_updates["clarification_state"] = {
            "type":      "confirmCreateShop",
            "shop_name": args.get("shop_name", ""),
        }
        memory_updates["current_step"]  = "awaiting_shop_creation_confirm"
        memory_updates["clarify_count"] = clarify_count + 1

    # ── clarification tools — increment counter ───────────────────────────────
    elif tool in ("clarifyProduct", "clarifyQuantity", "clarifyShop",
                  "shopNotFound", "productNotFound", "repeatVoice"):
        memory_updates["clarify_count"] = clarify_count + 1

    # ── respondMessage — only increment if it looks like a question ───────────
    elif tool == "respondMessage":
        if "?" in message_en or "?" in message_local:
            memory_updates["clarify_count"] = clarify_count + 1

    # ── cancelConversation ────────────────────────────────────────────────────
    elif tool == "cancelConversation":
        response_status = "cancelled"
        memory_updates["current_step"]  = "cancelled"
        memory_updates["clarify_count"] = 0

    # ── finishConversation ────────────────────────────────────────────────────
    elif tool == "finishConversation":
        response_status = "completed"
        memory_updates["current_step"]  = "completed"
        memory_updates["clarify_count"] = 0

    # ── 6. Update session memory + append messages ─────────────────────────────
    if session_store:
        session_store.update_memory(session_id, memory_updates)
        if transcript and transcript.strip():
            session_store.append_message(session_id, role="user", content=transcript)
        if message_en:
            session_store.append_message(session_id, role="assistant", content=message_en)

    logger.info(
        f"agent_node done | session={session_id[:8]} | tool={tool} | "
        f"status={response_status} | clarify_count={memory_updates.get('clarify_count', clarify_count)} | "
        f"shortcut={'yes' if shortcut_tool else 'no'}"
    )

    return {
        "shops_cache":     shops,
        "products_cache":  products,
        "last_tool":       tool,
        "message_en":      message_en,
        "message_local":   message_local,
        "response_status": response_status,
        "draft_order":     draft_order,
        "api_response":    api_response,
    }