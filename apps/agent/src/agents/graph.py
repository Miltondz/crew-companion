"""Multi-agent graph builders.

Each specialist is a separately-compiled LangGraph graph registered via
langgraph.json. The BFF registers all three as LangGraphAgent instances;
the Orchestrator's prompt guides delegation via handoff messages.
"""
from __future__ import annotations

import os

from langgraph.graph.state import CompiledStateGraph

from copilotkit import CopilotKitMiddleware

from ..crew_state import CrewStateMiddleware
from ..timing import TimingMiddleware
from ..runtime_factory import build_graph, _VALID_RUNTIMES

from .prompts import ORCHESTRATOR_PROMPT, PLANNER_PROMPT, COACH_PROMPT
from .tools import ORCHESTRATOR_TOOLS, PLANNER_TOOLS, COACH_TOOLS


def _middleware() -> list:
    return [TimingMiddleware(), CrewStateMiddleware(), CopilotKitMiddleware(expose_state=True)]


def _runtime() -> str:
    rt = os.getenv("AGENT_RUNTIME", "gemini-flash-deep")
    return rt if rt in _VALID_RUNTIMES else "gemini-flash-deep"


def build_orchestrator_graph() -> CompiledStateGraph:
    """Primary entry-point agent. Handles general requests and delegates to specialists."""
    return build_graph(
        _runtime(),
        tools=ORCHESTRATOR_TOOLS,
        system_prompt=ORCHESTRATOR_PROMPT,
    )


def build_planner_graph() -> CompiledStateGraph:
    """Planning specialist: tasks, milestones, blockers, deadline triage."""
    return build_graph(
        _runtime(),
        tools=PLANNER_TOOLS,
        system_prompt=PLANNER_PROMPT,
    )


def build_coach_graph() -> CompiledStateGraph:
    """Coaching specialist: guidance, troubleshooting, document Q&A."""
    return build_graph(
        _runtime(),
        tools=COACH_TOOLS,
        system_prompt=COACH_PROMPT,
    )
