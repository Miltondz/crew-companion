# Crew Companion — Project Docs Index

> Estos son los documentos operativos del proyecto. Los docs en `base-docs/` son la especificación original de referencia. **Estos docs son los que se usan para construir.**

## Estructura

```
project-docs/
├── INDEX.md                        ← estás aquí
├── agent/                          ← contexto para agentes de código (Claude Code, Gemini CLI)
│   ├── 01-overview.md              ← qué es el proyecto y qué construimos
│   ├── 02-domain-model.md          ← tipos, entidades, estado (TS + Python)
│   ├── 03-architecture.md          ← stack, puertos, flujo de datos
│   ├── 04-surface-matrix.md        ← tabla de decisión: cuándo renderizar qué surface
│   ├── 05-prompts-and-tools.md     ← system prompt del agente + frontend actions + backend tools
│   └── 06-mvp-scope.md             ← qué está en el MVP y qué no
│
├── dev-milton/                     ← tareas para el programador principal (Claude Code + Gemini CLI)
│   ├── 00-roadmap.md               ← fases, dependencias, estimados
│   ├── 01-phase1-setup.md          ← Fase 1: copiar starter kit y limpiar
│   ├── 02-phase2-domain.md         ← Fase 2: dominio + store Zustand
│   ├── 03-phase3-frontend.md       ← Fase 3: rutas /leader y /member
│   ├── 04-phase4-surfaces.md       ← Fase 4: surfaces + countdown + mascot
│   ├── 05-phase5-agent.md          ← Fase 5: adaptar agente Python
│   └── PROMPTS.md                  ← prompts copy-paste para Claude Code y Gemini CLI
│
└── dev-companion/                  ← tareas para la colaboradora (frontend, Google Antigravity)
    ├── 00-intro.md                 ← bienvenida, contexto del proyecto, tu rol
    ├── 01-components.md            ← componentes a construir con specs visuales
    └── 02-style-guide.md           ← tokens de diseño, clases Tailwind, patrones
```

## Orden de lectura recomendado

### Para agentes de código
1. `agent/01-overview.md`
2. `agent/02-domain-model.md`
3. `agent/03-architecture.md`
4. `agent/04-surface-matrix.md`
5. `agent/05-prompts-and-tools.md`
6. `agent/06-mvp-scope.md`

### Para Milton (dev principal)
1. `dev-milton/00-roadmap.md` (visión general)
2. El archivo de la fase actual

### Para la colaboradora
1. `dev-companion/00-intro.md` (empezar aquí)
2. `dev-companion/02-style-guide.md`
3. `dev-companion/01-components.md`

## Base técnica
El proyecto se construye sobre **Generative-UI-Global-Hackathon-Starter-Kit** (`~/Generative-UI-Global-Hackathon-Starter-Kit`). Ese repo tiene toda la infraestructura ya cableada. Lo que hacemos es reemplazar el dominio de leads por el dominio de crew-companion.
