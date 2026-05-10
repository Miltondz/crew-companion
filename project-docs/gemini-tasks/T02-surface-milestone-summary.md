Sos un desarrollador senior de React. Generá el componente completo `MilestoneSummaryPanel.tsx`.

## Contexto del proyecto
Crew Companion es una app de coordinación para hackathons con Generative UI.
Este componente es una "surface": un componente que el agente de AI renderiza dentro del chat.

## Tipos necesarios

```typescript
type UrgencyPhase = 'normal' | 'focus' | 'urgent' | 'panic' | 'expired'
type TaskStatus = 'todo' | 'in-progress' | 'done'
type TaskPriority = 'low' | 'medium' | 'high'

interface Task {
  id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  assignedTo: string
}

interface MilestoneSummaryPayload {
  milestone: { id: string; title: string; deadline: string }
  phase: UrgencyPhase
  minutesLeft: number
  completedTasks: Task[]
  pendingTasks: Task[]
  atRiskTasks: Task[]
  recommendation: string
}

interface MilestoneSummaryPanelProps {
  payload: MilestoneSummaryPayload
}
```

## Requerimientos visuales

```
┌──────────────────────────────────────────┐
│ 🎯 Demo final hackathon     [URGENTE]    │  ← header con badge de fase
│ Quedan 8 minutos                         │
├──────────────────────────────────────────┤
│ ████████████░░░  2/3 tareas              │  ← barra de progreso
├──────────────────────────────────────────┤
│ ✅ Completadas (1)                       │
│   • Diseñar la landing                   │
│                                          │
│ 🔄 Pendientes (2)                        │
│   • Implementar API                      │
│   • Preparar demo script                 │
│                                          │
│ ⚠️ En riesgo (1)                         │
│   • Implementar API                      │
├──────────────────────────────────────────┤
│ → Enfocarse en Preparar demo script      │  ← recommendation
└──────────────────────────────────────────┘
```

- El color del header cambia según `phase`:
  - normal: `bg-slate-50 text-slate-800`
  - focus: `bg-yellow-50 text-yellow-800`
  - urgent: `bg-orange-50 text-orange-900`
  - panic: `bg-red-50 text-red-900`
  - expired: `bg-red-100 text-red-950`
- Badge de fase en el header: "NORMAL" / "FOCUS" / "URGENTE" / "PÁNICO" / "EXPIRADO"
- Barra de progreso usando `<Progress value={percent} />`
- `minutesLeft` formateado: si > 60 mostrar horas, si ≤ 60 mostrar minutos
- Sección `recommendation` con flecha → y fondo levemente destacado

## Imports disponibles

```typescript
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
```

## Output esperado

Generá el archivo completo listo para guardar en:
`apps/frontend/src/components/surfaces/MilestoneSummaryPanel.tsx`

Solo TypeScript + React + Tailwind. Sin comentarios. Sin librerías externas.
