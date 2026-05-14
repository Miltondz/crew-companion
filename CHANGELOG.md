# Changelog

All notable changes to this project are documented here.

---

## [Unreleased]

### Added
- **i18n (English + Spanish)** — Custom locale context with cookie persistence; language switcher in navigation; dynamic `lang` attribute on `<html>`; all key UI strings translated
- **`/api/health` endpoint** — Unauthenticated `GET` returns `{ ok: true, ts }` for Render keepalive and smoke tests
- **OG / Twitter metadata** — `og:title`, `og:description`, `og:image`, `twitter:card` added to root `layout.tsx`
- **Chat daily cap enforcement** — `/api/copilotkit` proxy now checks `chat_usage` before forwarding; returns HTTP 429 with `{ error, remaining: 0 }` when workspace exceeds 200 turns/day

### Changed
- **Demo banner gated to development** — Banner now renders only when `NODE_ENV === 'development'`; removed from production build
- **Shared `useCrewAgent` hook** — Extracted `mergeCrewState` + `useCrewAgent` from `leader/page.tsx`, `member/[memberId]/page.tsx`, and `docs/page.tsx` into `@/lib/useCrewAgent.ts`
- **Shared Zod envelope schemas** — `LegacyEnvelopeSchema` + `FullEnvelopeSchema` extracted from page files into `@/runtime/surface-registry/envelope-schema.ts`

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
