import { z } from 'zod'
import type { SurfaceManifest } from '@/runtime/surface-registry/types'

export const TriageWarRoomEnvelopeSchema = z.object({
  decisions: z.array(z.object({
    id: z.string(),
    description: z.string(),
    timeSavedMinutes: z.number().optional(),
    timeCostMinutes: z.number().optional(),
    executor: z.string().optional(),
    impact: z.string(),
    viabilityDelta: z.number().optional(),
  })),
  title: z.string().optional(),
})

export type TriageWarRoomPayload = z.infer<typeof TriageWarRoomEnvelopeSchema>

export const manifest: SurfaceManifest<typeof TriageWarRoomEnvelopeSchema> = {
  id: 'triage_war_room',
  version: '1.0.0',
  displayName: 'Triage War Room',

  requiredCapabilities: ['state.read', 'tasks.write'],

  visibleToRoles: ['leader'],

  envelopeSchema: TriageWarRoomEnvelopeSchema,

  color: 'red',
  density: 'hero',
  preferredZone: 'primary-workzone',

  canPin: true,
  hibernatable: false,
  priority: 85,

  load: () => import('./TriageWarRoom'),
}
