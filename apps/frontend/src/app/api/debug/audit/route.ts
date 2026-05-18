import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { rows: leaderRows } = await getPool().query(
    'SELECT 1 FROM user_projects WHERE user_id = $1 AND role = $2 LIMIT 1',
    [session.user.id, 'leader']
  )
  if (leaderRows.length === 0) return NextResponse.json({ error: 'leader role required' }, { status: 403 })

  const url = new URL(req.url)
  const tool = url.searchParams.get('tool') ?? ''
  const decision = url.searchParams.get('decision') ?? ''
  const hours = Math.min(Math.max(parseInt(url.searchParams.get('hours') ?? '24', 10) || 24, 1), 8760)
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '100', 10) || 100, 1), 500)
  const offset = Math.min(Math.max(parseInt(url.searchParams.get('offset') ?? '0', 10) || 0, 0), 100000)

  const conditions: string[] = ['created_at >= NOW() - $1::interval']
  const params: unknown[] = [`${hours} hours`]

  if (tool) { params.push(tool); conditions.push(`tool_id = $${params.length}`) }
  if (decision) { params.push(decision); conditions.push(`decision = $${params.length}`) }

  params.push(limit)
  const limitIdx = params.length
  params.push(offset)
  const offsetIdx = params.length

  const where = conditions.join(' AND ')

  try {
    const { rows } = await getPool().query(
      `SELECT id, workspace_id, actor_type, actor_id, tool_id, capabilities,
              risk_level, decision, decision_reason, outcome, outcome_error, created_at
       FROM audit_log
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    )
    const { rows: countRows } = await getPool().query(
      `SELECT COUNT(*)::int AS total FROM audit_log WHERE ${where}`,
      params.slice(0, params.length - 2)
    )
    return NextResponse.json({ rows, total: countRows[0]?.total ?? 0, offset, limit })
  } catch {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  }
}
