'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { SurfaceProps } from '@/runtime/surface-registry/types'
import type { StakeholderUpdatePayload } from './manifest'

const highlightConfig = {
  win:       { icon: '✅', className: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  risk:      { icon: '⚠️', className: 'bg-orange-50 border-orange-200 text-orange-700' },
  milestone: { icon: '🏁', className: 'bg-blue-50 border-blue-200 text-blue-700' },
  blocker:   { icon: '🚫', className: 'bg-red-50 border-red-200 text-red-700' },
}

export default function StakeholderUpdate({ payload }: SurfaceProps<StakeholderUpdatePayload>) {
  const [copied, setCopied] = useState(false)

  const fullText = [
    payload.updateText,
    '',
    'Highlights:',
    ...payload.highlights.map(h => `• ${h.text}`),
    '',
    'Próximos pasos:',
    ...payload.nextSteps.map((s, i) => `${i + 1}. ${s}`),
  ].join('\n')

  const copyUpdate = () => {
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Card className="w-full max-w-md border-indigo-200 shadow-md overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 py-3 px-4">
        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
          <span>📢</span>
          <span>Update para stakeholders</span>
        </CardTitle>
        <p className="text-xs text-indigo-200 mt-0.5">{payload.projectName} · {payload.generatedAt}</p>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Main text */}
        <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3">
          <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-line">{payload.updateText}</p>
        </div>

        {/* Highlights */}
        {payload.highlights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Highlights</p>
            {payload.highlights.map((h, i) => {
              const cfg = highlightConfig[h.type]
              return (
                <div key={i} className={cn('rounded-lg border px-3 py-2 flex items-start gap-2', cfg.className)}>
                  <span>{cfg.icon}</span>
                  <p className="text-xs">{h.text}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* Next steps */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Próximos pasos</p>
          {payload.nextSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <p className="text-xs text-zinc-600">{step}</p>
            </div>
          ))}
        </div>

        <button
          onClick={copyUpdate}
          className={cn(
            'w-full rounded-lg py-2 text-xs font-bold transition-colors',
            copied ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'
          )}
        >
          {copied ? '✓ Copiado' : '📋 Copiar update completo'}
        </button>
      </CardContent>
    </Card>
  )
}
