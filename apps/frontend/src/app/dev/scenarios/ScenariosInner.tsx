'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, X, Check } from 'lucide-react'
import { bootstrapRegistry } from '@/runtime/surface-registry/bootstrap'
import { layoutEngine } from '@/runtime/workspace/layout-engine'
import { useCrewAgent } from '@/lib/useCrewAgent'
import {
  deriveEligibility,
  captureSnapshot,
  listSnapshots,
  deleteSnapshot,
  diffSnapshots,
  type Scenario,
  type SurfaceEligibility,
  type WorkspaceSnapshot,
  type SnapshotDiff,
} from '@/lib/scenario-harness'
import type { Role, TechnicalLevel, UrgencyPhase, Specialization } from '@/lib/crew/types'
import type { RegionId } from '@/runtime/surface-registry/types'

const ROLES: Role[] = ['leader', 'member']
const TECH_LEVELS: TechnicalLevel[] = ['high-tech', 'low-tech']
const PHASES: UrgencyPhase[] = ['normal', 'focus', 'urgent', 'panic', 'expired']
const SPECIALIZATIONS: Array<Specialization | ''> = ['', 'developer', 'designer', 'qa', 'manager', 'writer', 'other']
const REGIONS: RegionId[] = ['command-surface', 'primary-workzone', 'context-rail', 'agent-rail', 'activity-stream', 'ambient-overlay']

const DEFAULT_SCENARIO: Scenario = {
  role: 'leader',
  techLevel: 'high-tech',
  specialization: undefined,
  phase: 'normal',
  hasActiveBlocker: false,
}

function jaccardColor(score: number): string {
  if (score >= 0.7) return 'text-emerald-400'
  if (score >= 0.3) return 'text-yellow-400'
  return 'text-red-400'
}

function DeltaBadge({ value }: { value: number }) {
  if (value === 0) return <span className="text-zinc-500">0</span>
  return (
    <span className={value > 0 ? 'text-emerald-400' : 'text-red-400'}>
      {value > 0 ? '+' : ''}{value}
    </span>
  )
}

function EligibilityRow({ item }: { item: SurfaceEligibility }) {
  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
      <td className="py-2 px-3 font-mono text-[11px] text-zinc-300">{item.surfaceId}</td>
      <td className="py-2 px-3 text-[11px] text-zinc-400">{item.displayName}</td>
      <td className="py-2 px-3 text-[11px] text-zinc-500 font-mono">{item.targetRegion}</td>
      <td className="py-2 px-3 text-[11px] text-zinc-500">
        {item.allowedRoles.length === 0 ? 'all' : item.allowedRoles.join(', ')}
      </td>
      <td className="py-2 px-3">
        {item.eligible ? (
          <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
            <Check className="w-3 h-3" /> ok
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-red-400 text-[11px]">
            <X className="w-3 h-3" /> {item.reason}
          </span>
        )}
      </td>
    </tr>
  )
}

function RegionGroup({ region, items }: { region: RegionId; items: SurfaceEligibility[] }) {
  const eligible = items.filter(i => i.eligible).length
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="font-mono text-xs font-bold text-zinc-300 uppercase tracking-wider">{region}</span>
        <span className="text-xs text-zinc-500">{eligible} eligible / {items.length} total</span>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/10">
            <th className="py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Surface ID</th>
            <th className="py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Display Name</th>
            <th className="py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Region</th>
            <th className="py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Allowed Roles</th>
            <th className="py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Eligible</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <EligibilityRow key={item.surfaceId} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SnapshotCard({ snapshot, onDelete }: { snapshot: WorkspaceSnapshot; onDelete: () => void }) {
  const totalSurfaces = snapshot.mounts.reduce((acc, r) => acc + r.surfaceIds.length, 0)
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-zinc-200">{snapshot.label}</p>
        <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
          {snapshot.scenario.role} · {snapshot.scenario.phase} · {snapshot.scenario.techLevel}
          {snapshot.scenario.specialization ? ` · ${snapshot.scenario.specialization}` : ''}
          {snapshot.scenario.hasActiveBlocker ? ' · blocker' : ''}
        </p>
        <p className="text-[10px] text-zinc-600 mt-1">
          {totalSurfaces} surfaces · {new Date(snapshot.capturedAt).toLocaleString()}
        </p>
      </div>
      <button
        onClick={onDelete}
        className="shrink-0 h-6 w-6 flex items-center justify-center rounded text-zinc-500 hover:bg-red-500/15 hover:text-red-400 transition-colors"
        title="Delete snapshot"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function DiffPanel({ diff }: { diff: SnapshotDiff }) {
  const verdict = diff.jaccardSimilarity < 0.5 ? 'Highly differentiated UI' : 'Similar UI'
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-4">
      <div className="flex items-center gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Jaccard Similarity</p>
          <p className={`text-2xl font-mono font-bold ${jaccardColor(diff.jaccardSimilarity)}`}>
            {(diff.jaccardSimilarity * 100).toFixed(0)}%
          </p>
        </div>
        <div className="flex-1">
          <p className={`text-sm font-bold ${diff.jaccardSimilarity < 0.5 ? 'text-red-300' : 'text-emerald-300'}`}>
            {verdict}
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {diff.sameSurfaces.length} shared · {diff.addedSurfaces.length} added · {diff.removedSurfaces.length} removed
          </p>
        </div>
      </div>

      {diff.addedSurfaces.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-1.5">Added in B</p>
          <div className="flex flex-wrap gap-1">
            {diff.addedSurfaces.map(id => (
              <span key={id} className="inline-block rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-400">{id}</span>
            ))}
          </div>
        </div>
      )}

      {diff.removedSurfaces.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-1.5">Removed in B</p>
          <div className="flex flex-wrap gap-1">
            {diff.removedSurfaces.map(id => (
              <span key={id} className="inline-block rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[10px] font-mono text-red-400">{id}</span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">State Deltas (B - A)</p>
        <div className="grid grid-cols-4 gap-2">
          {(Object.entries(diff.stateDeltas) as [string, number][]).map(([key, val]) => (
            <div key={key} className="rounded bg-white/5 px-2 py-1.5 text-center">
              <p className="text-[9px] uppercase tracking-wider text-zinc-500">{key}</p>
              <p className="text-sm font-mono font-bold mt-0.5"><DeltaBadge value={val} /></p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ScenariosInner() {
  const { state } = useCrewAgent()
  const [scenario, setScenario] = useState<Scenario>(DEFAULT_SCENARIO)
  const [eligibility, setEligibility] = useState<SurfaceEligibility[]>([])
  const [snapshots, setSnapshots] = useState<WorkspaceSnapshot[]>([])
  const [snapshotA, setSnapshotA] = useState<string>('')
  const [snapshotB, setSnapshotB] = useState<string>('')
  const [diff, setDiff] = useState<SnapshotDiff | null>(null)

  useEffect(() => {
    bootstrapRegistry()
  }, [])

  useEffect(() => {
    setEligibility(deriveEligibility(scenario))
  }, [scenario])

  useEffect(() => {
    setSnapshots(listSnapshots())
  }, [])

  const handleCapture = useCallback(() => {
    const layoutState = layoutEngine.getState()
    const layoutMounts = Object.entries(layoutState).map(([region, regionState]) => ({
      region,
      mounts: regionState.mounts.map(m => ({ surfaceId: m.manifestId })),
    }))
    const label = `${scenario.role}/${scenario.phase}/${scenario.techLevel} @ ${new Date().toLocaleTimeString()}`
    captureSnapshot(label, scenario, layoutMounts, {
      tasks: state.tasks,
      milestones: state.milestones,
      blockers: state.blockers,
      members: state.members,
    })
    setSnapshots(listSnapshots())
  }, [scenario, state])

  const handleDelete = useCallback((id: string) => {
    deleteSnapshot(id)
    setSnapshots(listSnapshots())
    if (snapshotA === id) setSnapshotA('')
    if (snapshotB === id) setSnapshotB('')
    setDiff(null)
  }, [snapshotA, snapshotB])

  const handleCompare = useCallback(() => {
    const a = snapshots.find(s => s.id === snapshotA)
    const b = snapshots.find(s => s.id === snapshotB)
    if (!a || !b) return
    setDiff(diffSnapshots(a, b))
  }, [snapshots, snapshotA, snapshotB])

  const grouped = REGIONS.map(region => ({
    region,
    items: eligibility.filter(e => e.targetRegion === region),
  })).filter(g => g.items.length > 0)

  const selectClass = "rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-zinc-500"

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dev" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to dev
          </Link>
          <h1 className="text-xl font-bold text-zinc-100">Adaptive UI Scenario Validator</h1>
        </div>

        {/* Section 1 — Scenario toggles */}
        <section className="mb-10">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-4">Scenario</h2>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Role</label>
              <select value={scenario.role} onChange={e => setScenario(s => ({ ...s, role: e.target.value as Role }))} className={selectClass}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Tech Level</label>
              <select value={scenario.techLevel} onChange={e => setScenario(s => ({ ...s, techLevel: e.target.value as TechnicalLevel }))} className={selectClass}>
                {TECH_LEVELS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Urgency Phase</label>
              <select value={scenario.phase} onChange={e => setScenario(s => ({ ...s, phase: e.target.value as UrgencyPhase }))} className={selectClass}>
                {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Specialization</label>
              <select
                value={scenario.specialization ?? ''}
                onChange={e => setScenario(s => ({ ...s, specialization: (e.target.value || undefined) as Specialization | undefined }))}
                className={selectClass}
              >
                {SPECIALIZATIONS.map(sp => <option key={sp} value={sp}>{sp || 'none'}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Active Blocker</label>
              <label className="flex items-center gap-2 cursor-pointer h-[34px]">
                <input
                  type="checkbox"
                  checked={scenario.hasActiveBlocker}
                  onChange={e => setScenario(s => ({ ...s, hasActiveBlocker: e.target.checked }))}
                  className="w-4 h-4 accent-zinc-400"
                />
                <span className="text-xs text-zinc-400">{scenario.hasActiveBlocker ? 'yes' : 'no'}</span>
              </label>
            </div>
          </div>
        </section>

        {/* Section 2 — Eligibility matrix */}
        <section className="mb-10">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-4">
            Eligibility Matrix — {eligibility.filter(e => e.eligible).length} eligible / {eligibility.length} total
          </h2>
          {eligibility.length === 0 ? (
            <p className="text-xs text-zinc-600">Registry not yet bootstrapped. Checking...</p>
          ) : (
            grouped.map(({ region, items }) => (
              <RegionGroup key={region} region={region} items={items} />
            ))
          )}
        </section>

        {/* Section 3 — Live snapshot */}
        <section className="mb-10">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-4">Live Snapshot</h2>
          <button
            onClick={handleCapture}
            className="mb-4 rounded-lg bg-zinc-800 border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
          >
            Capture current workspace
          </button>
          {snapshots.length === 0 ? (
            <p className="text-xs text-zinc-600">No snapshots yet.</p>
          ) : (
            <div className="space-y-2">
              {snapshots.map(s => (
                <SnapshotCard key={s.id} snapshot={s} onDelete={() => handleDelete(s.id)} />
              ))}
            </div>
          )}
        </section>

        {/* Section 4 — Compare snapshots */}
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-4">Compare Snapshots</h2>
          {snapshots.length < 2 ? (
            <p className="text-xs text-zinc-600">Capture at least 2 snapshots to compare.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-end gap-3 flex-wrap">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Snapshot A</label>
                  <select value={snapshotA} onChange={e => { setSnapshotA(e.target.value); setDiff(null) }} className={selectClass}>
                    <option value="">— pick A —</option>
                    {snapshots.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Snapshot B</label>
                  <select value={snapshotB} onChange={e => { setSnapshotB(e.target.value); setDiff(null) }} className={selectClass}>
                    <option value="">— pick B —</option>
                    {snapshots.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <button
                  onClick={handleCompare}
                  disabled={!snapshotA || !snapshotB || snapshotA === snapshotB}
                  className="rounded-lg bg-zinc-800 border border-white/10 px-4 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Compare
                </button>
              </div>
              {diff && <DiffPanel diff={diff} />}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
