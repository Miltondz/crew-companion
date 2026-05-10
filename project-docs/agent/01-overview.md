# Crew Companion — Overview

## Qué es

Crew Companion es una aplicación web de coordinación para equipos en hackathons. Su diferenciador central es que **la interfaz de usuario no es fija**: cambia en tiempo real según el contexto del usuario, impulsada por un agente de AI.

El agente decide qué mostrar basándose en 4 variables:
1. **Rol** — `leader` (coordina el equipo) o `member` (contribuye)
2. **Nivel técnico** — `low-tech` (necesita guía paso a paso) o `high-tech` (quiere comandos y detalles)
3. **Fase de urgencia** — derivada del tiempo restante al próximo milestone: `normal` → `focus` → `urgent` → `panic` → `expired`
4. **Estado de bloqueador** — si el usuario tiene un blocker activo, la respuesta cambia de orientación

## El problema que resuelve

En un hackathon, los equipos pierden tiempo en:
- No saber qué hacer a continuación
- Diferencias de nivel técnico que generan fricción
- Perder de vista el milestone cuando el tiempo apremia
- Bloqueadores que no llegan al líder a tiempo

Crew Companion elimina esa fricción adaptando la UI al contexto exacto de cada persona en cada momento.

## La experiencia central

```
Usuario abre la app como "member" (nivel: low-tech)
  → Ve una interfaz simple con su tarea actual y un countdown
  → Escribe: "no entiendo cómo instalar la dependencia"
  → El agente detecta: member + low-tech + blocker
  → Renderiza un `troubleshooting_wizard` con pasos guiados
  → La mascota cambia a mood "worried"

El líder abre /leader
  → Ve el tablero de tareas y milestones
  → El agente detecta: 12 minutos para el milestone
  → La fase cambia a "urgent"
  → La UI cambia de color, la mascota cambia a "worried"
  → Aparece un `milestone_summary_panel` con las tareas pendientes
```

## Base técnica

Se construye sobre **Generative-UI-Global-Hackathon-Starter-Kit** que provee:
- CopilotKit v2 (frontend + runtime)
- LangGraph + LangChain (agente Python)
- Hono BFF
- Docker Compose (Postgres + Redis para threads)
- Next.js 15 + Tailwind CSS

Lo que se reemplaza: el dominio de leads → dominio de crew (tasks, milestones, members, blockers).

## Rutas principales

| Ruta | Quién la usa | Descripción |
|------|-------------|-------------|
| `/leader` | Líder del equipo | Dashboard: tareas, milestones, vista del equipo |
| `/member/[memberId]` | Miembro del equipo | Workspace personal: tarea activa, countdown, chat |
| `/docs` | Todos | Workspace de documentos compartidos |
| `/` | — | Redirect a `/leader` o `/member/[id]` según sesión |

## Valor del generative UI

La app **no es un dashboard con un chat al costado**. El chat IS la interfaz. El agente no responde texto — renderiza componentes UI tipados (llamados "surfaces") que reemplazan o complementan la vista estática. El usuario interactúa con esos componentes (checklists, wizards, suggestion panels) como si fueran parte nativa de la app.
