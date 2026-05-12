import type { UrgencyPhase } from '@/lib/crew/types'

export type CompanionEvent =
  | { type: 'PHASE_CHANGE'; phase: UrgencyPhase }
  | { type: 'BLOCKER_CREATED'; blockerId: string; memberId: string }
  | { type: 'BLOCKER_RESOLVED'; blockerId: string }
  | { type: 'MILESTONE_COMPLETE'; milestoneId: string; title: string }
  | { type: 'TASK_COMPLETED'; taskId: string }
  | { type: 'AGENT_SPOKE'; agentId: 'orchestrator' | 'planner' | 'coach'; surface?: string }
  | { type: 'DEADLINE_APPROACHING'; minutesLeft: number }
  | { type: 'USER_INACTIVE'; durationMs: number }
  | { type: 'USER_ACTIVE' }
  | { type: 'PANEL_OPEN' }
  | { type: 'PANEL_CLOSE' }

type EventType = CompanionEvent['type']
type Handler<T> = (event: T) => void

class CompanionEventBus {
  private listeners = new Map<EventType, Set<Handler<CompanionEvent>>>()

  emit<T extends CompanionEvent>(event: T): void {
    const handlers = this.listeners.get(event.type)
    if (handlers) {
      handlers.forEach(h => h(event))
    }
  }

  on<E extends EventType>(
    type: E,
    handler: Handler<Extract<CompanionEvent, { type: E }>>
  ): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(handler as Handler<CompanionEvent>)
    return () => this.listeners.get(type)?.delete(handler as Handler<CompanionEvent>)
  }
}

export const companionBus = new CompanionEventBus()
