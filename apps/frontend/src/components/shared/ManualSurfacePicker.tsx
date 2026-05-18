'use client'

import { useState, useMemo } from 'react'
import { X, Search, Pin } from 'lucide-react'
import { surfaceRegistry } from '@/runtime/surface-registry/registry'
import { layoutEngine } from '@/runtime/workspace/layout-engine'
import { getPinningStore } from '@/runtime/workspace/pinning'
import type { RuntimeContext, RegionId, SurfaceEnvelope } from '@/runtime/surface-registry/types'
import type { SurfaceManifest } from '@/runtime/surface-registry/types'

interface Props {
  open: boolean
  onClose: () => void
  context: RuntimeContext
  workspaceId: string
}

const REGION_TABS: Array<{ id: RegionId | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'command-surface', label: 'Command' },
  { id: 'primary-workzone', label: 'Primary' },
  { id: 'context-rail', label: 'Context Rail' },
  { id: 'activity-stream', label: 'Activity' },
  { id: 'ambient-overlay', label: 'Overlay' },
]

function buildEnvelope(manifest: SurfaceManifest, context: RuntimeContext): SurfaceEnvelope {
  return {
    envelopeId: `manual-${crypto.randomUUID()}`,
    agentId: 'user',
    emittedAt: Date.now(),
    intent: 'render_surface',
    priority: 'medium',
    surfaceId: manifest.id,
    payload: {},
    context,
    requiredCapabilities: manifest.requiredCapabilities,
    hibernatable: true,
    pinnable: manifest.canPin,
  }
}

interface SurfaceRowProps {
  manifest: SurfaceManifest
  eligible: boolean
  onMount: (manifest: SurfaceManifest, pin: boolean) => void
}

function SurfaceRow({ manifest, eligible, onMount }: SurfaceRowProps) {
  const [pinChecked, setPinChecked] = useState(false)

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-white/5 ${eligible ? 'hover:bg-white/5' : 'opacity-40'} transition-colors`}>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-zinc-200 truncate">{manifest.displayName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-mono text-zinc-500">{manifest.id}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-500 border border-white/5">{manifest.preferredZone}</span>
        </div>
      </div>

      {manifest.canPin && eligible && (
        <label className="flex items-center gap-1 cursor-pointer shrink-0" title="Pin surface">
          <input
            type="checkbox"
            checked={pinChecked}
            onChange={e => setPinChecked(e.target.checked)}
            className="w-3.5 h-3.5 accent-zinc-400"
          />
          <Pin className="w-3 h-3 text-zinc-500" />
        </label>
      )}

      <button
        disabled={!eligible}
        onClick={() => onMount(manifest, pinChecked)}
        className="shrink-0 rounded-lg bg-zinc-800 border border-white/10 px-3 py-1 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
      >
        Add
      </button>
    </div>
  )
}

export function ManualSurfacePicker({ open, onClose, context, workspaceId }: Props) {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<RegionId | 'all'>('all')
  const [mounted, setMounted] = useState<Set<string>>(new Set())

  const allManifests = useMemo(() => {
    return surfaceRegistry.listIds().map(id => surfaceRegistry.get(id)!)
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return allManifests.filter(m => {
      if (activeTab !== 'all' && m.preferredZone !== activeTab) return false
      if (q && !m.displayName.toLowerCase().includes(q) && !m.id.toLowerCase().includes(q)) return false
      return true
    })
  }, [allManifests, activeTab, search])

  const isEligible = (manifest: SurfaceManifest): boolean => {
    if (manifest.visibleToRoles.length > 0 && !manifest.visibleToRoles.includes(context.role)) return false
    if (manifest.visibleToTechLevels && manifest.visibleToTechLevels.length > 0 && !manifest.visibleToTechLevels.includes(context.techLevel)) return false
    if (
      manifest.visibleToSpecializations &&
      manifest.visibleToSpecializations.length > 0 &&
      (!context.specialization || !manifest.visibleToSpecializations.includes(context.specialization))
    ) return false
    if (manifest.forbiddenInPhases && manifest.forbiddenInPhases.includes(context.phase)) return false
    return true
  }

  const handleMount = (manifest: SurfaceManifest, pin: boolean) => {
    const envelope = buildEnvelope(manifest, context)
    const result = layoutEngine.mount(envelope, context, { region: manifest.preferredZone, pinned: pin })
    if (result.ok) {
      if (pin && manifest.canPin) {
        getPinningStore(workspaceId).add({
          manifestId: manifest.id,
          envelope,
          regionId: manifest.preferredZone,
          pinnedAt: Date.now(),
        })
      }
      setMounted(prev => new Set(prev).add(manifest.id))
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-xl border border-white/10 bg-zinc-900 shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <h2 className="text-sm font-bold text-zinc-100">Add surface manually</h2>
          <button
            onClick={onClose}
            className="h-6 w-6 flex items-center justify-center rounded text-zinc-500 hover:bg-white/10 hover:text-zinc-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-800 px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search surfaces..."
              autoFocus
              className="flex-1 bg-transparent text-xs text-zinc-300 placeholder-zinc-500 outline-none"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-white/5 overflow-x-auto shrink-0">
          {REGION_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'shrink-0 rounded px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors',
                activeTab === tab.id
                  ? 'bg-zinc-700 text-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-300',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Surface list */}
        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-zinc-600 text-center py-8">No surfaces match</p>
          ) : (
            filtered.map(manifest => (
              <div key={manifest.id} className="relative">
                <SurfaceRow
                  manifest={manifest}
                  eligible={isEligible(manifest)}
                  onMount={handleMount}
                />
                {mounted.has(manifest.id) && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <span className="text-[10px] text-emerald-400 font-semibold">mounted</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 shrink-0">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-zinc-800 border border-white/10 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
