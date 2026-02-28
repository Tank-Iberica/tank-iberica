# STATUS — Tracciona

**Última actualización:** 2026-02-28 19:30 (P2-2 completo: ~115 strings admin extraídos a i18n)
**Sesiones completadas:** 0–64 + iteraciones de auditoría 1–14 + tareas Haiku
**Puntuación global (auditoría 26-feb):** 79/100

---

## Métricas reales del proyecto

| Módulo           | Documentado | Real (verificado 28-feb)                                          |
| ---------------- | ----------- | ----------------------------------------------------------------- |
| Páginas Vue      | 122         | **124**                                                           |
| Componentes Vue  | —           | **418**                                                           |
| Composables      | 79          | **147**                                                           |
| Endpoints API    | 54          | **62**                                                            |
| Servicios server | 2           | **8**                                                             |
| Migraciones SQL  | 60          | **65**                                                            |
| Tablas BD        | 89          | 89                                                                |
| Tests totales    | 11 E2E      | **34** (12 E2E + 5 seguridad + 11 unit + 3 componentes + 3 setup) |
| CI/CD workflows  | 7           | 7                                                                 |

---

## Estado por módulo

| Módulo                    | Estado         | Notas                                                              |
| ------------------------- | -------------- | ------------------------------------------------------------------ |
| Catálogo + filtros        | ✅ Completo    | FilterBar.vue tiene 1.999 líneas — refactoring pendiente           |
| Fichas de vehículo        | ✅ Completo    | SEO, JSON-LD, OG, hreflang, breadcrumbs                            |
| Auth + perfiles           | ✅ Completo    | Supabase Auth, Google Login, Turnstile CAPTCHA                     |
| Admin panel               | ✅ Completo    | ~115 strings sin i18n (hardcodeados en español)                    |
| Noticias y guías          | ✅ Completo    |                                                                    |
| Legal / GDPR              | ✅ Completo    | RAT (Registro de Actividades de Tratamiento) no formalizado        |
| Verificación vehículos    | ✅ Completo    | Ownership check en `/api/verify-document` **pendiente** (P0)       |
| Subastas                  | ✅ Completo    | Falta índice `auction_bids(auction_id)`                            |
| Publicidad + ads          | ✅ Completo    |                                                                    |
| Pagos Stripe              | ✅ Completo    | Webhooks verificados con firma HMAC                                |
| PWA + offline             | ✅ Completo    |                                                                    |
| CI/CD                     | ✅ Completo    | 7 workflows: lint, typecheck, build, E2E, Lighthouse, DAST, backup |
| WhatsApp pipeline         | ✅ Completo    | Refactorizado de 550 → 75 líneas                                   |
| Multi-vertical            | ✅ Completo    | Columna `vertical` en tablas clave, middleware de aislamiento      |
| Dashboard dealer          | ✅ Completo    |                                                                    |
| Transparencia DSA         | ✅ Completo    |                                                                    |
| Admin KPI + métricas      | ✅ Completo    | 50 errores TypeScript en componentes de balance                    |
| Alertas y favoritos       | ✅ Completo    |                                                                    |
| Herramientas dealer       | ✅ Completo    |                                                                    |
| Datos mercado público     | ✅ Completo    |                                                                    |
| Infra monitoring          | ✅ Completo    | `infra_alerts` no está en `types/supabase.ts` (genera errores TS)  |
| Monetización avanzada     | ✅ Completo    | Trials 14d, dunning, API keys dealers                              |
| Event bus + feature flags | ✅ Completo    |                                                                    |
| SEO avanzado              | ✅ Completo    | Schema.org, hreflang, canonical, sitemap dinámico                  |
| Páginas de error          | ✅ Completo    | 404/500/503 con contexto                                           |
| Seguridad                 | ⚠️ Parcial     | Rate limiting **deshabilitado en producción** — requiere CF WAF    |
| Landing pages builder     | 🔵 Pospuesto   | Se reconsiderará si dealers lo solicitan activamente               |
| Prebid demand partners    | 🔵 Placeholder | Estructura lista, sin cuentas reales configuradas                  |
| API valoración (/v1)      | 🔵 Pospuesto   | Devuelve 503 hasta ≥500 transacciones históricas                   |

---

## Errores críticos conocidos

> Fuente: Auditoría 26-febrero-2026 + análisis de código 28-febrero-2026

### 🔴 P0 — Pueden romper funcionalidad en producción

| ID   | Problema                                                                                                                                                                                                                                                                                                                          | Archivo(s)                                     | Acción                                                                                              |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| P0-1 | **Migración 00065 sin aplicar** — 18 tablas (historico, pipeline_items, infra_clusters, infra_alerts, infra_metrics, market_data, etc.) no existen en la BD. Dashboard dealer, herramientas y métricas infra fallan con error de tabla inexistente.                                                                               | `supabase/migrations/00065_missing_tables.sql` | Aplicar con `npx supabase db push`                                                                  |
| P0-2 | **RLS incorrecto en migración 00065** — Policies usan `dealer_id = auth.uid()` pero dealer_id NO es el UUID del usuario, es el UUID del dealer. Los dealers no pueden acceder a sus propios registros. Afecta: historico, pipeline_items, dealer_contracts, dealer_quotes, maintenance_records, rental_records, dealer_platforms. | `supabase/migrations/00065_missing_tables.sql` | Corregir policies: usar subquery `dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())` |
| P0-3 | **Rate limiting deshabilitado en producción** — el middleware in-memory no funciona en CF Workers (stateless). No hay protección contra abuso.                                                                                                                                                                                    | `server/middleware/rate-limit.ts`              | Configurar reglas en Cloudflare WAF (requiere fundadores)                                           |

### 🟠 P1 — Errores que bloquean CI o exponen información

| ID       | Problema                                                                                                                                          | Archivo(s)                                                                                                                          | Acción      |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| ~~P1-1~~ | ~~**281 errores TypeScript**~~ — **RESUELTO** `npm run typecheck` pasa con 0 errores (281→0, 28-feb).                                             | —                                                                                                                                   | ✅ Completo |
| ~~P1-2~~ | ~~**`types/supabase.ts` desactualizado**~~ — **RESUELTO** Regenerados con `npx supabase gen types` (28-feb 18:30). Todas las 89 tablas incluidas. | `types/supabase.ts`                                                                                                                 | ✅ Completo |
| ~~P1-3~~ | ~~**3 endpoints exponen errores internos**~~ — **VERIFICADO** Todos usan `safeError()` correctamente.                                             | `server/api/stripe/webhook.post.ts:71`, `server/api/generate-description.post.ts:94`, `server/api/reservations/respond.post.ts:102` | ✅ Completo |

### 🟡 P2 — Funcionalidad degradada (no rompe pero impacta)

| ID       | Problema                                                                                                                                                                                                                         | Archivo(s)                                                               | Acción      |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------- |
| ~~P2-1~~ | ~~**`/api/merchant-feed` y `/__sitemap` sin cache CDN**~~ — **VERIFICADO** Ambos endpoints tienen `Cache-Control` + `ETag` implementados.                                                                                        | `server/api/merchant-feed.get.ts:95-96`, `server/api/__sitemap.ts:5,118` | ✅ Completo |
| ~~P2-2~~ | ~~**~115 strings sin i18n en admin**~~ — **RESUELTO** 29 archivos actualizados, 24 nuevos sub-namespaces. 0 hardcoded en templates. Arrays estáticos en `<script>` (branding colors, catalog actions) pendientes — bajo impacto. | `i18n/es.json`, `i18n/en.json`, `app/pages/admin/**`                     | ✅ Completo |
| ~~P2-3~~ | ~~**Faltan índices**: `vehicles(category_id)` y `auction_bids(auction_id)`~~ — **VERIFICADO** Migración 00066 ya creada.                                                                                                         | `supabase/migrations/00066_missing_indexes.sql`                          | ✅ Completo |

### Resueltos (verificados en código)

| ID original             | Problema                                   | Estado                                                                |
| ----------------------- | ------------------------------------------ | --------------------------------------------------------------------- |
| S-01 (ISSUES-AUDITORIA) | `/api/verify-document` sin ownership check | **RESUELTO** — ownership check en líneas 180-215                      |
| S-03 (ISSUES-AUDITORIA) | `/api/health` expuesto públicamente        | **MITIGADO** — soporta HEALTH_CHECK_TOKEN (protegido si se configura) |
| —                       | Cron endpoints sin verificación de secret  | **OK** — los 13 endpoints usan `verifyCronSecret()`                   |
| —                       | Stripe webhook sin verificación de firma   | **OK** — usa `constructEvent()` + fail-closed en producción           |

---

## Pendientes documentación

- [ ] `types/supabase.ts` regenerar (65 migraciones, última aplicada = 00065)
- [ ] `docs/ESTADO-REAL-PRODUCTO.md` desactualizado (generado 25-feb, cifras han cambiado)
- [ ] `README.md` raíz es el template genérico de Nuxt (reemplazar con contenido real)
- [ ] RAT (Registro de Actividades de Tratamiento) GDPR no formalizado como documento legal

---

## Módulos pospuestos (no implementar sin validación de negocio)

| Módulo                           | Condición de activación          |
| -------------------------------- | -------------------------------- |
| API valoración `/v1/valuation`   | ≥500 transacciones históricas    |
| Suscripción datos sectoriales    | ≥1.000 vehículos en catálogo     |
| Dataset anualizado               | ≥12 meses de datos               |
| Merchandising completo           | Demanda medida                   |
| Idiomas 3-7 (fr, de, nl, pl, it) | Demanda real                     |
| Prebid demand partners           | Registro en SSPs + placement IDs |

---

## Auditoría Punto #7 — Archivos >500 líneas

> Fuente: `docs/auditorias/AUDITORIA-26-FEBRERO.md` — Dimensión 2 (Código y arquitectura, 74/100)
> Issue específico: "32 archivos >500 líneas, FilterBar.vue con 1.999 líneas"

**Estado:** Iteraciones 1–14 completas · último commit `67f62d4`

### Lo que se hizo (iter 14, esta sesión)

10 componentes procesados — 8 refactorizados, 2 excluidos (dominados por CSS):

| Componente                                          | Antes | Después | Resultado                                         |
| --------------------------------------------------- | ----- | ------- | ------------------------------------------------- |
| `components/user/UserPanel.vue`                     | 1467  | ~300    | Composable extraído (sesión anterior)             |
| `components/modals/AdvertiseModal.vue`              | 1266  | ~400    | Composable extraído (sesión anterior)             |
| `components/admin/layout/AdminSidebar.vue`          | 1193  | ~300    | Composable extraído (sesión anterior)             |
| `components/catalog/FilterBar.vue`                  | 1157  | ~200    | Split en 2 subcomponentes + composable            |
| `components/catalog/VehicleTable.vue`               | 1132  | ~700    | `useVehicleTable.ts` + `VehicleTablePdfModal.vue` |
| `components/catalog/ControlsBar.vue`                | 1074  | ~350    | Composable extraído (sesión anterior)             |
| `components/admin/utilidades/ContractGenerator.vue` | 1051  | ~565    | `useContractGenerator.ts`                         |
| `components/admin/utilidades/InvoiceGenerator.vue`  | 900   | ~565    | `useInvoiceGenerator.ts`                          |
| `components/layout/AppHeader.vue`                   | 896   | —       | **Excluido** — CSS = 583 líneas; no reducible     |
| `components/DealerPortal.vue`                       | 875   | —       | **Excluido** — CSS = 461 líneas; no reducible     |

Commits: `172104e` (refactoring) · `67f62d4` (minor type fixes)

### Pendiente — Iteración 15 (siguiente sesión, opcional)

Composables grandes que superan 500 líneas:

| Composable                                    | Líneas |
| --------------------------------------------- | ------ |
| `composables/admin/useAdminProductosPage.ts`  | ~968   |
| `composables/admin/useAdminEmails.ts`         | ~902   |
| `composables/admin/useAdminMetrics.ts`        | ~854   |
| `composables/admin/useAdminProductoDetail.ts` | ~779   |
| `composables/useInvoice.ts`                   | ~724   |

**Prompt para retomar:**

> "Lee CLAUDE.md y STATUS.md antes de hacer nada. Cuando estés listo, continúa con el Punto #7 Iteración 15 — composables grandes, empieza por `useAdminProductosPage.ts`."

---

## Sesión 28-feb — Hallazgos menores (completado)

✅ Implementados:

- #16 JSDoc: docs en useAuth.ts y useFavorites.ts
- #17 ARIA live regions: containers polite + assertive en default.vue; useToast anuncia a screen readers
- #18 CHECK constraints: migración 00067 (payments, auction_bids, balance)
- #19 Snyk CI: descomentado en security.yml con continue-on-error
- #20 Legacy banner: [LEGACY] header en todos los 30 docs/legacy
- #22 exceljs chunks: vendor-excel en nuxt.config.ts
- **BONUS:** CLAUDE.md actualizado con regla de model-switching en subtareas mixtas

✅ Commits:

- `4e92bc5` fix: resolve minor audit findings + AdminSidebar refactor + type regen
- `374b82a` fix: correct status value 'active' → 'published' in admin composables
- `2c449f2` docs: add model-switching rule for mixed-complexity subtasks

## Pendiente — Decisión CLAUDE.md

- `CLAUDE2.md` creado con versión pulida del protocolo
- **Decidir:** ¿reemplazar `CLAUDE.md` con `CLAUDE2.md`, quedarse con el original, o hacer una mezcla?

---

## Sesión 28-feb (2ª) — Documento maestro de contexto

✅ Implementado:

- Leídos 83 archivos de documentación (.md, .txt, .pdf) en `docs/` y subcarpetas
- Creado `docs/PROYECTO-CONTEXTO.md` — documento maestro (~370 líneas) que sintetiza visión TradeBase, modelo de negocio, arquitectura, decisiones y criterios de código
- Actualizado `CLAUDE.md`: referencia a PROYECTO-CONTEXTO.md como lectura obligatoria + regla explícita contra Task paralelos
- Actualizado `MEMORY.md`: regla crítica de no usar agentes paralelos

---

## Próxima acción recomendada

1. **P0-1:** Aplicar migración 00065 (`npx supabase db push` — supervisa fallos potenciales de BD)
2. **P0-2:** Corregir RLS en migración 00065 (policies: usar subquery `dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())`)
3. **P0-3:** Configurar Cloudflare WAF rules → activa rate limiting en producción
4. **P2-2:** Extraer ~115 strings sin i18n del panel admin (opcional, bajo impacto)
5. **Auditoría #7 Iteración 15** → refactoring composables grandes (`useAdminProductosPage.ts`, `useAdminEmails.ts`, etc.)
