from __future__ import annotations

import json
import logging
import os
import queue
import threading
from datetime import datetime, timezone
from typing import Literal, Optional

logger = logging.getLogger("audit")

_db_queue: queue.Queue = queue.Queue(maxsize=500)


def _db_writer() -> None:
    dsn = os.getenv("DATABASE_URL")
    conn = None
    while True:
        record = _db_queue.get()
        try:
            if dsn:
                import psycopg  # type: ignore[import-not-found]
                try:
                    if conn is None or conn.closed:
                        conn = psycopg.connect(dsn, connect_timeout=1)
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            INSERT INTO audit_log
                              (workspace_id, actor_type, actor_id, tool_id, capabilities,
                               risk_level, decision, decision_reason, outcome, outcome_error)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            """,
                            (
                                record["workspace_id"],
                                record["actor_type"],
                                record["actor_id"],
                                record["tool_id"],
                                record["capabilities"],
                                record["risk_level"],
                                record["decision"],
                                record.get("decision_reason"),
                                record.get("outcome"),
                                record.get("outcome_error"),
                            ),
                        )
                    conn.commit()
                except Exception:
                    conn = None
                    logger.exception("audit_db_write_failed")
        finally:
            _db_queue.task_done()


threading.Thread(target=_db_writer, daemon=True, name="audit-db-writer").start()

Decision = Literal["allowed", "denied", "pending", "approved", "rejected"]
Outcome = Literal["success", "error"]


class AuditLogger:
    @staticmethod
    def log(
        tool_meta,
        context,
        *,
        decision: Decision,
        reason: Optional[str] = None,
        outcome: Optional[Outcome] = None,
        outcome_error: Optional[str] = None,
    ) -> None:
        """Append one audit record. Never raises."""
        try:
            record = {
                "ts": datetime.now(timezone.utc).isoformat(),
                "workspace_id": context.workspace_id,
                "actor_type": f"agent:{context.agent_id}",
                "actor_id": context.agent_id,
                "tool_id": tool_meta.tool_id,
                "capabilities": [c.value for c in tool_meta.capabilities],
                "risk_level": tool_meta.risk_level.value,
                "decision": decision,
                "decision_reason": reason,
                "outcome": outcome,          # None not "" — matches DDL CHECK
                "outcome_error": outcome_error,
            }
            logger.info("AUDIT %s", json.dumps(record, default=str))
            try:
                _db_queue.put_nowait(record)
            except queue.Full:
                pass
        except Exception:
            # Invariant: audit failures never block tool execution.
            logger.exception("audit_log_failed")

