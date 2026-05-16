'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { useLayoutEngine } from './useLayoutEngine'
import { usePhaseSync } from './usePhaseSync'
import { pinningStore } from './pinning'
import { CommandSurfaceRegion } from './regions/CommandSurfaceRegion'
import { AgentRailRegion } from './regions/AgentRailRegion'
import { ActivityStreamRegion } from './regions/ActivityStreamRegion'
import type { ActivityEvent } from '@/lib/activity'
import { AmbientOverlayRegion } from './regions/AmbientOverlayRegion'
import type { UrgencyPhase } from '@/lib/crew/types'
import type { HabitatComponentProps } from '@/components/companion/Habitat'

interface CommandSurfaceSlots {
  phaseChip?: ReactNode
  milestoneTitle?: string
  countdown?: ReactNode
  blockerBadge?: ReactNode
  memberAvatars?: ReactNode
  onCommandPalette?: () => void
  onResetLayout?: () => void
}

interface Props {
  phase: UrgencyPhase
  agentRail: ReactNode
  children: ReactNode
  onNewChat?: () => void
  user?: { name: string; role: string; avatar?: string }
  mascotProps?: Omit<HabitatComponentProps, 'sidebar'>
  commandSurface?: CommandSurfaceSlots
  activityEvents?: ActivityEvent[]
}

export function WorkspaceShell({ phase, agentRail, children, onNewChat, user, mascotProps, commandSurface, activityEvents }: Props) {
  const layout = useLayoutEngine()
  usePhaseSync(phase)

  const isResizing = useRef(false)

  useEffect(() => {
    pinningStore.hydrateIntoEngine()
  }, [])

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sb-width') : null
    if (saved) document.documentElement.style.setProperty('--sb-width', saved)
  }, [])

  function startResize(e: React.PointerEvent) {
    isResizing.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!isResizing.current) return
    const newWidth = Math.max(260, Math.min(440, e.clientX))
    document.documentElement.style.setProperty('--sb-width', `${newWidth}px`)
  }

  function stopResize() {
    if (!isResizing.current) return
    isResizing.current = false
    const w = getComputedStyle(document.documentElement).getPropertyValue('--sb-width').trim()
    try { localStorage.setItem('sb-width', w) } catch {}
  }

  return (
    <div data-phase={phase} className="workspace-shell flex h-screen">
      <aside
        style={{ width: 'var(--sb-width)' }}
        className="flex-shrink-0 flex flex-col h-full border-r border-white/10 bg-[var(--bg-surface)] overflow-hidden relative"
      >
        <AgentRailRegion onNewChat={onNewChat} user={user} phase={phase} mascotProps={mascotProps}>
          {agentRail}
        </AgentRailRegion>
      </aside>

      <div
        className="w-1 cursor-col-resize flex-shrink-0 hover:bg-[var(--phase-glow,#b89450)]/30 active:bg-[var(--phase-glow,#b89450)]/50 transition-colors"
        onPointerDown={startResize}
        onPointerMove={onPointerMove}
        onPointerUp={stopResize}
        onPointerCancel={stopResize}
      />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <CommandSurfaceRegion
          mounts={layout['command-surface'].mounts}
          phaseChip={commandSurface?.phaseChip}
          milestoneTitle={commandSurface?.milestoneTitle}
          countdown={commandSurface?.countdown}
          blockerBadge={commandSurface?.blockerBadge}
          memberAvatars={commandSurface?.memberAvatars}
          onCommandPalette={commandSurface?.onCommandPalette}
          onResetLayout={commandSurface?.onResetLayout}
        />

        <div className="flex flex-1 overflow-hidden">
          {children}
        </div>

        <ActivityStreamRegion mounts={layout['activity-stream'].mounts} events={activityEvents} />
      </div>

      <AmbientOverlayRegion mounts={layout['ambient-overlay'].mounts} />
    </div>
  )
}
