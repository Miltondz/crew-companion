-- Migration 003: audit_log
-- Executed in block 3.4 — placeholder file in 3.3.

CREATE TABLE IF NOT EXISTS audit_log (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid        NOT NULL,
  actor_type       text        NOT NULL
                               CHECK (actor_type = 'user' OR actor_type LIKE 'agent:%'),
  actor_id         text        NOT NULL,
  tool_id          text        NOT NULL,
  capabilities     text[]      NOT NULL,
  risk_level       text        NOT NULL
                               CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  input_hash       text,
  decision         text        NOT NULL
                               CHECK (decision IN ('allowed', 'denied', 'pending', 'approved', 'rejected')),
  decision_reason  text,
  approval_user_id uuid,
  outcome          text        CHECK (outcome IN ('success', 'error')),
  outcome_error    text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_workspace_time
  ON audit_log (workspace_id, created_at DESC);

CREATE INDEX audit_log_tool_id
  ON audit_log (tool_id, created_at DESC);

CREATE INDEX audit_log_pending
  ON audit_log (workspace_id, decision)
  WHERE decision = 'pending';

CREATE INDEX audit_log_actor
  ON audit_log (actor_id, created_at DESC);
