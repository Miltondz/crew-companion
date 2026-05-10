# Fase 3 — Frontend: Rutas /leader, /member, /docs

## Objetivo
Las tres rutas principales cargan con UI real conectada al store. CopilotKit está activo y el chat aparece. No hace falta que el agente responda con surfaces todavía — solo que el chat funcione.

## 3.1 CopilotKit Provider Shell

Adaptar `CopilotKitProviderShell.tsx` del starter kit. El cambio es solo el endpoint URL:

```typescript
// apps/frontend/src/components/copilot/CopilotKitProviderShell.tsx
'use client'
import { CopilotKit } from "@copilotkit/react-core"

export function CopilotKitProviderShell({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      agent="crew_agent"       // graph ID en LangGraph
      showDevConsole={process.env.NODE_ENV === 'development'}
    >
      {children}
    </CopilotKit>
  )
}
```

Envolver en `apps/frontend/src/app/layout.tsx`.

## 3.2 Vista /leader

**Estructura de componentes:**
```
LeaderPage
├── useUrgencyPhaseSync()          ← hook que recalcula fase cada 30s
├── useCopilotReadable(...)        ← expone estado al agente
├── <UrgencyBanner phase={...} />  ← banner superior con color de fase
├── <CompanionMascot />            ← mascota (esquina inferior derecha)
├── div.grid-layout
│   ├── <TaskBoard />              ← columnas todo/in-progress/done
│   ├── <MilestonePanel />         ← countdown + progreso del milestone
│   └── <TeamOverview />           ← lista de miembros + blockers activos
└── <CopilotSidebar />             ← chat (CopilotKit built-in)
```

**useCopilotReadable para el líder:**
```typescript
const { tasks, milestones, members, blockers, urgencyPhase, activeMilestoneId } = useCrewStore()

useCopilotReadable({
  description: "Estado actual del equipo y el proyecto",
  value: {
    currentMember: members.find(m => m.id === 'm1'), // hardcoded para demo
    tasks,
    milestones,
    members,
    activeBlockers: blockers.filter(b => !b.resolved),
    urgencyPhase,
    activeMilestone: milestones.find(m => m.id === activeMilestoneId)
  }
})
```

**Acciones CopilotKit (registrar en esta página):**
Ver lista completa en `agent/05-prompts-and-tools.md` — sección "Frontend Actions".

## 3.3 Vista /member/[memberId]

**Estructura:**
```
MemberPage
├── useUrgencyPhaseSync()
├── useCopilotReadable(...)        ← solo datos del miembro actual
├── <UrgencyBanner phase={...} />
├── <CompanionMascot />
├── div.main-layout
│   ├── <ActiveTaskView memberId={memberId} />   ← tarea activa del miembro
│   ├── <MilestoneCountdown />                   ← countdown grande
│   └── <BlockerButton memberId={memberId} />    ← botón "Tengo un blocker"
└── <CopilotSidebar />
```

**useCopilotReadable para el miembro:**
```typescript
useCopilotReadable({
  description: "Estado personal del miembro en el proyecto",
  value: {
    currentMember: members.find(m => m.id === memberId),
    myTasks: tasks.filter(t => t.assignedTo === memberId),
    activeMilestone: milestones.find(m => m.id === activeMilestoneId),
    urgencyPhase,
    myBlocker: blockers.find(b => b.memberId === memberId && !b.resolved),
    sharedDocuments
  }
})
```

## 3.4 Vista /docs

**Estructura:**
```
DocsPage
├── useCopilotReadable(...)        ← documentos abiertos
├── <DocumentTabs />               ← tabs de documentos abiertos
│   └── <MarkdownViewer content={...} />   ← renderizar markdown sanitizado
├── <CompanionMascot />
└── <CopilotSidebar />
```

**Markdown seguro:**
```typescript
// apps/frontend/src/lib/markdown/sanitize.ts
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'

export const SAFE_REHYPE_OPTIONS = {
  rehypePlugins: [[rehypeSanitize, {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      code: ['className'],          // allow language class
    },
    tagNames: [...(defaultSchema.tagNames ?? []), 'pre', 'code']
  }]]
}
```

## 3.5 Componente UrgencyBanner

```typescript
// apps/frontend/src/components/shared/UrgencyBanner.tsx
import { UrgencyPhase } from '@/lib/crew/types'

const PHASE_CONFIG: Record<UrgencyPhase, { bg: string; text: string; label: string }> = {
  normal:  { bg: 'bg-green-50',  text: 'text-green-800',  label: '' },
  focus:   { bg: 'bg-yellow-50', text: 'text-yellow-800', label: '⚡ Modo Focus — 15-30 min restantes' },
  urgent:  { bg: 'bg-orange-100',text: 'text-orange-900', label: '⚠️ Urgente — menos de 15 minutos' },
  panic:   { bg: 'bg-red-100',   text: 'text-red-900',    label: '🚨 PÁNICO — menos de 5 minutos' },
  expired: { bg: 'bg-red-200',   text: 'text-red-950',    label: '💀 Tiempo expirado' },
}

export function UrgencyBanner({ phase }: { phase: UrgencyPhase }) {
  const config = PHASE_CONFIG[phase]
  if (phase === 'normal') return null
  return (
    <div className={`w-full px-4 py-2 text-center font-semibold text-sm ${config.bg} ${config.text}`}>
      {config.label}
    </div>
  )
}
```

## 3.6 Botón "Simular urgencia" (solo en dev/demo)

Agregar en `/leader` para la demo:

```typescript
{process.env.NODE_ENV === 'development' && (
  <div className="fixed bottom-4 left-4 flex gap-2 text-xs">
    <button onClick={() => simulateUrgency(45)} className="bg-green-200 px-2 py-1 rounded">Normal (45m)</button>
    <button onClick={() => simulateUrgency(20)} className="bg-yellow-200 px-2 py-1 rounded">Focus (20m)</button>
    <button onClick={() => simulateUrgency(8)}  className="bg-orange-200 px-2 py-1 rounded">Urgent (8m)</button>
    <button onClick={() => simulateUrgency(3)}  className="bg-red-200 px-2 py-1 rounded">Panic (3m)</button>
  </div>
)}
```

## Criterio de completitud
- [ ] `/leader` carga con TaskBoard, MilestonePanel y chat visible
- [ ] `/member/m2` carga con tareas de Sam y countdown visible
- [ ] `/docs` carga con el documento seed renderizado en markdown
- [ ] El banner de urgencia aparece en fase `urgent` (usar botón de simulación)
- [ ] El chat envía mensajes (aunque el agente no responda bien todavía)
