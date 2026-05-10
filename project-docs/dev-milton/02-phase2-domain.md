# Fase 2 — Dominio: Store Zustand + Tipos + Seed

## Objetivo
Tener el estado completo del equipo disponible en el frontend. Al final de esta fase: `useCrewStore.getState()` desde la consola devuelve el estado seed con miembros, tareas y milestone.

## Archivos a crear

```
apps/frontend/src/lib/crew/
├── types.ts          ← todas las interfaces y tipos
├── store.ts          ← Zustand store con actions
├── derive.ts         ← funciones puras (getUrgencyPhase, getMascotMood)
└── seed.ts           ← datos de demo hardcodeados
```

## 2.1 types.ts

Copiar exactamente el bloque TypeScript de `project-docs/agent/02-domain-model.md`.

## 2.2 derive.ts

```typescript
import { UrgencyPhase, MascotMood } from './types'

export function getUrgencyPhase(deadlineISO: string): UrgencyPhase {
  const minutesLeft = (new Date(deadlineISO).getTime() - Date.now()) / 60000
  if (minutesLeft > 30) return 'normal'
  if (minutesLeft > 15) return 'focus'
  if (minutesLeft > 5)  return 'urgent'
  if (minutesLeft > 0)  return 'panic'
  return 'expired'
}

export function getMascotMood(phase: UrgencyPhase, hasBlocker: boolean): MascotMood {
  if (phase === 'expired') return 'panic'
  if (phase === 'panic')   return hasBlocker ? 'panic' : 'worried'
  if (phase === 'urgent')  return 'worried'
  if (phase === 'focus')   return 'focus'
  if (hasBlocker)          return 'worried'
  return 'calm'
}
```

## 2.3 seed.ts

```typescript
import { CrewState } from './types'

// Deadline dinámico: demo siempre empieza con ~45 minutos (fase 'normal')
const DEMO_DEADLINE = new Date(Date.now() + 45 * 60 * 1000).toISOString()

export const SEED_STATE: Omit<CrewState, 'urgencyPhase' | 'mascotMood' | 'mascotMode' | 'highlightedTaskIds'> = {
  members: [
    { id: 'm1', name: 'Alex', role: 'leader', technicalLevel: 'high-tech' },
    { id: 'm2', name: 'Sam', role: 'member', technicalLevel: 'low-tech' },
    { id: 'm3', name: 'Jordan', role: 'member', technicalLevel: 'high-tech' },
  ],
  currentMemberId: 'm1',
  tasks: [
    { id: 't1', title: 'Diseñar la landing page', description: 'Crear mockup y componentes base', assignedTo: 'm2', status: 'in-progress', priority: 'high', createdAt: new Date().toISOString() },
    { id: 't2', title: 'Implementar API de usuarios', description: 'Endpoints POST /users y GET /users/:id', assignedTo: 'm3', status: 'todo', priority: 'high', createdAt: new Date().toISOString(), milestoneId: 'ms1' },
    { id: 't3', title: 'Preparar script de demo', description: 'Guión de 2 minutos para la presentación', assignedTo: 'm1', status: 'todo', priority: 'medium', createdAt: new Date().toISOString(), milestoneId: 'ms1' },
  ],
  milestones: [
    { id: 'ms1', title: 'Demo final hackathon', deadline: DEMO_DEADLINE, taskIds: ['t1', 't2', 't3'] }
  ],
  blockers: [],
  sharedDocuments: [
    {
      id: 'd1',
      title: 'Stack técnico del proyecto',
      content: '# Stack Técnico\n\n## Frontend\n- Next.js 15\n- React 19\n- Tailwind CSS\n\n## Backend\n- Node.js + Hono\n- PostgreSQL\n\n## Instalación\n\n```bash\nnpm install\nnpm run dev\n```',
      sharedBy: 'm1',
      sharedAt: new Date().toISOString()
    }
  ],
  openDocumentIds: ['d1'],
  activeMilestoneId: 'ms1',
}
```

## 2.4 store.ts

```typescript
import { create } from 'zustand'
import { CrewState, Task, Blocker, MascotMood, MascotMode, UrgencyPhase } from './types'
import { getUrgencyPhase, getMascotMood } from './derive'
import { SEED_STATE } from './seed'

const activeMilestone = SEED_STATE.milestones[0]
const initialPhase = activeMilestone ? getUrgencyPhase(activeMilestone.deadline) : 'normal'
const initialMood = getMascotMood(initialPhase, false)

interface CrewStore extends CrewState {
  // State mutations
  merge: (partial: Partial<CrewState>) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  addBlocker: (blocker: Omit<Blocker, 'id'>) => void
  resolveBlocker: (blockerId: string) => void
  setMascotState: (mood: MascotMood, mode: MascotMode) => void
  setHighlightedTasks: (taskIds: string[]) => void
  setUrgencyPhase: (phase: UrgencyPhase) => void
  // Para demo: simular urgencia
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

  // Para demo: mueve el deadline del milestone activo a X minutos en el futuro
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
```

## 2.5 Hook de urgencia reactivo

```typescript
// apps/frontend/src/hooks/use-urgency-phase.ts
import { useEffect } from 'react'
import { useCrewStore } from '@/lib/crew/store'
import { getUrgencyPhase } from '@/lib/crew/derive'

// Recalcula la fase cada 30 segundos
export function useUrgencyPhaseSync() {
  const { milestones, activeMilestoneId, setUrgencyPhase } = useCrewStore()

  useEffect(() => {
    const sync = () => {
      const active = milestones.find((m) => m.id === activeMilestoneId)
      if (active) setUrgencyPhase(getUrgencyPhase(active.deadline))
    }
    sync()
    const interval = setInterval(sync, 30_000)
    return () => clearInterval(interval)
  }, [milestones, activeMilestoneId, setUrgencyPhase])
}
```

## Criterio de completitud
- [ ] `useCrewStore.getState().members` en consola devuelve los 3 miembros seed
- [ ] `useCrewStore.getState().simulateUrgency(8)` cambia `urgencyPhase` a `'urgent'`
- [ ] TypeScript compila sin errores en `apps/frontend`
- [ ] Los tipos de `types.ts` coinciden con el `02-domain-model.md` del agente
