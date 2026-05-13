# Instagram Posts — Crew Companion
## 3 partes: El viaje, la app, la realidad

---

## PARTE 1 — El contexto / Por qué existe esto

---

### Post 1A — El gancho (imagen: split-screen, chat básico vs workspace adaptativo)

Todas las apps de IA se ven igual.

Un cuadro de texto. Una respuesta de texto. Tal vez un botón de "copiar". Y listo.

Y no es que los modelos sean malos — GPT-4, Gemini, Claude son genuinamente poderosos. El problema es que los estamos metiendo en cajas diseñadas para calculadoras del año 2005.

Me cansé de eso. Así que construí algo distinto.

**Crew Companion** no es un chatbot de productividad. Es un runtime donde la interfaz se adapta sola según quién sos, qué tan urgente es tu situación y qué está bloqueando a tu equipo.

Misma app. Usuario diferente. Interfaz completamente diferente.

No lo configurás. Emerge.

#GenerativeUI #AIAgents #ProductDesign #BuildInPublic #AiTinkerers

---

### Post 1B — El problema real (imagen: gif o screenshot del urgency engine en acción)

¿Qué significa que la interfaz "emerge"?

Imaginate esto:

Son las 11pm. Tenés un demo mañana a las 9. Hay 3 bloqueadores sin resolver. El agente lo sabe.

La pantalla no te muestra un dashboard limpio de 5 columnas. Te muestra **TriageWarRoom** — una vista de crisis comprimida, los bloqueadores arriba, el countdown visible, el mascot en modo pánico.

Ahora imaginate el mismo equipo, misma app, martes a las 10am, deadline en 2 semanas.

La vista es completamente distinta. Espaciosa. Con sugerencias de tasks, insights de milestone, el mascot tranquilo tomando el sol.

Nadie configuró eso. El sistema deriva la "fase de urgencia" del deadline y ajusta todo — layout, componentes, colores, comportamiento del agente — automáticamente.

Eso es lo que se llama Generative UI. Y este hackathon me dio el contexto perfecto para construirlo.

#GenerativeUI #AgenticInterfaces #UXDesign #LangGraph #CopilotKit

---

### Post 1C — El hackathon (imagen: logo AI Tinkerers + mapa con 18 ciudades)

En mayo de 2025, AI Tinkerers organizó el **Generative UI Global Hackathon: Agentic Interfaces** — simultáneamente en 18 ciudades, 4 continentes, 6 horas de build.

El desafío: construir agentes que no solo generen texto — que generen interfaces completas e interactivas en tiempo real.

Los protocolos en juego: **AG-UI** (de CopilotKit), **A2UI** (de Google DeepMind), MCP Apps.

No slides. No presentaciones. Código que funciona o no funciona.

Crew Companion fue mi apuesta. Un workspace de equipos donde tres agentes coordinados construyen la interfaz según el contexto — quién sos, qué tan urgente es, qué tiene bloqueado al equipo.

Acá les cuento cómo fue el viaje.

#AiTinkerers #Hackathon #GenerativeUI #AGUI #LangGraph #OpenSource

---

## PARTE 2 — El viaje / Cómo se construyó

---

### Post 2A — La arquitectura (imagen: diagrama de los 4 layers)

La parte más importante de Crew Companion no es el código. Es la pregunta que la guió:

**¿Cómo construís una interfaz que el agente dirige en lugar de navegar?**

La respuesta fueron 4 capas:

1. **Agent Layer** — el agente decide qué mostrar y con qué datos
2. **Runtime Layer** — el sistema decide dónde, en qué zona, con qué ciclo de vida
3. **Policy Layer** — nada ejecuta sin que se validen capabilities. Acciones destructivas requieren aprobación explícita del usuario
4. **User Layer** — el usuario siempre tiene la última palabra

No es una app de chat. Es un runtime. La diferencia importa porque un runtime tiene contratos, protocolos, y separación de concerns. Un chatbot con UI fancy no los tiene.

Cada componente que el agente puede mostrar ("superficie") tiene un manifiesto que declara en qué zona vive, qué capabilities requiere, y en qué fases de urgencia es válido. Cuando el agente emite `{ surfaceId: "triage-war-room" }`, el Surface Registry sabe exactamente qué renderizar, dónde, y con qué contexto.

Ningún switch/case. Ningún import directo. El código de routing no cambia cuando agregás nuevas superficies.

#Architecture #GenerativeUI #SoftwareDesign #ReactJS #Python

---

### Post 2B — Las partes duras (imagen: captura de terminal o código, lo honesto)

Lo que nadie te dice de construir esto:

**1. El tipo de TypeScript te va a romper los nervios**

Cuando hacés `Messages = typeof messages.en` para el sistema de i18n, TypeScript infiere literalmente cada string del idioma. Entonces `"Features"` y `"Capacidades"` son tipos incompatibles. Tuve que inventar un tipo recursivo `Stringified<T>` que preserva la estructura del objeto pero reemplaza todos los valores string con `string`. No es obvio. No está en ningún tutorial.

**2. La hidratación de Next.js es traicionera**

Si el servidor renderiza en español y el cliente hidrата en inglés (o al revés), React lanza una hydration mismatch. La solución: leer la cookie de locale en el servidor (`async RSC layout`), pasarla como prop al `LocaleProvider`. Sin `useEffect`, sin cliente-side detection. Un render, sin divergencia.

**3. Los agentes en Render se duermen**

Free tier = el servidor se duerme tras 15 minutos. El cold start puede ser 40 segundos. Para el primer usuario del día que abre la app y el agente no responde... es una mala experiencia. La solución honesta: mostrar un skeleton state mientras el agente despierta y no fingir que el problema no existe.

**4. Los prompts largos matan la calidad del agente**

Tengo 3 agentes (Orchestrator, Planner, Coach). El primero en escribir, tenía prompts de 800 tokens con TODO. Las respuestas eran genéricas. Cuando reduje cada agente a su responsabilidad específica (Planner solo sabe de tasks y milestones, Coach solo de guía y documentos), la calidad subió notablemente.

#BuildInPublic #DevLife #NextJS #TypeScript #AIEngineering

---

### Post 2C — Las partes buenas (imagen: screenshot del Companion Habitat en modo panic)

Y ahora lo bueno, porque hay bastante:

**El Companion funciona de verdad**

El mascot en el agent-rail reacciona a eventos reales: se pone en modo pánico cuando la fase cambia a `panic`, aparece un trofeo cuando se completa un milestone, se agrega una roca al escenario cuando se crea un bloqueador. No es decoración. Es estado del sistema visualizado de forma emocional.

Lo hice con xstate (máquina de estados) + CSS/SVG. Se puede reemplazar con animaciones Rive cuando tenga los assets. El código no cambia, solo el renderer.

**LangGraph + CopilotKit es una combinación poderosa**

La sincronización de estado agente ↔ React en tiempo real, con streaming, sin tener que construir el WebSocket vos mismo, es genuinamente buena DX. Cuando el agente llama `setMascotMood({ mood: "panicking" })`, el Companion reacciona en millisegundos sin ningún polling.

**La gramática espacial funciona**

Tener 6 zonas fijas en el workspace y que el agente las conozca hace que las respuestas sean predecibles para el usuario. El agente dice "mostrá el triage en primary-workzone". El usuario sabe exactamente dónde mirar.

**El stack completo corre en $0/mes**

Vercel + Render + Neon + Upstash, todos en free tier. Para un proyecto de hackathon es perfecto. Para producción real habría que pensar en el cold start de Render y los límites de Neon.

#LangGraph #CopilotKit #xstate #OpenSource #IndieHacker

---

## PARTE 3 — La realidad / Qué aprendí

---

### Post 3A — Lo que funciona (imagen: screenshot del workspace en diferentes fases)

Después del hackathon, qué quedó en pie:

**✅ El concepto central es sólido**

Que la interfaz se adapte automáticamente al contexto (rol, urgencia, bloqueadores) no solo es un buen demo — es genuinamente útil. En modo normal querés visibilidad de todo. En modo pánico querés foco en lo crítico. Forzar al usuario a navegar hasta encontrar esa vista en el momento de crisis es un fallo de diseño que la mayoría de tools tienen.

**✅ El protocolo de envelopes escala**

Empecé con 5 superficies. Terminé con 14. Agregar cada nueva fue solo: crear componente, crear manifiesto, registrar en bootstrap, agregar surface ID al prompt del agente. El código existente no se tocó. Eso es la diferencia entre una arquitectura extensible y una que se pudre con cada feature.

**✅ La política de capabilities es no-negociable en producción**

Cuando el agente puede ejecutar acciones reales en nombre del usuario (crear, modificar, eliminar cosas), necesitás un modelo de seguridad explícito. `@guarded_tool` con `ApprovalGate` para operaciones de alto riesgo no es overhead — es la única forma de que el usuario confíe en el agente con el tiempo.

#ProductDesign #GenerativeUI #AgentSecurity #BuildInPublic

---

### Post 3B — Lo que no funciona (la parte honesta)

Siendo directo:

**❌ El cold start de Render arruina la primera experiencia**

40 segundos de espera cuando el BFF+agente se durmió. No hay forma bonita de esconderlo. La solución real es o pagar el tier que no duerme ($ 7/mes en Render) o implementar un keepalive decente. Para hackathon: acceptable. Para producto real: bloqueante.

**❌ Los modelos de lenguaje son inconsistentes en el routing**

Le decís al Orchestrator "si el usuario pregunta por tasks, delegá al Planner". El 80% de las veces funciona. El 20% el Orchestrator intenta responder él mismo con menos contexto. Eso no es un bug en el código — es una realidad del uso de LLMs en flujos de control críticos. La solución parcial es reducir la ambigüedad en los prompts y aumentar los ejemplos few-shot.

**❌ El i18n fue más trabajo del esperado**

No es instalar una librería — si querés hacer bien el SSR sin hydration flash, necesitás leer la cookie en el servidor, pasar el locale como prop, y tener todos los textos del sistema en dos idiomas. Sumale que TypeScript infiere los literales y rompés el sistema de tipos cuando asignás el locale español donde esperaba inglés. Solucionable, pero son 2-3 días de trabajo silencioso que nadie ve.

**❌ El sistema de capabilidades solo funciona si los prompts son precisos**

Si el prompt del agente no menciona explícitamente qué tools están disponibles y cuándo usarlas, el agente las ignora o las usa mal. Es trabajo de prompt engineering que no termina nunca.

#HonestBuilding #AILimitations #BuildInPublic #StartupLife

---

### Post 3C — El cierre (imagen: screenshot de la landing page o el workspace completo)

¿Valió la pena?

Sí. Y no porque el producto esté terminado — no lo está.

Valió porque el hackathon me forzó a tomar decisiones en tiempo real que normalmente posponés indefinidamente. ¿Surface Registry o switch/case? Decidís ahora. ¿Urgency phase derivada o almacenada? Decidís ahora. No hay tiempo para análisis paralysis.

El resultado es un sistema que tiene un núcleo arquitectónico sólido — el Surface Registry, el Layout Engine, el protocolo de envelopes, el policy engine — sobre el cual podés construir features reales sin que el código colapse bajo su propio peso.

Lo que aprendí del paradigma de **Generative UI**:

No es solo "mostrar componentes en lugar de texto". Es cambiar quién tiene el control de la interfaz. Cuando el agente puede decidir qué mostrar basándose en contexto real — no en lo que el usuario eligió navegar — el software empieza a comportarse menos como una herramienta y más como un colaborador.

No sé si Crew Companion será un producto. Pero el patrón que demostró — que la interfaz puede ser un output del agente, no un marco que lo contiene — sí creo que es el futuro de cómo interactuamos con IA.

El repo está abierto. El stack es $0/mes. Si querés forkearlo y construir sobre esto, hacelo.

github.com/Miltondz/crew-companion

#GenerativeUI #OpenSource #AiTinkerers #Hackathon #BuildInPublic #AgenticInterfaces #LangGraph #CopilotKit

---

## Notas para publicar

**Secuencia sugerida:**
- Día 1: Post 1A (gancho visual)
- Día 3: Post 1B (problema + urgency engine)
- Día 5: Post 1C (contexto del hackathon)
- Día 7: Post 2A (arquitectura)
- Día 9: Post 2B (las partes duras)
- Día 11: Post 2C (las partes buenas)
- Día 13: Post 3A (lo que funciona)
- Día 15: Post 3B (lo honesto)
- Día 17: Post 3C (el cierre)

**Visual assets recomendados:**
- Screen recordings del workspace cambiando entre fases (normal → panic)
- Split screen antes/después (chat básico vs Crew Companion)
- Screenshot del Companion en diferentes moods
- Diagram del architecture (el que está en README)
- Terminal output del build exitoso en Vercel
