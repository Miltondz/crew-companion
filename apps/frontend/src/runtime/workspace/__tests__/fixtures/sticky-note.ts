import { z } from 'zod'
import type { SurfaceManifest, SurfaceEnvelope } from '@/runtime/surface-registry/types'

const StickyPayload = z.object({ text: z.string() })

export const stickyManifest: SurfaceManifest<typeof StickyPayload> = {
  id: 'sticky_note',
  version: '1.0.0',
  displayName: 'Sticky note (test fixture)',
  requiredCapabilities: [],
  visibleToRoles: ['leader', 'member'],
  envelopeSchema: StickyPayload,
  density: 'compact',
  preferredZone: 'context-rail',
  priority: 30,
  canPin: true,
  hibernatable: true,
  load: () => Promise.resolve({ default: () => null as never }),
}

export function makeStickyEnvelope(text: string): SurfaceEnvelope {
  return {
    envelopeId: `env-${Math.random().toString(36).slice(2, 10)}`,
    agentId: 'test',
    emittedAt: Date.now(),
    intent: 'render_surface',
    priority: 'low',
    surfaceId: 'sticky_note',
    payload: { text },
    context: {
      role: 'leader',
      techLevel: 'high-tech',
      phase: 'normal',
      hasActiveBlocker: false,
      workspaceId: 'default',
    },
    requiredCapabilities: [],
    hibernatable: true,
    pinnable: true,
  }
}
