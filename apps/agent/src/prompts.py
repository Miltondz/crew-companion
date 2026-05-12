"""Backward-compat re-export. Orchestrator prompt lives in agents/prompts.py."""
from .agents.prompts import ORCHESTRATOR_PROMPT as SYSTEM_PROMPT  # noqa: F401


def build_system_prompt(state: dict | None = None) -> str:  # noqa: ARG001
    return SYSTEM_PROMPT
