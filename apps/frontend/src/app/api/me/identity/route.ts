import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { cookies } from 'next/headers'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 })

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const jar = await cookies()
  const workspaceId = jar.get('crew_project_id')?.value
  const memberId = jar.get('crew_member_id')?.value

  if (!workspaceId) return NextResponse.json({ workspaceId: null, memberId: null, role: null })

  try {
    const { rows } = await pool.query<{ role: string }>(
      `SELECT role FROM user_projects WHERE user_id = $1 AND workspace_id = $2`,
      [userId, workspaceId]
    )
    const role = rows[0]?.role ?? null
    return NextResponse.json({ workspaceId, memberId: memberId ?? null, role })
  } catch {
    return NextResponse.json({ workspaceId, memberId: memberId ?? null, role: null })
  }
}
