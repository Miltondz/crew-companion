import type { SurfaceEnvelope } from '@/runtime/surface-registry/types'
import { layoutEngine } from './layout-engine'
import type { RegionId } from './types'

const STORAGE_KEY = 'crew-companion:pinned-surfaces:v1'

export interface PinnedEntry {
  manifestId: string
  envelope: SurfaceEnvelope
  regionId: RegionId
  pinnedAt: number
}

function readStorage(): PinnedEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PinnedEntry[]) : []
  } catch {
    return []
  }
}

function writeStorage(entries: PinnedEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Quota or disabled storage: ignore. Pinning becomes session-only.
  }
}

class PinningStore {
  list(): PinnedEntry[] {
    return readStorage()
  }

  add(entry: PinnedEntry): void {
    const all = readStorage().filter(e => e.manifestId !== entry.manifestId)
    all.push(entry)
    writeStorage(all)
  }

  remove(manifestId: string): void {
    const all = readStorage().filter(e => e.manifestId !== manifestId)
    writeStorage(all)
  }

  clear(): void {
    writeStorage([])
  }

  hydrateIntoEngine(): void {
    for (const entry of this.list()) {
      layoutEngine.forceMount(entry.envelope, entry.regionId, true)
    }
  }
}

export const pinningStore = new PinningStore()
