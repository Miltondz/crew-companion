'use client'

import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export function AgentRailRegion({ children }: Props) {
  return (
    <div className="workspace-region workspace-region--agent-rail flex w-[380px] shrink-0 flex-col border-l border-slate-200 bg-white shadow-xl">
      {children}
    </div>
  )
}
