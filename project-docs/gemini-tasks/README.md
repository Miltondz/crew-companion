# Gemini CLI — Tareas de Crew Companion

## ⚠️ ANTES DE EMPEZAR

**No ejecutes ninguna tarea hasta que Milton te dé la señal.**
La señal es: "Gemini, arranca con las tareas del Bloque 2"

El motivo: las tareas necesitan que exista `apps/frontend/src/lib/crew/types.ts`.
Ese archivo lo crea Claude Code en la Fase 1+2. Cuando esté listo, arrancás.

---

## Cómo ejecutar una tarea

```bash
# Desde la carpeta raíz del proyecto:
gemini < project-docs/gemini-tasks/T01-surface-task-suggestion.md

# O con pipe:
cat project-docs/gemini-tasks/T01-surface-task-suggestion.md | gemini

# Gemini va a generar el código. Copialo al archivo de destino indicado en la tarea.
```

---

## Orden de ejecución

Podés ejecutar todas las T01–T08 en paralelo (surfaces independientes).
Las T09–T15 también son independientes entre sí.

### Grupo A — UI Surfaces (8 tareas, independientes entre sí)
| # | Archivo | Genera | Destino |
|---|---------|--------|---------|
| T01 | T01-surface-task-suggestion.md | `TaskSuggestionPanel.tsx` | `apps/frontend/src/components/surfaces/` |
| T02 | T02-surface-milestone-summary.md | `MilestoneSummaryPanel.tsx` | `apps/frontend/src/components/surfaces/` |
| T03 | T03-surface-blocker-insight.md | `BlockerInsightPanel.tsx` | `apps/frontend/src/components/surfaces/` |
| T04 | T04-surface-member-action.md | `MemberActionPanel.tsx` | `apps/frontend/src/components/surfaces/` |
| T05 | T05-surface-beginner-guide.md | `BeginnerGuidePanel.tsx` | `apps/frontend/src/components/surfaces/` |
| T06 | T06-surface-checklist.md | `ChecklistPanel.tsx` | `apps/frontend/src/components/surfaces/` |
| T07 | T07-surface-troubleshooting.md | `TroubleshootingWizard.tsx` | `apps/frontend/src/components/surfaces/` |
| T08 | T08-surface-document-summary.md | `DocumentSummaryPanel.tsx` | `apps/frontend/src/components/surfaces/` |

### Grupo B — Componentes base (7 tareas, independientes entre sí)
| # | Archivo | Genera | Destino |
|---|---------|--------|---------|
| T09 | T09-component-task-card.md | `TaskCard.tsx` | `apps/frontend/src/components/shared/` |
| T10 | T10-component-milestone-panel.md | `MilestonePanel.tsx` | `apps/frontend/src/components/leader/` |
| T11 | T11-component-team-overview.md | `TeamOverview.tsx` | `apps/frontend/src/components/leader/` |
| T12 | T12-component-active-task.md | `ActiveTaskView.tsx` | `apps/frontend/src/components/member/` |
| T13 | T13-component-countdown.md | `MilestoneCountdown.tsx` | `apps/frontend/src/components/member/` |
| T14 | T14-component-urgency-banner.md | `UrgencyBanner.tsx` | `apps/frontend/src/components/shared/` |
| T15 | T15-component-mascot.md | `MascotSVG.tsx` | `apps/frontend/src/components/mascot/` |

---

## Reglas para todos los componentes

- **Tailwind CSS** para todos los estilos — sin CSS externo, sin styled-components
- **shadcn/ui** para primitivos: `import { Card } from '@/components/ui/card'` etc.
- **Sin librerías de iconos externas** — usar emojis o SVG inline
- **Sin llamadas a APIs** — todo viene de props
- **TypeScript estricto** — sin `any`, usar los tipos definidos en cada tarea
- El código debe compilar sin errores con `npm run build`

---

## Cuando termines cada tarea

Avisale a Milton con el nombre del componente listo. Él lo integra al sistema.
