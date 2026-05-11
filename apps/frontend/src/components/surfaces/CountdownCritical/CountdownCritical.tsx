'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import type { SurfaceProps } from '@/runtime/surface-registry/types'
import type { CountdownCriticalPayload } from './manifest'

function computeCountdown(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return '00:00:00'
  const totalSec = Math.floor(diff / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

function minutesRemaining(deadline: string): number {
  return (new Date(deadline).getTime() - Date.now()) / 60000
}

function viabilityColor(score: number): string {
  if (score < 40) return '#ef4444'
  if (score < 70) return '#f59e0b'
  return '#10b981'
}

export default function CountdownCritical({ payload }: SurfaceProps<CountdownCriticalPayload>) {
  const { deadline, title, viabilityScore, criticalBlockers, featuresToCut } = payload
  const [countdown, setCountdown] = useState(() => computeCountdown(deadline))

  useEffect(() => {
    const id = setInterval(() => setCountdown(computeCountdown(deadline)), 1000)
    return () => clearInterval(id)
  }, [deadline])

  const minsLeft = minutesRemaining(deadline)
  const countdownColor = minsLeft < 10 ? '#ef4444' : minsLeft < 30 ? '#f97316' : '#ffffff'

  return (
    <Card className="bg-slate-900 text-white border-slate-700 w-full max-w-sm">
      <CardHeader className="py-3 px-4 border-b border-slate-700">
        <CardTitle className="text-sm font-bold text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex flex-col gap-4">
        <div className="text-center">
          <span className="text-4xl font-mono font-bold" style={{ color: countdownColor }}>
            {countdown}
          </span>
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Viabilidad</span>
            <span>{viabilityScore}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${viabilityScore}%`, background: viabilityColor(viabilityScore) }}
            />
          </div>
        </div>

        {criticalBlockers.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-300 mb-2">Bloqueadores críticos</p>
            <div className="flex flex-col gap-1 pointer-events-none">
              {criticalBlockers.map(b => (
                <div key={b.id} className="flex items-start gap-2 text-xs">
                  <input
                    type="checkbox"
                    readOnly
                    checked={!!b.resolved}
                    className="mt-0.5 accent-indigo-500"
                  />
                  <span className={b.resolved ? 'line-through text-slate-500' : 'text-slate-200'}>
                    {b.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {featuresToCut && featuresToCut.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-300 mb-2">Features a recortar</p>
            <div className="flex flex-col gap-1">
              {featuresToCut.map(f => (
                <div key={f.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-200">{f.name}</span>
                  <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                    ahorra {f.timeSavedMinutes} min
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
