import { z } from 'zod'
import type { SurfaceManifest } from '@/runtime/surface-registry/types'

export const FocusedTaskEnvelopeSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['todo', 'in-progress', 'done']),
  assignedTo: z.string(),
  coachNote: z.string().optional(),
})

export type FocusedTaskPayload = z.infer<typeof FocusedTaskEnvelopeSchema>

export const manifest: SurfaceManifest<typeof FocusedTaskEnvelopeSchema> = {
  id: 'focused_task_panel',
  version: '1.0.0',
  displayName: 'Focused Task',

  requiredCapabilities: ['state.read', 'tasks.read'],

  visibleToRoles: ['leader', 'member'],

  envelopeSchema: FocusedTaskEnvelopeSchema,

  color: 'amber',
  density: 'compact',
  preferredZone: 'primary-workzone',

  canPin: false,
  hibernatable: true,
  priority: 65,

  load: () => import('./FocusedTaskPanel'),
}
