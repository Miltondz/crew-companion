-- Migration 004: per-workspace canvas state (replaces seed.json hydration)

CREATE TABLE IF NOT EXISTS workspace_state (
  workspace_id uuid        PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  state_json   jsonb       NOT NULL,
  thread_id    text        NOT NULL,
  updated_at   timestamptz NOT NULL DEFAULT now()
);
