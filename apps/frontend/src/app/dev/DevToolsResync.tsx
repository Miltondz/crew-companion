'use client'

import { useState } from 'react'
import { useCrewAgent } from '@/lib/useCrewAgent'

export function DevToolsResync() {
  const { state, workspaceId, bumpVersion, getVersion } = useCrewAgent()
  const [inputId, setInputId] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const targetId = inputId.trim() || workspaceId || ''

  async function handleResync() {
    if (!targetId) { setResult('No workspace ID'); return }
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch(`/api/projects/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state_json: state, expected_version: getVersion() }),
      })
      const body = await res.json() as Record<string, unknown>
      if (res.status === 409) {
        setResult(`409 conflict — server version ${String(body.current_version)}`)
      } else if (res.ok) {
        if (typeof body.version === 'number') bumpVersion(body.version)
        setResult(`200 ok — new version ${String(body.version ?? '?')}`)
      } else {
        setResult(`${res.status} ${JSON.stringify(body)}`)
      }
    } catch (e: unknown) {
      setResult(`error: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-zinc-700 p-4 max-w-md">
      <h2 className="text-zinc-300 text-xs font-semibold uppercase tracking-widest">Force resync local → DB</h2>
      <div className="flex gap-2">
        <input
          value={inputId}
          onChange={e => setInputId(e.target.value)}
          placeholder={workspaceId ?? 'workspace-id'}
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
        />
        <button
          onClick={handleResync}
          disabled={busy}
          className="rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 px-4 py-1.5 text-xs text-white transition-colors"
        >
          {busy ? 'syncing…' : 'Sync'}
        </button>
      </div>
      {result && (
        <p className={`text-xs font-mono ${result.startsWith('200') ? 'text-emerald-400' : 'text-red-400'}`}>
          {result}
        </p>
      )}
    </section>
  )
}
