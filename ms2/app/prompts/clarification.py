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
            f"Maine samajha '{shop_name}' naam ki dukaan, "
            "lekin record mein yeh dukaan nahi hai. "
            "Kya aap dobara naam bata sakte hain?"
        )
    return (
        f"I understood the shop name as '{shop_name}', "
        "but it's not in our records. Could you please repeat the shop name?"
    )


def shop_not_found_with_options_message(shop_name: str, language: str = "hi") -> str:
    """Message when shop is not found after max retries - offer alternatives."""
    if language == "hi":
        return (
            f"Maine samajha '{shop_name}' naam ki dukaan, "
            "lekin record mein yeh dukaan nahi hai. "
            "Aap chahein toh: 1. Dusri dukaan ka naam bata dein, "
            "2. Nai dukaan create karein, ya 3. Order cancel karein."
        )
    return (
        f"I understood the shop name as '{shop_name}', "
        "but it's not in our records. Would you like to: "
        "1. Try another shop, 2. Create a new shop, or 3. Cancel the order?"
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
            f"'{product_name}' product available nahi hai. "
            "Kya aap koi aur product bata sakte hain?"
        )
    return (
        f"'{product_name}' is not available. "
        "Could you please name a different product?"
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
