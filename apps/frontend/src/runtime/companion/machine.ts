import { createMachine, assign } from 'xstate'
import type { UrgencyPhase } from '@/lib/crew/types'

export type CreatureMood =
  | 'calm' | 'focused' | 'worried' | 'panicking'
  | 'celebrating' | 'sleeping' | 'thinking' | 'guiding'

export type CreatureMode = 'idle' | 'alert' | 'speaking' | 'action' | 'listening'

export type HabitatWeather = 'sunny' | 'cloudy' | 'stormy' | 'night' | 'rain'

export interface MachineContext {
  mood: CreatureMood
  mode: CreatureMode
  phase: UrgencyPhase
  activeBlockerCount: number
  bubbleMessage: string | null
  bubbleCTA: { label: string; action: string } | null
  panelOpen: boolean
  habitatWeather: HabitatWeather
  lastProactiveAt: number
}

type MachineEvent =
  | { type: 'PHASE_CHANGE'; phase: UrgencyPhase }
  | { type: 'BLOCKER_CREATED' }
  | { type: 'BLOCKER_RESOLVED' }
  | { type: 'MILESTONE_COMPLETE'; title: string }
  | { type: 'TASK_COMPLETED' }
  | { type: 'AGENT_SPOKE' }
  | { type: 'AGENT_DONE' }
  | { type: 'DEADLINE_APPROACHING'; minutesLeft: number }
  | { type: 'USER_INACTIVE' }
  | { type: 'USER_ACTIVE' }
  | { type: 'OPEN_PANEL' }
  | { type: 'CLOSE_PANEL' }
  | { type: 'DISMISS_BUBBLE' }
  | { type: 'CELEBRATION_DONE' }

function weatherForPhase(phase: UrgencyPhase): HabitatWeather {
  switch (phase) {
    case 'normal': return 'sunny'
    case 'focus': return 'cloudy'
    case 'urgent': return 'rain'
    case 'panic': return 'stormy'
    case 'expired': return 'night'
    default: return 'sunny'
  }
}

function moodForPhase(phase: UrgencyPhase, blockers: number): CreatureMood {
  if (phase === 'panic' || phase === 'expired') return 'panicking'
  if (phase === 'urgent' || blockers > 0) return 'worried'
  if (phase === 'focus') return 'focused'
  return 'calm'
}

const PROACTIVE_COOLDOWN_MS = 5 * 60 * 1000

function canShowProactive(ctx: MachineContext): boolean {
  return Date.now() - ctx.lastProactiveAt > PROACTIVE_COOLDOWN_MS
}

export const companionMachine = createMachine(
  {
    id: 'companion',
    initial: 'idle',
    types: {} as { context: MachineContext; events: MachineEvent },
    context: {
      mood: 'calm',
      mode: 'idle',
      phase: 'normal',
      activeBlockerCount: 0,
      bubbleMessage: null,
      bubbleCTA: null,
      panelOpen: false,
      habitatWeather: 'sunny',
      lastProactiveAt: 0,
    },
    states: {
      idle: {
        on: {
          PHASE_CHANGE: {
            actions: 'applyPhaseChange',
            target: 'idle',
          },
          BLOCKER_CREATED: {
            actions: 'applyBlockerCreated',
            target: 'alert',
          },
          BLOCKER_RESOLVED: {
            actions: 'applyBlockerResolved',
            target: 'idle',
          },
          MILESTONE_COMPLETE: {
            actions: 'applyMilestoneComplete',
            target: 'celebrating',
          },
          TASK_COMPLETED: {
            actions: 'applyTaskCompleted',
          },
          AGENT_SPOKE: {
            actions: assign({ mode: 'listening' }),
            target: 'thinking',
          },
          DEADLINE_APPROACHING: {
            actions: 'applyDeadlineApproaching',
            target: 'alert',
          },
          USER_INACTIVE: {
            actions: assign({ mood: 'sleeping', mode: 'idle' }),
            target: 'sleeping',
          },
          OPEN_PANEL: {
            actions: assign({ panelOpen: true, mood: 'guiding', mode: 'listening' }),
            target: 'guiding',
          },
        },
      },
      alert: {
        on: {
          DISMISS_BUBBLE: {
            actions: assign({ bubbleMessage: null, bubbleCTA: null }),
            target: 'idle',
          },
          PHASE_CHANGE: {
            actions: 'applyPhaseChange',
          },
          OPEN_PANEL: {
            actions: assign({ panelOpen: true, mood: 'guiding', mode: 'listening', bubbleMessage: null }),
            target: 'guiding',
          },
          MILESTONE_COMPLETE: {
            actions: 'applyMilestoneComplete',
            target: 'celebrating',
          },
        },
      },
      celebrating: {
        on: {
          CELEBRATION_DONE: {
            actions: assign({ mood: (_ctx, _e) => 'calm' as CreatureMood, mode: 'idle', bubbleMessage: null }),
            target: 'idle',
          },
          OPEN_PANEL: {
            actions: assign({ panelOpen: true, mood: 'guiding' }),
            target: 'guiding',
          },
        },
      },
      thinking: {
        on: {
          AGENT_DONE: {
            actions: assign({ mode: 'idle' }),
            target: 'idle',
          },
          OPEN_PANEL: {
            actions: assign({ panelOpen: true, mood: 'guiding' }),
            target: 'guiding',
          },
        },
      },
      sleeping: {
        on: {
          USER_ACTIVE: {
            actions: assign({ mood: (_ctx) => 'calm' as CreatureMood, mode: 'idle' }),
            target: 'idle',
          },
          PHASE_CHANGE: {
            actions: 'applyPhaseChange',
            target: 'idle',
          },
          BLOCKER_CREATED: {
            actions: 'applyBlockerCreated',
            target: 'alert',
          },
        },
      },
      guiding: {
        on: {
          CLOSE_PANEL: {
            actions: assign({ panelOpen: false, mood: 'calm', mode: 'idle' }),
            target: 'idle',
          },
          PHASE_CHANGE: {
            actions: 'applyPhaseChange',
          },
        },
      },
    },
  },
  {
    actions: {
      applyPhaseChange: assign(({ context, event }) => {
        if (event.type !== 'PHASE_CHANGE') return context
        const { phase } = event
        return {
          phase,
          mood: moodForPhase(phase, context.activeBlockerCount),
          habitatWeather: weatherForPhase(phase),
        }
      }),
      applyBlockerCreated: assign(({ context }) => {
        const count = context.activeBlockerCount + 1
        const canShow = canShowProactive(context)
        return {
          activeBlockerCount: count,
          mood: 'worried' as CreatureMood,
          mode: 'alert' as CreatureMode,
          bubbleMessage: canShow ? 'Hay un nuevo blocker activo. ¿Querés verlo?' : context.bubbleMessage,
          bubbleCTA: canShow ? { label: 'Ver blocker', action: 'open_blocker_panel' } : context.bubbleCTA,
          lastProactiveAt: canShow ? Date.now() : context.lastProactiveAt,
        }
      }),
      applyBlockerResolved: assign(({ context }) => {
        const count = Math.max(0, context.activeBlockerCount - 1)
        return {
          activeBlockerCount: count,
          mood: moodForPhase(context.phase, count),
          mode: 'idle' as CreatureMode,
        }
      }),
      applyMilestoneComplete: assign(({ context, event }) => {
        if (event.type !== 'MILESTONE_COMPLETE') return context
        const canShow = canShowProactive(context)
        return {
          mood: 'celebrating' as CreatureMood,
          mode: 'action' as CreatureMode,
          bubbleMessage: canShow ? `¡${event.title} completado! Equipo increíble.` : context.bubbleMessage,
          bubbleCTA: null,
          lastProactiveAt: canShow ? Date.now() : context.lastProactiveAt,
        }
      }),
      applyTaskCompleted: assign({ mode: 'action' as CreatureMode }),
      applyDeadlineApproaching: assign(({ context, event }) => {
        if (event.type !== 'DEADLINE_APPROACHING') return context
        const { minutesLeft } = event
        const canShow = canShowProactive(context)
        const mood: CreatureMood = minutesLeft <= 30 ? 'panicking' : minutesLeft <= 60 ? 'worried' : context.mood
        return {
          mood,
          mode: 'alert' as CreatureMode,
          bubbleMessage: canShow
            ? `Quedan ${minutesLeft} min. El Planner tiene un plan de corte. ¿Lo vemos?`
            : context.bubbleMessage,
          bubbleCTA: canShow ? { label: 'Ver plan', action: 'open_planner' } : context.bubbleCTA,
          lastProactiveAt: canShow ? Date.now() : context.lastProactiveAt,
        }
      }),
    },
  }
)
