# Load Tests — Tracciona (k6)

> Herramienta: [k6](https://k6.io) — open-source, gratuito.
> Escenarios: catálogo, ficha vehículo, API pública.
> Resultados históricos: `tests/load/results/`

---

## Instalación

```bash
# Windows
choco install k6

# macOS
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt update && sudo apt install k6

# Docker (sin instalación)
docker run --rm -i grafana/k6 run - <tests/load/k6-full.js
```

---

## Uso rápido

```bash
# Smoke test — 5 VUs, 1 min (validar que funciona)
K6_SCENARIO=smoke k6 run tests/load/k6-full.js

# Load test — hasta 100 VUs, 5 min (por defecto)
k6 run tests/load/k6-full.js

# Contra staging
K6_BASE_URL=https://staging.tracciona.com k6 run tests/load/k6-full.js

# Contra producción (con cuidado)
K6_BASE_URL=https://tracciona.com K6_SCENARIO=smoke k6 run tests/load/k6-full.js

# Guardar resultados
mkdir -p tests/load/results
k6 run tests/load/k6-full.js --out json=tests/load/results/$(date +%Y%m%d-%H%M).json

# Stress test
K6_SCENARIO=stress k6 run tests/load/k6-full.js

# Soak test (30 min a carga sostenida)
K6_SCENARIO=soak k6 run tests/load/k6-full.js
```

---

## Scripts individuales

```bash
# Solo catálogo
k6 run tests/load/scenarios/catalog.js

# Solo fichas de vehículo
k6 run tests/load/scenarios/vehicle-detail.js

# Solo APIs públicas
k6 run tests/load/scenarios/api-public.js
```

---

## Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| `K6_BASE_URL` | `http://localhost:3000` | URL base del target |
| `K6_SCENARIO` | `load` | `smoke` / `load` / `stress` / `soak` |

---

## Perfiles de carga

| Perfil | VUs máx | Duración | Uso |
|---|:---:|---|---|
| `smoke` | 5 | 1 min | Validar que los scripts funcionan |
| `load` | 100 | 5 min | Test de carga normal (pre-release) |
| `stress` | 300 | ~11 min | Encontrar el punto de ruptura |
| `soak` | 50 | ~34 min | Detectar memory leaks o degradación lenta |

---

## Umbrales (thresholds)

Definidos en `k6.config.js`, alineados con `referencia/QUERY-BUDGET.md`:

| Métrica | Threshold |
|---|---|
| Error rate global | < 1% |
| P99 global | < 2 000ms |
| Catálogo P95 | < 300ms |
| Ficha vehículo P95 | < 300ms |
| API pública P95 | < 200ms |
| Health check P99 | < 50ms |
| Cache hit rate | > 80% |

Si algún threshold falla, k6 sale con código de error (útil para CI).

---

## Setup antes del primer test

### 1. Añadir slugs de vehículos reales

Editar `tests/load/scenarios/vehicle-detail.js` y `k6-full.js`:

```sql
-- Obtener slugs reales de la BD
SELECT slug FROM vehicles
WHERE status = 'published'
ORDER BY RANDOM()
LIMIT 20;
```

Reemplazar el array `vehicleSlugs` / `VEHICLE_SLUGS` con los resultados.

### 2. Verificar que el servidor está corriendo

```bash
# Local
curl http://localhost:3000/api/health

# Staging
curl https://staging.tracciona.com/api/health
```

### 3. Ejecutar smoke test primero

```bash
K6_SCENARIO=smoke k6 run tests/load/k6-full.js
```

---

## Interpretar resultados

```
✓ catalog 200
✓ catalog no 5xx
✗ catalog <500ms           ← FALLO: P95 supera umbral

http_req_duration......: avg=245ms min=12ms med=180ms max=1.2s p(90)=420ms p(95)=580ms p(99)=980ms
cache_hit_rate.........: 0.73 73.00%    ← Por debajo del 80% objetivo
```

**Claves a revisar:**
- `cache_hit_rate < 0.80` → revisar routeRules SWR en `nuxt.config.ts`
- `p(95) > 300ms` en catálogo → revisar índices en QUERY-BUDGET.md
- `http_req_failed > 0.01` → revisar logs de Supabase / Cloudflare
- `checks{...}: X%` → si < 99%, hay errores en respuestas

---

## Resultados históricos

Guardar un snapshot trimestral:

```bash
k6 run tests/load/k6-full.js \
  --out json=tests/load/results/$(date +%Y%m%d)-load.json \
  --summary-export=tests/load/results/$(date +%Y%m%d)-summary.json
```

Los archivos JSON de resultados están en `.gitignore` (pueden ser grandes).
Los archivos `-summary.json` sí se commitean para tracking histórico.

---

## Integración CI (opcional — tras estabilización)

```yaml
# .github/workflows/load-test.yml (deshabilitado por defecto)
# Activar manualmente con workflow_dispatch o en releases
- name: Load test (smoke)
  run: |
    K6_BASE_URL=${{ vars.STAGING_URL }} \
    K6_SCENARIO=smoke \
    k6 run tests/load/k6-full.js
```

> ⚠️ No ejecutar load tests en CI en cada PR — solo en releases o manualmente.

---

*Ver también: `referencia/QUERY-BUDGET.md` (SLOs), `referencia/BUNDLE-ANALYSIS.md` (umbrales JS)*
