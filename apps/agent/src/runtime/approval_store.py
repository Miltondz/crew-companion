"""In-memory approval token store. Single-use; single-process safe.

Phase B: swap to Redis for multi-replica support.
"""
from __future__ import annotations

import threading
import time
import uuid
from typing import Optional, TypedDict

_lock = threading.Lock()
_store: dict[str, "_TokenRecord"] = {}

_TTL_MS = 5 * 60 * 1000  # 5 minutes


class _TokenRecord(TypedDict):
    workspace_id: str
    tool_id: str
    expires_at: int  # epoch ms


def issue_token(*, workspace_id: str, tool_id: str) -> str:
    token = str(uuid.uuid4())
    record: _TokenRecord = {
        "workspace_id": workspace_id,
        "tool_id": tool_id,
        "expires_at": int(time.time() * 1000) + _TTL_MS,
    }
    with _lock:
        _store[token] = record
    return token


def consume_token(token: str) -> Optional[_TokenRecord]:
    """Remove and return the record; None if missing."""
    with _lock:
        return _store.pop(token, None)


def peek_token(token: str) -> Optional[_TokenRecord]:
    """Non-destructive lookup — only for debugging/testing."""
    with _lock:
        return _store.get(token)
