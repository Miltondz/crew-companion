'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useAnimate } from 'motion/react'
import { cn } from '@/lib/utils'
import { computeCountdown, getUrgencyPhase } from '@/lib/crew/derive'

type UrgencyPhase = 'normal' | 'focus' | 'urgent' | 'panic' | 'expired'

interface MilestoneCountdownProps {
  deadline: string
  milestoneTitle?: string
  compact?: boolean
}

const phaseGlow: Record<UrgencyPhase, string> = {
  normal:  'border-zinc-700',
  focus:   'border-yellow-500/60 shadow-[0_0_16px_rgba(234,179,8,0.2)]',
  urgent:  'border-orange-500/60 shadow-[0_0_20px_rgba(249,115,22,0.25)]',
  panic:   'border-red-500    shadow-[0_0_30px_rgba(239,68,68,0.35)]',
  expired: 'border-zinc-600',
}

const phaseDigitColor: Record<UrgencyPhase, string> = {
  normal:  'bg-zinc-800 text-white  border-zinc-600',
  focus:   'bg-yellow-500/10 text-yellow-300 border-yellow-500/60',
  urgent:  'bg-orange-500/10 text-orange-300 border-orange-500/60',
  panic:   'bg-red-500/20    text-red-300    border-red-500',
  expired: 'bg-zinc-900      text-zinc-500   border-zinc-700',
}

// ─── FlipDigit (compact) ──────────────────────────────────────────────────────

function FlipDigit({ digit, phase }: { digit: string; phase: UrgencyPhase }) {
  return (
    <div className="relative w-9 h-11 overflow-hidden" style={{ perspective: '400px' }}>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={digit}
          initial={{ rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: 90, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded font-mono font-bold text-xl border',
            phaseDigitColor[phase]
          )}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {digit}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── SlideDigit (full) ────────────────────────────────────────────────────────

function SlideDigit({ value, phase }: { value: string; phase: UrgencyPhase }) {
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

  const textColor = phase === 'expired' ? 'text-zinc-500' : phase === 'panic' ? 'text-red-300' : phase === 'urgent' ? 'text-orange-300' : phase === 'focus' ? 'text-yellow-300' : 'text-white'
  const borderClass = phaseDigitColor[phase].split(' ').filter(c => c.startsWith('border')).join(' ')

  return (
    <div
      className={cn(
        'relative flex-1 min-w-[2rem] max-w-[5rem] overflow-hidden rounded-lg shadow-xl border',
        'bg-gradient-to-b from-zinc-800 to-zinc-900',
        borderClass
      )}
      style={{ aspectRatio: '0.65', containerType: 'inline-size' }}
    >
      <div
        ref={ref}
        className={cn('absolute inset-0 flex items-center justify-center font-bold font-mono', textColor)}
        style={{ fontSize: 'clamp(1rem, 55cqi, 2.5rem)' }}
      >
        {value}
      </div>
    </div>
  )
}

// ─── main export ──────────────────────────────────────────────────────────────

export function MilestoneCountdown({ deadline, milestoneTitle, compact = false }: MilestoneCountdownProps) {
  const [countdown, setCountdown] = useState(() => computeCountdown(deadline))
  const [phase, setPhase] = useState<UrgencyPhase>(() => getUrgencyPhase(deadline))

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(computeCountdown(deadline))
      setPhase(getUrgencyPhase(deadline))
    }, 1000)
    return () => clearInterval(id)
  }, [deadline])

  const digits = countdown.replace(/:/g, '').split('')
  const [h0, h1, m0, m1, s0, s1] = digits
  const isPanic = phase === 'panic'
  const isExpired = phase === 'expired'

  if (compact) {
    return (
      <div className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-zinc-900',
        phaseGlow[phase],
        isPanic && 'animate-pulse'
      )}>
        {milestoneTitle && (
          <span className="text-[10px] text-zinc-500 uppercase tracking-wide shrink-0">{milestoneTitle}</span>
        )}
        {isExpired ? (
          <span className="text-xs font-mono text-zinc-500">¡Tiempo agotado!</span>
        ) : (
          <div className="flex items-center gap-1">
            <FlipDigit digit={h0} phase={phase} />
            <FlipDigit digit={h1} phase={phase} />
            <span className="text-zinc-400 font-bold text-lg mx-0.5">:</span>
            <FlipDigit digit={m0} phase={phase} />
            <FlipDigit digit={m1} phase={phase} />
            <span className="text-zinc-400 font-bold text-lg mx-0.5">:</span>
            <FlipDigit digit={s0} phase={phase} />
            <FlipDigit digit={s1} phase={phase} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      'relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 bg-zinc-900 overflow-hidden w-full',
      phaseGlow[phase]
    )}>
      {isPanic && (
        <motion.div
          className="absolute inset-0 bg-red-500/10 rounded-2xl pointer-events-none"
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {milestoneTitle && (
        <p className="text-xs text-zinc-400 uppercase tracking-wide z-10">{milestoneTitle}</p>
      )}

      {isExpired ? (
        <p className="text-lg font-bold text-zinc-500 z-10">¡Tiempo agotado!</p>
      ) : (
        <div className="flex items-center gap-1 w-full justify-center z-10">
          <SlideDigit value={h0} phase={phase} />
          <SlideDigit value={h1} phase={phase} />
          <span className="text-white font-bold text-xl mx-1 shrink-0">:</span>
          <SlideDigit value={m0} phase={phase} />
          <SlideDigit value={m1} phase={phase} />
          <span className="text-white font-bold text-xl mx-1 shrink-0">:</span>
          <SlideDigit value={s0} phase={phase} />
          <SlideDigit value={s1} phase={phase} />
        </div>
      )}

      {isPanic && !isExpired && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-xs font-semibold z-10"
        >
          CRÍTICO — menos de 5 minutos
        </motion.p>
      )}
    </div>
  )
}
