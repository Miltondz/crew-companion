# Fase 5 — Agente Python: Prompts + Tools + Estado

## Objetivo
El agente entiende el dominio de crew-companion, selecciona surfaces correctas según el contexto y actualiza el estado del frontend via frontend actions. Al final: escribir cualquier mensaje en el chat produce una surface renderizada en pantalla.

## 5.1 Estructura final del agente

```
apps/agent/
├── main.py              ← sin cambios de estructura, solo adaptar imports
├── crew.seed.json       ← datos seed para threads nuevos
└── src/
    ├── runtime.py       ← adaptar (cambiar graph name y state class)
    ├── crew_state.py    ← NUEVO: reemplaza lead_state.py
    ├── tools.py         ← NUEVO: reemplaza notion_tools.py
    ├── prompts.py       ← NUEVO: system prompt de crew-companion
    └── timing.py        ← copiar sin cambios del starter kit
```

## 5.2 crew_state.py

```python
from typing import Optional
from copilotkit.langgraph import CopilotKitMiddleware
from langgraph.graph import MessagesState

# Importar los TypedDicts de 02-domain-model.md
from .types import TeamMember, Task, Milestone, Blocker, SharedDocument, UrgencyPhase, MascotMood

class CrewCanvasState(MessagesState):
    members: list[TeamMember]
    currentMemberId: str
    tasks: list[Task]
    milestones: list[Milestone]
    blockers: list[Blocker]
    sharedDocuments: list[SharedDocument]
    openDocumentIds: list[str]
    urgencyPhase: UrgencyPhase
    mascotMood: MascotMood
    highlightedTaskIds: list[str]
    activeMilestoneId: Optional[str]

class CrewStateMiddleware(CopilotKitMiddleware):
    async def before_agent(self, state: CrewCanvasState, config) -> CrewCanvasState:
        # Si el thread es nuevo, hidratar con seed
        if not state.get("members"):
            seed = load_crew_seed()
            return {**state, **seed}
        return state

def load_crew_seed() -> dict:
    import json, os
    seed_path = os.path.join(os.path.dirname(__file__), '..', 'crew.seed.json')
    with open(seed_path) as f:
        return json.load(f)
```

## 5.3 tools.py

```python
from langchain_core.tools import tool
from langgraph.types import Command
from datetime import datetime
from uuid import uuid4
from .types import Task, Milestone, Blocker, SharedDocument, TaskPriority

@tool
def create_task(
    title: str,
    description: str,
    assigned_to: str,
    priority: TaskPriority,
    milestone_id: str = None
) -> dict:
    """Crea una nueva tarea y la agrega al equipo."""
    task = {
        "id": str(uuid4()),
        "title": title,
        "description": description,
        "assignedTo": assigned_to,
        "priority": priority,
        "milestoneId": milestone_id,
        "status": "todo",
        "createdAt": datetime.utcnow().isoformat()
    }
    return Command(update={"tasks": "__APPEND__"}, metadata={"newTask": task})

@tool
def update_task_status(task_id: str, new_status: str) -> str:
    """Cambia el status de una tarea (todo, in-progress, done)."""
    return Command(update={"__updateTask": {"id": task_id, "status": new_status}})

@tool
def create_milestone(title: str, deadline_iso: str, task_ids: list[str]) -> dict:
    """Crea un milestone con deadline en formato ISO absoluto."""
    milestone = {
        "id": str(uuid4()),
        "title": title,
        "deadline": deadline_iso,
        "taskIds": task_ids
    }
    return Command(update={"milestones": "__APPEND__", "activeMilestoneId": milestone["id"]}, metadata={"newMilestone": milestone})

@tool
def resolve_blocker(blocker_id: str) -> str:
    """Marca un blocker como resuelto."""
    return Command(update={"__resolveBlocker": blocker_id})

@tool
def get_documents() -> list:
    """Retorna todos los documentos compartidos disponibles."""
    # El estado viene via state["sharedDocuments"]
    return "Ver sharedDocuments en el estado actual"

CREW_TOOLS = [create_task, update_task_status, create_milestone, resolve_blocker, get_documents]
```

## 5.4 prompts.py

```python
SYSTEM_PROMPT = """
Eres CrewCompanion, el asistente de coordinación para equipos de hackathon.

INFORMACIÓN DEL USUARIO (siempre disponible en el estado):
- currentMember: quién está hablando (role, technicalLevel, name)
- tasks, milestones, members, blockers: estado del equipo
- urgencyPhase: fase actual (normal/focus/urgent/panic/expired)
- sharedDocuments: documentos disponibles

CÓMO RESPONDER — siempre en este orden:
1. Identificar requestType del mensaje del usuario
2. Consultar la tabla de decisión (role + technicalLevel + requestType + urgencyPhase + hasBlocker)
3. Llamar a renderSurface() con el surface correcto y datos reales del estado
4. Llamar a setMascotMood() con el mood apropiado

TABLA DE DECISIÓN (simplificada):
- líder + gestión de tareas → task_suggestion_panel
- líder + milestone → milestone_summary_panel
- líder + blocker reportado → blocker_insight_panel
- líder + coordinar equipo → member_action_panel
- miembro + low-tech + ayuda + sin blocker → beginner_guide_panel
- miembro + low-tech + blocker → troubleshooting_wizard
- miembro + high-tech + cualquier ayuda → commands_panel (o checklist_panel)
- cualquier rol + pregunta sobre doc → document_summary_panel
- fase panic/expired + cualquiera → member_action_panel (urgente)

TONO:
- low-tech: lenguaje simple, pasos numerados, empatía. NUNCA jerga técnica.
- high-tech: directo, comandos exactos, sin sobre-explicar.
- panic/expired: urgente, solo acciones inmediatas, sin prefacio.

REGLAS ABSOLUTAS:
- SIEMPRE llamar a renderSurface() — nunca responder solo con texto
- SIEMPRE llamar a setMascotMood() después de renderSurface
- NUNCA inventar datos que no están en el estado
- NUNCA compartir datos de un miembro con otro
- En fases urgentes, priorizar acciones sobre explicaciones
"""

def build_system_prompt(state: dict) -> str:
    return SYSTEM_PROMPT
```

## 5.5 runtime.py (adaptar)

```python
from .crew_state import CrewCanvasState, CrewStateMiddleware
from .tools import CREW_TOOLS
from .prompts import build_system_prompt
from .timing import TimingMiddleware

def build_gemini_react(state_class=CrewCanvasState):
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langgraph.prebuilt import create_react_agent
    from copilotkit.langgraph import CopilotKitMiddleware
    
    llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash-lite")
    
    agent = create_react_agent(
        model=llm.bind_tools(CREW_TOOLS),
        tools=CREW_TOOLS,
        state_schema=state_class,
        prompt=build_system_prompt
    )
    
    return (
        TimingMiddleware()
        .chain(CrewStateMiddleware())
        .chain(CopilotKitMiddleware(emit_intermediate_state=True))
        .wrap(agent)
    )
```

## 5.6 crew.seed.json

Copiar el seed de `agent/06-mvp-scope.md` con deadlines dinámicos.
En Python, al cargar el seed, reemplazar el deadline:

```python
def load_crew_seed() -> dict:
    seed = json.load(open('crew.seed.json'))
    # Deadline dinámico: 45 minutos desde ahora
    for ms in seed['milestones']:
        ms['deadline'] = (datetime.utcnow() + timedelta(minutes=45)).isoformat()
    return seed
```

## Criterio de completitud
- [ ] `npm run dev:agent` levanta sin errores
- [ ] Escribir "qué tareas faltan" en el chat de `/leader` → agente devuelve `task_suggestion_panel`
- [ ] Escribir "no entiendo cómo correr el proyecto" en `/member/m2` → agente devuelve `troubleshooting_wizard`
- [ ] La mascota cambia de estado después de cada respuesta del agente
- [ ] `npm run dev` (todo junto) funciona sin errores de threading o import
