'use client'

import { useRef, useEffect } from 'react'
import { Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
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

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; classes: string }> = {
  high:   { label: 'Alta',  classes: 'bg-orange-500/10 text-orange-500 dark:text-orange-400' },
  medium: { label: 'Media', classes: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
  low:    { label: 'Baja',  classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
}

const STATUS_CONFIG: Record<TaskStatus, {
  label: string
  classes: string
  Icon: React.ComponentType<{ className?: string }>
}> = {
  todo:          { label: 'Pendiente',   Icon: Circle,       classes: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20' },
  'in-progress': { label: 'En progreso', Icon: Clock,        classes: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  done:          { label: 'Completado',  Icon: CheckCircle2, classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const { label, classes } = PRIORITY_CONFIG[priority]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', classes)}>
      <AlertCircle className="w-2.5 h-2.5" />
      {label}
    </span>
  )
}

function StatusBadge({ status, onClick }: { status: TaskStatus; onClick?: () => void }) {
  const { label, classes, Icon } = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium',
        classes,
        onClick && 'cursor-pointer transition-opacity hover:opacity-75',
      )}
      onClick={onClick}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

function Initials({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
      {initials}
    </span>
  )
}

function useGlowPointer(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      const el = ref.current
      if (!el) return
      el.style.setProperty('--x', String(e.clientX))
      el.style.setProperty('--y', String(e.clientY))
      el.style.setProperty('--xp', (e.clientX / window.innerWidth).toFixed(2))
    }
    document.addEventListener('pointermove', onPointerMove)
    return () => document.removeEventListener('pointermove', onPointerMove)
  }, [ref])
}

export function TaskCard({ task, isHighlighted, onStatusChange }: TaskCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  useGlowPointer(cardRef)

  function handleStatusClick() {
    if (!onStatusChange) return
    const cycle: TaskStatus[] = ['todo', 'in-progress', 'done']
    const next = cycle[(cycle.indexOf(task.status) + 1) % cycle.length]
    onStatusChange(task.id, next)
  }

  return (
    <div
      ref={cardRef}
      data-glow-card
      className={cn(
        'relative w-full rounded-xl p-px transition-shadow duration-200 hover:shadow-lg dark:hover:shadow-slate-900/40',
        isHighlighted && 'ring-2 ring-blue-400 dark:ring-blue-500',
      )}
      style={{
        '--base': '250',
        '--spread': '120',
        backgroundImage: `radial-gradient(200px 200px at calc(var(--x,0)*1px) calc(var(--y,0)*1px), hsl(250 80% 65% / 0.07), transparent)`,
        backgroundAttachment: 'fixed',
        border: '1px solid oklch(0.922 0 0 / 0.6)',
      } as React.CSSProperties}
    >
      <div className="relative rounded-[11px] bg-white dark:bg-slate-900 p-3 space-y-3">
        <PriorityBadge priority={task.priority} />

        <div>
          <h3 className="text-sm font-semibold leading-tight text-slate-800 dark:text-white">
            {task.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-normal text-slate-500 dark:text-slate-400">
            {task.description}
          </p>
        </div>

        <StatusBadge
          status={task.status}
          onClick={onStatusChange ? handleStatusClick : undefined}
        />

        <div className="flex items-center gap-2 border-t border-slate-100 dark:border-white/10 pt-2.5">
          <Initials name={task.assignedTo} />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {task.assignedTo}
          </span>
        </div>
      </div>
    </div>
  )
}
