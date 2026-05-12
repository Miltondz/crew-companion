import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { Pool } from 'pg'
import { cookies } from 'next/headers'

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 })

const CHAT_DAILY_LIMIT = 200

async function getWorkspaceId(userId: string): Promise<string> {
  const jar = await cookies()
  return jar.get('crew_project_id')?.value ?? userId
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceId = await getWorkspaceId(session.user.id)
  const today = new Date().toISOString().split('T')[0]

  try {
    const { rows } = await pool.query(
      'SELECT count FROM chat_usage WHERE workspace_id = $1 AND date = $2',
      [workspaceId, today]
    )
    const count = rows[0]?.count ?? 0
    return NextResponse.json({
      count,
      limit: CHAT_DAILY_LIMIT,
      remaining: Math.max(0, CHAT_DAILY_LIMIT - count),
      limitReached: count >= CHAT_DAILY_LIMIT,
      warningThreshold: count >= CHAT_DAILY_LIMIT - 20,
    })
  } catch {
    return NextResponse.json({ count: 0, limit: CHAT_DAILY_LIMIT, remaining: CHAT_DAILY_LIMIT, limitReached: false, warningThreshold: false })
  }
}

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceId = await getWorkspaceId(session.user.id)
  const today = new Date().toISOString().split('T')[0]

  try {
    await pool.query(
      `INSERT INTO chat_usage (workspace_id, date, count) VALUES ($1, $2, 1)
       ON CONFLICT (workspace_id, date) DO UPDATE SET count = chat_usage.count + 1`,
      [workspaceId, today]
    )
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
