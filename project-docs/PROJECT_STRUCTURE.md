# Crew Companion — Project Structure

Generated: 2026-05-10

---

## Root

```
crew-companion/
├── package.json             Monorepo root — workspaces config, dev/seed/kill-ports scripts
├── package-lock.json        Dependency lock file
├── README.md                Project overview, routes, getting started, phase status
├── README.es.md             Spanish README translation
└── .gitignore               Ignored paths (node_modules, .env, .next, base-docs, etc.)
```

---

## deployment/

Docker infrastructure for local dev.

```
deployment/
└── docker-compose.yml       PostgreSQL :5433, Redis :6381, CopilotKit Intelligence :4203/:4403
```

---

## scripts/

```
scripts/
├── check-env.sh             Validates required env vars before startup, exits with errors
└── seed-default-user.sh     Seeds default user into Intelligence Postgres (run once after docker up)
```

---

## apps/agent/ — Python LangGraph Agent

Stateful AI agent running on port 8123. Handles all crew AI logic.

```
apps/agent/
├── main.py                  LangGraph entry point — imports graph, exposes to langgraph dev
├── crew.seed.json           Initial crew state seed (members, tasks, milestones, deadline)
├── langgraph.json           LangGraph deployment manifest (graph ID, Python path)
├── pyproject.toml           Python dependencies managed by uv
│
├── migrations/
│   └── 016_workspace_state_version.sql  Adds version column to workspace_state for optimistic-lock PATCH
│
├── src/
│   ├── __init__.py          Package marker
│   ├── types.py             Python TypedDicts: TeamMember, Task, Milestone, Blocker, SharedDocument
│   ├── crew_state.py        CrewCanvasState TypedDict + CrewStateMiddleware (seed hydration on boot)
│   ├── tools.py             Agent tools with InjectedState: create_task, update_task_status,
│   │                          create_milestone, resolve_blocker, get_documents
│   ├── prompts.py           System prompt with role/techLevel/phase surface decision table
│   ├── runtime.py           LangGraph graph builder — middleware chain:
│   │                          TimingMiddleware → CrewStateMiddleware → CopilotKitMiddleware
│   ├── timing.py            Urgency phase calculations (getUrgencyPhase equivalent in Python)
│   └── intelligence_cleanup.py  Soft-deletes orphan threads on agent boot (in-mem store reset)
│
└── scripts/
    ├── csv_to_seed.py       Convert CSV data to crew.seed.json format
    ├── repro_006.py         Reproduction script for bug #006
    └── repro_phase04.py     Phase 4 scenario integration test
```

---

## apps/bff/ — Backend for Frontend (Hono + CopilotKit Runtime)

TypeScript HTTP server on port 4000. Bridges frontend ↔ LangGraph agent.

```
apps/bff/
├── package.json             Dependencies: @hono/node-server, @copilotkit/runtime
├── tsconfig.json            TypeScript config
│
└── src/
    └── server.ts            Hono server — CopilotRuntime endpoint /api/copilotkit,
                               LangGraphAgent config, error remapping middleware
                               (threads_user_id_fkey → seed hint, AgentThreadLockedError → new thread hint)
```

---

## apps/frontend/ — Next.js 15 Frontend

React 19 app on port 3010. Three role-specific workspaces + embedded AI chat.

```
apps/frontend/
├── package.json             Frontend dependencies: next, react, tailwindcss, shadcn/ui, copilotkit
├── next.config.ts           Next.js config — proxies /api/copilotkit → BFF :4000
├── postcss.config.mjs       PostCSS config for Tailwind
├── components.json          shadcn/ui component config
├── tsconfig.json            TypeScript config
│
└── src/
    │
    ├── app/                 Next.js App Router pages
    │   ├── layout.tsx       Root layout — fonts, CopilotKitProviderShell, globals.css
    │   ├── page.tsx         Home — redirects to /leader
    │   ├── globals.css      Global styles, Tailwind directives, phase background gradients,
    │   │                      CopilotKit sidebar CSS overrides
    │   │
    │   ├── leader/
    │   │   └── page.tsx     LEADER WORKSPACE — indigo/violet theme
    │   │                      TaskBoard (3-col kanban), MilestonePanel, TeamOverview,
    │   │                      Add Task form, Resolve Blocker, nav links to members,
    │   │                      embedded CopilotChat, MascotSVG, dev urgency simulator
    │   │
    │   ├── member/
    │   │   └── [memberId]/
    │   │       └── page.tsx MEMBER WORKSPACE — emerald/teal theme
    │   │                      ActiveTaskView (hero card + Mark Done), MilestoneCountdown (live),
    │   │                      Blocker Report form, all tasks list, nav back to leader,
    │   │                      switch between members, embedded CopilotChat, MascotSVG
    │   │
    │   ├── docs/
    │   │   └── page.tsx     DOCS WORKSPACE — violet/purple theme
    │   │                      3-column: doc list sidebar, document viewer, AI chat
    │   │                      open document tool, AI doc Q&A, MascotSVG
    │   │
    │   ├── about/
    │   │   ├── page.tsx     About page (hackathon kit info)
    │   │   └── toc.tsx      Table of contents component
    │   │
    │   ├── showcase/
    │   │   └── page.tsx     Feature showcase / component gallery
    │   │
    │   ├── admin/                          Admin-only pages (leader role required)
    │   │   ├── layout.tsx                  Admin layout with session + leader role guard
    │   │   └── audit/
    │   │       └── page.tsx                Audit log browser: filter by tool/decision/hours, paginated table
    │   │
    │   ├── dev/                            Developer tooling pages (dev-mode only)
    │   │   ├── page.tsx                    Dev tools hub — links to sub-tools
    │   │   ├── DevToolsResync.tsx          Manual state resync button with conflict resolution UI
    │   │   └── scenarios/
    │   │       ├── page.tsx                Scenario runner shell (Suspense wrapper)
    │   │       └── ScenariosInner.tsx      Scenario harness UI — select + run + diff state before/after
    │   │
    │   └── api/
    │       ├── copilotkit/[[...path]]/
    │       │   └── route.ts                CopilotKit proxy → BFF :4000; chat_usage 200/day/workspace gate
    │       ├── warm/
    │       │   └── route.ts                Agent warmup endpoint — POST to wake LangGraph server
    │       └── debug/                      Debug endpoints (leader role required)
    │           ├── audit/
    │           │   └── route.ts            Returns audit_log rows filtered by tool/decision/hours
    │           └── sync-metrics/
    │               └── route.ts            Returns in-memory sync-metrics snapshot
    │
    ├── components/
    │   │
    │   ├── copilot/
    │   │   ├── CopilotKitProviderShell.tsx   Client wrapper for CopilotKitProvider
    │   │   │                                   runtimeUrl, showDevConsole=false
    │   │   └── ToolFallbackCard.tsx           Default UI card for unrecognized tool calls
    │   │
    │   ├── leader/                            Components exclusive to /leader
    │   │   ├── MilestonePanel.tsx             Milestone card: title, countdown embed,
    │   │   │                                   progress bar, sorted task list with icons
    │   │   └── TeamOverview.tsx               Team roster: avatar, name, role, task count,
    │   │                                        active blocker inline display
    │   │
    │   ├── member/                            Components exclusive to /member/[id]
    │   │   ├── ActiveTaskView.tsx             Active task hero card: title, description,
    │   │   │                                   priority/status badges, Mark Done button
    │   │   └── MilestoneCountdown.tsx         Live 1-second countdown: normal/compact modes,
    │   │                                        phase-aware color (green→yellow→orange→red)
    │   │
    │   ├── mascot/
    │   │   └── MascotSVG.tsx                  SVG companion character — 5 moods × 4 modes
    │   │                                        (calm/focus/worried/panic/celebrate)
    │   │                                        × (idle/hint/alert/action) with CSS animations
    │   │
    │   ├── shared/                            Reused across multiple pages
    │   │   ├── SurfaceRenderer.tsx            Maps surface type string → React component
    │   │   │                                   (task_suggestion → TaskSuggestionPanel, etc.)
    │   │   ├── TaskCard.tsx                   Kanban card: priority badge, title, description,
    │   │   │                                   assignee avatar, clickable status cycle
    │   │   ├── UrgencyBanner.tsx              Full-width phase banner (hidden on normal),
    │   │   │                                    phase icon + time hint + animate-pulse on panic
    │   │   ├── AgentStatusPill.tsx            Live agent connection status indicator (idle/thinking/error)
    │   │   └── ManualSurfacePicker.tsx        Modal surface picker: browsable surface registry, mount on demand
    │   │
    │   ├── surfaces/                          AI-rendered generative surfaces (T01-T08)
    │   │   ├── TaskSuggestionPanel.tsx        T01 — Leader: suggested tasks with priority/assignee
    │   │   ├── MilestoneSummaryPanel.tsx      T02 — Leader: milestone progress, at-risk tasks
    │   │   ├── BlockerInsightPanel.tsx        T03 — Leader: blocker analysis, causes, actions
    │   │   ├── MemberActionPanel.tsx          T04 — Any: urgency-phase action list (YA/PRONTO/LUEGO)
    │   │   ├── BeginnerGuidePanel.tsx         T05 — Member low-tech: numbered steps + tip boxes
    │   │   ├── ChecklistPanel.tsx             T06 — Member high-tech: interactive checkbox list
    │   │   ├── TroubleshootingWizard.tsx      T07 — Member low-tech+blocker: yes/no wizard steps
    │   │   └── DocumentSummaryPanel.tsx       T08 — Any: doc title, summary, key points, quote
    │   │
    │   ├── threads-drawer/                    (Installed but removed from pages — kept for future)
    │   │   ├── threads-drawer.tsx             Thread history sidebar with search, archive, delete
    │   │   ├── threads-drawer.module.css      CSS module for drawer layout
    │   │   └── index.tsx                      Barrel export
    │   │
    │   └── ui/                                shadcn/ui primitives (Radix UI + Tailwind)
    │       ├── accordion.tsx
    │       ├── alert-dialog.tsx
    │       ├── avatar.tsx
    │       ├── badge.tsx
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── checkbox.tsx
    │       ├── collapsible.tsx
    │       ├── command.tsx
    │       ├── dialog.tsx
    │       ├── dropdown-menu.tsx
    │       ├── label.tsx
    │       ├── popover.tsx
    │       ├── progress.tsx
    │       ├── scroll-area.tsx
    │       ├── select.tsx
    │       ├── separator.tsx
    │       ├── slider.tsx
    │       ├── switch.tsx
    │       ├── tabs.tsx
    │       ├── textarea.tsx
    │       └── tooltip.tsx
    │
    ├── hooks/
    │   ├── use-media-query.ts     Responsive breakpoint detection (SSR-safe)
    │   ├── use-theme.tsx          Light/dark theme toggle with localStorage persistence
    │   └── use-urgency-phase.ts   Reactive urgency phase from milestone deadline (30s poll)
    │
    └── lib/
        ├── utils.ts               Tailwind class merge (cn helper)
        ├── agent-warmup.ts        Fires POST /api/warm on mount to pre-warm LangGraph server
        ├── scenario-harness.ts    Scenario definitions + runner: applies state patches, captures diffs
        ├── sync-metrics.ts        In-process counters for state-sync events (syncs, conflicts, errors)
        │
        └── crew/
            ├── types.ts           TypeScript interfaces: TeamMember, Task, Milestone,
            │                        Blocker, SharedDocument, CrewState, UrgencyPhase, etc.
            ├── derive.ts          Pure functions: getUrgencyPhase(deadline), getMascotMood
            ├── seed.ts            Demo seed data with dynamic deadline (now + 45min)
            └── store.ts           Zustand store for crew state (legacy, pages now use useAgent)
```

---

## apps/mcp/ — MCP Server (Manufact Integration)

TypeScript MCP server on port 3001. Exposes tools to the agent via MCP protocol.

```
apps/mcp/
├── index.ts                 MCP server entry point
├── package.json             Dependencies: mcp-use, @modelcontextprotocol/sdk
├── tsconfig.json            TypeScript config
│
├── resources/               Widget resources (legacy from starter kit)
│   ├── canvas-dashboard/widget.tsx   Canvas integration widget
│   ├── email-draft/widget.tsx        Email composition widget
│   ├── lead-demand/widget.tsx        Lead metrics widget
│   ├── lead-list/widget.tsx          Lead roster widget
│   └── lead-pipeline/widget.tsx      Pipeline visualization widget
│
└── src/
    ├── components/Frame.tsx           Widget iframe container
    └── lib/leads/
        ├── types.ts                   Lead domain types (legacy)
        ├── derive.ts                  Lead state transformers (legacy)
        └── sample.ts                  Sample lead data (legacy)
```

---

## project-docs/ — Project Documentation

All design docs, specs, plans, and roadmaps. Tracked in git.

```
project-docs/
├── INDEX.md                 Navigation index for all docs
├── POLISH_PLAN.md           6-week post-MVP roadmap: auth, multi-agent, Rive mascot,
│                              drag-drop kanban, free deploy — full week-by-week spec
│
├── agent/                   AI coding agent context docs
│   ├── 01-overview.md       App vision, problem statement, key concepts
│   ├── 02-domain-model.md   Entity model with TypeScript + Python type specs
│   ├── 03-architecture.md   System architecture, service boundaries, data flow
│   ├── 04-surface-matrix.md Surface decision table (role × techLevel × requestType → surface)
│   ├── 05-prompts-and-tools.md  System prompt design, useCopilotReadable, all frontend actions
│   └── 06-mvp-scope.md      MVP surfaces, seed data, demo criteria, acceptance tests
│
├── dev-milton/              Lead developer phased task breakdown
│   ├── 00-roadmap.md        Phase 0-6 overview
│   ├── 01-phase1-setup.md   Phase 1: starter kit + env setup tasks
│   ├── 02-phase2-domain.md  Phase 2: Zustand store + types + seed
│   ├── 03-phase3-frontend.md  Phase 3: three routes with CopilotKit
│   ├── 04-phase4-surfaces.md  Phase 4: 8 surfaces + countdown + mascot
│   ├── 05-phase5-agent.md   Phase 5: Python agent + tools + prompts
│   └── PROMPTS.md           Copy-paste prompts for Claude Code and Gemini CLI
│
├── dev-companion/           Frontend collaborator guide
│   ├── 00-intro.md          Getting started, workflow, how to use specs
│   ├── 01-components.md     T01-T15 component specs with visual wireframes
│   └── 02-style-guide.md    Design tokens, colors, badges, spacing, mascot rules
│
└── gemini-tasks/            Granular task specs (one file per component/surface)
    ├── README.md             Task catalog and progress tracker
    ├── T01-surface-task-suggestion.md     TaskSuggestionPanel spec
    ├── T02-surface-milestone-summary.md   MilestoneSummaryPanel spec
    ├── T03-surface-blocker-insight.md     BlockerInsightPanel spec
    ├── T04-surface-member-action.md       MemberActionPanel spec
    ├── T05-surface-beginner-guide.md      BeginnerGuidePanel spec
    ├── T06-surface-checklist.md           ChecklistPanel spec
    ├── T07-surface-troubleshooting.md     TroubleshootingWizard spec
    ├── T08-surface-document-summary.md    DocumentSummaryPanel spec
    ├── T09-component-task-card.md         TaskCard spec
    ├── T10-component-milestone-panel.md   MilestonePanel spec
    ├── T11-component-team-overview.md     TeamOverview spec
    ├── T12-component-active-task.md       ActiveTaskView spec
    ├── T13-component-countdown.md         MilestoneCountdown spec
    ├── T14-component-urgency-banner.md    UrgencyBanner spec
    └── T15-component-mascot.md            MascotSVG spec
```

---

## .devcontainer/ — Dev Container (Daytona/VSCode)

```
.devcontainer/
├── devcontainer.json        VSCode dev container config, port forwarding, extensions
└── setup.sh                 Bootstrap script — injects Daytona env vars into .env
```

---

## Key file relationships

```
app/layout.tsx
  └── CopilotKitProviderShell.tsx     wraps all pages
        └── CopilotKitProvider        ← runtimeUrl → /api/copilotkit
                                                     ↓
                                      next.config.ts proxies to BFF :4000
                                                     ↓
                                      apps/bff/src/server.ts
                                                     ↓
                                      LangGraphAgent → agent :8123
                                                     ↓
                                      apps/agent/src/runtime.py
                                        ├── CrewStateMiddleware (seed hydration)
                                        ├── tools.py (create_task, resolve_blocker, etc.)
                                        └── prompts.py (surface decision table)

app/leader/page.tsx
  ├── useAgent("crew_agent")           reads/writes agent state
  ├── useFrontendTool(...)             registers tools agent can call
  ├── CopilotChat                      embedded AI chat panel
  ├── TaskCard                         from components/shared/
  ├── MilestonePanel                   from components/leader/
  ├── TeamOverview                     from components/leader/
  ├── UrgencyBanner                    from components/shared/
  └── MascotSVG                        from components/mascot/

SurfaceRenderer.tsx
  └── maps envelope.type → surface component
        task_suggestion        → TaskSuggestionPanel
        milestone_summary      → MilestoneSummaryPanel
        blocker_insight        → BlockerInsightPanel
        member_action          → MemberActionPanel
        beginner_guide         → BeginnerGuidePanel
        checklist              → ChecklistPanel
        troubleshooting_wizard → TroubleshootingWizard
        document_summary       → DocumentSummaryPanel
```

---

## Notable exclusions (gitignored / not tracked)

```
node_modules/           All package dependencies
.next/                  Next.js build output
apps/agent/.venv/       Python virtual environment
apps/agent/.langgraph_api/  LangGraph local API cache
.env                    Environment variables with secrets
base-docs/              Original hackathon starter docs (superseded by project-docs/)
```
