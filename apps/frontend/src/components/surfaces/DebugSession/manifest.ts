import { z } from 'zod'
import type { SurfaceManifest } from '@/runtime/surface-registry/types'

export const DebugSessionEnvelopeSchema = z.object({
  title: z.string(),
  problem: z.string().optional(),
  hypothesis: z.array(z.string()).optional(),
  steps: z.array(z.object({
    id: z.string(),
    description: z.string(),
    command: z.string().optional(),
    result: z.string().optional(),
    resolved: z.boolean(),
  })).min(1),
  resolution: z.string().optional(),
})

export type DebugSessionPayload = z.infer<typeof DebugSessionEnvelopeSchema>

export const manifest: SurfaceManifest<typeof DebugSessionEnvelopeSchema> = {
  id: 'debug_session',
  version: '1.0.0',
  displayName: 'Debug Session',

  requiredCapabilities: ['state.read'],

  visibleToRoles: ['leader', 'member'],
  visibleToTechLevels: ['high-tech'],
  visibleToSpecializations: ['developer', 'qa'],

  envelopeSchema: DebugSessionEnvelopeSchema,

  color: 'slate',
  density: 'standard',
  preferredZone: 'primary-workzone',

  canPin: true,
  hibernatable: true,
  priority: 70,

  load: () => import('./DebugSession'),
}
