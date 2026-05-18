import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { cookies } from 'next/headers'

const IS_PROD = process.env.NODE_ENV === 'production'
const COOKIE_OPTS = { path: '/', httpOnly: true, sameSite: 'lax' as const, maxAge: 60 * 60 * 24 * 30, secure: IS_PROD }

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  try {
    const legacy = await getPool().query('SELECT workspace_id FROM workspace_state WHERE workspace_id = $1', [userId])
    if (legacy.rows[0]) {
      await getPool().query(
        `INSERT INTO user_projects (user_id, workspace_id, role) VALUES ($1, $2, 'leader') ON CONFLICT DO NOTHING`,
        [userId, userId]
      )
      await getPool().query(
        `UPDATE workspace_state SET
           observer_token = COALESCE(observer_token, encode(gen_random_bytes(16), 'hex')),
           invite_code    = COALESCE(invite_code, encode(gen_random_bytes(8), 'hex'))
         WHERE workspace_id = $1`,
        [userId]
      )
    }
  } catch { /* migrations may not have run yet */ }

  const { rows } = await getPool().query<{
    workspace_id: string
    state_json: Record<string, unknown>
    observer_token: string
    invite_code: string
    updated_at: string
    role: string
    version: number
  }>(
    `SELECT ws.workspace_id, ws.state_json, ws.observer_token, ws.invite_code,
            ws.updated_at, ws.version, up.role
     FROM workspace_state ws
     JOIN user_projects up ON ws.workspace_id = up.workspace_id
     WHERE up.user_id = $1
     ORDER BY ws.updated_at DESC NULLS LAST`,
    [userId]
  )

  const projects = rows.map(row => {
    const members = (row.state_json?.members as Array<{ id: string; userId?: string }> | undefined) ?? []
    const memberSlot = members.find(m => m.userId === userId)
    return { ...row, member_id: memberSlot?.id ?? null }
  })

  return NextResponse.json({ projects })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  const { workspaceId } = await req.json() as { workspaceId: string }

  const { rows: membership } = await getPool().query(
    'SELECT 1 FROM user_projects WHERE user_id = $1 AND workspace_id = $2',
    [userId, workspaceId]
  )
  if (!membership[0]) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const cookieStore = await cookies()
  cookieStore.set('crew_project_id', workspaceId, COOKIE_OPTS)

  try {
    const { rows } = await getPool().query<{ state_json: { members?: Array<{ id: string; userId?: string }> } }>(
      `SELECT state_json FROM workspace_state WHERE workspace_id = $1`,
      [workspaceId]
    )
    if (rows[0]) {
      const slot = (rows[0].state_json?.members ?? []).find(m => m.userId === userId)
      if (slot) {
        cookieStore.set('crew_member_id', slot.id, COOKIE_OPTS)
      } else {
        cookieStore.delete('crew_member_id')
      }
    }
  } catch { /* non-fatal */ }

  return NextResponse.json({ ok: true })
}
