-- Migration 012: create verification_token (singular) as expected by @auth/pg-adapter
-- Migration 009 incorrectly created verification_tokens (plural).
-- The adapter queries: INSERT INTO verification_token ... / DELETE FROM verification_token ...
INSERT INTO _migrations (name) VALUES ('012_verification_token_singular') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS verification_token (
  identifier  TEXT        NOT NULL,
  token       TEXT        UNIQUE NOT NULL,
  expires     TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Migrate any existing rows from the plural table (if any exist and aren't already there)
INSERT INTO verification_token (identifier, token, expires)
SELECT identifier, token, expires FROM verification_tokens
WHERE NOT EXISTS (
  SELECT 1 FROM verification_token vt
  WHERE vt.identifier = verification_tokens.identifier
    AND vt.token = verification_tokens.token
)
ON CONFLICT DO NOTHING;
