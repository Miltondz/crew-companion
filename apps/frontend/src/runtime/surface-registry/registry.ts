// Pure TS — no React imports. Keeps registry trivially unit-testable without a DOM.
import type {
  Capability,
  MountedSurface,
  ResolveFailure,
  RuntimeContext,
  SurfaceEnvelope,
  SurfaceIntent,
  SurfaceManifest,
  ValidationResult,
} from './types'

class SurfaceRegistry {
  private surfaces = new Map<string, SurfaceManifest>()
  // Stable promise cache — one per manifest for the registry's lifetime.
  // React 19 use() requires consistent promise identity across renders.
  private loadCache = new Map<string, Promise<MountedSurface<unknown>>>()

  register(manifest: SurfaceManifest): void {
    if (!manifest.id) throw new Error('SurfaceRegistry: manifest.id is required')
    if (!manifest.version) throw new Error(`SurfaceRegistry: manifest "${manifest.id}" missing version`)
    if (!manifest.envelopeSchema) throw new Error(`SurfaceRegistry: manifest "${manifest.id}" missing envelopeSchema`)
    if (typeof manifest.load !== 'function') throw new Error(`SurfaceRegistry: manifest "${manifest.id}" load must be a function`)

    const existing = this.surfaces.get(manifest.id)
    if (existing) {
      // Idempotent for identical object references (handles HMR calling bootstrap twice).
      if (existing === manifest) return
      throw new Error(`SurfaceRegistry: duplicate manifest id "${manifest.id}" — re-registration with different object rejected`)
    }

    this.surfaces.set(manifest.id, manifest)
  }

  get(surfaceId: string): SurfaceManifest | null {
    return this.surfaces.get(surfaceId) ?? null
  }

  resolve(
    intent: SurfaceIntent,
    surfaceId: string,
    context: RuntimeContext,
    requiredCapabilities: Capability[],
    grantedCapabilities: Capability[],
  ): { ok: true; manifest: SurfaceManifest } | { ok: false; failure: ResolveFailure } {
    // Only render_surface handled in 3.1; future intents extend here.
    if (intent !== 'render_surface') {
      return { ok: false, failure: { reason: 'unknown_surface', surfaceId } }
    }

    const manifest = this.surfaces.get(surfaceId)
    if (!manifest) {
      return { ok: false, failure: { reason: 'unknown_surface', surfaceId } }
    }

    if (manifest.visibleToRoles.length > 0 && !manifest.visibleToRoles.includes(context.role)) {
      return {
        ok: false,
        failure: { reason: 'role_mismatch', surfaceId, required: manifest.visibleToRoles, got: context.role },
      }
    }

    if (
      manifest.visibleToTechLevels &&
      manifest.visibleToTechLevels.length > 0 &&
      !manifest.visibleToTechLevels.includes(context.techLevel)
    ) {
      return { ok: false, failure: { reason: 'tech_level_mismatch', surfaceId } }
    }

    if (
      manifest.visibleToSpecializations &&
      manifest.visibleToSpecializations.length > 0 &&
      (!context.specialization || !manifest.visibleToSpecializations.includes(context.specialization))
    ) {
      return {
        ok: false,
        failure: {
          reason: 'specialization_mismatch',
          surfaceId,
          required: manifest.visibleToSpecializations,
          got: context.specialization,
        },
      }
    }

    if (manifest.forbiddenInPhases && manifest.forbiddenInPhases.includes(context.phase)) {
      return { ok: false, failure: { reason: 'forbidden_in_phase', surfaceId, phase: context.phase } }
    }

    // Capability check. layout-engine.mount() bypasses this path entirely — it uses
    // surfaceRegistry.get() directly. When called via SurfaceHost the caller passes
    // envelope.requiredCapabilities as grantedCapabilities, so the filter always passes.
    // TODO(3.3): route layout-engine through registry.resolve() and pass real grants
    // from CapabilityEngine instead of echoing envelope.requiredCapabilities.
    const missing = manifest.requiredCapabilities.filter(c => !grantedCapabilities.includes(c))
    if (missing.length > 0) {
      return { ok: false, failure: { reason: 'missing_capabilities', surfaceId, missing } }
    }

    return { ok: true, manifest }
  }

  validate<T>(payload: unknown, manifest: SurfaceManifest): ValidationResult<T> {
    const result = manifest.envelopeSchema.safeParse(payload)
    if (result.success) {
      return { success: true, data: result.data as T }
    }
    return {
      success: false,
      error: {
        issues: result.error.issues.map(i => ({
          path: i.path as (string | number)[],
          message: i.message,
        })),
      },
    }
  }

  loadPromise<T>(manifest: SurfaceManifest): Promise<MountedSurface<T>> {
    const cached = this.loadCache.get(manifest.id)
    if (cached) return cached as Promise<MountedSurface<T>>

    // Rejected promises are cached intentionally — a failed load() is a real bug, not a transient error, and retrying would silently mask it.
    const promise = manifest.load().then(mod => ({
      manifest,
      Component: mod.default,
    })) as Promise<MountedSurface<T>>

    this.loadCache.set(manifest.id, promise as Promise<MountedSurface<unknown>>)
    return promise
  }

  mount<T>(
    envelope: SurfaceEnvelope<T>,
    context: RuntimeContext,
    grantedCapabilities: Capability[],
  ):
    | { status: 'ready'; manifest: SurfaceManifest; promise: Promise<MountedSurface<T>>; data: T }
    | { status: 'resolve_failed'; failure: ResolveFailure }
    | { status: 'validation_failed'; error: NonNullable<ValidationResult<T> & { success: false }>['error'] } {
    const resolved = this.resolve(
      envelope.intent,
      envelope.surfaceId,
      context,
      envelope.requiredCapabilities,
      grantedCapabilities,
    )
    if (!resolved.ok) return { status: 'resolve_failed', failure: resolved.failure }

    const validation = this.validate<T>(envelope.payload, resolved.manifest)
    if (!validation.success) return { status: 'validation_failed', error: validation.error }

    return {
      status: 'ready',
      manifest: resolved.manifest,
      promise: this.loadPromise<T>(resolved.manifest),
      data: validation.data,
    }
  }

  __resetForTests(): void {
    this.surfaces.clear()
    this.loadCache.clear()
  }

  listIds(): string[] {
    return [...this.surfaces.keys()]
  }
}

export const surfaceRegistry = new SurfaceRegistry()
