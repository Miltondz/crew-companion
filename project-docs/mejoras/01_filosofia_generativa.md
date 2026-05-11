# Filosofía generativa — Hackathon OS

## El principio central

La interfaz no existe antes de que el agente la construya.

No hay páginas prediseñadas, rutas fijas ni layouts por defecto. Cada vez que un usuario abre el workspace, el agente lee el contexto actual —rol, fase del evento, estado del proyecto, intención detectada— y genera la superficie específica para ese momento. Cuando el contexto cambia, la interfaz se regenera.

Esto no es personalización. Es generación.

---

## La pregunta que valida cada decisión de diseño

> ¿Podría existir esta pantalla antes de que el agente la construya?

Si la respuesta es sí, la pantalla no es parte de este sistema. Es una pantalla tradicional con contenido dinámico, que es algo completamente diferente.

La diferencia concreta:
- **App tradicional**: ruta `/dashboard` → componente `<Dashboard>` → datos variables → render
- **Este sistema**: señales de contexto → agente decide qué mostrar → compone bloques → genera superficie → re-evalúa → recompone

---

## Las cuatro señales de contexto

El agente las lee en cada momento para decidir qué generar:

### 1. Rol del usuario
Determina la **densidad** y el **lenguaje** de la interfaz.

| Rol | Densidad | Lenguaje | Acciones disponibles |
|---|---|---|---|
| Builder | Alta — información técnica completa | Términos de desarrollo | Todas las técnicas |
| Maker | Baja — pasos simples y claros | Lenguaje común | Guiadas, sin terminal |
| Owner | Media — visión de equipo | Gestión y decisión | Configuración y triage |
| Viewer | Mínima — solo lectura | Narrativo | Ninguna |

### 2. Fase del evento
Determina el **ritmo visual** y los **bloques prioritarios**.

| Fase | Ritmo | Bloque dominante |
|---|---|---|
| Kickoff | Exploratorio, espacioso | Ideas y configuración |
| Build | Activo, enfocado | Backlog y arquitectura |
| Panic mode | Urgente, comprimido | Countdown y triage |
| Demo | Narrativo, pulido | Script y submission |

### 3. Estado del proyecto
Determina qué **superficie de respuesta** aparece.

- **En curso** → interfaz de avance: tareas activas, progreso, siguiente paso
- **Bloqueado** → interfaz de resolución: cadena causal, panel de decisión, redistribución
- **Sin ideas** → interfaz de exploración: comparación, expansión anclada al evento
- **Listo** → interfaz de entrega: submission checklist, script de demo, revisión final

### 4. Intención del usuario
Detectada por el agente desde texto libre, acciones previas o solicitud directa.

- **Construir** → backlog técnico + arquitectura
- **Debuggear** → cadena causal + error stream
- **Decidir entre ideas** → matriz comparativa + expansión
- **Entregar** → checklist de submission + countdown

---

## Reglas de composición

El agente no elige bloques al azar. Sigue estas reglas:

### Regla 1 — Un bloque dominante por superficie
Cada workspace generado tiene exactamente un bloque que ocupa el lugar visual más prominente. El resto son bloques de soporte. El bloque dominante cambia con el contexto.

```
Regla: IF fase = Panic → bloque_dominante = Countdown crítico
Regla: IF estado = Bloqueado AND intent = Construir → bloque_dominante = Cadena causal
Regla: IF rol = Maker AND fase = Build → bloque_dominante = Guía paso a paso
Regla: IF rol = Owner AND fase = Kickoff → bloque_dominante = Config de equipo
```

### Regla 2 — Los bloques de soporte complementan, no duplican
Si el bloque dominante ya muestra el estado de las tareas, los bloques de soporte no repiten esa información. Añaden una dimensión diferente: tiempo, riesgo, contexto técnico.

### Regla 3 — Máximo tres bloques simultáneos
Más de tres bloques es un dashboard. Tres bloques o menos es una superficie específica para un momento. La diferencia es filosófica.

### Regla 4 — El tipo de interfaz varía con el contenido
Los bloques no son cards de colores con texto diferente. El tipo de visualización —gráfico, grafo, línea de tiempo, mapa de organismos, pantalla de comandos— es una decisión del agente basada en qué tipo de relación existe entre los datos.

```
Datos con relaciones causales → Grafo dirigido (no tabla)
Datos con dimensión temporal → Timeline (no lista)
Datos de salud de sistema → Mapa orgánico (no métricas numéricas)
Datos de decisión binaria → Panel de triage (no formulario)
Datos de comparación multivariable → Matriz 2D (no cards)
```

### Regla 5 — La interfaz se transforma, no se navega
El usuario no navega entre secciones. La superficie muta. Cuando el contexto cambia, los bloques actuales hacen una transición animada hacia la nueva composición. No hay menú lateral. No hay tabs de navegación.

---

## Lo que diferencia este sistema de una app normal

| Dimensión | App tradicional | Este sistema |
|---|---|---|
| Origen de la UI | Desarrollador diseñó las pantallas | Agente las genera en runtime |
| Variedad | N pantallas prediseñadas | Combinaciones prácticamente infinitas |
| Adaptación | El usuario configura sus preferencias | El agente lee el contexto y actúa |
| Interacción | El usuario navega hasta la info | La interfaz viene al usuario |
| Respuesta a cambios | El usuario recarga o navega | La superficie se regenera sola |
| Tipo de UI por contenido | Fijo por sección | Variable según el tipo de dato |

---

## La prueba de fuego

Antes de añadir cualquier bloque o tipo de interfaz al sistema, aplicar esta prueba:

1. ¿El agente tomó una decisión de diseño para generar esto, o simplemente llenó un template?
2. ¿El tipo de visualización elegido es el más apropiado para este tipo de dato, o es el más fácil de implementar?
3. ¿El usuario puede interactuar con lo generado —confirmar, modificar, ejecutar— o solo puede leerlo?
4. ¿Esta superficie podría haber sido generada por un desarrollador tradicional sin un agente?

Si la respuesta a (4) es sí, volver a la mesa de diseño.
