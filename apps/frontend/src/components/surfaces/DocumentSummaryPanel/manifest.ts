import { z } from 'zod'
import type { SurfaceManifest } from '@/runtime/surface-registry/types'

export const DocumentSummaryEnvelopeSchema = z.object({
  documentTitle: z.string().min(1),
  summary: z.string(),
  keyPoints: z.array(z.string()).min(1),
  relevantSection: z.string().optional(),
  quote: z.string().optional(),
})

export type DocumentSummaryPayload = z.infer<typeof DocumentSummaryEnvelopeSchema>

export const manifest: SurfaceManifest<typeof DocumentSummaryEnvelopeSchema> = {
  id: 'document_summary',
  version: '1.0.0',
  displayName: 'Document Summary',

  requiredCapabilities: ['state.read'],

  visibleToRoles: ['leader', 'member'],

  envelopeSchema: DocumentSummaryEnvelopeSchema,

  density: 'standard',
  preferredZone: 'primary-workzone',

  canPin: true,
  hibernatable: true,
  priority: 40,

  load: () => import('./DocumentSummaryPanel'),
}
