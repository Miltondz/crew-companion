'use client'

import { useCallback } from 'react'
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
  const state = mergeCrewState(agent?.state)
  const setState = useCallback(
    (updater: (prev: CrewState) => CrewState) => {
      agent?.setState(updater(mergeCrewState(agent?.state)))
    },
    [agent]
  )
  return { agent, state, setState }
}
