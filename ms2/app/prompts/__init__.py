"""
app/prompts — Prompt builders for the voice order AI agent.

Files:
    agent_prompt.py  — 5-part prompt builder for the single-agent architecture
    clarification.py — Legacy user-facing clarification messages (kept for reference)
    extraction.py    — Legacy extraction prompt (kept for reference)
    summary.py       — Legacy summary/confirmation messages (kept for reference)

Active:
    agent_prompt.py — used by agent_node
"""

from app.prompts.agent_prompt import build_agent_messages

__all__ = ["build_agent_messages"]
