'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { GripVertical, type LucideIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { UrgencyPhase } from '@/lib/crew/types'

export type GridShape = 'compact' | 'normal' | 'wide' | 'hero'

interface ShapeConfig {
  label: string
  cols: string
  icon: string
}

export const SHAPE_CONFIGS: Record<GridShape, ShapeConfig> = {
  compact: { label: 'Compacto',   cols: 'col-span-6 md:col-span-2', icon: '▪' },
  normal:  { label: 'Normal',     cols: 'col-span-6 md:col-span-3', icon: '▬' },
  wide:    { label: 'Horizontal', cols: 'col-span-6 md:col-span-4', icon: '▬▬' },
  hero:    { label: 'Full',       cols: 'col-span-6',               icon: '■' },
}

export type SpineColor = 'cyan' | 'ember' | 'red' | 'violet' | 'teal' | 'green' | 'slate'

const SPINE_ID_MAP: Record<string, SpineColor> = {
  'task-board': 'cyan',
  'milestone':  'ember',
  'blockers':   'red',
  'activity':   'violet',
  'team':       'teal',
  'docs':       'green',
}

const PHASE_SHAPES: Record<string, Record<UrgencyPhase, GridShape>> = {
  milestone:    { normal: 'normal', focus: 'wide',    urgent: 'wide',    panic: 'compact', expired: 'compact' },
  'task-board': { normal: 'compact', focus: 'normal',  urgent: 'wide',    panic: 'hero',    expired: 'wide' },
  activity:     { normal: 'normal', focus: 'compact', urgent: 'compact', panic: 'compact', expired: 'normal' },
}

const LS_KEY = (id: string) => `section-shape:${id}`

interface SectionFrameProps {
  id: string
  title: string
  color?: SpineColor
  Icon?: LucideIcon
  phase?: UrgencyPhase
  supportedShapes?: GridShape[]
  actions?: React.ReactNode
  children: React.ReactNode
  agentShape?: GridShape
  isMinimized?: boolean
  onMinimize?: (id: string, minimized: boolean) => void
}

function ActivityGlyph() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
      <polyline
        points="0,8 3,5 6,7 9,2 12,4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 30,
          strokeDashoffset: 30,
          animation: 'sparkline-draw 2s ease-in-out infinite alternate',
        }}
      />
    </svg>
  )
}

function MilestoneGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
      <line x1="7" y1="7" x2="7" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        style={{ transformOrigin: '7px 7px', animation: 'clock-tick 4s steps(12) infinite' }}
      />
      <line x1="7" y1="7" x2="10" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        style={{ transformOrigin: '7px 7px', animation: 'clock-tick 48s steps(60) infinite' }}
      />
    </svg>
  )
}

function BlockersGlyph() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none"
      style={{ animation: 'chevron-pulse 1.4s ease-in-out infinite' }}
    >
      <polyline points="0,5 5,0 5,10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <polyline points="6,5 11,0 11,10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function DefaultGlyph({ Icon }: { Icon?: LucideIcon }) {
  if (!Icon) return null
  return <Icon size={12} />
}

function getGlyph(id: string, Icon?: LucideIcon) {
  if (id === 'activity') return <ActivityGlyph />
  if (id === 'milestone') return <MilestoneGlyph />
  if (id === 'blockers') return <BlockersGlyph />
  return <DefaultGlyph Icon={Icon} />
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
  isMinimized,
  onMinimize,
}: SectionFrameProps) {
  const spineColor: SpineColor = color ?? SPINE_ID_MAP[id] ?? 'slate'
  const spineClass = `spine-${spineColor}`
  const controlled = isMinimized !== undefined && onMinimize !== undefined

  const getInitialShape = (): GridShape => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY(id)) : null
    if (stored && supportedShapes.includes(stored as GridShape)) return stored as GridShape
    return PHASE_SHAPES[id]?.[phase] ?? 'normal'
  }

  const [shape, setShape] = useState<GridShape>(getInitialShape)
  const [internalMinimized, setInternalMinimized] = useState(false)
  const minimized = controlled ? isMinimized : internalMinimized
  const prevPhase = useRef(phase)
  const userOverride = useRef(false)

  const setMinimized = useCallback((val: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof val === 'function' ? val(minimized) : val
    if (controlled) {
      onMinimize!(id, next)
    } else {
      setInternalMinimized(next)
    }
  }, [controlled, onMinimize, id, minimized])

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
  }, [phase, id, supportedShapes, setMinimized])

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

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const shapeConf = SHAPE_CONFIGS[shape]
  const glyph = getGlyph(id, Icon)

  return (
    <motion.div
      ref={setNodeRef}
      animate={isDragging ? false : { opacity: 1, scale: 1 }}
      initial={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? undefined,
        zIndex: isDragging ? 50 : 'auto',
      }}
      className={[
        'rounded-xl overflow-hidden bg-[var(--bg-surface)] border border-white/10 shadow-sm',
        'flex h-full min-h-0',
        isDragging ? 'opacity-40' : '',
        shapeConf.cols,
      ].join(' ')}
    >
      <div
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        className={[
          'w-[30px] flex-shrink-0 flex flex-col items-center justify-between py-2',
          'cursor-grab active:cursor-grabbing rounded-l-xl border-r border-white/10 touch-none',
          spineClass,
        ].join(' ')}
        style={{ background: `color-mix(in srgb, var(--spine-color, #94a3b8) 12%, transparent)` }}
      >
        <div className="text-[var(--spine-color,#94a3b8)]">{glyph}</div>
        <span
          className="font-mono text-[8px] font-bold tracking-widest uppercase text-[var(--spine-color,#94a3b8)]/70"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
        >
          {title}
        </span>
        <GripVertical className="w-3 h-3 text-[var(--spine-color,#94a3b8)]/40" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-[var(--bg-surface)] text-[var(--text-primary)]">
        <div className="flex items-center gap-1 px-2 py-1 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-0.5 flex-1">
            {supportedShapes.map(s => (
              <button
                key={s}
                onClick={() => setUserShape(s)}
                className={[
                  'rounded px-1 py-0.5 text-[9px] font-bold transition-colors',
                  shape === s
                    ? 'text-[var(--spine-color,#94a3b8)] bg-[var(--spine-color,#94a3b8)]/10'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                ].join(' ')}
                title={SHAPE_CONFIGS[s].label}
              >
                {SHAPE_CONFIGS[s].icon}
              </button>
            ))}
            {actions && <div className="flex items-center ml-1">{actions}</div>}
          </div>
          <button
            onClick={() => setMinimized(m => !m)}
            className="rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-colors"
            title={minimized ? 'Mostrar' : 'Minimizar'}
          >
            <motion.span
              animate={{ rotate: minimized ? 0 : 180 }}
              transition={{ duration: 0.2 }}
              className="block text-[10px] leading-none"
            >
              ▾
            </motion.span>
          </button>
        </div>

        <AnimatePresence initial={false}>
          {!minimized && (
            <motion.div
              key="content"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: 'hidden' }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
