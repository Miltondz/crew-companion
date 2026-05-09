"""Backend tools for the Crew Companion agent."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated
from uuid import uuid4

from langchain_core.tools import tool
from langgraph.prebuilt import InjectedState
from langgraph.types import Command

from .types import TaskPriority, TaskStatus


@tool
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


@tool
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


@tool
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


@tool
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


@tool
def get_documents(state: Annotated[dict, InjectedState]) -> list:
    """Return all shared documents available to the team."""
    return state.get("sharedDocuments", [])


CREW_TOOLS = [create_task, update_task_status, create_milestone, resolve_blocker, get_documents]
