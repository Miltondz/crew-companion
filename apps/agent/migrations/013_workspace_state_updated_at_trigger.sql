-- Migration 013: auto-update workspace_state.updated_at on every UPDATE
INSERT INTO _migrations (name) VALUES ('013_workspace_state_updated_at_trigger') ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_workspace_state_updated_at ON workspace_state;
CREATE TRIGGER trg_workspace_state_updated_at
  BEFORE UPDATE ON workspace_state
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
