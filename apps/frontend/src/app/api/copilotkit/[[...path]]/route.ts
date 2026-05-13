import { type NextRequest } from 'next/server'

const BFF_URL = process.env.BFF_URL ?? 'http://localhost:4000'

async function proxy(req: NextRequest): Promise<Response> {
  const url = new URL(req.url)
  // Strip the Next.js prefix and forward to BFF
  const target = `${BFF_URL}${url.pathname}${url.search}`

  const headers = new Headers(req.headers)
  // Remove Next.js / Vercel forwarding headers that confuse the upstream
  headers.delete('host')
  headers.delete('x-forwarded-host')
  headers.delete('x-forwarded-for')

  const init: RequestInit = {
    method: req.method,
    headers,
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    // @ts-expect-error duplex required for streaming bodies in Node fetch
    init.duplex = 'half'
    init.body = req.body
  }

  const upstream = await fetch(target, init)

  // Stream response back — preserves SSE for CopilotKit streaming
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
  })
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const DELETE = proxy
export const PATCH = proxy
export const OPTIONS = proxy

// Must disable Next.js body parsing — we stream the raw body to BFF
export const dynamic = 'force-dynamic'
