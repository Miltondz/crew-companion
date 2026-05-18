'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SurfaceProps } from '@/runtime/surface-registry/types'
import type { TroubleshootingPayload } from './manifest'

export default function TroubleshootingWizard({ payload }: SurfaceProps<TroubleshootingPayload>) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [lastAction, setLastAction] = useState<string | null>(null)
  const [isFinished, setIsFinished] = useState(false)

  const steps = Array.isArray(payload?.steps) ? payload.steps : []
  const problem = typeof payload?.problem === 'string' ? payload.problem : ''

  if (steps.length === 0) {
    return <div className="p-4 text-center text-[var(--text-muted)] text-xs">Sin datos para mostrar</div>
  }

  const currentStep = steps[currentStepIndex]
  const isLastStep = currentStepIndex === steps.length - 1

  const handleYes = () => {
    setLastAction(currentStep.yesAction)
    setShowResult(true)
    setTimeout(() => {
      if (isLastStep) {
        setIsFinished(true)
      } else {
        setCurrentStepIndex(prev => prev + 1)
        setShowResult(false)
        setLastAction(null)
      }
    }, 2000)
  }

  const handleNo = () => {
    setLastAction(currentStep.noAction)
    setShowResult(true)
  }

  const handleRetry = () => {
    setShowResult(false)
    setLastAction(null)
  }

  if (isFinished) {
    return (
      <Card className="w-full max-w-md shadow-lg border-2 border-green-100 overflow-hidden bg-green-50">
        <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
          <span className="text-5xl">✅</span>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-green-800">¡Solucionado!</h3>
            <p className="text-sm text-green-700 leading-relaxed">
              {payload?.resolution || 'Hemos completado todos los pasos de la guía.'}
            </p>
          </div>
          {payload?.escalateTo && (
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-11 mt-4">
              💬 Hablar con {payload.escalateTo}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-2 border-orange-100 overflow-hidden">
      <CardHeader className="bg-orange-50 border-b py-3 px-5">
        <div className="space-y-2">
          <CardTitle className="text-sm font-bold text-orange-900 flex items-center gap-2">
            <span>🔧</span>
            <span>Vamos a resolver esto juntos</span>
          </CardTitle>
          <blockquote className="border-l-2 border-orange-300 pl-3 py-1">
            <p className="text-xs text-orange-800 italic">"{problem}"</p>
          </blockquote>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Paso {currentStepIndex + 1} de {steps.length}
          </span>
          {showResult && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-none text-[9px] font-bold">
              ACCIÓN SUGERIDA
            </Badge>
          )}
        </div>

        <div className="space-y-4 min-h-[120px] flex flex-col justify-center">
          {!showResult ? (
            <h3 className="text-base font-bold text-slate-800 leading-tight text-center px-4">
              {currentStep.question}
            </h3>
          ) : (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg animate-in fade-in zoom-in duration-300">
              <p className="text-sm text-blue-900 font-medium leading-relaxed text-center">
                {lastAction}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {!showResult ? (
            <>
              <Button
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold h-11"
                onClick={handleYes}
              >
                ✓ Sí, lo hice
              </Button>
              <Button
                variant="outline"
                className="w-full bg-red-50 hover:bg-red-100 text-red-700 border-red-200 font-bold h-11"
                onClick={handleNo}
              >
                ✗ No lo hice
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              className="w-full border-slate-200 text-slate-600 font-bold h-11"
              onClick={handleRetry}
            >
              🔄 Volver a intentar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
