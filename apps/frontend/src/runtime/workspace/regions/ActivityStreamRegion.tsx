'use client'

import type { ActivityEvent } from '@/lib/activity'
import type { SurfaceMount } from '../types'

interface Props {
  mounts: SurfaceMount[]
  events?: ActivityEvent[]
}

export function ActivityStreamRegion({ mounts, events }: Props) {
  const items = events ?? []
  return (
    <div className="h-8 shrink-0 border-t border-white/10 bg-[var(--bg-surface)]/60 overflow-hidden flex items-center">
      <div className="flex-shrink-0 px-3 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider border-r border-white/10 h-full flex items-center">
        Actividad
      </div>
      <div className="overflow-hidden flex-1 px-3">
        {items.length === 0 ? (
          <span className="text-[10px] text-[var(--text-muted)] font-mono">Sin actividad reciente todavía</span>
        ) : (
          <div className="ticker-track flex gap-8 whitespace-nowrap">
            {[...items, ...items].map((e, i) => (
              <span key={i < items.length ? `a-${i}` : `b-${i - items.length}`} className="text-[10px] text-[var(--text-muted)] font-mono flex-shrink-0">
                <span style={{ color: 'var(--phase-glow, #b89450)' }}>·</span>{' '}
                {e.message}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
