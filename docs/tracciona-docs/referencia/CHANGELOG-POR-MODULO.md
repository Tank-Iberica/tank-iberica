# Changelog por Módulo — Tracciona

> Auto-generado por `scripts/generate-changelog-by-module.mjs`
> Rango: 2025-12-11 → hoy | 320 commits analizados
> Generado: 2026-03-11

## Resumen

| Módulo                | Commits | Features | Fixes | Refactors |
| --------------------- | ------- | -------- | ----- | --------- |
| admin-components      | 41      | 12       | 9     | 18        |
| admin-composables     | 49      | 16       | 11    | 20        |
| admin-pages           | 48      | 26       | 6     | 16        |
| assets-css            | 8       | 5        | 0     | 1         |
| auction-components    | 4       | 3        | 0     | 0         |
| auth-components       | 4       | 1        | 1     | 1         |
| auth-pages            | 7       | 4        | 2     | 1         |
| catalog-components    | 36      | 18       | 6     | 10        |
| catalog-composables   | 8       | 2        | 2     | 3         |
| ci-cd                 | 20      | 12       | 2     | 1         |
| claude-config         | 14      | 4        | 2     | 0         |
| composables           | 70      | 42       | 12    | 14        |
| dashboard-components  | 23      | 5        | 3     | 13        |
| dashboard-composables | 24      | 3        | 6     | 14        |
| dashboard-pages       | 39      | 17       | 6     | 16        |
| docs                  | 92      | 28       | 14    | 1         |
| i18n                  | 49      | 36       | 5     | 5         |
| layout                | 21      | 12       | 3     | 4         |
| migrations            | 36      | 25       | 10    | 0         |
| modals                | 19      | 13       | 1     | 3         |
| other-components      | 23      | 12       | 2     | 7         |
| pages                 | 57      | 34       | 8     | 11        |
| perfil-components     | 8       | 2        | 1     | 3         |
| perfil-pages          | 14      | 6        | 3     | 3         |
| plugins               | 13      | 9        | 3     | 0         |
| root-config           | 126     | 40       | 22    | 7         |
| scripts               | 23      | 13       | 3     | 2         |
| server-api            | 41      | 25       | 10    | 4         |
| server-cron           | 19      | 11       | 7     | 0         |
| server-infra          | 10      | 5        | 4     | 0         |
| server-middleware     | 14      | 9        | 3     | 0         |
| server-other          | 15      | 7        | 4     | 3         |
| server-stripe         | 15      | 10       | 4     | 1         |
| server-utils          | 13      | 10       | 1     | 1         |
| shared-components     | 8       | 3        | 2     | 2         |
| subastas-components   | 7       | 2        | 1     | 2         |
| tests                 | 15      | 7        | 1     | 0         |
| ui-components         | 12      | 10       | 1     | 0         |
| utils                 | 21      | 11       | 4     | 5         |
| vehicle-components    | 19      | 9        | 3     | 5         |

---

## admin-components (41 commits)

### feature (12)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (237 archivos)
- `16f0c60` 2026-03-02 — feat: accessibility system, UX forms, autocomplete, hover→@media (199 archivos)
- `f58a3fd` 2026-03-01 — feat(branding): background removal + logo typography config for dealer & admin (`app/components/admin/config/branding/BrandingLogosCard.vue`)
- `5154de3` 2026-02-25 — feat(s44-D): expand infra recommendations and add stack status table (`app/components/admin/infra/InfraOverview.vue`)
- `8ab9361` 2026-02-25 — feat(a11y): add focus-visible styles and aria attributes to forms (5 archivos)
- `3a24b4a` 2026-02-25 — feat: session 37 — security CI, automated tests, safe error messages (`app/components/admin/social/GenerateModal.vue`)
- `5118c44` 2026-02-24 — feat: session 36 gaps — i18n localizedName(), Chart.js lazy-load, docs update (`app/components/admin/infra/InfraHistory.vue`, `app/components/admin/productos/AdminProductoBasicInfo.vue`, `app/components/admin/productos/AdminProductosFilters.vue`)
- `e3744dc` 2026-02-23 — feat: session 35 — integral audit with security hardening, RLS, SEO, CSP, code quality, and file splitting (30 archivos)
- `170d511` 2026-02-23 — feat: sessions 32-33 — data commercialization + infra monitoring (`app/components/admin/layout/AdminSidebar.vue`)
- `9bfddab` 2026-02-22 — feat: session 27 — admin metrics dashboard with charts, KPIs, and CSV export (`app/components/admin/layout/AdminSidebar.vue`)
- `80f4606` 2026-02-09 — feat: add admin users/subscriptions management, dynamic ads/demands, and fix 11 runtime bugs (`app/components/admin/layout/AdminHeader.vue`, `app/components/admin/layout/AdminSidebar.vue`)
- `b018d8a` 2026-02-08 — feat: complete steps 2-5 with full catalog, user interaction, news, and admin panel (`app/components/admin/layout/AdminHeader.vue`, `app/components/admin/layout/AdminSidebar.vue`)

### fix (9)

- `0bf9582` 2026-03-03 — fix(sonar): Fase 3 S3776 — reducir cognitive complexity en 18 ficheros (18→0 issues) (`app/components/admin/utilidades/BalanceExporter.vue`)
- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (32 archivos)
- `9ffff67` 2026-03-02 — fix(sonar): SonarQube audit Fase 1-4 mechanical fixes (5 archivos)
- `ded45ef` 2026-02-28 — fix: correct AdminSidebarNavGroup names and proactive auth profile loading (`app/components/admin/layout/AdminSidebar.vue`)
- `6cc7611` 2026-02-28 — fix: resolve all TypeScript typecheck errors (0 errors) (`app/components/admin/publicidad/DashboardTab.vue`)
- `67f62d4` 2026-02-28 — fix: apply minor type corrections and import fixes across composables and pages (`app/components/admin/dashboard/MetricsRankings.vue`, `app/components/admin/dashboard/Notifications.vue`)
- `4e92bc5` 2026-02-28 — fix: resolve minor audit findings + AdminSidebar refactor + type regen (5 archivos)
- `08c689e` 2026-02-26 — fix: resolve all critical audit findings — TS errors, i18n, types regeneration (9 archivos)
- `b11852b` 2026-02-25 — fix: update AdsTab.vue to use shared formatPriceCents after removing export from useAdminPublicidad (`app/components/admin/publicidad/AdsTab.vue`)

### refactor (18)

- `5879e40` 2026-02-28 — refactor: extract shared ImageUploader component, upgrade admin branding logos (`app/components/admin/config/branding/BrandingLogosCard.vue`)
- `172104e` 2026-02-28 — refactor: extract VehicleTable, ContractGenerator, InvoiceGenerator composables (`app/components/admin/utilidades/ContractGenerator.vue`, `app/components/admin/utilidades/InvoiceGenerator.vue`)
- `b0916e0` 2026-02-28 — refactor: extract composables + components from 9 pages (audit #7 iter 13) (13 archivos)
- `39abb49` 2026-02-28 — refactor: extract composables + components from 6 pages (audit #7 iter 12) (`app/components/admin/config/pricing/PricingCommissionsCard.vue`, `app/components/admin/config/pricing/PricingSubscriptionCard.vue`)
- `c1c9cc5` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 11) (14 archivos)
- `2151098` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 10) (21 archivos)
- `c52ad05` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 9) (13 archivos)
- `957c29f` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 8) (19 archivos)
- `fa54d90` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 7) (12 archivos)
- `241c32b` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 6) (8 archivos)
- `ef010d3` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 5) (4 archivos)
- `acd13ed` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 4) (20 archivos)
- `21a1e85` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 3) (21 archivos)
- `f007521` 2026-02-26 — refactor: extract composables + components from 6 admin pages (audit #7 iter 2) (18 archivos)
- `2fc02b6` 2026-02-26 — refactor: extract composables + components from 4 largest admin pages (audit #7 iter 1) (19 archivos)
- `5a72e47` 2026-02-25 — refactor: replace local formatPrice with shared imports in dashboard and public pages (`app/components/admin/publicidad/DashboardTab.vue`)
- `b0f4c75` 2026-02-25 — refactor: decompose 3 admin pages (publicidad, balance, social) into composables + sub-components (25 archivos)
- `d815af3` 2026-02-09 — refactor: rename admin section "Usuarios" to "Comunidad" and "Agenda" to "Usuarios" (`app/components/admin/layout/AdminHeader.vue`, `app/components/admin/layout/AdminSidebar.vue`)

### chore (1)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (150 archivos)

### other (1)

- `e59309c` 2026-02-28 — ux: improve form accessibility, touch interactions and fix i18n JSON (7 archivos)

## admin-composables (49 commits)

### feature (16)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (35 archivos)
- `a613249` 2026-02-28 — feat: complete session work — PROYECTO-CONTEXTO, CLAUDE2, admin detail refactor (4 archivos)
- `6bc4c68` 2026-02-25 — feat: advanced ads — prebid, viewability tracking, audience segmentation (`app/composables/admin/useAdminAdDashboard.ts`)
- `8f133c7` 2026-02-24 — feat: session 36 — cross-audit: indexes, cache, auth, i18n, docs, consolidation (`app/composables/admin/useAdminMetrics.ts`)
- `e3744dc` 2026-02-23 — feat: session 35 — integral audit with security hardening, RLS, SEO, CSP, code quality, and file splitting (5 archivos)
- `987441c` 2026-02-23 — feat: session 34 — security audit remediation + accumulated missing files (9 archivos)
- `9bfddab` 2026-02-22 — feat: session 27 — admin metrics dashboard with charts, KPIs, and CSV export (`app/composables/admin/useAdminMetrics.ts`)
- `412df3d` 2026-02-21 — feat: session 26 — invoicing with Quaderno, Stripe webhook auto-invoicing, and security page (`app/composables/admin/useAdminVehicles.ts`, `app/composables/admin/useCloudinaryUpload.ts`)
- `ab45066` 2026-02-21 — feat: sessions 22-23 — PWA + performance and multi-vertical clone system (`app/composables/admin/useAdminVerticalConfig.ts`)
- `80f4606` 2026-02-09 — feat: add admin users/subscriptions management, dynamic ads/demands, and fix 11 runtime bugs (8 archivos)
- `b9dd66b` 2026-02-09 — feat: add dynamic filter options and calc filter type (`app/composables/admin/useAdminFilters.ts`)
- `cab5656` 2026-02-08 — feat: add dedicated meta description field and word counter to news editor (`app/composables/admin/useAdminNews.ts`, `app/composables/admin/useSeoScore.ts`)
- `250d6af` 2026-02-08 — feat: add image file upload to news editor via Cloudinary (`app/composables/admin/useCloudinaryUpload.ts`)
- `45ed447` 2026-02-08 — feat: add news editor/creator with real-time SEO scoring (`app/composables/admin/useAdminNews.ts`, `app/composables/admin/useSeoScore.ts`)
- `f52bf27` 2026-02-08 — feat: add subcategory management, location auto-detection, singular names, and admin table improvements (`app/composables/admin/useAdminVehicles.ts`)
- `b018d8a` 2026-02-08 — feat: complete steps 2-5 with full catalog, user interaction, news, and admin panel (9 archivos)

### fix (11)

- `0bf9582` 2026-03-03 — fix(sonar): Fase 3 S3776 — reducir cognitive complexity en 18 ficheros (18→0 issues) (4 archivos)
- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (48 archivos)
- `9ffff67` 2026-03-02 — fix(sonar): SonarQube audit Fase 1-4 mechanical fixes (16 archivos)
- `f458e03` 2026-02-28 — fix: resolve permission denied for table users errors (`app/composables/admin/useAdminDemands.ts`)
- `6cc7611` 2026-02-28 — fix: resolve all TypeScript typecheck errors (0 errors) (`app/composables/admin/useAdminDealerSuscripciones.ts`, `app/composables/admin/useAdminProductoDetail.ts`)
- `67f62d4` 2026-02-28 — fix: apply minor type corrections and import fixes across composables and pages (11 archivos)
- `374b82a` 2026-02-28 — fix: correct status value 'active' → 'published' in admin composables (5 archivos)
- `4e92bc5` 2026-02-28 — fix: resolve minor audit findings + AdminSidebar refactor + type regen (10 archivos)
- `08c689e` 2026-02-26 — fix: resolve all critical audit findings — TS errors, i18n, types regeneration (`app/composables/admin/useAdminBalance.ts`, `app/composables/admin/useAdminVehicles.ts`)
- `6c54ab7` 2026-02-25 — fix: replace remaining tank-iberica references with tracciona in Cloudinary paths (`app/composables/admin/useCloudinaryUpload.ts`)
- `5546175` 2026-02-23 — fix: audit remediation — sessions 3, 8, 19 + cross-session cleanup (`app/composables/admin/useAdminHistorico.ts`)

### refactor (20)

- `1f93765` 2026-02-28 — refactor: split useAdminMetrics.ts into 4 sub-modules (Auditoría #7 Iter. 15) (`app/composables/admin/useAdminMetrics.ts`, `app/composables/admin/useAdminMetricsActivity.ts`, `app/composables/admin/useAdminMetricsRevenue.ts`)
- `145a7c5` 2026-02-28 — refactor: split useAdminEmails.ts — extract 30 email template definitions (Auditoría #7 Iter. 15) (`app/composables/admin/useAdminEmails.ts`)
- `c13676f` 2026-02-28 — refactor: split useAdminProductosPage.ts into 3 sub-composables (Auditoría #7 Iter. 15) (`app/composables/admin/useAdminProductosColumns.ts`, `app/composables/admin/useAdminProductosPage.ts`, `app/composables/admin/useAdminProductosSort.ts`)
- `172104e` 2026-02-28 — refactor: extract VehicleTable, ContractGenerator, InvoiceGenerator composables (`app/composables/admin/useContractGenerator.ts`, `app/composables/admin/useInvoiceGenerator.ts`)
- `b0916e0` 2026-02-28 — refactor: extract composables + components from 9 pages (audit #7 iter 13) (13 archivos)
- `39abb49` 2026-02-28 — refactor: extract composables + components from 6 pages (audit #7 iter 12) (`app/composables/admin/useAdminConfigPricing.ts`, `app/composables/admin/useAdminInfrastructura.ts`)
- `c1c9cc5` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 11) (`app/composables/admin/useAdminNoticiasIndex.ts`, `app/composables/admin/useAdminProductoNuevo.ts`)
- `2151098` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 10) (5 archivos)
- `c52ad05` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 9) (4 archivos)
- `957c29f` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 8) (5 archivos)
- `fa54d90` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 7) (`app/composables/admin/useAdminBanner.ts`, `app/composables/admin/useAdminServicios.ts`, `app/composables/admin/useAdminTransporte.ts`)
- `241c32b` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 6) (`app/composables/admin/useAdminCaracteristicas.ts`, `app/composables/admin/useAdminDashboardPage.ts`, `app/composables/admin/useAdminProductosPage.ts`)
- `ef010d3` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 5) (`app/composables/admin/useAdminAuctionList.ts`)
- `acd13ed` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 4) (`app/composables/admin/useAdminComentarios.ts`, `app/composables/admin/useAdminHistoricoPage.ts`, `app/composables/admin/useAdminPagos.ts`)
- `21a1e85` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 3) (4 archivos)
- `f007521` 2026-02-26 — refactor: extract composables + components from 6 admin pages (audit #7 iter 2) (5 archivos)
- `2fc02b6` 2026-02-26 — refactor: extract composables + components from 4 largest admin pages (audit #7 iter 1) (4 archivos)
- `5a72e47` 2026-02-25 — refactor: replace local formatPrice with shared imports in dashboard and public pages (`app/composables/admin/useAdminPublicidad.ts`)
- `9fea1e2` 2026-02-25 — refactor: replace local generateSlug and formatPrice with shared imports in admin pages (4 archivos)
- `b0f4c75` 2026-02-25 — refactor: decompose 3 admin pages (publicidad, balance, social) into composables + sub-components (`app/composables/admin/useAdminBalanceUI.ts`, `app/composables/admin/useAdminPublicidad.ts`, `app/composables/admin/useSocialAdminUI.ts`)

### chore (2)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (18 archivos)
- `29c06e6` 2026-03-04 — chore(sonarqube): Fase 3 & 5 refactoring — S3776 & S7924 (`app/composables/admin/useAdminBalance.ts`)

## admin-pages (48 commits)

### feature (26)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (53 archivos)
- `16f0c60` 2026-03-02 — feat: accessibility system, UX forms, autocomplete, hover→@media (48 archivos)
- `f58a3fd` 2026-03-01 — feat(branding): background removal + logo typography config for dealer & admin (`app/pages/admin/config/branding.vue`)
- `ce1d63f` 2026-02-28 — feat: extract ~115 admin panel strings to i18n (P2-2 resolved) (29 archivos)
- `50a3018` 2026-02-25 — feat: add revenue metrics by channel, MRR/ARR, and lead value tracking (`app/pages/admin/facturacion.vue`)
- `b7c16da` 2026-02-25 — feat: pending session 36-37 changes — types, server fixes, ads, vehicle integration (`app/pages/admin/banner.vue`, `app/pages/admin/subastas.vue`)
- `5118c44` 2026-02-24 — feat: session 36 gaps — i18n localizedName(), Chart.js lazy-load, docs update (8 archivos)
- `e3744dc` 2026-02-23 — feat: session 35 — integral audit with security hardening, RLS, SEO, CSP, code quality, and file splitting (17 archivos)
- `fc610c0` 2026-02-23 — feat: session 34b — hardening, robustness, and tech debt reduction (`app/pages/admin/index.vue`, `app/pages/admin/vehiculos/[id].vue`)
- `987441c` 2026-02-23 — feat: session 34 — security audit remediation + accumulated missing files (28 archivos)
- `170d511` 2026-02-23 — feat: sessions 32-33 — data commercialization + infra monitoring (`app/pages/admin/infraestructura.vue`)
- `e6a83e9` 2026-02-23 — feat: session 29 — favorites notifications, saved searches, alert editing (`app/pages/admin/productos/index.vue`)
- `9bfddab` 2026-02-22 — feat: session 27 — admin metrics dashboard with charts, KPIs, and CSV export (`app/pages/admin/dashboard.vue`, `app/pages/admin/index.vue`)
- `74ed59c` 2026-02-21 — feat: audit fixes — 16 missing items from sessions 13-26 (`app/pages/admin/subastas.vue`)
- `412df3d` 2026-02-21 — feat: session 26 — invoicing with Quaderno, Stripe webhook auto-invoicing, and security page (4 archivos)
- `d0186d7` 2026-02-21 — feat: session 25 — EU/UK regulatory compliance (DSA, AI Act, UK OSA, RGPD) (`app/pages/admin/reportes.vue`)
- `ab45066` 2026-02-21 — feat: sessions 22-23 — PWA + performance and multi-vertical clone system (5 archivos)
- `b1feebb` 2026-02-10 — feat: add advanced SEO improvements — breadcrumbs, ItemList schema, CLS fix, favicons, and alt text (`app/pages/admin/anunciantes.vue`, `app/pages/admin/noticias/nuevo.vue`)
- `ab9a7e6` 2026-02-10 — feat: implement comprehensive SEO with sitemap, structured data, and keyword targeting (`app/pages/admin/productos/index.vue`)
- `80f4606` 2026-02-09 — feat: add admin users/subscriptions management, dynamic ads/demands, and fix 11 runtime bugs (14 archivos)
- `363d2f2` 2026-02-09 — feat: improve admin pages with corporate PDF styling and characteristics management (7 archivos)
- `cab5656` 2026-02-08 — feat: add dedicated meta description field and word counter to news editor (`app/pages/admin/noticias/[id].vue`, `app/pages/admin/noticias/nuevo.vue`)
- `250d6af` 2026-02-08 — feat: add image file upload to news editor via Cloudinary (`app/pages/admin/noticias/[id].vue`, `app/pages/admin/noticias/nuevo.vue`)
- `45ed447` 2026-02-08 — feat: add news editor/creator with real-time SEO scoring (4 archivos)
- `f52bf27` 2026-02-08 — feat: add subcategory management, location auto-detection, singular names, and admin table improvements (`app/pages/admin/productos/[id].vue`, `app/pages/admin/productos/index.vue`, `app/pages/admin/productos/nuevo.vue`)
- `b018d8a` 2026-02-08 — feat: complete steps 2-5 with full catalog, user interaction, news, and admin panel (23 archivos)

### fix (6)

- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (`app/pages/admin/config/branding.vue`)
- `9ffff67` 2026-03-02 — fix(sonar): SonarQube audit Fase 1-4 mechanical fixes (`app/pages/admin/config/editorial.vue`, `app/pages/admin/subastas/[id].vue`)
- `67f62d4` 2026-02-28 — fix: apply minor type corrections and import fixes across composables and pages (5 archivos)
- `d21d142` 2026-02-24 — fix: migrate remaining i18n display refs to JSONB localizedName() (`app/pages/admin/index.vue`)
- `cd6d9b5` 2026-02-23 — fix: add auth guards to push/send and whatsapp/process endpoints (`app/pages/admin/utilidades.vue`, `app/pages/admin/verificaciones.vue`, `app/pages/admin/whatsapp.vue`)
- `5546175` 2026-02-23 — fix: audit remediation — sessions 3, 8, 19 + cross-session cleanup (`app/pages/admin/utilidades.vue`, `app/pages/admin/verificaciones.vue`, `app/pages/admin/whatsapp.vue`)

### refactor (16)

- `b0916e0` 2026-02-28 — refactor: extract composables + components from 9 pages (audit #7 iter 13) (`app/pages/admin/config/branding.vue`, `app/pages/admin/suscripciones.vue`, `app/pages/admin/vehiculos/index.vue`)
- `39abb49` 2026-02-28 — refactor: extract composables + components from 6 pages (audit #7 iter 12) (`app/pages/admin/config/pricing.vue`, `app/pages/admin/infraestructura.vue`)
- `c1c9cc5` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 11) (`app/pages/admin/noticias/index.vue`, `app/pages/admin/productos/nuevo.vue`)
- `2151098` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 10) (5 archivos)
- `c52ad05` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 9) (4 archivos)
- `957c29f` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 8) (5 archivos)
- `fa54d90` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 7) (`app/pages/admin/banner.vue`, `app/pages/admin/servicios.vue`, `app/pages/admin/transporte.vue`)
- `241c32b` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 6) (`app/pages/admin/config/caracteristicas.vue`, `app/pages/admin/dashboard.vue`, `app/pages/admin/productos/index.vue`)
- `ef010d3` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 5) (`app/pages/admin/subastas/index.vue`)
- `acd13ed` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 4) (`app/pages/admin/comentarios.vue`, `app/pages/admin/historico.vue`, `app/pages/admin/pagos.vue`)
- `21a1e85` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 3) (4 archivos)
- `f007521` 2026-02-26 — refactor: extract composables + components from 6 admin pages (audit #7 iter 2) (5 archivos)
- `2fc02b6` 2026-02-26 — refactor: extract composables + components from 4 largest admin pages (audit #7 iter 1) (4 archivos)
- `9fea1e2` 2026-02-25 — refactor: replace local generateSlug and formatPrice with shared imports in admin pages (9 archivos)
- `b0f4c75` 2026-02-25 — refactor: decompose 3 admin pages (publicidad, balance, social) into composables + sub-components (`app/pages/admin/balance.vue`, `app/pages/admin/publicidad.vue`, `app/pages/admin/social.vue`)
- `d815af3` 2026-02-09 — refactor: rename admin section "Usuarios" to "Comunidad" and "Agenda" to "Usuarios" (`app/pages/admin/agenda.vue`, `app/pages/admin/index.vue`)

## assets-css (8 commits)

### feature (5)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (5 archivos)
- `16f0c60` 2026-03-02 — feat: accessibility system, UX forms, autocomplete, hover→@media (`app/assets/css/themes.css`, `app/assets/css/tokens.css`)
- `8ab9361` 2026-02-25 — feat(a11y): add focus-visible styles and aria attributes to forms (`app/assets/css/tokens.css`)
- `987441c` 2026-02-23 — feat: session 34 — security audit remediation + accumulated missing files (`app/assets/css/tokens.css`)
- `504aa79` 2026-02-01 — feat: scaffold Nuxt 4 + Auth + layout mobile-first (Step 1, tasks 1.1-1.8) (`app/assets/css/tokens.css`)

### refactor (1)

- `b4da9eb` 2026-02-28 — refactor: extract useHorizontalScroll composable and shared CSS from FilterBar (`app/assets/css/filter-bar-shared.css`)

### other (2)

- `e59309c` 2026-02-28 — ux: improve form accessibility, touch interactions and fix i18n JSON (`app/assets/css/interactions.css`)
- `5553dc1` 2026-02-26 — a11y: semantic HTML audit — article tag, h1, sr-only utility (Session 62D) (`app/assets/css/tokens.css`)

## auction-components (4 commits)

### feature (3)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (`app/components/auction/AuctionBidPanel.vue`)
- `2ebc725` 2026-02-25 — feat: implement flujos operativos enhancements (pre-session 44) (`app/components/auction/AuctionBidPanel.vue`)
- `987441c` 2026-02-23 — feat: session 34 — security audit remediation + accumulated missing files (`app/components/auction/AuctionBidPanel.vue`)

### chore (1)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (`app/components/auction/AuctionBidPanel.vue`)

## auth-components (4 commits)

### feature (1)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (`app/components/auth/RegistroTypeSelector.vue`)

### fix (1)

- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (`app/components/auth/RegistroTypeSelector.vue`)

### refactor (1)

- `b0916e0` 2026-02-28 — refactor: extract composables + components from 9 pages (audit #7 iter 13) (`app/components/auth/RegistroTypeSelector.vue`)

### chore (1)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (`app/components/auth/RegistroTypeSelector.vue`)

## auth-pages (7 commits)

### feature (4)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (5 archivos)
- `fdcf027` 2026-02-26 — feat: integrate Zod + VeeValidate for form validation (`app/pages/auth/login.vue`, `app/pages/auth/registro.vue`)
- `f510a47` 2026-02-25 — feat(a11y): add aria-invalid, real-time validation to auth forms (`app/pages/auth/login.vue`, `app/pages/auth/registro.vue`)
- `df735f8` 2026-02-21 — feat: session 24 — user zone with auth, profiles, and dealer dashboard (5 archivos)

### fix (2)

- `30ed7d5` 2026-02-28 — fix: use role field for admin detection in useAuth, dealer middleware and login (`app/pages/auth/login.vue`)
- `6cc7611` 2026-02-28 — fix: resolve all TypeScript typecheck errors (0 errors) (`app/pages/auth/registro.vue`)

### refactor (1)

- `b0916e0` 2026-02-28 — refactor: extract composables + components from 9 pages (audit #7 iter 13) (`app/pages/auth/registro.vue`)

## catalog-components (36 commits)

### feature (18)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (20 archivos)
- `dcc138e` 2026-03-02 — feat(catalog): geo-fallback, promo cards, similar searches, empty state (12 archivos)
- `8ab9361` 2026-02-25 — feat(a11y): add focus-visible styles and aria attributes to forms (`app/components/catalog/FilterBar.vue`)
- `4ef5988` 2026-02-24 — feat: overhaul filter UX — nav-only SubcategoryBar, collapsible advanced panel, active chips, simplified location (`app/components/catalog/CatalogActiveFilters.vue`, `app/components/catalog/FilterBar.vue`, `app/components/catalog/SubcategoryBar.vue`)
- `987441c` 2026-02-23 — feat: session 34 — security audit remediation + accumulated missing files (5 archivos)
- `e6a83e9` 2026-02-23 — feat: session 29 — favorites notifications, saved searches, alert editing (`app/components/catalog/ControlsBar.vue`)
- `80f4606` 2026-02-09 — feat: add admin users/subscriptions management, dynamic ads/demands, and fix 11 runtime bugs (`app/components/catalog/AnnounceBanner.vue`, `app/components/catalog/FilterBar.vue`, `app/components/catalog/VehicleTable.vue`)
- `2245eae` 2026-02-09 — feat: update layout with flag-based language switcher and banner improvements (`app/components/catalog/AnnounceBanner.vue`)
- `b9dd66b` 2026-02-09 — feat: add dynamic filter options and calc filter type (`app/components/catalog/FilterBar.vue`, `app/components/catalog/SubcategoryBar.vue`)
- `0845624` 2026-02-09 — feat: add smart location display with country flags (`app/components/catalog/VehicleCard.vue`, `app/components/catalog/VehicleTable.vue`)
- `f52bf27` 2026-02-08 — feat: add subcategory management, location auto-detection, singular names, and admin table improvements (`app/components/catalog/VehicleCard.vue`, `app/components/catalog/VehicleGrid.vue`, `app/components/catalog/VehicleTable.vue`)
- `b018d8a` 2026-02-08 — feat: complete steps 2-5 with full catalog, user interaction, news, and admin panel (8 archivos)
- `8334af0` 2026-02-06 — feat: implement hierarchical subcategory/type filter display (`app/components/catalog/FilterBar.vue`, `app/components/catalog/SubcategoryBar.vue`)
- `286ca2e` 2026-02-01 — feat: add AnnounceBanner and integrate full catalog in index page (`app/components/catalog/AnnounceBanner.vue`)
- `f83a488` 2026-02-01 — feat: add VehicleCard and VehicleGrid with responsive layout (`app/components/catalog/VehicleCard.vue`, `app/components/catalog/VehicleGrid.vue`)
- `477080c` 2026-02-01 — feat: add FilterBar with 6 dynamic filter types and mobile bottom sheet (`app/components/catalog/FilterBar.vue`)
- `9be1fea` 2026-02-01 — feat: add SubcategoryBar with dynamic chips from database (`app/components/catalog/SubcategoryBar.vue`)
- `18359d8` 2026-02-01 — feat: add CategoryBar component with horizontal scroll on mobile (`app/components/catalog/CategoryBar.vue`)

### fix (6)

- `0bf9582` 2026-03-03 — fix(sonar): Fase 3 S3776 — reducir cognitive complexity en 18 ficheros (18→0 issues) (`app/components/catalog/CatalogActiveFilters.vue`)
- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (`app/components/catalog/AnnounceBanner.vue`, `app/components/catalog/FilterBarLocationPicker.vue`)
- `380de2b` 2026-02-26 — fix: resolve important audit findings — refactor FilterBar, sanitize errors, add sizes, update README (6 archivos)
- `d21d142` 2026-02-24 — fix: migrate remaining i18n display refs to JSONB localizedName() (`app/components/catalog/VehicleGrid.vue`)
- `b1c8b0c` 2026-02-01 — fix: remove "Todos" button from CategoryBar (`app/components/catalog/CategoryBar.vue`)
- `c21cb9d` 2026-02-01 — fix: resolve RLS infinite recursion and component name prefixes (`app/components/catalog/VehicleGrid.vue`)

### refactor (10)

- `b4da9eb` 2026-02-28 — refactor: extract useHorizontalScroll composable and shared CSS from FilterBar (`app/components/catalog/FilterBarDesktop.vue`, `app/components/catalog/FilterBarMobile.vue`)
- `172104e` 2026-02-28 — refactor: extract VehicleTable, ContractGenerator, InvoiceGenerator composables (`app/components/catalog/VehicleTable.vue`, `app/components/catalog/VehicleTablePdfModal.vue`)
- `95cc2c8` 2026-02-28 — refactor: split FilterBar into composable + mobile/desktop subcomponents (`app/components/catalog/FilterBar.vue`, `app/components/catalog/FilterBarDesktop.vue`, `app/components/catalog/FilterBarMobile.vue`)
- `b0916e0` 2026-02-28 — refactor: extract composables + components from 9 pages (audit #7 iter 13) (`app/components/catalog/CatalogActiveFilters.vue`, `app/components/catalog/FilterBarAdvancedPanel.vue`, `app/components/catalog/VehicleTable.vue`)
- `5a72e47` 2026-02-25 — refactor: replace local formatPrice with shared imports in dashboard and public pages (`app/components/catalog/VehicleCard.vue`)
- `c524a5d` 2026-02-25 — refactor: extract FilterBarDynamicFilters subcomponent from FilterBar (`app/components/catalog/FilterBar.vue`, `app/components/catalog/FilterBarDynamicFilters.vue`)
- `4491164` 2026-02-07 — refactor: reorganize header and catalog controls layout (`app/components/catalog/CategoryBar.vue`, `app/components/catalog/ControlsBar.vue`, `app/components/catalog/FilterBar.vue`)
- `fda2340` 2026-02-02 — refactor: alinear subcategorybar, filterbar y ajustes mobile con legacy (4 archivos)
- `ae34eb7` 2026-02-02 — refactor: alinear header, banner y categorybar con diseño legacy (`app/components/catalog/AnnounceBanner.vue`, `app/components/catalog/CategoryBar.vue`)
- `e58f238` 2026-02-02 — refactor: alinear UI del catálogo con diseño legacy (7 archivos)

### chore (1)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (16 archivos)

### other (1)

- `e59309c` 2026-02-28 — ux: improve form accessibility, touch interactions and fix i18n JSON (`app/components/catalog/VehicleCard.vue`)

## catalog-composables (8 commits)

### feature (2)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (4 archivos)
- `dcc138e` 2026-03-02 — feat(catalog): geo-fallback, promo cards, similar searches, empty state (4 archivos)

### fix (2)

- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (4 archivos)
- `9ffff67` 2026-03-02 — fix(sonar): SonarQube audit Fase 1-4 mechanical fixes (`app/composables/catalog/useGeoFallback.ts`)

### refactor (3)

- `b4da9eb` 2026-02-28 — refactor: extract useHorizontalScroll composable and shared CSS from FilterBar (`app/composables/catalog/useHorizontalScroll.ts`)
- `172104e` 2026-02-28 — refactor: extract VehicleTable, ContractGenerator, InvoiceGenerator composables (`app/composables/catalog/useVehicleTable.ts`)
- `95cc2c8` 2026-02-28 — refactor: split FilterBar into composable + mobile/desktop subcomponents (`app/composables/catalog/useFilterBar.ts`)

### chore (1)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (`app/composables/catalog/useSimilarSearches.ts`)

## ci-cd (20 commits)

### feature (12)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (6 archivos)
- `704bea4` 2026-02-26 — feat: add SEO audit CI workflow and enhance seo-check with new validations (`.github/workflows/seo-audit.yml`)
- `9fbb6ed` 2026-02-26 — feat: add SEO validation script + integrate in daily-audit CI (Session 63F) (`.github/workflows/daily-audit.yml`)
- `1c4e550` 2026-02-26 — feat(s59-C): add npm license audit script integrated in daily-audit CI (`.github/workflows/daily-audit.yml`)
- `e20e7e4` 2026-02-26 — feat(s55): restore test script, Bitbucket mirror, third-party dependencies (`.github/workflows/mirror.yml`)
- `89f1edc` 2026-02-26 — feat(s52): Lighthouse CI workflow, Web Vitals GA4, accessibility tests (`.github/workflows/lighthouse.yml`)
- `fa52bbd` 2026-02-26 — feat(s51-C): add test coverage reporting to CI pipeline (`.github/workflows/ci.yml`)
- `ee5f9ed` 2026-02-25 — feat(s46-A): add DAST security scanning with ZAP, Nuclei and SSL checks (`.github/workflows/dast-scan.yml`)
- `d57f507` 2026-02-25 — feat(s45-A): add daily automated audit workflow with email alerts (`.github/workflows/daily-audit.yml`)
- `3a24b4a` 2026-02-25 — feat: session 37 — security CI, automated tests, safe error messages (`.github/workflows/security.yml`)
- `246ed02` 2026-02-23 — feat: session 30 — resilience plan, backup scripts, and GitHub Actions cron (`.github/workflows/backup.yml`)
- `74ed59c` 2026-02-21 — feat: audit fixes — 16 missing items from sessions 13-26 (`.github/workflows/ci.yml`)

### fix (2)

- `ac722d7` 2026-03-03 — fix: npm audit fix minimatch 3.1.5 + audit-level=critical in security.yml (`.github/workflows/security.yml`)
- `4e92bc5` 2026-02-28 — fix: resolve minor audit findings + AdminSidebar refactor + type regen (`.github/workflows/security.yml`)

### refactor (1)

- `c136704` 2026-02-25 — refactor(s45-D): centralize hardcoded AI models, URLs and project refs (`.github/workflows/backup.yml`)

### test (1)

- `21fe5bd` 2026-02-25 — test(e2e): add 8 user journey E2E tests with Playwright (`.github/workflows/ci.yml`)

### docs (1)

- `194aac9` 2026-02-25 — docs(s46-C): add security testing strategy and DAST reference (`.github/workflows/security.yml`)

### chore (3)

- `9659370` 2026-03-04 — chore: add dependabot, gitleaks, knip, and endpoint drift tooling (`.github/dependabot.yml`)
- `8653a4b` 2026-03-03 — chore(ci): add quarterly-reminders workflow (`.github/workflows/quarterly-reminders.yml`)
- `2294b5f` 2026-03-03 — chore(ci): add anomaly-detection job to daily audit (`.github/workflows/daily-audit.yml`)

## claude-config (14 commits)

### feature (4)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (7 archivos)
- `dd0e4f4` 2026-03-03 — feat(claude): Policy Engine completo + ENTORNO-DESARROLLO.md (6 archivos)
- `3d25e3b` 2026-03-02 — feat(credits): Stripe checkout for credit packs + i18n updates (`.claude/settings.json`, `.claude/settings.local.json`)
- `a613249` 2026-02-28 — feat: complete session work — PROYECTO-CONTEXTO, CLAUDE2, admin detail refactor (`.claude/settings.local.json`)

### fix (2)

- `b1bf1d3` 2026-03-03 — fix(claude): restaurar regex SECURITY_POLICY + prettierignore (`.claude/policy/SECURITY_POLICY.md`)
- `4e92bc5` 2026-02-28 — fix: resolve minor audit findings + AdminSidebar refactor + type regen (`.claude/settings.local.json`)

### docs (4)

- `86a2cd5` 2026-03-02 — docs: backlog ejecutable (116 items) + optimizacion flujo documentacion (4 archivos)
- `855e807` 2026-03-02 — docs: consolidate documentation — BACKLOG, strategy split, legacy cleanup (5 archivos)
- `0083eab` 2026-02-25 — docs: add strategic planning documents (FLUJOS-OPERATIVOS, context, audit plan) (`.claude/settings.local.json`)
- `7416f3e` 2026-02-01 — docs: configuración inicial (8 archivos)

### chore (3)

- `700ffe7` 2026-03-03 — chore(policy): auditoría final 42/42 + audit-final.mjs (`.claude/policy/audit-final.mjs`)
- `d152676` 2026-02-25 — chore: add .claude commands, skills, and settings (12 archivos)
- `b9ec762` 2026-02-01 — chore: añadir zip a gitignore y corregir formato (`.claude/settings.json`)

### other (1)

- `e59309c` 2026-02-28 — ux: improve form accessibility, touch interactions and fix i18n JSON (`.claude/check-closing-and-cleanup.sh`, `.claude/cleanup-node.bat`)

## composables (70 commits)

### feature (42)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (72 archivos)
- `dcc138e` 2026-03-02 — feat(catalog): geo-fallback, promo cards, similar searches, empty state (`app/composables/useVehicles.ts`)
- `16f0c60` 2026-03-02 — feat: accessibility system, UX forms, autocomplete, hover→@media (5 archivos)
- `4ee6c88` 2026-03-01 — feat(sold-modal): add sale price field and record sold_at timestamp (`app/composables/useAnalyticsTracking.ts`, `app/composables/useVehicles.ts`)
- `009e85b` 2026-02-28 — feat: implement dual-URL vehicle detail with dealer branding (launch phase) (`app/composables/useVehicleDetail.ts`)
- `2e89a83` 2026-02-28 — feat: implement dealer public catalog in DealerPortal (`app/composables/useCatalogState.ts`, `app/composables/useVehicles.ts`)
- `fdcf027` 2026-02-26 — feat: integrate Zod + VeeValidate for form validation (`app/composables/useFormValidation.ts`)
- `a6b5a20` 2026-02-26 — feat: add useStructuredData composable + global Organization schema (Session 63A-D) (`app/composables/useStructuredData.ts`)
- `684e18f` 2026-02-26 — feat(s58-A): add dealer market intelligence with price position insights (`app/composables/useMarketIntelligence.ts`)
- `498129b` 2026-02-26 — feat(s56-B): add feature flags table, server utility, and client composable (`app/composables/useFeatureFlags.ts`)
- `2ebc725` 2026-02-25 — feat: implement flujos operativos enhancements (pre-session 44) (`app/composables/useAuction.ts`)
- `5154de3` 2026-02-25 — feat(s44-D): expand infra recommendations and add stack status table (`app/composables/useInfraRecommendations.ts`)
- `57074ed` 2026-02-25 — feat(s44-B): add immutable cache for images and version URL helper (`app/composables/useImageUrl.ts`)
- `6141fe9` 2026-02-25 — feat: add lead tracking composable with ficha view and contact click events (`app/composables/useDealerDashboard.ts`, `app/composables/useLeadTracking.ts`)
- `50a3018` 2026-02-25 — feat: add revenue metrics by channel, MRR/ARR, and lead value tracking (`app/composables/useRevenueMetrics.ts`)
- `b7c16da` 2026-02-25 — feat: pending session 36-37 changes — types, server fixes, ads, vehicle integration (`app/composables/useAds.ts`)
- `97b8321` 2026-02-25 — feat: vehicle upload onboarding wizard (`app/composables/useOnboarding.ts`)
- `6bc4c68` 2026-02-25 — feat: advanced ads — prebid, viewability tracking, audience segmentation (`app/composables/useAdViewability.ts`, `app/composables/useAudienceSegmentation.ts`, `app/composables/usePrebid.ts`)
- `4c7ecab` 2026-02-25 — feat: buyer experience — conversations, reservations, comparator, price history, seller profiles (6 archivos)
- `5118c44` 2026-02-24 — feat: session 36 gaps — i18n localizedName(), Chart.js lazy-load, docs update (`app/composables/useLocalized.ts`)
- `8f133c7` 2026-02-24 — feat: session 36 — cross-audit: indexes, cache, auth, i18n, docs, consolidation (`app/composables/shared/dateHelpers.ts`, `app/composables/useMarketData.ts`)
- `e3744dc` 2026-02-23 — feat: session 35 — integral audit with security hardening, RLS, SEO, CSP, code quality, and file splitting (5 archivos)
- `987441c` 2026-02-23 — feat: session 34 — security audit remediation + accumulated missing files (21 archivos)
- `170d511` 2026-02-23 — feat: sessions 32-33 — data commercialization + infra monitoring (5 archivos)
- `e6a83e9` 2026-02-23 — feat: session 29 — favorites notifications, saved searches, alert editing (`app/composables/useDealerDashboard.ts`)
- `90d8c3f` 2026-02-22 — feat: session 28 — dealer CRM, onboarding, health score, pipeline, observatory (`app/composables/useDealerHealthScore.ts`)
- `74ed59c` 2026-02-21 — feat: audit fixes — 16 missing items from sessions 13-26 (4 archivos)
- `412df3d` 2026-02-21 — feat: session 26 — invoicing with Quaderno, Stripe webhook auto-invoicing, and security page (`app/composables/useInvoicing.ts`)
- `d0186d7` 2026-02-21 — feat: session 25 — EU/UK regulatory compliance (DSA, AI Act, UK OSA, RGPD) (`app/composables/useReports.ts`)
- `df735f8` 2026-02-21 — feat: session 24 — user zone with auth, profiles, and dealer dashboard (4 archivos)
- `ab45066` 2026-02-21 — feat: sessions 22-23 — PWA + performance and multi-vertical clone system (`app/composables/useVerticalConfig.ts`)
- `ab9a7e6` 2026-02-10 — feat: implement comprehensive SEO with sitemap, structured data, and keyword targeting (`app/composables/usePageSeo.ts`)
- `80f4606` 2026-02-09 — feat: add admin users/subscriptions management, dynamic ads/demands, and fix 11 runtime bugs (`app/composables/useVehicleTypeSelector.ts`)
- `b9dd66b` 2026-02-09 — feat: add dynamic filter options and calc filter type (`app/composables/useFilters.ts`)
- `0845624` 2026-02-09 — feat: add smart location display with country flags (`app/composables/useUserLocation.ts`)
- `cab5656` 2026-02-08 — feat: add dedicated meta description field and word counter to news editor (`app/composables/useNews.ts`)
- `f52bf27` 2026-02-08 — feat: add subcategory management, location auto-detection, singular names, and admin table improvements (`app/composables/useVehicles.ts`)
- `b018d8a` 2026-02-08 — feat: complete steps 2-5 with full catalog, user interaction, news, and admin panel (6 archivos)
- `8334af0` 2026-02-06 — feat: implement hierarchical subcategory/type filter display (`app/composables/useCatalogState.ts`, `app/composables/useFilters.ts`)
- `d8fd418` 2026-02-01 — feat: add useCatalogState composable for catalog state management (`app/composables/useCatalogState.ts`)
- `85be15a` 2026-02-01 — feat: add useFilters composable with dynamic filter logic (`app/composables/useFilters.ts`)
- `eb98cde` 2026-02-01 — feat: add useVehicles composable with filters and infinite pagination (`app/composables/useVehicles.ts`)

### fix (12)

- `0bf9582` 2026-03-03 — fix(sonar): Fase 3 S3776 — reducir cognitive complexity en 18 ficheros (18→0 issues) (`app/composables/useDatos.ts`, `app/composables/useFilters.ts`)
- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (35 archivos)
- `9ffff67` 2026-03-02 — fix(sonar): SonarQube audit Fase 1-4 mechanical fixes (9 archivos)
- `3631204` 2026-02-28 — fix: align useAuth fetchProfile query with actual DB columns (`app/composables/useAuth.ts`, `app/composables/useUserProfile.ts`)
- `8cbf53f` 2026-02-28 — fix: resolve remaining auth issues in header, user panel and profile page (`app/composables/user/useUserPanel.ts`)
- `4fd62a9` 2026-02-28 — fix: replace useSupabaseUser() with session-based auth in layout and composable (`app/composables/useAuth.ts`)
- `30ed7d5` 2026-02-28 — fix: use role field for admin detection in useAuth, dealer middleware and login (`app/composables/useAuth.ts`)
- `6cc7611` 2026-02-28 — fix: resolve all TypeScript typecheck errors (0 errors) (`app/composables/usePushNotifications.ts`, `app/composables/useSubastasIndex.ts`, `app/composables/useUserProfile.ts`)
- `67f62d4` 2026-02-28 — fix: apply minor type corrections and import fixes across composables and pages (9 archivos)
- `4e92bc5` 2026-02-28 — fix: resolve minor audit findings + AdminSidebar refactor + type regen (15 archivos)
- `38be35d` 2026-02-26 — fix: address all audit findings — vertical filters, security tests, hardcoded URL, types, transparency (4 archivos)
- `0531646` 2026-02-10 — fix: add sitemap dynamic sources, fix 404 error page, and add filter error handling (`app/composables/useFilters.ts`)

### refactor (14)

- `3a75b3e` 2026-02-28 — refactor: replace header dropdown with role-aware UserPanel (`app/composables/user/useUserPanel.ts`)
- `93eb6bb` 2026-02-28 — refactor: move dealer portal from /vendedor/[slug] to /[slug] (flat root URL) (`app/composables/useVendedorDetail.ts`)
- `0168de3` 2026-02-28 — refactor: extract UserPanel + AdvertiseModal into composables + subcomponents (`app/composables/modals/useAdvertiseModal.ts`, `app/composables/user/useUserPanel.ts`)
- `b0916e0` 2026-02-28 — refactor: extract composables + components from 9 pages (audit #7 iter 13) (`app/composables/useDealerStats.ts`, `app/composables/useVehicleTypeSelector.ts`)
- `39abb49` 2026-02-28 — refactor: extract composables + components from 6 pages (audit #7 iter 12) (`app/composables/usePerfilAlertas.ts`, `app/composables/usePerfilComparador.ts`, `app/composables/usePerfilReservas.ts`)
- `c1c9cc5` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 11) (`app/composables/useSubastasIndex.ts`)
- `c52ad05` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 9) (`app/composables/usePrecios.ts`)
- `fa54d90` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 7) (`app/composables/usePerfilMensajes.ts`)
- `241c32b` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 6) (`app/composables/useVendedorDetail.ts`)
- `ef010d3` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 5) (`app/composables/useAuctionDetail.ts`, `app/composables/useDatos.ts`)
- `acd13ed` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 4) (`app/composables/useVehicleDetail.ts`)
- `21a1e85` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 3) (`app/composables/useValoracion.ts`)
- `bf6ae32` 2026-02-25 — refactor: add shared useListingUtils composable and enhance slugify (`app/composables/shared/useListingUtils.ts`)
- `e58f238` 2026-02-02 — refactor: alinear UI del catálogo con diseño legacy (`app/composables/useCatalogState.ts`, `app/composables/useFilters.ts`, `app/composables/useVehicles.ts`)

### chore (1)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (13 archivos)

### other (1)

- `e59309c` 2026-02-28 — ux: improve form accessibility, touch interactions and fix i18n JSON (4 archivos)

## dashboard-components (23 commits)

### feature (5)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (103 archivos)
- `16f0c60` 2026-03-02 — feat: accessibility system, UX forms, autocomplete, hover→@media (100 archivos)
- `c83512b` 2026-02-28 — feat(dealer-portal): expand self-service portal form with all missing fields (`app/components/dashboard/portal/DealerImageUploader.vue`)
- `e3744dc` 2026-02-23 — feat: session 35 — integral audit with security hardening, RLS, SEO, CSP, code quality, and file splitting (6 archivos)
- `74ed59c` 2026-02-21 — feat: audit fixes — 16 missing items from sessions 13-26 (`app/components/dashboard/WhatsAppPublishWidget.vue`)

### fix (3)

- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (16 archivos)
- `9ffff67` 2026-03-02 — fix(sonar): SonarQube audit Fase 1-4 mechanical fixes (`app/components/dashboard/WhatsAppPublishWidget.vue`)
- `6cc7611` 2026-02-28 — fix: resolve all TypeScript typecheck errors (0 errors) (`app/components/dashboard/index/DashboardRecentLeads.vue`, `app/components/dashboard/index/DashboardTopVehicles.vue`)

### refactor (13)

- `b0916e0` 2026-02-28 — refactor: extract composables + components from 9 pages (audit #7 iter 13) (5 archivos)
- `39abb49` 2026-02-28 — refactor: extract composables + components from 6 pages (audit #7 iter 12) (`app/components/dashboard/herramientas/merchandising/MerchHeroBanner.vue`, `app/components/dashboard/herramientas/merchandising/MerchInterestForm.vue`, `app/components/dashboard/herramientas/merchandising/MerchProductGrid.vue`)
- `c1c9cc5` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 11) (19 archivos)
- `2151098` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 10) (7 archivos)
- `c52ad05` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 9) (4 archivos)
- `957c29f` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 8) (`app/components/dashboard/herramientas/visitas/VisitasBookingsTable.vue`, `app/components/dashboard/herramientas/visitas/VisitasHeader.vue`, `app/components/dashboard/herramientas/visitas/VisitasSlotConfig.vue`)
- `fa54d90` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 7) (10 archivos)
- `241c32b` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 6) (9 archivos)
- `ef010d3` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 5) (16 archivos)
- `acd13ed` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 4) (8 archivos)
- `21a1e85` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 3) (4 archivos)
- `f007521` 2026-02-26 — refactor: extract composables + components from 6 admin pages (audit #7 iter 2) (5 archivos)
- `978ecb2` 2026-02-24 — refactor: split factura.vue (1,926 → ~490 lines) into composable and sub-components (`app/components/dashboard/invoice/InvoiceHistory.vue`, `app/components/dashboard/invoice/InvoiceLinesEditor.vue`)

### chore (1)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (59 archivos)

### other (1)

- `e59309c` 2026-02-28 — ux: improve form accessibility, touch interactions and fix i18n JSON (6 archivos)

## dashboard-composables (24 commits)

### feature (3)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (14 archivos)
- `f58a3fd` 2026-03-01 — feat(branding): background removal + logo typography config for dealer & admin (`app/composables/dashboard/useDealerPortal.ts`)
- `c83512b` 2026-02-28 — feat(dealer-portal): expand self-service portal form with all missing fields (`app/composables/dashboard/useDealerPortal.ts`)

### fix (6)

- `0bf9582` 2026-03-03 — fix(sonar): Fase 3 S3776 — reducir cognitive complexity en 18 ficheros (18→0 issues) (`app/composables/dashboard/useDashboardExportar.ts`)
- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (13 archivos)
- `9ffff67` 2026-03-02 — fix(sonar): SonarQube audit Fase 1-4 mechanical fixes (4 archivos)
- `6cc7611` 2026-02-28 — fix: resolve all TypeScript typecheck errors (0 errors) (`app/composables/dashboard/useDashboardFactura.ts`, `app/composables/dashboard/useInvoice.ts`)
- `67f62d4` 2026-02-28 — fix: apply minor type corrections and import fixes across composables and pages (8 archivos)
- `4e92bc5` 2026-02-28 — fix: resolve minor audit findings + AdminSidebar refactor + type regen (`app/composables/dashboard/useDashboardImportar.ts`)

### refactor (14)

- `7dde04a` 2026-02-28 — refactor: split useInvoice.ts into 3 utility modules (Auditoría #7 Iter. 15) (`app/composables/dashboard/useInvoice.ts`)
- `b0916e0` 2026-02-28 — refactor: extract composables + components from 9 pages (audit #7 iter 13) (`app/composables/dashboard/useDashboardNuevoVehiculo.ts`, `app/composables/dashboard/useDashboardWidget.ts`)
- `39abb49` 2026-02-28 — refactor: extract composables + components from 6 pages (audit #7 iter 12) (`app/composables/dashboard/useDashboardMerchandising.ts`)
- `c1c9cc5` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 11) (`app/composables/dashboard/useDashboardExportarAnuncio.ts`, `app/composables/dashboard/useDashboardFactura.ts`, `app/composables/dashboard/useDashboardImportar.ts`)
- `2151098` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 10) (`app/composables/dashboard/useDashboardIndex.ts`)
- `c52ad05` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 9) (`app/composables/dashboard/useDashboardTransaccion.ts`)
- `957c29f` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 8) (`app/composables/dashboard/useDashboardVisitas.ts`)
- `fa54d90` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 7) (`app/composables/dashboard/useDashboardExportar.ts`, `app/composables/dashboard/useDashboardPresupuesto.ts`)
- `241c32b` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 6) (`app/composables/dashboard/useDashboardContrato.ts`, `app/composables/dashboard/useDashboardVehiculoDetail.ts`)
- `ef010d3` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 5) (`app/composables/dashboard/useDashboardCrm.ts`, `app/composables/dashboard/useDashboardHistorico.ts`, `app/composables/dashboard/useDashboardPipeline.ts`)
- `acd13ed` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 4) (`app/composables/dashboard/useDashboardCalculadora.ts`, `app/composables/dashboard/useDashboardMantenimientos.ts`)
- `21a1e85` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 3) (`app/composables/dashboard/useDashboardObservatorio.ts`)
- `f007521` 2026-02-26 — refactor: extract composables + components from 6 admin pages (audit #7 iter 2) (`app/composables/dashboard/useDashboardAlquileres.ts`)
- `978ecb2` 2026-02-24 — refactor: split factura.vue (1,926 → ~490 lines) into composable and sub-components (`app/composables/dashboard/useInvoice.ts`)

### chore (1)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (7 archivos)

## dashboard-pages (39 commits)

### feature (17)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (29 archivos)
- `16f0c60` 2026-03-02 — feat: accessibility system, UX forms, autocomplete, hover→@media (28 archivos)
- `f58a3fd` 2026-03-01 — feat(branding): background removal + logo typography config for dealer & admin (`app/pages/dashboard/portal.vue`)
- `c83512b` 2026-02-28 — feat(dealer-portal): expand self-service portal form with all missing fields (`app/pages/dashboard/portal.vue`)
- `3a36df4` 2026-02-25 — feat: add API key self-service, widget HTML endpoint, and dealer API page (`app/pages/dashboard/herramientas/api.vue`)
- `b7c16da` 2026-02-25 — feat: pending session 36-37 changes — types, server fixes, ads, vehicle integration (`app/pages/dashboard/vehiculos/nuevo.vue`)
- `4c7ecab` 2026-02-25 — feat: buyer experience — conversations, reservations, comparator, price history, seller profiles (`app/pages/dashboard/herramientas/visitas.vue`)
- `5118c44` 2026-02-24 — feat: session 36 gaps — i18n localizedName(), Chart.js lazy-load, docs update (`app/pages/dashboard/herramientas/calculadora.vue`, `app/pages/dashboard/herramientas/widget.vue`)
- `8f133c7` 2026-02-24 — feat: session 36 — cross-audit: indexes, cache, auth, i18n, docs, consolidation (`app/pages/dashboard/herramientas/merchandising.vue`)
- `e3744dc` 2026-02-23 — feat: session 35 — integral audit with security hardening, RLS, SEO, CSP, code quality, and file splitting (`app/pages/dashboard/herramientas/contrato.vue`, `app/pages/dashboard/herramientas/exportar.vue`)
- `987441c` 2026-02-23 — feat: session 34 — security audit remediation + accumulated missing files (`app/pages/dashboard/herramientas/contrato.vue`)
- `92f24b6` 2026-02-23 — feat: session 31 — dealer advanced tools, export modal, configurable table, embed widget (11 archivos)
- `e6a83e9` 2026-02-23 — feat: session 29 — favorites notifications, saved searches, alert editing (`app/pages/dashboard/vehiculos/[id].vue`)
- `90d8c3f` 2026-02-22 — feat: session 28 — dealer CRM, onboarding, health score, pipeline, observatory (6 archivos)
- `74ed59c` 2026-02-21 — feat: audit fixes — 16 missing items from sessions 13-26 (4 archivos)
- `412df3d` 2026-02-21 — feat: session 26 — invoicing with Quaderno, Stripe webhook auto-invoicing, and security page (`app/pages/dashboard/facturas.vue`)
- `df735f8` 2026-02-21 — feat: session 24 — user zone with auth, profiles, and dealer dashboard (10 archivos)

### fix (6)

- `9ffff67` 2026-03-02 — fix(sonar): SonarQube audit Fase 1-4 mechanical fixes (`app/pages/dashboard/suscripcion.vue`)
- `6cc7611` 2026-02-28 — fix: resolve all TypeScript typecheck errors (0 errors) (`app/pages/dashboard/estadisticas.vue`, `app/pages/dashboard/leads/index.vue`, `app/pages/dashboard/vehiculos/index.vue`)
- `67f62d4` 2026-02-28 — fix: apply minor type corrections and import fixes across composables and pages (6 archivos)
- `d21d142` 2026-02-24 — fix: migrate remaining i18n display refs to JSONB localizedName() (`app/pages/dashboard/herramientas/exportar.vue`)
- `cd6d9b5` 2026-02-23 — fix: add auth guards to push/send and whatsapp/process endpoints (`app/pages/dashboard/herramientas/contrato.vue`, `app/pages/dashboard/herramientas/merchandising.vue`)
- `5546175` 2026-02-23 — fix: audit remediation — sessions 3, 8, 19 + cross-session cleanup (`app/pages/dashboard/herramientas/contrato.vue`)

### refactor (16)

- `5879e40` 2026-02-28 — refactor: extract shared ImageUploader component, upgrade admin branding logos (`app/pages/dashboard/portal.vue`)
- `b0916e0` 2026-02-28 — refactor: extract composables + components from 9 pages (audit #7 iter 13) (4 archivos)
- `39abb49` 2026-02-28 — refactor: extract composables + components from 6 pages (audit #7 iter 12) (`app/pages/dashboard/herramientas/merchandising.vue`)
- `c1c9cc5` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 11) (`app/pages/dashboard/herramientas/exportar-anuncio.vue`, `app/pages/dashboard/herramientas/factura.vue`, `app/pages/dashboard/vehiculos/importar.vue`)
- `2151098` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 10) (`app/pages/dashboard/index.vue`)
- `c52ad05` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 9) (`app/pages/dashboard/vehiculos/[id]/transaccion.vue`)
- `957c29f` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 8) (`app/pages/dashboard/herramientas/visitas.vue`)
- `fa54d90` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 7) (`app/pages/dashboard/herramientas/exportar.vue`, `app/pages/dashboard/herramientas/presupuesto.vue`)
- `241c32b` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 6) (`app/pages/dashboard/herramientas/contrato.vue`, `app/pages/dashboard/vehiculos/[id].vue`)
- `ef010d3` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 5) (`app/pages/dashboard/crm.vue`, `app/pages/dashboard/historico.vue`, `app/pages/dashboard/pipeline.vue`)
- `acd13ed` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 4) (`app/pages/dashboard/herramientas/calculadora.vue`, `app/pages/dashboard/herramientas/mantenimientos.vue`)
- `21a1e85` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 3) (`app/pages/dashboard/observatorio.vue`)
- `f007521` 2026-02-26 — refactor: extract composables + components from 6 admin pages (audit #7 iter 2) (`app/pages/dashboard/herramientas/alquileres.vue`)
- `0030149` 2026-02-25 — refactor(s44-E): simplify merchandising to interest form only (`app/pages/dashboard/herramientas/merchandising.vue`)
- `5a72e47` 2026-02-25 — refactor: replace local formatPrice with shared imports in dashboard and public pages (5 archivos)
- `978ecb2` 2026-02-24 — refactor: split factura.vue (1,926 → ~490 lines) into composable and sub-components (`app/pages/dashboard/herramientas/factura.vue`)

## docs (92 commits)

### feature (28)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (151 archivos)
- `dd0e4f4` 2026-03-03 — feat(claude): Policy Engine completo + ENTORNO-DESARROLLO.md (`docs/tracciona-docs/referencia/ENTORNO-DESARROLLO.md`)
- `009e85b` 2026-02-28 — feat: implement dual-URL vehicle detail with dealer branding (launch phase) (`docs/PROYECTO-CONTEXTO.md`)
- `a613249` 2026-02-28 — feat: complete session work — PROYECTO-CONTEXTO, CLAUDE2, admin detail refactor (`docs/PROYECTO-CONTEXTO.md`)
- `e20e7e4` 2026-02-26 — feat(s55): restore test script, Bitbucket mirror, third-party dependencies (`docs/tracciona-docs/referencia/THIRD-PARTY-DEPENDENCIES.md`)
- `bf9f5d9` 2026-02-26 — feat(s53): database integrity check, ERD diagram, data retention, slow queries (`docs/tracciona-docs/referencia/DATA-RETENTION.md`, `docs/tracciona-docs/referencia/ERD.md`)
- `c9ac024` 2026-02-25 — feat(s45-B): upgrade to daily multi-tier backups with 3-layer retention (`docs/tracciona-docs/referencia/DISASTER-RECOVERY.md`)
- `74dd053` 2026-02-25 — feat(s44-F): postpone valuation API with 503 until sufficient data (`docs/ESTADO-REAL-PRODUCTO.md`)
- `b7c16da` 2026-02-25 — feat: pending session 36-37 changes — types, server fixes, ads, vehicle integration (`docs/tracciona-docs/INSTRUCCIONES-MAESTRAS.md`, `docs/tracciona-docs/contexto-global.md`)
- `5118c44` 2026-02-24 — feat: session 36 gaps — i18n localizedName(), Chart.js lazy-load, docs update (`docs/ESTADO-REAL-PRODUCTO.md`)
- `8f133c7` 2026-02-24 — feat: session 36 — cross-audit: indexes, cache, auth, i18n, docs, consolidation (7 archivos)
- `e3744dc` 2026-02-23 — feat: session 35 — integral audit with security hardening, RLS, SEO, CSP, code quality, and file splitting (`docs/tracciona-docs/INSTRUCCIONES-MAESTRAS.md`, `docs/tracciona-docs/contexto-global.md`)
- `246ed02` 2026-02-23 — feat: session 30 — resilience plan, backup scripts, and GitHub Actions cron (`docs/tracciona-docs/migracion/04-plan-contingencia.md`)
- `be26119` 2026-02-01 — feat: add keep-alive to preserve catalog scroll and filters (`docs/progreso.md`)
- `286ca2e` 2026-02-01 — feat: add AnnounceBanner and integrate full catalog in index page (`docs/progreso.md`)
- `98b03b1` 2026-02-01 — feat: add vehicle detail page with gallery, info, and contact options (`docs/progreso.md`)
- `f83a488` 2026-02-01 — feat: add VehicleCard and VehicleGrid with responsive layout (`docs/progreso.md`)
- `477080c` 2026-02-01 — feat: add FilterBar with 6 dynamic filter types and mobile bottom sheet (`docs/progreso.md`)
- `9be1fea` 2026-02-01 — feat: add SubcategoryBar with dynamic chips from database (`docs/progreso.md`)
- `18359d8` 2026-02-01 — feat: add CategoryBar component with horizontal scroll on mobile (`docs/progreso.md`)
- `d8fd418` 2026-02-01 — feat: add useCatalogState composable for catalog state management (`docs/progreso.md`)
- `85be15a` 2026-02-01 — feat: add useFilters composable with dynamic filter logic (`docs/progreso.md`)
- `eb98cde` 2026-02-01 — feat: add useVehicles composable with filters and infinite pagination (`docs/progreso.md`)
- `2e75a51` 2026-02-01 — feat: add seed data for subcategories, filters, and config (`docs/progreso.md`)
- `a691b53` 2026-02-01 — feat: add RLS policies for catalog tables (`docs/progreso.md`)
- `6a93b82` 2026-02-01 — feat: add catalog tables migration (vehicles, images, subcategories, filters, config) (`docs/progreso.md`)
- `a50c37a` 2026-02-01 — feat: add ESLint + Prettier + Husky pre-commit (Step 1, task 1.10) (`docs/progreso.md`)
- `504aa79` 2026-02-01 — feat: scaffold Nuxt 4 + Auth + layout mobile-first (Step 1, tasks 1.1-1.8) (`docs/progreso.md`)

### fix (14)

- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (`docs/tracciona-docs/AUDITORIA-SONARQUBE-100.md`)
- `9ffff67` 2026-03-02 — fix(sonar): SonarQube audit Fase 1-4 mechanical fixes (`docs/tracciona-docs/BACKLOG-EJECUTABLE.md`)
- `b3be653` 2026-02-28 — fix: regenerate types/supabase.ts and update documentation (`docs/ESTADO-REAL-PRODUCTO.md`)
- `4e92bc5` 2026-02-28 — fix: resolve minor audit findings + AdminSidebar refactor + type regen (31 archivos)
- `08c689e` 2026-02-26 — fix: resolve all critical audit findings — TS errors, i18n, types regeneration (12 archivos)
- `38be35d` 2026-02-26 — fix: address all audit findings — vertical filters, security tests, hardcoded URL, types, transparency (`docs/auditorias/externa/VERIFICACION-AUDITORIA-EXTERNA.md`)
- `85b3666` 2026-02-25 — fix: redact PII from server logs + update post-session checklist (`docs/auditorias/CHECKLIST-POST-SESIONES.md`)
- `ad5b4da` 2026-02-01 — fix(security): eliminar ipapi.co, usar navigator.language (`docs/legacy/index.html`, `docs/legacy/main.js`, `docs/progreso.md`)
- `43003bc` 2026-02-01 — fix(security): unificar todas las URLs a un único Apps Script (6 archivos)
- `4127aa5` 2026-02-01 — fix(security): migrar sesiones de localStorage a sessionStorage (6 archivos)
- `c6520e3` 2026-02-01 — fix(security): escapar todos los innerHTML con datos dinámicos (9 archivos)
- `c64d901` 2026-02-01 — fix(security): migrar llamadas Sheets API a proxy Apps Script (5 archivos)
- `4ce7a00` 2026-02-01 — fix(security): añadir Keys.txt a .gitignore (`docs/progreso.md`)
- `97f428f` 2026-02-01 — fix(security): reemplazar API_KEY antigua por nueva restringida a dominio (5 archivos)

### refactor (1)

- `93eb6bb` 2026-02-28 — refactor: move dealer portal from /vendedor/[slug] to /[slug] (flat root URL) (`docs/ESTADO-REAL-PRODUCTO.md`)

### docs (48)

- `a3479f3` 2026-03-04 — docs: brokeraje architecture + security reference docs (8 archivos)
- `e213277` 2026-03-03 — docs(operativo): INCIDENT-RESPONSE.md — guía paso a paso para no-técnicos (`docs/tracciona-docs/operativo/INCIDENT-RESPONSE.md`)
- `fc5cf16` 2026-03-03 — docs(entorno): actualizar ENTORNO-DESARROLLO.md con inventario completo (`docs/tracciona-docs/referencia/ENTORNO-DESARROLLO.md`)
- `86a2cd5` 2026-03-02 — docs: backlog ejecutable (116 items) + optimizacion flujo documentacion (5 archivos)
- `9cbc7b6` 2026-03-02 — docs: comprehensive corporate & operations manual (2,214 lines) (`docs/MANUAL-CORPORATIVO-Y-OPERATIVO.md`, `docs/MANUAL-CORPORATIVO-Y-OPERATIVO.pdf`)
- `6838f9c` 2026-03-02 — docs: fix cross-references between all documentation files (`docs/PROYECTO-CONTEXTO.md`)
- `f69d2ef` 2026-03-02 — docs: audit consolidation + reference docs update (19 archivos)
- `855e807` 2026-03-02 — docs: consolidate documentation — BACKLOG, strategy split, legacy cleanup (52 archivos)
- `129d3ec` 2026-03-01 — docs: define credits & subscriptions pricing strategy (`docs/PROYECTO-CONTEXTO.md`)
- `bd04475` 2026-02-28 — docs: clarify scraping vs scheduled tasks cron distinction (`docs/PROYECTO-CONTEXTO.md`)
- `d8ff364` 2026-02-28 — docs: documentation governance — rationalize, deduplicate, define SSOT (33 archivos)
- `6943a1b` 2026-02-26 — docs: update progreso.md — all 64 sessions completed (`docs/progreso.md`)
- `aa35b05` 2026-02-26 — docs: update progreso.md for Session 63 completion (`docs/progreso.md`)
- `869eaa6` 2026-02-26 — docs: update progreso.md for Session 62 (`docs/progreso.md`)
- `49c918d` 2026-02-26 — docs: update progreso.md for Session 61 (`docs/progreso.md`)
- `07c47d7` 2026-02-26 — docs: update progreso.md for Session 60 (`docs/progreso.md`)
- `7aa00d6` 2026-02-26 — docs: update progreso.md for Session 59 (`docs/progreso.md`)
- `3e5459b` 2026-02-26 — docs: add public API reference documentation (Session 59D) (`docs/tracciona-docs/referencia/API-PUBLIC.md`)
- `7d669a3` 2026-02-26 — docs: mark session 58 as completed (`docs/progreso.md`)
- `b514f2c` 2026-02-26 — docs: mark sessions 56-57 as completed (`docs/progreso.md`)
- `194140e` 2026-02-26 — docs: mark session 56 as completed (`docs/progreso.md`)
- `0fc8ddc` 2026-02-26 — docs: mark sessions 51-55 as completed — all 55 sessions done (`docs/progreso.md`)
- `50340e5` 2026-02-26 — docs(s54): CHANGELOG.md and CRON-JOBS.md documentation (`docs/tracciona-docs/referencia/CRON-JOBS.md`)
- `0fd5688` 2026-02-25 — docs: mark sessions 49-50 as completed in progress tracker (`docs/progreso.md`)
- `dc4ae6c` 2026-02-25 — docs(s50-C,D): add Cloudflare WAF config guide and secrets rotation procedures (`docs/tracciona-docs/referencia/CLOUDFLARE-WAF-CONFIG.md`, `docs/tracciona-docs/referencia/SECRETS-ROTATION.md`)
- `6b83b5c` 2026-02-25 — docs: mark session 48 as completed in progress tracker (`docs/progreso.md`)
- `61a131a` 2026-02-25 — docs: mark session 47 as completed in progress tracker (`docs/progreso.md`)
- `2b621ce` 2026-02-25 — docs: add sessions 47-55 to INSTRUCCIONES-MAESTRAS and remove legacy docs (19 archivos)
- `b7c58e3` 2026-02-25 — docs: mark session 46 as completed in progress tracker (`docs/progreso.md`)
- `194aac9` 2026-02-25 — docs(s46-C): add security testing strategy and DAST reference (`docs/tracciona-docs/referencia/SECURITY-TESTING.md`)
- `f2a4d5f` 2026-02-25 — docs: mark session 45 as completed in progress tracker (`docs/progreso.md`)
- `0083eab` 2026-02-25 — docs: add strategic planning documents (FLUJOS-OPERATIVOS, context, audit plan) (5 archivos)
- `cb90a32` 2026-02-25 — docs(s44-C,H): document strategic decisions and Supabase dependencies (4 archivos)
- `60d48bd` 2026-02-25 — docs: mark admin/dashboard consolidation as resolved in checklist (10/11 done) (`docs/auditorias/CHECKLIST-POST-SESIONES.md`)
- `3a135e0` 2026-02-25 — docs: update CLAUDE.md, contexto-global, README for session 43 completion (`docs/tracciona-docs/contexto-global.md`)
- `6db7b73` 2026-02-25 — docs: add postponed modules section to ESTADO-REAL-PRODUCTO (`docs/ESTADO-REAL-PRODUCTO.md`)
- `025cbd0` 2026-02-25 — docs: rewrite progreso.md with sessions 1-43 status (`docs/progreso.md`)
- `ead7d5f` 2026-02-25 — docs: regenerate ESTADO-REAL-PRODUCTO with services and E2E sections (`docs/ESTADO-REAL-PRODUCTO.md`)
- `40d762c` 2026-02-25 — docs: add historic banners to legacy docs and update estado-real (6 archivos)
- `68bbc05` 2026-02-25 — docs: document decisions on partial modules and service layer status (`docs/ESTADO-REAL-PRODUCTO.md`)
- `3d9f85e` 2026-02-25 — docs: add architecture diagram, thresholds table, and rate limit/WAF documentation (`docs/tracciona-docs/referencia/ARQUITECTURA-ESCALABILIDAD.md`)
- `31df211` 2026-02-25 — docs: add Session 43 — update product state and progress documentation (`docs/tracciona-docs/INSTRUCCIONES-MAESTRAS.md`)
- `312b058` 2026-02-25 — docs: organize loose docs, delete .codex artifacts (7.6MB) (`docs/auditorias/BRIEFING-PROYECTO.md`, `docs/auditorias/refactoring-productos-index.md`)
- `31ab839` 2026-02-25 — docs: organize audit docs + create post-session checklist (6 archivos)
- `d3459dc` 2026-02-25 — docs: session 38 — single source of truth, onboarding, conventions (6 archivos)
- `7008047` 2026-02-23 — docs: add project documentation, migration guides, and annexes (45 archivos)
- `d48c97c` 2026-02-01 — docs: mark Step 1 as complete, begin Step 2 (`docs/progreso.md`)
- `7416f3e` 2026-02-01 — docs: configuración inicial (26 archivos)

### chore (1)

- `a0d7810` 2026-03-04 — chore: update STATUS.md + add security and DB tests (`docs/legacy/MANUAL-CORPORATIVO-Y-OPERATIVO.pdf`)

## i18n (49 commits)

### feature (36)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (`i18n/en.json`, `i18n/es.json`)
- `3d25e3b` 2026-03-02 — feat(credits): Stripe checkout for credit packs + i18n updates (`i18n/en.json`, `i18n/es.json`)
- `4ee6c88` 2026-03-01 — feat(sold-modal): add sale price field and record sold_at timestamp (`i18n/en.json`, `i18n/es.json`)
- `009e85b` 2026-02-28 — feat: implement dual-URL vehicle detail with dealer branding (launch phase) (`i18n/en.json`, `i18n/es.json`)
- `965af9f` 2026-02-28 — feat: complete DealerPortal — OG/JSON-LD, working hours, contact form, contact_config flags, badge from subscription (`i18n/en.json`, `i18n/es.json`)
- `ce1d63f` 2026-02-28 — feat: extract ~115 admin panel strings to i18n (P2-2 resolved) (`i18n/en.json`, `i18n/es.json`)
- `fdcf027` 2026-02-26 — feat: integrate Zod + VeeValidate for form validation (`i18n/en.json`, `i18n/es.json`)
- `0fc25fd` 2026-02-26 — feat: add RelatedVehicles and CategoryLinks components for internal linking (`i18n/en.json`, `i18n/es.json`)
- `f465583` 2026-02-26 — feat: add ShareButtons component with WhatsApp/LinkedIn/Email/Copy (Session 63E) (`i18n/en.json`, `i18n/es.json`)
- `fb184ec` 2026-02-26 — feat: enhance error page with context-aware 404, 500/503, search (Session 62A-B) (`i18n/en.json`, `i18n/es.json`)
- `4882e89` 2026-02-26 — feat(s57-A): add demo mode for dealers with AI vehicle analysis (`i18n/en.json`, `i18n/es.json`)
- `6141fe9` 2026-02-25 — feat: add lead tracking composable with ficha view and contact click events (`i18n/en.json`, `i18n/es.json`)
- `3a36df4` 2026-02-25 — feat: add API key self-service, widget HTML endpoint, and dealer API page (`i18n/en.json`, `i18n/es.json`)
- `50a3018` 2026-02-25 — feat: add revenue metrics by channel, MRR/ARR, and lead value tracking (`i18n/en.json`, `i18n/es.json`)
- `d7c5e77` 2026-02-25 — feat(stripe): add 14-day trial period for first-time subscribers (`i18n/en.json`, `i18n/es.json`)
- `f510a47` 2026-02-25 — feat(a11y): add aria-invalid, real-time validation to auth forms (`i18n/en.json`, `i18n/es.json`)
- `3a24b4a` 2026-02-25 — feat: session 37 — security CI, automated tests, safe error messages (`i18n/en.json`, `i18n/es.json`)
- `4ef5988` 2026-02-24 — feat: overhaul filter UX — nav-only SubcategoryBar, collapsible advanced panel, active chips, simplified location (`i18n/en.json`, `i18n/es.json`)
- `e3744dc` 2026-02-23 — feat: session 35 — integral audit with security hardening, RLS, SEO, CSP, code quality, and file splitting (`i18n/en.json`, `i18n/es.json`)
- `170d511` 2026-02-23 — feat: sessions 32-33 — data commercialization + infra monitoring (`i18n/en.json`, `i18n/es.json`)
- `92f24b6` 2026-02-23 — feat: session 31 — dealer advanced tools, export modal, configurable table, embed widget (`i18n/en.json`, `i18n/es.json`)
- `e6a83e9` 2026-02-23 — feat: session 29 — favorites notifications, saved searches, alert editing (`i18n/en.json`, `i18n/es.json`)
- `90d8c3f` 2026-02-22 — feat: session 28 — dealer CRM, onboarding, health score, pipeline, observatory (`i18n/en.json`, `i18n/es.json`)
- `9bfddab` 2026-02-22 — feat: session 27 — admin metrics dashboard with charts, KPIs, and CSV export (`i18n/en.json`, `i18n/es.json`)
- `412df3d` 2026-02-21 — feat: session 26 — invoicing with Quaderno, Stripe webhook auto-invoicing, and security page (`i18n/en.json`, `i18n/es.json`)
- `d0186d7` 2026-02-21 — feat: session 25 — EU/UK regulatory compliance (DSA, AI Act, UK OSA, RGPD) (`i18n/en.json`, `i18n/es.json`)
- `df735f8` 2026-02-21 — feat: session 24 — user zone with auth, profiles, and dealer dashboard (`i18n/en.json`, `i18n/es.json`)
- `ab9a7e6` 2026-02-10 — feat: implement comprehensive SEO with sitemap, structured data, and keyword targeting (`i18n/en.json`, `i18n/es.json`)
- `80f4606` 2026-02-09 — feat: add admin users/subscriptions management, dynamic ads/demands, and fix 11 runtime bugs (`i18n/en.json`, `i18n/es.json`)
- `6d77460` 2026-02-09 — feat: redesign vehicle detail page with actions and characteristics (`i18n/en.json`, `i18n/es.json`)
- `f52bf27` 2026-02-08 — feat: add subcategory management, location auto-detection, singular names, and admin table improvements (`i18n/en.json`, `i18n/es.json`)
- `b018d8a` 2026-02-08 — feat: complete steps 2-5 with full catalog, user interaction, news, and admin panel (`i18n/en.json`, `i18n/es.json`)
- `8334af0` 2026-02-06 — feat: implement hierarchical subcategory/type filter display (`i18n/en.json`, `i18n/es.json`)
- `98b03b1` 2026-02-01 — feat: add vehicle detail page with gallery, info, and contact options (`i18n/en.json`, `i18n/es.json`)
- `18359d8` 2026-02-01 — feat: add CategoryBar component with horizontal scroll on mobile (`i18n/en.json`, `i18n/es.json`)
- `504aa79` 2026-02-01 — feat: scaffold Nuxt 4 + Auth + layout mobile-first (Step 1, tasks 1.1-1.8) (`i18n/en.json`, `i18n/es.json`)

### fix (5)

- `08c689e` 2026-02-26 — fix: resolve all critical audit findings — TS errors, i18n, types regeneration (`i18n/en.json`, `i18n/es.json`)
- `38be35d` 2026-02-26 — fix: address all audit findings — vertical filters, security tests, hardcoded URL, types, transparency (`i18n/en.json`, `i18n/es.json`)
- `7f3ebc6` 2026-02-26 — fix: replace hardcoded text with i18n keys and fix lint errors in scripts (`i18n/en.json`, `i18n/es.json`)
- `5546175` 2026-02-23 — fix: audit remediation — sessions 3, 8, 19 + cross-session cleanup (`i18n/en.json`, `i18n/es.json`)
- `b1c8b0c` 2026-02-01 — fix: remove "Todos" button from CategoryBar (`i18n/en.json`, `i18n/es.json`)

### refactor (5)

- `0030149` 2026-02-25 — refactor(s44-E): simplify merchandising to interest form only (`i18n/en.json`, `i18n/es.json`)
- `bf6ae32` 2026-02-25 — refactor: add shared useListingUtils composable and enhance slugify (`i18n/en.json`, `i18n/es.json`)
- `fda2340` 2026-02-02 — refactor: alinear subcategorybar, filterbar y ajustes mobile con legacy (`i18n/en.json`, `i18n/es.json`)
- `ae34eb7` 2026-02-02 — refactor: alinear header, banner y categorybar con diseño legacy (`i18n/en.json`, `i18n/es.json`)
- `e58f238` 2026-02-02 — refactor: alinear UI del catálogo con diseño legacy (`i18n/en.json`, `i18n/es.json`)

### other (3)

- `e59309c` 2026-02-28 — ux: improve form accessibility, touch interactions and fix i18n JSON (`i18n/en.json`, `i18n/es.json`)
- `3832422` 2026-02-26 — a11y: add skip-to-content link and main landmark id (Session 62E) (`i18n/en.json`, `i18n/es.json`)
- `5553dc1` 2026-02-26 — a11y: semantic HTML audit — article tag, h1, sr-only utility (Session 62D) (`i18n/en.json`, `i18n/es.json`)

## layout (21 commits)

### feature (12)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (`app/components/layout/AppFooter.vue`, `app/components/layout/AppHeader.vue`, `app/components/layout/CookieBanner.vue`)
- `16f0c60` 2026-03-02 — feat: accessibility system, UX forms, autocomplete, hover→@media (`app/components/layout/AppFooter.vue`, `app/components/layout/AppHeader.vue`)
- `8ab9361` 2026-02-25 — feat(a11y): add focus-visible styles and aria attributes to forms (`app/components/layout/CookieBanner.vue`)
- `987441c` 2026-02-23 — feat: session 34 — security audit remediation + accumulated missing files (`app/components/layout/CookieBanner.vue`)
- `412df3d` 2026-02-21 — feat: session 26 — invoicing with Quaderno, Stripe webhook auto-invoicing, and security page (`app/components/layout/AppHeader.vue`)
- `d0186d7` 2026-02-21 — feat: session 25 — EU/UK regulatory compliance (DSA, AI Act, UK OSA, RGPD) (`app/components/layout/AppFooter.vue`)
- `df735f8` 2026-02-21 — feat: session 24 — user zone with auth, profiles, and dealer dashboard (`app/components/layout/AppHeader.vue`)
- `80f4606` 2026-02-09 — feat: add admin users/subscriptions management, dynamic ads/demands, and fix 11 runtime bugs (`app/components/layout/AppHeader.vue`)
- `2245eae` 2026-02-09 — feat: update layout with flag-based language switcher and banner improvements (`app/components/layout/AppFooter.vue`, `app/components/layout/AppHeader.vue`)
- `b018d8a` 2026-02-08 — feat: complete steps 2-5 with full catalog, user interaction, news, and admin panel (`app/components/layout/AppFooter.vue`, `app/components/layout/AppHeader.vue`)
- `b366506` 2026-02-01 — feat: add auth-aware header with user menu and fix secure cookie for dev (`app/components/layout/AppHeader.vue`)
- `504aa79` 2026-02-01 — feat: scaffold Nuxt 4 + Auth + layout mobile-first (Step 1, tasks 1.1-1.8) (`app/components/layout/AppFooter.vue`, `app/components/layout/AppHeader.vue`)

### fix (3)

- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (`app/components/layout/AppHeader.vue`, `app/components/layout/CookieBanner.vue`)
- `8cbf53f` 2026-02-28 — fix: resolve remaining auth issues in header, user panel and profile page (`app/components/layout/AppHeader.vue`)
- `4fd62a9` 2026-02-28 — fix: replace useSupabaseUser() with session-based auth in layout and composable (`app/components/layout/AppHeader.vue`)

### refactor (4)

- `3a75b3e` 2026-02-28 — refactor: replace header dropdown with role-aware UserPanel (`app/components/layout/AppHeader.vue`)
- `4491164` 2026-02-07 — refactor: reorganize header and catalog controls layout (`app/components/layout/AppHeader.vue`)
- `ae34eb7` 2026-02-02 — refactor: alinear header, banner y categorybar con diseño legacy (`app/components/layout/AppHeader.vue`)
- `e58f238` 2026-02-02 — refactor: alinear UI del catálogo con diseño legacy (`app/components/layout/AppHeader.vue`)

### chore (1)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (`app/components/layout/AppFooter.vue`, `app/components/layout/AppHeader.vue`, `app/components/layout/CookieBanner.vue`)

### other (1)

- `e59309c` 2026-02-28 — ux: improve form accessibility, touch interactions and fix i18n JSON (`app/components/layout/AppHeader.vue`)

## migrations (36 commits)

### feature (25)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (14 archivos)
- `498129b` 2026-02-26 — feat(s56-B): add feature flags table, server utility, and client composable (`supabase/migrations/00064_feature_flags.sql`)
- `01a1cc8` 2026-02-25 — feat(s47-A): add vertical column to vehicles and advertisements (`supabase/migrations/00062_vertical_isolation.sql`, `supabase/migrations/00063_vehicles_vertical_column.sql`)
- `6a69bba` 2026-02-25 — feat(s45-C): add vertical isolation with indexes, middleware and tests (`supabase/migrations/00062_vertical_isolation.sql`)
- `2ebc725` 2026-02-25 — feat: implement flujos operativos enhancements (pre-session 44) (`supabase/migrations/00061_founding_expiry_and_enhancements.sql`)
- `cb5df36` 2026-02-25 — feat: add migrations 00059 (ads enhancement) and 00060 (buyer experience) (`supabase/migrations/00059_ads_enhancement.sql`, `supabase/migrations/00060_buyer_experience.sql`)
- `8f133c7` 2026-02-24 — feat: session 36 — cross-audit: indexes, cache, auth, i18n, docs, consolidation (`supabase/migrations/00058_missing_indexes.sql`)
- `e3744dc` 2026-02-23 — feat: session 35 — integral audit with security hardening, RLS, SEO, CSP, code quality, and file splitting (`supabase/migrations/00055_rls_hardening.sql`, `supabase/migrations/00056_performance_indexes.sql`)
- `fc610c0` 2026-02-23 — feat: session 34b — hardening, robustness, and tech debt reduction (`supabase/migrations/00054_whatsapp_retry_columns.sql`)
- `987441c` 2026-02-23 — feat: session 34 — security audit remediation + accumulated missing files (14 archivos)
- `170d511` 2026-02-23 — feat: sessions 32-33 — data commercialization + infra monitoring (`supabase/migrations/00052_data_commercialization_session32.sql`, `supabase/migrations/00053_infra_monitoring_session33.sql`)
- `92f24b6` 2026-02-23 — feat: session 31 — dealer advanced tools, export modal, configurable table, embed widget (`supabase/migrations/00051_dealer_tools_session31.sql`)
- `90d8c3f` 2026-02-22 — feat: session 28 — dealer CRM, onboarding, health score, pipeline, observatory (`supabase/migrations/00050_dealer_crm_session28.sql`)
- `74ed59c` 2026-02-21 — feat: audit fixes — 16 missing items from sessions 13-26 (`supabase/migrations/00047_seed_email_templates.sql`, `supabase/migrations/00048_push_subscriptions.sql`, `supabase/migrations/00049_tank_iberica_migration.sql`)
- `d0186d7` 2026-02-21 — feat: session 25 — EU/UK regulatory compliance (DSA, AI Act, UK OSA, RGPD) (`supabase/migrations/00046_reports_table.sql`)
- `ab45066` 2026-02-21 — feat: sessions 22-23 — PWA + performance and multi-vertical clone system (`supabase/migrations/00045_horecaria_vertical.sql`)
- `80f4606` 2026-02-09 — feat: add admin users/subscriptions management, dynamic ads/demands, and fix 11 runtime bugs (`supabase/migrations/00028_contacts_table.sql`, `supabase/migrations/00029_ads_demands_dynamic_types.sql`, `supabase/migrations/00030_subscriptions_users_admin.sql`)
- `13db001` 2026-02-09 — feat: add seed migrations for subcategories, types, and filters (`supabase/migrations/00026_seed_subcategories_and_filters.sql`, `supabase/migrations/00027_seed_types_and_filters.sql`)
- `cab5656` 2026-02-08 — feat: add dedicated meta description field and word counter to news editor (`supabase/migrations/00025_add_news_description_fields.sql`)
- `45ed447` 2026-02-08 — feat: add news editor/creator with real-time SEO scoring (`supabase/migrations/00024_fix_news_rls_admin_select.sql`)
- `f52bf27` 2026-02-08 — feat: add subcategory management, location auto-detection, singular names, and admin table improvements (`supabase/migrations/00022_add_location_en_column.sql`, `supabase/migrations/00023_add_singular_name_columns.sql`)
- `b018d8a` 2026-02-08 — feat: complete steps 2-5 with full catalog, user interaction, news, and admin panel (17 archivos)
- `a691b53` 2026-02-01 — feat: add RLS policies for catalog tables (`supabase/migrations/00003_catalog_rls.sql`)
- `6a93b82` 2026-02-01 — feat: add catalog tables migration (vehicles, images, subcategories, filters, config) (`supabase/migrations/00002_catalog_tables.sql`)
- `504aa79` 2026-02-01 — feat: scaffold Nuxt 4 + Auth + layout mobile-first (Step 1, tasks 1.1-1.8) (`supabase/migrations/00001_create_users.sql`)

### fix (10)

- `2b68923` 2026-02-28 — fix: replace all admin RLS policies from auth.users to is_admin() (`supabase/migrations/00071_fix_all_admin_policies_auth_users.sql`)
- `f458e03` 2026-02-28 — fix: resolve permission denied for table users errors (`supabase/migrations/00070_fix_is_admin_search_path.sql`)
- `91e5dab` 2026-02-28 — fix: add missing columns to infra_metrics (recorded_at and related) (`supabase/migrations/00069_fix_infra_metrics_missing_columns.sql`)
- `6aefa9e` 2026-02-28 — fix: add missing columns to infra_alerts (acknowledged_at and related) (`supabase/migrations/00068_fix_infra_alerts_missing_columns.sql`)
- `891edf1` 2026-02-28 — fix: correct RLS policies for dealer tables (P0-1 + P0-2) (`supabase/migrations/00067_fix_rls_dealer_policies.sql`)
- `abf4c48` 2026-02-28 — fix: correct RLS policies in migration 00065 (`supabase/migrations/00065_missing_tables.sql`)
- `9973e41` 2026-02-26 — fix: resolve Supabase migration conflict and apply migrations 00059-00064 (`supabase/migrations/00061_founding_expiry_and_enhancements.sql`)
- `e5b8021` 2026-02-24 — fix: audit action items — RLS standardization, Product JSON-LD, rate limiter, cleanup (`supabase/migrations/00057_rls_standardization.sql`)
- `c9f41e3` 2026-02-23 — fix: handle missing tables/columns in migrations 00055 and 00056 (`supabase/migrations/00055_rls_hardening.sql`, `supabase/migrations/00056_performance_indexes.sql`)
- `c21cb9d` 2026-02-01 — fix: resolve RLS infinite recursion and component name prefixes (`supabase/migrations/00004_fix_rls_recursion.sql`)

### perf (1)

- `d5c865a` 2026-02-28 — perf: add missing database indexes for vehicle and auction queries (`supabase/migrations/00066_missing_indexes.sql`)

## modals (19 commits)

### feature (13)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (11 archivos)
- `16f0c60` 2026-03-02 — feat: accessibility system, UX forms, autocomplete, hover→@media (10 archivos)
- `4ee6c88` 2026-03-01 — feat(sold-modal): add sale price field and record sold_at timestamp (`app/components/modals/SoldModal.vue`)
- `8f133c7` 2026-02-24 — feat: session 36 — cross-audit: indexes, cache, auth, i18n, docs, consolidation (`app/components/modals/AdvertiseModal.vue`, `app/components/modals/DemandModal.vue`)
- `e3744dc` 2026-02-23 — feat: session 35 — integral audit with security hardening, RLS, SEO, CSP, code quality, and file splitting (`app/components/modals/AdvertiseModal.vue`, `app/components/modals/DemandModal.vue`)
- `987441c` 2026-02-23 — feat: session 34 — security audit remediation + accumulated missing files (`app/components/modals/DemandModal.vue`)
- `74ed59c` 2026-02-21 — feat: audit fixes — 16 missing items from sessions 13-26 (`app/components/modals/SoldModal.vue`)
- `412df3d` 2026-02-21 — feat: session 26 — invoicing with Quaderno, Stripe webhook auto-invoicing, and security page (`app/components/modals/AdvertiseModal.vue`)
- `d0186d7` 2026-02-21 — feat: session 25 — EU/UK regulatory compliance (DSA, AI Act, UK OSA, RGPD) (`app/components/modals/ReportModal.vue`)
- `b1feebb` 2026-02-10 — feat: add advanced SEO improvements — breadcrumbs, ItemList schema, CLS fix, favicons, and alt text (`app/components/modals/AdvertiseModal.vue`)
- `80f4606` 2026-02-09 — feat: add admin users/subscriptions management, dynamic ads/demands, and fix 11 runtime bugs (`app/components/modals/AdvertiseModal.vue`, `app/components/modals/DemandModal.vue`)
- `b018d8a` 2026-02-08 — feat: complete steps 2-5 with full catalog, user interaction, news, and admin panel (5 archivos)
- `504aa79` 2026-02-01 — feat: scaffold Nuxt 4 + Auth + layout mobile-first (Step 1, tasks 1.1-1.8) (`app/components/modals/AuthModal.vue`)

### fix (1)

- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (`app/components/modals/AuthModal.vue`)

### refactor (3)

- `0168de3` 2026-02-28 — refactor: extract UserPanel + AdvertiseModal into composables + subcomponents (5 archivos)
- `b0916e0` 2026-02-28 — refactor: extract composables + components from 9 pages (audit #7 iter 13) (`app/components/modals/DemandModal.vue`)
- `5a72e47` 2026-02-25 — refactor: replace local formatPrice with shared imports in dashboard and public pages (`app/components/modals/DemandModal.vue`)

### chore (1)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (10 archivos)

### other (1)

- `e59309c` 2026-02-28 — ux: improve form accessibility, touch interactions and fix i18n JSON (6 archivos)

## other-components (23 commits)

### feature (12)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (34 archivos)
- `3d25e3b` 2026-03-02 — feat(credits): Stripe checkout for credit packs + i18n updates (`app/components/precios/PreciosCreditSection.vue`)
- `16f0c60` 2026-03-02 — feat: accessibility system, UX forms, autocomplete, hover→@media (12 archivos)
- `965af9f` 2026-02-28 — feat: complete DealerPortal — OG/JSON-LD, working hours, contact form, contact_config flags, badge from subscription (`app/components/DealerPortal.vue`)
- `2e89a83` 2026-02-28 — feat: implement dealer public catalog in DealerPortal (`app/components/DealerPortal.vue`)
- `b7c16da` 2026-02-25 — feat: pending session 36-37 changes — types, server fixes, ads, vehicle integration (`app/components/ads/AdSenseSlot.vue`, `app/components/ads/AdSlot.vue`, `app/components/user/UserPanel.vue`)
- `97b8321` 2026-02-25 — feat: vehicle upload onboarding wizard (`app/components/onboarding/VehicleUploadWizard.vue`)
- `4c7ecab` 2026-02-25 — feat: buyer experience — conversations, reservations, comparator, price history, seller profiles (`app/components/conversation/ConversationPanel.vue`)
- `e3744dc` 2026-02-23 — feat: session 35 — integral audit with security hardening, RLS, SEO, CSP, code quality, and file splitting (`app/components/user/UserPanel.vue`)
- `987441c` 2026-02-23 — feat: session 34 — security audit remediation + accumulated missing files (7 archivos)
- `80f4606` 2026-02-09 — feat: add admin users/subscriptions management, dynamic ads/demands, and fix 11 runtime bugs (`app/components/user/UserPanel.vue`)
- `b018d8a` 2026-02-08 — feat: complete steps 2-5 with full catalog, user interaction, news, and admin panel (`app/components/user/UserPanel.vue`)

### fix (2)

- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (11 archivos)
- `9ffff67` 2026-03-02 — fix(sonar): SonarQube audit Fase 1-4 mechanical fixes (`app/components/DealerPortal.vue`, `app/components/vendedor/VendedorVehiclesGrid.vue`)

### refactor (7)

- `3a75b3e` 2026-02-28 — refactor: replace header dropdown with role-aware UserPanel (`app/components/user/UserPanel.vue`)
- `0168de3` 2026-02-28 — refactor: extract UserPanel + AdvertiseModal into composables + subcomponents (6 archivos)
- `b0916e0` 2026-02-28 — refactor: extract composables + components from 9 pages (audit #7 iter 13) (`app/components/ads/AdSenseSlot.vue`, `app/components/ads/AdSlot.vue`, `app/components/onboarding/VehicleUploadWizard.vue`)
- `c52ad05` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 9) (5 archivos)
- `241c32b` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 6) (5 archivos)
- `ef010d3` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 5) (6 archivos)
- `21a1e85` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 3) (4 archivos)

### chore (1)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (28 archivos)

### other (1)

- `e59309c` 2026-02-28 — ux: improve form accessibility, touch interactions and fix i18n JSON (`app/components/vendedor/VendedorReviewForm.vue`)

## pages (57 commits)

### feature (34)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (26 archivos)
- `16f0c60` 2026-03-02 — feat: accessibility system, UX forms, autocomplete, hover→@media (15 archivos)
- `4ee6c88` 2026-03-01 — feat(sold-modal): add sale price field and record sold_at timestamp (`app/pages/vehiculo/[slug].vue`)
- `009e85b` 2026-02-28 — feat: implement dual-URL vehicle detail with dealer branding (launch phase) (`app/pages/[dealer]/[vehicle].vue`)
- `965af9f` 2026-02-28 — feat: complete DealerPortal — OG/JSON-LD, working hours, contact form, contact_config flags, badge from subscription (`app/pages/[...slug].vue`)
- `0fc25fd` 2026-02-26 — feat: add RelatedVehicles and CategoryLinks components for internal linking (`app/pages/vehiculo/[slug].vue`)
- `f465583` 2026-02-26 — feat: add ShareButtons component with WhatsApp/LinkedIn/Email/Copy (Session 63E) (`app/pages/vehiculo/[slug].vue`)
- `69d5d01` 2026-02-26 — feat(s57-B): add widget generator page and list layout to widget endpoint (`app/pages/widget.vue`)
- `4882e89` 2026-02-26 — feat(s57-A): add demo mode for dealers with AI vehicle analysis (`app/pages/demo.vue`)
- `2ebc725` 2026-02-25 — feat: implement flujos operativos enhancements (pre-session 44) (`app/pages/vehiculo/[slug].vue`, `app/pages/vendedor/[slug].vue`)
- `6141fe9` 2026-02-25 — feat: add lead tracking composable with ficha view and contact click events (`app/pages/vehiculo/[slug].vue`)
- `d7c5e77` 2026-02-25 — feat(stripe): add 14-day trial period for first-time subscribers (`app/pages/precios.vue`)
- `73cdcc8` 2026-02-25 — feat(pwa): add offline fallback page and configure navigateFallback (`app/pages/offline.vue`)
- `b7c16da` 2026-02-25 — feat: pending session 36-37 changes — types, server fixes, ads, vehicle integration (`app/pages/vehiculo/[slug].vue`)
- `4c7ecab` 2026-02-25 — feat: buyer experience — conversations, reservations, comparator, price history, seller profiles (`app/pages/vendedor/[slug].vue`)
- `3a24b4a` 2026-02-25 — feat: session 37 — security CI, automated tests, safe error messages (`app/pages/seguridad/politica-divulgacion.vue`)
- `5118c44` 2026-02-24 — feat: session 36 gaps — i18n localizedName(), Chart.js lazy-load, docs update (`app/pages/datos.vue`)
- `4ef5988` 2026-02-24 — feat: overhaul filter UX — nav-only SubcategoryBar, collapsible advanced panel, active chips, simplified location (`app/pages/index.vue`)
- `e3744dc` 2026-02-23 — feat: session 35 — integral audit with security hardening, RLS, SEO, CSP, code quality, and file splitting (`app/pages/subastas/[id].vue`, `app/pages/subastas/index.vue`, `app/pages/vehiculo/[slug].vue`)
- `987441c` 2026-02-23 — feat: session 34 — security audit remediation + accumulated missing files (10 archivos)
- `170d511` 2026-02-23 — feat: sessions 32-33 — data commercialization + infra monitoring (`app/pages/datos.vue`, `app/pages/valoracion.vue`)
- `d0186d7` 2026-02-21 — feat: session 25 — EU/UK regulatory compliance (DSA, AI Act, UK OSA, RGPD) (4 archivos)
- `b1feebb` 2026-02-10 — feat: add advanced SEO improvements — breadcrumbs, ItemList schema, CLS fix, favicons, and alt text (`app/pages/index.vue`, `app/pages/noticias/[slug].vue`, `app/pages/vehiculo/[slug].vue`)
- `ab9a7e6` 2026-02-10 — feat: implement comprehensive SEO with sitemap, structured data, and keyword targeting (6 archivos)
- `80f4606` 2026-02-09 — feat: add admin users/subscriptions management, dynamic ads/demands, and fix 11 runtime bugs (`app/pages/noticias/[slug].vue`, `app/pages/vehiculo/[slug].vue`)
- `6d77460` 2026-02-09 — feat: redesign vehicle detail page with actions and characteristics (`app/pages/vehiculo/[slug].vue`)
- `cab5656` 2026-02-08 — feat: add dedicated meta description field and word counter to news editor (`app/pages/noticias/[slug].vue`)
- `f52bf27` 2026-02-08 — feat: add subcategory management, location auto-detection, singular names, and admin table improvements (`app/pages/vehiculo/[slug].vue`)
- `b018d8a` 2026-02-08 — feat: complete steps 2-5 with full catalog, user interaction, news, and admin panel (6 archivos)
- `8334af0` 2026-02-06 — feat: implement hierarchical subcategory/type filter display (`app/pages/index.vue`)
- `be26119` 2026-02-01 — feat: add keep-alive to preserve catalog scroll and filters (`app/pages/index.vue`)
- `286ca2e` 2026-02-01 — feat: add AnnounceBanner and integrate full catalog in index page (`app/pages/index.vue`)
- `98b03b1` 2026-02-01 — feat: add vehicle detail page with gallery, info, and contact options (`app/pages/vehiculo/[slug].vue`)
- `504aa79` 2026-02-01 — feat: scaffold Nuxt 4 + Auth + layout mobile-first (Step 1, tasks 1.1-1.8) (`app/pages/confirm.vue`, `app/pages/index.vue`)

### fix (8)

- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (4 archivos)
- `9ffff67` 2026-03-02 — fix(sonar): SonarQube audit Fase 1-4 mechanical fixes (`app/pages/[...slug].vue`, `app/pages/noticias/[slug].vue`, `app/pages/servicios-postventa.vue`)
- `6cc7611` 2026-02-28 — fix: resolve all TypeScript typecheck errors (0 errors) (4 archivos)
- `38be35d` 2026-02-26 — fix: address all audit findings — vertical filters, security tests, hardcoded URL, types, transparency (`app/pages/transparencia.vue`)
- `7f3ebc6` 2026-02-26 — fix: replace hardcoded text with i18n keys and fix lint errors in scripts (`app/pages/datos.vue`, `app/pages/guia/index.vue`, `app/pages/noticias/index.vue`)
- `e5b8021` 2026-02-24 — fix: audit action items — RLS standardization, Product JSON-LD, rate limiter, cleanup (`app/pages/vehiculo/[slug].vue`)
- `5546175` 2026-02-23 — fix: audit remediation — sessions 3, 8, 19 + cross-session cleanup (4 archivos)
- `c21cb9d` 2026-02-01 — fix: resolve RLS infinite recursion and component name prefixes (`app/pages/index.vue`, `app/pages/vehiculo/[slug].vue`)

### refactor (11)

- `93eb6bb` 2026-02-28 — refactor: move dealer portal from /vendedor/[slug] to /[slug] (flat root URL) (`app/pages/[slug].vue`)
- `c1c9cc5` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 11) (`app/pages/subastas/index.vue`)
- `c52ad05` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 9) (`app/pages/precios.vue`)
- `241c32b` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 6) (`app/pages/vendedor/[slug].vue`)
- `ef010d3` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 5) (`app/pages/datos.vue`, `app/pages/subastas/[id].vue`)
- `acd13ed` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 4) (`app/pages/vehiculo/[slug].vue`)
- `21a1e85` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 3) (`app/pages/valoracion.vue`)
- `5a72e47` 2026-02-25 — refactor: replace local formatPrice with shared imports in dashboard and public pages (`app/pages/subastas/[id].vue`, `app/pages/vehiculo/[slug].vue`)
- `4491164` 2026-02-07 — refactor: reorganize header and catalog controls layout (`app/pages/index.vue`)
- `ae34eb7` 2026-02-02 — refactor: alinear header, banner y categorybar con diseño legacy (`app/pages/index.vue`)
- `e58f238` 2026-02-02 — refactor: alinear UI del catálogo con diseño legacy (`app/pages/index.vue`, `app/pages/vehiculo/[slug].vue`)

### other (4)

- `e59309c` 2026-02-28 — ux: improve form accessibility, touch interactions and fix i18n JSON (`app/pages/[dealer]/[vehicle].vue`, `app/pages/vehiculo/[slug].vue`)
- `5553dc1` 2026-02-26 — a11y: semantic HTML audit — article tag, h1, sr-only utility (Session 62D) (`app/pages/index.vue`, `app/pages/vehiculo/[slug].vue`)
- `de09581` 2026-02-26 — seo: add BreadcrumbNav + BreadcrumbList JSON-LD to vendedor page (Session 61G) (`app/pages/vendedor/[slug].vue`)
- `6f8a5c3` 2026-02-26 — seo: enhance robots.txt, OG tags, hreflang, and canonical links (Session 61A-F) (`app/pages/vehiculo/[slug].vue`, `app/pages/vendedor/[slug].vue`)

## perfil-components (8 commits)

### feature (2)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (14 archivos)
- `16f0c60` 2026-03-02 — feat: accessibility system, UX forms, autocomplete, hover→@media (4 archivos)

### fix (1)

- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (6 archivos)

### refactor (3)

- `b0916e0` 2026-02-28 — refactor: extract composables + components from 9 pages (audit #7 iter 13) (`app/components/perfil/NotificationCategoryCard.vue`)
- `39abb49` 2026-02-28 — refactor: extract composables + components from 6 pages (audit #7 iter 12) (5 archivos)
- `fa54d90` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 7) (7 archivos)

### chore (1)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (10 archivos)

### other (1)

- `e59309c` 2026-02-28 — ux: improve form accessibility, touch interactions and fix i18n JSON (`app/components/perfil/mensajes/ConversationListPanel.vue`)

## perfil-pages (14 commits)

### feature (6)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (12 archivos)
- `16f0c60` 2026-03-02 — feat: accessibility system, UX forms, autocomplete, hover→@media (4 archivos)
- `4c7ecab` 2026-02-25 — feat: buyer experience — conversations, reservations, comparator, price history, seller profiles (`app/pages/perfil/comparador.vue`, `app/pages/perfil/mensajes.vue`, `app/pages/perfil/reservas.vue`)
- `e6a83e9` 2026-02-23 — feat: session 29 — favorites notifications, saved searches, alert editing (`app/pages/perfil/alertas.vue`)
- `412df3d` 2026-02-21 — feat: session 26 — invoicing with Quaderno, Stripe webhook auto-invoicing, and security page (`app/pages/perfil/seguridad.vue`)
- `df735f8` 2026-02-21 — feat: session 24 — user zone with auth, profiles, and dealer dashboard (8 archivos)

### fix (3)

- `3631204` 2026-02-28 — fix: align useAuth fetchProfile query with actual DB columns (`app/pages/perfil/datos.vue`)
- `8cbf53f` 2026-02-28 — fix: resolve remaining auth issues in header, user panel and profile page (`app/pages/perfil/index.vue`)
- `6cc7611` 2026-02-28 — fix: resolve all TypeScript typecheck errors (0 errors) (`app/pages/perfil/datos.vue`)

### refactor (3)

- `b0916e0` 2026-02-28 — refactor: extract composables + components from 9 pages (audit #7 iter 13) (`app/pages/perfil/notificaciones.vue`)
- `39abb49` 2026-02-28 — refactor: extract composables + components from 6 pages (audit #7 iter 12) (`app/pages/perfil/alertas.vue`, `app/pages/perfil/comparador.vue`, `app/pages/perfil/reservas.vue`)
- `fa54d90` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 7) (`app/pages/perfil/mensajes.vue`)

### chore (1)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (`app/pages/perfil/seguridad.vue`)

### other (1)

- `e59309c` 2026-02-28 — ux: improve form accessibility, touch interactions and fix i18n JSON (`app/pages/perfil/datos.vue`)

## plugins (13 commits)

### feature (9)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (4 archivos)
- `dcc138e` 2026-03-02 — feat(catalog): geo-fallback, promo cards, similar searches, empty state (`app/plugins/locale-by-country.client.ts`)
- `89f1edc` 2026-02-26 — feat(s52): Lighthouse CI workflow, Web Vitals GA4, accessibility tests (`app/plugins/web-vitals.client.ts`)
- `754ddf3` 2026-02-25 — feat: add Core Web Vitals measurement plugin and Lighthouse CI thresholds (`app/plugins/web-vitals.client.ts`)
- `6bc4c68` 2026-02-25 — feat: advanced ads — prebid, viewability tracking, audience segmentation (`app/plugins/prebid.client.ts`)
- `e3744dc` 2026-02-23 — feat: session 35 — integral audit with security hardening, RLS, SEO, CSP, code quality, and file splitting (`app/plugins/gtag.client.ts`)
- `987441c` 2026-02-23 — feat: session 34 — security audit remediation + accumulated missing files (`app/plugins/supabase-auth.client.ts`)
- `74ed59c` 2026-02-21 — feat: audit fixes — 16 missing items from sessions 13-26 (`app/plugins/error-handler.ts`, `app/plugins/gtag.client.ts`)
- `b018d8a` 2026-02-08 — feat: complete steps 2-5 with full catalog, user interaction, news, and admin panel (`app/plugins/supabase-auth.client.ts`)

### fix (3)

- `9ffff67` 2026-03-02 — fix(sonar): SonarQube audit Fase 1-4 mechanical fixes (`app/plugins/gtag.client.ts`, `app/plugins/prebid.client.ts`)
- `ded45ef` 2026-02-28 — fix: correct AdminSidebarNavGroup names and proactive auth profile loading (`app/plugins/supabase-auth.client.ts`)
- `6cc7611` 2026-02-28 — fix: resolve all TypeScript typecheck errors (0 errors) (`app/plugins/web-vitals.client.ts`)

### chore (1)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (`app/plugins/gtag.client.ts`, `app/plugins/prebid.client.ts`)

## root-config (126 commits)

### feature (40)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (728 archivos)
- `dd0e4f4` 2026-03-03 — feat(claude): Policy Engine completo + ENTORNO-DESARROLLO.md (5 archivos)
- `3d25e3b` 2026-03-02 — feat(credits): Stripe checkout for credit packs + i18n updates (`nuxt.config.ts`, `package-lock.json`, `package.json`)
- `16f0c60` 2026-03-02 — feat: accessibility system, UX forms, autocomplete, hover→@media (`app/layouts/admin.vue`, `app/layouts/default.vue`)
- `009e85b` 2026-02-28 — feat: implement dual-URL vehicle detail with dealer branding (launch phase) (`STATUS.md`)
- `a613249` 2026-02-28 — feat: complete session work — PROYECTO-CONTEXTO, CLAUDE2, admin detail refactor (`CLAUDE.md`, `CLAUDE2.md`)
- `fdcf027` 2026-02-26 — feat: integrate Zod + VeeValidate for form validation (`package-lock.json`, `package.json`)
- `dd876b1` 2026-02-26 — feat: add SonarQube local setup and Supabase DB inspection script (6 archivos)
- `a6b5a20` 2026-02-26 — feat: add useStructuredData composable + global Organization schema (Session 63A-D) (`app/app.vue`)
- `fb184ec` 2026-02-26 — feat: enhance error page with context-aware 404, 500/503, search (Session 62A-B) (`app/error.vue`)
- `89f1edc` 2026-02-26 — feat(s52): Lighthouse CI workflow, Web Vitals GA4, accessibility tests (`.lighthouserc.js`)
- `ee5f9ed` 2026-02-25 — feat(s46-A): add DAST security scanning with ZAP, Nuclei and SSL checks (`.zap/rules.tsv`)
- `57074ed` 2026-02-25 — feat(s44-B): add immutable cache for images and version URL helper (`nuxt.config.ts`)
- `73cdcc8` 2026-02-25 — feat(pwa): add offline fallback page and configure navigateFallback (`nuxt.config.ts`)
- `754ddf3` 2026-02-25 — feat: add Core Web Vitals measurement plugin and Lighthouse CI thresholds (`.lighthouserc.js`, `package-lock.json`, `package.json`)
- `bfcb4a0` 2026-02-25 — feat: add manualChunks for code-splitting heavy vendor libraries (`nuxt.config.ts`)
- `b7c16da` 2026-02-25 — feat: pending session 36-37 changes — types, server fixes, ads, vehicle integration (`CLAUDE.md`, `nuxt.config.ts`, `types/supabase.ts`)
- `3a24b4a` 2026-02-25 — feat: session 37 — security CI, automated tests, safe error messages (`.env.example`, `public/.well-known/security.txt`)
- `8f133c7` 2026-02-24 — feat: session 36 — cross-audit: indexes, cache, auth, i18n, docs, consolidation (`nuxt.config.ts`)
- `e3744dc` 2026-02-23 — feat: session 35 — integral audit with security hardening, RLS, SEO, CSP, code quality, and file splitting (4 archivos)
- `987441c` 2026-02-23 — feat: session 34 — security audit remediation + accumulated missing files (11 archivos)
- `170d511` 2026-02-23 — feat: sessions 32-33 — data commercialization + infra monitoring (`nuxt.config.ts`)
- `9bfddab` 2026-02-22 — feat: session 27 — admin metrics dashboard with charts, KPIs, and CSV export (`package-lock.json`, `package.json`)
- `74ed59c` 2026-02-21 — feat: audit fixes — 16 missing items from sessions 13-26 (5 archivos)
- `412df3d` 2026-02-21 — feat: session 26 — invoicing with Quaderno, Stripe webhook auto-invoicing, and security page (`nuxt.config.ts`)
- `df735f8` 2026-02-21 — feat: session 24 — user zone with auth, profiles, and dealer dashboard (`app/middleware/auth.ts`, `app/middleware/dealer.ts`, `nuxt.config.ts`)
- `ab45066` 2026-02-21 — feat: sessions 22-23 — PWA + performance and multi-vertical clone system (5 archivos)
- `b1feebb` 2026-02-10 — feat: add advanced SEO improvements — breadcrumbs, ItemList schema, CLS fix, favicons, and alt text (7 archivos)
- `377d513` 2026-02-10 — feat: add og-default.png placeholder for Open Graph sharing (`public/og-default.png`)
- `ab9a7e6` 2026-02-10 — feat: implement comprehensive SEO with sitemap, structured data, and keyword targeting (6 archivos)
- `80f4606` 2026-02-09 — feat: add admin users/subscriptions management, dynamic ads/demands, and fix 11 runtime bugs (`app/layouts/admin.vue`, `nuxt.config.ts`)
- `2245eae` 2026-02-09 — feat: update layout with flag-based language switcher and banner improvements (`app/layouts/default.vue`)
- `250d6af` 2026-02-08 — feat: add image file upload to news editor via Cloudinary (`nuxt.config.ts`)
- `f52bf27` 2026-02-08 — feat: add subcategory management, location auto-detection, singular names, and admin table improvements (`nuxt.config.ts`)
- `b018d8a` 2026-02-08 — feat: complete steps 2-5 with full catalog, user interaction, news, and admin panel (10 archivos)
- `be26119` 2026-02-01 — feat: add keep-alive to preserve catalog scroll and filters (`app/app.vue`)
- `2e75a51` 2026-02-01 — feat: add seed data for subcategories, filters, and config (5 archivos)
- `b366506` 2026-02-01 — feat: add auth-aware header with user menu and fix secure cookie for dev (`nuxt.config.ts`)
- `a50c37a` 2026-02-01 — feat: add ESLint + Prettier + Husky pre-commit (Step 1, task 1.10) (5 archivos)
- `504aa79` 2026-02-01 — feat: scaffold Nuxt 4 + Auth + layout mobile-first (Step 1, tasks 1.1-1.8) (9 archivos)

### fix (22)

- `ac722d7` 2026-03-03 — fix: npm audit fix minimatch 3.1.5 + audit-level=critical in security.yml (`package-lock.json`)
- `f1f45af` 2026-03-03 — fix(lockfile): regenerate package-lock.json — sync missing crossws@0.4.4 (`package-lock.json`)
- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (`app/layouts/admin.vue`)
- `b1bf1d3` 2026-03-03 — fix(claude): restaurar regex SECURITY_POLICY + prettierignore (`.prettierignore`)
- `9ffff67` 2026-03-02 — fix(sonar): SonarQube audit Fase 1-4 mechanical fixes (4 archivos)
- `c79cfd1` 2026-02-28 — fix: correct AdminSidebarNavGroup component names and proactive profile loading (`CLAUDE.md`)
- `4fd62a9` 2026-02-28 — fix: replace useSupabaseUser() with session-based auth in layout and composable (`app/layouts/admin.vue`)
- `467a241` 2026-02-28 — fix: use getSession() in all middlewares to fix auth on every navigation (6 archivos)
- `30ed7d5` 2026-02-28 — fix: use role field for admin detection in useAuth, dealer middleware and login (`app/middleware/dealer.ts`)
- `b3be653` 2026-02-28 — fix: regenerate types/supabase.ts and update documentation (`README.md`)
- `4e92bc5` 2026-02-28 — fix: resolve minor audit findings + AdminSidebar refactor + type regen (6 archivos)
- `380de2b` 2026-02-26 — fix: resolve important audit findings — refactor FilterBar, sanitize errors, add sizes, update README (`README.md`)
- `08c689e` 2026-02-26 — fix: resolve all critical audit findings — TS errors, i18n, types regeneration (`package-lock.json`)
- `9973e41` 2026-02-26 — fix: resolve Supabase migration conflict and apply migrations 00059-00064 (`types/supabase.ts`)
- `38be35d` 2026-02-26 — fix: address all audit findings — vertical filters, security tests, hardcoded URL, types, transparency (`CONTRIBUTING.md`, `nuxt.config.ts`)
- `6c54ab7` 2026-02-25 — fix: replace remaining tank-iberica references with tracciona in Cloudinary paths (`package-lock.json`)
- `e5b8021` 2026-02-24 — fix: audit action items — RLS standardization, Product JSON-LD, rate limiter, cleanup (`.gitignore`)
- `5546175` 2026-02-23 — fix: audit remediation — sessions 3, 8, 19 + cross-session cleanup (`.lighthouserc.js`)
- `0531646` 2026-02-10 — fix: add sitemap dynamic sources, fix 404 error page, and add filter error handling (`nuxt.config.ts`)
- `d72072c` 2026-02-01 — fix: remove @pinia/nuxt (incompatible with Nuxt 4.3), fix SUPABASE_KEY env name (`nuxt.config.ts`, `package-lock.json`, `package.json`)
- `f029899` 2026-02-01 — fix: regenerate package-lock.json for npm ci compatibility (`package-lock.json`)
- `4ce7a00` 2026-02-01 — fix(security): añadir Keys.txt a .gitignore (`.gitignore`)

### refactor (7)

- `93eb6bb` 2026-02-28 — refactor: move dealer portal from /vendedor/[slug] to /[slug] (flat root URL) (`app/error.vue`, `nuxt.config.ts`)
- `b46f249` 2026-02-25 — refactor(s47-C,D): cleanup obsolete files and remove hardcoded values (`.env.example`, `lighthouserc.js`, `nuxt.config.ts`)
- `c136704` 2026-02-25 — refactor(s45-D): centralize hardcoded AI models, URLs and project refs (`.env.example`, `nuxt.config.ts`)
- `4491164` 2026-02-07 — refactor: reorganize header and catalog controls layout (`app/layouts/default.vue`)
- `fda2340` 2026-02-02 — refactor: alinear subcategorybar, filterbar y ajustes mobile con legacy (`app/layouts/default.vue`)
- `ae34eb7` 2026-02-02 — refactor: alinear header, banner y categorybar con diseño legacy (`app/layouts/default.vue`)
- `e58f238` 2026-02-02 — refactor: alinear UI del catálogo con diseño legacy (`nuxt.config.ts`)

### test (1)

- `21fe5bd` 2026-02-25 — test(e2e): add 8 user journey E2E tests with Playwright (`playwright.config.ts`)

### docs (35)

- `a1cc6cc` 2026-03-03 — docs: add quarterly task reminder to CLAUDE.md (`CLAUDE.md`)
- `86a2cd5` 2026-03-02 — docs: backlog ejecutable (116 items) + optimizacion flujo documentacion (4 archivos)
- `6838f9c` 2026-03-02 — docs: fix cross-references between all documentation files (`CLAUDE.md`, `README.md`)
- `f69d2ef` 2026-03-02 — docs: audit consolidation + reference docs update (`STATUS.md`)
- `855e807` 2026-03-02 — docs: consolidate documentation — BACKLOG, strategy split, legacy cleanup (5 archivos)
- `9d2f41a` 2026-02-28 — docs: update STATUS.md — auth fixes + role-aware UserPanel session (`STATUS.md`)
- `0490d9e` 2026-02-28 — docs: update STATUS.md with session work — CLAUDE.md auditoría and 9 improvements (`STATUS.md`)
- `1680ada` 2026-02-28 — docs: add automatic model detection — session startup and new orders now auto-detect Opus vs other models (`CLAUDE.md`)
- `86089bd` 2026-02-28 — docs: add mandatory session startup — read CLAUDE.md, STATUS.md, PROYECTO-CONTEXTO.md in Opus (`CLAUDE.md`)
- `94717f9` 2026-02-28 — docs: restructure session management — auto Node cleanup, closing procedure, incomplete task resume (`CLAUDE.md`)
- `3518ff9` 2026-02-28 — docs: add 3 optional protocol safeguards (interruption handling, model change threshold, self-verification checklist) (`CLAUDE.md`)
- `549f0ae` 2026-02-28 — docs: reinforce protocol with 6 safeguards (Paso 0, skills classification, multi-task handling, verification, context exception, commit rule) (`CLAUDE.md`)
- `095f51d` 2026-02-28 — docs: close session — optimización documentación 03-mar (`STATUS.md`)
- `7fa238a` 2026-02-28 — docs: remove resolved pending item (CLAUDE2.md decision) (`STATUS.md`)
- `8582736` 2026-02-28 — docs: update STATUS.md changelog — CLAUDE.md improvements + compression (`STATUS.md`)
- `396f760` 2026-02-28 — docs: improve CLAUDE.md structure + remove CLAUDE2.md (`CLAUDE.md`, `CLAUDE2.md`)
- `5e521f2` 2026-02-28 — docs: add STATUS.md maintenance rules to prevent bloat (`CLAUDE.md`)
- `c519d24` 2026-02-28 — docs: compress STATUS.md from 294 to 110 lines for token efficiency (`STATUS.md`)
- `de5ad18` 2026-02-28 — docs: update STATUS.md — dealer portal route refactor session 01-mar (`STATUS.md`)
- `335a228` 2026-02-28 — docs: update STATUS.md — Auditoría #7 Iter. 15 complete (5 composables refactored) (`STATUS.md`)
- `4eed8fc` 2026-02-28 — docs: update STATUS.md — sesión 28-feb (3ª) dealer portal complete (`STATUS.md`)
- `dc588b1` 2026-02-28 — docs: update STATUS.md — P0-1 + P0-2 resueltos (`STATUS.md`)
- `98b1e3c` 2026-02-28 — docs: update STATUS.md — P2-2 resolved (admin i18n) (`STATUS.md`)
- `c596d91` 2026-02-28 — docs: update STATUS.md — P1-2, P1-3, P2-1, P2-3 resolved/verified (`STATUS.md`)
- `d357ba0` 2026-02-28 — docs: update STATUS.md — Auditoría #7 Iteración 14 completa (`STATUS.md`)
- `068c14c` 2026-02-28 — docs: update STATUS.md with session 28-feb summary (minor audit findings completed) (`STATUS.md`)
- `2c449f2` 2026-02-28 — docs: add model-switching rule for mixed-complexity subtasks (`CLAUDE.md`)
- `e041c83` 2026-02-28 — docs: add model selection protocol and session management to CLAUDE.md (`CLAUDE.md`, `STATUS.md`)
- `d8ff364` 2026-02-28 — docs: documentation governance — rationalize, deduplicate, define SSOT (4 archivos)
- `50340e5` 2026-02-26 — docs(s54): CHANGELOG.md and CRON-JOBS.md documentation (`CHANGELOG.md`)
- `cb90a32` 2026-02-25 — docs(s44-C,H): document strategic decisions and Supabase dependencies (`CLAUDE.md`)
- `3a135e0` 2026-02-25 — docs: update CLAUDE.md, contexto-global, README for session 43 completion (`CLAUDE.md`, `README-PROYECTO.md`)
- `31ab839` 2026-02-25 — docs: organize audit docs + create post-session checklist (`README-PROYECTO.md`)
- `d3459dc` 2026-02-25 — docs: session 38 — single source of truth, onboarding, conventions (`CONTRIBUTING.md`, `README-PROYECTO.md`, `package.json`)
- `7416f3e` 2026-02-01 — docs: configuración inicial (`CLAUDE.md`)

### chore (16)

- `a0d7810` 2026-03-04 — chore: update STATUS.md + add security and DB tests (`STATUS.md`)
- `9659370` 2026-03-04 — chore: add dependabot, gitleaks, knip, and endpoint drift tooling (`.gitleaks.toml`, `knip.json`)
- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (`.gitignore`)
- `4a8d741` 2026-03-04 — chore: CLOSING_SESSION — 04-mar (II) continuación completada (`STATUS.md`)
- `302a476` 2026-03-04 — chore: update STATUS.md — Fase 3 estado real (91 issues, INCOMPLETA) (`STATUS.md`)
- `29c06e6` 2026-03-04 — chore(sonarqube): Fase 3 & 5 refactoring — S3776 & S7924 (`STATUS.md`)
- `0a8a064` 2026-03-03 — chore: cierre sesión 15-mar continuación — seguridad e incidentes completados (`STATUS.md`)
- `e76a4ee` 2026-03-03 — chore: update STATUS.md — 15-mar continuation session (`STATUS.md`)
- `e4a3522` 2026-03-03 — chore: update STATUS.md — 15-mar session (Dependabot PRs closed, ANTHROPIC_API_KEY Q&A) (`STATUS.md`)
- `69da0c4` 2026-03-03 — chore(lockfile): sync package-lock.json — resolve listhen/crossws conflict (`package-lock.json`)
- `0e5a540` 2026-03-03 — chore: update STATUS.md — cierre sesión 14-mar (`STATUS.md`)
- `700ffe7` 2026-03-03 — chore(policy): auditoría final 42/42 + audit-final.mjs (`STATUS.md`)
- `5c59832` 2026-03-03 — chore: update STATUS.md with policy engine audit session (`STATUS.md`)
- `2fe3c02` 2026-02-25 — chore: clean temp files and update .gitignore (`.gitignore`)
- `b9ec762` 2026-02-01 — chore: añadir zip a gitignore y corregir formato (`.gitignore`)
- `5985852` 2026-02-01 — chore: añadir .env a gitignore (`.gitignore`)

### other (5)

- `e59309c` 2026-02-28 — ux: improve form accessibility, touch interactions and fix i18n JSON (`CLAUDE.md`, `STATUS.md`, `nuxt.config.ts`)
- `aa6e3d0` 2026-02-28 — status: update changelog — fix RLS 96 admin policies (`STATUS.md`)
- `7a33e40` 2026-02-28 — status: add infra_metrics collection script as pending task (`STATUS.md`)
- `3832422` 2026-02-26 — a11y: add skip-to-content link and main landmark id (Session 62E) (`app/layouts/default.vue`)
- `6f8a5c3` 2026-02-26 — seo: enhance robots.txt, OG tags, hreflang, and canonical links (Session 61A-F) (`public/robots.txt`)

## scripts (23 commits)

### feature (13)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (47 archivos)
- `704bea4` 2026-02-26 — feat: add SEO audit CI workflow and enhance seo-check with new validations (`scripts/seo-check.mjs`)
- `9fbb6ed` 2026-02-26 — feat: add SEO validation script + integrate in daily-audit CI (Session 63F) (`scripts/seo-check.mjs`)
- `6fe5a0e` 2026-02-26 — feat: add PWA verification script (Session 60B) (`scripts/verify-pwa.sh`)
- `1c4e550` 2026-02-26 — feat(s59-C): add npm license audit script integrated in daily-audit CI (`scripts/audit-licenses.mjs`)
- `0dc2956` 2026-02-26 — feat(s56-C): add multi-tenant verification script (`scripts/verify-multi-tenant.sh`)
- `e20e7e4` 2026-02-26 — feat(s55): restore test script, Bitbucket mirror, third-party dependencies (`scripts/test-restore.sh`)
- `bf9f5d9` 2026-02-26 — feat(s53): database integrity check, ERD diagram, data retention, slow queries (`scripts/db-integrity-check.mjs`)
- `d57f507` 2026-02-25 — feat(s45-A): add daily automated audit workflow with email alerts (`scripts/audit-report.mjs`, `scripts/send-audit-alert.mjs`)
- `c9ac024` 2026-02-25 — feat(s45-B): upgrade to daily multi-tier backups with 3-layer retention (`scripts/backup-multi-tier.sh`)
- `131ae85` 2026-02-25 — feat: add extensibility verification script (`scripts/verify-extensibility.sh`)
- `987441c` 2026-02-23 — feat: session 34 — security audit remediation + accumulated missing files (`scripts/scrape-competitors.ts`)
- `246ed02` 2026-02-23 — feat: session 30 — resilience plan, backup scripts, and GitHub Actions cron (`scripts/backup-restore.sh`, `scripts/backup-weekly.sh`)

### fix (3)

- `9ffff67` 2026-03-02 — fix(sonar): SonarQube audit Fase 1-4 mechanical fixes (`scripts/generate-rat.ts`)
- `4e92bc5` 2026-02-28 — fix: resolve minor audit findings + AdminSidebar refactor + type regen (`scripts/generate-rat.ts`)
- `7f3ebc6` 2026-02-26 — fix: replace hardcoded text with i18n keys and fix lint errors in scripts (4 archivos)

### refactor (2)

- `b46f249` 2026-02-25 — refactor(s47-C,D): cleanup obsolete files and remove hardcoded values (`scripts/backup-weekly.sh`, `scripts/legacy/scrape-competitors.ts`)
- `c136704` 2026-02-25 — refactor(s45-D): centralize hardcoded AI models, URLs and project refs (`scripts/verify-extensibility.sh`)

### docs (4)

- `86a2cd5` 2026-03-02 — docs: backlog ejecutable (116 items) + optimizacion flujo documentacion (`scripts/test-restore.sh`)
- `855e807` 2026-03-02 — docs: consolidate documentation — BACKLOG, strategy split, legacy cleanup (`scripts/test-restore.sh`)
- `40d762c` 2026-02-25 — docs: add historic banners to legacy docs and update estado-real (`scripts/generate-estado-real.sh`)
- `d3459dc` 2026-02-25 — docs: session 38 — single source of truth, onboarding, conventions (`scripts/generate-estado-real.sh`)

### chore (1)

- `9659370` 2026-03-04 — chore: add dependabot, gitleaks, knip, and endpoint drift tooling (`scripts/check-endpoint-drift.mjs`, `scripts/endpoint-baseline.json`)

## server-api (41 commits)

### feature (25)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (39 archivos)
- `36f08c8` 2026-02-26 — feat(s58-B): add public vehicle price valuation API endpoint (`server/api/market/valuation.get.ts`)
- `684e18f` 2026-02-26 — feat(s58-A): add dealer market intelligence with price position insights (`server/api/dealer/market-intelligence.get.ts`)
- `26490c6` 2026-02-26 — feat(s57-C): add dealer stock importer from external platforms (`server/api/dealer/import-stock.post.ts`)
- `69d5d01` 2026-02-26 — feat(s57-B): add widget generator page and list layout to widget endpoint (`server/api/widget/[dealerId].get.ts`)
- `4882e89` 2026-02-26 — feat(s57-A): add demo mode for dealers with AI vehicle analysis (`server/api/demo/try-vehicle.post.ts`)
- `a705a6e` 2026-02-25 — feat(s48-D): migrate verify-document to callAI with mock fallback (`server/api/verify-document.post.ts`)
- `d6f2d6a` 2026-02-25 — feat(s47-E): add AI generation to social posts with template fallback (`server/api/social/generate-posts.post.ts`)
- `74dd053` 2026-02-25 — feat(s44-F): postpone valuation API with 503 until sufficient data (`server/api/v1/valuation.get.ts`)
- `57074ed` 2026-02-25 — feat(s44-B): add immutable cache for images and version URL helper (`server/api/images/process.post.ts`)
- `3a36df4` 2026-02-25 — feat: add API key self-service, widget HTML endpoint, and dealer API page (`server/api/dealer/api-key.get.ts`, `server/api/dealer/api-key.post.ts`, `server/api/widget/[dealerId].get.ts`)
- `b7c16da` 2026-02-25 — feat: pending session 36-37 changes — types, server fixes, ads, vehicle integration (7 archivos)
- `4c7ecab` 2026-02-25 — feat: buyer experience — conversations, reservations, comparator, price history, seller profiles (`server/api/reservations/create.post.ts`, `server/api/reservations/respond.post.ts`)
- `3a24b4a` 2026-02-25 — feat: session 37 — security CI, automated tests, safe error messages (`server/api/email/send.post.ts`, `server/api/whatsapp/process.post.ts`)
- `8f133c7` 2026-02-24 — feat: session 36 — cross-audit: indexes, cache, auth, i18n, docs, consolidation (`server/api/push/send.post.ts`)
- `e3744dc` 2026-02-23 — feat: session 35 — integral audit with security hardening, RLS, SEO, CSP, code quality, and file splitting (11 archivos)
- `fc610c0` 2026-02-23 — feat: session 34b — hardening, robustness, and tech debt reduction (`server/api/advertisements.post.ts`, `server/api/error-report.post.ts`, `server/api/whatsapp/process.post.ts`)
- `987441c` 2026-02-23 — feat: session 34 — security audit remediation + accumulated missing files (17 archivos)
- `170d511` 2026-02-23 — feat: sessions 32-33 — data commercialization + infra monitoring (`server/api/images/process.post.ts`, `server/api/market-report.get.ts`, `server/api/v1/valuation.get.ts`)
- `74ed59c` 2026-02-21 — feat: audit fixes — 16 missing items from sessions 13-26 (`server/api/push/send.post.ts`)
- `412df3d` 2026-02-21 — feat: session 26 — invoicing with Quaderno, Stripe webhook auto-invoicing, and security page (`server/api/invoicing/create-invoice.post.ts`, `server/api/invoicing/export-csv.get.ts`)
- `df735f8` 2026-02-21 — feat: session 24 — user zone with auth, profiles, and dealer dashboard (`server/api/generate-description.post.ts`)
- `ab45066` 2026-02-21 — feat: sessions 22-23 — PWA + performance and multi-vertical clone system (`server/api/email/send.post.ts`, `server/api/stripe-connect-onboard.post.ts`)
- `ab9a7e6` 2026-02-10 — feat: implement comprehensive SEO with sitemap, structured data, and keyword targeting (`server/api/__sitemap.ts`)
- `b018d8a` 2026-02-08 — feat: complete steps 2-5 with full catalog, user interaction, news, and admin panel (`server/api/geo.get.ts`)

### fix (10)

- `0bf9582` 2026-03-03 — fix(sonar): Fase 3 S3776 — reducir cognitive complexity en 18 ficheros (18→0 issues) (`server/api/dealer/import-stock.post.ts`, `server/api/email/send.post.ts`, `server/api/whatsapp/webhook.post.ts`)
- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (16 archivos)
- `9ffff67` 2026-03-02 — fix(sonar): SonarQube audit Fase 1-4 mechanical fixes (9 archivos)
- `6cc7611` 2026-02-28 — fix: resolve all TypeScript typecheck errors (0 errors) (10 archivos)
- `4e92bc5` 2026-02-28 — fix: resolve minor audit findings + AdminSidebar refactor + type regen (4 archivos)
- `380de2b` 2026-02-26 — fix: resolve important audit findings — refactor FilterBar, sanitize errors, add sizes, update README (7 archivos)
- `f83b2b3` 2026-02-26 — fix: correct server import aliases ~/server → ~~/server for typecheck (9 archivos)
- `85b3666` 2026-02-25 — fix: redact PII from server logs + update post-session checklist (`server/api/email/send.post.ts`)
- `4ee8607` 2026-02-25 — fix: harden health endpoint — token auth + suppress error details (`server/api/health.get.ts`)
- `cd6d9b5` 2026-02-23 — fix: add auth guards to push/send and whatsapp/process endpoints (`server/api/push/send.post.ts`, `server/api/whatsapp/process.post.ts`)

### refactor (4)

- `93eb6bb` 2026-02-28 — refactor: move dealer portal from /vendedor/[slug] to /[slug] (flat root URL) (`server/api/__sitemap.ts`)
- `5da358f` 2026-02-25 — refactor(s48-B): extract whatsapp/process.post.ts logic to whatsappProcessor service (`server/api/whatsapp/process.post.ts`)
- `c136704` 2026-02-25 — refactor(s45-D): centralize hardcoded AI models, URLs and project refs (4 archivos)
- `1242010` 2026-02-25 — refactor: extract service layer for market report and billing logic (`server/api/market-report.get.ts`)

### perf (1)

- `813ed06` 2026-02-28 — perf: add ETag caching to sitemap endpoint (`server/api/__sitemap.ts`)

### chore (1)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (10 archivos)

## server-cron (19 commits)

### feature (11)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (18 archivos)
- `891567e` 2026-02-26 — feat(s58-C): add AI editorial content generator cron endpoint (`server/api/cron/generate-editorial.post.ts`)
- `2ebc725` 2026-02-25 — feat: implement flujos operativos enhancements (pre-session 44) (`server/api/cron/founding-expiry.post.ts`, `server/api/cron/price-drop-alert.post.ts`)
- `971a61e` 2026-02-25 — feat: add Stripe webhook failure tracking to infra-metrics cron (`server/api/cron/infra-metrics.post.ts`)
- `4c7ecab` 2026-02-25 — feat: buyer experience — conversations, reservations, comparator, price history, seller profiles (`server/api/cron/price-drop-alert.post.ts`, `server/api/cron/reservation-expiry.post.ts`)
- `3a24b4a` 2026-02-25 — feat: session 37 — security CI, automated tests, safe error messages (`server/api/cron/publish-scheduled.post.ts`)
- `fc610c0` 2026-02-23 — feat: session 34b — hardening, robustness, and tech debt reduction (7 archivos)
- `987441c` 2026-02-23 — feat: session 34 — security audit remediation + accumulated missing files (8 archivos)
- `170d511` 2026-02-23 — feat: sessions 32-33 — data commercialization + infra monitoring (`server/api/cron/infra-metrics.post.ts`)
- `e6a83e9` 2026-02-23 — feat: session 29 — favorites notifications, saved searches, alert editing (`server/api/cron/favorite-price-drop.post.ts`, `server/api/cron/favorite-sold.post.ts`)
- `ab45066` 2026-02-21 — feat: sessions 22-23 — PWA + performance and multi-vertical clone system (`server/api/cron/auto-auction.post.ts`)

### fix (7)

- `0bf9582` 2026-03-03 — fix(sonar): Fase 3 S3776 — reducir cognitive complexity en 18 ficheros (18→0 issues) (`server/api/cron/founding-expiry.post.ts`, `server/api/cron/infra-metrics.post.ts`, `server/api/cron/price-drop-alert.post.ts`)
- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (6 archivos)
- `9ffff67` 2026-03-02 — fix(sonar): SonarQube audit Fase 1-4 mechanical fixes (`server/api/cron/auto-auction.post.ts`, `server/api/cron/freshness-check.post.ts`, `server/api/cron/infra-metrics.post.ts`)
- `6cc7611` 2026-02-28 — fix: resolve all TypeScript typecheck errors (0 errors) (`server/api/cron/generate-editorial.post.ts`, `server/api/cron/infra-metrics.post.ts`)
- `380de2b` 2026-02-26 — fix: resolve important audit findings — refactor FilterBar, sanitize errors, add sizes, update README (4 archivos)
- `f83b2b3` 2026-02-26 — fix: correct server import aliases ~/server → ~~/server for typecheck (`server/api/cron/generate-editorial.post.ts`)
- `85b3666` 2026-02-25 — fix: redact PII from server logs + update post-session checklist (`server/api/cron/favorite-price-drop.post.ts`, `server/api/cron/favorite-sold.post.ts`, `server/api/cron/price-drop-alert.post.ts`)

### chore (1)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (5 archivos)

## server-infra (10 commits)

### feature (5)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (12 archivos)
- `ba4fd5d` 2026-02-26 — feat(s59-A,B): add CSP violation reporting and document nonce limitation (`server/api/infra/csp-report.post.ts`)
- `bf9f5d9` 2026-02-26 — feat(s53): database integrity check, ERD diagram, data retention, slow queries (`server/api/infra/slow-queries.get.ts`)
- `3a24b4a` 2026-02-25 — feat: session 37 — security CI, automated tests, safe error messages (`server/api/infra/alerts.get.ts`, `server/api/infra/metrics.get.ts`)
- `170d511` 2026-02-23 — feat: sessions 32-33 — data commercialization + infra monitoring (10 archivos)

### fix (4)

- `0bf9582` 2026-03-03 — fix(sonar): Fase 3 S3776 — reducir cognitive complexity en 18 ficheros (18→0 issues) (`server/api/infra/clusters/[id].patch.ts`)
- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (`server/api/infra/alerts.get.ts`, `server/api/infra/clusters/[id].patch.ts`, `server/api/infra/metrics.get.ts`)
- `6cc7611` 2026-02-28 — fix: resolve all TypeScript typecheck errors (0 errors) (4 archivos)
- `380de2b` 2026-02-26 — fix: resolve important audit findings — refactor FilterBar, sanitize errors, add sizes, update README (`server/api/infra/migrate-images.post.ts`, `server/api/infra/slow-queries.get.ts`)

### chore (1)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (4 archivos)

## server-middleware (14 commits)

### feature (9)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (7 archivos)
- `9aa9011` 2026-02-26 — feat: add 301 redirect middleware with 404 tracking (Session 62C) (`server/middleware/redirects.ts`)
- `ba4fd5d` 2026-02-26 — feat(s59-A,B): add CSP violation reporting and document nonce limitation (`server/middleware/security-headers.ts`)
- `2e56f1d` 2026-02-25 — feat(s50-A,B): add HSTS header and explicit CORS middleware (`server/middleware/cors.ts`, `server/middleware/security-headers.ts`)
- `6a69bba` 2026-02-25 — feat(s45-C): add vertical isolation with indexes, middleware and tests (`server/middleware/vertical-context.ts`)
- `3a24b4a` 2026-02-25 — feat: session 37 — security CI, automated tests, safe error messages (`server/middleware/security-headers.ts`)
- `e3744dc` 2026-02-23 — feat: session 35 — integral audit with security hardening, RLS, SEO, CSP, code quality, and file splitting (`server/middleware/security-headers.ts`)
- `fc610c0` 2026-02-23 — feat: session 34b — hardening, robustness, and tech debt reduction (`server/middleware/request-id.ts`)
- `987441c` 2026-02-23 — feat: session 34 — security audit remediation + accumulated missing files (`server/middleware/rate-limit.ts`)

### fix (3)

- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (`server/middleware/vertical-context.ts`)
- `f83b2b3` 2026-02-26 — fix: correct server import aliases ~/server → ~~/server for typecheck (`server/middleware/cors.ts`)
- `e5b8021` 2026-02-24 — fix: audit action items — RLS standardization, Product JSON-LD, rate limiter, cleanup (`server/middleware/rate-limit.ts`)

### chore (1)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (`server/middleware/cors.ts`, `server/middleware/rate-limit.ts`)

### other (1)

- `067e670` 2026-02-26 — security: document nonce-based CSP as not viable, add COOP/CORP headers (Session 60A) (`server/middleware/security-headers.ts`)

## server-other (15 commits)

### feature (7)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (12 archivos)
- `684e18f` 2026-02-26 — feat(s58-A): add dealer market intelligence with price position insights (`server/services/marketReport.ts`)
- `148f14c` 2026-02-26 — feat(s56-A): add in-process event bus with Nitro plugin listeners (`server/plugins/events.ts`)
- `2719707` 2026-02-25 — feat(s48-A,C): enhance services and extend AIRequest for multimodal (4 archivos)
- `06292e3` 2026-02-25 — feat(s45-F): add AI provider failover with multi-provider support (`server/services/aiProvider.ts`)
- `b7c16da` 2026-02-25 — feat: pending session 36-37 changes — types, server fixes, ads, vehicle integration (`server/routes/embed/[dealer-slug].get.ts`)
- `92f24b6` 2026-02-23 — feat: session 31 — dealer advanced tools, export modal, configurable table, embed widget (`server/routes/embed/[dealer-slug].get.ts`)

### fix (4)

- `0bf9582` 2026-03-03 — fix(sonar): Fase 3 S3776 — reducir cognitive complexity en 18 ficheros (18→0 issues) (`server/services/marketReport.ts`)
- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (`server/services/imageUploader.ts`, `server/services/marketReport.ts`, `server/services/vehicleCreator.ts`)
- `9ffff67` 2026-03-02 — fix(sonar): SonarQube audit Fase 1-4 mechanical fixes (`server/routes/embed/[dealer-slug].get.ts`, `server/services/marketReport.ts`, `server/services/notifications.ts`)
- `f83b2b3` 2026-02-26 — fix: correct server import aliases ~/server → ~~/server for typecheck (`server/plugins/events.ts`, `server/services/aiProvider.ts`, `server/services/whatsappProcessor.ts`)

### refactor (3)

- `5da358f` 2026-02-25 — refactor(s48-B): extract whatsapp/process.post.ts logic to whatsappProcessor service (`server/services/whatsappProcessor.ts`)
- `d9dfbf9` 2026-02-25 — refactor(s45-E): extract reusable services from endpoints (5 archivos)
- `1242010` 2026-02-25 — refactor: extract service layer for market report and billing logic (`server/services/billing.ts`, `server/services/marketReport.ts`)

### chore (1)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (`server/services/marketReport.ts`, `server/services/whatsappProcessor.ts`)

## server-stripe (15 commits)

### feature (10)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (4 archivos)
- `3d25e3b` 2026-03-02 — feat(credits): Stripe checkout for credit packs + i18n updates (`server/api/stripe/checkout-credits.post.ts`, `server/api/stripe/webhook.post.ts`)
- `2ebc725` 2026-02-25 — feat: implement flujos operativos enhancements (pre-session 44) (`server/api/stripe/checkout.post.ts`, `server/api/stripe/webhook.post.ts`)
- `2878d51` 2026-02-25 — feat(stripe): add dunning emails on payment failure and subscription cancellation (`server/api/stripe/webhook.post.ts`)
- `d7c5e77` 2026-02-25 — feat(stripe): add 14-day trial period for first-time subscribers (`server/api/stripe/checkout.post.ts`)
- `b7c16da` 2026-02-25 — feat: pending session 36-37 changes — types, server fixes, ads, vehicle integration (`server/api/stripe/checkout.post.ts`, `server/api/stripe/portal.post.ts`, `server/api/stripe/webhook.post.ts`)
- `fc610c0` 2026-02-23 — feat: session 34b — hardening, robustness, and tech debt reduction (`server/api/stripe/webhook.post.ts`)
- `987441c` 2026-02-23 — feat: session 34 — security audit remediation + accumulated missing files (`server/api/stripe/checkout.post.ts`, `server/api/stripe/portal.post.ts`, `server/api/stripe/webhook.post.ts`)
- `412df3d` 2026-02-21 — feat: session 26 — invoicing with Quaderno, Stripe webhook auto-invoicing, and security page (`server/api/stripe/webhook.post.ts`)
- `ab45066` 2026-02-21 — feat: sessions 22-23 — PWA + performance and multi-vertical clone system (`server/api/stripe/checkout.post.ts`)

### fix (4)

- `0bf9582` 2026-03-03 — fix(sonar): Fase 3 S3776 — reducir cognitive complexity en 18 ficheros (18→0 issues) (`server/api/stripe/webhook.post.ts`)
- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (`server/api/stripe/checkout-credits.post.ts`, `server/api/stripe/checkout.post.ts`, `server/api/stripe/webhook.post.ts`)
- `4e92bc5` 2026-02-28 — fix: resolve minor audit findings + AdminSidebar refactor + type regen (`server/api/stripe/checkout.post.ts`, `server/api/stripe/webhook.post.ts`)
- `380de2b` 2026-02-26 — fix: resolve important audit findings — refactor FilterBar, sanitize errors, add sizes, update README (`server/api/stripe/checkout.post.ts`, `server/api/stripe/portal.post.ts`, `server/api/stripe/webhook.post.ts`)

### refactor (1)

- `1242010` 2026-02-25 — refactor: extract service layer for market report and billing logic (`server/api/stripe/webhook.post.ts`)

## server-utils (13 commits)

### feature (10)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (19 archivos)
- `498129b` 2026-02-26 — feat(s56-B): add feature flags table, server utility, and client composable (`server/utils/featureFlags.ts`)
- `148f14c` 2026-02-26 — feat(s56-A): add in-process event bus with Nitro plugin listeners (`server/utils/eventBus.ts`)
- `01a1cc8` 2026-02-25 — feat(s47-A): add vertical column to vehicles and advertisements (`server/utils/supabaseQuery.ts`)
- `6a69bba` 2026-02-25 — feat(s45-C): add vertical isolation with indexes, middleware and tests (`server/utils/supabaseQuery.ts`)
- `b7c16da` 2026-02-25 — feat: pending session 36-37 changes — types, server fixes, ads, vehicle integration (`server/utils/email-templates/infra-alert.ts`, `server/utils/rateLimit.ts`, `server/utils/supabaseAdmin.ts`)
- `3a24b4a` 2026-02-25 — feat: session 37 — security CI, automated tests, safe error messages (`server/utils/safeError.ts`)
- `fc610c0` 2026-02-23 — feat: session 34b — hardening, robustness, and tech debt reduction (6 archivos)
- `987441c` 2026-02-23 — feat: session 34 — security audit remediation + accumulated missing files (7 archivos)
- `170d511` 2026-02-23 — feat: sessions 32-33 — data commercialization + infra monitoring (`server/utils/email-templates/infra-alert.ts`)

### fix (1)

- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (4 archivos)

### refactor (1)

- `c136704` 2026-02-25 — refactor(s45-D): centralize hardcoded AI models, URLs and project refs (`server/utils/aiConfig.ts`, `server/utils/siteConfig.ts`)

### chore (1)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (`server/utils/fetchWithRetry.ts`)

## shared-components (8 commits)

### feature (3)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (5 archivos)
- `16f0c60` 2026-03-02 — feat: accessibility system, UX forms, autocomplete, hover→@media (4 archivos)
- `f58a3fd` 2026-03-01 — feat(branding): background removal + logo typography config for dealer & admin (`app/components/shared/ImageUploader.vue`, `app/components/shared/LogoTextConfig.vue`)

### fix (2)

- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (`app/components/shared/LogoTextConfig.vue`)
- `9ffff67` 2026-03-02 — fix(sonar): SonarQube audit Fase 1-4 mechanical fixes (`app/components/shared/LogoTextConfig.vue`)

### refactor (2)

- `5879e40` 2026-02-28 — refactor: extract shared ImageUploader component, upgrade admin branding logos (`app/components/shared/ImageUploader.vue`)
- `0e10fbd` 2026-02-25 — refactor: add shared UI components (StatusBadge, ConfirmDeleteModal, PriceDisplay) (`app/components/shared/ConfirmDeleteModal.vue`, `app/components/shared/PriceDisplay.vue`, `app/components/shared/StatusBadge.vue`)

### chore (1)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (`app/components/shared/ConfirmDeleteModal.vue`)

## subastas-components (7 commits)

### feature (2)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (9 archivos)
- `16f0c60` 2026-03-02 — feat: accessibility system, UX forms, autocomplete, hover→@media (`app/components/subastas/SubastasDetailError.vue`)

### fix (1)

- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (`app/components/subastas/SubastasDetailImageGallery.vue`)

### refactor (2)

- `c1c9cc5` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 11) (5 archivos)
- `ef010d3` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 5) (7 archivos)

### chore (1)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (7 archivos)

### other (1)

- `e59309c` 2026-02-28 — ux: improve form accessibility, touch interactions and fix i18n JSON (`app/components/subastas/SubastasRegistrationModal.vue`)

## tests (15 commits)

### feature (7)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (795 archivos)
- `89f1edc` 2026-02-26 — feat(s52): Lighthouse CI workflow, Web Vitals GA4, accessibility tests (`tests/e2e/accessibility.spec.ts`)
- `6a69bba` 2026-02-25 — feat(s45-C): add vertical isolation with indexes, middleware and tests (`tests/security/vertical-isolation.test.ts`)
- `3a24b4a` 2026-02-25 — feat: session 37 — security CI, automated tests, safe error messages (`tests/security/auth-endpoints.test.ts`)
- `987441c` 2026-02-23 — feat: session 34 — security audit remediation + accumulated missing files (11 archivos)
- `74ed59c` 2026-02-21 — feat: audit fixes — 16 missing items from sessions 13-26 (4 archivos)
- `ab45066` 2026-02-21 — feat: sessions 22-23 — PWA + performance and multi-vertical clone system (`tests/setup.ts`)

### fix (1)

- `38be35d` 2026-02-26 — fix: address all audit findings — vertical filters, security tests, hardcoded URL, types, transparency (4 archivos)

### test (5)

- `00a807f` 2026-03-04 — test: add unit tests for utils (metrics export, kmScore, parseLocation, productName) (4 archivos)
- `ab772b7` 2026-02-26 — test(s51-A): add unit tests for server services and utilities (5 archivos)
- `533cb48` 2026-02-25 — test(s47-B): rewrite vertical isolation tests with Supabase mocks (`tests/security/vertical-isolation.test.ts`)
- `e706de6` 2026-02-25 — test(s46-B): add IDOR, rate limiting and information leakage security tests (`tests/security/idor-protection.test.ts`, `tests/security/information-leakage.test.ts`, `tests/security/rate-limiting.test.ts`)
- `21fe5bd` 2026-02-25 — test(e2e): add 8 user journey E2E tests with Playwright (8 archivos)

### chore (2)

- `a0d7810` 2026-03-04 — chore: update STATUS.md + add security and DB tests (`tests/db/migrations-consistency.test.ts`, `tests/security/authorization-regression.test.ts`)
- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (`tests/unit/useCatalogState.test.ts`)

## ui-components (12 commits)

### feature (10)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (23 archivos)
- `16f0c60` 2026-03-02 — feat: accessibility system, UX forms, autocomplete, hover→@media (6 archivos)
- `f465583` 2026-02-26 — feat: add ShareButtons component with WhatsApp/LinkedIn/Email/Copy (Session 63E) (`app/components/ui/ShareButtons.vue`)
- `2ebc725` 2026-02-25 — feat: implement flujos operativos enhancements (pre-session 44) (`app/components/ui/AiDisclosureBadge.vue`)
- `e3744dc` 2026-02-23 — feat: session 35 — integral audit with security hardening, RLS, SEO, CSP, code quality, and file splitting (`app/components/ui/ExportModal.vue`)
- `987441c` 2026-02-23 — feat: session 34 — security audit remediation + accumulated missing files (`app/components/ui/TurnstileWidget.vue`)
- `92f24b6` 2026-02-23 — feat: session 31 — dealer advanced tools, export modal, configurable table, embed widget (`app/components/ui/ConfigurableTable.vue`, `app/components/ui/ExportModal.vue`)
- `d0186d7` 2026-02-21 — feat: session 25 — EU/UK regulatory compliance (DSA, AI Act, UK OSA, RGPD) (`app/components/ui/AiBadge.vue`)
- `b1feebb` 2026-02-10 — feat: add advanced SEO improvements — breadcrumbs, ItemList schema, CLS fix, favicons, and alt text (`app/components/ui/BreadcrumbNav.vue`)
- `b018d8a` 2026-02-08 — feat: complete steps 2-5 with full catalog, user interaction, news, and admin panel (`app/components/ui/RangeSlider.vue`)

### fix (1)

- `9ffff67` 2026-03-02 — fix(sonar): SonarQube audit Fase 1-4 mechanical fixes (`app/components/ui/TurnstileWidget.vue`)

### chore (1)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (5 archivos)

## utils (21 commits)

### feature (11)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (13 archivos)
- `dcc138e` 2026-03-02 — feat(catalog): geo-fallback, promo cards, similar searches, empty state (`app/utils/geoData.ts`)
- `fdcf027` 2026-02-26 — feat: integrate Zod + VeeValidate for form validation (`app/utils/schemas.ts`)
- `b7c16da` 2026-02-25 — feat: pending session 36-37 changes — types, server fixes, ads, vehicle integration (`app/utils/generatePdf.ts`)
- `8f133c7` 2026-02-24 — feat: session 36 — cross-audit: indexes, cache, auth, i18n, docs, consolidation (`app/utils/productName.ts`)
- `e3744dc` 2026-02-23 — feat: session 35 — integral audit with security hardening, RLS, SEO, CSP, code quality, and file splitting (`app/utils/contractGenerator.ts`)
- `987441c` 2026-02-23 — feat: session 34 — security audit remediation + accumulated missing files (9 archivos)
- `80f4606` 2026-02-09 — feat: add admin users/subscriptions management, dynamic ads/demands, and fix 11 runtime bugs (`app/utils/generatePdf.ts`)
- `33bb5e0` 2026-02-09 — feat: add vehicle PDF brochure generator utility (`app/utils/generatePdf.ts`)
- `f52bf27` 2026-02-08 — feat: add subcategory management, location auto-detection, singular names, and admin table improvements (`app/utils/parseLocation.ts`, `app/utils/productName.ts`)
- `b018d8a` 2026-02-08 — feat: complete steps 2-5 with full catalog, user interaction, news, and admin panel (`app/utils/fuzzyMatch.ts`, `app/utils/geoData.ts`)

### fix (4)

- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (9 archivos)
- `9ffff67` 2026-03-02 — fix(sonar): SonarQube audit Fase 1-4 mechanical fixes (`app/utils/adminMetricsExport.ts`, `app/utils/kmScore.ts`, `app/utils/parseLocation.ts`)
- `6cc7611` 2026-02-28 — fix: resolve all TypeScript typecheck errors (0 errors) (4 archivos)
- `6c54ab7` 2026-02-25 — fix: replace remaining tank-iberica references with tracciona in Cloudinary paths (`app/utils/fileNaming.ts`)

### refactor (5)

- `7dde04a` 2026-02-28 — refactor: split useInvoice.ts into 3 utility modules (Auditoría #7 Iter. 15) (`app/utils/invoiceFormatters.ts`, `app/utils/invoicePdf.ts`, `app/utils/invoiceTypes.ts`)
- `1f93765` 2026-02-28 — refactor: split useAdminMetrics.ts into 4 sub-modules (Auditoría #7 Iter. 15) (`app/utils/adminMetricsExport.ts`, `app/utils/adminMetricsTypes.ts`)
- `145a7c5` 2026-02-28 — refactor: split useAdminEmails.ts — extract 30 email template definitions (Auditoría #7 Iter. 15) (`app/utils/adminEmailTemplates.ts`)
- `c13676f` 2026-02-28 — refactor: split useAdminProductosPage.ts into 3 sub-composables (Auditoría #7 Iter. 15) (`app/utils/adminProductosExport.ts`)
- `bf6ae32` 2026-02-25 — refactor: add shared useListingUtils composable and enhance slugify (`app/utils/fileNaming.ts`)

### chore (1)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (9 archivos)

## vehicle-components (19 commits)

### feature (9)

- `5ce1f32` 2026-03-11 — feat: Plan Maestro P0 + P1 Complete Sprint — 16 items (CF WAF, monitoring, tracing, caching) (23 archivos)
- `16f0c60` 2026-03-02 — feat: accessibility system, UX forms, autocomplete, hover→@media (9 archivos)
- `0fc25fd` 2026-02-26 — feat: add RelatedVehicles and CategoryLinks components for internal linking (`app/components/vehicle/CategoryLinks.vue`, `app/components/vehicle/RelatedVehicles.vue`)
- `4c7ecab` 2026-02-25 — feat: buyer experience — conversations, reservations, comparator, price history, seller profiles (`app/components/vehicle/FairPriceBadge.vue`, `app/components/vehicle/PriceHistoryChart.vue`, `app/components/vehicle/ReserveButton.vue`)
- `987441c` 2026-02-23 — feat: session 34 — security audit remediation + accumulated missing files (4 archivos)
- `74ed59c` 2026-02-21 — feat: audit fixes — 16 missing items from sessions 13-26 (`app/components/vehicle/InspectionRequestForm.vue`)
- `ab45066` 2026-02-21 — feat: sessions 22-23 — PWA + performance and multi-vertical clone system (`app/components/vehicle/ImageGallery.vue`)
- `dacff57` 2026-02-09 — feat: support non-Cloudinary images in gallery (`app/components/vehicle/ImageGallery.vue`)
- `98b03b1` 2026-02-01 — feat: add vehicle detail page with gallery, info, and contact options (`app/components/vehicle/ImageGallery.vue`)

### fix (3)

- `6fa4f2d` 2026-03-03 — fix(sonar): Fase 4 residuos — S6551, S2871, S3358 + broken S7721 extractions revert (`app/components/vehicle/ContactSellerModal.vue`, `app/components/vehicle/SoldCongratsModal.vue`)
- `9ffff67` 2026-03-02 — fix(sonar): SonarQube audit Fase 1-4 mechanical fixes (`app/components/vehicle/PriceHistoryChart.vue`, `app/components/vehicle/RelatedVehicles.vue`)
- `380de2b` 2026-02-26 — fix: resolve important audit findings — refactor FilterBar, sanitize errors, add sizes, update README (`app/components/vehicle/ImageGallery.vue`, `app/components/vehicle/RelatedVehicles.vue`)

### refactor (5)

- `93eb6bb` 2026-02-28 — refactor: move dealer portal from /vendedor/[slug] to /[slug] (flat root URL) (`app/components/vehicle/DetailSeller.vue`)
- `b0916e0` 2026-02-28 — refactor: extract composables + components from 9 pages (audit #7 iter 13) (`app/components/vehicle/CategoryLinks.vue`, `app/components/vehicle/PriceHistoryChart.vue`, `app/components/vehicle/RelatedVehicles.vue`)
- `acd13ed` 2026-02-27 — refactor: extract composables + components from 6 pages (audit #7 iter 4) (7 archivos)
- `5a72e47` 2026-02-25 — refactor: replace local formatPrice with shared imports in dashboard and public pages (`app/components/vehicle/PriceHistoryChart.vue`)
- `e58f238` 2026-02-02 — refactor: alinear UI del catálogo con diseño legacy (`app/components/vehicle/ImageGallery.vue`)

### chore (1)

- `ae55cd0` 2026-03-04 — chore(sonarqube): S3776 cognitive complexity + S7924 media queries px→em (11 archivos)

### other (1)

- `e59309c` 2026-02-28 — ux: improve form accessibility, touch interactions and fix i18n JSON (`app/components/vehicle/ContactSellerModal.vue`, `app/components/vehicle/DetailActions.vue`, `app/components/vehicle/InspectionRequestForm.vue`)

## Actividad diaria

| Fecha      | Commits                                     |
| ---------- | ------------------------------------------- |
| 2026-02-01 | 31 ###############################          |
| 2026-02-02 | 3 ###                                       |
| 2026-02-06 | 1 #                                         |
| 2026-02-07 | 1 #                                         |
| 2026-02-08 | 5 #####                                     |
| 2026-02-09 | 10 ##########                               |
| 2026-02-10 | 4 ####                                      |
| 2026-02-21 | 5 #####                                     |
| 2026-02-22 | 2 ##                                        |
| 2026-02-23 | 11 ###########                              |
| 2026-02-24 | 6 ######                                    |
| 2026-02-25 | 75 ######################################## |
| 2026-02-26 | 51 ######################################## |
| 2026-02-27 | 9 #########                                 |
| 2026-02-28 | 67 ######################################## |
| 2026-03-01 | 3 ###                                       |
| 2026-03-02 | 9 #########                                 |
| 2026-03-03 | 18 ##################                       |
| 2026-03-04 | 8 ########                                  |
| 2026-03-11 | 1 #                                         |
