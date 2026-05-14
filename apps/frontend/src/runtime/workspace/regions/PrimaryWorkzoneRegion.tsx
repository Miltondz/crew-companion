'use client'

import { useState } from 'react'
import { Maximize2, Minimize2, Minus, ChevronDown, Pin, X } from 'lucide-react'
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

  const displayName = mount.envelope.surfaceId.replace(/_/g, ' ')

  return (
    <div
      className={[
        'rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden',
        expanded ? 'md:col-span-2' : '',
        mount.hibernated ? 'opacity-50' : '',
      ].filter(Boolean).join(' ')}
    >
      {/* Visible header bar with controls */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-slate-50 border-b border-slate-100">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 truncate">
          {displayName}
        </span>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => setMinimized(m => !m)}
            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
            title={minimized ? 'Expandir' : 'Minimizar'}
          >
            {minimized ? <ChevronDown size={11} /> : <Minus size={11} />}
          </button>
          <button
            onClick={() => setExpanded(e => !e)}
            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
            title={expanded ? 'Compacto' : 'Ancho completo'}
          >
            {expanded ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
          </button>
          <button
            onClick={mount.pinned ? onUnpin : onPin}
            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
            title={mount.pinned ? 'Desfijar' : 'Fijar'}
          >
            <Pin size={11} className={mount.pinned ? 'fill-current text-indigo-500' : ''} />
          </button>
          {!mount.pinned && (
            <button
              onClick={onClose}
              className="rounded p-1 text-slate-400 hover:bg-red-100 hover:text-red-500 transition-colors"
              title="Cerrar"
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>
      {!minimized && (
        <SurfaceHost envelope={mount.envelope} context={mount.envelope.context} />
      )}
    </div>
  )
}
