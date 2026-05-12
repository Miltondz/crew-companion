import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { Pool } from 'pg'
import { cookies } from 'next/headers'

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 })

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ onboarded: false })
  try {
    // Check if user has any projects (new multi-project model)
    const { rows: projectRows } = await pool.query(
      'SELECT 1 FROM user_projects WHERE user_id = $1 LIMIT 1',
      [session.user.id]
    )
    if (projectRows.length > 0) return NextResponse.json({ onboarded: true })

    // Legacy: check workspace_state by user.id
    const { rows } = await pool.query(
      'SELECT state_json FROM workspace_state WHERE workspace_id = $1',
      [session.user.id]
    )
    return NextResponse.json({ onboarded: !!rows[0]?.state_json?.onboarded })
  } catch {
    return NextResponse.json({ onboarded: false })
  }
}

type MemberInput = { name: string; role: string; technicalLevel: string }

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectName, deadline, members, projectType, isDevProject, contextUrl, contextText } = await req.json() as {
    projectName: string; deadline: string; members: MemberInput[]
    projectType?: string; isDevProject?: boolean; contextUrl?: string; contextText?: string
  }

  const workspaceId = crypto.randomUUID()
  const observerToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
  const inviteCode = crypto.randomUUID().replace(/-/g, '').slice(0, 16)

  const builtMembers = members.map((m) => ({
    id: crypto.randomUUID(), name: m.name, role: m.role,
    technicalLevel: m.technicalLevel, activeBlockerId: null,
  }))

  const leaderId = builtMembers.find(m => m.role === 'leader')?.id ?? builtMembers[0]?.id ?? crypto.randomUUID()
  const milestoneId = crypto.randomUUID()

  const state = {
    members: builtMembers,
    currentMemberId: leaderId,
    tasks: [],
    milestones: [{ id: milestoneId, title: projectName, deadline, taskIds: [], phase: 'normal' }],
    projectConfig: {
      type: projectType ?? 'other',
      isDevProject: isDevProject ?? false,
      contextUrl: contextUrl ?? null,
      contextText: contextText ?? null,
    },
    blockers: [],
    sharedDocuments: contextText
      ? [{ id: crypto.randomUUID(), title: 'Contexto inicial', content: contextText, createdAt: new Date().toISOString() }]
      : contextUrl
      ? [{ id: crypto.randomUUID(), title: 'Referencia del proyecto', content: contextUrl, createdAt: new Date().toISOString() }]
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

  await pool.query(
    `INSERT INTO workspace_state (workspace_id, state_json, thread_id, observer_token, invite_code, created_at)
     VALUES ($1, $2::jsonb, $3, $4, $5, NOW())
     ON CONFLICT (workspace_id) DO UPDATE
       SET state_json = $2::jsonb, observer_token = $4, invite_code = $5`,
    [workspaceId, JSON.stringify(state), `thread-${workspaceId}`, observerToken, inviteCode]
  )

  await pool.query(
    `INSERT INTO user_projects (user_id, workspace_id, role) VALUES ($1, $2, 'leader') ON CONFLICT DO NOTHING`,
    [session.user.id, workspaceId]
  )

  // Set active project cookie
  const cookieStore = await cookies()
  cookieStore.set('crew_project_id', workspaceId, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 })

  return NextResponse.json({ ok: true, workspaceId })
}
