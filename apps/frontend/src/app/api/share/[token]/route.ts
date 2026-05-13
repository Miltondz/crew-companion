import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 })

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  try {
    const { rows } = await pool.query(
      `SELECT workspace_id, state_json, invite_code, updated_at
       FROM workspace_state WHERE observer_token = $1`,
      [token]
    )
    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const { state_json, invite_code, updated_at } = rows[0]
    return NextResponse.json({ state: state_json, inviteCode: invite_code, updatedAt: updated_at })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
