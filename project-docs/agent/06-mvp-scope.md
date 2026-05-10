# Crew Companion — MVP Scope

## Qué está EN el MVP

### Rutas y vistas
- [x] `/leader` — Dashboard del líder con tablero de tareas, lista de milestones, vista del equipo
- [x] `/member/[memberId]` — Workspace del miembro con tarea activa, countdown, chat
- [x] `/docs` — Workspace de documentos (visualización + preguntas al agente)
- [x] `/` → redirect a `/leader` (hardcoded para demo)

### Funcionalidades
- [x] Crear y asignar tareas (via chat o UI directa)
- [x] Crear milestone con deadline → calcular fase de urgencia
- [x] Countdown visible en tiempo real con cambio de fase visual
- [x] Reportar blocker (miembro) → llega al líder
- [x] Marcar tarea como completada
- [x] Compartir documento (líder) → visible en /docs
- [x] Chat con agente en todas las vistas

### UI Surfaces (8 de 12 — priorizadas)
- [x] `task_suggestion_panel` — líder, gestión de tareas
- [x] `milestone_summary_panel` — líder, review de milestone
- [x] `blocker_insight_panel` — líder, cuando hay blocker reportado
- [x] `member_action_panel` — cualquier rol, fase panic/urgent
- [x] `beginner_guide_panel` — miembro low-tech, ayuda general
- [x] `checklist_panel` — miembro, tareas paso a paso
- [x] `troubleshooting_wizard` — miembro low-tech, blocker activo
- [x] `document_summary_panel` — cualquier rol, pregunta sobre doc

### Surfaces post-MVP (no bloquean demo)
- [ ] `commands_panel` — miembro high-tech
- [ ] `comparison_panel` — miembro high-tech
- [ ] `guided_setup_panel` — miembro low-tech
- [ ] `role_assignment_panel` — líder

### Mascota
- [x] 5 moods: calm, focus, worried, panic, celebrate
- [x] Se actualiza automáticamente según fase + blocker
- [x] Animaciones CSS simples (sin audio, sin librerías externas)

### Agente
- [x] Gemini Flash como modelo default
- [x] Claude Sonnet 4.6 como alternativa (switch via AGENT_RUNTIME)
- [x] Threads persistentes (Postgres + Redis via CopilotKit Intelligence)
- [x] Datos demo locales (seed JSON, sin backend externo)

## Qué NO está en el MVP

| Feature | Razón |
|---------|-------|
| Autenticación real / sesiones | Hardcodear líder + 2-3 miembros demo es suficiente |
| Sync en tiempo real entre dispositivos | Un solo browser por demo |
| Asignación de roles desde UI | Solo via chat (el líder puede pedirle al agente) |
| MCP widgets standalone | La app directa es suficiente para demo |
| Export / share externo | No necesario para hackathon |
| Multi-milestone activo | Un solo milestone activo a la vez |
| `commands_panel` / `comparison_panel` | Nice-to-have, no critican el demo |
| Notion / external integrations | Datos locales son suficientes |

## Datos de demo (seed)

El seed JSON debe incluir:
```json
{
  "members": [
    { "id": "m1", "name": "Alex", "role": "leader", "technicalLevel": "high-tech" },
    { "id": "m2", "name": "Sam", "role": "member", "technicalLevel": "low-tech" },
    { "id": "m3", "name": "Jordan", "role": "member", "technicalLevel": "high-tech" }
  ],
  "tasks": [
    { "id": "t1", "title": "Diseñar la landing", "assignedTo": "m2", "status": "in-progress", "priority": "high" },
    { "id": "t2", "title": "Implementar API de usuarios", "assignedTo": "m3", "status": "todo", "priority": "high" },
    { "id": "t3", "title": "Preparar demo script", "assignedTo": "m1", "status": "todo", "priority": "medium" }
  ],
  "milestones": [
    {
      "id": "ms1",
      "title": "Demo final hackathon",
      "deadline": "REEMPLAZAR_CON_ISO_DATE_FUTURO",
      "taskIds": ["t1", "t2", "t3"]
    }
  ],
  "blockers": [],
  "sharedDocuments": [
    {
      "id": "d1",
      "title": "Stack técnico del proyecto",
      "content": "# Stack\n\n- Frontend: Next.js\n- Backend: Node.js\n- DB: PostgreSQL\n\n## Instalación\n\n```bash\nnpm install\nnpm run dev\n```",
      "sharedBy": "m1",
      "sharedAt": "2026-05-09T10:00:00Z"
    }
  ]
}
```

**Importante:** El deadline del milestone en el seed debe ser una fecha futura calculada en runtime para que el countdown funcione en la demo. La función `getUrgencyPhase()` calcula la fase en tiempo real.

## Criterio de demo exitosa (2 minutos)

1. **Escena 1 (0:00-0:30)**: Abrir `/leader`. Ver tablero + milestone con countdown en fase `normal`.
2. **Escena 2 (0:30-1:00)**: Escribir "qué tarea falta asignar". Agente renderiza `task_suggestion_panel`.
3. **Escena 3 (1:00-1:30)**: Cambiar deadline del milestone a 8 minutos. UI cambia a fase `urgent`. Mascota pasa a `worried`. Agente renderiza `milestone_summary_panel` sin que se le pida.
4. **Escena 4 (1:30-2:00)**: Abrir `/member/m2` (Sam, low-tech). Escribir "no entiendo cómo correr el proyecto". Agente renderiza `troubleshooting_wizard`. Mascota sincronizada.

Estos 4 momentos demuestran: generative UI, adaptación por rol, adaptación por urgencia, adaptación por nivel técnico.
