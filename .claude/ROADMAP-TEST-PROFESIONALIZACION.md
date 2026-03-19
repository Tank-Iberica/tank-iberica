# Roadmap: Profesionalización de Tests — Structural → Behavioral

> **Objetivo:** Eliminar TODOS los tests structural del proyecto. Cada test importa y ejecuta código real, o se reemplaza por la herramienta correcta (ESLint, Stylelint, Supabase local).
>
> **Ejecución:** Autónoma por Claude Code, sesión por sesión. Cada sesión actualiza STATUS.md con progreso.
>
> **Quality gate final:** 0% structural en `tests/unit/`. `readFileSync` + `toContain` sobre source code = fallo automático.

---

## Estado global

| Fase | Descripción                   | Archivos | Estado                                                                                                                                             |
| ---- | ----------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | Infraestructura               | —        | ✅ completado (ESLint plugin 7 rules, CI workflow, vitest config, placeholder tests)                                                               |
| 1    | Convertibles → behavioral     | 54       | ✅ completado (composables clean, 3 components converted, 13 server already behavioral, 3 redundant deleted)                                       |
| 2    | MIXED → split                 | 5        | ✅ completado (5/5)                                                                                                                                |
| 3    | Build configs → conformance   | 19       | ✅ completado (11 moved to conformance, 8 converted to behavioral: nuxt.config via loadNuxtConfig(), YAML via yaml.parse(), JS via dynamic import) |
| 4    | Migraciones SQL → conformance | 5        | ✅ completado (moved to tests/conformance/server/ + tests/conformance/)                                                                            |
| 5    | Auditorías → conformance      | 22       | ✅ completado (moved to tests/conformance/components/, server/, security/)                                                                         |
| 6    | Limpieza final                | —        | ✅ completado (quality gate 0% enforced, classifier updated)                                                                                       |

**Resultado final:** 0 structural / 0 mixed / 973 behavioral en tests/unit/ (17,982 tests). Quality gate enforced. 51 structural tests en tests/conformance/ (todos pasan). 8 config tests convertidos a behavioral (nuxt.config, YAML, JS config).

---

## Fase 0 — Infraestructura

### 0.1 Supabase Local en CI

Crear `.github/workflows/test-migrations.yml`:

- Service: `postgres:15` con env vars
- Instalar Supabase CLI
- `supabase db push` para aplicar migraciones
- Ejecutar `vitest tests/integration/migrations/`

Crear `tests/integration/migrations/` directorio.

### 0.2 ESLint Plugin Custom

Crear `eslint-plugin-tracciona/` con estructura:

```
eslint-plugin-tracciona/
├── index.js           # Plugin entry point
├── package.json
└── rules/
    ├── no-select-star.js
    ├── no-hardcoded-vertical.js
    ├── require-structured-logger.js
    ├── no-console-in-server.js
    ├── require-jsdoc-exports.js
    └── require-i18n-keys.js
```

Registrar plugin en `.eslintrc` / `eslint.config.mjs`.

### 0.3 Vitest Config

Actualizar `vitest.config.ts`:

- `tests/unit/` — unit tests (behavioral only)
- `tests/integration/` — Supabase local tests
- `tests/e2e/` — Playwright
- `tests/security/` — IDOR, rate limiting

### 0.4 Quality Gate Update

Actualizar `tests/unit/build/test-quality-gate.test.ts`:

- Threshold structural: **0%** (actualmente 10%)
- Cualquier `readFileSync` + `toContain` en `tests/unit/` = FALLO

### 0.5 CLAUDE.md Update

Añadir sección "Estándares de testing" (ver final de este documento).

---

## Fase 1 — 55 Convertibles → Behavioral

Cada item: importar el módulo source, mockear dependencias, ejecutar funciones, verificar output.

### Composables (14 archivos)

| #    | Archivo                                       | Source Module                                                                                                                      | Tests |
| ---- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 1.1  | composables/useVirtualList.test.ts            | app/composables/useVirtualList.ts                                                                                                  | 27    |
| 1.2  | composables/useFormAutosave.test.ts           | app/composables/useFormAutosave.ts                                                                                                 | 26    |
| 1.3  | composables/useVerticalConfig.test.ts         | app/composables/useVerticalConfig.ts                                                                                               | 26    |
| 1.4  | composables/useUndoAction.test.ts             | app/composables/useUndoAction.ts                                                                                                   | 22    |
| 1.5  | composables/useRetryOperation.test.ts         | app/composables/useRetryOperation.ts                                                                                               | 21    |
| 1.6  | composables/useVehicleComparatorShare.test.ts | app/composables/useVehicleComparatorShare.ts                                                                                       | 20    |
| 1.7  | composables/useQueryBudget.test.ts            | app/composables/useQueryBudget.ts                                                                                                  | 19    |
| 1.8  | composables/useAnalyticsBatch.test.ts         | app/composables/useAnalyticsBatch.ts                                                                                               | 18    |
| 1.9  | composables/useQueryCostEstimation.test.ts    | app/composables/useQueryCostEstimation.ts                                                                                          | 17    |
| 1.10 | composables/useConversationRealtime.test.ts   | app/composables/useConversation.ts                                                                                                 | 14    |
| 1.11 | composables/usePageSeo.test.ts                | app/composables/usePageSeo.ts                                                                                                      | 13    |
| 1.12 | composables/useCloudinaryUpload.test.ts       | app/composables/useCloudinaryUpload.ts                                                                                             | 9     |
| 1.13 | ~~form-autocomplete.test.ts~~                 | ❌ ELIMINADO — multi-file HTML audit (7 Vue files), no composable. Reclasificado a Fase 5 como regla ESLint `require-autocomplete` | —     |
| 1.14 | server/composable-deps-script.test.ts         | scripts/audit-composable-deps.mjs                                                                                                  | 6     |

### Componentes (20 archivos)

| #    | Archivo                                   | Source Module                        | Tests |
| ---- | ----------------------------------------- | ------------------------------------ | ----- |
| 1.15 | components/UiDataTable.test.ts            | app/components/ui/DataTable.vue      | 37    |
| 1.16 | components/multi-image-upload.test.ts     | app/components relevante             | 28    |
| 1.17 | components/UiSubmitButton.test.ts         | app/components/ui/UiSubmitButton.vue | 22    |
| 1.18 | components/UiFormField.test.ts            | app/components/ui/UiFormField.vue    | 20    |
| 1.19 | components/UiSuccessState.test.ts         | app/components/ui/UiSuccessState.vue | 19    |
| 1.20 | components/contextual-nudges.test.ts      | app/components/ relevante            | 17    |
| 1.21 | components/OperationBanner.test.ts        | app/components/OperationBanner.vue   | 17    |
| 1.22 | components/dealer-response-time.test.ts   | app/composables/useDealerStats.ts    | 15    |
| 1.23 | components/saved-searches-ui.test.ts      | app/components/SavedSearches.vue     | 15    |
| 1.24 | components/touch-gestures-gallery.test.ts | app/components/ gallery              | 15    |
| 1.25 | components/OfflineBanner.test.ts          | app/components/OfflineBanner.vue     | 14    |
| 1.26 | components/contact-preference.test.ts     | app/components/ContactPreference.vue | 13    |
| 1.27 | components/admin-design-system.test.ts    | app/components/admin/\*\*            | 12    |
| 1.28 | components/list-transitions.test.ts       | app/components/ListTransitions.vue   | 12    |
| 1.29 | components/focus-trap-modals.test.ts      | app/components/ui/Modal.vue          | 11    |
| 1.30 | components/listing-preview.test.ts        | app/components/ListingPreview.vue    | 11    |
| 1.31 | components/loading-states.test.ts         | app/components/LoadingState.vue      | 7     |
| 1.32 | components/vehicle-card-prefetch.test.ts  | app/components/VehicleCard.vue       | 6     |
| 1.33 | components/aria-describedby-forms.test.ts | app/components/FormField.vue         | 6     |
| 1.34 | components/responsive-tables.test.ts      | app/components/ResponsiveTable.vue   | 5     |

### Server Routes / Utils (17 archivos)

| #    | Archivo                                  | Source Module                                                                                 | Tests |
| ---- | ---------------------------------------- | --------------------------------------------------------------------------------------------- | ----- |
| 1.35 | server/api-key-rotation.test.ts          | server/utils/apiKeyRotation.ts                                                                | 28    |
| 1.36 | server/experiments-ab-testing.test.ts    | server/utils/experiments.ts                                                                   | 27    |
| 1.37 | server/api-web-vitals.test.ts            | server/api/analytics/web-vitals.post.ts                                                       | 26    |
| 1.38 | ~~server/capacity-alerting.test.ts~~     | ❌ ELIMINADO — redundante con api-cron-capacity-check.test.ts (11 tests behavioral completos) | —     |
| 1.39 | server/graceful-degradation.test.ts      | server/utils/gracefulDegradation.ts                                                           | 22    |
| 1.40 | server/warmup-cache.test.ts              | server/api/cron/warmup-cache.post.ts                                                          | 22    |
| 1.41 | server/slow-query-check.test.ts          | server/utils/ o scripts/ relevante                                                            | 17    |
| 1.42 | server/create-vertical-script.test.ts    | scripts/create-vertical.mjs                                                                   | 16    |
| 1.43 | server/dealer-team-auth.test.ts          | server/utils/dealerTeamAuth.ts                                                                | 16    |
| 1.44 | server/matview-refresh.test.ts           | server/api/cron/refresh-matviews.post.ts                                                      | 16    |
| 1.45 | server/prepared-statements-rpc.test.ts   | server/utils/supabaseQuery.ts                                                                 | 15    |
| 1.46 | server/api-admin-ux-health.test.ts       | server/api/admin/ux-health.get.ts                                                             | 11    |
| 1.47 | server/coep-verification.test.ts         | server/middleware/security.ts                                                                 | 10    |
| 1.48 | server/api-admin-latency-metrics.test.ts | server/api/admin/latency-metrics.get.ts                                                       | 9     |
| 1.49 | server/api-admin-subscriptions.test.ts   | server/api/admin/subscriptions.get.ts                                                         | 9     |
| 1.50 | server/cohort-metrics.test.ts            | server/api/admin/cohort-metrics.get.ts                                                        | 9     |
| 1.51 | server/vertical-health-check.test.ts     | server/api/health/ relevante                                                                  | 8     |

### Otros (4 archivos)

| #    | Archivo                                         | Source Module                                                                     | Tests |
| ---- | ----------------------------------------------- | --------------------------------------------------------------------------------- | ----- |
| 1.52 | server/structured-logs.test.ts                  | server/utils/logger.ts                                                            | 5     |
| 1.53 | product-status-script.test.ts                   | scripts/sync-product-status.mjs                                                   | 5     |
| 1.54 | ~~server/analytics-vertical-isolation.test.ts~~ | ❌ ELIMINADO — redundante con useAnalyticsTracking.test.ts (50+ tests behavioral) | —     |
| 1.55 | server/email-templates-vertical.test.ts         | server/services/emailRenderer.ts                                                  | 27    |

### Instrucciones para Claude Code (Fase 1)

Para cada archivo:

1. **Leer** el test structural actual completo
2. **Leer** el source module que testa
3. **Identificar** las funciones/exports del source
4. **Reescribir** el test:
   - `import { fn1, fn2 } from '../../../source/module'`
   - Mockear dependencias externas (Supabase, h3, Nuxt composables) con `vi.mock()` / `vi.stubGlobal()`
   - Para cada `it()`: llamar la función, verificar retorno/side effects
   - Mantener o superar el número de tests original
5. **Ejecutar** `npx vitest run <archivo>` — todos deben pasar
6. **Marcar** como ✅ en este roadmap

**Patrón de mocking Nuxt composables:**

```typescript
vi.stubGlobal(
  'useSupabaseClient',
  vi.fn(() => mockClient),
)
vi.stubGlobal(
  'useRoute',
  vi.fn(() => mockRoute),
)
vi.stubGlobal(
  'useRuntimeConfig',
  vi.fn(() => mockConfig),
)
vi.stubGlobal(
  'useState',
  vi.fn((key, init) => ref(init())),
)
```

**Patrón de mocking server utils (auto-imported):**

```typescript
vi.stubGlobal(
  'useSupabaseServiceClient',
  vi.fn(() => mockClient),
)
vi.mock('../../../server/utils/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}))
```

---

## Fase 2 — 5 MIXED → Split

Extraer secciones structural de archivos MIXED. Las secciones behavioral ya están bien.

| #   | Archivo                              | Acción                                                                                                                                                                |
| --- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | useSocialPublisher.test.ts           | Eliminar `describe` que usa readFileSync (verificación de existencia). Behavioral ya cubre.                                                                           |
| 2.2 | server/etag-304.test.ts              | Mover `describe('Integration: ETag usage')` y `describe('Critical request chain audit')` a eliminar (cubrir con ESLint rule o Fase 3 config check). Dejar behavioral. |
| 2.3 | server/api-generate-article.test.ts  | Eliminar secciones que leen templates con readFileSync. Behavioral cubre handler.                                                                                     |
| 2.4 | server/db-rate-limit.test.ts         | Mover `describe('Migration 00176')` a `tests/integration/migrations/`. Dejar behavioral en unit/.                                                                     |
| 2.5 | components/aria-live-regions.test.ts | Eliminar checks de readFileSync sobre componentes. Behavioral con mount cubre.                                                                                        |

---

## Fase 3 — 19 Build Configs → Parse/Import

En vez de `readFileSync(config) + toContain(string)`, parsear el config como objeto y verificar propiedades.

| #    | Archivo                              | Config que parsea                         | Tests |
| ---- | ------------------------------------ | ----------------------------------------- | ----- |
| 3.1  | build/docker-compose.test.ts         | docker-compose.yml (YAML parse)           | 25    |
| 3.2  | server/pwa-manifest-vertical.test.ts | nuxt.config.ts + manifest                 | 29    |
| 3.3  | build/lighthouse-ci.test.ts          | .github/workflows/ (YAML parse)           | 15    |
| 3.4  | build/scripts-analysis.test.ts       | nuxt.config.ts head scripts               | 15    |
| 3.5  | build/isr-route-rules.test.ts        | nuxt.config.ts routeRules                 | 14    |
| 3.6  | build/sw-precache.test.ts            | nuxt.config.ts pwa/sw config              | 13    |
| 3.7  | build/lazy-hydration.test.ts         | nuxt.config.ts experimental               | 12    |
| 3.8  | build/print-styles.test.ts           | CSS files (parse con PostCSS)             | 10    |
| 3.9  | build/a11y-ci-workflow.test.ts       | .github/workflows/ (YAML parse)           | 9     |
| 3.10 | build/preload-lcp.test.ts            | nuxt.config.ts link preload               | 9     |
| 3.11 | build/font-subsetting.test.ts        | nuxt.config.ts fonts                      | 8     |
| 3.12 | build/lqip-blur-up.test.ts           | nuxt.config.ts image                      | 8     |
| 3.13 | build/pwa-manifest.test.ts           | public/manifest.json (JSON parse)         | 8     |
| 3.14 | build/i18n-lazy-locales.test.ts      | nuxt.config.ts i18n                       | 6     |
| 3.15 | build/nuxt-img-sizes.test.ts         | nuxt.config.ts image                      | 6     |
| 3.16 | build/asset-immutability.test.ts     | nuxt.config.ts build + headers            | 4     |
| 3.17 | build/chartjs-lazy.test.ts           | nuxt.config.ts build/plugins              | 4     |
| 3.18 | build/modulepreload.test.ts          | nuxt.config.ts head links                 | 1     |
| 3.19 | build/bundle-budget.test.ts          | .output/public/\_nuxt (build output size) | 1     |

### Instrucciones para Claude Code (Fase 3)

**Patrón para nuxt.config.ts:**

```typescript
import { readFileSync } from 'node:fs'

// Parsear nuxt.config.ts como texto y extraer el objeto exportado
// Nota: no se puede importar directamente porque usa defineNuxtConfig
// Alternativa: parsear con regex o usar eval parcial

// Para YAML:
import { parse as parseYAML } from 'yaml' // npm install yaml
const config = parseYAML(readFileSync('docker-compose.yml', 'utf-8'))
expect(config.services.app.healthcheck).toBeDefined()

// Para JSON:
const manifest = JSON.parse(readFileSync('public/manifest.json', 'utf-8'))
expect(manifest.theme_color).toBe('#23424A')
```

**Nota:** Estos tests siguen leyendo archivos, pero **parsean la estructura** en vez de buscar strings. Es behavioral sobre el FORMATO, no sobre el CONTENIDO textual. Si `nuxt.config.ts` se puede importar como módulo, preferir import directo.

---

## Fase 4 — 5 Migraciones SQL → Supabase Local

Tests de integración que ejecutan migraciones contra Postgres real y verifican con `information_schema`.

| #   | Archivo                                       | Migración(es)                                 | Tests |
| --- | --------------------------------------------- | --------------------------------------------- | ----- |
| 4.1 | escalabilidad-bd.test.ts                      | 00087\*.sql + matview refresh                 | 19    |
| 4.2 | server/migration-analytics-device-utm.test.ts | 00175_analytics_events_device_utm_columns.sql | 19    |
| 4.3 | server/dealer-team-auth.test.ts (parte SQL)   | 00178_dealer_team_members.sql                 | 7     |
| 4.4 | server/db-rate-limit.test.ts (parte SQL)      | 00176_rate_limit_entries.sql                  | 7     |
| 4.5 | server/rls-performance-audit.test.ts          | Múltiples migraciones RLS                     | 14    |

### Instrucciones para Claude Code (Fase 4)

Mover a `tests/integration/migrations/`. Patrón:

```typescript
import { describe, it, expect } from 'vitest'
// Conectar a Supabase local (env var DATABASE_URL en CI)
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_KEY || 'service-role-key',
)

describe('Migration 00176: rate_limit_entries', () => {
  it('table exists with correct columns', async () => {
    const { data } = await supabase.rpc('to_regclass', { name: 'rate_limit_entries' })
    expect(data).not.toBeNull()
  })

  it('has required columns', async () => {
    const { data } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'rate_limit_entries')
    expect(data).toContainEqual(expect.objectContaining({ column_name: 'key' }))
  })

  it('RLS is enabled', async () => {
    const { data } = await supabase.rpc('check_rls_enabled', { table: 'rate_limit_entries' })
    expect(data).toBe(true)
  })
})
```

**Requisito CI:** `.github/workflows/test-migrations.yml` debe tener Postgres + Supabase CLI.

---

## Fase 5 — 18 Auditorías → ESLint / Stylelint / CI Scripts

### 5A. ESLint Custom Rules (8 archivos → reglas)

| #    | Archivo actual                               | Regla ESLint                          | Qué detecta                                           |
| ---- | -------------------------------------------- | ------------------------------------- | ----------------------------------------------------- |
| 5.1  | audit-hardcoding.test.ts                     | `tracciona/no-hardcoded-values`       | Strings hardcodeados (URLs, IDs, colores)             |
| 5.2  | hardcoded-vertical-refs.test.ts              | `tracciona/no-hardcoded-vertical`     | Referencias a vertical específica                     |
| 5.3  | build/select-star-audit.test.ts              | `tracciona/no-select-star`            | `.select('*')` en queries Supabase                    |
| 5.4  | server/structured-logs.test.ts (parte audit) | `tracciona/require-structured-logger` | `console.log` en server/ en vez de logger             |
| 5.5  | composables-jsdoc.test.ts                    | `tracciona/require-jsdoc-exports`     | Exports sin JSDoc                                     |
| 5.6  | circularDeps.test.ts                         | Usar `eslint-plugin-import/no-cycle`  | Circular imports                                      |
| 5.7  | build/dependency-graph.test.ts               | `tracciona/max-module-deps`           | Demasiadas dependencias en un módulo                  |
| 5.8  | keyboard-navigation-audit.test.ts            | `tracciona/require-keyboard-handler`  | Elementos interactivos sin onKeyDown                  |
| 5.22 | ~~form-autocomplete.test.ts~~ (eliminado)    | `tracciona/require-autocomplete`      | `<input>` sin autocomplete en formularios auth/perfil |

### 5B. Stylelint Rules (3 archivos → reglas)

| #    | Archivo actual            | Regla Stylelint                 | Qué detecta                |
| ---- | ------------------------- | ------------------------------- | -------------------------- |
| 5.9  | css-layers.test.ts        | `tracciona/require-css-layer`   | CSS sin @layer wrapping    |
| 5.10 | build/css-contain.test.ts | `tracciona/require-css-contain` | Componentes sin `contain:` |
| 5.11 | build/css-audit.test.ts   | Stylelint config estricto       | CSS anti-patterns          |

### 5C. CI Build Scripts mejorados (7 archivos → scripts)

Estos NO se pueden convertir a ESLint porque hacen análisis cross-file o verifican configs no-JS. Se mantienen como scripts de CI pero se mueven fuera de `tests/unit/`.

| #    | Archivo actual                       | Destino                                  | Qué hace                             |
| ---- | ------------------------------------ | ---------------------------------------- | ------------------------------------ |
| 5.12 | architecture-modularidad.test.ts     | scripts/audits/architecture-audit.mjs    | Audita tamaño/exports de composables |
| 5.13 | multi-vertical.test.ts               | scripts/audits/vertical-config-audit.mjs | Verifica consistencia vertical       |
| 5.14 | admin-i18n-coverage.test.ts          | scripts/audits/i18n-coverage-audit.mjs   | Verifica cobertura i18n              |
| 5.15 | docs-strategy.test.ts                | scripts/audits/docs-audit.mjs            | Verifica documentación               |
| 5.16 | server/e2e-k6-inventory.test.ts      | scripts/audits/k6-config-audit.mjs       | Valida configs k6                    |
| 5.17 | build/coverage-gate.test.ts          | scripts/audits/coverage-gate.mjs         | Ya existe como script                |
| 5.18 | build/test-quality-gate.test.ts      | scripts/audits/test-quality-gate.mjs     | Clasificación test quality           |
| 5.19 | server/perf-regression-check.test.ts | scripts/audits/perf-regression.mjs       | Performance regression entre deploys |

**Nota:** Los scripts de auditoría se ejecutan en CI como step separado, no como vitest. Usan `process.exit(1)` para fallar el build.

### 5D. SQL Audits → Supabase Local (2 archivos → Fase 4)

| #    | Archivo actual                       | Destino                                      |
| ---- | ------------------------------------ | -------------------------------------------- |
| 5.20 | server/rls-performance-audit.test.ts | tests/integration/migrations/ (ya en Fase 4) |
| 5.21 | security/third-party-scripts.test.ts | ESLint `tracciona/no-unsafe-external-script` |

### Instrucciones para Claude Code (Fase 5)

**ESLint rule pattern:**

```javascript
// eslint-plugin-tracciona/rules/no-select-star.js
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow .select("*") in Supabase queries' },
    fixable: null,
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.property.name === 'select' &&
          node.arguments.length === 1 &&
          node.arguments[0].type === 'Literal' &&
          node.arguments[0].value === '*'
        ) {
          context.report({
            node,
            message: 'Use explicit column names instead of select("*")',
          })
        }
      },
    }
  },
}
```

**Después de crear cada regla:** Eliminar el test structural correspondiente.

---

## Fase 6 — Limpieza Final

1. Ejecutar `node scripts/classify-tests.mjs` → verificar 0 STRUCTURAL en `tests/unit/`
2. Actualizar quality gate: threshold 0%
3. Eliminar `tests/conformance/` si quedó vacío
4. Ejecutar suite completa: `npx vitest run`
5. Actualizar BACKLOG-EJECUTABLE.md
6. Actualizar STATUS.md

---

## Sección para CLAUDE.md — Estándares de Testing

```markdown
## Estándares de testing (obligatorio)

### Clasificación de tests

- **tests/unit/**: SOLO behavioral. Importa código fuente, lo ejecuta, verifica output.
- **tests/integration/**: Tests contra servicios reales (Supabase local en CI).
- **tests/e2e/**: Playwright. User journeys completos.
- **tests/security/**: IDOR, rate limiting, auth bypass.

### Reglas para tests/unit/ (behavioral)

1. **Importar** la función/composable/handler del source code
2. **Mockear** dependencias externas (Supabase, h3, Nuxt composables) con `vi.mock()` / `vi.stubGlobal()`
3. **Ejecutar** la función con inputs controlados
4. **Verificar** output, side effects, errores con `expect()`
5. **PROHIBIDO**: `readFileSync` + `toContain` sobre source code. El quality gate lo bloquea.
6. **PROHIBIDO**: tests que solo verifican que un string existe en un archivo fuente

### Reglas para migraciones SQL

- Tests en `tests/integration/migrations/`
- Ejecutan contra Supabase local (Postgres real)
- Verifican con `information_schema`: tablas, columnas, indexes, RLS, funciones
- NUNCA verificar SQL leyendo el archivo .sql como texto

### Code patterns

- Enforced por `eslint-plugin-tracciona` (IDE + CI + pre-commit)
- Reglas: `no-select-star`, `no-hardcoded-vertical`, `require-structured-logger`, etc.
- NO escribir tests que lean archivos para buscar patrones de código

### Quality gate

- `scripts/classify-tests.mjs` clasifica tests como BEHAVIORAL/STRUCTURAL/MIXED
- `test-quality-gate`: 0% structural permitido en tests/unit/
- CI bloquea si aparece un test structural nuevo en tests/unit/
```

---

## Orden de ejecución por sesiones

| Sesión | Fases                                    | Archivos | Estimación   |
| ------ | ---------------------------------------- | -------- | ------------ |
| 1      | Fase 0 (infraestructura)                 | —        | 1 sesión     |
| 2-3    | Fase 1.1–1.14 (composables)              | 14       | 1-2 sesiones |
| 4-5    | Fase 1.15–1.34 (componentes)             | 20       | 2 sesiones   |
| 6-7    | Fase 1.35–1.55 (server + otros)          | 21       | 2 sesiones   |
| 8      | Fase 2 (MIXED split)                     | 5        | 1 sesión     |
| 9      | Fase 3 (configs)                         | 19       | 1 sesión     |
| 10     | Fase 4 (migraciones SQL)                 | 5        | 1 sesión     |
| 11-12  | Fase 5 (ESLint + Stylelint + CI scripts) | 18       | 2 sesiones   |
| 13     | Fase 6 (limpieza)                        | —        | 1 sesión     |

**Total: ~13 sesiones autónomas**

---

## Notas para ejecución autónoma

1. **Cada sesión:** Leer este roadmap → identificar siguiente fase/item → ejecutar → marcar ✅
2. **Antes de cada archivo:** Leer source module completo para entender API
3. **Después de cada archivo:** `npx vitest run <archivo>` — todos deben pasar
4. **Al terminar sesión:** Actualizar STATUS.md con progreso + prompt para siguiente sesión
5. **Si un test falla:** Debuggear en la misma sesión, no dejarlo para después
6. **Si el source module no existe:** Marcar con ⚠️, crear nota, continuar con siguiente
