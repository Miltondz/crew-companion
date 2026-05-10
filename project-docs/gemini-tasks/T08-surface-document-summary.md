Sos un desarrollador senior de React. Generá el componente completo `DocumentSummaryPanel.tsx`.

## Contexto del proyecto
Crew Companion es una app de coordinación para hackathons. Este panel aparece cuando cualquier
usuario hace una pregunta sobre un documento compartido. El agente responde con un resumen
estructurado del documento. Es una "surface" que el agente renderiza en el chat.

## Tipos necesarios

```typescript
interface DocumentSummaryPayload {
  documentTitle: string
  summary: string
  keyPoints: string[]
  relevantSection?: string
  quote?: string
}

interface DocumentSummaryPanelProps {
  payload: DocumentSummaryPayload
}
```

## Requerimientos visuales

```
┌──────────────────────────────────────────┐
│ 📄 Stack técnico del proyecto            │  ← documentTitle
├──────────────────────────────────────────┤
│ El proyecto usa Next.js + Node.js con    │  ← summary
│ PostgreSQL como base de datos principal. │
├──────────────────────────────────────────┤
│ Puntos clave:                            │
│ • Frontend: Next.js 15                   │
│ • Backend: Hono + TypeScript             │
│ • Base de datos: PostgreSQL              │
├──────────────────────────────────────────┤  ← solo si hay relevantSection
│ 📍 Sección relevante: Instalación        │
├──────────────────────────────────────────┤  ← solo si hay quote
│ ❝ npm install && npm run dev ❞           │
└──────────────────────────────────────────┘
```

- Header con fondo `bg-slate-50 border-slate-200` e ícono 📄
- `summary` en `text-sm text-slate-700` con buen line-height
- Lista de `keyPoints` con bullets •, cada uno en línea propia
- Si hay `relevantSection`: mostrar con ícono 📍 y fondo `bg-blue-50 text-blue-700`
- Si hay `quote`: mostrar en bloque con comillas tipográficas ❝ ❞, fondo `bg-slate-100`, fuente monospace para código

## Imports disponibles

```typescript
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
```

## Output esperado

Generá el archivo completo listo para guardar en:
`apps/frontend/src/components/surfaces/DocumentSummaryPanel.tsx`

Solo TypeScript + React + Tailwind. Sin comentarios. Sin librerías externas.
