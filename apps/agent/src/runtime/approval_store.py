"""Approval token store.

Uses Redis when REDIS_URL is set (multi-replica safe), falls back to
in-memory threading.Lock store for local dev / single-process deploys.
"""
from __future__ import annotations

import json
import os
import threading
import time
import uuid
from typing import Optional, TypedDict

_TTL_SECONDS = 5 * 60  # 5 minutes
_TTL_MS = _TTL_SECONDS * 1000

_REDIS_URL = os.environ.get("REDIS_URL")
_REDIS_KEY_PREFIX = "crew:approval:"


class _TokenRecord(TypedDict):
    workspace_id: str
    tool_id: str
    expires_at: int  # epoch ms


# ── Redis backend ────────────────────────────────────────────────────────────

def _redis_client():  # type: ignore[return]
    import redis  # type: ignore[import]
    return redis.from_url(_REDIS_URL, decode_responses=True)  # type: ignore[arg-type]


def _redis_issue(*, workspace_id: str, tool_id: str) -> str:
    token = str(uuid.uuid4())
    record: _TokenRecord = {
        "workspace_id": workspace_id,
        "tool_id": tool_id,
        "expires_at": int(time.time() * 1000) + _TTL_MS,
    }
    _redis_client().setex(
        f"{_REDIS_KEY_PREFIX}{token}",
        _TTL_SECONDS,
        json.dumps(record),
    )
    return token


def _redis_consume(token: str) -> Optional[_TokenRecord]:
    r = _redis_client()
    key = f"{_REDIS_KEY_PREFIX}{token}"
    raw = r.getdel(key)
    return json.loads(raw) if raw else None


def _redis_peek(token: str) -> Optional[_TokenRecord]:
    raw = _redis_client().get(f"{_REDIS_KEY_PREFIX}{token}")
    return json.loads(raw) if raw else None


# ── In-memory backend ────────────────────────────────────────────────────────

_lock = threading.Lock()
_store: dict[str, _TokenRecord] = {}


def _mem_issue(*, workspace_id: str, tool_id: str) -> str:
    token = str(uuid.uuid4())
    record: _TokenRecord = {
        "workspace_id": workspace_id,
        "tool_id": tool_id,
        "expires_at": int(time.time() * 1000) + _TTL_MS,
    }
    with _lock:
        _store[token] = record
    return token


def _mem_consume(token: str) -> Optional[_TokenRecord]:
    with _lock:
        return _store.pop(token, None)


def _mem_peek(token: str) -> Optional[_TokenRecord]:
    with _lock:
        return _store.get(token)


# ── Public API ───────────────────────────────────────────────────────────────

def issue_token(*, workspace_id: str, tool_id: str) -> str:
    if _REDIS_URL:
        return _redis_issue(workspace_id=workspace_id, tool_id=tool_id)
    return _mem_issue(workspace_id=workspace_id, tool_id=tool_id)


def consume_token(token: str) -> Optional[_TokenRecord]:
    """Remove and return the record; None if missing or expired."""
    if _REDIS_URL:
        return _redis_consume(token)
    rec = _mem_consume(token)
    if rec and rec["expires_at"] < int(time.time() * 1000):
        return None
    return rec


def peek_token(token: str) -> Optional[_TokenRecord]:
    """Non-destructive lookup — only for debugging/testing."""
    if _REDIS_URL:
        return _redis_peek(token)
    return _mem_peek(token)
