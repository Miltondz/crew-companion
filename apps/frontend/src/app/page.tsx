import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
})

export default async function Home() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  try {
    const { rows } = await pool.query(
      'SELECT state_json FROM workspace_state WHERE workspace_id = $1',
      [session.user.id]
    )
    if (rows[0]?.state_json?.onboarded) redirect('/leader')
  } catch {
    redirect('/leader')
  }

  redirect('/onboarding')
}
