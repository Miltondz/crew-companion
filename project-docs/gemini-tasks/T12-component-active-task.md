Sos un desarrollador senior de React. Generá el componente completo `ActiveTaskView.tsx`.

## Contexto del proyecto
Crew Companion es una app de coordinación para hackathons. Este componente muestra
la tarea activa de un miembro en su workspace personal (/member/[id]).
Si no tiene tarea asignada, muestra un estado vacío amigable.

## Tipos necesarios

```typescript
type TaskStatus = 'todo' | 'in-progress' | 'done'
type TaskPriority = 'low' | 'medium' | 'high'

interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
}

interface ActiveTaskViewProps {
  task: Task | undefined
  memberName: string
  onMarkDone?: (taskId: string) => void
}
```

## Requerimientos visuales — CON tarea

```
┌─────────────────────────────────────────┐
│ Tu tarea actual                         │
├─────────────────────────────────────────┤
│                                         │
│  Diseñar la landing page                │  ← título grande
│  Crear mockup y componentes base de la  │  ← descripción completa
│  interfaz principal                     │
│                                         │
│  [Alta prioridad]      [En progreso]    │  ← badges
│                                         │
│  [✅ Marcar como completada]            │  ← botón verde prominente
│                                         │
└─────────────────────────────────────────┘
```

## Requerimientos visuales — SIN tarea

```
┌─────────────────────────────────────────┐
│                                         │
│           📋                            │
│  Hola {memberName}, todavía no          │
│  tenés una tarea asignada.              │
│                                         │
│  Usá el chat para pedirle al líder      │
│  que te asigne una. 💬                  │
│                                         │
└─────────────────────────────────────────┘
```

- Título grande `text-xl font-semibold` cuando hay tarea
- Badge de prioridad: high=rojo, medium=amarillo, low=verde
- Badge de status: todo=gris, in-progress=azul, done=verde
- Botón "Marcar como completada" solo si `status !== 'done'` y hay `onMarkDone`
  - Color: `bg-green-500 hover:bg-green-600 text-white w-full`
- Si `status === 'done'`: mostrar mensaje "¡Tarea completada! 🎉" en verde en lugar del botón
- Estado vacío: ícono 📋 centrado, texto amigable (sin jerga técnica), mención del chat

## Imports disponibles

```typescript
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
```

## Output esperado

Generá el archivo completo listo para guardar en:
`apps/frontend/src/components/member/ActiveTaskView.tsx`

Solo TypeScript + React + Tailwind. Sin comentarios. Sin librerías externas.
