# Crew Companion

> **Generative UI coordination app for hackathon teams.**
> The interface adapts in real-time based on who you are, how technical you are, and how close the deadline is.

[Español](./README.es.md)

---

## What is Crew Companion?

Crew Companion is an agentic web application built for hackathon teams. Unlike traditional dashboards with a chat widget bolted on the side, **the chat IS the interface**. An AI agent observes the team's context — role, technical level, urgency phase, and active blockers — and dynamically renders typed UI components directly in the conversation.

The result: a leader sees task suggestion panels and milestone summaries. A non-technical team member gets step-by-step guided wizards. Everyone gets a different interface, driven by the same agent, updating in real-time.

---

## Core Concept: Generative UI

The app operates on 4 context variables that the agent evaluates on every interaction:

| Variable | Options | Effect |
|----------|---------|--------|
| **Role** | `leader` / `member` | Determines what data and actions are available |
| **Technical Level** | `low-tech` / `high-tech` | Controls tone, detail level, and surface type |
| **Urgency Phase** | `normal` → `focus` → `urgent` → `panic` → `expired` | Drives visual intensity and action priority |
| **Blocker Status** | active / none | Shifts the agent toward troubleshooting surfaces |

---

## Tech Stack

### Infrastructure (from [Generative-UI Global Hackathon Starter Kit](https://github.com/jerelvelarde/Generative-UI-Global-Hackathon-Starter-Kit))

| Service | Technology | Port |
|---------|-----------|------|
| **Frontend** | Next.js 15 + React 19 + Tailwind CSS 4 | 3010 |
| **BFF** | Hono + TypeScript + CopilotRuntime v2 | 4000 |
| **Agent** | Python + LangGraph + LangChain | 8123 |
| **MCP Server** | TypeScript + mcp-use | 3001 |
| **Database** | PostgreSQL (Docker) | 5433 |
| **Cache** | Redis (Docker) | 6381 |

### Key Libraries

- **[CopilotKit](https://copilotkit.ai)** — Generative UI runtime, durable threads, frontend↔agent state sync
- **LangGraph** — Stateful agent orchestration with middleware chain
- **Zustand** — Frontend state store for crew state (tasks, milestones, members, blockers)
- **shadcn/ui** — Component library (Radix UI + Tailwind)
- **LLM** — Google Gemini Flash (default) / Anthropic Claude Sonnet 4.6 (configurable)

---

## Application Routes

| Route | User | Description |
|-------|------|-------------|
| `/leader` | Team leader | Dashboard: task board, milestone panel, team overview, chat |
| `/member/[memberId]` | Team member | Personal workspace: active task, countdown, blocker reporting, chat |
| `/docs` | Everyone | Shared document workspace with AI-powered Q&A |
| `/` | — | Redirects to `/leader` |

---

## Urgency Phase System

Crew Companion continuously monitors the nearest milestone deadline and updates the UI phase accordingly:

```
> 30 min  →  normal   — calm interface, standard colors
15–30 min  →  focus    — yellow accent, attention cues
 5–14 min  →  urgent   — orange, banner visible
  0–4 min  →  panic    — red, pulsing elements, mascot worried
    < 0    →  expired  — full red, immediate action surfaces
```

Every component, surface, and mascot mood responds to the current phase automatically.

---

## The 12 UI Surfaces

The agent selects and renders one of these typed components based on context (see `project-docs/agent/04-surface-matrix.md` for the full decision matrix):

| Surface | Audience | Trigger |
|---------|----------|---------|
| `task_suggestion_panel` | Leader | Task management requests |
| `milestone_summary_panel` | Leader | Milestone review or panic phase |
| `blocker_insight_panel` | Leader | Active blocker reported by member |
| `member_action_panel` | Any | Team coordination or panic phase |
| `role_assignment_panel` | Leader | Role/assignment queries |
| `beginner_guide_panel` | Member (low-tech) | Help request, no active blocker |
| `guided_setup_panel` | Member (low-tech) | Task execution guidance |
| `troubleshooting_wizard` | Member (low-tech) | Active blocker |
| `commands_panel` | Member (high-tech) | Help or task requests |
| `checklist_panel` | Member (high-tech) | Task step-by-step |
| `comparison_panel` | Member (high-tech) | Option comparison requests |
| `document_summary_panel` | Any | Document questions |

---

## The Mascot

A persistent companion in the bottom-right corner that reflects the team's state at a glance:

| Mood | Trigger |
|------|---------|
| `calm` 😊 | Phase: normal, no blockers |
| `focus` 🎯 | Phase: focus |
| `worried` 😰 | Phase: urgent or active blocker |
| `panic` 🚨 | Phase: panic or expired |
| `celebrate` 🎉 | Task completed or milestone reached |

---

## Domain Model

### Entities

```typescript
TeamMember  { id, name, role, technicalLevel, activeBlockerId? }
Task        { id, title, description, assignedTo, status, priority, milestoneId? }
Milestone   { id, title, deadline (ISO), taskIds[] }
Blocker     { id, memberId, description, reportedAt, resolved }
SharedDocument { id, title, content (markdown), sharedBy, sharedAt }
```

### Urgency Calculation

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

## Project Phases

### ✅ Phase 0 — Planning & Documentation
*Completed*

Full project specification, architecture decisions, domain model, surface contracts, and developer guides established.

- [x] Original specifications in `base-docs/` analyzed and validated
- [x] Gaps identified: terminology inconsistencies, missing decision matrix, Document Workspace not integrated into main specs
- [x] `project-docs/` created with 17 consolidated, actionable documents
- [x] Agent roadmap (`project-docs/agent/`) — 6 files covering overview, domain model, architecture, surface matrix, prompts & tools, MVP scope
- [x] Lead developer guide (`project-docs/dev-milton/`) — phased tasks + copy-paste prompts for Claude Code and Gemini CLI
- [x] Collaborator guide (`project-docs/dev-companion/`) — component specs with visual wireframes, style guide

---

### ✅ Phase 1 — Setup: Copy Starter Kit & Clean Domain
*Completed*

Copied the Generative-UI Hackathon Starter Kit structure, removed the leads/Notion domain, and created route placeholders.

- [x] Copy `apps/`, `deployment/`, `scripts/` from starter kit
- [x] Remove leads domain (components, pages, Python modules)
- [x] Create placeholder pages for `/leader`, `/member/[memberId]`, `/docs`
- [x] Configure `.env` with API keys
- [x] Verify `npm run dev` boots without errors

**Completion signal:** `http://localhost:3010` loads and redirects to `/leader`

---

### ✅ Phase 2 — Domain: Zustand Store + Types + Seed Data
*Completed*

Built the complete frontend state layer for the crew domain.

- [x] `apps/frontend/src/lib/crew/types.ts` — all TypeScript interfaces
- [x] `apps/frontend/src/lib/crew/derive.ts` — `getUrgencyPhase`, `getMascotMood` pure functions
- [x] `apps/frontend/src/lib/crew/seed.ts` — demo data with dynamic deadline
- [x] `apps/frontend/src/lib/crew/store.ts` — Zustand store with all actions including `simulateUrgency`
- [x] `apps/frontend/src/hooks/use-urgency-phase.ts` — reactive phase sync (30s interval)

**Completion signal:** `useCrewStore.getState().simulateUrgency(8)` in browser console changes `urgencyPhase` to `'urgent'`

---

### ✅ Phase 3 — Frontend: Routes /leader, /member, /docs
*Completed*

Implemented the three main views with CopilotKit v2 integration and urgency-aware UI.

- [x] `CopilotKitProviderShell` adapted for crew-companion (agentId: `crew_agent`)
- [x] `/leader` — TaskBoard, MilestonePanel, TeamOverview, all frontend tools registered
- [x] `/member/[memberId]` — ActiveTaskView, MilestoneCountdown, blocker reporting, frontend tools
- [x] `/docs` — DocumentTabs with shadcn/ui Tabs, document viewer, open/close actions
- [x] `UrgencyBanner` component (phase-aware color system with `animate-pulse` on panic)
- [x] `SurfaceRenderer` stub registered as `renderSurface` tool on all pages
- [x] All frontend tools registered: `setCrewState`, `updateTask`, `setMascotMood`, `highlightTasks`, `renderSurface`, `reportBlocker`, `openDocument`
- [x] Dev-only urgency simulation buttons (Normal/Focus/Urgent/Panic) in `/leader`

**Completion signal:** All three routes load, chat is visible, urgency banner changes color with simulation buttons

---

### ✅ Phase 4 — UI Surfaces + Countdown + Mascot
*Completed — generated by Gemini CLI*

Implement the 8 MVP surfaces, the live countdown timer, and the companion mascot.

- [x] `SurfaceRenderer` stub component (registered as `renderSurface` tool)
- [x] `renderSurface` registered on all pages
- [x] 8 MVP surfaces implemented:
  - [x] `TaskSuggestionPanel`
  - [x] `MilestoneSummaryPanel`
  - [x] `BlockerInsightPanel`
  - [x] `MemberActionPanel`
  - [x] `BeginnerGuidePanel`
  - [x] `ChecklistPanel`
  - [x] `TroubleshootingWizard`
  - [x] `DocumentSummaryPanel`
- [x] `MilestoneCountdown` — live 1-second countdown with phase-aware styling
- [x] `CompanionMascot` — mood-reactive mascot component (`MascotSVG`)

**Completion signal:** `simulateUrgency(3)` → countdown pulses red, mascot shows panic state

---

### ⬜ Phase 5 — Python Agent: Prompts + Tools + State
*Pending*

Adapt the LangGraph agent for the crew domain with the full surface decision system.

- [ ] `apps/agent/src/crew_state.py` — `CrewCanvasState` TypedDict + `CrewStateMiddleware`
- [ ] `apps/agent/src/tools.py` — `create_task`, `update_task_status`, `create_milestone`, `resolve_blocker`, `get_documents`
- [ ] `apps/agent/src/prompts.py` — system prompt with role/technicalLevel/phase decision logic
- [ ] `apps/agent/src/runtime.py` — adapted for crew state and tools (Gemini default, Claude optional)
- [ ] `apps/agent/crew.seed.json` — seed data with dynamic deadline
- [ ] TypeScript types ↔ Python TypedDicts verified as aligned

**Completion signal:** Agent renders `task_suggestion_panel` when leader asks "what tasks are missing" and `troubleshooting_wizard` when low-tech member reports a blocker

---

### ⬜ Phase 6 — Integration, QA & Demo
*Pending*

Full system integration, bug fixes, and demo preparation.

- [ ] `npm run dev` (full stack) runs without errors
- [ ] Thread persistence works across browser refreshes (CopilotKit Intelligence)
- [ ] All 4 demo scenes validated (see `project-docs/agent/06-mvp-scope.md`)
- [ ] Urgency simulation button available in dev mode
- [ ] Mascot syncs with agent responses
- [ ] Document workspace renders markdown safely
- [ ] 2-minute demo rehearsed

**Demo scenes:**
1. `/leader` — task board + milestone in `normal` phase
2. Chat: "what tasks are missing?" → `task_suggestion_panel` rendered
3. Simulate 8 minutes → UI shifts to `urgent`, mascot to `worried`, agent proactively renders `milestone_summary_panel`
4. `/member/m2` (Sam, low-tech) → chat: "I don't understand how to run the project" → `troubleshooting_wizard`

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+ with `uv` package manager
- Docker Desktop
- A Gemini API key (or Anthropic API key)
- A CopilotKit account (for Intelligence threads)

### Installation

```bash
# Clone the repo
git clone https://github.com/Miltondz/crew-companion.git
cd crew-companion

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Install all dependencies (Node workspaces + Python via uv)
npm install

# Start infrastructure (Postgres + Redis)
npm run dev:infra

# Start all services
npm run dev
```

### Individual Services

```bash
npm run dev:ui       # Next.js frontend  → http://localhost:3010
npm run dev:bff      # Hono BFF          → http://localhost:4000
npm run dev:agent    # LangGraph agent   → http://localhost:8123
npm run dev:infra    # Docker stack only
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes (or Anthropic) | Google Gemini API key |
| `ANTHROPIC_API_KEY` | Optional | Only if using `claude-sonnet-react` runtime |
| `AGENT_RUNTIME` | No | `gemini-flash-deep` (default) or `claude-sonnet-react` |
| `COPILOTKIT_LICENSE_TOKEN` | Yes | CopilotKit license |
| `INTELLIGENCE_API_URL` | Yes | CopilotKit Intelligence API URL |
| `INTELLIGENCE_GATEWAY_WS_URL` | Yes | CopilotKit Intelligence WebSocket URL |
| `INTELLIGENCE_API_KEY` | Yes | CopilotKit Intelligence auth key |

---

## Project Documentation

All operational documentation lives in `project-docs/`:

```
project-docs/
├── agent/              # Context for AI coding agents (Claude Code, Gemini CLI)
│   ├── 01-overview.md
│   ├── 02-domain-model.md
│   ├── 03-architecture.md
│   ├── 04-surface-matrix.md     ← surface decision table
│   ├── 05-prompts-and-tools.md  ← system prompt + all actions
│   └── 06-mvp-scope.md          ← what's in/out + demo criteria
├── dev-milton/         # Lead developer tasks and AI prompts
│   ├── 00-roadmap.md
│   ├── 01-phase1-setup.md  through  05-phase5-agent.md
│   └── PROMPTS.md           ← copy-paste prompts for Claude Code / Gemini CLI
└── dev-companion/      # Frontend collaborator guide
    ├── 00-intro.md
    ├── 01-components.md    ← 12 components with visual specs
    └── 02-style-guide.md   ← Tailwind design tokens
```

Original specifications are preserved in `base-docs/`.

---

## Team

| Role | Responsibility |
|------|---------------|
| **Lead Developer** | Architecture, backend, agent, system integration |
| **Frontend Collaborator** | UI components, surfaces, mascot, visual design |

---

## Based On

Built on top of the **[Generative-UI Global Hackathon Starter Kit](https://github.com/jerelvelarde/Generative-UI-Global-Hackathon-Starter-Kit)**, which provides the full CopilotKit + LangGraph + Hono + Docker infrastructure. Crew Companion replaces the leads management domain with a team coordination domain.
