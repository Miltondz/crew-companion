# Crew Companion — Prompts y Tools del Agente

## System Prompt

```
Eres CrewCompanion, el asistente de coordinación para equipos de hackathon.
Tu rol es mantener al equipo alineado, desbloqueado y avanzando hacia su milestone.

CONTEXTO QUE SIEMPRE TENÉS DISPONIBLE (via useCopilotReadable):
- currentMember: quién está hablando (role, technicalLevel, name)
- crewState: tareas, milestones, miembros, blockers actuales
- urgencyPhase: fase actual del milestone más cercano
- openDocuments: documentos abiertos en el workspace

CÓMO DECIDIR QUÉ MOSTRAR:
1. Identificá el requestType del mensaje (ver tabla en 04-surface-matrix.md)
2. Consultá la tabla de decisión con: role + technicalLevel + requestType + urgencyPhase + hasBlocker
3. Renderizá la surface correspondiente con datos reales del crewState
4. Si la surface necesita datos que no tenés, pedí al usuario la información mínima necesaria

REGLAS DE TONO:
- low-tech: lenguaje simple, pasos numerados, sin jerga técnica, con empatía
- high-tech: directo, preciso, comandos exactos, sin sobre-explicar
- panic/expired: urgente, concreto, solo acciones inmediatas. Sin prefacio.
- normal/focus: calmado, orientado a proceso

REGLAS ABSOLUTAS:
- Siempre renderizá una surface — nunca respondas solo con texto plano
- Nunca inventés datos que no están en el crewState
- Nunca compartás información de un miembro con otro (los roles son privados entre miembros)
- Si el usuario es low-tech y pregunta algo técnico, simplificá sin perder precisión
- En fase panic: priorizá acciones sobre explicaciones

FLUJO DE DOCUMENTOS:
- Solo el líder puede compartir documentos
- Cuando un miembro pregunta sobre un documento, usá document_summary_panel
- Sanitizá el contenido markdown antes de renderizarlo

MASCOTA:
Después de cada respuesta llamá a setMascotMood() con el mood correcto:
- calm: fase normal, sin blockers
- focus: fase focus
- worried: fase urgent o blocker activo
- panic: fase panic o expired
- celebrate: tarea completada o milestone alcanzado
```

## Estado Readable (useCopilotReadable en frontend)

```typescript
// Para el líder — en /leader/page.tsx
useCopilotReadable({
  description: "Estado actual del equipo y proyecto",
  value: {
    currentMember: { id, name, role: 'leader', technicalLevel },
    tasks: crewState.tasks,
    milestones: crewState.milestones,
    members: crewState.members,
    blockers: crewState.blockers.filter(b => !b.resolved),
    urgencyPhase: crewState.urgencyPhase,
    activeMilestone: crewState.milestones.find(m => m.id === crewState.activeMilestoneId)
  }
})

// Para el miembro — en /member/[memberId]/page.tsx
useCopilotReadable({
  description: "Estado personal del miembro en el proyecto",
  value: {
    currentMember: { id, name, role: 'member', technicalLevel },
    myTasks: crewState.tasks.filter(t => t.assignedTo === memberId),
    activeMilestone: crewState.milestones.find(m => m.id === crewState.activeMilestoneId),
    urgencyPhase: crewState.urgencyPhase,
    myBlocker: crewState.blockers.find(b => b.memberId === memberId && !b.resolved),
    openDocuments: crewState.sharedDocuments.filter(d => crewState.openDocumentIds.includes(d.id))
  }
})
```

## Frontend Actions (useCopilotAction en React)

El agente llama estas funciones — se ejecutan en el browser.

```typescript
// Actualizar estado completo del crew
useCopilotAction({
  name: "setCrewState",
  description: "Actualiza el estado completo del equipo (tareas, milestones, miembros, blockers)",
  parameters: [{ name: "state", type: "object", description: "Nuevo CrewState parcial o completo" }],
  handler: ({ state }) => useCrewStore.getState().merge(state)
})

// Actualizar una tarea específica
useCopilotAction({
  name: "updateTask",
  description: "Actualiza el status o datos de una tarea específica",
  parameters: [
    { name: "taskId", type: "string" },
    { name: "updates", type: "object", description: "Campos a actualizar en la tarea" }
  ],
  handler: ({ taskId, updates }) => useCrewStore.getState().updateTask(taskId, updates)
})

// Cambiar mood de la mascota
useCopilotAction({
  name: "setMascotMood",
  description: "Cambia el estado visual de la mascota según el contexto",
  parameters: [
    { name: "mood", type: "string", enum: ["calm", "focus", "worried", "panic", "celebrate"] },
    { name: "mode", type: "string", enum: ["idle", "hint", "alert", "action"] }
  ],
  handler: ({ mood, mode }) => useCrewStore.getState().setMascotState(mood, mode)
})

// Renderizar una surface en el chat
useCopilotAction({
  name: "renderSurface",
  description: "Renderiza un componente UI tipado en el chat",
  parameters: [{ name: "envelope", type: "object", description: "SurfaceEnvelope con type y payload" }],
  render: ({ envelope }) => <SurfaceRenderer envelope={envelope} />
})

// Resaltar tareas en la UI
useCopilotAction({
  name: "highlightTasks",
  description: "Resalta tareas específicas en el tablero",
  parameters: [{ name: "taskIds", type: "array", items: { type: "string" } }],
  handler: ({ taskIds }) => useCrewStore.getState().setHighlightedTasks(taskIds)
})

// Cambiar vista activa
useCopilotAction({
  name: "setActiveView",
  description: "Navega a una vista específica de la app",
  parameters: [{ name: "view", type: "string", enum: ["leader", "member", "docs"] }],
  handler: ({ view }) => router.push(`/${view}`)
})

// Reportar blocker (desde miembro)
useCopilotAction({
  name: "reportBlocker",
  description: "Registra un blocker para el miembro actual",
  parameters: [{ name: "description", type: "string" }],
  handler: ({ description }) => useCrewStore.getState().addBlocker({
    memberId: currentMemberId,
    description,
    reportedAt: new Date().toISOString(),
    resolved: false
  })
})
```

## Backend Tools (en el agente Python)

```python
@tool
def get_crew_state() -> CrewCanvasState:
    """Retorna el estado actual completo del equipo desde el store."""
    return state_store.get_state()

@tool
def create_task(
    title: str,
    description: str,
    assigned_to: str,
    priority: TaskPriority,
    milestone_id: Optional[str] = None
) -> Task:
    """Crea una nueva tarea y la agrega al estado del equipo."""
    task = Task(
        id=str(uuid4()),
        title=title,
        description=description,
        assignedTo=assigned_to,
        priority=priority,
        milestoneId=milestone_id,
        status='todo',
        createdAt=datetime.utcnow().isoformat()
    )
    return Command(update={"tasks": [*state["tasks"], task]})

@tool
def create_milestone(
    title: str,
    deadline_iso: str,
    task_ids: list[str]
) -> Milestone:
    """Crea un milestone con deadline absoluto en ISO format."""
    milestone = Milestone(
        id=str(uuid4()),
        title=title,
        deadline=deadline_iso,
        taskIds=task_ids
    )
    return Command(update={"milestones": [*state["milestones"], milestone], "activeMilestoneId": milestone["id"]})

@tool
def resolve_blocker(blocker_id: str) -> str:
    """Marca un blocker como resuelto."""
    updated = [
        {**b, "resolved": True, "resolvedAt": datetime.utcnow().isoformat()} 
        if b["id"] == blocker_id else b
        for b in state["blockers"]
    ]
    return Command(update={"blockers": updated})

@tool
def get_documents() -> list[SharedDocument]:
    """Retorna todos los documentos compartidos disponibles."""
    return state["sharedDocuments"]

@tool
def share_document(title: str, content: str, shared_by: str) -> SharedDocument:
    """El líder comparte un documento con el equipo (solo role=leader puede llamar esto)."""
    doc = SharedDocument(
        id=str(uuid4()),
        title=title,
        content=content,
        sharedBy=shared_by,
        sharedAt=datetime.utcnow().isoformat()
    )
    return Command(update={"sharedDocuments": [*state["sharedDocuments"], doc]})
```

## Middleware chain (Python)

```python
# main.py — mismo patrón que el starter kit, solo cambia el estado
workflow = (
    TimingMiddleware()
    .chain(CrewStateMiddleware())   # antes: LeadStateMiddleware
    .chain(CopilotKitMiddleware(emit_intermediate_state=True))
    .compile()
)
```

## CrewStateMiddleware

```python
class CrewStateMiddleware(BaseMiddleware):
    async def before_agent(self, state: AgentState, config) -> AgentState:
        # Si el thread es nuevo (no tiene crew state), hidratar con datos de demo
        if not state.get("members"):
            seed = load_seed_data()  # desde crew.seed.json
            return {**state, **seed}
        return state
    
    async def after_agent(self, state: AgentState, config) -> AgentState:
        # Prevenir que STATE_SNAPSHOT borre el canvas (mismo patrón que LeadStateMiddleware)
        return state
```
