# Changelog

All notable changes to Crew Companion are documented here.  
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [Unreleased] — 2026-05-13

### Added
- **Full member-identity linking** — invite page now shows unclaimed member slot picker; joining writes `userId` onto the member object in `state_json`; `crew_member_id` cookie set on workspace switch; `/api/me/identity` endpoint for server-side identity resolution; leader page auto-redirects members to `/member/[id]`; member page validates URL param vs actual identity; `x-member-id` header forwarded to all CopilotKit requests so agent knows who is speaking
- `/api/me/identity` route — returns `{ workspaceId, memberId, role }` from httpOnly cookies + DB
- `unclaimedMembers` field on `GET /api/invite/[code]` — lists member slots without a `userId` set

### Changed
- `POST /api/invite/[code]` — accepts optional `memberId` body param, upserts `user_projects` with the member's actual role, returns `memberId` in response
- `GET /api/projects` — each project now includes `member_id` field (null for leaders)
- `POST /api/projects` — sets `crew_member_id` cookie alongside `crew_project_id` on workspace switch
- Dashboard `openProject` — routes to `/member/[member_id]` when user is a non-leader member
- Middleware — forwards `x-member-id` header to `/api/copilotkit/*` when cookie present

---

## Phase C — Deploy — 2026-05

### Added
- `/status` debug page — service health cards, usage bars, 7-day mini charts, audit log, activity feed, platform API section (Neon/Vercel/Render), env var grid, download JSON/MD, auto-refresh toggle
- `/api/debug/status` route — parallel health checks for BFF, Postgres, Redis, LangGraph; workspace usage; env var presence
- BFF `/api/health` endpoint — LangGraph ping, process uptime, memory stats
- Global error page (`error.tsx`) and not-found page (`not-found.tsx`)
- `/api/copilotkit` proxy route — forwards to `BFF_URL`
- Pre-wizard intro screen on `/onboarding` — explains what info user needs before starting

### Fixed
- `/status` page redirected to non-existent `/login` → corrected to `/auth/signin`
- Auth sign-in now reads `?callbackUrl=` query param → correct post-login redirect
- Dashboard auto-redirects to `/onboarding` when user has no projects
- Middleware now protects `/onboarding` and `/status` routes
- Error handling added to share, invite, and observer-config API routes

---

## Phase B — Product — 2025-Q4 / 2026-Q1

### Added
- **NextAuth v5** with Resend magic-link provider, PostgresAdapter, database session strategy
- **Multi-project dashboard** (`/dashboard`) — project cards with progress, urgency badge, share links, observer config panel
- **Onboarding wizard** (`/onboarding`) — 4-step setup: project name, deadline, team members, context
- **Invite flow** — leader generates invite link; member joins via `/invite/[code]`; workspace activated via cookie
- **Observer view** (`/share/[token]`) — read-only public page, auto-refreshes 30s, countdown, stats, task list, custom message, join CTA
- **WorkspaceShell** wrapping all 3 workspace pages (leader, member, docs)
- 13 UI surfaces registered in Surface Registry with manifests
- Companion Habitat Phase 1 — xstate machine, EventBus, PropRegistry, SVG creature, CompanionPanel, TechnicalStepper
- Multi-agent topology — Orchestrator + Planner + Coach as separate LangGraph graphs
- TechnicalStepper wired to Coach via Gemini API for real adaptive rescue flows
- Token economy — per-workspace caps on chat, image gen, doc summaries

---

## Phase A — Kernel — 2025-Q3 / Q4

### Added
- **Surface Registry** — manifest-based registration, `SurfaceHost`, `bootstrap.ts`
- **Layout Engine** — 6 spatial zones, pinning via localStorage
- **Capability Engine** — `@guarded_tool`, `PolicyEngine`, audit log
- **Persistence** — `AsyncPostgresSaver` for LangGraph checkpoints, `workspace_state` table, idempotent SQL migrations
- **Envelope protocol** — typed agent→frontend envelopes through BFF
- SQL migrations 001–011: auth, workspaces, surfaces, activity, usage, multi-project

---

## Foundation — 2025-Q2 / Q3

### Added
- Project scaffolded from [Generative-UI Global Hackathon Starter Kit](https://github.com/jerelvelarde/Generative-UI-Global-Hackathon-Starter-Kit)
- Crew domain model — `TeamMember`, `Task`, `Milestone`, `Blocker`, `SharedDocument` TypeScript + Python TypedDicts
- Urgency phase engine — `getUrgencyPhase(deadline)`, 5 phases, reactive 30s sync
- `/leader`, `/member/[memberId]`, `/docs` workspace routes
- 12 initial UI surfaces with `renderSurface` tool
- MilestoneCountdown — live 1s countdown with phase-aware styling
- Companion mascot (`MascotSVG`) — 5 mood states
- Marketing site — landing, /features, /how-it-works, /roadmap, /about, GlowCard spotlight
- BFF Hono server — CopilotKit Runtime v2, Redis-backed approval store
