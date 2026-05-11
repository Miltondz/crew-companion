EXECUTION_MODEL_AND_STABILIZATION_STRATEGY.md

# Crew Companion — Execution Model & Stabilization Strategy

## Introducción

Crew Companion se encuentra en una etapa extremadamente delicada y estratégica.

El proyecto ya superó:
- la etapa de idea,
- la etapa de demo conceptual,
- y parcialmente la etapa de prototipo funcional.

Sin embargo:
todavía NO ha cruzado el umbral hacia un runtime profesional estabilizado.

Actualmente existen dos sistemas coexistiendo:

1. El sistema conceptual correcto.
2. El sistema técnico heredado del hackathon.

La prioridad inmediata ya no debe ser:
- añadir features,
- añadir surfaces,
- añadir agentes,
- ni aumentar complejidad visual.

La prioridad debe ser:
- estabilizar el modelo operativo,
- formalizar responsabilidades,
- desacoplar capas,
- y convertir la arquitectura en una plataforma extensible real.

Este documento consolida:
- el estado real del sistema,
- las fronteras entre infraestructura y features,
- el execution model,
- los principios no negociables,
- los riesgos existenciales,
- y la estrategia de estabilización.

---

# 1. Estado Real del Sistema

---

# 1.1 Qué YA es una Base Profesional

---

## Separación Arquitectónica

La división:

- Frontend
- BFF
- Runtime Agentic

es correcta y extremadamente valiosa.

Esto permite:
- escalar reasoning independientemente,
- reemplazar frontends,
- introducir runtimes alternativos,
- soportar desktop/web híbrido,
- y desacoplar visualización de inteligencia.

Esta decisión debe preservarse.

---

## Filosofía Semántica

La tesis principal del proyecto:

```text
tipo de dato -> tipo de interfaz

es el núcleo conceptual correcto.

Esto evita:

dashboards genéricos,
widgets arbitrarios,
visualizaciones sin intención.

La UI debe ser:

contextual,
semántica,
operativa,
y derivada del estado real.
Modelo de Dominio Tipado

La sincronización:

Python TypedDicts,
interfaces TS,
envelopes estructurados,

es una base profesional sólida.

Esto reduce:

ambigüedad,
drift,
inconsistencias runtime.
Sistema de Urgencia

El modelo:

Normal
Focus
Warning
Panic

es una de las piezas más maduras del sistema.

Porque:

altera comportamiento,
altera densidad,
altera prioridad,
altera surfaces,
altera ritmo operativo.

No es una animación.
Es un motor operativo.

1.2 Qué Sigue Siendo Hackathon Code
SurfaceRenderer

Actualmente:

switch(surface.type)

Esto NO es:

un runtime,
un registry,
un orchestration system.

Es:

un mapper estático.

Este es el principal cuello de botella arquitectónico.

Navegación por Rutas
/leader
/member
/docs

contradice completamente:

continuidad contextual,
runtime líquido,
spatial persistence.

La arquitectura actual todavía piensa en:
“páginas”.

El sistema futuro debe pensar en:
“workspace continuo”.

Seed Data y Persistencia

El uso de:

crew.seed.json
simulaciones manuales
urgencia artificial

indica que:
todavía existen piezas demo-driven.

Mascota SVG

Actualmente:

es ornamental,
no sistémica,
y consume complejidad desproporcionada.

No debe seguir expandiéndose antes de estabilizar runtime.

2. Separación Fundamental — Kernel vs Surfaces
2.1 Qué es Kernel

El Kernel NO es visual.

El Kernel es:

reasoning contracts,
orchestration,
capability validation,
lifecycle management,
layout negotiation,
auditability,
persistence,
contextual routing.
2.2 Qué son Surfaces

Las surfaces NO deben contener lógica sistémica.

Son:

representaciones semánticas,
módulos visuales,
outputs operativos,
interfaces contextuales.

Las surfaces deben ser:

reemplazables,
registrables,
versionables,
extensibles.
2.3 Error Arquitectónico Peligroso

NO mezclar:

reasoning,
layout,
visual logic,
orchestration,
permissions,

dentro del agente.

Ese camino destruye mantenibilidad.

3. Modelo Formal de Ejecución
3.1 El Agente Decide Intención

Responsabilidades:

interpretar contexto,
detectar fase,
seleccionar semantic intent,
priorizar información,
proponer surfaces.

El agente NO debe:

escribir JSX,
controlar layout exacto,
decidir tamaños,
decidir navegación,
controlar permisos.
3.2 El Runtime Decide Composición

Responsabilidades:

montar surfaces,
gestionar lifecycle,
negociar layout,
resolver conflictos espaciales,
gestionar densidad visual,
manejar persistence,
aplicar loading strategies.

El runtime es:
un sistema operativo visual.

3.3 Security Layer Decide Viabilidad

Responsabilidades:

validar capabilities,
aplicar policy rules,
exigir confirmations,
bloquear acciones destructivas,
registrar auditoría.
3.4 Usuario Decide Autoridad Final

El usuario:

aprueba,
rechaza,
ancla,
reorganiza,
prioriza.

El sistema NO debe remover autoridad humana.

Debe amplificarla.

4. Riesgos Existenciales
4.1 Fatiga Cognitiva

El riesgo más grande.

La mutabilidad total:

destruye memoria muscular,
genera ansiedad,
reduce throughput,
rompe predictibilidad.
4.2 Explosion de Complejidad

Cada:

surface,
agente,
plugin,
integration,
capability,

incrementa complejidad sistémica.

Sin Kernel estable:
todo colapsará.

4.3 Prompt Explosion

Un mega prompt:
eventualmente muere.

Razones:

contexto gigante,
reasoning inconsistente,
costos altos,
alucinaciones,
routing ambiguo.
4.4 Authority Leakage

El agente jamás debe:

poseer autoridad implícita,
ejecutar acciones críticas automáticamente,
controlar sistemas externos sin policy layer.
5. Principios NO Negociables
5.1 Rol + Fase + Estado

La UI SIEMPRE debe derivarse de:

Role + Phase + State

Esto es:
la fuente de verdad del sistema.

5.2 Separación Kernel/UI

El reasoning jamás debe depender:

de componentes visuales,
de JSX,
de estructuras frontend.
5.3 Semantic Visual Grammar

Cada tipo de dato debe tener:

gramática visual consistente,
semántica estable,
comportamiento predecible.
5.4 Persistencia Cognitiva

Debe existir:

continuidad espacial,
regiones persistentes,
anchors visuales,
pinning.
6. Qué Debe Simplificarse
Mascota

Reducir complejidad.

Surface Variety

Menos surfaces.
Más profundidad operacional.

Multi-Agent

NO todavía.

Primero:
un runtime correcto.

Hyper-generation

Reducir mutabilidad.

7. Estrategia Correcta de Estabilización
FASE 1 — Surface Runtime

Construir:

registry,
manifests,
contracts,
lifecycle system,
loading pipeline.

Nada más importante.

FASE 2 — Layout Grammar

Definir:

regiones persistentes,
regiones dinámicas,
overlays,
priority negotiation.
FASE 3 — Capability Security

Implementar:

capability engine,
policy layer,
audit logs,
confirmation gates,
sandboxing.
FASE 4 — Persistence Real

Eliminar:

seed.json,
demo state,
artificial simulation.

Introducir:

workspaces,
tenant isolation,
scoped memory,
persistent threads.
FASE 5 — Runtime Expansion

Solo entonces:

plugins,
SQL surfaces,
infra tooling,
specialist agents,
external integrations.
8. Qué NO Debe Hacerse Ahora

NO:

crear decenas de surfaces nuevas,
construir mobile,
construir multi-agent complejo,
añadir automatización peligrosa,
conectar producción real,
priorizar polish visual extremo.
9. Conclusión

Crew Companion NO debe evolucionar hacia:

un dashboard,
un chatbot con widgets,
una UI generativa caótica.

Debe evolucionar hacia:

Un Runtime Operativo Cognitivo

donde:

el agente interpreta,
el runtime gobierna,
la seguridad controla,
las surfaces representan,
y el usuario mantiene autoridad final.