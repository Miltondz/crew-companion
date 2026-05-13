'use client'

import { Zap, AlertTriangle, AlertCircle, Skull } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

type UrgencyPhase = 'normal' | 'focus' | 'urgent' | 'panic' | 'expired'

interface UrgencyBannerProps {
  phase: UrgencyPhase
  milestoneTitle?: string
}

const PHASE_CONFIG = {
  focus: {
    Icon: Zap,
    label: 'Modo Focus',
    description: '15-30 min restantes',
    bg:        'bg-yellow-100 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-800',
    text:      'text-yellow-900 dark:text-yellow-200',
    iconClass: 'text-yellow-600 dark:text-yellow-400',
    pulse: false,
  },
  urgent: {
    Icon: AlertTriangle,
    label: 'Urgente',
    description: 'menos de 15 min',
    bg:        'bg-orange-100 border-orange-300 dark:bg-orange-950 dark:border-orange-800',
    text:      'text-orange-900 dark:text-orange-200',
    iconClass: 'text-orange-600 dark:text-orange-400',
    pulse: false,
  },
  panic: {
    Icon: AlertCircle,
    label: 'PÁNICO',
    description: 'menos de 5 min',
    bg:        'bg-red-100 border-red-400 dark:bg-red-950 dark:border-red-800',
    text:      'text-red-900 dark:text-red-100',
    iconClass: 'text-red-600 dark:text-red-400',
    pulse: true,
  },
  expired: {
    Icon: Skull,
    label: 'Tiempo expirado',
    description: '',
    bg:        'bg-red-200 border-red-500 dark:bg-red-950 dark:border-red-900',
    text:      'text-red-950 dark:text-red-100',
    iconClass: 'text-red-700 dark:text-red-300',
    pulse: false,
  },
}

export function UrgencyBanner({ phase, milestoneTitle }: UrgencyBannerProps) {
  if (phase === 'normal') return null

  const { Icon, label, description, bg, text, iconClass, pulse } = PHASE_CONFIG[phase]

  return (
    <Alert className={cn('w-full rounded-none border-y border-x-0 transition-all duration-300', bg, pulse && 'animate-pulse')}>
      <div className={cn('flex items-center justify-center gap-3 py-0.5', text)}>
        <Icon className={cn('h-5 w-5 shrink-0', iconClass, pulse && 'animate-pulse')} />
        <AlertDescription className={cn('m-0 flex items-center gap-2 font-semibold text-sm', text)}>
          <span>{label}</span>
          {milestoneTitle && (
            <>
              <span className="opacity-50">•</span>
              <span className="font-normal opacity-80">{milestoneTitle}</span>
            </>
          )}
          {description && (
            <>
              <span className="hidden sm:inline opacity-50">•</span>
              <span className="hidden sm:inline font-normal opacity-70">{description}</span>
            </>
          )}
        </AlertDescription>
      </div>
    </Alert>
  )
}
