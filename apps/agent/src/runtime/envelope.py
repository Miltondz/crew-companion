"""Pydantic envelope models mirroring TS SurfaceEnvelope in types.ts.

Field names are camelCase to match the TypeScript source of truth exactly.
Schema drift between TS and Python kills the project — keep in sync.
"""

from __future__ import annotations

import time
from typing import Literal, Optional
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field

# Mirror of TS SurfaceIntent
SurfaceIntent = Literal["render_surface", "request_approval", "tool_denied"]

# Mirror of TS EnvelopePriority
EnvelopePriority = Literal["low", "medium", "high", "critical"]


class RuntimeContext(BaseModel):
    """Mirror of TS RuntimeContext in types.ts."""

    model_config = ConfigDict(populate_by_name=True)

    role: str  # 'leader' | 'member'
    techLevel: Optional[str] = Field(default=None)  # 'low-tech' | 'high-tech'
    phase: str  # UrgencyPhase
    hasActiveBlocker: bool
    workspaceId: str


class SurfaceEnvelope(BaseModel):
    """Mirror of TS SurfaceEnvelope<TPayload> in types.ts.

    All field names are camelCase — identical to the TypeScript interface.
    """

    model_config = ConfigDict(populate_by_name=True)

    # Identity
    envelopeId: str
    agentId: str
    emittedAt: int  # epoch ms

    # Intent
    intent: SurfaceIntent
    priority: EnvelopePriority

    # Surface body
    surfaceId: str
    payload: dict  # validated by manifest.envelopeSchema on the frontend

    # Context snapshot
    context: RuntimeContext

    # Capability claims
    requiredCapabilities: list[str]

    # Lifecycle hints
    hibernatable: bool
    pinnable: bool
    ephemeral: Optional[int] = Field(default=None)  # ms before auto-dismiss


def make_envelope(
    *,
    surfaceId: str,
    payload: dict,
    context: RuntimeContext,
    agentId: str = "orchestrator",
    intent: SurfaceIntent = "render_surface",
    priority: EnvelopePriority = "medium",
    requiredCapabilities: Optional[list[str]] = None,
    hibernatable: bool = True,
    pinnable: bool = True,
    ephemeral: Optional[int] = None,
) -> SurfaceEnvelope:
    """Build a SurfaceEnvelope with generated envelopeId and current timestamp."""
    return SurfaceEnvelope(
        envelopeId=str(uuid4()),
        agentId=agentId,
        emittedAt=time.time_ns() // 1_000_000,
        intent=intent,
        priority=priority,
        surfaceId=surfaceId,
        payload=payload,
        context=context,
        requiredCapabilities=requiredCapabilities if requiredCapabilities is not None else [],
        hibernatable=hibernatable,
        pinnable=pinnable,
        ephemeral=ephemeral,
    )


def make_approval_request_envelope(
    *,
    tool: str,
    capabilities: list[str],
    risk_level: str,
    impact_description: str,
    approval_token: str,
    context: RuntimeContext,
    agentId: str = "orchestrator",
    expires_in_ms: int = 300_000,
) -> SurfaceEnvelope:
    envelope_id = str(uuid4())
    expires_at = time.time_ns() // 1_000_000 + expires_in_ms
    return SurfaceEnvelope(
        envelopeId=envelope_id,
        agentId=agentId,
        emittedAt=time.time_ns() // 1_000_000,
        intent="request_approval",
        priority="high",
        surfaceId="__approval_gate__",
        payload={
            "envelopeId": envelope_id,
            "tool": tool,
            "capabilities": capabilities,
            "risk_level": risk_level,
            "impact_description": impact_description,
            "approve_url": f"/api/approvals/{envelope_id}/approve",
            "reject_url": f"/api/approvals/{envelope_id}/reject",
            "approval_token": approval_token,
            "expires_at": expires_at,
        },
        context=context,
        requiredCapabilities=[],
        hibernatable=False,
        pinnable=False,
        ephemeral=expires_in_ms,
    )


def make_denial_envelope(
    *,
    tool: str,
    capabilities: list[str],
    reason: str,
    phase: str,
    context: RuntimeContext,
    agentId: str = "orchestrator",
) -> SurfaceEnvelope:
    return SurfaceEnvelope(
        envelopeId=str(uuid4()),
        agentId=agentId,
        emittedAt=time.time_ns() // 1_000_000,
        intent="tool_denied",
        priority="medium",
        surfaceId="__tool_denied__",
        payload={
            "tool": tool,
            "capabilities": capabilities,
            "reason": reason,
            "phase": phase,
        },
        context=context,
        requiredCapabilities=[],
        hibernatable=False,
        pinnable=False,
    )
