"""
prompts/agent_prompt.py — 5-part prompt builder for the voice order agent.

Key design decisions:
  1. If shop + all products are clearly extracted → MUST call previewOrder immediately
  2. After previewOrder, the UI shows. When salesman says "yes/haan/confirm" → call confirmOrder
     NEVER ask verbally "kiya confirm karna hai?" — that causes double confirmation
  3. If salesman is stuck in yes/no loop (clarify_count >= 2) → make a decision
  4. Max 1 clarification question per turn — keep the flow fast (10-20 seconds)
"""

from typing import Optional


# ── Language instruction map ─────────────────────────────────────────────────
# Only two languages are supported:
#   hinglish → Hindi-English mix (default for most salesmen in India)
#   english  → clear plain English
#
# IMPORTANT: Every tool call MUST always populate BOTH:
#   message_en    → response in clear English
#   message_local → response in Hinglish OR English (matching reply_language)
# The frontend picks which field to show and speak based on the salesman's selection.
_LANG_INSTRUCTIONS = {
    "hinglish": (
        "Reply in Hinglish (casual Hindi-English mix, Roman script). "
        "Keep it very short and conversational. "
        "Example: 'Ganesh Store mein order ho raha hai, kya product chahiye?'"
    ),
    "english": (
        "Reply in simple, clear English. Keep it short. "
        "Example: 'Order for Ganesh Store noted. Which product do you need?'"
    ),
}

DUAL_RESPONSE_RULE = """
DUAL-LANGUAGE RESPONSE RULE (MANDATORY):
You MUST always fill BOTH fields in every tool call:
  message_en    → Always in clear English
  message_local → In {reply_language} language
Never leave either field blank.
The frontend will display and speak the correct one based on the salesman's language choice.
"""


def _format_shops(shops: list[dict]) -> str:
    if not shops:
        return "  (No shops loaded — context not yet fetched)"
    lines = []
    for s in shops:
        name    = s.get("shopName", s.get("shop_name", "Unknown"))
        sid     = s.get("id", "")
        owner   = s.get("ownerName") or s.get("owner_name") or ""
        aliases = [a.get("alias", "") for a in (s.get("aliases") or [])]
        alias_str = f" | aliases: {', '.join(aliases)}" if aliases else ""
        owner_str = f" | owner: {owner}" if owner else ""
        lines.append(f"  - [{sid}] {name}{owner_str}{alias_str}")
    return "\n".join(lines)


def _format_products(products: list[dict]) -> str:
    if not products:
        return "  (No products loaded — context not yet fetched)"
    lines = []
    for p in products:
        name    = p.get("name", "Unknown")
        aliases = [a.get("alias", "") for a in (p.get("aliases") or [])]
        alias_str = f" | also called: {', '.join(aliases)}" if aliases else ""
        lines.append(f"  Product: {name}{alias_str}")
        for v in (p.get("variants") or []):
            vid   = v.get("id", "")
            size  = v.get("size") or ""
            unit  = v.get("unit", "")
            price = v.get("price", "")
            lines.append(f"    → variant_id={vid} | {size} {unit} | ₹{price}")
    return "\n".join(lines)


def _format_summary(memory: dict) -> str:
    parts = []

    selected_shop = memory.get("selected_shop")
    if selected_shop:
        parts.append(f"Selected Shop: {selected_shop.get('shop_name', '')} (id: {selected_shop.get('shop_id', '')})")

    draft = memory.get("draft_order")
    if draft:
        items_str = ", ".join(
            f"{i.get('quantity')}x {i.get('product_name', '')}"
            for i in (draft.get("items") or [])
        )
        parts.append(f"Draft Order: Shop={draft.get('shop_name', '')} | Items: {items_str}")

    step = memory.get("current_step", "idle")
    if step and step != "idle":
        parts.append(f"Current Step: {step}")

    clarification = memory.get("clarification_state")
    if clarification:
        parts.append(f"Pending Clarification: {clarification}")

    clarify_count = memory.get("clarify_count", 0)
    if clarify_count:
        parts.append(f"Clarification Attempts So Far: {clarify_count}")

    pending_tool = memory.get("pending_tool")
    if pending_tool:
        parts.append(f"Previous Tool: {pending_tool}")

    return "\n".join(parts) if parts else "New conversation — no state yet."


def _format_recent_messages(recent_messages: list[dict]) -> list[dict]:
    messages = []
    for msg in recent_messages:
        role    = msg.get("role", "user")
        content = msg.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    return messages


# ── Main Prompt Builder ────────────────────────────────────────────────────────

def build_agent_messages(
    memory: dict,
    recent_messages: list[dict],
    shops: list[dict],
    products: list[dict],
    current_transcript: str,
    reply_language: str = "hinglish",
) -> list[dict]:
    """
    Build the full 5-part message list for the LLM.
    """
    lang_instruction = _LANG_INSTRUCTIONS.get(
        reply_language,
        _LANG_INSTRUCTIONS["hinglish"]
    )
    dual_rule = DUAL_RESPONSE_RULE.format(reply_language=reply_language)
    current_step     = memory.get("current_step", "idle")
    clarify_count    = memory.get("clarify_count", 0)
    clarif_state     = memory.get("clarification_state", {})

    # ── Part 1: System Prompt ─────────────────────────────────────────────────
    system_content = f"""You are BolOrder AI — a fast, efficient voice order assistant for salesmen visiting kirana shops in India.

LANGUAGE:
{lang_instruction}
{dual_rule}
Keep messages SHORT — 1-2 sentences maximum.

═══════════════════════════════════════════════════════════════
CRITICAL DECISION RULES — FOLLOW EXACTLY:
═══════════════════════════════════════════════════════════════

RULE 1 — DIRECT TO PREVIEW (HIGHEST PRIORITY):
If you can extract ALL of the following from the transcript:
  ✓ Shop name → matches exactly ONE shop in the catalog
  ✓ At least one product → matches a variant in the catalog
  ✓ Quantities for all products
Then you MUST immediately call → previewOrder
DO NOT ask for confirmation first. Just preview.

RULE 2 — SHOP NOT FOUND → CREATE SILENTLY (NO ASKING):
If the spoken shop name does NOT match any shop in the catalog:
  → Call createShop IMMEDIATELY
  → Do NOT ask "should I create this shop?"
  → Do NOT call confirmCreateShop
  → The shop is created silently in the background
  → After createShop, ask what products to order
The salesman never needs to confirm shop creation.

RULE 3 — AFTER PREVIEW, SALESMAN CONFIRMS VIA UI:
When current_step = "awaiting_confirmation":
  - The UI is already showing the order to the salesman
  - If salesman says "yes", "haan", "ha", "confirm", "theek hai", "kar do", "ok" → call confirmOrder
  - If salesman says "no", "nahi", "cancel", "band karo" → call cancelConversation
  - NEVER ask "kiya confirm karna hai?" again — they already see it on screen
  - NEVER call previewOrder again when step = "awaiting_confirmation"

RULE 4 — ONE QUESTION AT A TIME:
Ask maximum ONE clarification question per turn.
Priority order: shop → products → quantities

RULE 5 — CLARIFICATION LOOP BREAKER:
Current clarification_attempts = {clarify_count}
If clarify_count >= 2 for the SAME product/quantity issue:
  - Make your best guess based on catalog and proceed
  - Do not keep asking the same question

═══════════════════════════════════════════════════════════════
TOOL SELECTION GUIDE:
═══════════════════════════════════════════════════════════════
• Everything clear (shop + products + qty) → previewOrder
• Step = awaiting_confirmation AND user said yes → confirmOrder
• Step = awaiting_confirmation AND user said no → cancelConversation
• Multiple shops match the same name → chooseShop
• Shop NOT found in catalog → createShop (NEVER confirmCreateShop)
• Product unclear → clarifyProduct (only if shop is known)
• Quantity missing → clarifyQuantity (only if shop + product known)
• Audio garbled/empty → repeatVoice
• General info needed → respondMessage

NEVER USE confirmCreateShop — it is disabled. Always use createShop directly.
ALWAYS use a tool. NEVER return plain text.
"""

    messages: list[dict] = [{"role": "system", "content": system_content}]

    # ── Part 2: Conversation State ─────────────────────────────────────────────
    summary_text = _format_summary(memory)
    messages.append({
        "role": "system",
        "content": f"=== CONVERSATION STATE ===\n{summary_text}"
    })

    # ── Part 3: Business Context ───────────────────────────────────────────────
    shop_catalog    = _format_shops(shops)
    product_catalog = _format_products(products)
    messages.append({
        "role": "system",
        "content": (
            f"=== SHOP CATALOG ===\n{shop_catalog}\n\n"
            f"=== PRODUCT CATALOG ===\n{product_catalog}"
        )
    })

    # ── Part 4: Recent Messages (conversation history) ─────────────────────────
    messages.extend(_format_recent_messages(recent_messages))

    # ── Part 5: Current Transcript ─────────────────────────────────────────────
    if current_transcript and current_transcript.strip():
        last_user = next(
            (m for m in reversed(messages) if m.get("role") == "user"),
            None
        )
        if not last_user or last_user.get("content", "").strip() != current_transcript.strip():
            messages.append({"role": "user", "content": current_transcript})

    return messages
