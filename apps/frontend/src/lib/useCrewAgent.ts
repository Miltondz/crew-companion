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

export function useCrewAgent() {
  const { agent } = useAgent({ agentId: 'crew_agent' })
  const [dbState, setDbState] = useState<Partial<CrewState>>({})

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then((d: { projects?: Array<{ state_json: unknown }> }) => {
        const stateJson = d.projects?.[0]?.state_json
        if (stateJson && typeof stateJson === 'object') {
          setDbState(stateJson as Partial<CrewState>)
        }
      })
      .catch(() => {})
  }, [])

  // Priority: seed < DB < agent (agent state wins after first chat turn)
  const merged = { ...dbState, ...((agent?.state ?? {}) as Partial<CrewState>) }
  const state = mergeCrewState(merged)

  const setState = useCallback(
    (updater: (prev: CrewState) => CrewState) => {
      const current = mergeCrewState({ ...dbState, ...((agent?.state ?? {}) as Partial<CrewState>) })
      const next = updater(current)
      setDbState(next)
      agent?.setState(next)
    },
    [agent, dbState]
  )

  return { agent, state, setState }
}
