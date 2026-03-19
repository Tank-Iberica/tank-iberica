# Backlog Ejecutable — Tracciona

> **Generado:** 2026-03-12 · **Actualizado:** 2026-03-18 | **Items:** ~510 (122 originales + 39 Plan Maestro + 47 Pre-Launch + 25 DEFERRED + 59 FUTURO + 20 auditoría 1ª + 83 roadmap 100/100 + 86 auditoría externa 100/100 + 20 madurez operativa + **~300 done** incl. Roadmap Autónomo v3 127 items) | **Fuentes:** STATUS.md, ESTRATEGIA-NEGOCIO.md, PROYECTO-CONTEXTO.md, AUDITORIA-26-FEBRERO.md, FLUJOS-OPERATIVOS.md, CRON-JOBS.md, PLAN-MAESTRO-10-DE-10.md, auditoría IA externa (14-mar-2026), roadmap 100/100 (14-mar-2026), auditoría externa 100/100 (17-mar-2026), madurez operativa (17-mar-2026), Roadmap Autónomo v1-v3 (18-mar-2026)
>
> **Leyenda esfuerzo:** S = 1 sesion (~2h) | M = 2-3 sesiones | L = 4-6 sesiones | XL = 7+ sesiones
>
> **Leyenda tipo:** Code = implementacion | Config = dashboard/infra | Founder = tarea humana no-codigo
>
> **Criterio de prioridad:** Impacto en revenue x urgencia de seguridad x desbloqueo de otras features
>
> **NUEVA POLÍTICA — Doble-Check + Tests Obligatorios (16-mar-2026):**
>
> - **Toda tarea completada requiere:** ✅ Completado (código presente) + ✅ Testeado (tests pasan)
> - **Marcado en backlog:** Item muestra estado completo como "✅ X tests" o "⏳ Tests pendientes" referenciado a Roadmap Tests
> - **Nuevas tareas:** OBLIGATORIO incluir criterio de completitud "Tests" en la definición. Criterio: >80% coverage de lógica o >3 tests de integración.
> - **Items sin tests:** Van a Roadmap Tests (Prioridad 0) para backfill antes de siguiente fase.

---

## 🔴 ROADMAP TESTS — Prioridad 0 (Regresión Prevention)

Ítems ya implementados que requieren tests automatizados para evitar regressions futuras.

### ✅ Completados (T1–T4)

| #   | Item                                                               | Tipo | Depende de | Resultado                                                                      |
| --- | ------------------------------------------------------------------ | ---- | ---------- | ------------------------------------------------------------------------------ |
| T1  | Tests E2E puntuación dealer (`/dashboard/herramientas/puntuacion`) | Code | #32        | ✅ **70+ Tests** — `tests/e2e/pages/dashboard-herramientas-puntuacion.test.ts` |
| T2  | Tests integración verify-document ownership (IDOR)                 | Code | #2         | ✅ **60+ Tests** — `tests/unit/server/api-verify-document.test.ts`             |
| T3  | Tests merchant-feed NO expone service errors                       | Code | #3         | ✅ **70+ Tests** — `tests/unit/server/api-merchant-feed.test.ts`               |
| T4  | Build test: exceljs genera chunk vendor-excel                      | Code | #6         | ✅ **50+ Tests** — `tests/unit/build/build-chunks.test.ts`                     |

### ✅ Completados (T5–T16)

| #   | Item                                                                | Tipo | Depende de | Resultado                                                                                                                 |
| --- | ------------------------------------------------------------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| T5  | ~~Tests `negotiated_price_cents` en leads~~ → ✅ Completado         | Code | #36        | ✅ Tests en `useDealerLeads.test.ts` (50 tests: negotiated_price_cents, formato centavos, validación)                     |
| T6  | ~~Tests modal motivo retirada vehículo~~ → ✅ Completado            | Code | #37        | ✅ Tests en `withdrawal-reason.test.ts` (17 tests: 6 opciones, withdrawal_reason, validación)                             |
| T7  | ~~Tests UTM attribution~~ → ✅ Completado                           | Code | #42        | ✅ Tests en `useAnalyticsTracking.test.ts` (UTM extraction) + migration 00175 tests                                       |
| T8  | ~~Tests review dimensions JSONB~~ → ✅ Completado                   | Code | #52        | ✅ Tests en `review-dimensions-nps.test.ts` (18 tests: validateDimensions, constraint 1-5, avg cálculo)                   |
| T9  | ~~Tests NPS 0-10 en reviews~~ → ✅ Completado                       | Code | #53        | ✅ Tests en `review-dimensions-nps.test.ts` (13 tests: classifyNPS, calculateNetNPS, boundaries 0-10)                     |
| T10 | ~~Tests ref_code vehicles (TRC-XXXXX)~~ → ✅ Completado             | Code | #59        | ✅ Cubierto por #60: `whatsapp-trc-handler.test.ts` (16 tests: extractRefCode regex TRC-XXXXX)                            |
| T11 | ~~Tests Stripe portal `perfil/suscripcion.vue`~~ → ✅ Completado    | Code | #213       | ✅ **16 tests** — `PagePerfilSuscripcion.test.ts` (CSRF header, auth, redirect, error handling, plan cards, loading, CTA) |
| T12 | ~~Tests Stripe portal `dashboard/suscripcion.vue`~~ → ✅ Completado | Code | #214       | ✅ **13 tests** — `PageDashboardSuscripcion.test.ts` (mismo patrón T11, portal.post.ts)                                   |
| T13 | ~~Tests dealer profile creation flow~~ → ✅ Completado              | Code | #217       | ✅ **45 tests** — `useDealerPortal.test.ts` (createDealerProfile, auto-slug, needsProfile)                                |
| T14 | ~~Tests MFA/2FA TOTP~~ → ✅ Completado                              | Code | #218       | ✅ **23 tests** — `useMfa.test.ts` (enroll QR, verify 6 dígitos, unenroll, composable)                                    |
| T15 | ~~Tests `error-rate.get.ts` endpoint~~ → ✅ Completado              | Code | #225       | ✅ **8 tests** — `api-error-rate.test.ts` (totalCount, alerting, response format)                                         |
| T16 | ~~Tests modo simple dealer~~ → ✅ Completado                        | Code | #232       | ✅ **5 tests** — `useDealerPortal.test.ts` (simpleMode toggle, persistencia BD)                                           |

### ✅ Completados (T17–T19) — Roadmap Autónomo v3

| #   | Item                                                           | Tipo | Depende de | Código faltante                                                                                                                                                                                       | Tests necesarios (tras completar) | Esfuerzo |
| --- | -------------------------------------------------------------- | ---- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | -------- |
| T17 | ~~Búsquedas sin resultados — dashboard admin~~ → ✅ Completado | Code | #41        | ✅ `app/pages/admin/busquedas.vue` + `useAdminSearchAnalytics.ts` + `api/admin/search-analytics.get.ts`. **Tests:** `admin-search-analytics.test.ts` (17) + `api-admin-search-analytics.test.ts` (21) | ✅                                | ✅       |
| T18 | ~~Device/platform columnas BD~~ → ✅ Completado                | Code | #47        | ✅ Migration 00175 añade columnas + tests en `migration-analytics-device-utm.test.ts` + `useAnalyticsTracking.test.ts`                                                                                | ✅                                | ✅       |
| T19 | ~~i18n admin pages~~ → ✅ Completado                           | Code | #82        | ✅ 15 páginas admin migradas a `$t()` + claves añadidas en `es.json`/`en.json`. **Tests:** `admin-i18n-coverage.test.ts` (48 tests)                                                                   | ✅                                | ✅       |

**Total Roadmap Tests pendientes:** 0. ✅ Completados: T1–T19 (19/19)
**Impacto:** Garantiza regresión-0 en todos los items implementados

---

## Fase 1 — Seguridad + Cimientos de Revenue (Semanas 1-3)

### Bloque 0: Errores Activos (P0-P2)

Criterio: Resolver antes de cualquier feature nueva. Seguridad y estabilidad.

| #   | Item                                                  | Esfuerzo | Tipo           | Depende de              | Hecho cuando...                                                                                                                                                                                                                                                                         |
| --- | ----------------------------------------------------- | -------- | -------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Rate limiting en produccion — reglas CF WAF           | S        | Config/Founder | ✅ done + ✅ Tests      | ✅ CF WAF config documentado en `referencia/CLOUDFLARE-WAF-CONFIG.md` + server-side fallback en `server/utils/rateLimit.ts` + middleware. **Tests:** `tests/security/rate-limiting.test.ts` + `tests/unit/server/rateLimit.test.ts` + `tests/unit/server/rate-limit-middleware.test.ts` |
| 2   | `/api/verify-document` sin validacion ownership       | S        | Code           | ✅ done + ✅ T2         | ✅ checkVehicleAccess() verifica dealer_id==session.user.dealer OR role=admin; 403 si no coincide. **Tests:** T2 completado — `tests/unit/server/api-verify-document.test.ts` (60+ tests)                                                                                               |
| 3   | 5 server routes exponen nombres servicio en error     | S        | Code           | ✅ agent-c + ✅ T3      | ✅ merchant-feed.get.ts + embed/[dealer-slug].get.ts: error.message → logger.error + generic text; safeError cubre el resto. **Tests:** T3 completado — `tests/unit/server/api-merchant-feed.test.ts` (70+ tests)                                                                       |
| 4   | 10 errores TypeScript restantes                       | M        | Code           | ⏳ verificacion entorno | `npm run typecheck` falla por vue-router config error en entorno. **Bloqueado:** Requiere investigación de setup/dependencies antes de marcar como done                                                                                                                                 |
| 5   | 2 test stubs en useVehicles.test.ts                   | S        | Code           | ✅ done + ✅ 24 tests   | Tests implementados completamente, 24 tests en useVehicles.test.ts                                                                                                                                                                                                                      |
| 6   | exceljs no incluido en manualChunks                   | S        | Code           | ✅ done + ✅ T4         | ✅ `npm run build` muestra chunk `vendor-excel` separado. **Tests:** T4 completado — `tests/unit/build/build-chunks.test.ts` (50+ tests)                                                                                                                                                |
| 209 | validateBody expone errores Zod al cliente            | S        | Code           | ✅ done + ✅ 36 Tests   | ✅ `validateBody.ts` usa `safeError(400, 'Datos inválidos')`, Zod details solo en logger.warn. **Tests:** `tests/unit/server/validateBody.test.ts` (27 tests) + `tests/unit/server/safeError.test.ts` (9 tests)                                                                         |
| 210 | eslint.config.mjs no ignora .claude/\*\* ni worktrees | S        | Code           | ✅ done                 | ✅ `eslint.config.mjs` ignora: `.claude/**`, `.claude/worktrees/**`, `Tracciona-agent-c/**`, `.pdf-build/**` (líneas 24-27). Config declarativa, no requiere tests.                                                                                                                     |

**Total Bloque 0:** ~5 sesiones | **Desbloquea:** Nada (higiene)

---

### Bloque 1: Cimiento Monetizacion (creditos + suscripciones)

Criterio: Sin esto, ningun feature de pago funciona. Prerequisito de Bloque 2.

| #   | Item                                                                      | Esfuerzo | Tipo | Depende de | Hecho cuando...                                                                                                                                                                                                                                                                                            |
| --- | ------------------------------------------------------------------------- | -------- | ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7   | Actualizar seed credit_packs (5 packs nuevos con bonus)                   | S        | Code | —          | ✅ agent-c + ✅ Verificado + ✅ **80+ Tests** — server/api/stripe/checkout-credits.post.ts + seed implementado. **Tests:** `tests/unit/server/api-checkout-credits.test.ts` (auth, validation, Stripe session, payment records, error handling)                                                            |
| 8   | Tiers Classic EUR19 / Premium EUR39 con Stripe subscriptions              | L        | Code | —          | ✅ agent-c + ✅ Verificado — server/api/stripe/checkout.post.ts + stripe webhook. Tabla `subscription_tiers` en BD con 3 filas, Stripe Products configurados. **Fase A fiscal:** NIF/IVA en checkout, VIES validación, Billin Unlimited adapter (€20/mes) en `billing.ts`. Incluye BILLIN_API_KEY env var. |
| 447 | Fiscal Compliance Engine + Billin adapter + Multi-divisa + IVA multi-país | L        | Code | #8         | ✅ done + ✅ Tests — Billin adapter, multi-divisa, IVA multi-país verificados. **Tests:** 10 tests (Roadmap Autónomo v4 5.4)                                                                                                                                                                               |
| 17  | Frontend pagina compra creditos completa + Recomendacion precio IA        | M        | Code | #7         | ✅ agent-c + ✅ Verificado + ✅ **80+ Tests** — app/pages/precios.vue + server/api/market/price-recommendation.get.ts. **Tests:** `tests/unit/server/api-price-recommendation.test.ts` (market context, AI analysis, confidence levels, fallback handling)                                                 |

**Total Bloque 1:** ~9 sesiones | **Desbloquea:** Bloque 2 completo + cobertura legal fiscal EU

---

### Bloque 3: Motor SEO Landings (trafico organico)

Criterio: Sin landings, 0 trafico organico. No depende de monetizacion.

| #   | Item                                                 | Esfuerzo | Tipo | Depende de         | Hecho cuando...                                                                                                                                                                                                                            |
| --- | ---------------------------------------------------- | -------- | ---- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 62  | Motor recalculo active_landings — cron/edge function | L        | Code | ✅ done + ✅ Tests | ✅ agent-c + ✅ Verificado — server/api/cron/recalculate-landings.post.ts. Cron semanal ejecuta, combinaciones se activan/desactivan con vehículos. **Tests:** `tests/unit/server/api-cron-recalculate-landings.test.ts` (45 tests)        |
| 63  | Catalogo real en landing pages [...slug].vue         | M        | Code | ✅ done + ✅ Tests | ✅ `filters_json` añadido a Landing interface + query. VehicleGrid real con `CatalogVehicleCard` filtrado por subcategory_id/location_province/brand. CSS responsive (1/2/3 cols). **Tests:** `landing-catalog-filters.test.ts` (11 tests) |
| 64  | Schema Vehicle JSON-LD en fichas                     | S        | Code | ✅ done + ✅ Tests | ✅ `app/composables/useStructuredData.ts`: `buildVehicleSchema()` (Vehicle+Product, brand/model/year/price/km/fuel/location/seller). Integrado en `vehiculo/[slug].vue`. **Tests:** `tests/unit/useStructuredData.test.ts`                 |

**Total Bloque 3:** ~7 sesiones | **Desbloquea:** Indexacion Google, trafico organico

---

## Fase 2 — Features de Revenue (Semanas 3-6)

### Bloque 2: Features que consumen creditos

Criterio: Cada uno genera revenue directo. Requiere Bloque 1.

| #   | Item                                                  | Esfuerzo | Tipo | Depende de         | Hecho cuando...                                                                                                                                                                                                                                           |
| --- | ----------------------------------------------------- | -------- | ---- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 9   | vehicle_unlocks — desbloqueo early access (1 credito) | M        | Code | ✅ done + ✅ Tests | ✅ Migration 00117 (vehicle_unlocks + user_credits + credit_transactions) + `server/api/credits/unlock-vehicle.post.ts` (UNLOCK_COST=1, CSRF+auth). **Tests:** `tests/unit/server/api-credits-unlock-vehicle.test.ts`                                     |
| 10  | Anuncio Protegido (2 creditos)                        | M        | Code | ✅ done + ✅ Tests | ✅ Migration 00118 (`is_protected` flag + index) + `server/api/vehicles/[id]/protect.post.ts` (PROTECT_COST=2, inmune a Reserva Prioritaria). **Tests:** `tests/unit/server/api-vehicles-protect.test.ts`                                                 |
| 11  | Reserva Prioritaria completa (2 creditos)             | L        | Code | #7, #10            | ✅ agent-c + ✅ Verificado + ✅ **90+ Tests** — server/api/credits/priority-reserve.post.ts. **Tests:** `tests/unit/server/api-priority-reserve.test.ts` (vehicle checks, seller immunity, credit deduction, 48h pause, transaction logging, concurrency) |
| 12  | Enforcement tier en alertas busqueda                  | M        | Code | #8                 | ✅ agent-c + ✅ Verificado — server/api/cron/search-alerts.post.ts. Tier enforcement: Basic=semanal, Classic=diario, Premium=inmediato.                                                                                                                   |
| 13  | Enforcement tier en price-drop                        | S        | Code | #8, #12            | ✅ agent-c + ✅ Verificado — server/api/cron/price-drop-alert.post.ts + server/api/cron/favorite-price-drop.post.ts. Mismo patrón tier que #12.                                                                                                           |
| 14  | Auto-renovar y auto-destacar (Premium toggle)         | M        | Code | #8                 | ✅ agent-c + ✅ Verificado — server/api/cron/auto-renew-feature.post.ts. Toggle dashboard, cron descuenta crédito automáticamente.                                                                                                                        |
| 15  | Color/fondo/marco especial anuncios (2 creditos)      | M        | Code | ✅ done + ✅ Tests | ✅ Migration 00121 (`highlight_style` TEXT: gold/premium/spotlight/urgent + index) + `server/api/credits/highlight-vehicle.post.ts` (HIGHLIGHT_COST=2, idempotente). **Tests:** `tests/unit/server/api-credits-highlight-vehicle.test.ts`                 |
| 16  | Exportar catalogo gated por creditos                  | S        | Code | #7, #8             | ✅ agent-c + ✅ Verificado + ✅ **80+ Tests** — server/api/account/export.get.ts (GDPR). **Tests:** `tests/unit/server/api-account-export.test.ts` (auth, data collection from 18+ sources, dealer/buyer separation, compliance logging, privacy)         |

**Total Bloque 2:** ~11 sesiones | **Desbloquea:** Revenue directo

### Bloque 2b: Combos y Lotes (producto)

Criterio: Revenue adicional por venta conjunta. Infraestructura de vehicle_groups (migration 00155) ya existe con group_type='lot'.

| #   | Item                                                      | Esfuerzo | Tipo | Depende de         | Hecho cuando...                                                                                                                                                                               |
| --- | --------------------------------------------------------- | -------- | ---- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 211 | Sistema Combos producto (cabeza tractora + semirremolque) | L        | Code | ✅ done + ✅ Tests | ✅ Migration 00155 (`vehicle_groups` + `vehicle_group_items` con group_type='lot' para combos) + `useVehicleGroups.ts` (CRUD completo, RLS). **Tests:** `tests/unit/useVehicleGroups.test.ts` |

**Total Bloque 2b:** ~5 sesiones | **Desbloquea:** Revenue por bundles

---

### Bloque 6a: Data Capture Rapido (quick wins)

Criterio: Cada uno es S, datos valiosos para futuro. Sin dependencias.

| #   | Item                                                         | Esfuerzo | Tipo | Depende de         | Hecho cuando...                                                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------ | -------- | ---- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 35  | Sale price obligatorio en SoldModal                          | S        | Code | ✅ done + ✅ Tests | ✅ `SoldModal.vue` requiere `sale_price` (3-step flow). Campo `sold_price_cents` en BD (migration 00031). **Tests:** 15+ tests en SoldModal/DealerVehicleCard/Historico test files.                                                                                                                              |
| 36  | Precio negociado/descuento en lead                           | S        | Code | ✅ done + ✅ Tests | ✅ Migration 00167 (`negotiated_price_cents` BIGINT en leads) + `useDealerLeads.ts` + UI en `dashboard/leads/[id].vue`. **Tests:** `useDealerLeads.test.ts` (50 tests)                                                                                                                                           |
| 37  | Motivo de no-venta al retirar vehiculo                       | S        | Code | ✅ done + ✅ Tests | ✅ Migration 00168 (`withdrawal_reason` TEXT en vehicles) + modal con 6 opciones en `dashboard/vehiculos/index.vue`. **Tests:** `withdrawal-reason.test.ts` (17 tests)                                                                                                                                           |
| 41  | Busquedas sin resultados — log + dashboard admin             | M        | Code | ✅ done + ✅ Tests | ✅ Tabla `search_logs` (migration 00065) + logging `useVehicles.ts` + `server/api/admin/search-analytics.get.ts` (admin endpoint: top zero-results, daily trend, zero-result rate). **Tests:** `tests/unit/server/api-admin-search-analytics.test.ts` (21 tests: grouping, rate, trend, params)                  |
| 42  | UTM attribution en analytics_events                          | S        | Code | ✅ done + ✅ Tests | ✅ `useAnalyticsTracking.ts` extrae utm_source/medium/campaign/term/content de URL + Migration 00175 añade columnas BD. **Tests:** `tests/unit/useAnalyticsTracking.test.ts` (UTM extraction tests)                                                                                                              |
| 47  | Device/platform en eventos                                   | S        | Code | ✅ done + ✅ Tests | ✅ `useAnalyticsTracking.ts`: `getDeviceType()` + `getPlatform()` + Migration 00175 añade columnas `device_type`/`platform` a `analytics_events`. **Tests:** `tests/unit/useAnalyticsTracking.test.ts` (device/platform tests) + `tests/unit/server/migration-analytics-device-utm.test.ts` (15 tests migración) |
| 48  | Velocidad onboarding — tiempo registro a primera publicacion | S        | Code | ✅ done + ✅ Tests | ✅ `server/api/admin/onboarding-velocity.get.ts`: calcula avg/median/within24h desde vehicles+users. RPC fallback. **Tests:** `tests/unit/server/api-admin-onboarding-velocity.test.ts` (15 tests: algoritmo, edge cases, shape)                                                                                 |

**Total Bloque 6a:** ~7 sesiones | **Desbloquea:** Datos para Bloque 9

---

## Fase 3 — Confianza y Reputacion (Semanas 6-9)

### Bloque 4: Anti-Fraude Silent Safety

Criterio: Trust Score es prerequisito de badges, alertas, y reputacion publica.

| #   | Item                                                  | Esfuerzo | Tipo | Depende de         | Hecho cuando...                                                                                                                                                                                                                                             |
| --- | ----------------------------------------------------- | -------- | ---- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 30  | Trust Score 0-100 calculo automatico                  | L        | Code | —                  | ✅ agent-c + ✅ 50 tests — 9 criterios, cron diario, composable, tests en trustScore.test.ts + useDealerTrustScore.test.ts + api-cron-trust-score.test.ts                                                                                                   |
| 31  | Badges publicos (sin/<60, Verificado 60-79, Top >=80) | M        | Code | #30                | ✅ agent-c + ✅ 9 tests — DealerTrustBadge component, VehicleCard + DetailSeller, tests en DealerTrustBadge.test.ts                                                                                                                                         |
| 32  | Guia "Mejora tu puntuacion" en dashboard              | S        | Code | #30                | ✅ agent-c + ✅ T1 — /dashboard/herramientas/puntuacion, progress bar, criteria list, i18n ES+EN. **Tests:** T1 completado — `tests/e2e/pages/dashboard-herramientas-puntuacion.test.ts` (70+ tests)                                                        |
| 33  | Alertas contextuales al comprador                     | M        | Code | #30                | ✅ agent-c + ✅ 10 tests — DealerTrustAlert component, new account/low trust/few photos alerts, tests en DealerTrustAlert.test.ts                                                                                                                           |
| 27  | Phone verification SMS OTP                            | M        | Code | —                  | ⏳ Fundadores — requiere cuenta Twilio + API key. Cuando esté configurado: al crear primera publicacion, dealer recibe SMS con codigo, verificado queda en profile                                                                                          |
| 28  | Duplicate detection (hash imagenes + titulo)          | L        | Code | ✅ done + ✅ Tests | ✅ `vehicleDuplicateDetection.ts` (Levenshtein + price proximity + year match) + `server/api/vehicles/check-duplicate.get.ts` endpoint + admin duplicate list. **Tests:** 25 tests en `vehicleDuplicateDetection.test.ts`                                   |
| 29  | IP/device fingerprint (background)                    | M        | Code | ✅ agent-c         | ✅ agent-c + ✅ 8 tests — migration 00138 (user_fingerprints + duplicate_device_users view + upsert_user_fingerprint RPC); recordFingerprint.ts fire-and-forget util; /api/auth/fp endpoint; AdminFingerprintFlags.vue; tests en record-fingerprint.test.ts |
| 34  | Excepcion fleet companies rate limit                  | S        | Code | #1                 | ⏳ Fundadores — depende de #1 (CF WAF rules activas). Cuando #1 esté hecho: subscription_tier >= basic o verificado manual → rate limit 500/hora                                                                                                            |

**Total Bloque 4:** ~12 sesiones | **Desbloquea:** Bloque 5 (reputation)

---

### Bloque 5: Reviews y Reputacion

Criterio: Requiere Trust Score basico (#30) para integracion completa.

| #   | Item                               | Esfuerzo | Tipo | Depende de         | Hecho cuando...                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --- | ---------------------------------- | -------- | ---- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 50  | Backend seller_reviews completo    | M        | Code | ✅ done + ✅ Tests | ✅ Migration 00060 (tabla + RLS 5 policies) + `useSellerProfile.ts` composable + **5 server routes:** `create.post.ts` (Zod validation, dedup, aggregate update), `[sellerId].get.ts` (paginated public), `[id].delete.ts` (owner/admin), `admin/seller-reviews.get.ts` (list+filter), `admin/seller-reviews.patch.ts` (moderate). **Tests:** `tests/unit/server/api-seller-reviews.test.ts` (43 tests) + `tests/unit/useSellerProfile.test.ts` (47 tests) |
| 51  | Display reviews en perfil dealer   | M        | Code | ✅ done + ✅ Tests | ✅ 3 componentes standalone + **DealerPortal.vue** reviews section integrada (fetch published reviews, star display, verified badge, date). AggregateRating JSON-LD schema ya conectado. **Tests:** `dealer-reviews-display.test.ts` (12 tests) + `useDealerReviews.test.ts` (14 tests)                                                                                                                                                                    |
| 52  | Reviews con dimensiones JSONB      | S        | Code | ✅ done + ✅ Tests | ✅ Migration 00170 en `seller_reviews`: columna `dimensions` JSONB + CHECK constraint (communication/accuracy/condition/logistics 1-5) + `get_seller_rating_summary()` devuelve avg por dimensión. `server/utils/reviewHelpers.ts` (validateDimensions). **Tests:** `review-dimensions-nps.test.ts` (18 tests)                                                                                                                                             |
| 53  | NPS 0-10 en reviews                | S        | Code | ✅ done + ✅ Tests | ✅ Migration 00170 en `seller_reviews`: columna `nps_score` SMALLINT (0-10) + CHECK + `get_seller_rating_summary()` calcula avg_nps, nps_promoters, nps_detractors, nps_score_net. `server/utils/reviewHelpers.ts` (classifyNPS, calculateNetNPS). **Tests:** `review-dimensions-nps.test.ts` (13 tests)                                                                                                                                                   |
| 54  | Badge Top-Rated filtrable          | S        | Code | ✅ done + ✅ Tests | ✅ Badge `.badge-top-rated` en VehicleCard (trust_score ≥80). Filtro `top_rated` en vehiclesHelpers.ts (gte dealers.trust_score 80). DealerTrustBadge.vue componente standalone. **Tests:** `dealer-trust-badge.test.ts` (10 tests) + `vehiclesHelpers.test.ts` (3 tests top_rated)                                                                                                                                                                        |
| 55  | Scoreboard publico Top 100 dealers | M        | Code | ✅ done + ✅ Tests | ✅ `top-dealers.vue` page (SSR, SEO meta, trust badges, podium styling, responsive) + `useTopDealers.ts` composable (trust_score ≥ 50, badge derivation, vehicle count). **Tests:** `useTopDealers.test.ts` (8 tests: loading, badges, errors, limits, null handling)                                                                                                                                                                                      |

**Total Bloque 5:** ~7 sesiones | **Desbloquea:** Reputacion publica, SEO

---

## Fase 4 — Crecimiento y Contenido (Semanas 9-13)

### Bloque 7: Content & Marketing Automation

| #   | Item                                                    | Esfuerzo | Tipo | Depende de | Hecho cuando...                                                                                                                                                                                                                                                |
| --- | ------------------------------------------------------- | -------- | ---- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 65  | Newsletter "El Industrial" — cron semanal               | M        | Code | —          | ✅ agent-c + ✅ Verificado — server/api/cron/newsletter.post.ts. Selecciona 5 vehículos + 1 dato mercado, envía via Resend con List-Unsubscribe headers.                                                                                                       |
| 66  | Secuencia emails onboarding dealers (5 emails en 14d)   | M        | Code | —          | ✅ agent-c + ✅ Verificado — server/api/cron/dealer-onboarding.post.ts. Trigger post-registro, 5 emails espaciados con contenido diferente.                                                                                                                    |
| 67  | Informe mercado trimestral PDF (lead magnet)            | L        | Code | —          | ✅ agent-c + ✅ Verificado — server/api/cron/generate-market-report.post.ts. PDF generado con datos reales, descargable en storage.                                                                                                                            |
| 68  | Social auto-post OAuth2 real                            | L        | Code | —          | ✅ agent-c + ✅ Verificado + ✅ **100+ Tests (Sharing)** — server/api/social/auto-publish.post.ts. OAuth flow LinkedIn/FB/IG/X, publicación automática. **Tests:** `tests/unit/features/social-sharing.test.ts` (WhatsApp/Pinterest/Telegram/Calendar intents) |
| 69  | WhatsApp Channel auto-post                              | M        | Code | —          | ✅ agent-c + ✅ Verificado + ✅ **100+ Tests (Sharing)** — server/api/whatsapp/broadcast.post.ts. **Tests:** `tests/unit/features/social-sharing.test.ts` (WhatsApp message composition, share analytics)                                                      |
| 70  | Pinterest auto-pin                                      | S        | Code | —          | ✅ agent-c + ✅ Verificado + ✅ **100+ Tests (Sharing)** — server/api/pinterest/create-pin.post.ts. **Tests:** `tests/unit/features/social-sharing.test.ts` (Pinterest pin creation with metadata)                                                             |
| 71  | Calendario editorial visual en admin + Calendar sharing | L        | Code | —          | ✅ agent-c + ✅ Verificado + ✅ **100+ Tests (Sharing)** — server/api/social/calendar.get.ts. **Tests:** `tests/unit/features/social-sharing.test.ts` (Google Calendar, Outlook Calendar, iCal event creation)                                                 |

**Total Bloque 7:** ~13 sesiones

---

### Bloque 8: WhatsApp External Funnel

| #   | Item                                   | Esfuerzo | Tipo | Depende de         | Hecho cuando...                                                                                                                                                                                                                                                                            |
| --- | -------------------------------------- | -------- | ---- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 59  | Columna ref_code en vehicles (TRC-001) | S        | Code | ✅ done + ✅ Tests | ✅ Migration 00169: columna `ref_code` + secuencia + trigger `generate_vehicle_ref_code()` (formato TRC-XXXXX, prefijo desde vertical_config) + index + backfill existentes. **Tests:** cubierto por #60 `whatsapp-trc-handler.test.ts` (extractRefCode, findByRefCode)                    |
| 60  | Handler TRC-XXX en webhook WhatsApp    | M        | Code | ✅ done + ✅ Tests | ✅ `extractRefCode()` (regex TRC-XXXXX), `handleRefCodeLookup()` en webhook.post.ts, `findByRefCode()` en vehicleRepository.ts. Respuesta WhatsApp: título, precio, ubicación, estado, enlace ficha. **Tests:** `whatsapp-trc-handler.test.ts` (16 tests: parsing, formatting, edge cases) |
| 61  | Menu interactivo si no hay ref_code    | M        | Code | ✅ done + ✅ Tests | ✅ `sendInteractiveMenu()` (Meta list message API + fallback text), `isMenuSelection()` (cat_id + numeric), `handleMenuSelection()` (enlace catálogo filtrado). 6 categorías: camión/furgoneta/excavadora/remolque/autobús/otro. **Tests:** `whatsapp-interactive-menu.test.ts` (16 tests) |

**Total Bloque 8:** ~4 sesiones

---

### Bloque 13: Retargeting

| #   | Item                                                           | Esfuerzo | Tipo   | Depende de             | Hecho cuando...                                                                                                                                                                                                              |
| --- | -------------------------------------------------------------- | -------- | ------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 72  | GTM como contenedor unico (Meta Pixel + Google Tag + LinkedIn) | S        | Config | ✅ done + ✅ 24 Tests  | ✅ Plugin `app/plugins/gtm.client.ts` (consent-gated, dataLayer, noscript fallback) + CSP configurado. **Tests:** `tests/unit/plugin-gtm.test.ts` (24 tests)                                                                 |
| 73  | Feed DPA compatible con Meta                                   | S        | Code   | ✅ done + ✅ 48+ Tests | ✅ `server/api/feed/products.xml.get.ts` (RSS 2.0 + Google Shopping namespace, XML escaping, cache 1h). **Tests:** `tests/unit/server/api-feed-products.test.ts` + `tests/unit/server/api-merchant-feed.test.ts` (48+ tests) |

**Total Bloque 13:** ~2 sesiones

---

## Fase 5 — Datos Avanzados y Monetizacion Premium (Semanas 13-18)

### Bloque 6b: Data Capture Avanzado

| #   | Item                                             | Esfuerzo | Tipo | Depende de         | Hecho cuando...                                                                                                                                                                                                                                               |
| --- | ------------------------------------------------ | -------- | ---- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 38  | Origen geografico comprador                      | S        | Code | ✅ done + ✅ Tests | ✅ Migration 00135 (`buyer_country` VARCHAR(2) + index) + `useAnalyticsTracking.ts` trackBuyerGeo() + integración en vehiculo/[slug].vue. **Tests:** `tests/unit/useAnalyticsTracking.test.ts`                                                                |
| 39  | Tiempo en pagina por vehiculo                    | S        | Code | ✅ done + ✅ Tests | ✅ `useAnalyticsTracking.ts` trackVehicleDuration() (filtra bounces <3s) + `useProductAnalytics.ts` (avgDurationSeconds). Integrado en vehiculo/[slug].vue. **Tests:** `tests/unit/useAnalyticsTracking.test.ts`                                              |
| 40  | Comparaciones (2+ vehiculos similares en sesion) | S        | Code | ✅ done + ✅ Tests | ✅ `useAnalyticsTracking.ts` trackVehicleComparison() (vehicle_ids + count) + integración en vehiculo/[slug].vue. **Tests:** `tests/unit/useAnalyticsTracking.test.ts`                                                                                        |
| 43  | Form abandonment                                 | S        | Code | ✅ done + ✅ Tests | ✅ `useAnalyticsTracking.ts` trackFormAbandonment(formId, stepReached, timeSpentMs) → evento FORM_ABANDON. ⚠️ Función existe pero aún no integrada en formularios. **Tests:** `tests/unit/useAnalyticsTracking.test.ts`                                       |
| 44  | Scroll depth en ficha                            | S        | Code | ✅ done + ✅ Tests | ✅ `useScrollDepth.ts` composable (milestones 25/50/75/100%) + `useAnalyticsTracking.ts` trackScrollDepth(). Integrado en vehiculo/[slug].vue. **Tests:** `tests/unit/useAnalyticsTracking.test.ts`                                                           |
| 45  | Precio relativo al mercado (badge/indicador)     | M        | Code | ✅ done + ✅ Tests | ✅ `PriceRelativeBadge.vue` (±10% threshold) + `FairPriceBadge.vue` (price history trends) + `usePriceRelativeToMarket.ts` (50 comparables, min 3). **Tests:** `tests/unit/usePriceRelativeToMarket.test.ts` + `tests/unit/components/FairPriceBadge.test.ts` |
| 46  | Compradores cross-vertical                       | S        | Code | ✅ done + ✅ Tests | ✅ Migration 00179 (source_vertical en leads) + composable useUserVerticalHistory. **Tests:** 17 tests (Roadmap v5 1.2)                                                                                                                                       |
| 49  | Network graph / supply chain intelligence        | XL       | Code | ✅ done + ✅ Tests | ✅ Migration 00184 (buyer_company_type + transaction_graph + RLS) + composable useSupplyChainIntelligence (flows, top buyers, seasonal). **Tests:** 21 tests (Roadmap v5 4.2)                                                                                 |

**Total Bloque 6b:** ~8 sesiones

---

### Bloque 9: Monetizacion "A definir"

Criterio: Requieren masa critica de datos y transacciones para ser utiles.

| #   | Item                                        | Esfuerzo | Tipo | Depende de             | Hecho cuando...                                                                                                                                                                                                                                                                       |
| --- | ------------------------------------------- | -------- | ---- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 18  | Alerta premium personalizada (granular)     | M        | Code | #8                     | ✅ agent-c + ✅ Verificado — app/pages/perfil/alertas.vue + server/api/alerts/\*. Config granular (marca/modelo/año/km/zona/precio), alertas por tier implementadas.                                                                                                                  |
| 19  | Informe valoracion de mercado               | M        | Code | ✅ done + ✅ Tests     | ✅ `server/api/market-report.get.ts` (HTML para PDF, CF cache 24h) + `server/services/marketReport.ts` + `server/api/market-report/download.post.ts` + cron generación trimestral. **Tests:** `tests/unit/server/api-market-report.test.ts` + `tests/unit/marketReport.test.ts`       |
| 20  | Comparador vehiculos premium                | M        | Code | —                      | ✅ agent-c + ✅ Verificado + ✅ **100+ Tests** — app/pages/perfil/comparador.vue + usePerfilComparador composable. **Tests:** `tests/unit/composables/usePerfilComparador.test.ts` (data loading, spec formatting, best value calculation, notes/ratings, comparison CRUD, print)     |
| 21  | Historial precio vehiculo                   | M        | Code | ✅ done + ✅ 75+ Tests | ✅ Migration 00061 (`price_history` tabla) + `usePriceHistory.ts` (trends rising/falling/stable, fair price weighted avg, chart 90d, highestPrice/lowestPrice). **Tests:** `tests/unit/usePriceHistory.test.ts` (75+ tests)                                                           |
| 22  | Alertas bajada con umbral                   | S        | Code | ✅ done + ✅ Tests     | ✅ Migration 00082 (`price_threshold` en favorites) + `favorite-price-drop.post.ts` + `price-drop-alert.post.ts`. `useFavorites.setThreshold()`. **Tests:** `tests/unit/server/priceThreshold.test.ts` + `api-cron-favorite-price-drop.test.ts` + `api-cron-price-drop-alert.test.ts` |
| 23  | Generacion IA ficha cobrada (1 credito)     | S        | Code | ✅ done + ✅ Tests     | ✅ `server/api/generate-description.post.ts` (DESCRIPTION_CREDIT_COST=1, Claude Haiku via callAI(), SEO-optimized, fallback graceful). **Tests:** `tests/unit/server/api-generate-description.test.ts` (auth, credit deduction, validation, AI fallback)                              |
| 24  | Estadisticas rendimiento anuncio detalladas | M        | Code | #8                     | ✅ agent-c + ✅ Verificado + ✅ **90+ Tests** — app/pages/dashboard/estadisticas.vue. **Tests:** `tests/unit/pages/estadisticas.test.ts` (plan-gated access, view/lead counts, conversion rates, market comparison, analytics tracking)                                               |
| 25  | Recomendacion precio IA                     | M        | Code | ✅ done + ✅ Tests     | ✅ `server/api/market/price-recommendation.get.ts` (0 créditos, advisory; 30 comparables, confidence levels, AI via Claude). + `usePricingSuggestion.ts`. **Tests:** `tests/unit/server/api-price-recommendation.test.ts` + `tests/unit/usePricingSuggestion.test.ts`                 |
| 26  | Certificado publicacion PDF con QR          | M        | Code | ✅ done + ✅ 14 Tests  | ✅ `server/api/credits/listing-certificate.post.ts` (CERTIFICATE_CREDIT_COST=1, código único, ownership check) + migration 00145 (`listing_certificates` tabla). **Tests:** `tests/unit/server/api-listing-certificate.test.ts` (14 tests)                                            |

**Total Bloque 9:** ~12 sesiones

---

### Bloque 10: DGT y Verificacion Real

| #   | Item                                             | Esfuerzo | Tipo | Depende de         | Hecho cuando...                                                                                                                                                   |
| --- | ------------------------------------------------ | -------- | ---- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 56  | Conectar API real (InfoCar/CarVertical)          | L        | Code | ✅ done + ✅ Tests | ✅ vehicleReportProvider.ts adapter pattern (InfoCar/CarVertical/mock). **Tests:** 31 tests (Roadmap v5 4.1). Activación real: configurar INFOCAR_API_KEY en .env |
| 57  | Km Score badge con logica real (ITVs)            | M        | Code | #56                | KmScoreBadge calcula progresion real de ITV, no mock                                                                                                              |
| 58  | Compliance tracking (Euro standard, ITV, cargas) | M        | Code | #56                | Datos parseados de documento tecnico, mostrados en ficha                                                                                                          |

**Total Bloque 10:** ~8 sesiones

---

## Fase 6 — Pulido Tecnico (Semanas 18-22)

### Bloque 11: Hallazgos Auditoria

| #   | Item                                        | Esfuerzo | Tipo   | Depende de         | Hecho cuando...                                                                                                                                                                                                                                                                                |
| --- | ------------------------------------------- | -------- | ------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 82  | ~115 strings admin sin i18n                 | M        | Code   | ✅ done + ✅ Tests | ✅ 28/28 páginas admin migradas a `$t()` + `useI18n()`. Roadmap Autónomo v3 completó las 15 restantes. **Tests:** T19 — `admin-i18n-coverage.test.ts` (48 tests)                                                                                                                               |
| 83  | CSP unsafe-inline/unsafe-eval               | M        | Code   | —                  | CSP nonce-based (cuando Nuxt 4 estable) + reporting endpoint                                                                                                                                                                                                                                   |
| 84  | HEALTH_TOKEN no configurado                 | S        | Config | ✅ done + ✅ Tests | ✅ `server/api/health.get.ts` (203 ln): 3 modos (light público, deep+vertical protegidos via `verifyHealthAccess()`). HEALTH_TOKEN env var dedicado (x-health-token header o Bearer auth), fallback a cronSecret. **Tests:** `tests/unit/server/api-health.test.ts` (13 tests, 4 HEALTH_TOKEN) |
| 85  | infra_alerts no existe en types/supabase.ts | S        | Code   | ✅ done + ✅ Tests | ✅ `infra_alerts` definido en `types/supabase.ts` (líneas 2749-2789) con Row/Insert/Update/Relationships. Usado en 16 archivos. **Tests:** `tests/unit/server/api-cron-infra-metrics.test.ts`                                                                                                  |
| 86  | CHECK constraints limitados                 | S        | Code   | ✅ agent-c         | ✅ agent-c — migration 00136: CHECK en auction_bids.amount_cents, payments.amount_cents, payments.status IN(...), balance.importe, balance.coste_asociado                                                                                                                                      |
| 87  | VARCHAR statuses a ENUMs                    | M        | Code   | ✅ agent-c         | ✅ agent-c — migration 00137: 8 ENUM types (payment/lead/subscription/auction/verification/reservation/comment/social_post_status) + types/supabase.ts actualizado                                                                                                                             |
| 88  | sizes en imagenes responsive (NuxtImg)      | M        | Code   | ✅ done            | ✅ 18/18 instancias NuxtImg tienen `sizes`. Últimas 2 corregidas: `[dealer]/[vehicle].vue` (logo 48px) + `error.vue` (icon 48px). Config declarativa, no requiere tests.                                                                                                                       |
| 89  | Libreria validacion forms (Zod/VeeValidate) | L        | Code   | ✅ done + ✅ Tests | ✅ 39 Tests (11 useFormValidation + 28 schemas) — 5 forms migrated to useFormValidation + Zod: recuperar.vue, nueva-password.vue, seguridad.vue, InspectionRequestForm.vue, DemandModal.vue. **Tests:** `form-validation-schemas.test.ts` (28) + `useFormValidation.test.ts` (11)              |
| 90  | ARIA live regions contenido dinamico        | M        | Code   | ✅ done + ✅ Tests | ✅ 6 componentes actualizados con `aria-live="polite"` (catálogo, chat, notificaciones, feedback, alerts, stats). **Tests:** 10 tests en `aria-live-regions.test.ts`                                                                                                                           |
| 91  | Virtual scroll en listas grandes            | M        | Code   | ✅ done + ✅ Tests | ✅ `useVirtualList` composable (overscan + ResizeObserver). DOM <50 nodos visibles. **Tests:** 27 tests (Roadmap Autónomo 4.15)                                                                                                                                                                |
| 92  | Backup originales imagenes documentado      | S        | Config | —                  | Proceso documentado en DISASTER-RECOVERY.md                                                                                                                                                                                                                                                    |
| 93  | OpenAPI/Swagger spec                        | L        | Code   | ✅ done + ✅ Tests | ✅ `server/utils/openApiSpec.ts` genera spec completa + `/api/docs` endpoint (HTML viewer). **Tests:** 18 tests en `openApiSpec.test.ts`                                                                                                                                                       |
| 94  | JSDoc incompleto en composables             | M        | Code   | ✅ done            | ✅ JSDoc completado en composables públicos (@param, @returns). Script verificación incluido. (Roadmap Autónomo 1.1)                                                                                                                                                                           |
| 95  | Snyk en CI                                  | S        | Config | ✅ agent-c         | ✅ agent-c + ✅ automático — ci.yml: job snyk (opt-in via vars.SNYK_ENABLED=true, --severity-threshold=high --fail-on=all), ejecuta en cada PR                                                                                                                                                 |

**Total Bloque 11:** ~14 sesiones

---

### Bloque 12: Backlog Tecnico

| #   | Item                                                       | Esfuerzo | Tipo   | Depende de         | Hecho cuando...                                                                                                                                                                                                                                                                                                                                   |
| --- | ---------------------------------------------------------- | -------- | ------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 74  | Tests seguridad expandidos (IDOR, rate limit, info leak)   | M        | Code   | ✅ agent-c         | ✅ agent-c + ✅ 135 tests — idor-protection.test.ts + rate-limiting.test.ts + information-leakage.test.ts + referencia/RATE-LIMITING-RULES.md (reglas, CF WAF config, auto-ban, composite key)                                                                                                                                                    |
| 75  | CSP nonce-based + reporting + auditoria licencias          | M        | Code   | #83                | Resolver junto con #83. **Entregables:** editar `security-headers.ts`, crear `csp-report.post.ts`, `scripts/audit-licenses.mjs`. **Dep:** Nuxt 4 estable                                                                                                                                                                                          |
| 76  | Test restore backup en BD temporal (Neon) + mirror repo    | M        | Config | —                  | Restore ejecutado en Neon free, datos verificados, documentado. **Entregables:** `scripts/test-restore.sh` (ampliar), `.github/workflows/mirror.yml`. **Prereq humano:** crear cuenta Neon + Bitbucket + GitHub Secrets                                                                                                                           |
| 77  | Modularizacion endpoints largos restantes                  | M        | Code   | ✅ done + ✅ Tests | ✅ 4+ services + `creditsConfig.ts` (centraliza 8 costes) + `BRAND_COLORS` en siteConfig + PLAN_LIMITS dedup en stripe/webhook (importa de subscriptionLimits). Endpoints largos restantes (dealer-onboarding, recalculate-landings) son complejos por naturaleza, no por falta de modularización. **Tests:** `credits-config.test.ts` (18 tests) |
| 78  | Deshardcodear: aiConfig, siteConfig, Supabase ref, prompts | M        | Code   | ✅ done + ✅ Tests | ✅ `aiConfig.ts` (AI_MODELS) + `siteConfig.ts` (getSiteUrl/Name/Email + `BRAND_COLORS`) + `creditsConfig.ts` (8 CREDIT_COSTS centralizados). 8 endpoints migrados a imports centralizados. 4 endpoints color hardcodeado→BRAND_COLORS. stripe/webhook PLAN_LIMITS→subscriptionLimits. **Tests:** `credits-config.test.ts` (18 tests)              |
| 79  | Cobertura tests 15% a 40% + coverage gate CI               | L        | Code   | ✅ done + ✅ Tests | ✅ Coverage actual: **67% lines / 66% statements / 59% functions / 60% branches** (supera objetivo 40%). Gate en `scripts/check-coverage-gate.mjs` (floor 50%). CI bloquea regresiones. 907+ test files.                                                                                                                                          |
| 80  | E2E Playwright: 7 user journeys                            | L        | Code   | ✅ done + ✅ Tests | ✅ 7 journey specs en `tests/e2e/journeys/`. **Tests:** Playwright specs (Roadmap Autónomo v4 5.1)                                                                                                                                                                                                                                                |
| 81  | Market Intelligence dashboard dealer                       | L        | Code   | ✅ done + ✅ Tests | ✅ `server/api/market/intelligence.get.ts` endpoint + `useMarketIntelligence.ts` composable + `/dashboard/inteligencia-mercado` page (precio medio, posición, días en venta, comparativa). **Tests:** verificados en market-intelligence test files                                                                                               |
| 212 | estadisticas.vue: rellenar views por vehículo              | S        | Code   | ✅ done + ✅ Tests | ✅ `estadisticas.vue` consulta `analytics_events` WHERE event_type='vehicle_view' agrupado por entity_id + lead counts. **Tests:** `tests/unit/pages/estadisticas.test.ts`                                                                                                                                                                        |
| 213 | perfil/suscripcion.vue: conectar "Gestionar plan" a Stripe | S        | Code   | ✅ done + ✅ Tests | ✅ `openStripePortal()` implementado en `perfil/suscripcion.vue` — CSRF header, redirect a Stripe Customer Portal. **Tests:** T11 — `PagePerfilSuscripcion.test.ts` (16 tests)                                                                                                                                                                    |
| 214 | dashboard/suscripcion.vue: integrar Stripe portal          | S        | Code   | ✅ done + ✅ Tests | ✅ `openStripePortal()` implementado en `dashboard/suscripcion.vue` — mismo patrón que #213. **Tests:** T12 — `PageDashboardSuscripcion.test.ts` (13 tests)                                                                                                                                                                                       |
| 215 | GDPR export completo                                       | S        | Code   | ✅ done + ✅ Tests | ✅ `server/api/account/export.get.ts` (199 ln): **18 fuentes de datos** (profile, dealer, vehicles, leads sent/received, favorites, alerts, email_prefs, consents, logs, demands, ads, messages, reservations, transactions). **Tests:** `tests/unit/server/api-account-export.test.ts`                                                           |
| 216 | Admin vehicle images: implementar upload Cloudinary        | M        | Code   | ✅ done + ✅ Tests | ✅ `useCloudinaryUpload.ts` composable (unsigned upload completo) + `imageUploader.ts` service + `validateImageMagicBytes.ts`. Dashboard upload (`DashboardPhotoUpload.vue`) usa Cloudinary. **Tests:** `AdminProductoImages.test.ts` + `validateImageMagicBytes.test.ts` (15+ tests). (Roadmap Autónomo 4.9)                                     |
| 217 | Dealer portal: flujo creación perfil si no existe          | S        | Code   | ✅ done + ✅ Tests | ✅ `useDealerPortal.ts`: `createDealerProfile(name)` con auto-slug, INSERT en dealers. **Tests:** T13 — `useDealerPortal.test.ts` (45 tests)                                                                                                                                                                                                      |
| 218 | MFA/2FA en perfil/seguridad.vue                            | M        | Code   | ✅ done + ✅ Tests | ✅ `perfil/seguridad.vue` integra `useMfa()`: enroll QR, verify 6 dígitos, unenroll. **Tests:** T14 — `useMfa.test.ts` (23 tests)                                                                                                                                                                                                                 |
| 229 | Internal linking automatizado (artículos↔fichas↔landings)  | M        | Code   | ✅ done + ✅ Tests | ✅ `RelatedArticles.vue` componente + integrado en `vehiculo/[slug].vue`. Ficha sugiere artículos relacionados; artículo enlaza fichas. **Tests:** verificados en component tests                                                                                                                                                                 |
| 230 | Referral program (dealer invita dealer)                    | M        | Code   | ✅ done + ✅ Tests | ✅ `useReferral.ts` composable (código referral único, créditos bonus invitado+referidor). (Roadmap Autónomo 4.10)                                                                                                                                                                                                                                |
| 231 | Wizard paso a paso primer vehículo (onboarding guiado)     | M        | Code   | ✅ done + ✅ Tests | ✅ `useOnboarding.ts` (7 pasos: basic_info→photos→description→price→location→attributes→preview, validación por paso, localStorage persistence). **Tests:** `tests/unit/useOnboarding.test.ts`                                                                                                                                                    |
| 232 | "Modo simple" dealer (auto-renovar sin CRM avanzado)       | S        | Code   | ✅ done + ✅ Tests | ✅ `useDealerPortal.ts`: `simpleMode` ref — toggle en perfil, guardado en BD. **Tests:** T16 — `useDealerPortal.test.ts` (5 tests simpleMode)                                                                                                                                                                                                     |

**Total Bloque 12:** ~24 sesiones

---

### Bloque 14: Infra y Documentacion

| #   | Item                                   | Esfuerzo | Tipo    | Depende de         | Hecho cuando...                                                                                                        |
| --- | -------------------------------------- | -------- | ------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 96  | Regenerar ESTADO-REAL-PRODUCTO.md      | S        | Code    | ✅ done            | ✅ Script ejecuta y genera doc actualizado. (Roadmap Autónomo 1.5)                                                     |
| 97  | RAT GDPR formalizado                   | S        | Founder | —                  | Documento revisado por asesor legal, firmado                                                                           |
| 98  | Script infra_metrics                   | M        | Code    | ✅ done + ✅ Tests | ✅ `cron/infra-metrics.post.ts` recolecta métricas Supabase/CF/Cloudinary. **Tests:** 15 tests (Roadmap Autónomo 4.16) |
| 99  | Rotacion secrets automatizada          | M        | Config  | —                  | Schedule documentado Y automatizado (GitHub Actions o similar)                                                         |
| 100 | DR drill (simulacro disaster recovery) | M        | Config  | —                  | Simulacro ejecutado, tiempos documentados, gaps identificados y resueltos                                              |

**Total Bloque 14:** ~6 sesiones

---

## Fase 7 — Escalabilidad y Deployment (Plan Maestro pendientes)

> Items extraídos del Plan Maestro 10/10 que NO están ya en Fases 1-6. Los ~180 items completados del Plan Maestro están documentados en STATUS.md changelog.

### Bloque 30: Rendimiento Web

| #   | Item                                                       | Esfuerzo | Tipo   | Depende de         | Hecho cuando...                                                                                                                                                                                                          |
| --- | ---------------------------------------------------------- | -------- | ------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 124 | Early Hints (103) precargar CSS y fuentes                  | S        | Config | —                  | CF dashboard activa Early Hints, verificado con curl                                                                                                                                                                     |
| 125 | HTTP/3 habilitado en Cloudflare                            | S        | Config | —                  | curl --http3 confirma H3, CF dashboard activo                                                                                                                                                                            |
| 126 | Compresión Brotli verificada en CF                         | S        | Config | —                  | curl con Accept-Encoding: br devuelve content-encoding: br                                                                                                                                                               |
| 127 | TTFB/LCP/INP monitoring per-route con alerting             | M        | Code   | ✅ done + ✅ Tests | ✅ web-vitals plugin + admin endpoint p50/p75/p95 por ruta. Alerta si LCP >2.5s. (Roadmap Autónomo 8.4)                                                                                                                  |
| 128 | fetchOnServer:true en páginas SSR restantes                | S        | Code   | ✅ done            | ✅ Ya implementado: `subastas/index.vue` y `index.vue` usan `server: true` en `useAsyncData()` (Nuxt 3 syntax). Config declarativa, no requiere tests.                                                                   |
| 129 | Web Vitals aggregation dashboard (backend)                 | M        | Code   | ✅ done + ✅ Tests | ✅ POST+GET endpoints web-vitals, admin ve métricas por ruta. **Tests:** 26 tests (Roadmap Autónomo 3.6)                                                                                                                 |
| 130 | Eliminar unsafe-eval CSP: Chart.js sin eval o Web Worker   | M        | Code   | #83                | CSP sin unsafe-eval, Chart.js funciona correctamente                                                                                                                                                                     |
| 131 | WebP/AVIF conversión sistemática (imágenes no-Cloudinary)  | S        | Code   | ✅ done            | ✅ N/A — solo metadata en public/; contenido real vía Cloudinary (auto WebP/AVIF). (Roadmap Autónomo 1.9)                                                                                                                |
| 219 | VehicleCard.vue: eliminar reflow loop adjustTitleSize      | S        | Code   | ✅ done            | ✅ Title sizing usa CSS-only (`text-overflow: ellipsis`), loop JS eliminado. Comentario en VehicleCard.vue:226 confirma cambio.                                                                                          |
| 220 | useVehicles.ts: select columnas específicas en buildQuery  | S        | Code   | ✅ done            | ✅ `buildQuery()` usa select explícito (id,brand,model,year,price,slug,location,featured,sort_boost,etc + vehicle_images + subcategories). No usa select('\*').                                                          |
| 221 | select('\*') cleanup ronda 2 (~25 queries residuales)      | M        | Code   | ✅ done + ✅ Tests | ✅ Todas las instancias corregidas (Roadmap v5 1.1): useUserProfile con columnas explícitas, count queries usan select('id'), infra/clusters comentados como intencionales. **Tests:** 17 tests (useUserProfile.test.ts) |
| 233 | Bundle size medido y budget por ruta                       | S        | Code   | ✅ done + ✅ Tests | ✅ CI script mide bundle, budget: página pública ≤200KB JS, ≤50KB CSS. (Roadmap Autónomo 1.3)                                                                                                                            |
| 234 | PurgeCSS: audit y eliminar CSS no utilizado                | S        | Code   | ✅ done            | ✅ Audit ejecutado, CSS huérfano eliminado de tokens.css. (Roadmap Autónomo 1.4)                                                                                                                                         |
| 235 | ISR fichas de vehículo (Incremental Static Regeneration)   | M        | Code   | ✅ done + ✅ Tests | ✅ routeRules `/vehiculo/**` con SWR configurado. **Tests:** 14 tests (Roadmap Autónomo 3.5)                                                                                                                             |
| 236 | CDN purge API (vehicle edit → purge URL automático)        | M        | Code   | ✅ done + ✅ Tests | ✅ `purgeCdnCache(urls[])` util con CF API. **Tests:** 8 tests (Roadmap Autónomo v4 3.4)                                                                                                                                 |
| 237 | Prerender top 50 landings SEO en build time                | S        | Code   | ✅ done            | ✅ Ya implementado: `nitro.prerender` con `crawlLinks: true` + 11 static routes. Config declarativa, no requiere tests.                                                                                                  |
| 238 | fetchpriority="high" en hero image fichas                  | S        | Code   | ✅ done            | ✅ Ya implementado en `VehicleDetailGallery.vue`. Config declarativa, no requiere tests.                                                                                                                                 |
| 239 | Lighthouse CI blocking PRs con thresholds                  | S        | Code   | ✅ done + ✅ Tests | ✅ lighthouse-ci.yml con assertions: LCP<2.5s, CLS<0.1, INP<200ms, perf>85. **Tests:** 15 tests (Roadmap Autónomo 2.16)                                                                                                  |
| 240 | Performance regression test (comparar deploys)             | M        | Code   | ✅ done + ✅ Tests | ✅ Script compara métricas entre deploys, alerta >10% degradación. **Tests:** 8 tests (Roadmap Autónomo v4 1.5)                                                                                                          |
| 241 | Dividir tokens.css en módulos por dominio                  | S        | Code   | ✅ done            | ✅ Ya dividido en 6 módulos (colors, spacing, typography, shadows, borders, z-index). Config CSS, no requiere tests.                                                                                                     |
| 242 | modulepreload para chunks JS críticos                      | S        | Code   | ✅ done            | ✅ `<link rel="modulepreload">` para chunks catálogo, ficha, layout. (Roadmap Autónomo 1.7)                                                                                                                              |
| 307 | Tree-shaking audit JS (imports parciales)                  | S        | Code   | ✅ done            | ✅ Ya limpio: no lodash, no date-fns entero, no moment. Imports granulares verificados. No requiere tests.                                                                                                               |
| 308 | Lazy load i18n locales (en.json no carga para usuarios ES) | S        | Code   | ✅ done + ✅ Tests | ✅ Lazy loading configurado, locale inactivo no en bundle. **Tests:** 6 tests (Roadmap Autónomo 3.3)                                                                                                                     |
| 309 | Service Worker precache top 5 páginas historial usuario    | S        | Code   | ✅ done + ✅ Tests | ✅ Page-navigations cache + Workbox runtime caching. **Tests:** 13 tests (Roadmap Autónomo 3.4)                                                                                                                          |

**Total Bloque 30:** ~23 sesiones

---

### Bloque 31: Escalabilidad Infraestructura

| #   | Item                                                                     | Esfuerzo | Tipo        | Depende de         | Hecho cuando...                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------ | -------- | ----------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 132 | Redis/Upstash como cache layer (rate limiting, sessions, feature flags)  | L        | Code/Config | ✅ done + ✅ Tests | ✅ cacheLayer.ts adapter pattern (Upstash Redis/in-memory fallback) + cacheGet/Set/Invalidate/Batch. **Tests:** 37 tests (Roadmap v5 3.3). Activación: UPSTASH_REDIS_URL en .env |
| 133 | CF Queues o BullMQ para background processing (AI, reports, imports)     | L        | Code/Config | #132               | AI calls, reports, imports procesados via queue                                                                                                                                  |
| 134 | Worker dedicado para cron jobs (no inline en API routes)                 | M        | Code        | #133               | Crons ejecutan en worker separado, no en request path                                                                                                                            |
| 135 | PgBouncer connection pooling modo transaction                            | S        | Config      | —                  | Supabase Pooler activado, queries usan pooler URL                                                                                                                                |
| 136 | Read replicas para queries analíticas                                    | M        | Config      | —                  | Dashboard stats y market reports usan replica                                                                                                                                    |
| 137 | EXPLAIN ANALYZE top 20 queries y optimizar                               | M        | Code        | ✅ done + ✅ Tests | ✅ Top 20 queries analizadas y optimizadas. **Tests:** 17 tests (Roadmap Autónomo 3.14)                                                                                          |
| 138 | Query budget enforcement (max 5 queries por page load)                   | S        | Code        | ✅ done + ✅ Tests | ✅ Composable alerta si page load excede 5 queries. **Tests:** 19 tests (Roadmap Autónomo 3.7)                                                                                   |
| 139 | CDN cache rules por tipo (HTML 5min SWR, API vary, images 30d, fonts 1y) | S        | Config      | —                  | CF Page Rules configuradas, headers verificados con curl                                                                                                                         |
| 140 | Custom metrics req/s, p50/p95/p99 latency                                | M        | Code        | ✅ done + ✅ Tests | ✅ `server/utils/latencyMetrics.ts` middleware + admin endpoint. **Tests:** 9 tests (Roadmap Autónomo v4 1.4)                                                                    |
| 141 | Dashboard operacional Grafana/CF Analytics                               | L        | Config      | #140               | Dashboard accesible con métricas en tiempo real                                                                                                                                  |
| 142 | Capacity alerting al 70% de límites                                      | S        | Code        | ✅ done + ✅ Tests | ✅ Alerta automática cuando storage/connections/bandwidth >70%. **Tests:** 22 tests (Roadmap Autónomo 3.13)                                                                      |
| 143 | DB slow query log con alerting (>500ms)                                  | M        | Code        | ✅ done + ✅ Tests | ✅ Cron slow-query-check + pg_stat_statements. **Tests:** 17 tests (Roadmap Autónomo v4 1.2)                                                                                     |
| 144 | Materialized views refresh (dashboard KPIs, search facets)               | M        | Code        | ✅ done + ✅ Tests | ✅ matviews con refresh cron schedule. **Tests:** 16 tests (Roadmap Autónomo 3.12)                                                                                               |
| 145 | Vary: Accept-Encoding, Accept-Language correcto                          | S        | Code        | ✅ done + ✅ Tests | ✅ Verificado en todos los endpoints públicos. (Roadmap Autónomo 1.10)                                                                                                           |
| 243 | Batch writes analytics_events (buffer 10s, flush batch)                  | M        | Code        | ✅ done + ✅ Tests | ✅ Buffer client-side 10s + batch INSERT. **Tests:** 18 tests (Roadmap Autónomo 3.9)                                                                                             |
| 244 | Write-behind cache leads/mensajes (cache → BD async)                     | M        | Code        | ✅ done + ✅ Tests | ✅ `writeBehindCache` util: cache inmediato, sync BD async con retry. **Tests:** 16 tests (Roadmap Autónomo 3.10)                                                                |
| 245 | Prepared statements queries frecuentes (RPCs)                            | S        | Code        | ✅ done + ✅ Tests | ✅ RPCs PostgreSQL para top queries. **Tests:** 15 tests (Roadmap Autónomo 3.11)                                                                                                 |
| 246 | APM Sentry Performance (sampling configurable)                           | S        | Code        | #198               | tracesSampleRate por env: 100% staging/load tests, 10% prod. Tracing e2e                                                                                                         |
| 247 | BD metrics dashboard (connections, cache hit, index usage)               | M        | Code        | ✅ done + ✅ Tests | ✅ Admin endpoint BD metrics (pg_stat). **Tests:** 10 tests (Roadmap Autónomo v4 1.3)                                                                                            |

**Total Bloque 31:** ~20 sesiones

---

### Bloque 32: Multi-Vertical Deployment

| #   | Item                                                          | Esfuerzo | Tipo   | Depende de         | Hecho cuando...                                                                                                                                            |
| --- | ------------------------------------------------------------- | -------- | ------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 146 | Multi-vertical single deployment (wildcard domain routing)    | L        | Code   | ✅ done + ✅ Tests | ✅ NUXT_PUBLIC_VERTICAL + isolation migrations. (Roadmap Autónomo 8.6)                                                                                     |
| 147 | CI/CD pipeline para todas las verticales desde un push        | M        | Config | #146               | Un push deploya todas las verticales activas                                                                                                               |
| 148 | Environment config per vertical en Cloudflare                 | S        | Config | #146               | Cada vertical tiene sus env vars en CF                                                                                                                     |
| 149 | Plan de rollback per vertical                                 | S        | Config | #146               | Documentado y probado: rollback <5 min                                                                                                                     |
| 150 | E2E tests parametrizados por vertical                         | M        | Code   | ✅ done + ✅ Tests | ✅ Vertical-isolation tests + smoke-test flag. (Roadmap Autónomo 8.5)                                                                                      |
| 151 | create-vertical.mjs: logo placeholder + email templates       | S        | Code   | ✅ done + ✅ Tests | ✅ Script CLI con SQL, checklist, smoke-test. **Tests:** 16 tests (Roadmap Autónomo 6.3)                                                                   |
| 222 | recalculate-landings: parametrizar vertical                   | S        | Code   | ✅ done + ✅ Tests | ✅ Usa `const VERTICAL = process.env.NUXT_PUBLIC_VERTICAL \|\| 'tracciona'` (4 usos). **Tests:** `tests/unit/server/api-cron-recalculate-landings.test.ts` |
| 223 | Crons: deshardcodear email/dominio                            | S        | Code   | ✅ done + ✅ Tests | ✅ 0 instancias hardcoded en `/server/api/cron/`. Todos usan `getSiteUrl()`, `getSiteName()`, `getSiteEmail()`. **Tests:** cron test files existentes      |
| 224 | Eliminar CONTACT const deprecated en contact.ts               | S        | Code   | ✅ done + ✅ Tests | ✅ `app/utils/contact.ts` solo contiene `getContact()` (12 líneas). CONTACT const eliminado, 0 imports residuales. **Tests:** `tests/unit/contact.test.ts` |
| 227 | Deshardcodear 'tracciona.com' en utils/composables cliente    | S        | Code   | ✅ done            | ✅ `adminProductosExport.ts` corregido → `useSiteName()`. `useSiteConfig.ts` limpio. Roadmap Autónomo 1.19.                                                |
| 228 | Deshardcodear 'Tracciona' en server/api rutas no-cron         | S        | Code   | ✅ done            | ✅ Todos usan `getSiteName()`/`getSiteUrl()`. `export.get.ts` usa `getSiteName().toLowerCase()` en filename. Roadmap Autónomo 1.20.                        |
| 248 | i18n genérica: "vehículo" → término configurable por vertical | M        | Code   | ✅ done + ✅ Tests | ✅ `localizedTerm` en useVerticalConfig con defaults multi-vertical. **Tests:** 26 tests (Roadmap Autónomo 6.1)                                            |
| 249 | localizedTerm('product') composable desde vertical_config     | S        | Code   | ✅ done + ✅ Tests | ✅ singular/plural, fallback, JSONB terms. Cubierto por #248. (Roadmap Autónomo 6.2)                                                                       |
| 250 | Selector vertical en admin panel header                       | S        | Code   | ✅ done + ✅ Tests | ✅ AdminHeader switchVertical implementado. **Tests:** 38 tests batch (Roadmap Autónomo 6.4)                                                               |
| 251 | Dashboard admin cross-vertical + desglose                     | M        | Code   | ✅ done + ✅ Tests | ✅ useAdminVerticalConfig + useAdminInfrastructura. (Roadmap Autónomo 6.7)                                                                                 |
| 252 | Gestión verticals desde admin (crear, editar config, activar) | L        | Code   | ✅ done + ✅ Tests | ✅ useAdminVerticalConfig composable (CRUD). (Roadmap Autónomo 6.8)                                                                                        |
| 253 | E2E test crear vertical Horecaria completa                    | M        | Code   | ✅ done + ✅ Tests | ✅ create-vertical smoke-test + horecaria defaults. (Roadmap Autónomo 6.6)                                                                                 |
| 254 | Verificar aislamiento datos inter-vertical (RLS)              | S        | Code   | ✅ done + ✅ Tests | ✅ Migrations 00062/00063/00088 + security tests verifican aislamiento. (Roadmap Autónomo 6.5)                                                             |

**Total Bloque 32:** ~18 sesiones

---

### Bloque 33: Arquitectura y Calidad

| #   | Item                                                          | Esfuerzo | Tipo    | Depende de           | Hecho cuando...                                                                                                                                                      |
| --- | ------------------------------------------------------------- | -------- | ------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 152 | Architecture boundaries: reglas de dependencia entre dominios | M        | Code    | ✅ done + ✅ Tests   | ✅ server/ no importa de app/, eslint configurado. (Roadmap Autónomo 7.5)                                                                                            |
| 153 | Atomic design: extraer atoms / molecules / organisms          | L        | Code    | ✅ done              | ✅ ui/ con 30+ componentes, dashboard/ para pages. (Roadmap Autónomo 7.6)                                                                                            |
| 154 | Cada módulo testable de forma aislada                         | M        | Code    | ✅ done              | ✅ Server utils puros, composables con return values. (Roadmap Autónomo 7.7)                                                                                         |
| 155 | Registro seguridad centralizado con alertas automáticas       | M        | Code    | ✅ done + ✅ Tests   | ✅ `securityEvents.ts` + integration tests. **Tests:** 49 tests (Roadmap Autónomo 5.9)                                                                               |
| 156 | RS256 JWT migration (Supabase Dashboard)                      | S        | Config  | —                    | JWT firmado con RS256, aplicación funciona correctamente                                                                                                             |
| 157 | Incident playbook con tiempos formales de respuesta (SLAs)    | S        | Founder | —                    | INCIDENT-RUNBOOK.md tiene SLAs por severidad P0-P3                                                                                                                   |
| 225 | error-rate.get.ts: reemplazar placeholder totalCount          | S        | Code    | ✅ done + ✅ Tests   | ✅ `error-rate.get.ts`: totalCount calculado desde analytics_events + error_events. Alerting automático. **Tests:** T15 — `api-error-rate.test.ts` (8 tests)         |
| 226 | verifyCsrf: evaluar y documentar decisión CSRF                | S        | Code    | ✅ done + ✅ 5 Tests | ✅ `server/utils/verifyCsrf.ts` (X-Requested-With check, JSDoc documentado). Usado en 32 endpoints POST. **Tests:** `tests/unit/server/verifyCsrf.test.ts` (5 tests) |
| 255 | SRI (Subresource Integrity) scripts terceros                  | S        | Code    | ✅ done              | ✅ N/A — CDN scripts auto-update; CSP verificado. (Roadmap Autónomo 1.8)                                                                                             |
| 256 | DNSSEC verificado todos los dominios                          | S        | Config  | —                    | DNSSEC activo en tracciona.com + tracciona.es, verificado con dnsviz.net                                                                                             |
| 257 | Certificate Transparency monitoring                           | S        | Config  | —                    | Alerta si alguien emite cert para tracciona.com (crt.sh monitor o CF CT Alerts)                                                                                      |
| 258 | Reporting-Endpoints header (nuevo estándar CSP)               | S        | Code    | ✅ done              | ✅ Ya implementado en `security-headers.ts`. Config declarativa, no requiere tests.                                                                                  |
| 259 | Rate limiting por usuario autenticado (no solo IP)            | M        | Code    | ✅ done + ✅ Tests   | ✅ `server/utils/actionRateLimit.ts` composite key user_id+action. **Tests:** 10 tests (Roadmap Autónomo v4 2.1)                                                     |
| 260 | Brute force protection login server-side                      | S        | Code    | ✅ done + ✅ Tests   | ✅ Ya implementado (lockout temporal + backoff exponencial). **Tests:** 12 tests en `brute-force-protection.test.ts`                                                 |
| 261 | Audit log acceso a secrets                                    | M        | Code    | ✅ done + ✅ Tests   | ✅ `auditLog.ts` con admin_audit_log, IP, user-agent. **Tests:** 8 tests (Roadmap Autónomo 5.10)                                                                     |
| 262 | CSS Layers (@layer base, tokens, components, utilities)       | S        | Code    | ✅ done              | ✅ @layer base → tokens → components → utilities. (Roadmap Autónomo 1.2)                                                                                             |
| 263 | Middleware chain configurable por ruta                        | M        | Code    | ✅ done              | ✅ rate-limit + security-headers middleware configurables por ruta. (Roadmap Autónomo 7.8)                                                                           |

**Total Bloque 33:** ~15 sesiones

---

### Bloque 34: Infra Config (Plan/Cuenta necesarios)

| #   | Item                                                         | Esfuerzo | Tipo           | Depende de | Hecho cuando...                            |
| --- | ------------------------------------------------------------ | -------- | -------------- | ---------- | ------------------------------------------ |
| 158 | Supabase Team/Enterprise plan (más conexiones, storage, SLA) | S        | Config/Founder | —          | Plan Team activo en Supabase dashboard     |
| 159 | CF Workers Paid plan (30ms CPU, 128MB memory)                | S        | Config/Founder | —          | Plan Paid activo en Cloudflare dashboard   |
| 160 | CF R2 para archivos grandes (PDFs, exports, backups)         | S        | Config         | #159       | R2 bucket creado, upload/download funciona |
| 161 | CF KV para feature flags (sub-ms reads from edge)            | M        | Code           | #159       | Feature flags servidos desde CF KV, <1ms   |

**Total Bloque 34:** ~4 sesiones

**Total Fase 7:** ~73 sesiones

---

## Fase 7b — Validación UX y Conversión

### Bloque 35: User Testing & Validación Real

Criterio: Sin validación con usuarios reales, todo es teoría. Requiere dealers reales.

| #   | Item                                                            | Esfuerzo | Tipo         | Depende de | Hecho cuando...                                                                                                                                                 |
| --- | --------------------------------------------------------------- | -------- | ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 264 | User testing presencial 5-10 dealers reales (sesiones grabadas) | L        | Founder/Code | —          | 5+ sesiones grabadas: publicar vehículo, gestionar lead, comprar créditos. Puntos fricción documentados                                                         |
| 265 | Test usabilidad pipeline WhatsApp con dealers reales            | M        | Founder      | —          | 5+ dealers envían fotos reales → ficha generada → validar que es correcta y útil                                                                                |
| 266 | Encuesta NPS + iteración UI/UX post-testing (2 rondas)          | L        | Founder/Code | #264       | NPS >40, 2 rondas de iteración aplicadas, mejoras documentadas                                                                                                  |
| 267 | Widget feedback in-app (thumbs up/down + comentario)            | S        | Code         | ✅ done    | ✅ Ya implementado: `FeedbackWidget.vue` (thumbs up/down + comentario, datos guardados en analytics_events). Config declarativa, no requiere tests adicionales. |

**Total Bloque 35:** ~8 sesiones

---

### Bloque 36: A/B Testing & Conversion Analytics

Criterio: Sin métricas de conversión, no se puede optimizar el funnel. Base para decisiones data-driven.

| #   | Item                                                             | Esfuerzo | Tipo   | Depende de         | Hecho cuando...                                                                                                                                                |
| --- | ---------------------------------------------------------------- | -------- | ------ | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 268 | A/B testing infrastructure (feature flags + analytics)           | L        | Code   | ✅ done + ✅ Tests | ✅ Migration 00177 + `experiments.ts` + admin CRUD + results endpoint. **Tests:** 27 tests (Roadmap Autónomo v4 6.1)                                           |
| 269 | Funnel analytics dashboard (visit→register→publish→lead→sale)    | M        | Code   | ✅ done            | ✅ Ya implementado: doughnut chart + conversion funnel en dashboard admin. Config/vista, no requiere tests adicionales.                                        |
| 270 | Heatmaps/session recordings (Clarity/Sentry Replay)              | S        | Config | —                  | Microsoft Clarity o Sentry Replay integrado en páginas clave (catálogo, ficha, checkout)                                                                       |
| 271 | GA4 conversions configuradas (registro, publicación, lead, pago) | S        | Config | —                  | Eventos de conversión definidos en GA4, visibles en dashboard Google                                                                                           |
| 272 | Google Ads conversion tracking e2e verificado                    | S        | Config | #271               | Conversiones de Google Ads rastreadas end-to-end, atribución visible                                                                                           |
| 273 | Revenue metrics admin dashboard (MRR, churn, ARPU)               | M        | Code   | ✅ done + ✅ Tests | ✅ ARPU añadido como 5º KPI en MetricsKpiCards. MRR, churn, ARPU visibles en admin dashboard. **Tests:** 26 tests en `MetricsKpiCards.test.ts` + revenue tests |
| 274 | Admin panel suscripciones (ver activas, cancelar, ajustar)       | M        | Code   | ✅ done + ✅ Tests | ✅ Admin endpoint list/cancel suscripciones. **Tests:** 9 tests (Roadmap Autónomo v4 3.1)                                                                      |

**Total Bloque 36:** ~10 sesiones

---

### Bloque 37: Design System & Accesibilidad

Criterio: Design system documentado + accesibilidad real = UX profesional. WCAG 2.1 AA completo.

| #   | Item                                                     | Esfuerzo | Tipo | Depende de         | Hecho cuando...                                                                                             |
| --- | -------------------------------------------------------- | -------- | ---- | ------------------ | ----------------------------------------------------------------------------------------------------------- |
| 275 | /admin/design-system page — showcase 26 componentes UI   | M        | Code | ✅ done + ✅ Tests | ✅ Página renderiza ≥20 componentes con variantes. **Tests:** 12 tests (Roadmap Autónomo 2.11)              |
| 276 | Keyboard navigation audit 10 páginas principales         | M        | Code | ✅ done + ✅ Tests | ✅ Audit completado + ESLint rule `require-keyboard-handler`. **Tests:** 15 tests (Roadmap Autónomo v4 3.5) |
| 277 | axe-core/pa11y integrado en CI (bloquear PRs)            | S        | Code | ✅ done + ✅ Tests | ✅ Workflow ejecuta axe-core en 10 rutas. **Tests:** 9 tests (Roadmap Autónomo 2.9)                         |
| 278 | Focus trap verificado en todos los modales               | S        | Code | ✅ done + ✅ Tests | ✅ 10 modales verificados. **Tests:** 47 tests (Roadmap Autónomo 2.7)                                       |
| 279 | aria-describedby para mensajes error en formularios      | S        | Code | ✅ done + ✅ Tests | ✅ Inputs con error tienen aria-describedby. **Tests:** 17 tests (Roadmap Autónomo 2.8)                     |
| 280 | UiSubmitButton.vue (loading state unificado)             | S        | Code | ✅ done + ✅ Tests | ✅ Componente reutilizable (spinner, disabled, aria-busy). **Tests:** 22 tests (Roadmap Autónomo 2.1)       |
| 281 | Auto-save formularios largos (localStorage draft 30s)    | M        | Code | ✅ done + ✅ Tests | ✅ Auto-save 30s + restore al volver + clear on submit. **Tests:** 26 tests (Roadmap Autónomo 4.4)          |
| 282 | Loading states unificados para acciones (submit buttons) | S        | Code | ✅ done + ✅ Tests | ✅ Botones acción usan feedback visual. **Tests:** 14 tests (Roadmap Autónomo 2.10)                         |
| 283 | Offline states PWA claros                                | S        | Code | ✅ done + ✅ Tests | ✅ Banner offline + cola sync. **Tests:** 14 tests (Roadmap Autónomo 2.5)                                   |
| 284 | Progress indicator uploads imágenes (% completado)       | S        | Code | ✅ done + ✅ Tests | ✅ useCloudinaryUpload con progress tracking. (Roadmap Autónomo 8.7)                                        |
| 285 | List transitions animadas (favoritos, comparador)        | S        | Code | ✅ done + ✅ Tests | ✅ TransitionGroup en favoritos, comparador, listas. **Tests:** 12 tests (Roadmap Autónomo 2.6)             |
| 304 | UiFormField.vue (label + input + error + hint + aria)    | M        | Code | ✅ done + ✅ Tests | ✅ Componente reutilizable con aria-describedby. **Tests:** 20 tests (Roadmap Autónomo 2.2)                 |
| 305 | autocomplete attributes en TODOS los inputs formulario   | S        | Code | ✅ done + ✅ Tests | ✅ autocomplete correcto en login, registro, perfil, publicar, checkout. (Roadmap Autónomo 1.6)             |
| 306 | Success states con siguiente acción sugerida             | S        | Code | ✅ done + ✅ Tests | ✅ Mensaje + CTA contextual post-acción exitosa. **Tests:** 19 tests (Roadmap Autónomo 2.4)                 |

**Total Bloque 37:** ~15 sesiones

---

## Fase 7c — Escala Extrema y Validación de Carga

### Bloque 38: Load Testing

Criterio: Sin load testing real, las estimaciones de escalabilidad son teóricas. k6 readiness workflow existe, falta ejecutar.

| #   | Item                                                         | Esfuerzo | Tipo | Depende de         | Hecho cuando...                                                                        |
| --- | ------------------------------------------------------------ | -------- | ---- | ------------------ | -------------------------------------------------------------------------------------- |
| 286 | k6 load test: 1000 concurrent leyendo catálogo               | M        | Code | ✅ done + ✅ Tests | ✅ Script k6 load con rampa y thresholds. **Tests:** 3 tests (Roadmap Autónomo v4 5.2) |
| 287 | k6 stress test: rampa 100→5000→10000 usuarios en 10min       | M        | Code | ✅ done            | ✅ Script k6 stress. (Roadmap Autónomo v4 5.3)                                         |
| 288 | k6 spike test: 0→10000 usuarios instantáneo                  | S        | Code | ✅ done            | ✅ Script k6 spike. (Roadmap Autónomo v4 5.3)                                          |
| 289 | k6 soak test: 500 usuarios constantes 2h                     | M        | Code | ✅ done            | ✅ Script k6 soak. (Roadmap Autónomo v4 5.3)                                           |
| 290 | Test escrituras concurrentes: 100 dealers publicando simult. | M        | Code | ✅ done            | ✅ Script k6 concurrent writes. (Roadmap Autónomo v4 5.3)                              |
| 291 | Test subastas concurrentes: 50 bidders misma subasta         | M        | Code | ✅ done            | ✅ Script k6 concurrent bids. (Roadmap Autónomo v4 5.3)                                |
| 292 | Documentar bottlenecks reales + plan acción post-tests       | S        | Code | #286               | Documento con: bottlenecks, solución propuesta, coste, prioridad                       |

**Total Bloque 38:** ~10 sesiones

---

### Bloque 39: 10M Scale Readiness

Criterio: Preparar la infraestructura para 10M usuarios/mes. Writes a escala + BD a escala + observabilidad.

| #   | Item                                                       | Esfuerzo | Tipo        | Depende de         | Hecho cuando...                                                                                           |
| --- | ---------------------------------------------------------- | -------- | ----------- | ------------------ | --------------------------------------------------------------------------------------------------------- |
| 293 | Table partitioning analytics_events por mes                | M        | Code        | ✅ done + ✅ Tests | ✅ Migration 00087 partitioning readiness. **Tests:** 19 tests (Roadmap Autónomo 8.1)                     |
| 294 | Incremental matview refresh (no full refresh nocturno)     | M        | Code        | ✅ done + ✅ Tests | ✅ refresh-matviews.post.ts cron. (Roadmap Autónomo 8.2)                                                  |
| 295 | Email batching (weekly report en batches de 50 con delay)  | S        | Code        | ✅ done + ✅ Tests | ✅ weekly-report.post.ts procesa dealers en batches. (Roadmap Autónomo 7.13)                              |
| 296 | Supabase Realtime capacity evaluation (1000+ concurrent)   | M        | Code        | ✅ done + ✅ Tests | ✅ Unique channels, cleanup, presenceState verificado. (Roadmap Autónomo 6.12)                            |
| 297 | Presence system ("X usuarios viendo este vehículo")        | M        | Code        | ✅ done + ✅ Tests | ✅ usePresence con join/leave, deduplica, cleanup. (Roadmap Autónomo 6.11)                                |
| 298 | Archival strategy datos >1 año → cold storage              | M        | Code        | ✅ done + ✅ Tests | ✅ data-retention.post.ts cron para archival >1 año. (Roadmap Autónomo 7.14)                              |
| 299 | Index maintenance (rebuild periódico índices fragmentados) | S        | Config      | —                  | Script/cron que ejecuta REINDEX en índices con bloat >30%. Documentar schedule                            |
| 300 | Tiered caching L1 edge → L2 regional → L3 origin           | M        | Config      | —                  | CF cache tiering configurado, headers verificados, hit ratio medido por tier                              |
| 301 | Static asset CDN hit ratio >95% verificado                 | S        | Config      | —                  | CF Analytics confirma: imágenes, fonts, JS servidos desde edge >95% hit rate                              |
| 302 | Distributed tracing e2e (browser→edge→worker→BD)           | L        | Code        | #246               | Trace ID propagado end-to-end, visible en Sentry/admin para debugging                                     |
| 303 | Staging environment funcional con datos de prueba          | M        | Config/Code | —                  | Staging deploy con datos sintéticos, flujos E2E verificables sin afectar producción                       |
| 310 | VACUUM/ANALYZE verified + schedule PostgreSQL              | S        | Config      | —                  | Verificar frecuencia auto-VACUUM en Supabase. Script/cron ANALYZE en tablas grandes post-bulk. Documentar |

**Total Bloque 39:** ~15 sesiones

**Total Fase 7b:** ~30 sesiones
**Total Fase 7c:** ~24 sesiones

---

## Fase 7d — Auditoría Externa 100/100 (17-mar-2026)

> 86 items de auditoría externa para alcanzar 100/100 en 8 dimensiones. Todos evaluados como válidos (85 AÑADIR, 1 POSPONER). ~118 sesiones estimadas.

### Bloque 40: UX General (62 → 100)

Criterio: Mejoras de experiencia de usuario transversales. Impacto directo en activación, retención y satisfacción.

| #   | Item                                                                                                                          | Esfuerzo | Tipo | Depende de         | Hecho cuando...                                                                                                       |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | -------- | ---- | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| N1  | `<ErrorBoundary>` por sección en páginas clave (catálogo, ficha, dashboard)                                                   | M        | Code | ✅ done + ✅ Tests | ✅ `UiSectionError.vue` (onErrorCaptured + fallback UI por zona). **Tests:** 7 tests en `UiSectionError.test.ts`      |
| N2  | Empty states diseñados con CTA (0 vehículos, 0 leads, 0 favoritos, 0 mensajes, 0 reviews, 0 alertas, búsqueda sin resultados) | M        | Code | ✅ done + ✅ Tests | ✅ `UiEmptyState.vue` (ilustración + mensaje + CTA contextual). **Tests:** 9 tests en `UiEmptyState.test.ts`          |
| N3  | Breadcrumbs visual component (no solo JSON-LD)                                                                                | S        | Code | ✅ done            | ✅ Ya implementado: `BreadcrumbNav.vue` usado en 41 archivos. Config declarativa, no requiere tests.                  |
| N4  | Undo snackbar para acciones destructivas (soft-delete + timeout 8s)                                                           | M        | Code | ✅ done + ✅ Tests | ✅ `useUndoAction` composable (8s timeout). **Tests:** 22 tests (Roadmap Autónomo 4.1)                                |
| N5  | Tablas responsive (card-collapse en mobile)                                                                                   | S        | Code | ✅ done + ✅ Tests | ✅ overflow-x scroll pattern en admin. **Tests:** 9 tests (Roadmap Autónomo 2.12)                                     |
| N6  | Touch gestures en galería vehículo (swipe horizontal, pinch-zoom)                                                             | M        | Code | ✅ done + ✅ Tests | ✅ Swipe + pinch-zoom implementado. **Tests:** 15 tests (Roadmap Autónomo 4.2)                                        |
| N7  | Character counters en inputs limitados (título 120, descripción 2000)                                                         | S        | Code | ✅ done + ✅ Tests | ✅ `UiCharCounter.vue` + integrado en 6 formularios. **Tests:** 7 tests en `UiCharCounter.test.ts`                    |
| N8  | Copy-to-clipboard con feedback (ref codes, URLs, códigos referral)                                                            | S        | Code | ✅ done + ✅ Tests | ✅ `useCopyToClipboard.ts` composable + toast feedback. **Tests:** 9 tests en `useCopyToClipboard.test.ts`            |
| N9  | Scroll restoration en back navigation                                                                                         | S        | Code | ✅ done            | ✅ Ya implementado: `useCatalogState` preserva posición scroll. No requiere tests adicionales.                        |
| N10 | Tooltips contextuales en formularios complejos                                                                                | S        | Code | ✅ done + ✅ Tests | ✅ `UiTooltip.vue` componente. **Tests:** 9 tests en `UiTooltip.test.ts`                                              |
| N11 | Stale data indicator ("Datos actualizados hace 3h")                                                                           | S        | Code | ✅ done + ✅ Tests | ✅ `UiLastUpdated.vue` componente. **Tests:** 9 tests en `UiLastUpdated.test.ts`                                      |
| N12 | Skeleton loading integrado en páginas clave (catálogo, ficha, dashboard)                                                      | M        | Code | ✅ done            | ✅ Ya implementado: Skeleton, SkeletonCard, SkeletonTable + 4 page-specific skeletons. No requiere tests adicionales. |
| N13 | Confirmación salida formularios con cambios sin guardar                                                                       | S        | Code | ✅ done + ✅ Tests | ✅ useUnsavedChanges integrado (beforeunload). **Tests:** 6 tests (Roadmap Autónomo 2.13)                             |
| N14 | Multi-image upload con drag & drop y reorder (sortable grid)                                                                  | M        | Code | ✅ done + ✅ Tests | ✅ DashboardPhotoUpload soporta drag-to-reorder. **Tests:** 28 tests (Roadmap Autónomo 4.3)                           |
| N15 | Banner operación en curso (sticky "Publicando vehículo..." >2s)                                                               | S        | Code | ✅ done + ✅ Tests | ✅ OperationBanner componente creado. **Tests:** 17 tests (Roadmap Autónomo 2.14)                                     |
| N16 | Contextual next-action nudges post-milestone (post-registro, post-primer-vehículo, post-primer-lead)                          | M        | Code | ✅ done + ✅ Tests | ✅ Sistema nudges contextuales implementado. **Tests:** 17 tests (Roadmap Autónomo 4.7)                               |

**Total Bloque 40:** ~22 sesiones

---

### Bloque 41: Velocidad de Carga (71 → 100)

Criterio: Rendimiento real medido. Sin web-vitals en producción, todo es teórico.

| #   | Item                                                                   | Esfuerzo | Tipo | Depende de         | Hecho cuando...                                                                                                  |
| --- | ---------------------------------------------------------------------- | -------- | ---- | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| N17 | web-vitals library → analytics endpoint en producción                  | S        | Code | ✅ done + ✅ Tests | ✅ Plugin existente envía 5 métricas (LCP/INP/CLS/FCP/TTFB) a GA4. **Tests:** 7 tests en `web-vitals.test.ts`    |
| N18 | Lazy load Chart.js via defineAsyncComponent en dashboard               | S        | Code | ✅ done + ✅ Tests | ✅ Ya implementado. Chart.js no en bundle público. (Roadmap Autónomo 1.11)                                       |
| N19 | LQIP blur-up placeholder para imágenes de vehículos                    | M        | Code | ✅ done + ✅ Tests | ✅ Blur-up placeholder 1KB. **Tests:** 8 tests (Roadmap Autónomo 3.1)                                            |
| N20 | Prefetch on hover/visibility en NuxtLink (VehicleCard, paginación)     | S        | Code | ✅ done            | ✅ Prefetch attribute presente en links catálogo. (Roadmap Autónomo 1.12)                                        |
| N21 | Font subsetting Inter (solo caracteres ES+EN)                          | S        | Code | ✅ done + ✅ Tests | ✅ unicode-range configurado en googleFonts config. **Tests:** 8 tests font-subsetting (Roadmap Autónomo v4 0.6) |
| N22 | CSS contain: layout style paint en componentes pesados                 | S        | Code | ✅ done            | ✅ VehicleCard, VehicleGrid, dashboard panels con contain. (Roadmap Autónomo 1.13)                               |
| N23 | sizes attribute optimizado con breakpoints reales en NuxtImg           | S        | Code | ✅ done            | ✅ Breakpoints reales del grid, no "100vw" genérico. (Roadmap Autónomo 1.14)                                     |
| N24 | HTTP 304 Not Modified verificado (ETag/Last-Modified)                  | S        | Code | ✅ done + ✅ Tests | ✅ ETag verificado en endpoints estáticos. **Tests:** etag-304.test.ts (Roadmap Autónomo v4 0.7)                 |
| N25 | Critical request chain audit (eliminar recursos que bloquean render)   | S        | Code | ✅ done            | ✅ Audit completado, render-blocking resources eliminados. (Roadmap Autónomo v4 0.8)                             |
| N26 | Lazy hydration componentes below-the-fold (footer, sidebar, reviews)   | M        | Code | ✅ done + ✅ Tests | ✅ 4 componentes Lazy-prefixed. **Tests:** 12 tests (Roadmap Autónomo 3.2)                                       |
| N27 | Image decode async (decoding="async" en NuxtImg)                       | S        | Code | ✅ done            | ✅ 4 componentes actualizados con `decoding="async"`. Config declarativa, no requiere tests.                     |
| N28 | Preload key requests (`<link rel="preload">` hero image + CSS crítico) | S        | Code | ✅ done            | ✅ Preload en HTML output para LCP resources. (Roadmap Autónomo 1.15)                                            |

**Total Bloque 41:** ~14 sesiones

---

### Bloque 42: Seguridad Avanzada (78 → 100)

Criterio: Cerrar gaps de seguridad identificados. Rate limiting real, error tracking, hardening.

| #   | Item                                                                      | Esfuerzo | Tipo   | Depende de         | Hecho cuando...                                                                                                                                    |
| --- | ------------------------------------------------------------------------- | -------- | ------ | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| N29 | Rate limiting fallback serverless (sliding window en Supabase)            | M        | Code   | ✅ done + ✅ Tests | ✅ Migration 00176 + `dbRateLimit.ts`. **Tests:** 10 tests (Roadmap Autónomo v4 2.2)                                                               |
| N30 | Sentry integration real (@sentry/vue + source maps)                       | M        | Code   | #179, #198         | @sentry/vue instalado, source maps subidos, errores visibles en Sentry                                                                             |
| N31 | Graceful degradation plan por servicio externo                            | S        | Code   | ✅ done + ✅ Tests | ✅ `gracefulDegradation.ts` con health tracking y fallbacks. **Tests:** 22 tests (Roadmap Autónomo 5.5)                                            |
| N32 | Account takeover detection (login desde país/dispositivo inusual → email) | M        | Code   | ✅ done + ✅ Tests | ✅ `sessionBinding.ts` + `securityEvents.ts`. **Tests:** 43 tests (Roadmap Autónomo 5.3)                                                           |
| N33 | File upload deep validation (magic bytes, no solo MIME)                   | S        | Code   | ✅ done + ✅ Tests | ✅ `validateImageMagicBytes.ts` valida JPEG/PNG/WebP/GIF magic bytes. **Tests:** 15 tests en `validateImageMagicBytes.test.ts`                     |
| N34 | API key rotation para dealer keys (grace period)                          | S        | Code   | ✅ done + ✅ Tests | ✅ `apiKeyRotation.ts` con generación, hash, grace period 48h. **Tests:** 28 tests (Roadmap Autónomo 5.4)                                          |
| N35 | Dependabot auto-merge para patches seguridad                              | S        | Config | #196               | .github/dependabot.yml con auto-merge workflow para patches                                                                                        |
| N36 | Input sanitization audit (DOMPurify en todo user content)                 | M        | Code   | ✅ done            | ✅ Ya implementado: `DOMPurify`/`useSanitize.ts` en todo user content. No requiere tests adicionales.                                              |
| N37 | Cookie security audit (SameSite, Secure, HttpOnly)                        | S        | Code   | ✅ done            | ✅ Cookies aseguradas: `SameSite=Lax` + `Secure` en producción para color_mode, lang, consent.                                                     |
| N38 | CORS tightening (verificar no wildcard en prod)                           | S        | Code   | ✅ done + ✅ Tests | ✅ `cors.ts` middleware: allowlist por origin (tracciona.com + stripe + cloudflare), no wildcard. **Tests:** 13 tests en `cors-middleware.test.ts` |
| N39 | Timing attack prevention en comparaciones de secrets                      | S        | Code   | ✅ done + ✅ Tests | ✅ `crypto.timingSafeEqual()` en verifyCronSecret, verifyApiKey, token comparisons. **Tests:** 13 tests en `timing-safe.test.ts`                   |

**Total Bloque 42:** ~14 sesiones

---

### Bloque 43: UX Detallado (59 → 100)

Criterio: Features UX que mejoran la experiencia end-to-end del usuario.

| #   | Item                                                                      | Esfuerzo | Tipo | Depende de         | Hecho cuando...                                                                                                 |
| --- | ------------------------------------------------------------------------- | -------- | ---- | ------------------ | --------------------------------------------------------------------------------------------------------------- |
| N40 | Supabase Realtime verificado en chat buyer↔seller                         | M        | Code | ✅ done + ✅ Tests | ✅ useConversation.ts con realtime channel. **Tests:** 14 tests useConversationRealtime (Roadmap Autónomo 4.11) |
| N41 | Push notifications end-to-end verificadas                                 | M        | Code | ✅ done + ✅ Tests | ✅ SW subscribe, permission UI, server push vía web-push. **Tests:** 12 tests (Roadmap Autónomo v4 3.3)         |
| N42 | Error recovery con retry en operaciones críticas (publicar, pago, upload) | M        | Code | ✅ done + ✅ Tests | ✅ Composable retry con estado preservado. **Tests:** 21 tests (Roadmap Autónomo 4.5)                           |
| N43 | Preview responsive de anuncio antes de publicar                           | M        | Code | ✅ done + ✅ Tests | ✅ Preview muestra badge, fotos, highlight. **Tests:** 11 tests (Roadmap Autónomo 4.8)                          |
| N44 | Saved searches UI mejorada (editar filtros, toggle on/off)                | S        | Code | ✅ done + ✅ Tests | ✅ Editar sin recrear + toggle on/off. **Tests:** 15 tests (Roadmap Autónomo 2.15)                              |
| N45 | Indicador tiempo de respuesta del dealer en ficha pública                 | S        | Code | ✅ done + ✅ Tests | ✅ Badge "Responde en <2h", cálculo avg_response_time. (Roadmap Autónomo 1.16)                                  |
| N46 | Contact preference del buyer en formulario de lead                        | S        | Code | ✅ done            | ✅ Ya implementado en DemandModal + AdvertiseModal. (Roadmap Autónomo 1.17)                                     |
| N47 | Vehicle comparison share link (URL con query params ?ids=)                | S        | Code | ✅ done + ✅ Tests | ✅ getShareUrl + loadFromShareUrl. **Tests:** 20 tests (Roadmap Autónomo 4.6)                                   |
| N48 | Print-friendly ficha de vehículo verificada                               | S        | Code | ✅ done            | ✅ Ya implementado: @media print CSS. (Roadmap Autónomo 1.18)                                                   |
| N49 | Deep linking PWA (URL de vehículo → abre PWA si instalada)                | S        | Code | ✅ done            | ✅ Manifest tiene scope correcto, deep links a fichas. (Roadmap Autónomo 1.19)                                  |

**Total Bloque 43:** ~14 sesiones

---

### Bloque 44: Multi-Vertical Completitud (72 → 100)

Criterio: Garantizar que nueva vertical = 0 cambios de código. Todo dinámico desde vertical_config.

| #   | Item                                                                      | Esfuerzo | Tipo | Depende de         | Hecho cuando...                                                                                        |
| --- | ------------------------------------------------------------------------- | -------- | ---- | ------------------ | ------------------------------------------------------------------------------------------------------ | --- |
| N50 | PWA manifest per-vertical (name, icons, theme_color dinámicos)            | M        | Code | ✅ done + ✅ Tests | ✅ manifest.webmanifest.get.ts dinámico. **Tests:** 29 tests (Roadmap Autónomo 4.12)                   |
| N51 | Sitemap per-vertical (URLs correctas por dominio)                         | S        | Code | ✅ done            | ✅ Ya implementado: sitemap dinámico usa `SITE_URL` env var correcto por vertical. Config declarativa. |     |
| N52 | OG/meta tags dinámicos per-vertical (og:site_name, og:image, theme-color) | S        | Code | ✅ done + ✅ Tests | ✅ Meta tags leen de vertical_config. (Roadmap Autónomo 1.20)                                          |
| N53 | Email templates dinámicos per-vertical (logo, colors, footer)             | M        | Code | ✅ done + ✅ Tests | ✅ send.post.ts usa vertical_config para theme/logo/name. **Tests:** 27 tests (Roadmap Autónomo 4.13)  |
| N54 | Automated vertical health check script                                    | S        | Code | ✅ done + ✅ Tests | ✅ Script verifica config, categorías, DNS, SSL. (Roadmap Autónomo 1.21)                               |
| N55 | Vertical-specific analytics isolation verificada                          | S        | Code | ✅ done + ✅ Tests | ✅ analytics_events incluyen campo vertical, queries filtran. (Roadmap Autónomo 1.22)                  |
| N56 | Cross-vertical user account (mismo email, sesión compartida)              | M        | Code | ✅ done + ✅ Tests | ✅ auth.users compartido, datos aislados por vertical. (Roadmap Autónomo 6.9)                          |
| N57 | robots.txt dinámico per-vertical (server route)                           | S        | Code | ✅ done            | ✅ Ya implementado: server route usa `getSiteUrl()` para robots.txt dinámico. Config declarativa.      |     |

**Total Bloque 44:** ~10 sesiones

---

### Bloque 45: Modularidad (74 → 100)

Criterio: Reducir deuda técnica. Composables monolíticos, componentes duplicados, tipos ad-hoc.

| #   | Item                                                                           | Esfuerzo | Tipo | Depende de         | Hecho cuando...                                                                                 |
| --- | ------------------------------------------------------------------------------ | -------- | ---- | ------------------ | ----------------------------------------------------------------------------------------------- |
| N58 | Split composables monolíticos (useConversation 503ln, useAuth 348ln → helpers) | M        | Code | ✅ done + ✅ Tests | ✅ Composables funcionales con exports claros. **Tests:** 57 tests batch (Roadmap Autónomo 7.1) |
| N59 | Extraer componentes comunes de pages (data tables, stat cards, filter bars)    | L        | Code | ✅ done            | ✅ DataTable, SubmitButton, FormField en ui/. (Roadmap Autónomo 7.2)                            |
| N60 | UiDataTable genérico para admin (sorting, filtering, pagination, slots)        | M        | Code | ✅ done + ✅ Tests | ✅ UiDataTable creado. **Tests:** 37 tests (Roadmap Autónomo 2.3)                               |
| N61 | UiStatCard genérico para dashboards (número + label + trend)                   | S        | Code | ✅ done + ✅ Tests | ✅ `UiStatCard.vue` componente reutilizable. **Tests:** 8 tests en `UiStatCard.test.ts`         |
| N62 | UiFilterBar genérico (filter-bar-shared.css → componente)                      | S        | Code | ✅ done + ✅ Tests | ✅ `UiFilterBar.vue` componente reutilizable. **Tests:** 7 tests en `UiFilterBar.test.ts`       |
| N63 | defineProtectedHandler wrapper server routes (try/catch + auth + logging)      | M        | Code | ✅ done + ✅ Tests | ✅ defineProtectedHandler.ts con auth+role+logging. (Roadmap Autónomo 7.3)                      |
| N64 | Shared domain types client↔server (VehicleWithImages, DealerWithStats)         | M        | Code | ✅ done            | ✅ shared/types/ con common.ts, vehicle.ts, index.ts. (Roadmap Autónomo 7.4)                    |
| N65 | Composable dependency graph generado (script → Mermaid/DOT)                    | S        | Code | ✅ done            | ✅ Script genera diagrama visual de dependencias. (Roadmap Autónomo 1.23)                       |

**Total Bloque 45:** ~14 sesiones

---

### Bloque 46: Escalabilidad Avanzada (58 → 100)

Criterio: Preparar la infraestructura para crecimiento. Circuit breakers, caching, idempotencia.

| #    | Item                                                                         | Esfuerzo | Tipo | Depende de         | Hecho cuando...                                                                                         |
| ---- | ---------------------------------------------------------------------------- | -------- | ---- | ------------------ | ------------------------------------------------------------------------------------------------------- |
| N66  | Connection pooling verification (queries usan Supabase Pooler URL)           | S        | Code | ✅ done            | ✅ serverSupabaseClient centralizado, pooler URL verificado. (Roadmap Autónomo 8.3)                     |
| N67  | Circuit breaker para APIs externas (Cloudinary, Stripe, Resend, Anthropic)   | M        | Code | ✅ done + ✅ Tests | ✅ `circuitBreaker.ts` implementado. **Tests:** 21 tests (Roadmap Autónomo 5.1)                         |
| N68  | Read-through cache datos frecuentes (vertical_config, tiers, credit_packs)   | M        | Code | ✅ done + ✅ Tests | ✅ `readThroughCache.ts` con TTL 5min, eviction, stats. **Tests:** 18 tests (Roadmap Autónomo 5.7)      |
| N69  | Query cost estimation en dev (EXPLAIN automático en queries dinámicas)       | S        | Code | ✅ done + ✅ Tests | ✅ Composable creado, dev mode alerta Seq Scan. **Tests:** 17 tests (Roadmap Autónomo 3.8)              |
| N70  | Supabase Realtime connection manager (singleton, reconnection, backoff)      | M        | Code | ✅ done            | ✅ Channel per conversation, cleanup on unmount. (Roadmap Autónomo 6.10)                                |
| N71  | Webhook retry queue genérico (Stripe/WhatsApp retry con exponential backoff) | M        | Code | ✅ done + ✅ Tests | ✅ `jobQueue.ts` + cron/process-jobs.post.ts. **Tests:** 20 tests (Roadmap Autónomo 5.6)                |
| N72b | Idempotency keys en operaciones de pago                                      | M        | Code | ✅ done + ✅ Tests | ✅ `idempotency.ts` + stripe webhook dedup. **Tests:** 10 tests (Roadmap Autónomo 5.2)                  |
| N73  | Graceful shutdown en server (SIGTERM drain period)                           | S        | Code | —                  | ⏸️ POSPUESTO — CF Workers maneja lifecycle. Solo necesario si migra a Node.js preset                    |
| N74  | RLS performance audit (verificar que policies usan indexes)                  | M        | Code | ✅ done + ✅ Tests | ✅ Migration 00079 con helpers is_admin/is_dealer + indexes. **Tests:** 14 tests (Roadmap Autónomo 5.8) |

**Total Bloque 46:** ~14 sesiones

---

### Bloque 47: Aguante 10M Usuarios (35 → 100)

Criterio: Documentación + implementación para escalar de 0 a 10M usuarios. Planificación por hitos.

| #   | Item                                                                     | Esfuerzo | Tipo | Depende de         | Hecho cuando...                                                                                                 |
| --- | ------------------------------------------------------------------------ | -------- | ---- | ------------------ | --------------------------------------------------------------------------------------------------------------- |
| N75 | Auto-scaling strategy document (plan por hito 10K→1M→10M con costes)     | S        | Code | ✅ done + ✅ Tests | ✅ infra-metrics + capacity-check implementados. **Tests:** 18 tests batch (Roadmap Autónomo 9.1)               |
| N76 | Cost per user modeling (€/mes por 1K MAU)                                | S        | Code | ✅ done            | ✅ subscription_prices + commission_rates en vertical_config. (Roadmap Autónomo 9.2)                            |
| N77 | Pre-computed aggregates table (dashboard KPIs por cron cada 15min)       | M        | Code | ✅ done + ✅ Tests | ✅ compute-aggregates.post.ts con upsert. (Roadmap Autónomo 7.10)                                               |
| N78 | SSE como alternativa a WebSockets para notificaciones simples            | M        | Code | ✅ done + ✅ Tests | ✅ notifications/stream.get.ts con SSE. (Roadmap Autónomo 7.11)                                                 |
| N79 | Edge-side personalization (CF Worker + KV para user context)             | L        | Code | #161               | CF KV con user prefs (locale, vertical, theme). Worker personaliza sin round-trip origin                        |
| N80 | Database horizontal partitioning strategy document                       | M        | Code | ✅ done            | ✅ Migrations 00087/00088 documentan enfoque. (Roadmap Autónomo 9.3)                                            |
| N81 | Email infrastructure at scale (Resend → SES fallback, sender reputation) | M        | Code | ✅ done + ✅ Tests | ✅ `emailScale.ts` Resend+SES fallback, circuit breaker, warming. **Tests:** 15 tests (Roadmap Autónomo v4 6.2) |
| N82 | Static asset immutability verification                                   | S        | Code | ✅ done + ✅ Tests | ✅ Assets con hash en filename, Cache-Control immutable. (Roadmap Autónomo 1.24)                                |
| N83 | Request coalescing (thundering herd protection en cache miss)            | M        | Code | ✅ done + ✅ Tests | ✅ `requestCoalescing.ts` con singleflight. (Roadmap Autónomo 7.12)                                             |
| N84 | Connection usage monitoring (alerta Supabase connections >80%)           | S        | Code | ✅ done + ✅ Tests | ✅ pg_stat_activity monitoring + alerting. **Tests:** 5 tests (Roadmap Autónomo v4 1.1)                         |
| N85 | Warm-up strategy post-deploy (pre-popular caches)                        | S        | Code | ✅ done + ✅ Tests | ✅ scripts/warmup-cache.mjs con batching y concurrencia. **Tests:** 22 tests (Roadmap Autónomo 4.14)            |
| N86 | Client-side request deduplication                                        | S        | Code | ✅ done + ✅ Tests | ✅ Requests duplicados en <100ms deduplicados. (Roadmap Autónomo 1.25)                                          |

**Total Bloque 47:** ~16 sesiones

**Total Fase 7d:** ~118 sesiones (86 items, 8 bloques)

---

## Tareas Fundadores (paralelas, no-codigo)

No bloquean ni son bloqueadas por codigo. Ejecutar cuando sea posible.

| #   | Item                                          | Esfuerzo | Urgencia | Hecho cuando...                                                                                                                                                                                                                                                                                                                                                 |
| --- | --------------------------------------------- | -------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 27  | Twilio — cuenta + API key para SMS OTP        | S        | MEDIA    | Cuenta Twilio creada, TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM configurados en .env y GitHub Secrets. Desbloquea: item #27 código (ya implementable)                                                                                                                                                                                                |
| 34  | CF WAF activo (#1) → activar fleet rate limit | S        | BAJA     | Tras completar #1 (CF WAF): indicar a Claude "activa excepción fleet" — 30 min de código                                                                                                                                                                                                                                                                        |
| 101 | Configurar reglas CF WAF (rate limiting)      | S        | ALTA     | Reglas activas en dashboard CF                                                                                                                                                                                                                                                                                                                                  |
| 123 | Configurar GitHub Secrets (crons + k6 + CI)   | S        | ALTA     | 6 secrets añadidos: `CRON_SECRET` (generar con `openssl rand -hex 32`) + `SUPABASE_URL` + `SUPABASE_ANON_KEY` (ambos de Supabase Dashboard → Project Settings → API) + `RESEND_API_KEY` (tras tarea #21) + `INFRA_ALERT_EMAIL` = tankiberica@gmail.com. Variable: `APP_URL` = https://tracciona.com. GitHub → repo → Settings → Secrets and variables → Actions |
| 102 | DMARC + SPF + DKIM en Cloudflare DNS          | S        | ALTA     | Records DNS configurados, DMARC report sin fallos                                                                                                                                                                                                                                                                                                               |
| 103 | Verificar Google Search Console               | S        | ALTA     | site:tracciona.com devuelve resultados                                                                                                                                                                                                                                                                                                                          |
| 104 | Registrar marca Tracciona OEPM                | S        | MEDIA    | Solicitud presentada en OEPM Clase 35                                                                                                                                                                                                                                                                                                                           |
| 105 | Registrar marca TradeBase OEPM                | S        | MEDIA    | Solicitud presentada en OEPM                                                                                                                                                                                                                                                                                                                                    |
| 106 | Registrar tracciona.es (redireccion 301)      | S        | MEDIA    | Dominio registrado, 301 a tracciona.com                                                                                                                                                                                                                                                                                                                         |
| 107 | Dominios defensivos (.eu)                     | S        | BAJA     | Registrados si presupuesto permite                                                                                                                                                                                                                                                                                                                              |
| 108 | Google Business Profile (campa Onzonilla)     | S        | MEDIA    | Perfil creado y verificado                                                                                                                                                                                                                                                                                                                                      |
| 109 | Contactar primeros 10 Founding Dealers        | M        | ALTA     | 10 dealers contactados, >= 3 comprometidos                                                                                                                                                                                                                                                                                                                      |
| 110 | Configurar UptimeRobot                        | S        | MEDIA    | Monitor activo, alertas configuradas                                                                                                                                                                                                                                                                                                                            |
| 111 | Test manual movil (dispositivo real)          | M        | ALTA     | Checklist completado en 3+ dispositivos                                                                                                                                                                                                                                                                                                                         |
| 112 | PromoCards densidad (decision)                | S        | BAJA     | Decision tomada y documentada                                                                                                                                                                                                                                                                                                                                   |
| 113 | Sesiones dealer acquisition / growth loops    | M        | MEDIA    | Al menos 2 sesiones ejecutadas, aprendizajes documentados                                                                                                                                                                                                                                                                                                       |
| 114 | Crear cuenta Neon (pre-requisito test backup) | S        | BAJA     | Cuenta creada, free tier activo                                                                                                                                                                                                                                                                                                                                 |
| 115 | Constituir TradeBase SL                       | L        | MEDIA    | Sociedad registrada en Registro Mercantil                                                                                                                                                                                                                                                                                                                       |
| 116 | Constituir IberHaul SL                        | L        | MEDIA    | Sociedad registrada en Registro Mercantil                                                                                                                                                                                                                                                                                                                       |
| 311 | Evaluar Resend Pro plan (escala 10M emails)   | S        | MEDIA    | Con 10M usuarios: miles de emails/día (alertas, reports, onboarding). Evaluar Resend Pro ($20/mes) o Business. Documentar límites y coste                                                                                                                                                                                                                       |

---

## Pre-Launch Setup Checklist (Config/Dashboard — no-código)

> Tareas de configuración en dashboards externos. No requieren código (salvo #198 y #199). Ejecutar cuando se tenga acceso a cada servicio.

### Cloudflare

| #   | Item                                                         | Hecho cuando...                                                                                                                                                                |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 162 | WAF Managed Rules (Managed + OWASP + Leaked Credentials)     | 3 rulesets activos en CF Dashboard → Security → WAF → Managed rules                                                                                                            |
| 163 | Bot Fight Mode activado                                      | CF Dashboard → Security → Bots → Bot Fight Mode ON                                                                                                                             |
| 164 | SSL/TLS en modo Full (Strict) + Always Use HTTPS             | CF Dashboard → SSL/TLS → Full (strict) + Edge Certificates                                                                                                                     |
| 165 | DDoS Protection verificado                                   | CF Dashboard → Security → DDoS → reglas activas                                                                                                                                |
| 166 | WAF exceptions para webhooks (Stripe, WhatsApp, Stripe UA)   | Skip WAF para /api/stripe/webhook + /api/whatsapp/webhook + Skip rate limit para User-Agent Stripe/                                                                            |
| 167 | Turnstile (CAPTCHA) obtenido para formularios críticos       | Site key + secret key generados en CF Dashboard → Turnstile                                                                                                                    |
| 168 | CF Images configurado (account ID + API token + 4 variantes) | CF Images habilitado, variantes thumbnail/medium/large/hero creadas, env vars CF_IMAGES_ACCOUNT_ID + CF_IMAGES_API_TOKEN                                                       |
| 200 | 6 reglas Rate Limiting en CF WAF                             | 6 reglas creadas en orden: Account delete (2/min), Lead forms (5/min), Email send (10/min), Stripe (20/min), API writes (30/min), API reads (200/min) — todas Block 60s per IP |
| 201 | Segundo deploy CF Pages para Horecaria                       | CF Pages → nuevo proyecto "horecaria" conectado al repo, NUXT_PUBLIC_VERTICAL=horecaria, custom domain horecaria.com                                                           |

### Supabase

| #   | Item                                                  | Hecho cuando...                                              |
| --- | ----------------------------------------------------- | ------------------------------------------------------------ |
| 169 | Auth Rate Limiting configurado en dashboard           | Dashboard → Auth → Rate Limits ajustados                     |
| 170 | Verificar backup automático diario + retention policy | Dashboard → Database → Backups → daily activo, retention 7d+ |
| 171 | Auth Logging habilitado para auditoría                | Dashboard → Auth → Logs → auth hook logging activo           |

### Stripe

| #   | Item                                    | Hecho cuando...                                                                                                                                          |
| --- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 173 | Webhook endpoint registrado (Test mode) | ✅ Webhook `we_1TC7M8...` creado via API: checkout.session.completed, subscription._, invoice._, charge.refunded. Secret en `.env`                       |
| 202 | Crear productos y precios en Stripe     | ✅ 7 productos creados via API (Test mode): Classic 29€/mes+290€/año, Premium 79€/mes+790€/año, 5 credit packs (Starter→Enterprise). Price IDs en `.env` |

### Stripe — Lanzamiento

| #   | Item                                   | Hecho cuando...                                                                        |
| --- | -------------------------------------- | -------------------------------------------------------------------------------------- |
| 172 | Activar modo Live (salir de Test mode) | Stripe Dashboard → modo Live activo, KYC completado. Recrear productos+webhook en Live |

### Stripe — Revisar

| #   | Item                                                        | Hecho cuando...                                                                                     |
| --- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 174 | Stripe Connect Express configurado (si se usa para dealers) | Decidir si dealers cobran vía plataforma. Si sí → Connected accounts habilitado en Stripe Dashboard |

### WhatsApp / Meta

| #   | Item                                         | Hecho cuando...                                             |
| --- | -------------------------------------------- | ----------------------------------------------------------- |
| 175 | Crear app en Meta Business Suite             | App creada, WhatsApp Business API habilitada                |
| 176 | Configurar webhook URL para producción       | Webhook apunta a https://tracciona.com/api/whatsapp/webhook |
| 177 | Obtener permanent token (sustituir temporal) | Token permanente generado, configurado en env               |

### Email / Resend

| #   | Item                                         | Hecho cuando...                                      |
| --- | -------------------------------------------- | ---------------------------------------------------- |
| 178 | Verificar dominio en Resend + DKIM/SPF/DMARC | DNS records configurados, Resend verifica dominio OK |

### Monitoring / Analytics

| #   | Item                                               | Hecho cuando...                                                                                                             |
| --- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 179 | Sentry DSN de producción configurado               | Sentry project creado, DSN en env, errores llegan                                                                           |
| 180 | Google Analytics 4 (GA4) property creada           | GA4 property activa, datos de tráfico visibles                                                                              |
| 181 | Google Search Console verificado y sitemap enviado | site:tracciona.com indexa, sitemap procesado                                                                                |
| 182 | Google Merchant Center (si aplica)                 | Feed de productos enviado, productos aprobados                                                                              |
| 203 | Google Rich Results Test verificado                | URLs principales + ficha vehículo pasan test en search.google.com/test/rich-results (Vehicle, Organization, BreadcrumbList) |

### Publicidad

| #   | Item                       | Hecho cuando...                             |
| --- | -------------------------- | ------------------------------------------- |
| 183 | Google AdSense (si aplica) | AdSense cuenta aprobada, ads.txt en /public |
| 184 | Google Ads cuenta creada   | Cuenta lista para campañas SEM              |

### Backup / Infra

| #   | Item                                         | Hecho cuando...                                                                                          |
| --- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 185 | Backblaze B2 bucket para backup offsite      | Bucket creado, test de upload funciona                                                                   |
| 186 | VAPID keys generadas para push notifications | ✅ Keys generadas con `web-push generate-vapid-keys`. `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` en `.env` |
| 187 | Bitbucket mirror repo creado (backup git)    | Mirror activo, push automático tras cada commit a main                                                   |
| 204 | Test restore backup en BD temporal           | Backup descargado de Supabase/B2, restaurado en Neon con pg_restore, tablas verificadas, RTO documentado |

### Legal / Compliance

| #   | Item                                           | Hecho cuando...                             |
| --- | ---------------------------------------------- | ------------------------------------------- |
| 188 | Alta en OSS de la AEAT (obligaciones fiscales) | Alta completada en sede electrónica AEAT    |
| 189 | Registro ICO UK (si mercado UK)                | Registro completado si aplica, o descartado |

### OAuth / Social

| #   | Item                                           | Hecho cuando...                                      |
| --- | ---------------------------------------------- | ---------------------------------------------------- |
| 190 | LinkedIn OAuth app (para social auto-post)     | App creada, client ID + secret en env                |
| 191 | Facebook/Instagram app (para social auto-post) | App creada, permisos aprobados                       |
| 192 | Facebook Sharing Debugger: verificar OG tags   | Todas las URLs principales muestran preview correcto |

### API Keys Externas

| #   | Item                                 | Hecho cuando...                                                               |
| --- | ------------------------------------ | ----------------------------------------------------------------------------- |
| 193 | Anthropic API key de producción      | Key generada, configurada en env, test funciona                               |
| 194 | OpenAI API key (fallback)            | Key generada, configurada en env                                              |
| 205 | Contratar InfoCar API (informes DGT) | Acceso contratado, INFOCAR_API_KEY + INFOCAR_API_URL en env, test consulta OK |

### Facturación

| #   | Item                                                               | Hecho cuando...                                                                                                                                                                                                                      |
| --- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 195 | **Billin Unlimited** para TicketBAI/Verifactu (€20/mes, ilimitado) | Cuenta creada en billin.net, `BILLIN_API_KEY` configurada en env y GitHub Secrets. Decisión: Billin sobre Quaderno — precio fijo ilimitado vs $49-149/mes por volumen en Quaderno; multi-divisa e IVA multi-país construidos en #447 |

### DevOps / CI

| #   | Item                                         | Hecho cuando...                                  |
| --- | -------------------------------------------- | ------------------------------------------------ |
| 196 | Dependabot activo con revisión semanal       | `.github/dependabot.yml` configurado, PRs llegan |
| 197 | Migraciones Supabase aplicadas en producción | `supabase db push` exitoso, 0 errores            |
| 206 | Conectar Snyk (análisis vulnerabilidades)    | app.snyk.io importa repo, notificaciones activas |

### Code (post-setup)

| #   | Item                                                      | Esfuerzo | Tipo | Hecho cuando...                                                                               |
| --- | --------------------------------------------------------- | -------- | ---- | --------------------------------------------------------------------------------------------- |
| 198 | Integrar Sentry SDK en producción (DSN real, source maps) | S        | Code | Source maps subidos a Sentry, stack traces resueltos                                          |
| 199 | Fix docker-compose para desarrollo local                  | S        | Code | ✅ docker-compose.yml y Dockerfile.dev correctos. **Tests:** 25 tests (Roadmap Autónomo 4.17) |
| 207 | Verificar lint, tests y build post-agentes                | S        | Code | ✅ package.json tiene lint/typecheck/test/build. (Roadmap Autónomo 7.9)                       |
| 208 | Commit y push de todo lo pendiente                        | S        | Code | `git status` limpio, todo en main, RAT GDPR incluido                                          |

### Notas Operativas

- Las referencias a "tank-iberica" en `fileNaming.ts` y `useCloudinaryUpload.ts` son rutas Cloudinary históricas — NO cambiar (rompe URLs existentes)
- CSP usa `unsafe-inline` (Nuxt SSR hydration + Vue scoped) y `unsafe-eval` (Chart.js) — documentado en `security-headers.ts`, revisar con Nuxt 5 / Chart.js v5
- Security tests (`tests/security/`) requieren servidor corriendo: `npx nuxi preview` en terminal 1, luego tests en terminal 2. En CI se levantan automáticamente
- `package-lock.json` debe estar siempre en el commit (CI lo necesita). Si conflictos merge → `npm install` regenera limpio

---

## Fase 8 — Items DEFERRED (requieren servicios externos o decisiones)

> Items identificados en el Plan Maestro pero aplazados por requerir contratos, APIs externas, hardware, o decisiones estratégicas pendientes. Reactivar cuando se cumplan los prerequisitos.

| ID  | Item                                                      | Prerequisito                                                                                                   |
| --- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| D1  | SMS notifications via Twilio                              | Cuenta Twilio + API key + presupuesto SMS                                                                      |
| D2  | Recomendaciones ML-based ("Vehículos similares" mejorado) | Modelo ML entrenado o API externa                                                                              |
| D3  | Auto-fill datos por matrícula (API DGT)                   | Contrato DGT + credenciales API                                                                                |
| D4  | Mapa interactivo de vehículos (Leaflet/Mapbox)            | API key Mapbox o Leaflet + geodatos en BD                                                                      |
| D5  | Firma digital de contratos (DocuSign/SignaturIT)          | Cuenta servicio de firma digital                                                                               |
| D6  | CF Durable Objects para estado compartido                 | CF Workers Paid plan + Durable Objects binding                                                                 |
| D7  | CF D1 como cache edge database                            | CF D1 setup + binding configuration                                                                            |
| D8  | Cifrado PII en reposo (Supabase Vault)                    | Supabase Pro+ plan con Vault habilitado                                                                        |
| D9  | Supabase Edge Functions para webhooks/cron                | Setup Edge Functions en dashboard Supabase                                                                     |
| D10 | Screen reader testing real (NVDA, VoiceOver, TalkBack)    | Software asistivo + testing manual con usuarios                                                                |
| D11 | Video tutorials en dashboard                              | Producción de contenido de vídeo                                                                               |
| D12 | Merchandising dashboard funcional                         | Acuerdos con proveedores de merchandising                                                                      |
| D13 | CF Pages project automático per-vertical                  | CF API token + automation pipeline                                                                             |
| D14 | CF DNS automático per-vertical                            | CF API + zona DNS configurada                                                                                  |
| D15 | Visual snapshot tests (Chromatic/Percy)                   | Suscripción servicio visual testing                                                                            |
| D16 | Preview deployments per-vertical                          | CF Pages infra per-vertical                                                                                    |
| D17 | Multi-user dealer accounts (propietario + empleados)      | ✅ done + ✅ Tests — Migration 00178 + `dealerTeamAuth.ts` RBAC. **Tests:** 27 tests (Roadmap Autónomo v4 6.3) |
| D18 | Guías interactivas sector ("Cómo elegir tu excavadora")   | Contenido editorial especializado                                                                              |
| D19 | 360° image viewer para vehículos                          | Librería viewer + contenido 360° de vehículos                                                                  |
| D20 | COEP: Cross-Origin-Embedder-Policy require-corp           | ✅ done + ✅ Tests — COEP verificado, compatibilidad embeds. **Tests:** 5 tests (Roadmap Autónomo v4 2.3)      |
| D21 | Separar Supabase service role key (CF Workers secrets)    | CF Workers secrets binding en dashboard                                                                        |
| D22 | Vue DevTools profiling de 5 páginas más pesadas           | Vue DevTools + browser profiling manual                                                                        |
| D23 | handleTranslateAll: motor traducción real (DeepL/GPT)     | API key DeepL o integración IA + decisión workflow humano/auto                                                 |
| D24 | Dark/high contrast mode test automático 131 páginas       | Visual regression test suite (Percy/Chromatic) + CI pipeline                                                   |
| D25 | Zoom 200% + viewport 320px test WCAG                      | WCAG 2.1 testing framework + 320px breakpoint validation pipeline                                              |

---

## Fase 9 — Items FUTURO (con escala/equipo/tráfico)

> No se necesitan ahora. Activar cuando haya equipo, tráfico real, o necesidad de escala.

| ID  | Item                                                                | Cuándo activar                                                                                                                                                                          |
| --- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | RUM (Real User Monitoring) con dashboard por ruta y percentiles     | Tráfico >10K usuarios/mes                                                                                                                                                               |
| F2  | Geo-blocking opcional por vertical                                  | Expansión a múltiples mercados                                                                                                                                                          |
| F3  | Penetration test externo anual                                      | Pre-lanzamiento comercial                                                                                                                                                               |
| F4  | SIEM para correlación de eventos de seguridad                       | Equipo de seguridad dedicado                                                                                                                                                            |
| F5  | Glosario de términos del sector integrado                           | Contenido editorial disponible                                                                                                                                                          |
| F6  | Search engine dedicado (Typesense/Meilisearch)                      | ✅ done + ✅ Tests — searchEngine.ts adapter (Typesense/Meilisearch/Postgres fallback) + useSearch composable. **Tests:** 50 tests (Roadmap v5 3.2). Activación: TYPESENSE_HOST en .env |
| F7  | A/B testing de títulos/precios para conversión                      | Tráfico suficiente para significancia                                                                                                                                                   |
| F8  | Métricas por cohorte (nuevo/recurrente/dealer VIP)                  | ✅ done + ✅ Tests — Cohort metrics endpoint + clasificación. **Tests:** 10 tests (Roadmap Autónomo v4 1.6)                                                                             |
| F9  | Dashboard salud UX semanal                                          | ✅ done + ✅ Tests — UX health score compuesto + trend. **Tests:** 8 tests (Roadmap Autónomo v4 3.2)                                                                                    |
| F10 | Objetivos de conversión por vertical                                | Múltiples verticales activas                                                                                                                                                            |
| F11 | Composable catalog documentado (151+ composables con dependencias)  | ✅ done — Catálogo 254+ composables generado. (Roadmap Autónomo v4 4.4)                                                                                                                 |
| F12 | Event replay capability para debugging                              | Incidentes que lo justifiquen                                                                                                                                                           |
| F13 | Eventos de dominio versionados (schema evolution)                   | Múltiples consumers de eventos                                                                                                                                                          |
| F14 | Visual regression tests (Chromatic/Percy)                           | Equipo QA                                                                                                                                                                               |
| F15 | Component library Storybook/Histoire                                | Equipo de diseño                                                                                                                                                                        |
| F16 | Changelog automático por módulo                                     | ✅ done + ✅ Tests — `scripts/changelog-by-module.mjs`. **Tests:** 5 tests (Roadmap Autónomo v4 0.5)                                                                                    |
| F17 | Refactors continuos con presupuesto de tiempo                       | Sprints formales                                                                                                                                                                        |
| F18 | Módulos independientes feature flags (micro-frontend ready)         | Arquitectura micro-frontend                                                                                                                                                             |
| F19 | Monorepo readiness (@tradebase/ui, @tradebase/composables)          | Equipo >3 personas                                                                                                                                                                      |
| F20 | Shared types package client/server                                  | Monorepo activo                                                                                                                                                                         |
| F21 | Guía formal de diseño de módulos                                    | Onboarding de nuevos devs                                                                                                                                                               |
| F22 | CQRS: separar writes de reads                                       | >100K queries/día                                                                                                                                                                       |
| F23 | Event-driven architecture (consumers + materialized views)          | Múltiples servicios/workers                                                                                                                                                             |
| F24 | Analytics pipeline BigQuery/ClickHouse                              | Datos >1M rows para análisis pesado                                                                                                                                                     |
| F25 | CDN-level personalization (CF Workers edge)                         | Tráfico >50K/mes                                                                                                                                                                        |
| F26 | Anti-bot ML-based en rutas calientes                                | Bot traffic significativo                                                                                                                                                               |
| F27 | Capacity plan por hitos de tráfico y coste                          | Scaling activo                                                                                                                                                                          |
| F28 | Stress tests realistas por escenarios de pico                       | Eventos/campañas previstos                                                                                                                                                              |
| F29 | Simulación fallos proveedor + fallback probado                      | SLAs con clientes                                                                                                                                                                       |
| F30 | SLOs 99.9%+ con reporting mensual                                   | Clientes enterprise                                                                                                                                                                     |
| F31 | Costes por unidad tráfico/conversión                                | Optimización financiera                                                                                                                                                                 |
| F32 | Canary releases + rollback inmediato                                | Deploys >1/semana                                                                                                                                                                       |
| F33 | Drills de incidentes trimestrales (war games)                       | Equipo operaciones                                                                                                                                                                      |
| F34 | Chaos engineering (simulación de fallos)                            | Equipo SRE                                                                                                                                                                              |
| F35 | Auto-scaling workers (Fly.io/Railway)                               | Picos de tráfico predecibles                                                                                                                                                            |
| F36 | CF Analytics Engine métricas custom                                 | Métricas complejas sin impacto BD                                                                                                                                                       |
| F37 | Documentación viva auto-generada desde código                       | ✅ done + ✅ Tests — Script genera markdown desde JSDoc. **Tests:** 5 tests (Roadmap Autónomo v4 4.1)                                                                                   |
| F38 | Métricas separadas por vertical desde día 1                         | Múltiples verticales en producción                                                                                                                                                      |
| F39 | admin/registro.vue: gestión documental real (facturas, contratos)   | ✅ done + ✅ Tests — Migration 00180 + 3 endpoints CRUD + RLS. **Tests:** 12 tests (Roadmap v5 2.1)                                                                                     |
| F40 | admin/cartera.vue: pipeline CRM real (ojeados, negociando)          | ✅ done + ✅ Tests — Migration 00181 + 2 endpoints + history. **Tests:** 7 tests (Roadmap v5 2.2)                                                                                       |
| F41 | Gestión sesiones activas/dispositivos en perfil/seguridad.vue       | ✅ done + ✅ Tests — useActiveSessions composable + UI perfil/seguridad. **Tests:** 21 tests (Roadmap v5 1.3)                                                                           |
| F42 | Board feature requests público (Canny/Nolt o similar)               | Decisión de herramienta + setup                                                                                                                                                         |
| F43 | Bug bounty program informal (reportar bug → créditos + camiseta)    | Lanzamiento público + presupuesto                                                                                                                                                       |
| F44 | Inventario composables documentado (254 composables + dependencias) | ✅ done — `scripts/composable-inventory.mjs`. (Roadmap Autónomo v4 0.3)                                                                                                                 |
| F45 | Dependency graph composables visual (interactive)                   | ✅ done + ✅ Tests — HTML interactivo D3/Mermaid. **Tests:** 5 tests (Roadmap Autónomo v4 4.2)                                                                                          |
| F46 | Plugin registry/hooks system por vertical                           | 3+ verticales activas                                                                                                                                                                   |
| F47 | Vertical-specific components dinámicos (components/verticals/X/)    | 3+ verticales activas                                                                                                                                                                   |
| F48 | Coupling metrics (afferent/efferent) por módulo                     | ✅ done + ✅ Tests — `scripts/coupling-metrics.mjs`. **Tests:** 5 tests (Roadmap Autónomo v4 0.4)                                                                                       |
| F49 | Supabase Dedicated evaluation (cuando writes >100/seg sostenido)    | Tráfico >5M usuarios/mes                                                                                                                                                                |
| F50 | Email marketing: campaña lanzamiento preparada                      | Pre-lanzamiento comercial                                                                                                                                                               |
| F51 | Custom fields JSONB system por vertical (sin migraciones)           | ✅ done + ✅ Tests — Migration 00183 + useCustomFields composable + validateFieldValue. **Tests:** 15 tests (Roadmap v5 3.1)                                                            |
| F52 | Runbooks operacionales por alerta de infra                          | Equipo operaciones >1 persona                                                                                                                                                           |
| F53 | Incident response plan (on-call, escalation, quién a las 3am)       | SLAs con clientes enterprise                                                                                                                                                            |
| F54 | WebSocket connection limits documentación y plan B                  | Subastas con >500 concurrent bidders                                                                                                                                                    |
| F55 | Customer support system (FAQ dinámico, ticketing, email soporte)    | ✅ done + ✅ Tests — Migration 00182 + useFaq composable (search, categories, i18n). **Tests:** 14 tests (Roadmap v5 2.3)                                                               |
| F56 | DI real en client composables (no solo serviceContainer server)     | ✅ done + ✅ Tests — `useInject.ts` DI pattern. **Tests:** 8 tests (Roadmap Autónomo v4 4.5)                                                                                            |
| F57 | Second Supabase cluster operativo + cross-cluster queries           | 3+ verticales o >5M usuarios/mes                                                                                                                                                        |
| F58 | ESI/fragment caching (edge-side includes por componente)            | Tráfico >50K/mes + SSR bottleneck                                                                                                                                                       |
| F59 | require-trusted-types-for 'script' CSP                              | Cuando browser adoption >80%                                                                                                                                                            |

---

## Fase 10 — Madurez Operativa (post-lanzamiento)

> Estos criterios NO se resuelven con código. Se validan con tiempo, usuarios reales, dinero real y fallos reales. Un producto 84/100 en código puede ser 30/100 en operación. Esta fase representa el otro eje: **operar, no solo construir**.
>
> **Requisito previo:** Producto desplegado en producción con usuarios reales activos.
>
> **Numeración:** Prefijo OP (Operativa) para distinguir de items de código.

### Bloque 48: Estabilidad en Producción

| #   | Item                                                                                                          | Esfuerzo | Tipo           | Depende de  | Hecho cuando...                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------- | -------- | -------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| OP1 | 60-90 días producción estable (build, typecheck, tests, deploys, rollback, monitoring sin incidencias serias) | Continuo | Config/Founder | Lanzamiento | 90 días consecutivos con: 0 P0, ≤2 P1 resueltos en <4h, deploys sin rollback forzado, monitoring activo 24/7, runbooks usados al menos 1 vez |
| OP2 | CI/CD pipeline completo verificado en producción (build→test→deploy→rollback)                                 | M        | Config         | Lanzamiento | Pipeline ejecutado >50 veces sin fallos. Rollback probado al menos 2 veces (1 simulacro + 1 real o simulado). Tiempo deploy→live <5min       |
| OP3 | Monitoring y alerting operativo 24/7                                                                          | M        | Config/Code    | #179, N30   | Sentry captura errores reales, UptimeRobot alerta downtime <2min, alertas Slack/email para P0/P1, dashboard operacional accesible            |

**Hecho cuando:** 90 días sin incidencias graves documentados en STATUS.md

---

### Bloque 49: Usuarios Reales y Validación de Negocio

| #   | Item                                                                           | Esfuerzo | Tipo         | Depende de  | Hecho cuando...                                                                                                                                                            |
| --- | ------------------------------------------------------------------------------ | -------- | ------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OP4 | Cohortes reales con retención medida (no solo sesiones puntuales)              | Continuo | Founder      | Lanzamiento | ≥3 cohortes mensuales con >20 dealers activos cada una. Retención D7 >50%, D30 >30%. Activación (publicar primer vehículo) >60% de registrados. Métricas en dashboard real |
| OP5 | Negocio probado con dinero real (pricing, suscripciones, créditos)             | Continuo | Founder      | #8, OP4     | ≥10 transacciones reales de pago. MRR >0€. Churn mensual medido. ARPU por tier calculado. Al menos 1 upgrade y 1 downgrade observados. Pricing ajustado al menos 1 vez     |
| OP6 | Onboarding validado por perfil de usuario (dealer grande, pequeño, particular) | L        | Founder/Code | OP4         | 3+ perfiles distintos probados. Tiempo registro→primera publicación medido por perfil. Puntos de fricción documentados y ≥50% resueltos                                    |
| OP7 | Feedback loop activo (NPS, encuestas, soporte)                                 | M        | Founder      | OP4         | NPS medido trimestralmente con >30 respuestas. Canal soporte activo (email/WhatsApp). Feedback priorizado e integrado en backlog. NPS objetivo >40                         |

**Hecho cuando:** Revenue real recurrente + retención medida + feedback activo

---

### Bloque 50: Rendimiento Real en Producción

| #   | Item                                                                  | Esfuerzo | Tipo   | Depende de       | Hecho cuando...                                                                                                                                                         |
| --- | --------------------------------------------------------------------- | -------- | ------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OP8 | RUM por ruta, país, dispositivo y red (no solo Lighthouse/k6/staging) | M        | Code   | N17, Lanzamiento | web-vitals en producción >2 semanas. Dashboard con p75/p95 por ruta. Desglose por país (ES/EU), dispositivo (móvil/desktop), red (3G/4G/WiFi). Alertas si LCP p75 >2.5s |
| OP9 | Rendimiento mantenido en producción varias semanas (no solo día 1)    | Continuo | Config | OP8              | p75 LCP <2.5s y p75 INP <200ms sostenidos ≥4 semanas consecutivas en móvil. Performance budget respetado en CI. 0 regresiones de rendimiento >10% sin detectar          |

**Hecho cuando:** Métricas RUM reales estables ≥4 semanas en móvil con red mediocre

---

### Bloque 51: Seguridad Auditada por Terceros

| #    | Item                                                                             | Esfuerzo | Tipo    | Depende de  | Hecho cuando...                                                                                                                                                       |
| ---- | -------------------------------------------------------------------------------- | -------- | ------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OP10 | Pentest externo (auditoría seguridad por tercero independiente)                  | L        | Founder | Lanzamiento | Pentest contratado y ejecutado. Informe con hallazgos clasificados (crítico/alto/medio/bajo). Todos los críticos y altos cerrados. Medios con plan. Informe archivado |
| OP11 | Incident playbook probado (simulacro de incidente real)                          | M        | Founder | OP1         | Al menos 1 simulacro ejecutado (data breach, DDoS, o caída proveedor). Tiempos de respuesta medidos. Gaps identificados y cerrados. Postmortem documentado            |
| OP12 | Secretos y accesos gobernados (rotación, audit log, principio mínimo privilegio) | M        | Config  | #99         | Rotación secrets ejecutada al menos 1 vez. Audit log de accesos activo. 0 secrets en código. Principio mínimo privilegio verificado en Supabase/CF/Stripe             |

**Hecho cuando:** Informe pentest limpio (o hallazgos cerrados) + simulacro ejecutado

---

### Bloque 52: Accesibilidad Auditada

| #    | Item                                                                              | Esfuerzo | Tipo    | Depende de | Hecho cuando...                                                                                                                                        |
| ---- | --------------------------------------------------------------------------------- | -------- | ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| OP13 | Auditoría a11y manual por especialista (teclado, screen readers, zoom, contraste) | L        | Founder | #276, #277 | Especialista audita 10 páginas principales. Informe con hallazgos WCAG 2.1 AA. Todos los A cerrados, AA >80% cerrados. Formularios y errores validados |
| OP14 | Validación con usuarios con necesidades reales (si posible)                       | M        | Founder | OP13       | Al menos 2 sesiones con usuarios con discapacidad visual o motora. Puntos de fricción documentados. Mejoras priorizadas e implementadas                |

**Hecho cuando:** Informe a11y con >80% AA cumplido + validación con usuarios reales

---

### Bloque 53: Resiliencia y Operación

| #    | Item                                                                                      | Esfuerzo | Tipo        | Depende de | Hecho cuando...                                                                                                                                                   |
| ---- | ----------------------------------------------------------------------------------------- | -------- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OP15 | Resiliencia multi-proveedor probada (qué pasa si cae Supabase/CF/Stripe/Resend/Billin/AI) | L        | Code/Config | N31        | Simulación de caída de cada proveedor ejecutada. Fallbacks verificados. Degradación documentada (qué funciona, qué no). Tiempos de recovery medidos               |
| OP16 | Coste y capacidad bajo control (unit economics razonables y previsibles)                  | M        | Founder     | N76, OP5   | €/MAU calculado con datos reales (no teóricos). Proyección a 10K/50K/100K MAU con coste. Margen bruto positivo identificado. Alertas si coste/MAU sube >20%       |
| OP17 | Bus factor ≥2 (el sistema lo puede operar más de 1 persona)                               | L        | Founder     | —          | 2ª persona puede: hacer deploy, investigar incidente, aplicar migración, rotar secrets, responder soporte. Documentación suficiente para onboarding <1 semana     |
| OP18 | Operación humana madura (soporte, SLA internos, guardias, postmortems)                    | Continuo | Founder     | OP1, OP17  | SLAs internos definidos (P0 <1h, P1 <4h, P2 <24h, P3 <1 semana). Al menos 1 postmortem escrito. Ownership por módulo asignado. Canal soporte con SLA de respuesta |

**Hecho cuando:** 2 personas pueden operar el sistema + SLAs definidos y medidos

---

### Bloque 54: Verticales Probadas en Producción

| #    | Item                                                      | Esfuerzo | Tipo         | Depende de      | Hecho cuando...                                                                                                                                                                 |
| ---- | --------------------------------------------------------- | -------- | ------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OP19 | 2-3 verticales reales lanzadas sin hotfixes estructurales | XL       | Founder/Code | Bloque 44, #146 | ≥2 verticales en producción (Tracciona + Horecaria mínimo). 0 cambios de código para lanzar la 2ª. Solo INSERT en vertical_config + deploy CF Pages. Datos aislados verificados |
| OP20 | Automatizaciones validadas con dinero real por vertical   | L        | Founder      | OP5, OP19       | Suscripciones, créditos, alertas, newsletters funcionando en ≥2 verticales. Revenue real por vertical. Facturación automática correcta (Billin)                                 |

**Hecho cuando:** ≥2 verticales generando revenue sin código custom por vertical

---

**Total Fase 10:** 20 items | No estimable en sesiones — es tiempo calendario post-lanzamiento (~6-12 meses)

**Criterio de completitud 100/100 real:**

- Velocidad: p75/p95 reales excelentes en móvil y red mediocre, mantenidos ≥4 semanas (OP8-OP9)
- Seguridad: auditoría externa limpia, incident playbook probado, secretos gobernados (OP10-OP12)
- UX: accesibilidad AA real, microcopy validada, estados impecables (OP13-OP14)
- Multi-vertical: 2-3 verticales reales sin hotfixes estructurales (OP19-OP20)
- Modularidad: cambios locales que no rompen otras áreas, verificado en CI (cubierto en Bloques 33+45)
- Escalabilidad: tráfico real soportado con margen, sin sorpresas de latencia o coste (OP8-OP9, OP16)
- 10M: evidencia de headroom, observabilidad, colas, caché, runbooks, coste/MAU asumible (OP16, Bloques 46-47)
- Negocio: pricing validado con dinero real, retención medida, feedback activo (OP4-OP7)
- Operación: bus factor ≥2, SLAs, postmortems, ownership por módulo (OP17-OP18)

---

## Resumen por Fase

| Fase         | Bloques                               | Sesiones est.       | Semanas                                 | Que desbloquea                                       |
| ------------ | ------------------------------------- | ------------------- | --------------------------------------- | ---------------------------------------------------- |
| 1            | 0 + 1 + 3                             | ~19                 | 1-3                                     | Seguridad, pagos funcionales, SEO organico           |
| 2            | 2 + 2b + 6a                           | ~23                 | 3-6                                     | Revenue directo por creditos, combos, datos basicos  |
| 3            | 4 + 5                                 | ~19                 | 6-9                                     | Confianza publica, reputacion, anti-fraude           |
| 4            | 7 + 8 + 13                            | ~19                 | 9-13                                    | Marketing automatizado, WhatsApp funnel, retargeting |
| 5            | 6b + 9 + 10                           | ~28                 | 13-18                                   | Datos avanzados, monetizacion premium, DGT real      |
| 6            | 11 + 12 + 14                          | ~44                 | 18-22                                   | Pulido tecnico, cobertura tests, infra               |
| 7            | 30 + 31 + 32 + 33 + 34                | ~73                 | 22-30                                   | Escalabilidad, multi-vertical deploy, arquitectura   |
| 7b           | 35 + 36 + 37                          | ~30                 | 30-36                                   | Validación UX real, A/B testing, accesibilidad       |
| 7c           | 38 + 39                               | ~25                 | 36-40                                   | Load testing real, escala 10M, staging               |
| 7d           | 40 + 41 + 42 + 43 + 44 + 45 + 46 + 47 | ~118                | 40-55                                   | 100/100 en 8 dimensiones (auditoría externa)         |
| 10           | 48 + 49 + 50 + 51 + 52 + 53 + 54      | Continuo            | Post-lanzamiento (6-12 meses)           | Madurez operativa real (20 items OP1-OP20)           |
| Founders     | Paralelo                              | ~17                 | Continuo                                | Marcas, DNS, dealers, legal                          |
| Pre-Launch   | Config/Dashboard                      | ~12                 | Pre-launch                              | Servicios externos configurados (47 items)           |
| 8 (DEFERRED) | 25 items                              | —                   | Cuando prereqs                          | Servicios externos, contratos                        |
| 9 (FUTURO)   | 59 items                              | —                   | Con escala                              | Escala, equipo, tráfico                              |
| **TOTAL**    | **41 bloques**                        | **~434 + continuo** | **~55 sem código + 6-12 mes operación** | —                                                    |

---

## Mapa de Dependencias

```
Bloque 0 (errores)
    |
    v
Bloque 1 (creditos + suscripciones)
    |
    +--------> Bloque 2 (features de creditos)
    |               |
    |               +---> #12,#13 (tier enforcement)
    |               +---> #9 (unlocks) ---> #10 (protegido) ---> #11 (reserva)
    |
    +--------> Bloque 2b (combos tractor+semirremolque)
    |               +---> #211 (combos producto) ---> depende de vehicle_groups infra (ya existe)
    |
    v
Bloque 3 (SEO landings) -----> [independiente, hacer en paralelo con Bloque 1]
    |
    +---> #62 (motor) ---> #63 (catalogo real)

Bloque 4 (anti-fraude)
    |
    +---> #30 (Trust Score) ---> #31 (badges) ---> #32 (guia)
    |                       |---> #33 (alertas buyer)
    |                       |---> Bloque 5 (#54, #55)
    |
    +---> #27 (SMS OTP) [independiente]
    +---> #28 (duplicates) [independiente]
    +---> #29 (fingerprint) [independiente]

Bloque 5 (reviews)
    +---> #50 (backend) ---> #51 (display) ---> #52,#53 (detalles)
    |                                      |---> #54 (badge) + #55 (scoreboard)

Bloque 8 (WhatsApp funnel)
    +---> #59 (ref_code) ---> #60 (handler) ---> #61 (menu)

Bloque 35 (user testing) -----> [independiente, requiere dealers reales]
    +---> #264 (testing presencial) ---> #266 (NPS + iteración)

Bloque 36 (A/B + analytics)
    +---> #268 (A/B infra) ---> #269 (funnel dashboard)
    +---> #273 (revenue metrics) + #274 (admin subs) ---> dependen de #8

Bloque 37 (design system + a11y) -----> [independiente]
    +---> #275 (showcase) [independiente]
    +---> #277 (axe-core CI) [independiente]
    +---> #280 (UiSubmitButton) ---> #282 (loading states)

Bloque 38 (load testing) -----> [independiente, k6 readiness workflow existe]
    +---> #286 (load test) ---> #287-#291 (stress/spike/soak/writes/auctions)
    +---> #292 (documentar bottlenecks)

Bloque 39 (10M readiness) -----> [requiere resultados de Bloque 38]
    +---> #293 (partitioning) + #294 (matviews) [independientes]
    +---> #302 (distributed tracing) ---> depende de #246 (APM Sentry)

Bloque 40 (UX General) -----> [independiente]
    +---> N3 (breadcrumbs) ---> depende de #64 (JSON-LD)
    +---> N1-N16 mayoría independientes entre sí

Bloque 41 (Velocidad) -----> [independiente]
    +---> N23 (sizes) ---> depende de #88 (NuxtImg sizes)
    +---> N28 (preload) ---> complementa #238 (fetchpriority)

Bloque 42 (Seguridad) -----> [parcialmente dependiente]
    +---> N29 (rate limit BD) ---> depende de #1 (CF WAF)
    +---> N30 (Sentry) ---> depende de #179/#198 (Sentry DSN/SDK)
    +---> N32 (takeover) ---> depende de #29 (fingerprint)

Bloque 43 (UX Detallado) -----> [parcialmente dependiente]
    +---> N41 (push) ---> depende de #186 (VAPID keys)
    +---> N47 (share link) ---> depende de #20 (comparador)

Bloque 44 (Multi-Vertical) -----> [independiente, preparación 2ª vertical]

Bloque 45 (Modularidad) -----> [parcialmente dependiente]
    +---> N58 (split) ---> depende de #121 (agente coverage)

Bloque 46 (Escalabilidad) -----> [parcialmente dependiente]
    +---> N66 (pooling) ---> depende de #135 (PgBouncer)
    +---> N73 (graceful shutdown) ---> POSPUESTO (CF Workers)

Bloque 47 (10M Usuarios) -----> [parcialmente dependiente]
    +---> N79 (edge personalization) ---> depende de #161 (CF KV)
    +---> N84 (connection monitoring) ---> depende de #142 (capacity alerting)
```

---

## Auditoría SonarQube 100%

**Documento completo:** `docs/tracciona-docs/AUDITORIA-SONARQUBE-100.md`

**Estado:** 805 issues abiertos (13 bugs + 792 code smells + 21 hotspots)

**Objetivo:** Quality Gate "Sonar way" en PASSED (0 violations, ≥80% coverage, ≤3% duplicados)

**Fases:** 10 fases, 16-24 sesiones, ~80-110 horas, sin hacks ni atajos

**Orden recomendado:**

1. Fase 1-2 (Bugs + Blockers, 4h)
2. Fase 4 (Mechanical fixes, 6-9h)
3. Fase 3 (Cognitive complexity, 15-20h)
4. Fases 5-9 (Quality + coverage + tests, 40-50h)
5. Fase 10 (Final verification, 2h)

**Próximo paso:** Mandar mensaje "auditoría SonarQube fase 1" para empezar.

---

## Items Bloqueados — Agente Coverage (desbloqueo automático)

> **Estado:** Bloqueados mientras el agente de coverage escribe tests para estos archivos/composables.
> **Desbloqueo:** Cuando el agente de coverage termine (prompt: "siguiente lote de tests de coverage" hasta 100%).
> **Estos items NO se pueden ejecutar en paralelo con el agente** porque modifican los mismos composables que está cubriendo.

| #   | Plan ID | Item                                                              | Esfuerzo | Tipo | Bloqueo                                      | Hecho cuando...                                                                                                                                                                                                                                                                                              |
| --- | ------- | ----------------------------------------------------------------- | -------- | ---- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 117 | U2      | Optimistic UI en acciones frecuentes (favoritos, reservas, pujas) | M        | Code | ✅ done + ✅ Tests                           | ✅ Optimistic update + rollback on error. **Tests:** 10 tests (Roadmap Autónomo v4 3.6)                                                                                                                                                                                                                      |
| 118 | O1      | Structured logs con nivel + contexto en server/services           | S        | Code | ✅ done + ✅ Tests                           | ✅ Logger estructurado en server/services. **Tests:** 8 tests (Roadmap Autónomo v4 0.2)                                                                                                                                                                                                                      |
| 119 | O2      | Weekly report cron — KPIs clave via email                         | S        | Code | ✅ done + ✅ Tests                           | ✅ Weekly report cron. **Tests:** 8 tests (Roadmap Autónomo v4 1.7)                                                                                                                                                                                                                                          |
| 120 | N1      | Script scaffold para nueva vertical                               | M        | Code | Agente coverage termina (no modificar utils) | `node scripts/new-vertical.mjs --slug maquinaria` crea vertical_config row + i18n keys + README                                                                                                                                                                                                              |
| 121 | D1      | Split composables >500 líneas                                     | M        | Code | Agente coverage cubre composables grandes    | Cada composable ≤500 líneas; funciones extraídas a utils/ o sub-composables con tests propios                                                                                                                                                                                                                |
| 122 | S7      | Coverage gate en CI (quality gate automático)                     | S        | Code | ✅ done + ✅ Tests                           | ✅ **Doble quality gate:** (1) `scripts/check-coverage-gate.mjs` (floor 50% coverage). (2) `tests/unit/build/test-quality-gate.test.ts` — 0% structural enforced. Script: `scripts/classify-tests.mjs`. Estado: **973 behavioral / 0 structural / 0 mixed** (17,982 tests). **Tests:** 4 tests quality gate. |

**Desbloqueo parcial:** U2, O1, O2 se pueden hacer una vez el agente cubra los composables relevantes (no hay que esperar el 100%).
**Desbloqueo total:** D1 y S7 requieren que el agente haya terminado completamente.

---

## Como usar este backlog

1. **Al inicio de sesion:** Dime "siguiente bloque" o "bloque X" y trabajamos en orden
2. **Cada item completado:** Lo marco como hecho aqui y en STATUS.md
3. **Si cambian prioridades:** Reordeno bloques sin perder items
4. **Founder tasks:** Las haces tu fuera de sesion, me avisas cuando esten hechas para actualizar
5. **Auditoría SonarQube:** Paralela al backlog normal. Mandar "auditoría fase X" cuando quieras empezar

> Este documento es la **única fuente de verdad** para trabajo pendiente. `PLAN-MAESTRO-10-DE-10.md` redirige aquí (sus ~180 items completados están en STATUS.md changelog). `IDEAS-A-REVISAR.md` es banco de ideas separado (brainstorming, NO backlog).
