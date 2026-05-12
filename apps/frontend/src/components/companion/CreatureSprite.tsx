'use client'

import { cn } from '@/lib/utils'
import type { CreatureMood, CreatureMode } from '@/runtime/companion'

interface Props {
  mood: CreatureMood
  mode: CreatureMode
}

const BODY_COLORS: Record<CreatureMood, string> = {
  calm:        '#93C5FD',
  focused:     '#FCD34D',
  worried:     '#FB923C',
  panicking:   '#F87171',
  celebrating: '#86EFAC',
  sleeping:    '#CBD5E1',
  thinking:    '#C4B5FD',
  guiding:     '#818CF8',
}

export function CreatureSprite({ mood, mode }: Props) {
  const body = BODY_COLORS[mood]

  const renderEyes = () => {
    switch (mood) {
      case 'focused':
        return (
          <>
            <circle cx="22" cy="26" r="2.5" fill="#1E293B" />
            <circle cx="34" cy="26" r="2.5" fill="#1E293B" />
            <path d="M19 22l5 2M37 22l-5 2" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )
      case 'worried':
        return (
          <>
            <circle cx="22" cy="26" r="3.5" fill="#1E293B" />
            <circle cx="34" cy="26" r="3.5" fill="#1E293B" />
            <path d="M18 20c1-1 3-2 5-1M38 20c-1-1-3-2-5-1" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </>
        )
      case 'panicking':
        return (
          <>
            <circle cx="22" cy="26" r="4.5" fill="#1E293B" />
            <circle cx="34" cy="26" r="4.5" fill="#1E293B" />
            <circle cx="22" cy="26" r="1.5" fill="white" />
            <circle cx="34" cy="26" r="1.5" fill="white" />
            <circle cx="14" cy="18" r="1.5" fill="#93C5FD" />
            <circle cx="44" cy="22" r="1" fill="#93C5FD" />
          </>
        )
      case 'sleeping':
        return (
          <>
            <path d="M18 28l4-2 4 2" stroke="#1E293B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M30 28l4-2 4 2" stroke="#1E293B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </>
        )
      case 'celebrating':
        return (
          <>
            <path d="M18 28l4-3 4 3" stroke="#1E293B" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M30 28l4-3 4 3" stroke="#1E293B" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        )
      case 'thinking':
        return (
          <>
            <circle cx="22" cy="26" r="3" fill="#1E293B" />
            <circle cx="34" cy="26" r="3" fill="#1E293B" />
            <circle cx="22" cy="26" r="1" fill="white" />
            <circle cx="34" cy="26" r="1" fill="white" />
          </>
        )
      case 'guiding':
        return (
          <>
            <circle cx="22" cy="26" r="3" fill="#1E293B" />
            <circle cx="34" cy="26" r="3" fill="#1E293B" />
            <circle cx="23" cy="25" r="1" fill="white" />
            <circle cx="35" cy="25" r="1" fill="white" />
          </>
        )
      default:
        return (
          <>
            <circle cx="22" cy="26" r="3" fill="#1E293B" />
            <circle cx="34" cy="26" r="3" fill="#1E293B" />
          </>
        )
    }
  }

  const renderMouth = () => {
    switch (mood) {
      case 'focused':
        return <path d="M24 37h8" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
      case 'worried':
        return <circle cx="28" cy="38" r="3" fill="#1E293B" />
      case 'panicking':
        return <ellipse cx="28" cy="40" rx="6" ry="4" fill="#1E293B" />
      case 'celebrating':
        return <path d="M20 36c0 0 3 6 8 6s8-6 8-6" stroke="#1E293B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      case 'sleeping':
        return <path d="M24 37c0 0 1 2 4 2s4-2 4-2" stroke="#1E293B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      case 'guiding':
        return <path d="M22 37c0 0 2 4 6 4s6-4 6-4" stroke="#1E293B" strokeWidth="2" fill="none" strokeLinecap="round" />
      default:
        return <path d="M23 37c0 0 2 3 5 3s5-3 5-3" stroke="#1E293B" strokeWidth="2" fill="none" strokeLinecap="round" />
    }
  }

  const renderAccessories = () => {
    if (mood === 'sleeping') {
      return (
        <>
          <text x="36" y="18" fontSize="8" fill="#94A3B8">z</text>
          <text x="40" y="13" fontSize="6" fill="#CBD5E1">z</text>
          <text x="43" y="9" fontSize="5" fill="#E2E8F0">z</text>
        </>
      )
    }
    if (mood === 'thinking') {
      return (
        <>
          <circle cx="36" cy="14" r="3" fill="white" fillOpacity="0.8" stroke="#C4B5FD" strokeWidth="1" />
          <circle cx="40" cy="10" r="2" fill="white" fillOpacity="0.6" stroke="#C4B5FD" strokeWidth="1" />
          <circle cx="43" cy="7" r="1.5" fill="white" fillOpacity="0.4" stroke="#C4B5FD" strokeWidth="1" />
        </>
      )
    }
    if (mode === 'alert') {
      return (
        <text x="26" y="12" fontSize="10" fill="#EF4444" className="font-bold">!</text>
      )
    }
    if (mood === 'guiding') {
      return (
        <path d="M36 28l6-4" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" markerEnd="url(#arrow)" />
      )
    }
    return null
  }

  return (
    <div className={cn(
      'relative transition-all duration-500 select-none',
      mood === 'panicking' && 'animate-bounce [animation-duration:0.5s]',
      mood === 'celebrating' && 'animate-bounce',
      mood === 'worried' && 'animate-bounce [animation-duration:2s]',
      mode === 'alert' && mood !== 'panicking' && 'animate-pulse',
    )}>
      <svg viewBox="0 0 56 56" width="56" height="56" className="drop-shadow-md">
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#818CF8" />
          </marker>
        </defs>
        {/* legs */}
        <rect x="18" y="44" width="7" height="6" rx="3" fill={body} opacity="0.8" />
        <rect x="31" y="44" width="7" height="6" rx="3" fill={body} opacity="0.8" />
        {/* arms */}
        <rect x="8" y="22" width="6" height="10" rx="3" fill={body} opacity="0.9"
          style={{ transformOrigin: '14px 22px', transform: mood === 'celebrating' ? 'rotate(-30deg)' : 'none', transition: 'transform 0.3s' }} />
        <rect x="42" y="22" width="6" height="10" rx="3" fill={body} opacity="0.9"
          style={{ transformOrigin: '42px 22px', transform: mood === 'celebrating' ? 'rotate(30deg)' : 'none', transition: 'transform 0.3s' }} />
        {/* body */}
        <rect x="12" y="14" width="32" height="34" rx="14" fill={body} className="transition-colors duration-500" />
        {/* ears */}
        <rect x="12" y="10" width="8" height="10" rx="4" fill={body} />
        <rect x="36" y="10" width="8" height="10" rx="4" fill={body} />
        {renderEyes()}
        {renderMouth()}
        {renderAccessories()}
      </svg>
    </div>
  )
}
