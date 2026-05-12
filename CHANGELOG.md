# Changelog

All notable changes to Crew Companion are documented here.  
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [Unreleased]

### Added
- Landing page (`/`) — visual marketing page with hero, features, use cases, CTA; logged-in users redirect to workspace
- Onboarding wizard v2 — multi-step (project type → details → context → team); project type selector (hackathon, sprint, remote-team, launch, consulting), context upload via URL or text paste, auto-detects `isDevProject` from type
- `projectConfig` + initial `sharedDocuments` saved to workspace state from onboarding context
- CountdownCritical `variant: 'compact' | 'full'` — two visual modes (21st.dev-inspired)
- CountdownCritical `orientation: 'vertical' | 'horizontal'` — layout direction control
- CountdownCritical `showBlockers` / `showFeatures` flags — timer-only mode now valid
- Animated flip digits (rotateX, compact) and slide digits (y-translate, full) via framer-motion
- Circular SVG viability ring with animated stroke and drop-shadow glow (full variant)
- Pulsing red warning border + overlay when `minsLeft < 10`
- Collapsible blocker/feature sections (full variant)
- `/dev` preview route — all CountdownCritical variants for visual QA
- `animate-gradient` keyframe in globals.css

### Changed
- `page.tsx` — server component; shows landing to logged-out users, redirects logged-in users to workspace
- README — full rewrite: concise, technical, SaaS format with invariants + phase status table
- `onboarding/route.ts` — accepts `projectType`, `isDevProject`, `contextUrl`, `contextText`

---

## [0.5.0] — 2026-05-11

### Added
- WorkspaceShell migration — all 3 pages wrapped; surfaces mount into spatial regions
- ForceGraph, CountdownCritical, IdeaMatrix, TriageWarRoom, AmbientOverlayWidget surfaces
- Surface Registry at 13 total registered surfaces
- Demo banner across all pages
- Onboarding wizard v1 (project name, deadline, team members, persisted to Postgres)

---

## [0.4.0] — 2026-05-10

### Added
- Envelope protocol (block 3.5) — typed envelopes agent→BFF→frontend with Zod validation
- Spatial Grammar (block 3.2) — LayoutEngine + 6 regions + localStorage pinning
- Capability Engine (block 3.3) — `@guarded_tool`, PolicyEngine, audit log
- AsyncPostgresSaver (block 3.4) — Postgres checkpointer with workspace state persistence

---

## [0.3.0] — 2026-05-09

### Added
- Activity stream (8 event types with framer-motion animations)
- Mobile chat drawer on all 3 views
- NextAuth v5 + Resend magic-link auth + database sessions

---

## [0.2.0] — 2026-05-08

### Added
- Surface Registry — 8 surfaces with Zod manifest schemas
- `SurfaceManifest` type: capabilities, envelope schema, density, preferredZone, lifecycle flags

---

## [0.1.0] — 2026-05-06

### Added
- Next.js 15 + Hono BFF + Python LangGraph agent architecture
- Urgency phase engine: `getUrgencyPhase(deadline)` → `normal | focus | urgent | panic | expired`
- Role-based views: `/leader`, `/member/[memberId]`, `/docs`
- CopilotKit v2 integration, Gemini Flash default LLM
- Domain types: `TeamMember`, `Task`, `Milestone`, `Blocker`, `SharedDocument` (TS + Python sync)
- Docker Compose local infra (Postgres 5433, Redis 6381)

---

## [Unreleased]

### In Progress
- Activity stream real events
- Mobile chat drawer (<768px)
- Wire renderSurface to LayoutEngine zones

---

## [0.4.0] — 2026-05-10

### Added — Auth
- NextAuth v5 + Resend magic-link authentication
- Database sessions via `@auth/pg-adapter` (Postgres)
- Sign-in page (`/auth/signin`) — dark glass-morphism, branded
- Verify-request page (`/auth/verify-request`)
- Middleware protecting `/leader`, `/member/*`, `/docs`
- Middleware injects `x-workspace-id` header on `/api/copilotkit/*`
- BFF `identifyUser` reads workspace header → per-user thread isolation
- Migration `009_auth_tables.sql` — extends `users` table, adds `accounts`, `sessions`, `verification_tokens`
- `.env.example` — `AUTH_SECRET`, `NEXTAUTH_URL`, `RESEND_API_KEY`, `AUTH_EMAIL_FROM`

### Added — Quick Wins
- Sonner toasts on all mutations: add task, resolve blocker, mark done, report blocker, AI tool calls
- canvas-confetti on task complete; full milestone confetti burst when all milestone tasks done
- Skeleton loaders (`loading.tsx`) per route — layout-matched to actual page structure
- `EmptyState` reusable component — icon, title, description, optional action
- Phase-bg CSS classes (`phase-bg-normal/focus/urgent/panic/expired`) wired to page root
- Framer Motion entrance animations on scrollable content; add-task form animates open
- Dark mode toggle button in leader header; `ThemeProvider` (next-themes) wraps app
- Error boundaries (`error.tsx`) per route — branded, retry button
- Command palette (⌘K / Ctrl+K) — navigate pages, members, active tasks

---

## [0.3.0] — 2026-05-09

### Added — Phase A Kernel

#### Surface Registry (3.1)
- `SurfaceManifest` schema with Zod validation, capability declarations, lazy loader
- `SurfaceRegistry` class — `register()`, `resolve()`, `validate()`
- `SurfaceHost` component — resolves manifest, validates envelope, renders surface
- `adapter.ts` — `isLegacyEnvelope()`, `adaptLegacyEnvelope()` for backward compat
- `useRuntimeContext` hook — builds `RuntimeContext` from role/phase/blocker
- 8 existing surfaces migrated to manifest + lazy-load pattern
- `SurfaceRenderer.tsx` deleted (replaced by registry)

#### Spatial Grammar (3.2)
- `LayoutEngine` — mount/unmount surfaces, conflict resolution, phase rules, capacity limits
- 6 region components: `PrimaryWorkzoneRegion`, `ContextRailRegion`, `AgentRailRegion`, `ActivityStreamRegion`, `CommandSurfaceRegion`, `AmbientOverlayRegion`
- `WorkspaceShell` — composes all regions (ready for page migration)
- `pinning.ts` — localStorage-backed pin state
- `useLayoutEngine`, `usePinning`, `usePhaseSync` hooks
- `SurfaceMountedNotice`, `SurfaceMountFailedNotice` components
- Phase-bg CSS gradients + `@keyframes panic-pulse` in `globals.css`

#### Capability Engine (3.3)
- Python: `Capability` enum (17 capabilities), `@guarded_tool` decorator, `PolicyEngine`, `AuditLogger` (stderr + Postgres)
- TypeScript: `Capability` enum (synced), `roleGrants` map, `useGuardedFrontendTool`, `useGrantedCapabilities`
- `ApprovalGate` component — risk-badge card with approve/reject actions

#### Persistence (3.4)
- `AsyncPostgresSaver` replaces `MemorySaver` when `DATABASE_URL` is set
- `hydrate_workspace_state()` — reads from `workspace_state` table, seeds on first access
- `approval_store.py` — pending approvals keyed by `envelopeId`
- 8 SQL migrations: workspace_state, audit_log, activity_events, token_usage, generated_assets, pinning
- `migrator.py` — idempotent, `_migrations` meta table

#### Envelope Protocol (3.5)
- `SurfaceEnvelope` Pydantic model (Python) + Zod schema (TypeScript) — 12 fields
- BFF envelope correlation middleware — logs `envelopeId`, `agentId`, `intent`, `surfaceId`
- Frontend accepts both legacy `{ type, payload }` and full envelope shapes
- `runtime_factory.py` — renamed from `runtime.py` to avoid Python package collision

---

## [0.2.0] — 2026-05-08

### Added — UI Redesign
- Leader page: indigo/violet gradient, real kanban board, Add Task form, Resolve Blocker, member nav links
- Member page: emerald/teal gradient, ActiveTaskView, MilestoneCountdown, blocker form
- Docs page: violet gradient, 3-column layout, document viewer
- `MilestonePanel`, `TeamOverview`, `ActiveTaskView`, `MilestoneCountdown` components
- `UrgencyBanner` — phase-reactive sticky banner
- `MascotSVG` — 5 moods × 4 modes, inline SVG
- `TaskCard` — status badge, priority ring, assignee avatar
- CopilotKit floating buttons and sidebar removed from all pages
- `useAgent({ agentId: "crew_agent" })` wired on all 3 pages

### Added — Subagent Routing
- `.claude/agents/` — 5 subagent definitions (crew-architect/Opus, crew-implementer/Sonnet, crew-polisher/Haiku, crew-reviewer/Sonnet, crew-researcher/Haiku)
- `MASTER_WORK_PLAN.md` — 7.5-week execution plan, phases, deliverables, invariants
- `CLAUDE.md` updated with routing decision tree and model budget by phase

---

## [0.1.0] — 2026-05-07

### Added — Foundation
- Next.js 15 + React 19 + Tailwind CSS 4 frontend
- Hono BFF with CopilotRuntime v2 + LangGraphAgent
- Python LangGraph agent with `CrewCanvasState`, seed hydration middleware
- Domain types: `TeamMember`, `Task`, `Milestone`, `Blocker`, `SharedDocument`
- `getUrgencyPhase(deadline)` — pure derive function, single source of truth
- 8 AI surfaces with `renderSurface` frontend tool
- CopilotKit Intelligence Docker stack (Postgres + Redis)
- `apps/agent/crew.seed.json` — default workspace data
- Dev environment: `npm run dev` starts all 3 services + infra
