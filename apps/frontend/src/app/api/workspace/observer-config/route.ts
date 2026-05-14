import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { cookies } from 'next/headers'

async function getWorkspaceId(userId: string): Promise<string> {
  const jar = await cookies()
  return jar.get('crew_project_id')?.value ?? userId
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceId = await getWorkspaceId(session.user.id)
  const raw = await req.json() as {
    showTasks?: boolean
    showTeamNames?: boolean
    showBlockerCount?: boolean
    customMessage?: string
  }
  const config = {
    showTasks: !!raw.showTasks,
    showTeamNames: !!raw.showTeamNames,
    showBlockerCount: !!raw.showBlockerCount,
    customMessage: (raw.customMessage ?? '').slice(0, 120),
  }

  try {
    const result = await getPool().query(
      `UPDATE workspace_state
       SET state_json = jsonb_set(state_json, '{observerConfig}', $2::jsonb)
       WHERE workspace_id = $1
         AND EXISTS (
           SELECT 1 FROM user_projects
           WHERE user_id = $3 AND workspace_id = $1
         )`,
      [workspaceId, JSON.stringify(config), session.user.id]
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
