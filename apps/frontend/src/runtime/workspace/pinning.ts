import type { SurfaceEnvelope } from '@/runtime/surface-registry/types'
import { layoutEngine } from './layout-engine'
import type { RegionId } from './types'

const storageKey = (workspaceId: string) =>
  `crew-companion:pinned-surfaces:v2:${workspaceId}`

export interface PinnedEntry {
  manifestId: string
  envelope: SurfaceEnvelope
  regionId: RegionId
  pinnedAt: number
}

function readStorage(workspaceId: string): PinnedEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(storageKey(workspaceId))
    return raw ? (JSON.parse(raw) as PinnedEntry[]) : []
  } catch {
    return []
  }
}

function writeStorage(workspaceId: string, entries: PinnedEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey(workspaceId), JSON.stringify(entries))
  } catch {
    // Quota or disabled storage: ignore. Pinning becomes session-only.
  }
}

class PinningStore {
  constructor(private workspaceId: string) {}

  list(): PinnedEntry[] {
    return readStorage(this.workspaceId)
  }

  add(entry: PinnedEntry): void {
    const all = readStorage(this.workspaceId).filter(e => e.manifestId !== entry.manifestId)
    all.push(entry)
    writeStorage(this.workspaceId, all)
  }

  remove(manifestId: string): void {
    const all = readStorage(this.workspaceId).filter(e => e.manifestId !== manifestId)
    writeStorage(this.workspaceId, all)
  }

  clear(): void {
    writeStorage(this.workspaceId, [])
  }

  hydrateIntoEngine(): void {
    for (const entry of this.list()) {
      layoutEngine.forceMount(entry.envelope, entry.regionId, true)
    }
  }
}

const storeCache = new Map<string, PinningStore>()

export function getPinningStore(workspaceId: string): PinningStore {
  let store = storeCache.get(workspaceId)
  if (!store) {
    store = new PinningStore(workspaceId)
    storeCache.set(workspaceId, store)
  }
  return store
}
