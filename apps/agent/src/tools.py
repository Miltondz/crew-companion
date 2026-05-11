"""Backend tools for the Crew Companion agent."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated
from uuid import uuid4

from langgraph.prebuilt import InjectedState
from langgraph.types import Command

from .runtime.capabilities import Capability, RiskLevel
from .runtime.tool_decorator import guarded_tool, assert_all_tools_registered
from .types import TaskPriority, TaskStatus


@guarded_tool(
    capabilities=[Capability.TASKS_WRITE, Capability.STATE_WRITE],
    risk_level=RiskLevel.MEDIUM,
)
def create_task(
    title: str,
    description: str,
    assigned_to: str,
    priority: TaskPriority,
    state: Annotated[dict, InjectedState],
    milestone_id: str = "",
) -> Command:
    """Create a new task and add it to the team's task list."""
    task = {
        "id": str(uuid4()),
        "title": title,
        "description": description,
        "assignedTo": assigned_to,
        "priority": priority,
        "milestoneId": milestone_id or None,
        "status": "todo",
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    return Command(update={"tasks": [*state.get("tasks", []), task]})


@guarded_tool(
    capabilities=[Capability.TASKS_WRITE, Capability.TASKS_READ, Capability.STATE_WRITE],
    risk_level=RiskLevel.MEDIUM,
)
def update_task_status(
    task_id: str,
    new_status: TaskStatus,
    state: Annotated[dict, InjectedState],
) -> Command:
    """Update the status of a task (todo, in-progress, done)."""
    tasks = [
        {**t, "status": new_status} if t["id"] == task_id else t
        for t in state.get("tasks", [])
    ]
    return Command(update={"tasks": tasks})


@guarded_tool(
    capabilities=[Capability.MILESTONES_WRITE, Capability.STATE_WRITE],
    risk_level=RiskLevel.MEDIUM,
)
def create_milestone(
    title: str,
    deadline_iso: str,
    task_ids: list[str],
    state: Annotated[dict, InjectedState],
) -> Command:
    """Create a milestone with an absolute ISO deadline."""
    milestone = {
        "id": str(uuid4()),
        "title": title,
        "deadline": deadline_iso,
        "taskIds": task_ids,
        "phase": "normal",
    }
    milestones = [*state.get("milestones", []), milestone]
    return Command(update={"milestones": milestones, "activeMilestoneId": milestone["id"]})


@guarded_tool(
    capabilities=[Capability.BLOCKERS_RESOLVE, Capability.STATE_WRITE],
    risk_level=RiskLevel.MEDIUM,
)
def resolve_blocker(
    blocker_id: str,
    state: Annotated[dict, InjectedState],
) -> Command:
    """Mark a blocker as resolved."""
    blockers = [
        {**b, "resolved": True, "resolvedAt": datetime.now(timezone.utc).isoformat()}
        if b["id"] == blocker_id
        else b
        for b in state.get("blockers", [])
    ]
    return Command(update={"blockers": blockers})


@guarded_tool(
    capabilities=[Capability.DOCS_READ],
    risk_level=RiskLevel.LOW,
)
def get_documents(state: Annotated[dict, InjectedState]) -> list:
    """Return all shared documents available to the team."""
    return state.get("sharedDocuments", [])


CREW_TOOLS = [create_task, update_task_status, create_milestone, resolve_blocker, get_documents]

# Boot-time assertion: every tool must have a registered capability declaration.
assert_all_tools_registered(CREW_TOOLS)
