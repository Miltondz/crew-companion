# El Stack Técnico de Crew Companion — Por Qué Cada Pieza Existe

> Este documento explica las decisiones técnicas detrás de Crew Companion: qué tecnología se usa, por qué se eligió esa y no otra, y qué problema resuelve. Está escrito para developers que quieren entender el razonamiento, no solo el inventario.

---

## La pregunta que guió todo

La pregunta de diseño de Crew Companion no fue "¿cómo hago un dashboard con IA?" sino:

> **¿Cómo construyo un runtime donde la interfaz emerge del contexto en lugar de ser navegada?**

Esa pregunta cambia todo. No necesitás un UI framework que haga tu vida más fácil dibujando pantallas — necesitás un sistema donde el agente sea el director de la interfaz y el frontend sea el executor.

---

## 1. LangGraph — El cerebro de los agentes

**¿Qué es?**  
[LangGraph](https://www.langchain.com/langgraph) es un framework de Python para construir agentes como grafos dirigidos. Cada nodo es un paso de procesamiento (LLM call, tool execution, decision point). Las edges controlan el flujo — incluyendo condiciones, loops y delegación entre sub-agentes.

**¿Por qué no solo LangChain o llamadas directas a la API?**  
LangChain es suficiente para cadenas lineales. Pero Crew Companion tiene 3 agentes especializados (Orchestrator, Planner, Coach) que necesitan:
- Compartir estado a través de turnos
- Delegar trabajo entre ellos con contexto preservado
- Hacer checkpointing: si el usuario cierra la app y vuelve mañana, el agente retoma exactamente donde estaba

LangGraph provee todo eso nativamente. El estado es un TypedDict en Python que persiste entre invocaciones gracias a `AsyncPostgresSaver`. Sin LangGraph, construir eso manualmente tomaría semanas.

**El modelo hub-and-spoke**  
```
Orchestrator → clasifica intención
    ├── Planner → tasks, milestones, blockers
    └── Coach → guía, documentos, rescue mode para low-tech
```

Cada agente tiene su propio conjunto de herramientas. El Orchestrator no necesita saber cómo crear un task — delega al Planner. Esto mantiene cada agente enfocado y sus prompts cortos (prompts largos = peores resultados).

**Lo malo de LangGraph**  
La curva de aprendizaje es empinada. El debugging es difícil — cuando algo falla, el stack trace del grafo no siempre te dice exactamente qué nodo rompió qué. Y la documentación asume que ya sabés cómo funcionan LangChain y los checkpointers.

---

## 2. El protocolo de envelopes — El lenguaje entre agente y UI

**¿Qué es?**  
Un envelope es un mensaje tipado que el agente emite hacia el frontend. No es texto libre — es un objeto estructurado con campos obligatorios:

```json
{
  "envelopeId": "env_abc123",
  "agentId": "planner",
  "emittedAt": 1716000000000,
  "intent": "show_triage_war_room",
  "priority": "critical",
  "surfaceId": "triage-war-room",
  "payload": { "blockers": [...], "deadline": "..." },
  "context": { "role": "leader", "phase": "panic", ... },
  "requiredCapabilities": ["render_triage"],
  "hibernatable": false,
  "pinnable": false
}
```

**¿Por qué existe este protocolo?**  
Porque necesitamos que el agente "hable" con el frontend de forma verificable. Sin un contrato tipado:
- El frontend no sabe qué componente montar
- No hay validación — cualquier output malformado puede crashear la UI
- No hay trazabilidad — no se puede auditar qué emitió el agente y cuándo

El envelope protocol es validado por **Zod** antes de llegar al Surface Registry. Si el agente emite algo que no cumple el schema, se descarta. El frontend nunca renderiza output no verificado.

**Inspiración**  
Este patrón es una versión propia del [AG-UI Protocol](https://docs.ag-ui.com/introduction) adaptada a la arquitectura específica de Crew Companion. AG-UI estandariza eventos de agente; nuestro envelope protocol estandariza la intención semántica detrás de cada render.

---

## 3. Surface Registry — El sistema nervioso de la UI

**¿Qué es?**  
Un registro en memoria que mapea `surfaceId` → componente React + manifiesto. Cada superficie declara:
- En qué zona del workspace vive (`primary-workzone`, `context-rail`, `ambient-overlay`, etc.)
- Qué capabilities requiere para montarse
- En qué fases de urgencia es válida
- Si puede ser pinned, hibernated, o es ephemeral

**¿Por qué no un switch/case o imports directos?**  
Porque con un switch/case, cada nueva superficie requiere modificar el código de routing. Con el Surface Registry, agregar una superficie nueva es:
1. Crear el componente + manifest
2. Registrar en `bootstrap.ts`
3. Agregar el `surfaceId` al prompt del agente

El código de routing no cambia. El Layout Engine no cambia. Este es el patrón que permite escalar a 14+ superficies sin que el código de orquestación explote en complejidad.

**Lo malo**  
Tiene overhead conceptual. Para un developer que llega nuevo al código, entender que `renderSurface({ surfaceId: "task-suggestion-panel" })` eventualmente monta `TaskSuggestionPanel` requiere rastrear el flujo a través de 4 capas. No es obvio.

---

## 4. Layout Engine — El árbitro de espacios

**¿Qué es?**  
Un módulo que decide qué pasa cuando dos superficies compiten por la misma zona. Define 6 regiones fijas del workspace y resuelve conflictos según prioridad, fase de urgencia, y pinning del usuario.

**Las 6 regiones**
- `command-surface` — barra top, siempre presente
- `primary-workzone` — el área principal, la que más cambia
- `context-rail` — columna derecha de contexto
- `agent-rail` — columna derecha para el Companion
- `activity-stream` — stream de eventos en la parte baja
- `ambient-overlay` — capa z-top, aparece en urgencia alta

**Pinning**  
El usuario puede "pin" cualquier superficie a su región. Las superficies pinned sobreviven re-routing del agente. Se persiste en `localStorage` — no en la base de datos, porque es preferencia personal de UI, no estado de equipo.

**¿Por qué una gramática espacial fija?**  
Porque si el agente puede poner cosas en cualquier parte, el resultado es visual chaos. La gramática espacial es el contrato que garantiza coherencia: el agente sabe exactamente qué regiones existen, el usuario sabe dónde mirar para cada tipo de información.

---

## 5. La Urgency Engine — El reloj del sistema

**La función central**  
```typescript
getUrgencyPhase(deadline: string): UrgencyPhase
// → 'normal' | 'focus' | 'urgent' | 'panic' | 'expired'
```

Esta función es la única fuente de verdad sobre el estado de urgencia. Nunca se almacena en DB, nunca se pasa como prop, nunca se configura manualmente. Se calcula en cada render desde el deadline del milestone activo.

**¿Por qué derivada y no almacenada?**  
Porque si almacenás la fase, tenés que mantenerla sincronizada. Un job que corre cada hora para actualizar la fase en DB es una fuente de bugs, drift, y stale state. Derivar desde el deadline es siempre correcto — es matemáticamente imposible que sea incorrecto.

**Qué dispara un cambio de fase**  
- Routing de superficies distinto (TriageWarRoom solo aparece en panic)
- Tema de colores del workspace
- Densidad del layout (compacto en panic, espacioso en normal)
- Estado del Companion (clima, mood, props visuales)
- Activación del CountdownCritical overlay

---

## 6. Next.js 15 App Router + React 19

**¿Por qué Next.js 15 y no Vite/Remix/otra cosa?**  
Tres razones:
1. **React Server Components** — el layout raíz es async, lee la cookie de locale en el servidor, no hay hydration flash en i18n
2. **Deploy en Vercel gratis** — sin configuración extra
3. **API Routes** — el proxy de CopilotKit, el health endpoint, y los endpoints de autenticación viven todos en el mismo proyecto

**React 19 — qué cambia**  
`useOptimistic`, mejoras en la API de transitions, y mejor rendimiento en hidratación. Para Crew Companion, lo más importante es que React 19 hace más predecible el comportamiento de estado en componentes que reciben updates frecuentes del agente via WebSocket.

**La trampa de la hidratación**  
El mayor issue que tuvimos: el locale inicializado en servidor (cookie) debe llegar al `LocaleProvider` como `initialLocale` prop para que el primer render en cliente coincida con el render del servidor. Cualquier divergencia = hydration mismatch = flash o crash silencioso. La solución fue hacer `layout.tsx` un async RSC que lee la cookie server-side y pasa `initialLocale` al provider.

---

## 7. La política de capabilities — @guarded_tool

**¿Qué es?**  
Cada herramienta Python está decorada con `@guarded_tool`, que declara:
- Qué capabilities requiere para ejecutar
- El nivel de riesgo (low / medium / high)
- El impacto esperado

```python
@guarded_tool(
    capabilities=["task.delete"],
    risk_level="high",
    impact="removes task from workspace permanently"
)
async def delete_task(task_id: str, state: CrewState) -> str:
    ...
```

**¿Por qué existe esto y no solo `if user.is_admin`?**  
Porque el modelo de seguridad basado en rol de usuario no es suficiente cuando el agente puede ejecutar acciones en nombre del usuario. Sin capability declarations, el agente podría ejecutar `delete_task` sin que el usuario lo sepa o lo haya aprobado.

El flujo es: agente llama herramienta → `PolicyEngine` evalúa capabilities → si es `high`, emite `ApprovalGate` al frontend → usuario aprueba o rechaza → herramienta ejecuta o no. El usuario siempre tiene la última palabra en operaciones destructivas.

**El audit log**  
Cada decisión del PolicyEngine (allowed / denied / pending) se registra en PostgreSQL. En entornos de producción esto es la diferencia entre "el agente borró algo" y "podemos ver exactamente qué borró, cuándo, y quién aprobó".

---

## 8. La infraestructura $0

**El constraint más importante del proyecto**  
Todo debe correr en free tier. No hay presupuesto de infraestructura. Este constraint fuerza decisiones de diseño interesantes:

| Servicio | Tier | Límite relevante |
|---|---|---|
| Vercel | Hobby | 100GB bandwidth/mes |
| Render | Free | Sleep tras 15min inactividad |
| Neon | Free | 0.5GB storage, 1 compute unit |
| Upstash | Free | 10,000 req/día |

**El problema del sleep en Render**  
El BFF+agente en Render se duerme después de 15 minutos sin tráfico. El cold start puede tomar 30-45 segundos. Para un usuario que abre la app por primera vez del día, eso es una eternidad.

Soluciones posibles:
- Keepalive ping cada 14 minutos desde el frontend (consume quota)
- UptimeRobot con ping gratuito cada 5 minutos
- Explicitar en la UI que el "arranque frío" puede tardar y mostrar un loading state amigable

**Límites de tokens**  
Para no exceder la quota de APIs:
- Chat: 200 turnos/día/workspace, 2000 global
- Generación de imágenes: 16 lifetime/workspace
- Cache agresivo: resultados de Gemini cacheados por hash de prompt
- Solo el slice relevante de estado se envía al agente — no el estado completo

---

## 9. El Companion — xstate + SVG

**¿Por qué xstate?**  
El Companion tiene 6 estados de comportamiento y 8 moods. Sin una máquina de estados, el código de "si el agente llama X entonces el companion hace Y" se convierte en una serie interminable de `if/else` con bugs de transición. xstate hace los estados explícitos, las transiciones verificables, y el comportamiento predecible.

**Por qué SVG y no Rive todavía**  
Los assets Rive (.riv) todavía no están listos. Las animaciones actuales son CSS/SVG sprites. El código está preparado para reemplazarlos con Rive sin cambiar la interface del componente — solo la implementación interna del renderer.

---

## 10. NextAuth v5 + Resend — Auth sin contraseñas

**Magic link, no passwords**  
Los usuarios reciben un link por email. No hay contraseña que robar, no hay "olvidé mi contraseña". La sesión se almacena en JWT con `AUTH_SECRET`.

**¿Por qué Resend y no SendGrid/Mailgun?**  
Free tier más generoso para proyectos pequeños (100 emails/día), API más simple, y la integración con NextAuth v5 está documentada y mantenida.

**El edge case del dev local**  
En desarrollo local, si `AUTH_SECRET` no está configurado, las rutas de API saltean el auth gate. Esto permite iterar en features sin necesitar email real funcionando. En producción, `AUTH_SECRET` siempre está presente.

---

## Resumen de decisiones

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| LangGraph sobre LangChain solo | LangChain chains | Checkpointing, multi-agent state, delegación |
| Surface Registry sobre switch/case | Routing directo | Escalabilidad, decoupling, extensibilidad |
| Urgency phase derivada | Almacenada en DB | Correctness matemática, cero drift |
| Zod para envelopes | Runtime duck-typing | Seguridad de tipos en runtime, no solo compile-time |
| xstate para Companion | useState + useEffect | Transiciones verificables, estados explícitos |
| Magic link sobre passwords | Auth tradicional | UX más simple, menos superficie de ataque |
| Free tier forzado | Cloud paid | Constraint que simplifica y disciplina el diseño |

---

## Recursos técnicos

- [LangGraph Multi-Agent — Complete Guide](https://latenode.com/blog/ai-frameworks-technical-infrastructure/langgraph-multi-agent-orchestration/langgraph-multi-agent-orchestration-complete-framework-guide-architecture-analysis-2025)
- [AG-UI Protocol Overview](https://docs.ag-ui.com/introduction)
- [CopilotKit + LangGraph Integration](https://www.copilotkit.ai/blog/easily-build-a-ui-for-your-ai-agent-in-minutes-langgraph-copilotkit)
- [Generative UI — CopilotKit Docs](https://docs.copilotkit.ai/langgraph/generative-ui)
- [xstate — State Machines for JavaScript](https://stately.ai/docs/xstate)
- [Next.js 15 App Router](https://nextjs.org/docs/app)
- [Zod — TypeScript-first schema validation](https://zod.dev)
