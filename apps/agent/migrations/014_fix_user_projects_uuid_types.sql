-- Migration 014: fix user_projects column types — workspace_id and user_id were TEXT
-- in migration 010 but the referenced columns are uuid. All existing values are valid
-- UUIDs so the explicit CAST is safe.
INSERT INTO _migrations (name) VALUES ('014_fix_user_projects_uuid_types') ON CONFLICT DO NOTHING;

ALTER TABLE user_projects
  ALTER COLUMN workspace_id TYPE uuid USING workspace_id::uuid,
  ALTER COLUMN user_id       TYPE uuid USING user_id::uuid;
