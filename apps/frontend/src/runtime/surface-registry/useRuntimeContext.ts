'use client'

import type { RuntimeContext } from './types'
import type { Role, TechnicalLevel, UrgencyPhase } from '@/lib/crew/types'

interface UseRuntimeContextOptions {
  role: Role
  techLevel?: TechnicalLevel
  phase: UrgencyPhase
  hasActiveBlocker: boolean
}

/**
 * Assembles a RuntimeContext for use in page render callbacks.
 *
 * 3.1: role is hardcoded per-page (leader → 'leader', member → 'member', docs → 'leader').
 * 3.2: derives role from auth session; workspaceId from workspace store.
 */
export function useRuntimeContext(opts: UseRuntimeContextOptions): RuntimeContext {
  return {
    role: opts.role,
    techLevel: opts.techLevel ?? 'high-tech',
    phase: opts.phase,
    hasActiveBlocker: opts.hasActiveBlocker,
    workspaceId: 'default', // TODO(4.1): replace with real workspace from auth session
  }
}
