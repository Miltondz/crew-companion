'use client'

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { MilestoneCountdown } from '@/components/member/MilestoneCountdown'
import { cn } from '@/lib/utils'
import type { UrgencyPhase, TaskStatus, Task } from '@/lib/crew/types'

interface MilestonePanelProps {
  milestone: {
    id: string
    title: string
    deadline: string
    taskIds: string[]
  }
  tasks: Task[]
  urgencyPhase: UrgencyPhase
}

export function MilestonePanel({ milestone, tasks, urgencyPhase }: MilestonePanelProps) {
  const milestoneTasks = tasks.filter(task => milestone.taskIds.includes(task.id))
  
  const totalCount = milestoneTasks.length
  const completedCount = milestoneTasks.filter(task => task.status === 'done').length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const sortedTasks = [...milestoneTasks].sort((a, b) => {
    const order: Record<TaskStatus, number> = { 'in-progress': 0, review: 1, blocked: 2, todo: 3, done: 4 }
    return order[a.status] - order[b.status]
  })

  const phaseStyles = {
    normal: 'border-white/10 bg-[var(--bg-surface)]',
    focus: 'border-yellow-300/40 bg-yellow-500/5 dark:border-yellow-700 dark:bg-yellow-950/30',
    urgent: 'border-orange-400/40 bg-orange-500/5 dark:border-orange-700 dark:bg-orange-950/30',
    panic: 'border-red-500/40 bg-red-500/5 dark:border-red-800 dark:bg-red-950/30',
    expired: 'border-red-700/40 bg-red-500/8 dark:border-red-900 dark:bg-red-950/40',
  }

  const statusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'done': return '✅'
      case 'in-progress': return '🔄'
      case 'review': return '👁'
      case 'blocked': return '🚫'
      case 'todo': return '⬜'
    }
  }

  return (
    <Card className={cn('transition-all duration-300', phaseStyles[urgencyPhase])}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg font-bold">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[var(--text-muted)] mb-1">🎯 Milestone Activo</span>
            <span>{milestone.title}</span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <MilestoneCountdown deadline={milestone.deadline} compact={false} />

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium text-[var(--text-muted)]">
            <span>Progreso</span>
            <span>{completedCount} / {totalCount} tareas</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Lista de tareas</h4>
          <div className="space-y-1.5">
            {sortedTasks.map(task => (
              <div key={task.id} className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                <span className="text-base leading-none">{statusIcon(task.status)}</span>
                <span className={cn(task.status === 'done' && 'line-through text-[var(--text-muted)]')}>
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
