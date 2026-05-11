# 3.3: log to stderr. 3.4: log_to_db() writes to audit_log table.
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from typing import Literal, Optional

logger = logging.getLogger("audit")

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
            AuditLogger._maybe_persist(record)
        except Exception:
            # Invariant: audit failures never block tool execution.
            logger.exception("audit_log_failed")

    @staticmethod
    def _maybe_persist(record: dict) -> None:
        """Best-effort DB write. Silently no-op if DB unavailable."""
        dsn = os.getenv("DATABASE_URL")
        if not dsn:
            return
        try:
            import psycopg  # type: ignore[import-not-found]
            with psycopg.connect(dsn, connect_timeout=1) as conn:
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
            # Invariant: audit failures never raise. Stderr already has the record.
            logger.exception("audit_db_write_failed")
