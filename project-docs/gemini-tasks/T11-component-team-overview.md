Sos un desarrollador senior de React. Generá el componente completo `TeamOverview.tsx`.

## Contexto del proyecto
Crew Companion es una app de coordinación para hackathons. Este componente muestra
el estado de cada miembro del equipo en la vista del líder: tareas y blockers activos.

## Tipos necesarios

```typescript
type Role = 'leader' | 'member'
type TechnicalLevel = 'low-tech' | 'high-tech'
type TaskStatus = 'todo' | 'in-progress' | 'done'

interface TeamMember {
  id: string
  name: string
  role: Role
  technicalLevel: TechnicalLevel
  activeBlockerId?: string
}

interface Task {
  id: string
  title: string
  assignedTo: string
  status: TaskStatus
}

interface Blocker {
  id: string
  memberId: string
  description: string
  resolved: boolean
}

interface TeamOverviewProps {
  members: TeamMember[]
  tasks: Task[]
  blockers: Blocker[]
}
```

## Requerimientos visuales

```
┌─────────────────────────────────────┐
│ Equipo  (3)                         │
├─────────────────────────────────────┤
│ AL  Alex (líder)         2 tareas   │  ← avatar con iniciales
│     high-tech                       │
├─────────────────────────────────────┤
│ SA  Sam              1 tarea  ⚠️    │  ← ⚠️ si tiene blocker sin resolver
│     low-tech                        │
│     "no entiendo cómo instalar npm" │  ← descripción del blocker, truncada
├─────────────────────────────────────┤
│ JO  Jordan               1 tarea   │
│     high-tech                       │
└─────────────────────────────────────┘
```

- Avatar circular con iniciales (2 letras) del nombre, `bg-slate-200 text-slate-700`
- Líderes primero, luego miembros
- Contar tareas de ese miembro que NO estén `done`
- Si tiene blocker activo (`resolved: false`): mostrar ⚠️ en naranja y la descripción del blocker truncada a 1 línea (`truncate`)
- Badge de `technicalLevel` muy pequeño: `text-xs text-slate-400`
- Si el miembro es `leader`: mostrar "(líder)" en texto pequeño gris

## Imports disponibles

```typescript
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
```

## Output esperado

Generá el archivo completo listo para guardar en:
`apps/frontend/src/components/leader/TeamOverview.tsx`

Solo TypeScript + React + Tailwind. Sin comentarios. Sin librerías externas.
