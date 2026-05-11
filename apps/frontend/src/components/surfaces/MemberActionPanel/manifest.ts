import { z } from 'zod'
import type { SurfaceManifest } from '@/runtime/surface-registry/types'

export const MemberActionEnvelopeSchema = z.object({
  urgencyPhase: z.enum(['normal', 'focus', 'urgent', 'panic', 'expired']),
  actions: z.array(
    z.object({
      label: z.string().min(1),
      description: z.string(),
      priority: z.enum(['immediate', 'soon', 'optional']),
      assignedTo: z.string().optional(),
    }),
  ).min(1),
  message: z.string(),
})

export type MemberActionPayload = z.infer<typeof MemberActionEnvelopeSchema>

export const manifest: SurfaceManifest<typeof MemberActionEnvelopeSchema> = {
  id: 'member_action',
  version: '1.0.0',
  displayName: 'Member Actions',

  requiredCapabilities: ['state.read'],

  visibleToRoles: ['leader', 'member'],

  envelopeSchema: MemberActionEnvelopeSchema,

  density: 'standard',
  preferredZone: 'primary-workzone',

  canPin: true,
  hibernatable: true,
  priority: 70,

  load: () => import('./MemberActionPanel'),
}
