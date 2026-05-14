'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SurfaceProps } from '@/runtime/surface-registry/types'
import type { TriageWarRoomPayload } from './manifest'

type Decision = TriageWarRoomPayload['decisions'][number]
type Verdict = 'approved' | 'deferred' | 'rejected'

const verdictStyles: Record<Verdict, { label: string; bg: string }> = {
  approved: { label: '✓', bg: 'bg-green-100 text-green-700' },
  deferred: { label: '→', bg: 'bg-yellow-100 text-yellow-700' },
  rejected: { label: '✕', bg: 'bg-red-100 text-red-700' },
}

export default function TriageWarRoom({ payload }: SurfaceProps<TriageWarRoomPayload>) {
  const { decisions, title } = payload
  const [index, setIndex] = useState(0)
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({})

  const pending = decisions.length - Object.keys(verdicts).length
  const current: Decision | undefined = decisions[index]
  const done = index >= decisions.length

  function decide(verdict: Verdict) {
    if (!current) return
    setVerdicts(prev => ({ ...prev, [current.id]: verdict }))
    setIndex(i => i + 1)
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="py-3 px-4 border-b bg-slate-50">
        <div className="flex items-center gap-2 flex-wrap">
          <CardTitle className="text-sm font-bold">Triage War Room</CardTitle>
          {title && <span className="text-xs text-slate-500">{title}</span>}
          <Badge variant="outline" className="ml-auto text-[10px]">{pending} pendiente</Badge>
        </div>
        <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5">
          <div
            className="bg-indigo-500 h-1.5 rounded-full transition-all"
            style={{ width: `${decisions.length ? (index / decisions.length) * 100 : 0}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-1">{index}/{decisions.length}</p>
      </CardHeader>
      <CardContent className="p-4 flex flex-col gap-4">
        {!done && current ? (
          <>
            <div className="rounded-lg bg-slate-50 border p-4">
              <p className="text-sm font-semibold text-slate-800 leading-snug">{current.description}</p>
              <p className="text-xs text-slate-500 mt-2">{current.impact}</p>
              <div className="flex gap-2 mt-3 flex-wrap">
                {current.timeSavedMinutes !== undefined && (
                  <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded">
                    ahorra {current.timeSavedMinutes} min
                  </span>
                )}
                {current.timeCostMinutes !== undefined && (
                  <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded">
                    cuesta {current.timeCostMinutes} min
                  </span>
                )}
                {current.executor && (
                  <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded">
                    {current.executor}
                  </span>
                )}
                {current.viabilityDelta !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded ${current.viabilityDelta >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {current.viabilityDelta >= 0 ? '+' : ''}{current.viabilityDelta}% viabilidad
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => decide('approved')}
                className="flex-1 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors"
              >
                ✓ Aprobar
              </button>
              <button
                onClick={() => decide('deferred')}
                className="flex-1 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-white text-sm font-semibold transition-colors"
              >
                → Diferir
              </button>
              <button
                onClick={() => decide('rejected')}
                className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
              >
                ✕ Rechazar
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-2xl mb-1">✓</p>
            <p className="text-sm font-semibold text-slate-700">Triage completo</p>
          </div>
        )}

        {Object.keys(verdicts).length > 0 && (
          <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Resueltas</p>
            {decisions.filter(d => verdicts[d.id]).map(d => (
              <div key={d.id} className="flex items-start gap-2 text-xs">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${verdictStyles[verdicts[d.id]].bg}`}>
                  {verdictStyles[verdicts[d.id]].label}
                </span>
                <span className="text-slate-600 leading-snug">{d.description}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
