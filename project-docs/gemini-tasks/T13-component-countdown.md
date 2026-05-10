Sos un desarrollador senior de React. Generá el componente completo `MilestoneCountdown.tsx`.

## Contexto del proyecto
Crew Companion es una app de coordinación para hackathons. Este componente muestra
un countdown en vivo (actualización cada segundo) hacia el deadline del milestone activo.
El color y comportamiento cambian según la fase de urgencia.

## Tipos necesarios

```typescript
type UrgencyPhase = 'normal' | 'focus' | 'urgent' | 'panic' | 'expired'

interface MilestoneCountdownProps {
  deadline: string        // ISO date string
  milestoneTitle?: string
  compact?: boolean       // si true: versión pequeña sin título
}
```

## Lógica de fase (implementar internamente)

```typescript
function getPhase(deadlineISO: string): UrgencyPhase {
  const minutesLeft = (new Date(deadlineISO).getTime() - Date.now()) / 60000
  if (minutesLeft > 30) return 'normal'
  if (minutesLeft > 15) return 'focus'
  if (minutesLeft > 5)  return 'urgent'
  if (minutesLeft > 0)  return 'panic'
  return 'expired'
}
```

## Requerimientos visuales — versión normal (compact=false)

```
┌─────────────────────────────────────┐
│ Demo final hackathon                │  ← milestoneTitle si existe
│                                     │
│         45:23                       │  ← tiempo en GRANDE, color por fase
│         minutos restantes           │
└─────────────────────────────────────┘
```

## Requerimientos visuales — versión compact (compact=true)

```
  ⏱ 45:23
```
Solo el tiempo, en línea, tamaño normal.

## Colores por fase

```
normal:  text-green-600
focus:   text-yellow-600
urgent:  text-orange-600
panic:   text-red-600 animate-pulse
expired: text-red-800 (mostrar "Tiempo agotado" en lugar del timer)
```

## Comportamiento

- Usa `setInterval` de 1000ms dentro de `useEffect`
- Limpia el interval en el cleanup del useEffect
- Formato del tiempo:
  - Si quedan más de 60 minutos: `1h 23m 45s`
  - Si quedan menos de 60 minutos: `45:23` (mm:ss con padding de ceros)
  - Si expired: texto "¡Tiempo agotado!"
- El título `milestoneTitle` se muestra encima del número, en `text-xs text-slate-500 uppercase tracking-wide`
- En `compact=true`: solo el número, sin título, tamaño `text-sm font-mono`

## NO usar

- No importes el store de Zustand — recibe `deadline` como prop
- No uses librerías de fecha externas — solo `Date` nativo

## Output esperado

Generá el archivo completo listo para guardar en:
`apps/frontend/src/components/member/MilestoneCountdown.tsx`

Solo TypeScript + React + Tailwind. Sin comentarios. Sin librerías externas.
Usá `'use client'` al inicio (componente con estado).
