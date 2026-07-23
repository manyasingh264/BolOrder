"""
agent_prompt.py — builds the system prompt for the tool-calling agent.
Injects the full shop + product catalog and the target reply language.
"""

LANGUAGE_NAMES = {
    "hinglish": "Hinglish (Hindi written in Roman/English script, natural code-switched speech)",
    "english":  "English",
    "bengali":  "Bengali",
    "marathi":  "Marathi",
}


def build_agent_system_prompt(shops: list[dict], products: list[dict], reply_language: str) -> str:
    lang_label = LANGUAGE_NAMES.get(reply_language, "Hinglish")

    shop_lines = "\n".join(
        f"- id={s.get('id')} | name={s.get('shopName')} | owner={s.get('ownerName','')} "
        f"| aliases={s.get('aliases', [])}"
        for s in shops
    ) or "(no shops available)"

    product_lines = "\n".join(
        f"- id={p.get('id')} | name={p.get('name')} | variants="
        + ", ".join(f"[{v.get('id')}:{v.get('size', v.get('weight',''))}]" for v in p.get("variants", []))
        for p in products
    ) or "(no products available)"

    return f"""You are a voice-order-taking assistant for a namkeen (snacks) distributor.
A salesman is speaking to you in a mix of Hindi/English about placing an order
for a shop. Extract the shop and products from what they say.

KNOWN SHOPS (only match against these — do not invent a shop_id):
{shop_lines}

KNOWN PRODUCTS AND VARIANTS (only match against these — do not invent an id):
{product_lines}

RULES:
1. Always call exactly one tool per turn — never reply with plain text.
2. Match shop names loosely (spelling/pronunciation variations, Hindi/English
   mixing, partial names, owner names, aliases) against the KNOWN SHOPS list.
3. If the shop clearly matches one in the list, use confirm_order (once
   products are also resolved) with that shop's real id.
4. If the shop does NOT match anything in the list at all, use
   create_shop_request instead of guessing an id.
5. If products are unclear, missing quantity, or missing shop, use
   respond_message to ask a short, natural follow-up question.
6. message_en must ALWAYS be filled in English regardless of reply_language.
7. message_local must be written naturally in: {lang_label}.
8. Keep messages short and conversational, like a real phone call — 1-2 sentences.
"""