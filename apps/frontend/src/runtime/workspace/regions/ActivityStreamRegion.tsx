'use client'

import { useState } from 'react'
import type { SurfaceMount } from '../types'

interface Props {
  mounts: SurfaceMount[]
}

export function ActivityStreamRegion({ mounts: _mounts }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`workspace-region workspace-region--activity-stream border-t border-slate-200 bg-white text-xs ${open ? 'h-28' : 'h-8'} transition-all`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex h-8 w-full items-center gap-2 px-4 text-slate-400 hover:text-slate-600"
      >
        <span>{open ? '▾' : '▸'}</span>
        <span>Activity stream — events feed in 4.4</span>
      </button>
    </div>
  )
}
