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

const LS_KEY = 'crew-state-v1'
let memCache: Partial<CrewState> | null = null

export function useCrewAgent() {
  const { agent } = useAgent({ agentId: 'crew_agent' })

  const [dbState, setDbState] = useState<Partial<CrewState>>(() => {
    if (memCache) return memCache
    try {
      const s = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null
      if (s) {
        const parsed = JSON.parse(s) as Partial<CrewState>
        memCache = parsed
        return parsed
      }
    } catch {}
    return {}
  })

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then((d: { projects?: Array<{ state_json: unknown }> }) => {
        const stateJson = d.projects?.[0]?.state_json
        if (stateJson && typeof stateJson === 'object') {
          setDbState(prev => {
            if (Object.keys(prev).length === 0) return stateJson as Partial<CrewState>
            return prev
          })
        }
      })
      .catch(() => {})
  }, [])

  const merged = { ...dbState, ...((agent?.state ?? {}) as Partial<CrewState>) }
  const state = mergeCrewState(merged)

  const setState = useCallback(
    (updater: (prev: CrewState) => CrewState) => {
      const current = mergeCrewState({ ...dbState, ...((agent?.state ?? {}) as Partial<CrewState>) })
      const next = updater(current)
      setDbState(next)
      memCache = next
      agent?.setState(next)
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch {}
    },
    [agent, dbState],
  )

  return { agent, state, setState }
}
