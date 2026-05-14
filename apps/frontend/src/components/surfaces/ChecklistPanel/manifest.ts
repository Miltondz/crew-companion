import { z } from 'zod'
import type { SurfaceManifest } from '@/runtime/surface-registry/types'

export const ChecklistEnvelopeSchema = z.object({
  title: z.string().min(1),
  items: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      done: z.boolean(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
    }),
  ).min(1),
  completionMessage: z.string().optional(),
})

export type ChecklistPayload = z.infer<typeof ChecklistEnvelopeSchema>

export const manifest: SurfaceManifest<typeof ChecklistEnvelopeSchema> = {
  id: 'checklist',
  version: '1.0.0',
  displayName: 'Checklist',

  requiredCapabilities: ['state.read'],

  visibleToRoles: ['leader', 'member'],
  visibleToTechLevels: ['high-tech'],

  envelopeSchema: ChecklistEnvelopeSchema,

  color: 'slate',
  density: 'standard',
  preferredZone: 'primary-workzone',

  canPin: true,
  hibernatable: true,
  priority: 45,

  load: () => import('./ChecklistPanel'),
}
