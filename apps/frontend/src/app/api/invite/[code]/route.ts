import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 })

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const { rows } = await pool.query(
    `SELECT workspace_id, state_json FROM workspace_state WHERE invite_code = $1`,
    [code]
  )
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const s = rows[0].state_json as {
    milestones?: { title?: string }[]
    members?: unknown[]
    projectConfig?: { type?: string }
  }
  return NextResponse.json({
    projectName: s?.milestones?.[0]?.title ?? 'Proyecto',
    memberCount: s?.members?.length ?? 0,
    projectType: s?.projectConfig?.type ?? 'other',
  })
}

export async function POST(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code } = await params
  const { rows } = await pool.query(
    `SELECT workspace_id FROM workspace_state WHERE invite_code = $1`,
    [code]
  )
  if (!rows[0]) return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
  const { workspace_id } = rows[0]

  await pool.query(
    `INSERT INTO user_projects (user_id, workspace_id, role) VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING`,
    [session.user.id, workspace_id]
  )
  return NextResponse.json({ ok: true, workspaceId: workspace_id })
}
