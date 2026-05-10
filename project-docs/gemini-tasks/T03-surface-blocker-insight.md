Sos un desarrollador senior de React. Generá el componente completo `BlockerInsightPanel.tsx`.

## Contexto del proyecto
Crew Companion es una app de coordinación para hackathons con Generative UI.
Este componente lo ve el LÍDER cuando un miembro reporta un blocker. Es una "surface" que el agente renderiza en el chat.

## Tipos necesarios

```typescript
type TechnicalLevel = 'low-tech' | 'high-tech'

interface BlockerInsightPayload {
  blocker: {
    id: string
    description: string
    reportedAt: string   // ISO date
  }
  member: {
    name: string
    technicalLevel: TechnicalLevel
  }
  possibleCauses: string[]
  suggestedActions: Array<{
    action: string
    forTechnicalLevel: TechnicalLevel | 'all'
  }>
  canReassignTask: boolean
}

interface BlockerInsightPanelProps {
  payload: BlockerInsightPayload
}
```

## Requerimientos visuales

```
┌──────────────────────────────────────────┐
│ ⚠️ Blocker reportado                     │
│ Sam  •  low-tech  •  hace 5 minutos      │
├──────────────────────────────────────────┤
│ "no entiendo cómo instalar npm"          │  ← descripción en quote
├──────────────────────────────────────────┤
│ Posibles causas:                         │
│ • Node.js no instalado                   │
│ • Error de permisos en la carpeta        │
├──────────────────────────────────────────┤
│ Acciones sugeridas:                      │
│ • Compartir guía de instalación  [todos] │
│ • Reasignar tarea a Jordan    [high-tech]│
│                                          │
│ [Reasignar tarea]   ← si canReassignTask │
└──────────────────────────────────────────┘
```

- Header con fondo `bg-orange-50 border-orange-200`
- Descripción del blocker en un `<blockquote>` con borde izquierdo naranja
- `reportedAt` formateado como "hace X minutos" (calcular desde ahora)
- Badge de `technicalLevel`: low-tech=gris, high-tech=azul
- Las acciones muestran un badge pequeño con el `forTechnicalLevel`
- Botón "Reasignar tarea" solo si `canReassignTask` es true (por ahora sin handler, `onClick={() => {}}`)

## Imports disponibles

```typescript
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
```

## Output esperado

Generá el archivo completo listo para guardar en:
`apps/frontend/src/components/surfaces/BlockerInsightPanel.tsx`

Solo TypeScript + React + Tailwind. Sin comentarios. Sin librerías externas.
