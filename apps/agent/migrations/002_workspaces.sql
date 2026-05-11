-- Migration 002: workspaces + members

CREATE TABLE IF NOT EXISTS workspaces (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  invite_code text        UNIQUE NOT NULL,
  created_by  uuid        REFERENCES users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id    uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            text        NOT NULL CHECK (role IN ('leader','member','viewer')),
  technical_level text        NOT NULL CHECK (technical_level IN ('low-tech','high-tech')),
  capabilities    text[]      NOT NULL DEFAULT '{}',
  joined_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);
