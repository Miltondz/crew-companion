-- Migration 015: drop vestigial FK from workspace_state → workspaces
-- workspace_state is the primary source of truth; workspaces table is no longer populated.
-- Onboarding inserts directly into workspace_state + user_projects without touching workspaces.
INSERT INTO _migrations (name) VALUES ('015_drop_workspace_state_fk') ON CONFLICT DO NOTHING;

ALTER TABLE workspace_state DROP CONSTRAINT IF EXISTS workspace_state_workspace_id_fkey;
