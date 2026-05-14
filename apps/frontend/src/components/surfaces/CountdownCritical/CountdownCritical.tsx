'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useAnimate } from 'motion/react'
import { AlertCircle, AlertTriangle, ChevronDown, ChevronUp, Scissors } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { SurfaceProps } from '@/runtime/surface-registry/types'
import type { CountdownCriticalPayload } from './manifest'
import { computeCountdown } from '@/lib/crew/derive'

// ─── helpers ────────────────────────────────────────────────────────────────

function minutesRemaining(deadline: string): number {
  return (new Date(deadline).getTime() - Date.now()) / 60000
}

function viabilityColor(score: number): string {
  if (score >= 70) return '#22c55e'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

function timeSavedBadge(min: number): { label: string; className: string } {
  if (min >= 60) return { label: `ahorra ${min} min`, className: 'bg-red-500/20 text-red-400 border border-red-500/30' }
  if (min >= 30) return { label: `ahorra ${min} min`, className: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' }
  return { label: `ahorra ${min} min`, className: 'bg-green-500/20 text-green-400 border border-green-500/30' }
}

// ─── shared sub-components ───────────────────────────────────────────────────

function CircularProgress({ score, size = 120 }: { score: number; size?: number }) {
  const strokeWidth = size > 150 ? 14 : 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = viabilityColor(score)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor"
          strokeWidth={strokeWidth} fill="none" className="text-zinc-800" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={size > 150 ? { filter: `drop-shadow(0 0 8px ${color}80)` } : undefined}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span className="font-bold" style={{ color, fontSize: size > 150 ? '2.2rem' : '1.4rem' }}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: 'spring' }}>
          {score}
        </motion.span>
        <span className="text-xs text-zinc-400 mt-0.5">Viabilidad</span>
      </div>
    </div>
  )
}

// compact flip digit (rotateX 3D)
function FlipDigit({ digit, isWarning }: { digit: string; isWarning: boolean }) {
  return (
    <div className="relative w-9 h-11 overflow-hidden" style={{ perspective: '400px' }}>
      <AnimatePresence mode="popLayout">
        <motion.div key={digit}
          initial={{ rotateX: -90, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: 90, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded font-mono font-bold text-xl',
            isWarning ? 'bg-red-500/20 text-red-400 border border-red-500' : 'bg-slate-800 text-white border border-slate-600'
          )}
          style={{ transformStyle: 'preserve-3d' }}>
          {digit}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// full slide digit (y-translate)
function SlideDigit({ value }: { value: string }) {
  const [ref, animate] = useAnimate()
  const prev = useRef(value)
  useEffect(() => {
    if (value !== prev.current) {
      let cancelled = false
      const run = async () => {
        await animate(ref.current, { y: ['0%', '-50%'], opacity: [1, 0] }, { duration: 0.22 })
        if (cancelled) return
        prev.current = value
        await animate(ref.current, { y: ['50%', '0%'], opacity: [0, 1] }, { duration: 0.22 })
      }
      run()
      return () => { cancelled = true }
    }
  }, [value, animate])
  return (
    <div className="relative w-14 h-[4.5rem] overflow-hidden bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-lg shadow-xl border border-zinc-700">
      <div ref={ref} className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white font-mono">
        {value}
      </div>
    </div>
  )
}

function CollapsibleSection({ title, count, icon, badgeClass, children }: {
  title: string; count: number; icon: React.ReactNode; badgeClass: string; children: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(true)
  return (
    <div>
      <div className="flex items-center justify-between mb-2 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}>
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          {icon}
          {title}
          <span className={cn('ml-1 text-xs px-2 py-0.5 rounded-full border font-semibold', badgeClass)}>{count}</span>
        </h3>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />}
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── section renderers (shared by all variants) ──────────────────────────────

function BlockersSection({ blockers, collapsible = false }: {
  blockers: CountdownCriticalPayload['criticalBlockers']
  collapsible?: boolean
}) {
  const unresolvedCount = blockers.filter(b => !b.resolved).length
  const content = (
    <div className="flex flex-col gap-1.5 pointer-events-none">
      {blockers.map(b => (
        <div key={b.id} className={cn(
          'flex items-start gap-2 text-xs p-2 rounded border',
          b.resolved ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
        )}>
          <input type="checkbox" readOnly checked={!!b.resolved} className="mt-0.5 accent-indigo-500 shrink-0" />
          <span className={b.resolved ? 'line-through text-slate-500' : 'text-slate-200'}>{b.text}</span>
        </div>
      ))}
    </div>
  )

  if (collapsible) {
    return (
      <CollapsibleSection title="Bloqueadores críticos" count={unresolvedCount}
        icon={<AlertCircle className="w-3.5 h-3.5 text-red-400" />}
        badgeClass="bg-red-500/20 text-red-400 border-red-500/30">
        {content}
      </CollapsibleSection>
    )
  }
  return (
    <div>
      <p className="text-xs font-semibold text-slate-300 mb-2">Bloqueadores críticos</p>
      {content}
    </div>
  )
}

function FeaturesSection({ features, collapsible = false }: {
  features: NonNullable<CountdownCriticalPayload['featuresToCut']>
  collapsible?: boolean
}) {
  const content = (
    <div className="flex flex-col gap-1.5">
      {features.map(f => {
        const badge = timeSavedBadge(f.timeSavedMinutes)
        return (
          <div key={f.id} className={cn(
            'flex items-center gap-2 text-xs',
            collapsible ? 'p-2 rounded border border-zinc-700/50 bg-zinc-800/30' : ''
          )}>
            {collapsible && <Scissors className="w-3 h-3 text-zinc-500 shrink-0" />}
            <span className="flex-1 text-slate-200">{f.name}</span>
            <span className={cn('px-2 py-0.5 rounded text-[10px]', badge.className)}>{badge.label}</span>
          </div>
        )
      })}
    </div>
  )

  if (collapsible) {
    return (
      <CollapsibleSection title="Features a recortar" count={features.length}
        icon={<Scissors className="w-3.5 h-3.5 text-amber-400" />}
        badgeClass="bg-amber-500/20 text-amber-400 border-amber-500/30">
        {content}
      </CollapsibleSection>
    )
  }
  return (
    <div>
      <p className="text-xs font-semibold text-slate-300 mb-2">Features a recortar</p>
      {content}
    </div>
  )
}

// ─── COMPACT variant ─────────────────────────────────────────────────────────

function CompactLayout({ payload, countdown, isWarning, showBlockers, showFeatures }: {
  payload: CountdownCriticalPayload
  countdown: string
  isWarning: boolean
  showBlockers: boolean
  showFeatures: boolean
}) {
  const digits = countdown.replace(/:/g, '').split('')
  const [h0, h1, m0, m1, s0, s1] = digits
  const horizontal = payload.orientation === 'horizontal'

  const digitRow = (
    <div className="flex items-center gap-1">
      <FlipDigit digit={h0} isWarning={isWarning} />
      <FlipDigit digit={h1} isWarning={isWarning} />
      <span className="text-slate-400 font-bold text-lg mx-0.5">:</span>
      <FlipDigit digit={m0} isWarning={isWarning} />
      <FlipDigit digit={m1} isWarning={isWarning} />
      <span className="text-slate-400 font-bold text-lg mx-0.5">:</span>
      <FlipDigit digit={s0} isWarning={isWarning} />
      <FlipDigit digit={s1} isWarning={isWarning} />
    </div>
  )

  const ring = <CircularProgress score={payload.viabilityScore} size={96} />

  return (
    <Card className={cn(
      'bg-slate-900 text-white border-slate-700 relative overflow-hidden',
      horizontal ? 'w-full max-w-lg' : 'w-full max-w-sm'
    )}>
      {isWarning && (
        <motion.div className="absolute inset-0 pointer-events-none rounded-lg"
          animate={{ boxShadow: ['inset 0 0 0px #ef444400', 'inset 0 0 24px #ef444455', 'inset 0 0 0px #ef444400'] }}
          transition={{ duration: 2, repeat: Infinity }} />
      )}
      <CardHeader className="py-3 px-4 border-b border-slate-700 flex flex-row items-center gap-2">
        {isWarning && (
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          </motion.div>
        )}
        <CardTitle className="text-sm font-bold text-white">{payload.title}</CardTitle>
      </CardHeader>

      <CardContent className="p-4 flex flex-col gap-4">
        {horizontal ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col items-start gap-1">
              {digitRow}
            </div>
            {ring}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {digitRow}
            {ring}
          </div>
        )}

        {horizontal && (showBlockers || showFeatures) && (
          <div className="grid grid-cols-2 gap-3 border-t border-slate-700 pt-3">
            {showBlockers && <BlockersSection blockers={payload.criticalBlockers} />}
            {showFeatures && payload.featuresToCut && <FeaturesSection features={payload.featuresToCut} />}
          </div>
        )}

        {!horizontal && showBlockers && <BlockersSection blockers={payload.criticalBlockers} />}
        {!horizontal && showFeatures && payload.featuresToCut && <FeaturesSection features={payload.featuresToCut} />}
      </CardContent>
    </Card>
  )
}

// ─── FULL variant ─────────────────────────────────────────────────────────────

function FullLayout({ payload, countdown, isWarning, showBlockers, showFeatures }: {
  payload: CountdownCriticalPayload
  countdown: string
  isWarning: boolean
  showBlockers: boolean
  showFeatures: boolean
}) {
  const digits = countdown.replace(/:/g, '').split('')
  const [h0, h1, m0, m1, s0, s1] = digits
  const horizontal = payload.orientation === 'horizontal'
  const unresolvedCount = payload.criticalBlockers.filter(b => !b.resolved).length

  const countdownCard = (
    <Card className={cn(
      'bg-zinc-900/50 border-2 backdrop-blur-sm p-5 relative overflow-hidden',
      isWarning ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'border-zinc-800'
    )}>
      {isWarning && (
        <motion.div className="absolute inset-0 bg-red-500/10 rounded-lg pointer-events-none"
          animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 2, repeat: Infinity }} />
      )}
      <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
        {payload.title}
        {isWarning && (
          <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }} className="text-red-400">
            ⚠️
          </motion.span>
        )}
      </h2>
      <div className="flex items-center gap-1 justify-center">
        <SlideDigit value={h0} /><SlideDigit value={h1} />
        <span className="text-white font-bold text-2xl mx-0.5">:</span>
        <SlideDigit value={m0} /><SlideDigit value={m1} />
        <span className="text-white font-bold text-2xl mx-0.5">:</span>
        <SlideDigit value={s0} /><SlideDigit value={s1} />
      </div>
      {isWarning && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="mt-3 bg-red-500/20 border border-red-500/50 rounded p-2 text-center">
          <p className="text-red-400 text-xs font-semibold">CRÍTICO: menos de 10 minutos</p>
        </motion.div>
      )}
    </Card>
  )

  const viabilityCard = (
    <Card className="bg-zinc-900/50 border-2 border-zinc-800 backdrop-blur-sm p-5 flex items-center justify-center">
      <CircularProgress score={payload.viabilityScore} size={180} />
    </Card>
  )

  const blockersCard = showBlockers ? (
    <Card className="bg-zinc-900/50 border-2 border-zinc-800 backdrop-blur-sm p-5">
      <BlockersSection blockers={payload.criticalBlockers} collapsible />
    </Card>
  ) : null

  const featuresCard = showFeatures && payload.featuresToCut ? (
    <Card className="bg-zinc-900/50 border-2 border-zinc-800 backdrop-blur-sm p-5">
      <FeaturesSection features={payload.featuresToCut} collapsible />
    </Card>
  ) : null

  if (horizontal) {
    // Left: countdown (tall). Right: viability + sections stacked.
    return (
      <div className="w-full grid grid-cols-[auto_1fr] gap-4 items-start">
        <div className="min-w-[300px]">{countdownCard}</div>
        <div className="flex flex-col gap-4">
          {viabilityCard}
          {blockersCard}
          {featuresCard}
        </div>
      </div>
    )
  }

  // vertical: 2-row grid
  const hasSections = showBlockers || showFeatures
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        {countdownCard}
        {viabilityCard}
      </div>
      {hasSections && (
        <div className={cn('gap-4', showBlockers && showFeatures ? 'grid grid-cols-2' : 'flex flex-col')}>
          {blockersCard}
          {featuresCard}
        </div>
      )}
    </div>
  )
}

// ─── main export ─────────────────────────────────────────────────────────────

export default function CountdownCritical({ payload }: SurfaceProps<CountdownCriticalPayload>) {
  const [countdown, setCountdown] = useState(() => computeCountdown(payload.deadline))

  useEffect(() => {
    const id = setInterval(() => setCountdown(computeCountdown(payload.deadline)), 1000)
    return () => clearInterval(id)
  }, [payload.deadline])

  const minsLeft = minutesRemaining(payload.deadline)
  const isWarning = minsLeft < 10

  const showBlockers = payload.showBlockers !== false && payload.criticalBlockers.length > 0
  const showFeatures = payload.showFeatures !== false && (payload.featuresToCut?.length ?? 0) > 0

  const props = { payload, countdown, isWarning, showBlockers, showFeatures }

  return payload.variant === 'full'
    ? <FullLayout {...props} />
    : <CompactLayout {...props} />
}
