"""Python TypedDicts matching the TypeScript crew domain model."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from typing_extensions import TypedDict, Literal

Role = Literal["leader", "member"]
TechnicalLevel = Literal["low-tech", "high-tech"]
Specialization = Literal["developer", "designer", "qa", "manager", "writer", "other"]
UrgencyPhase = Literal["normal", "focus", "urgent", "panic", "expired"]
TaskStatus = Literal["todo", "in-progress", "review", "blocked", "done"]
TaskPriority = Literal["low", "medium", "high"]
MascotMood = Literal["calm", "focus", "worried", "panic", "celebrate"]
MascotMode = Literal["idle", "hint", "alert", "action"]


class TeamMember(TypedDict):
    id: str
    name: str
    role: Role
    technicalLevel: TechnicalLevel
    specialization: Optional[Specialization]
    activeBlockerId: Optional[str]
    idempotency_key: Optional[str]


class Task(TypedDict):
    id: str
    title: str
    description: str
    assignedTo: str
    milestoneId: Optional[str]
    status: TaskStatus
    priority: TaskPriority
    createdAt: str
    idempotency_key: Optional[str]


class Milestone(TypedDict):
    id: str
    title: str
    deadline: str  # ISO absolute — never relative
    taskIds: list[str]
    idempotency_key: Optional[str]


class Blocker(TypedDict):
    id: str
    memberId: str
    description: str
    reportedAt: str
    resolved: bool
    resolvedAt: Optional[str]
    idempotency_key: Optional[str]


class SharedDocument(TypedDict):
    id: str
    title: str
    content: str  # sanitized markdown
    sharedBy: str  # TeamMember.id (leader only)
    sharedAt: str
    idempotency_key: Optional[str]


def get_urgency_phase(deadline: str) -> str:
    """Derive urgency phase from ISO deadline string. Mirrors TS getUrgencyPhase."""
    if not deadline:
        return "normal"
    try:
        dl = datetime.fromisoformat(deadline.replace("Z", "+00:00"))
    except ValueError:
        return "normal"
    now = datetime.now(timezone.utc)
    if dl.tzinfo is None:
        dl = dl.replace(tzinfo=timezone.utc)
    diff_minutes = (dl - now).total_seconds() / 60
    if diff_minutes <= 0:
        return "expired"
    if diff_minutes <= 30:
        return "panic"
    if diff_minutes <= 120:
        return "urgent"
    if diff_minutes <= 480:
        return "focus"
    return "normal"
