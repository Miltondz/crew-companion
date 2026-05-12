import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import LandingPage from './_landing'

export default async function Home() {
  const session = await auth()
  if (session?.user?.id) redirect('/dashboard')
  return <LandingPage />
}
