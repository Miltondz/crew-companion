'use client'

import { useState } from 'react'
import { SurfaceHost } from '@/runtime/surface-registry/SurfaceHost'
import { layoutEngine } from '../layout-engine'
import { usePinning } from '../usePinning'
import type { SurfaceMount } from '../types'

interface Props {
  mounts: SurfaceMount[]
}

export function PrimaryWorkzoneRegion({ mounts }: Props) {
  const { pin, unpin } = usePinning()
  if (mounts.length === 0) return null
  return (
    <div className="workspace-region workspace-region--primary flex flex-col gap-3">
      {mounts.map(m => (
        <MountFrame key={m.mountId} mount={m} onPin={() => pin(m)} onUnpin={() => unpin(m)} onClose={() => layoutEngine.unmount(m.mountId)} />
      ))}
    </div>
  )
}

function MountFrame({
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
    <div className={`relative rounded-xl bg-white shadow-sm ring-1 ring-slate-200 ${mount.hibernated ? 'opacity-50' : ''}`}>
      <div className="absolute right-2 top-2 z-10 flex gap-1 text-xs">
        <button
          onClick={() => setMinimized(m => !m)}
          className="rounded bg-slate-100 px-2 py-0.5 text-slate-600 hover:bg-slate-200"
          aria-label={minimized ? 'expand' : 'minimize'}
        >
          {minimized ? '▲' : '▼'}
        </button>
        <button
          onClick={mount.pinned ? onUnpin : onPin}
          className="rounded bg-slate-100 px-2 py-0.5 text-slate-600 hover:bg-slate-200"
          aria-label={mount.pinned ? 'unpin' : 'pin'}
        >
          {mount.pinned ? '📌' : '📍'}
        </button>
        {!mount.pinned && (
          <button
            onClick={onClose}
            className="rounded bg-slate-100 px-2 py-0.5 text-slate-600 hover:bg-red-100 hover:text-red-600"
            aria-label="close"
          >
            ✕
          </button>
        )}
      </div>
      {!minimized && (
        <div className="p-1">
          <SurfaceHost envelope={mount.envelope} context={mount.envelope.context} />
        </div>
      )}
    </div>
  )
}
