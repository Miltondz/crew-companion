# Crew Companion

> **Un asistente de IA que entiende tu rol, tu urgencia y tus obstáculos.**
> 
> La interfaz se adapta en tiempo real. No es un panel estático. Es como tener un director de equipo que reorganiza el escritorio cada vez que cambia la situación.

---

## ¿Qué es Crew Companion en términos simples?

Crew Companion es una **aplicación colaborativa que ayuda a equipos de trabajo** a coordinar proyectos en tiempo real. La clave es que **no es un panel de control genérico**, sino un entorno que se adapta a lo que necesita cada persona en cada momento.

### Lo que VES cambia según:
- **Tu rol** ¿Eres líder del equipo o miembro? Ves cosas diferentes.
- **Tu nivel técnico** ¿Sabes mucho de tecnología? Te mostramos detalles avanzados. ¿Eres principiante? Mostramos pasos simples.
- **Qué tan urgente es** Si hay solo 20 minutos para un deadline, la interfaz se pone roja y cambia todo para mostrarte acciones rápidas.
- **Qué está bloqueando al equipo** Si alguien está trabado en un problema, la app muestra ese problema prominentemente a los líderes.

### Lo que PUEDES HACER:
- **Ver tareas activas** y marcarlas como completas
- **Reportar problemas o bloqueos** (ej: "No sé cómo instalar la dependencia")
- **Ver hitos/deadlines** con un contador en tiempo real
- **Asignar tareas** a miembros del equipo (si eres líder)
- **Hacer preguntas** a un asistente de IA integrado

### Lo que NO es:
- ❌ No es Trello, Asana o Jira (aunque hace cosas similares)
- ❌ No es un chat (aunque tiene un chat de IA)
- ❌ No va a hacer el trabajo por ti
- ❌ No requiere configuración compleja

---

## La metáfora del "Mascota Emocional"

La app tiene un pequeño personaje que representa el **estado emocional del equipo**:
- 😌 **Tranquilo** — hay tiempo, todo bajo control
- 😊 **Enfocado** — la tensión está subiendo, necesitan concentración
- 😟 **Preocupado** — quedan solo 15 minutos, esto es serio
- 😰 **Pánico** — 5 minutos o menos, acción inmediata
- 🎉 **Celebrando** — ¡milestone completado!

El personaje no es decorativo. Cuando la urgencia sube, **toda la interfaz cambia de color y disposición** para ayudarte a priorizar.

---

## Cómo funciona por dentro (arquitectura simplificada)

```
┌─────────────────────────────────────────────────────┐
│              TÚ (en el navegador)                   │
│  - Ves tareas, hitos, equipales                    │
│  - Haces clic en acciones                          │
│  - Chateas con IA integrada                        │
└──────────────────────┬────────────────────────────┘
                       │ (lo que ves se sincroniza)
                       ▼
        ┌──────────────────────────────┐
        │   API (Servidor web)         │
        │   - Recibe tus acciones      │
        │   - Las valida               │
        │   - Las guarda               │
        └────────────────┬─────────────┘
                         │
                         ▼
        ┌──────────────────────────────┐
        │  IA Inteligente (LangGraph)  │
        │  - Entiende el contexto      │
        │  - Decide qué mostrar        │
        │  - Genera sugerencias        │
        └────────────────┬─────────────┘
                         │
                         ▼
        ┌──────────────────────────────┐
        │  Base de Datos (Postgres)    │
        │  - Guarda tareas             │
        │  - Guarda equipo             │
        │  - Guarda historial          │
        └──────────────────────────────┘
```

**Lo importante:** Tu experiencia en el navegador es **dinámica**. No es un formulario estático. La IA está constantemente analizando la situación y reorganizando qué le mostramos.

---

## Los 4 roles / vistas principales

### 1️⃣ **Vista de Líder** (`/leader`)
**Para:** Quien dirige el equipo  
**Ves:**
- Tablero de tareas (3 columnas: por hacer → en progreso → hecho)
- Barra de progreso del hito actual
- Lista de todos los miembros + qué están haciendo
- Reportes de bloqueos del equipo
- Botón para asignar nuevas tareas

**Colorido en:** Púrpura/violeta — transmite liderazgo y control

---

### 2️⃣ **Vista de Miembro** (`/member/[id]`)
**Para:** Alguien trabajando en una tarea  
**Ves:**
- **Tu tarea actual** en grande (aquí es donde enfocas)
- Contador regresivo en **ROJO** si faltan menos de 30 minutos
- Botón grande para marcar como "Hecho"
- Formulario fácil para reportar un bloqueo
- Lista de tus otras tareas
- Asistente de IA que te hace preguntas útiles

**Colorido en:** Verde/turquesa — transmite acción y movimiento

---

### 3️⃣ **Vista de Documentos** (`/docs`)
**Para:** Buscar información o aclaraciones  
**Ves:**
- Lista de documentos compartidos
- Visor del documento que selecciones
- Chat de IA preguntando sobre ese documento ("¿Cuáles son los pasos?", "¿Qué significa X?")

**Colorido en:** Azul/violeta — transmite conocimiento

---

### 4️⃣ **Asistente de IA** (En todas partes)
El chat integrado que:
- Responde preguntas sobre tareas
- Lee documentos y los explica
- Sugiere próximos pasos
- Adapta las respuestas a tu nivel técnico

---

## Los 5 "Estados de Urgencia" que cambien TODO

Tu deadline más cercano determina en qué modo está la app:

| Estado | Tiempo | Interfaz | Mascota | Lo que significa |
|--------|--------|----------|---------|-----------------|
| **Normal** | Más de 30 min | Degradado azul calmado | 😌 Tranquilo | Hay tiempo, pueden planificar bien |
| **Enfocado** | 15–30 minutos | Acentos amarillos | 😊 Enfocado | La tensión sube, menos distracciones |
| **Urgente** | 5–14 minutos | Naranjas y alertas | 😟 Preocupado | Rojo en algunos botones, concentración total |
| **Pánico** | 0–4 minutos | TODO ROJO, pulsa | 😰 Asustado | La app muestra SOLO lo más crítico |
| **Vencido** | Pasó el deadline | Rojo oscuro | 💀 Desolado | Acción inmediata, sin tiempo |

**La magia:** No es solo visual. La propia disposición de elementos cambia. En pánico, tareas que no importan desaparecen. En normal, ves más contexto.

---

## Las 8 "Superficies" (paneles inteligentes)

El equipo de IA diseñó **8 paneles diferentes** que se muestran según lo que necesitas:

1. **Sugerencias de Tareas** — El IA dice qué deberías priorizar
2. **Resumen de Hito** — Progreso visual del deadline actual
3. **Análisis de Bloqueos** — "¿Por qué se está trabando? Acciones:"
4. **Panel de Acciones** — Lista urgente (YA / PRONTO / LUEGO)
5. **Guía para Principiantes** — Pasos numerados + tips
6. **Checklist Interactivo** — ☑️ boxes que podes tildar
7. **Asistente de Troubleshooting** — Árbol de decisiones (¿Pasó X? ¿Luego Y?)
8. **Resumen de Documentos** — TL;DR del documento + cita importante

**Cómo se decide cuál ver:** Depende de tu rol, nivel técnico, estado de urgencia y si tenés un bloqueo activo. **No los elegís vos. La IA decide cuál es útil AHORA.**

---

## Cómo empezar (para desarrolladores)

### Requisitos previos
- Node.js 20+
- Python 3.11+ con `uv`
- Docker Desktop (para base de datos local)

### Instalación rápida (5-10 minutos)

```bash
# 1. Clonar
git clone https://github.com/Miltondz/crew-companion.git
cd crew-companion

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus claves:
# - GEMINI_API_KEY (from aistudio.google.com)
# - AUTH_SECRET (openssl rand -base64 32)
# - RESEND_API_KEY (email delivery)

# 3. Instalar dependencias
npm install
cd apps/agent && uv sync && cd ../..

# 4. Iniciar infraestructura (DB + cache + servicios IA)
npm run dev:infra

# 5. Crear esquema base de datos
bash scripts/migrate.sh up

# 6. Cargar datos de demo
npm run seed

# 7. Iniciar TODO
npm run dev

# 8. Abrir en navegador
# http://localhost:3010/leader
```

**Solo querés un servicio?**
```bash
npm run dev:ui       # Frontend solo
npm run dev:bff      # Servidor web solo
npm run dev:agent    # IA solo
npm run dev:infra    # Base de datos + cache
```

---

## Variables de entorno (explicadas)

| Variable | ¿Qué es? | ¿Dónde lo consigo? |
|----------|----------|-------------------|
| `GEMINI_API_KEY` | Clave de IA | [Google AI Studio](https://aistudio.google.com) |
| `AUTH_SECRET` | Código aleatorio de seguridad | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Dónde está tu app (ej: `http://localhost:3010`) | Lo decís vos |
| `RESEND_API_KEY` | Para enviar emails | [Resend](https://resend.com) |
| `DATABASE_URL` | Conexión a Postgres | Se genera automático con Docker |
| `ANTHROPIC_API_KEY` | (Opcional) Si querés usar Claude en vez de Gemini | [Anthropic](https://console.anthropic.com) |

---

## Probar la app (demo walkthrough)

**1. Entra como Líder**
- Ve a `/leader`
- Verás un tablero con tareas asignadas
- Hay un personaje (mascota) arriba a la derecha
- Botón "⌘K" abre búsqueda de comandos

**2. Mira la urgencia cambiar**
- Abajo a la izquierda hay botones de simulación (dev-only)
- Cambia de "Normal" → "Enfocado" → "Urgente" → "Pánico"
- Mira cómo cambia TODO: colores, botones, incluso el personaje

**3. Entra como Miembro**
- Ve a `/member/m1` (Alex)
- Tienes una tarea destacada en grande
- Hay un contador regresivo
- Prueba escribir en el chat de IA: "No entiendo cómo empezar"

**4. Miembro de bajo nivel técnico**
- Ve a `/member/m2` (Sam)
- Haz la misma pregunta en el chat
- Las respuestas del IA son MÁS SIMPLES (pasos numerados, menos jerga)

**5. Miembro avanzado**
- Ve a `/member/m3` (Jordan)
- Pregunta al IA: "Muestrame un checklist para mi tarea"
- Recibe una lista de checkboxes técnicos, no pasos básicos

**6. Documentos compartidos**
- Ve a `/docs`
- Elige un documento
- Pregunta al IA: "¿Qué dice esto sobre autenticación?"
- El IA lee el doc y responde con contexto

---

## Estado del proyecto

### ✅ **Fase A — Núcleo (COMPLETADO)**
- ✅ Registro de superficies (componentes descubribles)
- ✅ Protocolo de envelopes (comunicación IA → UI con tipos)
- ✅ Motor de capacidades (seguridad, auditoría)
- ✅ Persistencia (bases de datos, estado que sobrevive reinicios)
- ✅ Gramática espacial (6 zonas de layout que se reorganizan)

### ✅ **Fase B — Autenticación + Mejoras (EN PROGRESO)**
- ✅ Autenticación mágica (sin passwords)
- ✅ Notificaciones (toasts en acciones)
- ✅ Confeti en celebraciones
- ✅ Cargadores (skeleton screens)
- ✅ Modo oscuro
- ✅ Bordes de error y reintentos
- 🔄 Flujo de actividad en tiempo real
- 🔄 Chat mobile (en pantallas pequeñas)

### ⏳ **Fase C — Producción (PRÓXIMO)**
- Despliegue gratis en Vercel + Render + Neon
- Multi-agente (especialistas: Planificador, Coach, Orquestador)
- Mascota animada (Rive state machine)
- 12 superficies más avanzadas

---

## Conceptos clave para entender la arquitectura

### **Envelopes (Sobres)**
La IA y el frontend se comunican via **mensajes estructurados** (envelopes). Cada uno tiene:
- **ID único** para trazabilidad
- **Intención** (qué quiero hacer: mostrar panel, pedir confirmación, etc.)
- **Payload** (los datos específicos)
- **Contexto** (rol, urgencia, bloqueantes)

Es como si la IA enviara una "carta cerrada" con todo lo que la UI necesita. La UI valida la carta, y si está bien, la abre.

### **Surface Registry (Registro de Superficies)**
La UI no tiene un código gigante con "si es panel X, muestra componente Y". En su lugar:
- Cada componente es "registrado" (dice: "yo soy el panel de tareas, necesito X permisos")
- Cuando la IA manda un envelope, el sistema busca en el registro cuál componente cuadra
- Lo carga solo cuando lo necesita (lazy-loading)

**Ventaja:** Puedo agregar un nuevo panel sin editar código en 10 lugares.

### **Capability Engine (Motor de Capacidades)**
Cada acción peligrosa (escribir en DB, ejecutar código) requiere **capacidades**. El sistema valida:
- ¿Tiene la IA permiso para esto?
- ¿Está permitido en este momento? (no ejecutar borrados en pánico)
- ¿Necesita confirmación del usuario?

Todo se registra en un **audit log** (bitácora). Ej: "2026-05-11 14:30, IA creó tarea, usuario aprobó."

### **Layout Engine (Motor de Diseño)**
La UI tiene **6 zonas**: superior (comandos), central (contenido), lateral (contexto), chat, actividad, overlays.

Cuando la IA dice "muestra este panel", el Layout Engine decide:
- ¿En qué zona entra?
- ¿Si no hay espacio, qué desaparece?
- ¿Cómo lo animo visualmente?
- ¿Puede el usuario pincharlo en lugar?

---

## Los tres niveles del sistema

### Nivel 1: Frontend (Lo que VES)
- Next.js 15 + React 19
- Tailwind CSS + shadcn/ui (componentes pre-hechos)
- Diseño adaptativo (mira bien en desktop y mobile)

### Nivel 2: Backend (El coordinador)
- Hono (mini-servidor)
- Habla con la IA y con la base de datos
- Valida cada acción antes de hacerla
- Registra todo en la auditoría

### Nivel 3: IA (El pensador)
- Python + LangGraph (motor de razonamiento)
- Lee el estado actual del equipo
- Decide qué superficie mostrar
- Responde preguntas del chat
- Piensa en pasos: "Basándome en que Sam tiene bajo nivel técnico, voy a mostrar pasos numerados"

---

## Los tipos de datos clave

La app maneja estos conceptos:

```typescript
// Una persona del equipo
TeamMember {
  id: "m1"
  name: "Alex"
  role: "líder" | "miembro"
  technicalLevel: "principiante" | "avanzado"
  activeBlockerId?: "algún problema que reportó"
}

// Una tarea
Task {
  id: "t1"
  title: "Implementar login"
  description: "Agregar autenticación mágica"
  assignedTo: "m2" (asignado a Jordan)
  status: "por-hacer" | "en-progreso" | "hecho"
  priority: "baja" | "media" | "alta" | "crítica"
  milestoneId: "hito1" (qué deadline es)
}

// Un deadline importante
Milestone {
  id: "hito1"
  title: "MVP listo para demo"
  deadline: "2026-05-15T18:00:00Z"
  taskIds: ["t1", "t2", "t3"]
}

// Un problema reportado
Blocker {
  id: "bloqueo1"
  memberId: "m2"
  description: "No sé cómo conectar a la base de datos"
  reportedAt: (cuándo lo reportó)
  resolved: false | true (¿ya está desbloqueado?)
}

// Un documento compartido
SharedDocument {
  id: "doc1"
  title: "Guía de instalación"
  content: "# Cómo instalar..." (markdown)
  sharedBy: "m1"
  sharedAt: (cuándo lo compartió)
}
```

---

## Preguntas frecuentes

**¿Funciona sin internet?**  
No. Necesita conectarse al servidor de IA (Google Gemini o Anthropic).

**¿Puedo usar esto con mi equipo real?**  
Sí, pero está en desarrollo. Es estable para equipos pequeños (<20 personas) en ámbito de demostración.

**¿Los datos son privados?**  
Dentro de tu workspace, sí. Cada equipo tiene su propia base de datos. Si desplegás en tu servidor, es completamente privado.

**¿Necesito saber programación?**  
Para USAR: no. Para EJECUTAR localmente o desplegar: necesitas saber básico de terminal.

**¿Se puede modificar el asistente de IA?**  
Sí. El sistema de prompts está en `apps/agent/src/prompts.py`. Puedes editarlo.

**¿Qué pasa si cierro la app?**  
Todo se guarda en la base de datos. Reabrís y está todo ahí.

**¿El personaje (mascota) es solo decoración?**  
No. Representa el estado emocional real. Cuando entra pánico, el personaje se asusta Y la UI cambia para acción urgente.

---

## Documentación avanzada

Para desarrolladores e implementadores:

- **[MASTER_WORK_PLAN.md](project-docs/MASTER_WORK_PLAN.md)** — Plan de ejecución a 7.5 semanas (Fases A, B, C)
- **[PROJECT_STRUCTURE.md](project-docs/PROJECT_STRUCTURE.md)** — Mapa de archivos del proyecto
- **[agent/](project-docs/agent/)** — Documentación técnica del motor de IA
- **[design-notes/](project-docs/design-notes/)** — Notas de arquitectura

---

## Tecnologías clave (sin la jerga)

| Lo que hace | Herramienta | Por qué la elegimos |
|------------|-----------|-------------------|
| Interfaz (lo que ves) | Next.js + React | Rápido, moderno, se recarga automático |
| Estilos (colores, diseño) | Tailwind CSS | Fácil de cambiar, muy flexible |
| Componentes pre-hechos | shadcn/ui | No reinventar la rueda |
| Base de datos | PostgreSQL | Confiable, gratis en hosting |
| Cache rápido | Redis | Memória ultrarrápida para sesiones |
| IA conversacional | Google Gemini / Claude | Entienden contexto, buenas respuestas |
| Servidor intermedio | Hono | Pequeño, rápido, maneja muchas requests |
| Motor de IA | LangGraph | Razonamiento paso-a-paso, memoria |

---

## Licencia

Este proyecto está bajo licencia MIT (código abierto). Úsalo como quieras.

---

## Colaboradores

- **Milton** — Visión + dirección técnica
- **Claude (IA)** — Implementación + arquitectura
- **Gemini (IA)** — Componentes UI
- **Comunidad** — ¡Vos! (Issues, PRs, feedback)

---

## ¿Preguntas o ideas?

Abre un **issue** en GitHub o contacta directamente. Este es un proyecto activo.
