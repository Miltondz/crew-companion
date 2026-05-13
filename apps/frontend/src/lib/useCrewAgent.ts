'use client'

import { useAgent } from '@copilotkit/react-core/v2'
import { SEED_STATE } from '@/lib/crew/seed'
import type { CrewState } from '@/lib/crew/types'

export function mergeCrewState(raw: unknown): CrewState {
  const partial = raw && typeof raw === 'object' ? (raw as Partial<CrewState>) : {}
  return {
    urgencyPhase: 'normal',
    mascotMood: 'calm',
    mascotMode: 'idle',
    highlightedTaskIds: [],
    ...SEED_STATE,
    ...partial,
  }
}

export function useCrewAgent() {
  const { agent } = useAgent({ agentId: 'crew_agent' })
  const state = mergeCrewState(agent?.state)
  const setState = (updater: (prev: CrewState) => CrewState) => {
    agent?.setState(updater(mergeCrewState(agent?.state)))
  }
  return { agent, state, setState }
}
