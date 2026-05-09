'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
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

function MemberCanvas({ memberId }: { memberId: string }) {
  const { state, setState } = useCrewAgent()

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

  const currentMember = state.members.find(m => m.id === memberId)
  const myTasks = state.tasks.filter(t => t.assignedTo === memberId)
  const activeTask = myTasks.find(t => t.status === 'in-progress') ?? myTasks.find(t => t.status === 'todo')
  const myBlocker = state.blockers.find(b => b.memberId === memberId && !b.resolved)
  const activeMilestone = state.milestones.find(m => m.id === state.activeMilestoneId)

  useConfigureSuggestions({
    available: 'before-first-message',
    suggestions: [
      { title: '¿Qué hago ahora?', message: '¿Cuál es mi próxima tarea más importante?' },
      { title: 'Tengo un blocker', message: 'Tengo un problema que me está bloqueando.' },
      { title: 'No entiendo algo', message: 'No entiendo cómo empezar con mi tarea.' },
      { title: 'Actualizar progreso', message: 'Terminé mi tarea actual, ¿qué sigue?' },
    ],
  })

  useFrontendTool({
    name: 'setCrewState',
    description: 'Actualiza el estado del equipo',
    parameters: z.object({ state: z.record(z.unknown()) }),
    handler: async ({ state: partial }) => {
      setState(prev => ({ ...prev, ...(partial as Partial<CrewState>) }))
      return 'estado actualizado'
    },
  })

  useFrontendTool({
    name: 'updateTask',
    description: 'Actualiza el status o datos de una tarea',
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
    name: 'reportBlocker',
    description: 'Registra un blocker para el miembro actual',
    parameters: z.object({ description: z.string() }),
    handler: async ({ description }) => {
      setState(prev => ({
        ...prev,
        blockers: [
          ...prev.blockers,
          {
            id: crypto.randomUUID(),
            memberId,
            description,
            reportedAt: new Date().toISOString(),
            resolved: false,
          },
        ],
      }))
      return 'blocker registrado'
    },
  })

  useFrontendTool({
    name: 'setMascotMood',
    description: 'Cambia el estado visual de la mascota',
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

  return (
    <>
      <main className="flex h-screen flex-col overflow-hidden bg-background">
        <UrgencyBanner
          phase={urgencyPhase}
          milestoneTitle={activeMilestone?.title}
        />

        <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Hola, {currentMember?.name ?? memberId}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground capitalize">
                {currentMember?.technicalLevel} · {currentMember?.role}
              </p>
            </div>
            {myBlocker && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                Blocker activo
              </span>
            )}
          </div>

          <div className="grid flex-1 gap-4 md:grid-cols-2">
            {/* ActiveTaskView — T12 */}
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-4">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                Tarea activa
              </p>
              {activeTask ? (
                <div className="space-y-2">
                  <p className="font-medium text-foreground">{activeTask.title}</p>
                  <p className="text-sm text-muted-foreground">{activeTask.description}</p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    activeTask.priority === 'high' ? 'bg-red-100 text-red-700' :
                    activeTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {activeTask.priority}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin tareas asignadas</p>
              )}
            </div>

            {/* MilestoneCountdown — T13 */}
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-4">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                Countdown
              </p>
              {activeMilestone ? (
                <div className="space-y-2">
                  <p className="font-medium text-foreground">{activeMilestone.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Deadline: {new Date(activeMilestone.deadline).toLocaleString()}
                  </p>
                  <p className={`text-lg font-bold ${
                    urgencyPhase === 'panic' || urgencyPhase === 'expired' ? 'text-red-600' :
                    urgencyPhase === 'urgent' ? 'text-orange-600' :
                    urgencyPhase === 'focus' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {urgencyPhase.toUpperCase()}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin milestone activo</p>
              )}
            </div>

            {/* BlockerButton */}
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-4">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                Mis tareas
              </p>
              <div className="space-y-1">
                {myTasks.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin tareas asignadas</p>
                )}
                {myTasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{t.title}</span>
                    <span className="text-xs capitalize text-muted-foreground">{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <CopilotSidebar
        defaultOpen
        width={420}
        input={{ disclaimer: () => null, className: 'pb-6' }}
      />
    </>
  )
}

function MemberPage({ memberId }: { memberId: string }) {
  const [threadId, setThreadId] = useState<string | undefined>()
  return (
    <div className={drawerStyles.layout}>
      <ThreadsDrawer agentId="crew_agent" threadId={threadId} onThreadChange={setThreadId} />
      <div className={drawerStyles.mainPanel}>
        <CopilotChatConfigurationProvider agentId="crew_agent" threadId={threadId}>
          <MemberCanvas memberId={memberId} />
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

export default function Page({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = use(params)
  return (
    <ClientOnly>
      <MemberPage memberId={memberId} />
    </ClientOnly>
  )
}
