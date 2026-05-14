import { z } from 'zod'
import type { SurfaceManifest } from '@/runtime/surface-registry/types'

export const WritingChecklistEnvelopeSchema = z.object({
  title: z.string(),
  phase: z.enum(['research', 'outline', 'draft', 'review', 'publish']),
  items: z.array(z.object({
    id: z.string(),
    text: z.string(),
    done: z.boolean(),
    tip: z.string().optional(),
  })).min(1),
  tip: z.string().optional(),
})

export type WritingChecklistPayload = z.infer<typeof WritingChecklistEnvelopeSchema>

export const manifest: SurfaceManifest<typeof WritingChecklistEnvelopeSchema> = {
  id: 'writing_checklist',
  version: '1.0.0',
  displayName: 'Writing Checklist',

  requiredCapabilities: ['state.read'],

  visibleToRoles: ['leader', 'member'],
  visibleToSpecializations: ['writer'],

  envelopeSchema: WritingChecklistEnvelopeSchema,

  color: 'amber',
  density: 'standard',
  preferredZone: 'primary-workzone',

  canPin: true,
  hibernatable: true,
  priority: 50,

  load: () => import('./WritingChecklist'),
}
