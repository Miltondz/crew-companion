'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Check, X, Copy, ChevronRight, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TechStep {
  id: string
  title: string
  description: string
  command?: string
  expectedOutput?: string
  errorOptions?: { label: string; nextStepId: string }[]
}

export interface TechFlow {
  id: string
  taskLabel: string
  technicalLevel: 'low-tech' | 'high-tech'
  steps: TechStep[]
  generatedBy: 'coach'
}

interface Props {
  flow: TechFlow
  onComplete: () => void
  onClose: () => void
}

function copyText(text: string) {
  navigator.clipboard.writeText(text).catch(() => null)
}

export function TechnicalStepper({ flow, onComplete, onClose }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [rescueStep, setRescueStep] = useState<TechStep | null>(null)
  const [copied, setCopied] = useState(false)

  const allSteps = flow.steps
  const step = rescueStep ?? allSteps[currentIdx]
  const isLast = !rescueStep && currentIdx === allSteps.length - 1

  const handleCopy = (cmd: string) => {
    copyText(cmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleSuccess = () => {
    setCompleted(c => new Set(c).add(step.id))
    setRescueStep(null)
    if (isLast) {
      onComplete()
    } else {
      setCurrentIdx(i => i + 1)
    }
  }

  const handleError = (nextStepId: string) => {
    const next = allSteps.find(s => s.id === nextStepId)
    if (next) setRescueStep(next)
  }

  const progress = Math.round((completed.size / allSteps.length) * 100)

  return (
    <div className="flex flex-col gap-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-zinc-200">{flow.taskLabel}</p>
          <p className="text-[10px] text-zinc-500">
            Paso {currentIdx + 1} de {allSteps.length}
            {rescueStep ? ' — Modo rescate' : ''}
          </p>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* progress */}
      <div className="w-full h-1 bg-zinc-700 rounded-full">
        <div
          className="h-1 bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* rescue mode badge */}
      <AnimatePresence>
        {rescueStep && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2"
          >
            <AlertTriangle className="w-3 h-3 shrink-0" />
            Modo rescate — camino alternativo
          </motion.div>
        )}
      </AnimatePresence>

      {/* step */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          className="flex flex-col gap-3"
        >
          <div>
            <p className="text-sm font-semibold text-white">{step.title}</p>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{step.description}</p>
          </div>

          {step.command && (
            <div className="bg-zinc-900 rounded-lg px-3 py-2 flex items-center justify-between gap-2 border border-zinc-700">
              <code className="text-xs text-green-400 font-mono flex-1 break-all">{step.command}</code>
              <button
                onClick={() => handleCopy(step.command!)}
                className={cn(
                  'shrink-0 flex items-center gap-1 text-[10px] px-2 py-1 rounded-md transition-colors',
                  copied ? 'text-green-400 bg-green-500/10' : 'text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700'
                )}
              >
                <Copy className="w-3 h-3" />
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          )}

          {step.expectedOutput && (
            <p className="text-[11px] text-zinc-500 bg-zinc-800/50 rounded-lg px-3 py-2">
              Esperado: <span className="text-zinc-300 font-mono">{step.expectedOutput}</span>
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSuccess}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-400 text-xs font-semibold transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          {isLast ? 'Completado' : 'Listo, siguiente'}
          {!isLast && <ChevronRight className="w-3 h-3" />}
        </button>

        {step.errorOptions && step.errorOptions.length > 0 && !rescueStep && (
          <div className="flex flex-col gap-1 flex-1">
            <p className="text-[10px] text-zinc-500 text-center">¿Algo salió mal?</p>
            {step.errorOptions.map(opt => (
              <button
                key={opt.nextStepId}
                onClick={() => handleError(opt.nextStepId)}
                className="py-1.5 rounded-lg border border-zinc-700 hover:border-amber-500/50 text-zinc-400 hover:text-amber-400 text-[11px] transition-colors"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
