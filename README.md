# Crew Companion

> **Cognitive Operational Runtime for project teams.**  
> The interface transforms based on who you are, how urgent things are, and what's blocking you — not the other way around.

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js_15-black?logo=next.js)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python_3.11-3776AB?logo=python&logoColor=white)](https://python.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-orange)](https://langchain-ai.github.io/langgraph)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

</div>

---

## What it is

Crew Companion is **not a dashboard with AI bolted on**. It's a runtime where:

- The **agent decides intent** — what surface/data is semantically needed
- The **runtime decides composition** — layout, density, lifecycle, conflicts
- The **policy layer decides viability** — capabilities, audit, approval gates
- The **user decides authority** — confirmations, pinning, final say

The interface *emerges* from context. It doesn't get navigated.

---

## The core differentiator

| Typical AI tool | Crew Companion |
|---|---|
| Static layouts with AI widgets | Generative UI surfaces triggered by agent intent |
| Same UI for everyone | Role × TechLevel × UrgencyPhase → unique workspace |
| Manual status updates | State machine drives mascot, colors, surface routing |
| One project per account | Multi-project dashboard, invite-link team sharing |
| Chat-first interface | Spatial grammar: 6 zones, pinning, ambient overlays |

---

## Urgency engine

Every workspace has a live urgency phase derived from the nearest deadline:

```
normal → focus → urgent → panic → expired
```

Phase changes trigger: color scheme, surface routing, mascot mood, layout density. No configuration — automatic.

---

## Surfaces (generative UI panels)

The agent emits typed envelopes. The Surface Registry maps them to components, validates capabilities, and mounts them in spatial zones.

| Surface | Zone | Purpose |
|---|---|---|
| CountdownCritical | ambient-overlay | Live deadline counter + viability ring + blockers |
| MilestoneSummaryPanel | context-rail | Sprint progress by urgency phase |
| TaskSuggestionPanel | primary-workzone | AI-ranked task queue |
| FocusedTaskPanel | primary-workzone | Single task spotlight — planner highlights, coach adds note |
| BlockerInsightPanel | context-rail | Blocker analysis + resolution paths |
| TriageWarRoom | primary-workzone | Full war-room dashboard for panic phase |
| ForceGraph | primary-workzone | Task dependency visualization |
| IdeaMatrix | primary-workzone | 2x2 impact/effort grid |
| ChecklistPanel | primary-workzone | Interactive checklist |
| TroubleshootingWizard | primary-workzone | Decision tree for technical blockers |
| DocumentSummaryPanel | context-rail | AI-summarized shared document with file type thumbnail |
| BeginnerGuidePanel | context-rail | Step-by-step for low-tech members |
| MemberActionPanel | context-rail | Member-specific action list |
| AmbientOverlayWidget | ambient-overlay | Ambient urgency signal |

CountdownCritical supports `variant: 'compact' | 'full'` and `orientation: 'vertical' | 'horizontal'` with optional section visibility.

`FocusedTaskPanel` is routed by both Planner (task spotlight, no coachNote) and Coach (task help, with coachNote). `DocumentSummaryPanel` includes a `FileCard` thumbnail that infers file type from extension or `documentFormat` field.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, Tailwind CSS 4, shadcn/ui, framer-motion, xstate, **three.js** |
| BFF | Hono on Node 20 + CopilotKit Runtime v2 |
| Agent | Python 3.11, LangGraph, Pydantic, Gemini Flash |
| Auth | NextAuth v5 + Resend magic-link |
| Database | PostgreSQL (AsyncPostgresSaver for agent checkpoints) |
| Cache | Redis (Upstash in prod) |
| Deploy | Vercel (frontend) + Render (BFF+agent) + Neon (DB) |

---

## Getting started

### Prerequisites

- Node.js 20+
- Python 3.11+ with `uv`
- Docker Desktop

### Local setup

```bash
# Clone
git clone https://github.com/Miltondz/crew-companion.git
cd crew-companion

# Environment
cp .env.example .env
# Required: GEMINI_API_KEY, AUTH_SECRET, DATABASE_URL, RESEND_API_KEY

# Install
npm install
cd apps/agent && uv sync && cd ../..

# Infrastructure (Postgres + Redis)
npm run dev:infra

# Database schema
bash scripts/migrate.sh up

# Seed demo data
npm run seed

# Start everything
npm run dev
```

Open `http://localhost:3010`

### Individual services

```bash
npm run dev:ui      # Frontend only  :3010
npm run dev:bff     # BFF only       :4000
npm run dev:agent   # Agent only     :8123
npm run dev:infra   # Docker only
```

### Marketing site

```
http://localhost:3010/features        Capability deep-dive
http://localhost:3010/how-it-works    Pipeline walkthrough
http://localhost:3010/roadmap         Phase status board
http://localhost:3010/about           Project context + architecture
```

### Visual component preview

```
http://localhost:3010/dev
```

Shows all CountdownCritical variants and any surfaces under active development.

---

## Project structure

```
apps/
  frontend/          Next.js 15 app
    src/app/         Routes: / (landing), /features, /how-it-works, /roadmap, /about, /dashboard, /leader, /member, /docs, /onboarding, /invite/[code], /share/[token], /status
    src/runtime/     Surface Registry, Layout Engine, envelope validation
    src/components/
      surfaces/      14 registered generative UI surfaces
      marketing/     Shared MarketingLayout (nav + footer) for public pages
      ui/            shadcn/ui primitives
  bff/               Hono server — CopilotKit bridge
  agent/
    src/
      agents/        LangGraph graph + nodes
      runtime/       Capability engine, policy, audit log
      tools.py       Tool declarations with @guarded_tool
      types.py       Python TypedDicts (must stay in sync with TS types)
    migrations/      SQL migrations (idempotent)
project-docs/        MASTER_WORK_PLAN.md, architecture docs
scripts/             migrate.sh, seed.ts
```

---

## Invariants (never violate)

1. **Frontend/BFF/Agent separation** — frontend never calls agent directly
2. **TS ↔ Python type sync** — same field additions in both `types.ts` and `types.py`
3. **Urgency phase is derived** — `getUrgencyPhase(deadline)` only, never stored
4. **Surface Registry** — surfaces register via manifests, no switch/case routing
5. **Envelope protocol** — all agent→frontend communication is typed envelopes through BFF
6. **Capability declarations** — every tool declares required capabilities via `@guarded_tool`
7. **User authority on destructive actions** — agent never auto-executes high-risk operations

---

## Multi-agent topology

Three LangGraph graphs registered in `langgraph.json` and bridged via Hono BFF:

| Agent | Role | Key tools |
|---|---|---|
| **Orchestrator** | General routing, workspace resets | all tools |
| **Planner** | Tasks, milestones, blockers, deadline triage | create_task, **update_task**, update_task_status, **delete_task**, create_milestone, **update_milestone**, resolve_blocker |
| **Coach** | Technical guidance, troubleshooting, docs | get_documents, create_blocker, update_task_status |

Full task CRUD: `create_task`, `update_task` (rename/reassign/reprioritize), `update_task_status`, `delete_task`.  
Full milestone CRUD: `create_milestone`, `update_milestone` (deadline/title).  
Frontend tools available to all agents: `renderSurface`, `setMascotMood`, `logActivity`, `reportBlocker`, `highlightTasks`, `updateTask`, `setCrewState`.

The Coach agent powers the **TechnicalStepper** in the Companion Panel — adaptive rescue flows for low-tech members.

---

## Companion Habitat

Tamagotchi-style mini habitat (240×180px) in the workspace corner. Not a status widget — an embodied agent presence.

- **5 weather states** driven by urgency phase (sunny → cloudy → rain → stormy → night)
- **8 creature moods** (calm / focused / worried / panicking / celebrating / sleeping / thinking / guiding)
- **Dynamic props** via `HabitatPropRegistry` — rocks for active blockers, trophies for milestones, flames in panic phase
- **Proactive speech bubbles** with CTA, anti-spam 5-min cooldown, auto-dismiss
- **xstate machine** — 6 states (idle / alert / celebrating / thinking / sleeping / guiding)
- **`CompanionEventBus`** — any component emits `BLOCKER_CREATED`, `MILESTONE_COMPLETE`, etc.
- **Companion Panel** — quick status grid + intent picker + TechnicalStepper (rescue mode branching)
- **Phase 2** (pending Rive assets): CSS/SVG sprites will be replaced by `.riv` animations

---

## Phase status

| Phase | Status | What |
|---|---|---|
| A — Kernel | ✅ Complete | Surface Registry, Layout Engine, Capability Engine, Persistence, Envelope Protocol |
| B — Product | ✅ Complete | Auth, WorkspaceShell, 13 surfaces, onboarding wizard, multi-project dashboard, invite + observer flows |
| Multi-agent | ✅ Complete | Orchestrator + Planner + Coach LangGraph topology |
| Companion Habitat | ✅ Phase 1 complete | xstate runtime, EventBus, PropRegistry, SVG creature, panel, stepper |
| Member identity | ✅ Complete | Member-slot linking: invite page picker → userId on state_json → auto-redirect to `/member/[id]` |
| C — Deploy | 🔄 In progress | Services live on Vercel+Render+Neon+Upstash; pending: full smoke test |

**Next:** Companion Habitat Phase 2 (Rive art), deploy smoke test.

### Agent-usability gap check (mandatory)

Every surface, frontend tool, Python tool, and agent prompt change must pass a 4-axis check before merge:
1. **Surface emittable** — manifest registered, agent routing table updated
2. **Full CRUD** — create + update + delete for every entity the agent manages
3. **Frontend tools complete** — both pages expose `logActivity`, `highlightTasks`, `reportBlocker`, `renderSurface`
4. **Prompts aware** — routing tables and AVAILABLE FRONTEND TOOLS sections reflect all new tools/surfaces

---

## Key environment variables

| Variable | Required | Source |
|---|---|---|
| `GEMINI_API_KEY` | Yes | [Google AI Studio](https://aistudio.google.com) |
| `AUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `DATABASE_URL` | Yes | Neon (prod) or Docker (local) |
| `RESEND_API_KEY` | Yes | [Resend](https://resend.com) |
| `NEXTAUTH_URL` | Yes | Your app URL |
| `ANTHROPIC_API_KEY` | No | Alternate LLM runtime |
| `COPILOTKIT_API_KEY` | No | CopilotKit Intelligence persistence |

---

## Contributing

Issues and PRs welcome. See `project-docs/MASTER_WORK_PLAN.md` for the full roadmap and architectural decisions before contributing.

---

## License

MIT — use freely.

---

*Built by Milton with Claude (Anthropic) as AI pair programmer.*
