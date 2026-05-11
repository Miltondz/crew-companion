import { z } from 'zod'
import type { SurfaceManifest } from '../../types'

export const FixtureOkSchema = z.object({
  message: z.string(),
  count: z.number().int(),
})

export type FixtureOkPayload = z.infer<typeof FixtureOkSchema>

export const fixtureOkManifest: SurfaceManifest<typeof FixtureOkSchema> = {
  id: '__fixture_ok',
  version: '0.0.1',
  displayName: 'Test Fixture (OK)',
  requiredCapabilities: [],
  visibleToRoles: ['leader', 'member'],
  envelopeSchema: FixtureOkSchema,
  density: 'compact',
  preferredZone: 'primary-workzone',
  canPin: false,
  hibernatable: true,
  priority: 1,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  load: async () => ({ default: (() => null) as any }),
}
