'use client'

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SurfaceProps } from '@/runtime/surface-registry/types'
import type { ForceGraphPayload } from './manifest'

const COLS = 4
const NODE_R = 20
const COL_W = 120
const ROW_H = 100
const PAD = 40

const statusFill: Record<string, string> = {
  blocked: '#ef4444',
  active: '#3b82f6',
  done: '#10b981',
  idle: '#94a3b8',
}

const criticalityStroke: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#94a3b8',
}

function nodePos(index: number) {
  const col = index % COLS
  const row = Math.floor(index / COLS)
  return {
    x: PAD + col * COL_W + COL_W / 2,
    y: PAD + row * ROW_H + NODE_R,
  }
}

export default function ForceGraph({ payload }: SurfaceProps<ForceGraphPayload>) {
  const { nodes, edges, title } = payload
  const rows = Math.ceil(nodes.length / COLS)
  const svgH = PAD * 2 + rows * ROW_H
  const svgW = PAD * 2 + COLS * COL_W

  const posMap = new Map(nodes.map((n, i) => [n.id, nodePos(i)]))

  return (
    <Card className="w-full max-w-2xl shadow-lg">
      <CardHeader className="py-3 px-4 border-b bg-slate-50">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-bold">Grafo de dependencias</CardTitle>
          {title && <span className="text-xs text-slate-500">{title}</span>}
          <Badge variant="outline" className="ml-auto text-[10px]">{nodes.length} nodos</Badge>
          <Badge variant="outline" className="text-[10px]">{edges.length} enlaces</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ minHeight: 120 }}>
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
            </marker>
            {['high', 'medium', 'low'].map(c => (
              <marker key={c} id={`arrow-${c}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill={criticalityStroke[c]} />
              </marker>
            ))}
          </defs>

          {edges.map((e, i) => {
            const from = posMap.get(e.from)
            const to = posMap.get(e.to)
            if (!from || !to) return null
            const stroke = criticalityStroke[e.criticality]
            return (
              <line
                key={i}
                x1={from.x} y1={from.y}
                x2={to.x} y2={to.y}
                stroke={stroke}
                strokeWidth={1.5}
                markerEnd={`url(#arrow-${e.criticality})`}
              />
            )
          })}

          {nodes.map((n, i) => {
            const pos = nodePos(i)
            return (
              <g key={n.id}>
                <circle cx={pos.x} cy={pos.y} r={NODE_R} fill={statusFill[n.status]} opacity={0.9} />
                <text
                  x={pos.x}
                  y={pos.y + NODE_R + 14}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#334155"
                >
                  {n.label.length > 10 ? n.label.slice(0, 10) + '…' : n.label}
                </text>
              </g>
            )
          })}
        </svg>

        <div className="flex gap-3 mt-2 flex-wrap">
          {(['blocked', 'active', 'done', 'idle'] as const).map(s => (
            <div key={s} className="flex items-center gap-1 text-[10px] text-slate-600">
              <span style={{ background: statusFill[s] }} className="inline-block w-3 h-3 rounded-full" />
              <span className="capitalize">{s}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
