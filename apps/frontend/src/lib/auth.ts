import NextAuth from 'next-auth'
import Resend from 'next-auth/providers/resend'
import PostgresAdapter from '@auth/pg-adapter'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 3_000,
})

// pg-adapter sends queries with camelCase column aliases.
// Our users table has id::uuid — pg auto-casts string ↔ uuid for us.
const adapter = PostgresAdapter(pool)

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.AUTH_EMAIL_FROM ?? 'Crew Companion <noreply@crew-companion.app>',
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
    error: '/auth/signin',
  },
  callbacks: {
    session({ session, user }) {
      if (user?.id) session.user.id = user.id
      return session
    },
  },
  session: { strategy: 'database' },
})
