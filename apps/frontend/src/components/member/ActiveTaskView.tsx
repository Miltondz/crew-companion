'use client'

import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type TaskStatus = 'todo' | 'in-progress' | 'done'
type TaskPriority = 'low' | 'medium' | 'high'

interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
}

interface ActiveTaskViewProps {
  task: Task | undefined
  memberName: string
  onMarkDone?: (taskId: string) => void
  onMarkInProgress?: (taskId: string) => void
}

export function ActiveTaskView({ task, memberName, onMarkDone, onMarkInProgress }: ActiveTaskViewProps) {
  if (!task) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <span className="text-4xl">📋</span>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-800">
            Hola {memberName}, todavía no tenés una tarea asignada.
          </h3>
          <p className="text-sm text-slate-500 max-w-[280px]">
            Usá el chat para pedirle al líder que te asigne una. 💬
          </p>
        </div>
      </Card>
    )
  }

  const priorityStyles = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200',
  }

  const statusStyles = {
    todo: 'bg-slate-100 text-slate-600 border-slate-200',
    'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
    done: 'bg-green-100 text-green-700 border-green-200',
  }

  return (
    <Card className="overflow-hidden border-2 border-slate-100 shadow-sm">
      <CardHeader className="bg-slate-50/50 border-b py-3 px-4">
        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Tu tarea actual
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-slate-800 leading-tight">
            {task.title}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {task.description}
          </p>
        </div>

        <div className="flex gap-2">
          <Badge variant="outline" className={cn('text-[10px] font-bold px-2 py-0', priorityStyles[task.priority])}>
            {task.priority === 'high' ? 'Alta prioridad' : task.priority === 'medium' ? 'Media prioridad' : 'Baja prioridad'}
          </Badge>
          <Badge variant="outline" className={cn('text-[10px] font-bold px-2 py-0', statusStyles[task.status])}>
            {task.status === 'todo' ? 'Pendiente' : task.status === 'in-progress' ? 'En progreso' : 'Completada'}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        {task.status === 'done' ? (
          <div className="w-full py-3 bg-green-50 rounded-lg border border-green-100 text-center">
            <span className="text-sm font-bold text-green-700">¡Tarea completada! 🎉</span>
          </div>
        ) : task.status === 'todo' ? (
          <Button
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold h-11"
            onClick={() => onMarkInProgress?.(task.id)}
          >
            ▶ Empezar tarea
          </Button>
        ) : (
          <Button
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold h-11"
            onClick={() => onMarkDone?.(task.id)}
          >
            ✅ Marcar como completada
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
