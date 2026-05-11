# Crew Companion — Servicios y Keys para Deploy

> Todo free tier. Costo mensual: $0.

---

## Resumen rápido

| Servicio | Para qué | Costo | Tiempo |
|----------|----------|-------|--------|
| **Vercel** | Frontend (Next.js) | Gratis | 2 min |
| **Render** | BFF + Agent (2 servicios) | Gratis | 5 min |
| **Neon** | PostgreSQL productivo | Gratis | 3 min |
| **Upstash** | Redis | Gratis | 2 min |
| **Resend** | Emails magic-link | Gratis | 5 min |
| **Google AI Studio** | Gemini API | Gratis | 2 min |
| **CopilotKit** | Threads / Intelligence | Gratis | 5 min |

---

## 1. Vercel — Frontend

**URL:** https://vercel.com

**Qué hace:** hostea el frontend Next.js. Detecta el repo automáticamente.

**Pasos:**
1. Sign up con GitHub
2. "Add New Project" → importar `crew-companion`
3. En configuración del proyecto:
   - **Root Directory:** `apps/frontend`
   - **Framework:** Next.js (auto-detectado)
4. Agregar env vars (ver sección "Env Vars" abajo)
5. Deploy

**Keys que necesitás:** ninguna (Vercel no necesita API key, solo tu cuenta GitHub).

**URL resultante:** `https://crew-companion-xxx.vercel.app`

---

## 2. Render — BFF + Agent

**URL:** https://render.com

**Qué hace:** hostea el servidor BFF (Hono/Node) y el agente Python (LangGraph). Dos servicios separados.

**Pasos:**
1. Sign up con GitHub
2. "New" → "Blueprint" → seleccionar repo `crew-companion`
   - Render detecta el `render.yaml` automáticamente y crea los 2 servicios
3. Agregar env vars en cada servicio (ver sección abajo)
4. Deploy

**Keys que necesitás:** ninguna (solo cuenta GitHub).

**URLs resultantes:**
- BFF: `https://crew-companion-bff.onrender.com`
- Agent: `https://crew-companion-agent.onrender.com`

> **Nota:** Free tier se "duerme" después de 15 min sin tráfico. Primera request tarda ~30s. Normal para demo.

---

## 3. Neon — PostgreSQL

**URL:** https://neon.tech

**Qué hace:** reemplaza el Postgres local de Docker. Guarda sesiones de auth, workspace state, audit log.

**Pasos:**
1. Sign up (gratis, sin tarjeta)
2. "Create Project" → nombre: `crew-companion`
3. Región: la más cercana (US East si no hay otra opción)
4. Copiar la **Connection String** (formato: `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`)

**Key que necesitás:**
```
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Después de crear:**
Correr las migraciones apuntando a Neon:
```bash
DATABASE_URL="tu-neon-url" bash scripts/migrate.sh up
```

---

## 4. Upstash — Redis

**URL:** https://upstash.com

**Qué hace:** Redis en la nube para rate limiting y cache del stack de CopilotKit.

**Pasos:**
1. Sign up (gratis, sin tarjeta)
2. "Create Database" → tipo: Redis → región: la más cercana
3. Copiar **UPSTASH_REDIS_REST_URL** y **UPSTASH_REDIS_REST_TOKEN**

**Keys que necesitás:**
```
REDIS_URL=redis://default:xxx@xxx.upstash.io:6379
```
(o la URL formato `rediss://` que aparece en el dashboard)

---

## 5. Resend — Email magic-link

**URL:** https://resend.com

**Qué hace:** envía los emails de autenticación (magic link). Free: 100 emails/día, 3.000/mes.

**Pasos:**
1. Sign up (gratis)
2. "API Keys" → "Create API Key" → nombre: `crew-companion`
3. **Dominio:** dos opciones:
   - **Sin dominio propio:** usar `onboarding@resend.dev` (funciona sin verificación, solo para testing)
   - **Con dominio propio:** "Domains" → agregar tu dominio → verificar DNS (5-10 min)

**Keys que necesitás:**
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AUTH_EMAIL_FROM=Crew Companion <noreply@tudominio.com>
# Si no tenés dominio propio, usar:
AUTH_EMAIL_FROM=Crew Companion <onboarding@resend.dev>
```

---

## 6. Google AI Studio — Gemini API

**URL:** https://aistudio.google.com

**Qué hace:** el LLM del agente (Gemini Flash). Free tier: 1.500 requests/día.

**Pasos:**
1. Ir a https://aistudio.google.com → "Get API key"
2. "Create API key" → copiar

**Key que necesitás:**
```
GEMINI_API_KEY=AIzaSy_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> Probablemente ya la tenés. Es la misma key del dev local.

---

## 7. CopilotKit — Intelligence (Threads)

**URL:** https://cloud.copilotkit.ai

**Qué hace:** servicio que persiste las conversaciones entre sesiones (threads durables). Reemplaza el Docker de Intelligence local.

**Pasos:**
1. Sign up en https://cloud.copilotkit.ai
2. Crear un proyecto → copiar las credenciales
3. En el dashboard buscar:
   - **Intelligence API URL** (empieza con `https://`)
   - **Intelligence WS URL** (empieza con `wss://`)
   - **Intelligence API Key** (`cpk_...`)
   - **License Token** (para el BFF)

**Keys que necesitás:**
```
INTELLIGENCE_API_URL=https://xxx.copilotkit.ai
INTELLIGENCE_GATEWAY_WS_URL=wss://xxx.copilotkit.ai
INTELLIGENCE_API_KEY=cpk_live_xxxxxxxxxxxxxxxx
COPILOTKIT_LICENSE_TOKEN=cpk_license_xxxxxxxx
```

> Si CopilotKit Cloud no está disponible en tu región o plan, el sistema funciona **sin Intelligence** usando threads en memoria (conversaciones se pierden al reiniciar el agente). Podés dejarlo para después.

---

## Resumen de todas las env vars por servicio

### Vercel (Frontend)
```env
# Auth
AUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://crew-companion-xxx.vercel.app
RESEND_API_KEY=re_xxxxxxxx
AUTH_EMAIL_FROM=Crew Companion <noreply@tudominio.com>

# BFF (URL de Render)
BFF_URL=https://crew-companion-bff.onrender.com
```

### Render — BFF
```env
NODE_ENV=production

# Database
DATABASE_URL=postgresql://...@neon.tech/neondb?sslmode=require

# CopilotKit
COPILOTKIT_LICENSE_TOKEN=cpk_license_xxx
INTELLIGENCE_API_URL=https://xxx.copilotkit.ai
INTELLIGENCE_GATEWAY_WS_URL=wss://xxx.copilotkit.ai
INTELLIGENCE_API_KEY=cpk_live_xxx

# Agent (URL de Render)
LANGGRAPH_DEPLOYMENT_URL=https://crew-companion-agent.onrender.com
```

### Render — Agent
```env
# LLM
GEMINI_API_KEY=AIzaSy_xxx

# Database (mismo Neon)
DATABASE_URL=postgresql://...@neon.tech/neondb?sslmode=require

# CopilotKit
INTELLIGENCE_API_KEY=cpk_live_xxx

# Redis (Upstash)
REDIS_URL=redis://default:xxx@xxx.upstash.io:6379
```

---

## Orden de deploy

1. Crear Neon → copiar `DATABASE_URL`
2. Correr `DATABASE_URL="..." bash scripts/migrate.sh up` (migrations)
3. Crear Resend → copiar API key
4. Crear CopilotKit Cloud → copiar Intelligence keys
5. Crear Upstash → copiar Redis URL
6. Deploy **Agent** en Render → copiar URL resultante
7. Deploy **BFF** en Render con `LANGGRAPH_DEPLOYMENT_URL` del paso anterior → copiar URL resultante
8. Deploy **Frontend** en Vercel con `BFF_URL` del paso anterior
9. Smoke test: abrir app → sign in → `/leader` → chat

---

## AUTH_SECRET — cómo generarlo

Correr una sola vez en tu terminal:
```bash
openssl rand -base64 32
```
Copiar el resultado como `AUTH_SECRET`.
