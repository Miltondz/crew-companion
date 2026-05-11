-- Migration 007: per-agent token usage counters

CREATE TABLE IF NOT EXISTS token_usage (
  workspace_id uuid    NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  date         date    NOT NULL,
  agent        text    NOT NULL,
  in_tokens    integer NOT NULL DEFAULT 0,
  out_tokens   integer NOT NULL DEFAULT 0,
  PRIMARY KEY (workspace_id, date, agent)
);
