# Crew Companion — Master Work Plan

**Status:** Strategic synthesis, awaiting start
**Supersedes:** `POLISH_PLAN.md` (absorbed and re-sequenced)
**Integrates:** `arquitectura/*`, `mejoras/*`, `agent/*`, `gemini-tasks/*`
**Last revised:** 2026-05-10
**Owner:** Milton

---

## Executive Synthesis

Crew Companion sits at the boundary between **prototype** and **professional cognitive runtime**. The documentation collectively reveals three layers of maturity:

| Layer | Source docs | Maturity |
|-------|-------------|----------|
| **Conceptual vision** (philosophy, surfaces, contextual generation) | `mejoras/01-02`, `arquitectura/*` | High — clearer than 95% of agentic products |
| **Operational design** (domain model, MVP scope, surface decision matrix) | `agent/*`, `gemini-tasks/*` | High — fully specified, mostly executed |
| **Technical implementation** (runtime, registry, governance) | code base | Low — still hackathon patterns |

The gap between vision and implementation is the **single most important strategic problem to solve**.

**Core insight (from `EXECUTION_MODEL_AND_STABILIZATION_STRATEGY.md`):**

> Two systems coexist: the conceptually correct system and the hackathon-inherited technical system. Priority is not more features — it is **stabilizing the operational model**.

**Therefore this plan does NOT:**
- Pile new surfaces onto a static switch/case renderer
- Add multi-agent complexity to a non-formalized runtime
- Polish visuals while runtime contracts remain implicit
- Connect real DB/filesystem before a capability layer exists

**This plan DOES:**
- Formalize the Kernel before expanding Surfaces
- Implement Spatial Grammar before redesigning visuals
- Implement Capability Engine before connecting persistence
- Defer multi-agent until single-agent + runtime is stable
- Re-sequence `POLISH_PLAN` deliverables to match the architectural-stability-first principle

---

## Part 1 — System State Inventory

### 1.1 What is already correct (preserve)

#### Frontend / BFF / Agent separation
- `apps/frontend/` (Next.js 15 :3010)
- `apps/bff/` (Hono :4000) — CopilotRuntime v2 bridge
- `apps/agent/` (Python LangGraph :8123) — reasoning core

**Verdict:** Locked. Do not refactor this boundary.

#### Domain typing
- TypeScript interfaces (`apps/frontend/src/lib/crew/types.ts`)
- Python TypedDicts (`apps/agent/src/types.py`)
- Strict sync: TeamMember, Task, Milestone, Blocker, SharedDocument

**Verdict:** Locked. Schema drift is project-killing — never let it happen.

#### Middleware pipeline
```
TimingMiddleware → CrewStateMiddleware → CopilotKitMiddleware
```
Conceptually sound. Preserve, but extend with `CapabilityMiddleware` and `AuditMiddleware` later.

#### Urgency phase engine
`getUrgencyPhase(deadline)` → `normal | focus | urgent | panic | expired`
- Drives mascot mood, banner color, action priority, surface routing
- Mature, deterministic, pure function
- **Single source of truth for visual rhythm**

**Verdict:** Locked. Tabla de decisión central del sistema.

#### Surface abstraction (conceptual)
Separating **semantic intent** from **visual representation** is the most valuable conceptual decision. The agent emits envelopes; the frontend renders.

**Verdict:** Concept locked. Implementation will be replaced (see Section 3).

#### Contextual decision logic
`Role × TechLevel × Phase × HasBlocker` → output surface type
Documented in `agent/04-surface-matrix.md`. More sophisticated than typical agentic products.

**Verdict:** Locked.

---

### 1.2 What is hackathon code (replace)

#### SurfaceRenderer is a static mapper
**Current:** `src/components/shared/SurfaceRenderer.tsx` uses `switch(envelope.type)` mapping strings to imported components.

**Problems:**
- No runtime discovery
- No capability validation
- No lifecycle management
- Cannot lazy-load
- Cannot version surfaces
- Adding a surface requires editing 3+ files
- Cannot support third-party / plugin surfaces

**Replacement target:** Surface Registry with manifests (Section 3.1).

#### Classic routes contradict philosophy
**Current:** `/leader`, `/member/[memberId]`, `/docs` — three pages with three separate visual designs.

**Conflict with docs:**
- `mejoras/01_filosofia_generativa.md`: "la interfaz se transforma, no se navega"
- `WORKSPACE_GRAMMAR.md`: "Las rutas /leader y /member dejan de ser destinos físicos"

**Replacement target:** Single workspace shell + Spatial Grammar with role/phase as context filters, not navigation destinations (Section 3.2).

#### Seed data instead of real persistence
**Current:** `apps/agent/crew.seed.json` + in-memory LangGraph checkpoint. Refreshes on agent restart.

**Problems:**
- State dies on agent reboot
- No multi-user, no workspaces, no isolation
- Cannot scale beyond single demo

**Replacement target:** AsyncPostgresSaver + workspace persistence schema (Section 3.4).

#### Single agent mega-prompt
**Current:** `apps/agent/src/prompts.py` — one system prompt embedding the entire surface decision table in text.

**Problems:**
- Prompt explosion as surfaces grow
- Reasoning bleed between concerns
- Cannot delegate specialty tasks
- No envelope-based coordination

**Replacement target:** Orchestrator + Specialists (Planner, Coach) **only after Kernel is stable** (Section 4).

#### No capability governance
**Current:** Tools in `apps/agent/src/tools.py` execute `Command(update=...)` without permission checks, audit, or approval gates.

**Problem severity:**
- **Tolerable now** (state is fictional)
- **Critical the moment any tool touches real DB / filesystem / shell**

**Replacement target:** Capability Engine + Policy Layer + Confirmation Gates (Section 3.3).

#### Mascot is ornamental SVG
**Current:** `MascotSVG.tsx` — inline SVG, 5 moods × 4 modes via CSS animations. Decorative.

**Problem:** Doesn't react to runtime events. Not a behavior system.

**Replacement target:** Rive state machine + xstate behavior tree (Section 5.3) — **but only after runtime stable**.

#### Dev urgency simulation buttons
**Current:** Dev-only buttons in `/leader` page that manually change milestone deadline. Pure demo crutch.

**Replacement target:** Real workspace milestones from DB, real-time clock.

---

### 1.3 What exists in docs but not in code (the vision gap)

| Concept | Documented in | Implementation status |
|---------|---------------|----------------------|
| 12 surface types (Force Graph, Causal Chain, Idea Matrix, etc.) | `mejoras/02_catalogo_interfaces.md` | 0% — current 8 are simpler |
| Spatial Grammar (anchors / generative / contextual zones) | `WORKSPACE_GRAMMAR.md` | 0% — pages are static layouts |
| Pinning Engine | `WORKSPACE_GRAMMAR.md` | 0% — no concept of pinned surfaces |
| Layout Negotiation (density, conflict resolution) | `WORKSPACE_GRAMMAR.md` | 0% — manual Tailwind grids |
| Capability Engine + Policy Layer | `BACKEND_RUNTIME_*.md` | 0% — tools execute freely |
| Audit log | `BACKEND_RUNTIME_*.md` | 0% — no event recording |
| Surface Registry + manifests | `FRONTEND_RUNTIME_EVALUATION.md` | 0% — switch/case only |
| Envelope-based agent coordination | `BACKEND_RUNTIME_*.md` | 0% — single agent, no protocol |
| Sandboxing for execution | `BACKEND_RUNTIME_*.md` | 0% — no shell/SQL anyway yet |
| Persistent multi-session memory | `arquitectura/*` | 0% — thread-scoped only |
| Auth + multi-tenancy | `POLISH_PLAN.md` | 0% — no users, no workspaces |

The vision is rich. The implementation is bare.

---

### 1.4 Tensions that must be resolved by this plan

| Tension | Position A | Position B | Resolution |
|---------|------------|------------|------------|
| Generation vs. stability | Total generation (philosophy) | Static screens (current code) | **Hybrid:** Persistent anchors + generative canvas + contextual overlays |
| Routes vs. workspace | Classic `/leader` etc. (current) | Single workspace transforms (vision) | **Phased:** Routes stay temporarily; become "role context filters" once Layout Engine exists |
| Multi-agent now vs. later | POLISH_PLAN week 2 | "No multi-agent until runtime stable" (mejoras) | **Defer:** Runtime stabilization first; multi-agent after Surface Registry + Capability Engine |
| Visual polish vs. kernel | "Visually stunning" (user) | "No hyper-polish before runtime" (mejoras) | **Mid-priority:** Polish what is *stable*. Don't polish what will be rebuilt. |
| DB connection vs. governance | POLISH_PLAN week 1 (Neon) | "Capability Engine before DB access" (mejoras) | **Sequence:** Kernel + Capability Engine *first*, then DB connection through governance layer |

---

## Part 2 — Strategic Direction

### 2.1 The product identity (locked)

From `arquitectura/FRONTEND_RUNTIME_EVALUATION.md` Section 1 — CORE_DECISIONS:

> Crew Companion is not a project management dashboard nor a chatbot with widgets. It is a **Cognitive Operational Runtime** — an adaptive work environment where the interface emerges and transforms according to operational context, team state, urgency, and detected intent.

**The product is NOT:**
- A Trello/Asana with AI bolted on
- A chatbot with task widgets
- A generic dashboard
- A hackathon coordination toy

**The product IS:**
- A runtime for human-AI collaborative work
- An adaptive operational environment
- A semantic UI generator (data type → interface type)
- A multi-role context-aware workspace

### 2.2 The execution model (locked)

Four layers of authority:

```
1. AGENT decides INTENT          → what surface/data semantically required
2. RUNTIME decides COMPOSITION   → layout, density, lifecycle, conflicts
3. POLICY decides VIABILITY      → capabilities, audit, sandboxing, approvals
4. USER decides AUTHORITY        → confirmations, pinning, final say
```

**No agent autonomy in destructive operations.** No layout from agent JSX. No runtime decisions without policy. **Always preserve user authority.**

### 2.3 The seven validation questions (apply to every feature)

From `mejoras/crew_companion_architectural_findings_and_direction.md` Section 6:

1. Does this increase operational clarity?
2. Does this improve human throughput?
3. Does this preserve user control?
4. Does this reduce cognitive load?
5. Does this strengthen the runtime?
6. Does this make the system more extensible?
7. Does this maintain philosophical coherence?

If 4+ answers are "no", the feature does not belong in core.

### 2.4 Constraints (locked from prior decisions)

| Constraint | Value | Source |
|------------|-------|--------|
| Total monthly cost | $0 | User priority |
| Hosting | Vercel + Render + Neon + Upstash | POLISH_PLAN |
| Auth | NextAuth + Resend magic-link | POLISH_PLAN |
| Mascot art | Imagen-generated → Rive | POLISH_PLAN |
| Mobile / PWA / Offline | Out of scope | POLISH_PLAN |
| LLM | Gemini Flash / Flash-Lite | POLISH_PLAN |
| Image gen lifetime cap | ~17 per workspace | POLISH_PLAN |
| Chat token cap | 200 turns/day/workspace | POLISH_PLAN |

---

## Part 3 — Kernel Stabilization (Foundation Layer)

This is the work that MUST come first. Everything in Part 4 onwards depends on it.

### 3.1 Surface Runtime — replace the switch/case

**Current state:** `SurfaceRenderer.tsx` is a static mapper.

**Target state:** Surface Registry with manifests, lazy loading, capability validation.

#### 3.1.1 Surface manifest schema

Every surface declares a manifest:

```typescript
// apps/frontend/src/runtime/surface-registry/types.ts
export interface SurfaceManifest {
  // Identity
  id: string                        // 'task_suggestion' | 'force_graph' | ...
  version: string                   // semver: '1.0.0'
  displayName: string

  // Capabilities required to mount
  requiredCapabilities: Capability[]  // ['state.read', 'tasks.read']
  forbiddenInPhases?: UrgencyPhase[]  // e.g. ['panic'] for non-critical surfaces

  // Role + tech-level visibility
  visibleToRoles: Role[]              // ['leader', 'member']
  visibleToTechLevels?: TechnicalLevel[]

  // Input contract
  envelopeSchema: ZodSchema           // validates incoming payload

  // Visual properties
  density: 'compact' | 'standard' | 'hero'
  preferredZone: 'primary' | 'context-rail' | 'overlay' | 'ambient'
  minWidth?: number                   // px
  minHeight?: number

  // Lifecycle hooks
  canPin: boolean                     // can user pin this surface?
  hibernatable: boolean               // can runtime collapse this?
  priority: number                    // 0-100, higher wins layout conflicts

  // Lazy loader
  load: () => Promise<{ default: ComponentType<SurfaceProps> }>
}
```

#### 3.1.2 Registry implementation

```typescript
// apps/frontend/src/runtime/surface-registry/registry.ts
class SurfaceRegistry {
  private surfaces = new Map<string, SurfaceManifest>()

  register(manifest: SurfaceManifest): void {
    // Validate manifest shape
    // Check no duplicate id
    // Register in map
  }

  resolve(intent: SurfaceIntent, context: RuntimeContext): SurfaceManifest | null {
    // Find best surface for intent
    // Check capabilities
    // Check role/phase visibility
    // Return manifest or null
  }

  validate(envelope: unknown, manifest: SurfaceManifest): ValidationResult {
    return manifest.envelopeSchema.safeParse(envelope)
  }

  async mount(manifest: SurfaceManifest, props: SurfaceProps): Promise<ComponentType> {
    const mod = await manifest.load()
    return mod.default
  }
}

export const surfaceRegistry = new SurfaceRegistry()
```

#### 3.1.3 Manifest registration

Each surface in `apps/frontend/src/components/surfaces/` exports a manifest file:

```typescript
// apps/frontend/src/components/surfaces/TaskSuggestionPanel/manifest.ts
export const manifest: SurfaceManifest = {
  id: 'task_suggestion',
  version: '1.0.0',
  displayName: 'Task Suggestions',
  requiredCapabilities: ['state.read', 'tasks.read'],
  visibleToRoles: ['leader'],
  envelopeSchema: TaskSuggestionEnvelopeSchema,
  density: 'standard',
  preferredZone: 'primary',
  priority: 50,
  canPin: true,
  hibernatable: true,
  load: () => import('./TaskSuggestionPanel'),
}
```

A bootstrap file imports all manifests and registers them:

```typescript
// apps/frontend/src/runtime/surface-registry/bootstrap.ts
import { manifest as taskSuggestion } from '@/components/surfaces/TaskSuggestionPanel/manifest'
import { manifest as milestoneSummary } from '@/components/surfaces/MilestoneSummaryPanel/manifest'
// ... all 8 current + 12 from catalog

export function bootstrapRegistry() {
  ;[taskSuggestion, milestoneSummary, /* ... */].forEach(m => surfaceRegistry.register(m))
}
```

#### 3.1.4 SurfaceHost component (replaces SurfaceRenderer)

```typescript
// apps/frontend/src/runtime/surface-registry/SurfaceHost.tsx
export function SurfaceHost({ envelope, context }: { envelope: SurfaceEnvelope, context: RuntimeContext }) {
  const manifest = surfaceRegistry.resolve(envelope.intent, context)
  if (!manifest) return <UnsupportedSurfaceCard intent={envelope.intent} />

  const validation = surfaceRegistry.validate(envelope.payload, manifest)
  if (!validation.success) return <InvalidEnvelopeCard error={validation.error} />

  const Component = use(loadSurfaceCached(manifest))  // React 19 use() for suspense
  return <Component payload={validation.data} context={context} />
}
```

**Deliverables:**
- [ ] `apps/frontend/src/runtime/surface-registry/` directory
- [ ] `types.ts`, `registry.ts`, `bootstrap.ts`, `SurfaceHost.tsx`
- [ ] All 8 existing surfaces refactored to export manifests + lazy load
- [ ] `SurfaceRenderer.tsx` replaced by `SurfaceHost`
- [ ] Unit tests for registry resolve/validate

**Acceptance:**
- Register a fake surface in console → it mounts
- Pass invalid envelope → renders error card, no crash
- Phase=panic + non-critical surface → registry rejects mount
- Bundle: only the visible surface loads at runtime (verify in Network tab)

**Effort:** 3-4 days

---

### 3.2 Spatial Grammar — replace classic routes

**Current state:** Three pages with three independent layouts. User navigates between them.

**Target state:** Single workspace shell. Role and phase become **context filters**, not navigation. Layout regions are negotiated by a Layout Engine.

#### 3.2.1 Zones (from `WORKSPACE_GRAMMAR.md`)

```
┌──────────────────────────────────────────────────────────────────┐
│  COMMAND SURFACE (top)                       persistent anchor   │
│  ⌘K input + active workspace name + user avatar                  │
├──────────────────────────────────────────────────────────────────┤
│                                                          ┌──────┐│
│                                                          │ AGENT││
│   PRIMARY WORKZONE (center, large)                       │ RAIL ││
│   - Dominant surface mounted by Layout Engine            │      ││
│   - Hero density                                         │ Chat ││
│                                                          │  +   ││
│                                                          │ Pet  ││
│                                                          │      ││
│   ────────────────────────────────                       │ pers ││
│   CONTEXT RAILS (below or right)                         │ anch ││
│   - Support surfaces (compact)                           │      ││
│   - Pinned surfaces persist here                         │      ││
│                                                          └──────┘│
├──────────────────────────────────────────────────────────────────┤
│  ACTIVITY STREAM (bottom, collapsible)         persistent anchor │
│  - Recent agent actions, state changes, audit log                │
└──────────────────────────────────────────────────────────────────┘
```

#### 3.2.2 Region implementation

```typescript
// apps/frontend/src/runtime/workspace/regions.ts
export type RegionId =
  | 'command-surface'
  | 'primary-workzone'
  | 'context-rail'
  | 'agent-rail'
  | 'activity-stream'
  | 'ambient-overlay'

export interface RegionState {
  id: RegionId
  mounted: SurfaceMount[]
  capacity: number              // max surfaces simultaneously
  collapsed: boolean
}

export interface SurfaceMount {
  manifestId: string
  envelope: SurfaceEnvelope
  pinned: boolean
  hibernated: boolean
  mountedAt: number             // timestamp
  priority: number              // 0-100
}
```

#### 3.2.3 Layout Engine

```typescript
// apps/frontend/src/runtime/workspace/layout-engine.ts
class LayoutEngine {
  /**
   * Agent requests to mount a surface via envelope.
   * Engine decides which region, may evict / hibernate / negotiate density.
   */
  mount(envelope: SurfaceEnvelope): MountResult {
    const manifest = surfaceRegistry.resolve(envelope.intent, this.context)
    if (!manifest) return { success: false, reason: 'no-matching-surface' }

    const region = this.pickRegion(manifest)
    const conflict = this.checkCapacity(region, manifest)
    if (conflict) {
      const resolution = this.resolveConflict(region, manifest, conflict)
      if (!resolution.allow) return { success: false, reason: resolution.reason }
      this.applyResolution(resolution)
    }

    return this.attach(region, manifest, envelope)
  }

  /**
   * On phase change, apply rules from WORKSPACE_GRAMMAR section 3.
   */
  onPhaseChange(prev: UrgencyPhase, next: UrgencyPhase): void {
    if (next === 'panic') {
      // Evict non-critical surfaces from primary
      // Mount triage-style surfaces with priority 100
    }
    // etc.
  }

  /**
   * User pins a surface — reserve space, agent cannot evict.
   */
  pin(surfaceMountId: string): void { /* ... */ }
  unpin(surfaceMountId: string): void { /* ... */ }
}
```

#### 3.2.4 WorkspaceShell component

```typescript
// apps/frontend/src/app/workspace/[workspaceId]/page.tsx
// (Or single app shell — see Part 4 for routing decisions)

export default function WorkspaceShell() {
  const layout = useLayoutEngine()
  return (
    <div className="workspace-shell phase-bg-{phase}">
      <CommandSurfaceRegion mounts={layout.commandSurface} />
      <div className="main">
        <PrimaryWorkzone mounts={layout.primary} />
        <ContextRail mounts={layout.contextRail} />
        <AgentRail />
      </div>
      <ActivityStream mounts={layout.activityStream} />
      <AmbientOverlays mounts={layout.ambient} />
    </div>
  )
}
```

**Deliverables:**
- [ ] `apps/frontend/src/runtime/workspace/` directory
- [ ] `regions.ts`, `layout-engine.ts`, `WorkspaceShell.tsx`, region components
- [ ] Pinning engine: `usePinning` hook + persistence in localStorage
- [ ] Framer Motion morphism transitions between mounts
- [ ] Phase-driven layout rules (e.g. panic → primary cleared for triage)

**Acceptance:**
- Agent emits envelope → engine routes to correct region
- Two surfaces both want primary → lower priority hibernates
- User pins a surface → it survives phase transitions
- Phase changes from normal → panic → primary clears, triage surface mounts
- Layout transitions are animated, not pop-in

**Effort:** 4-5 days

---

### 3.3 Capability Engine + Policy Layer

**Current state:** Tools execute `Command(update=...)` with zero validation.

**Target state:** Every tool declares required capabilities; runtime validates, audits, and gates.

#### 3.3.1 Capability model

```python
# apps/agent/src/runtime/capabilities.py

class Capability(str, Enum):
    STATE_READ = "state.read"
    STATE_WRITE = "state.write"
    TASKS_READ = "tasks.read"
    TASKS_WRITE = "tasks.write"
    TASKS_DELETE = "tasks.delete"
    BLOCKERS_READ = "blockers.read"
    BLOCKERS_WRITE = "blockers.write"
    BLOCKERS_RESOLVE = "blockers.resolve"
    MILESTONES_READ = "milestones.read"
    MILESTONES_WRITE = "milestones.write"
    MEMBERS_INVITE = "members.invite"
    DOCS_READ = "docs.read"
    DOCS_WRITE = "docs.write"
    UI_RENDER = "ui.render_surface"
    UI_MASCOT = "ui.set_mascot"
    UI_HIGHLIGHT = "ui.highlight"
    # Future (require approval):
    DB_QUERY = "db.query"
    FS_READ = "fs.read"
    FS_WRITE = "fs.write"
    SHELL_EXEC = "shell.execute"
```

#### 3.3.2 Tool declaration

```python
# apps/agent/src/tools.py — refactored

@tool(
    capabilities=[Capability.TASKS_WRITE, Capability.STATE_WRITE],
    risk_level=RiskLevel.LOW,
    requires_approval=False,
    audit=True,
)
def create_task(
    title: str,
    description: str,
    assigned_to: str,
    priority: str,
    state: Annotated[CrewCanvasState, InjectedState],
) -> Command:
    """Create a new task in the workspace."""
    # Capability validation happens via decorator
    new_task = {...}
    return Command(update={"tasks": [...state["tasks"], new_task]})


@tool(
    capabilities=[Capability.DB_QUERY],
    risk_level=RiskLevel.HIGH,
    requires_approval=True,           # User must confirm
    audit=True,
    sandbox="read-only",               # Future
)
def query_workspace_db(sql: str, state: Annotated[CrewCanvasState, InjectedState]) -> Command:
    """Run a read-only SQL query against workspace data."""
    # Decorator handles: capability check, risk eval, audit log entry,
    # approval gate (returns pending), sandbox enforcement
    ...
```

#### 3.3.3 Policy layer

```python
# apps/agent/src/runtime/policy.py

class PolicyEngine:
    """
    Evaluates whether a tool call is allowed in current context.
    """

    def evaluate(self, tool: Tool, context: ExecutionContext) -> PolicyDecision:
        # Rule 1: Capability must be granted to invoking agent
        if not self._has_capabilities(context.agent_id, tool.capabilities):
            return PolicyDecision.deny("missing_capability")

        # Rule 2: Phase-based restrictions
        if context.urgency_phase == "panic" and tool.risk_level == RiskLevel.HIGH:
            return PolicyDecision.deny("high_risk_blocked_in_panic")

        # Rule 3: Approval gate
        if tool.requires_approval and not context.approval_token:
            return PolicyDecision.pending_approval(reason="user_approval_required")

        # Rule 4: Rate limit
        if self._rate_limit_exceeded(context.workspace_id, tool.id):
            return PolicyDecision.deny("rate_limit")

        return PolicyDecision.allow()
```

#### 3.3.4 Audit log

```sql
-- apps/agent/migrations/003_audit_log.sql
CREATE TABLE audit_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  actor_type    text NOT NULL,         -- 'user' | 'agent:orchestrator' | 'agent:planner'
  actor_id      text NOT NULL,
  tool_id       text NOT NULL,
  capabilities  text[] NOT NULL,
  risk_level    text NOT NULL,
  input         jsonb NOT NULL,
  decision      text NOT NULL,         -- 'allowed' | 'denied' | 'pending' | 'approved'
  decision_reason text,
  approval_user_id uuid,
  outcome       text,                  -- 'success' | 'error'
  outcome_data  jsonb,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX audit_log_workspace_time ON audit_log (workspace_id, created_at DESC);
```

#### 3.3.5 Confirmation gates (frontend)

When a tool returns `PolicyDecision.pending_approval`, the frontend renders an inline approval card:

```typescript
// apps/frontend/src/components/runtime/ApprovalGate.tsx
export function ApprovalGate({ pendingAction }: { pendingAction: PendingAction }) {
  return (
    <Card className="border-amber-400">
      <h3>Approval required</h3>
      <p>The agent wants to: <strong>{pendingAction.tool}</strong></p>
      <p>Risk: {pendingAction.risk_level}</p>
      <p>Impact: {pendingAction.impact_description}</p>
      <div className="flex gap-2">
        <Button variant="primary" onClick={() => approve(pendingAction.id)}>Approve</Button>
        <Button variant="secondary" onClick={() => reject(pendingAction.id)}>Reject</Button>
      </div>
    </Card>
  )
}
```

**Deliverables:**
- [ ] `apps/agent/src/runtime/capabilities.py`
- [ ] `apps/agent/src/runtime/policy.py`
- [ ] Migration: `audit_log` table
- [ ] Refactor all current tools to declare capabilities
- [ ] `ApprovalGate.tsx` component
- [ ] Agent emits `pending_approval` envelope when policy says pending
- [ ] Unit tests for each policy rule

**Acceptance:**
- Tool without capability declaration → registry rejects at load
- High-risk tool in panic phase → denied
- Tool requiring approval → renders ApprovalGate, executes only after click
- All tool executions land in `audit_log`
- Audit log queryable by workspace + time

**Effort:** 4 days

---

### 3.4 Persistence — replace seed.json

**Current state:** `crew.seed.json` loaded into in-memory LangGraph checkpoint.

**Target state:** AsyncPostgresSaver + workspace tables + per-workspace thread.

#### 3.4.1 Schema migrations

```sql
-- Migration 001: auth (from POLISH_PLAN)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  display_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE auth_verification_tokens (
  identifier text NOT NULL,
  token text NOT NULL,
  expires timestamptz NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Migration 002: workspaces
CREATE TABLE workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  invite_code text UNIQUE NOT NULL,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE workspace_members (
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('leader','member','viewer')),
  technical_level text NOT NULL CHECK (technical_level IN ('low-tech','high-tech')),
  capabilities text[] NOT NULL DEFAULT '{}',  -- per-member capability overrides
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

-- Migration 003: audit_log (from 3.3.4)

-- Migration 004: workspace state
CREATE TABLE workspace_state (
  workspace_id uuid PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  state_json jsonb NOT NULL,
  thread_id text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Migration 005: pinning (per-user, per-workspace)
CREATE TABLE pinned_surfaces (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  surface_manifest_id text NOT NULL,
  envelope jsonb NOT NULL,
  region_id text NOT NULL,
  pinned_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, workspace_id, surface_manifest_id)
);

-- Migration 006: activity events
CREATE TABLE activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  actor text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX activity_events_idx ON activity_events (workspace_id, created_at DESC);

-- Migration 007: token usage (from POLISH_PLAN)
CREATE TABLE token_usage (
  workspace_id uuid REFERENCES workspaces(id),
  date date NOT NULL,
  agent text NOT NULL,
  in_tokens int NOT NULL DEFAULT 0,
  out_tokens int NOT NULL DEFAULT 0,
  PRIMARY KEY (workspace_id, date, agent)
);

-- Migration 008: generated assets cache
CREATE TABLE generated_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  asset_type text NOT NULL,
  asset_key text NOT NULL,
  prompt_hash text NOT NULL,
  url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (workspace_id, asset_type, asset_key)
);
```

#### 3.4.2 Agent persistence

```python
# apps/agent/src/runtime.py — refactor

from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

async def build_runtime():
    saver = AsyncPostgresSaver.from_conn_string(os.environ["DATABASE_URL"])
    await saver.setup()  # Creates langgraph tables on first boot

    graph = build_graph(checkpointer=saver)
    return graph
```

#### 3.4.3 Workspace state loader

Replaces the seed hydration in `CrewStateMiddleware`:

```python
# apps/agent/src/crew_state.py — refactor

async def hydrate_state(workspace_id: str, db: asyncpg.Pool) -> CrewCanvasState:
    """Load workspace state from DB, not seed.json."""
    row = await db.fetchrow(
        "SELECT state_json FROM workspace_state WHERE workspace_id = $1",
        workspace_id,
    )
    if row:
        return row["state_json"]

    # First boot: create initial state from template
    initial = build_initial_state(workspace_id)
    await db.execute(
        "INSERT INTO workspace_state (workspace_id, state_json, thread_id) VALUES ($1, $2, $3)",
        workspace_id, initial, f"thread-{workspace_id}",
    )
    return initial
```

**Deliverables:**
- [ ] 8 migration files in `apps/agent/migrations/`
- [ ] Migration runner script (`scripts/migrate.sh`)
- [ ] `apps/agent/src/runtime.py` refactored to use AsyncPostgresSaver
- [ ] `apps/agent/src/crew_state.py` refactored to hydrate from DB
- [ ] `crew.seed.json` becomes a *template* for new workspaces, not the live state

**Acceptance:**
- Restart agent → previous workspace state survives
- Create new workspace → fresh initial state from template
- Two workspaces simultaneously → states isolated
- Migrations idempotent

**Effort:** 2 days

---

### 3.5 Agent intent protocol (envelopes)

**Current state:** Agent calls frontend tools with arbitrary parameters. No standard envelope.

**Target state:** All agent → frontend communication uses a typed envelope.

#### 3.5.1 Envelope schema

```typescript
// apps/frontend/src/runtime/envelope/types.ts

export interface SurfaceEnvelope {
  // Identity
  envelopeId: string                      // uuid for correlation
  agentId: 'orchestrator' | 'planner' | 'coach' | string
  emittedAt: number

  // Intent (what semantically should happen)
  intent: SurfaceIntent
  priority: 'low' | 'medium' | 'high' | 'critical'

  // Payload (validated against manifest's envelopeSchema)
  payload: unknown

  // Context the agent saw when making this decision
  context: {
    role: Role
    techLevel: TechnicalLevel
    phase: UrgencyPhase
    hasActiveBlocker: boolean
    workspaceId: string
  }

  // Capability claims
  requiredCapabilities: Capability[]

  // Lifecycle hints
  hibernatable: boolean
  pinnable: boolean
  ephemeral?: number                     // ms before auto-dismiss
}

export type SurfaceIntent =
  | 'render_surface'
  | 'set_mascot_mood'
  | 'highlight_tasks'
  | 'update_state'
  | 'request_approval'
  | 'show_ambient_alert'
```

#### 3.5.2 BFF transport

The BFF receives envelopes from the agent (via CopilotRuntime tool calls) and:
1. Logs to `audit_log` if applicable
2. Validates against policy
3. Forwards to frontend as a single typed channel

```typescript
// apps/bff/src/envelope-channel.ts
export function envelopeChannel(agent: LangGraphAgent) {
  return {
    onToolCall: async (call: ToolCall) => {
      const envelope = adaptToolCallToEnvelope(call)
      await auditLog.record(envelope)
      const policy = await policyEngine.evaluate(envelope)
      if (!policy.allowed) return errorResponse(policy)
      return forwardToFrontend(envelope)
    }
  }
}
```

**Deliverables:**
- [ ] Envelope schema in both TypeScript and Python (synced)
- [ ] Agent emits envelopes (not bare tool calls)
- [ ] BFF adapts/validates/audits
- [ ] Frontend has single envelope handler → routes by `intent`
- [ ] Correlation ID tracing across all 3 layers

**Acceptance:**
- Every frontend mutation has corresponding `audit_log` row
- Invalid envelope → rejected at BFF, never reaches frontend
- Envelope correlation traceable in LangSmith

**Effort:** 2 days

---

### 3.6 Kernel Stabilization — total effort

| Section | Days |
|---------|------|
| 3.1 Surface Runtime | 3-4 |
| 3.2 Spatial Grammar | 4-5 |
| 3.3 Capability Engine | 4 |
| 3.4 Persistence | 2 |
| 3.5 Envelope protocol | 2 |
| **Total** | **15-17 days** (~3 weeks) |

This is **Phase A**. Nothing in Phase B starts until A passes acceptance.

---

## Part 4 — Product Layer (after Kernel)

Once Kernel is stable, we can safely:
- Add auth + workspaces (needs persistence → done in 3.4)
- Split agents (needs envelope protocol → done in 3.5)
- Add visual polish (needs Spatial Grammar → done in 3.2)
- Connect real tools (needs Capability Engine → done in 3.3)

### 4.1 Auth + workspaces

From `POLISH_PLAN.md` week 1, now safe to implement:

**Deliverables:**
- [ ] NextAuth + Resend magic-link (no password)
- [ ] `/login`, `/auth/check-email`, `/onboarding`, `/workspace-select` routes
- [ ] Workspace creation flow
- [ ] Invite by email (Resend) with `?invite=<code>` link
- [ ] Multi-workspace support: user can belong to N
- [ ] Workspace switcher in command surface
- [ ] Members can have per-workspace `technical_level` and `role`

**Acceptance:**
- 3 users via 3 emails → same workspace → shared state
- Leader creates task in tab A → member sees in tab B within 3s
- Sign out clears session, blocks access

**Effort:** 3 days

---

### 4.2 Multi-agent topology (Orchestrator + Planner + Coach)

**Now safe** because: envelope protocol exists (3.5), capability engine governs delegation (3.3).

#### 4.2.1 Topology

```
                       user message
                            │
                            ▼
                   ┌────────────────┐
                   │  Orchestrator  │  Gemini Flash
                   │  (supervisor)  │  ≤500 tok out
                   └───────┬────────┘
                  delegate │ via envelope
              ┌────────────┴────────────┐
              ▼                         ▼
     ┌────────────────┐        ┌────────────────┐
     │   Planner      │        │     Coach      │
     │   Flash-Lite   │        │   Flash-Lite   │
     │   ≤1000 out    │        │   ≤1500 out    │
     └────────────────┘        └────────────────┘
```

#### 4.2.2 Routing

Orchestrator classifies user intent → routes to specialist (or handles directly):

| Intent | Direct | Planner | Coach |
|--------|--------|---------|-------|
| greeting, status_check | ✓ | | |
| task management | | ✓ | (filter if low-tech members) |
| milestone summary | ✓ | (optional for re-plan) | |
| blocker report | | | ✓ |
| help / how-to | | | ✓ |
| doc question | ✓ | | |

#### 4.2.3 Inter-agent envelopes

```python
# Planner produces:
envelope = {
  "agentId": "planner",
  "intent": "render_surface",
  "payload": {
    "surface_id": "task_suggestion",
    "tasks": [...],
    "rationale": "..."
  },
  "requiredCapabilities": ["tasks.write", "ui.render_surface"],
  ...
}

# Orchestrator may:
# - pass through (return to BFF)
# - enrich (add coaching for low-tech members)
# - reject (policy denied)
```

**Deliverables:**
- [ ] `apps/agent/src/agents/orchestrator.py`
- [ ] `apps/agent/src/agents/planner.py`
- [ ] `apps/agent/src/agents/coach.py`
- [ ] `apps/agent/src/agents/router.py` (delegation graph)
- [ ] LangGraph subgraph topology
- [ ] AG-UI parallel agent visibility verified
- [ ] Token usage logged per agent per turn

**Acceptance:**
- "Split this milestone into tasks for low-tech members" → Orch → Planner → Coach → enriched surface
- Each scenario total tokens < 4000
- Inter-agent delegation visible in chat as parallel agent cards
- Token cap enforced (200 turns/day/workspace)

**Effort:** 4 days

---

### 4.3 Mascot — Rive + behavior tree

Per POLISH_PLAN week 3 — unchanged in approach. **Now safe** because:
- Surface Runtime can mount mascot in agent-rail region
- Layout Engine reserves space for the agent-rail anchor
- Behavior tree reads from `phase`, `blocker`, `activity` (all from persisted state)

**Steps:**
1. Imagen generation of 5 character frames (one-time)
2. Rive editor: build state machine
3. `<Pet>` React component using `@rive-app/react-canvas`
4. xstate behavior tree (idle, curious, focused, worried, panicked, celebrating, sleeping, alert)
5. Wire events from runtime
6. Optional voice via browser `speechSynthesis`

**Deliverables:**
- [ ] `scripts/generate-mascot.ts`
- [ ] `apps/frontend/public/pet.riv`
- [ ] `apps/frontend/src/runtime/pet/Pet.tsx`
- [ ] `apps/frontend/src/runtime/pet/machine.ts`
- [ ] Wire pet into `<AgentRail>` region

**Effort:** 3 days

---

### 4.4 Visual polish (selective)

Now safe because: only stable, runtime-resolved layouts get polished.

| Item | Effort | Why now |
|------|--------|---------|
| Phase background CSS gradients | 0.3d | Cheap, stable |
| Framer Motion morphism transitions | 0.5d | Layout Engine emits transition events |
| Sonner toasts | 0.2d | Every mutation now flows through envelopes — toast on success |
| Skeleton loaders | 0.2d | Surface lazy-load triggers Suspense → skeleton |
| Empty states | 0.3d | Region shows empty state when no surface mounted |
| canvas-confetti | 0.1d | Milestone-done event from runtime |
| Drag-drop kanban (dnd-kit) | 1d | TaskBoard surface gets DnD |
| Cmd+K palette (cmdk) | 0.5d | Command Surface region |
| Activity feed | 0.5d | Reads `activity_events` table |
| Optimistic UI | 0.5d | Envelope acks back; rollback on policy denial |

**Effort:** ~4 days

---

### 4.5 Expand surface catalog (the 12 from `mejoras/02_catalogo_interfaces.md`)

Now safe because: Surface Registry exists; new surfaces register via manifests.

**Existing (8):** TaskSuggestionPanel, MilestoneSummaryPanel, BlockerInsightPanel, MemberActionPanel, BeginnerGuidePanel, ChecklistPanel, TroubleshootingWizard, DocumentSummaryPanel

**New (per catalog):**

| Catalog # | Surface | Build effort | Priority |
|-----------|---------|--------------|----------|
| 01 | ForceGraph (dependencies) | 2d | High — differentiator |
| 02 | CountdownCritical (already partial in `MilestoneCountdown`) | 0.5d | High |
| 03 | CausalChain (debugging) | 2d | Medium |
| 04 | IdeaMatrix (2D positioning) | 2d | High |
| 05 | OrganismMap (system health) | 3d | Low — future |
| 06 | NarrativeTimeline | 1.5d | Medium |
| 07 | CommandSurface (already a region anchor) | 1d | High |
| 08 | TriageWarRoom | 2d | High — Panic phase |
| 09 | StepperBifurcado (extend BeginnerGuide?) | 1.5d | Medium |
| 10 | ScoreDashboard | 1.5d | Medium |
| 11 | AmbientOverlay (region: ambient-overlay) | 1d | High |
| 12 | SplitPaneSlider | 1d | Low |

**Priorities for shipping:**
- Phase B/C: Force Graph, Triage War Room, Idea Matrix, Ambient Overlay → these prove the semantic-grammar thesis
- Defer: Organism Map, Narrative Timeline, Split Pane → nice to have, not core

**Effort (for prioritized 5):** ~9 days

---

### 4.6 Token economy enforcement

From POLISH_PLAN, but now backed by `token_usage` table from migration 007.

**Backend:**
- Each agent turn increments `token_usage` row
- Hard cap per workspace/day → returns "limit reached, retry tomorrow" envelope
- Hard cap global/day → kill switch, status page warning

**Frontend:**
- Show remaining turns in admin UI
- Graceful degradation: when cap hit, suggestions still work (cached, no LLM call)

**Effort:** 1 day

---

### 4.7 Zero-error pass

| Item | Effort |
|------|--------|
| Mobile responsive (chat drawer < 768px) | 1.5d |
| Error boundaries on every region | 0.3d |
| Sentry integration | 0.3d |
| Plausible/Umami analytics | 0.3d |
| Form validation pass | 0.5d |
| Rate limiting (Upstash) | 0.5d |
| Token usage dashboard `/admin/usage` | 0.5d |
| Full manual QA pass (every role/phase/state) | 1d |
| Lighthouse pass (target ≥90 all metrics) | 0.5d |

**Effort:** 5 days

---

### 4.8 Free-tier deploy

| Step | Effort |
|------|--------|
| Single Dockerfile (BFF + agent + s6-overlay) | 0.5d |
| Render service config + env vars | 0.3d |
| Vercel project config | 0.3d |
| Neon Postgres + run migrations | 0.3d |
| Upstash Redis | 0.2d |
| Resend domain + DKIM + SPF | 0.5d |
| Cloudflare DNS | 0.2d |
| cron-job.org keepalive | 0.1d |
| Sentry + Plausible production | 0.3d |
| Onboarding wizard | 1d |
| Public landing on `/` | 0.5d |
| Privacy policy + TOS (Termly) | 0.2d |
| Deploy runbook `project-docs/DEPLOY.md` | 0.5d |

**Effort:** 5 days

---

## Part 5 — Full Schedule

Re-sequenced from POLISH_PLAN to honor architectural-stability-first.

### Phase A — Kernel Stabilization (~3 weeks)

| Week | Block | Deliverables |
|------|-------|--------------|
| 1 | 3.1 Surface Runtime | Registry, manifests, SurfaceHost, all 8 surfaces refactored |
| 1.5 | 3.5 Envelope protocol | Schema, BFF transport, correlation tracing |
| 2 | 3.3 Capability Engine | Capabilities, policy, audit log, ApprovalGate |
| 2.5 | 3.4 Persistence | Migrations, AsyncPostgresSaver, workspace state loader |
| 3 | 3.2 Spatial Grammar | Regions, Layout Engine, WorkspaceShell, Pinning |

**Phase A gate (must pass before Phase B):**
- [ ] All current functionality works through new runtime
- [ ] Surface Registry handles unknown surfaces gracefully
- [ ] Audit log has entries for every tool call
- [ ] Pinning persists across reload
- [ ] No regressions vs. current `/leader`, `/member`, `/docs` behavior

---

### Phase B — Product Layer (~3 weeks)

| Week | Block | Deliverables |
|------|-------|--------------|
| 4 | 4.1 Auth + workspaces | NextAuth, Resend, invites, multi-workspace |
| 4.5 | 4.2 Multi-agent | Orchestrator + Planner + Coach |
| 5 | 4.3 Mascot Rive | Imagen frames, Rive state machine, behavior tree |
| 5.5 | 4.4 Visual polish | Gradients, transitions, toasts, skeletons, kanban DnD |
| 6 | 4.5 New surfaces (prioritized 5) | ForceGraph, TriageWarRoom, IdeaMatrix, AmbientOverlay, CountdownCritical |

**Phase B gate (must pass before Phase C):**
- [ ] 3 users in 3 tabs sharing state via auth
- [ ] Multi-agent delegation visible in chat
- [ ] Pet animates from runtime events
- [ ] 5 new surfaces mount via registry
- [ ] All visual transitions smooth

---

### Phase C — Stabilize & Deploy (~1.5 weeks)

| Week | Block | Deliverables |
|------|-------|--------------|
| 7 | 4.6 Token economy | Caps enforced, dashboard |
| 7 | 4.7 Zero-error pass | Mobile, errors, validation, Lighthouse |
| 7.5 | 4.8 Free-tier deploy | All hosted, runbook published |

**Phase C gate (ship readiness):**
- [ ] Cold-start works (Render sleep ≤ 45s wake)
- [ ] 0 Sentry errors over 24h baseline
- [ ] Lighthouse ≥ 90 all metrics
- [ ] 5 test workspaces survive 7 days
- [ ] $0 actual cost confirmed

---

### Total: ~7.5 weeks vs. original POLISH_PLAN 6 weeks

The extra ~1.5 weeks buys us:
- A real runtime (not switch/case)
- Governance from day 1
- Future extensibility without rewrites
- Architectural coherence with the documented vision

This is the **correct trade**.

---

## Part 6 — File-level Deliverables Catalog

### New directories

```
apps/frontend/src/
├── runtime/
│   ├── surface-registry/
│   │   ├── types.ts
│   │   ├── registry.ts
│   │   ├── bootstrap.ts
│   │   └── SurfaceHost.tsx
│   ├── envelope/
│   │   ├── types.ts
│   │   ├── handler.ts
│   │   └── validators.ts
│   ├── workspace/
│   │   ├── regions.ts
│   │   ├── layout-engine.ts
│   │   ├── WorkspaceShell.tsx
│   │   ├── CommandSurfaceRegion.tsx
│   │   ├── PrimaryWorkzone.tsx
│   │   ├── ContextRail.tsx
│   │   ├── AgentRail.tsx
│   │   ├── ActivityStream.tsx
│   │   └── AmbientOverlays.tsx
│   ├── pinning/
│   │   ├── usePinning.ts
│   │   └── pinning-store.ts
│   └── pet/
│       ├── Pet.tsx
│       ├── machine.ts
│       └── speak.ts

apps/agent/src/runtime/
├── capabilities.py
├── policy.py
├── audit.py
└── envelope.py

apps/agent/src/agents/
├── orchestrator.py
├── planner.py
├── coach.py
└── router.py

apps/agent/migrations/
├── 001_auth.sql
├── 002_workspaces.sql
├── 003_audit_log.sql
├── 004_workspace_state.sql
├── 005_pinning.sql
├── 006_activity_events.sql
├── 007_token_usage.sql
└── 008_generated_assets.sql
```

### Modified files

```
apps/frontend/src/components/surfaces/<each>/
  ├── manifest.ts                     [NEW per surface]
  └── <SurfaceName>.tsx               [refactor: lazy export]

apps/frontend/src/components/shared/SurfaceRenderer.tsx  → DELETE (replaced by SurfaceHost)
apps/frontend/src/app/leader/page.tsx                    → simplifies to context filter
apps/frontend/src/app/member/[memberId]/page.tsx         → simplifies to context filter
apps/frontend/src/app/docs/page.tsx                      → simplifies to context filter
apps/frontend/src/app/page.tsx                           → auth-aware router
apps/frontend/src/app/layout.tsx                         → wraps WorkspaceShell

apps/agent/src/runtime.py                                → AsyncPostgresSaver
apps/agent/src/crew_state.py                             → DB hydration
apps/agent/src/tools.py                                  → capability decorators
apps/agent/src/prompts.py                                → split into per-agent prompts

apps/bff/src/server.ts                                   → multi-agent registration, envelope channel
```

---

## Part 7 — Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Surface Registry refactor breaks existing surfaces | Med | High | Refactor one surface at a time, full test each, parallel implementation behind feature flag |
| Layout Engine bugs cause user confusion | Med | High | Phase A gate includes manual UX walkthrough; ship behind feature flag in week 3 |
| Capability Engine over-blocks legitimate actions | Med | Med | Start permissive (audit-only mode), tighten gradually based on logs |
| Auth deliverability issues (Resend new domain) | Med | High | DKIM + SPF in week 1; test email deliverability daily |
| Render free tier sleeps + cold starts | High | Med | cron-job.org keepalive; document expectation in onboarding |
| Token caps too strict, demo breaks | Med | Med | Per-workspace override for trusted accounts; admin dashboard to monitor |
| Multi-agent token spend exceeds budget | Med | Med | Per-agent token cap in policy engine; circuit-breaker pattern |
| Rive learning curve for designer | Low | Low | Community CC0 character as backup; minimal state machine |
| Schema migration breaks production | Low | Critical | Always reversible migrations; manual backup before each release |
| Pinning state lost on auth change | Med | Low | Store in DB (migration 005) not localStorage; survives auth |
| Phase A scope creep | High | High | **Phase A gate is non-negotiable.** No Phase B work starts until A passes. |

---

## Part 8 — What NOT to Do (Explicit Exclusions)

From `EXECUTION_MODEL_AND_STABILIZATION_STRATEGY.md` section 8 — apply rigorously:

- **NO** new surface variety beyond the 5 prioritized in 4.5
- **NO** mobile-native or PWA installable
- **NO** plugin / extension system (premature)
- **NO** specialist agents beyond Planner + Coach (no SQL agent, no Debug agent yet)
- **NO** real DB/filesystem/shell tool access (capabilities exist but no tools yet)
- **NO** sandboxing implementation (capabilities declare it; runtime stub)
- **NO** voice input (Whisper)
- **NO** Slack/Discord integrations
- **NO** pet customization / inventory / evolution
- **NO** organism map, narrative timeline, split pane (deferred surfaces)
- **NO** workspace billing / Stripe
- **NO** multi-language UI (Spanish copy stays)
- **NO** code execution sandbox
- **NO** public template gallery
- **NO** AI-generated docs / changelogs

These belong in Phase D+ (post-launch).

---

## Part 9 — Success Metrics

### Phase A success
- Surface Registry handles 8 existing + 2 fake surfaces without error
- 100% of agent → frontend traffic goes through envelopes
- 100% of tool calls in `audit_log`
- Capability denial returns user-readable reason
- Pin/unpin survives reload, phase change, agent restart

### Phase B success
- 3 test users + 3 tabs + 1 workspace → state sync within 3s
- 5 scripted multi-agent scenarios under 4000 tokens each
- Pet reacts to all 8 events (idle, type, blocker-new, blocker-resolved, milestone-done, phase-change × 2, agent-tool-call)
- 5 new surfaces mount through registry without code changes outside their directories

### Phase C success (ship)
- $0 monthly cost over 30 days
- ≤3s p95 chat response
- ≥90 Lighthouse all metrics
- 0 Sentry errors in 24h baseline
- 5 test workspaces alive 7 days

### Long-term success (post-launch)
- Adding a new surface = 1 manifest + 1 component file = no other touches
- Adding a new tool = 1 capability declaration + 1 implementation = passes policy
- New role/phase combo = 1 prompt update + 1 surface manifest tag = works

---

## Part 10 — Open Decisions Before Phase A Starts

Resolve in a 30-minute kickoff session:

1. **Domain name:** Do we own `crewcompanion.dev` or alternative?
2. **Resend domain verification TLD:** which?
3. **Sentry org/project name?**
4. **Brand colors:** keep indigo/violet/emerald per-role OR refresh?
5. **Pet character:** blob (current SVG) OR different (cat/dog/dragon)?
6. **Activity feed:** workspace-public OR user-filtered?
7. **Token caps:** flat across roles OR weighted (leaders get more)?
8. **Feature flag library:** GrowthBook (free SaaS) OR home-rolled per-workspace flags table?
9. **Migration runner:** Prisma OR raw SQL with custom runner?
10. **i18n stance:** Spanish-only locked OR plan i18n keys from day 1?

---

## Part 11 — Glossary

| Term | Definition |
|------|-----------|
| **Kernel** | The non-visual core: Surface Registry, Layout Engine, Capability Engine, Policy, Audit. Stable infrastructure. |
| **Surface** | A typed UI module that responds to a semantic intent. Registered via manifest. |
| **Manifest** | Declarative metadata for a surface: id, capabilities, schema, density, priority, loader. |
| **Envelope** | Typed message from agent → runtime. Contains intent, payload, context, capabilities, lifecycle hints. |
| **Region** | A persistent zone in the workspace shell (Command Surface, Primary Workzone, Agent Rail, etc.). |
| **Layout Engine** | The runtime component that mounts surfaces into regions, negotiates conflicts, applies phase rules. |
| **Capability** | A namespaced permission like `tasks.write`, `db.query`. Declared by tools, validated by policy. |
| **Policy** | Runtime rules that gate tool execution (approval gates, phase blocks, rate limits). |
| **Approval Gate** | UI prompt for user confirmation on high-risk agent actions. |
| **Pinning** | User action that anchors a surface so the agent cannot evict it. Persists across reloads. |
| **Phase** | Urgency state derived from milestone deadline: normal → focus → urgent → panic → expired. |
| **Hibernation** | A surface is mounted but collapsed/iconified to save layout space. |
| **Workspace** | A team's container: members, tasks, milestones, state. 1 workspace = 1 thread. |
| **Thread** | CopilotKit conversation thread, persisted in Postgres via AsyncPostgresSaver. |
| **Specialist Agent** | A scoped agent (Planner, Coach) that the Orchestrator delegates to via envelope. |
| **Audit Log** | Append-only record of every tool execution: actor, capability, decision, outcome. |
| **Spatial Grammar** | The set of rules governing which regions are persistent, which are generative, and how they interact. |
| **Density** | A surface's visual scale: compact, standard, hero. Negotiated by Layout Engine. |
| **Ambient Overlay** | A small contextual surface (catalog #11) shown near the user's focus point. |

---

## Part 12 — Reference Cross-Index

| Topic | This doc | Source docs |
|-------|----------|-------------|
| Generative philosophy | Part 2.1 | `mejoras/01_filosofia_generativa.md` |
| 12 surface types | Part 4.5 | `mejoras/02_catalogo_interfaces.md` |
| Architectural findings | Part 1 | `mejoras/crew_companion_architectural_findings_and_direction.md` |
| Runtime refactor | Part 3 | `mejoras/crew_companion_runtime_refactor_and_foundation_strategy.md` |
| Backend runtime | Part 3.3, 3.5 | `arquitectura/BACKEND_RUNTIME_AND_AGENT_ARCHITECTURE.md` |
| Frontend runtime | Part 3.1 | `arquitectura/FRONTEND_RUNTIME_EVALUATION.md` |
| Spatial grammar | Part 3.2 | `arquitectura/WORKSPACE_GRAMMAR.md` |
| Execution model | Part 2.2 | `arquitectura/EXECUTION_MODEL_AND_STABILIZATION_STRATEGY.md` |
| Domain model | Part 1.1 | `agent/02-domain-model.md` |
| Surface matrix | Part 4.5 | `agent/04-surface-matrix.md` |
| Prompts & tools | Part 3.3, 4.2 | `agent/05-prompts-and-tools.md` |
| MVP scope (current) | Part 1.1 | `agent/06-mvp-scope.md` |
| Original phase plan | Part 5 | `dev-milton/00-roadmap.md` |
| Auth / deploy specifics | Part 4.1, 4.8 | `POLISH_PLAN.md` |
| Token economy | Part 4.6 | `POLISH_PLAN.md` |
| Mascot pipeline | Part 4.3 | `POLISH_PLAN.md` |
| Project file map | Part 6 | `PROJECT_STRUCTURE.md` |

---

## Conclusion

This plan reconciles **vision** (`mejoras/*`, `arquitectura/*`) with **pragmatism** (`POLISH_PLAN.md`) by:

1. Doing the architectural work first (Phase A, 3 weeks) — runtime, registry, governance, persistence, envelopes
2. Then layering product features safely (Phase B, 3 weeks) — auth, multi-agent, mascot, polish, new surfaces
3. Then shipping (Phase C, 1.5 weeks) — token caps, errors, deploy

**The key insight:** Without the architectural work, every product feature increases tech debt. With it, every product feature is leveraged by a stable kernel.

**Total: ~7.5 weeks. Zero recurring cost. Ships with auth, 3 agents, animated pet, 13 surfaces, drag-drop, capabilities + audit, multi-tenant workspaces — all on free tier.**

Then post-launch: plugin system, specialist agents, real tool integrations (DB, FS, shell — through capabilities), mobile, billing.

---

**Next step:** Confirm decisions in Part 10, then begin Phase A week 1 with Surface Registry implementation.
