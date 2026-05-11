import type { RegionId, SurfaceEnvelope } from '@/runtime/surface-registry/types'

export type { RegionId }

export type RegionKind = 'anchor' | 'generative' | 'contextual'

export interface RegionSpec {
  id: RegionId
  kind: RegionKind
  capacity: number
  defaultDensity: 'compact' | 'standard' | 'hero'
}

export interface SurfaceMount {
  mountId: string
  manifestId: string
  envelope: SurfaceEnvelope
  regionId: RegionId
  pinned: boolean
  hibernated: boolean
  mountedAt: number
  priority: number
}

export interface RegionState {
  spec: RegionSpec
  mounts: SurfaceMount[]
  collapsed: boolean
}

export type LayoutState = Record<RegionId, RegionState>

export type MountResult =
  | { ok: true; mountId: string; evicted: string[] }
  | { ok: false; reason: string }

export const REGION_SPECS: Record<RegionId, RegionSpec> = {
  'command-surface':  { id: 'command-surface',  kind: 'anchor',     capacity: 1, defaultDensity: 'compact'  },
  'primary-workzone': { id: 'primary-workzone', kind: 'generative', capacity: 2, defaultDensity: 'standard' },
  'context-rail':     { id: 'context-rail',     kind: 'generative', capacity: 3, defaultDensity: 'compact'  },
  'agent-rail':       { id: 'agent-rail',       kind: 'anchor',     capacity: 1, defaultDensity: 'hero'     },
  'activity-stream':  { id: 'activity-stream',  kind: 'anchor',     capacity: 1, defaultDensity: 'compact'  },
  'ambient-overlay':  { id: 'ambient-overlay',  kind: 'contextual', capacity: 5, defaultDensity: 'compact'  },
}

export function emptyLayoutState(): LayoutState {
  const state = {} as LayoutState
  for (const id of Object.keys(REGION_SPECS) as RegionId[]) {
    state[id] = { spec: REGION_SPECS[id], mounts: [], collapsed: false }
  }
  return state
}
