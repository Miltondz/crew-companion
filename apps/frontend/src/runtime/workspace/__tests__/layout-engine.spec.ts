// @ts-nocheck — Vitest not installed yet; assertions documented for future.

import { describe, it, expect, beforeEach } from 'vitest'
import { LayoutEngine } from '../layout-engine'
import { surfaceRegistry } from '@/runtime/surface-registry/registry'
import { stickyManifest, makeStickyEnvelope } from './fixtures/sticky-note'

describe('LayoutEngine', () => {
  beforeEach(() => {
    surfaceRegistry.register(stickyManifest)
  })

  it.skip('mounts a surface into preferredZone', () => {
    const engine = new LayoutEngine()
    const r = engine.mount(makeStickyEnvelope('hi'))
    expect(r.ok).toBe(true)
  })

  it.skip('dedups same payload', () => {
    const engine = new LayoutEngine()
    const a = engine.mount(makeStickyEnvelope('same'))
    const b = engine.mount(makeStickyEnvelope('same'))
    expect(a.ok && b.ok && a.mountId === b.mountId).toBe(true)
  })

  it.skip('evicts oldest when capacity hit (context-rail capacity=3)', () => {
    const engine = new LayoutEngine()
    engine.mount(makeStickyEnvelope('a'))
    engine.mount(makeStickyEnvelope('b'))
    engine.mount(makeStickyEnvelope('c'))
    const fourth = engine.mount(makeStickyEnvelope('d'))
    expect(fourth.ok).toBe(true)
  })

  it.skip('pinned mount survives phase change to panic', () => {
    const engine = new LayoutEngine()
    const r = engine.mount(makeStickyEnvelope('keep me'), { pinned: true })
    engine.onPhaseChange('normal', 'panic')
    const layout = engine.getState()
    expect(layout['context-rail'].mounts.some(m => m.mountId === r.mountId)).toBe(true)
  })
})
