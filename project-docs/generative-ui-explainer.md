# Capítulo 1 — Generative UI y Agentic Interfaces

> Referencia del hackathon: [Generative UI Global Hackathon: Agentic Interfaces — AI Tinkerers](https://sf.aitinkerers.org/p/generative-ui-global-hackathon-agentic-interfaces-sf)  
> Presentado por AI Tinkerers, Google DeepMind y CopilotKit. 18 ciudades, 4 continentes, build sincronizado de 6 horas.

---

## Para quien no conoce el tema

### El problema con las interfaces de IA actuales

Abrís una app de IA. Hay un cuadro de texto. Escribís algo. Aparece texto. En el mejor caso, el texto tiene formato markdown y un botón de "copiar".

Eso es básicamente todo. Y no es que los modelos sean malos — GPT-4, Gemini, Claude pueden razonar, planificar y ejecutar tareas complejas. El problema es que los metemos en cajas diseñadas para calculadoras del año 2005.

Es como contratar a un arquitecto brillante y darle solo un bloc de notas. La inteligencia existe. El canal para expresarla, no.

### ¿Qué cambia con Generative UI?

Generative UI invierte el control. En lugar de que el desarrollador decida qué pantallas existen y el usuario navegue entre ellas, el **agente decide en tiempo real qué mostrar** basándose en el contexto.

No es personalización en el sentido cosmético ("tu color favorito"). Es adaptación semántica: la interfaz responde al estado real del trabajo.

Ejemplo concreto. Misma app, mismo usuario, dos momentos distintos:

- **Martes 10am, deadline en 2 semanas** → el workspace muestra una vista espaciosa con sugerencias de tareas, métricas de milestone, el asistente tranquilo
- **Domingo 11pm, demo mañana a las 9, 3 bloqueadores sin resolver** → el workspace colapsa a modo crisis: bloqueadores arriba, countdown visible, todo lo no-crítico desaparece

Nadie configuró eso. El sistema detectó la urgencia desde el deadline y reorganizó la interfaz solo.

### Los tres niveles de interfaces agénticas

Pensalo como un espectro de cuánta agencia tiene el agente sobre la UI:

**Nivel 1 — El agente genera contenido**
El modelo produce texto, listas, código. La UI es fija; el contenido varía. La mayoría de apps de IA están aquí hoy.

**Nivel 2 — El agente genera componentes**
El agente emite mensajes tipados que el frontend mapea a componentes React específicos. La UI cambia según el agente decide qué panel mostrar, con qué datos, en qué zona. *Crew Companion opera aquí.*

**Nivel 3 — El agente genera la aplicación**
El agente escribe código ejecutable que corre sandboxeado en el cliente. Pedís "visualizá este algoritmo" y el agente genera e instancia el componente en vivo. [OpenGenerativeUI de CopilotKit](https://github.com/CopilotKit/OpenGenerativeUI) explora este territorio.

### ¿Para qué sirve en la práctica?

Una agentic interface no es "un chatbot con botones lindos". Es un sistema donde el agente tiene información del contexto que el usuario no debería tener que expresar manualmente: quién sos en el equipo, qué tan urgente es la situación, qué está bloqueando el trabajo.

Cuando la interfaz responde a ese contexto automáticamente, el software deja de ser una herramienta que usás y empieza a comportarse como un colaborador que adapta cómo trabaja con vos.

---

## Deep dive técnico

### El protocolo AG-UI

[AG-UI](https://docs.ag-ui.com/introduction) (Agent-User Interaction Protocol) es el estándar abierto creado por CopilotKit que define cómo los agentes se comunican con el frontend. Es liviano, basado en eventos, y corre sobre HTTP estándar o WebSocket.

En lugar de que el agente responda con strings de texto, emite una **secuencia de eventos JSON tipados**:

```
MESSAGE_START          → el agente empieza a escribir
TEXT_MESSAGE_CONTENT   → chunk de texto (streaming)
MESSAGE_END            → texto completo
TOOL_CALL_START        → el agente va a ejecutar una tool
TOOL_CALL_END          → tool ejecutada, resultado disponible
STATE_DELTA            → patch al estado compartido agente/frontend
RUN_COMPLETED          → ciclo terminado
```

El `STATE_DELTA` es el evento más importante para Generative UI. Cuando el agente llama una frontend tool como `renderSurface`, el delta de estado incluye qué superficie montar, con qué datos, y en qué zona del workspace. El frontend reacciona a ese delta sin necesitar lógica de parsing de texto.

**¿Por qué un protocolo y no llamadas directas?**

Sin un protocolo estándar, cada proyecto inventa su propia comunicación agente → UI. Eso significa:
- Imposible reutilizar componentes entre proyectos
- Imposible integrar agentes de distintos proveedores
- Cada cambio de LLM requiere reescribir el glue code

AG-UI es para los agentes lo que HTTP fue para la web: un contrato compartido que desacopla quién produce de quién consume.

### A2UI — La propuesta complementaria de Google

[A2UI (Agent-to-User Interface)](https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/) es la especificación abierta de Google DeepMind, anunciada en el hackathon. Donde AG-UI define el protocolo de eventos (el *cómo* fluye la información), A2UI define la declaración semántica (el *qué* quiere el agente mostrar).

Con A2UI, el agente no dice "llama a esta función con estos parámetros". Dice "quiero mostrar un panel de tareas con estas propiedades" y el frontend decide la implementación visual. Esto separa la intención (agente) de la representación (frontend).

La convergencia de AG-UI + A2UI representa la apuesta de la industria: que los interfaces ya no se diseñarán una vez para siempre, sino que serán compostos en tiempo real por agentes que conocen el contexto mejor que cualquier wireframe estático podría anticipar.

### CopilotKit — La implementación de referencia

[CopilotKit](https://www.copilotkit.ai/) implementa AG-UI en React/Next.js (frontend) y en Node/Python (servidor BFF). Sus primitivas centrales:

**`useFrontendTool`** — registra una función que el agente puede invocar para modificar la UI:
```typescript
useFrontendTool({
  name: 'renderSurface',
  description: 'Monta un panel de UI en el workspace',
  parameters: z.object({ envelope: AnyEnvelopeSchema }),
  render: ({ args }) => {
    // el agente llamó renderSurface → este código corre en el cliente
    return <SurfaceHost envelope={args.envelope} />
  },
})
```

**`useAgent`** — sincroniza el estado del agente Python con el estado React en tiempo real. Cuando el agente ejecuta `setState({ mascotMood: 'panicking' })` en Python, el componente React re-renderiza con el nuevo estado via `STATE_DELTA`.

**`CopilotRuntime`** — el servidor BFF que conecta el frontend con el agente LangGraph. Maneja el protocolo AG-UI, la autenticación de threads, y el streaming de eventos.

### El protocolo de envelopes de Crew Companion

Por encima de AG-UI, Crew Companion implementa su propio protocolo de envelopes para las instrucciones de render. Cada mensaje del agente al Surface Registry es un envelope tipado y validado por Zod:

```typescript
const FullEnvelopeSchema = z.object({
  envelopeId:           z.string(),           // ID único por emisión
  agentId:              z.string(),           // qué agente emitió
  emittedAt:            z.number(),           // timestamp Unix ms
  intent:               z.string(),           // intención semántica
  priority:             z.enum(['low','medium','high','critical']),
  surfaceId:            z.string(),           // qué componente montar
  payload:              z.record(z.unknown()), // datos del componente
  context:              z.object({
    role:               z.string(),
    phase:              z.string(),
    hasActiveBlocker:   z.boolean(),
    workspaceId:        z.string(),
  }),
  requiredCapabilities: z.array(z.string()),  // capabilities necesarias
  hibernatable:         z.boolean(),          // ¿puede dormir?
  pinnable:             z.boolean(),          // ¿puede el usuario fijarlo?
  ephemeral:            z.number().optional(), // TTL en ms (si aplica)
})
```

**¿Por qué Zod y no solo TypeScript?**

TypeScript es verificación en compile-time. Zod es verificación en runtime. Los envelopes llegan por WebSocket desde un proceso Python separado — TypeScript no puede verificarlos porque ya no es tiempo de compilación. Zod valida el shape en el momento en que el mensaje llega al cliente. Si el agente emite un envelope malformado, se descarta antes de llegar al Surface Registry. La UI nunca renderiza output no verificado.

### El Surface Registry — El mapeador de intenciones

El Surface Registry es el módulo que convierte `surfaceId: "triage-war-room"` en el componente `TriageWarRoom` con su manifiesto. Cada superficie registra:

```typescript
// manifest.ts de TriageWarRoom
export const manifest: SurfaceManifest = {
  surfaceId: 'triage-war-room',
  component:  TriageWarRoom,
  region:     'primary-workzone',
  phases:     ['panic'],               // solo válido en fase panic
  capabilities: ['render_triage'],
  pinnable:   false,
  hibernatable: false,
}
```

El flujo completo cuando el agente emite un envelope:

```
Agente Python emite envelope con surfaceId: "triage-war-room"
           │
           ▼ WebSocket (AG-UI STATE_DELTA)
Zod valida el envelope
           │ (descarte si inválido)
           ▼
Surface Registry busca manifest por surfaceId
           │
           ▼
Policy Engine verifica requiredCapabilities
           │ (bloquea si no tiene capabilities)
           ▼
Layout Engine asigna región y resuelve conflictos
           │
           ▼
TriageWarRoom montado en primary-workzone
```

Ningún paso conoce los detalles del siguiente. El agente no sabe en qué zona vive la superficie. El Layout Engine no sabe qué decidió el agente. Cada capa tiene un contrato único.

### Las frontend tools como API del agente

Las frontend tools son el mecanismo por el cual el agente Python controla el estado del cliente React. Se declaran en el cliente (`useFrontendTool`) y el agente las llama como si fueran funciones Python:

| Tool | Qué hace | Quién la usa |
|---|---|---|
| `renderSurface` | Monta un componente en el workspace | Todos los agentes |
| `setMascotMood` | Cambia humor + habla del Companion | Todos los agentes |
| `logActivity` | Agrega evento al activity stream | Todos los agentes |
| `highlightTasks` | Resalta IDs de tasks en la UI | Planner |
| `reportBlocker` | Crea bloqueador visible | Coach |
| `updateTask` | Actualiza estado de task en tiempo real | Planner, Coach |
| `setCrewState` | Patch directo al estado completo | Orchestrator |

Este set de tools es el "vocabulario" del agente para hablar con la UI. Si una acción no está en este set, el agente no puede ejecutarla — por diseño.

---

## Recursos y enlaces de interés

### Protocolos y estándares
- [AG-UI Protocol — Docs oficiales](https://docs.ag-ui.com/introduction)
- [AG-UI GitHub — ag-ui-protocol/ag-ui](https://github.com/ag-ui-protocol/ag-ui)
- [Introducing AG-UI: The Protocol Where Agents Meet Users](https://webflow.copilotkit.ai/blog/introducing-ag-ui-the-protocol-where-agents-meet-users)
- [AG-UI Overview — DataCamp Tutorial](https://www.datacamp.com/tutorial/ag-ui)
- [A2UI — Sitio oficial](https://a2ui.org/)
- [Introducing A2UI — Google Developers Blog](https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/)
- [AG-UI Integration — Microsoft Learn](https://learn.microsoft.com/en-us/agent-framework/integrations/ag-ui/)

### CopilotKit
- [CopilotKit — Sitio oficial](https://www.copilotkit.ai/)
- [CopilotKit — Generative UI explicado](https://www.copilotkit.ai/generative-ui)
- [CopilotKit — AG-UI Protocol](https://www.copilotkit.ai/ag-ui)
- [CopilotKit + LangGraph en minutos](https://www.copilotkit.ai/blog/easily-build-a-ui-for-your-ai-agent-in-minutes-langgraph-copilotkit)
- [CopilotKit Docs — Generative UI con LangGraph](https://docs.copilotkit.ai/langgraph/generative-ui)
- [OpenGenerativeUI — CopilotKit GitHub](https://github.com/CopilotKit/OpenGenerativeUI)
- [CopilotKit GitHub](https://github.com/copilotkit/copilotkit)
- [The Developer's Guide to Generative UI in 2026](https://www.copilotkit.ai/blog/the-developer-s-guide-to-generative-ui-in-2026)

### Hackathon
- [Generative UI Global Hackathon — AI Tinkerers SF](https://sf.aitinkerers.org/p/generative-ui-global-hackathon-agentic-interfaces-sf)
- [Hackathon Results — AI Tinkerers](https://sf.aitinkerers.org/hackathons/h_FZX7ihFWcHA)
- [AI Tinkerers — Generative UI en Medellín](https://medellin.aitinkerers.org/p/generative-ui-global-hackathon-agentic-interfaces-medellin)
- [AI Tinkerers — Generative UI en Hyderabad](https://hyderabad.aitinkerers.org/p/generative-ui-global-hackathon-agentic-interfaces-hyderabad)
- [Generative UI Hackathon Hong Kong — YouTube](https://www.youtube.com/watch?v=vJZyF-6oB8w)
- [AI Tinkerers — Todos los eventos](https://aitinkerers.org/events)

### Frameworks y herramientas relacionadas
- [LangGraph — Agent Orchestration](https://www.langchain.com/langgraph)
- [Zod — TypeScript schema validation](https://zod.dev)
- [Awesome LangGraph — índice del ecosistema](https://github.com/von-development/awesome-LangGraph)

### Código del proyecto
- [Crew Companion — GitHub](https://github.com/Miltondz/crew-companion)
