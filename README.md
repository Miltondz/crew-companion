# Crew Companion

> **Agentic team coordination platform with generative UI.**
> The interface adapts in real-time based on who you are, your technical level, and how close the deadline is.

[Español](./README.es.md)

---

## What is Crew Companion?

Crew Companion is an agentic web application for teams. An AI agent orchestrator observes the team's context — role, technical level, urgency phase, active blockers — and dynamically renders typed UI components directly in the conversation.

- **Leader** sees task boards, milestone summaries, team overviews, blocker panels
- **Members** get personalized step-by-step wizards or checklists based on their technical level
- **Everyone** gets a different, context-aware interface driven by the same agent, updating in real-time
- **Animated mascot** reacts to events — calm during normal phases, worried when blockers appear, celebrating when milestones complete

---

## Core Concept: Generative UI

4 context variables the agent evaluates on every interaction:

| Variable | Options | Effect |
|----------|---------|--------|
| **Role** | `leader` / `member` | Data, actions, and surfaces available |
| **Technical Level** | `low-tech` / `high-tech` | Tone, detail level, surface type |
| **Urgency Phase** | `normal → focus → urgent → panic → expired` | Visual intensity and action priority |
| **Blocker Status** | active / none | Routes agent toward troubleshooting surfaces |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Next.js 15 frontend (React 19, Tailwind, shadcn/ui)     │
│  /leader  /member/[id]  /docs                            │
│  CopilotKit v2 chat embedded per page                    │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Hono BFF :4000       │
              │  CopilotRuntime v2   │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────────────────────┐
              │  LangGraph (Python) :8123             │
              │                                       │
              │  ┌─────────────┐                     │
              │  │ Orchestrator│  routes 70% directly │
              │  └──────┬──────┘                     │
              │    ┌────┴────┐                       │
              │    ▼         ▼                       │
              │ Planner   Coach                      │
              │ tasks,    per-member,                │
              │ estimates  tech-level                 │
              └──────────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
       PostgreSQL :5433         Redis :6381
       Intelligence threads     Rate limiting
```

### Services

| Service | Technology | Port |
|---------|-----------|------|
| **Frontend** | Next.js 15 + React 19 + Tailwind CSS 4 | 3010 |
| **BFF** | Hono + TypeScript + CopilotRuntime v2 | 4000 |
| **Agent** | Python + LangGraph + LangChain | 8123 |
| **MCP Server** | TypeScript + mcp-use | 3001 |
| **Database** | PostgreSQL (Docker) | 5433 |
| **Cache** | Redis (Docker) | 6381 |

### Key Libraries

- **[CopilotKit v2](https://copilotkit.ai)** — Generative UI runtime, durable threads, frontend↔agent state sync
- **LangGraph** — Multi-agent orchestration with supervisor topology
- **shadcn/ui** — Component library (Radix UI + Tailwind)
- **Framer Motion** — Animations and transitions
- **LLM** — Google Gemini Flash (default) / Anthropic Claude Sonnet 4.6 (configurable)

---

## Application Routes

| Route | User | Description |
|-------|------|-------------|
| `/leader` | Team leader | Kanban board, milestone panel, team overview, embedded AI chat |
| `/member/[memberId]` | Team member | Active task, countdown, blocker panel, embedded AI coach |
| `/docs` | Everyone | Document workspace with AI-powered Q&A |

Each page has its own **visual identity**, **embedded CopilotChat**, and **role-specific controls** that adapt based on urgency phase and active blockers.

---

## Urgency Phase System

Crew Companion monitors the nearest milestone deadline and updates the entire UI:

```
> 30 min  →  normal   — calm blue, standard interface
15–30 min  →  focus    — yellow, attention cues appear
 5–14 min  →  urgent   — orange, banner, action bar changes
  0–4 min  →  panic    — red, pulsing, mascot worried, "ship now" CTA
    < 0    →  expired  — dark red, immediate action required
```

Every component, surface, mascot mood, and action bar item responds automatically.

---

## The 8 AI Surfaces

Agent renders one of these typed components based on role + phase + blocker context:

| Surface | Audience | Trigger |
|---------|----------|---------|
| `TaskSuggestionPanel` | Leader | Task management requests |
| `MilestoneSummaryPanel` | Leader | Milestone review or panic phase |
| `BlockerInsightPanel` | Leader | Member reports blocker |
| `MemberActionPanel` | Any | Team coordination, panic phase |
| `BeginnerGuidePanel` | Member (low-tech) | Help request, no blocker |
| `ChecklistPanel` | Member (high-tech) | Task execution |
| `TroubleshootingWizard` | Member (low-tech) | Active blocker |
| `DocumentSummaryPanel` | Any | Document questions |

Full decision matrix: `project-docs/agent/04-surface-matrix.md`

---

## The Mascot

Rive-animated companion that reflects team state at a glance:

| Mood | Trigger | Animation |
|------|---------|-----------|
| `calm` | Normal phase, no blockers | Ambient breathing, blinks |
| `focused` | Focus/urgent phase | Concentrated expression |
| `worried` | Active blocker | Gentle bounce, concerned eyes |
| `panicked` | Panic/expired phase | Pulse animation, sweat drops |
| `celebrating` | Milestone completed | Backflip + confetti |

---

## Domain Model

```typescript
TeamMember     { id, name, role, technicalLevel, activeBlockerId? }
Task           { id, title, description, assignedTo, status, priority, milestoneId? }
Milestone      { id, title, deadline (ISO), taskIds[] }
Blocker        { id, memberId, description, reportedAt, resolved }
SharedDocument { id, title, content (markdown), sharedBy, sharedAt }
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+ with `uv`
- Docker Desktop
- Gemini API key

### Installation

```bash
git clone https://github.com/Miltondz/crew-companion.git
cd crew-companion

# Configure environment
cp .env.example .env
# Edit .env — minimum required: GEMINI_API_KEY, INTELLIGENCE_API_KEY

# Install dependencies
npm install
cd apps/agent && uv sync && cd ../..

# Start Postgres + Redis + CopilotKit Intelligence
npm run dev:infra

# Seed the database (first run only)
npm run seed

# Start all services
npm run dev
```

Open [http://localhost:3010](http://localhost:3010) → leader dashboard

### Individual services

```bash
npm run dev:ui       # Frontend   → http://localhost:3010
npm run dev:bff      # BFF        → http://localhost:4000
npm run dev:agent    # Agent      → http://localhost:8123
npm run dev:infra    # Docker stack
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key (get at aistudio.google.com) |
| `AGENT_RUNTIME` | No | `gemini-flash-deep` (default) or `claude-sonnet-react` |
| `ANTHROPIC_API_KEY` | Optional | Only for `claude-sonnet-react` runtime |
| `NEXT_PUBLIC_COPILOT_CLOUD_PUBLIC_API_KEY` | Yes | CopilotKit Cloud public key (`ck_pub_...`) |
| `INTELLIGENCE_API_URL` | Yes | CopilotKit Intelligence API (default: http://localhost:4203) |
| `INTELLIGENCE_GATEWAY_WS_URL` | Yes | CopilotKit Intelligence WS (default: ws://localhost:4403) |
| `INTELLIGENCE_API_KEY` | Yes | CopilotKit Intelligence auth key |
| `LANGSMITH_API_KEY` | Optional | LangSmith tracing |
| `PYTHONUTF8` | Yes (Windows) | Set to `1` to fix encoding issues on Windows |

### Port map

| Service | Container port | Host port (remapped) |
|---------|---------------|---------------------|
| PostgreSQL | 5432 | 5433 |
| Redis | 6379 | 6381 |
| Intelligence API | 4201 | 4203 |
| Intelligence WS | 4401 | 4403 |

Remaps avoid collisions with other local stacks. All in `.env` — no code change needed to restore defaults.

---

## Navigating the demo

- **`/leader`** — Full team view, task board, milestone progress
- **`/member/m1`** — Alex's workspace (leader-role member, high-tech)
- **`/member/m2`** — Sam's workspace (member, low-tech) → ask "I don't understand how to start"
- **`/member/m3`** — Jordan's workspace (member, high-tech) → ask "show me a checklist for my task"
- **`/docs`** — Document viewer, ask "summarize the tech stack"

Dev-only urgency simulator (bottom of leader page):
- **Normal** → calm UI
- **Focus** → yellow accent
- **Urgent** → orange, action bar changes
- **Panic** → red pulse, mascot worried, emergency CTA

---

## Project Status

### ✅ Phase 0 — Planning & Documentation
Full spec, architecture, domain model, surface contracts, developer guides.

### ✅ Phase 1 — Setup
Starter kit adapted, routes scaffolded, dev environment working.

### ✅ Phase 2 — Domain
TypeScript types, derive functions, seed data, crew state.

### ✅ Phase 3 — Frontend
Three routes with CopilotKit v2, role-specific designs (indigo/emerald/violet), embedded chat, navigation, forms.

### ✅ Phase 4 — UI Surfaces + Components
All 8 surfaces, MilestoneCountdown (live), MascotSVG, TaskCard, MilestonePanel, TeamOverview, ActiveTaskView, UrgencyBanner.

### ✅ Phase 5 — Python Agent
LangGraph agent, crew state middleware, 6 backend tools, system prompt with surface decision table, LangSmith tracing.

### 🔄 Phase 6 — Polish (in progress)
See `project-docs/POLISH_PLAN.md` for the full 6-week roadmap:
- Auth (NextAuth + Resend magic-link)
- Multi-agent orchestrator (3 agents: Orchestrator, Planner, Coach)
- Rive animated mascot
- Drag-drop kanban
- Role/stage/problem-aware action bar
- Free-tier production deploy (Vercel + Render + Neon + Upstash)

---

## Project Documentation

```
project-docs/
├── POLISH_PLAN.md           ← 6-week post-MVP roadmap (start here)
├── agent/
│   ├── 01-overview.md
│   ├── 02-domain-model.md
│   ├── 03-architecture.md
│   ├── 04-surface-matrix.md  ← agent decision table
│   ├── 05-prompts-and-tools.md
│   └── 06-mvp-scope.md
├── dev-milton/               ← phased dev tasks
├── dev-companion/            ← component specs, style guide
└── gemini-tasks/             ← T01-T15 component specs
```

---

## Based On

Built on the **[Generative-UI Global Hackathon Starter Kit](https://github.com/jerelvelarde/Generative-UI-Global-Hackathon-Starter-Kit)** — CopilotKit + LangGraph + Hono + Docker. Crew Companion replaces the leads domain with a team coordination platform.
