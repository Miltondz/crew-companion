'use client'

import { useState } from 'react'
import { Maximize2, Minimize2, Minus, Plus } from 'lucide-react'
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
    <div className="workspace-region workspace-region--primary grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
      {mounts.map(m => (
        <MountFrame
          key={m.mountId}
          mount={m}
          onPin={() => pin(m)}
          onUnpin={() => unpin(m)}
          onClose={() => layoutEngine.unmount(m.mountId)}
        />
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
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={[
        'relative rounded-xl bg-white shadow-sm ring-1 ring-slate-200',
        expanded ? 'md:col-span-2' : '',
        mount.hibernated ? 'opacity-50' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className="absolute right-2 top-2 z-10 flex gap-1">
        <button
          onClick={() => setMinimized(m => !m)}
          className="rounded bg-slate-100 p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
          aria-label={minimized ? 'expand' : 'minimize'}
          title={minimized ? 'Expandir' : 'Minimizar'}
        >
          {minimized ? <Plus size={12} /> : <Minus size={12} />}
        </button>
        <button
          onClick={() => setExpanded(e => !e)}
          className="rounded bg-slate-100 p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
          aria-label={expanded ? 'compact' : 'full width'}
          title={expanded ? 'Compacto' : 'Ancho completo'}
        >
          {expanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        </button>
        <button
          onClick={mount.pinned ? onUnpin : onPin}
          className="rounded bg-slate-100 px-1.5 py-1 text-slate-500 hover:bg-slate-200 hover:text-slate-700 text-[10px]"
          aria-label={mount.pinned ? 'unpin' : 'pin'}
          title={mount.pinned ? 'Desfijar' : 'Fijar'}
        >
          {mount.pinned ? '📌' : '📍'}
        </button>
        {!mount.pinned && (
          <button
            onClick={onClose}
            className="rounded bg-slate-100 px-1.5 py-1 text-slate-500 hover:bg-red-100 hover:text-red-600 text-[10px]"
            aria-label="close"
            title="Cerrar"
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
