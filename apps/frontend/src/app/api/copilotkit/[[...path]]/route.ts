import { type NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

const BFF_URL = process.env.BFF_URL ?? 'http://localhost:4000'
const CHAT_DAILY_LIMIT = 200

async function checkAndIncrementUsage(workspaceId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0]
  try {
    // Atomic upsert: increments only when count < limit; returns nothing if limit hit
    const { rows } = await getPool().query(
      `INSERT INTO chat_usage (workspace_id, date, count) VALUES ($1, $2, 1)
       ON CONFLICT (workspace_id, date) DO UPDATE
         SET count = chat_usage.count + 1
         WHERE chat_usage.count < $3
       RETURNING count`,
      [workspaceId, today, CHAT_DAILY_LIMIT]
    )
    return !!rows[0]
  } catch {
    return true
  }
}

async function proxy(req: NextRequest): Promise<Response> {
  const url = new URL(req.url)
  const target = `${BFF_URL}${url.pathname}${url.search}`

  const headers = new Headers(req.headers)
  headers.delete('host')
  headers.delete('x-forwarded-host')
  headers.delete('x-forwarded-for')

  if (req.method === 'POST') {
    const workspaceId = req.headers.get('x-workspace-id')
    if (workspaceId && process.env.DATABASE_URL) {
      const allowed = await checkAndIncrementUsage(workspaceId)
      if (!allowed) {
        return NextResponse.json(
          { error: 'Daily chat limit reached', remaining: 0, limit: CHAT_DAILY_LIMIT },
          { status: 429 }
        )
      }
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
