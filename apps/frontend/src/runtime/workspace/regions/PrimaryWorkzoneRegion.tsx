'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Maximize2, Minimize2, Minus, ChevronDown, Pin, X,
  Siren, TrendingUp, Flag, Zap, CheckSquare, Terminal,
  Palette, PenLine, FlaskConical, Bug, BookOpen, Wrench,
  AlertTriangle, Lightbulb, Users, FileText, Network,
  Timer, Brain, Activity, Code2, LayoutGrid, MessageSquare,
  AlignLeft, type LucideIcon,
} from 'lucide-react'
import { SurfaceHost } from '@/runtime/surface-registry/SurfaceHost'
import { surfaceRegistry } from '@/runtime/surface-registry/registry'
import { layoutEngine } from '../layout-engine'
import { usePinning } from '../usePinning'
import type { SurfaceMount } from '../types'
import type { UrgencyPhase } from '@/lib/crew/types'

type ColorToken = 'red' | 'orange' | 'amber' | 'emerald' | 'indigo' | 'violet' | 'cyan' | 'slate' | 'blue'

const COLOR_STYLES: Record<ColorToken, {
  header: string
  borderLeft: string
  icon: string
  ring: string
}> = {
  red:     { header: 'bg-red-50 border-b border-red-100',       borderLeft: 'border-l-4 border-l-red-400',     icon: 'text-red-500',     ring: 'ring-red-200' },
  orange:  { header: 'bg-orange-50 border-b border-orange-100', borderLeft: 'border-l-4 border-l-orange-400', icon: 'text-orange-500',   ring: 'ring-orange-200' },
  amber:   { header: 'bg-amber-50 border-b border-amber-100',   borderLeft: 'border-l-4 border-l-amber-400',   icon: 'text-amber-500',   ring: 'ring-amber-200' },
  emerald: { header: 'bg-emerald-50 border-b border-emerald-100', borderLeft: 'border-l-4 border-l-emerald-500', icon: 'text-emerald-600', ring: 'ring-emerald-200' },
  indigo:  { header: 'bg-indigo-50 border-b border-indigo-100', borderLeft: 'border-l-4 border-l-indigo-400',   icon: 'text-indigo-500',  ring: 'ring-indigo-200' },
  violet:  { header: 'bg-violet-50 border-b border-violet-100', borderLeft: 'border-l-4 border-l-violet-400',   icon: 'text-violet-500',  ring: 'ring-violet-200' },
  cyan:    { header: 'bg-cyan-50 border-b border-cyan-100',     borderLeft: 'border-l-4 border-l-cyan-500',     icon: 'text-cyan-600',    ring: 'ring-cyan-200' },
  slate:   { header: 'bg-slate-50 border-b border-slate-200',   borderLeft: 'border-l-4 border-l-slate-300',   icon: 'text-slate-500',   ring: 'ring-slate-200' },
  blue:    { header: 'bg-blue-50 border-b border-blue-100',     borderLeft: 'border-l-4 border-l-blue-400',     icon: 'text-blue-500',    ring: 'ring-blue-200' },
}

const SURFACE_ICONS: Record<string, LucideIcon> = {
  triage_war_room: Siren,
  team_velocity_panel: TrendingUp,
  milestone_summary: Flag,
  focused_task_panel: Zap,
  checklist: CheckSquare,
  debug_session: Terminal,
  design_brief_panel: Palette,
  writing_checklist: PenLine,
  test_case_board: FlaskConical,
  bug_report_form: Bug,
  beginner_guide: BookOpen,
  troubleshooting_wizard: Wrench,
  blocker_insight: AlertTriangle,
  task_suggestion: Lightbulb,
  member_action: Users,
  document_summary: FileText,
  force_graph: Network,
  countdown_critical: Timer,
  idea_matrix: Brain,
  ambient_overlay_widget: Activity,
  tech_stack_panel: Code2,
  component_checklist: LayoutGrid,
  stakeholder_update: MessageSquare,
  content_outline_panel: AlignLeft,
}

const PRIORITY_RANK: Record<string, number> = {
  critical: 4, high: 3, medium: 2, low: 1,
}

interface Props {
  mounts: SurfaceMount[]
  phase?: UrgencyPhase
}

export function PrimaryWorkzoneRegion({ mounts, phase }: Props) {
  const { pin, unpin } = usePinning()

  const sorted = useMemo(() => {
    if (mounts.length === 0) return []
    return [...mounts].sort((a, b) => {
      const pa = PRIORITY_RANK[a.envelope.priority] ?? 2
      const pb = PRIORITY_RANK[b.envelope.priority] ?? 2
      if (pb !== pa) return pb - pa
      const ma = surfaceRegistry.get(a.manifestId)
      const mb = surfaceRegistry.get(b.manifestId)
      const da = ma?.density === 'hero' ? 1 : 0
      const db = mb?.density === 'hero' ? 1 : 0
      return db - da
    })
  }, [mounts])

  if (sorted.length === 0) return null

  return (
    <div className="workspace-region workspace-region--primary grid grid-cols-6 gap-3 content-start">
      {sorted.map(m => (
        <MountFrame
          key={m.mountId}
          mount={m}
          phase={phase}
          onPin={() => pin(m)}
          onUnpin={() => unpin(m)}
          onClose={() => layoutEngine.unmount(m.mountId)}
        />
      ))}
    </div>
  )
}

function MountFrame({
  mount,
  phase,
  onPin,
  onUnpin,
  onClose,
}: {
  mount: SurfaceMount
  phase?: UrgencyPhase
  onPin: () => void
  onUnpin: () => void
  onClose: () => void
}) {
  const manifest = surfaceRegistry.get(mount.manifestId)
  const isHero = manifest?.density === 'hero'
  const color: ColorToken = (manifest?.color as ColorToken | undefined) ?? 'slate'
  const cs = COLOR_STYLES[color]
  const Icon = SURFACE_ICONS[mount.envelope.surfaceId] ?? LayoutGrid
  const isCritical = mount.envelope.priority === 'critical'

  const [minimized, setMinimized] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const prevPhase = useRef(phase)
  const restoredMinimized = useRef(false)

  // Phase-based auto-minimize: collapse non-critical surfaces during panic
  useEffect(() => {
    if (phase === 'panic' && prevPhase.current !== 'panic') {
      if (!isCritical && !mount.pinned && !minimized) {
        restoredMinimized.current = minimized
        setMinimized(true)
      }
    } else if (prevPhase.current === 'panic' && phase !== 'panic') {
      setMinimized(restoredMinimized.current)
    }
    prevPhase.current = phase
  }, [phase])

  const ctrlBtn = 'rounded p-1 text-slate-400 hover:bg-white/60 hover:text-slate-600 transition-colors'

  return (
    <div
      className={[
        'rounded-xl bg-white shadow-sm overflow-hidden transition-all ring-1',
        cs.borderLeft,
        cs.ring,
        expanded ? 'col-span-6' : 'col-span-6 md:col-span-3',
        mount.hibernated ? 'opacity-40' : '',
        isCritical ? 'shadow-red-100 shadow-md' : '',
      ].filter(Boolean).join(' ')}
    >
      {/* Colored identity header */}
      <div className={`flex items-center gap-2 px-3 py-1.5 ${cs.header}`}>
        {isCritical && (
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
        )}
        <Icon size={12} className={`flex-shrink-0 ${cs.icon}`} />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 truncate flex-1">
          {manifest?.displayName ?? mount.envelope.surfaceId.replace(/_/g, ' ')}
        </span>

        {/* Controls */}
        <div className="flex items-center gap-0.5 flex-shrink-0 ml-1">
          <button
            onClick={() => setMinimized(m => !m)}
            className={ctrlBtn}
            title={minimized ? 'Mostrar' : 'Minimizar'}
          >
            {minimized ? <ChevronDown size={11} /> : <Minus size={11} />}
          </button>
          {!minimized && (
            <button
              onClick={() => setExpanded(e => !e)}
              className={ctrlBtn}
              title={expanded ? 'Compacto' : 'Ancho completo'}
            >
              {expanded ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
            </button>
          )}
          <button
            onClick={mount.pinned ? onUnpin : onPin}
            className={ctrlBtn}
            title={mount.pinned ? 'Desfijar' : 'Fijar'}
          >
            <Pin size={11} className={mount.pinned ? 'fill-current text-indigo-500' : ''} />
          </button>
          {!mount.pinned && (
            <button
              onClick={onClose}
              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Cerrar"
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {!minimized && (
        <SurfaceHost envelope={mount.envelope} context={mount.envelope.context} />
      )}
    </div>
  )
}
