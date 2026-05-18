import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'

async function assertLeader(userId: string, workspaceId: string): Promise<boolean> {
  const { rows } = await getPool().query(
    'SELECT role FROM user_projects WHERE user_id = $1 AND workspace_id = $2',
    [userId, workspaceId]
  )
  return rows[0]?.role === 'leader'
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { workspaceId } = await params
  if (!await assertLeader(session.user.id, workspaceId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const newCode = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  const { rowCount } = await getPool().query(
    `UPDATE workspace_state
     SET invite_code = $1,
         invite_code_expires_at = NOW() + INTERVAL '90 days',
         invite_code_revoked = FALSE
     WHERE workspace_id = $2`,
    [newCode, workspaceId]
  )
  if (!rowCount) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true, inviteCode: newCode })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { workspaceId } = await params
  if (!await assertLeader(session.user.id, workspaceId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { rowCount } = await getPool().query(
    `UPDATE workspace_state SET invite_code_revoked = TRUE WHERE workspace_id = $1`,
    [workspaceId]
  )
  if (!rowCount) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
