import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'

interface MemberSlot {
  id: string
  name: string
  role?: string
  userId?: string
}

interface StateJson {
  milestones?: { title?: string }[]
  members?: MemberSlot[]
  projectConfig?: { type?: string }
}

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  try {
    const { rows } = await getPool().query(
      `SELECT workspace_id, state_json FROM workspace_state WHERE invite_code = $1`,
      [code]
    )
    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const s = rows[0].state_json as StateJson
    const unclaimedMembers = (s?.members ?? [])
      .filter(m => !m.userId)
      .map(m => ({ id: m.id, name: m.name, role: m.role ?? 'member' }))
    return NextResponse.json({
      projectName: s?.milestones?.[0]?.title ?? 'Proyecto',
      memberCount: s?.members?.length ?? 0,
      projectType: s?.projectConfig?.type ?? 'other',
      unclaimedMembers,
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code } = await params
  const body = await req.json().catch(() => ({})) as { memberId?: string }
  const { memberId } = body

  if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })

  try {
    const { rows } = await getPool().query(
      `SELECT workspace_id, state_json FROM workspace_state WHERE invite_code = $1`,
      [code]
    )
    if (!rows[0]) return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
    const { workspace_id, state_json } = rows[0] as { workspace_id: string; state_json: StateJson }

    const members = state_json?.members ?? []
    const slot = members.find(m => m.id === memberId)
    if (!slot) return NextResponse.json({ error: 'Member slot not found' }, { status: 400 })
    if (slot.userId && slot.userId !== session.user!.id) {
      return NextResponse.json({ error: 'Member slot already claimed' }, { status: 409 })
    }
    const role = slot.role ?? 'member'

    const updatedMembers = members.map(m =>
      m.id === memberId ? { ...m, userId: session.user!.id } : m
    )
    await getPool().query(
      `UPDATE workspace_state SET state_json = jsonb_set(state_json, '{members}', $2::jsonb) WHERE workspace_id = $1`,
      [workspace_id, JSON.stringify(updatedMembers)]
    )

    await getPool().query(
      `INSERT INTO user_projects (user_id, workspace_id, role) VALUES ($1, $2, $3) ON CONFLICT (user_id, workspace_id) DO UPDATE SET role = $3`,
      [session.user.id, workspace_id, role]
    )
    return NextResponse.json({ ok: true, workspaceId: workspace_id, memberId })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
