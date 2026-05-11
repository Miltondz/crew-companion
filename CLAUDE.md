# Crew Companion — Claude Code Project Rules

## Project

Crew Companion is a Cognitive Operational Runtime built on Next.js 15 (frontend), Hono (BFF), Python LangGraph (agent). Goal: generative UI where the interface adapts to role + technical level + urgency phase + active blockers.

**Always read first:**
- `project-docs/MASTER_WORK_PLAN.md` — full 7.5-week execution plan, phases, deliverables, invariants
- `project-docs/PROJECT_STRUCTURE.md` — file map with descriptions

**Phase status:**
- Phase A (Kernel): not started — Surface Registry, Layout Engine, Capability Engine, Persistence, Envelopes
- Phase B (Product): not started — Auth, multi-agent, Rive mascot, polish, new surfaces
- Phase C (Deploy): not started — token caps, errors, free-tier deploy

Until Phase A passes its gate, do not begin Phase B work. See MASTER_WORK_PLAN Part 5.

---

## Model routing (AUTOMATIC — apply on every task)

This project has 5 specialized subagents in `.claude/agents/`. The main thread MUST delegate work according to these rules, not write code directly itself.

### Routing decision tree

```
Task incoming
  │
  ├─ Read-only / locate code / map structure?
  │  └─ crew-researcher (Haiku) — cheap, fast lookups
  │
  ├─ Novel architectural design? (Surface manifest schema, Layout
  │  Engine rules, Capability model, envelope shape, NEW concept
  │  not yet in MASTER_WORK_PLAN, or hard debugging Sonnet failed)
  │  └─ crew-architect (Opus) — use sparingly, ~5% of work
  │
  ├─ Trivial mechanical edit? (typo, single function ≤30 lines,
  │  Tailwind classes, UI copy, config files, doc text edits,
  │  test boilerplate)
  │  └─ crew-polisher (Haiku) — if scope is OBVIOUSLY bounded
  │
  ├─ Default: real coding work
  │  └─ crew-implementer (Sonnet) — refactors, library integration,
  │     multi-file changes, schema-affecting work, agent prompts,
  │     cross-language sync (TS ↔ Python)
  │
  └─ After non-trivial implementer/polisher work
     └─ crew-reviewer (Sonnet) — runs git diff, severity-tagged findings
```

### Model budget by phase

| Phase | Architect (Opus) | Implementer (Sonnet) | Polisher (Haiku) | Reviewer (Sonnet) | Researcher (Haiku) |
|-------|------------------|----------------------|------------------|-------------------|---------------------|
| A (Kernel) | 10% | 70% | 5% | 10% | 5% |
| B (Product) | 3% | 60% | 15% | 12% | 10% |
| C (Deploy) | 2% | 40% | 30% | 15% | 13% |

### Hard rules for the main thread

1. **Do not write code directly.** Delegate to crew-implementer or crew-polisher.
2. **Do not read files for analysis.** Delegate to crew-researcher.
3. **Architect is expensive.** Only invoke when novel design is required, never for refactors of already-designed code.
4. **Polisher refuses cross-file work.** If it refuses, escalate to implementer.
5. **Always reviewer after non-trivial implementer work.** Cheap insurance against bugs.
6. **Single-message parallelization.** Independent tasks (research + planning) launch in parallel agent calls.

### When to override routing

- User explicitly says "use Opus" / "use Sonnet" / "use Haiku" → respect it
- User says "do it directly" → main thread writes (rare, usually for tiny tweaks)
- Phase A gate failing → escalate to architect for diagnosis

---

## Project invariants (NEVER violate)

1. **Frontend / BFF / Agent separation** — frontend never calls agent directly. Always through BFF.
2. **TS ↔ Python type sync** — adding a field in `apps/frontend/src/lib/crew/types.ts` means adding it in `apps/agent/src/types.py` in the same change.
3. **Urgency phase is derived** — `getUrgencyPhase(deadline)` is the only source. Never store phase, always compute.
4. **Surface Registry pattern** (Phase A onward) — surfaces register via manifests. No imports of surface components in routing code.
5. **Envelope protocol** (Phase A onward) — all agent → frontend communication is typed envelopes through the BFF.
6. **Capability declarations** (Phase A onward) — every tool declares required capabilities; policy engine evaluates.
7. **User authority on destructive actions** — agent never auto-executes high-risk operations; always render an ApprovalGate.
8. **No commits without explicit user request.** Never `git commit` proactively.
9. **No pushes without explicit user request.** Never `git push` proactively.
10. **No skipping hooks.** Never `--no-verify` or `--no-gpg-sign` unless user explicitly asks.

If a requested change would violate any invariant, refuse and ask for confirmation.

**Envelope protocol active** (block 3.5 complete): agent SHOULD emit full envelopes; BFF logs correlation; frontend accepts both legacy and full shapes until all call sites updated.

**Capability declarations active (3.3):** every tool declares required capabilities via @guarded_tool; PolicyEngine evaluates; audit log records all decisions.

**Persistence active (3.4):** AsyncPostgresSaver replaces MemorySaver when DATABASE_URL set; workspace state hydrated from `workspace_state` table; migrations idempotent via `_migrations` meta table; run `bash scripts/migrate.sh up`.

**Spatial Grammar built (3.2):** LayoutEngine + 6 regions (command-surface, primary-workzone, context-rail, agent-rail, activity-stream, ambient-overlay) + pinning (localStorage) in `apps/frontend/src/runtime/workspace/`. WorkspaceShell available but NOT yet wrapping the 3 pages — page-to-shell migration deferred to Phase B (4.x). renderSurface tool still renders inline for now.

---

## Style rules (apply everywhere)

- Code comments: write none by default. Only when WHY is non-obvious (hidden constraint, workaround for specific bug, surprising behavior).
- Never explain WHAT code does — well-named identifiers do that.
- Never reference current task / fix / callers in code comments.
- No multi-paragraph docstrings, no multi-line comment blocks. One-line max.
- No error handling for cases that can't happen. Trust internal code + framework guarantees.
- No backwards-compatibility shims when you can just change the code.
- No emojis in code unless explicitly requested.
- No "I successfully..." or other self-congratulatory output.
- End-of-turn summary: one or two sentences max. Nothing else.

---

## Stack rules

**Frontend:**
- React 19, Next.js 15 App Router
- Tailwind CSS 4
- shadcn/ui (Radix + Tailwind primitives in `components/ui/`)
- CopilotKit v2 (`@copilotkit/react-core/v2`) — NOT v1
- Framer Motion for transitions
- xstate for behavior trees (Pet, future state machines)
- Rive (`@rive-app/react-canvas`) for animated mascot
- Zod for envelope validation

**BFF:**
- Hono on Node 20, port 4000
- `@copilotkit/runtime/v2` `CopilotRuntime` + `LangGraphAgent`
- CopilotKitIntelligence for thread persistence
- Single Docker container with agent sidecar (Phase C)

**Agent:**
- Python 3.11+ managed by `uv`
- LangGraph for graph orchestration
- AsyncPostgresSaver (Phase A onward) for checkpoint persistence
- Pydantic + TypedDict for state shapes
- Gemini Flash / Flash-Lite as default LLM
- Anthropic Claude Sonnet 4.6 as alternate runtime

**Infrastructure:**
- Local: Docker Compose (Postgres 5433, Redis 6381, Intelligence 4203/4403)
- Prod: Vercel (frontend) + Render (BFF+agent single container) + Neon (Postgres) + Upstash (Redis) — all free tier

---

## Token economy enforcement

- Image generation: hard cap 16 per workspace lifetime, 100 global
- Chat: 200 turns/day/workspace, 2000 global
- Cache aggressively: image gen by `sha256(prompt + style)`, doc summaries by content hash
- Send agent only relevant state slice, not full state
- Use suggestions (`useConfigureSuggestions`) to avoid ad-hoc routing classifications

When budget is at risk, return cached results or degrade gracefully — never hard-fail.

---

## Quick reference

### Commands

```bash
npm run dev              # full stack (BFF + frontend + agent)
npm run dev:ui           # frontend only
npm run dev:bff          # BFF only
npm run dev:agent        # Python agent only
npm run dev:infra        # Docker Compose only
npm run seed             # seed default user into Intelligence Postgres
npm run kill-ports       # free occupied ports before restart
```

### Key directories

- `apps/frontend/src/runtime/` — Phase A target: registry, layout, envelope, pet
- `apps/frontend/src/components/surfaces/` — generative UI surfaces with manifests (Phase A)
- `apps/frontend/src/components/ui/` — shadcn primitives (do not modify)
- `apps/agent/src/runtime/` — Phase A target: capabilities, policy, audit, envelope
- `apps/agent/src/agents/` — Phase B target: orchestrator, planner, coach
- `apps/agent/migrations/` — Phase A target: SQL migrations
- `project-docs/MASTER_WORK_PLAN.md` — source of truth for all work

### Ports

| Service | Port |
|---------|------|
| Frontend | 3010 |
| BFF | 4000 |
| Agent (LangGraph) | 8123 |
| MCP server | 3001 |
| Postgres | 5433 (host) → 5432 (container) |
| Redis | 6381 → 6379 |
| Intelligence API | 4203 → 4201 |
| Intelligence WS | 4403 → 4401 |

---

## When user says "start Phase A"

Sequence:
1. Read MASTER_WORK_PLAN Part 3 fully
2. Resolve any open decisions from MASTER_WORK_PLAN Part 10 (ask user)
3. Begin with block 3.1 (Surface Runtime) — invoke crew-architect for manifest schema design first, then crew-implementer for execution
4. After each block: crew-reviewer pass before moving to next block
5. Update TaskList as blocks complete
6. Phase A gate check before Phase B
