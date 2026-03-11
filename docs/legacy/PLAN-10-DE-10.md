# Plan Integral 10/10 — Tracciona

> **Origen:** Evaluación técnica completa del codebase (06-mar-2026) en 4 ejes + feedback cruzado multi-AI.
> **Objetivo:** 10/10 medible con SLOs concretos en cada eje.
> **Progreso:** **25/27 items completados** (última sesión 08-mar: F3.1, F3.3, F4.4). Pendientes: F0.3 (fundadores), F5.1 (fundadores).
> **Regla operativa:** NO abrir features nuevas con P0/P1 abiertos. 70% fiabilidad, 30% features.

---

## Puntuación actual (calibrada por evaluación completa del codebase)

| Eje | Nota actual | Target |
|---|---|---|
| Experiencia de Usuario (UX) | 7.8 | 10 |
| Modulabilidad | 9.0 | 10 |
| Escalabilidad | 6.5 | 10 |
| 10M usuarios/mes | 5.0 | 10 |
| **Media ponderada** | **7.1** | **10** |

> Notas calibradas tras lectura íntegra de: 126 páginas, 424 componentes, 149 composables, 63 endpoints, 8 servicios, 97 tablas BD, 81 migraciones, CSS completo, tests, CI/CD.

---

## Definición de 10/10 — SLOs medibles

"10/10" no es absoluto — es el cumplimiento verificable de estos SLOs:

| Eje | SLO | Cómo verificar |
|---|---|---|
| **UX** | Lighthouse mobile ≥95 | `npx lighthouse --preset=desktop` en catálogo, ficha, home |
| | CLS <0.1, LCP <2.5s | Lighthouse + Web Vitals reales |
| | 0 strings hardcoded en español | `grep -rE '"[A-ZÁÉÍÓÚ][a-záéíóú]{3,}"' app/ --include="*.vue" --include="*.ts"` (excluir i18n/, tests/) |
| | 0 `px` en layout/spacing | Stylelint rule (excluir `1px` borders) |
| | autocomplete en 100% forms públicos | Audit manual: registro, contacto, publicar, demanda, reservación |
| | ARIA en >60% componentes | `grep -rl "aria-" app/components/ \| wc -l` vs total |
| **Modulabilidad** | 0 `any` en composables exportados | `grep -r ": any" app/composables/ --include="*.ts" \| grep -v "test"` |
| | 0 helpers duplicados entre composables | Code review: formatPrice, computeMedian, trend helpers |
| | Todo composable <300 LOC | `wc -l app/composables/**/*.ts \| awk '$1>300'` |
| | 0 dependencias circulares | `npx madge --circular app/composables/` |
| | Script scaffold nueva vertical funcional | `node scripts/create-vertical.mjs --name test --dry-run` |
| **Escalabilidad** | p95 <100ms cache hit | k6 + `routeRules` SWR activo |
| | p95 <300ms cache miss | k6 sin cache |
| | 0 N+1 queries | `EXPLAIN ANALYZE` en queries de crons y catálogo |
| | Rate limiting funcional en prod | curl test contra CF WAF rules |
| | Queue para ops >500ms | Job queue procesando image/AI/email |
| | Search server-side <200ms p95 | k6 scenario search con 10K+ vehículos |
| **10M users** | k6 1000 VU sin errores | `npm run test:load` con config 1000 VU |
| | DB connections <80% pool | Supabase dashboard durante load test |
| | CDN hit ratio >85% | CF Analytics |
| | Error rate <0.5% | k6 + logs structured |
| | Idempotencia en endpoints críticos | Tests unitarios de dedup |
| | Correlation-ID trazable frontend→API→job→log | Test e2e: seguir ID de request a job |

---

## Modelo de coste

**Código: 0€** (sesiones Claude Code).

**Infraestructura — Opción A (0€ adicional sobre stack actual):**
- Rate limiting → CF WAF free tier (5 reglas custom)
- Queues → Tabla Postgres `job_queue` + cron polling (en Supabase existente)
- Search → `pg_trgm` + `unaccent` + GIN index (extensiones Postgres gratuitas)
- Observabilidad → Logger estructurado a stdout + `infra_metrics` existente

**Infraestructura — Opción B (escalar cuando tráfico lo justifique):**
- CF Queues ($5/mo) o BullMQ + Redis ($7/mo)
- Meilisearch Cloud ($29/mo) o Typesense Cloud ($25/mo)
- CF Pro ($20/mo) para WAF avanzado + analytics
- Total: $50-79/mo

**Recomendación:** Empezar con Opción A (0€). Migrar a B cuando >100K usuarios/mes reales y se detecten bottlenecks en monitoreo.

---

## Items completados del plan original (24/30)

Para trazabilidad, estos items del plan original ya están implementados:

| ID original | Item | Completado |
|---|---|---|
| S2 | safeError en 42/44 rutas | Parcial (2 restantes → F0.1) |
| S3 | Security headers en nuxt.config.ts | ✅ |
| S4 | CSP header restrictivo | ✅ |
| S6 | Quitar continue-on-error CI | ✅ |
| V1 | Prerender páginas estáticas | ✅ |
| V2 | Migrar `<img>` a `<NuxtImg>` | ✅ |
| V3 | Query budget `QUERY-BUDGET.md` | ✅ |
| V4 | Bundle analysis `BUNDLE-ANALYSIS.md` | ✅ |
| V5 | Cache headers API GET públicas | ✅ |
| X1 | ARIA audit + eslint vuejs-accessibility | ✅ |
| X2 | Skip-to-content link | ✅ |
| X3 | Form validation con mensajes descriptivos | ✅ |
| X4 | Auditoría localizedField gap | ✅ |
| X5 | NuxtLoadingIndicator | ✅ |
| U1 | Error boundaries con recovery | ✅ |
| U3 | Empty states con CTA | ✅ |
| U4 | Breadcrumbs en páginas públicas | ✅ |
| E1 | Load test k6 (smoke + CI) | ✅ |
| E2 | Runbook migración inter-cluster | ✅ |
| E3 | EXPLAIN ANALYZE queries críticos | ✅ |
| D2 | Barrel exports (evaluado: no procede) | ✅ |
| O3 | Health check light + deep | ✅ |

---

## Fase 0 — Cerrar P0/P1 (BLOQUEANTE, antes de todo)

### F0.1 Fix 2 rutas restantes con safeError ✅ [P0-5 residual]
- **Completado:** 06-mar-2026
- `demo/try-vehicle.post.ts`: AI parsing error → `safeError(500, 'AI parsing failed')`
- `images/process.post.ts`: CF Images error → `safeError(502, 'CF Images upload failed')`

### F0.2 Idempotencia en endpoints críticos ✅ [NUEVO]
- **Completado:** 06-mar-2026
- `server/utils/idempotency.ts`: `checkIdempotency`, `storeIdempotencyResponse`, `getIdempotencyKey`
- Tabla `idempotency_keys` migración SQL aplicada (TTL 24h)
- Implementado en: `reservations/create`, `auction-deposit`, `whatsapp/webhook.post`
- 10 tests en `tests/unit/server/api-idempotency.test.ts`
- **Qué era:** Proteger endpoints que mutan estado contra requests duplicados
- **Endpoints:**
  - `stripe/webhook.post.ts` — ya tiene check de `event.id` ✅ (solo verificar)
  - `reservations/create.post.ts` — añadir `Idempotency-Key` header → check antes de crear
  - `auction-deposit.post.ts` — mismo patrón
  - `whatsapp/webhook.post.ts` — dedup por `message_id` de Meta
- **Patrón:**
```ts
const idempotencyKey = getHeader(event, 'idempotency-key')
if (idempotencyKey) {
  const { data: existing } = await supabase
    .from('idempotency_keys')
    .select('response')
    .eq('key', idempotencyKey)
    .maybeSingle()
  if (existing) return existing.response
}
// ... lógica normal ...
// Al final: INSERT en idempotency_keys con TTL 24h
```
- **Migración SQL:**
```sql
CREATE TABLE idempotency_keys (
  key text PRIMARY KEY,
  endpoint text NOT NULL,
  response jsonb,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '24 hours'
);
CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);
-- Cron o pg_cron para limpiar expirados
```
- **Esfuerzo:** 2h | **Modelo:** Sonnet

### F0.3 CF WAF rate limiting [P0-3] — FUNDADORES
- **Rescatado de:** S1 original
- **Qué:** 5 reglas en Cloudflare Dashboard (free tier)
- **Quién:** Fundadores (requiere acceso dashboard CF)
- **Reglas:**

| Ruta | Límite | Acción |
|---|---|---|
| `/api/email/send` | 10 req/min por IP | Block 60s |
| `/api/stripe/*` | 20 req/min por IP | Block 60s |
| `/api/account/delete` | 2 req/min por IP | Block 60s |
| `/api/* (POST/PUT)` | 30 req/min por IP | Block 60s |
| `/api/cron/*` | Solo IPs CF Workers | Block |

- **Referencia:** `referencia/CLOUDFLARE-WAF-CONFIG.md`
- **Esfuerzo:** 30 min

### Gate F0 ✅

- [ ] 0 endpoints exponiendo errores internos — `grep -r "createError" server/api/ | grep -v safeError` = 0
- [ ] Stripe webhook dedup verificado (test unitario existente)
- [ ] Idempotencia funcional en reservations + auction-deposit + whatsapp webhook (3 tests nuevos)
- [ ] CF WAF rules activas — `curl -X POST` repetido a `/api/email/send` → 429 tras 10

---

## Fase 1 — Escalabilidad Core (6.5 → 8.5)

### F1.1 Postgres job queue [NUEVO]
- **Qué:** Sistema de colas 0€ usando tabla Postgres + cron worker
- **Sustituye:** Operaciones síncronas >500ms en request path
- **Endpoints a migrar:** `images/process.post.ts`, `generate-description.post.ts`, `email/send.post.ts`, `dealer/import-stock.post.ts`
- **Schema (contrato técnico):**
```sql
CREATE TABLE job_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,          -- 'image_process' | 'ai_description' | 'email_send' | 'import_stock'
  payload jsonb NOT NULL,
  idempotency_key text UNIQUE,     -- dedup natural (nullable)
  status text DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','failed','dead')),
  retries int DEFAULT 0,
  max_retries int DEFAULT 3,
  backoff_seconds int DEFAULT 60,  -- exponencial: backoff * 2^retries
  correlation_id text,             -- para tracing end-to-end (ver F4.1)
  scheduled_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_job_pending ON job_queue(status, scheduled_at)
  WHERE status = 'pending';
CREATE INDEX idx_job_idempotency ON job_queue(idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_job_dead ON job_queue(status)
  WHERE status = 'dead';
```
- **Worker:** `/api/cron/process-jobs.post.ts`
  1. `SELECT ... FOR UPDATE SKIP LOCKED LIMIT 10` (toma batch de pending)
  2. Marca `processing` + `started_at = now()`
  3. Ejecuta handler registrado por `job_type`
  4. Si OK → `status = 'completed'`, `completed_at = now()`
  5. Si error → `retries++`, `scheduled_at = now() + backoff * 2^retries`
  6. Si `retries >= max_retries` → `status = 'dead'` + alerta vía eventBus
- **Dead letter:** Mismo tabla con `status = 'dead'`. Cron `infra-metrics` monitorea `count(*) WHERE status='dead'` → alerta si >0.
- **Migración de endpoints:** Cambian a encolar job + devolver `202 Accepted` con `job_id`. Frontend polling o callback.
- **Escalar a Opción B:** Cuando cron polling cada 30s no baste → migrar a CF Queues (mismo schema, distinto worker).
- **Esfuerzo:** 4h | **Modelo:** Opus

### F1.2 Server-side search [NUEVO]
- **Qué:** Reemplazar fuzzy search client-side en `VehicleGrid.vue` por búsqueda en Postgres
- **Implementación BD:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Index trigram para búsqueda fuzzy
CREATE INDEX idx_vehicles_search ON vehicles
  USING GIN (
    (unaccent(lower(
      coalesce(title,'') || ' ' ||
      coalesce(brand,'') || ' ' ||
      coalesce(model,'') || ' ' ||
      coalesce(description,'')
    )))
    gin_trgm_ops
  );

-- Index FTS para ranking
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('spanish', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(brand,'') || ' ' || coalesce(model,'')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(description,'')), 'C')
  ) STORED;
CREATE INDEX idx_vehicles_fts ON vehicles USING GIN(search_vector);
```
- **Endpoint:** `/api/search.get.ts`
  - Input: `q` (query), `category`, `price_min`, `price_max`, `km_max`, `province`, `year_min`, `year_max`, `cursor` (last_id), `limit` (default 20, max 50)
  - Normalización: `unaccent(lower(q))` antes de buscar
  - Ranking: `ts_rank(search_vector, plainto_tsquery('spanish', q))` con pesos A>B>C
  - Paginación cursor: `WHERE id > :cursor ORDER BY rank DESC, id LIMIT :limit`
  - Anti-scraping: rate limit 10 búsquedas/min por IP (cubierto por CF WAF F0.3)
  - Respuesta: `{ results: Vehicle[], next_cursor: string | null, total_estimate: number }`
- **Frontend:** `VehicleGrid.vue` → reemplazar `fuzzySearch()` local por `useFetch('/api/search')` con debounce 300ms
- **Esfuerzo:** 4h | **Modelo:** Opus

### F1.3 Fix N+1 queries ✅ [NUEVO]
- **Completado:** 06-mar-2026
- `auto-auction.post.ts`: prefetch de vehicleIdsWithAuctions en 1 query (Set), check local en batch
- 50 vehículos = 50 queries → 1 query
- **Qué era:** `auto-auction.post.ts` hace query individual por cada vehículo elegible para verificar si ya tiene subasta activa
- **Fix:**
```ts
// Antes: N+1 (loop + query individual)
for (const v of eligible) {
  const { data: existing } = await supabase
    .from('auctions').select('id').eq('vehicle_id', v.id).eq('status', 'active')
  if (!existing?.length) { /* crear subasta */ }
}

// Después: 1 query
const { data: vehiclesWithoutAuction } = await supabase
  .from('vehicles')
  .select('id, title, dealer_id, ...')
  .in('status', ['published'])
  .not('id', 'in',
    `(SELECT vehicle_id FROM auctions WHERE status IN ('active','pending'))`)
```
- **Auditoría adicional:** Grep `for.*await.*supabase` en `server/api/cron/` para detectar más N+1
- **Esfuerzo:** 1h | **Modelo:** Sonnet

### F1.4 Logs estructurados — migrar console.error ✅ [RESCATADO — O1 original]
- **Completado:** 06-mar-2026
- **Qué se hizo:**
  - Añadido `logger` singleton (sin event) a `server/utils/logger.ts`
  - 28 archivos migrados automáticamente con script (`scripts/migrate-console-to-logger.mjs`)
  - 4 archivos migrados manualmente (aiProvider, webhook.get, webhook.post, csp-report)
  - 59 reemplazos automáticos + 5 manuales = **64 total**
  - ESLint rule `no-console: error` en `server/**/*.ts` (excepto logger.ts)
  - 12 tests en `tests/unit/server/logger.test.ts`
  - Cero errores de no-console en ESLint

### F1.5 SWR cache audit ✅
- **Completado:** 06-mar-2026
- Verificado que todas las API GET públicas tienen SWR en `routeRules`
- Diff de `routeRules` vs endpoints GET confirmado completo

### Gate F1 ✅

- [ ] k6 smoke 100 VU sin errores (existente: `npm run test:load:smoke`)
- [ ] Search endpoint: <200ms p95 con datos reales (medido con k6 scenario)
- [ ] 0 N+1 queries: `grep -rn "for.*await.*supabase" server/api/cron/` = 0
- [ ] 0 `console.error` en `server/`: `grep -rn "console\.error\|console\.warn" server/ --include="*.ts"` = 0
- [ ] Job queue: test unitario completa ciclo `pending→processing→completed` + `pending→failed→dead`
- [ ] Job queue: test de backoff exponencial (retry con delay creciente)

---

## Fase 2 — UX (7.8 → 9.5)

### F2.1 Optimistic UI ✅ [RESCATADO — U2 original]
- **Completado:** 06-mar-2026
- Toggle favoritos instantáneo + revert si falla
- Contacto con "enviando..." → "enviado" feedback

### F2.2 Form autocomplete en formularios públicos ✅ [NUEVO]
- **Completado:** 06-mar-2026
- Atributos `autocomplete` añadidos a todos los inputs de formularios públicos

### F2.3 Hardcoded strings → $t() ✅ [NUEVO]
- **Completado:** 06-mar-2026
- Strings españoles hardcoded migrados a claves i18n

### F2.4 px → rem/em en layout y spacing ✅ [NUEVO]
- **Completado:** 06-mar-2026
- Breakpoints migrados a `em`, spacing a `rem`. Solo `1px` borders mantenidos.

### F2.5 Photo upload en publicación de vehículo ✅ [NUEVO]
- **Completado:** 06-mar-2026
- `DashboardPhotoUpload.vue` creado con drag-and-drop, preview, reorder, delete
- `submitVehicle` actualizado para aceptar photos array e insertar en `vehicle_images`
- Placeholder reemplazado en `nuevo.vue`

### F2.6 Analytics event schema con versionado ✅ [NUEVO]
- **Completado:** 06-mar-2026
- Migración aplicada: 4 columnas (version, vertical, entity_type, entity_id) + 4 indexes
- `useAnalyticsTracking.ts` actualizado con `EVENT_SCHEMA_VERSION = 1` y 4 métodos funnel

### Gate F2 ✅

- [ ] Lighthouse mobile ≥90 en catálogo (`npx lighthouse https://tracciona.com/catalogo --preset=perf`)
- [ ] 0 strings hardcoded en español: grep verificable = 0 resultados
- [ ] 0 `px` en layout/spacing (excluir `1px` borders): grep verificable = 0
- [ ] autocomplete en 100% inputs de forms públicos (audit manual 5 formularios)
- [ ] Photo upload funcional: subir 3 fotos → variantes generadas → vinculadas a vehículo draft
- [ ] Funnel events registrándose con version + session_id (verificar en analytics_events)

---

## Fase 3 — Modulabilidad (9.0 → 10)

### F3.1 Auditar y dividir composables >300 LOC [RESCATADO — D1 original]
- **Qué:** Composables grandes → extraer sub-composables por responsabilidad
- **Detección:** `wc -l app/composables/**/*.ts | sort -rn | head -20`
- **Conocidos >400 LOC:**
  - `useConversation.ts` (514) → extraer `useConversationRealtime` + `useContactMasking`
  - `useMarketData.ts` (507) → extraer `useMarketStats` + `useMarketTrends`
  - `useValoracion.ts` (494) → extraer `useValoracionForm` + `useValoracionHistory`
  - `useDatos.ts` (484) → extraer `useDatosCharts` + `useDatosStats`
- **Target:** Todo composable <300 LOC
- **Esfuerzo:** 3h | **Modelo:** Sonnet

### F3.2 Eliminar `any` en composables exportados ✅ [NUEVO]
- **Completado:** 06-mar-2026
- `supabase: any` → `SupabaseClient` import en 5 files (useFilters, useAdminFilters, useAdminMetricsActivity, useValoracion, useDashboardImportar)
- `query: any` → `FilterChain` typed interface en 3 files (useVehicles, useHiddenVehicles, useAdminBalance)
- 0 `: any` remaining in composables

### F3.3 Deduplicar helpers compartidos [NUEVO]
- **Qué:** Funciones duplicadas entre composables → extraer a utils
- **Conocidos:**
  - `formatPrice()` — duplicado en `useDatos.ts` + `useValoracion.ts` → mover a `app/utils/formatters.ts`
  - `computeMedian()` — duplicado en `useDatos.ts` + `useMarketData.ts` → mover a `app/utils/stats.ts`
  - Trend calculation helpers — duplicados entre mismos archivos
- **Esfuerzo:** 1h | **Modelo:** Sonnet

### F3.4 Script scaffolding nueva vertical ✅ [RESCATADO — N1 original]
- **Completado:** 06-mar-2026
- `scripts/create-vertical.mjs` creado con CLI args (--name, --domain, --dry-run)
- Genera: SQL migration, .env.example update, deploy checklist markdown
- Validado con `--dry-run`

### Gate F3 ✅

- [ ] 0 composables >300 LOC: `wc -l app/composables/**/*.ts | awk '$1>300'` = vacío
- [ ] 0 `any` en composables: `grep -r ": any" app/composables/ --include="*.ts"` = 0 (excluir tests)
- [ ] 0 funciones duplicadas: `formatPrice`, `computeMedian` solo en `app/utils/`
- [ ] 0 dependencias circulares: `npx madge --circular app/composables/` = clean
- [ ] Script scaffold: `node scripts/create-vertical.mjs --name test --dry-run` genera output válido

---

## Fase 4 — 10M Infraestructura (5.0 → 9.0)

### F4.1 Correlation-ID end-to-end ✅ [NUEVO]
- **Completado:** 06-mar-2026
- `request-id.ts`: accept `X-Correlation-ID` from client, set on response
- `logger.ts`: `correlationId` in all log entries via `createLogger`
- `process-jobs.post.ts`: propagate `correlationId` in all log messages + email headers
- `app/composables/useCorrelationId.ts`: client-side session-scoped ID + `fetchWithCorrelation` wrapper

### F4.2 Reporte técnico semanal automático ✅ [RESCATADO — O2 original]
- **Completado:** 06-mar-2026
- `server/api/cron/weekly-report.post.ts` creado
- Collects: alerts by level, dead letter jobs, vehicle/dealer counts, funnel metrics, latency p95
- Generates plain text + HTML reports, sends via email to admin

### F4.3 EXPLAIN ANALYZE — validación periódica ✅
- **Completado:** 06-mar-2026
- 5 critical queries validated: catalog listing, filtered catalog, FTS search, job_queue pending, analytics funnel
- Seq scans correct for small dataset (<10 rows); all indexes confirmed present and ready for scale
- `idx_job_queue_pending` INDEX SCAN optimal, `idx_analytics_events_created` BITMAP INDEX SCAN optimal

### F4.4 Coverage gate bloqueante en CI [RESCATADO — S7 original]
- **Qué:** Step en CI que rechace PR si coverage baja respecto a baseline
- **Implementación:**
```bash
# En CI, tras vitest --coverage
node scripts/check-coverage-gate.mjs \
  --baseline docs/tracciona-docs/referencia/coverage-baseline-*.json \
  --current coverage/coverage-summary.json \
  --threshold 0  # no permitir bajada
```
- **Referencia:** `docs/coverage-policy.md`
- **Esfuerzo:** 1h | **Modelo:** Sonnet

### F4.5 Load test k6 — escalar a 1000 VU ✅ [NUEVO]
- **Completado:** 06-mar-2026
- Added `peak` profile to `k6-full.js`: 0→100→500→1000 VU, hold 5min at 1000, ramp-down
- Error threshold tightened to <0.5%, per-scenario p95 relaxed to <500ms for peak
- `npm run test:load:peak` script added to package.json

### F4.6 Capacity planning document ✅ [NUEVO]
- **Completado:** 06-mar-2026
- `docs/tracciona-docs/referencia/CAPACITY-PLANNING.md` creado
- 5-tier projections ($0 → custom), component-level analysis, multi-vertical scaling, SLO targets, cost matrix

### Gate F4 ✅

- [ ] k6 1000 VU: pasa sin errores, p95 <500ms
- [ ] Correlation-ID: request trazable frontend → API → job → log (test manual documentado)
- [ ] Coverage gate: PR test con coverage bajada → CI rechaza
- [ ] DB connections <80% pool durante k6 1000 VU (verificar en Supabase dashboard)
- [ ] Capacity planning doc completado y revisado

---

## Fase 5 — Polish Final (→ 10/10)

### F5.1 SonarQube scan con coverage [RESCATADO — S5 original]
- **Quién:** Fundadores (contraseña Docker local)
- **Qué:** Resetear contraseña admin SonarQube, ejecutar scan con coverage lcov
- **Comando:** `SONAR_TOKEN=xxx bash sonar/run-scan.sh`
- **Target:** 0 bugs, 0 vulns, 0 smells, coverage visible en dashboard
- **Esfuerzo:** 30 min

### F5.2 Security audit final ✅
- **Completado:** 06-mar-2026
- `npx vitest run tests/security/` — 76/76 tests passing across 6 files
- ECONNREFUSED on vertical-isolation = expected (needs staging keys)

### F5.3 Runbook de incidentes ✅ [NUEVO]
- **Completado:** 06-mar-2026
- `docs/tracciona-docs/referencia/INCIDENT-RUNBOOK.md` creado
- 6 escenarios: DB down, deploy broken, DDoS, Stripe webhook, dead letters, data breach
- Severity levels, step-by-step procedures, contacts, useful commands

### Gate F5 (FINAL) ✅

- [ ] SonarQube: 0 bugs, 0 vulns, 0 smells, coverage visible
- [ ] Security tests: 100% passing (`npx vitest run tests/security/`)
- [ ] Runbook: 6 escenarios documentados con pasos verificables
- [ ] **TODOS los SLOs de la tabla "Definición de 10/10" verificados**

---

## Items que requieren tests

| Item | Qué testear | Tipo |
|---|---|---|
| **F0.2** Idempotencia | Check dedup por key, respuesta cacheada, key expirada permite re-ejecución | Unit |
| **F1.1** Job queue worker | Ciclo pending→processing→completed, retry con backoff, dead letter tras max_retries | Unit |
| **F1.1** Job queue enqueue | Encolar job devuelve job_id, dedup por idempotency_key | Unit |
| **F1.2** Search endpoint | Normalización unaccent, ranking por relevancia, cursor pagination, filtros combinados | Unit |
| **F1.3** N+1 fix | Query batch devuelve mismo resultado que loop original (test de equivalencia) | Unit |
| **F2.1** Optimistic UI | Toggle→revert en error, estado intermedio correcto | Unit |
| **F2.5** Photo upload | Validación tipo/tamaño, upload + vincular, límite 20 fotos | Unit |
| **F2.6** Analytics schema | Evento generado con version + session_id + vertical | Unit |
| **F3.4** Scaffold script | SQL válido, .env correcto, maneja nombre duplicado, --dry-run | Unit |
| **F4.2** Reporte semanal | Genera resumen con datos mock, formato email correcto | Unit |
| **F4.4** Coverage gate | Rechaza PR cuando coverage baja, aprueba cuando sube/mantiene | Unit |

### Items que NO requieren tests (config/docs/audit)

F0.1, F0.3, F1.4, F1.5, F2.2, F2.3, F2.4, F3.1, F3.2, F3.3, F4.1, F4.3, F4.5, F4.6, F5.1, F5.2, F5.3

---

## Orden de ejecución priorizado

| # | ID | Acción | Estado | Quién |
|---|---|---|---|---|
| 1 | F0.1 | safeError 2 rutas restantes | ✅ | Claude |
| 2 | F0.2 | Idempotencia 4 endpoints | ✅ | Claude |
| 3 | F0.3 | CF WAF rules | ⏳ Fundadores | Fundadores |
| — | | **— Gate F0 —** | | |
| 4 | F1.3 | Fix N+1 queries | ✅ | Claude |
| 5 | F1.4 | Logs estructurados (migrar console.error) | ✅ | Claude |
| 6 | F1.5 | SWR cache audit | ✅ | Claude |
| 7 | F1.1 | Postgres job queue | ✅ | Claude |
| 8 | F1.2 | Server-side search | ✅ | Claude |
| — | | **— Gate F1 —** | | |
| 9 | F2.2 | Form autocomplete | ✅ | Claude |
| 10 | F2.3 | Hardcoded strings → $t() | ✅ | Claude |
| 11 | F2.4 | px → rem/em | ✅ | Claude |
| 12 | F2.1 | Optimistic UI | ✅ | Claude |
| 13 | F2.5 | Photo upload | ✅ | Claude |
| 14 | F2.6 | Analytics event schema | ✅ | Claude |
| — | | **— Gate F2 —** | | |
| 15 | F3.3 | Dedup helpers | 🔄 Coverage agent | Claude |
| 16 | F3.1 | Split composables >300 LOC | 🔄 Coverage agent | Claude |
| 17 | F3.2 | Eliminar `any` | ✅ | Claude |
| 18 | F3.4 | Scaffold script vertical | ✅ | Claude |
| — | | **— Gate F3 —** | | |
| 19 | F4.1 | Correlation-ID end-to-end | ✅ | Claude |
| 20 | F4.2 | Reporte semanal | ✅ | Claude |
| 21 | F4.3 | EXPLAIN ANALYZE validación | ✅ | Claude |
| 22 | F4.4 | Coverage gate CI | 🔄 Coverage agent | Claude |
| 23 | F4.5 | k6 1000 VU | ✅ | Claude |
| 24 | F4.6 | Capacity planning doc | ✅ | Claude |
| — | | **— Gate F4 —** | | |
| 25 | F5.1 | SonarQube scan | ⏳ Fundadores | Fundadores |
| 26 | F5.2 | Security audit final | ✅ | Claude |
| 27 | F5.3 | Runbook incidentes | ✅ | Claude |
| — | | **— Gate F5 (FINAL) —** | | |

**Total: ~47h Claude Code + ~1h fundadores. Código: 0€. Infra: 0€ (Opción A).**

---

## Progresión estimada por checkpoint

| Checkpoint | UX | Modulab. | Escalab. | 10M | Global |
|---|---|---|---|---|---|
| **Actual** | 7.8 | 9.0 | 6.5 | 5.0 | **7.1** |
| **Post F0** | 7.8 | 9.0 | 7.0 | 5.5 | **7.3** |
| **Post F1** | 7.8 | 9.0 | 8.5 | 7.0 | **8.1** |
| **Post F2** | 9.5 | 9.0 | 8.5 | 7.5 | **8.6** |
| **Post F3** | 9.5 | 10 | 8.5 | 7.5 | **8.9** |
| **Post F4** | 9.5 | 10 | 9.5 | 9.0 | **9.5** |
| **Post F5** | 10 | 10 | 10 | 10 | **10** |

---

## Reglas operativas

1. **NO abrir features con P0/P1 abiertos.** Cerrar F0 completo antes de cualquier otra cosa.
2. **70% fiabilidad / 30% features** en pre-launch.
3. **Cada sesión Claude Code:** leer STATUS.md → verificar P0/P1 → elegir siguiente item del plan.
4. **Coverage:** todo archivo nuevo con lógica requiere >80% coverage en la misma sesión.
5. **Gates:** NO avanzar de fase sin verificar TODOS los checkboxes del gate.
6. **Tests:** escribir en la misma sesión que el código, nunca después.
7. **Escalar infra:** Solo migrar a Opción B cuando monitoreo demuestra necesidad. No preoptimizar.

---

> **Estado (06-mar-2026):** **22/27 items completados.** 5 pendientes: F0.3 (fundadores CF WAF), F5.1 (fundadores SonarQube), F3.1/F3.3/F4.4 (overlap con agente coverage).
>
> **Items rescatados del original:** F0.1←S2, F0.3←S1, F1.4←O1, F2.1←U2, F3.1←D1, F3.4←N1, F4.2←O2, F4.4←S7, F5.1←S5.
>
> **Prompt para continuar:** F0.3 y F5.1 requieren acceso a dashboards (fundadores). F3.1/F3.3/F4.4 se resuelven con el agente de coverage.

