FRONTEND_RUNTIME_EVALUATION.md

El análisis de la documentación actual de **Crew Companion** revela un sistema en una transición crítica: posee un núcleo conceptual de alta fidelidad, pero su ejecución técnica aún arrastra lastres de su origen como prototipo acelerado. Para convertirlo en un producto profesional y escalable, es necesario separar el **razonamiento (Kernel)** del **mapeo visual (Surfaces)**.

### 1. Estado del Sistema: Producto vs. Hackathon

*   **Base de Producto Profesional:**
    *   **Desacoplamiento Arquitectónico:** La separación física de **Frontend (Next.js)**, **BFF (Hono)** y el **Agente (LangGraph/Python)** es una base sólida que permite evolucionar el razonamiento sin romper la interfaz.
    *   **Modelo de Dominio Tipado:** La existencia de un contrato de datos estricto (tasks, milestones, blockers) entre Python y TypeScript garantiza la integridad sistémica.
    *   **Filosofía Semántica:** La tesis de que el tipo de dato dicta el tipo de interfaz (causalidad → grafo, comparación → matriz) es el diferenciador competitivo real.
    *   **Lógica de Fases de Urgencia:** El motor que deriva el estado operativo (Normal → Pánico) basándose en el tiempo restante es una pieza de lógica madura.

*   **Hackathon Code / Simulación:**
    *   **SurfaceRenderer Estático:** Actualmente funciona como un simple switch/case que mapea cadenas a componentes físicos, lo que impide la extensibilidad dinámica.
    *   **Rutas Clásicas:** El uso de /leader y /member como páginas fijas contradice la visión de que "la interfaz se transforma y no se navega".
    *   **Simulación de Urgencia:** Botones manuales para "simular urgencia" y el uso de un archivo seed.json en lugar de persistencia real en base de datos.
    *   **Mascota en SVG Inline:** La implementación visual de la mascota es un placeholder; requiere una máquina de estados formal (ej. Rive) para ser profesional.

### 2. Infraestructura Core vs. Superficies Extensibles

Para evitar el colapso por complejidad, el sistema debe dividirse en dos capas:

*   **Infraestructura (Core Platform/Kernel):**
    *   **Surface Registry:** Un registro dinámico que descubra capacidades y valide contratos de datos.
    *   **Layout Engine:** Responsable de negociar la **densidad visual** y el montaje de regiones sin que el agente tenga que escribir JSX.
    *   **Capability Engine:** La capa de seguridad que autoriza qué herramientas puede usar el agente (ej. acceso a DB o Filesystem).
*   **Surfaces / Plugins:**
    *   **Componentes Visuales (T01-T08):** Deben ser "módulos" que se registran en el Core y responden a intenciones semánticas.
    *   **Agentes Especialistas:** Micro-agentes (SQL, Debug, Doc) que el orquestador invoca según la necesidad.

### 3. El Modelo de Ejecución (Execution Model)

La autoridad de decisión debe jerarquizarse para mantener la confianza del usuario:

1.  **El Agente decide la Intención:** Clasifica el contexto, selecciona la surface adecuada y prioriza los datos a mostrar.
2.  **El Runtime decide la Composición:** Valida capacidades, gestiona el ciclo de vida de los componentes y resuelve conflictos de espacio en el layout.
3.  **La Capa de Seguridad (Policy) decide la Viabilidad:** Aplica sandboxing, genera logs de auditoría y bloquea acciones destructivas no autorizadas.
4.  **El Usuario decide el Control Final:** Tiene la última palabra en acciones de alto riesgo (Confirmation Gates) y puede "anclar" (pinning) superficies para preservar su memoria espacial.

### 4. Riesgos y Elementos No Negociables

*   **Riesgos de Complejidad:** El mayor peligro es la **fatiga cognitiva** si la interfaz muta constantemente sin anclas. Esto se mitiga con **regiones persistentes** (anclas espaciales) que den estabilidad al usuario.
*   **Kernel No Negociable:** La interpretación del trinomio **Rol + Fase + Estado** debe ser la fuente única de verdad para cualquier generación de UI.
*   **Elementos a Simplificar/Retrasar:** Se debe posponer la integración de múltiples agentes complejos o animaciones hiper-pulidas hasta que el **Surface Runtime** y la seguridad de capacidades estén formalizados.

### 5. Estrategia de Estabilización y Evolución

**Orden Correcto de Evolución:**

1.  **Fase 1: Formalización del Runtime:** Convertir el SurfaceRenderer en un **Registry dinámico** con manifiestos de capacidades.
2.  **Fase 2: Gramática Espacial:** Definir qué zonas de la pantalla son persistentes (anchors) y cuáles son generativas para evitar el caos visual.
3.  **Fase 3: Seguridad de Capacidades:** Implementar el motor de políticas y los **Confirmation Gates** antes de conectar el agente a sistemas reales como bases de datos o terminales.
4.  **Fase 4: Expansión de Surfaces Fundamentales:** Construir solo las superficies que prueben la tesis (Causal Chain, Countdown crítico, Idea Matrix).

**Errores Arquitectónicos Peligrosos a Evitar:**
*   **Autoridad Implícita:** Permitir que el agente ejecute acciones sin pasar por una capa de validación auditable.
*   **Mutabilidad Total:** Creer que "todo debe ser generado"; la predictibilidad es necesaria para el uso diario profesional.
*   **Fragmentación de Lógica:** Mezclar la lógica de diseño dentro de los prompts del agente en lugar de usar contratos de datos limpios.
ahora que hacemos?
 

***

# Documento 1: CORE_DECISIONS.md
## Decisiones Oficiales, Fundacionales y No Negociables

### 1. Identidad del Sistema
*   **Definición de Producto:** Crew Companion no es un dashboard de gestión de proyectos ni un chatbot con widgets; es un **Runtime Operativo Cognitivo**.
*   **Propósito:** Actuar como un entorno de trabajo adaptativo donde la interfaz emerge y se transforma según el contexto operativo, el estado del equipo, la urgencia y la intención detectada.
*   **Valor Diferencial:** El sistema no ofrece "páginas prediseñadas", sino que genera superficies específicas en tiempo real para resolver fricciones operativas de coordinación humana.

### 2. El Ciclo de Verdad Operativa
*   **Fuente de Verdad:** Todas las decisiones de renderizado y comportamiento deben derivar estrictamente del trinomio: **Rol + Fase de Urgencia + Estado del Proyecto**.
*   **Roles y Densidad:** El sistema adapta la densidad de información y el lenguaje según el perfil (Builder, Maker, Owner, Viewer) y su nivel técnico (Low-tech vs. High-tech).
*   **Fases de Urgencia:** El ritmo visual y las acciones prioritarias están dictados por el tiempo restante al milestone (Normal, Focus, Urgent, Panic, Expired).

### 3. Distribución de Autoridad (Agent vs. Runtime)
*   **Decisión del Agente:** El agente es responsable de la **intención semántica**. Decide qué problema resolver, qué datos son relevantes y qué tipo de superficie es necesaria.
*   **Decisión del Runtime:** El runtime del frontend es responsable de la **composición y el layout**. El agente **no controla el JSX exacto** ni el posicionamiento de píxeles; el runtime organiza las regiones, negocia tamaños y resuelve conflictos espaciales.
*   **Decisión del Usuario:** El usuario mantiene el control final sobre acciones críticas (Confirmation Gates) y la capacidad de anclar (Pinning) interfaces para su propia memoria espacial.

### 4. Gramática Espacial y Persistencia Cognitiva
*   **Arquitectura Híbrida:** Se prohíbe la mutabilidad total para evitar la fatiga cognitiva. El sistema debe dividir el espacio en **regiones persistentes** (anclas visuales estables) y **zonas generativas** (donde las superficies mutan).
*   **Continuidad Espacial:** El usuario no "navega" entre páginas tradicionales; el workspace se transforma. La transición de /leader a /member es un cambio de contexto en un runtime continuo, no una carga de página aislada.
*   **Anclaje (Pinning):** El usuario puede decidir que una superficie generada pase a ser persistente en su zona de trabajo para desarrollar memoria muscular.

### 5. Gobernanza y Seguridad por Capacidades
*   **Autoridad Delegada:** El agente **no tiene autoridad implícita**. Cada acción debe ser declarativa, auditable y estar basada en **capacidades específicas** (Capabilities).
*   **Niveles de Riesgo:** Toda acción que modifique el estado real (DB, filesystem, ejecución) debe seguir niveles de aprobación, donde el nivel más alto requiere **confirmación humana con visualización de impacto (diff)**.
*   **Sandboxing:** Toda ejecución técnica generada por el agente debe ocurrir en entornos aislados para proteger la integridad de la infraestructura.

### 6. Cimientos Técnicos y Extensibilidad
*   **Plataforma Web-First:** El desarrollo actual prioriza la web por su capacidad de colaboración en tiempo real y velocidad de iteración.
*   **Arquitectura Desktop-Ready:** El núcleo (Kernel) debe estar desacoplado para permitir una transición futura a un cliente local (ej. Rust/Tauri) que integre filesystem y terminales locales.
*   **Surfaces como Módulos:** Las superficies no se importan estáticamente; se registran en un **Surface Registry** mediante manifiestos que declaran sus necesidades de datos y seguridad.

*** 

Documento 2: SURFACE_MANIFEST_SPEC.md
Especificación Técnica del Manifiesto de Superficies
1. Filosofía del Manifiesto
El Surface Manifest es la "hoja de identidad" de un componente generativo
. Su existencia permite que el Surface Registry cargue, valide y ejecute interfaces de forma dinámica
. Pasamos de una arquitectura donde el frontend "sabe" qué renderizar, a una donde el frontend "descubre" qué puede renderizar basándose en metadatos declarativos
.
2. Estructura del Esquema (JSON Schema)
Cada manifiesto debe cumplir con la siguiente estructura base:
A. Identidad y Versionado
id: Identificador único jerárquico (ej: core.coordination.causal-chain o ext.db.sql-explorer)
.
version: SemVer para gestionar la compatibilidad de los contratos de datos.
category: Clasificación operativa (coordination, debugging, decision, emergency)
.
B. Contrato de Datos (Data Contract)
inputSchema: Un JSON Schema estricto que define qué datos debe proveer el Agente para que la superficie sea válida
.
Ejemplo: Si el esquema requiere un arreglo de nodes y edges, el Runtime rechazará el renderizado si el Agente envía datos incompletos, evitando errores en tiempo de ejecución.
C. Capacidades y Seguridad (Security Context)
requiredCapabilities: Lista de permisos granulares que la superficie necesita para ser funcional
.
read:docs: Acceso a documentos compartidos.
write:tasks: Capacidad de modificar estados de tareas.
exec:db_query: Permiso para realizar consultas a bases de datos externas.
D. Modelo de Interacción y Layout
interactionModel: Define el comportamiento de vida en el workspace
.
ephemeral: Desaparece al completarse la acción (ej: un diálogo de confirmación).
persistent: Diseñada para estar abierta por largos periodos (ej: un Kanban).
overlay: Flota sobre el contenido actual (ej: alertas ambientales)
.
visualDensity: Sugerencias de tamaño (compact, standard, hero).
pinningPolicy: allowed o disallowed. Define si el usuario puede "congelar" esta interfaz en su zona de anclas
.
3. Ejemplo de Implementación: "SQL Explorer Extension"
Para entender la utilidad de este modelo, veamos cómo un tercero añadiría una superficie compleja de base de datos sin tocar el código fuente del sistema
:
{
  "id": "ext.data.sql-explorer",
  "version": "1.0.0",
  "category": "data-engineering",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string" },
      "results": { "type": "array" },
      "executionTime": { "type": "number" }
    },
    "required": ["query", "results"]
  },
  "security": {
    "requiredCapabilities": ["db.read", "db.explain"],
    "actionLevel": "confirmation_required"
  },
  "layout": {
    "defaultRegion": "workspace_center",
    "interactionModel": "persistent",
    "density": "hero"
  }
}
4. Flujo de Validación en el Runtime
Cuando el Agente envía un mensaje de tipo renderSurface, el Runtime ejecuta estas validaciones antes de importar el componente:
Validación de Esquema: ¿Los datos enviados por el Agente coinciden con el inputSchema?
Validación de Capacidades: ¿El usuario actual y el Agente tienen permiso para usar las requiredCapabilities declaradas?
Validación de Contexto: ¿Esta superficie es permitida para el Role y la Phase actuales?
Regla: Una superficie de "Exploración de Ideas" podría estar bloqueada por el manifiesto durante la fase de Panic, forzando al Agente a elegir una superficie de emergencia
.
5. Beneficios para la Extensibilidad Futura
Lazy Loading Nativo: El Runtime solo descarga el código de la superficie (SQLPanel.tsx) si todas las validaciones del manifiesto pasan
.
Gobernanza: Permite auditar qué superficies están accediendo a qué datos sensibles mediante el simple análisis de sus manifiestos
.
Ecosistema de Plugins: Facilita que desarrolladores externos creen "Specialist Agents" que vengan acompañados de sus propias superficies visuales, conectándose al sistema mediante este contrato estándar
.

Documento 3: RUNTIME_LIFECYCLE.md
Gestión de Estados y Flujos de Ejecución de Superficies
1. El Concepto de "UI como Proceso"
En un entorno tradicional, una página está "montada" o "desmontada". En Crew Companion, una superficie es un proceso de ejecución con estado. El sistema debe gestionar no solo su visibilidad, sino su relevancia contextual, sus permisos activos y su persistencia en la memoria del usuario
.
2. Máquina de Estados de la Superficie (FSM)
Cada instancia de una superficie dentro del workspace debe transitar por los siguientes estados obligatorios:
A. Registered (Registrada)
Definición: La superficie existe en el Surface Registry (metadata y manifiesto cargados).
Estado técnico: Código no descargado aún (Lazy Loading)
.
Gatillo: Inicio de la aplicación o carga de un plugin externo.
B. Requested (Solicitada)
Definición: El Agente o el contexto operativo emiten un Envelope solicitando la superficie.
Señal: intent: debuggear, phase: panic, o petición directa del usuario
.
Acción del Runtime: El Kernel intercepta el pedido y busca el manifiesto correspondiente.
C. Validated (Validada)
Definición: El Kernel verifica que se cumplen los requisitos de seguridad y datos.
Validaciones:
Data Integrity: El payload del agente coincide con el inputSchema
.
Capability Check: El usuario tiene los permisos necesarios (ej: db.read)
.
Context Match: La superficie es apropiada para la Phase y el Role actuales
.
D. Mounted (Montada)
Definición: El código se descarga y el componente se inyecta en el DOM.
Negociación de Layout: El Layout Engine decide en qué región (Generativa o Contextual) se ubica basándose en la prioridad
.
E. Active (Activa)
Definición: La superficie es plenamente funcional e interactiva.
Sincronización: Mantiene un canal bidireccional con el Agente (vía CopilotKit) para actualizaciones de estado en tiempo real
.
F. Hibernated (Hibernada / Anclada)
Definición: La superficie se mueve de una Zona Generativa a una Zona Persistente (Ancla)
.
Gatillo: El usuario hace clic en "Pin" o el Agente detecta que la herramienta será necesaria a largo plazo.
Estado: Mantiene su estado interno pero reduce su densidad visual (minimizada o colapsada).
G. Unmounted (Desmontada)
Definición: La superficie se elimina del DOM y se libera la memoria.
Gatillo: El problema se resolvió (blocker: resolved), la fase cambió o el usuario cerró la herramienta manualmente
.

--------------------------------------------------------------------------------
3. Ejemplo de Flujo: "Troubleshooting Wizard" (T07)
Para ilustrar la complejidad del runtime, analicemos el ciclo de vida de un Asistente de Errores para un miembro Low-tech
:
Requested: El usuario escribe "No puedo correr el repo". El Agente identifica intent: help-request y hasBlocker: true
.
Validated: El Kernel confirma que la superficie troubleshooting_wizard existe y que el payload contiene una pregunta válida.
Mounted: Al ser una superficie de "Resolución", el Runtime la monta en el Workspace Center, desplazando temporalmente la lista de tareas.
Active: El usuario responde "SÍ" a la primera pregunta. La superficie envía el evento al Agente, quien actualiza el payload con la siguiente pregunta.
Hibernated: El usuario necesita ver otra cosa pero no quiere perder su progreso en el Wizard. Hace clic en Pin. La superficie se encoge y se mueve al Context Rail lateral.
Unmounted: El usuario llega al final del Wizard y marca "Problema resuelto". El Runtime dispara una animación de éxito y libera el espacio para la siguiente superficie generativa.

--------------------------------------------------------------------------------
4. Reglas de Transición y Conflictos
Regla de Prevalencia de Urgencia: Si el sistema entra en fase Panic, todas las superficies en estado Active que no sean de emergencia pasan automáticamente a Hibernated o Unmounted para priorizar el Countdown Crítico
.
Límite de Densidad: El Runtime prohíbe tener más de 3 superficies en estado Active simultáneamente en la zona generativa para evitar el caos visual
. Si se solicita una cuarta, la de menor prioridad pasa a Hibernated.

Documento 4: CAPABILITY_SECURITY_MODEL.md
Modelo de Seguridad Basada en Capacidades y Gobernanza de Agentes
1. Filosofía: De Permisos a Capacidades
En el modelo actual, el Agente no "tiene acceso" a nada por defecto. En lugar de un modelo de permisos estáticos, implementamos un Modelo de Autoridad Delegada (Capabilities). Una capacidad es una clave criptográfica o un token de ejecución que permite realizar una acción específica sobre un recurso específico bajo un contexto determinado.
2. El Contrato de Capacidad (Capability Contract)
Cada acción que el Agente intente ejecutar, o cada superficie que requiera datos sensibles, debe presentar un contrato que incluya:
Actor: ID del Agente + ID del Usuario que originó la sesión.
Action: La operación técnica (ej: fs.readFile, db.executeQuery).
Resource: El objeto del cambio (ej: path/to/project, table_users).
Constraints: Limitaciones de la capacidad (ej: "solo lectura", "máximo 100 filas", "solo archivos .md").
Context: El estado del sistema en ese momento (ej: Fase de Urgencia, Rol del usuario).
3. Niveles de Riesgo y Flujos de Aprobación (Action Levels)
No todas las acciones son iguales. El sistema clasifica las intenciones en cuatro niveles:
Nivel 0: Observación (Silent Action)
Descripción: Lectura de datos no sensibles o estado interno del proyecto.
Gobernanza: Ejecución automática. Se registra en el log de auditoría pero no interrumpe al usuario.
Ejemplo: El Agente lee la lista de tareas para sugerir una nueva prioridad.
Nivel 1: Propuesta (Non-Destructive)
Descripción: Acciones que modifican el estado de la aplicación pero no de la infraestructura.
Gobernanza: El Runtime muestra una sugerencia visual. Requiere un "click" de validación del usuario.
Ejemplo: Cambiar una tarea de "Pendiente" a "En progreso".
Nivel 2: Intervención Crítica (Confirmation Gate)
Descripción: Acciones que afectan el sistema de archivos, base de datos o APIs externas.
Gobernanza: El Runtime bloquea la ejecución y abre un "Confirmation Gate".
Visualización Obligatoria: Debe mostrar un "Diff de Impacto" (ej: qué líneas de código se cambiarán o qué filas de la DB se verán afectadas).
Ejemplo: git commit, npm install, o una consulta UPDATE en SQL.
Nivel 3: Aislamiento Total (Sandboxed Only)
Descripción: Ejecución de código arbitrario o scripts de infraestructura.
Gobernanza: Solo se permite en un entorno efímero (Sandbox) y requiere doble confirmación si afecta a producción.
Ejemplo: Ejecutar un script de limpieza de datos en el servidor.
4. Casos Específicos de Implementación
A. Surface: SQL Explorer
Capability: db.read y db.explain.
Gobernanza: El Agente puede generar la query, pero el botón "Ejecutar" en la superficie es el único que puede disparar la llamada al backend. El Runtime intercepta la query y verifica que no contenga sentencias prohibidas (DROP, TRUNCATE) si la capacidad es de solo lectura.
B. Integración con Filesystem / Git
Capability: fs.write restringida al directorio del proyecto.
Gobernanza: El Agente propone un cambio en el README.md. El Runtime muestra una superficie de tipo Split Pane con el antes y el después. El cambio solo se escribe en disco cuando el usuario presiona "Aplicar cambios".
5. Audit Log Operacional (Libro de Verdad)
El sistema mantiene un registro inmutable de cada decisión de seguridad. Cada entrada contiene:
PromptID: El mensaje que originó la acción.
ReasoningStep: Por qué el agente decidió que esta acción era necesaria.
CapabilityUsed: Qué permiso se invocó.
UserApproval: Firma del usuario si fue requerida.
Result: Éxito o error de la operación.
6. Protección contra "Agentes Encadenados"
En un modelo multi-agente, existe el riesgo de que un agente engañe a otro para evadir la seguridad. El Kernel de Crew Companion aplica la regla de "Privilegio Mínimo Transmitido": si el Agente A (Orquestador) delega en el Agente B (Especialista), el Agente B solo hereda las capacidades estrictamente necesarias para su subtarea, nunca las capacidades totales del orquestador.

Documento 5: WORKSPACE_GRAMMAR.md
Gramática Espacial, Negociación de Layout y Persistencia Cognitiva
1. El Fin de la Navegación por Rutas
Como se estableció en las leyes fundacionales, Crew Companion abandona la navegación tradicional. Las rutas /leader y /member dejan de ser destinos físicos y pasan a ser filtros de contexto dentro de un Runtime Espacial Continuo. La interfaz no se recarga; se transforma.
2. Anatomía del Workspace (Zonificación)
Para preservar la memoria espacial, el viewport se divide en regiones con diferentes niveles de mutabilidad:
A. Regiones de Anclaje (Persistent Anchors) — Inmutables
Command Surface (Superior): Punto de entrada universal para lenguaje natural y comandos rápidos (⌘K). Nunca cambia de posición.
Agent Rail (Derecha): Ubicación persistente de la mascota y el canal de chat. Provee un punto de referencia emocional y conversacional estable.
Activity Stream (Lateral/Inferior): Registro histórico de eventos y cambios de estado. Permite la trazabilidad sin obstruir el trabajo.
B. Zonas Generativas (Generative Canvas) — Altamente Mutables
Primary Workzone (Centro): Área donde el agente monta la superficie dominante (ej: Force Graph o Causal Chain).
Context Rails (Laterales): Áreas para superficies de soporte o herramientas secundarias.
3. El Motor de Negociación de Layout (Layout Negotiation)
El agente no decide el posicionamiento de píxeles; solicita una Intención Visual. El Runtime resuelve los conflictos espaciales basándose en la Densidad y Prioridad.
Reglas de Resolución de Conflictos:
Regla de Prevalencia de Urgencia: Si la urgencyPhase es Panic, cualquier superficie en la Primary Workzone es desplazada o colapsada para priorizar superficies de emergencia (ej: Triage War Room).
Límite de Carga Cognitiva: No se permiten más de dos superficies activas y expandidas simultáneamente en la zona central. El Runtime colapsará automáticamente la de menor prioridad a un estado "Hibernado".
Ajuste de Densidad: Si el agente solicita montar una superficie nueva en un espacio ocupado, el Runtime negocia la densidad de la superficie existente (ej: de Hero a Compact) antes de intentar un desplazamiento total.
4. Modelo de Persistencia y Anclaje (Pinning Engine)
Para evitar que el agente "robe" herramientas útiles al usuario, se implementa la mecánica de Anclaje Manual:
Pinning: El usuario puede marcar cualquier superficie generada como "Anclada".
Efecto: Una superficie anclada queda fuera del control de limpieza del agente. Se mueve a una Zona de Persistencia y el Runtime reserva ese espacio en el layout, obligando al agente a generar composiciones alrededor de ella.
Continuidad de Sesión: Las superficies ancladas persisten a través de recargas o cambios de fase, creando un "workspace personalizado" dentro del runtime dinámico.
5. Transiciones y Memoria Muscular
Las superficies no aparecen instantáneamente (pop-in). El sistema utiliza Transiciones de Transformación:
Morfismo: Cuando una superficie muta (ej: de Checklist a Troubleshooting Wizard), los elementos comunes (títulos, botones) hacen una transición fluida vía Framer Motion para que el ojo humano siga el cambio.
Identidad de Color por Fase: Los bordes y el fondo del workspace cambian suavemente según la fase (Normal a Panic), actuando como una señal ambiental que no requiere lectura.
6. Diseño Responsivo y Niveles de Detalle
La gramática espacial se adapta al dispositivo, pero mantiene la lógica:
Desktop: Layout multizona expandido.
Mobile: Las superficies se apilan verticalmente, priorizando siempre la de mayor urgencia, con el chat accesible mediante un overlay lateral (Drawer). 