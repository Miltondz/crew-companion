"""Local shim for deepagents middleware protocol.

deepagents 0.5.x never exported AgentMiddleware, ModelRequest, ModelResponse,
or ToolCallRequest from its public __init__. We define a duck-typed base here
so create_deep_agent / create_agent still receive objects with the expected
lifecycle hooks.
"""
from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Any

ModelRequest = Any
ModelResponse = Any
ToolCallRequest = Any


class AgentMiddleware:
    @property
    def name(self) -> str:
        return self.__class__.__name__

    def before_agent(self, state: Any, runtime: Any) -> dict[str, Any] | None:
        return None

    async def abefore_agent(self, state: Any, runtime: Any) -> dict[str, Any] | None:
        return self.before_agent(state, runtime)

    def after_agent(self, state: Any, runtime: Any) -> dict[str, Any] | None:
        return None

    async def aafter_agent(self, state: Any, runtime: Any) -> dict[str, Any] | None:
        return self.after_agent(state, runtime)

    def wrap_model_call(
        self,
        request: Any,
        handler: Callable[[Any], Any],
    ) -> Any:
        return handler(request)

    async def awrap_model_call(
        self,
        request: Any,
        handler: Callable[[Any], Awaitable[Any]],
    ) -> Any:
        return await handler(request)

    def wrap_tool_call(
        self,
        request: Any,
        handler: Callable[[Any], Any],
    ) -> Any:
        return handler(request)

    async def awrap_tool_call(
        self,
        request: Any,
        handler: Callable[[Any], Awaitable[Any]],
    ) -> Any:
        return await handler(request)
