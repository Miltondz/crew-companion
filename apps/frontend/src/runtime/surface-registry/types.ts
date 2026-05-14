// Zod v3 — if bumped to v4, ZodTypeAny import path changes. Audit here first.
import type { ComponentType } from 'react'
import type { ZodTypeAny } from 'zod'
import type { Role, TechnicalLevel, Specialization, UrgencyPhase } from '@/lib/crew/types'

// ── Region IDs ── placeholder union; 3.2 owns the canonical copy in
// apps/frontend/src/runtime/workspace/regions.ts and will re-export from there.
export type RegionId =
  | 'command-surface'
  | 'primary-workzone'
  | 'context-rail'
  | 'agent-rail'
  | 'activity-stream'
  | 'ambient-overlay'

// Opaque string in 3.1; 3.3 replaces with enum. Keep import path stable.
export type Capability = string

// Extensible intent union. 3.3 adds request_approval + tool_denied.
export type SurfaceIntent =
  | 'render_surface'
  | 'request_approval'
  | 'tool_denied'
  // Reserved for later blocks:
  // | 'set_mascot_mood'
  // | 'highlight_tasks'
  // | 'update_state'
  // | 'show_ambient_alert'

export type EnvelopePriority = 'low' | 'medium' | 'high' | 'critical'

export interface RuntimeContext {
  role: Role
  techLevel: TechnicalLevel
  specialization?: Specialization
  phase: UrgencyPhase
  hasActiveBlocker: boolean
  workspaceId: string
}

// Full envelope shape (Phase A target, per MWP 3.5.1).
// In 3.1 the BFF still emits legacy {type, payload}; adaptLegacyEnvelope lifts it.
export interface SurfaceEnvelope<TPayload = unknown> {
  envelopeId: string
  agentId: string
  emittedAt: number

  intent: SurfaceIntent
  priority: EnvelopePriority

  surfaceId: string
  payload: TPayload

  context: RuntimeContext

  requiredCapabilities: Capability[]

  hibernatable: boolean
  pinnable: boolean
  ephemeral?: number
}

// Current BFF shape — typed so the adapter has a named source and grep finds callers.
export interface LegacySurfaceEnvelope {
  type: string
  payload: Record<string, unknown>
}

// Every surface component MUST accept this exact shape.
// Adding fields here is a breaking change for all surfaces — do intentionally.
export interface SurfaceProps<TPayload = unknown> {
  payload: TPayload
  context: RuntimeContext
  envelope: SurfaceEnvelope<TPayload>
}

// Base shape used by the registry internals — envelopeSchema is ZodTypeAny,
// load returns ComponentType<SurfaceProps<any>> so typed manifests are assignable.
export interface SurfaceManifest<TSchema extends ZodTypeAny = ZodTypeAny> {
  // ── Identity ─────────────────────────────────────────────────────────
  id: string
  version: string
  displayName: string

  // ── Authorization (validated in 3.3) ─────────────────────────────────
  requiredCapabilities: Capability[]

  // ── Visibility filters ───────────────────────────────────────────────
  visibleToRoles: Role[]
  visibleToTechLevels?: TechnicalLevel[]
  visibleToSpecializations?: Specialization[]
  forbiddenInPhases?: UrgencyPhase[]

  // ── Input contract ───────────────────────────────────────────────────
  envelopeSchema: TSchema

  // ── Visual properties (consumed by 3.2 Layout Engine) ────────────────
  color?: 'red' | 'orange' | 'amber' | 'emerald' | 'indigo' | 'violet' | 'cyan' | 'slate' | 'blue'
  density: 'compact' | 'standard' | 'hero'
  preferredZone: RegionId
  minWidth?: number
  minHeight?: number

  // ── Lifecycle hooks ──────────────────────────────────────────────────
  canPin: boolean
  hibernatable: boolean
  priority: number

  // ── Lazy loader ──────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  load: () => Promise<{ default: ComponentType<SurfaceProps<any>> }>
}

// Narrow wrapper over Zod's SafeParseReturnType — callers don't need Zod internals.
export type ValidationResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: { issues: Array<{ path: (string | number)[]; message: string }> } }

export interface MountedSurface<TPayload = unknown> {
  manifest: SurfaceManifest
  Component: ComponentType<SurfaceProps<TPayload>>
}

export type ResolveFailure =
  | { reason: 'unknown_surface'; surfaceId: string }
  | { reason: 'role_mismatch'; surfaceId: string; required: Role[]; got: Role }
  | { reason: 'tech_level_mismatch'; surfaceId: string }
  | { reason: 'specialization_mismatch'; surfaceId: string; required: Specialization[]; got: Specialization | undefined }
  | { reason: 'forbidden_in_phase'; surfaceId: string; phase: UrgencyPhase }
  | { reason: 'missing_capabilities'; surfaceId: string; missing: Capability[] }
