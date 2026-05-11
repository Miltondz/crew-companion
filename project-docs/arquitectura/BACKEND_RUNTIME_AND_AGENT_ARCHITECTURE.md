BACKEND_RUNTIME_AND_AGENT_ARCHITECTURE.md


```markdown
# BACKEND_RUNTIME_AND_AGENT_ARCHITECTURE.md

# Crew Companion — Backend Runtime & Agent Architecture

## Introducción

Crew Companion posee actualmente una de sus mayores fortalezas en la separación arquitectónica entre:

- Frontend,
- Backend-for-Frontend,
- Runtime Agentic.

Esta división constituye una base extremadamente valiosa para evolucionar hacia un sistema operativo cognitivo profesional.

Sin embargo, el runtime actual todavía conserva patrones propios de:
- prototipos,
- sistemas monolíticos de prompting,
- y orquestación parcialmente rígida.

Este documento formaliza:
- fortalezas reales,
- riesgos sistémicos,
- problemas estructurales,
- y la evolución necesaria hacia un Runtime Cognitivo Profesional.

---

# 1. Evaluación del Backend Actual

---

# 1.1 Fortalezas Arquitectónicas

## Separación Frontend / BFF / Agent

La división actual es correcta.

Frontend:
- renderización,
- interacción,
- surfaces.

BFF:
- transporte,
- adaptación,
- runtime bridge.

Agent Runtime:
- reasoning,
- orchestration,
- context interpretation.

Esta separación:
- reduce coupling,
- permite escalabilidad,
- habilita evolución independiente,
- protege el reasoning core.

---

## Middleware Pipeline

La cadena:

```python
TimingMiddleware
-> CrewStateMiddleware
-> CopilotKitMiddleware

es conceptualmente sólida.

Permite:

enriquecimiento contextual,
hydration,
urgency computation,
normalization,
reasoning preparation.
Domain Typing

La sincronización:

TypedDicts Python,
interfaces TS,

es extremadamente valiosa.

Esto evita:

schema drift,
payload inconsistency,
runtime ambiguity.
2. Riesgos Críticos
2.1 Prompt Explosion

Actualmente:

un solo agente,
un solo mega-prompt,
múltiples responsabilidades.

Esto escala mal.

Problemas futuros:

contexto inmanejable,
aumento de tokens,
reasoning inconsistente,
surfaces incorrectas,
alucinaciones estructurales.
2.2 Contaminación de Contexto

El riesgo aumenta con:

múltiples miembros,
múltiples workspaces,
múltiples threads,
persistencia prolongada.

Sin boundaries claros:

reasoning bleed,
leakage,
memory contamination,
incorrect surface generation.
2.3 Orquestación Limitada

Actualmente:

el agente selecciona templates,
no coordina sistemas dinámicos.

No existe:

orchestration protocol,
agent delegation,
envelope routing,
semantic coordination layer.
2.4 Ausencia de Capability Governance

Actualmente:

tools ejecutan acciones,
pero no existe policy enforcement real.

Esto es crítico.

Especialmente para:

SQL,
filesystem,
shell,
deployment systems,
infra tooling.
3. Evolución Necesaria del Runtime
3.1 Surface Runtime Contracts

El agente debe emitir:

{
  "surfaceIntent": "...",
  "priority": "...",
  "context": {},
  "requiredCapabilities": []
}

NO JSX.
NO rendering instructions.

El runtime decide:

montaje,
lifecycle,
placement,
persistence.
3.2 Capability Engine

Toda herramienta debe declarar:

{
  "requiredCapabilities": [
    "db.read"
  ]
}

El runtime:

valida,
audita,
limita,
registra.
3.3 Policy Engine

Debe existir:

Contextual Security Layer

Ejemplos:

bloquear db.write en panic phase,
bloquear shell.execute a miembros,
requerir approval para destructive actions,
limitar filesystem scope.
3.4 Auditability

Toda acción debe registrarse:

usuario,
agente,
herramienta,
timestamp,
impacto,
resultado.

Sin audit log:

el sistema NO es enterprise-safe.
4. Evolución Multi-Agente
4.1 Problema del Agente Único

Un solo agente:

eventualmente colapsa.

Razones:

demasiadas responsabilidades,
contexto gigante,
routing ambiguo,
specialization impossible.
4.2 Topología Recomendada
Orchestrator

Responsable de:

routing,
priorities,
coordination,
layout intent.
Planner

Responsable de:

decomposition,
milestones,
balancing.
Coach

Responsable de:

user adaptation,
education,
blocker handling.
Specialists

Futuros:

SQL,
Security,
Infra,
Docs,
Debugging.
4.3 Envelope-Based Coordination

Los agentes NO deben comunicarse mediante prompts libres.

Debe existir:

{
  "type": "...",
  "intent": "...",
  "payload": {}
}

Esto:

reduce ambiguity,
mejora routing,
mejora auditabilidad.
5. Niveles de Autoridad
Nivel	Descripción
Observation	Solo lectura
Suggestion	Propuesta
Confirmation	Requiere aprobación
Execution	Acción autorizada
Autonomous	Solo para contextos extremadamente controlados
6. Sandboxing

Obligatorio para:

shell,
SQL,
code execution,
filesystem operations.

Sin sandboxing:

el runtime es inseguro.
7. Persistencia Profesional

El sistema debe abandonar:

crew.seed.json

Debe existir:

workspace persistence,
session persistence,
scoped memory,
tenant isolation.
8. Conclusión

Crew Companion debe evolucionar desde:

“Agent with templates”

hacia:

“Cognitive Operational Runtime”

donde:

agentes razonan,
runtime gobierna,
policies controlan,
surfaces representan,
y el usuario mantiene autoridad final.