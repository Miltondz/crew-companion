import { z } from 'zod'
import type { SurfaceManifest } from '@/runtime/surface-registry/types'

export const TestCaseBoardEnvelopeSchema = z.object({
  title: z.string(),
  feature: z.string().optional(),
  cases: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    status: z.enum(['pending', 'passed', 'failed', 'blocked', 'skipped']),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    assignedTo: z.string().optional(),
  })).min(1),
})

export type TestCaseBoardPayload = z.infer<typeof TestCaseBoardEnvelopeSchema>

export const manifest: SurfaceManifest<typeof TestCaseBoardEnvelopeSchema> = {
  id: 'test_case_board',
  version: '1.0.0',
  displayName: 'Test Case Board',

  requiredCapabilities: ['state.read'],

  visibleToRoles: ['leader', 'member'],
  visibleToSpecializations: ['qa'],

  envelopeSchema: TestCaseBoardEnvelopeSchema,

  color: 'cyan',
  density: 'standard',
  preferredZone: 'primary-workzone',

  canPin: true,
  hibernatable: true,
  priority: 60,

  load: () => import('./TestCaseBoard'),
}
