import { z } from 'zod'
import type { SurfaceManifest } from '@/runtime/surface-registry/types'

export const ForceGraphEnvelopeSchema = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    label: z.string(),
    type: z.enum(['task', 'person', 'service']),
    status: z.enum(['blocked', 'active', 'done', 'idle']),
  })),
  edges: z.array(z.object({
    from: z.string(),
    to: z.string(),
    label: z.string().optional(),
    criticality: z.enum(['low', 'medium', 'high']),
  })),
  title: z.string().optional(),
})

export type ForceGraphPayload = z.infer<typeof ForceGraphEnvelopeSchema>

export const manifest: SurfaceManifest<typeof ForceGraphEnvelopeSchema> = {
  id: 'force_graph',
  version: '1.0.0',
  displayName: 'Force Graph',

  requiredCapabilities: ['state.read', 'tasks.read'],

  visibleToRoles: ['leader'],

  envelopeSchema: ForceGraphEnvelopeSchema,

  density: 'hero',
  preferredZone: 'primary-workzone',

  canPin: true,
  hibernatable: true,
  priority: 70,

  load: () => import('./ForceGraph'),
}
