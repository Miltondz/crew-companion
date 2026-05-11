-- Migration 005: per-user pinned surfaces (Spatial Grammar — block 3.2)

CREATE TABLE IF NOT EXISTS pinned_surfaces (
  user_id              uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id         uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  surface_manifest_id  text        NOT NULL,
  envelope             jsonb       NOT NULL,
  region_id            text        NOT NULL,
  pinned_at            timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, workspace_id, surface_manifest_id)
);
