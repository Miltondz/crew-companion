# Crew Companion — Polish Plan (Post-MVP Work Doc)

**Status:** Approved, not started
**Owner:** Milton
**Target:** 6 weeks of work, $0/mo recurring cost, demo-ready polished web app

---

## Locked decisions

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| 1 | Auth | NextAuth.js + Resend magic-link | Free tier (3K emails/mo on Resend), no password UX, polished |
| 2 | Mascot art | Imagen-generated frames → Rive state machine | Custom-feel, ~5 tokens once, cached forever |
| 3 | BFF + Agent host | Render (single Docker service) | Simpler than Fly, fits single-binary deploy |
| 4 | Phase backgrounds | CSS gradients (no Imagen) | 0 token cost, still rich |
| 5 | Multi-agent count | Start with 3 (Orchestrator + Planner + Coach) | Ships fast, room to grow |
| 6 | Scope | Web only, no mobile/PWA, no offline | Focus visual polish |

---

## Final stack

```
┌──────────────────────────────────────────────────────────────────────┐
│  CLIENT                                                                │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │  Next.js 15 (Vercel hobby tier — free)                            ││
│  │  React 19, Tailwind, shadcn/ui, Framer Motion, Rive, xstate,      ││
│  │  dnd-kit, sonner, cmdk, canvas-confetti, lucide                   ││
│  └──────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼ HTTPS
┌──────────────────────────────────────────────────────────────────────┐
│  EDGE / DNS                                                            │
│  Cloudflare (free) — DNS, SSL, basic DDoS                              │
└──────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│  RENDER (free tier, sleeps 15min idle, 750h/mo)                        │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │  Single Docker container:                                         ││
│  │  ─ Hono BFF (Node 20)        :4000                                ││
│  │  ─ LangGraph agent (Python)  :8123  (sidecar)                     ││
│  │  ─ Supervisor: pm2 or s6-overlay                                   ││
│  └──────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
       ┌────────────┐      ┌────────────┐       ┌────────────┐
       │  Neon PG   │      │  Upstash   │       │  Gemini    │
       │  free 3GB  │      │  Redis 10K │       │  Flash-Lite│
       │            │      │  cmd/day   │       │  + Imagen  │
       └────────────┘      └────────────┘       └────────────┘
       app data,           chat throttle        LLM + 1-time
       assets cache        + rate limit         image gen
```

**Optional ops:** Sentry free (5K events/mo), Plausible self-host or Umami free, cron-job.org keepalive ping every 14min.

---

## Token economy — hard numbers

### Image generation (Imagen 3)

Lifetime cap per workspace:

| Asset | Count | When |
|-------|-------|------|
| Mascot pose frames | 5 | Onboarding only |
| Achievement badges | 10 max | Lazy on first milestone hit |
| Workspace logo | 1 | Setup |
| **Total** | **16 forever** | — |

Global app cap: 100 image gens total (set as backend hard limit until paid tier).

### Chat tokens (Gemini Flash-Lite)

Per turn budget:
- Orchestrator: ≤500 in + ≤500 out
- Planner (when called): ≤1000 in + ≤1000 out
- Coach (when called): ≤1000 in + ≤1500 out (richer guides)

Daily cap per workspace: 200 turns (configurable).
Global daily cap: 2000 turns (kill-switch if exceeded).

### Caching strategy

| Cache | Layer | TTL | Key |
|-------|-------|-----|-----|
| Image gen results | Postgres `generated_assets` | forever | sha256(prompt + style) |
| Surface renders for identical inputs | Postgres `surface_cache` | 1h | sha256(surface_type + payload) |
| Doc summaries | Postgres `doc_summaries` | until doc edited | doc_id + content_hash |
| Suggestions | client-side static | session | role + phase |

---

## Multi-agent architecture

### Topology — LangGraph supervisor

```
                       user message
                            │
                            ▼
                   ┌────────────────┐
                   │  Orchestrator  │  Gemini Flash
                   │  (supervisor)  │  ≤500 tok out
                   └───────┬────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
     ┌────────────────┐        ┌────────────────┐
     │   Planner      │        │     Coach      │
     │   Flash-Lite   │◄──────►│   Flash-Lite   │
     └────────────────┘        └────────────────┘
       decompose               per-member,
       milestones,             tech-level,
       create tasks,           blockers,
       balance load            wizards/checklists
```

### Routing rules (Orchestrator)

```python
# Pseudo-code for Orchestrator routing
def route(user_msg, state):
    intent = classify(user_msg)  # Flash classification, ~50 tokens

    if intent in ['greeting', 'status_check', 'render_existing_data']:
        return handle_directly()

    if intent == 'task_management':
        plan = call_planner(state, user_msg)
        if state.has_low_tech_members:
            plan = call_coach(plan, members=state.low_tech_members)
        return render_surface('task_suggestion', plan)

    if intent == 'blocker_report':
        return call_coach(state, mode='blocker_solve')

    if intent == 'milestone_review':
        summary = call_planner(state, mode='summary')
        return render_surface('milestone_summary', summary)

    return handle_directly()  # default
```

### Agent specs

#### Orchestrator
- **Model:** Gemini Flash
- **System prompt focus:** classify intent → render surface OR delegate
- **Tools (frontend-callable):** `setCrewState`, `setMascotMood`, `renderSurface`, `highlightTasks`
- **Tools (delegate):** `delegate_to_planner`, `delegate_to_coach`
- **Token cap:** 500 out

#### Planner
- **Model:** Gemini Flash-Lite
- **System prompt focus:** decompose goals → balanced task list, time estimates, milestone scoping
- **Tools (backend):** `create_task`, `update_task`, `create_milestone`, `get_workload(member_id)`
- **Inputs:** `crew_state`, `user_intent`, optional `existing_tasks`
- **Outputs:** structured task list ready for `task_suggestion` surface
- **Token cap:** 1000 out

#### Coach
- **Model:** Gemini Flash-Lite
- **System prompt focus:** per-member personalization, tech-level-aware, blocker resolution
- **Tools (backend):** `report_blocker`, `resolve_blocker`, `get_member_history(member_id)`
- **Tools (render):** emits surface envelopes for `beginner_guide`, `troubleshooting_wizard`, `checklist`
- **Inputs:** `member`, `tech_level`, `current_task`, `blocker?`, `phase`
- **Outputs:** surface envelope + optional state updates
- **Token cap:** 1500 out

### Inter-agent flows (concrete examples)

**Flow 1: "Split this milestone into tasks"**
1. User → Orchestrator
2. Orchestrator classifies: `task_management`
3. Orchestrator → Planner with `crew_state` slice
4. Planner returns 6 candidate tasks
5. Orchestrator detects low-tech member assigned → Planner result → Coach
6. Coach adds beginner-friendly description for low-tech tasks
7. Orchestrator → user as `task_suggestion` surface

**Flow 2: "I'm stuck"**
1. User (member, low-tech) → Orchestrator
2. Orchestrator classifies: `blocker_report`
3. Orchestrator → Coach with `member.tech_level=low-tech`
4. Coach calls `report_blocker` backend tool
5. Coach emits `troubleshooting_wizard` surface
6. Orchestrator passes through, sets mascot to `worried`

**Flow 3: "What's the team status?"**
1. User (leader) → Orchestrator
2. Orchestrator classifies: `status_check`
3. Orchestrator handles directly (data already in state, just summarize)
4. Renders `milestone_summary` surface
5. No specialist call → 0 extra tokens

---

## Mascot pipeline

### Step 1 — generate frames (Imagen, one-time)

Prompt template:
```
A cute round blob creature with big eyes, kawaii style, flat 2D
illustration, soft pastel colors, vector clean lines, full body,
white background, [POSE_STATE], 512×512.
```

Five POSE_STATE values:
- `calm idle pose, neutral happy expression, eyes open`
- `worried pose, slight frown, concerned eyes, leaning forward`
- `panicked pose, sweat drops, wide shocked eyes, mouth open`
- `celebrating pose, arms up, sparkle eyes, big grin, jumping`
- `sleeping pose, eyes closed, peaceful, small zzz above head`

Stored: `assets/mascot/frame_calm.png` ... `frame_sleeping.png`

### Step 2 — Rive composition

In Rive editor (rive.app, free):
- Import 5 PNG frames as artboards
- Create state machine "PetState":
  - States: idle, curious, focused, worried, panic, celebrate, sleep, alert
  - Transitions on input triggers
- Add interpolation between frames + ambient breathing animation
- Export `pet.riv` (~50KB)

Stored: `apps/frontend/public/pet.riv`

### Step 3 — React integration

```tsx
// apps/frontend/src/components/mascot/Pet.tsx
import { useRive, useStateMachineInput } from '@rive-app/react-canvas'

export function Pet({ state, mood }: { state: PetState, mood: PetMood }) {
  const { rive, RiveComponent } = useRive({
    src: '/pet.riv',
    stateMachines: 'PetState',
    autoplay: true,
  })
  const stateInput = useStateMachineInput(rive, 'PetState', 'state')
  const moodInput = useStateMachineInput(rive, 'PetState', 'mood')

  useEffect(() => { stateInput && (stateInput.value = stateOrdinal[state]) }, [state, stateInput])
  useEffect(() => { moodInput && (moodInput.value = moodOrdinal[mood]) }, [mood, moodInput])

  return <RiveComponent style={{ width: 96, height: 96 }} />
}
```

### Step 4 — behavior tree (xstate)

```ts
// apps/frontend/src/lib/pet/machine.ts
import { createMachine, assign } from 'xstate'

export const petMachine = createMachine({
  id: 'pet',
  initial: 'idle',
  states: {
    idle:        { on: { TYPING: 'curious', BLOCKER_NEW: 'worried', MILESTONE_DONE: 'celebrating', AGENT_TOOL_CALL: 'alert', INACTIVE_60S: 'sleeping' } },
    curious:     { after: { 3000: 'idle' } },
    focused:     { on: { PHASE_NORMAL: 'idle', BLOCKER_NEW: 'worried', PHASE_PANIC: 'panicked' } },
    worried:     { on: { BLOCKER_RESOLVED: 'idle', PHASE_PANIC: 'panicked' } },
    panicked:    { on: { PHASE_RESOLVED: 'idle' } },
    celebrating: { after: { 4000: 'idle' } },
    sleeping:    { on: { ANY_ACTIVITY: 'idle' } },
    alert:       { after: { 1500: 'idle' } },
  },
})
```

### Step 5 — wire events

In each page:
```tsx
const [petState, send] = useMachine(petMachine)

// Wire crew events
useEffect(() => {
  if (urgencyPhase === 'panic') send('PHASE_PANIC')
  else if (urgencyPhase === 'focus' || urgencyPhase === 'urgent') send('PHASE_FOCUS')
  else send('PHASE_NORMAL')
}, [urgencyPhase])

useEffect(() => {
  if (activeBlockers.length > prevBlockers) send('BLOCKER_NEW')
}, [activeBlockers.length])

// Render
<Pet state={petState.value} mood={state.mascotMood} />
```

### Optional voice (free, browser native)

```ts
// apps/frontend/src/lib/pet/speak.ts
export function speak(text: string) {
  if (typeof window === 'undefined') return
  const u = new SpeechSynthesisUtterance(text)
  u.rate = 1.1; u.pitch = 1.4  // cute pet voice
  speechSynthesis.speak(u)
}
```

Trigger on worried/panic transitions if user has voice toggle on.

---

## Auth flow — NextAuth + Resend magic link

### Schema (Postgres, new tables)

```sql
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text UNIQUE NOT NULL,
  display_name  text NOT NULL,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE workspaces (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  invite_code   text UNIQUE NOT NULL,  -- short, shareable
  created_by    uuid REFERENCES users(id),
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE workspace_members (
  workspace_id  uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES users(id)      ON DELETE CASCADE,
  role          text NOT NULL CHECK (role IN ('leader','member')),
  technical_level text NOT NULL CHECK (technical_level IN ('low-tech','high-tech')),
  joined_at     timestamptz DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE generated_assets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  asset_type    text NOT NULL,  -- 'mascot_frame', 'badge', 'logo'
  asset_key     text NOT NULL,  -- e.g. 'calm', 'frame_panic'
  prompt_hash   text NOT NULL,
  url           text NOT NULL,  -- supabase storage or local /public/generated/
  created_at    timestamptz DEFAULT now(),
  UNIQUE (workspace_id, asset_type, asset_key)
);

CREATE TABLE auth_verification_tokens (
  identifier    text NOT NULL,
  token         text NOT NULL,
  expires       timestamptz NOT NULL,
  PRIMARY KEY (identifier, token)
);
```

### NextAuth config

```ts
// apps/frontend/src/lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import { PrismaAdapter } from '@auth/prisma-adapter'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: 'smtp.resend.com',
        port: 465,
        auth: { user: 'resend', pass: process.env.RESEND_API_KEY },
      },
      from: 'noreply@yourdomain.com',
      maxAge: 24 * 60 * 60,
    }),
  ],
  pages: { signIn: '/login', verifyRequest: '/auth/check-email' },
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id
      session.user.workspaces = await getUserWorkspaces(user.id)
      return session
    },
  },
}
```

### Auth flow UX

1. `/` (unauthenticated) → landing with "Sign in with email"
2. User enters email → Resend sends magic link → "check your inbox" page
3. Click link → session set → `/workspace-select`
4. If 0 workspaces → onboarding wizard (create first workspace, name it, generate mascot)
5. If 1 workspace → auto-redirect to `/leader` or `/member/[id]` based on role
6. If multi → list workspaces, pick one
7. Each workspace = own thread ID = own crew state

### Invite flow

- Leader: settings panel → "Invite teammate" → enter email → backend sends magic link with `?invite=<workspace_invite_code>`
- New user clicks → signup → joins workspace as member (default low-tech, can upgrade in profile)

---

## Database schema additions

In addition to auth tables above:

```sql
-- Crew state per workspace (replaces in-memory checkpoint for prod)
CREATE TABLE workspace_state (
  workspace_id  uuid PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  state_json    jsonb NOT NULL,
  thread_id     text NOT NULL,
  updated_at    timestamptz DEFAULT now()
);

CREATE TABLE surface_cache (
  cache_key     text PRIMARY KEY,
  envelope      jsonb NOT NULL,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE token_usage (
  workspace_id  uuid REFERENCES workspaces(id),
  date          date NOT NULL,
  agent         text NOT NULL,  -- orchestrator | planner | coach
  in_tokens     int NOT NULL DEFAULT 0,
  out_tokens    int NOT NULL DEFAULT 0,
  PRIMARY KEY (workspace_id, date, agent)
);

-- Activity feed for real-time UI
CREATE TABLE activity_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  actor         text NOT NULL,  -- user_id OR 'agent:orchestrator' OR 'agent:planner'
  event_type    text NOT NULL,  -- task_created, blocker_reported, etc.
  payload       jsonb NOT NULL,
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX activity_events_workspace_created ON activity_events (workspace_id, created_at DESC);
```

---

## Visual polish — concrete deliverables

### Phase background gradients (CSS, no Imagen)

```css
/* apps/frontend/src/app/globals.css */
.phase-bg-normal   { background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%); }
.phase-bg-focus    { background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); }
.phase-bg-urgent   { background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%); }
.phase-bg-panic    { background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%); animation: panic-pulse 2s infinite; }
.phase-bg-expired  { background: linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%); }

@keyframes panic-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.85; }
}
```

Applied to `<main>` based on `urgencyPhase`.

### Framer Motion conventions

- Page entry: fade-in + 8px slide-up, 280ms
- Card hover: scale 1.02, 200ms
- Button tap: scale 0.97, 100ms
- Toast: slide from top, spring
- Modal: fade backdrop + scale 0.95→1 modal

### Toast contracts (sonner)

```ts
// All mutations call toast
toast.success('Tarea creada')
toast.error('No se pudo guardar', { description: err.message })
toast.loading('Generando...', { id: 'generate' })
toast.success('Listo!', { id: 'generate' })  // replaces loading
```

### Empty states

Each empty list gets:
- Lucide icon (lg, slate-300)
- Title (slate-600)
- Description (slate-400)
- Primary action button

```tsx
<EmptyState
  icon={<Inbox />}
  title="Sin tareas todavía"
  description="Pediselas al asistente o crealas con + Nueva tarea"
  action={<Button onClick={openNewTask}>＋ Nueva tarea</Button>}
/>
```

### Skeletons

Every async-loaded component renders skeleton during first 300ms:
- TaskCard skeleton: 3 lines + footer
- MilestonePanel skeleton: header + progress bar + 4 task lines
- TeamOverview skeleton: 3 member rows

### Drag-drop kanban (dnd-kit)

- Sortable within column (reorder)
- Cross-column (status change)
- Drop animation
- Optimistic update + rollback on agent disagree
- Touch + keyboard support

### Cmd+K palette (cmdk)

Items, role-aware:
- Always: "Switch workspace", "Sign out", "Help", "Settings"
- Leader: "New task", "Invite member", "Set deadline", "Share doc", "Highlight tasks"
- Member: "Mark task done", "Report blocker", "Ask coach", "Switch to docs"
- Stage-aware: panic phase adds "Show critical only", "What ship now?"

### Confetti

```tsx
// On milestone done
import confetti from 'canvas-confetti'
confetti({
  particleCount: 200,
  spread: 90,
  origin: { y: 0.6 },
  colors: ['#10b981', '#6366f1', '#f59e0b'],
})
// Plus pet → 'celebrate' state, plus toast.success
```

---

## Per-role / stage / problem control matrix

```ts
// apps/frontend/src/lib/controls/matrix.ts
export type ControlContext = {
  role: 'leader' | 'member'
  techLevel: 'low-tech' | 'high-tech'
  phase: UrgencyPhase
  hasActiveBlocker: boolean
  hasActiveTask: boolean
}

export type Action = {
  id: string
  label: string
  icon: string
  variant: 'primary' | 'secondary' | 'destructive'
  shortcut?: string
  handler: (ctx: ControlContext) => void | Promise<void>
}

export function getActionsForContext(ctx: ControlContext): Action[] {
  const actions: Action[] = []

  // Always
  actions.push({ id: 'cmd-k', label: 'Comando', icon: 'Command', variant: 'secondary', shortcut: '⌘K' })

  if (ctx.role === 'leader') {
    actions.push({ id: 'new-task',   label: 'Nueva tarea',   icon: 'Plus',  variant: 'primary' })
    actions.push({ id: 'invite',     label: 'Invitar',       icon: 'UserPlus', variant: 'secondary' })
    if (ctx.phase === 'focus' || ctx.phase === 'urgent') {
      actions.push({ id: 'highlight-critical', label: 'Resaltar críticas', icon: 'Star', variant: 'primary' })
    }
    if (ctx.phase === 'panic') {
      actions.push({ id: 'ship-now-wizard', label: '🚨 Qué shippear AHORA', icon: 'Rocket', variant: 'destructive' })
    }
    if (ctx.hasActiveBlocker) {
      actions.push({ id: 'help-member', label: 'Ayudar miembro', icon: 'LifeBuoy', variant: 'primary' })
    }
  }

  if (ctx.role === 'member') {
    if (ctx.hasActiveTask) {
      actions.push({ id: 'mark-done', label: 'Marcar listo', icon: 'Check', variant: 'primary' })
    }
    if (!ctx.hasActiveBlocker) {
      actions.push({ id: 'report-blocker', label: 'Tengo problema', icon: 'AlertTriangle', variant: 'secondary' })
    }
    if (ctx.hasActiveBlocker) {
      actions.push({ id: 'ask-coach', label: 'Necesito ayuda', icon: 'MessageCircle', variant: 'primary' })
    }
    if (ctx.phase === 'panic') {
      actions.push({ id: 'what-now', label: '¿Qué hago AHORA?', icon: 'HelpCircle', variant: 'destructive' })
    }
    if (ctx.techLevel === 'low-tech' && ctx.hasActiveTask) {
      actions.push({ id: 'show-guide', label: 'Mostrar guía', icon: 'Book', variant: 'secondary' })
    }
    if (ctx.techLevel === 'high-tech' && ctx.hasActiveTask) {
      actions.push({ id: 'show-checklist', label: 'Checklist', icon: 'ListChecks', variant: 'secondary' })
    }
  }

  return actions
}
```

Rendered into a sticky `<ActionBar>` below header. Animated in/out via Framer Motion as context changes.

---

## 6-week milestone breakdown

### Week 1 — Foundation (auth + state sync)

**Deliverables:**
- [ ] NextAuth installed + configured with Resend
- [ ] DB migrations: `users`, `workspaces`, `workspace_members`, `auth_verification_tokens`
- [ ] `/login`, `/auth/check-email`, `/api/auth/[...nextauth]` routes
- [ ] Resend account + DNS records for `noreply@`
- [ ] Workspace creation onboarding wizard
- [ ] Workspace invite flow (leader → email → joiner clicks → joins)
- [ ] Replace `redirect("/leader")` in `app/page.tsx` with auth-aware router
- [ ] Shared thread ID: each workspace has 1 thread, all members of workspace get same threadId on `CopilotChatConfigurationProvider`
- [ ] Migrate LangGraph from in-memory checkpoint → AsyncPostgresSaver against Neon
- [ ] Verify: leader creates task → member sees it without page reload (via Intelligence WS)

**Files touched (~15):**
- new: `src/lib/auth.ts`, `src/lib/prisma.ts`, `src/app/login/page.tsx`, `src/app/auth/check-email/page.tsx`, `src/app/api/auth/[...nextauth]/route.ts`, `src/app/onboarding/page.tsx`, `src/app/workspace-select/page.tsx`
- modified: `src/app/page.tsx`, `src/app/leader/page.tsx`, `src/app/member/[memberId]/page.tsx`, `src/app/docs/page.tsx`, `src/components/copilot/CopilotKitProviderShell.tsx`, `apps/agent/src/agent.py` (saver swap), `prisma/schema.prisma`, `.env.example`

**Acceptance:**
- 3 users sign in via 3 different emails into same workspace
- Leader posts task in tab A → member sees it in tab B within 3s
- Refresh page → state persists
- Sign out → can't access pages

---

### Week 2 — Multi-agent split

**Deliverables:**
- [ ] LangGraph supervisor topology with 3 nodes
- [ ] OrchestratorAgent (existing prompt refactored)
- [ ] PlannerAgent prompt + tools (decompose, estimate, balance)
- [ ] CoachAgent prompt + tools (per-member, tech-level branches)
- [ ] Inter-agent delegation tested via 3 scripted scenarios
- [ ] Predefined suggestions (`useConfigureSuggestions`) reduce ad-hoc routes
- [ ] State filtering: only relevant slice sent to each agent
- [ ] Token usage logged to `token_usage` table per turn
- [ ] AG-UI parallel agent visibility verified in chat UI

**Files touched (~10):**
- new: `apps/agent/src/agents/orchestrator.py`, `apps/agent/src/agents/planner.py`, `apps/agent/src/agents/coach.py`, `apps/agent/src/agents/router.py`
- modified: `apps/agent/src/main.py`, `apps/agent/src/prompts/`, `apps/agent/src/tools/`, `apps/bff/src/server.ts` (register new agents)

**Acceptance:**
- "Split this milestone into 5 tasks for low-tech members" → Orchestrator → Planner → Coach → returns enriched task list
- Token usage per scenario < 4000 total
- Delegation visible in chat UI (parallel agent cards)

---

### Week 3 — Mascot + visual polish

**Deliverables:**
- [ ] Imagen one-time generation of 5 mascot frames (script: `scripts/generate-mascot.ts`)
- [ ] Frames stored in `apps/frontend/public/mascot/`
- [ ] Rive file built in editor with state machine + ambient animations
- [ ] `<Pet>` React component using `@rive-app/react-canvas`
- [ ] xstate behavior tree + event wiring
- [ ] Replace `<MascotSVG>` with `<Pet>` in all 3 pages
- [ ] Voice toggle (browser TTS) in user settings
- [ ] Framer Motion page transitions
- [ ] CSS phase background gradients
- [ ] Sonner toasts on every mutation
- [ ] Skeleton loaders on all async lists
- [ ] canvas-confetti on milestone-done event
- [ ] Empty states with Lucide icons

**Files touched (~12):**
- new: `scripts/generate-mascot.ts`, `apps/frontend/public/pet.riv`, `apps/frontend/src/components/mascot/Pet.tsx`, `apps/frontend/src/lib/pet/machine.ts`, `apps/frontend/src/lib/pet/speak.ts`, `apps/frontend/src/components/shared/EmptyState.tsx`
- modified: 3 page files (replace MascotSVG, add transitions), `globals.css`, `layout.tsx` (sonner Toaster)

**Acceptance:**
- Pet idles smoothly, reacts within 200ms to typing/blocker/milestone events
- Confetti fires on 100% milestone progress
- All mutations show toast feedback
- No spinner-during-load, only skeletons

---

### Week 4 — Controls + interactions

**Deliverables:**
- [ ] `getActionsForContext` helper + ActionBar component
- [ ] ActionBar sticks below header on all 3 pages
- [ ] Drag-drop kanban with dnd-kit (status change + within-column reorder)
- [ ] Optimistic UI: click is instant, rollback on agent reject
- [ ] Cmd+K palette (cmdk library) with role-aware items
- [ ] All form fields validated (required + types)
- [ ] Activity feed component reading `activity_events` table
- [ ] Dark mode toggle wired (already partially supported)
- [ ] Keyboard shortcuts: ⌘K palette, ⌘N new task (leader), ⌘B report blocker (member)

**Files touched (~10):**
- new: `src/lib/controls/matrix.ts`, `src/components/shared/ActionBar.tsx`, `src/components/shared/CommandPalette.tsx`, `src/components/shared/ActivityFeed.tsx`, `src/lib/hooks/use-shortcuts.ts`
- modified: 3 page files, `TaskCard` (DnD attrs), `Kanban` columns

**Acceptance:**
- Drag task from "todo" to "done" → status updates + toast + pet celebrates
- ⌘K opens palette, ⌘K again closes
- Action bar adapts when phase transitions panic ↔ normal
- Member sees "What ship now?" only in panic phase

---

### Week 5 — Zero-error pass + responsive

**Deliverables:**
- [ ] Mobile responsive: chat collapses to drawer on `<768px`
- [ ] Error boundaries on every route
- [ ] Sentry integration
- [ ] Plausible/Umami analytics
- [ ] All buttons functional (no dead clicks)
- [ ] All forms validate + show errors inline
- [ ] All API errors user-readable
- [ ] Token usage dashboard (admin-only) at `/admin/usage`
- [ ] Rate limiting via Upstash Redis (10 turns/min/workspace)
- [ ] Full feature pass: each role/phase/state combo manually tested

**Files touched (~8):**
- new: `src/components/shared/ErrorBoundary.tsx`, `src/lib/sentry.ts`, `src/components/shared/MobileChat.tsx`, `src/app/admin/usage/page.tsx`, `src/lib/rate-limit.ts`
- modified: `layout.tsx` (Sentry wrap), 3 page files (responsive breakpoints), all forms

**Acceptance:**
- Run on iPhone 12 viewport: zero overflow, chat works
- Force errors: agent timeout, network drop, invalid input → all show user-friendly message
- 50 concurrent simulated users: no 5xx
- All Lighthouse scores ≥ 90

---

### Week 6 — Free deploy

**Deliverables:**
- [ ] Single Dockerfile combining BFF + Python agent + s6-overlay supervisor
- [ ] Render service: web + Postgres-Neon connection + Upstash-Redis env
- [ ] Vercel project for Next.js frontend
- [ ] Cloudflare DNS: app.crewcompanion.dev → Vercel; api.crewcompanion.dev → Render
- [ ] cron-job.org keepalive ping every 14min
- [ ] Public landing page on `/` for unauthenticated users
- [ ] Onboarding wizard runs on first sign-in
- [ ] Privacy policy + TOS (Termly free)
- [ ] Sentry + Plausible production config
- [ ] Deploy runbook in `project-docs/DEPLOY.md`
- [ ] Rollback plan documented

**Files touched (~6):**
- new: `Dockerfile.prod`, `render.yaml`, `vercel.json`, `apps/frontend/src/app/landing/page.tsx`, `project-docs/DEPLOY.md`
- modified: `.env.production`, root `package.json` build scripts

**Acceptance:**
- Cold start: BFF responds within 45s after sleep
- Sign up → magic link arrives within 30s
- New workspace → first task creates within 5s
- 0 errors in Sentry over 24h
- Total monthly cost: $0

---

## Test plan

### Unit
- agent routing logic (orchestrator decision table)
- control matrix (every role/phase/state combo)
- pet state machine (xstate test utils)
- token budget enforcement

### Integration
- 3 agents end-to-end on scripted prompts
- magic-link sign-up flow
- workspace invite flow
- DnD kanban with optimistic + rollback

### E2E (Playwright, free)
- Sign up → onboarding → create task → mark done
- Invite teammate → teammate accepts → leader sees in team
- Phase transition normal → panic → action bar adapts
- Mobile viewport: full flow

### Manual QA checklist (week 5)

- [ ] Every button on every page clicks and does something
- [ ] Every form validates on submit
- [ ] Every empty list has empty state
- [ ] Every loading state has skeleton (not spinner)
- [ ] Every error has user-friendly message + retry
- [ ] Pet reacts within 200ms to all events
- [ ] No console errors on any page
- [ ] No 404s in network tab
- [ ] Lighthouse ≥ 90 perf, ≥ 95 a11y, ≥ 95 best-practices, ≥ 95 SEO
- [ ] Works in Chrome, Firefox, Safari latest

---

## Deploy runbook (week 6)

### One-time setup

1. Create Neon project → copy DATABASE_URL
2. Create Upstash Redis → copy REST_URL + TOKEN
3. Create Resend account → add domain → copy API key
4. Create Cloudflare account → add domain
5. Create Vercel account → import GitHub repo (frontend only)
6. Create Render account → new web service from GitHub (BFF+agent dir)
7. Create Sentry project → copy DSN
8. Set up cron-job.org → ping `https://api.crewcompanion.dev/healthz` every 14min

### Environment vars

Render service:
```
DATABASE_URL=postgres://... (Neon)
REDIS_URL=...                (Upstash REST)
GEMINI_API_KEY=...
RESEND_API_KEY=...
NEXTAUTH_SECRET=...           (openssl rand -hex 32)
NEXTAUTH_URL=https://app.crewcompanion.dev
SENTRY_DSN=...
LANGSMITH_API_KEY=...         (optional, observability)
TOKEN_DAILY_CAP_PER_WORKSPACE=200
TOKEN_DAILY_CAP_GLOBAL=2000
```

Vercel project (frontend):
```
NEXT_PUBLIC_API_URL=https://api.crewcompanion.dev
NEXTAUTH_URL=https://app.crewcompanion.dev
DATABASE_URL=postgres://...   (same Neon)
RESEND_API_KEY=...
NEXTAUTH_SECRET=...
```

### Deploy command

```bash
# Frontend
git push origin main  # Vercel auto-deploys

# Backend (Render auto-deploys on push but verify)
git push origin main
# Render dashboard → Manual Deploy → Latest commit
```

### Rollback

- **Frontend:** Vercel dashboard → Deployments → previous → "Promote to Production"
- **Backend:** Render dashboard → Events → previous deploy → "Rollback"
- **DB schema:** Prisma migrations are forward-only; for rollback, write inverse migration manually
- **Lost agent state:** restore from `workspace_state.state_json` snapshot (Neon point-in-time recovery on free tier? — verify; otherwise nightly pg_dump to S3 free)

---

## Risks + mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Render free sleeps | High | Med | cron ping every 14min, docs cold-start expectation |
| Upstash 10K cmd/day cap | Med | Med | Use Postgres for thread state; Redis only chat throttle |
| Gemini free tier 15 RPM | Med | High | Predefined suggestions, hard rate limit per workspace |
| Imagen quota exceeded | Low | Low | One-time generation, hard 100-cap globally |
| Resend 3K emails/mo | Low | Low | Magic link + invite only; bulk emails not in scope |
| Neon storage 3GB | Low | Low | Activity events TTL 30 days; cache TTL 7 days |
| Pet Rive file too big | Low | Low | Cap at 100KB, optimize in editor |
| LangGraph in-Render perf | Med | High | Profile early week 6; if slow, split agent to separate Render service |
| SMTP deliverability (Resend new domain) | Med | High | DKIM + SPF setup week 1, test deliverability before launch |

---

## Out of scope (explicitly deferred)

- Mobile native apps
- Offline mode / PWA installable
- Voice input (Whisper)
- Slack / Discord webhooks
- Pet evolution levels
- Pet inventory / cosmetics
- Workspace billing / pricing tiers
- File upload to chat
- Calendar integration
- Multi-language UI (Spanish copy stays as-is for now)
- Code execution sandbox
- Public template gallery
- Embedded analytics dashboards
- AI-generated docs
- Real-time collaboration cursors

These go on a Phase 2 roadmap, not this 6-week effort.

---

## Future stretch (Phase 2 — after launch)

| Feature | Effort | Value |
|---------|--------|-------|
| 4th agent: BlockerSolver specialist | 2d | High |
| 5th agent: DocResearch RAG over workspace docs | 3d | High |
| 6th agent: ImageGen automation | 2d | Med |
| Pet voice via ElevenLabs (paid) or Coqui TTS (free) | 2d | Med |
| Mobile PWA installable | 3d | High |
| Slack webhook integration | 1d | High |
| Public landing + marketing site | 3d | High |
| Pricing + Stripe (free tier limits enforced) | 5d | Required for monetization |

---

## Success metrics (post-launch, week 7+)

- 90% task completion rate during demo (no broken flows)
- < 3s p95 chat response time
- Zero Sentry errors first 24h after launch
- 5 test workspaces created without bugs
- Pet animation smooth at 60fps on 5-year-old laptop
- Lighthouse ≥ 90 across all metrics
- Token usage stays under free tier across 10 active workspaces × 7 days

---

## Open questions to resolve before week 1

1. Domain name: do we own `crewcompanion.dev` or alternative?
2. Resend domain verification: which TLD will we use?
3. Sentry org/project name?
4. Brand colors: stick with current indigo/violet or refresh?
5. Pet character: keep blob shape or different (cat/dog/dragon)?
6. Activity feed: per-workspace public OR per-user filtered?
7. Token caps: leader-aware (more for leaders) or flat?

Resolve these in a kickoff session before week 1 starts.

---

## Glossary

- **Surface:** AI-generated typed UI component rendered in chat (T01-T08)
- **Static component:** Always-rendered dashboard component (T09-T15)
- **Workspace:** Container for a team's tasks/members/state — 1 workspace = 1 thread
- **Thread:** CopilotKit conversation thread, persisted in Postgres
- **Phase:** Urgency state derived from milestone deadline (normal → focus → urgent → panic → expired)
- **Tech level:** Member's technical comfort (low-tech vs high-tech) → drives Coach branching
- **Pet:** Rive-animated mascot with xstate behavior tree
- **Action:** Context-aware button surfaced via `getActionsForContext`
