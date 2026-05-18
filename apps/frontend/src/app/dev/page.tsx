'use client'

import { notFound } from 'next/navigation'
import { DevToolsResync } from './DevToolsResync'
import CountdownCritical from '@/components/surfaces/CountdownCritical/CountdownCritical'
import type { CountdownCriticalPayload } from '@/components/surfaces/CountdownCritical/manifest'
import type { RuntimeContext, SurfaceEnvelope } from '@/runtime/surface-registry/types'

const MOCK_CONTEXT: RuntimeContext = {
  role: 'leader',
  techLevel: 'high-tech',
  phase: 'panic',
  hasActiveBlocker: true,
  workspaceId: 'dev-preview',
}

function mockEnvelope(payload: CountdownCriticalPayload): SurfaceEnvelope<CountdownCriticalPayload> {
  return {
    envelopeId: 'dev-env-1',
    agentId: 'dev-agent',
    emittedAt: Date.now(),
    intent: 'render_surface',
    priority: 'high',
    surfaceId: 'countdown_critical',
    payload,
    context: MOCK_CONTEXT,
    requiredCapabilities: ['state.read'],
    hibernatable: false,
    pinnable: false,
  }
}

const DEADLINE = new Date(Date.now() + 25 * 60 * 1000).toISOString()

const BASE = {
  deadline: DEADLINE,
  title: '🚨 Sprint Final — Entrega 18:00',
  viabilityScore: 62,
  criticalBlockers: [
    { id: '1', text: 'API auth falla en producción', resolved: false },
    { id: '2', text: 'Migración de BD pendiente', resolved: true },
    { id: '3', text: 'Responsividad móvil rota', resolved: false },
  ],
  featuresToCut: [
    { id: '1', name: 'Dashboard de analytics', timeSavedMinutes: 90 },
    { id: '2', name: 'Notificaciones en tiempo real', timeSavedMinutes: 45 },
    { id: '3', name: 'Personalización de perfil', timeSavedMinutes: 20 },
  ],
}

const CASES = [
  { label: 'compact · vertical (default)', props: { variant: 'compact' as const, orientation: 'vertical' as const } },
  { label: 'compact · horizontal', props: { variant: 'compact' as const, orientation: 'horizontal' as const } },
  { label: 'full · vertical', props: { variant: 'full' as const, orientation: 'vertical' as const } },
  { label: 'full · horizontal', props: { variant: 'full' as const, orientation: 'horizontal' as const } },
  { label: 'timer only (compact)', props: { variant: 'compact' as const, showBlockers: false, showFeatures: false } },
  { label: 'timer only (full)', props: { variant: 'full' as const, showBlockers: false, showFeatures: false } },
]

export default function DevPage() {
  if (process.env.NODE_ENV === 'production') notFound()
  return (
    <div className="min-h-screen bg-zinc-950 p-8 flex flex-col gap-14">
      <h1 className="text-white text-2xl font-bold">Dev Tools</h1>
      <DevToolsResync />
      <h2 className="text-zinc-400 text-lg font-semibold">CountdownCritical — todas las variantes</h2>
      {CASES.map(({ label, props }) => (
        <section key={label} className="flex flex-col gap-3">
          <h2 className="text-zinc-400 text-xs font-semibold uppercase tracking-widest">{label}</h2>
          {(() => {
            const p = { ...BASE, ...props } as CountdownCriticalPayload
            return <CountdownCritical payload={p} context={MOCK_CONTEXT} envelope={mockEnvelope(p)} />
          })()}
        </section>
      ))}
    </div>
  )
}
