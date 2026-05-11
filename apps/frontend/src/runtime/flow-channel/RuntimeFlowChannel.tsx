'use client'

import type { SurfaceEnvelope } from '@/runtime/surface-registry/types'
import { ApprovalGate } from '@/components/runtime/ApprovalGate'
import type { PendingAction } from '@/components/runtime/ApprovalGate'
import { ToolDeniedNotice } from '@/components/runtime/ToolDeniedNotice'

interface RuntimeFlowChannelProps {
  envelope: SurfaceEnvelope
}

/**
 * Handles non-surface flow-control envelopes (approval gates, denial notices).
 * Peer to SurfaceHost — never routed through the Surface Registry.
 * Caller branches on envelope.intent: 'render_surface' → SurfaceHost, else → here.
 */
export function RuntimeFlowChannel({ envelope }: RuntimeFlowChannelProps) {
  switch (envelope.intent) {
    case 'request_approval':
      return <ApprovalGate pendingAction={envelope.payload as PendingAction} />
    case 'tool_denied': {
      const p = envelope.payload as { tool: string; reason: string; capabilities?: string[]; phase?: string }
      return (
        <ToolDeniedNotice
          tool={p.tool}
          reason={p.reason}
          capabilities={p.capabilities}
          phase={p.phase}
        />
      )
    }
    default:
      return null
  }
}
