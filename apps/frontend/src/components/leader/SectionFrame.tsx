'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Minus, type LucideIcon } from 'lucide-react'
import type { UrgencyPhase } from '@/lib/crew/types'

export type GridShape = 'compact' | 'normal' | 'wide' | 'hero'

interface ShapeConfig {
  label: string
  cols: string
  rows: string
  icon: string
}

// Grid is 6 columns: compact=2, normal=3, wide=4, hero=6
export const SHAPE_CONFIGS: Record<GridShape, ShapeConfig> = {
  compact: { label: 'Compacto',   cols: 'col-span-6 md:col-span-2', rows: 'row-span-1', icon: '▪' },
  normal:  { label: 'Normal',     cols: 'col-span-6 md:col-span-3', rows: 'row-span-1', icon: '▬' },
  wide:    { label: 'Horizontal', cols: 'col-span-6 md:col-span-4', rows: 'row-span-1', icon: '▬▬' },
  hero:    { label: 'Full',       cols: 'col-span-6',               rows: 'row-span-1', icon: '■' },
}

type ColorToken = 'indigo' | 'blue' | 'emerald' | 'violet' | 'amber' | 'slate'

const COLOR_STYLES: Record<ColorToken, { header: string; borderTop: string; icon: string; ring: string; shapePicker: string; bg: string }> = {
  indigo:  { header: 'bg-indigo-50 border-b border-indigo-100',   borderTop: 'border-t-4 border-t-indigo-400',   icon: 'text-indigo-500',  ring: 'ring-indigo-200',  shapePicker: 'hover:bg-indigo-100 text-indigo-500',  bg: 'bg-indigo-50/40'  },
  blue:    { header: 'bg-blue-50 border-b border-blue-100',       borderTop: 'border-t-4 border-t-blue-400',     icon: 'text-blue-500',    ring: 'ring-blue-200',    shapePicker: 'hover:bg-blue-100 text-blue-500',      bg: 'bg-blue-50/40'    },
  emerald: { header: 'bg-emerald-50 border-b border-emerald-100', borderTop: 'border-t-4 border-t-emerald-500',  icon: 'text-emerald-600', ring: 'ring-emerald-200', shapePicker: 'hover:bg-emerald-100 text-emerald-600', bg: 'bg-emerald-50/40' },
  violet:  { header: 'bg-violet-50 border-b border-violet-100',   borderTop: 'border-t-4 border-t-violet-400',   icon: 'text-violet-500',  ring: 'ring-violet-200',  shapePicker: 'hover:bg-violet-100 text-violet-500',  bg: 'bg-violet-50/40'  },
  amber:   { header: 'bg-amber-50 border-b border-amber-100',     borderTop: 'border-t-4 border-t-amber-400',    icon: 'text-amber-500',   ring: 'ring-amber-200',   shapePicker: 'hover:bg-amber-100 text-amber-500',    bg: 'bg-amber-50/40'   },
  slate:   { header: 'bg-slate-50 border-b border-slate-200',     borderTop: 'border-t-4 border-t-slate-400',    icon: 'text-slate-500',   ring: 'ring-slate-200',   shapePicker: 'hover:bg-slate-100 text-slate-500',    bg: 'bg-slate-50/60'   },
}

const PHASE_SHAPES: Record<string, Record<UrgencyPhase, GridShape>> = {
  milestone:    { normal: 'normal', focus: 'wide',    urgent: 'wide',    panic: 'compact', expired: 'compact' },
  'task-board': { normal: 'normal', focus: 'wide',    urgent: 'wide',    panic: 'hero',    expired: 'wide' },
  activity:     { normal: 'normal', focus: 'compact', urgent: 'compact', panic: 'compact', expired: 'normal' },
}

const LS_KEY = (id: string) => `section-shape:${id}`

interface SectionFrameProps {
  id: 'milestone' | 'task-board' | 'activity'
  title: string
  color: ColorToken
  Icon: LucideIcon
  phase?: UrgencyPhase
  supportedShapes?: GridShape[]
  actions?: React.ReactNode
  children: React.ReactNode
  agentShape?: GridShape
}

export function SectionFrame({
  id,
  title,
  color,
  Icon,
  phase = 'normal',
  supportedShapes = ['compact', 'normal', 'wide'],
  actions,
  children,
  agentShape,
}: SectionFrameProps) {
  const cs = COLOR_STYLES[color]

  const getInitialShape = (): GridShape => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY(id)) : null
    if (stored && supportedShapes.includes(stored as GridShape)) return stored as GridShape
    return PHASE_SHAPES[id]?.[phase] ?? 'normal'
  }

  const [shape, setShape] = useState<GridShape>(getInitialShape)
  const [minimized, setMinimized] = useState(false)
  const prevPhase = useRef(phase)
  const userOverride = useRef(false)

  useEffect(() => {
    if (prevPhase.current === phase) return
    const oldPhase = prevPhase.current
    prevPhase.current = phase
    if (userOverride.current) return
    const suggested = PHASE_SHAPES[id]?.[phase]
    if (suggested && supportedShapes.includes(suggested)) {
      setShape(suggested)
    }
    if (phase === 'panic' && id === 'activity') setMinimized(true)
    else if (oldPhase === 'panic' && id === 'activity') setMinimized(false)
  }, [phase, id, supportedShapes])

  useEffect(() => {
    if (!agentShape || !supportedShapes.includes(agentShape)) return
    setShape(agentShape)
    userOverride.current = false
  }, [agentShape, supportedShapes])

  const setUserShape = (s: GridShape) => {
    setShape(s)
    userOverride.current = true
    localStorage.setItem(LS_KEY(id), s)
  }

  const shapeConf = SHAPE_CONFIGS[shape]
  const ctrlBtn = 'rounded p-1 text-slate-400 hover:bg-white/70 hover:text-slate-600 transition-colors'

  return (
    <div className={[
      'rounded-xl shadow-sm overflow-hidden ring-1 transition-all',
      cs.bg,
      cs.borderTop,
      cs.ring,
      shapeConf.cols,
    ].join(' ')}>
      <div className={`flex items-center gap-2 px-3 py-1.5 ${cs.header}`}>
        <Icon size={12} className={`flex-shrink-0 ${cs.icon}`} />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 truncate flex-1">
          {title}
        </span>

        {!minimized && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {supportedShapes.map(s => (
              <button
                key={s}
                onClick={() => setUserShape(s)}
                className={[
                  'rounded px-1 py-0.5 text-[9px] font-bold transition-colors',
                  shape === s
                    ? `${cs.shapePicker} bg-white/80`
                    : 'text-slate-300 hover:text-slate-500',
                ].join(' ')}
                title={SHAPE_CONFIGS[s].label}
              >
                {SHAPE_CONFIGS[s].icon}
              </button>
            ))}
          </div>
        )}

        {!minimized && actions && (
          <div className="flex items-center ml-1 flex-shrink-0">{actions}</div>
        )}

        <button onClick={() => setMinimized(m => !m)} className={ctrlBtn} title={minimized ? 'Mostrar' : 'Minimizar'}>
          {minimized ? <ChevronDown size={11} /> : <Minus size={11} />}
        </button>
      </div>

      {!minimized && (
        <div className="overflow-hidden">
          {children}
        </div>
      )}
    </div>
  )
}
