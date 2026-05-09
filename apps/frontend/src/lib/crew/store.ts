import { create } from 'zustand'
import type { CrewState, Task, Blocker, MascotMood, MascotMode, UrgencyPhase } from './types'
import { getUrgencyPhase, getMascotMood } from './derive'
import { SEED_STATE } from './seed'

const activeMilestone = SEED_STATE.milestones[0]
const initialPhase = activeMilestone ? getUrgencyPhase(activeMilestone.deadline) : 'normal'
const initialMood = getMascotMood(initialPhase, false)

interface CrewStore extends CrewState {
  merge: (partial: Partial<CrewState>) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  addBlocker: (blocker: Omit<Blocker, 'id'>) => void
  resolveBlocker: (blockerId: string) => void
  setMascotState: (mood: MascotMood, mode: MascotMode) => void
  setHighlightedTasks: (taskIds: string[]) => void
  setUrgencyPhase: (phase: UrgencyPhase) => void
  simulateUrgency: (minutesLeft: number) => void
}

export const useCrewStore = create<CrewStore>((set, get) => ({
  ...SEED_STATE,
  urgencyPhase: initialPhase,
  mascotMood: initialMood,
  mascotMode: 'idle',
  highlightedTaskIds: [],

  merge: (partial) => set((state) => ({ ...state, ...partial })),

  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    })),

  addBlocker: (blocker) =>
    set((state) => ({
      blockers: [...state.blockers, { ...blocker, id: crypto.randomUUID() }]
    })),

  resolveBlocker: (blockerId) =>
    set((state) => ({
      blockers: state.blockers.map((b) =>
        b.id === blockerId ? { ...b, resolved: true, resolvedAt: new Date().toISOString() } : b
      )
    })),

  setMascotState: (mood, mode) => set({ mascotMood: mood, mascotMode: mode }),

  setHighlightedTasks: (taskIds) => set({ highlightedTaskIds: taskIds }),

  setUrgencyPhase: (phase) => {
    const hasBlocker = get().blockers.some((b) => !b.resolved)
    set({ urgencyPhase: phase, mascotMood: getMascotMood(phase, hasBlocker) })
  },

  simulateUrgency: (minutesLeft) => {
    const newDeadline = new Date(Date.now() + minutesLeft * 60 * 1000).toISOString()
    const milestones = get().milestones.map((m) =>
      m.id === get().activeMilestoneId ? { ...m, deadline: newDeadline } : m
    )
    const phase = getUrgencyPhase(newDeadline)
    const hasBlocker = get().blockers.some((b) => !b.resolved)
    set({ milestones, urgencyPhase: phase, mascotMood: getMascotMood(phase, hasBlocker) })
  },
}))
