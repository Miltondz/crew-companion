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
    idempotency_key: Optional[str] = None,
) -> Command | dict:
    """Create a new task and add it to the team's task list. Pass idempotency_key to prevent duplicate creation on retry."""
    tasks = state.get("tasks", [])
    if idempotency_key:
        existing = next((t for t in tasks if t.get("idempotency_key") == idempotency_key), None)
        if existing:
            return {"already_exists": True, "id": existing.get("id"), "entity_type": "task"}
    task = {
        "id": str(uuid4()),
        "title": title,
        "description": description,
        "assignedTo": assigned_to,
        "priority": priority,
        "milestoneId": milestone_id or None,
        "status": "todo",
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "idempotency_key": idempotency_key,
    }
    return Command(update={"tasks": [*tasks, task]})


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
    idempotency_key: Optional[str] = None,
) -> Command | dict:
    """Create a milestone with an absolute ISO deadline. Pass idempotency_key to prevent duplicate creation on retry."""
    milestones = state.get("milestones", [])
    if idempotency_key:
        existing = next((m for m in milestones if m.get("idempotency_key") == idempotency_key), None)
        if existing:
            return {"already_exists": True, "id": existing.get("id"), "entity_type": "milestone"}
    milestone = {
        "id": str(uuid4()),
        "title": title,
        "deadline": deadline_iso,
        "taskIds": task_ids,
        "idempotency_key": idempotency_key,
    }
    milestones = [*milestones, milestone]
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
    capabilities=[Capability.TASKS_READ],
    risk_level=RiskLevel.LOW,
)
def get_tasks(
    milestone_id: Optional[str] = None,
    status: Optional[str] = None,
    *,
    state: Annotated[dict, InjectedState],
) -> dict:
    """Return the current task list. Optionally filter by milestone_id or status (todo/in-progress/done/blocked/review)."""
    tasks: list = state.get("tasks", [])
    if milestone_id:
        tasks = [t for t in tasks if t.get("milestoneId") == milestone_id]
    if status:
        tasks = [t for t in tasks if t.get("status") == status]
    return {"tasks": tasks, "count": len(tasks)}


@guarded_tool(
    capabilities=[Capability.MILESTONES_READ],
    risk_level=RiskLevel.LOW,
)
def get_milestones(state: Annotated[dict, InjectedState]) -> dict:
    """Returns all milestones with deadlines; derive on_track/at_risk/expired urgency phase from deadline as needed."""
    milestones: list = state.get("milestones", [])
    return {"milestones": milestones, "count": len(milestones), "activeMilestoneId": state.get("activeMilestoneId")}


@guarded_tool(
    capabilities=[Capability.BLOCKERS_READ],
    risk_level=RiskLevel.LOW,
)
def get_blockers(
    resolved: Optional[bool] = None,
    member_id: Optional[str] = None,
    *,
    state: Annotated[dict, InjectedState],
) -> dict:
    """Return the current blocker list. Optionally filter by resolved status or member_id."""
    blockers: list = state.get("blockers", [])
    if resolved is not None:
        blockers = [b for b in blockers if b.get("resolved") == resolved]
    if member_id:
        blockers = [b for b in blockers if b.get("memberId") == member_id]
    return {"blockers": blockers, "count": len(blockers)}


@guarded_tool(
    capabilities=[Capability.MEMBERS_READ],
    risk_level=RiskLevel.LOW,
)
def get_members(
    role: Optional[str] = None,
    *,
    state: Annotated[dict, InjectedState],
) -> dict:
    """Return the current member roster. Optionally filter by role."""
    members: list = state.get("members", [])
    if role:
        members = [m for m in members if m.get("role") == role]
    return {"members": members, "count": len(members)}


@guarded_tool(
    capabilities=[Capability.BLOCKERS_WRITE, Capability.STATE_WRITE],
    risk_level=RiskLevel.MEDIUM,
)
def create_blocker(
    member_id: str,
    description: str,
    state: Annotated[dict, InjectedState],
    idempotency_key: Optional[str] = None,
) -> Command | dict:
    """Report a new blocker for a team member. Pass idempotency_key to prevent duplicate creation on retry."""
    blockers = state.get("blockers", [])
    if idempotency_key:
        existing = next((b for b in blockers if b.get("idempotency_key") == idempotency_key), None)
        if existing:
            return {"already_exists": True, "id": existing.get("id"), "entity_type": "blocker"}
    blocker = {
        "id": str(uuid4()),
        "memberId": member_id,
        "description": description,
        "reportedAt": datetime.now(timezone.utc).isoformat(),
        "resolved": False,
        "resolvedAt": None,
        "idempotency_key": idempotency_key,
    }
    return Command(update={"blockers": [*blockers, blocker]})


@guarded_tool(
    capabilities=[Capability.MEMBERS_INVITE, Capability.STATE_WRITE],
    risk_level=RiskLevel.MEDIUM,
)
def add_member(
    name: str,
    role: str,
    state: Annotated[dict, InjectedState],
    technical_level: str = "low-tech",
    idempotency_key: Optional[str] = None,
) -> Command | dict:
    """Add a new team member to the workspace. Pass idempotency_key to prevent duplicate creation on retry."""
    members = state.get("members", [])
    if idempotency_key:
        existing = next((m for m in members if m.get("idempotency_key") == idempotency_key), None)
        if existing:
            return {"already_exists": True, "id": existing.get("id"), "entity_type": "member"}
    member = {
        "id": str(uuid4()),
        "name": name,
        "role": role,
        "technicalLevel": technical_level,
        "activeBlockerId": None,
        "idempotency_key": idempotency_key,
    }
    return Command(update={"members": [*members, member]})


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


@guarded_tool(
    capabilities=[Capability.MILESTONES_WRITE, Capability.STATE_WRITE],
    risk_level=RiskLevel.HIGH,
    requires_approval=True,
)
def delete_milestone(
    milestone_id: str,
    state: Annotated[dict, InjectedState],
) -> Command:
    """Permanently remove a milestone. Clears activeMilestoneId if it matches."""
    milestones = [m for m in state.get("milestones", []) if m["id"] != milestone_id]
    active = state.get("activeMilestoneId")
    new_active = active if active != milestone_id else (milestones[0]["id"] if milestones else None)
    return Command(update={"milestones": milestones, "activeMilestoneId": new_active})


@guarded_tool(
    capabilities=[Capability.BLOCKERS_WRITE, Capability.STATE_WRITE],
    risk_level=RiskLevel.MEDIUM,
)
def update_blocker(
    blocker_id: str,
    description: str,
    state: Annotated[dict, InjectedState],
) -> Command:
    """Update a blocker's description."""
    blockers = [
        {**b, "description": description} if b["id"] == blocker_id else b
        for b in state.get("blockers", [])
    ]
    return Command(update={"blockers": blockers})


@guarded_tool(
    capabilities=[Capability.BLOCKERS_RESOLVE, Capability.STATE_WRITE],
    risk_level=RiskLevel.HIGH,
    requires_approval=True,
)
def delete_blocker(
    blocker_id: str,
    state: Annotated[dict, InjectedState],
) -> Command:
    """Permanently remove a blocker. Clears activeBlockerId on any member that references it."""
    blockers = [b for b in state.get("blockers", []) if b["id"] != blocker_id]
    members = [
        {**m, "activeBlockerId": None} if m.get("activeBlockerId") == blocker_id else m
        for m in state.get("members", [])
    ]
    return Command(update={"blockers": blockers, "members": members})


@guarded_tool(
    capabilities=[Capability.MEMBERS_INVITE, Capability.STATE_WRITE],
    risk_level=RiskLevel.MEDIUM,
)
def update_member(
    member_id: str,
    state: Annotated[dict, InjectedState],
    name: Optional[str] = None,
    role: Optional[str] = None,
    technical_level: Optional[str] = None,
) -> Command:
    """Update a member's name, role, or technical level. Pass only fields to change."""
    def patch(m: dict) -> dict:
        if m["id"] != member_id:
            return m
        updates: dict = {}
        if name is not None:
            updates["name"] = name
        if role is not None:
            updates["role"] = role
        if technical_level is not None:
            updates["technicalLevel"] = technical_level
        return {**m, **updates}
    return Command(update={"members": [patch(m) for m in state.get("members", [])]})


@guarded_tool(
    capabilities=[Capability.MEMBERS_INVITE, Capability.STATE_WRITE],
    risk_level=RiskLevel.HIGH,
    requires_approval=True,
)
def delete_member(
    member_id: str,
    state: Annotated[dict, InjectedState],
) -> Command:
    """Permanently remove a member and all their blockers from the workspace."""
    members = [m for m in state.get("members", []) if m["id"] != member_id]
    blockers = [b for b in state.get("blockers", []) if b.get("memberId") != member_id]
    return Command(update={"members": members, "blockers": blockers})


@guarded_tool(
    capabilities=[Capability.DOCS_WRITE, Capability.STATE_WRITE],
    risk_level=RiskLevel.MEDIUM,
)
def create_document(
    title: str,
    content: str,
    owner_id: str,
    state: Annotated[dict, InjectedState],
    idempotency_key: Optional[str] = None,
) -> Command | dict:
    """Create a new shared document and add it to the team's document list. Pass idempotency_key to prevent duplicate creation on retry."""
    docs = state.get("sharedDocuments", [])
    if idempotency_key:
        existing = next((d for d in docs if d.get("idempotency_key") == idempotency_key), None)
        if existing:
            return {"already_exists": True, "id": existing.get("id"), "entity_type": "document"}
    doc = {
        "id": str(uuid4()),
        "title": title,
        "content": content,
        "sharedBy": owner_id,
        "sharedAt": datetime.now(timezone.utc).isoformat(),
        "idempotency_key": idempotency_key,
    }
    return Command(update={"sharedDocuments": [*docs, doc]})


@guarded_tool(
    capabilities=[Capability.DOCS_WRITE, Capability.STATE_WRITE],
    risk_level=RiskLevel.MEDIUM,
)
def update_document(
    document_id: str,
    state: Annotated[dict, InjectedState],
    title: Optional[str] = None,
    content: Optional[str] = None,
) -> Command:
    """Update a document's title or content. Pass only fields to change."""
    def patch(d: dict) -> dict:
        if d["id"] != document_id:
            return d
        updates: dict = {}
        if title is not None:
            updates["title"] = title
        if content is not None:
            updates["content"] = content
        return {**d, **updates}
    return Command(update={"sharedDocuments": [patch(d) for d in state.get("sharedDocuments", [])]})


@guarded_tool(
    capabilities=[Capability.DOCS_WRITE, Capability.STATE_WRITE],
    risk_level=RiskLevel.HIGH,
    requires_approval=True,
)
def delete_document(
    document_id: str,
    state: Annotated[dict, InjectedState],
) -> Command:
    """Permanently remove a document and clear it from openDocumentIds."""
    docs = [d for d in state.get("sharedDocuments", []) if d["id"] != document_id]
    open_ids = [i for i in state.get("openDocumentIds", []) if i != document_id]
    return Command(update={"sharedDocuments": docs, "openDocumentIds": open_ids})


CREW_TOOLS = [
    create_task, update_task, update_task_status, delete_task,
    create_milestone, update_milestone, delete_milestone,
    resolve_blocker, get_documents,
    get_tasks, get_milestones, get_blockers, get_members,
    create_blocker, update_blocker, delete_blocker,
    add_member, update_member, delete_member,
    reset_workspace,
    create_document, update_document, delete_document,
]

# Boot-time assertion: every tool must have a registered capability declaration.
assert_all_tools_registered(CREW_TOOLS)
