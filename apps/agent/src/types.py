"""Python TypedDicts matching the TypeScript crew domain model."""

from typing import Optional
from typing_extensions import TypedDict, Literal

Role = Literal["leader", "member"]
TechnicalLevel = Literal["low-tech", "high-tech"]
UrgencyPhase = Literal["normal", "focus", "urgent", "panic", "expired"]
TaskStatus = Literal["todo", "in-progress", "done"]
TaskPriority = Literal["low", "medium", "high"]
MascotMood = Literal["calm", "focus", "worried", "panic", "celebrate"]
MascotMode = Literal["idle", "hint", "alert", "action"]


class TeamMember(TypedDict):
    id: str
    name: str
    role: Role
    technicalLevel: TechnicalLevel
    activeBlockerId: Optional[str]


class Task(TypedDict):
    id: str
    title: str
    description: str
    assignedTo: str
    milestoneId: Optional[str]
    status: TaskStatus
    priority: TaskPriority
    createdAt: str


class Milestone(TypedDict):
    id: str
    title: str
    deadline: str  # ISO absolute — never relative
    taskIds: list[str]
    phase: UrgencyPhase


class Blocker(TypedDict):
    id: str
    memberId: str
    description: str
    reportedAt: str
    resolved: bool
    resolvedAt: Optional[str]


class SharedDocument(TypedDict):
    id: str
    title: str
    content: str  # sanitized markdown
    sharedBy: str  # TeamMember.id (leader only)
    sharedAt: str
