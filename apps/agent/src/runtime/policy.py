from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Optional, Union

_REDIS_URL = os.environ.get("REDIS_URL")
_TOOL_RATE_LIMIT = 120  # tool calls per workspace per hour
_redis_client = None


def _get_redis():
    global _redis_client
    if _redis_client is None and _REDIS_URL:
        import redis  # type: ignore[import]
        _redis_client = redis.from_url(_REDIS_URL, decode_responses=True)
    return _redis_client

from .capabilities import Capability, RiskLevel


@dataclass(frozen=True)
class ExecutionContext:
    agent_id: str                        # "orchestrator" | future
    workspace_id: str
    urgency_phase: str                   # "normal" | "focus" | "urgent" | "panic" | "expired"
    role: str                            # "leader" | "member" | "viewer"
    approval_token: Optional[str] = None
    approved_tool_call_id: Optional[str] = None


@dataclass(frozen=True)
class Allow:
    pass


@dataclass(frozen=True)
class Deny:
    reason: str


@dataclass(frozen=True)
class PendingApproval:
    reason: str


PolicyDecision = Union[Allow, Deny, PendingApproval]


def _now_ms() -> int:
    return int(time.time() * 1000)


class PolicyEngine:
    # Stateless in 3.3. In 3.4: accepts a DB session for per-member override lookup.

    ALLOWED_NAMESPACES: frozenset[str] = frozenset({
        "state", "tasks", "blockers", "milestones", "members", "docs", "ui",
    })

    def evaluate(self, tool: "ToolMeta", context: ExecutionContext) -> PolicyDecision:  # type: ignore[name-defined]
        # Rule 1: namespace whitelist — blocks db.*, fs.*, shell.* without enum members
        bad = [c for c in tool.capabilities if c.value.split(".", 1)[0] not in self.ALLOWED_NAMESPACES]
        if bad:
            return Deny(f"namespace_blocked:{bad[0].value}")

        # Rule 2: role must grant every required capability
        if not self._role_has_all(context.role, tool.capabilities):
            return Deny("missing_capability")

        # Rule 3 / 4: phase-based restriction
        phase_block = self._phase_block_reason(tool, context.urgency_phase)
        if phase_block:
            return Deny(phase_block)

        # Rule 5: rate limit (stub — always False; real in 4.7)
        if self._rate_limit_exceeded(context.workspace_id, tool.tool_id):
            return Deny("rate_limit_exceeded")

        # Rule 6: approval gate — last so cheap rules deny first
        if tool.requires_approval:
            token_ok = self._approval_token_valid(
                context.approval_token,
                expected_workspace=context.workspace_id,
                expected_tool=tool.tool_id,
            )
            if not token_ok:
                return PendingApproval("user_approval_required")

        return Allow()

    def _role_has_all(self, role: str, required: tuple[Capability, ...]) -> bool:
        from .role_grants import role_grants_for
        granted = role_grants_for(role)
        return all(c in granted for c in required)

    def _phase_block_reason(self, tool: "ToolMeta", phase: str) -> Optional[str]:  # type: ignore[name-defined]
        if phase == "panic" and tool.risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL):
            return "blocked_in_phase:panic"
        if phase == "expired" and tool.risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL):
            return "blocked_in_phase:expired"
        return None

    def _rate_limit_exceeded(self, workspace_id: str, tool_id: str) -> bool:
        r = _get_redis()
        if r is None:
            return False
        try:
            hour_bucket = int(time.time()) // 3600
            key = f"crew:rl:{workspace_id}:{hour_bucket}"
            count = r.incr(key)
            if count == 1:
                r.expire(key, 3600)
            return int(count) > _TOOL_RATE_LIMIT
        except Exception:
            return False

    def _approval_token_valid(
        self,
        token: Optional[str],
        *,
        expected_workspace: str,
        expected_tool: str,
    ) -> bool:
        if not token:
            return False
        from .approval_store import consume_token
        record = consume_token(token)
        if not record:
            return False
        if record["workspace_id"] != expected_workspace:
            return False
        if record["tool_id"] != expected_tool:
            return False
        if record["expires_at"] < _now_ms():
            return False
        return True
