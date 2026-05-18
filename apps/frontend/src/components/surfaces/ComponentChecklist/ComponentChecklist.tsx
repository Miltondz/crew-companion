'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SurfaceProps } from '@/runtime/surface-registry/types'
import type { ComponentChecklistPayload } from './manifest'

type Status = 'not-started' | 'in-progress' | 'done' | 'blocked'

const STATUS_CYCLE: Status[] = ['not-started', 'in-progress', 'done', 'blocked']

const statusConfig: Record<Status, { label: string; dot: string; className: string }> = {
  'not-started': { label: 'Sin empezar', dot: 'bg-zinc-300',   className: 'bg-zinc-100 text-zinc-500' },
  'in-progress': { label: 'En progreso', dot: 'bg-pink-400',    className: 'bg-pink-100 text-pink-700' },
  'done':        { label: 'Listo',        dot: 'bg-emerald-400', className: 'bg-emerald-100 text-emerald-700' },
  'blocked':     { label: 'Bloqueado',   dot: 'bg-red-400',     className: 'bg-red-100 text-red-700' },
}

export default function ComponentChecklist({ payload }: SurfaceProps<ComponentChecklistPayload>) {
  const [components, setComponents] = useState(Array.isArray(payload?.components) ? payload.components : [])

  if (components.length === 0) {
    return <div className="p-4 text-center text-[var(--text-muted)] text-xs">Sin datos para mostrar</div>
  }

  const cycleStatus = (id: string) => {
    setComponents(prev => prev.map(c => {
      if (c.id !== id) return c
      const idx = STATUS_CYCLE.indexOf(c.status)
      return { ...c, status: STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length] }
    }))
  }

  const done = components.filter(c => c.status === 'done').length

  return (
    <Card className="w-full max-w-md border-pink-200 shadow-md overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-500 py-3 px-4">
        <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
          <span className="flex items-center gap-2"><span>🧩</span>{typeof payload?.title === 'string' ? payload.title : 'Sin título'}</span>
          <span className="text-xs font-normal text-pink-100">{done}/{components.length}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-pink-50">
          {components.map(c => {
            const cfg = statusConfig[c.status]
            return (
              <div
                key={c.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-pink-50/40 cursor-pointer transition-colors"
                onClick={() => cycleStatus(c.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', cfg.dot)} />
                  <div className="min-w-0">
                    <p className={cn(
                      'text-xs font-medium',
                      c.status === 'done' ? 'line-through text-zinc-400' : 'text-zinc-700'
                    )}>
                      {c.name}
                    </p>
                    {c.type && <p className="text-[10px] text-zinc-400">{c.type}</p>}
                    {c.notes && c.status !== 'done' && (
                      <p className="text-[10px] text-zinc-500 italic mt-0.5">{c.notes}</p>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className={cn('text-[9px] border-none shrink-0 ml-2', cfg.className)}>
                  {cfg.label}
                </Badge>
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
