# Changelog

All notable changes to this project are documented here.

---

## [Unreleased]

---

## [0.13.0] — 2026-05-18 — Warmup, scenarios validator, audit dashboard, version locking

### Added

- **Warmup system** — `/api/ping` (unauthenticated liveness) + `/api/warm` (authenticated BFF + agent warmup). Both endpoints documented; intended for cron-job.org every 5 minutes to keep Render free-tier instance alive. `AgentStatusPill` shows online/starting/offline state in workspace header.
- **Scenarios validator** (`/dev/scenarios`) — local-only page that runs `getInitialSurfaces()` against every role × tech-level × urgency-phase combination. Shows resolved surface stacks and filter reasons; covers all 24 surfaces.
- **ManualSurfacePicker** — force-render any registered surface with custom payload from the dev overlay; bypasses Layout Engine; reads Surface Registry directly.
- **Audit log dashboard** (`/admin/audit`) — paginated table of `audit_log` rows with filters (tool, decision, last N hours). Auth-gated (session required). `GET /api/debug/audit` endpoint with parameterized WHERE clause.
- **State sync metrics** — in-memory daily rolling counters (success / fail / conflict). Exposed via `GET /api/debug/sync-metrics`. `/status` page shows new "State sync metrics (last 24h)" card.
- **Optimistic version locking** (`016_workspace_state_version.sql`) — `workspace_state.version BIGINT NOT NULL DEFAULT 1`. Frontend sends `expected_version` with every PATCH; server returns 409 with `current_state` on mismatch. Agent increments version on every write. Frontend resolves 409 by taking server state and showing toast.
- **DevToolsResync** card in `/dev` — force-push local state to DB with current version; shows 200 / 409 / error inline.

### Fixed

- **Invariant 3 closure** — milestone/task objects no longer capture `phase` field. `getUrgencyPhase(deadline)` is the only source; all storage and comparison paths corrected.
- **Async DB race on hydration** — `hydrate_workspace_state` now uses `asyncio.to_thread` consistently; eliminated interleaved sync/async Postgres calls that caused occasional state revert on first agent turn.
- **Bidirectional sync** — frontend ↔ DB ↔ agent writes now converge correctly: entity-count comparison on initial load, debounced PATCH on every `setState`, flush-on-unmount, agent read-modify-write all use the same merge strategy.
- **Sync error toast** — rate-limited 30s toast on persist failure replaces silent swallow.
- **Agent state-read robustness** — coach flow JSON parsing hardened; `get_documents` returns empty list instead of raising on missing key.
- **Prompt drift** — ORCHESTRATOR / PLANNER / COACH prompts re-synced with actual tool names and surface IDs; removed references to retired surfaces.
- **Audit bundle** — per-workspace pinning keys, auth guards on all API routes, dead surface components removed from registry bootstrap.

### Changed

- `GET /api/projects` — now selects `ws.version` alongside `state_json`; included in project list response.
- `PATCH /api/projects/[workspaceId]` — returns `{ ok: true, version: N }` on success; returns `{ error: 'version_conflict', current_version, current_state }` on 409.
- `save_workspace_state` (Python) — increments `version` on every UPDATE.
- `/status` page — sync metrics card added; `refresh()` now fetches `/api/debug/status` and `/api/debug/sync-metrics` in parallel.
- `migrations/` count: 001–016 (added 016).

---

## [0.12.3] — 2026-05-16 — Folder spine pattern: docs + dashboard redesign

### Added

- **Folder spine pattern** — established as canonical card style across docs + dashboard. 28-34px vertical spine (color-mixed bg) + rotated label + icon top + tab-dot bottom. Mirrors SectionFrame pattern.
- **WebNav component** (`apps/frontend/src/components/shared/WebNav.tsx`) — shared web header: Features, How it works, Roadmap, About + user menu. CSS vars throughout. Switches between authed (user name + Salir) and guest (Sign In / Get Started) modes.
- **WebFooter component** (`apps/frontend/src/components/shared/WebFooter.tsx`) — 4-column footer (Product, Recursos, Contacto, brand) + copyright + stack credits + GitHub link.
- **Project CRUD API** (`apps/frontend/src/app/api/projects/[workspaceId]/route.ts`):
  - `PATCH` — rename project (updates `projectConfig.name` + `milestones[0].title`), archive toggle (`archived` + `archivedAt`)
  - `DELETE` — remove project (`user_projects` + `workspace_state` rows)
  - Ownership check via `user_projects.role = 'leader'`
- **Active / Archived filter tabs** in dashboard with counts.
- **Phase legend** chip row in dashboard.
- **Rename inline form** on project cards (Enter to save, Esc to cancel).
- **Share panel** on project cards (collapsible) — invite link + public observer link.

### Changed

- **Docs page** — full folder-spine rewrite:
  - Removed inner doc-list sidebar (chat sidebar is sufficient on the left)
  - Documents render as horizontal scrollable shelf of FolderCard at top (180x140 each, violet spine, rotated title, FolderOpen icon)
  - `+ Nuevo` NewFolderCard at end of shelf (dashed violet outline)
  - Selected doc / create form / edit form all render below in spine-style container
  - Removed `<PrimaryWorkzoneRegion>` from /docs — fixes triage_war_room persistence across routes (singleton layoutEngine bug)
  - Removed standalone `<ThemeToggle>` from docs header (sidebar AgentRailRegion has it; was duplicating)
- **Dashboard** — full rewrite:
  - Now uses `WebNav` + `WebFooter` for consistent web shell across authenticated pages
  - Project cards redesigned as `ProjectFolderCard` (34px spine + phase color + rotated project name + actions)
  - Spine actions visible on hover: Pencil (rename), Archive/ArchiveRestore, Trash2 (delete)
  - Empty state with FolderOpen icon and per-filter messaging
  - All Tailwind hardcoded slate/zinc tokens replaced with CSS vars + opacity tokens

### Fixed

- **Triage war room persisting on /docs** — singleton layoutEngine kept surfaces mounted between routes. Docs no longer renders PrimaryWorkzoneRegion.
- **Duplicate dark mode button in docs** — removed second ThemeToggle from docs header.
- **No navigation exit** — already partially solved by WorkspaceNav hamburger; dashboard now uses full WebNav.

---

## [0.12.2] — 2026-05-16 — Theme provider, drag overlay, documents CRUD, header badges

### Added

- **ThemeProvider** (`apps/frontend/src/components/shared/ThemeProvider.tsx`) — wraps app in `next-themes` provider; default dark, class strategy. Root cause fix: previously, no provider existed so `dark` class was never applied to `<html>`, causing all `dark:` Tailwind variants and CSS vars in `.dark { }` to silently fail. Components rendered as bright white boxes regardless of intent.
- **DragOverlay for sections** — Renders dragged section ID as floating pill during drag (visual feedback). Tracks active drag via `onDragStart` / `onDragEnd`.
- **Documents CRUD UI** — Full create/edit/delete on `/docs`:
  - `+ Nuevo` button creates documents with title + markdown content
  - Per-doc edit/delete buttons (visible on hover in sidebar; persistent in viewer)
  - Delete confirmation prompt
  - All CRUD actions push `doc_opened` activity events → notifies team via ticker
- **Documents agent tools** — Frontend tools `shareDocument`, `updateDocument`, `deleteDocument` added via `useFrontendTool` (agent-callable through CopilotKit)
- **Doc count badge in header** — `DocBadge` component (violet pill with FileText icon + count), clickable, navigates to `/docs`. Wired through `commandSurface.docBadge` slot.

### Changed

- **Docs page** full rewrite — replaced bright violet gradient header with thin warm graphite header; sidebar/viewer use `bg-[var(--bg-surface)]` and `text-[var(--text-primary)]` consistently; forms use opacity-token accent panels (no more flat white)
- **ActivityStreamRegion** — Removed early-return-on-empty (was hiding entire ticker if no events yet). Shows placeholder "Sin actividad reciente todavía" when empty.
- **ThemeToggle** — Improved visibility with CSS vars; smaller padding for header context
- **MilestonePanel / KanbanBoard** — Replaced hardcoded `bg-white` / `bg-slate-50` / `text-slate-*` with CSS vars and opacity tokens

### Fixed

- **Build failures from removed imports** — `Activity`, `Eye`, `EyeOff` icons were removed during cleanup but still used in JSX. Restored.
- **Spine text orientation** — Section labels rotated 180° to read bottom-to-top
- **Duplicate activity ticker** — Old static blue strip removed; only new CSS-marquee version remains
- **SectionFrame content area** — Now has `bg-[var(--bg-surface)] text-[var(--text-primary)]` so children inherit dark theme by default

---

## [0.12.1] — 2026-05-16 — Bug fixes: drag-to-minimize, Copilot chat, ticker, and styling

### Fixed

- **Drag-to-minimize broken** — MinimizedTray was outside DndContext scope, preventing ribbon-drop-zone from receiving drag events. Moved MinimizedTray inside DndContext so sections can be dropped to minimize.
- **Copilot chat mini-input not sending** — Habitat sidebar/compact mini-input forms were only opening CompanionPanel (local UI) instead of sending to crew agent. Refactored to use `useAgent({ agentId: 'crew_agent' }).addMessage()` + `agent.runAgent()` for real message delivery.
- **Duplicate activity ticker** — Old static scrollable activity strip (blue, non-animated) coexisting with new CSS-animated ActivityStreamRegion. Removed old strip, kept CSS marquee animation.
- **Spine text orientation wrong** — Section spine labels read top-to-bottom instead of bottom-to-top. Added 180° rotation transform to vertical text.
- **Component inner backgrounds light** — Section content areas missing dark background styling. Added `bg-[var(--bg-surface)] text-[var(--text-primary)]` to SectionFrame content wrapper for proper dark theme rendering.

### Changed

- **Habitat mini-input error handling** — Agent failures now surfaced via toast instead of silent promise rejection
- **Compact form mini-input** — Now sends to agent (was only opening panel)
- **Code cleanup** — Removed unused imports (Activity, Eye, EyeOff icons); removed dead `pendingMessage` ref from Habitat

---

## [0.12.0] — 2026-05-16 — Visual System Redesign: Editorial spines, phase topology, always-open sidebar

### Added

- **Warm graphite dark theme** — CSS var system replacing blue-black slate; `--bg-base: #18160f` (light) / `#18160f` (dark); ambient phase field gradient (honey → amber → ember → crimson → cool ash) per urgency phase
- **Font system upgrade** — Inter Tight (display) + JetBrains Mono (code) via `next/font/google`; replaces Jakarta/Mono
- **Always-open left sidebar (260–440px)** — Fixed layout replacing right-side slide-in AgentRailRegion
  - User strip 50px (avatar, name, role, theme toggle)
  - Mascot Habitat 200px (animated creature, phase dot, mini quick-prompt)
  - CopilotKit chat flex-1 (full height, no collapse button)
  - Sidebar width persisted to localStorage; drag-handle resize on right edge (native pointer events, not dnd-kit)
- **Thin 34px header over canvas** — Replaces indigo gradient header; consolidates phase chip, milestone title, countdown, blocker badge, member avatars (red ring = blocker owner), ⌘K palette, ↻ reset button
- **Editorial spines** — Each surface redesigned with 30px left rail containing:
  - Rotated vertical mono label
  - Signature animated glyph (sparkline for Activity, clock for Milestone, hazard chevrons for Blockers)
  - Drag grip (correct `setActivatorNodeRef` dnd-kit handle pattern)
  - Per-surface signature colors: TaskBoard=cyan, Milestone=ember, Blockers=red, Activity=violet, Team=teal, Docs=green
- **Phase-responsive topology** via CSS `grid-template-areas`
  - normal/focus: 6-column layout, compact task board
  - urgent: emergency strip top, blocker rail left, board widens
  - panic: emergency banner full-width, kanban hero (6 cols × 1 row), milestone+blockers below
  - expired: post-mortem panel, board collapses to compact readonly
- **Ribbon minimization pattern** — MinimizedTray redesigned as drop zone (`useDroppable { id: 'ribbon-drop-zone' }`)
  - Drag spine → drop on ribbon = minimize
  - Click ribbon tile = restore
  - Signature color per surface carried through
- **News ticker activity stream** — CSS `@keyframes marquee` animation (30s continuous scroll); replaced horizontal static strip with dynamic event feed; respects `prefers-reduced-motion`
- **Habitat compact-to-sidebar transition** — Mini quick-input forwards text to CopilotKit via `companionBus` PANEL_OPEN event with `message` payload; CompanionPanel accepts `initialMessage` prop
- **Countdown responsive sizing** — MilestoneCountdown digits grow with urgency phase (text-base → text-4xl in panic)
- **Phase chip animation** — Pulses in panic mode only (`@keyframes phase-pulse`)
- **Reset layout button (↻)** in thin header — Clears section-shape localStorage keys, section-order, minimizedSections, sb-width; hydrates from defaults

### Changed

- **WorkspaceShell layout** — `flex h-screen` → `flex flex-row` with left sidebar; CommandSurfaceRegion moved inside main flex-col (now h-[34px]); ActivityStreamRegion positioned below canvas, not right side
- **SectionFrame redesign** — Spine (30px) + content (flex-1); `useSortable` listeners on spine (via `setActivatorNodeRef`); `animate={isDragging ? false : ...}` suspends Framer during drag; removed `layout` prop from motion.div
- **CommandSurfaceRegion redesign** — Thin header with slots for phase-chip, milestone-title, countdown, blocker-badge, member-avatars, ⌘K, reset button; agent-emitted mounts still render here
- **ContextRailRegion removed** — No longer used; surfaces targeting `context-rail` retargeted to `primary-workzone` or removed
- **AgentRailRegion full redesign** — No longer a slide-in from right; now left sidebar with user strip + mascot + chat; removed collapse state
- **ActivityStreamRegion** — `events` prop wired through WorkspaceShell; ticker-track animation via CSS (no Framer)
- **Habitat redesign** — `sidebar` prop added; sidebar mode renders sprite at 60%, phase dot, bubble, quick-input that opens panel with message forwarded
- **MilestoneCountdown** — Responsive sizing per phase
- **Color system rework** — Extended `SpineColor` union (cyan, ember, red, violet, teal, green); removed old generic `ColorToken` system

### Fixed

- **Dead inviteCode state** — Removed `/api/projects` fetch that populated unused `inviteCode` state; only `/api/me/identity` fetch now runs
- **Module-level constants** — `PHASE_CHIP_LABELS`, `PHASE_CHIP_COLORS` moved from inside component bodies to module scope
- **Stale closure in SectionFrame** — `setMinimized` wrapped in `useCallback` with correct dependencies
- **ActivityStreamRegion layout** — Fixed position from right-side strip to bottom bar via flex-col wrapper
- **Sidebar mini-input** — Placeholder changed from "Mensaje rápido..." to "Pregunta al asistente..." to clarify it opens panel (not direct send)
- **Unused @keyframes** — Removed orphan `@keyframes panic-bg-pulse` from globals.css

---

## [0.11.0] — 2026-05-14 — Observability, tests, full CRUD, capability enforcement

### Added

- **Sentry error monitoring** — `@sentry/nextjs` v8 integrated; `sentry.client/server/edge.config.ts` created; `global-error.tsx` calls `Sentry.captureException`; `withSentryConfig` wraps `next.config.ts`; `NEXT_PUBLIC_SENTRY_DSN` env var wired
- **Vitest test suite** — `vitest.config.ts` with `@/` path alias + PostCSS override; `npm run test` script; 7 layout-engine tests (mount, dedup, eviction, pinning, role-block, unmount, force-unmount) — all passing
- **pytest test suite** — `apps/agent/tests/test_tools.py` with 31 unit tests covering all 16 tools (create/update/delete for tasks, milestones, blockers, members, plus `get_documents` and `reset_workspace`); `uv run pytest -v` passes 31/31
- **Full CRUD for all entities** — 5 new `@guarded_tool` functions added to `tools.py`:
  - `delete_milestone` — removes milestone, clears `activeMilestoneId` if it was the active one
  - `update_blocker` — patches blocker description
  - `delete_blocker` — removes blocker, clears `activeBlockerId` on any member referencing it
  - `update_member` — patches name/role/technicalLevel
  - `delete_member` — removes member and all their blockers atomically
- **Lighthouse CI config** — `.lighthouserc.js` at repo root; `npm run lhci` script; asserts ≥0.85 performance, ≥0.9 accessibility/best-practices/SEO on 3 production URLs
- **Error boundaries for all protected routes** — `dashboard/error.tsx`, `onboarding/error.tsx` created; `leader/error.tsx` and `member/[memberId]/error.tsx` updated to dark theme matching workspace palette; all in Spanish
- **i18n (English + Spanish)** — Custom locale context with cookie persistence; language switcher in navigation; dynamic `lang` attribute on `<html>`; all key UI strings translated
- **`/api/health` endpoint** — Unauthenticated `GET` returns `{ ok: true, ts }` for Render keepalive and smoke tests
- **OG / Twitter metadata** — `og:title`, `og:description`, `og:image`, `twitter:card` added to root `layout.tsx`
- **Chat daily cap enforcement** — `/api/copilotkit` proxy now checks `chat_usage` before forwarding; returns HTTP 429 with `{ error, remaining: 0 }` when workspace exceeds 200 turns/day

### Changed

- **`sync:capabilities` upgraded to code generator** — `scripts/sync-capabilities.ts` now parses Python `Capability` enum + `role_grants.json` and writes `capabilities.ts` + `roleGrants.ts` atomically (tmp → rename); was previously a validator stub
- **Layout Engine `mount()` enforces real capability check** — `LayoutEngine.mount()` now calls `surfaceRegistry.resolve()` with `roleGrantsFor(context.role)` instead of `surfaceRegistry.get()` (which bypassed all capability/role/phase checks for non-pinned surfaces); all 5 callers updated to pass `RuntimeContext`
- **SurfaceHost fixed self-grant bug** — `SurfaceHost` was passing `envelope.requiredCapabilities` as the granted capabilities; fixed to pass `roleGrantsFor(context.role)` — any surface always passed its own check before this fix
- **`registry.ts` comment updated** — Stale note about layout-engine bypassing `resolve()` replaced with accurate description of current behavior
- **Cross-platform `postinstall` script** — Replaced bash one-liner (`command -v uv && uv sync`) with `scripts/postinstall.js` (Node.js `spawnSync`); works on Windows, macOS, and Linux without shell differences
- **Demo banner gated to development** — Banner now renders only when `NODE_ENV === 'development'`; removed from production build
- **Shared `useCrewAgent` hook** — Extracted `mergeCrewState` + `useCrewAgent` from `leader/page.tsx`, `member/[memberId]/page.tsx`, and `docs/page.tsx` into `@/lib/useCrewAgent.ts`
- **Shared Zod envelope schemas** — `LegacyEnvelopeSchema` + `FullEnvelopeSchema` extracted from page files into `@/runtime/surface-registry/envelope-schema.ts`
- **Agent tool lists updated** — `PLANNER_TOOLS` now includes all 5 new tools; `ORCHESTRATOR_TOOLS` includes `delete_milestone`, `update_blocker`, `delete_blocker`, `update_member`, `delete_member`; `agents/tools.py` fully synced
- **Agent prompts updated** — PLANNER_PROMPT and COACH_PROMPT routing tables updated with `tech_stack_panel`; PLANNER_PROMPT tool table updated with new CRUD tools

### Fixed

- Deleted orphan `apps/frontend/src/components/surfaces/TaskSuggestionPanel.tsx` root file (canonical component lives in `TaskSuggestionPanel/TaskSuggestionPanel.tsx`)

---

## [0.10.0] — 2026-05-13 — Specialization dimension + 10 new surfaces

### Added — 4-axis context model

- **Specialization** as 4th context dimension: `developer | designer | qa | manager | writer | other`
  - Added to `TeamMember` in `types.ts`; synced to `types.py` (TS↔Python invariant maintained)
  - Captured in onboarding wizard — new specialization select added per team member
  - Accepted and stored by `/api/onboarding` route
  - Seeded in `seed.ts` for all demo members

- **`visibleToSpecializations`** manifest field now enforced in `registry.resolve()`
  - `specialization_mismatch` added to `ResolveFailure` union
  - `RuntimeContext` now carries `specialization?: Specialization`
  - `useRuntimeContext` accepts `specialization` option; both pages pass it from member state

- **`getInitialSurfaces()`** — `runtime/workspace/initial-surfaces.ts`
  - Mounts the contextually appropriate surface on workspace load — no agent round-trip required
  - Covers full matrix: role × phase × techLevel × specialization × hasBlocker
  - leader + manager → `team_velocity_panel`; leader + other → `milestone_summary` or `triage_war_room`
  - developer + blocker → `debug_session`; low-tech + blocker → `troubleshooting_wizard`
  - designer → `design_brief_panel`; qa → `test_case_board`; manager → `team_velocity_panel`; writer → `writing_checklist`
  - Mounted exactly once via `useRef` guard in both leader and member pages

- **10 new specialization-specific surfaces** (each with `manifest.ts` + component):

  | Surface ID | Specialization | Highlights |
  |---|---|---|
  | `debug_session` | developer · qa | step-by-step debug flow, hypothesis list |
  | `tech_stack_panel` | developer (high-tech) | tech stack grid, CLI commands, port map |
  | `design_brief_panel` | designer | deliverables list, objective, color direction |
  | `component_checklist` | designer | component review with status cycle |
  | `test_case_board` | qa | pass / fail / blocked / skip state machine |
  | `bug_report_form` | qa · developer | severity levels, repro steps, env info |
  | `team_velocity_panel` | manager | per-member progress bars, blocker count |
  | `stakeholder_update` | manager | highlights list, next steps, update text |
  | `writing_checklist` | writer | phase-aware (research → outline → draft → review → publish) |
  | `content_outline_panel` | writer | section-by-section outline with status |

- **Companion Habitat** wired to both workspace pages via `companionBus`
  - Leader page: `BLOCKER_CREATED` emitted from `reportBlocker` frontend tool handler
  - Member page: `BLOCKER_CREATED`, `BLOCKER_RESOLVED`, `TASK_COMPLETED` from UI actions
  - Member page: `MascotSVG` replaced with full `Habitat` component

- **Agent prompts** updated for all three agents
  - `ORCHESTRATOR_PROMPT`: specialization added to injected context description
  - `PLANNER_PROMPT`: `team_velocity_panel` + `stakeholder_update` in routing table
  - `COACH_PROMPT`: specialization column in routing table + per-specialization tone rules

### Fixed — registry and initial-surface audit

- `registry.resolve()` never checked `visibleToSpecializations` — declared but dead code; now enforced
- `RuntimeContext` was missing `specialization`; blocked enforce path from ever working
- `design_brief_panel` could emit `deliverables: []` when all tasks done → Zod `.min(1)` silent failure; fixed with fallback placeholder
- `test_case_board` could emit `cases: []` when no pending tasks → guarded with `qaPending.length > 0`
- `specialization` re-declared inside member `else` block (inner shadow of outer `const`) → hoisted to top of function
- Manager-leader always received `milestone_summary` instead of `team_velocity_panel` → added specialization branch before milestone check

---

## [0.9.0] — 2026-05-10

### Fixed — Round 9
- **Invite race condition** — `/api/invite/[code]` `POST` replaced read-modify-write pattern with single atomic JSONB `UPDATE … WHERE userId IS NULL`; concurrent join requests now return HTTP 409 instead of silently clobbering each other
- **Empty-name avatar crash** — `m.name[0]` on empty string replaced with `m.name?.[0] ?? '?'` in both `leader/page.tsx` and `member/[memberId]/page.tsx`

---

## [0.8.0] — 2026-05-08

### Fixed — Round 8
- **Redis reconnect per call** — `approval_store.py` replaced per-call `redis.from_url()` factory with module-level `_redis_client` singleton via `_get_redis()`; eliminates connection churn under load
- **Countdown overflow** — `computeCountdown()` in `derive.ts` now caps hours at 99 (`Math.min(99, …)`); prevents 7-char strings that broke downstream 6-slot destructuring
- **Onboarding key instability** — Member list in `onboarding/page.tsx` replaced `key={i}` (array index) with `key={m.id}` (stable UUID); prevents React reconciliation issues when list order changes

---

## [0.7.0] — 2026-05-05

### Fixed — Round 7
- **Cookie-based workspace isolation** — `crew_project_id` cookie set on workspace switch; `/api/me/identity` and usage routes read workspace from cookie rather than user ID
- **Post-onboarding redirect** — Onboarding completion now redirects to `/leader` instead of hanging on the wizard page

---

## [0.6.0] — 2026-05-02

### Fixed — Round 6
- **Dev route guard** — Auth middleware skips gate when `AUTH_SECRET` not set; enables local dev without credentials
- **Token caps** — Image generation capped at 16/workspace lifetime, 100 global; chat capped at 200 turns/day/workspace; both tracked in `image_gen_usage` and `chat_usage` tables

---

## [0.5.0] — 2026-04-28

### Fixed — Round 5
- **Observer config** — Read-only observer role wired through `user_projects`; observer sees workspace but cannot mutate state
- **Workspace switching** — Multi-project dashboard correctly updates `crew_project_id` cookie and reloads workspace state on switch

---

## [0.4.0] — 2026-04-20

### Added — Phase B complete
- **Auth** — NextAuth v5 + Resend magic-link email; JWT strategy; `user_projects` table for role-based access
- **WorkspaceShell** — Wraps all workspace pages (leader, member, docs) with Layout Engine regions
- **14 generative surfaces** — CountdownCritical, MilestoneSummaryPanel, TaskSuggestionPanel, FocusedTaskPanel, BlockerInsightPanel, TriageWarRoom, ForceGraph, IdeaMatrix, ChecklistPanel, TroubleshootingWizard, DocumentSummaryPanel, BeginnerGuidePanel, MemberActionPanel, AmbientOverlayWidget
- **Onboarding wizard** — 4-step flow: project config → milestones → members → review; creates workspace on completion
- **Multi-project dashboard** — Project cards with urgency phase indicators; workspace switch via cookie
- **Invite flow** — Shareable invite links; member-slot claiming with atomic JSONB update; observer mode
- **Companion Habitat Phase 1** — xstate machine, EventBus, PropRegistry, SVG creature, CompanionPanel, TechnicalStepper

---

## [0.3.0] — 2026-04-10

### Added — Phase A complete
- **Surface Registry** — `SurfaceHost`, manifest schema, `bootstrapRegistry`; surfaces register via manifests, no switch/case routing
- **Layout Engine** — 6 spatial zones: command-surface, primary-workzone, context-rail, agent-rail, activity-stream, ambient-overlay; localStorage pinning
- **Capability Engine** — `@guarded_tool` decorator, `PolicyEngine`, `AuditLogger`; every tool declares required capabilities
- **Persistence** — `AsyncPostgresSaver` for LangGraph checkpoints; `workspace_state` table; idempotent SQL migrations
- **Envelope protocol** — `SurfaceEnvelope` typed envelopes; BFF logs correlation; frontend accepts legacy + full shapes

---

## [0.2.0] — 2026-03-25

### Added — Multi-agent topology
- Orchestrator + Planner + Coach LangGraph graphs registered in `langgraph.json`
- Full task CRUD: `create_task`, `update_task`, `update_task_status`, `delete_task`
- Full milestone CRUD: `create_milestone`, `update_milestone`
- Frontend tools: `renderSurface`, `setMascotMood`, `logActivity`, `reportBlocker`, `highlightTasks`, `updateTask`, `setCrewState`
- TechnicalStepper powered by Coach agent via Gemini API

---

## [0.1.0] — 2026-03-10

### Added — Initial scaffold
- Next.js 15 App Router monorepo with Hono BFF and Python LangGraph agent
- Landing page, `/features`, `/how-it-works`, `/roadmap`, `/about`, `/dev` marketing pages
- Tailwind CSS 4, shadcn/ui, framer-motion, xstate, Rive stubs
- Docker Compose local infra (Postgres 5433, Redis 6381, CopilotKit Intelligence)
- `scripts/migrate.sh` and `scripts/seed.ts`
