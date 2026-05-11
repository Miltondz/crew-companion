import { z } from 'zod'
import type { SurfaceManifest } from '../../types'

// Same schema as fixture.ok — used to assert validation failures with wrong-typed data.
const FixtureBadSchema = z.object({
  message: z.string(),
  count: z.number().int(),
})

export const fixtureBadManifest: SurfaceManifest<typeof FixtureBadSchema> = {
  id: '__fixture_bad',
  version: '0.0.1',
  displayName: 'Test Fixture (Bad envelope)',
  requiredCapabilities: [],
  visibleToRoles: ['leader', 'member'],
  envelopeSchema: FixtureBadSchema,
  density: 'compact',
  preferredZone: 'primary-workzone',
  canPin: false,
  hibernatable: true,
  priority: 1,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  load: async () => ({ default: (() => null) as any }),
}

// Invalid payload — message is a number, count is a string.
export const fixtureBadPayload = { message: 123, count: 'x' }
