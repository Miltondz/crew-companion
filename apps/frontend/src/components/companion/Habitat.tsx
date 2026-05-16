'use client'

import { useEffect, useCallback } from 'react'
import { useMachine } from '@xstate/react'
import { companionMachine } from '@/runtime/companion/machine'
import { companionBus } from '@/runtime/companion/EventBus'
import { habitatPropRegistry } from '@/runtime/companion/HabitatPropRegistry'
import { HabitatBackground } from './HabitatBackground'
import { HabitatProps } from './HabitatProps'
import { CreatureSprite } from './CreatureSprite'
import { SpeechBubble } from './SpeechBubble'
import { CompanionPanel } from './CompanionPanel'
import type { UrgencyPhase } from '@/lib/crew/types'

interface Props {
  phase: UrgencyPhase
  pendingTasks?: number
  activeBlockers?: number
  minutesLeft?: number | null
  progress?: number
  techLevel?: 'low-tech' | 'high-tech'
  tasks?: Array<{ id: string; title: string; description?: string; status: string }>
  compact?: boolean
}

export function Habitat({
  phase,
  pendingTasks = 0,
  activeBlockers = 0,
  minutesLeft = null,
  progress = 0,
  techLevel = 'low-tech',
  tasks,
  compact,
}: Props) {
  const [state, send] = useMachine(companionMachine)
  const ctx = state.context

  // Sync phase changes into machine
  useEffect(() => {
    send({ type: 'PHASE_CHANGE', phase })
  }, [phase, send])

  // Sync blocker count changes
  useEffect(() => {
    const diff = activeBlockers - ctx.activeBlockerCount
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        send({ type: 'BLOCKER_CREATED' })
      }
    } else if (diff < 0) {
      for (let i = 0; i < Math.abs(diff); i++) {
        send({ type: 'BLOCKER_RESOLVED' })
      }
    }
  }, [activeBlockers]) // eslint-disable-line react-hooks/exhaustive-deps

  // Deadline approaching
  useEffect(() => {
    if (minutesLeft !== null && minutesLeft <= 60 && minutesLeft > 0) {
      send({ type: 'DEADLINE_APPROACHING', minutesLeft })
    }
  }, [minutesLeft, send])

  // Subscribe to EventBus for external events
  useEffect(() => {
    const unsubs = [
      companionBus.on('PHASE_CHANGE', e => send({ type: 'PHASE_CHANGE', phase: e.phase })),
      companionBus.on('BLOCKER_CREATED', () => send({ type: 'BLOCKER_CREATED' })),
      companionBus.on('BLOCKER_RESOLVED', () => send({ type: 'BLOCKER_RESOLVED' })),
      companionBus.on('MILESTONE_COMPLETE', e => send({ type: 'MILESTONE_COMPLETE', title: e.title })),
      companionBus.on('AGENT_SPOKE', () => send({ type: 'AGENT_SPOKE' })),
      companionBus.on('USER_INACTIVE', () => send({ type: 'USER_INACTIVE' })),
      companionBus.on('USER_ACTIVE', () => send({ type: 'USER_ACTIVE' })),
      companionBus.on('PANEL_OPEN', () => send({ type: 'OPEN_PANEL' })),
      companionBus.on('PANEL_CLOSE', () => send({ type: 'CLOSE_PANEL' })),
    ]

    // Forward EventBus events to prop registry
    const propUnsubs = [
      companionBus.on('BLOCKER_CREATED', e => habitatPropRegistry.handleEvent(e.type)),
      companionBus.on('BLOCKER_RESOLVED', e => habitatPropRegistry.handleEvent(e.type)),
      companionBus.on('MILESTONE_COMPLETE', e => habitatPropRegistry.handleEvent(e.type)),
      companionBus.on('DEADLINE_APPROACHING', e => habitatPropRegistry.handleEvent(e.type)),
    ]

    return () => {
      unsubs.forEach(fn => fn())
      propUnsubs.forEach(fn => fn())
    }
  }, [send])

  // Celebration auto-dismiss
  useEffect(() => {
    if (state.value === 'celebrating') {
      const t = setTimeout(() => send({ type: 'CELEBRATION_DONE' }), 8000)
      return () => clearTimeout(t)
    }
  }, [state.value, send])

  const handleClick = useCallback(() => {
    if (ctx.panelOpen) return
    companionBus.emit({ type: 'PANEL_OPEN' })
    send({ type: 'OPEN_PANEL' })
  }, [ctx.panelOpen, send])

  const handleDismissBubble = useCallback(() => {
    send({ type: 'DISMISS_BUBBLE' })
  }, [send])

  if (compact) {
    return (
      <>
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={handleClick}
          role="button"
          aria-label="Abrir panel del Companion"
        >
          <div className="relative h-10 w-10 flex items-end justify-center shrink-0 overflow-visible">
            <div className="scale-[0.35] origin-bottom absolute bottom-0">
              <CreatureSprite mood={ctx.mood} mode={ctx.mode} />
            </div>
          </div>
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            phase === 'panic' ? 'bg-red-400 animate-pulse' :
            phase === 'urgent' ? 'bg-orange-400' :
            phase === 'focus' ? 'bg-yellow-400' :
            'bg-emerald-400'
          }`} />
          {ctx.bubbleMessage && (
            <span className="text-[10px] text-white/80 max-w-[140px] truncate italic">
              {ctx.bubbleMessage}
            </span>
          )}
        </div>
        <form
          onSubmit={e => {
            e.preventDefault()
            const input = (e.currentTarget.elements.namedItem('qmsg') as HTMLInputElement)
            const text = input.value.trim()
            if (!text) return
            companionBus.emit({ type: 'PANEL_OPEN' })
            send({ type: 'OPEN_PANEL' })
            input.value = ''
          }}
          className="flex items-center"
        >
          <input
            name="qmsg"
            type="text"
            placeholder="Mensaje rápido..."
            className="h-6 w-36 rounded-full bg-white/10 px-3 text-[10px] text-white placeholder-white/40 outline-none focus:bg-white/20 transition"
          />
        </form>
        <CompanionPanel
          open={ctx.panelOpen}
          onClose={() => send({ type: 'CLOSE_PANEL' })}
          techLevel={techLevel}
          tasks={tasks}
          status={{ pendingTasks, activeBlockers, minutesLeft, progress, phase }}
        />
      </>
    )
  }

  return (
    <>
      {/* Habitat widget */}
      <div
        className="relative w-[240px] h-[180px] rounded-xl overflow-visible cursor-pointer select-none shadow-2xl border border-white/10 hover:border-white/20 transition-colors"
        onClick={handleClick}
        role="button"
        aria-label="Abrir panel del Companion"
        title="Companion — clic para abrir"
      >
        {/* background layers */}
        <HabitatBackground weather={ctx.habitatWeather} />

        {/* props layer */}
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <HabitatProps />
        </div>

        {/* creature — centered, above ground */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="relative">
            <SpeechBubble
              message={ctx.bubbleMessage}
              cta={ctx.bubbleCTA}
              onDismiss={handleDismissBubble}
              onCTA={(action) => {
                handleDismissBubble()
                companionBus.emit({ type: 'PANEL_OPEN' })
                send({ type: 'OPEN_PANEL' })
              }}
            />
            <CreatureSprite mood={ctx.mood} mode={ctx.mode} />
          </div>
        </div>

        {/* panel open hint */}
        {!ctx.panelOpen && (
          <div className="absolute top-1.5 left-1.5 text-[8px] text-white/40 bg-black/20 px-1.5 py-0.5 rounded-full">
            clic para abrir
          </div>
        )}
      </div>

      {/* Companion panel — rendered outside the habitat box */}
      <CompanionPanel
        open={ctx.panelOpen}
        onClose={() => send({ type: 'CLOSE_PANEL' })}
        techLevel={techLevel}
        tasks={tasks}
        status={{
          pendingTasks,
          activeBlockers,
          minutesLeft,
          progress,
          phase,
        }}
      />
    </>
  )
}
