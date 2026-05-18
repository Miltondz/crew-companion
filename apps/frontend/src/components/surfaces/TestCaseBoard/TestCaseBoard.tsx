'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SurfaceProps } from '@/runtime/surface-registry/types'
import type { TestCaseBoardPayload } from './manifest'

type Status = 'pending' | 'passed' | 'failed' | 'blocked' | 'skipped'
const STATUS_CYCLE: Status[] = ['pending', 'passed', 'failed', 'blocked', 'skipped']

const statusConfig: Record<Status, { label: string; icon: string; className: string }> = {
  pending:  { label: 'Pendiente', icon: '⏳', className: 'bg-zinc-100 text-zinc-600' },
  passed:   { label: 'OK',        icon: '✅', className: 'bg-emerald-100 text-emerald-700' },
  failed:   { label: 'Falla',     icon: '❌', className: 'bg-red-100 text-red-700' },
  blocked:  { label: 'Bloqueado', icon: '🚫', className: 'bg-orange-100 text-orange-700' },
  skipped:  { label: 'Skip',      icon: '⏭️', className: 'bg-zinc-100 text-zinc-400' },
}

const priorityConfig = {
  critical: 'bg-red-200 text-red-800',
  high:     'bg-orange-100 text-orange-700',
  medium:   'bg-yellow-100 text-yellow-700',
  low:      'bg-green-100 text-green-700',
}

export default function TestCaseBoard({ payload }: SurfaceProps<TestCaseBoardPayload>) {
  const [cases, setCases] = useState(Array.isArray(payload?.cases) ? payload.cases : [])

  if (cases.length === 0) {
    return <div className="p-4 text-center text-[var(--text-muted)] text-xs">Sin datos para mostrar</div>
  }

  const cycleStatus = (id: string) => {
    setCases(prev => prev.map(c => {
      if (c.id !== id) return c
      const idx = STATUS_CYCLE.indexOf(c.status)
      return { ...c, status: STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length] }
    }))
  }

  const passed = cases.filter(c => c.status === 'passed').length
  const failed = cases.filter(c => c.status === 'failed').length
  const total = cases.length

  return (
    <Card className="w-full max-w-md border-amber-200 shadow-md overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-amber-500 to-yellow-500 py-3 px-4">
        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
          <span>🧪</span>
          <span>{typeof payload?.title === 'string' ? payload.title : 'Sin título'}</span>
        </CardTitle>
        {payload?.feature && <p className="text-xs text-amber-100 mt-0.5">Feature: {payload.feature}</p>}
        <div className="flex gap-3 mt-2 text-[11px] font-semibold text-white">
          <span>✅ {passed} OK</span>
          <span>❌ {failed} fallas</span>
          <span>📋 {total - passed - failed} pendientes</span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-amber-50">
          {cases.map(tc => {
            const sCfg = statusConfig[tc.status]
            return (
              <div
                key={tc.id}
                className="px-4 py-3 hover:bg-amber-50/40 cursor-pointer transition-colors"
                onClick={() => cycleStatus(tc.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm">{sCfg.icon}</span>
                      <p className={cn(
                        'text-xs font-medium',
                        tc.status === 'passed' ? 'line-through text-zinc-400' : 'text-zinc-700'
                      )}>
                        {tc.title}
                      </p>
                      <Badge variant="outline" className={cn('text-[9px] border-none', priorityConfig[tc.priority])}>
                        {tc.priority}
                      </Badge>
                    </div>
                    {tc.description && (
                      <p className="text-[10px] text-zinc-500 mt-0.5 ml-6">{tc.description}</p>
                    )}
                    {tc.assignedTo && (
                      <p className="text-[10px] text-zinc-400 mt-0.5 ml-6">→ {tc.assignedTo}</p>
                    )}
                  </div>
                  <Badge variant="outline" className={cn('text-[9px] border-none shrink-0', sCfg.className)}>
                    {sCfg.label}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
        <div className="px-4 py-2 bg-zinc-50 border-t border-zinc-100">
          <p className="text-[10px] text-zinc-400">Click para cambiar estado</p>
        </div>
      </CardContent>
    </Card>
  )
}
