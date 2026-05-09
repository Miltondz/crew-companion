'use client'

import { cn } from '@/lib/utils'

type UrgencyPhase = 'normal' | 'focus' | 'urgent' | 'panic' | 'expired'

interface UrgencyBannerProps {
  phase: UrgencyPhase
  milestoneTitle?: string
}

export function UrgencyBanner({ phase, milestoneTitle }: UrgencyBannerProps) {
  if (phase === 'normal') return null

  const config = {
    focus: {
      icon: '⚡',
      label: 'Modo Focus',
      description: '15-30 min',
      classes: 'bg-yellow-50 text-yellow-800 border-yellow-200'
    },
    urgent: {
      icon: '⚠️',
      label: 'Urgente',
      description: 'menos de 15 min',
      classes: 'bg-orange-100 text-orange-900 border-orange-300'
    },
    panic: {
      icon: '🚨',
      label: 'PÁNICO',
      description: 'menos de 5 min',
      classes: 'bg-red-100 text-red-900 border-red-400 animate-pulse'
    },
    expired: {
      icon: '💀',
      label: 'Tiempo expirado',
      description: '',
      classes: 'bg-red-200 text-red-950 border-red-600'
    }
  }

  const current = config[phase]

  return (
    <div 
      className={cn(
        'w-full px-4 py-2 border-b text-sm font-semibold text-center transition-colors duration-500',
        current.classes
      )}
    >
      <div className="flex items-center justify-center gap-2">
        <span>{current.icon}</span>
        <span>
          {current.label} 
          {milestoneTitle && ` — ${milestoneTitle}`}
          {current.description && ` • ${current.description}`}
        </span>
      </div>
    </div>
  )
}
