'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

type TaskStatus = 'todo' | 'in-progress' | 'done'
type TaskPriority = 'low' | 'medium' | 'high'

interface TaskCardProps {
  task: {
    id: string
    title: string
    description: string
    status: TaskStatus
    priority: TaskPriority
    assignedTo: string
  }
  isHighlighted?: boolean
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void
}

export function TaskCard({ task, isHighlighted, onStatusChange }: TaskCardProps) {
  const priorityStyles = {
    high: 'bg-red-100 text-red-700 hover:bg-red-100',
    medium: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
    low: 'bg-green-100 text-green-700 hover:bg-green-100',
  }

  const statusStyles = {
    todo: { label: 'Pendiente', classes: 'bg-slate-100 text-slate-600 hover:bg-slate-100' },
    'in-progress': { label: 'En progreso', classes: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
    done: { label: 'Completado', classes: 'bg-green-100 text-green-700 hover:bg-green-100' },
  }

  const handleStatusClick = () => {
    if (!onStatusChange) return
    const cycle: TaskStatus[] = ['todo', 'in-progress', 'done']
    const currentIndex = cycle.indexOf(task.status)
    const nextStatus = cycle[(currentIndex + 1) % cycle.length]
    onStatusChange(task.id, nextStatus)
  }

  return (
    <Card
      className={cn(
        'w-full transition-all duration-200',
        isHighlighted && 'border-2 border-blue-400 shadow-md'
      )}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex justify-start">
          <Badge variant="outline" className={cn('border-none capitalize text-[10px] px-2 py-0', priorityStyles[task.priority])}>
            {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
          </Badge>
        </div>

        <h3 className="font-medium text-slate-800 text-sm leading-tight">
          {task.title}
        </h3>

        <p className="line-clamp-2 text-xs text-slate-500 leading-normal">
          {task.description}
        </p>

        <Separator className="my-2" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>👤</span>
            <span className="font-medium">{task.assignedTo}</span>
          </div>
          
          <Badge
            variant="outline"
            className={cn(
              'cursor-pointer border-none text-[10px] px-2 py-0 transition-colors',
              statusStyles[task.status].classes
            )}
            onClick={handleStatusClick}
          >
            {statusStyles[task.status].label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
