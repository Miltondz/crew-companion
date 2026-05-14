"""Backend tools for the Crew Companion agent."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Optional
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


@guarded_tool(
    capabilities=[Capability.BLOCKERS_WRITE, Capability.STATE_WRITE],
    risk_level=RiskLevel.MEDIUM,
)
def create_blocker(
    member_id: str,
    description: str,
    state: Annotated[dict, InjectedState],
) -> Command:
    """Report a new blocker for a team member."""
    blocker = {
        "id": str(uuid4()),
        "memberId": member_id,
        "description": description,
        "reportedAt": datetime.now(timezone.utc).isoformat(),
        "resolved": False,
        "resolvedAt": None,
    }
    return Command(update={"blockers": [*state.get("blockers", []), blocker]})


@guarded_tool(
    capabilities=[Capability.MEMBERS_INVITE, Capability.STATE_WRITE],
    risk_level=RiskLevel.MEDIUM,
)
def add_member(
    name: str,
    role: str,
    state: Annotated[dict, InjectedState],
    technical_level: str = "low-tech",
) -> Command:
    """Add a new team member to the workspace."""
    member = {
        "id": str(uuid4()),
        "name": name,
        "role": role,
        "technicalLevel": technical_level,
        "activeBlockerId": None,
    }
    return Command(update={"members": [*state.get("members", []), member]})


@guarded_tool(
    capabilities=[Capability.TASKS_WRITE, Capability.TASKS_READ, Capability.STATE_WRITE],
    risk_level=RiskLevel.MEDIUM,
)
def update_task(
    task_id: str,
    state: Annotated[dict, InjectedState],
    title: Optional[str] = None,
    description: Optional[str] = None,
    assigned_to: Optional[str] = None,
    priority: Optional[str] = None,
) -> Command:
    """Update a task's title, description, assignee, or priority. Pass only fields to change."""
    def patch(t: dict) -> dict:
        if t["id"] != task_id:
            return t
        updates: dict = {}
        if title is not None:
            updates["title"] = title
        if description is not None:
            updates["description"] = description
        if assigned_to is not None:
            updates["assignedTo"] = assigned_to
        if priority is not None:
            updates["priority"] = priority
        return {**t, **updates}
    return Command(update={"tasks": [patch(t) for t in state.get("tasks", [])]})


@guarded_tool(
    capabilities=[Capability.MILESTONES_WRITE, Capability.STATE_WRITE],
    risk_level=RiskLevel.MEDIUM,
)
def update_milestone(
    milestone_id: str,
    state: Annotated[dict, InjectedState],
    title: Optional[str] = None,
    deadline_iso: Optional[str] = None,
) -> Command:
    """Update a milestone's title or deadline ISO string. Pass only fields to change."""
    def patch(m: dict) -> dict:
        if m["id"] != milestone_id:
            return m
        updates: dict = {}
        if title is not None:
            updates["title"] = title
        if deadline_iso is not None:
            updates["deadline"] = deadline_iso
        return {**m, **updates}
    return Command(update={"milestones": [patch(m) for m in state.get("milestones", [])]})


@guarded_tool(
    capabilities=[Capability.TASKS_DELETE, Capability.STATE_WRITE],
    risk_level=RiskLevel.HIGH,
    requires_approval=True,
)
def delete_task(
    task_id: str,
    state: Annotated[dict, InjectedState],
) -> Command:
    """Permanently remove a task. Also removes its ID from any milestone's taskIds."""
    tasks = [t for t in state.get("tasks", []) if t["id"] != task_id]
    milestones = [
        {**m, "taskIds": [tid for tid in m.get("taskIds", []) if tid != task_id]}
        for m in state.get("milestones", [])
    ]
    return Command(update={"tasks": tasks, "milestones": milestones})


@guarded_tool(
    capabilities=[Capability.TASKS_DELETE, Capability.STATE_WRITE],
    risk_level=RiskLevel.HIGH,
    requires_approval=True,
)
def reset_workspace(
    confirm: bool,
    state: Annotated[dict, InjectedState],
) -> Command:
    """Clear ALL workspace data (tasks, members, milestones, blockers, documents). Requires confirm=True."""
    if not confirm:
        return Command(update={})
    return Command(update={
        "tasks": [],
        "members": [],
        "milestones": [],
        "blockers": [],
        "sharedDocuments": [],
        "openDocumentIds": [],
        "highlightedTaskIds": [],
        "activeMilestoneId": None,
    })


CREW_TOOLS = [create_task, update_task, update_task_status, delete_task, create_milestone, update_milestone, resolve_blocker, get_documents, create_blocker, add_member, reset_workspace]

# Boot-time assertion: every tool must have a registered capability declaration.
assert_all_tools_registered(CREW_TOOLS)
