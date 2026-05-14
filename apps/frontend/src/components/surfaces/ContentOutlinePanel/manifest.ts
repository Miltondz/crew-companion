import { z } from 'zod'
import type { SurfaceManifest } from '@/runtime/surface-registry/types'

export const ContentOutlineEnvelopeSchema = z.object({
  title: z.string(),
  contentType: z.string().optional(),
  sections: z.array(z.object({
    id: z.string(),
    heading: z.string(),
    description: z.string(),
    wordCount: z.number().optional(),
    status: z.enum(['draft', 'in-progress', 'complete']),
  })).min(1),
  totalWords: z.number().optional(),
  deadline: z.string().optional(),
})

export type ContentOutlinePayload = z.infer<typeof ContentOutlineEnvelopeSchema>

export const manifest: SurfaceManifest<typeof ContentOutlineEnvelopeSchema> = {
  id: 'content_outline_panel',
  version: '1.0.0',
  displayName: 'Content Outline',

  requiredCapabilities: ['state.read'],

  visibleToRoles: ['leader', 'member'],
  visibleToSpecializations: ['writer'],

  envelopeSchema: ContentOutlineEnvelopeSchema,

  color: 'amber',
  density: 'standard',
  preferredZone: 'primary-workzone',

  canPin: true,
  hibernatable: true,
  priority: 55,

  load: () => import('./ContentOutlinePanel'),
}
