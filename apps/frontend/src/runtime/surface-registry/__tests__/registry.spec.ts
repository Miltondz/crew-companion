import { describe, it, expect, beforeEach } from 'vitest'
import { surfaceRegistry } from '../registry'
import { fixtureOkManifest } from './fixtures/fixture.ok'
import { fixtureBadManifest, fixtureBadPayload } from './fixtures/fixture.bad'
import type { RuntimeContext } from '../types'

const baseContext: RuntimeContext = {
  role: 'leader',
  techLevel: 'high-tech',
  phase: 'normal',
  hasActiveBlocker: false,
  workspaceId: 'test',
}

describe('SurfaceRegistry', () => {
  beforeEach(() => {
    surfaceRegistry.__resetForTests()
  })

  // ── register ──────────────────────────────────────────────────────────────

  it('register accepts a valid manifest', () => {
    expect(() => surfaceRegistry.register(fixtureOkManifest)).not.toThrow()
    expect(surfaceRegistry.listIds()).toContain('__fixture_ok')
  })

  it('register throws on duplicate id with different object', () => {
    surfaceRegistry.register(fixtureOkManifest)
    expect(() =>
      surfaceRegistry.register({ ...fixtureOkManifest }),
    ).toThrow(/duplicate manifest id/)
  })

  it('register is idempotent for the same object reference', () => {
    surfaceRegistry.register(fixtureOkManifest)
    expect(() => surfaceRegistry.register(fixtureOkManifest)).not.toThrow()
  })

  // ── resolve ───────────────────────────────────────────────────────────────

  it('resolve returns manifest for matching context', () => {
    surfaceRegistry.register(fixtureOkManifest)
    const result = surfaceRegistry.resolve(
      'render_surface',
      '__fixture_ok',
      baseContext,
      [],
      [],
    )
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.manifest.id).toBe('__fixture_ok')
  })

  it('resolve returns unknown_surface for unregistered id', () => {
    const result = surfaceRegistry.resolve('render_surface', 'not_registered', baseContext, [], [])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.failure.reason).toBe('unknown_surface')
  })

  it('resolve returns role_mismatch when role not in visibleToRoles', () => {
    const leaderOnly = { ...fixtureOkManifest, id: '__leader_only', visibleToRoles: ['leader'] as const }
    surfaceRegistry.register(leaderOnly)
    const result = surfaceRegistry.resolve(
      'render_surface',
      '__leader_only',
      { ...baseContext, role: 'member' },
      [],
      [],
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.failure.reason).toBe('role_mismatch')
  })

  it('resolve returns forbidden_in_phase when phase is forbidden', () => {
    const noPanic = {
      ...fixtureOkManifest,
      id: '__no_panic',
      forbiddenInPhases: ['panic'] as const,
    }
    surfaceRegistry.register(noPanic)
    const result = surfaceRegistry.resolve(
      'render_surface',
      '__no_panic',
      { ...baseContext, phase: 'panic' },
      [],
      [],
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.failure.reason).toBe('forbidden_in_phase')
  })

  // ── validate ──────────────────────────────────────────────────────────────

  it('validate passes for correct payload', () => {
    surfaceRegistry.register(fixtureOkManifest)
    const result = surfaceRegistry.validate({ message: 'hello', count: 3 }, fixtureOkManifest)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual({ message: 'hello', count: 3 })
  })

  it('validate fails for wrong-typed payload', () => {
    surfaceRegistry.register(fixtureBadManifest)
    const result = surfaceRegistry.validate(fixtureBadPayload, fixtureBadManifest)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues.length).toBeGreaterThan(0)
  })

  // ── mount ─────────────────────────────────────────────────────────────────

  it('mount returns ready for valid envelope', () => {
    surfaceRegistry.register(fixtureOkManifest)
    const result = surfaceRegistry.mount(
      {
        envelopeId: 'test-1',
        agentId: 'test',
        emittedAt: Date.now(),
        intent: 'render_surface',
        priority: 'medium',
        surfaceId: '__fixture_ok',
        payload: { message: 'hi', count: 1 },
        context: baseContext,
        requiredCapabilities: [],
        hibernatable: true,
        pinnable: true,
      },
      baseContext,
      [],
    )
    expect(result.status).toBe('ready')
  })

  it('mount returns validation_failed for invalid payload', () => {
    surfaceRegistry.register(fixtureBadManifest)
    const result = surfaceRegistry.mount(
      {
        envelopeId: 'test-2',
        agentId: 'test',
        emittedAt: Date.now(),
        intent: 'render_surface',
        priority: 'medium',
        surfaceId: '__fixture_bad',
        payload: fixtureBadPayload,
        context: baseContext,
        requiredCapabilities: [],
        hibernatable: true,
        pinnable: true,
      },
      baseContext,
      [],
    )
    expect(result.status).toBe('validation_failed')
  })

  it('mount returns resolve_failed for unregistered surface', () => {
    const result = surfaceRegistry.mount(
      {
        envelopeId: 'test-3',
        agentId: 'test',
        emittedAt: Date.now(),
        intent: 'render_surface',
        priority: 'medium',
        surfaceId: 'not_registered',
        payload: {},
        context: baseContext,
        requiredCapabilities: [],
        hibernatable: true,
        pinnable: true,
      },
      baseContext,
      [],
    )
    expect(result.status).toBe('resolve_failed')
  })
})
