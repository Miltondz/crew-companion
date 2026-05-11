# Catálogo de interfaces — Hackathon OS

Cada entrada define un tipo de interfaz distinto: cuándo el agente lo genera, qué datos muestra, cómo el usuario interactúa, y por qué ese formato específico es el correcto para ese contenido.

La regla de diversidad: ningún bloque es "una card con texto diferente". Cada tipo tiene un modelo de interacción propio, una gramática visual propia, y una razón de existir que no puede ser reemplazada por otro tipo.

---

## 01 — Force Graph (grafo de dependencias)

**El agente lo genera cuando:** el proyecto tiene dependencias activas entre tareas, servicios o miembros del equipo, y el estado del proyecto es bloqueado o en riesgo.

**Por qué este formato:** las dependencias son relaciones, no listas. Un grafo hace visible en un vistazo qué está bloqueando qué, qué tiene el camino libre, y dónde está el cuello de botella. Una tabla de tareas no puede comunicar eso.

**Datos que muestra:**
- Nodos: tareas, personas, servicios
- Aristas: dependencias dirigidas
- Color del nodo: estado (libre / activo / bloqueado / completo)
- Grosor de arista: criticidad de la dependencia

**Modelo de interacción:**
- Click en nodo → panel lateral con detalle de la tarea/persona/servicio
- Hover en arista → tooltip con "X bloquea a Y desde hace N minutos"
- Click en nodo bloqueado → el agente genera un Decision Panel para resolución
- Drag de nodo → reorganización visual (no cambia dependencias reales)
- Botón "resolver bloqueo" en el panel lateral → el agente propone redistribución

**Apariencia:**
```
   [API Integration] ──────────────→ [Frontend render]
         │                                    │
         ↓                                    ↓
   [Auth module] ──────────── ✗ ──→ [Demo flow]
   (BLOQUEADO)                        (en espera)

   ●  = libre        ◉  = activo
   ✗  = bloqueado    ✓  = completo
```

**Señales que lo activan:** `estado=Bloqueado` OR `intent=Debuggear` OR (número de dependencias activas > 3)

---

## 02 — Countdown crítico (superficie de emergencia)

**El agente lo genera cuando:** el countdown del evento cae por debajo del umbral configurado (default: 60 minutos). Esta es la interfaz de Panic Mode.

**Por qué este formato:** cuando quedan 60 minutos, la información más importante es el tiempo. El resto de la interfaz se subordina a esa realidad. Un número grande, rojo, que late, comunica urgencia de una manera que ninguna card puede.

**Datos que muestra:**
- Tiempo restante: grande, dominante, animado
- Score de viabilidad: calculado por el agente (0–100)
- Lista de bloqueos críticos para submission: ordenados por impacto
- Features marcadas como "cortar" vs "salvar" por el agente

**Modelo de interacción:**
- El layout completo cambia: fondo se vuelve oscuro, tipografía aumenta, todo lo no esencial desaparece
- El countdown late visualmente en los últimos 10 minutos
- Cada item del checklist tiene un checkbox → al marcar, el score de viabilidad sube en vivo
- Botón "cortar feature" → confirmación con impacto estimado en tiempo recuperado
- Botón "redistribuir tarea" → el agente genera una asignación alternativa

**Apariencia:**
```
╔══════════════════════════════════════════╗
║                                          ║
║              47:23                       ║
║          [latiendo en rojo]              ║
║                                          ║
║  Viabilidad de entrega: ████████░░ 78%   ║
║                                          ║
║  ✗ Video demo no grabado        [grabar] ║
║  ✗ Repo todavía privado         [abrir]  ║
║  ✓ README completo                       ║
║                                          ║
║  Cortar: Feature C → recupera 25 min    ║
║  [Confirmar corte]  [Mantener]           ║
║                                          ║
╚══════════════════════════════════════════╝
```

**Señales que activan:** `fase=Panic` OR countdown < umbral_configurado

---

## 03 — Causal Chain (detective board)

**El agente lo genera cuando:** el usuario pega un error, log o stack trace, o cuando el agente detecta un fallo en el proyecto.

**Por qué este formato:** los errores son narrativas causales, no mensajes de texto. Visualizar la cadena de eventos que llevó al fallo activa intuición diferente a leer un stack trace. El usuario entiende *por qué* pasó antes de entender *qué* pasó.

**Datos que muestra:**
- Cards de eventos en secuencia temporal
- Flechas de causalidad entre eventos
- El "momento de quiebre" destacado visualmente
- Fix path: pasos de resolución como flujo lineal con checkboxes

**Modelo de interacción:**
- Click en cualquier card → expansión con detalle técnico
- Click en flecha de causalidad → "por qué esta relación existe"
- Checkbox en fix path → marca el paso como completado, el agente verifica
- Botón "ocultar lo que ya entiendo" → el grafo se simplifica
- Hover en card → resalta todas las cards causalmente relacionadas

**Apariencia:**
```
[npm install] → [versión incorrecta] → [❌ conflicto] → [build fail]
                                            │
                                     [MOMENTO DE QUIEBRE]
                                            │
                          ┌─────────────────┘
                          ▼
               FIX PATH:
               □ Verificar versión de Node
               □ Eliminar node_modules
               □ Re-instalar con --force
               □ Verificar .nvmrc del repo
```

**Señales que activan:** `intent=Debuggear` OR input_type=error/log/stacktrace OR `estado=Bloqueado AND rol=Builder`

---

## 04 — Idea Matrix (posicionamiento 2D)

**El agente lo genera cuando:** el equipo tiene múltiples ideas y necesita elegir, o cuando el estado del proyecto es "sin ideas" y hay que desarrollar opciones.

**Por qué este formato:** la elección entre ideas no es una lista ordenada. Es una decisión multivariable. Un mapa 2D donde cada eje representa un criterio crítico (wow factor vs viabilidad, por ejemplo) permite ver de un vistazo dónde se ubica cada idea en el espacio de decisión. Las ideas comparables se agrupan visualmente.

**Datos que muestra:**
- Cada idea como un punto/bubble en el plano 2D
- Eje X: criterio configurable (default: viabilidad en tiempo disponible)
- Eje Y: criterio configurable (default: wow factor visual)
- Tamaño del bubble: alineación con el track del evento
- Color: si ya fue evaluada por el agente o no

**Modelo de interacción:**
- Drag de los ejes → cambiar qué criterios se comparan
- Click en bubble → card expandida con el análisis del agente
- Lasso selection → comparar dos ideas seleccionadas lado a lado
- Slider "peso de criterios" → el agente reposiciona los bubbles en vivo
- Botón "elegir esta" → el bubble elegido se convierte en el proyecto activo

**Apariencia:**
```
Wow factor ↑
           │      ●Panic Mode        ●Tool Summoner
      Alto │
           │                  ●Failure Engine
      Medio│   ●Build Weather
           │
      Bajo │  ●Living README
           └──────────────────────────────→
                Baja      Media      Alta   Viabilidad
```

**Señales que activan:** `estado=Sin ideas` OR intent=Decidir OR input contiene 2+ ideas

---

## 05 — Organism Map (mapa de sistema vivo)

**El agente lo genera cuando:** el proyecto tiene servicios o componentes con estados de salud diferente, o cuando el rol es Viewer y necesita una vista del sistema sin densidad técnica.

**Por qué este formato:** los sistemas técnicos tienen comportamiento orgánico. La metáfora de organismos vivos —que respiran, que se mueven, que se enferman— activa comprensión sistémica más rápido que números o tablas. Un nodo que "late rápido" comunica sobrecarga sin que el usuario lea un número.

**Datos que muestra:**
- Cada componente/servicio como un organismo animado
- Animación de respiración → estado de salud
- Conexiones entre organismos → dependencias activas
- Corrientes de datos como líneas en movimiento entre nodos
- Color del organismo → estado (saludable/alerta/crítico/caído)

**Modelo de interacción:**
- Hover sobre organismo → datos de salud superpuestos
- Click en organismo → panel de detalle con métricas
- Click en conexión → flujo de datos entre los dos nodos
- Botón "entrar en detalle" → zoom hacia ese organismo con Force Graph interno
- Toggle "modo narrativo" → el agente describe el estado del sistema en lenguaje común

**Apariencia:**
```
     ◉ API         〰〰〰〰〰〰〰〰〰     ◉ Frontend
  [saludable]   (corriente de datos)   [saludable]
       │                                    │
       │                                    │
   ●●● │ latiendo rápido              ✗     │
       ↓                                    │
  ⚠ Database  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ → ⚠ Auth
  [sobrecarga]   (flujo interrumpido)  [en espera]
```

**Señales que activan:** (proyecto tiene servicios con estados variables) OR (`rol=Viewer`) OR (`intent=Construir AND estado=Bloqueado AND nivel_sistema=infra`)

---

## 06 — Narrative Timeline (historia del proyecto)

**El agente lo genera cuando:** el rol es Viewer u Owner, o cuando el estado del proyecto es "Listo" y hay que comunicar lo que se construyó.

**Por qué este formato:** el progreso de un hackathon es una historia con momentos clave. Una timeline narrativa —no un Gantt, no un log de commits— permite entender el arco del proyecto: qué pasó, cuándo fue el momento más difícil, cuándo se desbloqueó, cómo llegaron al estado actual.

**Datos que muestra:**
- Eje temporal horizontal con la duración del evento
- Eventos clave como hitos en la línea (idea elegida, primer commit, bloqueo, desbloqueo, feature completada)
- Textura narrativa: el agente escribe una frase corta para cada hito
- Estado actual como punto al final de la línea, con pulso animado
- Proyección: si el proyecto va a llegar a la entrega según el ritmo actual

**Modelo de interacción:**
- Scrub horizontal → viajar en el tiempo del proyecto
- Click en hito → el agente narra ese momento con más detalle
- Hover sobre la proyección → "si seguís a este ritmo, llegás con X minutos de margen"
- Botón "exportar como README" → genera la sección "lo que construimos en X horas"
- Toggle "modo jurado" → el agente reformatea la narrativa para evaluadores externos

**Apariencia:**
```
12:00   1:00    2:00    3:00    4:00    5:00   5:45
  │       │       │       │       │       │      │
  ●───────●───────●───X───●───────●───────●──────◉
Kickoff  Idea   Primer  Error  Desbloqueo Feature  AHORA
         elegida commit  crítico          core ✓
                                               [proyección →]
```

**Señales que activan:** `rol=Viewer` OR `rol=Owner` OR `fase=Demo` OR intent=compartir_progreso

---

## 07 — Command Surface (interfaz de comandos)

**El agente lo genera cuando:** el rol es Builder y el intent es construir con velocidad máxima, o cuando el usuario activa el modo "sin mouse" explícitamente.

**Por qué este formato:** los developers con ritmo de hackathon no quieren hacer click. Quieren escribir. Una command surface —similar a una command palette pero con el agente como respuesta— permite ejecutar acciones complejas en lenguaje natural sin salir del flujo de trabajo.

**Datos que muestra:**
- Input de texto grande y prominente
- Sugerencias contextuales basadas en el estado del proyecto
- Historial de comandos recientes como referencia rápida
- Resultado del último comando como feedback inline

**Modelo de interacción:**
- El usuario escribe en lenguaje natural: "marcar auth como bloqueada por falta de keys"
- El agente interpreta → muestra preview de la acción → el usuario confirma con Enter o cancela con Esc
- Shortcuts: `⌘K` para abrir, `⌘↑` para historial, `Tab` para autocompletar sugerencia
- El resultado aparece inline —no en otro panel— y el input se limpia para el siguiente comando
- El agente aprende del historial del usuario durante la sesión y prioriza los comandos usados

**Apariencia:**
```
┌──────────────────────────────────────────────────┐
│  > marcar auth como bloqueada por falta de keys  │
│    ↵ Enter para confirmar  /  Esc para cancelar   │
├──────────────────────────────────────────────────┤
│  Sugerencias:                                    │
│  → "agregar tarea: configurar env variables"     │
│  → "asignar tarea de auth a Builder"             │
│  → "marcar auth como desbloqueada"               │
├──────────────────────────────────────────────────┤
│  Último: "crear rama feature/panic-mode" ✓       │
└──────────────────────────────────────────────────┘
```

**Señales que activan:** `rol=Builder AND fase=Build` (siempre disponible via shortcut) OR explicit_request=modo_teclado

---

## 08 — Triage War Room (sala de crisis)

**El agente lo genera cuando:** `fase=Panic AND rol=Owner` o cuando múltiples bloqueos simultáneos requieren decisiones de scope urgentes.

**Por qué este formato:** en una crisis de tiempo, el Owner necesita tomar múltiples decisiones encadenadas en pocos minutos. Un formato de "war room" —decisiones en tarjetas apiladas, con impacto visible por cada una— permite procesar más decisiones por minuto que cualquier formulario o diálogo.

**Datos que muestra:**
- Stack de decisiones pendientes ordenadas por impacto en la entrega
- Cada decisión con: descripción, tiempo que ahorra/cuesta, quién la ejecuta
- Score de viabilidad actualizado en tiempo real con cada decisión tomada
- Mapa mental de consecuencias: "si cortás X, también perdés Y"

**Modelo de interacción:**
- Swipe (o botones) para confirmar / rechazar / posponer cada decisión
- Cada decisión tomada actualiza el score de viabilidad en vivo
- Botón "ver consecuencias" → el agente despliega el árbol de impacto antes de confirmar
- Al terminar el stack → el agente genera el plan de ejecución actualizado
- Modo "deshacer" disponible por 30 segundos después de cada decisión

**Apariencia:**
```
╔═══════════════════════════════╗
║  DECISIÓN 2 de 5              ║
║                               ║
║  ¿Cortar feature de roles     ║
║  de usuario?                  ║
║                               ║
║  Ahorra: ~40 min              ║
║  Pierde: diferenciación       ║
║  Quién ejecuta: Builder       ║
║                               ║
║  [✓ Confirmar]  [✗ Mantener] ║
║                               ║
║  Viabilidad actual: ██████░░  ║
║  72% → si confirmás: 88%      ║
╚═══════════════════════════════╝
```

**Señales que activan:** `fase=Panic AND rol=Owner` OR (bloqueos_simultáneos >= 3 AND countdown < 90min)

---

## 09 — Stepper con bifurcación (guía no lineal)

**El agente lo genera cuando:** el rol es Maker o cuando una tarea requiere pasos técnicos que pueden tener variantes según el contexto del usuario.

**Por qué este formato:** las guías lineales asumen que el usuario tiene el mismo contexto que el autor. Este stepper bifurca el camino según lo que el usuario encuentra en cada paso. Si en el paso 2 aparece un error específico, el stepper detecta el error y ofrece una rama alternativa, sin que el usuario salga de la guía.

**Datos que muestra:**
- Paso actual prominente con instrucción clara
- Indicador de progreso no lineal (árbol, no barra)
- Rama actual activa resaltada
- Posibles bifurcaciones visibles como opciones en el paso

**Modelo de interacción:**
- Botón "Siguiente" avanza al paso siguiente de la rama actual
- Si el usuario marca "esto no funcionó" → el agente ofrece una rama alternativa
- Input de validación en cada paso: el usuario puede pegar el resultado real para que el agente verifique
- El árbol de progreso muestra en tiempo real qué ramas se tomaron
- Al completar → el agente documenta el camino específico que funcionó (para el README)

**Apariencia:**
```
      [1. Instalar dependencias]
               │
        ¿Funcionó? [Sí] → [2a. Configurar .env]
                  [No]  → [2b. Resolver conflicto de versiones]
                                      │
                              [2c. Limpiar y reinstalar]
                                      │
                              [3. Verificar instalación]
               │
        ¿Creaste el archivo? [Sí] → [4. Correr proyecto]
                            [No]  → [4b. Usar template]
```

**Señales que activan:** `rol=Maker AND fase=Build` OR tarea_asignada.tipo = técnica_guiada

---

## 10 — Score Dashboard (métricas en vivo estilo atlético)

**El agente lo genera cuando:** el rol es Owner o cuando se necesita una vista de salud del equipo sin detalle técnico.

**Por qué este formato:** los dashboards de métricas convencionales muestran números. Este formato usa la gramática visual del deporte —marcadores grandes, indicadores de momentum, comparativas en tiempo real— para comunicar el estado del equipo de una forma que activa urgencia o confianza sin necesidad de leer.

**Datos que muestra:**
- Score de viabilidad del proyecto: número grande central
- Momentum: va subiendo o bajando en las últimas X acciones
- Por equipo: tasks completadas / bloqueadas / sin asignar
- Ritmo actual vs ritmo necesario para entregar
- Eventos recientes como "feed" lateral

**Modelo de interacción:**
- El dashboard se actualiza en tiempo real con cada acción del equipo
- Click en cualquier métrica → drill-down con detalle expandido
- Toggle "mostrar en pantalla compartida" → layout optimizado para proyectar al equipo
- Botón "ajustar ritmo" → el agente recalcula el plan y propone redistribución
- Modo "motivación" → el agente muestra el ritmo en relación a la entrega con framing positivo

**Apariencia:**
```
╔═══════════════════════════════════════════╗
║         VIABILIDAD DEL PROYECTO           ║
║                   84%                     ║
║             ↑ +6 últimas 30min            ║
╠═══════════════════╦═══════════════════════╣
║  Completadas: 7   ║  Ritmo actual:        ║
║  En curso:    3   ║  1.2 tasks/hora       ║
║  Bloqueadas:  1   ║  Necesario:           ║
║  Sin asignar: 2   ║  1.0 tasks/hora ✓     ║
╠═══════════════════╩═══════════════════════╣
║  RECIENTE:                                ║
║  → Builder completó "API integration" ✓  ║
║  → Maker desbloqueó "animaciones"        ║
║  → ⚠ "Auth" lleva 45min sin avance       ║
╚═══════════════════════════════════════════╝
```

**Señales que activan:** `rol=Owner AND fase=Build` OR `rol=Viewer` OR solicitud_explícita=vista_equipo

---

## 11 — Ambient Overlay (interfaz flotante contextual)

**El agente lo genera cuando:** el usuario está trabajando en otro contexto y el agente detecta que algo requiere atención sin interrumpir el flujo de trabajo.

**Por qué este formato:** las notificaciones interrumpen. Los overlays ambientales aparecen en el lugar donde el usuario ya está mirando, con la información específica para ese contexto, y desaparecen solos cuando ya no son relevantes. No hay panel de notificaciones. No hay bandeja de entrada.

**Datos que muestra:**
- Widget mínimo (< 30% del viewport) posicionado cerca del elemento relevante
- Información específica para ese elemento: si el usuario está en el archivo de auth, el overlay muestra el estado del bloqueo de auth
- Acción disponible inline: resolver, posponer, delegar
- Timer de auto-dismiss visible

**Modelo de interacción:**
- Aparece sin que el usuario lo solicite
- Hover → se expande con más detalle
- Click en acción → el agente ejecuta y el overlay desaparece
- Swipe out o botón Esc → dismiss manual
- El agente no muestra más de un overlay simultáneo

**Apariencia:**
```
                            ┌──────────────────────┐
   [código de auth.js]      │ ⚠ Este módulo está   │
                            │ bloqueado por falta   │
   export const auth = {    │ de API keys           │
     ...                    │                       │
   }                        │ [Ir a config]  [×]   │
                            └──────────────────────┘
                            [desaparece en 8s ───░░]
```

**Señales que activan:** agente detecta relevancia entre lo que el usuario está haciendo y un evento del sistema OR bloqueo nuevo mientras el usuario trabaja

---

## 12 — Split Pane con slider (comparación interactiva)

**El agente lo genera cuando:** el usuario necesita comparar dos versiones, dos ideas, dos configuraciones, o ver el before/after de una decisión.

**Por qué este formato:** la comparación textual obliga al usuario a construir el contraste mentalmente. El split pane con slider permite ver las dos versiones en el mismo espacio visual, ajustando qué porcentaje de cada una se muestra. El cerebro procesa el contraste sin esfuerzo.

**Datos que muestra:**
- Lado A y Lado B del contenido a comparar
- Slider central para ajustar la proporción mostrada
- Destacado automático de las diferencias en el lado más visible
- Etiquetas de los dos lados siempre visibles

**Modelo de interacción:**
- Drag del slider central → ajustar proporción A/B
- Click en diferencia destacada → el agente explica por qué difieren
- Botón "elegir A" o "elegir B" → confirmar la versión activa
- Toggle "solo diferencias" → ocultar todo lo que es igual en ambos lados
- Botón "fusionar mejor de cada uno" → el agente genera una tercera versión combinada

**Señales que activan:** `intent=Decidir` OR (usuario tiene 2 versiones de algo abiertas) OR solicitud explícita de comparación

---

## Tabla de correspondencia: tipo de dato → tipo de interfaz

| Tipo de dato | Tipo de interfaz | Por qué |
|---|---|---|
| Dependencias y bloqueos | Force Graph | Las relaciones son el dato, no los nodos |
| Tiempo restante crítico | Countdown crítico | El tiempo es el dato dominante |
| Cadena causal de error | Causal Chain | La causalidad requiere secuencia visual |
| Múltiples ideas | Idea Matrix | La comparación multivariable requiere espacio 2D |
| Salud de sistema | Organism Map | El comportamiento orgánico activa intuición |
| Progreso histórico | Narrative Timeline | El arco narrativo da sentido al progreso |
| Acciones técnicas rápidas | Command Surface | El developer quiere velocidad sin mouse |
| Decisiones de crisis | Triage War Room | La urgencia requiere reducir fricción de decisión |
| Guía técnica para no-dev | Stepper bifurcado | Los caminos reales no son lineales |
| Estado del equipo | Score Dashboard | Las métricas de equipo necesitan momentum |
| Alertas sin interrumpir | Ambient Overlay | La relevancia contextual supera la notificación |
| Comparación de versiones | Split Pane slider | El contraste visual supera la comparación textual |
