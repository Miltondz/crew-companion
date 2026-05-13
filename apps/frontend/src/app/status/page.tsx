'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Download, FileText, ChevronDown, ChevronUp, Wifi, WifiOff, Minus } from 'lucide-react'

type StatusData = {
  timestamp: string
  userId: string
  workspaceId: string
  environment: Record<string, boolean>
  services: {
    bff: { info: Record<string, unknown>; health: Record<string, unknown> }
    postgres: Record<string, unknown>
    redis: Record<string, unknown>
  }
  usage: Record<string, unknown> | null
  audit: { recent: AuditRow[]; stats: { decision: string; count: number }[] } | null
  activity: ActivityRow[] | null
  platforms: {
    neon: Record<string, unknown>
    vercel: Record<string, unknown>
    render: Record<string, unknown>
  }
}

type AuditRow = {
  tool_id: string; actor_type: string; risk_level: string
  decision: string; outcome: string | null; outcome_error: string | null; created_at: string
}
type ActivityRow = { actor: string; event_type: string; payload: Record<string, unknown>; created_at: string }

function dot(ok: boolean | null | undefined, notConfigured?: boolean) {
  if (notConfigured) return <span className="inline-block h-2 w-2 rounded-full bg-zinc-600" />
  if (ok === true) return <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
  if (ok === false) return <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
  return <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" />
}

function ms(v: unknown) {
  return typeof v === 'number' ? `${v}ms` : '—'
}

function fmtBytes(b: unknown) {
  const n = Number(b)
  if (!n) return '—'
  if (n < 1024) return `${n}B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)}KB`
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)}MB`
  return `${(n / 1024 ** 3).toFixed(2)}GB`
}

function ts(v: string) {
  try { return new Date(v).toLocaleTimeString('es', { hour12: false }) } catch { return v }
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 transition-colors text-left"
      >
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">{title}</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-zinc-500" /> : <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  )
}

function ServiceCard({ label, ok, latency, detail, notConfigured }: {
  label: string; ok?: boolean | null; latency?: unknown; detail?: string; notConfigured?: boolean
}) {
  return (
    <div className={`flex flex-col gap-1.5 rounded-lg border p-3.5 ${
      notConfigured ? 'border-zinc-800 bg-zinc-900/50' :
      ok ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-red-400/20 bg-red-400/5'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-300">{label}</span>
        {dot(ok, notConfigured)}
      </div>
      <div className="flex items-center gap-2">
        {notConfigured
          ? <span className="text-xs text-zinc-600">no configurado</span>
          : <>
              <span className={`text-xs font-mono ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {ok ? 'online' : 'offline'}
              </span>
              {latency !== undefined && (
                <span className="text-xs text-zinc-500 font-mono">{ms(latency)}</span>
              )}
            </>
        }
      </div>
      {detail && <p className="text-xs text-zinc-600 truncate">{detail}</p>}
    </div>
  )
}

function BarUsage({ label, value, limit }: { label: string; value: number; limit: number }) {
  const pct = Math.min(100, (value / limit) * 100)
  const color = pct > 80 ? 'bg-red-400' : pct > 60 ? 'bg-yellow-400' : 'bg-emerald-400'
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="font-mono text-zinc-300">{value} / {limit}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-800">
        <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function generateMarkdown(data: StatusData): string {
  const bffOk = (data.services.bff.info as { ok?: boolean })?.ok
  const pgOk = (data.services.postgres as { ok?: boolean })?.ok
  const rdOk = (data.services.redis as { reachable?: boolean })?.reachable
  const lgOk = ((data.services.bff.health as { langgraph?: { ok?: boolean } })?.langgraph)?.ok
  const chat = (data.usage as { chat?: { today?: number; limit?: number } } | null)?.chat

  const lines: string[] = [
    `# Crew Companion — Diagnóstico del Sistema`,
    `Generado: ${data.timestamp}  `,
    `Workspace: ${data.workspaceId}`,
    ``,
    `## Servicios`,
    `| Servicio | Estado | Latencia |`,
    `|----------|--------|---------|`,
    `| BFF | ${bffOk ? 'online' : 'offline'} | ${ms((data.services.bff.info as { latencyMs?: number })?.latencyMs)} |`,
    `| LangGraph | ${lgOk ? 'online' : lgOk === false ? 'offline' : '?'} | — |`,
    `| PostgreSQL | ${pgOk ? 'online' : 'offline'} | ${ms((data.services.postgres as { latencyMs?: number })?.latencyMs)} |`,
    `| Redis | ${rdOk ? 'reachable' : 'unreachable'} | ${ms((data.services.redis as { latencyMs?: number })?.latencyMs)} |`,
    ``,
    `## Agentes CopilotKit`,
  ]

  const agents = ((data.services.bff.info as { data?: { agents?: string[] } })?.data?.agents ?? []) as string[]
  agents.forEach((a) => lines.push(`- ${a}`))

  if (chat) {
    lines.push(``, `## Uso`, `- Chat hoy: ${chat.today} / ${chat.limit}`)
  }

  const tokens = (data.usage as { tokens?: { agent: string; in_tokens: number; out_tokens: number }[] } | null)?.tokens ?? []
  if (tokens.length) {
    lines.push(``, `### Tokens (últimos 7 días)`)
    lines.push(`| Agente | Entrada | Salida |`, `|--------|---------|--------|`)
    tokens.forEach(({ agent, in_tokens, out_tokens }) =>
      lines.push(`| ${agent} | ${Number(in_tokens).toLocaleString()} | ${Number(out_tokens).toLocaleString()} |`))
  }

  if (data.audit?.recent?.length) {
    lines.push(``, `## Audit Log (últimas entradas)`)
    lines.push(`| Tool | Decision | Outcome | Tiempo |`, `|------|----------|---------|--------|`)
    data.audit.recent.slice(0, 10).forEach(({ tool_id, decision, outcome, created_at }) =>
      lines.push(`| ${tool_id} | ${decision} | ${outcome ?? '—'} | ${ts(created_at)} |`))
  }

  lines.push(``, `## Variables de Entorno`)
  Object.entries(data.environment).forEach(([k, v]) =>
    lines.push(`- ${k}: ${v ? '✓' : '✗'}`)
  )

  return lines.join('\n')
}

export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastRefresh, setLastRefresh] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/debug/status')
      if (res.status === 401) { window.location.href = '/auth/signin'; return }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as StatusData
      setData(json)
      setLastRefresh(new Date().toLocaleTimeString('es', { hour12: false }))
      setError(null)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(refresh, 30000)
    return () => clearInterval(id)
  }, [autoRefresh, refresh])

  const downloadJson = () => {
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `crew-status-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  const downloadMd = () => {
    if (!data) return
    const blob = new Blob([generateMarkdown(data)], { type: 'text/markdown' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `crew-status-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
  }

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex items-center gap-3 text-zinc-500">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm font-mono">cargando diagnóstico…</span>
      </div>
    </div>
  )

  if (error && !data) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-red-400 font-mono text-sm mb-3">{error}</p>
        <button onClick={refresh} className="text-xs text-zinc-500 hover:text-zinc-300 underline">reintentar</button>
      </div>
    </div>
  )

  const bff = data!.services.bff
  const pg = data!.services.postgres as Record<string, unknown>
  const rd = data!.services.redis as Record<string, unknown>
  const lgHealth = (bff.health as { langgraph?: Record<string, unknown> })?.langgraph
  const bffOk = (bff.info as { ok?: boolean })?.ok
  const bffLatency = (bff.info as { latencyMs?: number })?.latencyMs
  const agents = ((bff.info as { data?: { agents?: string[] } })?.data?.agents ?? []) as string[]
  const chatUsage = (data!.usage as { chat?: { today?: number; limit?: number; history?: { date: string; count: number }[] } } | null)?.chat
  const tokens = (data!.usage as { tokens?: { agent: string; in_tokens: string | number; out_tokens: string | number }[] } | null)?.tokens ?? []
  const assets = (data!.usage as { assets?: { asset_type: string; count: string | number }[] } | null)?.assets ?? []

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono text-sm pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur px-6 py-3 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-zinc-300 tracking-widest uppercase">Crew Companion — Diagnóstico</span>
          {lastRefresh && (
            <span className="ml-3 text-xs text-zinc-600">actualizado {lastRefresh}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs border transition-colors ${
              autoRefresh ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400' : 'border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'
            }`}
          >
            {autoRefresh ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            auto 30s
          </button>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            refresh
          </button>
          <button onClick={downloadJson} className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors">
            <Download className="h-3 w-3" />JSON
          </button>
          <button onClick={downloadMd} className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors">
            <FileText className="h-3 w-3" />MD
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col gap-4">
        {/* Workspace info */}
        <div className="flex gap-4 text-xs text-zinc-600">
          <span>workspace: <span className="text-zinc-400">{data!.workspaceId}</span></span>
          <span>user: <span className="text-zinc-400">{data!.userId}</span></span>
          <span className="text-zinc-700">{data!.timestamp}</span>
        </div>

        {/* Services */}
        <Section title="Servicios">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ServiceCard
              label="BFF / CopilotKit"
              ok={bffOk}
              latency={bffLatency}
              detail={(bff.health as { bff?: { nodeVersion?: string; uptimeSeconds?: number } })?.bff
                ? `Node ${(bff.health as { bff?: { nodeVersion?: string } }).bff?.nodeVersion} · up ${Math.round(((bff.health as { bff?: { uptimeSeconds?: number } }).bff?.uptimeSeconds ?? 0) / 60)}m`
                : undefined}
            />
            <ServiceCard
              label="LangGraph (Agent)"
              ok={lgHealth ? (lgHealth.ok as boolean) : undefined}
              latency={lgHealth?.latencyMs}
              detail={(lgHealth?.data as { version?: string } | undefined)?.version
                ? `v${(lgHealth?.data as { version?: string }).version}`
                : (lgHealth as { error?: string } | undefined)?.error ?? undefined}
            />
            <ServiceCard
              label="PostgreSQL"
              ok={pg.configured === false ? null : pg.ok as boolean}
              latency={pg.latencyMs}
              notConfigured={pg.configured === false}
              detail={pg.configured
                ? `${pg.version ?? ''} · ${fmtBytes(pg.stats && (pg.stats as Record<string, unknown>).size_bytes)}`
                : 'DATABASE_URL no configurado'}
            />
            <ServiceCard
              label="Redis"
              ok={rd.configured === false ? null : rd.reachable as boolean}
              latency={rd.latencyMs}
              notConfigured={rd.configured === false}
              detail={rd.configured
                ? `${(rd.tls ? 'TLS' : 'TCP')} · ${rd.reachable ? 'reachable' : (rd.error as string | undefined) ?? 'unreachable'}`
                : 'REDIS_URL no configurado'}
            />
          </div>

          {/* Agents registered */}
          {agents.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {agents.map((a) => (
                <span key={a} className="rounded-md bg-indigo-400/10 border border-indigo-400/20 px-2 py-0.5 text-xs text-indigo-300">{a}</span>
              ))}
            </div>
          )}

          {/* BFF memory */}
          {(bff.health as { bff?: { memory?: { rssBytes: number; heapUsedBytes: number; heapTotalBytes: number } } })?.bff?.memory && (() => {
            const mem = (bff.health as { bff: { memory: { rssBytes: number; heapUsedBytes: number; heapTotalBytes: number } } }).bff.memory
            return (
              <div className="mt-3 text-xs text-zinc-600 flex gap-4">
                <span>RSS: <span className="text-zinc-500">{fmtBytes(mem.rssBytes)}</span></span>
                <span>heap: <span className="text-zinc-500">{fmtBytes(mem.heapUsedBytes)}/{fmtBytes(mem.heapTotalBytes)}</span></span>
              </div>
            )
          })()}
        </Section>

        {/* Usage */}
        <Section title="Consumo">
          {chatUsage ? (
            <div className="flex flex-col gap-4">
              <BarUsage label="Chat hoy" value={Number(chatUsage.today ?? 0)} limit={chatUsage.limit ?? 200} />

              {chatUsage.history && chatUsage.history.length > 1 && (
                <div>
                  <p className="text-xs text-zinc-600 mb-2">Historial (7 días)</p>
                  <div className="flex gap-1 items-end h-10">
                    {chatUsage.history.slice().reverse().map(({ date, count }) => {
                      const h = Math.max(4, (count / 200) * 40)
                      return (
                        <div key={date} className="flex flex-col items-center gap-0.5 flex-1" title={`${date}: ${count}`}>
                          <div className="w-full bg-indigo-400/40 rounded-sm" style={{ height: h }} />
                          <span className="text-zinc-700 text-[9px]">{date.slice(5)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {tokens.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-600 mb-2">Tokens por agente (7 días)</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-zinc-600 text-left">
                          <th className="pr-4 pb-1.5 font-normal">Agente</th>
                          <th className="pr-4 pb-1.5 font-normal">Entrada</th>
                          <th className="pb-1.5 font-normal">Salida</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {tokens.map(({ agent, in_tokens, out_tokens }) => (
                          <tr key={agent}>
                            <td className="py-1 pr-4 text-zinc-400">{agent}</td>
                            <td className="py-1 pr-4 text-zinc-300">{Number(in_tokens).toLocaleString()}</td>
                            <td className="py-1 text-zinc-300">{Number(out_tokens).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {assets.length > 0 && (
                <div className="flex gap-4 text-xs text-zinc-500">
                  {assets.map(({ asset_type, count }) => (
                    <span key={asset_type}>{asset_type}: <span className="text-zinc-300">{count}</span></span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-600">Sin datos de consumo (DATABASE_URL no configurado o tablas vacías)</p>
          )}
        </Section>

        {/* Audit log */}
        <Section title="Audit Log — Herramientas del Agente" defaultOpen={false}>
          {data!.audit ? (
            <>
              {data!.audit.stats.length > 0 && (
                <div className="flex gap-3 mb-3">
                  {data!.audit.stats.map(({ decision, count }) => (
                    <span key={decision} className={`text-xs px-2 py-0.5 rounded-md border ${
                      decision === 'allowed' ? 'border-emerald-400/20 text-emerald-400' :
                      decision === 'denied' ? 'border-red-400/20 text-red-400' :
                      'border-yellow-400/20 text-yellow-400'
                    }`}>{decision}: {count} (24h)</span>
                  ))}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-zinc-600 text-left border-b border-zinc-800">
                      <th className="pb-2 pr-3 font-normal">Tool</th>
                      <th className="pb-2 pr-3 font-normal">Risk</th>
                      <th className="pb-2 pr-3 font-normal">Decision</th>
                      <th className="pb-2 pr-3 font-normal">Outcome</th>
                      <th className="pb-2 font-normal">Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {data!.audit.recent.map((row, i) => (
                      <tr key={i}>
                        <td className="py-1.5 pr-3 text-zinc-300">{row.tool_id}</td>
                        <td className="py-1.5 pr-3">
                          <span className={`px-1 rounded text-[10px] ${
                            row.risk_level === 'critical' ? 'text-red-400' :
                            row.risk_level === 'high' ? 'text-orange-400' :
                            row.risk_level === 'medium' ? 'text-yellow-400' : 'text-zinc-500'
                          }`}>{row.risk_level}</span>
                        </td>
                        <td className="py-1.5 pr-3">
                          <span className={`px-1 rounded text-[10px] ${
                            row.decision === 'allowed' ? 'text-emerald-400' :
                            row.decision === 'denied' ? 'text-red-400' : 'text-yellow-400'
                          }`}>{row.decision}</span>
                        </td>
                        <td className="py-1.5 pr-3">
                          {row.outcome
                            ? <span className={row.outcome === 'success' ? 'text-emerald-400' : 'text-red-400'}>{row.outcome}</span>
                            : <span className="text-zinc-700"><Minus className="inline h-3 w-3" /></span>
                          }
                          {row.outcome_error && <span className="ml-1 text-red-400 text-[10px]">{row.outcome_error.slice(0, 40)}</span>}
                        </td>
                        <td className="py-1.5 text-zinc-600">{ts(row.created_at)}</td>
                      </tr>
                    ))}
                    {data!.audit.recent.length === 0 && (
                      <tr><td colSpan={5} className="py-4 text-zinc-700 text-center">sin entradas</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : <p className="text-xs text-zinc-600">Sin datos de audit_log</p>}
        </Section>

        {/* Activity */}
        <Section title="Actividad Reciente" defaultOpen={false}>
          {data!.activity && data!.activity.length > 0 ? (
            <div className="flex flex-col divide-y divide-zinc-800/40">
              {data!.activity.map((row, i) => (
                <div key={i} className="py-2 flex gap-3 text-xs">
                  <span className="text-zinc-700 shrink-0 w-14">{ts(row.created_at)}</span>
                  <span className="text-zinc-500 shrink-0">{row.actor}</span>
                  <span className="text-indigo-300">{row.event_type}</span>
                  <span className="text-zinc-600 truncate">{JSON.stringify(row.payload)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-zinc-600">Sin actividad reciente</p>}
        </Section>

        {/* Platforms */}
        <Section title="Plataformas Externas" defaultOpen={false}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Neon */}
            <div className={`rounded-lg border p-3.5 ${(data!.platforms.neon as { configured?: boolean }).configured ? 'border-zinc-700' : 'border-zinc-800 opacity-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-300">Neon (PostgreSQL)</span>
                {!(data!.platforms.neon as { configured?: boolean }).configured
                  ? <span className="text-[10px] text-zinc-600">NEON_API_KEY</span>
                  : dot((data!.platforms.neon as { project?: { ok?: boolean } }).project?.ok)}
              </div>
              {(data!.platforms.neon as { configured?: boolean }).configured ? (
                <pre className="text-[10px] text-zinc-500 overflow-auto max-h-32 whitespace-pre-wrap">
                  {JSON.stringify(((data!.platforms.neon as { project?: { data?: unknown } }).project?.data) ?? data!.platforms.neon, null, 2).slice(0, 400)}
                </pre>
              ) : <p className="text-xs text-zinc-700">no configurado</p>}
            </div>

            {/* Vercel */}
            <div className={`rounded-lg border p-3.5 ${(data!.platforms.vercel as { configured?: boolean }).configured ? 'border-zinc-700' : 'border-zinc-800 opacity-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-300">Vercel</span>
                {!(data!.platforms.vercel as { configured?: boolean }).configured
                  ? <span className="text-[10px] text-zinc-600">VERCEL_TOKEN</span>
                  : dot((data!.platforms.vercel as { ok?: boolean }).ok)}
              </div>
              {(data!.platforms.vercel as { configured?: boolean }).configured ? (
                <pre className="text-[10px] text-zinc-500 overflow-auto max-h-32 whitespace-pre-wrap">
                  {JSON.stringify((data!.platforms.vercel as { data?: unknown }).data, null, 2)?.slice(0, 400)}
                </pre>
              ) : <p className="text-xs text-zinc-700">no configurado</p>}
            </div>

            {/* Render */}
            <div className={`rounded-lg border p-3.5 ${(data!.platforms.render as { configured?: boolean }).configured ? 'border-zinc-700' : 'border-zinc-800 opacity-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-300">Render</span>
                {!(data!.platforms.render as { configured?: boolean }).configured
                  ? <span className="text-[10px] text-zinc-600">RENDER_API_KEY</span>
                  : dot((data!.platforms.render as { ok?: boolean }).ok)}
              </div>
              {(data!.platforms.render as { configured?: boolean }).configured ? (
                <pre className="text-[10px] text-zinc-500 overflow-auto max-h-32 whitespace-pre-wrap">
                  {JSON.stringify((data!.platforms.render as { data?: unknown }).data, null, 2)?.slice(0, 400)}
                </pre>
              ) : <p className="text-xs text-zinc-700">no configurado</p>}
            </div>
          </div>
          <p className="mt-3 text-[10px] text-zinc-700">
            Para habilitar datos de plataformas: configure NEON_API_KEY + NEON_PROJECT_ID, VERCEL_TOKEN + VERCEL_PROJECT_ID, RENDER_API_KEY en las variables de entorno del frontend.
          </p>
        </Section>

        {/* DB tables */}
        {(pg.tables as unknown[])?.length > 0 && (
          <Section title="Tablas PostgreSQL" defaultOpen={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-zinc-600 text-left border-b border-zinc-800">
                    <th className="pb-2 pr-4 font-normal">Tabla</th>
                    <th className="pb-2 pr-4 font-normal">Filas</th>
                    <th className="pb-2 pr-4 font-normal">Muertas</th>
                    <th className="pb-2 font-normal">Tamaño</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {(pg.tables as { tablename: string; n_live_tup: number; n_dead_tup: number; size_bytes: number }[]).map((t) => (
                    <tr key={t.tablename}>
                      <td className="py-1.5 pr-4 text-zinc-300">{t.tablename}</td>
                      <td className="py-1.5 pr-4 text-zinc-400">{Number(t.n_live_tup).toLocaleString()}</td>
                      <td className="py-1.5 pr-4 text-zinc-600">{Number(t.n_dead_tup).toLocaleString()}</td>
                      <td className="py-1.5 text-zinc-500">{fmtBytes(t.size_bytes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* Environment */}
        <Section title="Variables de Entorno" defaultOpen={false}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-1.5">
            {Object.entries(data!.environment).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className={v ? 'text-emerald-400' : 'text-zinc-700'}>
                  {v ? '✓' : '✗'}
                </span>
                <span className={`text-xs ${v ? 'text-zinc-400' : 'text-zinc-600'}`}>{k}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* BFF env */}
        {(bff.health as { bff?: { env?: Record<string, boolean> } })?.bff?.env && (
          <Section title="Variables BFF (servidor)" defaultOpen={false}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-1.5">
              {Object.entries((bff.health as { bff: { env: Record<string, boolean> } }).bff.env).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className={v ? 'text-emerald-400' : 'text-zinc-700'}>{v ? '✓' : '✗'}</span>
                  <span className={`text-xs ${v ? 'text-zinc-400' : 'text-zinc-600'}`}>{k}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Raw JSON */}
        <Section title="Raw JSON" defaultOpen={false}>
          <pre className="text-[10px] text-zinc-500 overflow-auto max-h-96 whitespace-pre-wrap leading-relaxed">
            {JSON.stringify(data, null, 2)}
          </pre>
        </Section>
      </div>
    </div>
  )
}
