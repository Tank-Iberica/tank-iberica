# Roadmap Autónomo v5 — Tracciona

**Estado:** ✅ COMPLETADO — 14/14 items
**Generado:** 2026-03-19
**Fuente:** BACKLOG-EJECUTABLE.md — 7 items activos + 7 items FUTURO adelantados
**Criterio:** Items ejecutables por Claude sin intervención humana. Los items con prerequisito externo (API key, cuenta servicio) se implementan con abstracción testeable + mock; activación real cuando el servicio esté configurado.
**Prerequisito:** v4 completado (36/36 items)

---

## Resumen

| Fase                              | Items  | Estado | Foco                                                          |
| --------------------------------- | ------ | ------ | ------------------------------------------------------------- |
| 0 — Quick Wins & SEO              | 3      | ✅     | Git hygiene, bottlenecks docs, glosario SEO                   |
| 1 — Data Cleanup & Security       | 3      | ✅     | select('\*') final, cross-vertical tracking, sesiones activas |
| 2 — Admin Tools                   | 3      | ✅     | Registro documental, CRM pipeline, FAQ dinámico               |
| 3 — Architecture & Infrastructure | 3      | ✅     | Custom fields JSONB, search engine, cache layer               |
| 4 — Data Intelligence             | 2      | ✅     | API DGT/InfoCar, network graph supply chain                   |
| **Total**                         | **14** | **✅** | **Completado**                                                |

---

## Fuentes por categoría

| Origen                      | Items incluidos | Nota                                                                   |
| --------------------------- | --------------- | ---------------------------------------------------------------------- |
| Backlog activo (Fases 1-7d) | 7               | #208, #221, #292, #46, #49, #56, #132                                  |
| Future (F1-F59) adelantados | 7               | F5, F6, F39, F40, F41, F51, F55 — prerequisitos blandos o ya cumplidos |

**NO incluidos (mismas exclusiones que v4):**

- Items ya completados en v1-v4 (163/163)
- Items bloqueados por Nuxt 4, Sentry DSN, Twilio, CF KV
- Tareas Founder, Pre-Launch Config, Fase 10 Operativa
- DEFERRED restantes (D1-D25 menos D17 ✅)
- FUTURO restantes (F1-F59 menos 16 items ya ✅ y 7 adelantados aquí)

---

## FASE 0: Quick Wins & SEO (S) — 3/3

Items rápidos, bajo riesgo, impacto inmediato.

| #   | Backlog | Item                                                                                                                                                                                                                                                         | Tests necesarios                                                                     | Estado |
| --- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ------ |
| 0.1 | #208    | **Commit y push de todo pendiente** — `git status` limpio, todos los cambios de v4 + test professionalization + auditoría commiteados y pusheados a main                                                                                                     | N/A (git ops)                                                                        | ✅     |
| 0.2 | #292    | **Documentar bottlenecks reales post-tests** — Analizar resultados k6 (scripts en `tests/load/`), documentar: bottlenecks identificados, solución propuesta, coste estimado, prioridad. Output: `docs/tracciona-docs/referencia/BOTTLENECKS-LOAD-TESTING.md` | >5 tests: documento generado tiene secciones requeridas, métricas parseadas          | ✅     |
| 0.3 | F5      | **Glosario términos sector industrial** — Página `/glosario` con términos del sector (cabeza tractora, semirremolque, carrozado, tara, MMA, PMA, etc.). SEO: cada término con URL ancla, JSON-LD DefinedTermSet. i18n ES+EN                                  | >8 tests: renderizado, SEO meta, JSON-LD schema, i18n, búsqueda términos, responsive | ✅     |

---

## FASE 1: Data Cleanup & Security (S-M) — 3/3 ✅

Limpieza final de queries + features de seguridad y tracking.

| #   | Backlog | Item                                                                                                                                                                                                                                                        | Tests necesarios                                                                                | Estado |
| --- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------ |
| 1.1 | #221    | **select('\*') cleanup ronda 2** — Corregir ~29 instancias residuales: `useUserProfile` (9), `useVerticalConfig` (1), infra/clusters (10), `supabaseQuery` (3), otros (6). Cada query usa columnas explícitas                                               | >15 tests: cada query corregida verifica columnas explícitas, no regression                     | ✅     |
| 1.2 | #46     | **Compradores cross-vertical tracking** — `user_id` trackeado entre verticales TradeBase. Migration: columna `source_vertical` en `analytics_events` + `leads`. Composable: `useUserVerticalHistory()` para saber si un buyer opera en múltiples verticales | >10 tests: tracking cross-vertical, migration columnas, query filtros, edge cases null vertical | ✅     |
| 1.3 | F41     | **Gestión sesiones activas/dispositivos** — Página `perfil/seguridad.vue` muestra sesiones activas (device, IP, last_seen). Botón "Cerrar sesión" remoto. Usa fingerprinting existente (#29 `user_fingerprints`) + Supabase auth sessions                   | >12 tests: listar sesiones, cerrar remota, UI responsive, auth required, dedup devices, refresh | ✅     |

---

## FASE 2: Admin Tools (M) — 3/3 ✅

Herramientas admin para operación diaria del marketplace.

| #   | Backlog | Item                                                                                                                                                                                                                                                                                                                      | Tests necesarios                                                                                 | Estado |
| --- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------ |
| 2.1 | F39     | **admin/registro documental** — Página `/admin/documentos` con CRUD para documentos del dealer: facturas, contratos, certificados. Migration: tabla `dealer_documents` (dealer_id, type ENUM, file_url, status, metadata JSONB). Upload vía Cloudinary existente. Filtros por dealer/tipo/fecha                           | >12 tests: CRUD completo, upload, filtros, auth admin, RLS dealer solo ve suyos, validación tipo | ✅     |
| 2.2 | F40     | **admin/cartera CRM pipeline** — Página `/admin/cartera` con pipeline visual: contactado → demo → negociando → cerrado → perdido. Migration: tabla `crm_pipeline` (dealer_id, stage ENUM, notes, next_action_date). Drag & drop entre stages. Métricas: conversion rate por stage, avg time in stage                      | >15 tests: stages CRUD, move between stages, pipeline metrics, filtros, drag-drop state, auth    | ✅     |
| 2.3 | F55     | **Customer support FAQ dinámico** — Página `/soporte` con FAQ organizado por categoría (cuenta, pagos, publicar, comprar, técnico). Admin puede crear/editar/reordenar preguntas. Migration: tabla `faq_entries` (category, question, answer JSONB i18n, sort_order, published). Búsqueda client-side. Schema FAQ JSON-LD | >12 tests: renderizado FAQ, búsqueda, i18n, admin CRUD, schema JSON-LD, ordenamiento, responsive | ✅     |

---

## FASE 3: Architecture & Infrastructure (M-L) — 3/3 ✅

Inversiones en arquitectura que multiplican capacidades futuras.

| #   | Backlog | Item                                                                                                                                                                                                                                                                                                                                                               | Tests necesarios                                                                                                                                                | Estado |
| --- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 3.1 | F51     | **Custom fields JSONB por vertical** — Sistema de campos dinámicos sin migraciones. Migration: tabla `vertical_custom_fields` (vertical_id, entity_type ENUM, field_name, field_type ENUM, validation JSONB, sort_order). Columna `custom_data JSONB` en `vehicles`. Admin UI para definir campos. Renderizado dinámico en formularios publicación y ficha pública | >15 tests: definición campos, validación por tipo (text/number/select/boolean/date), renderizado dinámico, CRUD admin, filtrado catálogo, migration, edge cases | ✅     |
| 3.2 | F6      | **Search engine Typesense/Meilisearch** — Integrar motor de búsqueda dedicado para catálogo. `server/utils/searchEngine.ts` con abstracción (adapter pattern: Typesense/Meilisearch/fallback ilike). Indexación vía cron + on-change hook. Búsqueda con typo-tolerance, facets, geo-sort. Composable `useSearch()` reemplaza ilike en catálogo                     | >18 tests: adapter pattern, indexación, búsqueda con typos, facets, geo-sort, fallback ilike, sync on-change, error handling, pagination                        | ✅     |
| 3.3 | #132    | **Redis/Upstash cache layer** — Abstracción `server/utils/cacheLayer.ts` con adapter pattern: Upstash Redis primary → in-memory fallback. Funciones: `cacheGet/cacheSet/cacheInvalidate/cacheBatch`. Migrar rate limiting, feature flags, y session cache a usar esta capa. Config vía env `UPSTASH_REDIS_URL`                                                     | >15 tests: adapter pattern, get/set/invalidate, TTL, batch ops, fallback in-memory, rate limiting migration, error handling, concurrent access                  | ✅     |

---

## FASE 4: Data Intelligence (L-XL) — 2/2 ✅

Features de datos avanzados con alto valor de negocio.

| #   | Backlog | Item                                                                                                                                                                                                                                                                                                                                                                                                                      | Tests necesarios                                                                                                                                                | Estado |
| --- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 4.1 | #56     | **Conectar API real InfoCar/CarVertical** — `server/utils/vehicleReportProvider.ts` con adapter pattern: InfoCar primary → CarVertical fallback → mock dev. Endpoint `server/api/vehicles/[id]/report.get.ts` (gated por créditos). Datos: historial ITV, km registrados, cargas, titularidad. Parseo respuesta a schema interno `VehicleReport`                                                                          | >15 tests: adapter switch, parseo respuesta, cache report 24h, credit deduction, error handling, rate limiting API externa, mock mode dev                       | ✅     |
| 4.2 | #49     | **Network graph / supply chain intelligence** — Migration: `buyer_company_type` ENUM en users (dealer/fleet/rental/leasing/export/end-user), tabla `transaction_graph` (seller_id, buyer_id, vehicle_category, price_range, date). Composable `useSupplyChainIntelligence()`: flujos por categoría, top compradores recurrentes, seasonal patterns. Admin dashboard `/admin/supply-chain` con visualización grafo (D3.js) | >20 tests: clasificación company_type, graph construction, seasonal detection, top buyers, admin auth, visualización data, empty state, filtros categoría/fecha | ✅     |

---

## Prerequisitos externos (configurar cuando sea posible)

| Item       | Servicio                            | Qué configurar                                                          | Impacto                                                 |
| ---------- | ----------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| #132 (3.3) | Upstash Redis                       | Crear cuenta free → `UPSTASH_REDIS_URL` + `UPSTASH_REDIS_TOKEN` en .env | Cache layer usa Redis real en vez de in-memory fallback |
| #56 (4.1)  | InfoCar / CarVertical               | Contratar API → `INFOCAR_API_KEY` + `INFOCAR_API_URL` en .env           | Reports DGT reales en vez de mock                       |
| F6 (3.2)   | Typesense Cloud / Meilisearch Cloud | Crear instancia → `SEARCH_ENGINE_URL` + `SEARCH_ENGINE_KEY` en .env     | Búsqueda real en vez de fallback ilike                  |

> **Nota:** Los 3 items se implementan con adapter pattern + fallback funcional. El código es 100% ejecutable y testeable sin los servicios externos. La activación real es solo configurar env vars.

---

## Criterios de ejecución

1. **Orden:** Fases 0→4 secuencial. Dentro de cada fase, items en orden listado.
2. **Tests obligatorios:** Cada item completado requiere tests que pasen (>80% coverage de lógica nueva).
3. **Commit:** Cada fase completada = 1 commit con mensaje descriptivo. NO commit sin pedirlo.
4. **Verificación:** Tras cada fase, `npm run typecheck && npm run lint` deben pasar.
5. **STATUS.md:** Actualizar al completar cada fase.
6. **Adapter pattern:** Items con servicio externo (#132, #56, F6) implementan abstracción con fallback funcional. Tests cubren ambos paths (real + fallback).
7. **Migraciones:** Todas las tablas nuevas incluyen RLS policies desde día 1.
8. **i18n:** Toda UI nueva usa `$t()` + claves en `es.json`/`en.json`.
9. **Mobile-first:** Todo componente nuevo sigue CSS base 360px con breakpoints ascendentes.

---

## Dependencias entre items

```
Fase 0 (independientes)
  0.1 #208 — sin deps
  0.2 #292 — sin deps (lee scripts k6 existentes)
  0.3 F5  — sin deps

Fase 1 (independientes entre sí)
  1.1 #221 — sin deps (cleanup queries)
  1.2 #46  — sin deps (nueva migration + composable)
  1.3 F41  — usa fingerprinting existente (#29 ✅)

Fase 2 (independientes entre sí)
  2.1 F39  — sin deps (nueva tabla + CRUD)
  2.2 F40  — sin deps (nueva tabla + CRUD)
  2.3 F55  — sin deps (nueva tabla + página)

Fase 3
  3.1 F51  — sin deps (nueva tabla + sistema)
  3.2 F6   — sin deps (adapter pattern)
  3.3 #132 — sin deps (adapter pattern)

Fase 4
  4.1 #56  — sin deps (adapter pattern)
  4.2 #49  — sin deps (nueva migration + composable + admin)
```

> No hay dependencias entre fases ni entre items dentro de cada fase. El orden es por complejidad ascendente, no por bloqueo técnico.

---

## Items descartados de v5 con justificación

| Categoría                  | Items     | Razón                                  |
| -------------------------- | --------- | -------------------------------------- |
| v4 completados             | 36 items  | ✅ Ya implementados                    |
| v3 completados             | 127 items | ✅ Ya implementados                    |
| CSP (#83/#75/#130)         | 3         | Bloqueado por Nuxt 4 estable           |
| SMS OTP (#27)              | 1         | Requiere Twilio API key                |
| Sentry (#198/#246)         | 2         | Requiere DSN producción                |
| CF KV (#161)               | 1         | Requiere CF Workers Paid               |
| CF Queues (#133/#134)      | 2         | Requiere #132 primero → incluido en v5 |
| TypeScript errors (#4)     | 1         | Bloqueado verificación entorno         |
| Staging (#303)             | 1         | Requiere infra Supabase branch/Neon    |
| Fleet rate limit (#34)     | 1         | Requiere CF WAF config (#101)          |
| DGT dependientes (#57/#58) | 2         | Requieren #56 primero → incluido en v5 |
| DEFERRED restantes         | 21        | Requieren servicios/contratos          |
| FUTURO restantes           | 43        | Requieren escala/equipo/tráfico        |
| Operativa (OP1-OP20)       | 20        | Post-lanzamiento                       |
| Fundadores                 | 18        | Tareas humanas                         |
| Pre-Launch Config          | 40        | Dashboards externos                    |
