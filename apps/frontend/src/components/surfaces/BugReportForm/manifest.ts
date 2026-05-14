import { z } from 'zod'
import type { SurfaceManifest } from '@/runtime/surface-registry/types'

export const BugReportEnvelopeSchema = z.object({
  title: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  steps: z.array(z.string()).min(1),
  expectedBehavior: z.string(),
  actualBehavior: z.string(),
  environment: z.string().optional(),
  reportedBy: z.string().optional(),
  taskId: z.string().optional(),
})

export type BugReportPayload = z.infer<typeof BugReportEnvelopeSchema>

export const manifest: SurfaceManifest<typeof BugReportEnvelopeSchema> = {
  id: 'bug_report_form',
  version: '1.0.0',
  displayName: 'Bug Report',

  requiredCapabilities: ['state.read'],

  visibleToRoles: ['leader', 'member'],
  visibleToSpecializations: ['qa', 'developer'],

  envelopeSchema: BugReportEnvelopeSchema,

  density: 'standard',
  preferredZone: 'primary-workzone',

  canPin: true,
  hibernatable: true,
  priority: 65,

  load: () => import('./BugReportForm'),
}
