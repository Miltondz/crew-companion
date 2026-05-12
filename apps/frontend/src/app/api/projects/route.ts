import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { Pool } from 'pg'
import { cookies } from 'next/headers'

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 })

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  // Auto-migrate: if user has legacy workspace (workspace_id = user.id) but no user_projects entry
  try {
    const legacy = await pool.query('SELECT workspace_id FROM workspace_state WHERE workspace_id = $1', [userId])
    if (legacy.rows[0]) {
      await pool.query(
        `INSERT INTO user_projects (user_id, workspace_id, role) VALUES ($1, $2, 'leader') ON CONFLICT DO NOTHING`,
        [userId, userId]
      )
      await pool.query(
        `UPDATE workspace_state SET
           observer_token = COALESCE(observer_token, encode(gen_random_bytes(16), 'hex')),
           invite_code    = COALESCE(invite_code, encode(gen_random_bytes(8), 'hex'))
         WHERE workspace_id = $1`,
        [userId]
      )
    }
  } catch { /* table may not exist yet — run migrations */ }

  const { rows } = await pool.query<{
    workspace_id: string
    state_json: Record<string, unknown>
    observer_token: string
    invite_code: string
    updated_at: string
    role: string
  }>(
    `SELECT ws.workspace_id, ws.state_json, ws.observer_token, ws.invite_code,
            ws.updated_at, up.role
     FROM workspace_state ws
     JOIN user_projects up ON ws.workspace_id = up.workspace_id
     WHERE up.user_id = $1
     ORDER BY ws.updated_at DESC NULLS LAST`,
    [userId]
  )

  return NextResponse.json({ projects: rows })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { workspaceId } = await req.json() as { workspaceId: string }

  const cookieStore = await cookies()
  cookieStore.set('crew_project_id', workspaceId, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 })
  return NextResponse.json({ ok: true })
}
