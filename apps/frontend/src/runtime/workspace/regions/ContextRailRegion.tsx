'use client'

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
        <div key={m.mountId} className={`relative rounded-lg bg-white shadow-sm ring-1 ring-slate-200 ${m.hibernated ? 'opacity-50' : ''}`}>
          <div className="absolute right-1 top-1 z-10 flex gap-1 text-[10px]">
            <button
              onClick={() => (m.pinned ? unpin(m) : pin(m))}
              className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500 hover:bg-slate-200"
            >
              {m.pinned ? '📌' : '📍'}
            </button>
            {!m.pinned && (
              <button
                onClick={() => layoutEngine.unmount(m.mountId)}
                className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500 hover:bg-red-100 hover:text-red-600"
              >
                ✕
              </button>
            )}
          </div>
          <SurfaceHost envelope={m.envelope} context={m.envelope.context} />
        </div>
      ))}
    </aside>
  )
}
