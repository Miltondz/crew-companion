import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { cookies } from 'next/headers'

const IS_PROD = process.env.NODE_ENV === 'production'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { rows: projectRows } = await getPool().query(
      'SELECT 1 FROM user_projects WHERE user_id = $1 LIMIT 1',
      [session.user.id]
    )
    if (projectRows.length > 0) return NextResponse.json({ onboarded: true })

    const { rows } = await getPool().query(
      'SELECT state_json FROM workspace_state WHERE workspace_id = $1',
      [session.user.id]
    )
    return NextResponse.json({ onboarded: !!rows[0]?.state_json?.onboarded })
  } catch {
    return NextResponse.json({ onboarded: false })
  }
}

type MemberInput = { name: string; role: string; technicalLevel: string; specialization?: string }

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    projectName: string; deadline: string; members: MemberInput[]
    projectType?: string; isDevProject?: boolean; contextUrl?: string; contextText?: string
  }

  // Input validation
  const projectName = (body.projectName ?? '').trim().slice(0, 200)
  const deadline = (body.deadline ?? '').trim().slice(0, 30)
  const contextUrl = (body.contextUrl ?? '').trim().slice(0, 500) || null
  const contextText = (body.contextText ?? '').trim().slice(0, 10_000) || null
  const projectType = (body.projectType ?? 'other').trim().slice(0, 50)
  const isDevProject = !!body.isDevProject
  const rawMembers: MemberInput[] = Array.isArray(body.members) ? body.members.slice(0, 20) : []

  if (!projectName || !deadline) {
    return NextResponse.json({ error: 'projectName and deadline required' }, { status: 400 })
  }

  const workspaceId = crypto.randomUUID()
  const observerToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
  const inviteCode = crypto.randomUUID().replace(/-/g, '').slice(0, 16)

  const VALID_SPECIALIZATIONS = ['developer', 'designer', 'qa', 'manager', 'writer', 'other']
  const builtMembers = rawMembers.map((m) => ({
    id: crypto.randomUUID(),
    name: (m.name ?? '').trim().slice(0, 100),
    role: ['leader', 'member'].includes(m.role) ? m.role : 'member',
    technicalLevel: m.technicalLevel === 'high-tech' ? 'high-tech' : 'low-tech',
    specialization: VALID_SPECIALIZATIONS.includes(m.specialization ?? '') ? m.specialization : 'other',
    activeBlockerId: null,
  }))

  const leaderId = builtMembers.find(m => m.role === 'leader')?.id ?? builtMembers[0]?.id ?? crypto.randomUUID()
  const milestoneId = crypto.randomUUID()

  const state = {
    members: builtMembers,
    currentMemberId: leaderId,
    tasks: [],
    milestones: [{ id: milestoneId, title: projectName, deadline, taskIds: [], phase: 'normal' }],
    projectConfig: { type: projectType, isDevProject, contextUrl, contextText },
    blockers: [],
    sharedDocuments: contextText
      ? [{ id: crypto.randomUUID(), title: 'Contexto inicial', content: contextText, sharedBy: leaderId, sharedAt: new Date().toISOString() }]
      : contextUrl
      ? [{ id: crypto.randomUUID(), title: 'Referencia del proyecto', content: contextUrl, sharedBy: leaderId, sharedAt: new Date().toISOString() }]
      : [],
    openDocumentIds: [],
    urgencyPhase: 'normal',
    mascotMood: 'calm',
    mascotMode: 'idle',
    highlightedTaskIds: [],
    activeMilestoneId: milestoneId,
    onboarded: true,
    observerConfig: { showTasks: true, showTeamNames: true, showBlockerCount: true, customMessage: '' },
  }

  try {
    await getPool().query(
      `INSERT INTO workspace_state (workspace_id, state_json, thread_id, observer_token, invite_code, created_at)
       VALUES ($1, $2::jsonb, $3, $4, $5, NOW())
       ON CONFLICT (workspace_id) DO UPDATE
         SET state_json = $2::jsonb, observer_token = $4, invite_code = $5`,
      [workspaceId, JSON.stringify(state), `thread-${workspaceId}`, observerToken, inviteCode]
    )

    await getPool().query(
      `INSERT INTO user_projects (user_id, workspace_id, role) VALUES ($1, $2, 'leader') ON CONFLICT DO NOTHING`,
      [session.user.id, workspaceId]
    )
  } catch (err) {
    console.error('[onboarding] DB error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Error al guardar, intentá de nuevo' }, { status: 500 })
  }

  const cookieStore = await cookies()
  const cookieOpts = { path: '/', httpOnly: true, sameSite: 'lax' as const, maxAge: 60 * 60 * 24 * 30, secure: IS_PROD }
  cookieStore.set('crew_project_id', workspaceId, cookieOpts)

  return NextResponse.json({ ok: true, workspaceId })
}
