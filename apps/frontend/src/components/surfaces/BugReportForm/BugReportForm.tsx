'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SurfaceProps } from '@/runtime/surface-registry/types'
import type { BugReportPayload } from './manifest'

const severityConfig = {
  low:      { label: 'Baja',     className: 'bg-zinc-100 text-zinc-600',   border: 'border-zinc-200' },
  medium:   { label: 'Media',    className: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200' },
  high:     { label: 'Alta',     className: 'bg-orange-100 text-orange-700', border: 'border-orange-300' },
  critical: { label: 'Crítica',  className: 'bg-red-100 text-red-700',     border: 'border-red-400' },
}

export default function BugReportForm({ payload }: SurfaceProps<BugReportPayload>) {
  const [copied, setCopied] = useState(false)
  const severity = (payload?.severity && payload.severity in severityConfig) ? payload.severity : 'low' as const
  const cfg = severityConfig[severity]
  const steps = Array.isArray(payload?.steps) ? payload.steps : []
  const title = typeof payload?.title === 'string' ? payload.title : 'Sin título'
  const expectedBehavior = typeof payload?.expectedBehavior === 'string' ? payload.expectedBehavior : ''
  const actualBehavior = typeof payload?.actualBehavior === 'string' ? payload.actualBehavior : ''

  if (!payload?.title && steps.length === 0) {
    return <div className="p-4 text-center text-[var(--text-muted)] text-xs">Sin datos para mostrar</div>
  }

  const copyReport = () => {
    const text = [
      `# Bug: ${title}`,
      `Severidad: ${cfg.label}`,
      payload?.environment ? `Entorno: ${payload.environment}` : '',
      '',
      '## Pasos para reproducir',
      steps.map((s, i) => `${i + 1}. ${s}`).join('\n'),
      '',
      `## Comportamiento esperado\n${expectedBehavior}`,
      '',
      `## Comportamiento actual\n${actualBehavior}`,
      payload?.reportedBy ? `\nReportado por: ${payload.reportedBy}` : '',
    ].filter(Boolean).join('\n')

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Card className={cn('w-full max-w-md shadow-md overflow-hidden border-2', cfg.border)}>
      <CardHeader className="bg-red-600 py-3 px-4">
        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
          <span>🐛</span>
          <span className="truncate">{title}</span>
        </CardTitle>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className={cn('text-[9px] border-none font-bold', cfg.className)}>
            Severidad: {cfg.label}
          </Badge>
          {payload?.reportedBy && (
            <span className="text-[10px] text-red-200">por {payload.reportedBy}</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Steps */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Pasos para reproducir</p>
          <div className="space-y-1.5">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-xs text-zinc-700">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Expected vs Actual */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-1">Esperado</p>
            <p className="text-xs text-emerald-800">{expectedBehavior}</p>
          </div>
          <div className="rounded-lg bg-red-50 border border-red-200 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-1">Actual</p>
            <p className="text-xs text-red-800">{actualBehavior}</p>
          </div>
        </div>

        {payload?.environment && (
          <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Entorno</p>
            <code className="text-xs text-zinc-700 font-mono">{payload.environment}</code>
          </div>
        )}

        <button
          onClick={copyReport}
          className={cn(
            'w-full rounded-lg py-2 text-xs font-bold transition-colors',
            copied ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-900 text-white hover:bg-zinc-800'
          )}
        >
          {copied ? '✓ Copiado al portapapeles' : '📋 Copiar reporte'}
        </button>
      </CardContent>
    </Card>
  )
}
