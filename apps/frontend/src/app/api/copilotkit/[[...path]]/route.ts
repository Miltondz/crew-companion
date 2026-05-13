import { type NextRequest } from 'next/server'
import { getPool } from '@/lib/db'

const BFF_URL = process.env.BFF_URL ?? 'http://localhost:4000'

async function incrementUsage(workspaceId: string) {
  const today = new Date().toISOString().split('T')[0]
  await getPool().query(
    `INSERT INTO chat_usage (workspace_id, date, count) VALUES ($1, $2, 1)
     ON CONFLICT (workspace_id, date) DO UPDATE SET count = chat_usage.count + 1`,
    [workspaceId, today]
  )
}

async function proxy(req: NextRequest): Promise<Response> {
  const url = new URL(req.url)
  const target = `${BFF_URL}${url.pathname}${url.search}`

  const headers = new Headers(req.headers)
  headers.delete('host')
  headers.delete('x-forwarded-host')
  headers.delete('x-forwarded-for')

  // Count every user-initiated chat POST (injected x-workspace-id comes from middleware)
  if (req.method === 'POST') {
    const workspaceId = req.headers.get('x-workspace-id')
    if (workspaceId && process.env.DATABASE_URL) {
      incrementUsage(workspaceId).catch(() => {})
    }
  }

  const init: RequestInit = { method: req.method, headers }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    // @ts-expect-error duplex required for streaming bodies in Node fetch
    init.duplex = 'half'
    init.body = req.body
  }

  const upstream = await fetch(target, init)

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

export const dynamic = 'force-dynamic'
