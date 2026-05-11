import { z } from 'zod'
import type { SurfaceManifest } from '@/runtime/surface-registry/types'

const TechnicalLevelSchema = z.enum(['low-tech', 'high-tech'])

export const BlockerInsightEnvelopeSchema = z.object({
  blocker: z.object({
    id: z.string(),
    description: z.string(),
    reportedAt: z.string(),
  }),
  member: z.object({
    name: z.string(),
    technicalLevel: TechnicalLevelSchema,
  }),
  possibleCauses: z.array(z.string()),
  suggestedActions: z.array(
    z.object({
      action: z.string(),
      forTechnicalLevel: z.union([TechnicalLevelSchema, z.literal('all')]),
    }),
  ),
  canReassignTask: z.boolean(),
})

export type BlockerInsightPayload = z.infer<typeof BlockerInsightEnvelopeSchema>

export const manifest: SurfaceManifest<typeof BlockerInsightEnvelopeSchema> = {
  id: 'blocker_insight',
  version: '1.0.0',
  displayName: 'Blocker Insight',

  requiredCapabilities: ['state.read'],

  visibleToRoles: ['leader'],

  envelopeSchema: BlockerInsightEnvelopeSchema,

  density: 'standard',
  preferredZone: 'primary-workzone',

  canPin: true,
  hibernatable: true,
  priority: 75,

  load: () => import('./BlockerInsightPanel'),
}
