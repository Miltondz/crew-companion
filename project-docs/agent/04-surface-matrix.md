# Crew Companion — Surface Decision Matrix

## Qué es una Surface

Una surface es un componente React tipado que el agente renderiza dentro del chat en lugar de texto plano. El agente llama a `renderSurface(envelope)` con un objeto `SurfaceEnvelope<Payload>`. El frontend mapea el `type` al componente correcto.

## Tipo base

```typescript
interface SurfaceEnvelope<T> {
  type: SurfaceType
  audience: Role                    // quién lo ve
  technicalLevel: TechnicalLevel    // nivel del usuario
  urgencyPhase: UrgencyPhase        // fase actual
  payload: T                        // datos específicos de la surface
}

type SurfaceType =
  | 'task_suggestion_panel'
  | 'milestone_summary_panel'
  | 'blocker_insight_panel'
  | 'member_action_panel'
  | 'beginner_guide_panel'
  | 'commands_panel'
  | 'checklist_panel'
  | 'comparison_panel'
  | 'guided_setup_panel'
  | 'troubleshooting_wizard'
  | 'document_summary_panel'
  | 'role_assignment_panel'
```

## Tabla de decisión principal

El agente evalúa estas variables en orden: `role` → `technicalLevel` → `requestType` → `urgencyPhase` → `hasBlocker`

| # | Role | TechLevel | requestType | Phase | hasBlocker | Surface primaria | Fallback |
|---|------|-----------|-------------|-------|-----------|-----------------|---------|
| 1 | leader | any | task-management | any | any | `task_suggestion_panel` | `checklist_panel` |
| 2 | leader | any | milestone-review | any | any | `milestone_summary_panel` | `checklist_panel` |
| 3 | leader | any | blocker-report | any | yes | `blocker_insight_panel` | `member_action_panel` |
| 4 | leader | any | team-coordination | any | any | `member_action_panel` | `task_suggestion_panel` |
| 5 | leader | any | role-assignment | any | any | `role_assignment_panel` | `member_action_panel` |
| 6 | leader | any | status-check | panic/expired | any | `milestone_summary_panel` | `member_action_panel` |
| 7 | leader | any | doc-question | any | any | `document_summary_panel` | `checklist_panel` |
| 8 | member | low-tech | help-request | normal/focus | no | `beginner_guide_panel` | `guided_setup_panel` |
| 9 | member | low-tech | help-request | any | yes | `troubleshooting_wizard` | `beginner_guide_panel` |
| 10 | member | low-tech | task-management | any | any | `guided_setup_panel` | `checklist_panel` |
| 11 | member | high-tech | help-request | any | any | `commands_panel` | `checklist_panel` |
| 12 | member | high-tech | task-management | any | any | `checklist_panel` | `commands_panel` |
| 13 | member | high-tech | comparison | any | any | `comparison_panel` | `checklist_panel` |
| 14 | member | any | doc-question | any | any | `document_summary_panel` | `checklist_panel` |
| 15 | any | any | any | panic/expired | any | `member_action_panel` (modo urgente) | `milestone_summary_panel` |

**Fallback global:** si ninguna regla aplica → `checklist_panel`

## Tipos de request (`requestType`)

El agente infiere el `requestType` del mensaje del usuario:

| requestType | Señales en el mensaje |
|-------------|----------------------|
| `task-management` | "crear tarea", "asignar", "qué hago", "próxima tarea" |
| `milestone-review` | "cómo vamos", "progreso", "milestone", "cuánto falta" |
| `blocker-report` | "no puedo", "estoy bloqueado", "error", "no funciona", "necesito ayuda con X" |
| `team-coordination` | "qué hace el equipo", "quién trabaja en", "estado del equipo" |
| `role-assignment` | "asignar roles", "quién hace qué", "distribuir tareas" |
| `status-check` | "cómo estamos", "resumen general", "estado general" |
| `help-request` | "cómo hago", "explícame", "no entiendo", "ayuda" |
| `doc-question` | "en el documento", "según el readme", "qué dice el doc" |
| `comparison` | "diferencia entre", "cuál es mejor", "comparar" |

## Payloads por surface

### `task_suggestion_panel`
```typescript
interface TaskSuggestionPayload {
  suggestions: Array<{
    title: string
    description: string
    priority: TaskPriority
    assignTo?: string       // TeamMember.id sugerido
    estimatedMinutes?: number
  }>
  context: string           // por qué se sugieren estas tareas
}
```

### `milestone_summary_panel`
```typescript
interface MilestoneSummaryPayload {
  milestone: Milestone
  phase: UrgencyPhase
  minutesLeft: number
  completedTasks: Task[]
  pendingTasks: Task[]
  atRiskTasks: Task[]       // tareas sin asignar o bloqueadas
  recommendation: string
}
```

### `blocker_insight_panel`
```typescript
interface BlockerInsightPayload {
  blocker: Blocker
  member: TeamMember
  possibleCauses: string[]
  suggestedActions: Array<{
    action: string
    forTechnicalLevel: TechnicalLevel | 'all'
  }>
  canReassignTask: boolean
}
```

### `member_action_panel`
```typescript
interface MemberActionPayload {
  urgencyPhase: UrgencyPhase
  actions: Array<{
    label: string
    description: string
    priority: 'immediate' | 'soon' | 'optional'
    assignedTo?: string     // TeamMember.id
  }>
  message: string           // mensaje contextual según fase
}
```

### `beginner_guide_panel`
```typescript
interface BeginnerGuidePayload {
  topic: string
  steps: Array<{
    stepNumber: number
    title: string
    content: string         // markdown simple
    tip?: string
  }>
  estimatedMinutes: number
}
```

### `commands_panel`
```typescript
interface CommandsPanelPayload {
  context: string
  commands: Array<{
    command: string
    description: string
    example?: string
    warning?: string
  }>
}
```

### `checklist_panel`
```typescript
interface ChecklistPayload {
  title: string
  items: Array<{
    id: string
    text: string
    done: boolean
    priority?: TaskPriority
  }>
  completionMessage?: string
}
```

### `comparison_panel`
```typescript
interface ComparisonPayload {
  title: string
  options: Array<{
    name: string
    pros: string[]
    cons: string[]
    recommendation?: boolean
  }>
  conclusion: string
}
```

### `guided_setup_panel`
```typescript
interface GuidedSetupPayload {
  goal: string
  currentStep: number
  totalSteps: number
  steps: Array<{
    title: string
    content: string
    action?: string         // texto del botón de acción
    completed: boolean
  }>
}
```

### `troubleshooting_wizard`
```typescript
interface TroubleshootingPayload {
  problem: string
  steps: Array<{
    question: string
    yesAction: string
    noAction: string
  }>
  resolution?: string
  escalateTo?: string       // nombre del líder si no se puede resolver
}
```

### `document_summary_panel`
```typescript
interface DocumentSummaryPayload {
  documentTitle: string
  summary: string
  keyPoints: string[]
  relevantSection?: string  // sección más relevante para la pregunta
  quote?: string            // cita textual del doc
}
```

### `role_assignment_panel`
```typescript
interface RoleAssignmentPayload {
  currentAssignments: Array<{
    member: TeamMember
    taskCount: number
    tasks: Task[]
    load: 'light' | 'balanced' | 'heavy'
  }>
  suggestions: Array<{
    memberId: string
    taskId: string
    reason: string
  }>
}
```

## Reglas de contenido

1. **Nunca expliques de más a `high-tech`** — sin tutoriales, sin "primero tienes que...". Ve directo al comando o la acción.
2. **Nunca uses jerga técnica con `low-tech`** — sin URLs, sin nombres de paquetes crudos, sin flags. Usa lenguaje natural.
3. **En fase `panic` o `expired`** — todas las surfaces adoptan tono urgente. `member_action_panel` se vuelve el default para cualquier rol.
4. **Las surfaces son interactivas** — los checklists se pueden marcar, los wizards tienen botones. El agente debe esperar posibles acciones de respuesta.
5. **Si no hay datos suficientes para una surface** — usa el fallback de la tabla. Nunca devuelvas una surface con arrays vacíos.
