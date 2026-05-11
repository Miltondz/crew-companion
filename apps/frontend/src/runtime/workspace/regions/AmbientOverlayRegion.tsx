'use client'

import { SurfaceHost } from '@/runtime/surface-registry/SurfaceHost'
import { layoutEngine } from '../layout-engine'
import type { SurfaceMount } from '../types'

interface Props {
  mounts: SurfaceMount[]
}

export function AmbientOverlayRegion({ mounts }: Props) {
  if (mounts.length === 0) return null
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-40 flex flex-col gap-2">
      {mounts.map(m => (
        <div key={m.mountId} className="pointer-events-auto max-w-sm rounded-lg bg-white p-3 shadow-lg ring-1 ring-slate-200">
          <button
            onClick={() => layoutEngine.unmount(m.mountId)}
            className="absolute right-1 top-1 rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400 hover:bg-slate-100"
            aria-label="dismiss"
          >
            ✕
          </button>
          <SurfaceHost envelope={m.envelope} context={m.envelope.context} />
        </div>
      ))}
    </div>
  )
}
