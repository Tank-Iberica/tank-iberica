# Plan de Mejora del Sistema de Tests

**Creado:** 2026-03-05
**Actualizado:** 2026-03-05 — Correcciones: orden de fases, MSW para security, fase composables, pre-push ligero, @nuxt/test-utils
**Estado:** ✅ Todas las fases completadas (1–8). Tests: 418→492+

---

## ⚠️ Orden de ejecución obligatorio

**El orden importa.** Ejecutar Fase 1 (quitar `continue-on-error`) antes de arreglar los security tests (Fase 3) y consolidar la Fase 4 (MSW + integration job con servidor real) bloqueará todos los PRs inmediatamente — los security tests hacen `return` silencioso sin servidor y CI los marca como pasados hoy, pero si el job ya no ignora errores, cualquier fallo real queda expuesto.

```
Orden correcto:
Fase 3 → Fase 4 → Fase 1 → Fase 2 → Fase 5 → Fase 6 → Fase 7 → Fase 8
```

---

## Contexto — Diagnóstico inicial

### Arquitectura actual de tests

| Herramienta | Carpeta | Qué cubre | Cuenta para coverage |
|-------------|---------|-----------|---------------------|
| Vitest | `tests/unit/` | Composables, utils, server utils | Sí |
| Vitest | `tests/components/` | 3 componentes Vue | Sí |
| Vitest | `tests/security/` | Seguridad (parcial — falso verde sin servidor) | Sí |
| Vitest | `tests/db/` | Consistencia de migraciones (filesystem) | Sí |
| Playwright | `tests/e2e/` | Flujos de usuario contra localhost | No |
| Playwright | `tests/e2e/journeys/` | Journeys completos (buyer, dealer, admin) | No |

**Coverage actual:** 80.01% statements (Vitest únicamente)
**Gap grande:** 418 componentes Vue + 147 composables — casi sin tests unitarios

### Jobs de CI (`.github/workflows/ci.yml`)

| Job | Bloquea merge | Problema |
|-----|--------------|----------|
| `lint-and-typecheck` | Sí | Coverage usa `continue-on-error: true` — tests pueden fallar y CI pasa |
| `e2e-tests` | **No** (`continue-on-error: true`) | No bloquea nada |
| `e2e-journeys` | **No** (`continue-on-error: true`) | Correcto — es exploratorio, necesita credentials |
| `lighthouse` | Sí | OK |

---

## Problemas identificados

### P0 — Críticos

**1. CI no bloquea por fallo de tests**
- `continue-on-error: true` en el paso de coverage de `lint-and-typecheck`
- El check posterior solo verifica existencia del archivo, no que los tests pasaron
- Referencia: step `Run tests with coverage` del job `lint-and-typecheck` en `ci.yml`

**2. Sin umbrales de coverage**
- No hay `thresholds` en `vitest.config.ts`
- El 80% actual puede caer a 0% sin que CI lo detecte
- Referencia: sección `coverage` de `vitest.config.ts`

**3. Security tests con falso verde**
- Si no hay servidor, los tests hacen `return` silencioso y pasan
- Problema de fondo: son tests de integración corriendo bajo Vitest (no arranca servidor)
- Solución en dos capas (ver Fase 4): MSW para contratos rápidos + integration job con servidor real para wiring Nitro/auth real
- Referencias: `authorization-regression.test.ts`, `auth-endpoints.test.ts`, `information-leakage.test.ts`

**4. safeError.test.ts inestable en coverage**
- Usa reimports dinámicos con cambio de `NODE_ENV` — provoca timeouts en modo coverage
- Referencia: `safeError.test.ts:11`, `safeError.ts`

### P1 — Importantes

**5. Gap de cobertura en composables puros**
- 147 composables y 418 componentes, casi sin tests
- Los composables sin dependencias de Supabase/Nuxt son testeables hoy con Vitest
- Ejemplos inmediatos: `fuzzyMatch.ts`, `kmScore.ts`, `adminMetricsExport.ts`, `parseLocation.ts`

**6. E2E frágiles por esperas fijas**
- `waitForTimeout(2000)` no sabe cuándo termina una operación — causa flaky tests en CI lento
- Referencias: `admin-flow.spec.ts:93`, `auction-flow.spec.ts:32`

**7. IDOR tests son todos `.todo()`**
- 3 tests de seguridad críticos no implementados
- Bloqueado hasta tener Supabase staging
- Referencia: `idor-protection.test.ts:9`

### P2 — Menores

**8. Sin pre-push hook**
- Solo pre-commit con lint-staged
- Solución ligera: solo `typecheck + lint` (no tests completos — ver Fase 7)

**9. `sleep 10` en e2e-journeys**
- Espera fija antes de correr journeys — mejor esperar health endpoint activo

---

## Plan de ejecución por fases

---

### Fase 3 — Arreglar safeError inestable *(ejecutar primero)*
**Modelo: Sonnet · Prioridad: P0 · ~30 min**

**Archivos:** `server/utils/safeError.ts`, `tests/unit/server/safeError.test.ts`

Problema: `safeError.ts` evalúa `NODE_ENV` como constante de módulo. El test cambia `NODE_ENV` y reimporta dinámicamente, provocando timeouts en coverage.

Solución:

1. En `safeError.ts`: mover la lógica de entorno a función evaluada en runtime:
```ts
// Antes (constante de módulo — problemático)
const isProd = process.env.NODE_ENV === 'production'

// Después (función runtime — testeable)
function isProd() { return process.env.NODE_ENV === 'production' }
```

2. En `safeError.test.ts`: reemplazar reimport dinámico por `vi.stubEnv`:
```ts
// Antes
process.env.NODE_ENV = 'production'
const { safeError } = await import('../safeError') // reimport — inestable

// Después
vi.stubEnv('NODE_ENV', 'production')
// usar directamente safeError importado al inicio del archivo
```

Resultado esperado: `safeError.test.ts` pasa de forma idéntica en `npm run test` y `npm run test:coverage`.

---

### Fase 4 — Security tests en dos capas *(ejecutar antes de quitar continue-on-error)*
**Modelo: Sonnet · Prioridad: P0 · ~2h**

**Archivos:** `tests/security/authorization-regression.test.ts`, `tests/security/auth-endpoints.test.ts`, `tests/security/information-leakage.test.ts`

#### Capa 1 — Vitest + MSW (contratos rápidos, deterministas)

MSW valida que el código de la aplicación envía las cabeceras correctas y maneja los códigos de respuesta esperados. **No valida middleware Nitro real, auth real ni wiring H3** — eso es responsabilidad de la Capa 2.

Instalación:
```bash
npm install -D msw
```

Patrón de fix para cada archivo:
```ts
// Antes — falso verde si no hay servidor
const serverAvailable = await checkServer()
if (!serverAvailable) return  // pasa silenciosamente

// Después — con MSW (URL absoluta — fetch en Node requiere URL completa)
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:3000'

const server = setupServer(
  http.get(`${BASE}/api/vehicles/:id`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return HttpResponse.json({ id: '123' }, { status: 200 })
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

it('endpoint sin auth → 401', async () => {
  const res = await fetch(`${BASE}/api/vehicles/123`)
  expect(res.status).toBe(401)
})
```

⚠️ **Nota URL:** `fetch('/api/...')` falla en Node porque no hay base URL implícita. Siempre usar `${BASE}/api/...` donde `BASE = 'http://localhost:3000'`. Definir `BASE` en `tests/setup.ts` como variable global si se usa en múltiples archivos.

#### Capa 2 — Integration job con servidor real (wiring real)

MSW no puede verificar que el middleware de Nitro, la validación de Supabase JWT ni los hooks H3 funcionan correctamente en producción. Para eso mantener (o crear) un job CI separado que arranque el servidor real:

```yaml
# En ci.yml — job existente o nuevo
security-integration:
  runs-on: ubuntu-latest
  needs: [lint-and-typecheck]
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version: 20, cache: npm }
    - run: npm ci
    - run: npm run build
      env:
        SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
        # resto de secrets necesarios
    - run: node .output/server/index.mjs &
    - run: npx playwright test tests/e2e/security.spec.ts
```

Este job puede ser `continue-on-error: true` inicialmente hasta que los tests sean estables.

Resultado esperado: Capa 1 falla ruidosamente si el código no maneja auth. Capa 2 falla si el servidor real no responde como se espera.

---

### Fase 1 — CI bloqueo real *(después de Fases 3 y 4)*
**Modelo: Haiku · Prioridad: P0 · ~15 min**

**Archivo:** `.github/workflows/ci.yml`

Cambios:
- Quitar `continue-on-error: true` del paso de coverage en `lint-and-typecheck`
- Reescribir el check de coverage para que falle si los tests fallan
- Quitar `continue-on-error: true` del job `e2e-tests`
- Mantener `continue-on-error: true` en `e2e-journeys` (exploratorio, necesita credentials)

Resultado esperado: un PR que rompe tests es rechazado automáticamente.

---

### Fase 2 — Thresholds de coverage obligatorios
**Modelo: Haiku · Prioridad: P0 · ~5 min**

**Archivo:** `vitest.config.ts`

Añadir en la sección `coverage`:
```ts
thresholds: {
  statements: 80,
  lines: 80,
  branches: 65,   // más bajo — branches son difíciles de cubrir sin staging
  functions: 70,  // más bajo — hay funciones que solo se testean con servidor
}
```

Nota: ejecutar `npm run test:coverage` antes de hacer el PR para verificar que los thresholds se cumplen con el estado actual. Si alguno no llega, ajustar el umbral al valor real actual − 1%.

Resultado esperado: cualquier PR que baje coverage por debajo del umbral es rechazado.

---

### Fase 5 — Cobertura de utils puros: backfill + convención permanente
**Modelo: Sonnet · Prioridad: P1**

#### Fase 5a — Backfill inicial (~2h)

**Carpeta objetivo:** `tests/unit/`

Gap identificado: utils existentes sin tests. Los que no dependen de Supabase ni del contexto de Nuxt son testeables hoy con Vitest.

Candidatos inmediatos (funciones puras, sin deps de Nuxt/Supabase):

| Archivo | Tipo | Por qué testeable ahora |
|---------|------|------------------------|
| `app/utils/fileNaming.ts` | Función pura | slugify, publicId, altText, folderName |
| `app/utils/fuzzyMatch.ts` | Función pura | Solo string → boolean *(ya tiene test)* |
| `app/utils/kmScore.ts` | Función pura | Solo número → score *(ya tiene test)* |
| `app/utils/adminMetricsExport.ts` | Función pura | Datos → CSV *(ya tiene test)* |
| `app/utils/parseLocation.ts` | Función pura | String → objeto *(ya tiene test)* |
| `app/utils/productName.ts` | Función pura | Objeto → string *(ya tiene test)* |
| `app/utils/invoiceFormatters.ts` | Función pura | Números → strings formateados |
| `app/composables/useLocalized.ts` | Composable simple | Depende solo de locale mock |
| `app/composables/useFilters.ts` | Composable | Lógica de filtros sin BD |

Criterio de selección: si el util no importa `useSupabaseClient`, `useSupabaseUser` ni hace `fetch`, es candidato directo.

**Nota sobre @nuxt/test-utils:**
Para composables que usan `useI18n()`, `useSupabaseClient()`, `useRouter()` internamente se necesita el contexto de Nuxt. No instalar preventivamente — solo si se decide testear composables con contexto Nuxt complejo.

Resultado esperado: +5-10% de coverage en SonarQube `new_coverage`, base de tests para los módulos más reutilizados.

---

#### Fase 5b — Convención permanente con manifest explícito

**Toda función pura en `app/utils/` o `server/utils/` debe tener test. Verificado por CI mediante un manifest explícito** — no por inferencia de glob (el glob no detecta si un archivo importa Supabase o usa DOM).

**Archivo manifest:** `tests/pure-utils.manifest.json`

```json
{
  "comment": "Lista de utils que deben tener test. Añadir aquí al crear un util puro nuevo.",
  "utils": [
    "app/utils/fileNaming.ts",
    "app/utils/fuzzyMatch.ts",
    "app/utils/kmScore.ts",
    "app/utils/adminMetricsExport.ts",
    "app/utils/parseLocation.ts",
    "app/utils/productName.ts",
    "app/utils/invoiceFormatters.ts",
    "server/utils/fetchWithRetry.ts"
  ]
}
```

**Check CI** (añadir al job `lint-and-typecheck` en `ci.yml`):

```yaml
- name: Verify pure utils have tests
  run: |
    node scripts/check-pure-utils.mjs
```

**Script** `scripts/check-pure-utils.mjs`:

```js
import { readFileSync } from 'fs'
import { existsSync } from 'fs'
import { basename } from 'path'

const manifest = JSON.parse(readFileSync('tests/pure-utils.manifest.json', 'utf8'))
let missing = 0

for (const util of manifest.utils) {
  const base = basename(util.replace('.ts', ''))
  const candidates = [
    `tests/unit/${base}.test.ts`,
    `tests/unit/server/${base}.test.ts`,
  ]
  if (!candidates.some(existsSync)) {
    console.error(`❌ Sin test: ${util}`)
    missing++
  }
}

if (missing > 0) process.exit(1)
console.log(`✅ Todos los utils puros tienen test (${manifest.utils.length} verificados)`)
```

**Criterio para añadir al manifest** (igual que CONTRIBUTING.md):
- No importa `useSupabaseClient`, `useSupabaseUser`, ni hace `fetch` a APIs externas
- No importa `useNuxtApp`, `useRuntimeConfig`, `useI18n` directamente
- Si usa DOM, se testea con `vi.stubGlobal` — ver `adminMetricsExport.test.ts` como referencia

**Al crear un util nuevo:** añadir al manifest + crear el test en el mismo PR. CI bloqueará si falta alguno de los dos.

---

### Fase 6 — E2E deterministas
**Modelo: Sonnet · Prioridad: P1 · ~1h**

**Archivos:** `tests/e2e/admin-flow.spec.ts`, `tests/e2e/journeys/auction-flow.spec.ts` y cualquier otro con `waitForTimeout`

Reemplazar esperas fijas por esperas deterministas:

```ts
// Antes — frágil
await page.waitForTimeout(2000)

// Después — según el caso
await page.waitForURL(/\/dashboard/)           // espera navegación
await expect(elemento).toBeVisible()           // espera visibilidad
await page.waitForResponse(r => r.url().includes('/api/'))  // espera API
await page.waitForLoadState('networkidle')     // espera carga completa
```

Resultado esperado: E2E estables en CI lento (runners de GitHub son más lentos que local).

---

### Fase 7 — Pre-push hook ligero + sleep→health
**Modelo: Haiku · Prioridad: P2 · ~20 min**

**Archivos:** `.husky/pre-push`, `package.json`, `.github/workflows/ci.yml`

**Por qué ligero:** `npm run test` tarda 2-3 minutos en cada push. En proyectos con commits frecuentes esto lleva inevitablemente a `git push --no-verify`, que anula el propósito del hook.

Solución: solo `typecheck + lint` en pre-push (rápido, <30s). Los tests completos los hace CI.

```sh
# .husky/pre-push
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run typecheck
npm run lint
```

En `ci.yml`, job `e2e-journeys`, reemplazar `sleep 10` por espera activa:
```yaml
- name: Wait for server
  run: |
    for i in $(seq 1 30); do
      curl -sf http://localhost:3000 && break
      sleep 1
    done
```

Nota: si existe `/api/health`, usar esa ruta. Si no, `http://localhost:3000` es suficiente.

---

### Fase 8 — IDOR tests reales ✅ COMPLETADO (2026-03-05)
**Modelo: Opus · Prioridad: P1**

**Staging:** Proyecto `tradebase-staging` (ID: `xddjhrgkwwolpugtxgfk`). 71 migraciones aplicadas.

**Archivos:** `tests/security/idor-protection.test.ts` (13 tests)

Tests implementados (RLS directo contra Supabase staging):
1. Vehicles: public SELECT ok, UPDATE/DELETE otro dealer bloqueado
2. Pipeline items: dealer solo ve propios, no puede leer/insertar de otro
3. Historico: aislamiento bidireccional verificado (A↔B)
4. Dealers: UPDATE de otro dealer bloqueado
5. Invoices: dealer solo ve propios, no puede filtrar por user_id ajeno

**Fixtures fijos:** 2 dealers, 5 vehículos, 4 facturas, 3 pipeline items, 2 historico.

**CI job:** `idor-tests` en `.github/workflows/ci.yml`. Requiere secrets:
- `STAGING_SUPABASE_URL`: `https://xddjhrgkwwolpugtxgfk.supabase.co`
- `STAGING_SUPABASE_KEY`: anon key del staging

**NOTA:** `price_history_trends` materialized view (migración 00061) no se creó en staging porque `price_history` era matview en ese punto. Necesita fix independiente.

---

## Estado de implementación

| Fase | Descripción | Orden | Estado | Modelo |
|------|-------------|-------|--------|--------|
| 3 | safeError estable | 1º | ✅ Completado | Sonnet |
| 4 | Security tests con MSW | 2º | ✅ Completado | Sonnet |
| 1 | CI bloqueo real | 3º | ✅ Completado | Haiku |
| 2 | Coverage thresholds | 4º | ✅ Completado | Haiku |
| 5a | Backfill utils puros sin test | 5º | ✅ Completado | Sonnet |
| 5b | Check CI + convención permanente | 5º | ✅ Completado | Haiku |
| 6 | E2E deterministas | 6º | ✅ Completado | Sonnet |
| 7 | Pre-push ligero + sleep→health | 7º | ✅ Completado | Haiku |
| 8 | IDOR tests reales | 8º | ✅ Completado (2026-03-05) | Opus |

---

## Notas arquitectónicas

### Regla de clasificación de tests

| Situación | Herramienta |
|-----------|-------------|
| Lógica pura sin deps externas | Vitest |
| Composable con useI18n/useRouter simples | Vitest + mocks de setup.ts |
| Composable con contexto Nuxt complejo | Vitest + @nuxt/test-utils |
| Necesita servidor HTTP real | Playwright |
| Necesita navegador real | Playwright |
| Necesita BD real | Playwright contra staging (Fase 8+) |
| Seguridad de endpoints (sin servidor real) | Vitest + MSW |

### Por qué e2e-journeys mantiene continue-on-error
Los journeys necesitan `E2E_ADMIN_EMAIL`, `E2E_DEALER_EMAIL`, etc. Son informativos y exploratorios. Bloquearlos requeriría garantizar que los secrets siempre estén disponibles y que staging esté up.

### Supabase staging — cuando se implemente
- Crear proyecto Supabase separado (plan free es suficiente)
- Aplicar todas las migraciones de `supabase/migrations/`
- Insertar fixtures fijos: 2 dealers, 5 vehículos por dealer, 1 admin
- Nunca usar datos de producción en tests
- Añadir `STAGING_SUPABASE_URL` y `STAGING_SUPABASE_KEY` como GitHub Secrets

### @nuxt/test-utils — cuándo instalarlo
Solo instalar si se decide testear composables que internamente usan el contexto de Nuxt (`useNuxtApp`, `useRuntimeConfig` con plugins, etc.). Para composables simples, los mocks de `tests/setup.ts` son suficientes. No instalar preventivamente.

