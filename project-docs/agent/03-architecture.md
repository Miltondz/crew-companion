# Crew Companion — Architecture

## Servicios y puertos

| Servicio | Stack | Puerto | Descripción |
|---------|-------|--------|-------------|
| `frontend` | Next.js 15 + React 19 + CopilotKit | 3010 | UI principal |
| `bff` | Hono + TypeScript + CopilotRuntime v2 | 4000 | Gateway CopilotKit |
| `agent` | Python + LangGraph + LangChain | 8123 | Agente de AI |
| `mcp` | TypeScript + mcp-use | 3001 | Widgets MCP (opcional) |
| `postgres` | Docker | 5433 | Threads CopilotKit Intelligence |
| `redis` | Docker | 6381 | Realtime CopilotKit |
| `intelligence-api` | Docker | 4203 | CopilotKit Intelligence API |
| `intelligence-ws` | Docker | 4403 | WebSocket realtime |

## Diagrama de flujo

```
Usuario (Browser)
    │
    ▼
Next.js App (:3010)
  ├─ /leader              → LeaderDashboard
  ├─ /member/[memberId]   → MemberWorkspace
  └─ /docs                → DocumentWorkspace
    │ (proxy /api/copilotkit/* → BFF)
    ▼
Hono BFF (:4000)
  ├─ CopilotRuntime v2
  ├─ Intelligence (threads via Postgres/Redis)
  └─ LangGraph Agent client
    │
    ▼
LangGraph Agent (:8123)
  ├─ Middleware: TimingMiddleware → CrewStateMiddleware → CopilotKitMiddleware
  ├─ Runtime: Gemini Flash (default) | Claude Sonnet 4.6 (switch via AGENT_RUNTIME)
  ├─ Frontend tools (ejecutados en React via CopilotKit)
  └─ Backend tools (ejecutados en Python)
```

## Estructura de carpetas del proyecto

```
crew-companion/
├── apps/
│   ├── frontend/               ← Next.js 15
│   │   └── src/
│   │       ├── app/
│   │       │   ├── leader/page.tsx          ← vista líder
│   │       │   ├── member/[memberId]/page.tsx  ← vista miembro
│   │       │   ├── docs/page.tsx            ← workspace documentos
│   │       │   └── layout.tsx
│   │       ├── components/
│   │       │   ├── leader/                  ← TaskBoard, MilestonePanel, TeamOverview
│   │       │   ├── member/                  ← TaskView, CountdownTimer, BlockerForm
│   │       │   ├── surfaces/                ← 12 UI surfaces tipadas
│   │       │   ├── mascot/                  ← CompanionMascot component
│   │       │   ├── docs/                    ← DocumentTabs, MarkdownViewer
│   │       │   └── copilot/                 ← CopilotKitProviderShell
│   │       ├── lib/
│   │       │   ├── crew/
│   │       │   │   ├── types.ts             ← domain types
│   │       │   │   ├── store.ts             ← Zustand store
│   │       │   │   ├── derive.ts            ← getUrgencyPhase, getMascotMood
│   │       │   │   └── seed.ts              ← datos de demo
│   │       │   └── markdown/
│   │       │       └── sanitize.ts          ← rehype-sanitize config
│   │       └── hooks/
│   │           ├── use-crew-state.ts
│   │           └── use-urgency-phase.ts
│   │
│   ├── bff/                    ← Hono + CopilotRuntime
│   │   └── src/server.ts
│   │
│   ├── agent/                  ← Python + LangGraph
│   │   ├── main.py
│   │   └── src/
│   │       ├── runtime.py      ← factory de runtimes
│   │       ├── crew_state.py   ← CrewStateMiddleware
│   │       ├── tools.py        ← backend tools
│   │       └── prompts.py      ← system prompt
│   │
│   └── mcp/                    ← MCP widgets (opcional MVP)
│
├── deployment/
│   └── docker-compose.yml      ← Postgres + Redis + Intelligence
├── scripts/
│   └── check-env.sh
└── package.json                ← workspace root
```

## Variables de entorno requeridas

```env
# Modelo (requerido uno de los dos)
GEMINI_API_KEY=
ANTHROPIC_API_KEY=           # solo si AGENT_RUNTIME=claude-sonnet

# Runtime del agente
AGENT_RUNTIME=gemini-flash-deep   # o: claude-sonnet-react

# CopilotKit
COPILOTKIT_LICENSE_TOKEN=
INTELLIGENCE_API_URL=http://localhost:4203
INTELLIGENCE_GATEWAY_WS_URL=ws://localhost:4403
INTELLIGENCE_API_KEY=

# Puertos Docker (evitar colisiones)
POSTGRES_HOST_PORT=5433
REDIS_HOST_PORT=6381
APP_API_HOST_PORT=4203
REALTIME_GATEWAY_HOST_PORT=4403

# LangGraph
LANGGRAPH_DEPLOYMENT_URL=http://localhost:8123
```

## Cómo correrlo (dev)

```bash
# 1. Setup inicial (solo una vez)
cp .env.example .env
# editar .env con tus API keys

# 2. Instalar dependencias
npm install   # instala Node workspaces + Python deps via uv

# 3. Levantar todo
npm run dev   # UI + BFF + Agent + Docker (Postgres/Redis)

# Comandos individuales:
npm run dev:ui       # solo frontend :3010
npm run dev:bff      # solo BFF :4000
npm run dev:agent    # solo agente :8123
npm run dev:infra    # solo Docker
```

## Diferencias clave vs el starter kit original

| Aspecto | Generative-UI Starter | Crew Companion |
|---------|----------------------|----------------|
| Dominio | Leads (CRM) | Crew (equipo hackathon) |
| Rutas | `/leads` | `/leader`, `/member/[id]`, `/docs` |
| Estado principal | `LeadCanvasState` | `CrewCanvasState` |
| Integración externa | Notion API | ninguna (local JSON) |
| UI surfaces | canvas de tarjetas | 12 surfaces tipadas + countdown |
| Mascota | no | sí (CompanionMascot) |
| Urgencia | no | sí (5 fases) |
| BFF puerto | 4010 | 4000 |
