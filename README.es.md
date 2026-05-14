# Crew Companion

<div align="center">

```
  ██████╗██████╗ ███████╗██╗    ██╗     ██████╗ ██████╗ ███╗   ███╗██████╗  █████╗ ███╗   ██╗██╗ ██████╗ ███╗   ██╗
 ██╔════╝██╔══██╗██╔════╝██║    ██║    ██╔════╝██╔═══██╗████╗ ████║██╔══██╗██╔══██╗████╗  ██║██║██╔═══██╗████╗  ██║
 ██║     ██████╔╝█████╗  ██║ █╗ ██║    ██║     ██║   ██║██╔████╔██║██████╔╝███████║██╔██╗ ██║██║██║   ██║██╔██╗ ██║
 ██║     ██╔══██╗██╔══╝  ██║███╗██║    ██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██╔══██║██║╚██╗██║██║██║   ██║██║╚██╗██║
 ╚██████╗██║  ██║███████╗╚███╔███╔╝    ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ██║  ██║██║ ╚████║██║╚██████╔╝██║ ╚████║
  ╚═════╝╚═╝  ╚═╝╚══════╝ ╚══╝╚══╝      ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝
```

**Runtime Cognitivo Operacional para equipos de proyecto.**

> La interfaz se transforma según quién sos, qué tan urgente es la situación y qué te está bloqueando — no al revés.

[![Next.js](https://img.shields.io/badge/Next.js_15-black?logo=next.js)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python_3.11-3776AB?logo=python&logoColor=white)](https://python.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-orange)](https://langchain-ai.github.io/langgraph)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

[English](./README.md)

</div>

---

## Qué es

Crew Companion **no es un dashboard con IA agregada**. Es un runtime donde la interfaz *emerge* del contexto en lugar de ser navegada. Cuatro capas gobiernan cada interacción:

La **Capa Agente** decide la intención semántica: qué surface se necesita y qué datos poblarla. La **Capa Runtime** resuelve el workspace físico: qué zona, qué ciclo de vida, qué sucede cuando dos surfaces compiten por la misma región. La **Capa de Política** actúa como firewall de capacidades: verifica si una herramienta puede ejecutarse, registra cada decisión e intercepta operaciones de alto riesgo antes de llegar al usuario. La **Capa Usuario** siempre tiene la última palabra: confirmaciones, paneles fijados y ApprovalGates para acciones destructivas.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   CAPA AGENTE        decide la intención                │
│   "¿Qué surface y datos se necesitan semánticamente?"   │
│                          │                              │
│                          ▼                              │
│   CAPA RUNTIME       decide la composición              │
│   "Layout, densidad, ciclo de vida, conflictos"         │
│                          │                              │
│                          ▼                              │
│   CAPA POLÍTICA      decide la viabilidad               │
│   "Capacidades, auditoría, puertas de aprobación"       │
│                          │                              │
│                          ▼                              │
│   CAPA USUARIO       decide la autoridad                │
│   "Confirmaciones, fijado de paneles, veto final"       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## El Diferenciador Central

La mayoría de herramientas con IA tratan la interfaz como estática y agregan inteligencia encima. Crew Companion invierte esto: el agente decide *qué* mostrar, el runtime decide *dónde y cómo*, y el resultado es un workspace diferente para un líder en pánico a las 11pm versus un miembro sin experiencia técnica haciendo onboarding un lunes tranquilo.

| Herramienta típica con IA | Crew Companion |
|---|---|
| Layouts estáticos con widgets de IA | Surfaces de UI generativa disparadas por intención del agente |
| Misma UI para todos | Rol × NivelTécnico × FaseUrgencia × Especialización → workspace único |
| Actualizaciones manuales de estado | Máquina de estado impulsa mascota, colores y routing de surfaces |
| Un proyecto por cuenta | Dashboard multi-proyecto, invitaciones por link |
| Interfaz chat primero | Gramática espacial: 6 zonas, fijado, overlays ambientales |
| IA sugiere, usuario configura | El agente emite envelopes tipados; el runtime compone el layout |
| Ayuda genérica por chat | Coaching con conciencia de especialización (dev/diseño/QA/manager/escritor) |

---

## Arquitectura del Sistema

El sistema está dividido en tres tiers independientemente desplegables. El **frontend** (Next.js 15, Vercel) maneja todo el rendering, ciclo de vida de surfaces e interacción del usuario. Comunica exclusivamente a través del **BFF** (Backend-for-Frontend, Hono en Render), que actúa como gateway de CopilotKit, aplica rate limits y gestiona el estado con scope de workspace. El **agente** (Python LangGraph, sidecar en Render) contiene toda la lógica de IA: herramientas, routing, política y estado de conversación con checkpoints. El frontend nunca llama al agente directamente — esa separación es un invariante arquitectónico duro.

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                             │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Next.js 15 Frontend                       │    │
│  │                                                              │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐ │    │
│  │  │ Surface      │  │ Layout       │  │ Validador Envelope │ │    │
│  │  │ Registry     │  │ Engine       │  │ (Zod)             │ │    │
│  │  │              │  │ (6 regiones) │  │                   │ │    │
│  │  └──────┬───────┘  └──────┬───────┘  └────────┬──────────┘ │    │
│  │         └─────────────────┴──────────────────┘            │    │
│  │                           │                                │    │
│  │              ┌────────────▼───────────┐                   │    │
│  │              │    WorkspaceShell       │                   │    │
│  │              │  (layout por rol)       │                   │    │
│  │              └────────────────────────┘                   │    │
│  └────────────────────────┬─────────────────────────────────┘    │
│                           │  CopilotKit v2 / WebSocket            │
└───────────────────────────┼──────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                      BFF — Hono :4000                             │
│                                                                   │
│   TimingMiddleware → CrewStateMiddleware → CopilotKitMiddleware   │
│                                                                   │
│   /api/copilotkit ──► CopilotRuntime v2 ──► LangGraphAgent(s)    │
│   /status         ──► Diagnósticos de salud + DB                 │
└───────────────────────────┬──────────────────────────────────────┘
                            │  HTTP / protocolo LangGraph
┌───────────────────────────▼──────────────────────────────────────┐
│                   Agente Python :8123                             │
│                                                                   │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐           │
│   │ Orchestrator│   │   Planner   │   │    Coach    │           │
│   │             │──►│             │   │             │           │
│   │  routing +  │   │  tareas +   │   │  guía +     │           │
│   │  resets     │   │  milestones │   │  docs       │           │
│   └─────────────┘   └─────────────┘   └─────────────┘           │
│                                                                   │
│   @guarded_tool ──► PolicyEngine ──► AuditLog                    │
│   AsyncPostgresSaver (checkpoints)                                │
└───────────────────────────┬──────────────────────────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          │                                   │
    ┌─────▼──────┐                    ┌───────▼──────┐
    │ PostgreSQL │                    │    Redis      │
    │   (Neon)   │                    │  (Upstash)    │
    │            │                    │               │
    │ workspace  │                    │ caché sesión  │
    │ estado     │                    │ rate limiting │
    │ audit log  │                    │               │
    └────────────┘                    └───────────────┘
```

---

## Motor de Urgencia

El motor de urgencia es el driver comportamental central de toda la aplicación. Cada workspace tiene al menos un milestone con deadline. La función `getUrgencyPhase(deadline)` calcula la fase actual en tiempo real — nunca se almacena en la base de datos, nunca se establece manualmente y nunca se pasa como prop. Cualquier código que lea `state.urgencyPhase` está consumiendo un valor derivado.

Los cambios de fase no son solo visuales. Disparan re-routing automático de surfaces (TriageWarRoom reemplaza paneles normales en `panic`), actualizaciones de humor de la mascota, compresión de densidad del layout y activación del overlay de countdown.

```
Línea de tiempo ───────────────────────────────────────────────────────► deadline
         │                                                                  │
         │   NORMAL      FOCUS       URGENTE     PÁNICO     EXPIRADO       │
         │  ─────────── ─────────── ─────────── ─────────── ──────────    │
         │  UI relajada  Señales     Countdown   War room    Archivado     │
         │  Layout       sutiles     Comprimido  Blocker     bloqueado     │
         │  completo     Prioridades superficie  forzado     modo          │
         │               destacadas  routing                               │
```

---

## Gramática Espacial — Layout del Workspace

El workspace usa una gramática espacial fija de 6 regiones nombradas. Cada surface declara a qué región pertenece en su manifest. El Layout Engine resuelve conflictos, gestiona el ciclo de vida (mount, hibernate, evict) y respeta los paneles fijados por el usuario (guardados en localStorage).

```
┌─────────────────────────────────────────────────────────────────┐
│                  COMMAND SURFACE (barra superior)                │
│         selector proyecto · fase urgencia · nav · usuario        │
├────────────────────────────┬────────────────────────────────────┤
│                            │                                    │
│    PRIMARY WORKZONE        │        CONTEXT RAIL (derecha)      │
│                            │                                    │
│    Surface principal del   │   MilestoneSummaryPanel            │
│    agente:                 │   BlockerInsightPanel              │
│                            │   DocumentSummaryPanel             │
│    • TaskSuggestionPanel   │   BeginnerGuidePanel               │
│    • FocusedTaskPanel      │   MemberActionPanel                │
│    • TriageWarRoom         │                                    │
│    • ForceGraph            ├────────────────────────────────────┤
│    • IdeaMatrix            │                                    │
│    • ChecklistPanel        │        AGENT RAIL (derecha)        │
│    • TroubleshootingWizard │                                    │
│                            │   Companion Habitat                │
│                            │   (mascota + humor + diálogo)      │
│                            │                                    │
├────────────────────────────┴────────────────────────────────────┤
│                   ACTIVITY STREAM (inferior)                     │
│              log de eventos en vivo · acciones del agente        │
└─────────────────────────────────────────────────────────────────┘
         ┌──────────────────────────────────────────────┐
         │          AMBIENT OVERLAY (capa z-top)         │
         │   CountdownCritical · AmbientOverlayWidget    │
         └──────────────────────────────────────────────┘
```

---

## Modelo de Contexto de 4 Ejes

Cada selección de surface, tono del agente y carga inicial del workspace está gobernada por cuatro dimensiones independientes:

```
  Rol             leader | member
  NivelTécnico    high-tech | low-tech
  FaseUrgencia    normal | focus | urgente | pánico | expirado  (siempre derivada)
  Especialización developer | designer | qa | manager | writer | other
```

- El **Surface Registry** verifica `visibleToRoles`, `visibleToTechLevels` y `visibleToSpecializations` antes de montar cualquier surface
- **`getInitialSurfaces()`** selecciona y monta la surface apropiada al cargar el workspace, sin interacción con el agente
- Los **prompts del agente** usan la especialización para adaptar el tono: desarrolladores reciben ejemplos de código, diseñadores reciben framing UX, QA recibe criterios de aceptación

```
  Especialización → routing de surfaces               Especialización → tono del agente
  ─────────────────────────────────────               ─────────────────────────────────
  developer     → DebugSession / TechStack            "Revisá el error en la línea 42..."
  designer      → DesignBriefPanel                   "El flujo de usuario para esta pantalla..."
  qa            → TestCaseBoard / DebugSession        "Criterios: dado X, cuando Y..."
  manager       → TeamVelocityPanel                  "3 miembros están por debajo del 30%..."
  writer        → WritingChecklist / ContentOutline   "Tu estructura: intro → cuerpo..."
  other/low-tech → BeginnerGuide / Checklist         "Paso 1: Abrí la tarea y leé..."
```

---

## Topología Multi-Agente

El sistema agente usa un modelo hub-and-spoke. El **Orchestrator** es el punto de entrada para cada mensaje del usuario. Clasifica la intención y delega a sub-agentes especializados para mantener el contexto enfocado.

```
                    ┌─────────────────────┐
                    │     Orchestrator     │
                    │                     │
                    │  • Routing general  │
                    │  • Reset workspace  │
                    │  • Todas las tools  │
                    └────────┬────────────┘
                             │ delega
              ┌──────────────┴──────────────┐
              │                             │
   ┌──────────▼──────────┐     ┌────────────▼────────────┐
   │       Planner        │     │         Coach            │
   │                      │     │                          │
   │  create/update/      │     │  get_documents           │
   │  delete task         │     │  create_blocker          │
   │  create/update/      │     │  update_task_status      │
   │  delete milestone    │     │  TechnicalStepper        │
   │  update/delete       │     │  BeginnerGuidePanel      │
   │  blocker/member      │     │                          │
   └──────────────────────┘     └──────────────────────────┘

   Herramientas frontend compartidas:
   renderSurface · setMascotMood · logActivity
   reportBlocker · highlightTasks · updateTask · setCrewState
```

---

## Surfaces — Paneles de UI Generativa

Cada surface es un componente React con un `manifest.ts` que declara su ID, región destino, capacidades requeridas y fases de urgencia compatibles. 24 surfaces en total.

```
  Surface                  │ Zona              │ Especialización
  ─────────────────────────┼───────────────────┼─────────────────────────
  TaskSuggestionPanel      │ primary-workzone  │ cualquiera
  FocusedTaskPanel         │ primary-workzone  │ cualquiera
  TriageWarRoom            │ primary-workzone  │ cualquiera (solo pánico)
  ForceGraph               │ primary-workzone  │ cualquiera
  IdeaMatrix               │ primary-workzone  │ cualquiera
  ChecklistPanel           │ primary-workzone  │ cualquiera
  TroubleshootingWizard    │ primary-workzone  │ cualquiera
  DebugSession             │ primary-workzone  │ developer · qa
  TechStackPanel           │ primary-workzone  │ developer (high-tech)
  DesignBriefPanel         │ primary-workzone  │ designer
  ComponentChecklist       │ primary-workzone  │ designer
  TestCaseBoard            │ primary-workzone  │ qa
  BugReportForm            │ primary-workzone  │ qa · developer
  TeamVelocityPanel        │ primary-workzone  │ manager
  StakeholderUpdate        │ primary-workzone  │ manager
  WritingChecklist         │ primary-workzone  │ writer
  ContentOutlinePanel      │ primary-workzone  │ writer
  ─────────────────────────┼───────────────────┼─────────────────────────
  MilestoneSummary         │ context-rail      │ cualquiera
  BlockerInsight           │ context-rail      │ cualquiera
  DocumentSummary          │ context-rail      │ cualquiera
  BeginnerGuide            │ context-rail      │ cualquiera (low-tech)
  MemberAction             │ context-rail      │ cualquiera
  ─────────────────────────┼───────────────────┼─────────────────────────
  CountdownCritical        │ ambient-overlay   │ cualquiera (focus+)
  AmbientOverlayWidget     │ ambient-overlay   │ cualquiera (focus+)
```

---

## Companion Habitat

Un mini-habitat estilo Tamagotchi (240×180px) embebido en el workspace. No es un widget de estado — es una presencia del agente encarnada que reacciona a eventos del equipo en tiempo real.

El Companion está manejado por una máquina xstate con 6 estados comportamentales. Sus props visuales (roca, trofeo, llama) son añadidos y removidos dinámicamente por el agente vía la herramienta frontend `setMascotMood`.

```
  Estados de clima (5):   soleado → nublado → lluvia → tormenta → noche
  Humores (8):            calm · focused · worried · panicking
                          celebrating · sleeping · thinking · guiding
  Máquina xstate (6):     idle · alert · celebrating · thinking
                          sleeping · guiding

  Señales del Event Bus:
    BLOCKER_CREATED      → worried / props: roca añadida
    BLOCKER_RESOLVED     → calm    / props: roca removida
    MILESTONE_COMPLETE   → celebrating / props: trofeo
    PHASE_CHANGE(panic)  → panicking / props: llama
    AGENT_TOOL_CALL      → thinking
```

---

## Motor de Capacidades y Política

Cada herramienta Python está decorada con `@guarded_tool`, que declara las capacidades requeridas, nivel de riesgo e impacto esperado antes de poder registrarse. Esto se verifica al arrancar — una herramienta sin declaración de capacidades no puede agregarse a ninguna lista de tools del agente.

En runtime, cada llamada a una herramienta pasa por el PolicyEngine sincrónicamente. Las llamadas permitidas se ejecutan de inmediato y se registran en el audit log. Las llamadas marcadas `pending` — típicamente operaciones de alto riesgo — son interceptadas y se renderiza una surface ApprovalGate en el frontend.

---

## Stack

```
  ┌──────────────────────────────────────────────────────┐
  │  FRONTEND                                            │
  │  Next.js 15 · React 19 · Tailwind CSS 4             │
  │  shadcn/ui · Framer Motion · xstate · Rive          │
  │  CopilotKit v2 · Zod                                │
  ├──────────────────────────────────────────────────────┤
  │  BFF                                                 │
  │  Hono (Node 20) · CopilotKit Runtime v2             │
  │  LangGraphAgent bridge · TimingMiddleware            │
  ├──────────────────────────────────────────────────────┤
  │  AGENTE                                              │
  │  Python 3.11 · LangGraph · Pydantic                 │
  │  Gemini Flash (default) · Claude Sonnet (alternativo)│
  │  AsyncPostgresSaver · @guarded_tool                  │
  ├──────────────────────────────────────────────────────┤
  │  AUTH & COMUNICACIONES                               │
  │  NextAuth v5 · Resend magic-link                    │
  ├──────────────────────────────────────────────────────┤
  │  DATOS                                               │
  │  PostgreSQL (Neon) · Redis (Upstash)                │
  │  i18n: Español + Inglés, persistido por cookie      │
  ├──────────────────────────────────────────────────────┤
  │  OBSERVABILIDAD                                      │
  │  Sentry (@sentry/nextjs v8)                         │
  │  Lighthouse CI (presupuesto de performance ≥90)     │
  ├──────────────────────────────────────────────────────┤
  │  TESTING                                             │
  │  Vitest (tests unitarios frontend)                  │
  │  pytest (tests unitarios Python, uv --group dev)    │
  ├──────────────────────────────────────────────────────┤
  │  DEPLOY                                              │
  │  Vercel (frontend) · Render (BFF + agente)          │
  │  Neon (DB) · Upstash (Redis) — todo tier gratuito   │
  └──────────────────────────────────────────────────────┘
```

---

## Inicio Rápido

### Prerequisitos

```
Node.js 20+
Python 3.11+ con uv
Docker Desktop
```

### Setup Local

```bash
# 1. Clonar
git clone https://github.com/Miltondz/crew-companion.git
cd crew-companion

# 2. Variables de entorno
cp .env.example .env
# Requeridas: GEMINI_API_KEY, AUTH_SECRET, DATABASE_URL, RESEND_API_KEY

# 3. Instalar dependencias
npm install
cd apps/agent && uv sync && cd ../..

# 4. Levantar infraestructura (Postgres + Redis vía Docker)
npm run dev:infra

# 5. Ejecutar migraciones
bash scripts/migrate.sh up

# 6. Seed del workspace demo
npm run seed

# 7. Levantar todo
npm run dev
```

Abrir `http://localhost:3010`

### Servicios Individuales

```bash
npm run dev:ui      # Solo frontend  ── :3010
npm run dev:bff     # Solo BFF       ── :4000
npm run dev:agent   # Agente Python  ── :8123
npm run dev:infra   # Solo Docker
npm run kill-ports  # Liberar puertos antes de reiniciar
```

### Ejecutar Tests

```bash
# TypeScript (Vitest) — 19 tests (registry + layout-engine)
cd apps/frontend && npm run test

# Python (pytest) — 31 tests de herramientas
cd apps/agent && uv run pytest -v

# Sincronizar capacidades Python → TypeScript
npm run sync:capabilities
```

---

## Variables de Entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `GEMINI_API_KEY` | Sí | [Google AI Studio](https://aistudio.google.com) — LLM por defecto |
| `AUTH_SECRET` | Sí | `openssl rand -base64 32` |
| `DATABASE_URL` | Sí | Neon (prod) o Docker `localhost:5433` (local) |
| `RESEND_API_KEY` | Sí | [Resend](https://resend.com) — emails magic-link |
| `NEXTAUTH_URL` | Sí | URL pública de la app |
| `BFF_URL` | Sí (prod) | URL del servicio BFF en Render |
| `ANTHROPIC_API_KEY` | No | LLM alternativo (Claude Sonnet) |
| `COPILOTKIT_API_KEY` | No | CopilotKit Intelligence — persistencia de threads |

---

## Invariantes Arquitectónicos

```
  1. Separación Frontend/BFF/Agente
     El frontend nunca llama al agente directamente.

  2. Sincronización de tipos TS ↔ Python
     Cualquier campo agregado a types.ts debe agregarse a types.py
     en el mismo commit.

  3. La fase de urgencia es derivada — nunca almacenada
     getUrgencyPhase(deadline) es la única fuente de verdad.

  4. Patrón Surface Registry
     Las surfaces se registran vía manifests.
     Sin switch/case, sin imports directos de componentes en routes.

  5. Protocolo Envelope
     Toda comunicación agente → frontend son envelopes tipados
     validados por Zod antes de llegar al Surface Registry.

  6. Declaraciones de capacidades
     Cada herramienta declara capacidades requeridas vía @guarded_tool.
     PolicyEngine evalúa antes de ejecutar.

  7. Autoridad del usuario en acciones destructivas
     El agente nunca auto-ejecuta operaciones de alto riesgo.
     ApprovalGate siempre se renderiza para decisiones pendientes.
```

---

## Contribuir

Issues y PRs bienvenidos. Leer `project-docs/MASTER_WORK_PLAN.md` para el roadmap completo y decisiones arquitectónicas antes de contribuir.

---

## Licencia

MIT — uso libre.

---

*Construido por Milton con Claude (Anthropic) como pair programmer de IA.*
