import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'

async function assertOwnership(userId: string, workspaceId: string) {
  const { rows } = await getPool().query(
    'SELECT role FROM user_projects WHERE user_id = $1 AND workspace_id = $2',
    [userId, workspaceId]
  )
  return rows[0]?.role === 'leader'
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { workspaceId } = await params
  if (!await assertOwnership(session.user.id, workspaceId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json() as { archived?: boolean; name?: string }

  const { rows } = await getPool().query<{ state_json: Record<string, unknown> }>(
    'SELECT state_json FROM workspace_state WHERE workspace_id = $1',
    [workspaceId]
  )
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const state = rows[0].state_json ?? {}
  const next: Record<string, unknown> = { ...state }

  if (typeof body.archived === 'boolean') {
    next.archived = body.archived
    next.archivedAt = body.archived ? new Date().toISOString() : null
  }

  if (typeof body.name === 'string' && body.name.trim()) {
    const milestones = Array.isArray(state.milestones) ? [...(state.milestones as Array<Record<string, unknown>>)] : []
    if (milestones[0]) {
      milestones[0] = { ...milestones[0], title: body.name.trim() }
      next.milestones = milestones
    }
    const projectConfig = (state.projectConfig as Record<string, unknown> | undefined) ?? {}
    next.projectConfig = { ...projectConfig, name: body.name.trim() }
  }

  await getPool().query(
    'UPDATE workspace_state SET state_json = $1, updated_at = NOW() WHERE workspace_id = $2',
    [next, workspaceId]
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { workspaceId } = await params
  if (!await assertOwnership(session.user.id, workspaceId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await getPool().query('DELETE FROM user_projects WHERE workspace_id = $1', [workspaceId])
  await getPool().query('DELETE FROM workspace_state WHERE workspace_id = $1', [workspaceId])

  return NextResponse.json({ ok: true })
}
