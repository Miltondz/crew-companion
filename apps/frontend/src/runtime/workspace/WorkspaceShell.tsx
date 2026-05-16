'use client'

import { useEffect, type ReactNode } from 'react'
import { useLayoutEngine } from './useLayoutEngine'
import { usePhaseSync } from './usePhaseSync'
import { pinningStore } from './pinning'
import { CommandSurfaceRegion } from './regions/CommandSurfaceRegion'
import { ContextRailRegion } from './regions/ContextRailRegion'
import { AgentRailRegion } from './regions/AgentRailRegion'
import { ActivityStreamRegion } from './regions/ActivityStreamRegion'
import { AmbientOverlayRegion } from './regions/AmbientOverlayRegion'
import type { UrgencyPhase } from '@/lib/crew/types'

interface Props {
  phase: UrgencyPhase
  agentRail: ReactNode
  children: ReactNode
  habitat?: ReactNode
  onNewChat?: () => void
}

export function WorkspaceShell({ phase, agentRail, children, habitat, onNewChat }: Props) {
  const layout = useLayoutEngine()
  usePhaseSync(phase)

  useEffect(() => {
    pinningStore.hydrateIntoEngine()
  }, [])

  return (
    <div data-phase={phase} className={`workspace-shell flex h-screen flex-col phase-bg-${phase}`}>
      <CommandSurfaceRegion mounts={layout['command-surface'].mounts} />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden min-w-0">
            <div className="flex flex-1 overflow-hidden">
              {children}
            </div>
          </div>
          <ContextRailRegion mounts={layout['context-rail'].mounts} />
        </div>
        <AgentRailRegion onNewChat={onNewChat}>{agentRail}</AgentRailRegion>
      </div>
      <ActivityStreamRegion mounts={layout['activity-stream'].mounts} />
      <AmbientOverlayRegion mounts={layout['ambient-overlay'].mounts} />

      {/* habitat slot unused — leader page renders compact mascot in header */}
    </div>
  )
}
