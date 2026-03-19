# Bottlenecks — Análisis de Load Testing (k6)

> **Generado:** 2026-03-19 · **Fuente:** Scripts k6 en `tests/load/` y `scripts/`
> **Estado:** Pre-producción — resultados basados en análisis de scripts, thresholds y arquitectura.
> Los valores reales se medirán cuando haya volumen significativo (>1000 vehículos).

---

## Resumen ejecutivo

| Área                                   | Riesgo | Impacto                            | Prioridad |
| -------------------------------------- | ------ | ---------------------------------- | --------- |
| [B1] Catálogo SSR sin SWR explícito    | Alto   | P95 >300ms bajo carga              | P1        |
| [B2] Supabase connection pool          | Alto   | Timeouts en picos >200 VUs         | P1        |
| [B3] Búsqueda full-text limitada       | Medio  | P95 >500ms con trigrams en volumen | P2        |
| [B4] Escrituras concurrentes sin queue | Medio  | Deadlocks potenciales >100 writers | P2        |
| [B5] Memory leak en soak (SSR)         | Medio  | Degradación gradual tras 30min+    | P2        |
| [B6] Índices duplicados en vehicles    | Bajo   | Overhead de escritura, espacio     | P3        |
| [B7] Cache miss en ficha vehículo      | Bajo   | P95 >100ms target muy agresivo     | P3        |

---

## B1 — Catálogo SSR sin cache explícito en API

**Descripción:** El endpoint de catálogo (`/api/catalog**`) no tiene `swr` configurado en `routeRules`. La página SSR (`/`) sí tiene `swr: 600`, pero las llamadas API internas al catálogo (filtros, paginación) no se cachean a nivel CDN.

**Evidencia (scripts k6):**

- `k6-full.js`: threshold `catalog_page_duration: p(95)<500` — el SLO de QUERY-BUDGET es `p(95)<300ms` cache-miss
- `k6.config.js`: threshold `http_req_duration{scenario:catalog}: p(95)<300`
- `k6-load-test.js`: 1000 VUs contra `/catalogo` con variantes de filtros — sin cache, cada request ejecuta la query Q1 completa

**Impacto:** Con 100+ VUs concurrentes, cada request ejecuta Q1 (JOIN vehicles+dealers, 6 filtros opcionales, ORDER BY composite). Sin SWR, Supabase recibe 100% del tráfico.

**Solución propuesta:**

```typescript
// nuxt.config.ts → routeRules
'/catalogo': { swr: 60 },      // 1 min — catálogo cambia con nuevos anuncios
'/catalogo/**': { swr: 60 },
```

**Coste:** ~15 min implementación. Zero downtime. Mejora esperada: P95 de ~300ms a ~50ms (cache hit).

**Métricas a validar:**

- `cache_hit_rate > 0.80` en k6
- `catalog_page_duration p(95) < 100` con cache
- CF Analytics: ratio HIT vs MISS en `/catalogo`

---

## B2 — Supabase connection pool bajo spike

**Descripción:** Supabase Free/Pro tiene límite de conexiones simultáneas (pool ~20-60 dependiendo del plan). Los scripts de spike test suben a 200-500 VUs en 30 segundos, cada uno generando queries directas.

**Evidencia (scripts k6):**

- `spike-test.js`: 0→500 VUs en 10s, sustain 2min — cada VU hace GET con query a BD
- `realistic-peak.js`: baseline 20 VUs + spike 200 VUs + API bots 50 req/s
- `k6-stress-test.js`: ramp hasta 10,000 VUs — threshold `errors rate<0.20` (acepta 20% errores en pico)

**Impacto:** Connection pool exhaustion → `PGRST` errors, timeouts de 30s, cascading failures. El stress test ya anticipa esto con un threshold de 20% error rate.

**Solución propuesta:**

1. **Corto plazo:** Activar PgBouncer en modo transaction (ya disponible en Supabase dashboard → Settings → Connection Pooling)
2. **Medio plazo:** Implementar circuit breaker en `server/utils/` que devuelva 503 con Retry-After cuando detecte pool exhaustion
3. **Largo plazo:** Si el tráfico lo justifica, considerar read replicas o Neon/Railway como 2º cluster (decisión estratégica ya documentada)

**Coste:**

- PgBouncer: 5 min en dashboard (gratis)
- Circuit breaker: ~2h implementación
- Read replicas: evaluación de coste según plan Supabase

**Métricas a validar:**

- `spike_errors count < 50` en realistic-peak.js
- `http_req_failed rate < 0.01` en load test normal
- Supabase Dashboard → Database → Connection count durante spike

---

## B3 — Búsqueda full-text limitada a brand (trigram)

**Descripción:** Solo existe `idx_vehicles_brand_trgm` (GIN trigram). La búsqueda por título o descripción no tiene índice full-text. Con volumen, las queries Q5 con filtro por similaridad en `brand` pueden degradarse, y búsquedas en `title` hacen sequential scan.

**Evidencia (QUERY-BUDGET.md):**

- Q5 SLO: P95 cache-miss <500ms, P99 <2000ms — thresholds relajados respecto al catálogo
- k6.config.js: `search_duration p(95)<800` — 2.5x más lento que catálogo

**Impacto:** Con >5000 vehículos, `brand % $search_term` sobre GIN trigram sigue siendo rápido. Pero búsquedas por título/descripción (no indexadas) harán seq scan O(n).

**Solución propuesta:**

```sql
-- Añadir cuando haya demanda de búsqueda full-text
CREATE INDEX idx_vehicles_title_trgm
ON vehicles USING gin (title gin_trgm_ops);

-- O alternativamente, tsvector para búsqueda española:
CREATE INDEX idx_vehicles_fts
ON vehicles USING gin (
  to_tsvector('spanish', coalesce(title,'') || ' ' || coalesce(description,''))
);
```

**Coste:** 1 migración SQL (~30 min incluyendo test). Sin downtime (CREATE INDEX CONCURRENTLY).

**Métricas a validar:**

- `search_duration p(95) < 500` post-índice
- EXPLAIN ANALYZE de búsqueda por título con >1000 filas

---

## B4 — Escrituras concurrentes sin cola de procesamiento

**Descripción:** El script `k6-concurrent-writes.js` simula 100 dealers publicando simultáneamente. Sin cola (queue), todas las escrituras van directo a Supabase, compitiendo por locks en `vehicles` y tablas relacionadas (`price_history`, `analytics_events`).

**Evidencia (scripts k6):**

- `k6-concurrent-writes.js`: 100 VUs constantes, threshold `deadlocks count<1`
- `write-stress.js`: ramp 20→50→100 VUs con analytics events + web vitals
- Ambos scripts verifican explícitamente `deadlock` en response body

**Impacto:** PostgreSQL maneja bien 100 INSERTs concurrentes en tablas distintas. El riesgo real es en UPDATEs del mismo vehículo (e.g., bid + reserve + price update simultáneos) que pueden causar row-level lock contention.

**Solución propuesta:**

1. **Corto plazo:** Verificar que los endpoints de escritura usan `SERIALIZABLE` isolation solo donde es necesario (bids), no globalmente
2. **Medio plazo:** Implementar cola con `pgmq` o tabla `job_queue` para operaciones no-críticas (analytics, emails)
3. **Largo plazo:** Edge Function con Durable Objects (Cloudflare) para serializar escrituras por dealer

**Coste:**

- Revisión isolation levels: ~1h
- Cola pgmq: ~4h implementación + tests
- Durable Objects: evaluación futura

**Métricas a validar:**

- `write_latency p(95) < 500` en concurrent-writes
- `deadlocks count = 0`
- `write_errors rate < 0.01`

---

## B5 — Degradación en soak test (memory leak SSR)

**Descripción:** El soak test (`k6-soak-test.js`) mantiene 500 VUs durante 2 horas. En deployments Cloudflare Workers/Pages, el proceso se recicla automáticamente, pero en servidores Node.js de desarrollo o staging, un memory leak en SSR puede causar degradación progresiva.

**Evidencia (scripts k6):**

- `k6-soak-test.js`: 500 VUs × 116 min sustain, threshold `p(95)<500`
- `k6-full.js` soak profile: 50 VUs × 30 min

**Impacto:** En Cloudflare Pages (producción), el riesgo es bajo porque Workers se reciclan automáticamente. En staging/dev con `node`, el heap puede crecer si hay closures o caches sin TTL en composables SSR.

**Solución propuesta:**

1. Ejecutar soak test contra staging con monitoreo de memoria (`process.memoryUsage()`)
2. Añadir endpoint `/api/debug/memory` (solo staging) que reporte heap usage
3. Revisar composables SSR que almacenen state global (`useState` sin cleanup)

**Coste:** ~2h para endpoint + primer soak run.

**Métricas a validar:**

- Heap usage no crece >50% durante 2h de soak
- `response_time p(95)` no degrada >20% entre minuto 10 y minuto 110
- Error rate estable <1% durante toda la duración

---

## B6 — Índices duplicados en tabla vehicles

**Descripción:** La tabla `vehicles` tiene 25 índices, incluyendo 2 pares duplicados identificados en QUERY-BUDGET.md.

**Evidencia (QUERY-BUDGET.md):**

- 25 índices en tabla `vehicles`, 2 pares duplicados confirmados
- `pg_stat_user_indexes` muestra `idx_scan = 0` esperado para duplicados

**Duplicados:**
| A eliminar | Reemplazado por |
|------------|----------------|
| `idx_vehicles_slug` | `vehicles_slug_key` (UNIQUE, más restrictivo) |
| `idx_vehicles_category` | `idx_vehicles_category_id` (misma columna) |

**Impacto:** Cada INSERT/UPDATE en vehicles actualiza 25 índices. Eliminar 2 duplicados reduce overhead de escritura ~8% y libera espacio en disco.

**Solución propuesta:**

```sql
-- Verificar primero que no se usan
SELECT indexrelname, idx_scan
FROM pg_stat_user_indexes
WHERE relname = 'vehicles'
  AND indexrelname IN ('idx_vehicles_slug', 'idx_vehicles_category');

-- Si idx_scan = 0 para ambos:
DROP INDEX CONCURRENTLY idx_vehicles_slug;
DROP INDEX CONCURRENTLY idx_vehicles_category;
```

**Coste:** 1 migración, ~15 min. Zero downtime (CONCURRENTLY).

**Métricas a validar:**

- `write_latency` mejora marginalmente en concurrent-writes
- Sin regression en queries de catálogo (Q1) y detalle (Q2)

---

## B7 — Ficha vehículo: SLO de 100ms muy agresivo

**Descripción:** El threshold en k6.config.js para vehicle detail es `p(95)<100`, alineado con QUERY-BUDGET SLO de `p(95)<100ms` cache-miss. Sin embargo, la query Q2 (vehicle + dealer JOIN) en una BD con >5000 registros probablemente tomará 50-150ms sin cache.

**Evidencia:**

- `k6.config.js`: `'http_req_duration{scenario:vehicle_detail}': ['p(95)<100']`
- `k6-full.js`: threshold relajado a `vehicle_page_duration: p(95)<500`
- routeRules: `/vehiculo/**` tiene `swr: 300` (5 min)

**Impacto:** Con SWR de 5 min y tráfico distribuido entre muchos vehículos, el ratio de cache miss puede ser alto (long tail de slugs). Cada miss ejecuta Q2 completa.

**Solución propuesta:**

1. Aumentar SWR de `/vehiculo/**` a 10 min (`swr: 600`) — el contenido de ficha cambia con baja frecuencia
2. Ajustar threshold a `p(95)<200` en k6.config.js para reflejar la realidad del cache miss
3. Considerar `stale-if-error` para servir versión stale si Supabase está lento

**Coste:** Cambio de config, ~10 min.

**Métricas a validar:**

- `vehicle_page_duration p(95)` con SWR 10 min
- Cache hit rate por ruta en CF Analytics

---

## Inventario de scripts k6

| Script            | Ubicación                                |   VUs máx    | Duración     | Foco                                                       |
| ----------------- | ---------------------------------------- | :----------: | ------------ | ---------------------------------------------------------- |
| Full suite        | `tests/load/k6-full.js`                  |   100-1000   | 5-12 min     | Distribución realista (60% catálogo / 30% ficha / 10% API) |
| Catalog           | `tests/load/scenarios/catalog.js`        | Configurable | Configurable | Catálogo con filtros                                       |
| Vehicle detail    | `tests/load/scenarios/vehicle-detail.js` | Configurable | Configurable | Fichas individuales                                        |
| API public        | `tests/load/scenarios/api-public.js`     | Configurable | Configurable | Health + valuation                                         |
| Realistic peak    | `tests/load/scenarios/realistic-peak.js` |  200 spike   | 10 min       | Spike viral + bots + user journeys                         |
| Spike test        | `tests/load/scenarios/spike-test.js`     |     500      | 2.5 min      | 0→500 instantáneo                                          |
| Write stress      | `tests/load/scenarios/write-stress.js`   |     100      | 5.5 min      | Analytics + vitals concurrentes                            |
| Load test         | `scripts/k6-load-test.js`                |     1000     | 4 min        | Catálogo browsing 1K users                                 |
| Stress test       | `scripts/k6-stress-test.js`              |    10,000    | 7.5 min      | Breaking point (100→10K)                                   |
| Soak test         | `scripts/k6-soak-test.js`                |     500      | 2h           | Memory leaks, estabilidad                                  |
| Concurrent writes | `scripts/k6-concurrent-writes.js`        |     100      | 1 min        | Deadlocks, write latency                                   |
| Concurrent bids   | `scripts/k6-concurrent-bids.js`          |      —       | —            | Pujas simultáneas                                          |

---

## Thresholds consolidados

| Métrica        | Smoke  |  Load  | Stress |  Soak  | Fuente                     |
| -------------- | :----: | :----: | :----: | :----: | -------------------------- |
| Error rate     | <0.1%  | <0.5%  |  <20%  |  <1%   | k6-full.js, stress-test.js |
| P95 catálogo   | <500ms | <500ms |  <5s   | <500ms | k6-full.js                 |
| P95 ficha      | <500ms | <500ms |  <5s   | <500ms | k6-full.js                 |
| P95 API        | <200ms | <200ms |   —    |   —    | k6.config.js               |
| P99 global     |  <2s   |  <2s   |  <10s  |   —    | k6.config.js               |
| P99 health     | <50ms  | <50ms  |   —    |   —    | k6.config.js               |
| Cache hit rate |  >80%  |  >80%  |   —    |   —    | k6.config.js               |
| Write P95      |   —    |  <1s   |   —    |   —    | write-stress.js            |
| Deadlocks      |   0    |   0    |   —    |   —    | concurrent-writes.js       |

---

## Procedimiento de ejecución

### Pre-requisitos

1. k6 instalado (`choco install k6` / `brew install k6`)
2. Servidor corriendo (local, staging, o producción)
3. Slugs de vehículos reales en `K6_VEHICLE_SLUGS` (opcional)

### Secuencia recomendada

```bash
# 1. Smoke (validar que funciona)
K6_SCENARIO=smoke k6 run tests/load/k6-full.js

# 2. Load (pre-release baseline)
k6 run tests/load/k6-full.js \
  --summary-export=tests/load/results/$(date +%Y%m%d)-summary.json

# 3. Spike (si se espera viralidad)
k6 run tests/load/scenarios/spike-test.js

# 4. Soak (trimestral, contra staging)
K6_SCENARIO=soak k6 run tests/load/k6-full.js

# 5. Stress (solo para encontrar breaking point)
k6 run scripts/k6-stress-test.js
```

### Interpretación rápida de resultados

- `cache_hit_rate < 0.80` → revisar routeRules SWR en nuxt.config.ts
- `p(95) > 300ms` en catálogo → revisar índices (QUERY-BUDGET.md)
- `http_req_failed > 0.01` → revisar logs Supabase/Cloudflare
- `deadlocks > 0` → revisar isolation levels en endpoints de escritura
- Degradación progresiva en soak → memory leak en SSR

---

## Plan de acción priorizado

| #   | Acción                               | Esfuerzo | Impacto | Bloqueado por             |
| --- | ------------------------------------ | -------- | ------- | ------------------------- |
| 1   | Activar PgBouncer en Supabase        | 5 min    | Alto    | Acceso dashboard          |
| 2   | Añadir SWR a `/catalogo`             | 15 min   | Alto    | —                         |
| 3   | Aumentar SWR `/vehiculo/**` a 10min  | 10 min   | Medio   | —                         |
| 4   | Eliminar índices duplicados          | 15 min   | Bajo    | Verificar pg_stat en prod |
| 5   | Añadir índice full-text title        | 30 min   | Medio   | Demanda de búsqueda       |
| 6   | Circuit breaker para pool exhaustion | 2h       | Alto    | PgBouncer primero         |
| 7   | Cola pgmq para writes no-críticos    | 4h       | Medio   | Volumen de escritura      |
| 8   | Primer soak test real + monitoreo    | 2h       | Medio   | Staging operativo         |

---

_Ver también: [`QUERY-BUDGET.md`](QUERY-BUDGET.md) (SLOs e índices), [`BUNDLE-ANALYSIS.md`](BUNDLE-ANALYSIS.md) (umbrales JS), [`tests/load/README.md`](../../../tests/load/README.md) (guía de uso k6)_
