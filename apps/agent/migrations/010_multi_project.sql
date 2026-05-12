-- Migration 010: multi-project support + observer/invite tokens
INSERT INTO _migrations (name) VALUES ('010_multi_project') ON CONFLICT DO NOTHING;

-- user_projects: text types to avoid UUID conflicts with legacy workspace_id = user.id
CREATE TABLE IF NOT EXISTS user_projects (
  user_id     TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'leader',
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_user_projects_uid ON user_projects(user_id);

-- Add sharing tokens + created_at to workspace_state
ALTER TABLE workspace_state ADD COLUMN IF NOT EXISTS observer_token TEXT;
ALTER TABLE workspace_state ADD COLUMN IF NOT EXISTS invite_code    TEXT;
ALTER TABLE workspace_state ADD COLUMN IF NOT EXISTS created_at     TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_ws_observer_token ON workspace_state(observer_token)
  WHERE observer_token IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ws_invite_code ON workspace_state(invite_code)
  WHERE invite_code IS NOT NULL;
