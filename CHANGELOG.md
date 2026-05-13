# Changelog

All notable changes to Crew Companion are documented here.  
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [Unreleased]

### Added — Visual redesign (GlowCard system)
- Shared glow CSS primitives in `globals.css` — `[data-glow-card]` (hue-shifting radial border glow, `background-attachment: fixed`) and `[data-glow-item]` (static blue spotlight); eliminates per-component `<style>` injection
- `TaskCard` — full GlowCard redesign: `StatusBadge` + `PriorityBadge` with Lucide icons, `Initials` avatar, priority-hue `--base` CSS var, dark mode via opacity tokens
- `ApprovalGate` — risk-colored glow: `RISK_CONFIG` with ShieldCheck/ShieldAlert/ShieldX/Skull icons + hue per risk level; Spanish confirm/reject labels
- `UrgencyBanner` — GlowCard with phase-reactive hue; shadcn `Alert` primitive (`alert.tsx` created)
- `TeamOverview` — `MemberCard` with GlowCard per member: purple (leader), blue (member), orange (blocked); blocker callout inside card
- `ActivityStream` — `data-glow-item` on each row; single container-level `pointermove` handler; dark mode text tokens

### Added — New surfaces + components
- `FocusedTaskPanel` surface — priority-driven glow (high=orange, medium=yellow, low=emerald); `coachNote` indigo callout; routed by both Planner and Coach; registered in `bootstrap.ts`
- `FileCard` (`file-card-collections.tsx`) — 25 format types, format-specific mini previews, `inferFileFormat()` from extension
- `DocumentSummaryPanel` — `FileCard` thumbnail in header; `documentFormat` field added to Zod schema; `resolveFormat()` validates against `VALID_FORMATS` or infers from title
- `DottedSurface` (`components/ui/dotted-surface.tsx`) — Three.js animated wave particle grid; `useTheme`-aware dot color; proper cleanup on unmount
- `three` + `@types/three` added to frontend dependencies

### Added — Landing page redesign
- `DottedSurface` as `fixed z-[-1] opacity-18` page background — visible in hero, covered by solid `bg-zinc-950` in subsequent sections
- Top gradient `from-zinc-950` masks dots behind sticky nav; bottom gradient `from-transparent to-zinc-950 h-56` transitions hero into content
- Hero section: `min-h-[88vh]` + soft indigo/violet glow accents; `FloatingPreview` with increased backdrop opacity for readability over wave
- All below-fold sections set to solid backgrounds (`bg-zinc-950` / `bg-zinc-900`) — no dot bleed-through

### Added — Python tool CRUD coverage
- `update_task(task_id, title?, description?, assigned_to?, priority?)` — patch any task field, partial update
- `update_milestone(milestone_id, title?, deadline_iso?)` — change milestone title or deadline
- `delete_task(task_id)` — removes task from state + cleans `taskIds` from all milestones
- All three tools added to `PLANNER_TOOLS`, `ORCHESTRATOR_TOOLS`; `update_task_status` added to `COACH_TOOLS`

### Added — Frontend tool coverage (agent-usability gap fix)
- Leader page: `reportBlocker` frontend tool (logs blocker + pushActivity + toast)
- Leader page: `logActivity` frontend tool (pushActivity + toast) — Python-tool mutations now visible in activity stream
- Member page: `highlightTasks` frontend tool
- Member page: `logActivity` frontend tool (toast only)
- All agent prompts updated with `AVAILABLE FRONTEND TOOLS` section listing all callable tools

### Added — UI interaction gaps (member page)
- `ActiveTaskView`: `onMarkInProgress` prop + "▶ Empezar tarea" button for `status=todo`; "✅ Marcar como completada" only shows for `in-progress`
- Member page: `handleMarkInProgress` handler
- Member page: member self-dismiss blocker button ("✓ Resolver" inline in blocker panel)
- Member page: all-tasks list replaced with `TaskCard` grid + highlight support + status change handler

### Added — Agent prompt improvements
- PLANNER: tool routing table (create/update/delete for tasks + milestones)
- PLANNER + COACH: `assignedTo` in `focused_task_panel` must be member NAME not ID
- COACH: use `update_task_status` when member says they've started or finished a task
- All prompts: `AVAILABLE FRONTEND TOOLS` section

### Added — CLAUDE.md
- Mandatory 4-axis gap check section before Visual design rules

### Added — Companion Habitat Phase 1
- `CompanionEventBus` — typed pub/sub singleton; any component emits/subscribes to `CompanionEvent` union
- `companionMachine` (xstate) — 6-state machine (idle/alert/celebrating/thinking/sleeping/guiding), anti-spam 5-min cooldown on proactive bubbles
- `HabitatPropRegistry` — extensible registry; `useSyncExternalStore`-compatible; 4 built-in props: `blocker_rock`, `milestone_trophy`, `deadline_clock`, `panic_flame`
- `CreatureSprite` — SVG creature with 8 moods × full expression set (eyes/mouth/accessories/arms); CSS animation per mood
- `SpeechBubble` — framer-motion spring pop-in, CTA button, auto-dismiss (8s), dismiss button
- `HabitatBackground` — 5 weather states (sunny/cloudy/rain/stormy/night) with CSS gradients, rain drops, lightning flash, clouds, stars, ground
- `HabitatProps` — renders active props from registry, `AnimatePresence` enter/exit per prop type
- `CompanionPanel` — slide-in framer-motion panel (spring), quick status 2×2 grid, Planner suggestions slot, intent picker
- `TechnicalStepper` — step navigator with progress bar, copy-command button, `expectedOutput` display, rescue-mode branching via `errorOptions`
- `Habitat` — container wiring all layers + xstate + EventBus + panel; derives `minutesLeft` from milestone deadline; click → open panel
- `@xstate/react` + `xstate` added to frontend dependencies
- `@keyframes fall` + `@keyframes lightning` in `globals.css` for weather effects
- Leader page: `MascotSVG` replaced by `Habitat` with live-derived props (pendingTasks, activeBlockers, minutesLeft, progress)
- Leader page: `companionBus.emit` on blocker resolved + milestone complete

### Added — Multi-agent topology
- Three LangGraph graphs: `default` (Orchestrator), `planner`, `coach` registered in `langgraph.json`
- `apps/agent/src/agents/` package — `prompts.py` (3 focused system prompts), `tools.py` (per-agent tool subsets), `graph.py` (3 graph builders)
- `apps/agent/main.py` exports `graph`, `planner_graph`, `coach_graph`
- BFF `makeAgent()` helper — 4 agent instances registered (default, crew_agent, planner, coach)
- `apps/agent/src/prompts.py` backward-compat re-export of `ORCHESTRATOR_PROMPT as SYSTEM_PROMPT`

### Added — Token caps + usage tracking
- `chat_usage` table (migration `011_chat_usage.sql`) — `(workspace_id TEXT, date DATE, count INT)` primary key
- `/api/usage` route — GET returns `{count, limit:200, remaining, limitReached, warningThreshold}`, POST increments via upsert
- `UsageBanner` component — amber warning at limit-20, red at hard limit, dismissable unless at hard limit
- `UsageBanner` wired above `UrgencyBanner` in leader page

### Added — Observer config UI
- `/api/workspace/observer-config` PATCH — `jsonb_set(state_json, '{observerConfig}', $2::jsonb)`
- Observer config panel per ProjectCard in dashboard — toggles for showTasks/showTeamNames/showBlockerCount, customMessage input (max 120 chars)
- Settings gear button with AnimatePresence collapse/expand

### Fixed
- Post-onboarding redirect: `router.push('/leader')` → `router.push('/dashboard')`
- `/dev` route: `notFound()` guard in production
- Workspace ID resolution: `_resolve_workspace_id` now checks `ctx.get("id")` fallback (CopilotKit `identifyUser` returns `{id, name}`)

### Added — Previous session (landing + onboarding v2)
- Landing page (`/`) — hero, features, use cases, CTA; logged-in redirect to workspace
- Onboarding wizard v2 — project type selector, context URL/text upload, auto `isDevProject`
- CountdownCritical variants: `compact`/`full`, `vertical`/`horizontal`, section visibility flags
- `/dev` preview route — all CountdownCritical variants for visual QA

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
