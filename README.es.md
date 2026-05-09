# Crew Companion

> **Aplicación de coordinación con Generative UI para equipos de hackathon.**
> La interfaz se adapta en tiempo real según quién sos, qué tan técnico sos, y qué tan cerca está el deadline.

[English](./README.md)

---

## ¿Qué es Crew Companion?

Crew Companion es una aplicación web agéntica construida para equipos de hackathon. A diferencia de los dashboards tradicionales con un chat al costado, **el chat ES la interfaz**. Un agente de AI observa el contexto del equipo — rol, nivel técnico, fase de urgencia y bloqueadores activos — y renderiza dinámicamente componentes UI tipados directamente en la conversación.

El resultado: el líder ve paneles de sugerencias de tareas y resúmenes de milestones. Un miembro del equipo sin experiencia técnica recibe wizards guiados paso a paso. Cada uno obtiene una interfaz diferente, manejada por el mismo agente, actualizada en tiempo real.

---

## Concepto Central: Generative UI

La app opera sobre 4 variables de contexto que el agente evalúa en cada interacción:

| Variable | Opciones | Efecto |
|----------|---------|--------|
| **Rol** | `leader` / `member` | Determina qué datos y acciones están disponibles |
| **Nivel técnico** | `low-tech` / `high-tech` | Controla el tono, nivel de detalle y tipo de surface |
| **Fase de urgencia** | `normal` → `focus` → `urgent` → `panic` → `expired` | Define la intensidad visual y prioridad de acciones |
| **Estado de blocker** | activo / ninguno | Orienta al agente hacia surfaces de troubleshooting |

---

## Stack Tecnológico

### Infraestructura (basada en [Generative-UI Global Hackathon Starter Kit](https://github.com/jerelvelarde/Generative-UI-Global-Hackathon-Starter-Kit))

| Servicio | Tecnología | Puerto |
|---------|-----------|--------|
| **Frontend** | Next.js 15 + React 19 + Tailwind CSS 4 | 3010 |
| **BFF** | Hono + TypeScript + CopilotRuntime v2 | 4000 |
| **Agente** | Python + LangGraph + LangChain | 8123 |
| **Servidor MCP** | TypeScript + mcp-use | 3001 |
| **Base de datos** | PostgreSQL (Docker) | 5433 |
| **Caché** | Redis (Docker) | 6381 |

### Librerías Principales

- **[CopilotKit](https://copilotkit.ai)** — Runtime de Generative UI, threads persistentes, sincronización de estado frontend↔agente
- **LangGraph** — Orquestación agéntica con estado y cadena de middlewares
- **Zustand** — Store de estado frontend para el dominio crew (tareas, milestones, miembros, blockers)
- **shadcn/ui** — Librería de componentes (Radix UI + Tailwind)
- **LLM** — Google Gemini Flash (por defecto) / Anthropic Claude Sonnet 4.6 (configurable)

---

## Rutas de la Aplicación

| Ruta | Usuario | Descripción |
|------|---------|-------------|
| `/leader` | Líder del equipo | Dashboard: tablero de tareas, panel de milestone, vista del equipo, chat |
| `/member/[memberId]` | Miembro del equipo | Workspace personal: tarea activa, countdown, reporte de blocker, chat |
| `/docs` | Todos | Workspace de documentos compartidos con Q&A impulsado por AI |
| `/` | — | Redirige a `/leader` |

---

## Sistema de Fases de Urgencia

Crew Companion monitorea continuamente el deadline del milestone más cercano y actualiza la fase de UI de forma automática:

```
> 30 min  →  normal   — interfaz tranquila, colores estándar
15–30 min  →  focus    — acento amarillo, señales de atención
 5–14 min  →  urgent   — naranja, banner visible
  0–4 min  →  panic    — rojo, elementos pulsantes, mascota preocupada
    < 0    →  expired  — rojo total, surfaces de acción inmediata
```

Cada componente, surface y estado de la mascota responde a la fase actual de forma automática.

---

## Las 12 UI Surfaces

El agente selecciona y renderiza uno de estos componentes tipados según el contexto (ver `project-docs/agent/04-surface-matrix.md` para la matriz de decisión completa):

| Surface | Audiencia | Disparador |
|---------|----------|-----------|
| `task_suggestion_panel` | Líder | Solicitudes de gestión de tareas |
| `milestone_summary_panel` | Líder | Revisión de milestone o fase pánico |
| `blocker_insight_panel` | Líder | Blocker activo reportado por miembro |
| `member_action_panel` | Cualquiera | Coordinación de equipo o fase pánico |
| `role_assignment_panel` | Líder | Consultas de roles/asignaciones |
| `beginner_guide_panel` | Miembro (low-tech) | Solicitud de ayuda, sin blocker activo |
| `guided_setup_panel` | Miembro (low-tech) | Guía de ejecución de tareas |
| `troubleshooting_wizard` | Miembro (low-tech) | Blocker activo |
| `commands_panel` | Miembro (high-tech) | Solicitudes de ayuda o tareas |
| `checklist_panel` | Miembro (high-tech) | Tareas paso a paso |
| `comparison_panel` | Miembro (high-tech) | Solicitudes de comparación de opciones |
| `document_summary_panel` | Cualquiera | Preguntas sobre documentos |

---

## La Mascota

Un compañero persistente en la esquina inferior derecha que refleja el estado del equipo de un vistazo:

| Mood | Disparador |
|------|-----------|
| `calm` 😊 | Fase: normal, sin blockers |
| `focus` 🎯 | Fase: focus |
| `worried` 😰 | Fase: urgent o blocker activo |
| `panic` 🚨 | Fase: panic o expired |
| `celebrate` 🎉 | Tarea completada o milestone alcanzado |

---

## Modelo de Dominio

### Entidades

```typescript
TeamMember     { id, name, role, technicalLevel, activeBlockerId? }
Task           { id, title, description, assignedTo, status, priority, milestoneId? }
Milestone      { id, title, deadline (ISO), taskIds[] }
Blocker        { id, memberId, description, reportedAt, resolved }
SharedDocument { id, title, content (markdown), sharedBy, sharedAt }
```

### Cálculo de Urgencia

```typescript
function getUrgencyPhase(deadlineISO: string): UrgencyPhase {
  const minutesLeft = (new Date(deadlineISO).getTime() - Date.now()) / 60000
  if (minutesLeft > 30) return 'normal'
  if (minutesLeft > 15) return 'focus'
  if (minutesLeft > 5)  return 'urgent'
  if (minutesLeft > 0)  return 'panic'
  return 'expired'
}
```

---

## Fases del Proyecto

### ✅ Fase 0 — Planificación y Documentación
*Completada*

Especificación completa del proyecto, decisiones de arquitectura, modelo de dominio, contratos de surfaces y guías para desarrolladores establecidos.

- [x] Especificaciones originales en `base-docs/` analizadas y validadas
- [x] Gaps identificados: inconsistencias de terminología, matriz de decisión faltante, Document Workspace no integrado en specs principales
- [x] `project-docs/` creado con 17 documentos consolidados y accionables
- [x] Roadmap para agentes (`project-docs/agent/`) — 6 archivos: overview, modelo de dominio, arquitectura, matriz de surfaces, prompts & tools, MVP scope
- [x] Guía del desarrollador principal (`project-docs/dev-milton/`) — tareas por fase + prompts copy-paste para Claude Code y Gemini CLI
- [x] Guía de la colaboradora (`project-docs/dev-companion/`) — specs de componentes con wireframes visuales, style guide

---

### ✅ Fase 1 — Setup: Copiar Starter Kit y Limpiar Dominio
*Completada*

Se copió la estructura del Generative-UI Hackathon Starter Kit, se eliminó el dominio de leads/Notion y se crearon páginas placeholder para las rutas nuevas.

- [x] Copiar `apps/`, `deployment/`, `scripts/` del starter kit
- [x] Eliminar dominio de leads (componentes, páginas, módulos Python)
- [x] Crear páginas placeholder para `/leader`, `/member/[memberId]`, `/docs`
- [x] Configurar `.env` con las API keys
- [x] Verificar que `npm run dev` levanta sin errores

**Señal de completitud:** `http://localhost:3010` carga y redirige a `/leader`

---

### ✅ Fase 2 — Dominio: Store Zustand + Tipos + Seed Data
*Completada*

Se construyó la capa de estado completa del frontend para el dominio crew.

- [x] `apps/frontend/src/lib/crew/types.ts` — todas las interfaces TypeScript
- [x] `apps/frontend/src/lib/crew/derive.ts` — funciones puras `getUrgencyPhase`, `getMascotMood`
- [x] `apps/frontend/src/lib/crew/seed.ts` — datos demo con deadline dinámico
- [x] `apps/frontend/src/lib/crew/store.ts` — Zustand store con todas las actions incluyendo `simulateUrgency`
- [x] `apps/frontend/src/hooks/use-urgency-phase.ts` — sincronización reactiva de fase (intervalo 30s)

**Señal de completitud:** `useCrewStore.getState().simulateUrgency(8)` en la consola del browser cambia `urgencyPhase` a `'urgent'`

---

### ✅ Fase 3 — Frontend: Rutas /leader, /member, /docs
*Completada*

Se implementaron las tres vistas principales con integración CopilotKit v2 y UI con conciencia de urgencia.

- [x] `CopilotKitProviderShell` adaptado para crew-companion (agentId: `crew_agent`)
- [x] `/leader` — TaskBoard, MilestonePanel, TeamOverview, todas las frontend tools registradas
- [x] `/member/[memberId]` — ActiveTaskView, MilestoneCountdown, reporte de blockers, frontend tools
- [x] `/docs` — DocumentTabs con shadcn/ui Tabs, visor de documentos, acciones abrir/cerrar
- [x] Componente `UrgencyBanner` (sistema de colores por fase con `animate-pulse` en pánico)
- [x] Stub `SurfaceRenderer` registrado como tool `renderSurface` en todas las páginas
- [x] Todas las frontend tools registradas: `setCrewState`, `updateTask`, `setMascotMood`, `highlightTasks`, `renderSurface`, `reportBlocker`, `openDocument`
- [x] Botones de simulación de urgencia solo en dev (Normal/Focus/Urgent/Panic) en `/leader`

**Señal de completitud:** Las tres rutas cargan, el chat es visible, el banner de urgencia cambia de color con los botones de simulación

---

### ✅ Fase 4 — UI Surfaces + Countdown + Mascota
*Completada — generada por Gemini CLI*

Implementar las 8 surfaces del MVP, el timer de countdown en vivo, y la mascota compañera.

- [x] Stub `SurfaceRenderer` (registrado como tool `renderSurface`)
- [x] `renderSurface` registrado en todas las páginas
- [x] 8 surfaces del MVP implementadas:
  - [x] `TaskSuggestionPanel`
  - [x] `MilestoneSummaryPanel`
  - [x] `BlockerInsightPanel`
  - [x] `MemberActionPanel`
  - [x] `BeginnerGuidePanel`
  - [x] `ChecklistPanel`
  - [x] `TroubleshootingWizard`
  - [x] `DocumentSummaryPanel`
- [x] `MilestoneCountdown` — countdown en vivo (1 segundo) con estilo por fase
- [x] `CompanionMascot` — componente de mascota reactivo al mood (`MascotSVG`)

**Señal de completitud:** `simulateUrgency(3)` → el countdown pulsa en rojo, la mascota muestra estado pánico

---

### ✅ Fase 5 — Agente Python: Prompts + Tools + Estado
*Completada*

Adaptar el agente LangGraph para el dominio crew con el sistema completo de selección de surfaces.

- [x] `apps/agent/src/types.py` — TypedDicts Python alineados con el modelo de dominio TypeScript
- [x] `apps/agent/src/crew_state.py` — TypedDict `CrewCanvasState` + `CrewStateMiddleware` (hidratación desde seed)
- [x] `apps/agent/src/tools.py` — `create_task`, `update_task_status`, `create_milestone`, `resolve_blocker`, `get_documents` (con `InjectedState`)
- [x] `apps/agent/src/prompts.py` — system prompt con tabla de decisión por role/technicalLevel/phase
- [x] `apps/agent/src/runtime.py` — cadena de middleware: `TimingMiddleware → CrewStateMiddleware → CopilotKitMiddleware(expose_state=True)`
- [x] `apps/agent/crew.seed.json` — datos seed (deadline calculado dinámicamente al arrancar el agente)

**Señal de completitud:** El agente renderiza `task_suggestion_panel` cuando el líder pregunta "qué tareas faltan" y `troubleshooting_wizard` cuando un miembro low-tech reporta un blocker

---

### ⬜ Fase 6 — Integración, QA y Demo
*Pendiente*

Integración completa del sistema, corrección de bugs y preparación para la demo.

- [ ] `npm run dev` (stack completo) corre sin errores
- [ ] La persistencia de threads funciona al refrescar el browser (CopilotKit Intelligence)
- [ ] Las 4 escenas de demo validadas (ver `project-docs/agent/06-mvp-scope.md`)
- [ ] Botón de simulación de urgencia disponible en modo dev
- [ ] La mascota sincroniza con las respuestas del agente
- [ ] El workspace de documentos renderiza markdown de forma segura
- [ ] Demo de 2 minutos ensayada

**Escenas de la demo:**
1. `/leader` — tablero de tareas + milestone en fase `normal`
2. Chat: "¿qué tareas faltan?" → `task_suggestion_panel` renderizado
3. Simular 8 minutos → UI cambia a `urgent`, mascota a `worried`, el agente renderiza `milestone_summary_panel` proactivamente
4. `/member/m2` (Sam, low-tech) → chat: "no entiendo cómo correr el proyecto" → `troubleshooting_wizard`

---

## Inicio Rápido

### Prerrequisitos

- Node.js 18+
- Python 3.11+ con el gestor de paquetes `uv`
- Docker Desktop
- Una API key de Gemini (o Anthropic)
- Una cuenta de CopilotKit (para threads de Intelligence)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Miltondz/crew-companion.git
cd crew-companion

# Configurar el entorno
cp .env.example .env
# Editar .env con tus API keys

# Instalar todas las dependencias (workspaces Node + Python via uv)
npm install

# Levantar infraestructura (Postgres + Redis)
npm run dev:infra

# Levantar todos los servicios
npm run dev
```

### Servicios Individuales

```bash
npm run dev:ui       # Next.js frontend  → http://localhost:3010
npm run dev:bff      # Hono BFF          → http://localhost:4000
npm run dev:agent    # Agente LangGraph  → http://localhost:8123
npm run dev:infra    # Solo stack Docker
```

### Variables de Entorno

| Variable | Requerida | Descripción |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Sí (o Anthropic) | API key de Google Gemini |
| `ANTHROPIC_API_KEY` | Opcional | Solo si se usa runtime `claude-sonnet-react` |
| `AGENT_RUNTIME` | No | `gemini-flash-deep` (default) o `claude-sonnet-react` |
| `COPILOTKIT_LICENSE_TOKEN` | Sí | Licencia de CopilotKit |
| `INTELLIGENCE_API_URL` | Sí | URL de la API de CopilotKit Intelligence |
| `INTELLIGENCE_GATEWAY_WS_URL` | Sí | URL WebSocket de CopilotKit Intelligence |
| `INTELLIGENCE_API_KEY` | Sí | Clave de auth de CopilotKit Intelligence |

---

## Documentación del Proyecto

Toda la documentación operativa vive en `project-docs/` (no se sube a GitHub — ver `.gitignore`):

```
project-docs/
├── agent/              # Contexto para agentes de código (Claude Code, Gemini CLI)
│   ├── 01-overview.md
│   ├── 02-domain-model.md
│   ├── 03-architecture.md
│   ├── 04-surface-matrix.md     ← tabla de decisión de surfaces
│   ├── 05-prompts-and-tools.md  ← system prompt + todas las acciones
│   └── 06-mvp-scope.md          ← qué está en/fuera del MVP + criterio de demo
├── dev-milton/         # Tareas del desarrollador principal y prompts de AI
│   ├── 00-roadmap.md
│   ├── 01-phase1-setup.md  hasta  05-phase5-agent.md
│   └── PROMPTS.md           ← prompts copy-paste para Claude Code / Gemini CLI
└── dev-companion/      # Guía de la colaboradora frontend
    ├── 00-intro.md
    ├── 01-components.md    ← 12 componentes con specs visuales
    └── 02-style-guide.md   ← tokens de diseño Tailwind
```

Las especificaciones originales se preservan en `base-docs/`.

---

## Equipo

| Rol | Responsabilidad |
|-----|----------------|
| **Desarrollador Principal** | Arquitectura, backend, agente, integración del sistema |
| **Colaboradora Frontend** | Componentes UI, surfaces, mascota, diseño visual |

---

## Basado En

Construido sobre el **[Generative-UI Global Hackathon Starter Kit](https://github.com/jerelvelarde/Generative-UI-Global-Hackathon-Starter-Kit)**, que provee la infraestructura completa de CopilotKit + LangGraph + Hono + Docker. Crew Companion reemplaza el dominio de gestión de leads por un dominio de coordinación de equipos.
