# Plan: SonarQube 100% sin hacks

**Creado:** 2026-03-02 · **Actualizado:** 2026-03-14 (post-scan)
**Estado actual:** 345 issues abiertos (6 bugs + 339 code smells) — reducido de 870
**Completado:** Fase 1 ✅ · Fase 2 ✅ · Fase 4 parcial (6 de 12 reglas)
**Objetivo:** Quality Gate "Sonar way" en PASSED (0 violations, ≥80% coverage, ≤3% duplicados)
**Enfoque:** Fixes reales, sin bajar umbrales, sin atajos

---

## Estado inicial vs actual

| Métrica           | Inicial (02-mar)   | 13-mar      | **14-mar** | Objetivo (Sonar way) |
| ----------------- | ------------------ | ----------- | ---------- | -------------------- |
| Open issues       | **805**            | **870**     | **345** ✅ | **0**                |
| Bugs              | **13**             | **20**      | **6**      | **0**                |
| Code smells       | **792**            | **850**     | **339**    | **0**                |
| Security hotspots | **21** sin revisar | pendiente   | **22**     | **revisados**        |
| Coverage global   | **2.0%**           | **2.0%**    | **2.0%**   | N/A                  |
| Duplicated lines  | **6.01%**          | **2.7%** ✅ | **7.0%**   | **≤ 3%**             |
| Quality Gate      | **FAILED**         | **FAILED**  | **FAILED** | **PASSED**           |

> **Nota 14-mar:** Scan post-Fase 4. Issues bajaron de 870→345 (-525). Top reglas restantes: S3776 (68), css:S7924 (39), S1874 (38), S6551 (18), S6582 (15), S3358 (11). S7721: 153→8 ✅ S7763: 35→2 ✅ S7778: 23→2 ✅ S7781: 59→7 ✅

### Quality Gate actual (custom "Tracciona")

| Condición            | Estado  | Actual | Umbral |
| -------------------- | ------- | ------ | ------ |
| New coverage         | ❌ FAIL | 6.2%   | ≥ 10%  |
| New duplicated lines | ✅ PASS | 2.7%   | ≤ 10%  |
| New violations       | ❌ FAIL | 4      | 0      |

---

## Fase 1 — Bugs (13 issues) · Modelo: Sonnet

Los bugs son errores reales de lógica. Van primero.

### Desglose por regla

| #   | Regla | Cant | Qué es                                     | Fix                                          |
| --- | ----- | ---- | ------------------------------------------ | -------------------------------------------- |
| 1   | S5850 | 6    | Regex sin agrupar alternativas con anchors | Añadir paréntesis: `/^a\|b$/` → `/^(a\|b)$/` |
| 2   | S4656 | 5    | CSS propiedades duplicadas                 | Eliminar la declaración redundante           |
| 3   | S3923 | 1    | Condicional con ambas ramas idénticas      | Eliminar el condicional, dejar solo el valor |
| 4   | S6959 | 1    | `reduce()` sin valor inicial               | Añadir segundo argumento a `.reduce()`       |

### Archivos específicos

**S5850 (Regex sin agrupar — 6 issues):**

- `app/composables/dashboard/useDashboardImportar.ts` — agrupar alternativas
- `app/composables/admin/useAdminSubcategoriasPage.ts`
- `app/composables/admin/useAdminTiposPage.ts`
- `server/api/cron/generate-editorial.post.ts`
- `server/services/vehicleCreator.ts`
- `app/utils/fileNaming.ts`

**S4656 (CSS propiedades duplicadas — 5 issues):**

- `app/components/admin/subastas/AdminAuctionListHeader.vue` — `align-items` duplicado
- `app/pages/admin/config/editorial.vue` — `margin` duplicado
- `app/pages/admin/subastas/[id].vue` — 3x duplicados (`align-items`, `gap`)

**S3923 (Ramas idénticas — 1 issue):**

- `app/composables/admin/useAdminVehicleDetail.ts` — condicional que devuelve lo mismo en ambas ramas

**S6959 (reduce sin valor inicial — 1 issue):**

- `app/composables/useInfraRecommendations.ts` — `.reduce()` sin segundo argumento

**Esfuerzo total:** ~1 hora (todos son fixes de 1-2 líneas)

---

## Fase 2 — BLOCKER + CRITICAL (3 issues) · Modelo: Sonnet

| #   | Regla | Sev      | Qué es                                 | Fix                                           |
| --- | ----- | -------- | -------------------------------------- | --------------------------------------------- |
| 1   | S3516 | BLOCKER  | Función con return invariante          | Eliminar ramas muertas o refactorizar         |
| 2   | S4123 | CRITICAL | `await` en algo que no es Promise      | Eliminar await o corregir tipo                |
| 3   | S2004 | CRITICAL | Funciones anidadas demasiado profundas | Extraer a funciones nombradas (máx 3 niveles) |

**Esfuerzo total:** ~1 hora

---

## Fase 3 — Cognitive Complexity S3776 (70 issues) · Modelo: Opus

La fase más pesada. Funciones que superan complejidad 15.

### Top 10 offenders

| Complejidad | Archivo                                                    | Tipo       | Estrategia                                                     |
| ----------- | ---------------------------------------------------------- | ---------- | -------------------------------------------------------------- |
| 119         | `server/api/stripe/webhook.post.ts`                        | Webhook    | Extraer handlers por event type a funciones puras + objeto map |
| 70          | `server/api/whatsapp/webhook.post.ts`                      | Webhook    | Ídem — handler por tipo de mensaje                             |
| 64          | `server/api/cron/infra-metrics.post.ts`                    | Cron       | Extraer colectores por servicio (compute, postgres, storage)   |
| 63          | `app/utils/generatePdf.ts`                                 | Utility    | Extraer secciones (header, body, footer) a builders            |
| 52          | `app/composables/dashboard/useDashboardExportar.ts`        | Composable | Extraer formatters por tipo de dato                            |
| 50          | `server/api/advertisements.post.ts`                        | Endpoint   | Extraer validación y transformación a helpers                  |
| 48          | `app/composables/useUserLocation.ts`                       | Composable | Simplificar cadena de fallbacks (IP → geolocation → defaults)  |
| 45          | `server/api/cron/founding-expiry.post.ts`                  | Cron       | Extraer lógica de renovación/caducidad                         |
| 43          | `server/api/infra/clusters/[id].patch.ts`                  | Endpoint   | Extraer parsers de payload por tipo de cluster                 |
| 39          | `app/composables/dashboard/useDashboardExportarAnuncio.ts` | Composable | Extraer validación y conversión de formatos                    |

### Patrón común

Casi todos tienen:

- **Cadenas if/else largas** → extraer a objeto `handlers` o `strategies` map
- **switch statements** con muchos cases → función por case, objeto con referencias
- **Lógica anidada** → extraer a funciones nombradas (cada una hace una cosa)

### Ejemplo: stripe/webhook.post.ts (complejidad 119)

Actual: 1 función gigante que maneja 20+ event types

```ts
// DESPUÉS
const handlers: Record<string, (event: Stripe.Event) => Promise<void>> = {
  'charge.succeeded': handleChargeSucceeded,
  'charge.refunded': handleChargeRefunded,
  'customer.subscription.created': handleSubscriptionCreated,
  // ... etc
}

export default defineEventHandler(async (event) => {
  const stripeEvent = JSON.parse(await readBody(event))
  const handler = handlers[stripeEvent.type]
  if (!handler) return
  await handler(stripeEvent)
})

// Cada handler es función pura chica:
async function handleChargeSucceeded(event: Stripe.Event) { ... }
async function handleChargeRefunded(event: Stripe.Event) { ... }
// etc
```

**Esfuerzo total:** 4-6 sesiones (refactoring pesado pero mecánico)

---

## Fase 4 — Mechanical fixes (470+ issues) · Modelo: Haiku

Search-replace automáticos. Se pueden hacer en lotes.

| Regla | Inicial | Post-scan | Patrón                                          | Estado                                                                 |
| ----- | ------- | --------- | ----------------------------------------------- | ---------------------------------------------------------------------- |
| S7781 | 113     | **70**    | `.replace(/x/g, 'y')` → `.replaceAll('x', 'y')` | 🔄 -43 fixes (solo literales simples; regex complejas NO convertibles) |
| S7764 | 74      | **44**    | `window.X` → `globalThis.X`                     | 🔄 -30 (quedan 44 — SonarQube detectó más en .vue templates)           |
| S6598 | 65      | **65**    | `{ (x: T): R }` → `(x: T) => R`                 | ⏳ Pendiente                                                           |
| S4325 | 61      | **61**    | `x as Type` → type narrowing                    | ⏳ Pendiente                                                           |
| S7763 | 35      | **35**    | `import+export` → `export from`                 | ⏳ Pendiente                                                           |
| S7735 | 30      | **25**    | `if (!x)` → `if (x)` invertida                  | 🔄 -5 fixes                                                            |
| S7778 | 23      | **23**    | Method chaining                                 | ⏳ Pendiente                                                           |
| S6582 | 21      | **16**    | `a && a.b` → `a?.b`                             | 🔄 -5 (con `a != null && a.b` cuando TS no narrowea)                   |
| S6606 | 16      | **16**    | `a !== null ? a : b` → `a ?? b`                 | ⏳ Sin candidatos simples por grep                                     |
| S7755 | 12      | **4**     | `arr[arr.length-1]` → `arr.at(-1)`              | 🔄 -8 (quedan 4)                                                       |
| S7744 | 12      | **12**    | Spreads innecesarios                            | ⏳ Pendiente                                                           |
| S1135 | 8       | **8**     | `// TODO` comments                              | ⚠️ No se redujeron (TODOs en archivos no tocados)                      |

**Reglas nuevas detectadas en este scan:**

| Regla | Cant | Qué es                                                              |
| ----- | ---- | ------------------------------------------------------------------- |
| S7721 | 153  | Inner functions (ya trabajadas, pero SonarQube detectó más en .vue) |
| S2871 | 14   | Array.sort() sin comparator                                         |
| S7762 | 6    | Prefer using array destructuring                                    |
| S4043 | 6    | Use `Array.includes()` instead of `indexOf()`                       |
| S7776 | 5    | Prefer for...of                                                     |
| S6594 | 5    | Prefer String.startsWith/endsWith                                   |
| S7748 | 4    | Prefer nullish coalescing assignment                                |
| S7754 | 3    | Prefer string template                                              |
| S6571 | 3    | Exclusive tests (describe.only/it.only)                             |

**Esfuerzo total:** 2-3 sesiones (muchos son regex replace masivos)

---

## Fase 5 — Code Quality (160+ issues) · Modelo: Sonnet

Lógica y estructura de código.

| Regla | Cant | Qué es                                                 | Fix                                                |
| ----- | ---- | ------------------------------------------------------ | -------------------------------------------------- |
| S6551 | 54   | Objetos convertidos a strings sin toString()           | Añadir `toString()` o conversión explícita         |
| S1874 | 38   | APIs deprecated (ej. `Date.parse()`, `XMLHttpRequest`) | Reemplazar por alternativas modernas               |
| S4624 | 15   | Template literals anidados                             | Desanidar: usar variables intermedias o formatters |
| S3358 | 14   | Ternarios anidados                                     | Reemplazar por if/else o extraer a función         |
| S4165 | 13   | Asignaciones redundantes (ej. `x = x`)                 | Eliminar                                           |
| S4144 | 4    | Funciones con implementación idéntica                  | Fusionar en una, llamar desde ambos lugares        |
| S1871 | 2    | Ramas de condicional idénticas                         | Eliminar bifurcación                               |
| S1854 | 2    | Asignaciones nunca leídas                              | Eliminar                                           |
| Otros | ~20  | Varios (S4323, S7758, S7760, S7766, etc.)              | Revisar por severidad                              |

**Esfuerzo total:** 2-3 sesiones

---

## Fase 6 — CSS (61 issues) · Modelo: Sonnet

| Regla | Cant | Qué es                     | Fix                                  |
| ----- | ---- | -------------------------- | ------------------------------------ |
| S7924 | 39   | Contraste insuficiente     | Ajustar colores para WCAG AA (4.5:1) |
| S4666 | 16   | Selectores CSS duplicados  | Mergear reglas                       |
| S4656 | 5    | Propiedades CSS duplicadas | Eliminar redundantes                 |
| S4667 | 1    | Archivo CSS vacío          | Eliminar o rellenar                  |

**Nota:** S7924 (contraste) puede requerir decisiones de diseño. Revisar con diseñador si es necesario.

**Esfuerzo total:** 1-2 sesiones

---

## Fase 7 — Security Hotspots (21 items) · Modelo: Opus

**Importante:** Cada uno se revisa individualmente. No vale marcar "Reviewed" sin justificación real.

### Desglose por tipo

| Tipo                     | Cant | Acción                                                                                       | Ejemplos                                                                                  |
| ------------------------ | ---- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Regex ReDoS**          | 12   | Reescribir regex vulnerables a backtracking catastrófico                                     | `app/components/catalog/VehicleCard.vue`, `app/composables/admin/useAdminEmails.ts`, etc. |
| **`Math.random()`**      | 6    | Documentar que NO se usa para criptografía, O migrar a `crypto.randomUUID()` si es necesario | `app/composables/admin/useAdminHomepage.ts`, `useAds.ts`, etc.                            |
| **Weak hash (MD5/SHA1)** | 2    | Verificar contexto: ¿fingerprinting (ok) o seguridad (no ok)?                                | `server/api/__sitemap.ts`, `merchant-feed.get.ts`                                         |
| **Geolocation**          | 1    | Documentar necesidad de negocio                                                              | `app/composables/useUserLocation.ts`                                                      |

**Proceso:**

1. Abrir cada hotspot en SonarQube
2. Leer el análisis detallado
3. Una de:
   - **Marcar como "Acknowledged"** + comentario "Seguro porque..." (si realmente lo es)
   - **Marcar como "Won't Fix"** + justificación (si es necesario por negocio)
   - **CORREGIR** (si es vulnerabilidad real)

**Esfuerzo total:** 1 sesión (principalmente lectura + documentación)

---

## Fase 8 — Test Coverage ≥80% en new code · Modelo: Sonnet

Después de todas las correcciones anteriores, la línea de "new code" será todo lo modificado. Necesitamos ≥80%.

### Sub-tareas

#### 1. Arreglar test roto (30 min)

**`useCatalogState.test.ts`** tiene 13 fallos porque mock de vue falta `inject`.

Fix: En `tests/setup.ts` o en el mismo test file, añadir:

```ts
vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    inject: vi.fn(), // Mock para el inject de useCatalogState
  }
})
```

#### 2. Tests para funciones puras (~50 funciones)

Todas las funciones movidas a module scope en S7721:

- `formatTime`, `calculateProfit`, `getStatusColor`, `formatCurrency`, `canEdit`, `canCancel`, `getStatusClass`, `isEndingSoon`, `daysUntilEnd`, `calcCTR`, `downloadFile`, `isAlwaysOn`, `generatePostContent`, `getRecommendation`, `getAllRecommendations`, `formatAmount`, `applyTheme`, `urlBase64ToUint8Array`, etc.

**Patrón:** Input → output, sin mocks, sin side effects

```ts
// Ejemplo: formatTime.test.ts
import { formatTime } from '~/app/composables/useUserChat'

describe('formatTime', () => {
  it('returns time format for same day', () => {
    const now = new Date()
    const input = now.toISOString()
    const result = formatTime(input)
    expect(result).toMatch(/\d{2}:\d{2}/)
  })

  it('returns "Ayer" for yesterday', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    expect(formatTime(yesterday)).toBe('Ayer')
  })

  // ... 5-10 casos por función
})
```

**Esfuerzo:** ~5-8 test files, 200-300 assertions, **~8-12 horas**

#### 3. Tests para lógica de negocio

Composables con lógica condicional/transformaciones:

- `useFilters` (filtrado, merging)
- `useAdminBalance.summary` (agregaciones)
- `parseLocation` (parseo geografía)
- `fuzzyMatch` (búsqueda)
- `useSeoScore` (scoring)

**Patrón:** Cases comunes, edge cases, boundary values

```ts
// Ejemplo: useFilters.test.ts
describe('useFilters', () => {
  it('merges filters without losing existing ones', () => {
    const { updateFilters } = useFilters()
    updateFilters({ price_min: 1000 })
    updateFilters({ brand: 'Mercedes' })
    expect(filters.value).toEqual({
      price_min: 1000,
      brand: 'Mercedes'
    })
  })

  it('clears search when query is empty', () => { ... })
  // ... edge cases
})
```

**Esfuerzo:** ~5-8 test files, 100-200 assertions, **~6-10 horas**

#### 4. Tests para funciones refactorizadas (Fase 3)

Cuando extraigamos handlers del webhook, cron, etc., cada uno nuevo es testeado:

```ts
// Después de refactorizar stripe/webhook.post.ts
describe('handleChargeSucceeded', () => {
  it('creates payment record when charge succeeds', async () => {
    const mockEvent = { ... }
    await handleChargeSucceeded(mockEvent)
    expect(mockPayment).toHaveBeenCalledWith(...)
  })
  // ...
})
```

**Esfuerzo:** ~10-15 test files, **~10-15 horas**

#### 5. Regression tests para bugs corregidos (Fase 1)

Test para cada uno de los 13 bugs antes de corregirlo (para verificar que el fix funciona):

```ts
// S5850: regex without grouping should fail
// After fix: should pass
```

**Esfuerzo:** ~2-3 test files, **~2-3 horas**

#### 6. Configurar vitest

Ya hecho en sesión anterior: `vitest.config.ts` tiene `coverage` con `reportOnFailure: true`.

**Total Fase 8:** 3-5 sesiones (30-40 horas)

---

## Fase 9 — Duplicated Lines ≤3% en new code · Modelo: Sonnet

Actualmente 6.01%. Identificar y extraer patrones.

### Proceso

1. **Ejecutar scan SonarQube** y obtener reporte de bloques duplicados
2. **Identificar patrones:**
   - Validación repetida (ej. checks de dealer_id en 5 endpoints)
   - Formateadores repetidos (ej. currency format en 3 lugares)
   - Transformaciones de datos (ej. parseLocation en 2 composables)
3. **Extraer a:**
   - Funciones utilidad en `app/utils/` o `server/utils/`
   - Composables si es lógica Vue
   - Helpers en servicios si es server-side
4. **Re-scan y verificar** que duplicados ≤3%

**Esfuerzo total:** 1-2 sesiones

---

## Fase 10 — Quality Gate final · Modelo: Opus

Restaurar al estándar "Sonar way" (built-in).

### Checklist

- [ ] Eliminar Quality Gate custom "Tracciona"
- [ ] Asignar proyecto a Quality Gate "Sonar way" (built-in)
- [ ] Ejecutar scan final
- [ ] Verificar dashboard:
  - [ ] `new_violations = 0`
  - [ ] `new_coverage ≥ 80%`
  - [ ] `new_duplicated_lines_density ≤ 3%`
  - [ ] `new_security_hotspots_reviewed = 100%`
- [ ] Actualizar STATUS.md: "SonarQube 100% alcanzado"

**Esfuerzo total:** 1 sesión (validación)

---

## Resumen total

| Fase                    | Issues inicio | Restantes                 | Modelo | Estado                                 |
| ----------------------- | ------------- | ------------------------- | ------ | -------------------------------------- |
| 1. Bugs                 | 13            | 20 (7 nuevos detectados)  | Sonnet | ✅ Originales resueltos                |
| 2. Blocker/Critical     | 3             | 0 blockers, 84 critical\* | Sonnet | ✅ Originales resueltos                |
| 3. Cognitive complexity | 70            | 69                        | Opus   | ⏳                                     |
| 4. Mechanical fixes     | 470+          | ~380                      | Haiku  | 🔄 ~90 fixes aplicados                 |
| 5. Code quality         | 160+          | ~160                      | Sonnet | ⏳                                     |
| 6. CSS                  | 61            | 56                        | Sonnet | ⏳                                     |
| 7. Security hotspots    | 21            | pendiente                 | Opus   | ⏳                                     |
| 8. Test coverage        | —             | 6.2% new                  | Sonnet | ⏳                                     |
| 9. Duplicated lines     | —             | 2.7% ✅                   | Sonnet | ✅ Ya cumple ≤3%                       |
| 10. Final verification  | —             | —                         | Opus   | ⏳                                     |
| **TOTAL**               | **805**       | **870**                   | —      | **~11% reducido en reglas trabajadas** |

> \*Critical incluye issues de severidad CRITICAL (84), no solo los 3 originales de Fase 2. SonarQube reclasificó severidades.

---

## Orden recomendado

1. **Fases 1-2** — Bugs y blockers (4h total, impacto inmediato)
2. **Fase 4** — Mechanical fixes (6-9h, reduce volumen rápido, ganancia psicológica)
3. **Fase 3** — Cognitive complexity (15-20h, refactoring pesado pero máximo valor)
4. **Fases 5-9** — Independientes, hacer en paralelo o secuencial según recursos
5. **Fase 10** — Final (validación)

---

## Comandos útiles

### Re-scan SonarQube

```bash
cd /c/TradeBase/Tracciona
PROJECT_DIR="$(pwd -W)"
SCAN_TOKEN="squ_7e961e46120333d0f3ed3696fd63efdc08112ffe"

MSYS_NO_PATHCONV=1 docker run --rm \
  --network="host" \
  -v "$PROJECT_DIR:/usr/src" \
  -w //usr/src \
  sonarsource/sonar-scanner-cli:latest \
  -Dsonar.host.url="http://localhost:9000" \
  -Dsonar.token="$SCAN_TOKEN"
```

### Ver issues por severidad

```bash
curl -s "http://localhost:9000/api/issues/search?projectKeys=tracciona&statuses=OPEN&facets=severities&ps=1" \
  -u "admin:Tracciona333!" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for val in data['facets'][0]['values']:
  print(f\"{val['val']:10s} {val['count']:>3} issues\")
"
```

### Ver Quality Gate actual

```bash
curl -s "http://localhost:9000/api/qualitygates/project_status?projectKey=tracciona" \
  -u "admin:Tracciona333!" | python3 -c "
import json, sys
data = json.load(sys.stdin)
ps = data['projectStatus']
print(f\"Status: {ps['status']}\n\")
for c in ps.get('conditions', []):
  icon = 'PASS' if c['status'] == 'OK' else 'FAIL'
  print(f\"[{icon}] {c['metricKey']:45s} actual={c.get('actualValue','?'):>8s}  threshold={c.get('errorThreshold','?')}\")
"
```

### Ejecutar tests con coverage

```bash
npm run test:unit -- --coverage
```

---

## Notas importantes

- **S7721** (inner functions): Ya completado. Solo quedan: `useAds.ts/detectGeo` (usa `useNuxtApp()`, skip intencional).
- **Coverage generado:** `coverage/lcov.info` existe, vitest configurado con `reportOnFailure: true`.
- **Quality Gate custom:** "Tracciona" se borra al final. Restaurar a "Sonar way" built-in.
- **Sin hacks:** Todo es refactoring legítimo, tests reales, fixes de seguridad. Cero lowering de umbrales.
- **Tokens SonarQube:** Token usado: `squ_7e961e46120333d0f3ed3696fd63efdc08112ffe` (creado 02-mar). Si expira, regenerar con: `curl -X POST http://localhost:9000/api/user_tokens/generate -u "admin:Tracciona333!" -d "name=scan-token-$(date +%s)"`

## Lecciones aprendidas (sesiones 02-13 mar)

- **S6582 + TypeScript:** `a?.b > 0` NO narrowea `a` a non-null en el bloque if. Usar `a != null && a.b > 0` que SÍ narrowea y no viola S6582.
- **S7781 (replaceAll):** SOLO convertir literales simples (`&`, `<`, `>`, `"`, `'`, `_`, `-`, `|`, `\n`). NUNCA convertir character classes (`[...]`), cuantificadores (`+`, `*`), escapes especiales (`\s`, `\d`, `\w`, `\D`, `\b`), ni capture groups.
- **sed masivo = peligroso:** Un sed para convertir `.replace(/x/g,` a `.replaceAll(` rompió 15+ archivos con regex complejas. Siempre hacer manualmente o con grep + revisión archivo por archivo.
