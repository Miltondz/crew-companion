Sos un desarrollador senior de React. Generá el componente completo `MascotSVG.tsx`.

## Contexto del proyecto
Crew Companion es una app de coordinación para hackathons. La mascota es un compañero
visual persistente en la esquina inferior derecha que refleja el estado emocional
del equipo según la urgencia y los blockers activos.

## Tipos necesarios

```typescript
type MascotMood = 'calm' | 'focus' | 'worried' | 'panic' | 'celebrate'
type MascotMode = 'idle' | 'hint' | 'alert' | 'action'

interface MascotSVGProps {
  mood: MascotMood
  mode: MascotMode
}
```

## Requerimientos

Implementá la mascota usando **SVG inline** (no emojis, no imágenes externas).
La criatura debe ser simple: un blob/personaje redondeado con ojos y boca.

### Características visuales por mood

```
calm      → cuerpo azul claro (#93C5FD), ojos normales (círculos), boca curva hacia arriba
focus     → cuerpo amarillo (#FCD34D), ojos concentrados (cejas levemente hacia abajo en V suave)
worried   → cuerpo naranja (#FB923C), ojos grandes, cejas arqueadas hacia arriba, boca abierta
panic     → cuerpo rojo (#F87171), ojos MUY grandes, gotas de sudor, boca abierta más grande
celebrate → cuerpo verde (#86EFAC), ojos cerrados con forma de ^, boca ancha sonriente
```

### Animaciones CSS por mood y mode

```
calm + idle:       ninguna
focus + idle:      ninguna
worried + any:     animate-bounce (suave, una vez cada 3s) → usar CSS custom
panic + any:       animate-pulse en el cuerpo + el componente wrapper tiene animate-bounce
celebrate + any:   animate-bounce rápido × 3
alert (mode):      independiente del mood — agregar un ! sobre la cabeza
```

### Estructura del SVG (guía, adaptá según tu diseño)

```svg
<svg viewBox="0 0 64 64" width="64" height="64">
  <!-- Cuerpo: ellipse o path redondeado -->
  <!-- Ojos: dos circles, posición y tamaño varía por mood -->
  <!-- Boca: path con curva, forma varía por mood -->
  <!-- Extras: cejas (lines), sudor (circles), estrellas para celebrate -->
  <!-- Si mode=alert: texto o path con "!" sobre la cabeza -->
</svg>
```

### Implementación

- Todo el SVG inline en el JSX
- Los colores y formas cambian con un `switch(mood)` o un objeto de configuración
- Las animaciones con clases Tailwind (`animate-pulse`, `animate-bounce`) en el wrapper
- Tamaño fijo: `w-16 h-16` (64x64px)
- El wrapper tiene `transition-all duration-300` para cambios suaves

## Output esperado

Generá el archivo completo listo para guardar en:
`apps/frontend/src/components/mascot/MascotSVG.tsx`

Solo TypeScript + React + Tailwind + SVG inline. Sin comentarios. Sin librerías externas.
Usá `'use client'` si usás hooks, sino no es necesario.
