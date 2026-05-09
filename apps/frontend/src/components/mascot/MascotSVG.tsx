'use client'

import { cn } from '@/lib/utils'

type MascotMood = 'calm' | 'focus' | 'worried' | 'panic' | 'celebrate'
type MascotMode = 'idle' | 'hint' | 'alert' | 'action'

interface MascotSVGProps {
  mood: MascotMood
  mode: MascotMode
}

export function MascotSVG({ mood, mode }: MascotSVGProps) {
  const config = {
    calm: {
      body: '#93C5FD',
      eyes: 'normal',
      mouth: 'smile',
      animation: ''
    },
    focus: {
      body: '#FCD34D',
      eyes: 'concentrated',
      mouth: 'neutral',
      animation: ''
    },
    worried: {
      body: '#FB923C',
      eyes: 'worried',
      mouth: 'open',
      animation: 'animate-bounce [animation-duration:3s]'
    },
    panic: {
      body: '#F87171',
      eyes: 'panic',
      mouth: 'wide',
      animation: 'animate-pulse'
    },
    celebrate: {
      body: '#86EFAC',
      eyes: 'closed',
      mouth: 'wide-smile',
      animation: 'animate-bounce'
    }
  }

  const current = config[mood]

  const renderEyes = () => {
    switch (current.eyes) {
      case 'concentrated':
        return (
          <>
            <circle cx="24" cy="28" r="2.5" fill="#1E293B" />
            <circle cx="40" cy="28" r="2.5" fill="#1E293B" />
            <path d="M21 24l6 2M43 24l-6 2" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )
      case 'worried':
        return (
          <>
            <circle cx="24" cy="28" r="3.5" fill="#1E293B" />
            <circle cx="40" cy="28" r="3.5" fill="#1E293B" />
            <path d="M20 22c1-1 3-2 5-1M44 22c-1-1-3-2-5-1" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </>
        )
      case 'panic':
        return (
          <>
            <circle cx="24" cy="28" r="4.5" fill="#1E293B" />
            <circle cx="40" cy="28" r="4.5" fill="#1E293B" />
            <circle cx="24" cy="28" r="1.5" fill="white" />
            <circle cx="40" cy="28" r="1.5" fill="white" />
            <circle cx="16" cy="20" r="1.5" fill="#93C5FD" />
            <circle cx="52" cy="24" r="1" fill="#93C5FD" />
          </>
        )
      case 'closed':
        return (
          <>
            <path d="M20 30l4-3 4 3" stroke="#1E293B" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M36 30l4-3 4 3" stroke="#1E293B" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        )
      default:
        return (
          <>
            <circle cx="24" cy="28" r="3" fill="#1E293B" />
            <circle cx="40" cy="28" r="3" fill="#1E293B" />
          </>
        )
    }
  }

  const renderMouth = () => {
    switch (current.mouth) {
      case 'neutral':
        return <path d="M26 40h12" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
      case 'open':
        return <circle cx="32" cy="42" r="3" fill="#1E293B" />
      case 'wide':
        return <ellipse cx="32" cy="44" rx="6" ry="4" fill="#1E293B" />
      case 'wide-smile':
        return <path d="M22 38c0 0 4 6 10 6s10-6 10-6" stroke="#1E293B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      default:
        return <path d="M26 40c0 0 2 3 6 3s6-3 6-3" stroke="#1E293B" strokeWidth="2" fill="none" strokeLinecap="round" />
    }
  }

  return (
    <div className={cn(
      'w-16 h-16 relative transition-all duration-300',
      mood === 'panic' && 'animate-bounce',
      current.animation
    )}>
      {mode === 'alert' && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-red-600 font-bold text-lg animate-bounce">
          !
        </div>
      )}
      <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-sm">
        <rect 
          x="12" y="16" width="40" height="40" rx="16" 
          fill={current.body} 
          className="transition-colors duration-300"
        />
        {renderEyes()}
        {renderMouth()}
      </svg>
    </div>
  )
}
