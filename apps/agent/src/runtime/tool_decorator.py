from __future__ import annotations

import inspect
from dataclasses import dataclass
from functools import wraps
from typing import Callable, List, Optional

from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool as lc_tool

from .capabilities import Capability, RiskLevel
from .policy import PolicyEngine, ExecutionContext, Allow, Deny, PendingApproval
from .audit import AuditLogger

_TOOL_REGISTRY: dict[str, "ToolMeta"] = {}


@dataclass(frozen=True)
class ToolMeta:
    """Immutable — risk level is a code decision, not a runtime knob."""
    tool_id: str
    capabilities: tuple[Capability, ...]
    risk_level: RiskLevel
    requires_approval: bool
    audit: bool
    sandbox: Optional[str]


def guarded_tool(
    *,
    capabilities: List[Capability],
    risk_level: RiskLevel,
    requires_approval: bool = False,
    audit: bool = True,
    sandbox: Optional[str] = None,
):
    """Wrap fn with policy check + audit before every call.

    Preserves the original function's signature so LangChain's @tool can
    introspect parameter names + InjectedState annotations for the LLM schema.
    """
    def decorator(fn: Callable) -> Callable:
        sig = inspect.signature(fn)

        meta = ToolMeta(
            tool_id=fn.__name__,
            capabilities=tuple(capabilities),
            risk_level=risk_level,
            requires_approval=requires_approval,
            audit=audit,
            sandbox=sandbox,
        )
        _TOOL_REGISTRY[fn.__name__] = meta

        @wraps(fn)
        def wrapper(*args, **kwargs):
            state = kwargs.get("state") or {}
            config: RunnableConfig = kwargs.get("config") or {}
            configurable = (config.get("configurable") if isinstance(config, dict) else {}) or {}

            context = ExecutionContext(
                agent_id=configurable.get("agent_id", "orchestrator"),
                workspace_id=configurable.get("workspace_id") or state.get("workspaceId", ""),
                urgency_phase=state.get("urgencyPhase", "normal"),
                role=configurable.get("actor_role") or state.get("actorRole", "member"),
                approval_token=configurable.get("approval_token"),
                approved_tool_call_id=configurable.get("approved_tool_call_id"),
            )

            decision = PolicyEngine().evaluate(meta, context)

            if isinstance(decision, Deny):
                if audit:
                    AuditLogger.log(meta, context, decision="denied", reason=decision.reason)
                return (
                    f"[denied] {meta.tool_id}: {decision.reason}. "
                    f"Inform the user that this action is not permitted in the current context."
                )

            if isinstance(decision, PendingApproval):
                if audit:
                    AuditLogger.log(meta, context, decision="pending", reason=decision.reason)
                from langgraph.types import interrupt
                approval_payload = interrupt({
                    "kind": "request_approval",
                    "tool": meta.tool_id,
                    "capabilities": [c.value for c in capabilities],
                    "risk_level": risk_level.value,
                    "reason": decision.reason,
                    "args_preview": _safe_args_preview(args, kwargs, sig),
                })
                if not approval_payload or approval_payload.get("decision") != "approved":
                    if audit:
                        AuditLogger.log(meta, context, decision="rejected", reason="user_rejected")
                    return f"[rejected] {meta.tool_id}: user did not approve."

                # Re-inject token and recurse once — second pass will Allow
                kwargs["config"] = _merge_config(config, {
                    "approval_token": approval_payload["approval_token"],
                    "approved_tool_call_id": approval_payload.get("tool_call_id"),
                })
                return wrapper(*args, **kwargs)

            # Allow path
            try:
                result = fn(*args, **kwargs)
            except Exception as e:
                if audit:
                    AuditLogger.log(meta, context, decision="allowed",
                                    outcome="error", outcome_error=str(e))
                raise

            if audit:
                AuditLogger.log(meta, context, decision="allowed", outcome="success")
            return result

        # Preserve original signature so @lc_tool builds the correct LLM schema
        wrapper.__signature__ = sig  # type: ignore[attr-defined]

        return lc_tool(wrapper)

    return decorator


def assert_all_tools_registered(tool_list) -> None:
    """Boot-time assertion — raises RuntimeError if any tool lacks a declaration."""
    for t in tool_list:
        if t.name not in _TOOL_REGISTRY:
            raise RuntimeError(
                f"Tool '{t.name}' has no capability declaration. Register via @guarded_tool."
            )


def _safe_args_preview(args, kwargs, sig) -> dict:
    """Strip state/config; return user-visible params only."""
    bound = sig.bind_partial(*args, **kwargs)
    preview = {}
    for name, value in bound.arguments.items():
        if name in ("state", "config"):
            continue
        preview[name] = value if isinstance(value, (str, int, float, bool)) else str(value)[:200]
    return preview


def _merge_config(base: RunnableConfig, extra: dict) -> RunnableConfig:
    new = dict(base) if isinstance(base, dict) else {}
    configurable = dict(new.get("configurable", {}))
    configurable.update(extra)
    new["configurable"] = configurable
    return new
