'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAgent } from '@copilotkit/react-core/v2'
import { signOut } from 'next-auth/react'
import { toast } from 'sonner'
import { makeSeedState } from '@/lib/crew/seed'
import type { CrewState } from '@/lib/crew/types'

let sessionExpiredHandled = false
function handleSessionExpired(): void {
  if (sessionExpiredHandled) return
  sessionExpiredHandled = true
  toast.error('Sesión expirada — redirigiendo a inicio de sesión')
  void signOut({ callbackUrl: '/auth/signin?reason=expired' })
}

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

const MAX_LS_WORKSPACES = 10

function pruneOldestLsWorkspace(): void {
  if (typeof window === 'undefined') return
  const keys: Array<{ key: string; ts: number }> = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k || !k.startsWith(LS_PREFIX)) continue
    try {
      const raw = localStorage.getItem(k)
      const parsed = raw ? JSON.parse(raw) as { __ts?: number } : null
      keys.push({ key: k, ts: typeof parsed?.__ts === 'number' ? parsed.__ts : 0 })
    } catch {
      keys.push({ key: k, ts: 0 })
    }
  }
  if (keys.length <= MAX_LS_WORKSPACES) return
  keys.sort((a, b) => a.ts - b.ts)
  const toRemove = keys.slice(0, keys.length - MAX_LS_WORKSPACES)
  for (const { key } of toRemove) {
    try { localStorage.removeItem(key) } catch {}
  }
}

function writeLs(workspaceId: string | null, state: Partial<CrewState>) {
  const key = getLsKey(workspaceId)
  if (!key || typeof window === 'undefined') return
  const stamped = { ...state, __ts: Date.now() }
  try {
    localStorage.setItem(key, JSON.stringify(stamped))
  } catch (err) {
    if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      pruneOldestLsWorkspace()
      try { localStorage.setItem(key, JSON.stringify(stamped)) } catch {}
    }
  }
  pruneOldestLsWorkspace()
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

export interface CrewIdentity {
  userId: string | null
  workspaceId: string | null
  memberId: string | null
  name: string | null
  email: string | null
  role: 'leader' | 'member' | null
}

const NULL_IDENTITY: CrewIdentity = {
  userId: null,
  workspaceId: null,
  memberId: null,
  name: null,
  email: null,
  role: null,
}

export function useCrewAgent() {
  const { agent } = useAgent({ agentId: 'crew_agent' })

  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [identity, setIdentity] = useState<CrewIdentity>(NULL_IDENTITY)
  const [dbState, setDbState] = useState<Partial<CrewState>>({})
  const [hydrated, setHydrated] = useState(false)
  const writeBackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasSyncedInitial = useRef(false)
  const workspaceIdRef = useRef<string | null>(null)
  const pendingStateRef = useRef<Partial<CrewState> | null>(null)
  const lastToastAt = useRef<number>(0)
  const versionRef = useRef<number>(1)
  const dbStateRef = useRef<Partial<CrewState>>({})

  useEffect(() => {
    let cancelled = false
    async function load() {
      const identityRes = await fetch('/api/me/identity').then(r => r.json()).catch(() => null)
      const currentWsId = identityRes?.workspaceId ?? null
      if (cancelled) return
      setWorkspaceId(currentWsId)
      workspaceIdRef.current = currentWsId
      setIdentity({
        userId: identityRes?.userId ?? null,
        workspaceId: currentWsId,
        memberId: identityRes?.memberId ?? null,
        name: identityRes?.name ?? null,
        email: identityRes?.email ?? null,
        role: identityRes?.role ?? null,
      })

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
                if (cancelled) return
                if (workspaceIdRef.current !== currentWsId) return
                if (res.status === 401) { handleSessionExpired(); return }
                if (res.status === 409) {
                  const body = await res.json() as { current_version: number; current_state: Partial<CrewState> }
                  if (cancelled) return
                  if (workspaceIdRef.current !== currentWsId) return
                  const { merged, hadLocalOnly } = mergeOnConflict(fromLs!, body.current_state)
                  versionRef.current = body.current_version
                  setDbState(merged)
                  memCache.set(currentWsId, { state: merged, ts: Date.now() })
                  writeLs(currentWsId, merged)
                  toast.info(hadLocalOnly ? 'Sincronizado: cambios fusionados con servidor' : 'Estado actualizado desde otra sesión')
                  if (hadLocalOnly) {
                    void fetch(`/api/projects/${currentWsId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ state_json: stripNonSerializable(merged), expected_version: body.current_version }),
                      keepalive: true,
                    }).then(async retryRes => {
                      if (cancelled) return
                      if (workspaceIdRef.current !== currentWsId) return
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
                if (cancelled) return
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
    dbStateRef.current = dbState
  }, [dbState])

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
      const callTimeWorkspaceId = workspaceIdRef.current
      if (!callTimeWorkspaceId) return
      const current = mergeCrewState({ ...dbState, ...((agent?.state ?? {}) as Partial<CrewState>) })
      const next = updater(current)
      setDbState(next)
      memCache.set(callTimeWorkspaceId, { state: next, ts: Date.now() })
      writeLs(callTimeWorkspaceId, next)
      agent?.setState(next)
      const stripped = stripNonSerializable(next)
      pendingStateRef.current = stripped
      if (writeBackTimeout.current) clearTimeout(writeBackTimeout.current)
      const expectedVersion = versionRef.current
      writeBackTimeout.current = setTimeout(() => {
        writeBackTimeout.current = null
        pendingStateRef.current = null
        if (workspaceIdRef.current !== callTimeWorkspaceId) return
        // Capture rollback snapshot at fire time — after debounce consolidates all queued setState calls
        const rollbackTo = dbStateRef.current
        void fetch(`/api/projects/${callTimeWorkspaceId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state_json: stripped, expected_version: expectedVersion }),
        }).then(async res => {
          if (workspaceIdRef.current !== callTimeWorkspaceId) return
          if (res.status === 401) { handleSessionExpired(); return }
          if (res.status === 409) {
            const body = await res.json() as { current_version: number; current_state: Partial<CrewState> }
            if (workspaceIdRef.current !== callTimeWorkspaceId) return
            const { merged, hadLocalOnly } = mergeOnConflict(stripped, body.current_state)
            versionRef.current = body.current_version
            setDbState(merged)
            memCache.set(callTimeWorkspaceId, { state: merged, ts: Date.now() })
            writeLs(callTimeWorkspaceId, merged)
            toast.info(hadLocalOnly ? 'Sincronizado: cambios fusionados con servidor' : 'Estado actualizado desde otra sesión')
            if (hadLocalOnly) {
              void fetch(`/api/projects/${callTimeWorkspaceId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state_json: stripNonSerializable(merged), expected_version: body.current_version }),
              }).then(async retryRes => {
                if (workspaceIdRef.current !== callTimeWorkspaceId) return
                if (retryRes.ok) {
                  const retryBody = await retryRes.json() as { version?: number }
                  if (retryBody.version !== undefined) versionRef.current = retryBody.version
                }
              }).catch(() => {})
            }
          } else if (res.ok) {
            const body = await res.json() as { version?: number }
            if (body.version !== undefined) versionRef.current = body.version
          } else {
            setDbState(rollbackTo)
            memCache.set(callTimeWorkspaceId, { state: rollbackTo, ts: Date.now() })
            writeLs(callTimeWorkspaceId, rollbackTo)
            const now = Date.now()
            if (now - lastToastAt.current > 30_000) {
              lastToastAt.current = now
              toast.error('Cambios no guardados — UI revertida', { description: 'Recarga para sincronizar' })
            }
          }
        }).catch(err => {
          if (workspaceIdRef.current !== callTimeWorkspaceId) return
          setDbState(rollbackTo)
          memCache.set(callTimeWorkspaceId, { state: rollbackTo, ts: Date.now() })
          writeLs(callTimeWorkspaceId, rollbackTo)
          console.error('[useCrewAgent] persist failed', err)
          const now = Date.now()
          if (now - lastToastAt.current > 30_000) {
            lastToastAt.current = now
            toast.error('Cambios no guardados — UI revertida', { description: 'Recarga para sincronizar' })
          }
        })
      }, 500)
    },
    [agent, dbState],
  )

  const bumpVersion = (v: number) => { versionRef.current = v }
  const getVersion = () => versionRef.current

  return { agent, state, setState, hydrated, workspaceId, identity, bumpVersion, getVersion }
}
