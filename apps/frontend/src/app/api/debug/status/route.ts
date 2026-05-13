import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { Pool } from 'pg'
import { cookies } from 'next/headers'
import { createConnection } from 'net'
import { connect as tlsConnect } from 'tls'

const BFF_URL = process.env.BFF_URL ?? 'http://localhost:4000'

let _pool: Pool | null = null
function pool(): Pool | null {
  if (!process.env.DATABASE_URL) return null
  if (!_pool) _pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2 })
  return _pool
}

async function safeFetch(url: string, init?: RequestInit) {
  const start = Date.now()
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(6000) })
    const data = await res.json().catch(() => null)
    return { ok: res.ok, latencyMs: Date.now() - start, status: res.status, data }
  } catch (e: unknown) {
    return { ok: false, latencyMs: Date.now() - start, error: (e as Error).message }
  }
}

async function checkBffInfo() {
  return safeFetch(`${BFF_URL}/api/copilotkit/info`)
}

async function checkBffHealth() {
  return safeFetch(`${BFF_URL}/api/health`)
}

async function checkPostgres() {
  const db = pool()
  if (!db) return { configured: false }
  const start = Date.now()
  try {
    const [vRes, sRes, tRes] = await Promise.all([
      db.query('SELECT version()'),
      db.query(`SELECT
        pg_database_size(current_database()) AS size_bytes,
        (SELECT count(*) FROM pg_stat_activity WHERE state != 'idle') AS active_connections,
        (SELECT count(*) FROM pg_stat_activity) AS total_connections`),
      db.query(`SELECT relname AS tablename, n_live_tup, n_dead_tup,
        pg_total_relation_size(schemaname||'.'||relname) AS size_bytes
        FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 40`),
    ])
    return {
      ok: true, configured: true, latencyMs: Date.now() - start,
      version: (vRes.rows[0]?.version as string | undefined)?.split(' ').slice(0, 2).join(' '),
      stats: sRes.rows[0],
      tables: tRes.rows,
    }
  } catch (e: unknown) {
    return { ok: false, configured: true, latencyMs: Date.now() - start, error: (e as Error).message }
  }
}

async function checkRedis() {
  const url = process.env.REDIS_URL
  if (!url) return { configured: false }
  const start = Date.now()
  const isTls = url.startsWith('rediss://')
  try {
    const parsed = new URL(url)
    await new Promise<void>((resolve, reject) => {
      const sock = isTls
        ? tlsConnect({ host: parsed.hostname, port: +(parsed.port || 6380), rejectUnauthorized: false })
        : createConnection({ host: parsed.hostname, port: +(parsed.port || 6379) })
      sock.setTimeout(4000)
      const done = (fn: () => void) => { sock.destroy(); fn() }
      sock.on(isTls ? 'secureConnect' : 'connect', () => done(resolve))
      sock.on('error', (e) => reject(e))
      sock.on('timeout', () => reject(new Error('tcp timeout')))
    })
    return { configured: true, reachable: true, tls: isTls, latencyMs: Date.now() - start }
  } catch (e: unknown) {
    return { configured: true, reachable: false, tls: isTls, latencyMs: Date.now() - start, error: (e as Error).message }
  }
}

async function getUsage(workspaceId: string) {
  const db = pool()
  if (!db) return null
  const today = new Date().toISOString().split('T')[0]
  const [chatToday, chatWeek, tokenByAgent, images] = await Promise.all([
    db.query('SELECT count FROM chat_usage WHERE workspace_id=$1 AND date=$2', [workspaceId, today]).catch(() => ({ rows: [] })),
    db.query('SELECT date, count FROM chat_usage WHERE workspace_id=$1 ORDER BY date DESC LIMIT 7', [workspaceId]).catch(() => ({ rows: [] })),
    db.query(`SELECT agent, SUM(in_tokens) AS in_tokens, SUM(out_tokens) AS out_tokens
      FROM token_usage WHERE workspace_id=$1 AND date >= CURRENT_DATE - 7 GROUP BY agent`, [workspaceId]).catch(() => ({ rows: [] })),
    db.query('SELECT asset_type, count(*) AS count FROM generated_assets WHERE workspace_id=$1 GROUP BY asset_type', [workspaceId]).catch(() => ({ rows: [] })),
  ])
  return {
    chat: { today: chatToday.rows[0]?.count ?? 0, limit: 200, history: chatWeek.rows },
    tokens: tokenByAgent.rows,
    assets: images.rows,
  }
}

async function getAuditLog(workspaceId: string) {
  const db = pool()
  if (!db) return null
  const [recent, stats] = await Promise.all([
    db.query(`SELECT tool_id, actor_type, risk_level, decision, outcome, outcome_error, created_at
      FROM audit_log WHERE workspace_id=$1 ORDER BY created_at DESC LIMIT 30`, [workspaceId]).catch(() => ({ rows: [] })),
    db.query(`SELECT decision, count(*) AS count FROM audit_log
      WHERE workspace_id=$1 AND created_at > NOW() - INTERVAL '24 hours' GROUP BY decision`, [workspaceId]).catch(() => ({ rows: [] })),
  ])
  return { recent: recent.rows, stats: stats.rows }
}

async function getActivityEvents(workspaceId: string) {
  const db = pool()
  if (!db) return null
  const { rows } = await db.query(
    `SELECT actor, event_type, payload, created_at FROM activity_events
     WHERE workspace_id=$1 ORDER BY created_at DESC LIMIT 30`, [workspaceId]
  ).catch(() => ({ rows: [] }))
  return rows
}

function getEnvPresence() {
  const vars = [
    'DATABASE_URL', 'REDIS_URL', 'BFF_URL', 'NEXTAUTH_URL', 'AUTH_SECRET',
    'NEXTAUTH_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'RESEND_API_KEY',
    'NEON_API_KEY', 'NEON_PROJECT_ID', 'VERCEL_TOKEN', 'VERCEL_PROJECT_ID',
    'RENDER_API_KEY', 'RENDER_SERVICE_ID_BFF', 'RENDER_SERVICE_ID_AGENT',
    'LANGSMITH_API_KEY', 'MCP_SERVER_URL', 'COPILOTKIT_LICENSE_TOKEN',
    'VERCEL_URL', 'VERCEL_ENV', 'NEXT_PUBLIC_VERCEL_ENV',
  ]
  return Object.fromEntries(vars.map((k) => [k, !!process.env[k]]))
}

async function checkNeon() {
  const key = process.env.NEON_API_KEY
  const pid = process.env.NEON_PROJECT_ID
  if (!key || !pid) return { configured: false }
  const h = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
  const [pRes, bRes] = await Promise.all([
    safeFetch(`https://console.neon.tech/api/v2/projects/${pid}`, { headers: h }),
    safeFetch(`https://console.neon.tech/api/v2/projects/${pid}/branches`, { headers: h }),
  ])
  return { configured: true, project: pRes, branches: bRes }
}

async function checkVercel() {
  const token = process.env.VERCEL_TOKEN
  const pid = process.env.VERCEL_PROJECT_ID
  if (!token || !pid) return { configured: false }
  const h = { Authorization: `Bearer ${token}` }
  const res = await safeFetch(`https://api.vercel.com/v6/deployments?projectId=${pid}&limit=5`, { headers: h })
  return { configured: true, ...res }
}

async function checkRender() {
  const key = process.env.RENDER_API_KEY
  if (!key) return { configured: false }
  const h = { Authorization: `Bearer ${key}`, Accept: 'application/json' }
  const res = await safeFetch('https://api.render.com/v1/services', { headers: h })
  return { configured: true, ...res }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const jar = await cookies()
  const workspaceId = jar.get('crew_project_id')?.value ?? session.user.id

  const [bffInfo, bffHealth, postgres, redis, usage, audit, activity, neon, vercel, render] =
    await Promise.allSettled([
      checkBffInfo(),
      checkBffHealth(),
      checkPostgres(),
      checkRedis(),
      getUsage(workspaceId),
      getAuditLog(workspaceId),
      getActivityEvents(workspaceId),
      checkNeon(),
      checkVercel(),
      checkRender(),
    ])

  const u = (r: PromiseSettledResult<unknown>) =>
    r.status === 'fulfilled' ? r.value : { error: (r.reason as Error)?.message ?? 'unknown' }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    userId: session.user.id,
    workspaceId,
    environment: getEnvPresence(),
    services: {
      bff: { info: u(bffInfo), health: u(bffHealth) },
      postgres: u(postgres),
      redis: u(redis),
    },
    usage: u(usage),
    audit: u(audit),
    activity: u(activity),
    platforms: { neon: u(neon), vercel: u(vercel), render: u(render) },
  })
}
