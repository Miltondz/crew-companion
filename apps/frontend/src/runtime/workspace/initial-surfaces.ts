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

export function getInitialSurfaces(
  state: CrewState,
  memberId: string,
  runtimeContext: RuntimeContext,
): SurfaceEnvelope[] {
  const { role, techLevel } = runtimeContext

  const member = state.members.find(m => m.id === memberId)
  const activeMilestone = state.milestones.find(m => m.id === state.activeMilestoneId)
  const deadline = activeMilestone?.deadline ?? ''
  const phase = getUrgencyPhase(deadline)
  const ctx = { ...runtimeContext, phase }

  const myBlocker = state.blockers.find(b => b.memberId === memberId && !b.resolved)
  const myTasks = role === 'member'
    ? state.tasks.filter(t => t.assignedTo === memberId)
    : state.tasks
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
        ? state.tasks.filter(t => activeMilestone.taskIds.includes(t.id) && t.status !== 'done')
        : state.tasks.filter(t => t.status !== 'done')

      if (pending.length > 0) {
        surfaces.push(makeEnvelope('triage_war_room', {
          title: phase === 'expired' ? '⛔ Deadline expirado' : '🚨 Modo pánico — triaje inmediato',
          decisions: pending.slice(0, 5).map(t => ({
            id: t.id,
            description: t.title,
            impact: t.priority === 'high' ? 'Crítico' : t.priority === 'medium' ? 'Importante' : 'Bajo impacto',
            executor: state.members.find(m => m.id === t.assignedTo)?.name,
          })),
        }, ctx, { priority: 'critical' }))
      }
    } else if (specialization === 'manager') {
      // Manager-leader gets team velocity view instead of milestone summary
      const allMembers = state.members.map(m => {
        const mTasks = state.tasks.filter(t => t.assignedTo === m.id)
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

      surfaces.push(makeEnvelope('team_velocity_panel', {
        milestone: activeMilestone?.title ?? 'Progreso del equipo',
        overallProgress: pct,
        riskLevel: hasBlockers ? 'high' : pct < 30 ? 'medium' : 'low',
        members: allMembers,
        recommendation: hasBlockers ? 'Hay miembros bloqueados — priorizá resolverlos.' : undefined,
      }, ctx, { priority: phase === 'urgent' ? 'high' : 'medium' }))
    } else if (activeMilestone) {
      const mapTask = (t: Task) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        assignedTo: state.members.find(m => m.id === t.assignedTo)?.name ?? t.assignedTo,
      })

      const milestoneTasks = state.tasks.filter(t => activeMilestone.taskIds.includes(t.id))
      const completedTasks = milestoneTasks.filter(t => t.status === 'done').map(mapTask)
      const pendingTasks = milestoneTasks.filter(t => t.status !== 'done').map(mapTask)
      const atRiskTasks = pendingTasks.filter(t => t.priority === 'high')

      const recommendation =
        pendingTasks.length === 0
          ? '¡Todo completado! Preparate para el deploy.'
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
  } else {

    if (myBlocker) {
      if (specialization === 'developer' || specialization === 'qa') {
        surfaces.push(makeEnvelope('debug_session', {
          title: 'Sesión de debug',
          problem: myBlocker.description,
          steps: [
            { id: '1', description: 'Reproducí el problema en ambiente limpio', resolved: false },
            { id: '2', description: 'Revisá los logs del error completo', resolved: false },
            { id: '3', description: 'Verificá que dependencias y entorno estén correctos', resolved: false },
            { id: '4', description: 'Buscá el error en docs/Stack Overflow', resolved: false },
          ],
        }, ctx, { priority: 'high' }))
      } else if (techLevel === 'low-tech') {
        surfaces.push(makeEnvelope('troubleshooting_wizard', {
          problem: myBlocker.description,
          steps: [
            {
              question: '¿El problema es de configuración o instalación?',
              yesAction: 'Revisá las instrucciones del proyecto en los documentos compartidos.',
              noAction: 'Continuá con el siguiente paso.',
            },
            {
              question: '¿Entendés el problema pero no cómo resolverlo?',
              yesAction: 'Describí el problema al asistente con el mayor detalle posible.',
              noAction: 'Pedile al líder que revise el blocker contigo.',
            },
          ],
          escalateTo: 'Líder del equipo',
        }, ctx, { priority: 'high' }))
      } else {
        surfaces.push(makeEnvelope('checklist', {
          title: `Diagnóstico: ${myBlocker.description.slice(0, 50)}`,
          items: [
            { id: '1', text: 'Revisá los logs del error', done: false, priority: 'high' },
            { id: '2', text: 'Reproducí el problema en ambiente limpio', done: false, priority: 'high' },
            { id: '3', text: 'Buscá el error en la documentación del proyecto', done: false, priority: 'medium' },
            { id: '4', text: 'Escalá al líder si lo anterior no resuelve', done: false, priority: 'low' },
          ],
        }, ctx, { priority: 'high' }))
      }
    } else if (specialization === 'developer' || specialization === 'qa') {
      // Developer/QA without blocker — tech stack or test board
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
      } else {
        // developer — show task checklist (same as high-tech default)
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
            completionMessage: '¡Todo completado! 🎉',
          }, ctx))
        }
      }
    } else if (specialization === 'designer') {
      const pendingDesignTasks = myTasks.filter(t => t.status !== 'done').slice(0, 5)
      const deliverables = pendingDesignTasks.length > 0
        ? pendingDesignTasks.map(t => ({
            title: t.title,
            description: t.description || 'Entregable de diseño',
            status: t.status === 'in-progress' ? 'in-progress' as const : 'pending' as const,
          }))
        : [{ title: 'Sin tareas pendientes', description: 'Todas las tareas completadas', status: 'pending' as const }]

      surfaces.push(makeEnvelope('design_brief_panel', {
        projectName: activeMilestone?.title ?? 'Proyecto',
        objective: `Diseñar los assets visuales para: ${activeMilestone?.title ?? 'el proyecto'}`,
        deliverables,
        colorDirection: 'Por definir — consultá el brief del proyecto',
      }, ctx))
    } else if (specialization === 'manager') {
      // Manager — team velocity panel
      const allMembers = state.members.map(m => {
        const mTasks = state.tasks.filter(t => t.assignedTo === m.id)
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

      surfaces.push(makeEnvelope('team_velocity_panel', {
        milestone: activeMilestone?.title ?? 'Progreso del equipo',
        overallProgress: pct,
        riskLevel: hasBlockers ? 'high' : pct < 30 ? 'medium' : 'low',
        members: allMembers,
        recommendation: hasBlockers ? 'Hay miembros bloqueados — priorizá resolverlos.' : undefined,
      }, ctx))
    } else if (specialization === 'writer') {
      surfaces.push(makeEnvelope('writing_checklist', {
        title: activeTask ? `Tarea: ${activeTask.title}` : 'Flujo de escritura',
        phase: 'draft',
        items: [
          { id: '1', text: 'Revisá el brief y el objetivo del contenido', done: false, tip: 'Asegurate de entender la audiencia antes de escribir.' },
          { id: '2', text: 'Definí la estructura en puntos principales', done: false },
          { id: '3', text: 'Escribí el primer borrador sin editar', done: false, tip: 'No te detengas a corregir — primero terminá el borrador.' },
          { id: '4', text: 'Revisá claridad, flujo y ortografía', done: false },
          { id: '5', text: 'Compartí para feedback del líder', done: false },
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
              title: activeTask ? 'Revisá tu tarea asignada' : 'Revisá qué hay para hacer',
              content: activeTask
                ? `Tu tarea es: "${activeTask.title}". ${activeTask.description || ''}`
                : 'Mirá la sección de tareas para ver qué está asignado a vos.',
              tip: 'Si algo no está claro, preguntale al asistente de chat.',
            },
            {
              stepNumber: 2,
              title: 'Cambiá el estado cuando empieces',
              content: 'Al empezar a trabajar, cambiá el estado de la tarea a "En progreso".',
              tip: 'El líder puede ver en tiempo real cuando avanzás.',
            },
            {
              stepNumber: 3,
              title: 'Reportá si algo te bloquea',
              content: 'Si algo te impide avanzar, usá el botón naranja "Reportar blocker".',
              tip: 'Describí el problema con detalle — más info = solución más rápida.',
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
            completionMessage: '¡Todo completado! 🎉',
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
