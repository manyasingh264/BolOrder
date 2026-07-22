"""
graph/builder.py — Single-agent LangGraph.

Architecture: START → agent_node → END

The agent_node handles the entire conversation turn:
  - Context loading
  - Prompt building
  - LLM call with tool selection
  - Tool execution (including MS1 API calls)
  - Session memory update

No router node, no multi-node routing. The LLM decides everything via tools.
"""

from langgraph.graph import StateGraph, END

from app.graph.state import VoiceOrderState
from app.nodes.agent_node import agent_node
from app.utils.logger import get_logger

logger = get_logger(__name__)


def build_graph():
    graph = StateGraph(VoiceOrderState)

    # Single node — agent handles everything
    graph.add_node("agent_node", agent_node)

    graph.set_entry_point("agent_node")
    graph.add_edge("agent_node", END)

    compiled = graph.compile()
    logger.info("LangGraph compiled | single-agent one-turn execution mode")
    return compiled