'use client'

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface DocumentSummaryPayload {
  documentTitle: string
  summary: string
  keyPoints: string[]
  relevantSection?: string
  quote?: string
}

interface DocumentSummaryPanelProps {
  payload: DocumentSummaryPayload
}

export function DocumentSummaryPanel({ payload }: DocumentSummaryPanelProps) {
  const { documentTitle, summary, keyPoints, relevantSection, quote } = payload

  return (
    <Card className="w-full max-w-md shadow-lg border-2 border-slate-100 overflow-hidden">
      <CardHeader className="bg-slate-50 border-b py-3 px-4">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
          <span>📄</span>
          <span className="truncate">{documentTitle}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="p-4 space-y-4">
          <p className="text-sm text-slate-700 leading-relaxed">
            {summary}
          </p>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Puntos clave:</h4>
            <ul className="space-y-1.5">
              {keyPoints.map((point, index) => (
                <li key={index} className="text-xs text-slate-600 flex items-start gap-2">
                  <span className="text-slate-300 mt-0.5">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {relevantSection && (
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center gap-2">
              <span className="text-blue-500">📍</span>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tight">Sección relevante</span>
                <span className="text-xs font-bold text-blue-700">{relevantSection}</span>
              </div>
            </div>
          )}

          {quote && (
            <div className="bg-slate-100 p-4 rounded-lg relative overflow-hidden group">
              <span className="absolute -top-1 -left-1 text-4xl text-slate-200 pointer-events-none select-none">❝</span>
              <p className="text-xs font-mono text-slate-600 leading-relaxed relative z-10 pl-4 pr-4">
                {quote}
              </p>
              <span className="absolute -bottom-4 -right-1 text-4xl text-slate-200 pointer-events-none select-none">❞</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
