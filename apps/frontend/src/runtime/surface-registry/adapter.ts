// Backward-compat shim — removed when block 3.5 lands and the BFF emits full envelopes.
import type { LegacySurfaceEnvelope, RuntimeContext, SurfaceEnvelope } from './types'

export function adaptLegacyEnvelope(
  legacy: LegacySurfaceEnvelope,
  context: RuntimeContext,
): SurfaceEnvelope {
  return {
    envelopeId: crypto.randomUUID(),
    agentId: 'legacy',
    emittedAt: Date.now(),
    intent: 'render_surface',
    priority: 'medium',
    surfaceId: legacy.type,
    payload: legacy.payload,
    context,
    requiredCapabilities: [],
    hibernatable: true,
    pinnable: true,
  }
}

export function isLegacyEnvelope(e: unknown): e is LegacySurfaceEnvelope {
  return (
    typeof e === 'object' &&
    e !== null &&
    'type' in e &&
    typeof (e as Record<string, unknown>).type === 'string' &&
    'payload' in e &&
    (e as Record<string, unknown>).payload !== null &&
    typeof (e as Record<string, unknown>).payload === 'object'
  )
}
