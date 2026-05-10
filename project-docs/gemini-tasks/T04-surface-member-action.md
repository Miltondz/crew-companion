Sos un desarrollador senior de React. Generá el componente completo `MemberActionPanel.tsx`.

## Contexto del proyecto
Crew Companion es una app de coordinación para hackathons. Este panel aparece cuando hay urgencia
o cuando el líder necesita coordinar acciones del equipo. Es la surface más importante en fases
panic/expired. Es una "surface" que el agente renderiza en el chat.

## Tipos necesarios

```typescript
type UrgencyPhase = 'normal' | 'focus' | 'urgent' | 'panic' | 'expired'

interface MemberActionPayload {
  urgencyPhase: UrgencyPhase
  actions: Array<{
    label: string
    description: string
    priority: 'immediate' | 'soon' | 'optional'
    assignedTo?: string
  }>
  message: string
}

interface MemberActionPanelProps {
  payload: MemberActionPayload
}
```

## Requerimientos visuales

```
┌──────────────────────────────────────────┐  ← fondo varía según fase
│ 🚨 Acciones inmediatas                   │
│ Quedan menos de 5 minutos. Foco total.   │  ← payload.message
├──────────────────────────────────────────┤
│ ● Finalizar demo script          [YA]    │  ← priority=immediate, badge rojo
│   Para: Alex                             │
│                                          │
│ ● Hacer build de producción      [PRONTO]│  ← priority=soon, badge naranja
│   Para: Jordan                           │
│                                          │
│ ○ Actualizar README              [LUEGO] │  ← priority=optional, badge gris
└──────────────────────────────────────────┘
```

- Fondo del header según fase:
  - urgent: `bg-orange-100 border-orange-300`
  - panic: `bg-red-100 border-red-400`
  - expired: `bg-red-200 border-red-600`
  - normal/focus: `bg-slate-50 border-slate-200`
- En fase `panic` o `expired`: agregar `animate-pulse` al header
- Badge de prioridad:
  - immediate: `bg-red-500 text-white` — texto "YA"
  - soon: `bg-orange-400 text-white` — texto "PRONTO"
  - optional: `bg-slate-200 text-slate-600` — texto "LUEGO"
- Ícono ● para immediate/soon, ○ para optional
- Si hay `assignedTo`: mostrar "Para: {nombre}" en texto pequeño

## Imports disponibles

```typescript
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
```

## Output esperado

Generá el archivo completo listo para guardar en:
`apps/frontend/src/components/surfaces/MemberActionPanel.tsx`

Solo TypeScript + React + Tailwind. Sin comentarios. Sin librerías externas.
