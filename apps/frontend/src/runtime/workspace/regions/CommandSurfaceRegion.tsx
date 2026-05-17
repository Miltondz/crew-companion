'use client'

import type { ReactNode } from 'react'
import { RotateCcw, Command } from 'lucide-react'
import { SurfaceHost } from '@/runtime/surface-registry/SurfaceHost'
import type { SurfaceMount } from '../types'

interface Props {
  mounts: SurfaceMount[]
  phaseChip?: ReactNode
  milestoneTitle?: string
  countdown?: ReactNode
  blockerBadge?: ReactNode
  memberAvatars?: ReactNode
  docBadge?: ReactNode
  onCommandPalette?: () => void
  onResetLayout?: () => void
}

export function CommandSurfaceRegion({
  mounts,
  phaseChip,
  milestoneTitle,
  countdown,
  blockerBadge,
  memberAvatars,
  docBadge,
  onCommandPalette,
  onResetLayout,
}: Props) {
  return (
    <header className="h-[34px] flex items-center gap-2 px-3 border-b border-white/10 bg-[var(--bg-surface)]/80 backdrop-blur-sm shrink-0 z-10 overflow-hidden">
      {mounts.map(m => <SurfaceHost key={m.mountId} envelope={m.envelope} context={m.envelope.context} />)}

      {phaseChip}

      {milestoneTitle && (
        <span className="text-[11px] font-semibold text-[var(--text-primary)] truncate max-w-[180px]">
          {milestoneTitle}
        </span>
      )}

      {countdown && <div className="shrink-0">{countdown}</div>}

      {blockerBadge && <div className="shrink-0">{blockerBadge}</div>}

      <div className="flex-1" />

      {docBadge && <div className="shrink-0">{docBadge}</div>}

      {memberAvatars && <div className="shrink-0">{memberAvatars}</div>}

      {onCommandPalette && (
        <button
          onClick={onCommandPalette}
          className="flex items-center gap-1 h-6 px-2 rounded text-[10px] font-mono text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-primary)] transition-colors shrink-0"
          title="Paleta de comandos (Ctrl+K)"
        >
          <Command className="w-3 h-3" />
          <span>K</span>
        </button>
      )}

      {onResetLayout && (
        <button
          onClick={onResetLayout}
          className="h-6 w-6 flex items-center justify-center rounded text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-primary)] transition-colors shrink-0"
          title="Restablecer layout"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      )}
    </header>
  )
}
