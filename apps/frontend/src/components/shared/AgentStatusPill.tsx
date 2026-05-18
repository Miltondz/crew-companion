'use client'

import { useEffect, useState } from 'react'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import { warmAgent } from '@/lib/agent-warmup'

type Status = 'warming' | 'ready' | 'error'

export function AgentStatusPill() {
  const [status, setStatus] = useState<Status>('warming')

  useEffect(() => {
    let alive = true
    warmAgent().then(({ agent }) => {
      if (!alive) return
      setStatus(agent ? 'ready' : 'error')
    })
    return () => { alive = false }
  }, [])

  if (status === 'ready') {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px]">
        <Check className="w-3 h-3" /> Agente listo
      </div>
    )
  }
  if (status === 'error') {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px]">
        <AlertCircle className="w-3 h-3" /> Despertando...
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-[10px]">
      <Loader2 className="w-3 h-3 animate-spin" /> Despertando...
    </div>
  )
}
