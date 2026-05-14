import { z } from 'zod'
import type { SurfaceManifest } from '@/runtime/surface-registry/types'

export const ComponentChecklistEnvelopeSchema = z.object({
  title: z.string(),
  components: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string().optional(),
    status: z.enum(['not-started', 'in-progress', 'done', 'blocked']),
    notes: z.string().optional(),
  })).min(1),
})

export type ComponentChecklistPayload = z.infer<typeof ComponentChecklistEnvelopeSchema>

export const manifest: SurfaceManifest<typeof ComponentChecklistEnvelopeSchema> = {
  id: 'component_checklist',
  version: '1.0.0',
  displayName: 'Component Checklist',

  requiredCapabilities: ['state.read'],

  visibleToRoles: ['leader', 'member'],
  visibleToSpecializations: ['designer'],

  envelopeSchema: ComponentChecklistEnvelopeSchema,

  density: 'compact',
  preferredZone: 'primary-workzone',

  canPin: true,
  hibernatable: true,
  priority: 50,

  load: () => import('./ComponentChecklist'),
}
