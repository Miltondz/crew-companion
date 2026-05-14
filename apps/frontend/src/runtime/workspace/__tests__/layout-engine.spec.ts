import { describe, it, expect, beforeEach } from 'vitest'
import { LayoutEngine } from '../layout-engine'
import { surfaceRegistry } from '@/runtime/surface-registry/registry'
import type { RuntimeContext } from '@/runtime/surface-registry/types'
import { stickyManifest, makeStickyEnvelope } from './fixtures/sticky-note'

const baseContext: RuntimeContext = {
  role: 'leader',
  techLevel: 'high-tech',
  phase: 'normal',
  hasActiveBlocker: false,
  workspaceId: 'default',
}

describe('LayoutEngine', () => {
  beforeEach(() => {
    surfaceRegistry.__resetForTests()
    surfaceRegistry.register(stickyManifest)
  })

  it('mounts a surface into preferredZone', () => {
    const engine = new LayoutEngine()
    const r = engine.mount(makeStickyEnvelope('hi'), baseContext)
    expect(r.ok).toBe(true)
  })

  it('dedups same payload', () => {
    const engine = new LayoutEngine()
    const a = engine.mount(makeStickyEnvelope('same'), baseContext)
    const b = engine.mount(makeStickyEnvelope('same'), baseContext)
    expect(a.ok).toBe(true)
    expect(b.ok).toBe(true)
    if (!a.ok || !b.ok) return
    expect(a.mountId).toBe(b.mountId)
  })

  it('evicts oldest when capacity hit (context-rail capacity=3)', () => {
    const engine = new LayoutEngine()
    engine.mount(makeStickyEnvelope('a'), baseContext)
    engine.mount(makeStickyEnvelope('b'), baseContext)
    engine.mount(makeStickyEnvelope('c'), baseContext)
    const fourth = engine.mount(makeStickyEnvelope('d'), baseContext)
    expect(fourth.ok).toBe(true)
  })

  it('pinned mount survives phase change to panic', () => {
    const engine = new LayoutEngine()
    const r = engine.mount(makeStickyEnvelope('keep me'), baseContext, { pinned: true })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    engine.onPhaseChange('normal', 'panic')
    const layout = engine.getState()
    expect(layout['context-rail'].mounts.some(m => m.mountId === r.mountId)).toBe(true)
  })

  it('blocks mount for wrong role', () => {
    const engine = new LayoutEngine()
    const memberContext: RuntimeContext = { ...baseContext, role: 'coach' }
    const r = engine.mount(makeStickyEnvelope('coach trying'), memberContext)
    expect(r.ok).toBe(false)
  })

  it('unmount removes surface from region', () => {
    const engine = new LayoutEngine()
    const r = engine.mount(makeStickyEnvelope('bye'), baseContext)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const removed = engine.unmount(r.mountId)
    expect(removed).toBe(true)
    expect(engine.getState()['context-rail'].mounts).toHaveLength(0)
  })

  it('pinned mount refuses unmount without force', () => {
    const engine = new LayoutEngine()
    const r = engine.mount(makeStickyEnvelope('pinned'), baseContext, { pinned: true })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const removed = engine.unmount(r.mountId)
    expect(removed).toBe(false)
  })
})
