-- Migration 008: generated asset cache (Imagen results, badges, logos)

CREATE TABLE IF NOT EXISTS generated_assets (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  asset_type   text        NOT NULL,
  asset_key    text        NOT NULL,
  prompt_hash  text        NOT NULL,
  url          text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, asset_type, asset_key)
);
