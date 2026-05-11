# Changelog

All notable changes to Crew Companion are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

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
