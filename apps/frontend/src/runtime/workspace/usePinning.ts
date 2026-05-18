import { useCallback, useEffect, useState } from 'react'
import { layoutEngine } from './layout-engine'
import { getPinningStore, type PinnedEntry } from './pinning'
import type { SurfaceMount } from './types'

export function usePinning(workspaceId: string | undefined) {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    return layoutEngine.subscribe(() => setVersion(v => v + 1))
  }, [])

  const pin = useCallback((mount: SurfaceMount) => {
    layoutEngine.pin(mount.mountId)
    if (workspaceId) {
      getPinningStore(workspaceId).add({
        manifestId: mount.manifestId,
        envelope: mount.envelope,
        regionId: mount.regionId,
        pinnedAt: Date.now(),
      })
    }
  }, [workspaceId])

  const unpin = useCallback((mount: SurfaceMount) => {
    layoutEngine.unpin(mount.mountId)
    if (workspaceId) {
      getPinningStore(workspaceId).remove(mount.manifestId)
    }
  }, [workspaceId])

  const list: PinnedEntry[] = workspaceId ? getPinningStore(workspaceId).list() : []
  void version
  return { pinned: list, pin, unpin }
}
