"""
create_order_node — Node 7 (Final) of the LangGraph pipeline.

Responsibility:
    Call MS1's POST /api/orders/voice with the confirmed draft order.
    Set api_response and the success/failure TTS message.
    Set response_status to "completed" or "failed".

This node only runs when confirmation_status == "confirmed".
After this node the graph ends and the session is deleted by the route handler.
"""

from app.graph.state import VoiceOrderState
from app.prompts.summary import order_confirmed_message, order_failed_message
from app.services.ms1_client import MS1Client, MS1ClientError
from app.utils.logger import get_logger

logger = get_logger(__name__)


async def create_order_node(state: VoiceOrderState) -> dict:
    """
    Call MS1 to create the voice order after salesman confirmation.

    Reads:  draft_order, auth_token, transcript, language
    Writes: api_response, tts_message, response_status
    """
    draft      = state.get("draft_order", {})
    auth_token = state.get("auth_token")
    language   = state.get("language", "hi")
    transcript = state.get("transcript", "")

    shop_id = draft.get("shopId")
    items   = [
        {"productVariantId": item["productVariantId"], "quantity": item["quantity"]}
        for item in draft.get("items", [])
    ]

    logger.info(
        f"create_order_node: calling MS1 | shopId={shop_id} | items={len(items)}"
    )

    try:
        async with MS1Client(auth_token=auth_token) as client:
            order_data = await client.create_voice_order(
                shop_id=shop_id,
                items=items,
                raw_transcript=transcript,
            )

        logger.info(f"create_order_node: MS1 order created | order={order_data}")

        return {
            "api_response":  order_data,
            "tts_message":   order_confirmed_message(language),
            "response_status": "completed",
        }

    except MS1ClientError as e:
        logger.error(f"create_order_node: MS1 error {e.status_code} — {e.detail}")
        return {
            "api_response":  {"error": e.detail, "status_code": e.status_code},
            "tts_message":   order_failed_message(language),
            "response_status": "failed",
        }

    except Exception as e:
        logger.error(f"create_order_node: unexpected error — {e}")
        return {
            "api_response":  {"error": str(e)},
            "tts_message":   order_failed_message(language),
            "response_status": "failed",
        }
