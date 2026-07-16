"""
Order summary prompt helpers.

Why a separate file?
    The order summary is what the salesman hears before confirming.
    It must be clear, natural Hindi/English — easy to verify in a viva.
"""


def build_order_summary(
    shop_name: str,
    items: list[dict],
    language: str = "hi",
) -> str:
    """
    Build a spoken order summary for the salesman to confirm.

    Args:
        shop_name: Name of the shop.
        items:     List of dicts with keys: product_name, variant_description, quantity, unit.
        language:  "hi" | "en"

    Returns:
        A natural language summary string (will be read aloud via TTS).
    """
    if language == "hi":
        lines = [f"Theek hai. Maine yeh order note kiya hai — {shop_name} ke liye:"]
        for i, item in enumerate(items, 1):
            name     = item.get("product_name", "Product")
            variant  = item.get("variant_description", "")
            qty      = item.get("quantity", "?")
            unit     = item.get("unit", "packet")
            lines.append(f"  {i}. {qty} {unit} {name} {variant}".strip())
        lines.append("Kya yeh order sahi hai? Haan ya Nahi bolein.")
        return "\n".join(lines)

    # English
    lines = [f"Here is your order for {shop_name}:"]
    for i, item in enumerate(items, 1):
        name    = item.get("product_name", "Product")
        variant = item.get("variant_description", "")
        qty     = item.get("quantity", "?")
        unit    = item.get("unit", "packet")
        lines.append(f"  {i}. {qty} {unit} of {name} {variant}".strip())
    lines.append("Is this correct? Please say Yes or No.")
    return "\n".join(lines)


def order_confirmed_message(language: str = "hi") -> str:
    """Message after successful order creation in MS1."""
    if language == "hi":
        return (
            "Bahut achha! Aapka order place ho gaya hai. "
            "Supervisor jaldi approve kar denge."
        )
    return (
        "Great! Your order has been placed successfully. "
        "It will be reviewed by the supervisor shortly."
    )


def order_rejected_message(language: str = "hi") -> str:
    """Message when salesman cancels the order."""
    if language == "hi":
        return "Theek hai. Order cancel kar diya gaya. Koi baat nahi."
    return "Understood. The order has been cancelled."


def order_failed_message(language: str = "hi") -> str:
    """Message when MS1 order creation fails."""
    if language == "hi":
        return (
            "Khed hai, order place nahi ho saka. "
            "Kripya thodi der baad phir koshish karein."
        )
    return (
        "Sorry, the order could not be placed due to a technical issue. "
        "Please try again in a moment."
    )
