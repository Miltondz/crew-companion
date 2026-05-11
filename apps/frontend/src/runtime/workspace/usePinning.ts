import { useCallback, useEffect, useState } from 'react'
import { layoutEngine } from './layout-engine'
import { pinningStore, type PinnedEntry } from './pinning'
import type { SurfaceMount } from './types'

export function usePinning() {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    return layoutEngine.subscribe(() => setVersion(v => v + 1))
  }, [])

  const pin = useCallback((mount: SurfaceMount) => {
    layoutEngine.pin(mount.mountId)
    pinningStore.add({
      manifestId: mount.manifestId,
      envelope: mount.envelope,
      regionId: mount.regionId,
      pinnedAt: Date.now(),
    })
  }, [])

  const unpin = useCallback((mount: SurfaceMount) => {
    layoutEngine.unpin(mount.mountId)
    pinningStore.remove(mount.manifestId)
  }, [])

  const list: PinnedEntry[] = pinningStore.list()
  void version
  return { pinned: list, pin, unpin }
}
