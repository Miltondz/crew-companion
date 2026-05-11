# Crew Companion

> **Cognitive Operational Runtime for agile teams.**
> The interface adapts in real-time based on role, technical level, urgency phase, and active blockers.

---

## What is Crew Companion?

Crew Companion is not a project management dashboard. It is an adaptive work environment where the UI emerges from context. An AI agent observes team state — who you are, what's blocked, how close the deadline is — and renders typed UI surfaces directly in the conversation.

- **Leader** — kanban board, milestone panel, team overview, blocker resolution
- **Member** — active task view, countdown, personal AI coach adapted to technical level
- **Docs** — shared document workspace with AI Q&A
- **Mascot** — reacts to team state at a glance (calm → focused → worried → panicked → celebrating)

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Next.js 15 · React 19 · Tailwind 4 · shadcn/ui  │
│  Surface Registry · Spatial Grammar · Auth       │
│  /leader  /member/[id]  /docs                    │
└─────────────────────┬───────────────────────────┘
                      │  /api/copilotkit (proxy)
                      ▼
           ┌──────────────────────┐
           │  Hono BFF :4000       │
           │  CopilotRuntime v2   │
           │  workspace-scoped    │
           └──────────┬───────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │  LangGraph :8123      │
           │  Python agent        │
           │  Capability Engine   │
           │  Envelope protocol   │
           └──────────┬───────────┘
                      │
           ┌──────────┴──────────┐
           ▼                     ▼
    PostgreSQL :5433         Redis :6381
    Workspace state          Thread cache
    Auth sessions
    Audit log
```

### Services

| Service | Technology | Port |
|---------|-----------|------|
| Frontend | Next.js 15 + React 19 + Tailwind CSS 4 | 3010 |
| BFF | Hono + CopilotRuntime v2 | 4000 |
| Agent | Python + LangGraph | 8123 |
| Database | PostgreSQL (Docker / Neon) | 5433 |
| Cache | Redis (Docker / Upstash) | 6381 |
| Intelligence | CopilotKit thread service | 4203/4403 |

### Key Libraries

| Library | Role |
|---------|------|
| **CopilotKit v2** | Generative UI, durable threads, frontend↔agent state sync |
| **LangGraph** | Agent graph orchestration, AsyncPostgresSaver checkpoints |
| **next-auth v5** | Magic-link auth via Resend, database sessions |
| **Resend** | Transactional email for magic-link delivery |
| **shadcn/ui** | Radix + Tailwind component primitives |
| **Framer Motion** | Page transitions and surface animations |
| **Sonner** | Toast notifications on mutations |
| **cmdk** | Command palette (⌘K) |
| **canvas-confetti** | Milestone celebration |
| **Gemini Flash** | Default LLM (Flash-Deep for reasoning) |

---

## Core Concepts

### Urgency Phase System

Computed from nearest milestone deadline — never stored, always derived:

```
> 30 min  → normal   — calm gradient, standard interface
15–30 min → focus    — yellow accent, attention cues
 5–14 min → urgent   — orange, banner, action priority rises
  0–4 min → panic    — red pulse, mascot worried
     < 0  → expired  — dark red, immediate action required
```

Every page background, surface, mascot mood, and banner responds automatically.

### Surface Registry

Surfaces register via manifests — no switch/case, no static imports. Agent emits typed envelopes; the registry resolves the correct component by capability + role + phase.

```
Agent emits SurfaceEnvelope → BFF correlates → Frontend SurfaceRegistry
→ capability check → lazy-load component → mount in correct spatial zone
```

### Spatial Grammar

Six layout zones managed by LayoutEngine:

| Zone | Purpose |
|------|---------|
| `primary-workzone` | Main content area |
| `context-rail` | Persistent context cards (pinnable) |
| `agent-rail` | Agent-generated surfaces |
| `activity-stream` | Real-time event feed |
| `command-surface` | Action bar |
| `ambient-overlay` | Phase-reactive background overlays |

### Capability Engine

Every agent tool declares required capabilities (`@guarded_tool`). PolicyEngine evaluates before execution. All decisions written to audit log.

### Envelope Protocol

All agent → frontend communication is typed `SurfaceEnvelope` (12 fields, Pydantic + Zod schema sync). BFF logs correlation IDs. Frontend accepts both full and legacy shapes.

---

## Application Routes

| Route | Role | Key features |
|-------|------|-------------|
| `/leader` | Team leader | Kanban, milestone panel, team overview, blockers, command palette |
| `/member/[memberId]` | Member | Active task, countdown, blocker form, task list |
| `/docs` | Everyone | Document sidebar, AI-powered Q&A |
| `/auth/signin` | Public | Magic-link sign-in (Resend) |

---

## Domain Model

```typescript
TeamMember     { id, name, role, technicalLevel, activeBlockerId? }
Task           { id, title, description, assignedTo, status, priority, milestoneId? }
Milestone      { id, title, deadline (ISO), taskIds[] }
Blocker        { id, memberId, description, reportedAt, resolved }
SharedDocument { id, title, content (markdown), sharedBy, sharedAt }
```

TypeScript and Python types are kept in strict sync:
- `apps/frontend/src/lib/crew/types.ts`
- `apps/agent/src/types.py`

---

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+ with `uv`
- Docker Desktop

### Installation

```bash
git clone https://github.com/Miltondz/crew-companion.git
cd crew-companion

# Configure environment
cp .env.example .env
# Required: GEMINI_API_KEY, AUTH_SECRET, RESEND_API_KEY
# See .env.example for full reference

# Install dependencies
npm install
cd apps/agent && uv sync && cd ../..

# Start Postgres + Redis + CopilotKit Intelligence
npm run dev:infra

# Run DB migrations
bash scripts/migrate.sh up

# Seed the database (first run only)
npm run seed

# Start all services
npm run dev
```

Open [http://localhost:3010/leader](http://localhost:3010/leader)

### Individual services

```bash
npm run dev:ui       # Frontend   → http://localhost:3010
npm run dev:bff      # BFF        → http://localhost:4000
npm run dev:agent    # Agent      → http://localhost:8123
npm run dev:infra    # Docker stack (Postgres + Redis + Intelligence)
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key (aistudio.google.com) |
| `AUTH_SECRET` | Yes | Random 32-char secret — `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | App URL, e.g. `http://localhost:3010` |
| `RESEND_API_KEY` | Yes | Resend API key for magic-link emails |
| `AUTH_EMAIL_FROM` | Yes | Verified sender address in Resend |
| `DATABASE_URL` | Yes | Postgres connection string |
| `AGENT_RUNTIME` | No | `gemini-flash-deep` (default) \| `claude-sonnet-4-6-react` |
| `ANTHROPIC_API_KEY` | Optional | Only for `claude-sonnet-4-6-react` runtime |
| `INTELLIGENCE_API_KEY` | Yes | CopilotKit Intelligence auth key |
| `INTELLIGENCE_API_URL` | Yes | Default: `http://localhost:4203` |
| `INTELLIGENCE_GATEWAY_WS_URL` | Yes | Default: `ws://localhost:4403` |
| `LANGSMITH_API_KEY` | Optional | LangSmith tracing |

### Port map

| Service | Container | Host |
|---------|-----------|------|
| PostgreSQL | 5432 | 5433 |
| Redis | 6379 | 6381 |
| Intelligence API | 4201 | 4203 |
| Intelligence WS | 4401 | 4403 |

---

## Navigating the demo

1. Visit `http://localhost:3010` — redirected to sign-in
2. Enter your email → magic link sent via Resend
3. Click link → land on `/leader`

Role navigation:
- **`/leader`** — team overview, kanban, milestone progress
- **`/member/m1`** — Alex (leader-role, high-tech)
- **`/member/m2`** — Sam (member, low-tech) — ask "I don't understand how to start"
- **`/member/m3`** — Jordan (member, high-tech) — ask "show me a checklist for my task"
- **`/docs`** — ask "summarize the tech stack"

Keyboard: **⌘K** (or Ctrl+K) opens command palette — navigate pages, members, tasks.

Dev-only urgency simulator (bottom of leader page):
- **Normal** → calm gradient
- **Focus** → yellow accent
- **Urgent** → orange, banner activates
- **Panic** → red pulse + confetti on task complete

---

## Project Status

### ✅ Phase A — Kernel (complete)

- **Surface Registry** — manifest-based, lazy-load, capability-gated surfaces
- **Envelope Protocol** — typed `SurfaceEnvelope` (TS ↔ Python sync, BFF correlation)
- **Capability Engine** — `@guarded_tool` decorator, PolicyEngine, audit log (Postgres)
- **Persistence** — AsyncPostgresSaver, `workspace_state` table, 9 SQL migrations
- **Spatial Grammar** — LayoutEngine, 6 regions, pinning (localStorage), WorkspaceShell

### ✅ Phase B — Auth + Quick Wins (complete)

- **Auth** — NextAuth v5 + Resend magic-link, database sessions, workspace-scoped threads
- **Toasts** — Sonner on all mutations (add task, resolve blocker, mark done, report blocker)
- **Confetti** — canvas-confetti on task done and milestone completion
- **Skeleton loaders** — per route, layout-matched
- **EmptyState** — reusable component across all pages
- **Phase backgrounds** — `phase-bg-*` CSS classes wired to live urgency state
- **Page transitions** — Framer Motion entrance animations
- **Dark mode** — next-themes toggle in header
- **Error boundaries** — branded `error.tsx` per route with retry
- **Command palette** — ⌘K, navigates pages/members/tasks

### 🔄 Phase B — In Progress

- Activity stream real events
- Mobile chat drawer (<768px)
- Wire renderSurface to LayoutEngine

### ⏳ Phase B — Product (upcoming)

- Multi-agent: Orchestrator + Planner + Coach specialists
- Rive animated mascot (Imagen-generated art → Rive state machine)
- WorkspaceShell migration (pages → role context filters)
- 12 advanced surfaces (Force Graph, Causal Chain, Idea Matrix…)

### ⏳ Phase C — Deploy

- Vercel (frontend) + Render (BFF+agent) + Neon (Postgres) + Upstash (Redis)
- All free tier, $0/mo

---

## Project Documentation

```
project-docs/
├── MASTER_WORK_PLAN.md        ← full execution plan, phases, invariants
├── PROJECT_STRUCTURE.md       ← file map with descriptions
├── design-notes/
│   ├── 3.1-surface-registry.md
│   ├── 3.2-spatial-grammar.md
│   └── 3.3-capability-engine.md
├── agent/
│   ├── 01-overview.md
│   ├── 02-domain-model.md
│   ├── 03-architecture.md
│   ├── 04-surface-matrix.md   ← agent decision table
│   ├── 05-prompts-and-tools.md
│   └── 06-mvp-scope.md
└── arquitectura/              ← philosophy, workspace grammar, runtime evaluation
```
