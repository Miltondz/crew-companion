import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

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
    return NextResponse.json({ state: state_json, updatedAt: updated_at })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
