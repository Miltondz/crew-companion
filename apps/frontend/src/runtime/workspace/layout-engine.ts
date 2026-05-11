import { surfaceRegistry } from '@/runtime/surface-registry/registry'
import type { SurfaceEnvelope } from '@/runtime/surface-registry/types'
import type { UrgencyPhase } from '@/lib/crew/types'
import {
  emptyLayoutState,
  REGION_SPECS,
  type LayoutState,
  type MountResult,
  type RegionId,
  type SurfaceMount,
} from './types'

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `mount-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function payloadHash(env: SurfaceEnvelope): string {
  try {
    return JSON.stringify(env.payload)
  } catch {
    return env.envelopeId
  }
}

export class LayoutEngine {
  private state: LayoutState = emptyLayoutState()
  private listeners: Set<() => void> = new Set()

  getState(): LayoutState {
    return this.state
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit(): void {
    for (const fn of this.listeners) fn()
  }

  mount(envelope: SurfaceEnvelope, opts: { region?: RegionId; pinned?: boolean } = {}): MountResult {
    const manifest = surfaceRegistry.get(envelope.surfaceId)
    if (!manifest) return { ok: false, reason: `unknown_surface:${envelope.surfaceId}` }

    const regionId: RegionId = opts.region ?? manifest.preferredZone
    const region = this.state[regionId]
    if (!region) return { ok: false, reason: `unknown_region:${regionId}` }

    const incomingPriority = manifest.priority

    // Dedup: same manifest + payload already mounted in same region.
    const incomingHash = payloadHash(envelope)
    const dup = region.mounts.find(
      m => m.manifestId === manifest.id && payloadHash(m.envelope) === incomingHash,
    )
    if (dup) return { ok: true, mountId: dup.mountId, evicted: [] }

    const evicted: string[] = []
    if (region.mounts.length >= region.spec.capacity) {
      const result = this.makeRoom(regionId, incomingPriority)
      if (!result.ok) return { ok: false, reason: result.reason }
      evicted.push(...result.evicted)
    }

    const mount: SurfaceMount = {
      mountId: uuid(),
      manifestId: manifest.id,
      envelope,
      regionId,
      pinned: !!opts.pinned,
      hibernated: false,
      mountedAt: Date.now(),
      priority: incomingPriority,
    }

    this.state = {
      ...this.state,
      [regionId]: { ...region, mounts: [...region.mounts, mount] },
    }
    this.emit()
    return { ok: true, mountId: mount.mountId, evicted }
  }

  private makeRoom(regionId: RegionId, incomingPriority: number): MountResult {
    const region = this.state[regionId]
    // Anchor regions: refuse to evict.
    if (region.spec.kind === 'anchor') {
      return { ok: false, reason: 'anchor-region-full' }
    }
    // 1: evict oldest hibernated unpinned with priority <= incoming
    const hibernatedTarget = [...region.mounts]
      .filter(m => m.hibernated && !m.pinned && m.priority <= incomingPriority)
      .sort((a, b) => a.mountedAt - b.mountedAt)[0]
    if (hibernatedTarget) {
      return this.evict(regionId, hibernatedTarget.mountId)
    }
    // 2: evict lowest priority unpinned strictly less than incoming
    const evictTarget = [...region.mounts]
      .filter(m => !m.pinned && m.priority < incomingPriority)
      .sort((a, b) => a.priority - b.priority || a.mountedAt - b.mountedAt)[0]
    if (evictTarget) {
      return this.evict(regionId, evictTarget.mountId)
    }
    // 3: hibernate lowest equal-priority unpinned
    const hibernateTarget = [...region.mounts]
      .filter(m => !m.pinned && m.priority === incomingPriority && !m.hibernated)
      .sort((a, b) => a.mountedAt - b.mountedAt)[0]
    if (hibernateTarget) {
      this.hibernate(hibernateTarget.mountId)
      return { ok: true, mountId: '', evicted: [] }
    }
    return { ok: false, reason: 'region-full-all-pinned' }
  }

  private evict(regionId: RegionId, mountId: string): MountResult {
    const region = this.state[regionId]
    this.state = {
      ...this.state,
      [regionId]: { ...region, mounts: region.mounts.filter(m => m.mountId !== mountId) },
    }
    return { ok: true, mountId: '', evicted: [mountId] }
  }

  unmount(mountId: string, opts: { force?: boolean } = {}): boolean {
    for (const regionId of Object.keys(this.state) as RegionId[]) {
      const region = this.state[regionId]
      const mount = region.mounts.find(m => m.mountId === mountId)
      if (!mount) continue
      if (mount.pinned && !opts.force) return false
      this.state = {
        ...this.state,
        [regionId]: { ...region, mounts: region.mounts.filter(m => m.mountId !== mountId) },
      }
      this.emit()
      return true
    }
    return false
  }

  private updateMount(mountId: string, fn: (m: SurfaceMount) => SurfaceMount): boolean {
    for (const regionId of Object.keys(this.state) as RegionId[]) {
      const region = this.state[regionId]
      const idx = region.mounts.findIndex(m => m.mountId === mountId)
      if (idx === -1) continue
      const next = [...region.mounts]
      next[idx] = fn(next[idx])
      this.state = { ...this.state, [regionId]: { ...region, mounts: next } }
      this.emit()
      return true
    }
    return false
  }

  pin(mountId: string): void {
    this.updateMount(mountId, m => ({ ...m, pinned: true }))
  }

  unpin(mountId: string): void {
    this.updateMount(mountId, m => ({ ...m, pinned: false }))
  }

  hibernate(mountId: string): void {
    this.updateMount(mountId, m => ({ ...m, hibernated: true }))
  }

  wake(mountId: string): void {
    this.updateMount(mountId, m => ({ ...m, hibernated: false }))
  }

  onPhaseChange(prev: UrgencyPhase, next: UrgencyPhase): void {
    if (next === 'panic' && prev !== 'panic') {
      const primary = this.state['primary-workzone']
      const evictees = primary.mounts.filter(m => !m.pinned && m.priority < 70)
      for (const m of evictees) this.unmount(m.mountId)
    }
    // Expired freezes generative content — handled at render time, not state level.
  }

  reset(): void {
    this.state = emptyLayoutState()
    this.emit()
  }

  /** Used by pinning hydration on boot. */
  forceMount(envelope: SurfaceEnvelope, regionId: RegionId, pinned: boolean): MountResult {
    const manifest = surfaceRegistry.get(envelope.surfaceId)
    if (!manifest) return { ok: false, reason: 'unknown_surface' }
    const region = this.state[regionId]
    const mount: SurfaceMount = {
      mountId: uuid(),
      manifestId: manifest.id,
      envelope,
      regionId,
      pinned,
      hibernated: false,
      mountedAt: Date.now(),
      priority: manifest.priority,
    }
    this.state = {
      ...this.state,
      [regionId]: { ...region, mounts: [...region.mounts, mount] },
    }
    this.emit()
    return { ok: true, mountId: mount.mountId, evicted: [] }
  }
}

export const layoutEngine = new LayoutEngine()

void REGION_SPECS // keep import for tree-shake stability if exports prune
