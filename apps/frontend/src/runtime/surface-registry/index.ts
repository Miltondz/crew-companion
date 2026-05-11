export { SurfaceHost, UnsupportedSurfaceCard, InvalidEnvelopeCard, SurfaceSkeleton } from './SurfaceHost'
export { surfaceRegistry } from './registry'
export { bootstrapRegistry } from './bootstrap'
export { adaptLegacyEnvelope, isLegacyEnvelope } from './adapter'
export { useRuntimeContext } from './useRuntimeContext'
export type {
  RegionId,
  Capability,
  SurfaceIntent,
  EnvelopePriority,
  RuntimeContext,
  SurfaceEnvelope,
  LegacySurfaceEnvelope,
  SurfaceProps,
  SurfaceManifest,
  ValidationResult,
  MountedSurface,
  ResolveFailure,
} from './types'
