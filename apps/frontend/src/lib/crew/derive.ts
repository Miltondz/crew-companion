import type { UrgencyPhase, MascotMood } from './types'

export function computeCountdown(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return '00:00:00'
  const totalSec = Math.floor(diff / 1000)
  const h = Math.min(99, Math.floor(totalSec / 3600))
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

export function getUrgencyPhase(deadlineISO: string): UrgencyPhase {
  const minutesLeft = (new Date(deadlineISO).getTime() - Date.now()) / 60000
  if (minutesLeft > 30) return 'normal'
  if (minutesLeft > 15) return 'focus'
  if (minutesLeft > 5)  return 'urgent'
  if (minutesLeft > 0)  return 'panic'
  return 'expired'
}

export function getMascotMood(phase: UrgencyPhase, hasBlocker: boolean): MascotMood {
  if (phase === 'expired') return 'panic'
  if (phase === 'panic')   return hasBlocker ? 'panic' : 'worried'
  if (phase === 'urgent')  return 'worried'
  if (phase === 'focus')   return 'focus'
  if (hasBlocker)          return 'worried'
  return 'calm'
}
