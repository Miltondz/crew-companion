# Crew Companion — Domain Model

## TypeScript Types (frontend + store)

```typescript
// --- Enums / Literals ---

type Role = 'leader' | 'member'
type TechnicalLevel = 'low-tech' | 'high-tech'
type UrgencyPhase = 'normal' | 'focus' | 'urgent' | 'panic' | 'expired'
type TaskStatus = 'todo' | 'in-progress' | 'done'
type TaskPriority = 'low' | 'medium' | 'high'
type MascotMood = 'calm' | 'focus' | 'worried' | 'panic' | 'celebrate'
type MascotMode = 'idle' | 'hint' | 'alert' | 'action'

// --- Entities ---

interface TeamMember {
  id: string
  name: string
  role: Role
  technicalLevel: TechnicalLevel
  activeBlockerId?: string   // id del blocker activo si existe
}

interface Task {
  id: string
  title: string
  description: string
  assignedTo: string         // TeamMember.id
  milestoneId?: string
  status: TaskStatus
  priority: TaskPriority
  createdAt: string          // ISO date
}

interface Milestone {
  id: string
  title: string
  deadline: string           // ISO date — SIEMPRE absoluto, nunca relativo
  taskIds: string[]
  phase: UrgencyPhase        // derivado, no se guarda — se calcula en runtime
}

interface Blocker {
  id: string
  memberId: string
  description: string
  reportedAt: string         // ISO date
  resolved: boolean
  resolvedAt?: string
}

interface SharedDocument {
  id: string
  title: string
  content: string            // markdown sanitizado
  sharedBy: string           // TeamMember.id (solo líder puede compartir)
  sharedAt: string           // ISO date
}

// --- Store Shape ---

interface CrewState {
  // Equipo
  members: TeamMember[]
  currentMemberId: string    // el usuario actual
  
  // Trabajo
  tasks: Task[]
  milestones: Milestone[]
  blockers: Blocker[]
  
  // Documentos
  sharedDocuments: SharedDocument[]
  openDocumentIds: string[]  // tabs abiertos en el workspace
  
  // UI state
  urgencyPhase: UrgencyPhase // derivado del milestone más cercano
  mascotMood: MascotMood
  mascotMode: MascotMode
  highlightedTaskIds: string[]
  activeMilestoneId?: string
}

// --- Derived helpers ---

// Calcular fase de urgencia desde un deadline
function getUrgencyPhase(deadlineISO: string): UrgencyPhase {
  const minutesLeft = (new Date(deadlineISO).getTime() - Date.now()) / 60000
  if (minutesLeft > 30) return 'normal'
  if (minutesLeft > 15) return 'focus'
  if (minutesLeft > 5)  return 'urgent'
  if (minutesLeft > 0)  return 'panic'
  return 'expired'
}

// Derivar mood de mascota desde fase + blocker
function getMascotMood(phase: UrgencyPhase, hasBlocker: boolean): MascotMood {
  if (phase === 'expired') return 'panic'
  if (phase === 'panic')   return hasBlocker ? 'panic' : 'worried'
  if (phase === 'urgent')  return 'worried'
  if (phase === 'focus')   return 'focus'
  if (hasBlocker)          return 'worried'
  return 'calm'
}
```

## Python TypedDicts (agente LangGraph)

```python
from typing import TypedDict, Literal, Optional
from langgraph.graph import MessagesState

Role = Literal['leader', 'member']
TechnicalLevel = Literal['low-tech', 'high-tech']
UrgencyPhase = Literal['normal', 'focus', 'urgent', 'panic', 'expired']
TaskStatus = Literal['todo', 'in-progress', 'done']
TaskPriority = Literal['low', 'medium', 'high']
MascotMood = Literal['calm', 'focus', 'worried', 'panic', 'celebrate']

class TeamMember(TypedDict):
    id: str
    name: str
    role: Role
    technicalLevel: TechnicalLevel
    activeBlockerId: Optional[str]

class Task(TypedDict):
    id: str
    title: str
    description: str
    assignedTo: str
    milestoneId: Optional[str]
    status: TaskStatus
    priority: TaskPriority
    createdAt: str

class Milestone(TypedDict):
    id: str
    title: str
    deadline: str       # ISO date
    taskIds: list[str]

class Blocker(TypedDict):
    id: str
    memberId: str
    description: str
    reportedAt: str
    resolved: bool
    resolvedAt: Optional[str]

class SharedDocument(TypedDict):
    id: str
    title: str
    content: str
    sharedBy: str
    sharedAt: str

class CrewCanvasState(TypedDict):
    members: list[TeamMember]
    currentMemberId: str
    tasks: list[Task]
    milestones: list[Milestone]
    blockers: list[Blocker]
    sharedDocuments: list[SharedDocument]
    urgencyPhase: UrgencyPhase
    mascotMood: MascotMood
    highlightedTaskIds: list[str]
    activeMilestoneId: Optional[str]

# Estado completo del agente (extiende MessagesState)
class AgentState(MessagesState, CrewCanvasState):
    pass
```

## Reglas del modelo de dominio

1. **Deadlines siempre en ISO absoluto** — nunca "en 2 horas". El frontend calcula la fase en runtime.
2. **`phase` de Milestone es siempre derivado** — nunca se persiste en store ni en el agente. Se calcula con `getUrgencyPhase(milestone.deadline)`.
3. **Un solo blocker activo por miembro** — si reporta otro, se resuelve el anterior automáticamente.
4. **Solo el líder comparte documentos** — el campo `sharedBy` siempre es un TeamMember con `role: 'leader'`.
5. **`currentMemberId` determina la vista** — el frontend usa este campo para mostrar `/leader` o `/member/[id]`.
