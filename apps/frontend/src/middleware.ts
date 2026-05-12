import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/api/copilotkit') && req.auth?.user?.id) {
    const headers = new Headers(req.headers)
    // Use active project cookie if set, otherwise fall back to user.id (legacy)
    const activeProject = req.cookies.get('crew_project_id')?.value
    headers.set('x-workspace-id', activeProject ?? req.auth.user.id)
    return NextResponse.next({ request: { headers } })
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/leader',
    '/member/:path*',
    '/docs',
    '/dashboard',
    '/api/copilotkit/:path*',
  ],
}
