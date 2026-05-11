'use client'

// UX guard only — real enforcement is PolicyEngine (backend). See design 3.3 §9.1.
import { useCallback } from 'react'
import type { Role } from '@/lib/crew/types'
import type { CapabilityId } from './capabilities'
import type { RiskLevel } from './riskLevel'
import { useGrantedCapabilities } from './useGrantedCapabilities'

interface GuardedToolOptions {
  toolId: string
  capabilities: CapabilityId[]
  riskLevel: RiskLevel
  requiresApproval?: boolean
}

export function useGuardedFrontendTool<TArgs>(
  role: Role,
  options: GuardedToolOptions,
  fn: (args: TArgs) => void,
) {
  const grantedCapabilities = useGrantedCapabilities(role)

  return useCallback(
    (args: TArgs) => {
      const missing = options.capabilities.filter((c) => !grantedCapabilities.includes(c))
      if (missing.length > 0) {
        console.warn(`[capability] ${options.toolId} denied — missing: ${missing.join(', ')}`)
        return
      }
      // Frontend tools must never require approval — move to agent if needed.
      if (options.requiresApproval) {
        throw new Error(
          `Frontend tool '${options.toolId}' cannot require approval — move to agent.`
        )
      }
      fn(args)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn, options.toolId, options.capabilities, options.requiresApproval, grantedCapabilities],
  )
}
