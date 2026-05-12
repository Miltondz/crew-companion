'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Users, Clock, AlertTriangle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { companionBus } from '@/runtime/companion'
import { TechnicalStepper } from './TechnicalStepper'
import type { TechFlow } from './TechnicalStepper'

interface QuickStatus {
  pendingTasks: number
  activeBlockers: number
  minutesLeft: number | null
  progress: number
  phase: string
}

interface SuggestedAction {
  label: string
  description?: string
  onClick: () => void
}

interface Props {
  open: boolean
  onClose: () => void
  status: QuickStatus
  suggestedActions?: SuggestedAction[]
  activeFlow?: TechFlow | null
  onFlowRequest?: (intent: string) => void
}

const INTENT_OPTIONS = [
  { id: 'resolve_error',   label: 'Resolver un error técnico',    icon: Zap },
  { id: 'setup_env',      label: 'Configurar el entorno',         icon: ChevronRight },
  { id: 'understand_task', label: 'Entender una tarea',           icon: ChevronRight },
  { id: 'team_status',    label: 'Ver estado del equipo',          icon: Users },
]

function formatTime(minutes: number | null): string {
  if (minutes === null) return '—'
  if (minutes <= 0) return 'Vencido'
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export function CompanionPanel({
  open,
  onClose,
  status,
  suggestedActions = [],
  activeFlow,
  onFlowRequest,
}: Props) {
  const [view, setView] = useState<'main' | 'stepper'>('main')

  const handleClose = () => {
    companionBus.emit({ type: 'PANEL_CLOSE' })
    onClose()
    setView('main')
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* backdrop — click outside closes */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, x: 320 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 320 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'fixed right-4 bottom-4 z-50 w-72',
              'bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl',
              'flex flex-col overflow-hidden'
            )}
          >
            {/* header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <span className="text-xs font-bold text-zinc-200">Companion</span>
              <button onClick={handleClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
              {view === 'stepper' && activeFlow ? (
                <TechnicalStepper
                  flow={activeFlow}
                  onComplete={() => setView('main')}
                  onClose={() => setView('main')}
                />
              ) : (
                <>
                  {/* quick status */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-zinc-800/60 rounded-xl p-3 flex flex-col gap-1">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Progreso</span>
                      <span className="text-lg font-bold text-white">{status.progress}%</span>
                      <div className="w-full h-1 bg-zinc-700 rounded-full">
                        <div className="h-1 bg-indigo-500 rounded-full" style={{ width: `${status.progress}%` }} />
                      </div>
                    </div>
                    <div className="bg-zinc-800/60 rounded-xl p-3 flex flex-col gap-1">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Tiempo</span>
                      <span className={cn(
                        'text-lg font-bold',
                        status.minutesLeft !== null && status.minutesLeft <= 30 ? 'text-red-400' :
                        status.minutesLeft !== null && status.minutesLeft <= 60 ? 'text-amber-400' : 'text-white'
                      )}>
                        {formatTime(status.minutesLeft)}
                      </span>
                    </div>
                    <div className="bg-zinc-800/60 rounded-xl p-3 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="text-xs text-zinc-300">{status.pendingTasks} tareas</span>
                    </div>
                    {status.activeBlockers > 0 && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs text-amber-300">{status.activeBlockers} blocker{status.activeBlockers > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  {/* suggested actions from Planner */}
                  {suggestedActions.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Planner sugiere</p>
                      {suggestedActions.map((a, i) => (
                        <button
                          key={i}
                          onClick={a.onClick}
                          className="text-left px-3 py-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-zinc-600 transition-colors"
                        >
                          <p className="text-xs font-medium text-zinc-200">{a.label}</p>
                          {a.description && <p className="text-[11px] text-zinc-500 mt-0.5">{a.description}</p>}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* copilot intent picker */}
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide">¿En qué te ayudo?</p>
                    {INTENT_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          onFlowRequest?.(opt.id)
                          if (activeFlow) setView('stepper')
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/40 hover:bg-indigo-500/10 border border-zinc-700/50 hover:border-indigo-500/40 transition-colors text-left"
                      >
                        <opt.icon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="text-xs text-zinc-300">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
