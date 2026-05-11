'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
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
import { EmptyState } from '@/components/shared/EmptyState'
import { ActiveTaskView } from '@/components/member/ActiveTaskView'
import { SurfaceHost } from '@/runtime/surface-registry/SurfaceHost'
import { adaptLegacyEnvelope, isLegacyEnvelope } from '@/runtime/surface-registry/adapter'
import { useRuntimeContext } from '@/runtime/surface-registry/useRuntimeContext'
import { MilestoneCountdown } from '@/components/member/MilestoneCountdown'
import { MascotSVG } from '@/components/mascot/MascotSVG'
import { SEED_STATE } from '@/lib/crew/seed'
import { getUrgencyPhase } from '@/lib/crew/derive'
import { fireCelebration } from '@/lib/confetti'
import { MobileChatDrawer } from '@/components/shared/MobileChatDrawer'
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
  const { agent } = useAgent({ agentId: "crew_agent" })
  const state = mergeCrewState(agent?.state)
  const setState = (updater: (prev: CrewState) => CrewState) => {
    agent?.setState(updater(mergeCrewState(agent?.state)))
  }
  return { agent, state, setState }
}

function MemberCanvas({ memberId }: { memberId: string }) {
  const router = useRouter()
  const { state, setState } = useCrewAgent()

  const [urgencyPhase, setUrgencyPhase] = useState<UrgencyPhase>(state.urgencyPhase)
  const [blockerText, setBlockerText] = useState('')
  const [showBlockerForm, setShowBlockerForm] = useState(false)
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
      toast.success('Tarea actualizada')
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
      toast.warning('Blocker reportado al líder', { description })
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

  const runtimeContext = useRuntimeContext({
    role: 'member',
    techLevel: currentMember?.technicalLevel,
    phase: urgencyPhase,
    hasActiveBlocker: !!myBlocker,
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

  const handleMarkDone = (taskId: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => (t.id === taskId ? { ...t, status: 'done' } : t)),
    }))
    toast.success('¡Tarea completada! 🎉')
    fireCelebration()
  }

  const handleReportBlocker = () => {
    if (!blockerText.trim()) return
    setState(prev => ({
      ...prev,
      blockers: [
        ...prev.blockers,
        {
          id: crypto.randomUUID(),
          memberId,
          description: blockerText.trim(),
          reportedAt: new Date().toISOString(),
          resolved: false,
        },
      ],
    }))
    toast.warning('Blocker reportado al líder')
    setBlockerText('')
    setShowBlockerForm(false)
  }

  const taskStatusDot: Record<string, string> = {
    'todo':        'bg-slate-400',
    'in-progress': 'bg-blue-500',
    'done':        'bg-emerald-500',
  }

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-1000 phase-bg-${urgencyPhase}`}>

      {/* ── Member workspace ─────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <UrgencyBanner phase={urgencyPhase} milestoneTitle={activeMilestone?.title} />

        {/* Emerald gradient header */}
        <header className="shrink-0 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/leader')}
                className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/25 transition ring-1 ring-white/20"
              >
                ← Líder
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-xl font-bold text-white shadow-inner">
                {currentMember?.name?.[0] ?? '?'}
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white">
                  {currentMember?.name ?? memberId}
                </h1>
                <p className="text-xs capitalize text-emerald-200">
                  {currentMember?.role} · {currentMember?.technicalLevel}
                </p>
              </div>
            </div>

            {/* Switch member */}
            <div className="flex items-center gap-2">
              {state.members.filter(m => m.id !== memberId).map(m => (
                <button
                  key={m.id}
                  onClick={() => router.push(`/member/${m.id}`)}
                  className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/25 transition ring-1 ring-white/20"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/25 text-[9px]">{m.name[0]}</span>
                  {m.name}
                </button>
              ))}
              <button
                onClick={() => router.push('/docs')}
                className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/25 transition ring-1 ring-white/20"
              >
                📄
              </button>
            </div>

            {myBlocker && (
              <span className="shrink-0 flex items-center gap-1.5 rounded-full bg-red-500/30 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-red-400/50">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-300" />
                Blocker activo
              </span>
            )}
          </div>
        </header>

        {/* Scrollable content */}
        <motion.div
          className="flex flex-1 flex-col gap-5 overflow-y-auto p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {/* Active task + countdown row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <ActiveTaskView
                task={activeTask}
                memberName={currentMember?.name ?? memberId}
                onMarkDone={handleMarkDone}
              />
            </div>
            <div className="flex flex-col gap-3">
              {/* Countdown card */}
              <div className={`rounded-xl border-2 bg-white/90 p-4 shadow-sm backdrop-blur-sm transition-colors duration-300 ${
                urgencyPhase === 'panic'   ? 'border-red-400'    :
                urgencyPhase === 'urgent'  ? 'border-orange-400' :
                urgencyPhase === 'focus'   ? 'border-yellow-400' :
                urgencyPhase === 'expired' ? 'border-red-700'    :
                                             'border-slate-200'
              }`}>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Tiempo restante</p>
                {activeMilestone ? (
                  <MilestoneCountdown
                    deadline={activeMilestone.deadline}
                    milestoneTitle={activeMilestone.title}
                    compact={false}
                  />
                ) : (
                  <p className="text-sm text-slate-400">Sin deadline</p>
                )}
              </div>

              {/* Blocker panel */}
              <div className={`rounded-xl border-2 bg-white/90 p-4 shadow-sm backdrop-blur-sm ${myBlocker ? 'border-orange-300' : 'border-slate-200'}`}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Blocker</p>
                  {!myBlocker && (
                    <button
                      onClick={() => setShowBlockerForm(v => !v)}
                      className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700 hover:bg-orange-200 transition"
                    >
                      {showBlockerForm ? '✕' : '＋ Reportar'}
                    </button>
                  )}
                </div>
                {myBlocker ? (
                  <div className="rounded-lg bg-orange-50 p-2.5 ring-1 ring-orange-200">
                    <div className="mb-1 flex items-center gap-1.5">
                      <span>⚠️</span>
                      <span className="text-xs font-semibold text-orange-700">Activo</span>
                    </div>
                    <p className="text-xs italic text-orange-600">"{myBlocker.description}"</p>
                  </div>
                ) : showBlockerForm ? (
                  <div className="space-y-2">
                    <textarea
                      value={blockerText}
                      onChange={e => setBlockerText(e.target.value)}
                      placeholder="Describí tu problema..."
                      rows={2}
                      className="w-full resize-none rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-700 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                    />
                    <button
                      onClick={handleReportBlocker}
                      disabled={!blockerText.trim()}
                      className="w-full rounded-lg bg-orange-500 py-1.5 text-xs font-bold text-white hover:bg-orange-600 transition disabled:opacity-40"
                    >
                      Reportar blocker
                    </button>
                  </div>
                ) : (
                  <EmptyState icon="✅" title="Sin blockers" />
                )}
              </div>
            </div>
          </div>

          {/* All my tasks */}
          <div className="rounded-xl bg-white/90 p-5 shadow-sm backdrop-blur-sm">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Todas mis tareas ({myTasks.length})
            </h2>
            {myTasks.length === 0 ? (
              <EmptyState icon="📋" title="Sin tareas asignadas" description="El líder te asignará tareas pronto" />
            ) : (
              <div className="space-y-2">
                {myTasks.map(t => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5 transition-colors hover:bg-slate-100"
                  >
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${taskStatusDot[t.status] ?? 'bg-slate-400'}`} />
                    <p className={`flex-1 text-sm ${t.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
                      {t.title}
                    </p>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      t.priority === 'high'   ? 'bg-red-100 text-red-700' :
                      t.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-green-100 text-green-700'
                    }`}>
                      {t.priority === 'high' ? 'Alta' : t.priority === 'medium' ? 'Media' : 'Baja'}
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      t.status === 'done'        ? 'bg-emerald-100 text-emerald-700' :
                      t.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                                   'bg-slate-100 text-slate-600'
                    }`}>
                      {t.status === 'done' ? 'Listo' : t.status === 'in-progress' ? 'En progreso' : 'Pendiente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── AI Chat panel — desktop only ─────────────────── */}
      <div className="hidden md:flex w-[380px] shrink-0 flex-col border-l border-slate-200 bg-white shadow-xl">
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/25 text-base shadow-inner">✦</div>
          <div>
            <p className="text-sm font-bold text-white">Asistente Personal</p>
            <p className="text-[10px] text-emerald-200">Tu AI de equipo</p>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <CopilotChat className="h-full" />
        </div>
      </div>

      {/* Mascot — bottom-right corner */}
      <div className="fixed bottom-6 right-6 md:right-[396px] z-50">
        <MascotSVG mood={state.mascotMood} mode={state.mascotMode} />
      </div>

      {/* Mobile chat drawer */}
      <MobileChatDrawer accentClass="from-emerald-600 to-teal-600" label="Asistente Personal" />
    </div>
  )
}

function MemberPage({ memberId }: { memberId: string }) {
  return (
    <CopilotChatConfigurationProvider agentId="crew_agent">
      <MemberCanvas memberId={memberId} />
    </CopilotChatConfigurationProvider>
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
