# Dev Roadmap — Milton (Programador Principal)

## Herramientas de trabajo
- **Claude Code** — tareas de arquitectura, lógica compleja, integración de sistemas
- **Gemini CLI** — generación rápida de código boilerplate, iteración de componentes
- Prompts específicos para cada herramienta en `PROMPTS.md`

## Resumen de fases

| Fase | Descripción | Estimado | Dependencias |
|------|-------------|----------|--------------|
| 1 | Setup: copiar starter kit, adaptar base | 1-2h | ninguna |
| 2 | Dominio: store Zustand + tipos + seed | 2h | Fase 1 |
| 3 | Frontend: rutas /leader, /member, /docs | 3-4h | Fase 2 |
| 4 | Surfaces + countdown + mascota | 3h | Fase 3 |
| 5 | Agente Python: prompts + tools + estado | 2-3h | Fase 2 |
| 6 | Integración + QA + demo | 1-2h | Fases 3+5 |

**Total estimado:** 12-16h de desarrollo efectivo

## Responsabilidades tuyas vs de la colaboradora

| Tarea | Milton | Colaboradora |
|-------|--------|--------------|
| Fase 1: setup base | ✅ | — |
| Fase 2: dominio + store | ✅ | — |
| Fase 3: rutas y estructura | ✅ | — |
| Componentes de lógica (countdown, store hooks) | ✅ | — |
| Componentes visuales puros (cards, panels, mascot) | revisar | ✅ construir |
| Surfaces 1-8 (HTML/CSS) | conectar | ✅ construir |
| Fase 5: agente Python | ✅ | — |
| Fase 6: integración final | ✅ | — |

## Convención de branches

```
main          ← estable, demo-ready
dev           ← integración
feat/phase-1  ← setup
feat/phase-2  ← dominio
feat/phase-3  ← frontend
feat/phase-4-surfaces   ← la colaboradora trabaja aquí
feat/phase-5  ← agente
```

## Señales de que una fase está completa

- **Fase 1:** `npm run dev:infra` levanta Docker, `npm run dev:ui` abre Next.js en :3010
- **Fase 2:** `useCrewStore.getState()` desde la consola del browser retorna el estado seed
- **Fase 3:** `/leader`, `/member/m2`, `/docs` cargan sin errores. Chat visible pero vacío.
- **Fase 4:** Cambiar el deadline del milestone a 8 minutos → la UI cambia de color y la mascota cambia.
- **Fase 5:** Escribir "qué tarea falta" en el chat → el agente responde con una surface renderizada.
- **Fase 6:** Los 4 escenarios de demo funcionan sin errores.

## Notas importantes

- **No modificar `deployment/docker-compose.yml`** — es idéntico al starter kit
- **No cambiar puertos** del BFF (4000) ni del agente (8123) hasta que todo funcione
- **El agente Python usa el mismo patrón de middleware** que el starter — copiar `timing.py` y adaptar `lead_state.py` → `crew_state.py`
- **Para la demo:** el deadline del milestone activo debe ser configurable desde UI o un botón "simular urgencia" que lo ponga a 8 minutos
