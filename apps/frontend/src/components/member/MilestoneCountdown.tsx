'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

type UrgencyPhase = 'normal' | 'focus' | 'urgent' | 'panic' | 'expired'

interface MilestoneCountdownProps {
  deadline: string
  milestoneTitle?: string
  compact?: boolean
}

export function MilestoneCountdown({ deadline, milestoneTitle, compact = false }: MilestoneCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(deadline).getTime() - Date.now()
      setTimeLeft(Math.max(0, difference))
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [deadline])

  const minutesLeft = timeLeft / 60000
  
  const getPhase = (minutes: number): UrgencyPhase => {
    if (minutes > 30) return 'normal'
    if (minutes > 15) return 'focus'
    if (minutes > 5) return 'urgent'
    if (minutes > 0) return 'panic'
    return 'expired'
  }

  const phase = getPhase(minutesLeft)

  const formatTime = (ms: number) => {
    if (ms <= 0) return '¡Tiempo agotado!'
    
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    }
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const phaseStyles = {
    normal: 'text-green-600',
    focus: 'text-yellow-600',
    urgent: 'text-orange-600',
    panic: 'text-red-600 animate-pulse',
    expired: 'text-red-800',
  }

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1 font-mono text-sm', phaseStyles[phase])}>
        <span>⏱</span>
        <span>{formatTime(timeLeft)}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 text-center">
      {milestoneTitle && (
        <span className="text-xs text-slate-500 uppercase tracking-wide mb-1">
          {milestoneTitle}
        </span>
      )}
      <div className={cn(
        'font-bold leading-none',
        phase === 'expired' ? 'text-lg' : 'text-3xl',
        phaseStyles[phase]
      )}>
        {formatTime(timeLeft)}
      </div>
      {phase !== 'expired' && (
        <span className="text-[10px] text-slate-400 mt-1 uppercase">
          minutos restantes
        </span>
      )}
    </div>
  )
}
