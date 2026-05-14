'use client'

'use client'

import type { RuntimeContext } from './types'
import type { Role, TechnicalLevel, Specialization, UrgencyPhase } from '@/lib/crew/types'

interface UseRuntimeContextOptions {
  role: Role
  techLevel?: TechnicalLevel
  specialization?: Specialization
  phase: UrgencyPhase
  hasActiveBlocker: boolean
}

export function useRuntimeContext(opts: UseRuntimeContextOptions): RuntimeContext {
  return {
    role: opts.role,
    techLevel: opts.techLevel ?? 'high-tech',
    specialization: opts.specialization,
    phase: opts.phase,
    hasActiveBlocker: opts.hasActiveBlocker,
    workspaceId: 'default',
  }
}
