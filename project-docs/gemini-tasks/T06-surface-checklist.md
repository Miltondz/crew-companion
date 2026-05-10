Sos un desarrollador senior de React. Generá el componente completo `ChecklistPanel.tsx`.

## Contexto del proyecto
Crew Companion es una app de coordinación para hackathons. Este panel se usa para miembros
HIGH-TECH que necesitan una lista de pasos accionables. Los ítems son clickeables.
Es una "surface" que el agente renderiza en el chat.

## Tipos necesarios

```typescript
type TaskPriority = 'low' | 'medium' | 'high'

interface ChecklistItem {
  id: string
  text: string
  done: boolean
  priority?: TaskPriority
}

interface ChecklistPayload {
  title: string
  items: ChecklistItem[]
  completionMessage?: string
}

interface ChecklistPanelProps {
  payload: ChecklistPayload
}
```

## Requerimientos visuales

```
┌──────────────────────────────────────────┐
│ ✅ Pasos para el deploy                  │
│ 1 / 3 completados  ████░░░░░░░           │
├──────────────────────────────────────────┤
│ ☑  Hacer build: npm run build     [Alta] │  ← done=true: tachado + check verde
│ ☐  Subir a Vercel                 [Alta] │  ← done=false: clickeable
│ ☐  Verificar variables de entorno [Media]│
├──────────────────────────────────────────┤
│ 🎉 ¡Listo para el deploy!                │  ← solo si todos done + completionMessage
└──────────────────────────────────────────┘
```

- Header con ícono ✅ y el `title`
- Barra de progreso y contador "X / Y completados"
- Cada ítem tiene un checkbox clickeable (estado local con `useState`)
- Ítem completado: texto tachado `line-through text-slate-400` + checkbox verde ✓
- Ítem pendiente: texto normal + checkbox vacío □ — cursor pointer
- Badge de prioridad opcional: Alta=rojo, Media=amarillo, Baja=verde (pequeño, `text-xs`)
- Si todos están completados Y hay `completionMessage`: mostrar en `bg-green-50 text-green-700` al fondo
- El estado de `done` es LOCAL (useState inicializado con el payload) — no llama a ninguna API

## Imports disponibles

```typescript
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
```

## Output esperado

Generá el archivo completo listo para guardar en:
`apps/frontend/src/components/surfaces/ChecklistPanel.tsx`

Solo TypeScript + React + Tailwind. Sin comentarios. Sin librerías externas.
