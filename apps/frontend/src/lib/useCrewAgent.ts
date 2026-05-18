'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAgent } from '@copilotkit/react-core/v2'
import { makeSeedState } from '@/lib/crew/seed'
import type { CrewState } from '@/lib/crew/types'

export function mergeCrewState(raw: unknown): CrewState {
  const partial = raw && typeof raw === 'object' ? (raw as Partial<CrewState>) : {}
  return {
    urgencyPhase: 'normal',
    mascotMood: 'calm',
    mascotMode: 'idle',
    highlightedTaskIds: [],
    ...makeSeedState(),
    ...partial,
  }
}

const LS_PREFIX = 'crew-state-v2:'
const LEGACY_KEY = 'crew-state-v1'
const CACHE_TTL_MS = 30_000

interface CacheEntry {
  state: Partial<CrewState>
  ts: number
}

const memCache: Map<string, CacheEntry> = new Map()

function getLsKey(workspaceId: string | null): string | null {
  return workspaceId ? `${LS_PREFIX}${workspaceId}` : null
}

function readLs(workspaceId: string | null): Partial<CrewState> | null {
  const key = getLsKey(workspaceId)
  if (!key || typeof window === 'undefined') return null
  try {
    const s = localStorage.getItem(key)
    if (s) return JSON.parse(s) as Partial<CrewState>
  } catch {}
  return null
}

function writeLs(workspaceId: string | null, state: Partial<CrewState>) {
  const key = getLsKey(workspaceId)
  if (!key || typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(state)) } catch {}
}

export function useCrewAgent() {
  const { agent } = useAgent({ agentId: 'crew_agent' })

  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [dbState, setDbState] = useState<Partial<CrewState>>({})
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const identityRes = await fetch('/api/me/identity').then(r => r.json()).catch(() => null)
      const currentWsId = identityRes?.workspaceId ?? null
      if (cancelled) return
      setWorkspaceId(currentWsId)

      // 1. Try in-memory cache for this workspace — only if fresh (within TTL)
      const cached = (currentWsId ? memCache.get(currentWsId) : undefined) ?? null
      if (cached !== null && Date.now() - cached.ts < CACHE_TTL_MS) {
        setDbState(cached.state)
        setHydrated(true)
        return
      }

      // 2. Try workspace-specific localStorage (stale cache — use as placeholder, still fetch)
      const fromLs = readLs(currentWsId)
      if (fromLs) {
        if (currentWsId) memCache.set(currentWsId, { state: fromLs, ts: 0 })
        // Do NOT setDbState here — we'll replace it after the server fetch below
      }

      // 3. Fetch fresh from server (always, to stay in sync)
      try {
        const projectsRes = await fetch('/api/projects').then(r => r.json())
        if (cancelled) return
        const projects: Array<{ workspace_id: string; state_json: unknown }> = projectsRes?.projects ?? []
        const proj = currentWsId
          ? projects.find(p => p.workspace_id === currentWsId)
          : projects[0]
        const stateJson = proj?.state_json
        if (stateJson && typeof stateJson === 'object') {
          const partial = stateJson as Partial<CrewState>
          setDbState(partial)
          if (currentWsId) memCache.set(currentWsId, { state: partial, ts: Date.now() })
          writeLs(currentWsId, partial)
        } else if (fromLs) {
          setDbState(fromLs)
          if (currentWsId) memCache.set(currentWsId, { state: fromLs, ts: Date.now() })
        }
      } catch {
        if (cancelled) return
        if (fromLs) {
          setDbState(fromLs)
          if (currentWsId) memCache.set(currentWsId, { state: fromLs, ts: Date.now() })
        }
      }

      // 4. One-time migration: drop legacy single-key state
      if (typeof window !== 'undefined') {
        try { localStorage.removeItem(LEGACY_KEY) } catch {}
      }

      setHydrated(true)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const merged = { ...dbState, ...((agent?.state ?? {}) as Partial<CrewState>) }
  const state = mergeCrewState(merged)

  const setState = useCallback(
    (updater: (prev: CrewState) => CrewState) => {
      const current = mergeCrewState({ ...dbState, ...((agent?.state ?? {}) as Partial<CrewState>) })
      const next = updater(current)
      setDbState(next)
      if (workspaceId) memCache.set(workspaceId, { state: next, ts: Date.now() })
      writeLs(workspaceId, next)
      agent?.setState(next)
    },
    [agent, dbState, workspaceId],
  )

  return { agent, state, setState, hydrated, workspaceId }
}
