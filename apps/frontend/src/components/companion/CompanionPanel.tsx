'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Zap, Users, Clock, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react'
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
  techLevel?: 'low-tech' | 'high-tech'
  suggestedActions?: SuggestedAction[]
}

const INTENT_OPTIONS = [
  { id: 'resolve_error',    label: 'Resolver un error técnico', icon: Zap },
  { id: 'setup_env',        label: 'Configurar el entorno',     icon: ChevronRight },
  { id: 'understand_task',  label: 'Entender una tarea',        icon: ChevronRight },
  { id: 'team_status',      label: 'Ver estado del equipo',     icon: Users },
]

function formatTime(minutes: number | null): string {
  if (minutes === null) return '—'
  if (minutes <= 0) return 'Vencido'
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

async function fetchFlow(
  intent: string,
  techLevel: string,
  status: QuickStatus
): Promise<TechFlow> {
  const context = [
    `fase: ${status.phase}`,
    `${status.pendingTasks} tareas pendientes`,
    status.activeBlockers > 0 ? `${status.activeBlockers} blockers activos` : 'sin blockers',
    status.minutesLeft !== null ? `${status.minutesLeft} minutos restantes` : '',
    `progreso: ${status.progress}%`,
  ].filter(Boolean).join(', ')

  const res = await fetch('/api/coach/flow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intent, techLevel, context }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }

  const data = await res.json() as { flow: TechFlow }
  return data.flow
}

export function CompanionPanel({
  open,
  onClose,
  status,
  techLevel = 'low-tech',
  suggestedActions = [],
}: Props) {
  const [view, setView] = useState<'main' | 'loading' | 'stepper' | 'error'>('main')
  const [activeFlow, setActiveFlow] = useState<TechFlow | null>(null)
  const [loadingLabel, setLoadingLabel] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleClose = () => {
    companionBus.emit({ type: 'PANEL_CLOSE' })
    onClose()
    setView('main')
    setActiveFlow(null)
    setErrorMsg('')
  }

  const handleIntent = useCallback(async (intentId: string, label: string) => {
    setLoadingLabel(label)
    setView('loading')
    try {
      const flow = await fetchFlow(intentId, techLevel, status)
      setActiveFlow(flow)
      setView('stepper')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error desconocido')
      setView('error')
    }
  }, [techLevel, status])

  const handleStepperDone = useCallback(() => {
    setView('main')
    setActiveFlow(null)
  }, [])

  return (
    <AnimatePresence>
      {open && (
        <>
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
              <div className="flex items-center gap-2">
                {(view === 'stepper' || view === 'loading') && (
                  <button
                    onClick={handleStepperDone}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors text-[10px]"
                  >
                    ← volver
                  </button>
                )}
                <span className="text-xs font-bold text-zinc-200">
                  {view === 'loading' ? 'Coach preparando flujo…' :
                   view === 'stepper' && activeFlow ? activeFlow.taskLabel :
                   view === 'error' ? 'Error' : 'Companion'}
                </span>
              </div>
              <button onClick={handleClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">

              {/* loading */}
              {view === 'loading' && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                  <p className="text-xs text-zinc-400 text-center">
                    Coach generando pasos para<br />
                    <span className="text-zinc-200 font-semibold">{loadingLabel}</span>
                  </p>
                </div>
              )}

              {/* error */}
              {view === 'error' && (
                <div className="flex flex-col gap-3">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-300">
                    {errorMsg}
                  </div>
                  <button
                    onClick={() => setView('main')}
                    className="py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
                  >
                    Volver
                  </button>
                </div>
              )}

              {/* stepper */}
              {view === 'stepper' && activeFlow && (
                <TechnicalStepper
                  flow={activeFlow}
                  onComplete={handleStepperDone}
                  onClose={handleStepperDone}
                />
              )}

              {/* main */}
              {view === 'main' && (
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
                        <span className="text-xs text-amber-300">
                          {status.activeBlockers} blocker{status.activeBlockers > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Planner suggestions */}
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
                          {a.description && (
                            <p className="text-[11px] text-zinc-500 mt-0.5">{a.description}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* intent picker */}
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide">¿En qué te ayudo?</p>
                    {INTENT_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => handleIntent(opt.id, opt.label)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/40 hover:bg-indigo-500/10 border border-zinc-700/50 hover:border-indigo-500/40 transition-colors text-left"
                      >
                        <opt.icon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="text-xs text-zinc-300">{opt.label}</span>
                      </button>
                    ))}
                    <p className="text-[10px] text-zinc-600 text-center mt-1">
                      Generado por el Coach · {techLevel}
                    </p>
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
