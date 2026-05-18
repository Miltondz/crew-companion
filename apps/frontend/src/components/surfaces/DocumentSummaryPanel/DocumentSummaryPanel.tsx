'use client'

import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { FileCard, inferFileFormat, VALID_FORMATS, type FormatFileProps } from '@/components/ui/file-card-collections'
import type { SurfaceProps } from '@/runtime/surface-registry/types'
import type { DocumentSummaryPayload } from './manifest'

function resolveFormat(payload: DocumentSummaryPayload): FormatFileProps {
  if (payload.documentFormat && VALID_FORMATS.includes(payload.documentFormat as FormatFileProps)) {
    return payload.documentFormat as FormatFileProps
  }
  return inferFileFormat(payload.documentTitle)
}

export default function DocumentSummaryPanel({ payload }: SurfaceProps<DocumentSummaryPayload>) {
  const documentTitle = typeof payload?.documentTitle === 'string' ? payload.documentTitle : 'Sin título'
  const summary = typeof payload?.summary === 'string' ? payload.summary : ''
  const keyPoints = Array.isArray(payload?.keyPoints) ? payload.keyPoints : []
  const relevantSection = payload?.relevantSection
  const quote = payload?.quote
  const format = resolveFormat(payload ?? ({} as DocumentSummaryPayload))

  if (!summary && keyPoints.length === 0) {
    return <div className="p-4 text-center text-[var(--text-muted)] text-xs">Sin datos para mostrar</div>
  }

  return (
    <Card className="w-full max-w-md shadow-lg border border-slate-200 dark:border-slate-700/60 overflow-hidden">
      <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/40 py-3 px-4">
        <div className="flex items-center gap-3">
          <FileCard formatFile={format} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
              Documento
            </p>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
              {documentTitle}
            </h3>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="p-4 space-y-4">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {summary}
          </p>

          <Separator className="bg-slate-100 dark:bg-slate-800" />

          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Puntos clave
            </h4>
            <ul className="space-y-1.5">
              {keyPoints.map((point, index) => (
                <li key={index} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                  <span className="text-slate-300 dark:text-slate-600 mt-0.5 shrink-0">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {relevantSection && (
            <div className="bg-blue-500/5 border border-blue-500/20 p-3 rounded-lg flex items-center gap-2">
              <span className="text-blue-500 shrink-0">📍</span>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-blue-400 dark:text-blue-500 uppercase tracking-tight">
                  Sección relevante
                </span>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 truncate">
                  {relevantSection}
                </span>
              </div>
            </div>
          )}

          {quote && (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg relative overflow-hidden">
              <span className="absolute -top-1 -left-1 text-4xl text-slate-200 dark:text-slate-700 pointer-events-none select-none">❝</span>
              <p className="text-xs font-mono text-slate-600 dark:text-slate-400 leading-relaxed relative z-10 pl-4 pr-4">
                {quote}
              </p>
              <span className="absolute -bottom-4 -right-1 text-4xl text-slate-200 dark:text-slate-700 pointer-events-none select-none">❞</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
