'use client'

import { use, useMemo, Suspense, useEffect } from 'react'
import { surfaceRegistry } from './registry'
import type {
  MountedSurface,
  ResolveFailure,
  RuntimeContext,
  SurfaceEnvelope,
  ValidationResult,
} from './types'
import { RuntimeFlowChannel } from '@/runtime/flow-channel/RuntimeFlowChannel'

interface SurfaceHostProps {
  envelope: SurfaceEnvelope
  context: RuntimeContext
}

/**
 * Decision tree:
 *  1. registry.mount(envelope, context, envelope.requiredCapabilities)
 *  2. resolve_failed    → <UnsupportedSurfaceCard>
 *  3. validation_failed → <InvalidEnvelopeCard>  (load() never called)
 *  4. ready → <Suspense><SurfaceLazyMount use(promise) /></Suspense>
 *
 * Page-level ErrorBoundary catches throws inside the mounted surface.
 * This component does not own that boundary; 3.2's Layout Engine wants
 * per-region boundaries.
 */
export function SurfaceHost({ envelope, context }: SurfaceHostProps) {
  // TODO(3.3): replace envelope.requiredCapabilities with real session grants from CapabilityEngine.
  // useMemo must be called unconditionally before any early return (hooks rules).
  const result = useMemo(
    () =>
      envelope.intent === 'render_surface'
        ? surfaceRegistry.mount(envelope, context, envelope.requiredCapabilities)
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [envelope.envelopeId, envelope.surfaceId, envelope.intent, context.role, context.phase],
  )

  // Non-render_surface intents are flow-control — route to sibling channel.
  if (envelope.intent !== 'render_surface') {
    return <RuntimeFlowChannel envelope={envelope} />
  }

  // result is guaranteed non-null here (useMemo returns mount result when intent === render_surface)
  if (!result) return null

  if (result.status === 'resolve_failed') {
    return <UnsupportedSurfaceCard failure={result.failure} />
  }
  if (result.status === 'validation_failed') {
    return <InvalidEnvelopeCard error={result.error} />
  }

  const { manifest, promise, data } = result

  return (
    <Suspense fallback={<SurfaceSkeleton density={manifest.density} />}>
      <SurfaceLazyMount
        promise={promise}
        data={data}
        context={context}
        envelope={envelope}
      />
    </Suspense>
  )
}

interface LazyMountProps {
  promise: Promise<MountedSurface<unknown>>
  data: unknown
  context: RuntimeContext
  envelope: SurfaceEnvelope
}

function SurfaceLazyMount({ promise, data, context, envelope }: LazyMountProps) {
  const { Component } = use(promise)
  useEffect(() => {
    console.log(`[surface] mounted envelopeId=${envelope.envelopeId} surfaceId=${envelope.surfaceId}`)
  }, [envelope.envelopeId, envelope.surfaceId])
  return <Component payload={data} context={context} envelope={envelope} />
}

// ── Error / fallback cards ────────────────────────────────────────────────

export function UnsupportedSurfaceCard({ failure }: { failure: ResolveFailure }) {
  const msg =
    failure.reason === 'unknown_surface'
      ? `Surface "${failure.surfaceId}" not registered`
      : failure.reason === 'role_mismatch'
        ? `Surface "${failure.surfaceId}" requires role ${failure.required.join(' | ')}`
        : failure.reason === 'forbidden_in_phase'
          ? `Surface "${failure.surfaceId}" unavailable in phase "${failure.phase}"`
          : failure.reason === 'tech_level_mismatch'
            ? `Surface "${failure.surfaceId}" not visible at this tech level`
            : `Surface "${failure.surfaceId}" missing capabilities`

  return (
    <div className="my-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
      <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-slate-400">
        surface · unsupported
      </p>
      <p className="text-xs text-slate-500">{msg}</p>
    </div>
  )
}

export function InvalidEnvelopeCard({
  error,
}: {
  error: NonNullable<(ValidationResult & { success: false })['error']>
}) {
  return (
    <div className="my-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm">
      <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-red-400">
        surface · invalid envelope
      </p>
      <ul className="space-y-0.5">
        {error.issues.map((issue, i) => (
          <li key={i} className="text-xs text-red-600">
            {issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''}{issue.message}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SurfaceSkeleton({ density }: { density: 'compact' | 'standard' | 'hero' }) {
  const h = density === 'hero' ? 'h-48' : density === 'standard' ? 'h-32' : 'h-16'
  return (
    <div className={`my-2 ${h} animate-pulse rounded-xl bg-slate-100`} />
  )
}
