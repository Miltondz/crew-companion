Sos un desarrollador senior de React. Generá el componente completo `TroubleshootingWizard.tsx`.

## Contexto del proyecto
Crew Companion es una app de coordinación para hackathons. Este wizard aparece para miembros
LOW-TECH que tienen un blocker activo. Muestra UNA pregunta a la vez con botones Sí/No.
Es una "surface" que el agente renderiza en el chat.

## Tipos necesarios

```typescript
interface WizardStep {
  question: string
  yesAction: string
  noAction: string
}

interface TroubleshootingPayload {
  problem: string
  steps: WizardStep[]
  resolution?: string
  escalateTo?: string
}

interface TroubleshootingWizardProps {
  payload: TroubleshootingPayload
}
```

## Requerimientos visuales y comportamiento

```
┌──────────────────────────────────────────┐
│ 🔧 Vamos a resolver esto juntos          │
│ "npm no funciona"                        │  ← problem en quote
├──────────────────────────────────────────┤
│  Paso 1 de 3                             │  ← indicador de progreso
│                                          │
│  ¿Instalaste Node.js primero?            │  ← pregunta actual
│                                          │
│  [✓ Sí, lo hice]    [✗ No lo hice]      │  ← botones grandes
└──────────────────────────────────────────┘

→ Al responder Sí: mostrar yesAction como texto y avanzar al siguiente paso
→ Al responder No: mostrar noAction como texto y quedarse en ese paso con opción "Reintentar"
→ Cuando se completan todos los pasos Y hay resolution: mostrar pantalla final verde
→ Si hay escalateTo: mostrar botón "Hablar con {nombre}" en la pantalla final
```

- Header con fondo `bg-orange-50 border-orange-200`
- El `problem` en un bloque quote con borde izquierdo naranja
- Indicador "Paso X de Y" pequeño y gris
- La pregunta en `text-base font-medium text-slate-800`
- Botón "Sí": `bg-green-500 hover:bg-green-600 text-white` ancho completo
- Botón "No": `bg-red-100 hover:bg-red-200 text-red-700` ancho completo
- Estado completamente LOCAL con `useState` para `currentStep` y `answers`
- Cuando se muestra la acción (después de responder): `bg-blue-50 p-3 rounded text-sm`
- Pantalla final: fondo `bg-green-50 text-green-800` con ✅ grande

## Imports disponibles

```typescript
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
```

## Output esperado

Generá el archivo completo listo para guardar en:
`apps/frontend/src/components/surfaces/TroubleshootingWizard.tsx`

Solo TypeScript + React + Tailwind. Sin comentarios. Sin librerías externas.
