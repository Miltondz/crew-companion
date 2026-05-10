Sos un desarrollador senior de React. Generá el componente completo `UrgencyBanner.tsx`.

## Contexto del proyecto
Crew Companion es una app de coordinación para hackathons. Este banner aparece en la
parte superior de todas las páginas cuando la fase de urgencia no es "normal".
Es el primer indicador visual de que el tiempo apremia.

## Tipos necesarios

```typescript
type UrgencyPhase = 'normal' | 'focus' | 'urgent' | 'panic' | 'expired'

interface UrgencyBannerProps {
  phase: UrgencyPhase
  milestoneTitle?: string   // si se provee, se muestra en el banner
}
```

## Requerimientos visuales

```
normal:  → no renderizar nada (return null)

focus:   ┌──────────────────────────────────────────────────────┐
         │  ⚡ Modo Focus — Demo final hackathon • 15-30 min    │
         └──────────────────────────────────────────────────────┘
         bg-yellow-50  text-yellow-800  border-b border-yellow-200

urgent:  ┌──────────────────────────────────────────────────────┐
         │  ⚠️ Urgente — Demo final hackathon • menos de 15 min │
         └──────────────────────────────────────────────────────┘
         bg-orange-100  text-orange-900  border-b border-orange-300

panic:   ┌──────────────────────────────────────────────────────┐
         │  🚨 PÁNICO — Demo final hackathon • menos de 5 min   │
         └──────────────────────────────────────────────────────┘
         bg-red-100  text-red-900  border-b border-red-400  animate-pulse

expired: ┌──────────────────────────────────────────────────────┐
         │  💀 Tiempo expirado — Demo final hackathon           │
         └──────────────────────────────────────────────────────┘
         bg-red-200  text-red-950  border-b border-red-600
```

- Ancho completo (`w-full`)
- Padding: `px-4 py-2`
- Texto centrado, `text-sm font-semibold`
- Si hay `milestoneTitle`: incluirlo en el texto como "— {milestoneTitle} •"
- Transición suave en los cambios de color: `transition-colors duration-500`
- Solo `animate-pulse` en fase `panic`

## Output esperado

Generá el archivo completo listo para guardar en:
`apps/frontend/src/components/shared/UrgencyBanner.tsx`

Solo TypeScript + React + Tailwind. Sin comentarios. Sin librerías externas.
