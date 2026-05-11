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