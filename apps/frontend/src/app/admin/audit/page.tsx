'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'

type AuditRow = {
  id: string
  workspace_id: string
  actor_type: string
  actor_id: string
  tool_id: string
  capabilities: string[]
  risk_level: string
  decision: string
  decision_reason: string | null
  outcome: string | null
  outcome_error: string | null
  created_at: string
}

type AuditResponse = { rows: AuditRow[]; total: number; offset: number; limit: number }

const DECISIONS = ['', 'allowed', 'denied', 'pending', 'approved', 'rejected']
const HOURS_OPTIONS = [1, 6, 24, 72, 168]

function ts(v: string) {
  try { return new Date(v).toLocaleString('es', { hour12: false }) } catch { return v }
}

function DecisionBadge({ v }: { v: string }) {
  const cls =
    v === 'allowed' || v === 'approved' ? 'text-emerald-400' :
    v === 'denied' || v === 'rejected' ? 'text-red-400' : 'text-yellow-400'
  return <span className={`text-[10px] font-mono ${cls}`}>{v}</span>
}

function RiskBadge({ v }: { v: string }) {
  const cls =
    v === 'critical' ? 'text-red-400' :
    v === 'high' ? 'text-orange-400' :
    v === 'medium' ? 'text-yellow-400' : 'text-zinc-500'
  return <span className={`text-[10px] font-mono ${cls}`}>{v}</span>
}

export default function AuditPage() {
  const [data, setData] = useState<AuditResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterTool, setFilterTool] = useState('')
  const [filterDecision, setFilterDecision] = useState('')
  const [filterHours, setFilterHours] = useState(24)
  const [offset, setOffset] = useState(0)

  const load = useCallback(async (off: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterTool) params.set('tool', filterTool)
      if (filterDecision) params.set('decision', filterDecision)
      params.set('hours', String(filterHours))
      params.set('offset', String(off))
      const res = await fetch(`/api/debug/audit?${params.toString()}`)
      if (res.status === 401) { window.location.href = '/auth/signin'; return }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json() as AuditResponse)
      setError(null)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [filterTool, filterDecision, filterHours])

  useEffect(() => { setOffset(0); void load(0) }, [load])

  function goPage(dir: number) {
    const next = offset + dir * 100
    setOffset(next)
    void load(next)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono text-sm pb-16">
      <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur px-6 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">Audit Log</span>
        <button
          onClick={() => load(offset)}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          refresh
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 text-xs">
          <input
            value={filterTool}
            onChange={e => setFilterTool(e.target.value)}
            placeholder="tool_id filter"
            className="bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 w-48"
          />
          <select
            value={filterDecision}
            onChange={e => setFilterDecision(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-500"
          >
            {DECISIONS.map(d => <option key={d} value={d}>{d || 'all decisions'}</option>)}
          </select>
          <select
            value={filterHours}
            onChange={e => setFilterHours(Number(e.target.value))}
            className="bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-500"
          >
            {HOURS_OPTIONS.map(h => <option key={h} value={h}>last {h}h</option>)}
          </select>
          {data && <span className="self-center text-zinc-600">{data.total} total</span>}
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-zinc-600 text-left bg-zinc-900">
                <th className="px-3 py-2 font-normal">Timestamp</th>
                <th className="px-3 py-2 font-normal">Tool</th>
                <th className="px-3 py-2 font-normal">Actor</th>
                <th className="px-3 py-2 font-normal">Workspace</th>
                <th className="px-3 py-2 font-normal">Risk</th>
                <th className="px-3 py-2 font-normal">Decision</th>
                <th className="px-3 py-2 font-normal">Outcome</th>
                <th className="px-3 py-2 font-normal">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {data?.rows.map(row => (
                <tr key={row.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="px-3 py-2 text-zinc-600 whitespace-nowrap">{ts(row.created_at)}</td>
                  <td className="px-3 py-2 text-zinc-300">{row.tool_id}</td>
                  <td className="px-3 py-2 text-zinc-500 max-w-[140px] truncate" title={row.actor_id}>{row.actor_type}: {row.actor_id.slice(0, 8)}</td>
                  <td className="px-3 py-2 text-zinc-600 font-mono">{row.workspace_id.slice(0, 8)}</td>
                  <td className="px-3 py-2"><RiskBadge v={row.risk_level} /></td>
                  <td className="px-3 py-2"><DecisionBadge v={row.decision} /></td>
                  <td className="px-3 py-2">
                    {row.outcome
                      ? <span className={row.outcome === 'success' ? 'text-emerald-400' : 'text-red-400'}>{row.outcome}</span>
                      : <span className="text-zinc-700">—</span>}
                    {row.outcome_error && <span className="ml-1 text-red-400">{row.outcome_error.slice(0, 30)}</span>}
                  </td>
                  <td className="px-3 py-2 text-zinc-600 max-w-[200px] truncate" title={row.decision_reason ?? ''}>{row.decision_reason ?? '—'}</td>
                </tr>
              ))}
              {data?.rows.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-zinc-700">sin entradas</td></tr>
              )}
              {loading && !data && (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-zinc-700">cargando…</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > 100 && (
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => goPage(-1)}
              disabled={offset === 0}
              className="flex items-center gap-1 rounded border border-zinc-700 px-3 py-1.5 text-zinc-400 hover:text-zinc-200 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-3 w-3" /> prev
            </button>
            <span className="text-zinc-600">{offset + 1}–{Math.min(offset + 100, data.total)} of {data.total}</span>
            <button
              onClick={() => goPage(1)}
              disabled={offset + 100 >= data.total}
              className="flex items-center gap-1 rounded border border-zinc-700 px-3 py-1.5 text-zinc-400 hover:text-zinc-200 disabled:opacity-40 transition-colors"
            >
              next <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
