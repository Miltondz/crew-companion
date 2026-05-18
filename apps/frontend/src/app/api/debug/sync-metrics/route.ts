import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { syncMetrics } from '@/lib/sync-metrics'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { rows: leaderRows } = await getPool().query(
    'SELECT 1 FROM user_projects WHERE user_id = $1 AND role = $2 LIMIT 1',
    [session.user.id, 'leader']
  )
  if (leaderRows.length === 0) return NextResponse.json({ error: 'leader role required' }, { status: 403 })

  return NextResponse.json(syncMetrics.snapshot())
}
