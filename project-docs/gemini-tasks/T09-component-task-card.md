Sos un desarrollador senior de React. Generá el componente completo `TaskCard.tsx`.

## Contexto del proyecto
Crew Companion es una app de coordinación para hackathons. Este componente muestra
una tarea individual en el tablero kanban del líder. Debe ser compacto y claro.

## Tipos necesarios

```typescript
type TaskStatus = 'todo' | 'in-progress' | 'done'
type TaskPriority = 'low' | 'medium' | 'high'

interface TaskCardProps {
  task: {
    id: string
    title: string
    description: string
    status: TaskStatus
    priority: TaskPriority
    assignedTo: string   // nombre del miembro ya resuelto (string, no id)
  }
  isHighlighted?: boolean
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void
}
```

## Requerimientos visuales

```
┌────────────────────────────────────┐  ← borde azul si isHighlighted
│ [Alta]                             │
│ Diseñar la landing page            │
│ Crear mockup y componentes base... │  ← truncar a 2 líneas
│ ─────────────────────────────────  │
│ 👤 Sam              [En progreso]  │
└────────────────────────────────────┘
```

- Tamaño compacto, width completo del contenedor padre
- Badge de prioridad arriba a la izquierda:
  - high: `bg-red-100 text-red-700`
  - medium: `bg-yellow-100 text-yellow-700`
  - low: `bg-green-100 text-green-700`
- Título en `font-medium text-slate-800 text-sm`
- Descripción truncada con `line-clamp-2 text-xs text-slate-500`
- Footer con asignado y badge de status:
  - todo: `bg-slate-100 text-slate-600` — "Pendiente"
  - in-progress: `bg-blue-100 text-blue-700` — "En progreso"
  - done: `bg-green-100 text-green-700` — "Completado"
- Si `isHighlighted`: `border-2 border-blue-400 shadow-md`
- Click en badge de status → cicla al siguiente estado y llama `onStatusChange`
- Orden del ciclo: todo → in-progress → done → todo

## Imports disponibles

```typescript
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
```

## Output esperado

Generá el archivo completo listo para guardar en:
`apps/frontend/src/components/shared/TaskCard.tsx`

Solo TypeScript + React + Tailwind. Sin comentarios. Sin librerías externas.
