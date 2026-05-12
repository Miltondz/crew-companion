import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ onboarded: false })
  try {
    const { rows } = await pool.query(
      'SELECT state_json FROM workspace_state WHERE workspace_id = $1',
      [session.user.id]
    )
    const onboarded = !!rows[0]?.state_json?.onboarded
    return NextResponse.json({ onboarded })
  } catch {
    return NextResponse.json({ onboarded: false })
  }
}

type MemberInput = { name: string; role: string; technicalLevel: string }

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectName, deadline, members, projectType, isDevProject, contextUrl, contextText } = await req.json() as {
    projectName: string
    deadline: string
    members: MemberInput[]
    projectType?: string
    isDevProject?: boolean
    contextUrl?: string
    contextText?: string
  }

  const workspaceId = session.user.id

  const builtMembers = members.map((m: MemberInput) => ({
    id: crypto.randomUUID(),
    name: m.name,
    role: m.role,
    technicalLevel: m.technicalLevel,
    activeBlockerId: null,
  }))

  const leaderId =
    builtMembers.find((m: { role: string; id: string }) => m.role === 'leader')?.id ??
    builtMembers[0]?.id ??
    crypto.randomUUID()

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
    sharedDocuments: contextText ? [{
      id: crypto.randomUUID(),
      title: 'Contexto inicial del proyecto',
      content: contextText,
      createdAt: new Date().toISOString(),
    }] : contextUrl ? [{
      id: crypto.randomUUID(),
      title: 'Referencia del proyecto',
      content: contextUrl,
      createdAt: new Date().toISOString(),
    }] : [],
    openDocumentIds: [],
    urgencyPhase: 'normal',
    mascotMood: 'calm',
    mascotMode: 'idle',
    highlightedTaskIds: [],
    activeMilestoneId: milestoneId,
    onboarded: true,
  }

  await pool.query(
    `INSERT INTO workspace_state (workspace_id, state_json, thread_id)
     VALUES ($1, $2::jsonb, $3)
     ON CONFLICT (workspace_id) DO UPDATE SET state_json = $2::jsonb`,
    [workspaceId, JSON.stringify(state), `thread-${workspaceId}`]
  )

  return NextResponse.json({ ok: true })
}
