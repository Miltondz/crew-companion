'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SurfaceProps } from '@/runtime/surface-registry/types'
import type { WritingChecklistPayload } from './manifest'

const phaseConfig = {
  research: { label: '🔍 Investigación', color: 'from-slate-600 to-zinc-600' },
  outline:  { label: '📐 Outline',       color: 'from-blue-600 to-indigo-600' },
  draft:    { label: '✍️ Borrador',       color: 'from-teal-600 to-emerald-600' },
  review:   { label: '👁️ Revisión',       color: 'from-amber-600 to-yellow-600' },
  publish:  { label: '🚀 Publicar',      color: 'from-violet-600 to-purple-600' },
}

export default function WritingChecklist({ payload }: SurfaceProps<WritingChecklistPayload>) {
  const [items, setItems] = useState(payload.items)
  const [expanded, setExpanded] = useState<string | null>(null)

  const toggle = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i))
  }

  const done = items.filter(i => i.done).length
  const phase = phaseConfig[payload.phase]

  return (
    <Card className="w-full max-w-md border-emerald-200 shadow-md overflow-hidden">
      <CardHeader className={cn('bg-gradient-to-r py-3 px-4', phase.color)}>
        <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span>✍️</span>
            <span>{payload.title}</span>
          </span>
          <Badge variant="outline" className="text-[9px] bg-white/20 text-white border-white/30">
            {phase.label}
          </Badge>
        </CardTitle>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 bg-white/20 rounded-full h-1">
            <div
              className="bg-white h-1 rounded-full transition-all"
              style={{ width: `${items.length > 0 ? (done / items.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-white/80">{done}/{items.length}</span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-emerald-50">
          {items.map(item => (
            <div key={item.id} className="px-4 py-3">
              <div
                className="flex items-start gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => toggle(item.id)}
              >
                <div className={cn(
                  'mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                  item.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-emerald-300'
                )}>
                  {item.done && <span className="text-[10px]">✓</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-xs font-medium', item.done ? 'line-through text-zinc-400' : 'text-zinc-700')}>
                    {item.text}
                  </p>
                </div>
                {item.tip && (
                  <button
                    onClick={e => { e.stopPropagation(); setExpanded(expanded === item.id ? null : item.id) }}
                    className="text-[10px] text-emerald-500 hover:text-emerald-700 shrink-0"
                  >
                    {expanded === item.id ? '▲ tip' : '▼ tip'}
                  </button>
                )}
              </div>
              {item.tip && expanded === item.id && (
                <div className="mt-2 ml-7 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
                  <p className="text-[11px] text-emerald-700 italic">💡 {item.tip}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {payload.tip && (
          <div className="px-4 py-3 bg-teal-50 border-t border-teal-100">
            <p className="text-[11px] text-teal-700">💡 {payload.tip}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
