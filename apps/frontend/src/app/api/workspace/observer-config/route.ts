import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { Pool } from 'pg'
import { cookies } from 'next/headers'

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 })

async function getWorkspaceId(userId: string): Promise<string> {
  const jar = await cookies()
  return jar.get('crew_project_id')?.value ?? userId
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceId = await getWorkspaceId(session.user.id)
  const config = await req.json() as {
    showTasks?: boolean
    showTeamNames?: boolean
    showBlockerCount?: boolean
    customMessage?: string
  }

  try {
    await pool.query(
      `UPDATE workspace_state
       SET state_json = jsonb_set(state_json, '{observerConfig}', $2::jsonb)
       WHERE workspace_id = $1`,
      [workspaceId, JSON.stringify(config)]
    )
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
