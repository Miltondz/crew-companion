'use client'

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { SurfaceProps } from '@/runtime/surface-registry/types'
import type { TeamVelocityPayload } from './manifest'

const riskConfig = {
  low:    { label: 'Bajo riesgo',  className: 'bg-emerald-100 text-emerald-700' },
  medium: { label: 'Riesgo medio', className: 'bg-yellow-100 text-yellow-700' },
  high:   { label: 'Alto riesgo',  className: 'bg-red-100 text-red-700' },
}

export default function TeamVelocityPanel({ payload }: SurfaceProps<TeamVelocityPayload>) {
  const riskLevel = (payload?.riskLevel && payload.riskLevel in riskConfig) ? payload.riskLevel : 'low' as const
  const members = Array.isArray(payload?.members) ? payload.members : []
  const overallProgress = typeof payload?.overallProgress === 'number' ? payload.overallProgress : 0
  const milestone = typeof payload?.milestone === 'string' ? payload.milestone : ''

  if (members.length === 0) {
    return <div className="p-4 text-center text-[var(--text-muted)] text-xs">Sin datos para mostrar</div>
  }

  const rCfg = riskConfig[riskLevel]

  return (
    <Card className="w-full max-w-md border-blue-200 shadow-md overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 py-3 px-4">
        <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
          <span className="flex items-center gap-2"><span>📊</span>Velocidad del equipo</span>
          <Badge variant="outline" className={cn('text-[9px] border-none', rCfg.className)}>
            {rCfg.label}
          </Badge>
        </CardTitle>
        <p className="text-xs text-blue-100 mt-0.5">{milestone}</p>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Overall progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-zinc-700">Progreso general</span>
            <span className="font-bold text-blue-600">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Per-member breakdown */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Por miembro</p>
          {members.map((m, i) => {
            const memberProgress = m.totalTasks > 0 ? (m.doneTasks / m.totalTasks) * 100 : 0
            return (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">
                      {m.name[0]}
                    </div>
                    <span className="text-xs font-medium text-zinc-700">{m.name}</span>
                    {m.blockers > 0 && (
                      <span className="text-[10px] font-bold text-red-500">⚠️ {m.blockers}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    {m.activeTasks > 0 && <span className="text-blue-500">🔄 {m.activeTasks}</span>}
                    <span>{m.doneTasks}/{m.totalTasks}</span>
                  </div>
                </div>
                <Progress value={memberProgress} className="h-1.5" />
              </div>
            )
          })}
        </div>

        {payload?.recommendation && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
            <p className="text-xs text-blue-700">💡 {payload.recommendation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
