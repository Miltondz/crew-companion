import { z } from 'zod'
import type { SurfaceManifest } from '@/runtime/surface-registry/types'

export const StakeholderUpdateEnvelopeSchema = z.object({
  projectName: z.string(),
  updateText: z.string(),
  highlights: z.array(z.object({
    type: z.enum(['win', 'risk', 'milestone', 'blocker']),
    text: z.string(),
  })),
  nextSteps: z.array(z.string()).min(1),
  generatedAt: z.string(),
})

export type StakeholderUpdatePayload = z.infer<typeof StakeholderUpdateEnvelopeSchema>

export const manifest: SurfaceManifest<typeof StakeholderUpdateEnvelopeSchema> = {
  id: 'stakeholder_update',
  version: '1.0.0',
  displayName: 'Stakeholder Update',

  requiredCapabilities: ['state.read'],

  visibleToRoles: ['leader', 'member'],
  visibleToSpecializations: ['manager'],

  envelopeSchema: StakeholderUpdateEnvelopeSchema,

  color: 'emerald',
  density: 'standard',
  preferredZone: 'primary-workzone',

  canPin: false,
  hibernatable: true,
  priority: 60,

  load: () => import('./StakeholderUpdate'),
}
