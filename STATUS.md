# STATUS — Tracciona

**Última actualización:** 2026-02-28 (hallazgos menores auditoría 26-feb)
**Sesiones completadas:** 0–64 + iteraciones de auditoría 1–13
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

| ID   | Problema                                                                                                                                 | Archivo(s)                                                                                                                          | Acción                                                                                             |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| P1-1 | **50 errores TypeScript** en componentes admin — `npm run typecheck` falla. Bloquea CI si se activa como gate.                           | `components/admin/balance/*.vue`, `components/admin/infra/InfraOverview.vue`                                                        | Fix tipos e interfaces                                                                             |
| P1-2 | **`types/supabase.ts` desactualizado** — las 18 tablas de migración 00065 no están en los tipos generados. Genera errores TS en cascada. | `types/supabase.ts`                                                                                                                 | Ejecutar `npx supabase gen types typescript --project-id gmnrfuzekbwyzkgsaftv > types/supabase.ts` |
| P1-3 | **3 endpoints exponen mensajes de error internos** — revelan nombres de servicio (Supabase, AI provider) al usuario final.               | `server/api/stripe/webhook.post.ts:69`, `server/api/generate-description.post.ts:95`, `server/api/reservations/respond.post.ts:103` | Usar `safeError()` en lugar de exponer `error.message`                                             |

### 🟡 P2 — Funcionalidad degradada (no rompe pero impacta)

| ID   | Problema                                                                             | Archivo(s)                                                   | Acción                                    |
| ---- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------ | ----------------------------------------- |
| P2-1 | **`/api/merchant-feed` y `/__sitemap` sin cache CDN** — se regeneran en cada request | `server/api/merchant-feed.get.ts`, `server/api/__sitemap.ts` | Añadir `Cache-Control` + ETag             |
| P2-2 | **~115 strings sin i18n en admin** — panel admin en español fijo                     | Múltiples archivos `app/pages/admin/`                        | Extraer a `i18n/es.json` y `i18n/en.json` |
| P2-3 | **Faltan índices**: `vehicles(category_id)` y `auction_bids(auction_id)`             | —                                                            | Nueva migración                           |

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

**Estado:** Iteraciones 1–13 completas · commit `b0916e0`

### Lo que se hizo (iter 13, última sesión)

9 páginas refactorizadas, 19 componentes nuevos, 2 composables nuevos:

| Página                              | Antes | Después | Componentes extraídos                                                               |
| ----------------------------------- | ----- | ------- | ----------------------------------------------------------------------------------- |
| `admin/vehiculos/index.vue`         | 706   | ~200    | AdminVehiclesFilters, AdminVehiclesTable, AdminVehicleDeleteModal                   |
| `dashboard/herramientas/widget.vue` | 692   | ~160    | WidgetConfigCard, WidgetPreviewCard, WidgetEmbedSection + useDashboardWidget        |
| `admin/config/branding.vue`         | 625   | ~160    | BrandingIdentityCard, BrandingLogosCard, BrandingTypographyCard, BrandingColorsCard |
| `dashboard/herramientas/index.vue`  | 615   | ~250    | ToolCard                                                                            |
| `dashboard/vehiculos/nuevo.vue`     | 580   | ~420    | useDashboardNuevoVehiculo                                                           |
| `dashboard/vehiculos/index.vue`     | 505   | ~320    | DealerVehicleCard                                                                   |
| `perfil/notificaciones.vue`         | 555   | ~175    | NotificationCategoryCard                                                            |
| `auth/registro.vue`                 | 539   | ~425    | RegistroTypeSelector                                                                |
| `admin/suscripciones.vue`           | 511   | ~220    | AdminSubscriptionsTable, AdminSubscriptionsDeleteModal                              |

### Pendiente — Iteración 14 (próxima sesión)

**39 componentes `.vue` siguen sobre 500 líneas.** Empezar por los más grandes:

| Archivo                                             | Líneas | Estrategia                                    |
| --------------------------------------------------- | ------ | --------------------------------------------- |
| `components/user/UserPanel.vue`                     | 1467   | Extraer composable + tabs como subcomponentes |
| `components/modals/AdvertiseModal.vue`              | 1266   | Extraer composable + pasos del wizard         |
| `components/admin/layout/AdminSidebar.vue`          | 1193   | Extraer grupos de nav como subcomponentes     |
| `components/catalog/FilterBar.vue`                  | 1157   | Extraer paneles de filtro por tipo            |
| `components/catalog/VehicleTable.vue`               | 1132   | Extraer fila + header + toolbar               |
| `components/catalog/ControlsBar.vue`                | 1074   | Extraer secciones de controles                |
| `components/admin/utilidades/ContractGenerator.vue` | 1051   | Extraer composable + secciones del contrato   |
| `components/admin/utilidades/InvoiceGenerator.vue`  | 900    | Extraer composable + secciones de factura     |
| `components/layout/AppHeader.vue`                   | 896    | Extraer nav, mobile menu, user menu           |
| `components/DealerPortal.vue`                       | 875    | Extraer tabs como subcomponentes              |

También hay composables grandes pendientes:
`useAdminProductosPage.ts` (968), `useAdminEmails.ts` (902), `useAdminMetrics.ts` (854), `useAdminProductoDetail.ts` (779), `useInvoice.ts` (724)

**Prompt para retomar:**

> "Lee CLAUDE.md y STATUS.md antes de hacer nada. Cuando estés listo, continúa con el Punto #7 Iteración 14 de la auditoría — empieza por `UserPanel.vue` (1467 líneas)."

---

## Próxima acción recomendada

1. **Auditoría #7 Iteración 14** → refactorizar los 10 componentes más grandes (ver tabla arriba)
2. Ejecutar `npx supabase gen types` → corrige errores TS en cascada (P1-2)
3. Configurar Cloudflare WAF rules → activa rate limiting en producción (P0-3)
4. Migración índices faltantes → performance catálogo y subastas (P2-3)
