import { z } from 'zod'
import type { SurfaceManifest } from '@/runtime/surface-registry/types'

export const TroubleshootingEnvelopeSchema = z.object({
  problem: z.string().min(1),
  steps: z.array(
    z.object({
      question: z.string().min(1),
      yesAction: z.string(),
      noAction: z.string(),
    }),
  ).min(1),
  resolution: z.string().optional(),
  escalateTo: z.string().optional(),
})

export type TroubleshootingPayload = z.infer<typeof TroubleshootingEnvelopeSchema>

export const manifest: SurfaceManifest<typeof TroubleshootingEnvelopeSchema> = {
  id: 'troubleshooting_wizard',
  version: '1.0.0',
  displayName: 'Troubleshooting Wizard',

  requiredCapabilities: ['state.read'],

  visibleToRoles: ['leader', 'member'],
  visibleToTechLevels: ['low-tech'],

  envelopeSchema: TroubleshootingEnvelopeSchema,

  color: 'orange',
  density: 'standard',
  preferredZone: 'primary-workzone',

  canPin: true,
  hibernatable: true,
  priority: 80,

  load: () => import('./TroubleshootingWizard'),
}
