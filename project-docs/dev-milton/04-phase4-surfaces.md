# Fase 4 — Surfaces + Countdown + Mascota

## Objetivo
Las 8 surfaces del MVP están implementadas y el agente las puede renderizar. La mascota cambia de estado. El countdown es visual y reactivo.

## 4.1 SurfaceRenderer (dispatcher)

```typescript
// apps/frontend/src/components/surfaces/SurfaceRenderer.tsx
import { SurfaceEnvelope } from '@/lib/crew/types'
import { TaskSuggestionPanel } from './TaskSuggestionPanel'
import { MilestoneSummaryPanel } from './MilestoneSummaryPanel'
import { BlockerInsightPanel } from './BlockerInsightPanel'
import { MemberActionPanel } from './MemberActionPanel'
import { BeginnerGuidePanel } from './BeginnerGuidePanel'
import { ChecklistPanel } from './ChecklistPanel'
import { TroubleshootingWizard } from './TroubleshootingWizard'
import { DocumentSummaryPanel } from './DocumentSummaryPanel'

export function SurfaceRenderer({ envelope }: { envelope: SurfaceEnvelope<unknown> }) {
  switch (envelope.type) {
    case 'task_suggestion_panel':    return <TaskSuggestionPanel payload={envelope.payload as any} />
    case 'milestone_summary_panel':  return <MilestoneSummaryPanel payload={envelope.payload as any} />
    case 'blocker_insight_panel':    return <BlockerInsightPanel payload={envelope.payload as any} />
    case 'member_action_panel':      return <MemberActionPanel payload={envelope.payload as any} />
    case 'beginner_guide_panel':     return <BeginnerGuidePanel payload={envelope.payload as any} />
    case 'checklist_panel':          return <ChecklistPanel payload={envelope.payload as any} />
    case 'troubleshooting_wizard':   return <TroubleshootingWizard payload={envelope.payload as any} />
    case 'document_summary_panel':   return <DocumentSummaryPanel payload={envelope.payload as any} />
    default: return <div className="text-sm text-gray-500 p-4 border rounded">Surface desconocida: {envelope.type}</div>
  }
}
```

Los payloads de cada surface están definidos en `agent/04-surface-matrix.md`.

**Nota para la colaboradora:** Ella construye los componentes individuales (TaskSuggestionPanel, etc.). Tú conectas el SurfaceRenderer y el `useCopilotAction('renderSurface')`.

## 4.2 Registrar renderSurface en CopilotKit

En cada página que usa el chat, registrar la acción:

```typescript
useCopilotAction({
  name: "renderSurface",
  description: "Renderiza un componente UI tipado en el chat",
  parameters: [{ name: "envelope", type: "object", required: true }],
  render: ({ args }) => <SurfaceRenderer envelope={args.envelope} />,
})
```

## 4.3 MilestoneCountdown

```typescript
// apps/frontend/src/components/member/MilestoneCountdown.tsx
'use client'
import { useState, useEffect } from 'react'
import { useCrewStore } from '@/lib/crew/store'
import { getUrgencyPhase } from '@/lib/crew/derive'
import { UrgencyPhase } from '@/lib/crew/types'

const PHASE_COLORS: Record<UrgencyPhase, string> = {
  normal:  'text-green-600',
  focus:   'text-yellow-600',
  urgent:  'text-orange-600',
  panic:   'text-red-600 animate-pulse',
  expired: 'text-red-800 line-through',
}

export function MilestoneCountdown() {
  const { milestones, activeMilestoneId } = useCrewStore()
  const milestone = milestones.find(m => m.id === activeMilestoneId)
  const [timeLeft, setTimeLeft] = useState('')
  const [phase, setPhase] = useState<UrgencyPhase>('normal')

  useEffect(() => {
    if (!milestone) return
    const update = () => {
      const ms = new Date(milestone.deadline).getTime() - Date.now()
      const p = getUrgencyPhase(milestone.deadline)
      setPhase(p)
      if (ms <= 0) { setTimeLeft('¡Tiempo agotado!'); return }
      const h = Math.floor(ms / 3600000)
      const m = Math.floor((ms % 3600000) / 60000)
      const s = Math.floor((ms % 60000) / 1000)
      setTimeLeft(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [milestone])

  if (!milestone) return null

  return (
    <div className="text-center">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{milestone.title}</p>
      <p className={`text-4xl font-mono font-bold ${PHASE_COLORS[phase]}`}>{timeLeft}</p>
    </div>
  )
}
```

## 4.4 CompanionMascot

La colaboradora construye el SVG y animaciones (ver `dev-companion/01-components.md`).
Tú solo necesitas el wrapper que lee del store:

```typescript
// apps/frontend/src/components/mascot/CompanionMascot.tsx
'use client'
import { useCrewStore } from '@/lib/crew/store'
import { MascotSVG } from './MascotSVG'   // ← la colaboradora implementa esto

export function CompanionMascot() {
  const { mascotMood, mascotMode } = useCrewStore()
  return (
    <div className="fixed bottom-6 right-6 z-50 w-16 h-16">
      <MascotSVG mood={mascotMood} mode={mascotMode} />
    </div>
  )
}
```

## 4.5 Integrar todas las Frontend Actions

En `apps/frontend/src/app/leader/page.tsx` y `member/[memberId]/page.tsx`, registrar **todas** las acciones de `agent/05-prompts-and-tools.md`:

- `setCrewState`
- `updateTask`
- `setMascotMood`
- `renderSurface`
- `highlightTasks`
- `setActiveView`
- `reportBlocker`

## Criterio de completitud
- [ ] Escribir en el chat: "muéstrame un panel de tareas" → aparece `task_suggestion_panel` (puede ser con datos mock inicialmente)
- [ ] `simulateUrgency(3)` → countdown cambia a rojo con `animate-pulse`, mascota cambia a `panic`
- [ ] `simulateUrgency(45)` → todo vuelve a verde, mascota a `calm`
- [ ] Sam (`/member/m2`) ve su countdown y su tarea activa
- [ ] La mascota es visible en todas las rutas
