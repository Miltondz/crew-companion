import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Inject workspace-id header for BFF proxy — allows thread isolation per user
  if (pathname.startsWith('/api/copilotkit') && req.auth?.user?.id) {
    const headers = new Headers(req.headers)
    headers.set('x-workspace-id', req.auth.user.id)
    return NextResponse.next({ request: { headers } })
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/leader',
    '/member/:path*',
    '/docs',
    '/api/copilotkit/:path*',
  ],
}
