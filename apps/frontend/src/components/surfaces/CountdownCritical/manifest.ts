import { z } from 'zod'
import type { SurfaceManifest } from '@/runtime/surface-registry/types'

export const CountdownCriticalEnvelopeSchema = z.object({
  deadline: z.string(),
  title: z.string(),
  viabilityScore: z.number().min(0).max(100),
  criticalBlockers: z.array(z.object({
    id: z.string(),
    text: z.string(),
    resolved: z.boolean().optional(),
  })),
  featuresToCut: z.array(z.object({
    id: z.string(),
    name: z.string(),
    timeSavedMinutes: z.number(),
  })).optional(),
  variant: z.enum(['compact', 'full']).optional().default('compact'),
  orientation: z.enum(['vertical', 'horizontal']).optional().default('vertical'),
  showBlockers: z.boolean().optional(),
  showFeatures: z.boolean().optional(),
})

export type CountdownCriticalPayload = z.infer<typeof CountdownCriticalEnvelopeSchema>

export const manifest: SurfaceManifest<typeof CountdownCriticalEnvelopeSchema> = {
  id: 'countdown_critical',
  version: '1.0.0',
  displayName: 'Countdown Critical',

  requiredCapabilities: ['state.read'],

  visibleToRoles: ['leader', 'member'],

  envelopeSchema: CountdownCriticalEnvelopeSchema,

  color: 'red',
  density: 'compact',
  preferredZone: 'ambient-overlay',

  canPin: false,
  hibernatable: false,
  priority: 90,

  load: () => import('./CountdownCritical'),
}
