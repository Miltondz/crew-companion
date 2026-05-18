import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const { rows } = await getPool().query(
    'SELECT 1 FROM user_projects WHERE user_id = $1 AND role = $2 LIMIT 1',
    [session.user.id, 'leader']
  )
  if (rows.length === 0) redirect('/dashboard')

  return <>{children}</>
}
