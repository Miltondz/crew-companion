import { z } from 'zod'
import type { SurfaceManifest } from '@/runtime/surface-registry/types'

export const IdeaMatrixEnvelopeSchema = z.object({
  ideas: z.array(z.object({
    id: z.string(),
    title: z.string(),
    viability: z.number().min(0).max(100),
    wow: z.number().min(0).max(100),
    evaluated: z.boolean().optional(),
    description: z.string().optional(),
  })),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
})

export type IdeaMatrixPayload = z.infer<typeof IdeaMatrixEnvelopeSchema>

export const manifest: SurfaceManifest<typeof IdeaMatrixEnvelopeSchema> = {
  id: 'idea_matrix',
  version: '1.0.0',
  displayName: 'Idea Matrix',

  requiredCapabilities: ['state.read'],

  visibleToRoles: ['leader'],

  envelopeSchema: IdeaMatrixEnvelopeSchema,

  color: 'violet',
  density: 'hero',
  preferredZone: 'primary-workzone',

  canPin: true,
  hibernatable: true,
  priority: 60,

  load: () => import('./IdeaMatrix'),
}
