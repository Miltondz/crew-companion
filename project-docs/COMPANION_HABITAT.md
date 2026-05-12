# Companion Habitat — Feature Definition

**Status:** Diseño aprobado — pendiente implementación  
**Última revisión:** 2026-05-12  
**Owner:** Milton  

---

## 1. Visión

El Companion Habitat es el **agente encarnado** de Crew Companion — la presencia física del sistema en la UI. No es un chatbot con cara, no es un semáforo de estado. Es un mundo pequeño vivo que refleja la salud real del proyecto en tiempo real, reacciona a eventos de forma autónoma, y actúa como punto de contacto unificado con los tres agentes (Orchestrator, Planner, Coach).

**Inspiración visual:** Tamagotchi, Animal Crossing corner widget, desktop pets de los 90s — pero con data real del proyecto como estado.

**Diferencial:** La criatura no solo muestra estado pasivamente. Actúa. Genera superficies de alerta, celebra avances del equipo, entra en pánico visible cuando el deadline se acerca, duerme cuando el equipo está inactivo. El vínculo emocional con la criatura es el hook de retención — el equipo quiere que su mascota esté feliz, lo que los motiva a resolver blockers.

---

## 2. Alcance

### Dentro del alcance

- Mini habitat (240×180px) en esquina inferior derecha del workspace
- Capas visuales animadas que reflejan fase, eventos, tiempo restante
- Sistema de props dinámicos (objetos en el habitat basados en estado del proyecto)
- Criatura animada con estados emocionales + modos de comportamiento
- Speech bubbles proactivos (sin que el usuario los pida)
- Panel lateral que se abre al hacer click: copiloto técnico + status rápido
- TechnicalStepper: flujos adaptativos por nivel técnico del miembro
- CompanionEventBus: cualquier parte del app puede emitir eventos al habitat
- HabitatPropRegistry: registro extensible de props (como SurfaceRegistry)
- Identificador técnico: `Companion` (nombre de marca a definir por el owner)

### Fuera del alcance (por ahora)

- Arte Rive — requiere archivo `.riv`. Implementación inicial usa SVG + CSS
- Generación de arte con Imagen API — dependencia externa, fase 2
- Múltiples criaturas por workspace (una por miembro visible) — fase 3
- Habitat personalizable por el usuario — fase 3
- Integración con eventos externos (git commits, CI/CD, Slack) — fase 3
- Mobile / PWA — out of scope global

---

## 3. El habitat: anatomía

```
┌──────────────────────────────────┐  240×180px
│  ☀️ / 🌧️ / ⭐   (cielo)          │  ← capa 1: background dinámico
│                                  │
│   ~~~nubes / efectos~~~          │  ← capa 2: efectos de tiempo
│                                  │
│         [CRIATURA]               │  ← capa 4: sprite animado
│                                  │
│  🌱 ──── suelo ──── 🌱           │  ← capa 3: ground permanente
│  🪨     ⚑      🔧    🏆         │  ← capa 5: props dinámicos
└──────────────────────────────────┘
         ↕ click en cualquier parte
┌────────────────────────────────────────┐
│  COMPANION PANEL (slide desde derecha) │
│  • Quick status del proyecto           │
│  • TechnicalStepper (copiloto)         │
│  • Acciones sugeridas                  │
└────────────────────────────────────────┘
```

### Capa 1 — Cielo (background)

| urgencyPhase | Visual |
|---|---|
| `normal` | Azul claro, sol visible |
| `focus` | Azul neutro, nubes suaves |
| `urgent` | Naranja tardío, atardecer |
| `panic` | Rojo oscuro, tormenta |
| `expired` | Gris oscuro, noche sin estrellas |

### Capa 2 — Efectos de tiempo

- Sol sale/se pone según horas restantes al deadline (metáfora del día)
- Lluvia suave en fase `urgent`
- Tormenta eléctrica en fase `panic`
- Estrellas/noche cuando equipo inactivo >15min

### Capa 5 — Props dinámicos (HabitatPropRegistry)

| Evento | Prop | Animación |
|---|---|---|
| Blocker activo creado | 🪨 roca en el suelo | slide-in desde abajo |
| Blocker resuelto | roca desaparece | crush + partículas |
| Milestone completado | 🏆 trofeo aparece | bounce + glow |
| Tarea completada | pequeño ✓ | flota y desaparece |
| Deadline < 60min | ⏳ reloj de arena | aparece con pulso |
| Agente hablando | 💭 burbuja de pensamiento | fade in |
| Equipo inactivo | zzz | criatura se recuesta |
| Panic phase | llamas | emerge del suelo |
| Feature recortada por el Planner | ✂️ tijera | animación de corte |

---

## 4. La criatura

### Estados emocionales (mood)

| mood | Aspecto | Trigger |
|---|---|---|
| `calm` | Cuerpo azul, ojos tranquilos, sentado | `normal` phase, sin blockers |
| `focused` | Cuerpo amarillo, cejas concentradas | `focus` phase |
| `worried` | Cuerpo naranja, ojos grandes, mirando alrededor | Blocker activo OR `urgent` phase |
| `panicking` | Cuerpo rojo, sudor, boca abierta | `panic` phase OR deadline < 30min |
| `celebrating` | Cuerpo verde, saltos, ojos cerrados ^ | Milestone completado, blocker resuelto |
| `sleeping` | Cuerpo gris claro, zzz | Equipo inactivo > 15min |
| `thinking` | Cuerpo lila, burbuja 💭 | Agente procesando |
| `guiding` | Cuerpo azul-violeta, señalando | Panel abierto, stepper activo |

### Modos de comportamiento (mode)

| mode | Comportamiento |
|---|---|
| `idle` | Loop de animación suave, pequeños movimientos |
| `alert` | ! sobre la cabeza, bounce rápido |
| `speaking` | Burbuja de texto animada |
| `action` | Movimiento hacia un prop del habitat |
| `listening` | Inclinado hacia adelante, atento |

### Acciones autónomas (sin input del usuario)

Estas acciones ocurren por cuenta propia cuando se detectan eventos:

1. **Salto de alerta** — cuando se crea un blocker, la criatura salta y muestra: `"Ana está bloqueada. ¿Quiero ayudar?"`
2. **Celebración** — al resolver blocker o completar milestone, la criatura baila + aparece el trofeo
3. **Modo pánico** — al entrar en `panic` phase, toda la escena cambia + criatura entra en pánico visual
4. **Mensaje proactivo de triage** — a T-60min, la criatura muestra: `"Quedan 58 min. El Planner tiene un plan de corte. ¿Lo vemos?"`
5. **Advertencia silenciosa** — si quedan tareas críticas pendientes y el equipo está inactivo, la criatura se despierta y agita

**Regla anti-spam:** La criatura no puede mostrar más de un mensaje proactivo en ventanas de 5 minutos. Si ya hay uno activo, el nuevo se encola.

---

## 5. Casos de uso

### Caso A: Hackathon T-2h, todo bien
```
Habitat: cielo azul tardío, sol bajo en horizonte
Criatura: focused (amarilla), animación de caminar
Props: 2 tareas completadas flotan brevemente
Bubble: ninguna (no hay urgencia)
```

### Caso B: Blocker crítico creado
```
Evento: create_blocker() llamado por el agente
→ Roca 🪨 aparece en el suelo del habitat
→ Criatura pasa a worried
→ Cielo vira levemente a naranja
→ Bubble aparece: "Carlos tiene un blocker nuevo. [Ver detalles]"
→ Al hacer click en bubble → SurfaceHost monta blocker_insight_panel
```

### Caso C: Equipo en panic phase
```
Fase cambia a panic (deadline < 10min)
→ Cielo vira a rojo oscuro + relámpagos
→ Lluvia intensa aparece
→ Criatura entra en panicking (roja, sudor)
→ Llamas emergen del suelo
→ Bubble automática: "¡10 MINUTOS! Planner activado." [modal de CountdownCritical variant=full]
→ Panel se abre automáticamente con acción urgente sugerida
```

### Caso D: Milestone completado
```
Evento: milestone marcado done
→ 🏆 aparece en el habitat con bounce
→ Cielo vira a azul brillante
→ Criatura celebra (verde, saltos)
→ Confeti cae sobre el habitat
→ Bubble: "¡[nombre del milestone] completado! Equipo increíble." (mensaje generado por Orchestrator)
→ Dura 8 segundos y vuelve a idle
```

### Caso E: Miembro técnico abre el panel (copiloto)
```
Usuario hace click en habitat
→ Panel se abre desde derecha
→ Nivel detectado automáticamente: high-tech
→ Criatura cambia a guiding
→ Panel muestra:
   [Quick status: 3 tareas pendientes, 1 blocker, 1h 20min]
   [Elegí qué hacer:]
   ├─ Resolver un error técnico
   ├─ Configurar algo en el entorno
   ├─ Entender esta tarea  
   └─ Ver estado del equipo
```

### Caso F: Miembro no técnico con stepper activo
```
Miembro low-tech elige "Configurar el entorno"
→ Coach agent recibe request con technicalLevel=low-tech
→ Genera flujo de 4 pasos:
   Paso 1/4: Abrir terminal
   Paso 2/4: Escribir `npm install` + [copiar]
   Paso 3/4: Deberías ver "added 87 packages"
   Paso 4/4: Escribir `npm run dev` + [copiar]
   
→ Miembro marca "✗ Falló" en paso 2
→ Panel entra en Rescue Mode:
   "Veo que algo salió mal. ¿Qué viste?"
   [Node no encontrado] [Permiso denegado] [Otro error]
→ Miembro elige → Coach genera pasos alternativos
```

### Caso G: Líder usa el panel
```
Líder hace click en habitat
→ Panel detecta role=leader
→ Nivel: high-tech (assumed para líderes)
→ Panel muestra:
   [Status: Sprint 73% — 2 blockers activos — T-1h 45min]
   [Acciones sugeridas por Planner:]
   ├─ Asignar tarea crítica pendiente a Jordan
   ├─ Resolver blocker de Ana (2h pendiente)
   └─ Cortar feature: notificaciones en tiempo real (+45min)
   [Abrir war room completo]
```

---

## 6. Arquitectura técnica

### Árbol de archivos

```
apps/frontend/src/runtime/companion/
├── EventBus.ts              ← pub/sub global
├── machine.ts               ← xstate state machine
├── HabitatPropRegistry.ts   ← registry extensible de props
└── index.ts                 ← exports

apps/frontend/src/components/companion/
├── Habitat.tsx              ← container principal (240×180)
├── HabitatBackground.tsx    ← cielo + ground + efectos
├── HabitatProps.tsx         ← props dinámicos del registry
├── CreatureSprite.tsx       ← sprite animado (SVG → Rive en fase 2)
├── SpeechBubble.tsx         ← burbuja proactiva con CTA
├── CompanionPanel.tsx       ← panel lateral deslizante
├── TechnicalStepper.tsx     ← copiloto técnico adaptivo
└── index.ts                 ← exports
```

### CompanionEventBus

```typescript
// Eventos base — extensibles sin breaking changes
type CompanionEvent =
  | { type: 'PHASE_CHANGE'; phase: UrgencyPhase }
  | { type: 'BLOCKER_CREATED'; blockerId: string; memberId: string }
  | { type: 'BLOCKER_RESOLVED'; blockerId: string }
  | { type: 'MILESTONE_COMPLETE'; milestoneId: string; title: string }
  | { type: 'TASK_COMPLETED'; taskId: string }
  | { type: 'AGENT_SPOKE'; agentId: 'orchestrator' | 'planner' | 'coach'; surface?: string }
  | { type: 'DEADLINE_APPROACHING'; minutesLeft: number }
  | { type: 'USER_INACTIVE'; durationMs: number }
  | { type: 'USER_ACTIVE' }
  | { type: 'PANEL_OPEN' }
  | { type: 'PANEL_CLOSE' }
  // Futuro: COMMIT_PUSHED, DEPLOY_SUCCESS, EXTERNAL_EVENT, etc.

// Cualquier componente puede emitir:
companionBus.emit({ type: 'BLOCKER_CREATED', blockerId: 'b1', memberId: 'm2' })

// Cualquier componente puede escuchar:
companionBus.on('MILESTONE_COMPLETE', (e) => { ... })
```

### CompanionMachine (xstate)

```typescript
// Estados extensibles — no rompe al agregar nuevos
type MachineState =
  | 'idle'         // default, nada especial
  | 'alert'        // evento crítico detectado, bubble activa
  | 'celebrating'  // milestone/blocker resuelto
  | 'panicking'    // panic/expired phase
  | 'guiding'      // panel abierto, stepper activo
  | 'sleeping'     // equipo inactivo
  | 'thinking'     // agente procesando
  // Futuros: 'cheering', 'analyzing', 'warning', etc.

// Context extensible
interface MachineContext {
  mood: CreatureMood
  mode: CreatureMode
  phase: UrgencyPhase
  activeBlockerCount: number
  bubbleMessage: string | null
  bubbleCTA: { label: string; action: string } | null
  panelOpen: boolean
  habitatWeather: 'sunny' | 'cloudy' | 'stormy' | 'night' | 'rain'
  lastProactiveAt: number  // timestamp para anti-spam
  // Extensible: nuevas keys no rompen la máquina existente
}
```

### HabitatPropRegistry

```typescript
interface HabitatProp {
  id: string
  triggerEvent: CompanionEvent['type']           // qué evento lo activa
  removedBy?: CompanionEvent['type']             // qué evento lo elimina
  component: React.ComponentType<HabitatPropProps>
  position: 'ground-left' | 'ground-center' | 'ground-right' | 'sky'
  maxInstances: number                           // cuántos pueden coexistir
}

// Registro de props base
habitatPropRegistry.register({
  id: 'blocker_rock',
  triggerEvent: 'BLOCKER_CREATED',
  removedBy: 'BLOCKER_RESOLVED',
  component: BlockerRock,
  position: 'ground-left',
  maxInstances: 3,
})

// Extensible: nuevas features registran sus props sin editar Habitat.tsx
habitatPropRegistry.register({
  id: 'deploy_rocket',        // futuro
  triggerEvent: 'DEPLOY_SUCCESS',
  component: DeployRocket,
  position: 'sky',
  maxInstances: 1,
})
```

### TechnicalStepper

```typescript
interface TechStep {
  id: string
  title: string
  description: string        // plain para low-tech, técnico para high-tech
  command?: string           // si tiene comando a copiar
  expectedOutput?: string    // qué debe ver el usuario
  errorOptions?: {           // si falla, qué puede haber pasado
    label: string
    nextStepId: string       // rama alternativa
  }[]
}

interface TechFlow {
  id: string
  taskLabel: string
  technicalLevel: 'low-tech' | 'high-tech'
  steps: TechStep[]
  generatedBy: 'coach'       // siempre el Coach agent
}
```

---

## 7. Integraciones con el sistema existente

### Con el agente (backend)

El agente ya llama `setMascotMood()` — esto sigue funcionando. Adicionalmente:

- La machine escucha el `AGENT_SPOKE` event para entrar en `thinking` → `speaking`
- El TechnicalStepper usa el **Coach agent** directamente para generar flujos
- El panel muestra acciones sugeridas del **Orchestrator** en el quick status
- El **Planner** puede triggerear habitat events al crear/actualizar tasks/blockers

### Con el Surface Registry

- La criatura puede triggerear `SurfaceHost` al hacer click en un bubble CTA
- Ejemplo: click en "Ver blocker" → emite envelope → `SurfaceHost` monta `blocker_insight_panel`
- El habitat coexiste con las surfaces — no las reemplaza, las complementa

### Con el workspace (leader/member pages)

- El habitat se monta en `WorkspaceShell` en zona `ambient-overlay`
- Lee `urgencyPhase` del workspace state para sincronizar la machine
- Escucha acciones de CopilotKit para detectar cuando el agente habla

---

## 8. Orden de creación (implementación)

### Fase 1 — Core runtime (sin arte externo)

**Semana 1:**

1. `EventBus.ts` — pub/sub simple, sin dependencias
2. `machine.ts` — xstate machine, 6 estados base, context definido
3. `HabitatPropRegistry.ts` — registry + tipos
4. `CreatureSprite.tsx` — SVG mejorado (más expresivo que MascotSVG actual)
5. `SpeechBubble.tsx` — burbuja con texto + CTA opcional + auto-dismiss

**Semana 2:**

6. `HabitatBackground.tsx` — cielo CSS + ground + efectos de tiempo (gradientes)
7. `HabitatProps.tsx` — render de props desde registry
8. `Habitat.tsx` — container con todas las capas + click handler
9. Integrar `Habitat` en `WorkspaceShell` (reemplaza `MascotSVG` inline)
10. Wire EventBus → workspace state changes → machine transitions

**Semana 3:**

11. `CompanionPanel.tsx` — panel lateral deslizante con framer-motion
12. `TechnicalStepper.tsx` — stepper + copy command + rescue mode
13. Conectar stepper con Coach agent
14. Quick status en panel (desde workspace state)
15. Comportamientos proactivos: T-60min alert, blocker alert, celebration

### Fase 2 — Arte (requiere asset externo)

Prerequisito: Imagen API key disponible

1. Generar diseño de personaje con Imagen (5-6 variantes, elegir 1)
2. Vectorizar y preparar para Rive editor
3. Crear animaciones en Rive: idle loop, celebrate, panic, sleep, guide
4. Exportar `.riv` file
5. Instalar `@rive-app/react-canvas` (ya en package.json)
6. Reemplazar `CreatureSprite.tsx` con `RiveCreature.tsx`
7. Reemplazar `HabitatBackground.tsx` con versión Rive si se decide

### Fase 3 — Extensiones futuras (no implementar aún, solo diseño listo)

- Props desde git commits / CI/CD events via webhook
- Múltiples criaturas (una por miembro del equipo)
- Habitat personalizable: usuario elige skin/bioma
- Eventos externos: Slack, Linear, GitHub
- "Modo presentación": habitat se expande para compartir en screen share

---

## 9. Qué se necesita

### Para Fase 1 (disponible hoy)

| Dependencia | Estado |
|---|---|
| `xstate` | Instalar en frontend |
| `framer-motion` | ✅ Ya instalado |
| `lucide-react` | ✅ Ya instalado |
| `@rive-app/react-canvas` | En package.json, usar en Fase 2 |
| Coach agent | ✅ Ya existe (multi-agent commit) |
| Orchestrator agent | ✅ Ya existe |
| WorkspaceShell | ✅ Ya existe, `ambient-overlay` zone disponible |

### Para Fase 2

| Dependencia | Estado |
|---|---|
| Imagen API key | Pendiente — pedir al owner |
| Rive editor (web) | Gratuito en rive.app |
| Diseñador o tiempo para Rive | A definir |

---

## 10. Decisiones abiertas

| # | Decisión | Estado |
|---|---|---|
| 1 | **Nombre del Companion** | Pendiente — owner decide |
| 2 | **Nombre de la criatura en el habitat** | Pendiente — puede diferir del producto |
| 3 | El panel ¿reemplaza o coexiste con el chat sidebar? | **Coexistencia** ✅ confirmado |
| 4 | ¿El habitat aparece también en la landing page y onboarding? | Abierto |
| 5 | Tamaño exacto del habitat | 240×180px propuesto, confirmar |
| 6 | ¿Los mensajes proactivos tienen audio? | Out of scope por ahora |
| 7 | ¿El stepper genera el flujo en tiempo real (streaming) o todo junto? | Abierto |

---

## 11. Métricas de éxito

- Usuario interactúa con el panel al menos una vez por sesión
- Tiempo para resolver un blocker técnico con stepper < 5min para low-tech members
- El habitat refleja el estado correcto del proyecto con < 2s de lag
- Zero mensajes proactivos en ventanas de 5min (anti-spam activo)
- El habitat es extensible: agregar un nuevo prop tarda < 30 min sin tocar core

---

_Documento vivo — actualizar conforme se implementa cada fase._
