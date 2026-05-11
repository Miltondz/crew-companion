# Crew Companion — Arquitectura Evolutiva, Seguridad y Dirección de Producto

> Documento complementario al POLISH_PLAN.md y a los documentos de filosofía generativa.
>
> Objetivo: reinterpretar el proyecto ya no como un experimento de hackathon, sino como un producto evolutivo y extensible orientado a colaboración asistida por agentes.

---

# 1. Cambio de identidad del proyecto

## Lo que era originalmente

El proyecto comenzó como:

- un sistema de coordinación para hackathons,
- una interfaz generativa basada en contexto,
- un workspace adaptativo asistido por AI,
- una demostración de CopilotKit + LangGraph + UI dinámica.

Eso sigue siendo cierto.

Pero el alcance conceptual ya evolucionó.

---

# Lo que el proyecto realmente está empezando a ser

Crew Companion ya no se comporta como:

- un dashboard,
- un chatbot,
- una app de productividad tradicional,
- ni una simple capa de AI sobre un Kanban.

La dirección natural del sistema apunta hacia:

# Un entorno operativo colaborativo asistido por agentes.

O dicho de otra forma:

> Un runtime donde personas, agentes, herramientas, procesos y superficies visuales coexisten y se reorganizan dinámicamente según contexto, intención y estado operativo.

---

# 2. Reinterpretación de la filosofía generativa

## La versión inicial

La filosofía original proponía:

> “La interfaz no existe antes de que el agente la construya.”

Esto fue extremadamente útil para:

- romper la mentalidad de dashboards tradicionales,
- justificar superficies contextuales,
- explorar generación runtime,
- diferenciar el sistema.

Pero aplicada literalmente a producción, genera riesgos importantes.

---

# El principal riesgo

## Fatiga cognitiva

Si la interfaz:

- cambia demasiado,
- se reorganiza constantemente,
- altera navegación,
- destruye memoria espacial,
- mueve herramientas conocidas,
- cambia estructuras base,

el usuario pierde:

- confianza,
- predictibilidad,
- velocidad,
- memoria muscular,
- sensación de control.

Especialmente en:

- equipos reales,
- workflows largos,
- contextos profesionales,
- usuarios no técnicos.

---

# Nueva interpretación recomendada

## “La estructura existe; la superficie emerge.”

Esto conserva:

- la identidad generativa,
- la adaptabilidad,
- la composición dinámica,

sin sacrificar:

- estabilidad cognitiva,
- continuidad espacial,
- anclaje mental.

---

# Nuevo principio estructural

| Capa | Naturaleza |
|---|---|
| Layout base | Persistente |
| Navegación principal | Persistente |
| Regiones de trabajo | Semi-persistentes |
| Herramientas favoritas | Persistentes |
| Superficies contextuales | Generativas |
| Prioridad visual | Generativa |
| Composición contextual | Generativa |
| Overlay operativo | Generativo |

---

# 3. Arquitectura futura recomendada

El sistema actual ya tiene:

- frontend modular,
- renderer de surfaces,
- runtime agentic,
- herramientas,
- estado contextual.

La siguiente evolución natural es convertir eso en un runtime extensible.

---

# Arquitectura conceptual futura

```text
┌────────────────────────────────────┐
│            USER WORKSPACE          │
└────────────────────────────────────┘
                │
                ▼
┌────────────────────────────────────┐
│          SURFACE ENGINE            │
│ Genera / compone / transforma UI   │
└────────────────────────────────────┘
                │
                ▼
┌────────────────────────────────────┐
│          CONTEXT ENGINE            │
│ Rol · fase · intención · estado    │
└────────────────────────────────────┘
                │
                ▼
┌────────────────────────────────────┐
│        AGENT ORCHESTRATOR          │
│ Coordina agentes especializados    │
└────────────────────────────────────┘
                │
        ┌───────┼────────┐
        ▼       ▼        ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ SQL Agent│ │ PM Agent │ │ Dev Agent│
└──────────┘ └──────────┘ └──────────┘
        │       │        │
        └───────┼────────┘
                ▼
┌────────────────────────────────────┐
│         CAPABILITY ENGINE          │
│ Seguridad · permisos · sandboxing  │
└────────────────────────────────────┘
                │
                ▼
┌────────────────────────────────────┐
│           TOOL RUNTIME             │
│ DB · Git · APIs · Files · Shell    │
└────────────────────────────────────┘
```

---

# 4. Evolución del sistema de surfaces

Actualmente:

- SurfaceRenderer
- envelope.type
- mapping fijo

Eso es correcto para MVP.

Pero eventualmente el sistema debería evolucionar hacia:

# Surface Registry

---

# Surface Registry

Cada superficie se registra dinámicamente.

Ejemplo:

```ts
{
  id: "force_graph",
  supportedContexts: ["blocked", "debug"],
  requiredCapabilities: ["tasks.read"],
  interactionModel: "graph",
  preferredRoles: ["builder", "owner"],
  inputs: ["dependencies", "blockers"],
  outputs: ["task.resolve", "task.reassign"]
}
```

---

# Beneficios

## 1. Extensibilidad real

Nuevas superficies pueden añadirse sin modificar el core.

---

## 2. Ecosistema futuro

Permite:

- plugins,
- paquetes,
- superficies de terceros,
- kits internos,
- verticales específicas.

---

## 3. Selección inteligente

El agente deja de tener un switch hardcodeado.

En cambio:

- consulta el registry,
- evalúa contexto,
- decide composición.

---

# 5. Sistema de plugins

La extensibilidad futura debería dividirse en:

---

# A. Visual Extensions

Añaden nuevas superficies.

Ejemplos:

- DB explorer,
- architecture map,
- deployment monitor,
- test coverage viewer,
- analytics panel,
- diagram surface,
- incident map.

---

# B. Process Extensions

Añaden workflows.

Ejemplos:

- sprint planning,
- incident response,
- onboarding,
- QA review,
- release management,
- design critique,
- client approval.

---

# C. Specialist Agents

Agentes especializados.

Ejemplos:

- SQL assistant,
- DevOps assistant,
- Documentation assistant,
- PM assistant,
- Security auditor,
- Research agent,
- Data analyst.

---

# D. Capability Providers

Herramientas reales.

Ejemplos:

- PostgreSQL,
- GitHub,
- Jira,
- Slack,
- filesystem,
- shell,
- Docker,
- Redis,
- APIs externas.

---

# 6. La capa de seguridad

Esta capa NO es opcional.

Actualmente el sistema todavía vive en una etapa relativamente segura:

- seed data,
- estado controlado,
- pocas herramientas críticas.

Pero el momento en que el sistema:

- interactúe con bases de datos reales,
- modifique repositorios,
- ejecute comandos,
- toque APIs,
- automatice acciones,

el principal problema deja de ser UI.

Pasa a ser:

# Governance y control.

---

# Riesgo principal

Un agente con demasiada autonomía:

- puede modificar información crítica,
- ejecutar acciones destructivas,
- generar pérdidas de datos,
- introducir problemas legales o de compliance,
- romper confianza organizacional.

---

# Arquitectura recomendada

## Capability-Based Security

El agente NO “tiene acceso total”.

El agente tiene:

- capacidades específicas,
- contextuales,
- auditables,
- revocables,
- limitadas.

---

# Ejemplo

```yaml
capabilities:
  - db.read.schema
  - db.read.rows
```

Pero NO:

```yaml
- db.write
- db.drop
- db.alter
```

---

# Niveles de acción

## Nivel 0 — Observación

Solo lectura.

---

## Nivel 1 — Propuesta

El agente propone.
No ejecuta.

---

## Nivel 2 — Confirmación requerida

Puede ejecutar si el usuario aprueba.

---

## Nivel 3 — Automatización limitada

Puede actuar dentro de límites seguros.

---

## Nivel 4 — Automatización total

Muy restringido.
Solo entornos aislados.

---

# Componentes obligatorios futuros

## Audit Log

Registrar:

- usuario,
- agente,
- prompt,
- herramienta,
- acción,
- resultado,
- timestamp.

---

## Sandboxing

Especialmente para:

- shell,
- SQL,
- filesystem,
- scripts,
- plugins,
- código generado.

---

## Permission UI

El usuario debe poder:

- ver permisos,
- revocar,
- aprobar,
- limitar,
- auditar.

---

# 7. Interfaces ancladas

Este es uno de los cambios más importantes.

---

# Problema

Si todo cambia constantemente:

- el usuario nunca desarrolla familiaridad,
- cada sesión se siente distinta,
- el sistema parece impredecible.

---

# Solución

## Workspace persistente

El usuario puede:

- anclar superficies,
- fijar regiones,
- guardar layouts,
- definir herramientas favoritas,
- mantener zonas estables.

Mientras el agente:

- adapta solo ciertas regiones,
- añade overlays,
- reorganiza prioridad contextual,
- propone nuevas superficies.

---

# Modelo recomendado

```text
┌──────────────┬────────────────────┬──────────────┐
│ Región fija  │ Región generativa  │ Región fija  │
│              │                    │              │
│ Terminal     │ Causal Chain       │ AI Chat      │
│ Command Bar  │ Force Graph        │ Logs         │
│ DB Explorer  │ Timeline           │ Blockers     │
└──────────────┴────────────────────┴──────────────┘
```

---

# Resultado

Se mantiene:

- memoria espacial,
- predictibilidad,
- velocidad,
- sensación de ownership.

Sin perder:

- adaptabilidad,
- contexto,
- generación dinámica.

---

# 8. Evolución del sistema operativo visual

Actualmente el proyecto todavía es:

- page-based,
- route-based,
- parcialmente tradicional.

Pero la dirección natural apunta hacia:

# Runtime espacial continuo.

---

# Características futuras

## Menos navegación

Más transformación contextual.

---

## Menos páginas

Más superficies vivas.

---

## Menos formularios

Más interacción contextual.

---

## Menos dashboards

Más espacios operativos.

---

# 9. Multiagente

El sistema actual tiene un agente principal.

Eso eventualmente se vuelve insuficiente.

---

# Problema del agente único

Un único prompt termina:

- demasiado largo,
- difícil de mantener,
- inconsistente,
- lento,
- con contexto contaminado.

---

# Arquitectura recomendada

## Agent Orchestrator

Coordina múltiples agentes especializados.

---

# Ejemplo

## PM Agent

- milestones,
- priorización,
- blockers.

---

## Dev Agent

- arquitectura,
- debugging,
- tareas técnicas.

---

## SQL Agent

- queries,
- schema,
- reporting.

---

## Narrative Agent

- demos,
- storytelling,
- README,
- submissions.

---

## Security Agent

- permisos,
- auditoría,
- riesgos.

---

# Beneficios

- prompts más pequeños,
- especialización,
- mejor razonamiento,
- menor contaminación contextual,
- escalabilidad.

---

# 10. ¿Web app o aplicación local?

## Recomendación actual

Mantener:

# Web-first.

---

# Razón

El proyecto todavía está:

- definiendo identidad,
- validando UX,
- experimentando workflows,
- refinando arquitectura.

Migrar ahora a:

- Rust,
- Tauri,
- local runtime,
- desktop native,

sería una distracción importante.

---

# Pero la evolución futura más lógica sí apunta hacia:

# Tauri + runtime local.

---

# Beneficios futuros

## Integración real con sistema

- terminal,
- git,
- docker,
- archivos,
- procesos,
- bases de datos locales.

---

## AI local

- Ollama,
- embeddings,
- memoria privada,
- agentes locales.

---

## Offline-first

Muy importante para:

- equipos reales,
- privacidad,
- velocidad,
- confiabilidad.

---

## Menor consumo que Electron

Muy relevante si el sistema crece.

---

# Recomendación estratégica

## Fase actual

Mantener:

- Next.js,
- React,
- web runtime,
- iteration speed.

---

## Fase posterior

Extraer:

- runtime core,
- capability engine,
- orchestrator,
- state engine,

para que puedan correr:

- web,
- desktop,
- híbrido.

---

# 11. Nueva definición del producto

La definición del proyecto probablemente debería evolucionar hacia algo como:

> Crew Companion es un entorno operativo colaborativo adaptativo donde agentes, herramientas y superficies visuales se reorganizan dinámicamente para asistir equipos humanos en trabajo complejo.

---

# 12. Riesgos principales del proyecto

---

# Riesgo 1 — Sobre-generación

Todo cambia demasiado.

## Solución

- regiones persistentes,
- layouts estables,
- surfaces contextuales limitadas.

---

# Riesgo 2 — Complejidad explosiva

El sistema intenta resolver demasiados problemas.

## Solución

- plugin boundaries,
- capas claras,
- MVP verticales.

---

# Riesgo 3 — Agente omnipotente

Demasiada autonomía.

## Solución

- capability engine,
- approval flows,
- audit logs,
- sandboxing.

---

# Riesgo 4 — Producto sin foco

Intentar servir todos los casos.

## Solución

Definir:

- workflows prioritarios,
- tipos de equipo iniciales,
- vertical principal.

---

# Riesgo 5 — UI experimental imposible de mantener

Demasiadas superficies únicas.

## Solución

Construir:

- primitives reutilizables,
- interaction grammar,
- motion system consistente,
- design system real.

---

# 13. Recomendación estratégica inmediata

---

# PRIORIDAD 1 — Consolidar arquitectura actual

Antes de expandir:

- estabilizar runtime,
- limpiar surfaces,
- consolidar estado,
- mejorar persistencia,
- preparar extensibilidad.

---

# PRIORIDAD 2 — Introducir sistema de layouts persistentes

Esto desbloquea:

- adopción real,
- estabilidad cognitiva,
- sensación de ownership.

---

# PRIORIDAD 3 — Crear capability engine mínimo

Aunque inicialmente sea simple.

Necesario antes de:

- DB access,
- filesystem,
- shell,
- automatización.

---

# PRIORIDAD 4 — Diseñar plugin runtime

Aunque no se implemente completo todavía.

Necesario para evitar:

- hardcoding masivo,
- surfaces rígidas,
- tool chaos.

---

# PRIORIDAD 5 — Validar workflows reales

Probar con:

- equipos remotos,
- pequeños equipos dev,
- coordinación híbrida,
- debugging grupal,
- planificación.

Porque la UX real aparecerá ahí.

---

# 14. Conclusión

El proyecto ya superó el punto donde puede verse solamente como:

- una demo,
- un experimento de hackathon,
- un dashboard generativo.

La arquitectura conceptual que está emergiendo apunta hacia:

- sistemas operativos colaborativos,
- runtimes agentic,
- entornos adaptativos,
- trabajo coordinado humano+AI.

Eso lo vuelve muchísimo más interesante.

Pero también obliga a:

- introducir límites,
- diseñar estabilidad,
- controlar autonomía,
- modularizar agresivamente,
- evitar que la complejidad explote antes de tiempo.

La clave del siguiente ciclo del proyecto no será “más AI”.

Será:

# estructura.

