import { z } from 'zod'
import type { SurfaceManifest } from '@/runtime/surface-registry/types'

export const TeamVelocityEnvelopeSchema = z.object({
  milestone: z.string(),
  overallProgress: z.number().min(0).max(100),
  riskLevel: z.enum(['low', 'medium', 'high']),
  members: z.array(z.object({
    name: z.string(),
    totalTasks: z.number(),
    doneTasks: z.number(),
    activeTasks: z.number(),
    blockers: z.number(),
  })).min(1),
  recommendation: z.string().optional(),
})

export type TeamVelocityPayload = z.infer<typeof TeamVelocityEnvelopeSchema>

export const manifest: SurfaceManifest<typeof TeamVelocityEnvelopeSchema> = {
  id: 'team_velocity_panel',
  version: '1.0.0',
  displayName: 'Team Velocity',

  requiredCapabilities: ['state.read'],

  visibleToRoles: ['leader', 'member'],
  visibleToSpecializations: ['manager'],

  envelopeSchema: TeamVelocityEnvelopeSchema,

  density: 'standard',
  preferredZone: 'primary-workzone',

  canPin: true,
  hibernatable: true,
  priority: 65,

  load: () => import('./TeamVelocityPanel'),
}
