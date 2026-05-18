'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SurfaceProps } from '@/runtime/surface-registry/types'
import type { TechStackPayload } from './manifest'

export default function TechStackPanel({ payload }: SurfaceProps<TechStackPayload>) {
  const projectName = typeof payload?.projectName === 'string' ? payload.projectName : 'Sin título'
  const stack = Array.isArray(payload?.stack) ? payload.stack : []
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null)

  if (stack.length === 0) {
    return <div className="p-4 text-center text-[var(--text-muted)] text-xs">Sin datos para mostrar</div>
  }

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd).then(() => {
      setCopiedCmd(cmd)
      setTimeout(() => setCopiedCmd(null), 1500)
    })
  }

  return (
    <Card className="w-full max-w-md border-zinc-200 shadow-md overflow-hidden">
      <CardHeader className="bg-zinc-900 py-3 px-4">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
          <span>🛠️</span>
          <span>{projectName} — Stack técnico</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {/* Stack */}
        <div className="p-4 space-y-2 border-b border-zinc-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Tecnologías</p>
          <div className="flex flex-wrap gap-2">
            {stack.map((tech, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5">
                <span className="text-xs font-semibold text-zinc-800">{tech.name}</span>
                {tech.version && <span className="text-[10px] text-zinc-400">v{tech.version}</span>}
                <Badge variant="outline" className="text-[9px] px-1 py-0 border-zinc-300 text-zinc-500 font-normal">
                  {tech.role}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Commands */}
        {payload?.commands && payload.commands.length > 0 && (
          <div className="p-4 space-y-2 border-b border-zinc-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Comandos</p>
            <div className="space-y-1.5">
              {payload.commands.map((cmd, i) => (
                <div key={i} className="group flex items-center justify-between gap-2 rounded-lg bg-zinc-900 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-[10px] text-zinc-400">{cmd.label}</p>
                    <code className="text-xs text-emerald-400 font-mono truncate block">{cmd.command}</code>
                  </div>
                  <button
                    onClick={() => copyCommand(cmd.command)}
                    className={cn(
                      'shrink-0 rounded px-2 py-1 text-[10px] font-bold transition-colors',
                      copiedCmd === cmd.command
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    )}
                  >
                    {copiedCmd === cmd.command ? '✓' : 'copy'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ports */}
        {payload?.ports && payload.ports.length > 0 && (
          <div className="p-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Puertos</p>
            <div className="flex flex-wrap gap-2">
              {payload.ports.map((p, i) => (
                <div key={i} className="flex items-center gap-1.5 rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1">
                  <span className="text-xs font-mono font-bold text-blue-700">:{p.port}</span>
                  <span className="text-[10px] text-blue-500">{p.service}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {payload?.notes && (
          <div className="px-4 pb-4">
            <p className="text-xs text-zinc-500 italic">{payload.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
