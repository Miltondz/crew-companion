'use client'

import { useMemo } from 'react'
import type { Role } from '@/lib/crew/types'
import type { CapabilityId } from './capabilities'
import { roleGrantsFor } from './roleGrants'

/**
 * Returns the capability set for the current page role.
 * Stub: derived from role only. 3.4: fetched from /api/auth/me with
 * per-member workspace_members.capabilities overrides applied server-side.
 */
export function useGrantedCapabilities(role: Role): CapabilityId[] {
  return useMemo(() => roleGrantsFor(role), [role])
}
