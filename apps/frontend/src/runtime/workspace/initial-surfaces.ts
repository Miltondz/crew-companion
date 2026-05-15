import type { SurfaceEnvelope, RuntimeContext } from '@/runtime/surface-registry/types'
import type { CrewState, Task } from '@/lib/crew/types'
import { getUrgencyPhase } from '@/lib/crew/derive'

function makeEnvelope(
  surfaceId: string,
  payload: Record<string, unknown>,
  ctx: RuntimeContext,
  opts: { priority?: 'low' | 'medium' | 'high' | 'critical' } = {}
): SurfaceEnvelope {
  return {
    envelopeId: crypto.randomUUID(),
    agentId: 'workspace-init',
    emittedAt: Date.now(),
    intent: 'render_surface',
    priority: opts.priority ?? 'medium',
    surfaceId,
    payload,
    context: ctx,
    requiredCapabilities: ['state.read'],
    hibernatable: true,
    pinnable: true,
  }
}

const SEED_MEMBER_IDS = new Set(['m1', 'm2', 'm3'])
const SEED_TASK_IDS = new Set(['t1', 't2', 't3'])

export function getInitialSurfaces(
  state: CrewState,
  memberId: string,
  runtimeContext: RuntimeContext,
): SurfaceEnvelope[] {
  const { role, techLevel } = runtimeContext

  const hasRealMembers = state.members.some(m => !SEED_MEMBER_IDS.has(m.id))
  const hasRealTasks = state.tasks.some(t => !SEED_TASK_IDS.has(t.id))

  // Skip all surfaces when only seed/demo data is present
  if (!hasRealMembers && !hasRealTasks) return []

  // Exclude seed tasks from all surface computation
  const effectiveTasks = state.tasks.filter(t => !SEED_TASK_IDS.has(t.id))

  const member = state.members.find(m => m.id === memberId)
  const activeMilestone = state.milestones.find(m => m.id === state.activeMilestoneId)
  const deadline = activeMilestone?.deadline ?? ''
  const phase = getUrgencyPhase(deadline)
  const ctx = { ...runtimeContext, phase }

  const myBlocker = state.blockers.find(b => b.memberId === memberId && !b.resolved)
  const myTasks = role === 'member'
    ? effectiveTasks.filter(t => t.assignedTo === memberId)
    : effectiveTasks
  const activeTask = myTasks.find(t => t.status === 'in-progress') ?? myTasks.find(t => t.status === 'todo')
  const memberName = member?.name ?? memberId
  const minutesLeft = deadline
    ? Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 60000))
    : 0

  const surfaces: SurfaceEnvelope[] = []

  const specialization = member?.specialization

  if (role === 'leader') {
    if (phase === 'panic' || phase === 'expired') {
      const pending = activeMilestone
        ? effectiveTasks.filter(t => activeMilestone.taskIds.includes(t.id) && t.status !== 'done')
        : effectiveTasks.filter(t => t.status !== 'done')

      if (pending.length > 0) {
        surfaces.push(makeEnvelope('triage_war_room', {
          title: phase === 'expired' ? 'Deadline expirado' : 'Modo panico — triaje inmediato',
          decisions: pending.slice(0, 5).map(t => ({
            id: t.id,
            description: t.title,
            impact: t.priority === 'high' ? 'Critico' : t.priority === 'medium' ? 'Importante' : 'Bajo impacto',
            executor: state.members.find(m => m.id === t.assignedTo)?.name,
          })),
        }, ctx, { priority: 'critical' }))
      }
    } else if (specialization === 'manager') {
      const effectiveMembers = state.members.filter(m => !SEED_MEMBER_IDS.has(m.id))
      const allMembers = effectiveMembers.map(m => {
        const mTasks = effectiveTasks.filter(t => t.assignedTo === m.id)
        return {
          name: m.name,
          totalTasks: mTasks.length,
          doneTasks: mTasks.filter(t => t.status === 'done').length,
          activeTasks: mTasks.filter(t => t.status === 'in-progress').length,
          blockers: state.blockers.filter(b => b.memberId === m.id && !b.resolved).length,
        }
      })
      const done = allMembers.reduce((s, m) => s + m.doneTasks, 0)
      const total = allMembers.reduce((s, m) => s + m.totalTasks, 0)
      const pct = total > 0 ? Math.round((done / total) * 100) : 0
      const hasBlockers = allMembers.some(m => m.blockers > 0)

      if (total > 0) {
        surfaces.push(makeEnvelope('team_velocity_panel', {
          milestone: activeMilestone?.title ?? 'Progreso del equipo',
          overallProgress: pct,
          riskLevel: hasBlockers ? 'high' : pct < 30 ? 'medium' : 'low',
          members: allMembers,
          recommendation: hasBlockers ? 'Hay miembros bloqueados — prioriza resolverlos.' : undefined,
        }, ctx, { priority: phase === 'urgent' ? 'high' : 'medium' }))
      }
    } else if (activeMilestone) {
      const mapTask = (t: Task) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        assignedTo: state.members.find(m => m.id === t.assignedTo)?.name ?? t.assignedTo,
      })

      const milestoneTasks = effectiveTasks.filter(t => activeMilestone.taskIds.includes(t.id))
      const completedTasks = milestoneTasks.filter(t => t.status === 'done').map(mapTask)
      const pendingTasks = milestoneTasks.filter(t => t.status !== 'done').map(mapTask)
      const atRiskTasks = pendingTasks.filter(t => t.priority === 'high')

      if (milestoneTasks.length > 0) {
        const recommendation =
          pendingTasks.length === 0
            ? 'Todo completado! Preparate para el deploy.'
            : atRiskTasks.length > 0
            ? `${atRiskTasks.length} tarea${atRiskTasks.length > 1 ? 's' : ''} de alta prioridad sin completar.`
            : `${pendingTasks.length} tarea${pendingTasks.length > 1 ? 's' : ''} pendiente${pendingTasks.length > 1 ? 's' : ''}.`

        surfaces.push(makeEnvelope('milestone_summary', {
          milestone: { id: activeMilestone.id, title: activeMilestone.title, deadline: activeMilestone.deadline },
          phase,
          minutesLeft,
          completedTasks,
          pendingTasks,
          atRiskTasks,
          recommendation,
        }, ctx, { priority: phase === 'urgent' ? 'high' : 'medium' }))
      }
    }
  } else {

    if (myBlocker) {
      if (specialization === 'developer' || specialization === 'qa') {
        surfaces.push(makeEnvelope('debug_session', {
          title: 'Sesion de debug',
          problem: myBlocker.description,
          steps: [
            { id: '1', description: 'Reproduci el problema en ambiente limpio', resolved: false },
            { id: '2', description: 'Revisa los logs del error completo', resolved: false },
            { id: '3', description: 'Verifica que dependencias y entorno esten correctos', resolved: false },
            { id: '4', description: 'Busca el error en docs/Stack Overflow', resolved: false },
          ],
        }, ctx, { priority: 'high' }))
      } else if (techLevel === 'low-tech') {
        surfaces.push(makeEnvelope('troubleshooting_wizard', {
          problem: myBlocker.description,
          steps: [
            {
              question: 'El problema es de configuracion o instalacion?',
              yesAction: 'Revisa las instrucciones del proyecto en los documentos compartidos.',
              noAction: 'Continua con el siguiente paso.',
            },
            {
              question: 'Entendes el problema pero no como resolverlo?',
              yesAction: 'Describe el problema al asistente con el mayor detalle posible.',
              noAction: 'Pidele al lider que revise el blocker contigo.',
            },
          ],
          escalateTo: 'Lider del equipo',
        }, ctx, { priority: 'high' }))
      } else {
        surfaces.push(makeEnvelope('checklist', {
          title: `Diagnostico: ${myBlocker.description.slice(0, 50)}`,
          items: [
            { id: '1', text: 'Revisa los logs del error', done: false, priority: 'high' },
            { id: '2', text: 'Reproduci el problema en ambiente limpio', done: false, priority: 'high' },
            { id: '3', text: 'Busca el error en la documentacion del proyecto', done: false, priority: 'medium' },
            { id: '4', text: 'Escala al lider si lo anterior no resuelve', done: false, priority: 'low' },
          ],
        }, ctx, { priority: 'high' }))
      }
    } else if (specialization === 'developer' || specialization === 'qa') {
      const qaPending = myTasks.filter(t => t.status !== 'done').slice(0, 6)
      if (specialization === 'qa' && qaPending.length > 0) {
        surfaces.push(makeEnvelope('test_case_board', {
          title: 'Casos de test pendientes',
          cases: qaPending.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description || '',
            status: 'pending' as const,
            priority: t.priority === 'high' ? 'high' as const : t.priority === 'medium' ? 'medium' as const : 'low' as const,
            assignedTo: memberName,
          })),
        }, ctx))
      } else if (qaPending.length > 0) {
        surfaces.push(makeEnvelope('checklist', {
          title: 'Tus tareas pendientes',
          items: qaPending.map(t => ({
            id: t.id,
            text: t.title,
            done: false,
            priority: t.priority,
          })),
          completionMessage: 'Todo completado!',
        }, ctx))
      }
    } else if (specialization === 'designer') {
      const pendingDesignTasks = myTasks.filter(t => t.status !== 'done').slice(0, 5)
      if (pendingDesignTasks.length > 0) {
        const deliverables = pendingDesignTasks.map(t => ({
          title: t.title,
          description: t.description || 'Entregable de diseno',
          status: t.status === 'in-progress' ? 'in-progress' as const : 'pending' as const,
        }))

        surfaces.push(makeEnvelope('design_brief_panel', {
          projectName: activeMilestone?.title ?? 'Proyecto',
          objective: `Disenar los assets visuales para: ${activeMilestone?.title ?? 'el proyecto'}`,
          deliverables,
          colorDirection: 'Por definir — consulta el brief del proyecto',
        }, ctx))
      }
    } else if (specialization === 'manager') {
      const effectiveMembers = state.members.filter(m => !SEED_MEMBER_IDS.has(m.id))
      const allMembers = effectiveMembers.map(m => {
        const mTasks = effectiveTasks.filter(t => t.assignedTo === m.id)
        return {
          name: m.name,
          totalTasks: mTasks.length,
          doneTasks: mTasks.filter(t => t.status === 'done').length,
          activeTasks: mTasks.filter(t => t.status === 'in-progress').length,
          blockers: state.blockers.filter(b => b.memberId === m.id && !b.resolved).length,
        }
      })
      const done = allMembers.reduce((s, m) => s + m.doneTasks, 0)
      const total = allMembers.reduce((s, m) => s + m.totalTasks, 0)
      const pct = total > 0 ? Math.round((done / total) * 100) : 0
      const hasBlockers = allMembers.some(m => m.blockers > 0)

      if (total > 0) {
        surfaces.push(makeEnvelope('team_velocity_panel', {
          milestone: activeMilestone?.title ?? 'Progreso del equipo',
          overallProgress: pct,
          riskLevel: hasBlockers ? 'high' : pct < 30 ? 'medium' : 'low',
          members: allMembers,
          recommendation: hasBlockers ? 'Hay miembros bloqueados — prioriza resolverlos.' : undefined,
        }, ctx))
      }
    } else if (specialization === 'writer') {
      surfaces.push(makeEnvelope('writing_checklist', {
        title: activeTask ? `Tarea: ${activeTask.title}` : 'Flujo de escritura',
        phase: 'draft',
        items: [
          { id: '1', text: 'Revisa el brief y el objetivo del contenido', done: false, tip: 'Asegurate de entender la audiencia antes de escribir.' },
          { id: '2', text: 'Define la estructura en puntos principales', done: false },
          { id: '3', text: 'Escribe el primer borrador sin editar', done: false, tip: 'No te detengas a corregir — primero termina el borrador.' },
          { id: '4', text: 'Revisa claridad, flujo y ortografia', done: false },
          { id: '5', text: 'Compartila para feedback del lider', done: false },
        ],
      }, ctx))
    } else if (phase === 'panic' || phase === 'expired') {
      if (activeTask) {
        surfaces.push(makeEnvelope('focused_task_panel', {
          taskId: activeTask.id,
          title: activeTask.title,
          description: activeTask.description,
          priority: activeTask.priority,
          status: activeTask.status,
          assignedTo: memberName,
        }, ctx, { priority: 'critical' }))
      }
    } else {
      if (techLevel === 'low-tech') {
        surfaces.push(makeEnvelope('beginner_guide', {
          topic: activeTask ? `Tu tarea: ${activeTask.title}` : 'Empezando con el proyecto',
          steps: [
            {
              stepNumber: 1,
              title: activeTask ? 'Revisa tu tarea asignada' : 'Revisa que hay para hacer',
              content: activeTask
                ? `Tu tarea es: "${activeTask.title}". ${activeTask.description || ''}`
                : 'Mira la seccion de tareas para ver que esta asignado a vos.',
              tip: 'Si algo no esta claro, preguntale al asistente de chat.',
            },
            {
              stepNumber: 2,
              title: 'Cambia el estado cuando empieces',
              content: 'Al empezar a trabajar, cambia el estado de la tarea a "En progreso".',
              tip: 'El lider puede ver en tiempo real cuando avanzas.',
            },
            {
              stepNumber: 3,
              title: 'Reporta si algo te bloquea',
              content: 'Si algo te impide avanzar, usa el boton naranja "Reportar blocker".',
              tip: 'Describe el problema con detalle — mas info = solucion mas rapida.',
            },
          ],
          estimatedMinutes: 5,
        }, ctx))
      } else {
        const pending = myTasks.filter(t => t.status !== 'done').slice(0, 8)
        if (pending.length > 0) {
          surfaces.push(makeEnvelope('checklist', {
            title: 'Tus tareas pendientes',
            items: pending.map(t => ({
              id: t.id,
              text: t.title,
              done: false,
              priority: t.priority,
            })),
            completionMessage: 'Todo completado!',
          }, ctx))
        } else if (activeTask) {
          surfaces.push(makeEnvelope('focused_task_panel', {
            taskId: activeTask.id,
            title: activeTask.title,
            description: activeTask.description,
            priority: activeTask.priority,
            status: activeTask.status,
            assignedTo: memberName,
          }, ctx))
        }
      }
    }
  }

  return surfaces
}
