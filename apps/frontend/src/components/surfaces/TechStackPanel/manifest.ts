import { z } from 'zod'
import type { SurfaceManifest } from '@/runtime/surface-registry/types'

export const TechStackEnvelopeSchema = z.object({
  projectName: z.string(),
  stack: z.array(z.object({
    name: z.string(),
    version: z.string().optional(),
    role: z.string(),
    docsUrl: z.string().optional(),
  })).min(1),
  commands: z.array(z.object({
    label: z.string(),
    command: z.string(),
    description: z.string().optional(),
  })).optional(),
  ports: z.array(z.object({
    service: z.string(),
    port: z.number(),
  })).optional(),
  notes: z.string().optional(),
})

export type TechStackPayload = z.infer<typeof TechStackEnvelopeSchema>

export const manifest: SurfaceManifest<typeof TechStackEnvelopeSchema> = {
  id: 'tech_stack_panel',
  version: '1.0.0',
  displayName: 'Tech Stack Reference',

  requiredCapabilities: ['state.read'],

  visibleToRoles: ['leader', 'member'],
  visibleToTechLevels: ['high-tech'],
  visibleToSpecializations: ['developer'],

  envelopeSchema: TechStackEnvelopeSchema,

  density: 'standard',
  preferredZone: 'primary-workzone',

  canPin: true,
  hibernatable: true,
  priority: 55,

  load: () => import('./TechStackPanel'),
}
