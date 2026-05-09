'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'
import {
  CopilotChatConfigurationProvider,
  CopilotSidebar,
  useAgent,
  useConfigureSuggestions,
  useDefaultRenderTool,
  useFrontendTool,
} from '@copilotkit/react-core/v2'
import { ThreadsDrawer } from '@/components/threads-drawer'
import drawerStyles from '@/components/threads-drawer/threads-drawer.module.css'
import { ToolFallbackCard } from '@/components/copilot/ToolFallbackCard'
import { UrgencyBanner } from '@/components/shared/UrgencyBanner'
import { SurfaceRenderer } from '@/components/shared/SurfaceRenderer'
import { SEED_STATE } from '@/lib/crew/seed'
import { getUrgencyPhase } from '@/lib/crew/derive'
import type { CrewState, UrgencyPhase } from '@/lib/crew/types'

function mergeCrewState(raw: unknown): CrewState {
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

function useCrewAgent() {
  const { agent } = useAgent()
  const state = mergeCrewState(agent?.state)
  const setState = (updater: (prev: CrewState) => CrewState) => {
    agent?.setState(updater(mergeCrewState(agent?.state)))
  }
  return { agent, state, setState }
}

function LeaderCanvas() {
  const { state, setState } = useCrewAgent()

  // Recalcula urgencyPhase cada 30 s basado en el deadline del milestone activo
  const [urgencyPhase, setUrgencyPhase] = useState<UrgencyPhase>(state.urgencyPhase)
  useEffect(() => {
    const sync = () => {
      const active = state.milestones.find(m => m.id === state.activeMilestoneId)
      if (active) setUrgencyPhase(getUrgencyPhase(active.deadline))
    }
    sync()
    const id = setInterval(sync, 30_000)
    return () => clearInterval(id)
  }, [state.milestones, state.activeMilestoneId])

  useConfigureSuggestions({
    available: 'before-first-message',
    suggestions: [
      { title: '¿Qué tareas faltan?', message: '¿Qué tareas están pendientes para el milestone?' },
      { title: 'Estado del equipo', message: 'Dame un resumen del estado actual del equipo.' },
      { title: '¿Hay blockers?', message: '¿Algún miembro tiene blockers activos?' },
      { title: 'Simular urgencia', message: 'Muéstrame el panel en modo urgente.' },
    ],
  })

  useFrontendTool({
    name: 'setCrewState',
    description: 'Actualiza el estado del equipo (tareas, milestones, miembros, blockers)',
    parameters: z.object({ state: z.record(z.unknown()) }),
    handler: async ({ state: partial }) => {
      setState(prev => ({ ...prev, ...(partial as Partial<CrewState>) }))
      return 'estado actualizado'
    },
  })

  useFrontendTool({
    name: 'updateTask',
    description: 'Actualiza el status o datos de una tarea específica',
    parameters: z.object({
      taskId: z.string(),
      updates: z.record(z.unknown()),
    }),
    handler: async ({ taskId, updates }) => {
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => (t.id === taskId ? { ...t, ...updates } : t)),
      }))
      return `tarea ${taskId} actualizada`
    },
  })

  useFrontendTool({
    name: 'setMascotMood',
    description: 'Cambia el estado visual de la mascota según el contexto',
    parameters: z.object({
      mood: z.enum(['calm', 'focus', 'worried', 'panic', 'celebrate']),
      mode: z.enum(['idle', 'hint', 'alert', 'action']),
    }),
    handler: async ({ mood, mode }) => {
      setState(prev => ({ ...prev, mascotMood: mood, mascotMode: mode }))
      return `mascot: ${mood}/${mode}`
    },
  })

  useFrontendTool({
    name: 'highlightTasks',
    description: 'Resalta tareas específicas en el tablero',
    parameters: z.object({ taskIds: z.array(z.string()) }),
    handler: async ({ taskIds }) => {
      setState(prev => ({ ...prev, highlightedTaskIds: taskIds }))
      return `resaltadas ${taskIds.length} tareas`
    },
  })

  useFrontendTool({
    name: 'renderSurface',
    description: 'Renderiza un componente UI tipado en el chat',
    parameters: z.object({
      envelope: z.object({
        type: z.string(),
        payload: z.record(z.unknown()),
      }),
    }),
    render: ({ args }) => <SurfaceRenderer envelope={args.envelope} />,
  })

  useDefaultRenderTool({
    render: ({ name, status, result, parameters }) => (
      <ToolFallbackCard name={name} status={status} result={result} parameters={parameters} />
    ),
  })

  const activeMilestone = state.milestones.find(m => m.id === state.activeMilestoneId)
  const activeBlockers = state.blockers.filter(b => !b.resolved)

  const simulateUrgency = (minutesLeft: number) => {
    const newDeadline = new Date(Date.now() + minutesLeft * 60 * 1000).toISOString()
    setState(prev => ({
      ...prev,
      milestones: prev.milestones.map(m =>
        m.id === prev.activeMilestoneId ? { ...m, deadline: newDeadline } : m
      ),
    }))
  }

  return (
    <>
      <main className="flex h-screen flex-col overflow-hidden bg-background">
        <UrgencyBanner phase={urgencyPhase} />

        <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Leader Dashboard</h1>
              {activeMilestone && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Milestone: {activeMilestone.title}
                </p>
              )}
            </div>
            {activeBlockers.length > 0 && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                {activeBlockers.length} blocker{activeBlockers.length > 1 ? 's' : ''} activo{activeBlockers.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Canvas grid — Gemini components go aquí */}
          <div className="grid flex-1 gap-4 md:grid-cols-3">
            {/* TaskBoard — T09 TaskCard + columnas todo/in-progress/done */}
            <div className="col-span-2 rounded-xl border border-dashed border-border bg-card/50 p-4">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                Task Board
              </p>
              <div className="grid grid-cols-3 gap-3">
                {(['todo', 'in-progress', 'done'] as const).map(status => (
                  <div key={status} className="rounded-lg bg-muted/50 p-2">
                    <p className="mb-2 text-xs font-medium capitalize text-muted-foreground">
                      {status}
                    </p>
                    {state.tasks
                      .filter(t => t.status === status)
                      .map(t => (
                        <div
                          key={t.id}
                          className={`mb-2 rounded-md border bg-card p-2 text-xs ${
                            state.highlightedTaskIds.includes(t.id)
                              ? 'border-yellow-400 ring-1 ring-yellow-400'
                              : 'border-border'
                          }`}
                        >
                          <p className="font-medium text-foreground">{t.title}</p>
                          <p className="mt-0.5 text-muted-foreground">
                            {state.members.find(m => m.id === t.assignedTo)?.name ?? t.assignedTo}
                          </p>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Right column: MilestonePanel + TeamOverview */}
            <div className="flex flex-col gap-4">
              {/* MilestonePanel — T10 */}
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-4">
                <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                  Milestone
                </p>
                {activeMilestone ? (
                  <div className="text-sm">
                    <p className="font-medium text-foreground">{activeMilestone.title}</p>
                    <p className="mt-1 text-muted-foreground">
                      {new Date(activeMilestone.deadline).toLocaleString()}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {state.tasks.filter(t => t.status === 'done' && activeMilestone.taskIds.includes(t.id)).length}
                      /{activeMilestone.taskIds.length} tareas completadas
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin milestone activo</p>
                )}
              </div>

              {/* TeamOverview — T11 */}
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-4">
                <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                  Equipo
                </p>
                <div className="space-y-2">
                  {state.members.map(m => {
                    const blocker = state.blockers.find(b => b.memberId === m.id && !b.resolved)
                    return (
                      <div key={m.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{m.name}</span>
                        {blocker ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] text-red-700">
                            blocker
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground capitalize">
                            {m.technicalLevel}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dev-only urgency simulator */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 flex gap-2 text-xs">
            <button onClick={() => simulateUrgency(45)} className="rounded bg-green-200 px-2 py-1">Normal (45m)</button>
            <button onClick={() => simulateUrgency(20)} className="rounded bg-yellow-200 px-2 py-1">Focus (20m)</button>
            <button onClick={() => simulateUrgency(8)}  className="rounded bg-orange-200 px-2 py-1">Urgent (8m)</button>
            <button onClick={() => simulateUrgency(3)}  className="rounded bg-red-200 px-2 py-1">Panic (3m)</button>
          </div>
        )}
      </main>

      <CopilotSidebar
        defaultOpen
        width={420}
        input={{ disclaimer: () => null, className: 'pb-6' }}
      />
    </>
  )
}

function LeaderPage() {
  const [threadId, setThreadId] = useState<string | undefined>()
  return (
    <div className={drawerStyles.layout}>
      <ThreadsDrawer agentId="crew_agent" threadId={threadId} onThreadChange={setThreadId} />
      <div className={drawerStyles.mainPanel}>
        <CopilotChatConfigurationProvider agentId="crew_agent" threadId={threadId}>
          <LeaderCanvas />
        </CopilotChatConfigurationProvider>
      </div>
    </div>
  )
}

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return <>{children}</>
}

export default function Page() {
  return (
    <ClientOnly>
      <LeaderPage />
    </ClientOnly>
  )
}
