-- Extend existing users table + add NextAuth/Auth.js pg-adapter tables.
-- The Intelligence Postgres already has users(id uuid) from 001_auth.sql.
-- We add the columns NextAuth expects and create the missing tables.
INSERT INTO _migrations (name) VALUES ('009_auth_tables') ON CONFLICT DO NOTHING;

-- Add NextAuth columns to existing users table (idempotent)
ALTER TABLE users ADD COLUMN IF NOT EXISTS name              TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerified"   TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS image             TEXT;

-- Ensure email is nullable (NextAuth allows accounts without email initially)
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ALTER COLUMN display_name DROP NOT NULL;

CREATE TABLE IF NOT EXISTS accounts (
  id                    UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"              UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                  TEXT        NOT NULL,
  provider              TEXT        NOT NULL,
  "providerAccountId"   TEXT        NOT NULL,
  refresh_token         TEXT,
  access_token          TEXT,
  expires_at            INTEGER,
  token_type            TEXT,
  scope                 TEXT,
  id_token              TEXT,
  session_state         TEXT,
  UNIQUE (provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS sessions (
  id              UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionToken"  TEXT        UNIQUE NOT NULL,
  "userId"        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires         TIMESTAMPTZ NOT NULL
);

-- verification_tokens — NextAuth adapter expects this exact table name.
-- auth_verification_tokens (001) is kept for backward compat; this is a fresh table.
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier  TEXT        NOT NULL,
  token       TEXT        UNIQUE NOT NULL,
  expires     TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);
