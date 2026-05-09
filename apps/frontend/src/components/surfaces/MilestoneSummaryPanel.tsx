'use client'

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

type UrgencyPhase = 'normal' | 'focus' | 'urgent' | 'panic' | 'expired'
type TaskStatus = 'todo' | 'in-progress' | 'done'
type TaskPriority = 'low' | 'medium' | 'high'

interface Task {
  id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  assignedTo: string
}

interface MilestoneSummaryPayload {
  milestone: { id: string; title: string; deadline: string }
  phase: UrgencyPhase
  minutesLeft: number
  completedTasks: Task[]
  pendingTasks: Task[]
  atRiskTasks: Task[]
  recommendation: string
}

interface MilestoneSummaryPanelProps {
  payload: MilestoneSummaryPayload
}

export function MilestoneSummaryPanel({ payload }: MilestoneSummaryPanelProps) {
  const { phase, minutesLeft, completedTasks, pendingTasks, atRiskTasks, recommendation, milestone } = payload
  
  const totalTasks = completedTasks.length + pendingTasks.length
  const progressPercent = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0

  const phaseConfig = {
    normal: { label: 'NORMAL', classes: 'bg-slate-50 text-slate-800 border-slate-200', badge: 'bg-slate-100 text-slate-600' },
    focus: { label: 'FOCUS', classes: 'bg-yellow-50 text-yellow-800 border-yellow-200', badge: 'bg-yellow-100 text-yellow-700' },
    urgent: { label: 'URGENTE', classes: 'bg-orange-50 text-orange-900 border-orange-200', badge: 'bg-orange-100 text-orange-700' },
    panic: { label: 'PÁNICO', classes: 'bg-red-50 text-red-900 border-red-200', badge: 'bg-red-100 text-red-700' },
    expired: { label: 'EXPIRADO', classes: 'bg-red-100 text-red-950 border-red-300', badge: 'bg-red-200 text-red-900' },
  }

  const formatTime = (minutes: number) => {
    if (minutes <= 0) return 'Tiempo agotado'
    if (minutes > 60) {
      const h = Math.floor(minutes / 60)
      const m = Math.floor(minutes % 60)
      return `Quedan ${h}h ${m}m`
    }
    return `Quedan ${Math.floor(minutes)} minutos`
  }

  const currentPhase = phaseConfig[phase]

  return (
    <Card className="w-full max-w-md shadow-lg border-2 border-slate-100 overflow-hidden">
      <CardHeader className={cn('py-3 px-4 border-b', currentPhase.classes)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold truncate pr-2">
            🎯 {milestone.title}
          </CardTitle>
          <Badge variant="outline" className={cn('border-none text-[10px] px-2 py-0 font-bold', currentPhase.badge)}>
            {currentPhase.label}
          </Badge>
        </div>
        <p className="text-[11px] font-medium opacity-80 mt-0.5">
          {formatTime(minutesLeft)}
        </p>
      </CardHeader>

      <CardContent className="p-0">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tight">
              <span>Progreso del equipo</span>
              <span>{completedTasks.length}/{totalTasks} tareas</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          <div className="space-y-3">
            {completedTasks.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-[11px] font-bold text-green-600 flex items-center gap-1">
                  <span>✅</span> Completadas ({completedTasks.length})
                </h4>
                {completedTasks.map(t => (
                  <div key={t.id} className="text-xs text-slate-500 pl-4 border-l ml-1.5 py-0.5">• {t.title}</div>
                ))}
              </div>
            )}

            {pendingTasks.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                  <span>🔄</span> Pendientes ({pendingTasks.length})
                </h4>
                {pendingTasks.map(t => (
                  <div key={t.id} className="text-xs text-slate-700 pl-4 border-l ml-1.5 py-0.5 font-medium">• {t.title}</div>
                ))}
              </div>
            )}

            {atRiskTasks.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-[11px] font-bold text-orange-600 flex items-center gap-1">
                  <span>⚠️</span> En riesgo ({atRiskTasks.length})
                </h4>
                {atRiskTasks.map(t => (
                  <div key={t.id} className="text-xs text-orange-700 pl-4 border-l ml-1.5 py-0.5 font-bold">• {t.title}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 p-3 border-t">
          <p className="text-xs text-slate-800 leading-snug">
            <span className="font-bold mr-1">→</span>
            {recommendation}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
