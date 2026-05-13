import NextAuth from 'next-auth'
import Resend from 'next-auth/providers/resend'
import PostgresAdapter from '@auth/pg-adapter'
import { Pool } from 'pg'
import { authConfig } from './auth.config'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 3_000,
})

// Ensure verification_token (singular) exists — @auth/pg-adapter uses singular table name.
// Migration 009 incorrectly used plural. This idempotent fix runs on cold start.
pool.query(`
  CREATE TABLE IF NOT EXISTS verification_token (
    identifier  TEXT        NOT NULL,
    token       TEXT        UNIQUE NOT NULL,
    expires     TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (identifier, token)
  )
`).catch(() => {})

const adapter = PostgresAdapter(pool)

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter,
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.AUTH_EMAIL_FROM ?? 'Crew Companion <noreply@crew-companion.app>',
    }),
  ],
  session: { strategy: 'jwt' },
  trustHost: true,
})
