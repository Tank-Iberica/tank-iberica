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

- Nuxt 3 + Supabase + Cloudflare Pages + Stripe + Cloudinary/CF Images + Resend + WhatsApp Meta Cloud API
- Supabase Project ID: gmnrfuzekbwyzkgsaftv
- Supabase URL: https://gmnrfuzekbwyzkgsaftv.supabase.co
- Supabase Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtbnJmdXpla2J3eXprZ3NhZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MDkxMTUsImV4cCI6MjA4NTQ4NTExNX0.zN8JWkQvkzlFHXFunaanpJr391mHUVdViBbTmTkm3Qw
- Branch: `main` · Deploy: Cloudflare Pages

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
- **Suite completa (09-mar)**: 747 archivos, 0 fallos. Coverage: 73.67% statements.

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
- **SonarQube:** 0 bugs, 0 vulns, 0 smells, 0 hotspots. Coverage: 73.67%. Script YA incluye vitest+lcov fix automáticamente. localhost:9000.
- **Actual: ~74.8% statements (vitest) / 72.7% (SonarQube). 747 archivos test, 13,862 tests, 0 fallos (09-mar)**
- **SonarQube Quality Gate: OK** — 0 bugs, 0 vulns, 0 smells, 0 hotspots (09-mar)
- **Lo crítico CUBIERTO:** stripe webhook ~95%, search-alerts 100%, founding-expiry 99%, useAuction 99%, useReservation 100%, useAuth ~95%, useConversation ~95%, valuation.get 100%, execute-migration 100%
- **Pendiente (no urgente):** componentes Vue y páginas — posponer hasta feature freeze
- **Patrón componentes Vue:** shallowMount + `$t: (k) => k` mock + vi.stubGlobal para Nuxt auto-imports + vi.mock para explicit imports. Restaurar Vue reactivity reales (ref, computed, watch) con vi.stubGlobal para que template funcione.
- **Fix común tests:** `setResponseHeader: vi.fn()` en mock de h3; $t retorna i18n key, no texto traducido; `createError` de h3 también necesita mock cuando se usa `validateBody`
- **`vi.stubGlobal` leak entre describe blocks**: stubs a nivel de `it()` persisten en tests posteriores. Siempre re-stubear en `beforeEach` del describe. Ejemplo: api-stripe.test.ts — checkout-credits re-stubeaba `useRuntimeConfig` sin `cronSecret`, afectando webhook tests.

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

## Plan 10/10 (25/27 COMPLETADO)

- **Plan movido a:** `docs/legacy/PLAN-10-DE-10.md`
- **Pendientes (fundadores):** F0.3 (CF WAF dashboard), F5.1 (SonarQube scan con token)
- **SLOs:** p95 <100ms cache hit, <300ms cache miss, error rate <0.5%, 0 P0/P1, bundle público ≤200KB

## Plan Maestro 10/10

- **Documento:** `docs/tracciona-docs/PLAN-MAESTRO-10-DE-10.md` — ~280 items accionables
- **Evaluación 7 dimensiones:** Velocidad 7.5, Seguridad 8, UX 8.5, Experiencia 9, Verticals 8, Modulabilidad 8.5, Escalabilidad 6.5
- **Fases:** F0 pre-launch → F1 mes 1 → F2 meses 2-3 → F3 meses 4-6 → F4 6+ meses
- **Completados (sesiones VIII+IX):** ~25 items P0/P1/P2 ejecutados — MC-01/02/13, Permissions-Policy, body limits, login rate limiting, px→rem, focus-visible, aria-current, hardcoded colors→tokens, Cache-Control, border-radius/shadow→tokens, dvh, Toast, useUnsavedChanges, validateBody, breadcrumbs, UiConfirmModal, Skeleton system, ScrollToTop, utility classes, fluid typography, safe area insets, preconnect, aria-busy, decoding=async, hardcoded refs test
- **Completados (sesión XV — 09-mar):** border-radius tokens (122 archivos, 0 hardcoded px) · breadcrumbs /perfil (11 páginas) · spacing tokens gap (683→0) + padding (~1076→~29) + margin (~539→~22) = ~97% migración
- **Completados (sesión XVI — 10-mar):** Colores hex→CSS vars (1777→412, 77%; 13 nuevos tokens) · Login rate limiting→localStorage (survives refresh, i18n) · Lighthouse CI (90% threshold, CWV budget, a11y) · aria-expanded/aria-controls (5 componentes) · 404 page SVG illustration · Zod validation (checkout+checkout-credits+portal+email/send)
- **Progress:** P0 (1/1 ✓) + P1 (~45 done) + P2 (~95 done) + P3 (~40 done, ~22 DEFERRED) = ~180 de ~280 items = ~64% completado
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

- **Gestión memoria:** Sección en PARALLEL-AGENTS.md — kill Node entre items, máx 1 dev server, heap 512MB, vitest run (no watch), agente pasivo = 0 procesos
- **Coordinación:** `docs/PARALLEL-AGENTS.md` — 5 agentes (A–F), branches `agent-X/bloque-Y`
- **Agente A:** branch `agent-a/bloque-0` · i18n: `credits.`, `tiers.`, `monetization.` · Migrations: 00115–00124 · Bloque 0 (Errores) · **#2 ✅, #3 ✅ completados · siguiente: #4**
- **Agente C:** branch `agent-c/bloque-6b` · i18n: `trust.`, `security.`, `data.capture.` · Migrations: 00135–00144 · **Bloques 4,5,6a,6b,13 ✅ · #38 #39 #40 #72 completados · siguiente: #159** · Migration 00135 pendiente `supabase db push`
- **Agente D:** branch `agent-d/bloque-7` · i18n: `dealer.`, `newsletter.`, `lifecycle.`, `audit.` · Migrations: 00145–00154 · Bloque 7 (Content+Marketing #65–#71) · **#65 ✅ completado**
- **Linter/hook issue:** Pre-commit hook (lint-staged + ESLint + Prettier) puede revertir cambios en archivos ya modificados por otros agentes. Verificar siempre que los cambios persisten después del commit.
- **git index.lock:** En Windows con múltiples agentes, `rm .git/index.lock` puede ser necesario entre commits rápidos
- **Cherry-pick entre branches:** Si un commit cae en el branch equivocado, `git cherry-pick <sha>` al branch correcto. Único conflicto habitual: PARALLEL-AGENTS.md (DU = deleted-by-us) → resolverel con `git add` del archivo para mantenerlo.
- **Autonomía**: usuario autoriza trabajo autónomo sin pedir confirmación por cada item. Solo detenerse ante bloqueos reales que requieran decisión humana.
## Sub-archivos (leer bajo demanda)

- `.claude/memory/patterns.md` — patrones de código confirmados (Vue, composables, ESLint)
- `.claude/memory/sonarqube.md` — acceso local, progreso auditoría, SonarQube tips
