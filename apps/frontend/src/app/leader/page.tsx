'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import {
  CopilotChat,
  CopilotChatConfigurationProvider,
  useAgent,
  useConfigureSuggestions,
  useDefaultRenderTool,
  useFrontendTool,
} from '@copilotkit/react-core/v2'
import { ToolFallbackCard } from '@/components/copilot/ToolFallbackCard'
import { UrgencyBanner } from '@/components/shared/UrgencyBanner'
import { TaskCard } from '@/components/shared/TaskCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { SurfaceHost } from '@/runtime/surface-registry/SurfaceHost'
import { adaptLegacyEnvelope, isLegacyEnvelope } from '@/runtime/surface-registry/adapter'
import { useRuntimeContext } from '@/runtime/surface-registry/useRuntimeContext'
import { MilestonePanel } from '@/components/leader/MilestonePanel'
import { TeamOverview } from '@/components/leader/TeamOverview'
import { MascotSVG } from '@/components/mascot/MascotSVG'
import { SEED_STATE } from '@/lib/crew/seed'
import { getUrgencyPhase } from '@/lib/crew/derive'
import { fireCelebration, fireMilestoneConfetti } from '@/lib/confetti'
import { CommandPalette } from '@/components/shared/CommandPalette'
import { DarkModeToggle } from '@/components/shared/DarkModeToggle'
import type { CrewState, UrgencyPhase, TaskStatus, TaskPriority } from '@/lib/crew/types'

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
  const { agent } = useAgent({ agentId: "crew_agent" })
  const state = mergeCrewState(agent?.state)
  const setState = (updater: (prev: CrewState) => CrewState) => {
    agent?.setState(updater(mergeCrewState(agent?.state)))
  }
  return { agent, state, setState }
}

interface AddTaskForm {
  title: string
  description: string
  assignedTo: string
  priority: TaskPriority
}

function LeaderCanvas() {
  const router = useRouter()
  const { state, setState } = useCrewAgent()

  const [urgencyPhase, setUrgencyPhase] = useState<UrgencyPhase>(state.urgencyPhase)
  const [showAddTask, setShowAddTask] = useState(false)
  const [taskForm, setTaskForm] = useState<AddTaskForm>({
    title: '',
    description: '',
    assignedTo: state.members[0]?.id ?? '',
    priority: 'medium',
  })

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
      toast.success('Tarea actualizada por el asistente')
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

  const runtimeContext = useRuntimeContext({
    role: 'leader',
    phase: urgencyPhase,
    hasActiveBlocker: state.blockers.some(b => !b.resolved),
  })

  const LegacyEnvelopeSchema = z.object({ type: z.string(), payload: z.record(z.unknown()) })
  const FullEnvelopeSchema = z.object({
    envelopeId: z.string(),
    agentId: z.string(),
    emittedAt: z.number(),
    intent: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    surfaceId: z.string(),
    payload: z.record(z.unknown()),
    context: z.object({
      role: z.string(),
      techLevel: z.string().optional(),
      phase: z.string(),
      hasActiveBlocker: z.boolean(),
      workspaceId: z.string(),
    }),
    requiredCapabilities: z.array(z.string()),
    hibernatable: z.boolean(),
    pinnable: z.boolean(),
    ephemeral: z.number().optional(),
  })

  useFrontendTool({
    name: 'renderSurface',
    description: 'Renderiza un componente UI tipado en el chat',
    parameters: z.object({
      envelope: z.union([LegacyEnvelopeSchema, FullEnvelopeSchema]),
    }),
    render: ({ args }) => {
      if (!args.envelope) return null
      const fullEnvelope = isLegacyEnvelope(args.envelope)
        ? adaptLegacyEnvelope(args.envelope, runtimeContext)
        : (args.envelope as import('@/runtime/surface-registry/types').SurfaceEnvelope)
      return <SurfaceHost envelope={fullEnvelope} context={runtimeContext} />
    },
  })

  useDefaultRenderTool({
    render: ({ name, status, result, parameters }) => (
      <ToolFallbackCard name={name} status={status} result={result} parameters={parameters} />
    ),
  })

  const activeMilestone = state.milestones.find(m => m.id === state.activeMilestoneId)
  const activeBlockers = state.blockers.filter(b => !b.resolved)

  const handleTaskStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setState(prev => {
      const updatedTasks = prev.tasks.map(t => (t.id === taskId ? { ...t, status: newStatus } : t))
      if (newStatus === 'done') {
        const milestone = prev.milestones.find(m => m.id === prev.activeMilestoneId)
        const milestoneTasks = milestone ? updatedTasks.filter(t => milestone.taskIds.includes(t.id)) : []
        const allDone = milestoneTasks.length > 0 && milestoneTasks.every(t => t.status === 'done')
        if (allDone) {
          toast.success('¡Milestone completado! 🏆', { description: milestone?.title, duration: 5000 })
          fireMilestoneConfetti()
        } else {
          toast.success('Tarea completada')
          fireCelebration()
        }
      }
      return { ...prev, tasks: updatedTasks }
    })
  }

  const handleAddTask = () => {
    if (!taskForm.title.trim()) return
    const newTask = {
      id: `t${Date.now()}`,
      title: taskForm.title.trim(),
      description: taskForm.description.trim(),
      assignedTo: taskForm.assignedTo,
      status: 'todo' as TaskStatus,
      priority: taskForm.priority,
      createdAt: new Date().toISOString(),
      milestoneId: state.activeMilestoneId,
    }
    setState(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
      milestones: prev.milestones.map(m =>
        m.id === prev.activeMilestoneId
          ? { ...m, taskIds: [...m.taskIds, newTask.id] }
          : m
      ),
    }))
    toast.success('Tarea creada', { description: newTask.title })
    setTaskForm({ title: '', description: '', assignedTo: state.members[0]?.id ?? '', priority: 'medium' })
    setShowAddTask(false)
  }

  const handleResolveBlocker = (blockerId: string) => {
    setState(prev => ({
      ...prev,
      blockers: prev.blockers.map(b =>
        b.id === blockerId ? { ...b, resolved: true, resolvedAt: new Date().toISOString() } : b
      ),
    }))
    toast.success('Blocker resuelto ✓')
  }

  const simulateUrgency = (minutesLeft: number) => {
    const newDeadline = new Date(Date.now() + minutesLeft * 60 * 1000).toISOString()
    setState(prev => ({
      ...prev,
      milestones: prev.milestones.map(m =>
        m.id === prev.activeMilestoneId ? { ...m, deadline: newDeadline } : m
      ),
    }))
  }

  const kanbanColumns: { status: TaskStatus; label: string; accent: string; countColor: string }[] = [
    { status: 'todo',        label: 'Por hacer',   accent: 'border-t-slate-400',   countColor: 'bg-slate-100 text-slate-600'   },
    { status: 'in-progress', label: 'En progreso', accent: 'border-t-blue-500',    countColor: 'bg-blue-100 text-blue-700'     },
    { status: 'done',        label: 'Completado',  accent: 'border-t-emerald-500', countColor: 'bg-emerald-100 text-emerald-700'},
  ]

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-1000 phase-bg-${urgencyPhase}`}>

      {/* ── Main dashboard ──────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <UrgencyBanner phase={urgencyPhase} />

        {/* Header */}
        <header className="shrink-0 bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-xl shadow-inner">⚡</div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white">Leader Dashboard</h1>
                {activeMilestone && (
                  <p className="text-xs text-indigo-200">{activeMilestone.title}</p>
                )}
              </div>
            </div>

            {/* Nav links to members */}
            <div className="flex items-center gap-2 flex-wrap">
              {state.members.map(m => (
                <button
                  key={m.id}
                  onClick={() => router.push(`/member/${m.id}`)}
                  className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25 ring-1 ring-white/20"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25 text-[10px] font-bold">
                    {m.name[0]}
                  </span>
                  {m.name}
                  {state.blockers.find(b => b.memberId === m.id && !b.resolved) && (
                    <span className="text-red-300">⚠</span>
                  )}
                </button>
              ))}
              <button
                onClick={() => router.push('/docs')}
                className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25 ring-1 ring-white/20"
              >
                📄 Docs
              </button>
            </div>

            <div className="flex items-center gap-2">
              {activeBlockers.length > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-red-500/30 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-red-400/50">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-300" />
                  {activeBlockers.length} blocker{activeBlockers.length > 1 ? 's' : ''}
                </span>
              )}
              <DarkModeToggle />
              <button
                onClick={() => {
                  const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
                  window.dispatchEvent(event)
                }}
                className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25 ring-1 ring-white/20"
                title="Abrir paleta de comandos (Ctrl+K)"
              >
                ⌘K
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <motion.div
          className="flex flex-1 flex-col gap-4 overflow-y-auto p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {/* Milestone + Team */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              {activeMilestone ? (
                <MilestonePanel
                  milestone={activeMilestone}
                  tasks={state.tasks}
                  urgencyPhase={urgencyPhase}
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white/80 p-8">
                  <EmptyState icon="🏁" title="Sin milestone activo" description="Pedile al asistente que cree uno" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <TeamOverview
                members={state.members}
                tasks={state.tasks}
                blockers={state.blockers}
              />
              {/* Blockers — resolve button */}
              {activeBlockers.length > 0 && (
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-orange-500">Blockers activos</p>
                  <div className="space-y-2">
                    {activeBlockers.map(b => {
                      const member = state.members.find(m => m.id === b.memberId)
                      return (
                        <div key={b.id} className="rounded-lg bg-white p-2.5 ring-1 ring-orange-200">
                          <p className="text-xs font-semibold text-slate-700">{member?.name}</p>
                          <p className="mt-0.5 text-[11px] italic text-slate-500">"{b.description}"</p>
                          <button
                            onClick={() => handleResolveBlocker(b.id)}
                            className="mt-1.5 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-200 transition"
                          >
                            ✓ Resolver
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Kanban board */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Task Board</h2>
              <button
                onClick={() => setShowAddTask(v => !v)}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
              >
                {showAddTask ? '✕ Cancelar' : '＋ Nueva tarea'}
              </button>
            </div>

            {/* Add Task form */}
            {showAddTask && (
              <motion.div
                className="mb-4 rounded-xl border border-indigo-200 bg-white p-4 shadow-sm"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="mb-3 text-sm font-bold text-slate-700">Nueva tarea</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Título *</label>
                    <input
                      type="text"
                      value={taskForm.title}
                      onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Ej: Implementar login"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Descripción</label>
                    <input
                      type="text"
                      value={taskForm.description}
                      onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Detalles de la tarea"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Asignar a</label>
                    <select
                      value={taskForm.assignedTo}
                      onChange={e => setTaskForm(f => ({ ...f, assignedTo: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400"
                    >
                      {state.members.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Prioridad</label>
                    <select
                      value={taskForm.priority}
                      onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400"
                    >
                      <option value="high">Alta</option>
                      <option value="medium">Media</option>
                      <option value="low">Baja</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleAddTask}
                  disabled={!taskForm.title.trim()}
                  className="mt-3 w-full rounded-lg bg-indigo-600 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition disabled:opacity-40"
                >
                  Crear tarea
                </button>
              </motion.div>
            )}

            <div className="grid grid-cols-3 gap-4">
              {kanbanColumns.map(({ status, label, accent, countColor }) => {
                const tasks = state.tasks.filter(t => t.status === status)
                return (
                  <div key={status} className={`rounded-xl border-t-4 ${accent} bg-white/90 shadow-sm backdrop-blur-sm`}>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">{label}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${countColor}`}>
                        {tasks.length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 px-3 pb-3">
                      {tasks.map(t => (
                        <TaskCard
                          key={t.id}
                          task={{
                            ...t,
                            assignedTo: state.members.find(m => m.id === t.assignedTo)?.name ?? t.assignedTo,
                          }}
                          isHighlighted={state.highlightedTaskIds.includes(t.id)}
                          onStatusChange={handleTaskStatusChange}
                        />
                      ))}
                      {tasks.length === 0 && (
                        <EmptyState icon={status === 'done' ? '✅' : status === 'in-progress' ? '🔄' : '📋'} title="Sin tareas" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* Dev urgency buttons */}
        {process.env.NODE_ENV === 'development' && (
          <div className="flex items-center gap-2 border-t border-slate-200 bg-white/80 px-4 py-2 text-xs">
            <span className="text-slate-400">Dev:</span>
            <button onClick={() => simulateUrgency(45)} className="rounded bg-emerald-100 px-2 py-1 text-emerald-700 hover:bg-emerald-200">Normal</button>
            <button onClick={() => simulateUrgency(20)} className="rounded bg-yellow-100 px-2 py-1 text-yellow-700 hover:bg-yellow-200">Focus</button>
            <button onClick={() => simulateUrgency(8)}  className="rounded bg-orange-100 px-2 py-1 text-orange-700 hover:bg-orange-200">Urgent</button>
            <button onClick={() => simulateUrgency(3)}  className="rounded bg-red-100 px-2 py-1 text-red-700 hover:bg-red-200">Panic</button>
          </div>
        )}
      </div>

      {/* ── AI Chat panel ────────────────────────────────── */}
      <div className="flex w-[380px] shrink-0 flex-col border-l border-slate-200 bg-white shadow-xl">
        <div className="flex shrink-0 items-center gap-3 bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/25 text-base shadow-inner">✦</div>
          <div>
            <p className="text-sm font-bold text-white">AI Leader Assistant</p>
            <p className="text-[10px] text-indigo-200">Gestión de equipo inteligente</p>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <CopilotChat className="h-full" />
        </div>
      </div>

      {/* Mascot */}
      <div className="fixed bottom-6 right-[396px] z-50">
        <MascotSVG mood={state.mascotMood} mode={state.mascotMode} />
      </div>

      <CommandPalette state={state} />
    </div>
  )
}

function LeaderPage() {
  return (
    <CopilotChatConfigurationProvider agentId="crew_agent">
      <LeaderCanvas />
    </CopilotChatConfigurationProvider>
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
