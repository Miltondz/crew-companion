import { z } from 'zod'
import type { SurfaceManifest } from '@/runtime/surface-registry/types'

const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['todo', 'in-progress', 'done']),
  priority: z.enum(['low', 'medium', 'high']),
  assignedTo: z.string(),
})

export const MilestoneSummaryEnvelopeSchema = z.object({
  milestone: z.object({
    id: z.string(),
    title: z.string(),
    deadline: z.string(),
  }),
  phase: z.enum(['normal', 'focus', 'urgent', 'panic', 'expired']),
  minutesLeft: z.number(),
  completedTasks: z.array(TaskSchema),
  pendingTasks: z.array(TaskSchema),
  atRiskTasks: z.array(TaskSchema),
  recommendation: z.string(),
})

export type MilestoneSummaryPayload = z.infer<typeof MilestoneSummaryEnvelopeSchema>

export const manifest: SurfaceManifest<typeof MilestoneSummaryEnvelopeSchema> = {
  id: 'milestone_summary',
  version: '1.0.0',
  displayName: 'Milestone Summary',

  requiredCapabilities: ['state.read'],

  visibleToRoles: ['leader'],

  envelopeSchema: MilestoneSummaryEnvelopeSchema,

  color: 'indigo',
  density: 'hero',
  preferredZone: 'primary-workzone',

  canPin: true,
  hibernatable: true,
  priority: 65,

  load: () => import('./MilestoneSummaryPanel'),
}
