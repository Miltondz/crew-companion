# MUST stay in sync with apps/frontend/src/runtime/capability/capabilities.ts
from __future__ import annotations

from enum import Enum


class Capability(str, Enum):
    # Read
    STATE_READ       = "state.read"
    TASKS_READ       = "tasks.read"
    BLOCKERS_READ    = "blockers.read"
    MILESTONES_READ  = "milestones.read"
    MEMBERS_READ     = "members.read"
    DOCS_READ        = "docs.read"

    # Write
    STATE_WRITE      = "state.write"
    TASKS_WRITE      = "tasks.write"
    BLOCKERS_WRITE   = "blockers.write"
    MILESTONES_WRITE = "milestones.write"
    MEMBERS_INVITE   = "members.invite"
    DOCS_WRITE       = "docs.write"

    # Delete / Resolve
    TASKS_DELETE     = "tasks.delete"
    BLOCKERS_RESOLVE = "blockers.resolve"

    # UI
    UI_RENDER_SURFACE = "ui.render_surface"
    UI_SET_MASCOT     = "ui.set_mascot"
    UI_HIGHLIGHT      = "ui.highlight"


class RiskLevel(str, Enum):
    LOW      = "low"
    MEDIUM   = "medium"
    HIGH     = "high"
    CRITICAL = "critical"
