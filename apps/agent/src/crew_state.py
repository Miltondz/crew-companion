"""CrewCanvasState and seed hydration middleware."""

from __future__ import annotations

import json
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from langchain.agents.middleware import AgentMiddleware
from langgraph.graph.message import add_messages
from langgraph.runtime import Runtime
from typing_extensions import Annotated, TypedDict

from .types import (
    Blocker,
    MascotMood,
    MascotMode,
    Milestone,
    SharedDocument,
    Task,
    TeamMember,
    UrgencyPhase,
)


class CrewCanvasState(TypedDict):
    messages: Annotated[list, add_messages]
    members: list[TeamMember]
    currentMemberId: str
    tasks: list[Task]
    milestones: list[Milestone]
    blockers: list[Blocker]
    sharedDocuments: list[SharedDocument]
    openDocumentIds: list[str]
    urgencyPhase: UrgencyPhase
    mascotMood: MascotMood
    mascotMode: MascotMode
    highlightedTaskIds: list[str]
    activeMilestoneId: Optional[str]


def load_crew_seed() -> dict:
    seed_path = os.path.join(os.path.dirname(__file__), "..", "crew.seed.json")
    with open(seed_path, encoding="utf-8") as f:
        seed = json.load(f)
    # Deadline is always dynamic — 45 min from now so every demo starts fresh
    dynamic_deadline = (datetime.now(timezone.utc) + timedelta(minutes=45)).isoformat()
    for ms in seed.get("milestones", []):
        ms["deadline"] = dynamic_deadline
    return seed


class CrewStateMiddleware(AgentMiddleware):
    """Hydrates crew state from seed on new threads."""

    @property
    def name(self) -> str:
        return "CrewStateMiddleware"

    def before_agent(
        self, state: CrewCanvasState, runtime: Runtime[Any]
    ) -> dict[str, Any] | None:
        if state.get("members"):
            return None  # already hydrated
        seed = load_crew_seed()
        return {**state, **seed}

    async def abefore_agent(
        self, state: CrewCanvasState, runtime: Runtime[Any]
    ) -> dict[str, Any] | None:
        return self.before_agent(state, runtime)
