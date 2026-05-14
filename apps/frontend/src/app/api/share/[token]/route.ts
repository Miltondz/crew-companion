import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

interface ObserverConfig {
  showTasks?: boolean
  showTeamNames?: boolean
  showBlockerCount?: boolean
}

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  try {
    const { rows } = await getPool().query(
      `SELECT workspace_id, state_json, updated_at
       FROM workspace_state WHERE observer_token = $1`,
      [token]
    )
    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const { state_json, updated_at } = rows[0]

    const cfg: ObserverConfig = state_json?.observerConfig ?? {}
    const showTasks = cfg.showTasks !== false
    const showTeamNames = cfg.showTeamNames !== false
    const showBlockerCount = cfg.showBlockerCount !== false

    const filtered = {
      ...state_json,
      tasks: showTasks ? state_json.tasks : [],
      blockers: showBlockerCount ? state_json.blockers : [],
      members: showTeamNames
        ? state_json.members
        : (state_json.members ?? []).map((m: { id: string; role?: string }) => ({
            id: m.id,
            role: m.role ?? 'member',
            name: 'Miembro del equipo',
          })),
    }

    return NextResponse.json({ state: filtered, updatedAt: updated_at })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
