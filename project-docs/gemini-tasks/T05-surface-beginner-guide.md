Sos un desarrollador senior de React. Generá el componente completo `BeginnerGuidePanel.tsx`.

## Contexto del proyecto
Crew Companion es una app de coordinación para hackathons. Este panel aparece para miembros
con nivel LOW-TECH que piden ayuda. Debe ser amigable, simple y visualmente clara.
Es una "surface" que el agente renderiza en el chat.

## Tipos necesarios

```typescript
interface BeginnerGuidePayload {
  topic: string
  steps: Array<{
    stepNumber: number
    title: string
    content: string
    tip?: string
  }>
  estimatedMinutes: number
}

interface BeginnerGuidePanelProps {
  payload: BeginnerGuidePayload
}
```

## Requerimientos visuales

```
┌──────────────────────────────────────────┐
│ 📚 Cómo instalar Node.js        ⏱ 5 min │
│ Seguí estos pasos, uno a la vez          │
├──────────────────────────────────────────┤
│ ①  Descargar el instalador               │
│    Ir a nodejs.org y bajar la versión    │
│    LTS (la más recomendada para empezar) │
│                                          │
│    💡 Tip: elegí "LTS", no "Current"    │  ← amarillo suave si hay tip
│                                          │
│ ②  Ejecutar el instalador               │
│    Abrí el archivo descargado y seguí   │
│    los pasos: siguiente, siguiente...    │
│                                          │
│ ③  Verificar instalación                │
│    Abrí una terminal y escribí:          │
│    node --version                        │
└──────────────────────────────────────────┘
```

- Header con fondo `bg-blue-50 border-blue-200`
- Tiempo estimado en badge `bg-blue-100 text-blue-700` al lado del título
- Subtítulo fijo: "Seguí estos pasos, uno a la vez"
- Número de paso en círculo `bg-blue-500 text-white rounded-full w-7 h-7`
- Título del paso en `font-medium text-slate-800`
- Contenido del paso en `text-sm text-slate-600`
- Si hay `tip`: bloque con fondo `bg-yellow-50 border-l-2 border-yellow-400 pl-3 py-1` y prefijo "💡 Tip:"
- Separador suave entre pasos

## Imports disponibles

```typescript
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
```

## Output esperado

Generá el archivo completo listo para guardar en:
`apps/frontend/src/components/surfaces/BeginnerGuidePanel.tsx`

Solo TypeScript + React + Tailwind. Sin comentarios. Sin librerías externas.
