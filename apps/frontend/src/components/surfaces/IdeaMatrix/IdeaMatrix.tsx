'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SurfaceProps } from '@/runtime/surface-registry/types'
import type { IdeaMatrixPayload } from './manifest'

const SVG_W = 400
const SVG_H = 300
const PAD = 32

function toSvgX(viability: number) {
  return PAD + (viability / 100) * (SVG_W - PAD * 2)
}

function toSvgY(wow: number) {
  return SVG_H - PAD - (wow / 100) * (SVG_H - PAD * 2)
}

export default function IdeaMatrix({ payload }: SurfaceProps<IdeaMatrixPayload>) {
  const { ideas, xLabel = 'Viabilidad', yLabel = 'Impacto WOW' } = payload
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = ideas.find(i => i.id === selectedId)

  return (
    <Card className="w-full max-w-2xl shadow-lg">
      <CardHeader className="py-3 px-4 border-b bg-slate-50">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-bold">Idea Matrix</CardTitle>
          <Badge variant="outline" className="ml-auto text-[10px]">{ideas.length} ideas</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full border rounded bg-white">
          <rect x={PAD} y={PAD} width={(SVG_W - PAD * 2) / 2} height={(SVG_H - PAD * 2) / 2} fill="#fef9c3" opacity={0.4} />
          <rect x={PAD + (SVG_W - PAD * 2) / 2} y={PAD} width={(SVG_W - PAD * 2) / 2} height={(SVG_H - PAD * 2) / 2} fill="#dcfce7" opacity={0.4} />
          <rect x={PAD} y={PAD + (SVG_H - PAD * 2) / 2} width={(SVG_W - PAD * 2) / 2} height={(SVG_H - PAD * 2) / 2} fill="#f1f5f9" opacity={0.4} />
          <rect x={PAD + (SVG_W - PAD * 2) / 2} y={PAD + (SVG_H - PAD * 2) / 2} width={(SVG_W - PAD * 2) / 2} height={(SVG_H - PAD * 2) / 2} fill="#dbeafe" opacity={0.4} />

          <line x1={PAD + (SVG_W - PAD * 2) / 2} y1={PAD} x2={PAD + (SVG_W - PAD * 2) / 2} y2={SVG_H - PAD} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="4,3" />
          <line x1={PAD} y1={PAD + (SVG_H - PAD * 2) / 2} x2={SVG_W - PAD} y2={PAD + (SVG_H - PAD * 2) / 2} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="4,3" />

          <line x1={PAD} y1={SVG_H - PAD} x2={SVG_W - PAD} y2={SVG_H - PAD} stroke="#94a3b8" strokeWidth={1} />
          <line x1={PAD} y1={PAD} x2={PAD} y2={SVG_H - PAD} stroke="#94a3b8" strokeWidth={1} />

          <text x={(SVG_W - PAD * 2) / 2 + PAD} y={SVG_H - 8} textAnchor="middle" fontSize={10} fill="#64748b">{xLabel}</text>
          <text x={10} y={(SVG_H - PAD * 2) / 2 + PAD} textAnchor="middle" fontSize={10} fill="#64748b" transform={`rotate(-90, 10, ${(SVG_H - PAD * 2) / 2 + PAD})`}>{yLabel}</text>

          <text x={PAD + 6} y={PAD + 12} fontSize={9} fill="#78716c">Investigar</text>
          <text x={PAD + (SVG_W - PAD * 2) / 2 + 6} y={PAD + 12} fontSize={9} fill="#166534">Ganar</text>
          <text x={PAD + (SVG_W - PAD * 2) / 2 + 6} y={PAD + (SVG_H - PAD * 2) / 2 + 14} fontSize={9} fill="#1e40af">Mejorar</text>
          <text x={PAD + 6} y={PAD + (SVG_H - PAD * 2) / 2 + 14} fontSize={9} fill="#94a3b8">Descartar</text>

          {ideas.map(idea => {
            const cx = toSvgX(idea.viability)
            const cy = toSvgY(idea.wow)
            const fill = idea.evaluated ? '#6366f1' : '#94a3b8'
            return (
              <g key={idea.id} onClick={() => setSelectedId(idea.id === selectedId ? null : idea.id)} style={{ cursor: 'pointer' }}>
                <circle cx={cx} cy={cy} r={12} fill={fill} opacity={0.85} stroke={idea.id === selectedId ? '#312e81' : 'none'} strokeWidth={2} />
                <text x={cx} y={cy + 24} textAnchor="middle" fontSize={9} fill="#334155">
                  {idea.title.length > 10 ? idea.title.slice(0, 10) + '…' : idea.title}
                </text>
              </g>
            )
          })}
        </svg>

        {selected && (
          <div className="mt-3 p-3 rounded-lg bg-indigo-50 border border-indigo-200">
            <p className="text-sm font-semibold text-indigo-800">{selected.title}</p>
            {selected.description && (
              <p className="text-xs text-indigo-600 mt-1">{selected.description}</p>
            )}
            <div className="flex gap-3 mt-2 text-[10px] text-indigo-500">
              <span>Viabilidad: {selected.viability}</span>
              <span>WOW: {selected.wow}</span>
              {selected.evaluated && <span className="font-semibold">Evaluada</span>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
