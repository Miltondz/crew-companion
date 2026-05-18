'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAgent } from '@copilotkit/react-core/v2'
import { toast } from 'sonner'
import { makeSeedState } from '@/lib/crew/seed'
import type { CrewState } from '@/lib/crew/types'

export function mergeCrewState(raw: unknown): CrewState {
  const partial = raw && typeof raw === 'object' ? (raw as Partial<CrewState>) : {}
  return {
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

const PERSISTABLE_KEYS: ReadonlyArray<keyof CrewState> = [
  'members',
  'currentMemberId',
  'tasks',
  'milestones',
  'blockers',
  'sharedDocuments',
  'openDocumentIds',
  // urgencyPhase is always derived from milestone deadline — never stored (invariant 3)
  'mascotMood',
  'mascotMode',
  'activeMilestoneId',
  'actorRole',
  'highlightedTaskIds',
  'projectConfig',
  'onboarded',
]

function stripNonSerializable(state: Partial<CrewState>): Partial<CrewState> {
  const out: Partial<CrewState> = {}
  for (const key of PERSISTABLE_KEYS) {
    if (key in state) {
      // Cast required because TypeScript can't narrow Partial<CrewState>[key] from keyof
      (out as Record<string, unknown>)[key] = (state as Record<string, unknown>)[key]
    }
  }
  return out
}

const ENTITY_COLLECTIONS = ['members', 'tasks', 'milestones', 'blockers', 'documents'] as const
type EntityCollection = typeof ENTITY_COLLECTIONS[number]

function countEntities(s: Partial<CrewState>): Record<EntityCollection, number> {
  return {
    members: (s.members ?? []).length,
    tasks: (s.tasks ?? []).length,
    milestones: (s.milestones ?? []).length,
    blockers: (s.blockers ?? []).length,
    documents: (s.sharedDocuments ?? []).length,
  }
}

function mergeById<T extends { id: string }>(local: T[] = [], server: T[] = []): T[] {
  const serverIds = new Set(server.map(s => s.id))
  const localOnly = local.filter(l => !serverIds.has(l.id))
  return [...server, ...localOnly]
}

function mergeOnConflict(local: Partial<CrewState>, server: Partial<CrewState>): { merged: Partial<CrewState>; hadLocalOnly: boolean } {
  const mergedMembers = mergeById(local.members, server.members)
  const mergedTasks = mergeById(local.tasks, server.tasks)
  const mergedMilestones = mergeById(local.milestones, server.milestones)
  const mergedBlockers = mergeById(local.blockers, server.blockers)
  const mergedDocs = mergeById(local.sharedDocuments, server.sharedDocuments)

  const serverMemberIds = new Set((server.members ?? []).map(m => m.id))
  const serverTaskIds = new Set((server.tasks ?? []).map(t => t.id))
  const serverMilestoneIds = new Set((server.milestones ?? []).map(m => m.id))
  const serverBlockerIds = new Set((server.blockers ?? []).map(b => b.id))
  const serverDocIds = new Set((server.sharedDocuments ?? []).map(d => d.id))

  const hadLocalOnly =
    (local.members ?? []).some(m => !serverMemberIds.has(m.id)) ||
    (local.tasks ?? []).some(t => !serverTaskIds.has(t.id)) ||
    (local.milestones ?? []).some(m => !serverMilestoneIds.has(m.id)) ||
    (local.blockers ?? []).some(b => !serverBlockerIds.has(b.id)) ||
    (local.sharedDocuments ?? []).some(d => !serverDocIds.has(d.id))

  return {
    merged: {
      ...server,
      members: mergedMembers,
      tasks: mergedTasks,
      milestones: mergedMilestones,
      blockers: mergedBlockers,
      sharedDocuments: mergedDocs,
    },
    hadLocalOnly,
  }
}

export function useCrewAgent() {
  const { agent } = useAgent({ agentId: 'crew_agent' })

  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [dbState, setDbState] = useState<Partial<CrewState>>({})
  const [hydrated, setHydrated] = useState(false)
  const writeBackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasSyncedInitial = useRef(false)
  const workspaceIdRef = useRef<string | null>(null)
  const pendingStateRef = useRef<Partial<CrewState> | null>(null)
  const lastToastAt = useRef<number>(0)
  const versionRef = useRef<number>(1)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const identityRes = await fetch('/api/me/identity').then(r => r.json()).catch(() => null)
      const currentWsId = identityRes?.workspaceId ?? null
      if (cancelled) return
      setWorkspaceId(currentWsId)
      workspaceIdRef.current = currentWsId

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
        const projects: Array<{ workspace_id: string; state_json: unknown; version?: number }> = projectsRes?.projects ?? []
        const proj = currentWsId
          ? projects.find(p => p.workspace_id === currentWsId)
          : projects[0]
        if (proj?.version !== undefined) versionRef.current = proj.version
        const stateJson = proj?.state_json
        if (stateJson && typeof stateJson === 'object') {
          const serverPartial = stateJson as Partial<CrewState>
          setDbState(serverPartial)
          if (currentWsId) memCache.set(currentWsId, { state: serverPartial, ts: Date.now() })
          writeLs(currentWsId, serverPartial)

          // 3a. Initial catch-up: if local has more entities than server, push local up
          if (!hasSyncedInitial.current && fromLs && currentWsId) {
            hasSyncedInitial.current = true
            const localCounts = countEntities(fromLs)
            const serverCounts = countEntities(serverPartial)
            const deltas: Partial<Record<EntityCollection, { local: number; server: number }>> = {}
            let needsSync = false
            for (const col of ENTITY_COLLECTIONS) {
              if (localCounts[col] > serverCounts[col]) {
                deltas[col] = { local: localCounts[col], server: serverCounts[col] }
                needsSync = true
              }
            }
            if (needsSync) {
              console.info('[useCrewAgent] initial state mismatch, pushing local to server', { workspaceId: currentWsId, deltas })
              void fetch(`/api/projects/${currentWsId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state_json: stripNonSerializable(fromLs), expected_version: versionRef.current }),
                keepalive: true,
              }).then(async res => {
                if (res.status === 409) {
                  const body = await res.json() as { current_version: number; current_state: Partial<CrewState> }
                  const { merged, hadLocalOnly } = mergeOnConflict(fromLs!, body.current_state)
                  versionRef.current = body.current_version
                  setDbState(merged)
                  if (currentWsId) memCache.set(currentWsId, { state: merged, ts: Date.now() })
                  writeLs(currentWsId, merged)
                  toast.info(hadLocalOnly ? 'Sincronizado: cambios fusionados con servidor' : 'Estado actualizado desde otra sesión')
                  if (hadLocalOnly) {
                    void fetch(`/api/projects/${currentWsId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ state_json: stripNonSerializable(merged), expected_version: body.current_version }),
                      keepalive: true,
                    }).then(async retryRes => {
                      if (retryRes.ok) {
                        const retryBody = await retryRes.json() as { version?: number }
                        if (retryBody.version !== undefined) versionRef.current = retryBody.version
                      }
                    }).catch(() => {})
                  }
                } else if (res.ok) {
                  const body = await res.json() as { version?: number }
                  if (body.version !== undefined) versionRef.current = body.version
                }
              }).catch(err => {
              console.error('[useCrewAgent] initial sync failed', err)
              const now = Date.now()
              if (now - lastToastAt.current > 30_000) {
                lastToastAt.current = now
                toast.error('Cambios no guardados en servidor', { description: 'Reintenta o recarga la página.' })
              }
            })
            }
          }
        } else if (fromLs) {
          setDbState(fromLs)
          if (currentWsId) memCache.set(currentWsId, { state: fromLs, ts: Date.now() })
          if (!hasSyncedInitial.current) hasSyncedInitial.current = true
        }
      } catch {
        if (cancelled) return
        if (fromLs) {
          setDbState(fromLs)
          if (currentWsId) memCache.set(currentWsId, { state: fromLs, ts: Date.now() })
        }
        if (!hasSyncedInitial.current) hasSyncedInitial.current = true
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

  useEffect(() => {
    return () => {
      // Flush pending debounced PATCH immediately on unmount so last edit isn't lost
      if (writeBackTimeout.current) {
        clearTimeout(writeBackTimeout.current)
        writeBackTimeout.current = null
        const wsId = workspaceIdRef.current
        const pending = pendingStateRef.current
        if (wsId && pending) {
          void fetch(`/api/projects/${wsId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state_json: stripNonSerializable(pending), expected_version: versionRef.current }),
            keepalive: true,
          })
        }
      }
    }
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
      if (workspaceId) {
        const stripped = stripNonSerializable(next)
        pendingStateRef.current = stripped
        workspaceIdRef.current = workspaceId
        if (writeBackTimeout.current) clearTimeout(writeBackTimeout.current)
        const expectedVersion = versionRef.current
        writeBackTimeout.current = setTimeout(() => {
          writeBackTimeout.current = null
          pendingStateRef.current = null
          void fetch(`/api/projects/${workspaceId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state_json: stripped, expected_version: expectedVersion }),
          }).then(async res => {
            if (res.status === 409) {
              const body = await res.json() as { current_version: number; current_state: Partial<CrewState> }
              const wsId = workspaceIdRef.current
              const { merged, hadLocalOnly } = mergeOnConflict(stripped, body.current_state)
              versionRef.current = body.current_version
              setDbState(merged)
              if (wsId) memCache.set(wsId, { state: merged, ts: Date.now() })
              writeLs(wsId, merged)
              toast.info(hadLocalOnly ? 'Sincronizado: cambios fusionados con servidor' : 'Estado actualizado desde otra sesión')
              if (hadLocalOnly && wsId) {
                void fetch(`/api/projects/${wsId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ state_json: stripNonSerializable(merged), expected_version: body.current_version }),
                }).then(async retryRes => {
                  if (retryRes.ok) {
                    const retryBody = await retryRes.json() as { version?: number }
                    if (retryBody.version !== undefined) versionRef.current = retryBody.version
                  }
                }).catch(() => {})
              }
            } else if (res.ok) {
              const body = await res.json() as { version?: number }
              if (body.version !== undefined) versionRef.current = body.version
            }
          }).catch(err => {
            console.error('[useCrewAgent] persist failed', err)
            const now = Date.now()
            if (now - lastToastAt.current > 30_000) {
              lastToastAt.current = now
              toast.error('Cambios no guardados en servidor', { description: 'Reintenta o recarga la página.' })
            }
          })
        }, 500)
      }
    },
    [agent, dbState, workspaceId],
  )

  const bumpVersion = (v: number) => { versionRef.current = v }
  const getVersion = () => versionRef.current

  return { agent, state, setState, hydrated, workspaceId, bumpVersion, getVersion }
}
