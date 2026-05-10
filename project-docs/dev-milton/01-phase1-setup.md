# Fase 1 — Setup: Copiar starter kit y adaptar base

## Objetivo
Tener el proyecto corriendo con la nueva identidad (crew-companion) pero con el dominio de leads vacío. Al final de esta fase: `npm run dev` levanta todo sin errores.

## Checklist

### 1.1 Copiar estructura del starter kit

```bash
# Desde ~/crew-companion
cp -r ~/Generative-UI-Global-Hackathon-Starter-Kit/apps ./apps
cp -r ~/Generative-UI-Global-Hackathon-Starter-Kit/deployment ./deployment
cp -r ~/Generative-UI-Global-Hackathon-Starter-Kit/scripts ./scripts
cp ~/Generative-UI-Global-Hackathon-Starter-Kit/package.json ./package.json
cp ~/Generative-UI-Global-Hackathon-Starter-Kit/.env.example ./.env.example
cp ~/Generative-UI-Global-Hackathon-Starter-Kit/.gitignore ./.gitignore
```

### 1.2 Actualizar package.json raíz

Cambiar el campo `name` de `"v2a-notion-lead-form"` a `"crew-companion"`.

### 1.3 Limpiar el dominio de leads del frontend

Eliminar o vaciar estos archivos/carpetas (los reemplazamos en Fase 3):
```
apps/frontend/src/app/leads/              → eliminar
apps/frontend/src/components/leads/       → eliminar
apps/frontend/src/lib/leads/              → eliminar (crear lib/crew/ en Fase 2)
apps/frontend/src/app/page.tsx            → cambiar redirect a /leader
```

Dejar intacto:
```
apps/frontend/src/components/copilot/     ← no tocar
apps/frontend/src/components/threads-drawer/ ← no tocar
apps/frontend/src/components/ui/          ← no tocar (shadcn components)
apps/frontend/src/app/layout.tsx          ← no tocar
```

### 1.4 Actualizar redirect raíz

`apps/frontend/src/app/page.tsx`:
```typescript
import { redirect } from 'next/navigation'
export default function Home() {
  redirect('/leader')
}
```

### 1.5 Crear páginas placeholder

```typescript
// apps/frontend/src/app/leader/page.tsx
export default function LeaderPage() {
  return <div className="p-8 text-2xl">Leader Dashboard — coming soon</div>
}

// apps/frontend/src/app/member/[memberId]/page.tsx
export default function MemberPage({ params }: { params: { memberId: string } }) {
  return <div className="p-8 text-2xl">Member {params.memberId} — coming soon</div>
}

// apps/frontend/src/app/docs/page.tsx
export default function DocsPage() {
  return <div className="p-8 text-2xl">Document Workspace — coming soon</div>
}
```

### 1.6 Limpiar el agente Python

En `apps/agent/src/`:
- Eliminar: `notion_tools.py`, `notion_mcp.py`, `notion_integration.py`, `lead_store.py`, `lead_state.py`
- Renombrar: `intelligence_cleanup.py` → mantener (es infra)
- Mantener: `timing.py`, `runtime.py` (adaptar en Fase 5)

En `apps/agent/main.py`: comentar todo el código de leads hasta Fase 5. Dejar solo el servidor LangGraph arriba.

### 1.7 Limpiar el BFF

`apps/bff/src/server.ts`: El BFF no tiene lógica de dominio, solo cambiar el graph ID si es necesario. Dejar casi igual.

### 1.8 Configurar .env

```bash
cp .env.example .env
```

Editar `.env` con:
- `GEMINI_API_KEY` (o `ANTHROPIC_API_KEY`)
- `COPILOTKIT_LICENSE_TOKEN`
- `INTELLIGENCE_API_KEY` (del panel de CopilotKit)
- El resto de valores default del `.env.example` funcionan

### 1.9 Instalar dependencias y verificar

```bash
npm install
npm run dev:infra    # debe levantar Docker sin errores
npm run dev:ui       # debe abrir :3010 y redirigir a /leader
```

## Criterio de completitud
- [ ] `http://localhost:3010` carga y redirige a `/leader` mostrando "Leader Dashboard — coming soon"
- [ ] Docker está corriendo (`docker ps` muestra postgres y redis)
- [ ] No hay errores en consola del browser
- [ ] El BFF responde en `http://localhost:4000` (puede ser 404, solo verificar que levanta)
