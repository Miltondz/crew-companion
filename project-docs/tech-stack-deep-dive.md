# Capítulo 2 — Building a Cognitive Operational Runtime

> Referencia: [LangGraph Multi-Agent Orchestration](https://latenode.com/blog/ai-frameworks-technical-infrastructure/langgraph-multi-agent-orchestration/langgraph-multi-agent-orchestration-complete-framework-guide-architecture-analysis-2025) · [CopilotKit Docs](https://docs.copilotkit.ai/langgraph/generative-ui) · [AG-UI Protocol](https://docs.ag-ui.com/introduction)

---

## Para quien no conoce el tema

### ¿Qué es un runtime y por qué importa la distinción?

Cuando la gente habla de "apps con IA", casi siempre se refiere a apps que tienen un chat. El chat es el canal. La IA responde dentro de ese canal.

Un **Cognitive Operational Runtime** es algo diferente: es un sistema donde la IA no solo responde dentro de un canal, sino que **opera el workspace completo**. El agente decide qué información mostrar, en qué orden, con qué urgencia, para qué persona. No es un feature de la app — es el motor que la hace funcionar.

La diferencia práctica: en un chat con IA, vos navegás la app y le preguntás cosas. En un runtime cognitivo, el sistema observa el contexto (quién sos, qué está pasando, qué tan urgente es) y reconfigura la interfaz antes de que tengas que pedirlo.

### ¿Qué es un agente de IA?

Un agente es un programa que puede:
1. Recibir una instrucción o contexto
2. Razonar sobre qué pasos tomar
3. Ejecutar herramientas (buscar datos, modificar estado, llamar APIs)
4. Observar el resultado y decidir el siguiente paso
5. Comunicar el resultado al usuario

La diferencia con un modelo de lenguaje clásico (que solo genera texto) es que el agente puede **actuar**. En Crew Companion, los agentes pueden crear tasks, resolver bloqueadores, cambiar el humor del mascot, o mostrar un panel de crisis — todo sin que el usuario lo pida explícitamente.

### ¿Por qué tres agentes y no uno?

Usar un solo agente para todo parece más simple. En la práctica, los agentes con muchas responsabilidades producen resultados peores porque sus prompts se vuelven largos y ambiguos. Un agente que tiene que manejar tasks, documentos, bloqueadores, onboarding, y crisis al mismo tiempo, tiende a confundirse sobre qué herramienta usar en cada momento.

La solución es especialización: el **Orchestrator** clasifica intenciones y delega, el **Planner** gestiona el ciclo de vida de tasks y milestones, el **Coach** maneja guía personalizada y documentos. Cada uno tiene un rol claro, un conjunto de herramientas limitado, y un prompt enfocado. El resultado es más predecible y de mayor calidad.

### ¿Qué es la "urgency phase" y por qué es central?

Crew Companion deriva automáticamente la "fase de urgencia" del deadline del milestone activo:

- `normal` — más de 48 horas. Vista completa, todo visible
- `focus` — 24-48 horas. Cues sutiles, prioridad visible
- `urgent` — 4-24 horas. Countdown activo, layout comprimido
- `panic` — menos de 4 horas. Vista de crisis, bloqueadores primero
- `expired` — deadline pasado. Modo archivo

Esta fase no se almacena en ningún lugar. Se calcula desde el deadline cada vez que se necesita. El resultado es que el sistema nunca queda desincronizado: si el deadline cambia, la fase cambia instantáneamente, y con ella el layout, el comportamiento del agente, los colores, y el mascot.

### ¿Qué es la "gramática espacial"?

Es el sistema de zonas fijas del workspace. En lugar de dejar que el agente ponga componentes donde quiera (caos visual), el workspace tiene 6 regiones predefinidas con roles claros:

- **Barra superior** → navegación y estado del proyecto
- **Zona principal** → el panel que más cambia según urgencia y agente
- **Columna de contexto** → información de apoyo (milestones, bloqueadores, documentos)
- **Columna del agente** → el Companion (mascot con estado emocional)
- **Barra inferior** → log de eventos en tiempo real
- **Overlay superior** → alertas urgentes que flotan sobre todo

El agente conoce estas zonas y sabe en cuál vive cada panel. El usuario también sabe siempre dónde mirar para cada tipo de información — porque las zonas no cambian, solo su contenido.

---

## Deep dive técnico

### LangGraph — Grafos dirigidos para orquestación de agentes

[LangGraph](https://www.langchain.com/langgraph) estructura los agentes como grafos dirigidos donde cada nodo es un paso de procesamiento (llamada a LLM, ejecución de herramienta, punto de decisión) y las edges definen el flujo, incluyendo condiciones y loops.

**¿Por qué LangGraph y no LangChain solo, o llamadas directas a API?**

| Necesidad | LangChain chains | LangGraph | Directo a API |
|---|---|---|---|
| Estado persistente entre turnos | ❌ | ✅ AsyncPostgresSaver | manual |
| Delegación entre agentes con estado compartido | limitado | ✅ nativo | manual |
| Checkpointing (retomar sesión) | ❌ | ✅ | manual |
| Streaming token a token | ✅ | ✅ | ✅ |
| Control de flujo condicional | ✅ (básico) | ✅ (grafos) | manual |

Para Crew Companion el checkpoint es crítico: cuando el usuario cierra la app y vuelve 2 días después, el agente retoma exactamente donde estaba. Sin `AsyncPostgresSaver`, eso es imposible sin construir el sistema de persistencia desde cero.

**La topología hub-and-spoke**

```python
# En apps/agent/src/agents/router.py
def should_continue(state: CrewState) -> str:
    intent = state.get("current_intent", "")
    if intent in ["task", "milestone", "blocker_resolve"]:
        return "planner"
    if intent in ["guide", "document", "rescue_mode"]:
        return "coach"
    return "orchestrator"   # respuesta directa

graph = StateGraph(CrewState)
graph.add_node("orchestrator", orchestrator_agent)
graph.add_node("planner",      planner_agent)
graph.add_node("coach",        coach_agent)
graph.add_conditional_edges("orchestrator", should_continue, {
    "planner":      "planner",
    "coach":        "coach",
    "orchestrator": END,
})
```

El `StateGraph` de LangGraph es el grafo completo. `CrewState` es el TypedDict de Python que se comparte entre todos los nodos — cuando el Planner crea un task, lo escribe en `state.tasks`, y el Orchestrator puede leerlo en el siguiente turno.

**Estado compartido y type sync**

El mismo `CrewState` existe en Python (`apps/agent/src/types.py`) y TypeScript (`apps/frontend/src/lib/crew/types.ts`). Es un invariante del proyecto que cualquier campo agregado a uno debe agregarse al otro en el mismo commit. La divergencia entre los dos tipos es silenciosa en runtime y letal en producción.

```python
# types.py — debe estar sincronizado con types.ts
class CrewState(TypedDict):
    members:              list[TeamMember]
    current_member_id:    str
    tasks:                list[Task]
    milestones:           list[Milestone]
    blockers:             list[Blocker]
    shared_documents:     list[SharedDocument]
    open_document_ids:    list[str]
    urgency_phase:        UrgencyPhase
    mascot_mood:          MascotMood
    mascot_mode:          MascotMode
    highlighted_task_ids: list[str]
    active_milestone_id:  NotRequired[str]
```

### El Capability & Policy Engine — @guarded_tool

Cuando un agente puede ejecutar acciones reales en nombre del usuario, necesitás un modelo de seguridad más granular que "el usuario está autenticado".

**`@guarded_tool`** es un decorador Python que declara las capabilities, el nivel de riesgo, y el impacto esperado antes de que la herramienta pueda registrarse:

```python
@guarded_tool(
    capabilities=["task.delete"],
    risk_level="high",
    impact="permanently removes task from workspace"
)
async def delete_task(task_id: str, state: CrewState) -> str:
    # Este código solo corre si PolicyEngine lo permite
    ...
```

El `PolicyEngine` evalúa cada call contra las capabilities declaradas. Los outcomes posibles:

- **allowed** → la herramienta ejecuta, el resultado va al audit log
- **denied** → la herramienta no ejecuta, el error va al audit log
- **pending** → se emite un `ApprovalGate` al frontend; el usuario aprueba o rechaza

```
Agente llama delete_task
         │
         ▼
@guarded_tool intercepta
         │
         ▼
PolicyEngine.evaluate(capabilities=["task.delete"], risk="high")
         │
    ┌────┴────┐
allowed    pending
    │          │
    ▼          ▼
 ejecuta   ApprovalGate → frontend
    │          │
    ▼       usuario decide
AuditLog       │
            ┌──┴──┐
          aprueba rechaza
            │      │
         ejecuta  nada
            │
         AuditLog
```

**¿Por qué el audit log importa?**

En un entorno multi-usuario donde el agente puede modificar el estado del equipo, la trazabilidad es no-negociable. Sin audit log, "el agente hizo X" es una afirmación no verificable. Con audit log en PostgreSQL, podés reconstruir exactamente qué decidió el agente, cuándo, por qué capability lo permitió o bloqueó, y quién aprobó la acción.

### El Layout Engine — Resolución de conflictos espaciales

El Layout Engine gestiona el ciclo de vida de las superficies en el workspace: montaje, hibernación, evicción, y resolución de conflictos cuando dos superficies compiten por la misma región.

**Reglas de prioridad:**

1. Superficies **pinned** por el usuario nunca son evictadas, sin importar qué emita el agente
2. Superficies con `priority: "critical"` en el envelope desplazan a las existentes
3. Si dos superficies tienen igual prioridad, gana la más reciente
4. Superficies `hibernatable: true` se pausan (no se destruyen) cuando pierden su región — su estado se preserva

```typescript
// apps/frontend/src/runtime/workspace/layout-engine.ts
mount(envelope: SurfaceEnvelope): MountResult {
  const manifest  = registry.get(envelope.surfaceId)
  if (!manifest)                         return { ok: false, reason: 'unknown-surface' }
  if (!phaseAllows(manifest, envelope))  return { ok: false, reason: 'wrong-phase' }
  if (!capabilityCheck(manifest))        return { ok: false, reason: 'missing-capability' }

  const incumbent = this.slots.get(manifest.region)
  if (incumbent && isPinned(incumbent))  return { ok: false, reason: 'region-pinned' }
  if (incumbent && incumbent.priority >= envelope.priority) {
    if (manifest.hibernatable) hibernate(incumbent)
    else evict(incumbent)
  }

  this.slots.set(manifest.region, envelope)
  return { ok: true }
}
```

**El pinning**

El usuario puede hacer pin de cualquier superficie a su región. Esto se guarda en `localStorage` — no en la base de datos — porque es una preferencia visual personal, no estado del equipo. Las superficies pinned sobreviven re-routing del agente: si tenés el `MilestoneSummaryPanel` pinned en context-rail y el agente intenta reemplazarlo con `BlockerInsightPanel`, el Layout Engine lo bloquea.

### La Urgency Engine — Matemática sobre configuración

```typescript
// apps/frontend/src/lib/crew/urgency.ts
export function getUrgencyPhase(deadline: string): UrgencyPhase {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0)                  return 'expired'
  if (diff < 4  * 60 * 60_000)   return 'panic'
  if (diff < 24 * 60 * 60_000)   return 'urgent'
  if (diff < 48 * 60 * 60_000)   return 'focus'
  return 'normal'
}
```

Esta función es la única fuente de verdad sobre urgencia en todo el sistema. No existe ningún otro lugar donde la fase se calcule, se almacene, o se derive.

**¿Por qué derivada y no almacenada?**

Almacenar la fase en DB requiere un mecanismo de actualización: un cron job, un webhook, o actualización manual. Ese mecanismo puede fallar, puede retrasarse, puede quedar inconsistente con el deadline real. Una fase derivada matemáticamente desde el deadline es correcta por definición — es imposible que esté desincronizada porque no tiene estado propio.

**Qué propaga un cambio de fase:**

```
getUrgencyPhase() cambia
        │
        ├── WorkspaceShell: color scheme del workspace
        ├── Agent prompts:  instrucciones diferentes por fase
        ├── Surface routing: TriageWarRoom solo válida en 'panic'
        ├── Layout Engine:  density compression en urgent/panic
        ├── Companion:      weather + mood via xstate PHASE_CHANGE event
        └── CountdownCritical: aparece en focus/urgent/panic
```

### El Companion — xstate como modelo de comportamiento

El Companion es una criatura con 8 moods y 6 estados de comportamiento, manejados por una máquina de estados xstate. Sin xstate, el código de "si el agente llama X entonces el companion hace Y" se convierte en una serie de `if/else` con bugs de transición de estado difíciles de reproducir.

```typescript
// apps/frontend/src/runtime/pet/pet-machine.ts
const petMachine = createMachine({
  initial: 'idle',
  states: {
    idle:        { on: { BLOCKER_CREATED: 'alert', TOOL_CALL: 'thinking', MILESTONE_COMPLETE: 'celebrating' } },
    alert:       { on: { BLOCKER_RESOLVED: 'idle', PHASE_CHANGE_PANIC: 'alert' } },
    celebrating: { after: { 3000: 'idle' } },
    thinking:    { on: { TOOL_DONE: 'idle' } },
    sleeping:    { on: { USER_ACTIVE: 'idle' } },
    guiding:     { on: { GUIDE_END: 'idle' } },
  },
})
```

Las transiciones son verificables en compile-time. Si intentás disparar un evento que no existe en el estado actual, xstate lo ignora (no lanza). El comportamiento es predecible y auditable.

**Los props visuales como estado emocional**

Cuando se crea un bloqueador, el agente llama `setMascotMood({ mood: 'worried' })`. El xstate machine transiciona a `alert`. Como efecto secundario de esa transición, se agrega una "roca" al escenario del Companion. Cuando el bloqueador se resuelve, la roca desaparece. El escenario visual refleja el estado real del trabajo — no es decoración.

### La infraestructura $0 — Constraints como disciplina de diseño

Todo Crew Companion corre en free tier. Eso no es solo una limitación económica — es un constraint de diseño que simplifica decisiones.

**El stack de producción:**

| Servicio | Tier | Límite crítico | Implicación |
|---|---|---|---|
| Vercel | Hobby | 100GB bandwidth/mes | Optimizar assets; evitar imágenes grandes |
| Render | Free | Sleep tras 15min inactivo | Cold start de 30-45s; loading state explícito |
| Neon | Free | 0.5GB storage | Audit log rotativo; no almacenar blobs |
| Upstash | Free | 10,000 req/día | Cache agresivo; no polling |

**El problema del cold start**

El BFF+agente en Render se duerme tras 15 minutos de inactividad. El primer usuario del día ve 30-45 segundos de espera. No hay forma de ocultarlo elegantemente.

Opciones:
- **Keepalive desde frontend**: ping cada 14min (consume quota de Upstash)
- **UptimeRobot**: ping gratuito externo cada 5min (la más simple)
- **Tier pago de Render**: $7/mes elimina el problema completamente

Para hackathon: acceptable. Para producto con usuarios reales: el UptimeRobot es lo mínimo.

**Los límites de tokens como parte del diseño**

```typescript
// Límites implementados en apps/frontend/src/app/api/copilotkit/route.ts
const CHAT_DAILY_LIMIT = 200  // por workspace por día

async function checkAndIncrementUsage(workspaceId: string): Promise<boolean> {
  // Atomic upsert: incrementa solo si count < límite
  const { rows } = await pool.query(`
    INSERT INTO chat_usage (workspace_id, date, count) VALUES ($1, $2, 1)
    ON CONFLICT (workspace_id, date) DO UPDATE
      SET count = chat_usage.count + 1
      WHERE chat_usage.count < $3
    RETURNING count
  `, [workspaceId, today, CHAT_DAILY_LIMIT])
  return !!rows[0]  // false = límite alcanzado
}
```

El `ON CONFLICT DO UPDATE WHERE` es un upsert condicional atómico. Si el límite ya se alcanzó, el `WHERE` falla, no hay `RETURNING`, y la función retorna `false`. Sin esta atomicidad, una race condition entre dos requests simultáneos podría exceder el límite.

### Next.js 15 App Router — El problema de la hidratación

El caso más delicado del proyecto fue el sistema de i18n. El requisito era: leer el locale desde una cookie, sin hydration flash (sin que la UI cambie de idioma visible entre el render del servidor y el render del cliente).

**La solución incorrecta:**
```typescript
// ❌ Causa hydration mismatch
function LocaleProvider({ children }) {
  const [locale, setLocale] = useState('es')
  useEffect(() => {
    const saved = document.cookie.match(/crew_locale=(\w+)/)
    if (saved) setLocale(saved[1])
  }, [])
  // El servidor renderiza 'es'. El cliente puede renderizar 'en' después del efecto.
  // React ve dos renders distintos → hydration mismatch → crash o flash.
}
```

**La solución correcta:**
```typescript
// ✅ apps/frontend/src/app/layout.tsx — async RSC
export default async function RootLayout({ children }) {
  const cookieStore = await cookies()           // lectura server-side
  const initialLocale = cookieStore.get('crew_locale')?.value === 'en' ? 'en' : 'es'

  return (
    <html lang={initialLocale}>
      <LocaleProvider initialLocale={initialLocale}>  {/* prop, no cookie read */}
        {children}
      </LocaleProvider>
    </html>
  )
}
```

El servidor lee la cookie, el cliente recibe `initialLocale` como prop, el primer render en cliente coincide exactamente con el render del servidor. Zero hydration mismatch.

---

## Resumen de decisiones técnicas

| Decisión | Alternativa | Por qué esta |
|---|---|---|
| LangGraph sobre LangChain chains | LangChain | Checkpointing, multi-agent state, delegación con estado |
| Surface Registry sobre switch/case | Routing directo | Agregar superficies sin tocar código de orquestación |
| Urgency phase derivada, no almacenada | Campo en DB | Correctness matemática garantizada, cero drift posible |
| Zod en runtime sobre solo TypeScript | TypeScript types | Verificación en runtime para datos de WebSocket externo |
| xstate sobre useState + useEffect | Lógica imperativa | Transiciones verificables, estados explícitos, no bugs de race |
| Upsert atómico para chat cap | Check → increment | Elimina race condition TOCTOU bajo carga concurrente |
| Async RSC para locale en layout | useEffect en cliente | Elimina hydration mismatch sin useEffect ni rehydration |
| `@guarded_tool` para toda herramienta | if/else en el agente | Capabilities declarativas, audit trail, ApprovalGate automático |

---

## Recursos y enlaces de interés

### Agentes y orquestación
- [LangGraph — Agent Orchestration Framework](https://www.langchain.com/langgraph)
- [LangGraph Multi-Agent — Complete Architecture Guide 2025](https://latenode.com/blog/ai-frameworks-technical-infrastructure/langgraph-multi-agent-orchestration/langgraph-multi-agent-orchestration-complete-framework-guide-architecture-analysis-2025)
- [Building Multi-Agent Systems with LangGraph — Step by Step](https://medium.com/@sushmita2310/building-multi-agent-systems-with-langgraph-a-step-by-step-guide-d14088e90f72)
- [Multi-Agent Orchestration — Simply Explained with Code](https://accelerated-ai.medium.com/multi-agent-orchestration-496ff7aa012b)
- [Multi-Agent Systems con LangGraph y Amazon Bedrock — AWS Blog](https://aws.amazon.com/blogs/machine-learning/build-multi-agent-systems-with-langgraph-and-amazon-bedrock/)
- [Awesome LangGraph — ecosistema completo](https://github.com/von-development/awesome-LangGraph)
- [Aidemy — Multi-Agent con LangGraph en Google Cloud](https://codelabs.developers.google.com/aidemy-multi-agent/instructions)

### CopilotKit y protocolos
- [CopilotKit — Generative UI con LangGraph](https://docs.copilotkit.ai/langgraph/generative-ui)
- [CopilotKit — Build UI for AI Agent en minutos](https://www.copilotkit.ai/blog/easily-build-a-ui-for-your-ai-agent-in-minutes-langgraph-copilotkit)
- [AG-UI Protocol](https://docs.ag-ui.com/introduction)
- [CopilotKit GitHub](https://github.com/copilotkit/copilotkit)

### Frontend
- [Next.js 15 App Router Docs](https://nextjs.org/docs/app)
- [React Server Components — Documentación oficial](https://react.dev/reference/rsc/server-components)
- [xstate — State Machines for JavaScript/TypeScript](https://stately.ai/docs/xstate)
- [xstate — Visualizador interactivo de máquinas de estado](https://stately.ai/viz)
- [Zod — TypeScript-first schema validation](https://zod.dev)
- [Rive — Motor de animación interactiva](https://rive.app)

### Infraestructura $0
- [Neon — Serverless PostgreSQL](https://neon.tech)
- [Upstash — Serverless Redis](https://upstash.com)
- [Render — Free tier deployment](https://render.com/pricing)
- [Vercel — Hobby tier](https://vercel.com/pricing)

### Auth
- [NextAuth v5 — Documentación](https://authjs.dev)
- [Resend — Email API](https://resend.com)

### Seguridad y patrones
- [OWASP — Top 10 API Security Risks](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)
- [PostgreSQL — Upsert ON CONFLICT](https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT)

### Código del proyecto
- [Crew Companion — GitHub](https://github.com/Miltondz/crew-companion)
