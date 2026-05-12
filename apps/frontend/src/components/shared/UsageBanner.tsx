'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Usage {
  count: number
  limit: number
  remaining: number
  limitReached: boolean
  warningThreshold: boolean
}

export function UsageBanner() {
  const [usage, setUsage] = useState<Usage | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/usage').then(r => r.json()).then(setUsage).catch(() => null)
  }, [])

  if (!usage || dismissed) return null
  if (!usage.warningThreshold && !usage.limitReached) return null

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-2 text-xs font-medium border-b',
      usage.limitReached
        ? 'bg-red-500/10 border-red-500/30 text-red-300'
        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
    )}>
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
      {usage.limitReached
        ? `Límite diario de ${usage.limit} mensajes alcanzado. Se renueva mañana.`
        : `${usage.remaining} mensajes restantes hoy (límite: ${usage.limit}/día).`}
      {!usage.limitReached && (
        <button onClick={() => setDismissed(true)} className="ml-auto opacity-60 hover:opacity-100">
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}
