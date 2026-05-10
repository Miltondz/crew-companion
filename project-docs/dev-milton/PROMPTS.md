# Prompts para Claude Code y Gemini CLI

Prompts listos para copiar y pegar. Siempre dar contexto del directorio antes de ejecutar.

---

## FASE 1 — Setup

### Claude Code
```
Lee los archivos project-docs/agent/01-overview.md y project-docs/agent/03-architecture.md.
Luego ejecuta los pasos de project-docs/dev-milton/01-phase1-setup.md.
Copia la estructura del starter kit desde ~/Generative-UI-Global-Hackathon-Starter-Kit,
elimina el dominio de leads y crea las páginas placeholder para /leader, /member/[memberId] y /docs.
No modifiques deployment/, scripts/ ni los componentes de shadcn en components/ui/.
```

### Gemini CLI
```
gemini "Lee project-docs/dev-milton/01-phase1-setup.md y genera el contenido exacto 
de apps/frontend/src/app/page.tsx, apps/frontend/src/app/leader/page.tsx, 
apps/frontend/src/app/member/[memberId]/page.tsx y apps/frontend/src/app/docs/page.tsx 
como páginas placeholder que solo muestran texto descriptivo"
```

---

## FASE 2 — Dominio y Store

### Claude Code
```
Lee project-docs/agent/02-domain-model.md y project-docs/dev-milton/02-phase2-domain.md.
Crea los archivos apps/frontend/src/lib/crew/types.ts, store.ts, derive.ts y seed.ts
con el contenido exacto especificado. Instala zustand si no está en package.json del workspace frontend.
Verifica que TypeScript compila sin errores.
```

### Gemini CLI — generar el store completo
```
gemini "Dado este domain model:
$(cat project-docs/agent/02-domain-model.md)

Genera el archivo completo apps/frontend/src/lib/crew/store.ts usando Zustand.
Incluir todas las actions: merge, updateTask, addBlocker, resolveBlocker, 
setMascotState, setHighlightedTasks, setUrgencyPhase, simulateUrgency.
La función simulateUrgency recalcula el deadline del milestone activo."
```

---

## FASE 3 — Frontend

### Claude Code — rutas completas
```
Lee project-docs/agent/03-architecture.md, project-docs/agent/05-prompts-and-tools.md
y project-docs/dev-milton/03-phase3-frontend.md.
Implementa las vistas /leader y /member/[memberId] con:
- useUrgencyPhaseSync hook
- useCopilotReadable con los campos especificados
- Todos los useCopilotAction de la sección "Frontend Actions"
- UrgencyBanner component
- Botones de simulación de urgencia (solo en development)
Usa los componentes de shadcn existentes en components/ui/. No crees componentes de diseño todavía,
esos los construye la colaboradora. Usa divs con clases Tailwind básicas como placeholder.
```

### Claude Code — solo el CopilotKit setup
```
Adapta apps/frontend/src/components/copilot/CopilotKitProviderShell.tsx del starter kit
para crew-companion. El agent name debe ser "crew_agent", el runtimeUrl "/api/copilotkit".
Envuélvelo en apps/frontend/src/app/layout.tsx. Verifica que el BFF en apps/bff/src/server.ts
tenga el graph ID correcto para LangGraph.
```

### Gemini CLI — componentes de UI básicos
```
gemini "Crea el componente apps/frontend/src/components/shared/UrgencyBanner.tsx
con las especificaciones de project-docs/dev-milton/03-phase3-frontend.md sección 3.5.
Usa Tailwind CSS. El componente recibe un prop phase: UrgencyPhase y muestra null si phase === 'normal'."
```

---

## FASE 4 — Surfaces e integración

### Claude Code — SurfaceRenderer + acciones CopilotKit
```
Lee project-docs/agent/04-surface-matrix.md y project-docs/dev-milton/04-phase4-surfaces.md.
Crea apps/frontend/src/components/surfaces/SurfaceRenderer.tsx con el dispatcher completo.
Registra la acción useCopilotAction renderSurface en /leader y /member/[memberId].
Los componentes individuales (TaskSuggestionPanel etc.) pueden ser stubs vacíos por ahora —
la colaboradora los implementa. El MilestoneCountdown implementarlo completo.
```

### Claude Code — integrar CompanionMascot
```
Crea el wrapper apps/frontend/src/components/mascot/CompanionMascot.tsx que lee
mascotMood y mascotMode del store de Zustand y renderiza <MascotSVG mood={...} mode={...} />.
MascotSVG puede ser un placeholder con un emoji que cambia según el mood:
calm=😊, focus=🎯, worried=😰, panic=🚨, celebrate=🎉
La colaboradora reemplazará este placeholder con el SVG real.
```

### Gemini CLI — generar surface stub
```
gemini "Genera el componente React apps/frontend/src/components/surfaces/TaskSuggestionPanel.tsx
con las siguientes props basadas en este payload type:
$(grep -A 15 'TaskSuggestionPayload' project-docs/agent/04-surface-matrix.md)
Usa Tailwind CSS, cards con sombra, lista de sugerencias con badges de prioridad.
Debe verse profesional pero sin librerías de iconos externas."
```

---

## FASE 5 — Agente Python

### Claude Code
```
Lee project-docs/agent/02-domain-model.md, project-docs/agent/05-prompts-and-tools.md
y project-docs/dev-milton/05-phase5-agent.md.
Crea los archivos apps/agent/src/crew_state.py, apps/agent/src/tools.py y apps/agent/src/prompts.py.
Adapta apps/agent/src/runtime.py para usar CrewCanvasState y CREW_TOOLS.
Adapta apps/agent/main.py para usar el nuevo runtime.
Copia apps/agent/src/timing.py sin cambios del starter kit si no existe.
Crea crew.seed.json en apps/agent/ con los datos de project-docs/agent/06-mvp-scope.md.
```

### Gemini CLI — system prompt completo
```
gemini "Lee project-docs/agent/05-prompts-and-tools.md sección 'System Prompt'
y project-docs/agent/04-surface-matrix.md sección 'Tabla de decisión principal'.
Genera el archivo completo apps/agent/src/prompts.py con la constante SYSTEM_PROMPT
que incluye: instrucciones de rol, tabla de decisión simplificada, reglas de tono
por technicalLevel, y reglas absolutas. La función build_system_prompt recibe el state dict."
```

---

## FASE 6 — Debug e integración

### Claude Code — diagnóstico completo
```
Verifica que la integración completa funciona:
1. Lee los criterios de completitud de cada fase en project-docs/dev-milton/
2. Ejecuta npm run dev en background y verifica que no hay errores de compilación
3. Verifica que el agente Python en apps/agent/main.py importa correctamente crew_state y tools
4. Verifica que los useCopilotAction en el frontend coinciden con los nombres de tools
   definidos en project-docs/agent/05-prompts-and-tools.md
5. Reporta cualquier discrepancia
```

### Gemini CLI — revisar alineación tipos TS ↔ Python
```
gemini "Compara los tipos TypeScript en apps/frontend/src/lib/crew/types.ts
con los TypedDicts Python en apps/agent/src/crew_state.py.
Lista cualquier campo que exista en uno pero no en el otro,
o que tenga un tipo diferente (ej: string vs Optional[str]).
El objetivo es que el estado que el agente emite via CopilotKit sea deserializable en el frontend."
```

---

## Prompts generales de mantenimiento

### Agregar una nueva surface
```
Claude Code: Agrega la surface 'commands_panel' siguiendo el patrón de las surfaces existentes.
El payload type está en project-docs/agent/04-surface-matrix.md.
1. Crear CommandsPanel.tsx en apps/frontend/src/components/surfaces/
2. Agregar el case en SurfaceRenderer.tsx
3. Agregar la fila correspondiente en la tabla del agente en apps/agent/src/prompts.py
```

### Debuggear una surface que no aparece
```
Claude Code: La surface 'milestone_summary_panel' no se está renderizando en el chat.
Verifica:
1. Que useCopilotAction 'renderSurface' está registrado en la página actual
2. Que el case 'milestone_summary_panel' existe en SurfaceRenderer.tsx
3. Que el agente Python está llamando renderSurface con el type correcto
4. Revisa los logs del agente en la consola para ver qué tool calls hace
```
