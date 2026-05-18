'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'motion/react'
import { Eye, Users, AlertTriangle, CheckSquare, RefreshCw, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getUrgencyPhase } from '@/lib/crew/derive'

const PHASE_CONFIG: Record<string, { label: string; bg: string; border: string; text: string }> = {
  normal:  { label: 'Normal',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-300' },
  focus:   { label: 'Focus',    bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-300' },
  urgent:  { label: 'Urgente',  bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-300' },
  panic:   { label: 'PÁNICO',   bg: 'bg-red-500/10',    border: 'border-red-500/40',    text: 'text-red-300' },
  expired: { label: 'Vencido',  bg: 'bg-zinc-500/10',   border: 'border-zinc-600',      text: 'text-zinc-400' },
}

const PROJECT_TYPE_EMOJI: Record<string, string> = {
  hackathon: '🏆', sprint: '💻', 'remote-team': '🌍', launch: '🚀', consulting: '🤝', other: '⚙️',
}

function useCountdown(deadline?: string) {
  const [text, setText] = useState('')
  useEffect(() => {
    if (!deadline) return
    const tick = () => {
      const diff = new Date(deadline).getTime() - Date.now()
      if (diff <= 0) { setText('Tiempo vencido'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setText([h, m, s].map(v => String(v).padStart(2, '0')).join(':'))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [deadline])
  return text
}

interface State {
  milestones?: { id?: string; title?: string; deadline?: string; taskIds?: string[] }[]
  activeMilestoneId?: string
  tasks?: { id?: string; status?: string; title?: string; priority?: string }[]
  members?: { id?: string; name?: string; role?: string }[]
  blockers?: { id?: string; resolved?: boolean; description?: string }[]
  projectConfig?: { type?: string; isDevProject?: boolean }
  observerConfig?: { showTasks?: boolean; showTeamNames?: boolean; showBlockerCount?: boolean; customMessage?: string }
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<State | null>(null)
  const [updatedAt, setUpdatedAt] = useState('')
  const [error, setError] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(Date.now())
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetch_data = async () => {
    try {
      const res = await fetch(`/api/share/${token}`)
      if (!res.ok) { setError(true); return }
      const data = await res.json()
      setState(data.state)
      setUpdatedAt(data.updatedAt)
      setLastRefresh(Date.now())
    } catch { setError(true) }
  }

  useEffect(() => {
    fetch_data()
    intervalRef.current = setInterval(fetch_data, 30000)
    return () => clearInterval(intervalRef.current)
  }, [token])

  const SEED_MILESTONE_IDS = new Set(['ms1'])
  const SEED_TASK_IDS = new Set(['t1', 't2', 't3'])
  const SEED_MEMBER_IDS = new Set(['m1', 'm2', 'm3'])

  const effectiveMilestones = state?.milestones?.filter(m => !SEED_MILESTONE_IDS.has(m.id ?? '')) ?? []
  const effectiveTasks = state?.tasks?.filter(t => !SEED_TASK_IDS.has(t.id ?? '')) ?? []
  const effectiveMembers = state?.members?.filter(m => !SEED_MEMBER_IDS.has(m.id ?? '')) ?? []

  const activeMilestoneId = state?.activeMilestoneId
  const milestone = effectiveMilestones.find(m => m.id === activeMilestoneId) ?? effectiveMilestones[0]
  const countdown = useCountdown(milestone?.deadline)
  const phase = getUrgencyPhase(milestone?.deadline ?? '')
  const phaseConf = PHASE_CONFIG[phase] ?? PHASE_CONFIG.normal
  const totalTasks = (milestone?.taskIds?.filter(id => !SEED_TASK_IDS.has(id)) ?? []).length
  const doneTasks = effectiveTasks.filter(t => t.status === 'done').length
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const memberCount = effectiveMembers.length
  const blockerCount = state?.blockers?.filter(b => !b.resolved).length ?? 0
  const cfg = state?.observerConfig
  const projectType = state?.projectConfig?.type ?? 'other'

  if (error) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
      Vista no encontrada o link inválido.
    </div>
  )

  if (!state) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={cn('absolute top-0 left-1/3 w-[400px] h-[400px] rounded-full blur-3xl opacity-30',
          phase === 'panic' ? 'bg-red-500/30' : phase === 'urgent' ? 'bg-orange-500/20' : 'bg-indigo-500/15')} />
      </div>

      {/* header */}
      <div className="relative border-b border-zinc-800/50 backdrop-blur-xl bg-zinc-950/60">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">Crew Companion</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Eye className="w-3.5 h-3.5" />
            Vista de espectador
            <span className="text-zinc-700">·</span>
            <RefreshCw className="w-3 h-3" />
            Auto cada 30s
          </div>
        </div>
      </div>

      <div className="relative max-w-3xl mx-auto px-6 py-10 space-y-6">
        {/* project header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4">
          <span className="text-4xl">{PROJECT_TYPE_EMOJI[projectType]}</span>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{milestone?.title ?? 'Proyecto'}</h1>
              <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold border', phaseConf.bg, phaseConf.border, phaseConf.text)}>
                {phaseConf.label}
              </span>
            </div>
            {updatedAt && (
              <p className="text-xs text-zinc-500 mt-1">
                Actualizado {new Date(updatedAt).toLocaleString('es', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
              </p>
            )}
          </div>
        </motion.div>

        {/* countdown */}
        {milestone?.deadline && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className={cn('rounded-2xl border p-6 text-center', phaseConf.bg, phaseConf.border)}>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">Tiempo restante</p>
            <p className={cn('text-5xl font-mono font-bold', phaseConf.text)}>{countdown}</p>
            {phase === 'panic' && (
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
                className="flex items-center justify-center gap-1.5 mt-3 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4" /> Fase crítica activa
              </motion.div>
            )}
          </motion.div>
        )}

        {/* stats grid */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="grid grid-cols-3 gap-3">
          {[
            { label: 'Miembros', value: memberCount, icon: Users, color: 'text-indigo-400' },
            { label: 'Tareas completadas', value: `${doneTasks}/${totalTasks}`, icon: CheckSquare, color: 'text-green-400' },
            { label: 'Bloqueadores activos', value: blockerCount, icon: AlertTriangle, color: blockerCount > 0 ? 'text-amber-400' : 'text-zinc-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-center">
              <Icon className={cn('w-5 h-5 mx-auto mb-2', color)} />
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* progress */}
        {totalTasks > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
            <div className="flex justify-between text-sm mb-3">
              <span className="font-semibold text-white">Progreso del milestone</span>
              <span className="text-zinc-400">{progress}%</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-3">
              <motion.div className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
            </div>
          </motion.div>
        )}

        {/* tasks list */}
        {cfg?.showTasks !== false && effectiveTasks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Tareas recientes</h3>
            <div className="space-y-2">
              {effectiveTasks.slice(0, 6).map(t => (
                <div key={t.id} className="flex items-center gap-3 text-sm">
                  <div className={cn('w-2 h-2 rounded-full shrink-0',
                    t.status === 'done' ? 'bg-green-400' : t.status === 'in-progress' ? 'bg-indigo-400' : 'bg-zinc-600')} />
                  <span className={cn('flex-1', t.status === 'done' ? 'text-zinc-500 line-through' : 'text-zinc-200')}>
                    {t.title ?? t.id}
                  </span>
                  {t.priority === 'high' && <span className="text-[10px] text-red-400 font-semibold">ALTA</span>}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* custom message */}
        {cfg?.customMessage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 text-sm text-indigo-200">
            {cfg.customMessage}
          </motion.div>
        )}

      </div>
    </div>
  )
}
