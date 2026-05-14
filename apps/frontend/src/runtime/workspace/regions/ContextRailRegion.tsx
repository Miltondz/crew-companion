'use client'

import { useState } from 'react'
import { SurfaceHost } from '@/runtime/surface-registry/SurfaceHost'
import { layoutEngine } from '../layout-engine'
import { usePinning } from '../usePinning'
import type { SurfaceMount } from '../types'

interface Props {
  mounts: SurfaceMount[]
}

export function ContextRailRegion({ mounts }: Props) {
  const { pin, unpin } = usePinning()
  if (mounts.length === 0) return null
  return (
    <aside className="workspace-region workspace-region--context-rail flex w-72 flex-col gap-2 shrink-0">
      {mounts.map(m => (
        <ContextRailFrame key={m.mountId} mount={m} onPin={() => pin(m)} onUnpin={() => unpin(m)} onClose={() => layoutEngine.unmount(m.mountId)} />
      ))}
    </aside>
  )
}

function ContextRailFrame({
  mount,
  onPin,
  onUnpin,
  onClose,
}: {
  mount: SurfaceMount
  onPin: () => void
  onUnpin: () => void
  onClose: () => void
}) {
  const [minimized, setMinimized] = useState(false)
  return (
    <div className={`relative rounded-lg bg-white shadow-sm ring-1 ring-slate-200 ${mount.hibernated ? 'opacity-50' : ''}`}>
      <div className="absolute right-1 top-1 z-10 flex gap-1 text-[10px]">
        <button
          onClick={() => setMinimized(m => !m)}
          className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500 hover:bg-slate-200"
          aria-label={minimized ? 'expand' : 'minimize'}
        >
          {minimized ? '▲' : '▼'}
        </button>
        <button
          onClick={() => (mount.pinned ? onUnpin() : onPin())}
          className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500 hover:bg-slate-200"
        >
          {mount.pinned ? '📌' : '📍'}
        </button>
        {!mount.pinned && (
          <button
            onClick={onClose}
            className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500 hover:bg-red-100 hover:text-red-600"
          >
            ✕
          </button>
        )}
      </div>
      {!minimized && <SurfaceHost envelope={mount.envelope} context={mount.envelope.context} />}
    </div>
  )
}
