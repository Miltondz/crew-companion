import { z } from 'zod'
import type { SurfaceManifest } from '@/runtime/surface-registry/types'

export const BeginnerGuideEnvelopeSchema = z.object({
  topic: z.string().min(1),
  steps: z.array(
    z.object({
      stepNumber: z.number().int().positive(),
      title: z.string().min(1),
      content: z.string(),
      tip: z.string().optional(),
    }),
  ).min(1),
  estimatedMinutes: z.number().int().positive(),
})

export type BeginnerGuidePayload = z.infer<typeof BeginnerGuideEnvelopeSchema>

export const manifest: SurfaceManifest<typeof BeginnerGuideEnvelopeSchema> = {
  id: 'beginner_guide',
  version: '1.0.0',
  displayName: 'Beginner Guide',

  requiredCapabilities: ['state.read'],

  visibleToRoles: ['leader', 'member'],
  visibleToTechLevels: ['low-tech'],

  envelopeSchema: BeginnerGuideEnvelopeSchema,

  density: 'standard',
  preferredZone: 'primary-workzone',

  canPin: true,
  hibernatable: true,
  priority: 45,

  load: () => import('./BeginnerGuidePanel'),
}
