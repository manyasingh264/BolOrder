"""
graph/builder.py — LangGraph StateGraph definition and compilation.

Responsibility:
    Wire all nodes together with edges and conditional routing.
    Return a compiled graph that any route handler can call with ainvoke().

Graph topology:
                        ┌─────────────────────────────────────────────┐
    START               │                                             │
      ↓                 │ (retry: shop clarification → re-extract)   │
    extract_entity_node ─→ shop_lookup_node ──[not found]──→ clarification_node → END
           │                    │                                     ↑
    [needs clarification]   [found]                                   │
           ↓                    ↓                               [unclear]
    clarification_node    product_lookup_node ────────────────────────┘
           │                    │
          END              [all matched]
                                ↓
                          draft_order_node
                                ↓
                          confirmation_node
                           /            \\
                    [confirmed]       [rejected/unknown]
                        ↓                    ↓
                create_order_node           END
                        ↓
                       END

Multi-turn support:
    The graph is re-run from START on EVERY turn.
    Nodes with skip logic (checking state fields) fast-forward through
    already-completed steps. The route handler pre-updates the state
    with the user's reply before re-running.
"""

from langgraph.graph import StateGraph, END

from app.graph.state import VoiceOrderState
from app.nodes.extract_entity_node import extract_entity_node
from app.nodes.shop_lookup_node    import shop_lookup_node
from app.nodes.product_lookup_node import product_lookup_node
from app.nodes.clarification_node  import clarification_node
from app.nodes.draft_order_node    import draft_order_node
from app.nodes.confirmation_node   import confirmation_node
from app.nodes.create_order_node   import create_order_node
from app.utils.logger import get_logger

logger = get_logger(__name__)


# ── Routing Functions ─────────────────────────────────────────────────────────
# These are pure functions — no side effects, no I/O.
# They read the state and return the name of the next node.

def route_after_extract(state: VoiceOrderState) -> str:
    """After extraction: clarify if needed, else look up shop."""
    if state.get("clarification_required") and not state.get("extracted_shop_name"):
        return "clarification_node"
    return "shop_lookup_node"


def route_after_shop(state: VoiceOrderState) -> str:
    """After shop lookup: clarify if not found or needs confirmation, else look up products."""
    if state.get("shop_not_found") or state.get("clarification_required"):
        return "clarification_node"
    return "product_lookup_node"


def route_after_products(state: VoiceOrderState) -> str:
    """After product lookup: clarify if unclear items, else build draft."""
    if state.get("clarification_required"):
        return "clarification_node"
    return "draft_order_node"


def route_after_draft(state: VoiceOrderState) -> str:
    """After draft: run confirmation only if transcript contains yes/no keywords."""
    transcript = state.get("transcript", "").lower()
    
    # Check if transcript contains yes/no keywords
    yes_keywords = {"haan", "ha", "han", "bilkul", "theek", "sahi", "karo", "bhejo", "place", "confirm", "confirmed", "yes", "yep", "yeah", "ok", "okay", "sure", "correct", "right", "absolutely", "proceed"}
    no_keywords = {"nahi", "na", "nah", "mat", "band", "galat", "rok", "cancel", "no", "nope", "stop", "wrong", "incorrect", "don't"}
    
    tokens = set(transcript.split())
    has_yes = any(token in yes_keywords for token in tokens)
    has_no = any(token in no_keywords for token in tokens)
    
    if has_yes or has_no:
        # This is a confirmation reply turn
        return "confirmation_node"
    
    # First turn - skip confirmation, let frontend show summary
    return END


def route_after_confirmation(state: VoiceOrderState) -> str:
    """After yes/no: create order if confirmed, else end."""
    status = state.get("confirmation_status")
    if status == "confirmed":
        return "create_order_node"
    # rejected, unknown, or None (ask again) — all end the current turn
    return END


# ── Graph Builder ─────────────────────────────────────────────────────────────

def build_graph():
    """
    Compile and return the LangGraph voice order graph.

    Called ONCE at startup. The compiled graph is stored on app.state
    and reused across all requests (thread-safe, stateless compiled graph).
    """
    graph = StateGraph(VoiceOrderState)

    # ── Register Nodes ────────────────────────────────────────────
    graph.add_node("extract_entity_node",  extract_entity_node)
    graph.add_node("shop_lookup_node",     shop_lookup_node)
    graph.add_node("product_lookup_node",  product_lookup_node)
    graph.add_node("clarification_node",   clarification_node)
    graph.add_node("draft_order_node",     draft_order_node)
    graph.add_node("confirmation_node",    confirmation_node)
    graph.add_node("create_order_node",    create_order_node)

    # ── Entry Point ───────────────────────────────────────────────
    graph.set_entry_point("extract_entity_node")

    # ── Edges ─────────────────────────────────────────────────────
    # extract_entity_node → conditional
    graph.add_conditional_edges(
        "extract_entity_node",
        route_after_extract,
        {
            "shop_lookup_node":   "shop_lookup_node",
            "clarification_node": "clarification_node",
        },
    )

    # shop_lookup_node → conditional
    graph.add_conditional_edges(
        "shop_lookup_node",
        route_after_shop,
        {
            "product_lookup_node": "product_lookup_node",
            "clarification_node":  "clarification_node",
        },
    )

    # product_lookup_node → conditional
    graph.add_conditional_edges(
        "product_lookup_node",
        route_after_products,
        {
            "draft_order_node":   "draft_order_node",
            "clarification_node": "clarification_node",
        },
    )

    # clarification_node → END (always — wait for next user turn)
    graph.add_edge("clarification_node", END)

    # draft_order_node → conditional (skip confirmation on first turn)
    graph.add_conditional_edges(
        "draft_order_node",
        route_after_draft,
        {
            "confirmation_node": "confirmation_node",
            END:                 END,
        },
    )

    # confirmation_node → conditional
    graph.add_conditional_edges(
        "confirmation_node",
        route_after_confirmation,
        {
            "create_order_node": "create_order_node",
            END:                 END,
        },
    )

    # create_order_node → END (always)
    graph.add_edge("create_order_node", END)

    compiled = graph.compile()
    logger.info("LangGraph voice order graph compiled successfully.")
    return compiled
