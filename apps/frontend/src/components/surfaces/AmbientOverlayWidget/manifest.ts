import { z } from 'zod'
import type { SurfaceManifest } from '@/runtime/surface-registry/types'

export const AmbientOverlayWidgetEnvelopeSchema = z.object({
  message: z.string(),
  action: z.object({
    label: z.string(),
    url: z.string().optional(),
  }).optional(),
  autoDismissSeconds: z.number().optional(),
  icon: z.string().optional(),
})

export type AmbientOverlayWidgetPayload = z.infer<typeof AmbientOverlayWidgetEnvelopeSchema>

export const manifest: SurfaceManifest<typeof AmbientOverlayWidgetEnvelopeSchema> = {
  id: 'ambient_overlay_widget',
  version: '1.0.0',
  displayName: 'Ambient Overlay',

  requiredCapabilities: ['state.read'],

  visibleToRoles: ['leader', 'member'],

  envelopeSchema: AmbientOverlayWidgetEnvelopeSchema,

  density: 'compact',
  preferredZone: 'ambient-overlay',

  canPin: false,
  hibernatable: false,
  priority: 40,

  load: () => import('./AmbientOverlayWidget'),
}
