Sos un desarrollador senior de React. Generá el componente completo `TaskSuggestionPanel.tsx`.

## Contexto del proyecto
Crew Companion es una app de coordinación para hackathons con Generative UI.
Este componente es una "surface": un componente que el agente de AI renderiza dentro del chat.

## Tipos necesarios (ya definidos en el proyecto)

```typescript
type TaskPriority = 'low' | 'medium' | 'high'

interface TaskSuggestionPayload {
  suggestions: Array<{
    title: string
    description: string
    priority: TaskPriority
    assignTo?: string
    estimatedMinutes?: number
  }>
  context: string
}

interface TaskSuggestionPanelProps {
  payload: TaskSuggestionPayload
}
```

## Requerimientos visuales

```
┌──────────────────────────────────────────┐
│ 💡 Sugerencias de tareas                 │
│ Basado en el estado actual del equipo    │
├──────────────────────────────────────────┤
│ [Alta] Implementar autenticación         │
│ Crear endpoints POST /login              │
│ 👤 Jordan  ⏱ ~45 min                   │
├──────────────────────────────────────────┤
│ [Media] Escribir tests básicos           │
│ Cobertura mínima para el demo            │
│ 👤 Jordan  ⏱ ~30 min                   │
└──────────────────────────────────────────┘
```

- Header con ícono 💡 y título "Sugerencias de tareas"
- Subtítulo con el campo `context` en texto pequeño gris
- Una card por sugerencia, separadas con divisor
- Badge de prioridad: Alta=`bg-red-100 text-red-700`, Media=`bg-yellow-100 text-yellow-700`, Baja=`bg-green-100 text-green-700`
- Si hay `assignTo`: mostrar "👤 {nombre}"
- Si hay `estimatedMinutes`: mostrar "⏱ ~{N} min"
- Borde izquierdo de color en cada card: rojo=alta, amarillo=media, verde=baja

## Imports disponibles

```typescript
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
```

## Output esperado

Generá el archivo completo listo para guardar en:
`apps/frontend/src/components/surfaces/TaskSuggestionPanel.tsx`

Solo TypeScript + React + Tailwind. Sin comentarios. Sin librerías externas.
