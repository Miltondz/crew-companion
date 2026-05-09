import type { UrgencyPhase, MascotMood } from './types'

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
