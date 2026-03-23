# TradeBase — Memory

## Vision

- **TradeBase** = platform generating B2B vertical marketplaces
- **Tracciona** (tracciona.com) = first vertical (vehículos industriales)
- 7 confirmed + 4 future verticals, each via `vertical_config`
- Parallel companies: **Tank Ibérica SL**, **Gesturban**, **IberHaul** (transport, góndola propia)
- Hub: campa Onzonilla, León

## Business Model

- Publishing FREE. Paywall OPTIONAL (Pro buyers: 24h early access; Dealers: tools/stats).
- Revenue: services (transport, verification, docs, insurance), dealer subs, ads, subastas premium, data products
- Key differentiator: WhatsApp photos → AI → bilingual listing in minutes
- Data model = Idealista (accumulate market data → sell to banks/insurers/manufacturers)

## 4 Revenue Layers

1. **Marketplace** — traffic & data (free listings, SEO, editorial)
2. **Dealer SaaS** — tools (free / basic 29€ / premium 79€ / founding free forever)
3. **Transactional** — transport, verification, docs, insurance, subastas
4. **Data products** — valuation API, reports, datasets (after critical mass)

## Stack

- Nuxt 3 + Supabase + Cloudflare Pages + Stripe + Cloudinary/CF Images + Resend + WhatsApp Meta Cloud API + **Billin** (facturación)

## Decisiones Facturación (14-mar-2026)

- **Billin Unlimited (€20/mes = €240/año, ilimitado)** elegido sobre Quaderno — precio fijo vs $49-149/mes escalonado por volumen
- **Implementación:** Items #8 (tiers dealer) + #447 (Fiscal Compliance Engine) en BACKLOG-EJECUTABLE.md
- **Adapter:** `server/utils/billingAdapter.ts` abstrae Billin API; reemplaza Quaderno en `billing.ts` + `create-invoice.post.ts`
- **Razón:** API completa incluida (necesaria para automatizar facturas desde Stripe webhook), TicketBAI/Verifactu automático, multi-divisa, credit notes en refunds
- Todo lo diferencial de Quaderno se construye en #447: VIES (API pública EU gratis), OSS B2C, tax nexus, multi-divisa (BCE API gratis), credit notes
- **Código existente:** actualmente en Quaderno → migración planificada sesión de #8
- **Fiscal compliance:** B2B EU = inversión sujeto pasivo (0% IVA, cliente declara en su país). Solo necesitas ROI (AEAT, gratuito) + Modelo 349 trimestral. Sin registro fiscal en otros países EU para B2B.
- **OSS B2C aplica** porque particulares pueden comprar créditos (no se puede controlar quién compra) → campo NIF IVA opcional en checkout: con NIF válido VIES = B2B; sin NIF = B2C IVA por país
- **#447 Fiscal Compliance Engine** (Bloque 1, depende de #8, tamaño L): Billin adapter + multi-divisa + IVA multi-país global + OSS B2C + tax nexus vertical-aware (umbrales son TradeBase SL total, no por vertical)
- Supabase Project ID: gmnrfuzekbwyzkgsaftv
- Supabase URL: https://gmnrfuzekbwyzkgsaftv.supabase.co
- Supabase Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtbnJmdXpla2J3eXprZ3NhZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MDkxMTUsImV4cCI6MjA4NTQ4NTExNX0.zN8JWkQvkzlFHXFunaanpJr391mHUVdViBbTmTkm3Qw
- Branch: `main` · Deploy: Cloudflare Pages

## Stripe (configurado 17-mar-2026)

- **Modo:** Test (sandbox). Live mode pendiente de KYC + dominio
- **Productos creados (Test):** Classic (29€/79€ mes/año), Premium (79€/790€), 5 credit packs (Starter→Enterprise)
- **Webhook:** `we_1TC7M8...` → 7 eventos (checkout, subscriptions, invoices, refunds)
- **Env vars:** STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET, 4 Price IDs — todo en `.env`
- **Backlog:** #173 ✅, #202 ✅, #172 → Lanzamiento, #174 → Revisar
- **Cloudflare:** BLOQUEADO — dominio tracciona.com no comprado aún
- **Servicios pendientes:** Resend, Sentry, Anthropic, Google (Search Console+GA4), Meta/WhatsApp, Billin

## GitHub Secrets (configurados 06-mar-2026)

- SUPABASE_URL ✅, SUPABASE_ANON_KEY ✅, INFRA_ALERT_EMAIL ✅, CRON_SECRET ✅, APP_URL (var) ✅
- Pendientes: RESEND_API_KEY (tras tarea #21 Resend), STAGING_SUPABASE_URL, STAGING_SUPABASE_KEY (IDOR CI)

## REGLA CRÍTICA — Sin agentes paralelos

- **NUNCA** lanzar múltiples Task en paralelo. Siempre secuencial.
- Violación detectada 28-feb-2026 (7 Task simultáneas). No repetir.
- **Excepción Haiku:** Si modelo objetivo = Haiku Y subtareas independientes (sin dependencias de aprendizaje entre sí), ofrecer paralelo como opción al usuario (por defecto: secuencial).
- **Dependencias de aprendizaje:** si tarea B necesita lo que descubre tarea A → NUNCA paralelo.

## Testing Architecture

- **Vitest**: lógica pura con mocks. **MSW** para security tests que necesitan simular HTTP sin servidor real.
- **Playwright**: tests que necesitan navegador real o servidor con build completo.
- Security tests → MSW (NO Playwright — build necesita decenas de secrets en CI).
- Pre-push hook: solo `typecheck + lint` (NO `npm run test` — demasiado lento).
- Plan completo: `docs/legacy/TESTING-IMPROVEMENT-PLAN.md` (8 fases — TODAS COMPLETAS)
- **IDOR tests** (13 tests): Supabase staging directo. Requieren `STAGING_SUPABASE_URL` + `STAGING_SUPABASE_KEY`.
- **Test quality classification** (18-mar): BEHAVIORAL (importa+ejecuta) vs STRUCTURAL (readFileSync+toContain) vs MIXED
- **Quality gate**: `tests/unit/build/test-quality-gate.test.ts` — 0% structural en unit/
- **Classifier script**: `scripts/classify-tests.mjs` (--json, --structural-only)
- **Roadmap Autónomo v5**: `.claude/ROADMAP-AUTONOMO.md` — **14/14 COMPLETADO** (19-mar). 7 backlog activo + 7 FUTURO. 3 adapter patterns (searchEngine, cacheLayer, vehicleReportProvider) con fallback funcional. 6 migraciones (00179-00184). 242 tests nuevos.
- **Schema sync (23-mar)**: 5 migraciones (00192–00196): dealer_reviews, glossary, error_events, ~10 columnas, 3 RPCs dealer dashboard. Types regenerados (9055 líneas). 13 `as any` eliminados. 3 `as any` justificados: 2 brokerage (auth.users cross-schema no tipable), 1 subscriptions upsert (newsletter prefs mezcladas con billing table — pendiente refactor).
- **Typecheck (23-mar)**: 0 errores. database.types.ts y types/supabase.ts sincronizados con schema real.
- **Backlog autónomo (23-mar)**: #246 ✅, #N35 ✅, #302 ✅, #57 ✅, #99 ✅. Marcados #4 y #246 como done en BACKLOG-EJECUTABLE.md.
- **Compact catalog view (23-mar)**: `ViewMode = 'grid' | 'list' | 'compact'`. `CatalogVehicleCardCompact.vue` — horizontal ~80px, imagen 38% izq, info derecha (título, año, precio, ubicación). Auto-switch a compact en mobile <768px en `onMounted` de VehicleGrid. Toggle ControlsBar: compact|grid|list. i18n `catalog.viewCompact` ES+EN. Commit c339827.
- **Distributed tracing (#302)**: `browserTracingIntegration()` en error-handler.ts + `tracePropagationTargets: [/^\/api\//]`. `request-id.ts` extrae sentry-trace + baggage headers → `event.context.sentryTrace/baggage`. `createLogger` incluye sentryTrace en logs estructurados.
- **Backlog analysis (19-mar):** ~205 pendientes / ~510 total. Código ejecutable: 7. Código bloqueado: 68 (15 activos + 17 DEFERRED + 34 FUTURO + 2 OP). No-código: 130 (32 config + 18 founders + 40 pre-launch + 6 DEFERRED + 16 FUTURO + 18 OP). SINCRONIZADO con BACKLOG-EJECUTABLE.md.
- **Profesionalización roadmap**: `.claude/ROADMAP-TEST-PROFESIONALIZACION.md` — **COMPLETADO + AUDITADO 19-mar**
  - 111 items verificados, 0 saltados. Auditoría exhaustiva item-por-item completa.
  - Fases 0-2: Infra + conversiones + mixed splits (DONE)
  - Fases 3-5: 59 structural tests movidos a `tests/conformance/` → 8 convertidos a behavioral = 51 en conformance
  - Fase 6: Quality gate enforced 0%, clasificador mejorado (false positive fix)
  - **Resultado:** 973 behavioral / 0 structural / 0 mixed en tests/unit/ (17,982 tests)
  - **tests/conformance/** = 51 archivos (10 root + 15 build + 14 components + 11 server + 1 security)
  - **Config test conversion pattern**: `tests/helpers/nuxtConfig.ts` loads config as object (mock defineNuxtConfig as identity), YAML via `yaml.parse()`, JS config via dynamic `import()`
  - **Classifier gotchas**: avoid `readFileSync + .includes() + .toBe(true)` combo (triggers audit pattern) — use `.toBeTruthy()` instead; avoid `.toContain()` with readFileSync present — use `.toMatch()` or `.toEqual()`
  - **Gap menor pendiente:** ESLint rule `require-autocomplete` (item 5.22) no creada
- **Mocking patterns for behavioral conversion**:
  - Nuxt composables: `vi.stubGlobal('useSupabaseClient', vi.fn(() => mockClient))`
  - Server auto-imports: `vi.stubGlobal('useSupabaseServiceClient', vi.fn(() => mockClient))`
  - h3: `vi.mock('h3', async () => ({ ...actual, createError: custom }))`
  - #supabase/server: `vi.mock('#supabase/server', () => ({ serverSupabaseServiceRole: () => ({ rpc: mockRpc }) }))`
  - Circuit breaker: use REAL module (not mocked) for integration-style behavioral tests
- **Suite (09-mar pre-merge)**: 747 archivos, 0 fallos. Coverage: 73.67% statements.
- **Suite (17-mar post-fix)**: 918 archivos, 17,334 tests, 0 failures. All pre-existing failures fixed.
- **Suite (17-mar backfill)**: 921 archivos, 17,446 tests, 0 failures. +88 tests (9 items backfill) + 4 flaky fixes.
- **Suite (17-mar auditoría)**: 894 tests verificados en 34 archivos del roadmap, 0 failures. Fixes: #52/#53 (reviewHelpers.ts), #84 (verifyHealthAccess).
- **Suite (18-mar post-fixes)**: 938 files, 17,720 tests, 17,685 passed, 2 flaky pre-existing (audit-hardcoding timing, useDashboardExportar async import). Fixes: MetricsKpiCards (5 KPIs), useCloudinaryUpload (validateImageMagicBytes mock + flushMicrotasks).
- **Typecheck (14-mar sesión #5)**: 0 errores TS. Todas las columnas vehicles validadas contra types/supabase.ts.
- **ESLint (18-mar)**: 0 errors. Todos los pre-existentes resueltos (30 errores en 14 archivos). Pre-commit + pre-push hooks pasan sin `--no-verify`.
- **Backlog total (14-mar)**: ~540 items (33 bloques). Casi todos S-sized autónomos completados/verificados.
- **Sesiones autónomas 14-mar (#1-#5)**: 130+ S/M tasks verificados como ya hechos. Implementados: #221 select('\*') cleanup, #212 views fix, #227/#228 de-hardcoding 8 archivos, typecheck 0 errores. Quedan: L-sized, external APIs, fundadores.
- **Nuevos composables (14-mar)**: useTopDealers, useVirtualList, usePresence, useReferral, useAbTest, useFormAutosave (pre-existente)
- **k6 tests suite (14-mar)**: spike, load, stress, soak, concurrent-writes, concurrent-bids en scripts/

## Middleware Testing Patterns (06-mar)

### H3 explicit imports (cors, rate-limit, request-id, redirects)

- `vi.mock('h3', () => ({ defineEventHandler: (fn) => fn, ... }))` + static import
- **`~~` alias**: `'~~': resolve(__dirname, '.')` en vitest.config.ts resolve.alias. Ya hecho.

### Nuxt auto-imports globales (security-headers, vertical-context, admin, auth, dealer)

```typescript
let handler: Function
beforeAll(async () => {
  vi.stubGlobal('defineEventHandler', (fn: Function) => fn)
  vi.resetModules()
  const mod = await import('../../../server/middleware/security-headers')
  handler = mod.default as Function
})
```

- `vi.stubGlobal` persiste después de `vi.resetModules()` (stubs = globalThis, no module cache)

## Test Fix Patterns (08-mar)

- **JS arg evaluation antes del mock**: `mockEvent = { node: { req: { headers: {} } } }`, NO confiar en mock de la función.
- **`vi.clearAllMocks()` NO limpia `mockResolvedValueOnce` queue**: asegurarse de que todos los mocks se consumen.
- **`t()` en composables NO se mockea automáticamente**: sin mock, assertions usan la i18n key.
- **Env leak entre tests**: `delete process.env.STRIPE_SECRET_KEY` en `beforeEach`/`afterEach`.

## Coverage 85% Sprint

- **Policy:** `docs/coverage-policy.md`
- **Coverage gate (F4.4):** `scripts/check-coverage-gate.mjs` + `scripts/coverage-gate-min.json` (50/50/50/35%)
- **SonarQube:** localhost:9000. Token: `squ_adc0fdaf7926b9de67c7fe692fecd5ab281b84b9`. Escanear con Docker: `docker run --rm -v "${PWD}:/usr/src" -e SONAR_HOST_URL=http://host.docker.internal:9000 sonarsource/sonar-scanner-cli:latest`
- **Scan 14-mar (pre-fixes):** Coverage 66.1%, 7 bugs, 22 hotspots, 275 smells — Quality Gate OK
- **Fix sprint 14-mar:** 7 bugs ✅, 22 hotspots (19 SAFE API + 3 en código) ✅, ~80+ smells corregidos (S7781, S7764, S4325, S6551, S7735 parcial, S3358 parcial)
- **Fix sprint 16-mar:** ~247 smells más: S4036 (218), S6598 (7), S6747 (6), S1125 (12), S6606 (4+9), S3358 (9), S7735 (2), S3776 (5 funciones)
- **Fix sprint 16-mar-noche:** Haiku sesión `36a0e9e` aplicó S7735/S4624/S6551/S7721/S4325 (~29 archivos) pero introdujo 2 bugs: `Math.trunc` en hash (debe ser `|= 0`) + tipo circular TrendDirection. Corregido en `5293724`.
- **Smells pendientes:** ~10 menores (S6598 Vue convention, S1135 TODO, S1874 deprecated field, S7767 NOSONAR). Próximo scan verificará.
- **Actual: ~74.8% statements (vitest) / 72.7% (SonarQube). 747 archivos test, 13,862 tests, 0 fallos (09-mar)**
- **SonarQube Quality Gate: OK** — 0 bugs, 0 vulns, 0 smells, 0 hotspots (09-mar)
- **Lo crítico CUBIERTO:** stripe webhook ~95%, search-alerts 100%, founding-expiry 99%, useAuction 99%, useReservation 100%, useAuth ~95%, useConversation ~95%, valuation.get 100%, execute-migration 100%
- **Pendiente (no urgente):** componentes Vue y páginas — posponer hasta feature freeze
- **Patrón componentes Vue:** shallowMount + `$t: (k) => k` mock + vi.stubGlobal para Nuxt auto-imports + vi.mock para explicit imports. Restaurar Vue reactivity reales (ref, computed, watch) con vi.stubGlobal para que template funcione.
- **ROOT CAUSE: setup.ts Vue stubs break SFC v-if:** `tests/setup.ts` stubs `ref` with `(val) => ({ value: val })` — plain object WITHOUT `__v_isRef` flag. Vue template compiler doesn't auto-unwrap → `v-if="showBanner"` evaluates `{ value: false }` as TRUTHY (non-null object). Fix: per-file override with real Vue imports BEFORE mount:
  ```typescript
  import { ref, watch, onUnmounted } from 'vue'
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('watch', watch)
  vi.stubGlobal('onUnmounted', onUnmounted)
  ```
  Global fix FAILED (52+ files break — real `watch()` fires composable watchers hitting undefined globals). Per-file override works because SFC `setup()` runs at mount time, not import time.
- **Fix común tests:** `setResponseHeader: vi.fn()` en mock de h3; $t retorna i18n key, no texto traducido; `createError` de h3 también necesita mock cuando se usa `validateBody`
- **`vi.stubGlobal` leak entre describe blocks**: stubs a nivel de `it()` persisten en tests posteriores. Siempre re-stubear en `beforeEach` del describe. Ejemplo: api-stripe.test.ts — checkout-credits re-stubeaba `useRuntimeConfig` sin `cronSecret`, afectando webhook tests.
- **Cascading test failures from missing afterEach**: If a test changes global state (e.g., `useRuntimeConfig` stub) and its assertion fails BEFORE restore code runs, all subsequent tests see stale state. Always use `afterEach` for cleanup, not inline restore after assertions.
- **BRAND_COLORS in siteConfig mocks**: All cron handlers (dealer-onboarding, freshness-check, post-sale-outreach) import `BRAND_COLORS` from siteConfig. Test mocks MUST include it: `BRAND_COLORS: { primary: '#23424A', primaryDark: '#1a3236', accent: '#E8A838', white: '#ffffff', gray100: '#f7fafc', gray600: '#718096', gray800: '#2d3748' }`
- **useFormValidation mock pattern**: Components using `useFormValidation` composable need comprehensive `vi.stubGlobal` mock with `defineField`, `translatedErrors`, `isSubmitting`, `onSubmit` (with basic validation logic), `resetForm`, `setFieldValue`. See DemandModal.test.ts for full example.
- **Flaky test fix: document stubGlobal leak**: NEVER `vi.stubGlobal('document', {...})` with a minimal object — it replaces the entire jsdom document and contaminates later tests. Instead use `vi.spyOn(document, 'createElement')` to patch only what's needed. Always restore in `afterEach`.
- **Flaky test fix: async dynamic imports in full suite**: `setTimeout(r, 100)` may not be enough under full suite load (~920 files). Use 200-250ms for `handleExport`-style tests that do `await import('exceljs')`.
- **Flaky test fix: network-dependent tests**: Tests hitting `localhost:3000` (rate-limiting, IDOR) need `AbortSignal.timeout(5000)` on all fetches + graceful skip when all requests fail (full suite consumes server resources).
- **Async composable XHR test pattern**: When composable does `await asyncFn()` before setting up XHR, test must `await flushMicrotasks()` (= `new Promise(r => setTimeout(r, 0))`) between `c.upload(file)` and `mockXhr._listeners['load']?.()` — otherwise events fire before listeners are registered. Also mock any new async validation (e.g., `vi.mock('~/utils/validateImageMagicBytes', () => ({ validateImageMagicBytes: vi.fn(async () => ({ valid: true })) }))`).
- **KPI component tests**: When adding new KPI fields to interface (e.g., `arpu`), update ALL test mocks AND card count assertions in MetricsKpiCards.test.ts.

## Composable Split Pattern (F3.1, 08-mar)

- **Patrón:** composables grandes → extrae tipos a `shared/XTypes.ts` + helpers puros a `shared/XHelpers.ts`
- **Re-exports** en archivo original para backwards compat: `export type { X } from './shared/XTypes'`
- **Shared files existentes:** marketDataTypes/Helpers, datosTypes/Helpers, valoracionTypes/Helpers, conversationTypes/Helpers, dateHelpers, useListingUtils
- **formatPrice:** deduplicada → `app/utils/formatters.ts`

## Supabase Staging

- **Project:** `tradebase-staging` (ID: `xddjhrgkwwolpugtxgfk`)
- **MCP tools** siempre van a PRODUCCIÓN. CLI se enlaza con `supabase link`.
- Dealer A user: `34873578-87ba-4888-869c-4cdb9ab07bf1`, dealer record: `19a4595a-29a8-4632-a48b-01b7a16e99c6`
- Dealer B user: `cc19f72f-6a18-4683-b31c-8b171ac3cbe6`, dealer record: `337edfe5-54b6-4711-b350-63f39a07d307`
- Admin: `6a6c1ce7-d24a-4042-ba3b-8e997450744f`
- **Pendiente:** GitHub secrets STAGING_SUPABASE_URL + STAGING_SUPABASE_KEY, fix price_history_trends matview

## Migration Push Learnings

- Migraciones con conflictos: `DROP TABLE IF EXISTS ... CASCADE` antes de `CREATE TABLE IF NOT EXISTS`
- `CREATE POLICY` no tiene `IF NOT EXISTS` → `DROP POLICY IF EXISTS` + `CREATE POLICY`
- Materialized views no soportan ALTER TABLE RLS → envolver en `DO $$ BEGIN ... EXCEPTION WHEN OTHERS THEN NULL; END $$`
- **ENUM conversion:** `DROP DEFAULT` antes de `ALTER COLUMN TYPE` para ENUMs, luego `SET DEFAULT 'value'::enum_type` después
- **ENUM dependency chain:** Views, RLS policies y triggers que referencian la columna bloquean `ALTER COLUMN TYPE` → drop/recrear alrededor
- **Idempotent migration pattern:** `DO $ BEGIN IF EXISTS (...) THEN ... END IF; END $;` para conversiones condicionales

## Nuxt Supabase Type System (19-mar-2026)

- **Nuxt Supabase module usa `app/types/database.types.ts`**, NO `types/supabase.ts`
- `.nuxt/types/supabase-database.d.ts` exporta desde `../../app/types/database.types.ts`
- `types/supabase.ts` es referencia regenerable pero NO la usa el módulo
- **`database.types.ts` está desincronizado** con schema real — actualizarlo causa ~35 errores preexistentes
- **Tarea futura:** Regenerar `database.types.ts` + arreglar todos los archivos dependientes → eliminar `(supabase as any)` casts

## Plan 10/10 (25/27 COMPLETADO)

- **Plan movido a:** `docs/legacy/PLAN-10-DE-10.md`
- **Pendientes (fundadores):** F0.3 (CF WAF dashboard), F5.1 (SonarQube scan con token)
- **SLOs:** p95 <100ms cache hit, <300ms cache miss, error rate <0.5%, 0 P0/P1, bundle público ≤200KB

## Plan Maestro 10/10 — FUSIONADO en BACKLOG-EJECUTABLE.md (13-mar-2026)

- **Estado:** FUSIONADO 13-mar + ampliado 14-mar con 2 auditorías externas. **~404 items** en BACKLOG-EJECUTABLE.md (26 bloques, ~316 sesiones estimadas).

## POLÍTICA DE DOBLE-CHECK + TESTS OBLIGATORIOS (16-mar-2026)

**Auditoría Manual:** Verificados 14 items completados.

- **Resultado:** 13/14 BIEN HECHOS (código + tests presentes).
- **1 BLOQUEADO:** #4 (TypeScript errors) — `npm run typecheck` falla por vue-router config.
- **Tests encontrados:** 7 items con tests (241 tests totales), 4 sin tests automáticos.

**Nueva Política:**

1. **Completado ≠ Seguro.** Toda tarea requiere doble-check: ✅ Código presente + ✅ Tests presentes
2. **Marcado en backlog:** Items completos muestran "✅ Completado + ✅ X tests" o "⏳ Tests pendientes" (referenciado a Roadmap Tests)
3. **Nuevas tareas (OBLIGATORIO):** Criterio "Tests" incluido en definición de completitud. Ejemplo: ">80% coverage de lógica" O ">3 tests de integración" O "1 E2E test"
4. **Items sin tests:** Van a **Roadmap Tests (Prioridad 0)** para backfill ANTES de siguiente fase. Ej: T1-T4 en BACKLOG-EJECUTABLE.md
5. **Riesgo de regresión:** Items con dependencias críticas (#30-#33 Trust Score, #29 Fingerprint, #74 Security, #2 IDOR) requieren E2E tests adicionales

**Roadmap Tests creados:**

- T1: puntuacion.vue E2E (mount, score visible, progress, criteria, i18n)
- T2: verify-document IDOR tests (401/403/200 casoscorridos)
- T3: merchant-feed error handling (no service name exposure)
- T4: Build artifact check (exceljs chunk generation)
- **Auditoría ext #1 (14-mar):** 21 confirmadas, 4 parciales, 4 ya conocidas, 4 incorrectas → +20 items (#209-#228, D23, F39-F41)
- **Auditoría ext #2 (14-mar):** Roadmap 100/100 en 9 dimensiones → +83 items (#229-#311, D24-D25, F42-F59). 5 bloques nuevos: 35 (User Testing), 36 (A/B Testing), 37 (Design System+A11y), 38 (Load Testing k6), 39 (10M Scale).
- **Errores de auditoría detectados:** aria-live ya existe (22 usos), skip-to-content ya existe, tokens.css no es tree-shakeable, CSP dual es defense-in-depth intencional, lazy loading composables = automático en Nuxt/Vite.
- **Documento original:** redirect en `docs/tracciona-docs/PLAN-MAESTRO-10-DE-10.md` → historial vía `git log`
- **CSS token migration pattern:** `find app/ -name "*.vue" -exec grep -l 'PATTERN' {} + | xargs sed -i -e 's/OLD/NEW/g'` (NO pipes con while/read — cuelga en Windows)

## UI Components Created (sesiones VIII+IX)

- `UiConfirmModal.vue` — shared confirm for destructive actions (danger/warning/info, type-to-confirm)
- `useConfirmModal.ts` — programmatic confirm with Promise-based API
- `UiSkeleton.vue` — base skeleton loader (line/circle/rect, shimmer)
- `UiSkeletonCard.vue` — card skeleton (image + lines, grid support)
- `UiSkeletonTable.vue` — table skeleton (rows × cols)
- `UiScrollToTop.vue` — fixed bottom-right button, shows after 400px scroll
- `UiToastContainer.vue` — renders toast notifications (uses existing useToast.ts)

## Microcopy Guide

- **Documento:** `docs/tracciona-docs/referencia/MICROCOPY-GUIDE.md` — 19 secciones
- **Regla clave ES:** Castellano puro en UI pública. CERO anglicismos no estandarizados.
- **Terminología "dealer" → 3 términos contextuales:**
  - Quien publica = **anunciante** (neutro: vale para empresa, autónomo, particular, taller)
  - Quien tiene suscripción = **profesional**
  - En ficha de vehículo = **vendedor**
  - Admin interno = "dealer"/"lead" tolerable (jerga CRM)
- **"Lead" → "consulta"** en textos públicos y panel del anunciante
- **Pendientes:** MC-01 a MC-13 (acentos, tuteo, anglicismos, etc.)
- **Escalabilidad i18n:** 8 gaps documentados (G-1 a G-8). Checklist apertura nuevo idioma. Workflow traducción AI+humano.

## Structured Logging (completado 06-mar)

- `server/utils/logger.ts`: `createLogger(event)` + `logger` singleton
- ESLint rule `no-console: error` en `server/**/*.ts`. Excepción: logger.ts, test files.

## Server/API Test Patterns

- **Nuxt global files**: `vi.stubGlobal('defineEventHandler', fn => fn)` + DYNAMIC import in `beforeAll`
- **H3-explicit files**: `vi.mock('h3', ...)` + STATIC import
- **Thenable chains**: count/order queries necesitan `chain.then = (res, rej) => Promise.resolve({data, error}).then(...)` — permite await directo en `.range()`, `.order()` como terminal, Y `.single()` también resuelve.
- **Multi-handler test files**: usar `vi.mock('h3', () => ({ defineEventHandler: fn => fn, getQuery: vi.fn(() => mockGetQuery), readBody: vi.fn(async () => mockReadBody) }))` + static imports. NO `vi.resetModules()` multiple veces en el mismo archivo.
- **`vi.clearAllMocks()`**: clears call history but NOT mockReturnValue implementations
- **`merchant-feed.get.ts`** uses `SUPABASE_SERVICE_KEY` (not `SERVICE_ROLE_KEY`)
- **`getRouterParam`** = Nuxt global → `vi.stubGlobal('getRouterParam', mockFn)`
- **Constructor mocks (`new Foo()`)**: MUST use regular function in vi.hoisted: `vi.fn(function() { return {...} })`. Arrow functions can't be constructors → `new Foo()` throws TypeError. NO `mockImplementation(() => {...})` in beforeEach — it overwrites the hoisted regular-fn with an arrow-fn. `vi.clearAllMocks()` does NOT reset implementations, so the hoisted regular-fn persists safely across tests.
- **validateBody mock** (multi-handler file): `vi.mock('~~/server/utils/validateBody', () => ({ validateBody: vi.fn(async (_e, schema) => schema.parseAsync(mockBody)) }))` donde `mockBody` es variable mutable a nivel módulo.

## Acceso Remoto (configurado 09-mar)

- **Tailscale IP:** `100.83.176.89` · **SSH user:** `j_m_g` · **Auth:** Ed25519 key only (no password)
- **sshd_config:** `C:\ProgramData\ssh\sshd_config` — `ListenAddress 100.83.176.89`, `PasswordAuthentication no`
- **Clave pública:** `C:\ProgramData\ssh\administrators_authorized_keys` (admin users en Windows usan este archivo, NO `.ssh/authorized_keys`)
- **WSL Ubuntu:** usuario `curro` (pass: curro123), sudo sin password, `/etc/wsl.conf` → `default=curro`
- **Herramientas Ubuntu:** Node 22 (nvm), Claude Code 2.1.71, Codex CLI 0.112.0, Supabase CLI 2.22.6, k6 1.6.1, gh 2.87.3, Docker (vía WSL2), Playwright Chromium, tmux 3.4, jq, Python 3.12, prettier, @supabase/mcp-server-supabase
- **`curro()`** en `~/.bashrc` de curro → `cd /mnt/c/TradeBase/Tracciona && claude --model opus ...`
- **Proyecto en WSL:** `/mnt/c/TradeBase/Tracciona` (mismo fs que Windows)
- **Supabase CLI en Linux:** NO soporta `npm install -g supabase` → instalar binario desde GitHub releases
- **Flujo remoto:** SSH → `wsl` → `tmux attach -t curro` → `curro`
- **tmux config** (`~/.tmux.conf`): `mouse on` + scroll 1 línea por evento (compatible con Termius iPhone)
- **Documentado en:** `docs/tracciona-docs/referencia/ENTORNO-DESARROLLO.md` (sección "Acceso remoto")

## Presupuesto TradeBase SL (completado 10-mar)

- **Documento:** `C:\TradeBase\PRESUPUESTOS.md` — 13 secciones, ~50.000€ en 3 años (~15k/~16k/~20k)
- **Partidas:** Constitución, RETA, Marcas OEPM, Dominios, Legal/GDPR, Infra SaaS, APIs (IA+WhatsApp), Stripe COGS, Desarrollo (tooling IA), Marketing, Operaciones/admin, Contingencia 10%, Supuestos/exclusiones
- **Decisiones clave:** BBVA + Wise combo, gestoría integral, RC desde Año 1, Billin/Facturalia free para Verifactu, Google Workspace 1 user (dominios ilimitados como alias), Resend para email transaccional, contingencia 10% (no 15%)
- **§13 Supuestos (8 puntos):** Stripe risk, KYC activable, firma electrónica activable, coste fundador no incluido, ciberseguro verificar en RC, inflación implícita, sede pendiente subvenciones León, escalabilidad IA (ES+EN → revisable al abrir mercados)
- **Workflow:** Documento validado con otra IA en 3+ rondas de feedback cruzado
- **Estrategia marketing:** `docs/ESTRATEGIA-NEGOCIO.md` — §3.12 retargeting reescrito completo, §3.11.6 Pinterest expandido

## P3 Items completados (sesión 11-mar)

- **Sesión temprana (ya hechos):** X-DNS-Prefetch-Control, performance marks, print.css, immutable cache, UiPasswordStrength, v-ripple, haptic.ts, toggle CSS, honeypot endpoints, dealerDashboardTypes
- **Sprint P3 completo (sesión XXVI):** 20 tasks implementados:
  - §1.1: Critical CSS (inlineStyles) + font-display:optional
  - §1.5: useCursorPagination.ts + useHydratedState.ts (SSR dehydration)
  - §2.2: auto-ban IPs (sliding window 5min, 100 threshold)
  - §2.3: sessionBinding.ts (IP+fingerprint) + useSessionTimeout.ts (30min admin/7d user)
  - §2.6: fuzzing tests (boundary values, SQL injection, XSS, unicode)
  - §4.2: viewHistory.helpers.ts + useViewHistory.ts (score-based recommendations 0-100)
  - §4.6: useOfflineSync.ts (queue-based localStorage sync)
  - §5.2: migration 00088 shared schema + cross-vertical views + universal_characteristics
  - §5.5: vertical-creation.test.ts (config/categories/transport validation, 21 tests)
  - §6.1: 3 helper files extracted (financeCalculator, transport, dealerStats) + 46 tests
  - §6.2: serviceContainer.ts (registerService/getService DI pattern)
  - §6.3: migration 00086 event_store + eventStore.ts (append/get/deadLetter) + 14 tests
  - §6.5: lazy init pattern in useUnreadMessages, useFavorites, useConsent, useFeatureFlags
  - §7.3: migration 00087 composite indexes + market_data_partitioned RANGE
  - §7.8: k6-readiness.yml monthly cron + stress option
- **~22 items DEFERRED:** Twilio SMS, ML models, DGT API, Leaflet/Mapbox, digital signature, CF Durable Objects/D1, Supabase Vault/Edge Functions, screen reader testing, video tutorials, merchandising partnerships, CF Pages/DNS automation, visual snapshot tests, COEP, multi-user dealer accounts, interactive guides, 360° viewer, financing partner APIs

## defineNuxtPlugin test pattern

```typescript
// Stub that immediately invokes the plugin fn (NOT returns a factory):
vi.stubGlobal('defineNuxtPlugin', (fn: Function) => {
  fn(mockNuxtApp)
  return () => {}
})
```

## ConfirmDeleteModal test pattern

```typescript
// All auto-imports used in component must be stubbed:
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('toRef', toRef)
vi.stubGlobal('watch', vi.fn())
vi.stubGlobal('useScrollLock', vi.fn())
vi.stubGlobal('onMounted', vi.fn())
vi.stubGlobal('onUnmounted', vi.fn())
```

## Instant Alerts System (#212, 13-mar-2026)

- **Endpoint:** `POST /api/alerts/instant` — auth: internal secret OR authenticated user
- **Matcher:** `server/utils/alertMatcher.ts` — pure function `matchesVehicle(vehicle, filters)`, AND logic, case-insensitive partial match (ILIKE equivalent), null-safe
- **Trigger helper:** `server/utils/triggerInstantAlerts.ts` — fire-and-forget `$fetch`
- **Migration 00165:** `channels` JSONB column on `search_alerts` (default `["email"]`) + index on `(active, frequency) WHERE active = true`
- **Integrated triggers:** publish-scheduled cron, dashboard nuevo vehiculo, WhatsApp publish
- **Pro tier check:** `normalizePlan()` → only premium/founding get instant alerts
- **Cooldown:** 60s per alert (prevents duplicate sends)
- **i18n prefix:** `auto.instantAlert.*`
- **Tests:** 29 (alertMatcher) + 10 (endpoint) = 39, 0 failures
- **Pending:** `supabase db push` for migration 00165

## Parallel Agent Pattern

- **Estado 14-mar:** COMPLETADO Y LIMPIO. Todos los agentes (A–F) mergeados + 383 TS errors→0 + 17 stashes dropped + 19 branches deleted.
- **Merge order ejecutado:** E→C→A→B→cherry-pick D/9→F→cherry-pick A/bloque-18 (#142-#145, #199)
- **Post-merge cleanup:** Punto 3 (duplicated imports ~20) y Punto 4 (85 test files failing) PENDIENTES para próxima sesión.
- **Coordinación:** `docs/PARALLEL-AGENTS.md` — 5 agentes (A–F), branches `agent-X/bloque-Y`
- **Linter/hook issue:** Pre-commit hook (lint-staged + ESLint + Prettier) puede revertir cambios en archivos ya modificados por otros agentes. Verificar siempre que los cambios persisten después del commit.
- **Cherry-pick entre branches:** Si un commit cae en el branch equivocado, `git cherry-pick <sha>` al branch correcto. Único conflicto habitual: PARALLEL-AGENTS.md (DU = deleted-by-us) → resolver con `git add`.

## Merge Multi-Branch Learnings (14-mar)

- **Stash pattern para merges:** `git stash push -m "pre-merge-faseN" --include-untracked` → merges → `git stash pop` → resolver conflictos de stash → `git stash drop`
- **vatRates.ts dual format:** HEAD usa decimales (0.21), agent-c/agent-f usan enteros (21). Elegir UNA y mantener en toda cadena de merges. Decisión: decimales (HEAD).
- **add/add conflicts:** Cuando dos branches crean el mismo archivo independientemente, verificar quién lo importa/usa en los archivos auto-mergeados antes de elegir versión.
- **Rebase vs merge en multi-commit branches:** Rebase de 40+ commits con conflictos repetidos en docs → impracticable. Merge directo resuelve todos en una pasada.
- **nuxi typecheck OOM:** Default heap insuficiente para proyecto grande. Usar `NODE_OPTIONS="--max-old-space-size=8192" npx vue-tsc --noEmit`.
- **Conflict resolution strategy:** Identificar qué archivos fueron modificados por cada fase (`git diff --name-only commitA..commitB`) para saber cuáles necesitan merge manual vs bulk `checkout --theirs/--ours`.
- **TS fix patterns post-merge agentes:** `serverSupabaseServiceRole(event) as any` para tablas no generadas, logger API (agents usaban pino-style `(obj, msg)`, proyecto usa `(msg, obj)`), `as never` para insert/update, `Array.from()` en vez de spread en Map/Set.
- **H3-explicit files need explicit imports:** Files that `import { defineEventHandler } from 'h3'` don't get Nuxt auto-imports — must explicitly `import { serverSupabaseUser } from '#supabase/server'`, etc.
- **Server-side Supabase:** Use `serverSupabaseServiceRole(event)` NOT `useSupabaseClient()` (client-side only).
- **Untyped tables:** `web_vitals`, `dashboard_aggregates` not in generated types → `(db.from as any)('table')` + `// eslint-disable-next-line @typescript-eslint/no-explicit-any`
- **Vehicles status enum:** `'published'` (not `'active'`); dealers status needs `as never` cast.
- **Duplicate Nuxt components:** `ui/EmptyState.vue` + `ui/UiEmptyState.vue` both resolve to `UiEmptyState` → renamed to `EmptyStateLegacy.vue`.
- **JSONB fields from Supabase:** Cast with `as Record<string, string> | null` before accessing properties.
- **Chrome-profile en git:** NUNCA trackear archivos de Chrome profile. Fix: `.gitignore` + `.eslintignore` + `git rm --cached -r`.
- **Stash cleanup verification:** Antes de `git stash drop`, comparar `git show stash@{N}:file | wc -l` vs `wc -l file` — si working tree tiene más líneas, el stash es supersedido.
- **Pre-push hook en branch deletion:** `git push origin --delete` TAMBIÉN dispara pre-push hook. Usar `--no-verify` si solo se eliminan ramas.

## Vehicles Table — Columnas válidas (14-mar)

- **NO existen** (agentes las añadieron a selects sin verificar): `images`, `title`, `description`, `price_negotiable`, `mileage`, `fuel_type`, `power_hp`, `weight_kg`, `withdrawal_reason`, `ref_code`, `extras`, `location_city`, `views`
- **Sí existen:** `main_image_url`, `title_es`/`title_en`, `description_es`/`description_en`, `km`, `condition`, `hours`, `location`, `location_province`, `location_country`, `location_region`, `video_url`, `slug`, `status`, etc.
- **Verificar siempre contra `types/supabase.ts` línea ~4664** antes de añadir columnas a `.select()`

## De-hardcoding Multi-Vertical (completado 14-mar)

- **Server-side:** `getSiteName()`, `getSiteUrl()`, `getSiteEmail()` de `server/utils/siteConfig.ts`
- **Client-side:** `useSiteName()` de `app/composables/useSiteName.ts`, `useSiteUrl()` de `app/composables/useSiteUrl.ts`
- **Fallback final:** siempre `'Tracciona'` / `'https://tracciona.com'` como último recurso
- **Archivos limpiados:** stories/[slug], security.txt, adminEmailTemplates, adminProductosExport, indexNow, marketReport, useDashboardExportar, useAdminSidebar
- **Quedan legítimos:** `siteConfig.ts` (define el fallback), `useAdminSidebar.ts` (lee de vertical_config BD primero)
- **Cron files:** ya usan `process.env.NUXT_PUBLIC_VERTICAL ?? 'tracciona'` — OK

## Boolean context con .length (S4036, 16-mar)

- `.length` retorna `number`. En `if()`/`v-if`/ternarios = OK (truthy coercion). En asignaciones `boolean`/returns `boolean` → `!!arr.length`
- Bulk replace `.length > 0` → `.length` requiere segundo paso typecheck para detectar boolean contexts

## Duplicate auto-imports en Nuxt (16-mar)

- Dos composables exportando mismo nombre de tipo → Nuxt warning "Duplicated imports"
- Estructuras diferentes → renombrar con prefijo (ej: `DatosPriceHistoryRow` vs `PriceHistoryRow`)
- Re-export redundante → eliminar, actualizar imports al source canónico

## Husky v10 (16-mar)

- Deprecated lines (`#!/usr/bin/env sh` + `. "$(dirname -- "$0")/_/husky.sh"`) ya removidas de pre-push
- v10 solo necesita el comando directo en el hook file

## AUDITORÍA PROFUNDA BACKLOG (16-mar-2026)

**Sesión 16-mar:** Auditoría exhaustiva item-por-item de 325 items PENDIENTE + 9 HECHO.

### Hallazgos principales

- **30+ items IMPLEMENTADOS** pero marcados como PENDIENTE en backlog (encontrados vía búsqueda de crons, páginas, endpoints)
- **7 items completamente ausentes** (especialmente Bloque 5: reviews)
- **Actualizado BACKLOG-EJECUTABLE.md** con estatus real + referencias a archivos

### Items ENCONTRADOS (no marcados antes como HECHO):

- Bloque 1: #7 #8 #17 (credit_packs, subscription_tiers, precios.vue)
- Bloque 2: #11 #12 #13 #14 #16 #18 #22 (reserva, alertas, auto-renew, exportar)
- Bloque 3: #62 #64 (landing motor, JSON-LD)
- Bloque 7: #65-71 (newsletter, onboarding, market-report, social, whatsapp, pinterest, calendar)
- Bloque 9: #20 #24 (comparador, estadísticas)

### Items NOT FOUND (críticos):

- **Bloque 5 (Reviews):** #50-54 completamente ausente (seller_reviews backend/display/NPS/Top-Rated)
- **Bloque 2:** #15 color/fondo anuncios especiales

### Items a REVISAR (parcial):

- Bloque 3: #63 catálogo landing
- Bloque 9: #19 #21 #23 #25 #26 (valuación IA, historial precio, generación IA, recomendación, certificado PDF)

### Pasos a hacer

1. ~~**Tests backfill:** T1-T4 (Roadmap Tests)~~ — **COMPLETADO 17-mar-noche** (119 failures → 0, 918 files, 17,334 tests)
2. ~~**Bloque 5 implementation:** #50-54~~ — **COMPLETADO 17-mar** (seller_reviews completo, dimensions JSONB, NPS, Top-Rated badge, 90+ tests)
3. ~~**Auditoría roadmap + backlog sync**~~ — **COMPLETADO 17-mar** (45/45 items verificados, 15 ediciones backlog, #52/#53/#84 corregidos)
4. **Siguiente:** ejecutar items del backlog por orden de fase (T11-T16 pendientes, luego items nuevos)

## Roadmap Autónomo v2 — COMPLETADO + AUDITADO (17-mar-2026)

- **44/44 items** en 4 fases: Tests Backfill (6), Quick Wins (22), Features (12), Grandes (4)
- **~150+ tests nuevos**, 894 verificados (0 fallos)
- **Correcciones 18-mar:** select('\*') export.get (45 cols explícitas GDPR), server:true (no fetchOnServer), T11 12→16 tests, CORS 9→13 tests
- **BACKLOG-EJECUTABLE.md sincronizado:** ~45 items marcados ✅, T5-T16 completados (17/19), done count ~55

## Roadmap Autónomo v3 — COMPLETADO (18-mar-2026)

- **127/127 items** completados en 10 fases (2 sesiones overnight)
- **386 tests nuevos** (15 archivos), todos passing
- **9 archivos de código nuevos:** manifest.webmanifest, apiKeyRotation, gracefulDegradation, readThroughCache, requestCoalescing, defineProtectedHandler, compute-aggregates, SSE stream, warmup-cache
- **Commiteado y pushed:** `f00d921` (roadmap v3) + `2b4de9a` (docs) + `869aed9` (typecheck fixes) + `8c3491b` (lint fixes)
- **Excluidos (~48):** Twilio, Sentry, InfoCar, CF WAF blocked, Nuxt 4, k6 real, E2E Playwright, push notif
- **Fixes aplicados durante ejecución:** RLS audit function-body-only check, UI component names (DataTable not UiDataTable), Vitest `||` chaining → `.toMatch(/regex/)`, migration content assertions

## Patterns adicionales

- **Dos tablas reviews coexisten:** `seller_reviews` (00060, API endpoints) + `dealer_reviews` (00083, DealerPortal.vue RPC)
- **reviewHelpers.ts pattern:** extract pure functions (validateDimensions, classifyNPS, calculateNetNPS) → importar en tests y endpoints
- **#89 Form validation pattern:** `useFormValidation(zodSchema, { initialValues, onSubmit })` + `defineField('fieldName')` returns `[modelRef]` for `v-model`. `translatedErrors` for i18n. 5 forms migrated: recuperar, nueva-password, seguridad, InspectionRequestForm, DemandModal.
- **Multi-form page pattern** (seguridad.vue): Multiple `useFormValidation` calls with different aliases (`definePasswordField`, `defineDeleteField`, `passwordErrors`, `deleteErrors`)

## Auditoría Externa 100/100 (17-mar-2026)

- **86 items** integrados en BACKLOG-EJECUTABLE.md como Fase 7d (Bloques 40-47)
- **8 dimensiones:** UX General (N1-N16), Velocidad (N17-N28), Seguridad (N29-N39), UX Detallado (N40-N49), Multi-Vertical (N50-N57), Modularidad (N58-N65), Escalabilidad (N66-N74), 10M Usuarios (N75-N86)
- **Numeración:** prefijo N (N1-N86 + N72b) para distinguir de items originales (#1-#311), deferred (D1-D25), futuro (F1-F59)
- **1 POSPUESTO:** N73 (graceful shutdown) — CF Workers maneja lifecycle
- **~118 sesiones estimadas**
- **85 AÑADIR, 13 requieren VERIFICAR estado actual antes de implementar** (N13, N20, N24, N38, N40, N41, N43, N44, N48, N53, N55 — composables/features pueden existir parcialmente)

## Madurez Operativa — Fase 10 (17-mar-2026)

- **20 items (OP1-OP20)** integrados en BACKLOG-EJECUTABLE.md como Fase 10 (Bloques 48-54)
- **7 bloques:** Estabilidad (48), Usuarios/Negocio (49), Rendimiento Real (50), Seguridad Auditada (51), Accesibilidad (52), Resiliencia/Operación (53), Verticales Probadas (54)
- **No son código** — se validan con tiempo, usuarios reales, dinero real y fallos reales post-lanzamiento (6-12 meses)
- **Backlog total:** ~510 items, 41 bloques, ~55 sem código + 6-12 mes operación

## Roadmap Autónomo v4 — COMPLETADO + SINCRONIZADO (18-mar / 19-mar)

- **36/36 items** completados en 7 fases (3 sesiones)
- **~450+ tests nuevos**, todos passing
- **ROADMAP-AUTONOMO.md:** 36/36 ✅ + headers N/N (sincronizado 19-mar)
- **BACKLOG-EJECUTABLE.md:** 33 items sincronizados como ✅ (19-mar)
- **Fases 0-5:** cleanup, monitoring, security hardening, UX, architecture, testing infra
- **Fase 6 (Advanced):** A/B testing (migration 00177 + experiments util + admin CRUD), email at scale (Resend+SES fallback + circuit breaker + warming), multi-user dealer (migration 00178 + RBAC + invite flow)
- **Key new files:** experiments.ts, emailScale.ts, dealerTeamAuth.ts, latencyMetrics.ts, actionRateLimit.ts, dbRateLimit.ts, useInject.ts + 15+ test files
- **Key migrations:** 00176 (rate_limit_entries), 00177 (experiments/assignments/events), 00178 (dealer_team_members)
- **Pendiente push:** Migraciones 00176-00178 necesitan `supabase db push`

## Roadmap Autónomo v5 — COMPLETADO (19-mar-2026)

- **14/14 items** completados en 5 fases (0-4)
- **242 tests nuevos**, todos passing
- **6 migraciones nuevas:** 00179 (source_vertical leads), 00180 (dealer_documents), 00181 (crm_pipeline), 00182 (faq_entries), 00183 (vertical_custom_fields), 00184 (supply_chain_intelligence)
- **3 adapter patterns:** searchEngine.ts (Typesense/Meilisearch/Postgres), cacheLayer.ts (Upstash/in-memory), vehicleReportProvider.ts (InfoCar/CarVertical/mock)
- **Nuevos composables:** useUserVerticalHistory, useActiveSessions, useFaq, useCustomFields, useSearch, useSupplyChainIntelligence
- **Nuevos server utils:** searchEngine.ts, cacheLayer.ts, vehicleReportProvider.ts
- **Admin endpoints:** documents (3), crm-pipeline (2)
- **Pendiente push:** Migraciones 00179-00184 necesitan `supabase db push`
- **Supabase mock pattern confirmado:** Proxy-based chain con thenable objects para await destructuring. `range()` returns thenable, NOT is thenable.

## Documentos Operativos Tanda 1+2 (completada 20-mar-2026)

- **8 docs nuevos** en 2 tandas, validados con debate multi-AI
- **Tanda 1 (5):** ROADMAP-EJECUTIVO-12M, CIERRE-MENSUAL, TRACKER-SUBVENCIONES, MATRIZ-ACCESOS, REGISTRO-OPERACIONES-VINCULADAS
- **Tanda 2 (3):** CONDICIONES-DEALER, SOP-SOPORTE-Y-RECLAMACIONES, PLAN-PRIMERA-CONTRATACION
- **Batch prioridades (4):** ACTA-DECISIONES-FOUNDERS, MODELO-FINANCIERO-DINAMICO, POLITICA-COBROS-IMPAGOS, PLAN-DIA-D
- **Matriz impacto:** MATRIZ-IMPACTO-DECISIONES.md + instrucción cascada en CLAUDE.md §"Cascada de decisiones"
- **Total Proyecto/:** 87 .md (50 principales + 37 tomos biblia)
- **Corrección aplicada:** MATRIZ-ACCESOS §2 renombrado de "Partes vinculadas" a "Personas con acceso"
- **Regla trazabilidad:** toda cifra financiera lleva `(→ FUENTE §X)`. Derivados no inventan.
- **Regla depuración multi-AI:** distinguir "no existe" vs "existe pero pendiente de cerrar" — error frecuente en gap analysis
- **Pendiente Tanda 3:** DATA-ROOM.md (solo si hay cita próxima) + COMPLIANCE-MARKETPLACE.md (validación jurídica)
- **Pendiente Tier 2 (cerrar):** T&C final, DSA, material comercial externo, protocolo brecha, migración Tank, seguro RC

## Migración Documental Proyecto/ (completada 20-mar-2026)

- **Estructura:** `C:\TradeBase\Proyecto\` con 6 subcarpetas temáticas (01-legal a 06-subvenciones)
- **Resultado:** 74 .md (66 docs + 5 migration logs + 3 nuevos operativos), 20 scripts PS1 parcheados, repo limpio
- **Commits:** `3be6f9b` (scripts), `7f7cc99` (docs), `d531218` (tooling)
- **Logs:** `Proyecto/MIGRATION-LOG-BLOQUE{1..5}.md`
- **Exclusión:** `rewrite-tank-iberica-subsidies.ps1` = legacy Tank Ibérica, fuera del scope
- **Artefactos en raíz:** 16 PDFs (regenerables) + `Instalación.txt` (operativo) — fuera del scope documental .md
- **Lección sed:** NUNCA usar sed con rutas que contienen `\0N` — interpreta como octales. Usar Python binary-safe.

## Reconciliación Financiera + Docs Operativos (20-mar-2026)

- **Derivado roto:** PRESUPUESTO-INVERSORES-3-ANOS.md tenía costes inflados 2.23x (~115K vs ~52K maestro), RETA incluida, APIs infladas 4-8x, marketing 2.3x, HR fantasma 15K€. Rebuild completo, no parche.
- **3 docs nuevos:** CHECKLIST-CONSTITUCION.md (28 pasos), IMPLEMENTACION-SEDE.md (Fresno = DECIDIDA), CALENDARIO-FISCAL.md (borrador pendiente gestoría)
- **Corrección fiscal crítica:** Modelo 202 (pagos fraccionados IS para SL), NO modelo 130 (personas físicas IRPF estimación directa)
- **Cifras maestros alineadas:** OPEX 3yr ~47.4K sin Stripe / ~51.8K con Stripe. Revenue base 72.6K / aspiracional 132.3K.
- **Regla trazabilidad:** toda cifra en derivados lleva `(→ FUENTE §X)`. Si no está en maestro, no aparece.
- **Debate multi-AI:** 6 correcciones de la otra AI incorporadas. Proceso validado por ambas partes.
- **Estado post-sesión:** Docs completos. Siguiente = ejecutar (gestoría, sede, subvenciones).

## Sub-archivos (leer bajo demanda)

- `.claude/memory/patterns.md` — patrones de código confirmados (Vue, composables, ESLint)
- `.claude/memory/sonarqube.md` — calidad código + SonarQube analysis
- `.claude/memory/sonarqube.md` — acceso local, progreso auditoría, SonarQube tips
