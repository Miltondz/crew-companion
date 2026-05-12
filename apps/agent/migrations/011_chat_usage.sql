-- Migration 011: chat turn usage tracking (no FK — text workspace_id)
INSERT INTO _migrations (name) VALUES ('011_chat_usage') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS chat_usage (
  workspace_id TEXT NOT NULL,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  count        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (workspace_id, date)
);

CREATE INDEX IF NOT EXISTS idx_chat_usage_workspace ON chat_usage(workspace_id);
