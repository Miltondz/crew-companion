'use client'

import { useRef, useEffect } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TeamMember, Task, Blocker, TechnicalLevel, Role } from '@/lib/crew/types'

interface TeamOverviewProps {
  members: TeamMember[]
  tasks: Task[]
  blockers: Blocker[]
}

const TECH_LABEL: Record<TechnicalLevel, string> = {
  'low-tech':  'bajo-tech',
  'high-tech': 'alto-tech',
}

function Initials({ name, role, hasBlocker }: { name: string; role: Role; hasBlocker: boolean }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  const bg = hasBlocker
    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
    : role === 'leader'
    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
  return (
    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold', bg)}>
      {initials}
    </span>
  )
}

interface MemberCardProps {
  member: TeamMember
  activeTasksCount: number
  activeBlocker?: Blocker
}

function MemberCard({ member, activeTasksCount, activeBlocker }: MemberCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const hasBlocker = !!activeBlocker

  const base = hasBlocker ? '30' : member.role === 'leader' ? '270' : '220'
  const borderColor = hasBlocker
    ? 'oklch(0.7 0.15 40 / 0.45)'
    : member.role === 'leader'
    ? 'oklch(0.7 0.1 270 / 0.35)'
    : 'oklch(0.922 0 0 / 0.55)'

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
      className="relative w-full rounded-xl p-px transition-shadow duration-200 hover:shadow-md dark:hover:shadow-slate-900/40"
      style={{
        '--base': base,
        '--spread': '80',
        backgroundImage: `radial-gradient(200px 200px at calc(var(--x,0)*1px) calc(var(--y,0)*1px), hsl(${base} 70% 65% / 0.07), transparent)`,
        backgroundAttachment: 'fixed',
        border: '1px solid',
        borderColor,
      } as React.CSSProperties}
    >
      <div className="relative rounded-[11px] bg-white dark:bg-slate-900 p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Initials name={member.name} role={member.role} hasBlocker={hasBlocker} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {member.name}
                </span>
                {member.role === 'leader' && (
                  <span className="text-[10px] font-medium text-purple-500 dark:text-purple-400 bg-purple-500/10 rounded px-1.5 py-0.5">
                    líder
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {TECH_LABEL[member.technicalLevel]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {hasBlocker ? (
              <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <AlertTriangle className="w-2.5 h-2.5" />
                blocker
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-2.5 h-2.5" />
                {activeTasksCount} {activeTasksCount === 1 ? 'tarea' : 'tareas'}
              </span>
            )}
          </div>
        </div>

        {hasBlocker && (
          <div className="ml-11 rounded-lg bg-orange-500/5 border border-orange-500/15 px-2.5 py-1.5">
            <p className="text-[11px] text-orange-600 dark:text-orange-400 leading-snug italic line-clamp-2">
              "{activeBlocker!.description}"
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export function TeamOverview({ members, tasks, blockers }: TeamOverviewProps) {
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'leader' && b.role !== 'leader') return -1
    if (a.role !== 'leader' && b.role === 'leader') return 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-0.5">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Equipo
        </h3>
        <span className="text-xs text-slate-400 dark:text-slate-500">{members.length} miembros</span>
      </div>

      <div className="flex flex-col gap-2">
        {sortedMembers.map((member) => {
          const activeTasksCount = tasks.filter(
            t => t.assignedTo === member.id && t.status !== 'done'
          ).length
          const activeBlocker = blockers.find(b => b.memberId === member.id && !b.resolved)

          return (
            <MemberCard
              key={member.id}
              member={member}
              activeTasksCount={activeTasksCount}
              activeBlocker={activeBlocker}
            />
          )
        })}
      </div>
    </div>
  )
}
