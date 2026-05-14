import { z } from 'zod'
import type { SurfaceManifest } from '@/runtime/surface-registry/types'

export const DesignBriefEnvelopeSchema = z.object({
  projectName: z.string(),
  objective: z.string(),
  deliverables: z.array(z.object({
    title: z.string(),
    description: z.string(),
    status: z.enum(['pending', 'in-progress', 'done']),
  })).min(1),
  colorDirection: z.string().optional(),
  targetAudience: z.string().optional(),
  references: z.array(z.string()).optional(),
})

export type DesignBriefPayload = z.infer<typeof DesignBriefEnvelopeSchema>

export const manifest: SurfaceManifest<typeof DesignBriefEnvelopeSchema> = {
  id: 'design_brief_panel',
  version: '1.0.0',
  displayName: 'Design Brief',

  requiredCapabilities: ['state.read'],

  visibleToRoles: ['leader', 'member'],
  visibleToSpecializations: ['designer'],

  envelopeSchema: DesignBriefEnvelopeSchema,

  color: 'violet',
  density: 'standard',
  preferredZone: 'primary-workzone',

  canPin: true,
  hibernatable: true,
  priority: 55,

  load: () => import('./DesignBriefPanel'),
}
