import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthed = !!req.auth
  const isAuthRoute = pathname.startsWith('/auth')

  // Inject workspace-id header for BFF proxy — allows thread isolation per user
  if (pathname.startsWith('/api/copilotkit') && req.auth?.user?.id) {
    const headers = new Headers(req.headers)
    headers.set('x-workspace-id', req.auth.user.id)
    return NextResponse.next({ request: { headers } })
  }

  // Protect app routes
  if (!isAuthed && !isAuthRoute) {
    const url = new URL('/auth/signin', req.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
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
