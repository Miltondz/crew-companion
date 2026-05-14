'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SurfaceProps } from '@/runtime/surface-registry/types'
import type { ContentOutlinePayload } from './manifest'

type SectionStatus = 'draft' | 'in-progress' | 'complete'
const STATUS_CYCLE: SectionStatus[] = ['draft', 'in-progress', 'complete']

const statusConfig: Record<SectionStatus, { label: string; className: string; dot: string }> = {
  draft:        { label: 'Borrador',    className: 'bg-zinc-100 text-zinc-500', dot: 'bg-zinc-300' },
  'in-progress': { label: 'En progreso', className: 'bg-teal-100 text-teal-700',  dot: 'bg-teal-400' },
  complete:     { label: 'Completo',    className: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
}

export default function ContentOutlinePanel({ payload }: SurfaceProps<ContentOutlinePayload>) {
  const [sections, setSections] = useState(payload.sections)

  const cycleStatus = (id: string) => {
    setSections(prev => prev.map(s => {
      if (s.id !== id) return s
      const idx = STATUS_CYCLE.indexOf(s.status)
      return { ...s, status: STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length] }
    }))
  }

  const complete = sections.filter(s => s.status === 'complete').length
  const totalWords = sections.reduce((sum, s) => sum + (s.wordCount ?? 0), 0)

  return (
    <Card className="w-full max-w-md border-teal-200 shadow-md overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-teal-600 to-emerald-600 py-3 px-4">
        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
          <span>✍️</span>
          <span>{payload.title}</span>
        </CardTitle>
        <div className="flex gap-3 mt-1 text-[11px] text-teal-100">
          {payload.contentType && <span>{payload.contentType}</span>}
          <span>{complete}/{sections.length} secciones</span>
          {totalWords > 0 && <span>~{totalWords.toLocaleString()} palabras</span>}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-teal-50">
          {sections.map((section, i) => {
            const cfg = statusConfig[section.status]
            return (
              <div
                key={section.id}
                className="px-4 py-3 hover:bg-teal-50/40 cursor-pointer transition-colors"
                onClick={() => cycleStatus(section.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <div className={cn('mt-1.5 w-2 h-2 rounded-full shrink-0', cfg.dot)} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-zinc-400">{i + 1}.</span>
                        <p className={cn(
                          'text-xs font-semibold',
                          section.status === 'complete' ? 'line-through text-zinc-400' : 'text-zinc-700'
                        )}>
                          {section.heading}
                        </p>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{section.description}</p>
                      {section.wordCount && (
                        <p className="text-[10px] text-teal-500 mt-0.5">~{section.wordCount} palabras</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className={cn('text-[9px] border-none shrink-0', cfg.className)}>
                    {cfg.label}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
        {payload.deadline && (
          <div className="px-4 py-2 bg-teal-50 border-t border-teal-100">
            <p className="text-[10px] text-teal-600">📅 Deadline: {payload.deadline}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
