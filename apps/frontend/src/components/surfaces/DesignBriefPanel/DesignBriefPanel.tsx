'use client'

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SurfaceProps } from '@/runtime/surface-registry/types'
import type { DesignBriefPayload } from './manifest'

const statusConfig = {
  pending:     { label: 'Pendiente',   className: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
  'in-progress': { label: 'En progreso', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  done:        { label: 'Completado',  className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
}

export default function DesignBriefPanel({ payload }: SurfaceProps<DesignBriefPayload>) {
  const projectName = typeof payload?.projectName === 'string' ? payload.projectName : 'Sin título'
  const objective = typeof payload?.objective === 'string' ? payload.objective : ''
  const deliverables = Array.isArray(payload?.deliverables) ? payload.deliverables : []

  if (deliverables.length === 0) {
    return <div className="p-4 text-center text-[var(--text-muted)] text-xs">Sin datos para mostrar</div>
  }

  const done = deliverables.filter(d => d.status === 'done').length
  const total = deliverables.length

  return (
    <Card className="w-full max-w-md border-purple-200 shadow-md overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-violet-600 to-purple-600 py-3 px-4">
        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
          <span>🎨</span>
          <span>Brief de diseño — {projectName}</span>
        </CardTitle>
        <p className="text-xs text-purple-100 mt-1">{objective}</p>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Audience + color direction */}
        {(payload?.targetAudience || payload?.colorDirection) && (
          <div className="grid grid-cols-2 gap-3">
            {payload?.targetAudience && (
              <div className="rounded-xl bg-purple-50 border border-purple-100 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1">Audiencia</p>
                <p className="text-xs text-purple-800">{payload?.targetAudience}</p>
              </div>
            )}
            {payload?.colorDirection && (
              <div className="rounded-xl bg-violet-50 border border-violet-100 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400 mb-1">Dirección visual</p>
                <p className="text-xs text-violet-800">{payload?.colorDirection}</p>
              </div>
            )}
          </div>
        )}

        {/* Deliverables */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Entregables</p>
            <span className="text-[10px] font-bold text-purple-600">{done}/{total} completados</span>
          </div>
          {deliverables.map((d, i) => {
            const cfg = statusConfig[d.status]
            return (
              <div key={i} className={cn(
                'rounded-lg border p-3 flex items-start justify-between gap-3',
                d.status === 'done' ? 'opacity-60' : ''
              )}>
                <div className="min-w-0">
                  <p className={cn('text-xs font-semibold', d.status === 'done' ? 'line-through text-zinc-400' : 'text-zinc-700')}>
                    {d.title}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{d.description}</p>
                </div>
                <Badge variant="outline" className={cn('text-[9px] shrink-0 border', cfg.className)}>
                  {cfg.label}
                </Badge>
              </div>
            )
          })}
        </div>

        {/* References */}
        {payload?.references && payload.references.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Referencias</p>
            {payload.references.map((ref, i) => (
              <p key={i} className="text-[11px] text-zinc-500 flex items-center gap-1">
                <span className="text-purple-400">→</span> {ref}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
