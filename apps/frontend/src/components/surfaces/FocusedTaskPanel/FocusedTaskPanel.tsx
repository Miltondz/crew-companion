'use client'

import { useRef, useEffect } from 'react'
import { Clock, CheckCircle2, Circle, AlertCircle, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SurfaceProps } from '@/runtime/surface-registry/types'
import type { FocusedTaskPayload } from './manifest'

type Priority = FocusedTaskPayload['priority']
type Status = FocusedTaskPayload['status']

const PRIORITY_CONFIG: Record<Priority, { label: string; classes: string; base: string }> = {
  high:   { label: 'Alta prioridad',  classes: 'bg-orange-500/10 text-orange-500 dark:text-orange-400', base: '30' },
  medium: { label: 'Media prioridad', classes: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400', base: '60' },
  low:    { label: 'Baja prioridad',  classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', base: '150' },
}

const STATUS_CONFIG: Record<Status, {
  label: string
  classes: string
  Icon: React.ComponentType<{ className?: string }>
}> = {
  todo:          { label: 'Pendiente',   Icon: Circle,       classes: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20' },
  'in-progress': { label: 'En progreso', Icon: Clock,        classes: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  done:          { label: 'Completado',  Icon: CheckCircle2, classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
}

function Initials({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
      {initials}
    </span>
  )
}

export default function FocusedTaskPanel({ payload }: SurfaceProps<FocusedTaskPayload>) {
  const title = typeof payload?.title === 'string' ? payload.title : 'Sin título'
  const description = typeof payload?.description === 'string' ? payload.description : ''
  const priority: Priority = (payload?.priority && payload.priority in PRIORITY_CONFIG) ? payload.priority : 'medium'
  const status: Status = (payload?.status && payload.status in STATUS_CONFIG) ? payload.status : 'todo'
  const assignedTo = typeof payload?.assignedTo === 'string' ? payload.assignedTo : '—'
  const coachNote = payload?.coachNote
  const cardRef = useRef<HTMLDivElement>(null)
  const { base } = PRIORITY_CONFIG[priority]
  const priorityCfg = PRIORITY_CONFIG[priority]
  const statusCfg = STATUS_CONFIG[status]
  const StatusIcon = statusCfg.Icon

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      const el = cardRef.current
      if (!el) return
      el.style.setProperty('--x', String(e.clientX))
      el.style.setProperty('--y', String(e.clientY))
      el.style.setProperty('--xp', (e.clientX / window.innerWidth).toFixed(2))
    }
    document.addEventListener('pointermove', onPointerMove)
    return () => document.removeEventListener('pointermove', onPointerMove)
  }, [])

  return (
    <div
      ref={cardRef}
      data-glow-card
      className="relative w-full max-w-sm rounded-xl p-px transition-shadow duration-200 hover:shadow-lg dark:hover:shadow-slate-900/40"
      style={{
        '--base': base,
        '--spread': '100',
        backgroundImage: `radial-gradient(220px 220px at calc(var(--x,0)*1px) calc(var(--y,0)*1px), hsl(${base} 70% 65% / 0.08), transparent)`,
        backgroundAttachment: 'fixed',
        border: '1px solid',
        borderColor: `hsl(${base} 60% 60% / 0.3)`,
      } as React.CSSProperties}
    >
      <div className="relative rounded-[11px] bg-white dark:bg-slate-900 p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <span className={cn(
            'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            priorityCfg.classes,
          )}>
            <AlertCircle className="w-2.5 h-2.5" />
            {priorityCfg.label}
          </span>
          <span className={cn(
            'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium',
            statusCfg.classes,
          )}>
            <StatusIcon className="w-3 h-3" />
            {statusCfg.label}
          </span>
        </div>

        {/* Title + description */}
        <div>
          <h2 className="text-base font-bold leading-snug text-slate-800 dark:text-white">
            {title}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Assignee */}
        <div className="flex items-center gap-2 border-t border-slate-100 dark:border-white/10 pt-3">
          <Initials name={assignedTo} />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{assignedTo}</span>
        </div>

        {/* Coach note */}
        {coachNote && (
          <div className="rounded-lg bg-indigo-500/5 border border-indigo-500/15 px-3 py-2.5 flex items-start gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">{coachNote}</p>
          </div>
        )}
      </div>
    </div>
  )
}
