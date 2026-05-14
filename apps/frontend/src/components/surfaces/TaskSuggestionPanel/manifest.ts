import { z } from 'zod'
import type { SurfaceManifest } from '@/runtime/surface-registry/types'

const PrioritySchema = z.enum(['low', 'medium', 'high'])

export const TaskSuggestionEnvelopeSchema = z.object({
  suggestions: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string(),
        priority: PrioritySchema,
        assignTo: z.string().optional(),
        estimatedMinutes: z.number().int().positive().optional(),
      }),
    )
    .min(1),
  context: z.string(),
})

export type TaskSuggestionPayload = z.infer<typeof TaskSuggestionEnvelopeSchema>

export const manifest: SurfaceManifest<typeof TaskSuggestionEnvelopeSchema> = {
  id: 'task_suggestion',
  version: '1.0.0',
  displayName: 'Task Suggestions',

  requiredCapabilities: ['state.read', 'tasks.read'],

  visibleToRoles: ['leader'],
  // visibleToTechLevels omitted → all
  // forbiddenInPhases omitted → all phases

  envelopeSchema: TaskSuggestionEnvelopeSchema,

  color: 'indigo',
  density: 'standard',
  preferredZone: 'primary-workzone',

  canPin: true,
  hibernatable: true,
  priority: 50,

  load: () => import('./TaskSuggestionPanel'),
}
