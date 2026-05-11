'use client'

import type { SurfaceMount } from '../types'

interface Props {
  mounts: SurfaceMount[]
}

export function CommandSurfaceRegion({ mounts: _mounts }: Props) {
  return (
    <div className="workspace-region workspace-region--command-surface flex h-10 items-center gap-2 border-b border-slate-200 bg-white/80 px-4 text-xs text-slate-400 backdrop-blur-sm">
      <span>⌘K</span>
      <span className="italic">command palette — 4.4</span>
    </div>
  )
}
