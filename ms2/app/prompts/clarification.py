"""
Clarification prompt helpers.

Why a separate file?
    Clarification messages are shown/spoken to the salesman.
    They must be in Hindi/Hinglish — culturally correct, not generic.
    Keeping them here makes them easy to review and update.
"""


def shop_not_found_message(shop_name: str, language: str = "hi") -> str:
    """Message when MS1 cannot find the shop by the spoken name."""
    if language == "hi":
        return (
            f"'{shop_name}' naam ki koi dukaan nahi mili. "
            "Kya aap dukaan ka poora naam bata sakte hain? "
            "Ya owner ka naam bhi bata dein."
        )
    return (
        f"No shop named '{shop_name}' was found. "
        "Could you please provide the full shop name or the owner's name?"
    )


def shop_confirm_found_message(shop_name: str, owner_name: str, language: str = "hi") -> str:
    """Message when shop is found — ask user to confirm."""
    if language == "hi":
        return (
            f"Kya aap '{shop_name}' — {owner_name} ki dukaan ki baat kar rahe hain? "
            "Haan ya Nahi?"
        )
    return (
        f"Did you mean '{shop_name}' owned by {owner_name}? "
        "Please say Yes or No."
    )


def create_new_shop_message(shop_name: str, language: str = "hi") -> str:
    """Message when shop is not found and we are about to create it."""
    if language == "hi":
        return (
            f"'{shop_name}' naam ki dukaan record mein nahi hai. "
            "Kya hum yeh nai dukaan add kar dein? Haan ya Nahi?"
        )
    return (
        f"'{shop_name}' is not in our records. "
        "Should we add this as a new shop? Yes or No?"
    )


def product_not_found_message(product_name: str, language: str = "hi") -> str:
    """Message when a product name cannot be matched."""
    if language == "hi":
        return (
            f"'{product_name}' product nahi mila. "
            "Kya aap sahi product ka naam bata sakte hain?"
        )
    return (
        f"Could not find a product named '{product_name}'. "
        "Could you please say the correct product name?"
    )


def variant_unclear_message(product_name: str, language: str = "hi") -> str:
    """Message when product is found but size/variant is unclear."""
    if language == "hi":
        return (
            f"'{product_name}' ka size ya weight nahi samajh aaya. "
            "Kya aap bata sakte hain — kitne gram ka packet chahiye?"
        )
    return (
        f"The size/weight for '{product_name}' was not clear. "
        "Could you specify the weight (e.g., 200g or 500g)?"
    )


def quantity_unclear_message(product_name: str, language: str = "hi") -> str:
    """Message when quantity is missing or unclear."""
    if language == "hi":
        return (
            f"'{product_name}' ke kitne packet chahiye? "
            "Please quantity bataiye."
        )
    return (
        f"How many units of '{product_name}' do you need? "
        "Please specify the quantity."
    )


def general_clarification_message(language: str = "hi") -> str:
    """Fallback when extraction completely fails."""
    if language == "hi":
        return (
            "Mujhe samajh nahi aaya. Kya aap dobara bol sakte hain? "
            "Jaise: 'Sharma Store ke liye 10 packet Aloo Bhujia 200 gram'"
        )
    return (
        "I did not understand. Could you please repeat? "
        "For example: '10 packets of Aloo Bhujia 200g for Sharma Store'"
    )
