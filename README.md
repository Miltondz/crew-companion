# Crew Companion

<div align="center">

```
  ██████╗██████╗ ███████╗██╗    ██╗     ██████╗ ██████╗ ███╗   ███╗██████╗  █████╗ ███╗   ██╗██╗ ██████╗ ███╗   ██╗
 ██╔════╝██╔══██╗██╔════╝██║    ██║    ██╔════╝██╔═══██╗████╗ ████║██╔══██╗██╔══██╗████╗  ██║██║██╔═══██╗████╗  ██║
 ██║     ██████╔╝█████╗  ██║ █╗ ██║    ██║     ██║   ██║██╔████╔██║██████╔╝███████║██╔██╗ ██║██║██║   ██║██╔██╗ ██║
 ██║     ██╔══██╗██╔══╝  ██║███╗██║    ██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██╔══██║██║╚██╗██║██║██║   ██║██║╚██╗██║
 ╚██████╗██║  ██║███████╗╚███╔███╔╝    ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ██║  ██║██║ ╚████║██║╚██████╔╝██║ ╚████║
  ╚═════╝╚═╝  ╚═╝╚══════╝ ╚══╝╚══╝      ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝
```

**Cognitive Operational Runtime for project teams.**

> The interface transforms based on who you are, how urgent things are, and what's blocking you — not the other way around.

[![Next.js](https://img.shields.io/badge/Next.js_15-black?logo=next.js)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python_3.11-3776AB?logo=python&logoColor=white)](https://python.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-orange)](https://langchain-ai.github.io/langgraph)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

</div>

---

## What it is

Crew Companion is **not a dashboard with AI bolted on**. It's a runtime where the interface *emerges* from context rather than being navigated. Four layers govern every interaction:

The **Agent Layer** decides semantic intent — which surface is needed and what data to populate. The **Runtime Layer** resolves the physical workspace: which zone, which lifecycle, what happens when two surfaces compete for the same region. The **Policy Layer** acts as a capability firewall — it checks whether a tool is allowed to run, records every decision, and intercepts high-risk operations before they reach the user. The **User Layer** always has the final word: confirmations, pinned panels, and ApprovalGates for destructive actions.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   AGENT LAYER        decides intent                     │
│   "What surface and data is semantically needed?"       │
│                          │                              │
│                          ▼                              │
│   RUNTIME LAYER      decides composition                │
│   "Layout, density, lifecycle, conflict resolution"     │
│                          │                              │
│                          ▼                              │
│   POLICY LAYER       decides viability                  │
│   "Capabilities, audit trail, approval gates"           │
│                          │                              │
│                          ▼                              │
│   USER LAYER         decides authority                  │
│   "Confirmations, pinning, final say"                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## The Core Differentiator

Most AI-augmented tools treat the interface as static and layer intelligence on top. Crew Companion inverts this: the agent decides *what* to show, the runtime decides *where and how*, and the result is a workspace that is different for a panicking project leader at 11pm versus a low-tech team member onboarding on a quiet Monday morning.

The key shift is from navigation to emergence — users don't click through menus to find relevant information; the system detects the context and composes the appropriate workspace automatically.

| Typical AI tool | Crew Companion |
|---|---|
| Static layouts with AI widgets | Generative UI surfaces triggered by agent intent |
| Same UI for everyone | Role × TechLevel × UrgencyPhase × Specialization → unique workspace |
| Manual status updates | State machine drives mascot, colors, surface routing |
| One project per account | Multi-project dashboard, invite-link team sharing |
| Chat-first interface | Spatial grammar: 6 zones, pinning, ambient overlays |
| AI suggests, user configures | Agent emits typed envelopes; runtime composes layout |
| Generic chat help | Specialization-aware coaching (dev/designer/QA/manager/writer) |

---

## System Architecture

The system is split into three independently deployable tiers. The **frontend** (Next.js 15, Vercel) handles all rendering, surface lifecycle, and user interaction. It communicates exclusively through the **BFF** (Backend-for-Frontend, Hono on Render), which acts as the CopilotKit gateway, applies rate limits, and manages workspace-scoped state. The **agent** (Python LangGraph, sidecar on Render) contains all AI logic — tools, routing, policy, and checkpointed conversation state. The frontend never calls the agent directly; this separation is a hard architectural invariant.

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                              │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Next.js 15 Frontend                       │    │
│  │                                                              │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐ │    │
│  │  │ Surface      │  │ Layout       │  │ Envelope          │ │    │
│  │  │ Registry     │  │ Engine       │  │ Validator (Zod)   │ │    │
│  │  │              │  │ (6 regions)  │  │                   │ │    │
│  │  └──────┬───────┘  └──────┬───────┘  └────────┬──────────┘ │    │
│  │         └─────────────────┴──────────────────┘            │    │
│  │                           │                                │    │
│  │              ┌────────────▼───────────┐                   │    │
│  │              │    WorkspaceShell       │                   │    │
│  │              │  (role-aware layout)   │                   │    │
│  │              └────────────────────────┘                   │    │
│  └────────────────────────┬─────────────────────────────────┘    │
│                           │  CopilotKit v2 / WebSocket            │
└───────────────────────────┼──────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                      BFF — Hono :4000                             │
│                                                                   │
│   TimingMiddleware → CrewStateMiddleware → CopilotKitMiddleware   │
│                                                                   │
│   /api/copilotkit ──► CopilotRuntime v2 ──► LangGraphAgent(s)    │
│   /status         ──► Health + DB diagnostics                     │
└───────────────────────────┬──────────────────────────────────────┘
                            │  HTTP / LangGraph protocol
┌───────────────────────────▼──────────────────────────────────────┐
│                   Python Agent :8123                              │
│                                                                   │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐           │
│   │ Orchestrator│   │   Planner   │   │    Coach    │           │
│   │             │──►│             │   │             │           │
│   │  routing +  │   │  tasks +    │   │  guidance + │           │
│   │  resets     │   │  milestones │   │  docs       │           │
│   └─────────────┘   └─────────────┘   └─────────────┘           │
│                                                                   │
│   @guarded_tool ──► PolicyEngine ──► AuditLog                    │
│   AsyncPostgresSaver (checkpoints)                                │
└───────────────────────────┬──────────────────────────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          │                                   │
    ┌─────▼──────┐                    ┌───────▼──────┐
    │ PostgreSQL │                    │    Redis      │
    │   (Neon)   │                    │  (Upstash)    │
    │            │                    │               │
    │ workspace  │                    │ session cache │
    │ state      │                    │ rate limiting │
    │ audit log  │                    │               │
    └────────────┘                    └───────────────┘
```

---

## Urgency Engine

The urgency engine is the core behavioral driver of the entire application. Every workspace has at least one milestone with a deadline. The function `getUrgencyPhase(deadline)` computes the current phase from that deadline in real time — it is never stored in the database, never manually set, and never passed as a prop. Any code that reads `state.urgencyPhase` is consuming a derived value.

Phase changes are not just visual. They trigger automatic surface re-routing (TriageWarRoom replaces normal panels in `panic`), mascot mood updates, layout density compression, and countdown overlay activation. The system treats urgency as a first-class dimension of context, not a badge.

```
Timeline ──────────────────────────────────────────────────────────► deadline
         │                                                              │
         │   NORMAL      FOCUS       URGENT      PANIC      EXPIRED    │
         │  ─────────── ─────────── ─────────── ─────────── ──────── │
         │  Relaxed UI  Subtle cues  Countdown   War room   Locked    │
         │  Full layout Highlights  Compressed   Blocker    archive   │
         │  All features Priority   surface      first      mode      │
         │             queue        routing      forced               │
         │                                                              │
  ────────────────────────────────────────────────────────────────────
  Triggers on phase change:
    • Color scheme       ──► ambient tone shifts across all surfaces
    • Surface routing    ──► agent selects different panel mix
    • Mascot mood        ──► calm / focused / worried / panicking
    • Layout density     ──► compact in urgent/panic, spacious in normal
    • CountdownCritical  ──► appears only in focus/urgent/panic
```

Phase is always computed via `getUrgencyPhase(deadline)` — never stored, never configured.

---

## Spatial Grammar — Workspace Layout

The workspace uses a fixed spatial grammar of 6 named regions. This is not CSS grid for aesthetics — it is a protocol. Every surface declares which region it belongs to in its manifest. The Layout Engine resolves conflicts (two surfaces targeting the same region), manages lifecycle (mount, hibernate, evict), and respects user-pinned panels (stored in localStorage, survive agent re-routing).

The **primary-workzone** is the largest region and holds the main agent surface — the panel that changes most dynamically based on urgency and agent intent. The **context-rail** and **agent-rail** are narrower vertical columns on the right for persistent context and the Companion Habitat respectively. The **command-surface** anchors the top bar. The **activity-stream** at the bottom provides a live audit feed. The **ambient-overlay** sits above everything and activates only when urgency demands it.

```
┌─────────────────────────────────────────────────────────────────┐
│                  COMMAND SURFACE (top bar)                       │
│         project switcher · urgency phase · nav · user           │
├────────────────────────────┬────────────────────────────────────┤
│                            │                                    │
│    PRIMARY WORKZONE        │        CONTEXT RAIL (right)        │
│                            │                                    │
│    Main agent surface      │   MilestoneSummaryPanel            │
│    rendered here:          │   BlockerInsightPanel              │
│                            │   DocumentSummaryPanel             │
│    • TaskSuggestionPanel   │   BeginnerGuidePanel               │
│    • FocusedTaskPanel      │   MemberActionPanel                │
│    • TriageWarRoom         │                                    │
│    • ForceGraph            ├────────────────────────────────────┤
│    • IdeaMatrix            │                                    │
│    • ChecklistPanel        │        AGENT RAIL (right)          │
│    • TroubleshootingWizard │                                    │
│                            │   Companion Habitat                │
│                            │   (mascot + mood + speech)         │
│                            │                                    │
├────────────────────────────┴────────────────────────────────────┤
│                   ACTIVITY STREAM (bottom)                       │
│              live event log · agent actions                      │
└─────────────────────────────────────────────────────────────────┘
         ┌──────────────────────────────────────────────┐
         │          AMBIENT OVERLAY (z-top layer)        │
         │   CountdownCritical · AmbientOverlayWidget    │
         └──────────────────────────────────────────────┘

  Pinning: any surface can be pinned to its region (localStorage).
           Pinned surfaces survive agent re-routing.
```

---

## Request Flow — From User to Surface

Every interaction follows a strict pipeline from the user's message to a mounted surface component. No step can be skipped. The Zod envelope validator is a hard gate — malformed or unrecognized envelopes are dropped before they reach the registry. This ensures the frontend never renders untrusted or structurally invalid agent output.

The pipeline separates concerns cleanly: the agent doesn't know how its output will be rendered (that's the registry's job), and the registry doesn't know what the agent decided (that's the envelope's job). Each layer only knows its own contract.

```
  User message or action
         │
         ▼
  ┌─────────────┐     ┌──────────────┐     ┌────────────────┐
  │  CopilotKit │────►│  BFF :4000   │────►│  LangGraph     │
  │  (frontend) │     │  Hono bridge │     │  Agent :8123   │
  └─────────────┘     └──────────────┘     └───────┬────────┘
                                                    │
                              ┌─────────────────────┤
                              │  agent selects tool  │
                              │  PolicyEngine checks  │
                              │  AuditLog records    │
                              └──────────┬───────────┘
                                         │
                              ┌──────────▼───────────┐
                              │   Envelope emitted    │
                              │  { type, surface_id,  │
                              │    payload, metadata } │
                              └──────────┬───────────┘
                                         │ WebSocket
                              ┌──────────▼───────────┐
                              │  Envelope Validator   │
                              │  (Zod schema check)   │
                              └──────────┬───────────┘
                                         │
                              ┌──────────▼───────────┐
                              │   Surface Registry    │
                              │  lookup manifest →   │
                              │  resolve component   │
                              └──────────┬───────────┘
                                         │
                              ┌──────────▼───────────┐
                              │   Layout Engine       │
                              │  assign region →     │
                              │  resolve conflicts   │
                              └──────────┬───────────┘
                                         │
                              ┌──────────▼───────────┐
                              │  Surface mounted in  │
                              │  workspace zone      │
                              └──────────────────────┘
```

---

## Context Dimensions — The 4-Axis Model

Every surface selection, agent tone, and initial workspace load is governed by four independent dimensions derived from the current user and workspace state.

```
  Role            leader | member
  TechLevel       high-tech | low-tech
  UrgencyPhase    normal | focus | urgent | panic | expired  (always derived)
  Specialization  developer | designer | qa | manager | writer | other
```

These four axes form the context that is evaluated at every decision point:

- The **Surface Registry** checks `visibleToRoles`, `visibleToTechLevels`, and `visibleToSpecializations` before mounting any surface. A surface that doesn't match the current context is silently skipped.
- **`getInitialSurfaces()`** selects and mounts the appropriate opening surface on workspace load — without any agent interaction. A developer sees a task checklist or debug session; a designer sees their deliverable brief; a QA engineer sees their test case board; a manager-leader sees the team velocity panel.
- **Agent prompts** use specialization for tone-matching: developers get code examples and terminal commands, designers get UX framing, QA members get acceptance criteria steps, writers get content structure guidance.
- **Onboarding** captures specialization as the 4th step in the wizard, alongside role and technical level.

```
  Specialization → surface routing                  Specialization → agent tone
  ─────────────────────────────────                 ─────────────────────────────
  developer     → DebugSession / TechStack          "Check the error in line 42 of..."
  designer      → DesignBriefPanel                  "The user flow for this screen..."
  qa            → TestCaseBoard / DebugSession       "Acceptance criteria: given X, when Y..."
  manager       → TeamVelocityPanel (leader too)    "3 members are below 30% velocity..."
  writer        → WritingChecklist / ContentOutline  "Your draft structure: intro → body..."
  other/low-tech → BeginnerGuide / Checklist        "Step 1: Open the task and read..."
```

---

## Multi-Agent Topology

The agent system uses a hub-and-spoke delegation model. The **Orchestrator** is the entry point for every user message. It classifies intent, handles generic routing, and manages workspace resets. For specialized work, it delegates to sub-agents rather than handling everything inline — this keeps each agent's context focused and its tool surface minimal.

The **Planner** owns the task and milestone lifecycle: full CRUD for tasks, milestones, and blockers. The **Coach** focuses on guidance and rescue — it powers the TechnicalStepper branching flow for low-tech members, surfaces documents, and gives context-aware recommendations when a blocker is created. All three agents share a common set of frontend tools (`renderSurface`, `setMascotMood`, `logActivity`, etc.) that let them push state changes to the workspace UI.

```
                    ┌─────────────────────┐
                    │     Orchestrator     │
                    │                     │
                    │  • General routing  │
                    │  • Workspace resets │
                    │  • All tools        │
                    └────────┬────────────┘
                             │ delegates
              ┌──────────────┴──────────────┐
              │                             │
   ┌──────────▼──────────┐     ┌────────────▼────────────┐
   │       Planner        │     │         Coach            │
   │                      │     │                          │
   │  create_task         │     │  get_documents           │
   │  update_task         │     │  create_blocker          │
   │  delete_task         │     │  update_task_status      │
   │  update_task_status  │     │  TechnicalStepper flow   │
   │  create_milestone    │     │  BeginnerGuidePanel      │
   │  update_milestone    │     │                          │
   │  resolve_blocker     │     │  (powers rescue mode for │
   │  deadline triage     │     │   low-tech members)      │
   └──────────────────────┘     └──────────────────────────┘

   Shared frontend tools (available to all agents):
   renderSurface · setMascotMood · logActivity
   reportBlocker · highlightTasks · updateTask · setCrewState
```

---

## Surfaces — Generative UI Panels

Surfaces are the visual output of the agent system. Each surface is a React component paired with a `manifest.ts` file that declares its ID, target region, required capabilities, and supported urgency phases. The Surface Registry maps incoming envelope `surface_id` values to their manifest and component — no switch statements, no direct imports in routing code.

This pattern means adding a new surface requires zero changes to routing logic. Register the manifest in `bootstrap.ts`, add the surface ID to the relevant agent prompt, and the runtime handles the rest. Surfaces that target a phase they don't support (e.g., `TriageWarRoom` outside `panic`) are silently skipped by the Layout Engine.

```
  Agent emits envelope
  { surface_id: "task-suggestion-panel", payload: {...} }
           │
           ▼
  Surface Registry lookup  (also checks role, techLevel, specialization filters)
           │
  ┌────────▼──────────────────────────────────────────────────────────────┐
  │  Surface                │ Zone              │ Specialization          │
  ├─────────────────────────┼───────────────────┼─────────────────────────┤
  │ TaskSuggestionPanel     │ primary-workzone  │ any                     │
  │ FocusedTaskPanel        │ primary-workzone  │ any                     │
  │ TriageWarRoom           │ primary-workzone  │ any (panic only)        │
  │ ForceGraph              │ primary-workzone  │ any                     │
  │ IdeaMatrix              │ primary-workzone  │ any                     │
  │ ChecklistPanel          │ primary-workzone  │ any                     │
  │ TroubleshootingWizard   │ primary-workzone  │ any                     │
  │ DebugSession            │ primary-workzone  │ developer · qa          │
  │ TechStackPanel          │ primary-workzone  │ developer (high-tech)   │
  │ DesignBriefPanel        │ primary-workzone  │ designer                │
  │ ComponentChecklist      │ primary-workzone  │ designer                │
  │ TestCaseBoard           │ primary-workzone  │ qa                      │
  │ BugReportForm           │ primary-workzone  │ qa · developer          │
  │ TeamVelocityPanel       │ primary-workzone  │ manager                 │
  │ StakeholderUpdate       │ primary-workzone  │ manager                 │
  │ WritingChecklist        │ primary-workzone  │ writer                  │
  │ ContentOutlinePanel     │ primary-workzone  │ writer                  │
  ├─────────────────────────┼───────────────────┼─────────────────────────┤
  │ MilestoneSummary        │ context-rail      │ any                     │
  │ BlockerInsight          │ context-rail      │ any                     │
  │ DocumentSummary         │ context-rail      │ any                     │
  │ BeginnerGuide           │ context-rail      │ any (low-tech)          │
  │ MemberAction            │ context-rail      │ any                     │
  ├─────────────────────────┼───────────────────┼─────────────────────────┤
  │ CountdownCritical       │ ambient-overlay   │ any (focus+)            │
  │ AmbientOverlayWidget    │ ambient-overlay   │ any (focus+)            │
  └─────────────────────────┴───────────────────┴─────────────────────────┘
```

24 surfaces total. `visibleToSpecializations` is enforced by the Surface Registry at resolve time — a surface targeting `designer` will not mount in a developer's context even if the agent emits it.

`CountdownCritical` supports `variant: 'compact' | 'full'` and `orientation: 'vertical' | 'horizontal'`.  
`FocusedTaskPanel` is routed by both Planner (task spotlight) and Coach (with `coachNote`).  
`DocumentSummaryPanel` includes a `FileCard` thumbnail that infers file type from extension or `documentFormat`.

---

## Companion Habitat

A Tamagotchi-style mini habitat (240×180px) embedded in the workspace. Not a status widget — an embodied agent presence that reacts to team events in real time.

The Companion is driven by an xstate machine with 6 behavioral states. Its visual props (rock, trophy, flame) are added and removed dynamically by the agent via the `setMascotMood` frontend tool. Weather in the habitat maps directly to urgency phase: sunny skies in `normal`, stormy weather in `panic`. The speech bubble is populated by the agent when it calls `setMascotMood` with a message — giving the Companion a voice that is contextually accurate rather than scripted.

```
  ┌─────────────────────────────────┐
  │         Companion Habitat        │
  │                                  │
  │   ☀️  Weather ← urgency phase    │
  │                                  │
  │       ┌────────────┐             │
  │       │  Creature  │  mood       │
  │       │  (SVG/Rive)│◄──────────  │
  │       └────────────┘  8 states   │
  │       🪨🏆🔥  dynamic props      │
  │                                  │
  │  "You have 2 blockers open. 💬"  │
  │   [CTA button]                   │
  │                                  │
  └─────────────────────────────────┘

  Weather states (5):   sunny → cloudy → rain → stormy → night
  Creature moods (8):   calm · focused · worried · panicking
                        celebrating · sleeping · thinking · guiding
  xstate machine (6):   idle · alert · celebrating · thinking
                        sleeping · guiding

  Event Bus signals:
    BLOCKER_CREATED      → worried / props: rock added
    BLOCKER_RESOLVED     → calm    / props: rock removed
    MILESTONE_COMPLETE   → celebrating / props: trophy
    PHASE_CHANGE(panic)  → panicking / props: flame
    AGENT_TOOL_CALL      → thinking
```

The **Companion Panel** exposes a quick status grid, intent picker, and TechnicalStepper — a rescue-mode branching flow for low-tech members that the Coach agent powers.

Phase 2 (pending Rive assets): CSS/SVG sprites will be replaced by `.riv` animations.

---

## Capability & Policy Engine

Every Python tool is decorated with `@guarded_tool`, which declares the tool's required capabilities, risk level, and expected impact before it can be registered. This is enforced at startup — a tool without a capability declaration cannot be added to any agent's tool list.

At runtime, every tool call passes through the PolicyEngine synchronously. Allowed calls execute immediately and are recorded in the audit log. Denied calls stop with a policy error. Calls marked `pending` — typically high-risk operations like bulk task deletion or workspace resets — are intercepted and an ApprovalGate surface is rendered in the frontend, giving the user explicit control before anything irreversible happens.

```
  Tool call requested by agent
           │
           ▼
  ┌─────────────────────┐
  │   @guarded_tool     │
  │   declares:         │
  │   • capabilities    │
  │   • risk_level      │
  │   • impact          │
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────┐     ┌──────────────────┐
  │   PolicyEngine      │────►│  AuditLog        │
  │                     │     │  (PostgreSQL)    │
  │  allowed?  ──► run  │     │  records every   │
  │  denied?   ──► stop │     │  decision        │
  │  pending?  ──► gate │     └──────────────────┘
  └──────────┬──────────┘
             │ pending
             ▼
  ┌─────────────────────┐
  │   ApprovalGate      │
  │   (frontend card)   │
  │                     │
  │  "Agent wants to:   │
  │   delete_task X"    │
  │                     │
  │  [Approve] [Reject] │
  └─────────────────────┘
```

High-risk operations never auto-execute. The user always has final authority.

---

## Stack

The stack was chosen to maximize developer velocity on free-tier infrastructure while preserving production-grade patterns. Gemini Flash is the default LLM for cost efficiency; Claude Sonnet is available as an alternate runtime via `ANTHROPIC_API_KEY`. CopilotKit v2 provides the WebSocket bridge between the frontend and the LangGraph agent without requiring custom streaming infrastructure.

All production services run on free tier: Vercel (frontend), Render (BFF + agent sidecar), Neon (PostgreSQL), Upstash (Redis). The entire stack costs $0/month at typical hackathon-scale usage.

```
  ┌──────────────────────────────────────────────────────┐
  │  FRONTEND                                            │
  │  Next.js 15 · React 19 · Tailwind CSS 4             │
  │  shadcn/ui · Framer Motion · xstate · Rive          │
  │  CopilotKit v2 · Zod                                │
  ├──────────────────────────────────────────────────────┤
  │  BFF                                                 │
  │  Hono (Node 20) · CopilotKit Runtime v2             │
  │  LangGraphAgent bridge · TimingMiddleware            │
  ├──────────────────────────────────────────────────────┤
  │  AGENT                                               │
  │  Python 3.11 · LangGraph · Pydantic                 │
  │  Gemini Flash (default) · Claude Sonnet (alternate) │
  │  AsyncPostgresSaver · @guarded_tool                  │
  ├──────────────────────────────────────────────────────┤
  │  AUTH & COMMS                                        │
  │  NextAuth v5 · Resend magic-link                    │
  ├──────────────────────────────────────────────────────┤
  │  DATA                                                │
  │  PostgreSQL (Neon) · Redis (Upstash)                │
  │  i18n: English + Spanish, cookie-persisted          │
  ├──────────────────────────────────────────────────────┤
  │  OBSERVABILITY                                       │
  │  Sentry (@sentry/nextjs v8) — error capture          │
  │  Lighthouse CI — performance budgets (≥90)          │
  ├──────────────────────────────────────────────────────┤
  │  TESTING                                             │
  │  Vitest (frontend unit tests, @/ alias)             │
  │  pytest (Python tool unit tests, uv --group dev)    │
  ├──────────────────────────────────────────────────────┤
  │  DEPLOY                                              │
  │  Vercel (frontend) · Render (BFF + agent)           │
  │  Neon (DB) · Upstash (Redis) — all free tier        │
  └──────────────────────────────────────────────────────┘
```

---

## Project Structure

The repo is a monorepo with three independently deployable apps under `apps/`. The `runtime/` directory inside the frontend is the kernel — Surface Registry, Layout Engine, Envelope protocol, and the Companion Pet state machine all live there. Agent code under `apps/agent/src/` is Python-only and mirrors the TypeScript type definitions in `apps/frontend/src/lib/crew/types.ts`. Any field added to the TS types must be added to the Python TypedDicts in the same commit.

```
crew-companion/
│
├── apps/
│   ├── frontend/                  Next.js 15 app (:3010)
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (auth)/        login, magic-link callback
│   │       │   ├── dashboard/     multi-project hub
│   │       │   ├── leader/        leader workspace
│   │       │   ├── member/[id]/   member workspace
│   │       │   ├── docs/          shared documents
│   │       │   ├── onboarding/    wizard
│   │       │   ├── invite/[code]/ team invite
│   │       │   ├── share/[token]/ observer access
│   │       │   ├── status/        health diagnostics
│   │       │   └── (marketing)/   features · how-it-works · roadmap · about
│   │       │
│   │       ├── runtime/
│   │       │   ├── surface-registry/  types · registry · bootstrap · SurfaceHost
│   │       │   ├── envelope/          types · handler · validators (Zod)
│   │       │   ├── workspace/         Layout Engine · 6 region components
│   │       │   ├── pinning/           usePinning · pinning-store
│   │       │   └── pet/               Pet · xstate machine · speak
│   │       │
│   │       └── components/
│   │           ├── surfaces/      24 generative UI surfaces (each with manifest.ts)
│   │           ├── marketing/     MarketingLayout (nav + footer)
│   │           └── ui/            shadcn/ui primitives
│       │
│       └── runtime/
│           ├── surface-registry/  types · registry (specialization enforcement) · bootstrap
│           ├── workspace/         Layout Engine · initial-surfaces.ts (4-axis loader)
│           └── companion/         EventBus · Habitat · xstate machine
│   │
│   ├── bff/                       Hono BFF (:4000)
│   │   └── src/
│   │       ├── index.ts           route definitions
│   │       └── middleware/        timing · crew-state · capability
│   │
│   └── agent/                     Python LangGraph (:8123)
│       ├── src/
│       │   ├── agents/            orchestrator · planner · coach · router
│       │   ├── runtime/           capabilities · policy · audit · envelope
│       │   ├── tools.py           @guarded_tool declarations
│       │   └── types.py           Python TypedDicts (sync with TS types.ts)
│       └── migrations/            001–014 SQL migrations (idempotent)
│
├── project-docs/
│   ├── MASTER_WORK_PLAN.md        7.5-week execution plan + invariants
│   └── PROJECT_STRUCTURE.md       file map with descriptions
│
└── scripts/
    ├── migrate.sh                 run migrations up/down
    └── seed.ts                    seed demo workspace
```

---

## Phase Timeline

The project follows a three-phase execution plan. **Phase A (Kernel)** built the runtime infrastructure that everything else depends on — no product features, just the protocols and engines that make generative UI possible. **Phase B (Product)** layered all user-facing features on top of the kernel: auth, workspaces, surfaces, agents, onboarding, and the companion habitat. **Phase C (Deploy)** is about production hardening, environment configuration, and smoke testing the live services.

```
  Week 1-2          Week 3-4              Week 5-6            Week 7-7.5
  ──────────────────────────────────────────────────────────────────────►
  ┌──────────┐  ┌───────────────┐  ┌──────────────────┐  ┌────────────┐
  │ PHASE A  │  │   PHASE B     │  │     PHASE B      │  │  PHASE C   │
  │  Kernel  │  │   Product     │  │    (cont'd)      │  │   Deploy   │
  ├──────────┤  ├───────────────┤  ├──────────────────┤  ├────────────┤
  │✅ Surface│  │✅ NextAuth    │  │✅ Multi-agent    │  │✅ Services │
  │  Registry│  │   magic-link  │  │   Orchestrator   │  │   live     │
  │✅ Layout │  │✅ Workspace   │  │   Planner Coach  │  │✅ Error    │
  │  Engine  │  │   Shell       │  │✅ Companion      │  │   pages    │
  │✅ Capab. │  │✅ 24 surfaces │  │   Habitat        │  │✅ i18n     │
  │  Engine  │  │✅ Dashboard   │  │✅ Specialization │  │✅ Token    │
  │✅ Persist│  │✅ Onboarding  │  │   4-axis model   │  │   caps     │
  │  (Pgres) │  │✅ Invite flow │  │✅ initial-       │  │✅ Sentry   │
  │✅ Envel. │  │✅ Observer    │  │   surfaces loader│  │✅ Tests    │
  │  Protocol│  │   share link  │  │✅ Security fixes │  │🔄 Smoke    │
  └──────────┘  └───────────────┘  └──────────────────┘  └────────────┘
     COMPLETE         COMPLETE              COMPLETE        IN PROGRESS
```

### Phase Gate Checklist

**Phase C — Ship Readiness:**
- [x] Sentry wired (`@sentry/nextjs` v8, DSN set, `global-error.tsx` captures)
- [x] Error boundaries on all protected routes (dark theme, Spanish)
- [x] Test coverage: Vitest 7 tests + pytest 31 tests — all green
- [x] `sync:capabilities` upgraded to full code generator (Python → TS atomic write)
- [x] Full CRUD on all entities (delete/update for milestone, blocker, member)
- [x] BFF_URL env var confirmed in Vercel production
- [ ] Cold-start smoke test (Render sleep ≤ 45s wake)
- [ ] 0 Sentry errors over 24h baseline
- [ ] Lighthouse ≥ 90 all metrics (config at `.lighthouserc.js`)
- [ ] 5 test workspaces survive 7 days
- [ ] $0 actual cost confirmed

---

## Getting Started

### Prerequisites

```
Node.js 20+
Python 3.11+ with uv
Docker Desktop
```

### Local Setup

```bash
# 1. Clone
git clone https://github.com/Miltondz/crew-companion.git
cd crew-companion

# 2. Environment variables
cp .env.example .env
# Required: GEMINI_API_KEY, AUTH_SECRET, DATABASE_URL, RESEND_API_KEY

# 3. Install dependencies
npm install
cd apps/agent && uv sync && cd ../..

# 4. Start infrastructure (Postgres + Redis via Docker)
npm run dev:infra

# 5. Run database migrations
bash scripts/migrate.sh up

# 6. Seed demo workspace
npm run seed

# 7. Start everything
npm run dev
```

Open `http://localhost:3010`

### Run Individual Services

```bash
npm run dev:ui      # Frontend only  ── :3010
npm run dev:bff     # BFF only       ── :4000
npm run dev:agent   # Python agent   ── :8123
npm run dev:infra   # Docker only
npm run kill-ports  # Free all ports before restart
```

### Run Tests

```bash
# TypeScript (Vitest) — 7 layout-engine tests
cd apps/frontend && npm run test

# Python (pytest) — 31 tool unit tests
cd apps/agent && uv run pytest -v

# Sync capabilities from Python → TypeScript (run after editing capabilities.py or role_grants.json)
npm run sync:capabilities
```

### Service Ports

The following ports are used locally. All services run in the same Docker network; only the ports below are exposed to the host machine.

```
  :3010  Frontend (Next.js)
  :4000  BFF (Hono)
  :8123  Agent (LangGraph)
  :3001  MCP server
  :5433  PostgreSQL (host) → :5432 (container)
  :6381  Redis (host)      → :6379 (container)
  :4203  CopilotKit Intelligence API
  :4403  CopilotKit Intelligence WebSocket
```

### Available Routes

The app has two distinct areas: public marketing pages (no auth required) and protected workspace pages. The `/status` route requires a leader role in any active workspace and is intended for debugging production deployments.

```
  /                      Landing page
  /features              Capability deep-dive
  /how-it-works          Pipeline walkthrough
  /roadmap               Phase status board
  /about                 Project context + architecture
  /dashboard             Multi-project hub (auth required)
  /leader                Leader workspace
  /member/[id]           Member workspace
  /docs                  Shared documents
  /onboarding            Setup wizard
  /invite/[code]         Team invite picker
  /share/[token]         Observer (read-only) access
  /status                Service health diagnostics
  /dev                   Component preview (local only)
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | [Google AI Studio](https://aistudio.google.com) — default LLM |
| `AUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `DATABASE_URL` | Yes | Neon (prod) or Docker `localhost:5433` (local) |
| `RESEND_API_KEY` | Yes | [Resend](https://resend.com) — magic-link emails |
| `NEXTAUTH_URL` | Yes | Your app's public URL |
| `BFF_URL` | Yes (prod) | Render BFF service URL |
| `ANTHROPIC_API_KEY` | No | Alternate LLM runtime (Claude Sonnet) |
| `COPILOTKIT_API_KEY` | No | CopilotKit Intelligence — thread persistence |

---

## Architectural Invariants

These rules are enforced across every change. Violating any of them breaks the runtime contract. They exist because they encode decisions that were made for non-obvious reasons — not style preferences, but structural requirements of the generative UI model.

```
  1. Frontend/BFF/Agent separation
     Frontend never calls the agent directly.
     All communication flows through the BFF.

  2. TypeScript ↔ Python type sync
     Any field added to types.ts must be added to types.py
     in the same commit. Schema drift is project-killing.

  3. Urgency phase is derived — never stored
     getUrgencyPhase(deadline) is the single source of truth.
     Never persist phase to DB or state.

  4. Surface Registry pattern
     Surfaces register via manifests.
     No switch/case routing, no direct component imports in routes.

  5. Envelope protocol
     All agent → frontend communication is typed envelopes
     validated by Zod before reaching the Surface Registry.

  6. Capability declarations
     Every tool declares required capabilities via @guarded_tool.
     PolicyEngine evaluates before execution.

  7. User authority on destructive actions
     Agent never auto-executes high-risk operations.
     ApprovalGate is always rendered for pending decisions.
```

---

## Agent-Usability Gap Check

Every surface, frontend tool, Python tool, or agent prompt change must pass this 4-axis check before merge. The check exists because each axis represents a different layer that must be updated independently — it is easy to add a surface component but forget to register it in the agent prompt's routing table, making it unreachable in production.

```
  Axis 1 — Surface emittable?
    └── manifest registered in bootstrap.ts
    └── surface ID in agent prompt's routing table

  Axis 2 — Full CRUD?
    └── create + update + delete for every managed entity
    └── all three exposed in the relevant agent's tool list

  Axis 3 — Frontend tools complete?
    └── leader/page.tsx exposes all useFrontendTool handlers
    └── member/[id]/page.tsx mirrors the same handlers

  Axis 4 — Prompts aware?
    └── ORCHESTRATOR/PLANNER/COACH prompts list new surface/tool
    └── AVAILABLE FRONTEND TOOLS sections updated
```

---

## Contributing

Issues and PRs welcome. Read `project-docs/MASTER_WORK_PLAN.md` for the full roadmap and architectural decisions before contributing — the invariants above are non-negotiable.

---

## License

MIT — use freely.

---

*Built by Milton with Claude (Anthropic) as AI pair programmer.*
