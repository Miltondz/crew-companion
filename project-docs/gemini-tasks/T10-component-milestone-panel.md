Sos un desarrollador senior de React. Generá el componente completo `MilestonePanel.tsx`.

## Contexto del proyecto
Crew Companion es una app de coordinación para hackathons. Este panel muestra el milestone
activo en la vista del líder: progreso de tareas, deadline y estado general.

## Tipos necesarios

```typescript
type UrgencyPhase = 'normal' | 'focus' | 'urgent' | 'panic' | 'expired'
type TaskStatus = 'todo' | 'in-progress' | 'done'

interface Task {
  id: string
  title: string
  status: TaskStatus
}

interface MilestonePanelProps {
  milestone: {
    id: string
    title: string
    deadline: string    // ISO date
    taskIds: string[]
  }
  tasks: Task[]         // todas las tareas del proyecto (filtrar por taskIds internamente)
  urgencyPhase: UrgencyPhase
}
```

## Requerimientos visuales

```
┌─────────────────────────────────────────┐
│ 🎯 Demo final hackathon                 │  ← título
│    <MilestoneCountdown deadline={...} />│  ← importar este componente
│                                         │
│ ████████████░░░  2 / 3 tareas           │  ← Progress bar
│                                         │
│ ✅ Diseñar la landing                   │
│ 🔄 Implementar API de usuarios          │
│ ⬜ Preparar demo script                 │
└─────────────────────────────────────────┘
```

- Importar `MilestoneCountdown` así:
  ```typescript
  import { MilestoneCountdown } from '@/components/member/MilestoneCountdown'
  ```
- Filtrar `tasks` donde `task.id` está en `milestone.taskIds`
- Borde y fondo del card varía según `urgencyPhase`:
  - normal: `border-slate-200 bg-white`
  - focus: `border-yellow-300 bg-yellow-50`
  - urgent: `border-orange-400 bg-orange-50`
  - panic: `border-red-500 bg-red-50`
  - expired: `border-red-700 bg-red-100`
- Barra de progreso: `completedCount / totalCount * 100`
- Ícono por status: ✅ done, 🔄 in-progress, ⬜ todo
- Lista de tareas ordenada: in-progress primero, luego todo, luego done

## Imports disponibles

```typescript
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { MilestoneCountdown } from '@/components/member/MilestoneCountdown'
```

## Output esperado

Generá el archivo completo listo para guardar en:
`apps/frontend/src/components/leader/MilestonePanel.tsx`

Solo TypeScript + React + Tailwind. Sin comentarios. Sin librerías externas.
