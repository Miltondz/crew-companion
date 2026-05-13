# Generative UI e Interfaces Agénticas — El Nuevo Paradigma

> Referencia del hackathon: [Generative UI Global Hackathon: Agentic Interfaces — AI Tinkerers](https://sf.aitinkerers.org/p/generative-ui-global-hackathon-agentic-interfaces-sf)  
> Presentado por AI Tinkerers, Google DeepMind y CopilotKit. 18 ciudades, 4 continentes, build sincronizado de 6 horas.

---

## El problema con las interfaces de IA actuales

La mayoría de las apps de IA hoy funcionan así: el usuario escribe algo, el modelo genera texto, el texto aparece en pantalla. En el mejor caso, el texto viene con algo de formato markdown. Es básicamente un chat que parece terminal de los años 80 con mejor CSS.

El problema no es el modelo — los modelos ya son capaces de razonar, planear, y ejecutar tareas complejas. El problema es la interfaz. Estamos tomando una inteligencia que puede componer acciones, coordinar herramientas y adaptar su comportamiento al contexto, y la metemos en un cuadro de texto.

Es como darle a un arquitecto un bloc de notas y pedirle que "diseñe ahí dentro".

---

## ¿Qué es Generative UI?

Generative UI es el paradigma donde **la interfaz misma es generada por el agente en tiempo real**, no definida de antemano por el desarrollador.

En lugar de construir pantallas fijas que el usuario navega, el agente decide:
- Qué componente mostrar
- Con qué datos
- En qué zona de la pantalla
- Con qué ciclo de vida (temporal, persistente, interactivo)

El desarrollador define los componentes disponibles. El agente elige cuándo y cómo usarlos basándose en el contexto — quién es el usuario, qué está pasando, qué urgencia existe, qué acaba de ocurrir.

### La diferencia en términos concretos

| AI tradicional | Generative UI |
|---|---|
| El desarrollador decide qué mostrar | El agente decide qué mostrar |
| UI estática, navegación manual | UI emergente, contexto-aware |
| El modelo genera texto | El modelo genera componentes tipados |
| "Chat con acceso a tools" | "Runtime donde el agente es el director de la interfaz" |

---

## El protocolo AG-UI

El [AG-UI Protocol](https://docs.ag-ui.com/introduction) es el estándar abierto que hace posible esto a escala. Fue creado por CopilotKit y es el corazón técnico del hackathon.

### ¿Qué hace?

AG-UI estandariza cómo los agentes se comunican con el frontend. En lugar de responder con strings de texto, el agente emite **eventos JSON tipados** que fluyen sobre HTTP o WebSocket:

- `MESSAGE_START` / `MESSAGE_END` — texto del agente
- `TOOL_CALL_START` / `TOOL_CALL_END` — el agente ejecuta una herramienta
- `STATE_DELTA` — patch al estado compartido frontend/agente
- `RUN_COMPLETED` — ciclo finalizado

Esto permite que el frontend reaccione a **intenciones del agente**, no solo a texto. Cuando el agente llama `renderSurface({ surface_id: "triage-war-room", payload: {...} })`, el frontend sabe exactamente qué componente montar, dónde, y con qué datos.

### Por qué importa

Antes de protocolos como AG-UI, cada app de agentes inventaba su propio protocolo de comunicación. Era imposible reutilizar componentes entre proyectos o integrar agentes de distintos proveedores. AG-UI es para los agentes lo que HTTP fue para la web — un contrato compartido que desacopla quién produce de quién consume.

---

## A2UI — La propuesta de Google

[A2UI (Agent-to-User Interface)](https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/) es la propuesta paralela de Google DeepMind. Mientras AG-UI se enfoca en el protocolo de eventos, A2UI define una spec declarativa: el agente describe **qué UI quiere** (estructura, datos, acciones) y el frontend la renderiza.

La convergencia de AG-UI + A2UI representa la apuesta de la industria: los interfaces ya no serán diseñados una vez — serán compostos en tiempo real por agentes que conocen el contexto mejor que cualquier wireframe estático podría anticipar.

---

## CopilotKit — El SDK que conecta todo

[CopilotKit](https://www.copilotkit.ai/) es el "frontend stack for agents". Implementa AG-UI del lado del cliente (React/Next.js) y del servidor (Node/Python), y provee:

- **`useFrontendTool`** — registra herramientas que el agente puede llamar para modificar la UI
- **`useAgent`** — sincroniza el estado del agente con el estado React en tiempo real
- **`CopilotRuntime`** — el servidor BFF que conecta el frontend con cualquier agente LangGraph/LangChain

En Crew Companion, CopilotKit es la capa de transporte. Los agentes Python llaman frontend tools (`renderSurface`, `setMascotMood`, `logActivity`) y el cliente React los ejecuta instantáneamente via WebSocket. El estado del agente y el estado de la UI son **un solo objeto** sincronizado en tiempo real.

---

## Agentic Interfaces — Más allá del chat

Una agentic interface no es un chat con superpoderes. Es una interfaz donde el agente tiene **agencia sobre la UI misma**.

Tres niveles:

### Nivel 1 — El agente genera contenido
El modelo produce texto, markdown, código. La UI es fija, el contenido varía. _La mayoría de las apps de IA hoy están aquí._

### Nivel 2 — El agente genera componentes
El modelo emite envelopes tipados. El frontend mapea cada envelope a un componente React. La UI cambia según el agente decide qué mostrar. _Crew Companion opera aquí._

### Nivel 3 — El agente genera la aplicación entera
El modelo produce código ejecutable que se sandboxea y corre en el cliente. [OpenGenerativeUI](https://github.com/CopilotKit/OpenGenerativeUI) de CopilotKit explora este territorio: pedís "visualizá este algoritmo" y el agente escribe y ejecuta el componente en vivo.

---

## El rol del contexto

Lo que hace poderosas a las agentic interfaces no es que el agente pueda "hacer cosas" — es que **sabe en qué contexto está**. En Crew Companion, el contexto tiene cuatro dimensiones:

1. **Rol** — ¿sos líder o miembro del equipo?
2. **Nivel técnico** — ¿querés el detalle técnico o la versión plain language?
3. **Fase de urgencia** — ¿estás en modo normal, focus, urgent, panic, o expirado?
4. **Bloqueadores activos** — ¿hay algo bloqueando al equipo ahora mismo?

Esas 4 dimensiones producen un workspace diferente para cada persona en cada momento. No es personalización en el sentido de "tu color favorito" — es **adaptación semántica**: la interfaz responde al estado real del trabajo.

---

## El hackathon

El **Generative UI Global Hackathon** fue organizado por AI Tinkerers simultáneamente en 18 ciudades (incluyendo [Medellín](https://medellin.aitinkerers.org/p/generative-ui-global-hackathon-agentic-interfaces-medellin)). 6 horas de build, prototipos funcionales (no slides). Los participantes aprendieron AG-UI, A2UI y MCP Apps hands-on y construyeron apps que demuestran el paradigma en acción.

Crew Companion fue construido en el contexto de este hackathon como una exploración de hasta dónde se puede llevar el concepto de generative UI cuando se aplica no solo a componentes individuales sino a la arquitectura completa de un workspace de equipo.

---

## Recursos

- [AG-UI Protocol — Docs oficiales](https://docs.ag-ui.com/introduction)
- [CopilotKit — Generative UI](https://www.copilotkit.ai/generative-ui)
- [CopilotKit — AG-UI](https://www.copilotkit.ai/ag-ui)
- [A2UI — Google](https://a2ui.org/)
- [Generative UI Global Hackathon — AI Tinkerers SF](https://sf.aitinkerers.org/p/generative-ui-global-hackathon-agentic-interfaces-sf)
- [Hackathon Results](https://sf.aitinkerers.org/hackathons/h_FZX7ihFWcHA)
- [OpenGenerativeUI — CopilotKit GitHub](https://github.com/CopilotKit/OpenGenerativeUI)
- [The Developer's Guide to Generative UI in 2026](https://www.copilotkit.ai/blog/the-developer-s-guide-to-generative-ui-in-2026)
- [LangGraph — Agent Orchestration Framework](https://www.langchain.com/langgraph)
