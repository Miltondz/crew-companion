'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { Flag, LayoutGrid, Activity, Eye, EyeOff } from 'lucide-react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import {
  CopilotChat,
  CopilotChatConfigurationProvider,
  useConfigureSuggestions,
  useDefaultRenderTool,
  useFrontendTool,
} from '@copilotkit/react-core/v2'
import { ToolFallbackCard } from '@/components/copilot/ToolFallbackCard'
import { UrgencyBanner } from '@/components/shared/UrgencyBanner'
import { UsageBanner } from '@/components/shared/UsageBanner'
import { EmptyState } from '@/components/shared/EmptyState'
import { SurfaceHost } from '@/runtime/surface-registry/SurfaceHost'
import { adaptLegacyEnvelope, isLegacyEnvelope } from '@/runtime/surface-registry/adapter'
import { LegacyEnvelopeSchema, FullEnvelopeSchema } from '@/runtime/surface-registry/envelope-schema'
import { useRuntimeContext } from '@/runtime/surface-registry/useRuntimeContext'
import { MilestonePanel } from '@/components/leader/MilestonePanel'
import { TeamOverview } from '@/components/leader/TeamOverview'
import { SectionFrame } from '@/components/leader/SectionFrame'
import type { GridShape } from '@/components/leader/SectionFrame'
import { KanbanBoard } from '@/components/leader/KanbanBoard'
import { MinimizedTray } from '@/components/leader/MinimizedTray'
import type { MinimizedSection } from '@/components/leader/MinimizedTray'
import { Habitat } from '@/components/companion/Habitat'
import { companionBus } from '@/runtime/companion/EventBus'
import { useCrewAgent } from '@/lib/useCrewAgent'
import { getUrgencyPhase } from '@/lib/crew/derive'
import { fireCelebration, fireMilestoneConfetti } from '@/lib/confetti'
import { CommandPalette } from '@/components/shared/CommandPalette'
import { UserMenu } from '@/components/shared/UserMenu'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { MobileChatDrawer } from '@/components/shared/MobileChatDrawer'
import { useActivityStream } from '@/lib/useActivityStream'
import { layoutEngine } from '@/runtime/workspace/layout-engine'
import { getInitialSurfaces } from '@/runtime/workspace/initial-surfaces'
import { WorkspaceShell } from '@/runtime/workspace/WorkspaceShell'
import { useLayoutEngine } from '@/runtime/workspace/useLayoutEngine'
import { PrimaryWorkzoneRegion } from '@/runtime/workspace/regions/PrimaryWorkzoneRegion'
import type { CrewState, UrgencyPhase, TaskStatus, TaskPriority } from '@/lib/crew/types'
import type { SurfaceEnvelope } from '@/runtime/surface-registry/types'


const SEED_MEMBER_IDS = new Set(['m1', 'm2', 'm3'])
const SEED_TASK_IDS = new Set(['t1', 't2', 't3'])
const SEED_MILESTONE_IDS = new Set(['ms1'])

interface AddTaskForm {
  title: string
  description: string
  assignedTo: string
  priority: TaskPriority
}

function LeaderCanvas() {
  const router = useRouter()
  const { state, setState } = useCrewAgent()

  const layout = useLayoutEngine()
  const [urgencyPhase, setUrgencyPhase] = useState<UrgencyPhase>(state.urgencyPhase)
  const [showAddTask, setShowAddTask] = useState(false)
  const [inviteCode, setInviteCode] = useState<string>('')
  const [showMilestoneEdit, setShowMilestoneEdit] = useState(false)
  const [milestoneEditForm, setMilestoneEditForm] = useState({ title: '', deadline: '' })
  const [showCreateMilestone, setShowCreateMilestone] = useState(false)
  const [createMilestoneForm, setCreateMilestoneForm] = useState({ title: '', deadline: '' })

  const [milestoneAgentShape, setMilestoneAgentShape] = useState<GridShape | undefined>(undefined)
  const [taskBoardAgentShape, setTaskBoardAgentShape] = useState<GridShape | undefined>(undefined)
  const [activityAgentShape, setActivityAgentShape] = useState<GridShape | undefined>(undefined)

  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    if (typeof window === 'undefined') return ['milestone', 'task-board', 'activity']
    const stored = localStorage.getItem('section-order')
    return stored ? JSON.parse(stored) : ['milestone', 'task-board', 'activity']
  })
  const [minimizedSections, setMinimizedSections] = useState<Set<string>>(new Set())
  const [visibleColumns, setVisibleColumns] = useState<Set<TaskStatus>>(() => {
    if (typeof window === 'undefined') return new Set(['todo', 'in-progress', 'review', 'blocked', 'done'])
    const stored = localStorage.getItem('kanban-visible-columns')
    return stored ? new Set(JSON.parse(stored)) : new Set(['todo', 'in-progress', 'done'])
  })

  const sectionSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleSectionDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setSectionOrder(prev => {
      const oldIdx = prev.indexOf(active.id as string)
      const newIdx = prev.indexOf(over.id as string)
      const next = arrayMove(prev, oldIdx, newIdx)
      localStorage.setItem('section-order', JSON.stringify(next))
      return next
    })
  }, [])

  const handleSectionMinimize = useCallback((id: string, minimized: boolean) => {
    setMinimizedSections(prev => {
      const next = new Set(prev)
      if (minimized) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const toggleColumn = (status: TaskStatus) => {
    setVisibleColumns(prev => {
      const next = new Set(prev)
      if (next.has(status)) {
        if (next.size <= 1) return prev
        next.delete(status)
      } else {
        next.add(status)
      }
      localStorage.setItem('kanban-visible-columns', JSON.stringify([...next]))
      return next
    })
  }
  const hasRealMembers = state.members.some(m => !SEED_MEMBER_IDS.has(m.id))
  const hasRealTasks = state.tasks.some(t => !SEED_TASK_IDS.has(t.id))
  const effectiveMembers = state.members.filter(m => !SEED_MEMBER_IDS.has(m.id))
  const effectiveTasks = state.tasks.filter(t => !SEED_TASK_IDS.has(t.id))
  const { events: activityEvents, push: pushActivity } = useActivityStream()
  const [taskForm, setTaskForm] = useState<AddTaskForm>({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
  })

  useEffect(() => {
    fetch('/api/me/identity')
      .then(r => r.json())
      .then(d => {
        if (d.memberId && d.role !== 'leader') {
          router.replace(`/member/${d.memberId}`)
          return
        }
        setState(prev => ({ ...prev, actorRole: 'leader' }))
      })
      .catch(() => {})
    fetch('/api/projects')
      .then(r => r.json())
      .then((d: { projects?: Array<{ invite_code?: string }> }) => {
        const code = d.projects?.[0]?.invite_code
        if (code) setInviteCode(code)
      })
      .catch(() => {})
  }, [router])

  const activeMilestoneDeadline = state.milestones.find(m => m.id === state.activeMilestoneId)?.deadline ?? ''

  useEffect(() => {
    const sync = () => setUrgencyPhase(getUrgencyPhase(activeMilestoneDeadline))
    sync()
    const id = setInterval(sync, 30_000)
    return () => clearInterval(id)
  }, [activeMilestoneDeadline])

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
      setState(prev => {
        const task = prev.tasks.find(t => t.id === taskId)
        const member = prev.members.find(m => m.id === task?.assignedTo)
        if ((updates as { status?: string }).status === 'done') {
          pushActivity('task_done', `${member?.name ?? 'Asistente'} completó "${task?.title}"`, '✅')
        }
        return { ...prev, tasks: prev.tasks.map(t => (t.id === taskId ? { ...t, ...updates } : t)) }
      })
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

  useFrontendTool({
    name: 'reportBlocker',
    description: 'Registra un blocker para un miembro del equipo',
    parameters: z.object({ memberId: z.string(), description: z.string() }),
    handler: async ({ memberId: targetMemberId, description }) => {
      let memberName = targetMemberId
      const blockerId = crypto.randomUUID()
      setState(prev => {
        memberName = prev.members.find(m => m.id === targetMemberId)?.name ?? targetMemberId
        return {
          ...prev,
          blockers: [
            ...prev.blockers,
            {
              id: blockerId,
              memberId: targetMemberId,
              description,
              reportedAt: new Date().toISOString(),
              resolved: false,
            },
          ],
        }
      })
      companionBus.emit({ type: 'BLOCKER_CREATED', blockerId, memberId: targetMemberId })
      pushActivity('blocker_reported', `Blocker reportado para ${memberName}`, '⚠️')
      toast.warning(`Blocker: ${memberName}`, { description })
      return 'blocker registrado'
    },
  })

  useFrontendTool({
    name: 'logActivity',
    description: 'Registra un evento en el activity stream y muestra un toast',
    parameters: z.object({
      type: z.enum(['task_created', 'task_done', 'task_started', 'blocker_reported', 'blocker_resolved', 'milestone_complete', 'phase_change', 'doc_opened']),
      message: z.string(),
      icon: z.string().optional(),
    }),
    handler: async ({ type, message, icon }) => {
      pushActivity(type, message, icon ?? '📋')
      toast.info(message, { duration: 3000 })
      return 'logged'
    },
  })

  useFrontendTool({
    name: 'addMember',
    description: 'Añade un nuevo miembro al equipo con nombre, rol y especialización',
    parameters: z.object({
      name: z.string(),
      role: z.enum(['leader', 'member']),
      specialization: z.enum(['developer', 'designer', 'qa', 'manager', 'writer', 'other']).optional(),
      technicalLevel: z.enum(['low-tech', 'high-tech']).optional(),
    }),
    handler: async ({ name, role, specialization, technicalLevel }) => {
      const id = crypto.randomUUID()
      setState(prev => ({
        ...prev,
        members: [...prev.members, {
          id,
          name,
          role,
          specialization,
          technicalLevel: technicalLevel ?? 'low-tech',
        }],
      }))
      toast.success(`${name} añadido al equipo`)
      pushActivity('task_created', `${name} se unió como ${specialization ?? role}`, '👤')
      return `miembro ${name} (${id}) añadido`
    },
  })

  useFrontendTool({
    name: 'controlWorkspace',
    description: 'Controla el layout del workspace: expande, compacta o resalta secciones según el contexto',
    parameters: z.object({
      section: z.enum(['milestone', 'task-board', 'activity']),
      shape: z.enum(['compact', 'normal', 'wide', 'hero']),
    }),
    handler: async ({ section, shape }) => {
      const s = shape as GridShape
      if (section === 'milestone') setMilestoneAgentShape(s)
      else if (section === 'task-board') setTaskBoardAgentShape(s)
      else if (section === 'activity') setActivityAgentShape(s)
      return `${section} → ${shape}`
    },
  })

  const currentLeader = state.members.find(m => m.id === state.currentMemberId)
  const runtimeContext = useRuntimeContext({
    role: 'leader',
    specialization: currentLeader?.specialization,
    phase: urgencyPhase,
    hasActiveBlocker: state.blockers.some(b => !b.resolved),
  })

  const initialSurfacesMounted = useRef(false)
  useEffect(() => {
    if (initialSurfacesMounted.current) return
    initialSurfacesMounted.current = true
    getInitialSurfaces(state, state.currentMemberId, runtimeContext).forEach(env => layoutEngine.mount(env, runtimeContext))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        : (args.envelope as SurfaceEnvelope)
      const result = layoutEngine.mount(fullEnvelope, runtimeContext)
      if (!result.ok) {
        return <SurfaceHost envelope={fullEnvelope} context={runtimeContext} />
      }
      return (
        <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-200">
          <span>🧩</span>
          <span>Superficie montada en workspace</span>
        </div>
      )
    },
  })

  useDefaultRenderTool({
    render: ({ name, status, result, parameters }) => (
      <ToolFallbackCard name={name} status={status} result={result} parameters={parameters} />
    ),
  })

  const activeMilestone = state.milestones.find(m => m.id === state.activeMilestoneId)
  const effectiveMilestone = SEED_MILESTONE_IDS.has(activeMilestone?.id ?? '') ? null : activeMilestone
  const activeBlockers = state.blockers.filter(b => !b.resolved)

  const handleTaskStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setState(prev => {
      const task = prev.tasks.find(t => t.id === taskId)
      const member = prev.members.find(m => m.id === task?.assignedTo)
      const updatedTasks = prev.tasks.map(t => (t.id === taskId ? { ...t, status: newStatus } : t))
      if (newStatus === 'done') {
        const milestone = prev.milestones.find(m => m.id === prev.activeMilestoneId)
        const milestoneTasks = milestone ? updatedTasks.filter(t => milestone.taskIds.includes(t.id)) : []
        const allDone = milestoneTasks.length > 0 && milestoneTasks.every(t => t.status === 'done')
        if (allDone) {
          toast.success('¡Milestone completado! 🏆', { description: milestone?.title, duration: 5000 })
          fireMilestoneConfetti()
          companionBus.emit({ type: 'MILESTONE_COMPLETE', milestoneId: milestone?.id ?? '', title: milestone?.title ?? 'Milestone' })
          pushActivity('milestone_complete', `Milestone "${milestone?.title}" completado`, '🏆')
        } else {
          toast.success('Tarea completada')
          fireCelebration()
          pushActivity('task_done', `${member?.name ?? 'Alguien'} completó "${task?.title}"`, '✅')
        }
      } else if (newStatus === 'in-progress') {
        pushActivity('task_started', `${member?.name ?? 'Alguien'} empezó "${task?.title}"`, '🔄')
      }
      return { ...prev, tasks: updatedTasks }
    })
  }

  const handleAddTask = () => {
    if (!taskForm.title.trim()) return
    const newTask = {
      id: crypto.randomUUID(),
      title: taskForm.title.trim(),
      description: taskForm.description.trim(),
      assignedTo: taskForm.assignedTo,
      status: 'todo' as TaskStatus,
      priority: taskForm.priority,
      createdAt: new Date().toISOString(),
      milestoneId: SEED_MILESTONE_IDS.has(state.activeMilestoneId ?? '') ? undefined : state.activeMilestoneId,
    }
    const assignee = state.members.find(m => m.id === newTask.assignedTo)
    setState(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
      milestones: SEED_MILESTONE_IDS.has(prev.activeMilestoneId ?? '')
        ? prev.milestones
        : prev.milestones.map(m =>
            m.id === prev.activeMilestoneId
              ? { ...m, taskIds: [...m.taskIds, newTask.id] }
              : m
          ),
    }))
    toast.success('Tarea creada', { description: newTask.title })
    pushActivity('task_created', `Nueva tarea "${newTask.title}" → ${assignee?.name ?? 'sin asignar'}`, '📋')
    setTaskForm({ title: '', description: '', assignedTo: '', priority: 'medium' })
    setShowAddTask(false)
  }

  const handleResolveBlocker = (blockerId: string) => {
    const blocker = state.blockers.find(b => b.id === blockerId)
    const member = state.members.find(m => m.id === blocker?.memberId)
    setState(prev => ({
      ...prev,
      blockers: prev.blockers.map(b =>
        b.id === blockerId ? { ...b, resolved: true, resolvedAt: new Date().toISOString() } : b
      ),
    }))
    companionBus.emit({ type: 'BLOCKER_RESOLVED', blockerId })
    toast.success('Blocker resuelto ✓')
    pushActivity('blocker_resolved', `Blocker de ${member?.name ?? 'miembro'} resuelto`, '🔓')
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

  const handleOpenMilestoneEdit = () => {
    if (!effectiveMilestone) return
    setMilestoneEditForm({
      title: effectiveMilestone.title,
      deadline: effectiveMilestone.deadline
        ? new Date(effectiveMilestone.deadline).toISOString().slice(0, 16)
        : '',
    })
    setShowMilestoneEdit(true)
  }

  const handleSaveMilestone = () => {
    if (!milestoneEditForm.title.trim() || !effectiveMilestone) return
    setState(prev => ({
      ...prev,
      milestones: prev.milestones.map(m =>
        m.id === prev.activeMilestoneId
          ? {
              ...m,
              title: milestoneEditForm.title.trim(),
              deadline: milestoneEditForm.deadline
                ? new Date(milestoneEditForm.deadline).toISOString()
                : m.deadline,
            }
          : m
      ),
    }))
    toast.success('Milestone actualizado')
    setShowMilestoneEdit(false)
  }

  const handleDeleteMilestone = () => {
    if (!effectiveMilestone) return
    if (!window.confirm(`¿Eliminar "${effectiveMilestone.title}"? Se eliminarán sus tareas.`)) return
    const deletedId = state.activeMilestoneId
    setState(prev => ({
      ...prev,
      milestones: prev.milestones.filter(m => m.id !== deletedId),
      tasks: prev.tasks.filter(t => t.milestoneId !== deletedId),
      activeMilestoneId: '',
    }))
    toast.success('Milestone eliminado')
    setShowMilestoneEdit(false)
  }

  const handleCreateMilestone = () => {
    if (!createMilestoneForm.title.trim()) return
    const id = crypto.randomUUID()
    setState(prev => ({
      ...prev,
      milestones: [...prev.milestones, {
        id,
        title: createMilestoneForm.title.trim(),
        deadline: createMilestoneForm.deadline ? new Date(createMilestoneForm.deadline).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        taskIds: [],
      }],
      activeMilestoneId: id,
    }))
    toast.success('Milestone creado', { description: createMilestoneForm.title })
    setCreateMilestoneForm({ title: '', deadline: '' })
    setShowCreateMilestone(false)
  }

  const allKanbanColumns: { status: TaskStatus; label: string; accent: string; bg: string; countColor: string }[] = [
    { status: 'todo',        label: 'Por hacer',   accent: 'border-t-slate-400',    bg: 'bg-slate-50',       countColor: 'bg-slate-100 text-slate-600'     },
    { status: 'in-progress', label: 'En progreso', accent: 'border-t-blue-500',     bg: 'bg-blue-50/60',     countColor: 'bg-blue-100 text-blue-700'       },
    { status: 'review',      label: 'En revisión', accent: 'border-t-violet-400',   bg: 'bg-violet-50/50',   countColor: 'bg-violet-100 text-violet-700'   },
    { status: 'blocked',     label: 'Bloqueado',   accent: 'border-t-red-400',      bg: 'bg-red-50/50',      countColor: 'bg-red-100 text-red-700'         },
    { status: 'done',        label: 'Completado',  accent: 'border-t-emerald-500',  bg: 'bg-emerald-50/60',  countColor: 'bg-emerald-100 text-emerald-700' },
  ]
  const kanbanColumns = allKanbanColumns.filter(c => visibleColumns.has(c.status))

  return (
    <>
      <WorkspaceShell
        phase={urgencyPhase}
        agentRail={<CopilotChat className="h-full" />}
        habitat={
          <Habitat
            phase={urgencyPhase}
            techLevel={(state.members.find(m => m.id === state.currentMemberId)?.technicalLevel as 'low-tech' | 'high-tech') ?? 'low-tech'}
            pendingTasks={effectiveMilestone ? effectiveTasks.filter(t => effectiveMilestone.taskIds.includes(t.id) && t.status !== 'done').length : 0}
            activeBlockers={activeBlockers.length}
            minutesLeft={effectiveMilestone ? Math.max(0, Math.floor((new Date(effectiveMilestone.deadline).getTime() - Date.now()) / 60000)) : null}
            progress={effectiveMilestone && effectiveMilestone.taskIds.length > 0 ? Math.round((effectiveTasks.filter(t => effectiveMilestone.taskIds.includes(t.id) && t.status === 'done').length / effectiveMilestone.taskIds.length) * 100) : 0}
            tasks={effectiveTasks}
          />
        }
      >
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <UsageBanner />
          <UrgencyBanner phase={urgencyPhase} />

          {/* Header */}
          <header className="shrink-0 bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-xl shadow-inner">⚡</div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white">Leader Dashboard</h1>
                {effectiveMilestone && (
                  <p className="text-xs text-indigo-200">{effectiveMilestone.title}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {hasRealMembers && effectiveMembers.map(m => (
                <button
                  key={m.id}
                  onClick={() => router.push(`/member/${m.id}`)}
                  className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25 ring-1 ring-white/20"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25 text-[10px] font-bold">
                    {m.name?.[0] ?? '?'}
                  </span>
                  {m.name}
                  {state.blockers.find(b => b.memberId === m.id && !b.resolved) && (
                    <span className="text-red-300">⚠</span>
                  )}
                </button>
              ))}
              {!hasRealMembers && (
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-indigo-200/60 ring-1 ring-white/10">
                  Sin miembros — invita tu equipo
                </span>
              )}
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
              {inviteCode && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/invite/${inviteCode}`)
                      .then(() => toast.success('Link de invitación copiado'))
                      .catch(() => toast.info(`Código: ${inviteCode}`))
                  }}
                  className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25 ring-1 ring-white/20"
                  title="Copiar link de invitación"
                >
                  🔗 Invitar
                </button>
              )}
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
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <motion.div
          className="flex flex-1 flex-col overflow-y-auto p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <PrimaryWorkzoneRegion mounts={layout['primary-workzone'].mounts} phase={urgencyPhase} />

          {/* Minimized pill tray */}
          <MinimizedTray
            sections={sectionOrder
              .filter(id => minimizedSections.has(id))
              .map(id => {
                if (id === 'milestone') return {
                  id, title: 'Milestone & Equipo', color: 'indigo' as const, Icon: Flag,
                  summary: effectiveMilestone
                    ? `${effectiveTasks.filter(t => effectiveMilestone.taskIds.includes(t.id) && t.status === 'done').length}/${effectiveMilestone.taskIds.length} tareas`
                    : 'Sin milestone',
                }
                if (id === 'task-board') return {
                  id, title: 'Task Board', color: 'blue' as const, Icon: LayoutGrid,
                  summary: `${effectiveTasks.filter(t => t.status === 'done').length}/${effectiveTasks.length} done`,
                }
                return {
                  id, title: 'Actividad', color: 'emerald' as const, Icon: Activity,
                  summary: activityEvents[0]?.message ?? 'Sin actividad',
                }
              }) as MinimizedSection[]}
            onRestore={id => handleSectionMinimize(id, false)}
          />

          {/* Bento grid — sortable sections */}
          <DndContext
            sensors={sectionSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleSectionDragEnd}
          >
            <SortableContext items={sectionOrder} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-6 gap-4 content-start">

            {/* MILESTONE */}
            {!minimizedSections.has('milestone') && (
            <SectionFrame
              id="milestone"
              title="Milestone & Equipo"
              color="indigo"
              Icon={Flag}
              phase={urgencyPhase}
              supportedShapes={['compact', 'normal', 'wide']}
              agentShape={milestoneAgentShape}
              isMinimized={minimizedSections.has('milestone')}
              onMinimize={handleSectionMinimize}
              actions={
                effectiveMilestone && !SEED_MILESTONE_IDS.has(effectiveMilestone.id) ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleOpenMilestoneEdit}
                      className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                    >✏️</button>
                    <button
                      onClick={handleDeleteMilestone}
                      className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
                    >🗑️</button>
                  </div>
                ) : undefined
              }
            >
              <div className="p-4">
                {showMilestoneEdit && (
                  <motion.div
                    className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="mb-3 text-sm font-bold text-slate-700">Editar milestone</p>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Nombre</label>
                        <input type="text" value={milestoneEditForm.title}
                          onChange={e => setMilestoneEditForm(f => ({ ...f, title: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Deadline</label>
                        <input type="datetime-local" value={milestoneEditForm.deadline}
                          onChange={e => setMilestoneEditForm(f => ({ ...f, deadline: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" />
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={handleSaveMilestone} disabled={!milestoneEditForm.title.trim()}
                        className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition disabled:opacity-40">Guardar</button>
                      <button onClick={() => setShowMilestoneEdit(false)}
                        className="rounded-lg bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition">Cancelar</button>
                    </div>
                  </motion.div>
                )}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    {effectiveMilestone ? (
                      <MilestonePanel milestone={effectiveMilestone} tasks={effectiveTasks} urgencyPhase={urgencyPhase} />
                    ) : (
                      <div className="rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 p-6">
                        {!showCreateMilestone ? (
                          <div className="flex flex-col items-center gap-3 text-center">
                            <span className="text-3xl">🏁</span>
                            <div>
                              <p className="text-sm font-semibold text-slate-700">Sin milestone activo</p>
                              <p className="text-xs text-slate-400 mt-0.5">Creá uno para empezar a trackear el proyecto</p>
                            </div>
                            <button onClick={() => setShowCreateMilestone(true)}
                              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition">
                              + Crear milestone
                            </button>
                          </div>
                        ) : (
                          <div>
                            <p className="mb-3 text-sm font-bold text-slate-700">Nuevo milestone</p>
                            <div className="space-y-3">
                              <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Nombre *</label>
                                <input type="text" value={createMilestoneForm.title}
                                  onChange={e => setCreateMilestoneForm(f => ({ ...f, title: e.target.value }))}
                                  placeholder="Ej: MVP launch" autoFocus
                                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" />
                              </div>
                              <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Deadline</label>
                                <input type="datetime-local" value={createMilestoneForm.deadline}
                                  onChange={e => setCreateMilestoneForm(f => ({ ...f, deadline: e.target.value }))}
                                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" />
                              </div>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <button onClick={handleCreateMilestone} disabled={!createMilestoneForm.title.trim()}
                                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition disabled:opacity-40">Crear</button>
                              <button onClick={() => setShowCreateMilestone(false)}
                                className="rounded-lg bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition">Cancelar</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    <TeamOverview members={effectiveMembers} tasks={effectiveTasks} blockers={state.blockers} />
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
                                <button onClick={() => handleResolveBlocker(b.id)}
                                  className="mt-1.5 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-200 transition">
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
              </div>
            </SectionFrame>
            )}

            {/* TASK BOARD */}
            {!minimizedSections.has('task-board') && (
            <SectionFrame
              id="task-board"
              title="Task Board"
              color="blue"
              Icon={LayoutGrid}
              phase={urgencyPhase}
              supportedShapes={['normal', 'wide', 'hero']}
              agentShape={taskBoardAgentShape}
              isMinimized={minimizedSections.has('task-board')}
              onMinimize={handleSectionMinimize}
              actions={
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowAddTask(v => !v)}
                    className="flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-700 hover:bg-blue-500/30 transition"
                  >
                    {showAddTask ? '✕' : '＋ Tarea'}
                  </button>
                  <div className="relative group">
                    <button className="rounded p-0.5 text-slate-300 hover:text-blue-500 transition" title="Columnas visibles">
                      <Eye size={10} />
                    </button>
                    <div className="absolute right-0 top-full mt-1 z-20 hidden group-hover:flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg min-w-[130px]">
                      {allKanbanColumns.map(col => (
                        <button
                          key={col.status}
                          onClick={() => toggleColumn(col.status)}
                          className="flex items-center gap-2 rounded-lg px-2 py-1 text-[10px] hover:bg-slate-50 transition text-left"
                        >
                          {visibleColumns.has(col.status)
                            ? <Eye size={9} className="text-blue-500 shrink-0" />
                            : <EyeOff size={9} className="text-slate-300 shrink-0" />}
                          <span className={visibleColumns.has(col.status) ? 'text-slate-700 font-semibold' : 'text-slate-400'}>
                            {col.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              }
            >
              <div className="p-4">
                <AnimatePresence initial={false}>
                  {showAddTask && (
                    <motion.div
                      key="add-task-form"
                      className="mb-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="mb-3 text-sm font-bold text-slate-700">Nueva tarea</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Título *</label>
                          <input type="text" value={taskForm.title}
                            onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="Ej: Implementar login"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
                        </div>
                        <div className="col-span-2">
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Descripción</label>
                          <input type="text" value={taskForm.description}
                            onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Detalles opcionales"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Asignar a</label>
                          <select value={taskForm.assignedTo}
                            onChange={e => setTaskForm(f => ({ ...f, assignedTo: e.target.value }))}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400">
                            <option value="">Sin asignar</option>
                            {effectiveMembers.map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Prioridad</label>
                          <select value={taskForm.priority}
                            onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400">
                            <option value="high">Alta</option>
                            <option value="medium">Media</option>
                            <option value="low">Baja</option>
                          </select>
                        </div>
                      </div>
                      <button onClick={handleAddTask} disabled={!taskForm.title.trim()}
                        className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-sm font-bold text-white hover:bg-blue-700 transition disabled:opacity-40">
                        Crear tarea
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <KanbanBoard
                  tasks={effectiveTasks}
                  members={effectiveMembers}
                  columns={kanbanColumns}
                  highlightedTaskIds={state.highlightedTaskIds}
                  hasRealTasks={hasRealTasks}
                  onStatusChange={handleTaskStatusChange}
                />
              </div>
            </SectionFrame>
            )}

            {/* ACTIVITY STREAM */}
            {!minimizedSections.has('activity') && (
            <SectionFrame
              id="activity"
              title="Actividad reciente"
              color="emerald"
              Icon={Activity}
              phase={urgencyPhase}
              supportedShapes={['compact', 'normal', 'wide']}
              agentShape={activityAgentShape}
              isMinimized={minimizedSections.has('activity')}
              onMinimize={handleSectionMinimize}
            >
              <div className="p-4">
                {activityEvents.length === 0 ? (
                  <EmptyState icon="📭" title="Sin actividad reciente" />
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {activityEvents.slice(0, 20).map((ev, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className="text-base leading-none mt-0.5">{ev.icon ?? '📋'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-700 font-medium leading-tight">{ev.message}</p>
                          <p className="text-slate-400 text-[10px] mt-0.5">{ev.timestamp.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionFrame>
            )}

              </div>
            </SortableContext>
          </DndContext>
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
      </WorkspaceShell>

      <MobileChatDrawer accentClass="from-indigo-600 to-violet-600" label="AI Leader Assistant" />
      <CommandPalette state={state} />
    </>
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
