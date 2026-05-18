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
    actorRole: Optional[str]
    projectConfig: Optional[dict]
    onboarded: Optional[bool]
    observerConfig: Optional[dict]


def load_crew_seed() -> dict:
    seed_path = os.path.join(os.path.dirname(__file__), "..", "crew.seed.json")
    with open(seed_path, encoding="utf-8") as f:
        seed = json.load(f)
    # Deadline is always dynamic — 45 min from now so every demo starts fresh
    dynamic_deadline = (datetime.now(timezone.utc) + timedelta(minutes=45)).isoformat()
    for ms in seed.get("milestones", []):
        ms["deadline"] = dynamic_deadline
    return seed


_PERSISTABLE_KEYS = (
    "members",
    "currentMemberId",
    "tasks",
    "milestones",
    "blockers",
    "sharedDocuments",
    "openDocumentIds",
    # urgencyPhase is always derived from milestone deadline — never stored (invariant 3)
    "mascotMood",
    "mascotMode",
    "activeMilestoneId",
    "actorRole",
    "highlightedTaskIds",
    "projectConfig",
    "onboarded",
)


def _strip_to_persistable(state: dict[str, Any]) -> dict[str, Any]:
    return {k: state[k] for k in _PERSISTABLE_KEYS if k in state}


def hydrate_workspace_state(workspace_id: str) -> dict:
    """Load workspace state from DB; fall back to seed when row missing or DB down.

    Sync (psycopg) — middleware runs in both sync/async paths. Postgres call
    must not raise: missing DB during dev is normal until 4.1 lands auth.
    """
    if workspace_id == "default" or not workspace_id:
        return load_crew_seed()
    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        return load_crew_seed()
    try:
        import psycopg  # type: ignore[import-not-found]
        with psycopg.connect(dsn, connect_timeout=2) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT state_json FROM workspace_state WHERE workspace_id = %s",
                    (workspace_id,),
                )
                row = cur.fetchone()
                if row:
                    return row[0] if isinstance(row[0], dict) else json.loads(row[0])
                seed = load_crew_seed()
                cur.execute(
                    "INSERT INTO workspace_state (workspace_id, state_json, thread_id) "
                    "VALUES (%s, %s::jsonb, %s) ON CONFLICT DO NOTHING",
                    (workspace_id, json.dumps(seed), f"thread-{workspace_id}"),
                )
            conn.commit()
            return seed
    except Exception as e:  # noqa: BLE001
        print(
            f"[crew_state] WARN hydrate fallback to seed: {type(e).__name__}: {e}",
            flush=True,
        )
        return load_crew_seed()


def save_workspace_state(workspace_id: str, state: dict[str, Any]) -> None:
    """Persist stripped state back to workspace_state.state_json via read-modify-write.

    Sync (psycopg). Uses SELECT FOR UPDATE so concurrent frontend PATCH and
    agent writes converge: agent keys win over whatever the frontend wrote,
    but frontend-only keys not present in the agent's state are preserved.
    """
    if workspace_id == "default" or not workspace_id:
        return
    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        return
    try:
        import psycopg  # type: ignore[import-not-found]
        with psycopg.connect(dsn, connect_timeout=2) as conn:
            with conn.cursor() as cur:
                cur.execute("BEGIN")
                cur.execute(
                    "SELECT state_json FROM workspace_state "
                    "WHERE workspace_id = %s FOR UPDATE",
                    (workspace_id,),
                )
                row = cur.fetchone()
                current: dict[str, Any] = (
                    (row[0] if isinstance(row[0], dict) else json.loads(row[0]))
                    if row
                    else {}
                )
                # Agent keys win; DB keys not touched by agent are preserved
                merged = {**current, **state}
                cur.execute(
                    "UPDATE workspace_state SET state_json = %s::jsonb, updated_at = NOW() "
                    "WHERE workspace_id = %s",
                    (json.dumps(merged), workspace_id),
                )
            conn.commit()
    except Exception as e:  # noqa: BLE001
        print(
            f"[crew_state] WARN save failed: {type(e).__name__}: {e}",
            flush=True,
        )


class CrewStateMiddleware(AgentMiddleware):
    """Re-hydrates crew state from DB on every turn; writes back after agent runs."""

    @property
    def name(self) -> str:
        return "CrewStateMiddleware"

    def _resolve_workspace_id(self, state: CrewCanvasState, runtime: Runtime[Any]) -> str:
        ctx = getattr(runtime, "context", None) or {}
        if isinstance(ctx, dict):
            # CopilotKit identifyUser returns { id, name } — check both keys
            return ctx.get("workspaceId") or ctx.get("id") or "default"
        return "default"

    def before_agent(
        self, state: CrewCanvasState, runtime: Runtime[Any]
    ) -> dict[str, Any] | None:
        workspace_id = self._resolve_workspace_id(state, runtime)
        db_state = hydrate_workspace_state(workspace_id)
        # Agent's in-flight keys win; DB fills in any keys agent doesn't have yet
        return {**db_state, **state}

    async def abefore_agent(
        self, state: CrewCanvasState, runtime: Runtime[Any]
    ) -> dict[str, Any] | None:
        return self.before_agent(state, runtime)

    def after_agent(
        self, state: CrewCanvasState, runtime: Runtime[Any]
    ) -> dict[str, Any] | None:
        workspace_id = self._resolve_workspace_id(state, runtime)
        save_workspace_state(workspace_id, _strip_to_persistable(dict(state)))
        return None

    async def aafter_agent(
        self, state: CrewCanvasState, runtime: Runtime[Any]
    ) -> dict[str, Any] | None:
        return self.after_agent(state, runtime)
