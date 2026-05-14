'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { SurfaceProps } from '@/runtime/surface-registry/types'
import type { DebugSessionPayload } from './manifest'

export default function DebugSession({ payload }: SurfaceProps<DebugSessionPayload>) {
  const [steps, setSteps] = useState(payload.steps)
  const [activeStep, setActiveStep] = useState(0)

  const toggleStep = (id: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, resolved: !s.resolved } : s))
  }

  const resolvedCount = steps.filter(s => s.resolved).length

  return (
    <Card className="w-full max-w-md border-orange-200 shadow-md overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 py-3 px-4">
        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
          <span>🔍</span>
          <span>{payload.title}</span>
        </CardTitle>
        {payload.problem && (
          <p className="text-xs text-orange-100 mt-1">"{payload.problem}"</p>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Progress */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-orange-100 rounded-full h-1.5">
            <div
              className="bg-orange-500 h-1.5 rounded-full transition-all"
              style={{ width: `${steps.length > 0 ? (resolvedCount / steps.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-orange-600">{resolvedCount}/{steps.length}</span>
        </div>

        {/* Hypothesis */}
        {payload.hypothesis && payload.hypothesis.length > 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Hipótesis</p>
            {payload.hypothesis.map((h, i) => (
              <p key={i} className="text-xs text-amber-800">• {h}</p>
            ))}
          </div>
        )}

        {/* Steps */}
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className={cn(
                'rounded-lg border p-3 cursor-pointer transition-all',
                step.resolved
                  ? 'border-emerald-200 bg-emerald-50 opacity-60'
                  : i === activeStep
                  ? 'border-orange-300 bg-orange-50 ring-1 ring-orange-300'
                  : 'border-zinc-200 bg-white hover:border-zinc-300'
              )}
              onClick={() => { setActiveStep(i); toggleStep(step.id) }}
            >
              <div className="flex items-start gap-2">
                <div className={cn(
                  'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 text-[10px] font-bold',
                  step.resolved
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-orange-400 text-orange-400'
                )}>
                  {step.resolved ? '✓' : i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn('text-xs font-medium', step.resolved ? 'line-through text-zinc-400' : 'text-zinc-700')}>
                    {step.description}
                  </p>
                  {step.command && !step.resolved && (
                    <code className="text-[10px] font-mono text-emerald-700 bg-zinc-900 px-2 py-0.5 rounded mt-1 block">
                      {step.command}
                    </code>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {payload.resolution && resolvedCount === steps.length && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
            <p className="text-xs font-semibold text-emerald-700">✅ {payload.resolution}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
