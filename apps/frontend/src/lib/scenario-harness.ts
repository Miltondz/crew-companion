import type { Role, TechnicalLevel, UrgencyPhase, Specialization } from '@/lib/crew/types'
import { surfaceRegistry } from '@/runtime/surface-registry/registry'
import type { RegionId } from '@/runtime/surface-registry/types'

export interface Scenario {
  role: Role
  techLevel: TechnicalLevel
  specialization?: Specialization
  phase: UrgencyPhase
  hasActiveBlocker: boolean
}

export interface SurfaceEligibility {
  surfaceId: string
  displayName: string
  targetRegion: RegionId
  allowedRoles: Role[]
  eligible: boolean
  reason: string
}

export function deriveEligibility(scenario: Scenario): SurfaceEligibility[] {
  return surfaceRegistry.listIds().map(id => {
    const manifest = surfaceRegistry.get(id)!

    let eligible = true
    let reason = 'ok'

    if (manifest.visibleToRoles.length > 0 && !manifest.visibleToRoles.includes(scenario.role)) {
      eligible = false
      reason = 'role mismatch'
    } else if (
      manifest.visibleToTechLevels &&
      manifest.visibleToTechLevels.length > 0 &&
      !manifest.visibleToTechLevels.includes(scenario.techLevel)
    ) {
      eligible = false
      reason = 'tech level mismatch'
    } else if (
      manifest.visibleToSpecializations &&
      manifest.visibleToSpecializations.length > 0 &&
      (!scenario.specialization || !manifest.visibleToSpecializations.includes(scenario.specialization))
    ) {
      eligible = false
      reason = 'specialization mismatch'
    } else if (manifest.forbiddenInPhases && manifest.forbiddenInPhases.includes(scenario.phase)) {
      eligible = false
      reason = `forbidden in phase: ${scenario.phase}`
    }

    return {
      surfaceId: id,
      displayName: manifest.displayName,
      targetRegion: manifest.preferredZone,
      allowedRoles: manifest.visibleToRoles,
      eligible,
      reason,
    }
  })
}

export interface WorkspaceSnapshot {
  id: string
  label: string
  capturedAt: number
  scenario: Scenario
  mounts: Array<{ region: string; surfaceIds: string[] }>
  state: { taskCount: number; milestoneCount: number; blockerCount: number; memberCount: number }
}

const STORAGE_KEY = 'dev:snapshots'

function readSnapshots(): WorkspaceSnapshot[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as WorkspaceSnapshot[]) : []
  } catch {
    return []
  }
}

function writeSnapshots(snapshots: WorkspaceSnapshot[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots))
  } catch {}
}

export function captureSnapshot(
  label: string,
  scenario: Scenario,
  layoutMounts: Array<{ region: string; mounts: Array<{ surfaceId: string }> }>,
  state: { tasks: unknown[]; milestones: unknown[]; blockers: unknown[]; members: unknown[] },
): WorkspaceSnapshot {
  const snapshot: WorkspaceSnapshot = {
    id: crypto.randomUUID(),
    label,
    capturedAt: Date.now(),
    scenario,
    mounts: layoutMounts.map(r => ({
      region: r.region,
      surfaceIds: r.mounts.map(m => m.surfaceId),
    })),
    state: {
      taskCount: state.tasks.length,
      milestoneCount: state.milestones.length,
      blockerCount: state.blockers.length,
      memberCount: state.members.length,
    },
  }

  let all = readSnapshots()
  all.push(snapshot)
  // prevent localStorage quota exhaustion
  if (all.length > 50) all = all.slice(-50)
  writeSnapshots(all)
  return snapshot
}

export function listSnapshots(): WorkspaceSnapshot[] {
  return readSnapshots()
}

export function deleteSnapshot(id: string): void {
  writeSnapshots(readSnapshots().filter(s => s.id !== id))
}

export interface SnapshotDiff {
  addedSurfaces: string[]
  removedSurfaces: string[]
  sameSurfaces: string[]
  jaccardSimilarity: number
  stateDeltas: { tasks: number; milestones: number; blockers: number; members: number }
}

export function diffSnapshots(a: WorkspaceSnapshot, b: WorkspaceSnapshot): SnapshotDiff {
  const setA = new Set(a.mounts.flatMap(r => r.surfaceIds))
  const setB = new Set(b.mounts.flatMap(r => r.surfaceIds))

  const added = [...setB].filter(id => !setA.has(id))
  const removed = [...setA].filter(id => !setB.has(id))
  const same = [...setA].filter(id => setB.has(id))

  const union = new Set([...setA, ...setB])
  const jaccard = union.size === 0 ? 1 : same.length / union.size

  return {
    addedSurfaces: added,
    removedSurfaces: removed,
    sameSurfaces: same,
    jaccardSimilarity: jaccard,
    stateDeltas: {
      tasks: b.state.taskCount - a.state.taskCount,
      milestones: b.state.milestoneCount - a.state.milestoneCount,
      blockers: b.state.blockerCount - a.state.blockerCount,
      members: b.state.memberCount - a.state.memberCount,
    },
  }
}
