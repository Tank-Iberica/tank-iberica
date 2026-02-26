# DOCUMENTO 1 — Sesiones para Claude Code

**Generado:** 25 febrero 2026
**Fuente:** Auditoría baseline completa + recomendaciones 100/100 + análisis de mejoras
**Prioridad:** Ordenado por impacto y dependencias

---

## SESIÓN 47 — Hallazgos críticos y deuda técnica inmediata

> **Objetivo:** Resolver los hallazgos críticos C1, C2 y los menores de limpieza.
> **Estimación:** 2-3 horas Claude Code
> **Dependencias:** Ninguna

### Parte A — Columna `vertical` en vehicles y advertisements (C1)

**Problema:** `vehiclesQuery()` devuelve TODO sin filtrar. La migración 62 confirma que vehicles y advertisements NO tienen columna vertical. Si se despliega Horecaria, los datos se mezclan.

**Crear migración `00063_vehicles_vertical_column.sql`:**

```sql
-- Add vertical column to vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vertical text NOT NULL DEFAULT 'tracciona';
CREATE INDEX IF NOT EXISTS idx_vehicles_vertical ON vehicles(vertical);
CREATE INDEX IF NOT EXISTS idx_vehicles_vertical_status ON vehicles(vertical, status);

-- Add vertical column to advertisements
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS vertical text NOT NULL DEFAULT 'tracciona';
CREATE INDEX IF NOT EXISTS idx_advertisements_vertical ON advertisements(vertical);

-- Update existing records (all current data is Tracciona)
UPDATE vehicles SET vertical = 'tracciona' WHERE vertical IS NULL OR vertical = '';
UPDATE advertisements SET vertical = 'tracciona' WHERE vertical IS NULL OR vertical = '';

-- RLS policy: vehicles scoped by vertical
-- (Uses app.current_vertical set by middleware, matching dealers pattern)
```

**Actualizar `server/utils/supabaseQuery.ts`:**

- Eliminar el comentario "vehicles table does not currently have a vertical column"
- `vehiclesQuery()` debe filtrar por vertical igual que `dealersQuery()`

**Actualizar migración 62 nota:** eliminar el NOTE que dice que se salta vehicles/advertisements.

### Parte B — Tests reales de vertical-isolation (C2)

**Problema:** `vertical-isolation.test.ts` tiene `expect(true).toBe(true)`.

**Reescribir `tests/security/vertical-isolation.test.ts`:**

```typescript
// Tests reales que verifican:
// 1. vehiclesQuery('tracciona') NO devuelve vehículos de 'horecaria'
// 2. dealersQuery('tracciona') NO devuelve dealers de 'horecaria'
// 3. categoriesQuery('tracciona') NO devuelve categorías de 'horecaria'
// 4. vertical-context middleware inyecta vertical correctamente
// 5. supabaseQuery helpers aplican filtro .eq('vertical', v)
```

Usar mocks de Supabase client para verificar que las queries incluyen el filtro correcto sin necesitar conexión real a BD.

### Parte C — Limpieza de archivos (hallazgos menores)

- **Eliminar** `NUL` de la raíz del proyecto
- **Eliminar** `lighthouserc.js` (duplicado de `.lighthouserc.js`)
- **Eliminar** `scripts/backup-weekly.sh` (obsoleto, reemplazado por `backup-multi-tier.sh`)
- **Cambiar** `infraAlertEmail` default en nuxt.config.ts de `tankiberica@gmail.com` a `admin@tracciona.com`
- **Cambiar** `.env.example`: reemplazar `SUPABASE_PROJECT_REF=gmnrfuzekbwyzkgsaftv` por `SUPABASE_PROJECT_REF=your-project-ref-here`
- **Verificar** `scrape-competitors.ts` — si sesión 44 lo deprecó, añadir comentario header o mover a `scripts/legacy/`

### Parte D — Hardcoded Supabase ref en nuxt.config.ts (I5)

**Problema:** `dns-prefetch` apunta a `https://gmnrfuzekbwyzkgsaftv.supabase.co` directamente.

**Solución:** Mover a variable de entorno:

```typescript
// En nuxt.config.ts, sección app.head.link:
{ rel: 'dns-prefetch', href: `https://${process.env.SUPABASE_PROJECT_REF || 'xxxxx'}.supabase.co` },
```

O mejor: usar `process.env.SUPABASE_URL` directamente (ya existe como variable).

### Parte E — social/generate-posts.post.ts sin callAI (I7)

**Problema:** Usa templates estáticos en vez de `callAI()`. Inconsistente con el patrón.

**Solución:** Refactorizar para usar `callAI(..., 'deferred', 'fast')` con un prompt que genere posts para cada plataforma. Mantener templates como fallback si AI falla.

---

## SESIÓN 48 — Completar sesión 45E (Modularización)

> **Objetivo:** Descomponer `whatsapp/process.post.ts` (18KB) en servicios (I1)
> **Estimación:** 3-4 horas Claude Code
> **Dependencias:** Sesión 47A completada

### Parte A — Extraer servicios

**Crear los 4 servicios planificados en sesión 45E:**

1. **`server/services/imageUploader.ts`**
   - `uploadToCloudinary(imageBuffer, options)` → `{ publicId, secureUrl, width, height }`
   - `uploadToCFImages(imageBuffer, options)` → similar
   - `uploadImage(imageBuffer, options)` — decide según `IMAGE_PIPELINE_MODE`

2. **`server/services/vehicleCreator.ts`**
   - `createVehicleFromAI(analysisResult, dealerId, images, vertical)` → `{ vehicleId, slug }`
   - Maneja: insertar en vehicles, asociar imágenes, generar slug, asignar categoría

3. **`server/services/whatsappProcessor.ts`**
   - `processWhatsAppSubmission(submissionId)` → orquesta todo el flujo
   - Llama a: descargar imágenes → `callAI` (no SDK directo) → `uploadImage` → `createVehicleFromAI` → notificar

4. **`server/services/notifications.ts`**
   - `notifyDealer(dealerId, type, data)` — unifica WhatsApp + email + push
   - `notifyAdmin(type, data)` — alertas internas
   - `notifyBuyer(userId, type, data)` — alertas de favoritos, subastas, etc.

### Parte B — Refactorizar endpoint

**`whatsapp/process.post.ts` pasa de ~450 líneas a ~50:**

```typescript
export default defineEventHandler(async (event) => {
  // Auth + validate (10 líneas)
  const body = await readBody(event)
  // ...verificar submissionId...

  const result = await processWhatsAppSubmission(body.submissionId)
  return result
})
```

### Parte C — Migrar de SDK directo a callAI

**Problema:** `whatsapp/process.post.ts` usa `import Anthropic from '@anthropic-ai/sdk'` directamente, bypasseando el failover de `aiProvider.ts`.

**Solución:** El nuevo `whatsappProcessor.ts` debe usar `callAI(..., 'background', 'vision')` que ya soporta timeouts de 30s y retry con fallback a OpenAI.

**Nota:** `callAI` actualmente acepta `messages` como array de `{ role, content: string }`. Para Claude Vision con imágenes en base64, hay que extender la interfaz `AIRequest` para soportar `content` como array de bloques (text + image). Verificar si ya lo soporta o si hay que añadirlo.

### Parte D — Migrar verify-document.post.ts

**Mismo problema:** usa SDK de Anthropic directamente. Refactorizar para usar `callAI(..., 'background', 'vision')`.

---

## SESIÓN 49 — Completar sesión 46 (DAST + Tests de seguridad)

> **Objetivo:** Implementar OWASP ZAP + Nuclei + tests de seguridad expandidos (I2)
> **Estimación:** 2-3 horas Claude Code
> **Dependencias:** Ninguna

### Parte A — Workflow DAST

**Crear `.github/workflows/dast-scan.yml`:**

- Schedule: domingos 04:00 UTC
- Job 1: OWASP ZAP baseline scan (5 min, pasivo)
- Job 2: Nuclei scan (CVEs, misconfigs, SSL)
- Job 3: SSL/TLS check (certificado, protocolos, HSTS)
- Job 4: Consolidar resultados + email si hallazgos críticos/altos
- Trigger manual con `workflow_dispatch`
- Full scan mensual (primer domingo del mes)

**Crear `.zap/rules.tsv`:**

```tsv
10055	WARN	# CSP: unsafe-inline — required by Nuxt 3 SSR
10098	WARN	# Cross-Domain Misconfiguration — Supabase/Stripe expected
40012	FAIL	# XSS (Reflected)
40014	FAIL	# XSS (Persistent)
40018	FAIL	# SQL Injection
```

### Parte B — Tests de seguridad expandidos

**Crear `tests/security/idor-protection.test.ts`:**

- Verificar que cambiar dealerId en requests devuelve 403
- Verificar que un dealer no puede ver vehículos de otro dealer via API
- Verificar que un dealer no puede editar suscripción de otro

**Crear `tests/security/rate-limiting.test.ts`:**

- Verificar que endpoints sensibles devuelven 429 tras exceso de requests
- (Nota: en memoria solo funciona en dev, pero el test documenta el comportamiento esperado)

**Crear `tests/security/information-leakage.test.ts`:**

- Errores 500 no exponen stack traces, API keys, o rutas internas
- `/.env`, `/.git` no son accesibles
- No hay header `X-Powered-By`
- Respuestas de error usan mensajes genéricos de `safeError.ts`

### Parte C — Documentación

**Crear `docs/tracciona-docs/referencia/SECURITY-TESTING.md`:**

- Explicación de las 6 capas de seguridad
- Cómo ejecutar cada herramienta manualmente
- Cómo interpretar los reportes
- Cuándo escalar a pentest humano

**Editar `.github/workflows/security.yml`:** añadir comentario que diferencia SAST (este) de DAST (dast-scan.yml).

---

## SESIÓN 50 — Seguridad: HSTS, CORS, rate limiting WAF

> **Objetivo:** Cerrar gaps de seguridad para subir dimensión 1 a ~90+
> **Estimación:** 1-2 horas Claude Code
> **Dependencias:** Ninguna

### Parte A — HSTS header

**Editar `server/middleware/security-headers.ts`:**

```typescript
headers.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
```

### Parte B — CORS explícito

**Verificar si Nuxt ya tiene CORS configurado.** Si no, añadir en nuxt.config.ts o como middleware:

```typescript
// Solo permitir origin propio + Supabase + Stripe
const allowedOrigins = [
  getSiteUrl(),
  process.env.SUPABASE_URL,
  'https://js.stripe.com',
  'https://challenges.cloudflare.com',
].filter(Boolean)
```

### Parte C — Documentar configuración WAF de Cloudflare

**Crear `docs/tracciona-docs/referencia/CLOUDFLARE-WAF-CONFIG.md`:**

- Copiar las reglas documentadas en `rate-limit.ts` (email/send: 10/min, lead: 5/min, stripe: 20/min, account/delete: 2/min, POST general: 30/min, GET: 200/min)
- Screenshots o instrucciones paso a paso para configurar en Cloudflare Dashboard
- Esto no es ejecución de Claude Code sino documentación para que los fundadores lo configuren

### Parte D — Rotación de secretos documentada

**Crear `docs/tracciona-docs/referencia/SECRETS-ROTATION.md`:**

- Lista de todos los secretos con fecha de creación (si se conoce)
- Frecuencia recomendada de rotación (anual para la mayoría)
- Procedimiento paso a paso para rotar cada secreto sin downtime

---

## SESIÓN 51 — Testing: subir cobertura de 5% a 40%

> **Objetivo:** Plan de tests incremental para cumplir objetivo año 1
> **Estimación:** 4-6 horas Claude Code (puede dividirse en sub-sesiones)
> **Dependencias:** Sesión 48 (servicios extraídos facilitan testing)

### Parte A — Tests unitarios de servicios server

**Tests prioritarios (cubren lógica de negocio crítica):**

1. `tests/unit/server/aiProvider.test.ts` — mock de fetch, verificar failover, timeouts, presets
2. `tests/unit/server/billing.test.ts` — mock de Stripe, verificar flujos de suscripción
3. `tests/unit/server/rateLimit.test.ts` — verificar sliding window, cleanup, key extraction
4. `tests/unit/server/safeError.test.ts` — verificar mensajes genéricos en prod, detallados en dev
5. `tests/unit/server/verifyCronSecret.test.ts` — verificar fail-closed en prod, warn en dev
6. `tests/unit/server/siteConfig.test.ts` — verificar fallbacks
7. `tests/unit/server/aiConfig.test.ts` — verificar defaults y overrides

### Parte B — Tests de composables faltantes

**Composables críticos sin test:**

1. `tests/unit/useAuth.test.ts` — verificar estados de auth, redirect a login
2. `tests/unit/useSubscriptionPlan.test.ts` — verificar lógica de planes, límites
3. `tests/unit/useOnboarding.test.ts` — verificar pasos, completitud
4. `tests/unit/useFavorites.test.ts` — verificar add/remove, persistencia
5. `tests/unit/useImageUrl.test.ts` — verificar transformaciones Cloudinary/CF

### Parte C — Coverage gate en CI

**Editar `.github/workflows/ci.yml`:**

```yaml
- name: Run tests with coverage
  run: npx vitest run --coverage --reporter=json --outputFile=coverage.json
- name: Check coverage threshold
  run: |
    COVERAGE=$(node -e "const c=require('./coverage.json'); console.log(c.total.lines.pct)")
    if (( $(echo "$COVERAGE < 40" | bc -l) )); then
      echo "Coverage $COVERAGE% is below 40% threshold"
      exit 1
    fi
```

### Parte D — E2E para user journeys críticos

**Crear specs Playwright para los 8 journeys del plan de auditoría:**

1. `tests/e2e/journeys/visitor-search.spec.ts` — Home → filtros → ficha → contacto
2. `tests/e2e/journeys/dealer-publish.spec.ts` — Login → dashboard → nuevo → fotos → datos → publicar
3. `tests/e2e/journeys/dealer-subscription.spec.ts` — Dashboard → suscripción → cambiar plan
4. `tests/e2e/journeys/buyer-favorite.spec.ts` — Ver ficha → favorito → perfil → favoritos
5. `tests/e2e/journeys/admin-approve.spec.ts` — Admin → pendientes → aprobar/rechazar

(Los journeys 6-8: blog, WhatsApp, subasta — requieren setup más complejo, para fase posterior)

---

## SESIÓN 52 — Rendimiento: Lighthouse CI + Web Vitals

> **Objetivo:** Subir dimensión 5 (UX/Rendimiento) con datos reales
> **Estimación:** 1-2 horas Claude Code
> **Dependencias:** Ninguna

### Parte A — Lighthouse CI en workflow

**Crear `.github/workflows/lighthouse.yml`:**

```yaml
name: Lighthouse CI
on:
  schedule:
    - cron: '0 6 * * 0' # Domingos 06:00 UTC
  workflow_dispatch: {}

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install -g @lhci/cli
      - run: lhci autorun
        env:
          LHCI_BUILD_CONTEXT__CURRENT_HASH: ${{ github.sha }}
```

**Configurar `.lighthouserc.js`** (el que ya existe) para las 5 rutas críticas:

- `/` (home)
- `/vehiculo/ejemplo-slug` (ficha vehículo — necesita URL real o seed)
- `/noticias` (listado)
- `/dashboard` (panel dealer — requiere auth, puede omitirse inicialmente)
- `/subastas` (listado)

**Thresholds:**

```javascript
assert: {
  assertions: {
    'categories:performance': ['error', { minScore: 0.8 }],
    'categories:accessibility': ['error', { minScore: 0.9 }],
    'categories:best-practices': ['error', { minScore: 0.9 }],
    'categories:seo': ['error', { minScore: 0.9 }],
  }
}
```

### Parte B — Web Vitals reporting

**Verificar si `web-vitals` (ya en dependencies) envía datos a algún sitio.**

Si no, crear `app/plugins/web-vitals.client.ts`:

```typescript
// Enviar Core Web Vitals a Google Analytics o a un endpoint propio
import { onCLS, onINP, onLCP } from 'web-vitals'

export default defineNuxtPlugin(() => {
  if (process.env.NODE_ENV !== 'production') return

  const sendToAnalytics = (metric) => {
    // Enviar a GA4 o a /api/infra/vitals
  }

  onCLS(sendToAnalytics)
  onINP(sendToAnalytics)
  onLCP(sendToAnalytics)
})
```

### Parte C — Accesibilidad

**Añadir `axe-core` como devDependency** y crear test de accesibilidad básico:

```typescript
// tests/e2e/accessibility.spec.ts
import AxeBuilder from '@axe-core/playwright'

test('Home page should not have accessibility violations', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
```

---

## SESIÓN 53 — Base de datos: integridad, esquema, archivado

> **Objetivo:** Subir dimensión 3 a ~90+ con scripts de verificación
> **Estimación:** 2-3 horas Claude Code
> **Dependencias:** Sesión 47A (columna vertical en vehicles)

### Parte A — Script de integridad de datos

**Crear `scripts/db-integrity-check.mjs`:**

Queries de verificación (ejecutar con Supabase Management API o pg directa):

```sql
-- Vehículos con dealer_id inexistente
SELECT v.id FROM vehicles v LEFT JOIN dealers d ON v.dealer_id = d.id WHERE d.id IS NULL;

-- Subastas cerradas sin resolución
SELECT id FROM auctions WHERE status = 'closed' AND winner_id IS NULL AND end_date < NOW();

-- Usuarios con roles inconsistentes
SELECT u.id FROM users u LEFT JOIN dealers d ON u.id = d.user_id WHERE u.role = 'dealer' AND d.id IS NULL;

-- Vehículos sin vertical (después de migración 63)
SELECT id FROM vehicles WHERE vertical IS NULL OR vertical = '';

-- Contenido sin traducir (articles con title_en vacío)
SELECT id, title_es FROM articles WHERE (title_en IS NULL OR title_en = '') AND status = 'published';

-- Datos de test en producción
SELECT id, email FROM users WHERE email LIKE '%@example.com' OR email LIKE '%test%';
SELECT id FROM vehicles WHERE price < 100 AND status = 'active';
```

**Integrar en `daily-audit.yml`** como job adicional (o semanal).

### Parte B — ERD del esquema actual

**Crear `docs/tracciona-docs/referencia/ERD.md`:**

Generar diagrama Mermaid del esquema actual basándose en las 62+ migraciones:

```mermaid
erDiagram
    users ||--o{ dealers : "has"
    dealers ||--o{ vehicles : "owns"
    vehicles ||--o{ vehicle_images : "has"
    vehicles ||--o{ auction_bids : "receives"
    dealers ||--o{ subscriptions : "has"
    ...etc
```

Incluir todas las tablas con sus relaciones FK, columnas clave, y notas sobre RLS.

### Parte C — Política de archivado

**Crear `docs/tracciona-docs/referencia/DATA-RETENTION.md`:**

- Vehículos vendidos: mantener 2 años para histórico de precios, luego archivar
- Logs de actividad: mantener 6 meses activos, archivar 2 años
- Sesiones expiradas: purgar tras 30 días
- Datos de usuario eliminado: anonimizar según GDPR (30 días tras solicitud)

### Parte D — Monitorización de queries lentas

**Crear endpoint `server/api/infra/slow-queries.get.ts`:**

- Consulta `pg_stat_statements` (si disponible en Supabase Pro)
- Devuelve top 10 queries más lentas
- Solo accesible para admin con CRON_SECRET

---

## SESIÓN 54 — Documentación: CHANGELOG, onboarding, docs vivos

> **Objetivo:** Subir dimensión 8 a ~95+
> **Estimación:** 2 horas Claude Code
> **Dependencias:** Ninguna

### Parte A — CHANGELOG.md actualizado

**Crear/actualizar `CHANGELOG.md`** en raíz del proyecto:

- Formato: Keep a Changelog (https://keepachangelog.com)
- Retroactivamente documentar las sesiones más importantes como "releases"
- Desde sesión 1 hasta la actual

### Parte B — ESTADO-REAL-PRODUCTO.md regenerado

**Ejecutar `scripts/generate-estado-real.sh`** y verificar que refleja el estado actual.
Si el script está desactualizado, actualizarlo para incluir:

- Conteo de endpoints, composables, componentes, tests
- Estado de cada feature (implementado / stub / planificado)
- Versiones de dependencias clave

### Parte C — Documentación de crons

**Crear `docs/tracciona-docs/referencia/CRON-JOBS.md`:**

| Cron endpoint               | Qué hace                  | Frecuencia | Quién lo llama | Configurado |
| --------------------------- | ------------------------- | ---------- | -------------- | ----------- |
| `/api/cron/freshness-check` | Marca vehículos inactivos | Diario     | ¿?             | ¿?          |
| `/api/cron/search-alerts`   | Envía alertas de búsqueda | Diario     | ¿?             | ¿?          |
| ... (12 crons)              | ...                       | ...        | ...            | ...         |

**Problema detectado:** Los 12 cron endpoints existen pero no hay scheduler documentado. ¿Se llaman desde cron-job.org? ¿Cloudflare Workers Cron Triggers? ¿GitHub Actions? Documentar y si no están configurados, configurarlos.

### Parte D — Marcadores de docs históricos

**Revisar los 25 anexos (A-Y):** ¿alguno es obsoleto? Si sí, añadir banner:

```markdown
> ⚠️ **DOCUMENTO HISTÓRICO** — Este documento refleja decisiones de [fecha].
> Puede no reflejar el estado actual del proyecto. Consultar INSTRUCCIONES-MAESTRAS.md para la versión vigente.
```

---

## SESIÓN 55 — Resiliencia: test de restore + mirror + DR drill

> **Objetivo:** Subir dimensión 11 a ~90+
> **Estimación:** 1-2 horas Claude Code
> **Dependencias:** Backups funcionando (sesión 45B ✅)

### ⚠️ PRERREQUISITOS (los fundadores deben completar ANTES de ejecutar esta sesión)

**1. Crear cuenta en Neon (https://neon.tech) — plan free**

- Registrarse con email
- Crear un proyecto temporal (nombre: `tracciona-restore-test`)
- Copiar la connection string (`postgres://...@...neon.tech/...`)
- Añadir como GitHub Secret: `Settings → Secrets → Actions → New secret`:
  - Nombre: `TEST_RESTORE_DB_URL`
  - Valor: la connection string de Neon
- **Nota:** Tras verificar el restore, se puede borrar el proyecto en Neon para liberar recursos. Claude Code NO puede crear esta cuenta ni el secret — requiere intervención humana.

**2. Crear cuenta en Bitbucket (si no existe) — para Parte B (mirror)**

- Registrarse en https://bitbucket.org
- Crear repo privado: `tracciona/tracciona`
- Generar App Password: `Settings → Personal → App passwords → Create` (permisos: repo write)
- Añadir como GitHub Secrets:
  - `BITBUCKET_USER`: tu username de Bitbucket
  - `BITBUCKET_TOKEN`: el App Password generado
- **Nota:** Si preferís no usar Bitbucket, se puede usar GitLab como alternativa. Esta parte es opcional pero recomendada.

**3. Verificar que UptimeRobot está configurado (DOC2, tarea #4)**

- Si no se ha hecho, configurar ahora: https://uptimerobot.com
- Monitores: `https://tracciona.com` + `https://tracciona.com/api/health`
- Alertas a email de ambos fundadores
- **Nota:** Esto es independiente de Claude Code pero esta sesión asume que ya hay monitorización externa activa.

**4. Verificar que la marca está registrada en OEPM (DOC2, tarea #1)**

- No bloquea esta sesión, pero es un recordatorio de prioridad: cada semana sin registro es riesgo.

---

### Parte A — Script de test de restore automatizado

**Crear `scripts/test-restore.sh`:**

1. Descargar último backup daily de B2
2. Descifrar con openssl
3. Restaurar en BD temporal usando `TEST_RESTORE_DB_URL` (secret de GitHub, proporcionado por los fundadores — ver prerrequisitos)
4. Ejecutar queries de verificación: conteo de tablas clave (users, dealers, vehicles, subscriptions)
5. Comparar conteos con producción
6. Documentar resultado
7. Limpiar BD temporal (DROP tables o borrar proyecto Neon tras verificación)

**Añadir como job manual en `backup.yml`** (solo workflow_dispatch, no scheduled).

**Si `TEST_RESTORE_DB_URL` no está configurado como secret, el script debe:**

- Detectar la ausencia de la variable
- Mostrar mensaje claro: "⚠️ TEST_RESTORE_DB_URL not configured. Founders must create a Neon free account and add the connection string as a GitHub Secret. See DOC2 task #10."
- Salir con código 0 (no romper el workflow, solo avisar)

### Parte B — Mirror del repo

**Crear `.github/workflows/mirror.yml`:**

```yaml
name: Mirror to Bitbucket
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 3 * * 0' # Semanal
jobs:
  mirror:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - run: |
          git remote add mirror https://${{ secrets.BITBUCKET_USER }}:${{ secrets.BITBUCKET_TOKEN }}@bitbucket.org/tracciona/tracciona.git
          git push mirror --all --force
          git push mirror --tags --force
```

### Parte C — Dependencias de terceros documentadas

**Crear `docs/tracciona-docs/referencia/THIRD-PARTY-DEPENDENCIES.md`:**

| Servicio         | Para qué            | Plan B                                      | Tiempo migración |
| ---------------- | ------------------- | ------------------------------------------- | ---------------- |
| Supabase         | BD + Auth + Storage | PostgreSQL gestionado + Auth0               | 2-4 semanas      |
| Cloudflare Pages | Deploy + CDN        | Vercel / Netlify                            | 1-2 días         |
| Stripe           | Pagos               | Paddle / LemonSqueezy                       | 1-2 semanas      |
| Anthropic        | IA                  | OpenAI (ya configurado como fallback)       | 0 (automático)   |
| Cloudinary       | Imágenes            | CF Images (ya configurado como alternativa) | 1-2 días         |
| Resend           | Email               | SendGrid / Mailgun                          | 1 día            |
| GitHub           | Repo + CI/CD        | GitLab / Bitbucket                          | 1-2 días         |
| Backblaze B2     | Backups             | AWS S3 / Wasabi                             | 1 hora           |

---

## SESIÓN 56 — Escalabilidad: event bus + feature flags

> **Objetivo:** Preparar arquitectura para escalar sin reescribir
> **Estimación:** 3-4 horas Claude Code
> **Dependencias:** Sesión 48 (modularización completada)

### Parte A — Event bus simple con Nitro hooks

**Crear `server/utils/eventBus.ts`:**

```typescript
type EventHandler = (payload: unknown) => Promise<void> | void
const handlers: Map<string, EventHandler[]> = new Map()

export function on(event: string, handler: EventHandler) { ... }
export function emit(event: string, payload: unknown) { ... }
```

**Eventos iniciales:**

- `vehicle:created` → generar posts sociales, actualizar market report, notificar búsquedas
- `vehicle:sold` → notificar favoritos, actualizar stats
- `dealer:registered` → enviar email bienvenida, crear onboarding
- `subscription:changed` → actualizar límites, notificar

**Registrar listeners en `server/plugins/events.ts`** (Nitro plugin).

### Parte B — Feature flags

**Crear migración `00064_feature_flags.sql`:**

```sql
CREATE TABLE IF NOT EXISTS feature_flags (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  description text,
  percentage integer DEFAULT 100,  -- rollout percentage
  allowed_dealers text[],          -- specific dealers (NULL = all)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed initial flags
INSERT INTO feature_flags (key, enabled, description) VALUES
  ('whatsapp_flow', true, 'WhatsApp submission processing'),
  ('auctions', false, 'Live auctions feature'),
  ('social_posts_ai', false, 'AI-generated social media posts'),
  ('market_intelligence', false, 'Market price comparisons for dealers'),
  ('dgt_reports', false, 'DGT vehicle reports (paid)'),
  ('featured_boost', false, 'Paid vehicle boost/highlight');
```

**Crear `server/utils/featureFlags.ts`:**

```typescript
export async function isFeatureEnabled(key: string, dealerId?: string): Promise<boolean> { ... }
```

**Crear composable `app/composables/useFeatureFlags.ts`:**

```typescript
export function useFeatureFlag(key: string): Ref<boolean> { ... }
```

### Parte C — Multi-tenant verification script

**Crear `scripts/verify-multi-tenant.sh`:**

- Grep por strings hardcodeados: "tracciona", "Tracciona", categorías en español
- Verificar que todo pasa por `vertical_config`, `getSiteName()`, `getSiteUrl()`
- Verificar que i18n no tiene textos hardcoded de Tracciona (salvo defaults)
- Output: lista de archivos con posibles hardcodes a revisar

---

## SESIÓN 57 — Producto: demo mode + widget embebible

> **Objetivo:** Reducir fricción de onboarding y ampliar canales de distribución
> **Estimación:** 4-5 horas Claude Code
> **Dependencias:** Sesiones 47-48 completadas

### Parte A — Demo mode para dealers

**Crear endpoint `server/api/demo/try-vehicle.post.ts`:**

- Acepta: 1-4 imágenes + texto básico (marca, modelo)
- No requiere autenticación
- Usa `callAI('background', 'vision')` para analizar
- Devuelve: preview del listing generado (título, descripción, categoría, fotos procesadas)
- NO guarda nada en BD
- Rate limited: 3 intentos por IP por día

**Crear página `app/pages/demo.vue`:**

- Formulario simple: drag-and-drop de fotos + campos marca/modelo
- Muestra preview del resultado en tiempo real
- CTA: "¿Te gusta? Regístrate gratis y publica tu primer vehículo"
- Alternativa: "¿Prefieres WhatsApp? Envía las fotos al +34 XXX XXX XXX"

### Parte B — Widget embebible

**Completar `server/api/widget/dealer/[dealerId].get.ts`:**

- Devuelve HTML/JS embedable con los vehículos activos del dealer
- Personalizable: tema claro/oscuro, número de vehículos, layout (grid/lista)
- Incluye link "Powered by Tracciona" (backlink SEO)

**Crear página `app/pages/widget.vue`:**

- Generador de widget: el dealer elige opciones y copia el snippet
- Preview en tiempo real

### Parte C — Importador de stock (con consentimiento)

**Crear `server/api/dealer/import-stock.post.ts`:**

- Acepta: URL del perfil público del dealer en Mascus/MachineryZone
- Scrape con consentimiento explícito del dealer
- Crea drafts (status: 'draft') que el dealer revisa y publica
- Usa `callAI` para enriquecer las descripciones

**Nota:** Esto es diferente del scraping de competidores (eliminado en sesión 44). Aquí el dealer solicita importar SU PROPIO stock desde otra plataforma.

---

## SESIÓN 58 — Producto: Market Intelligence + Comparador de precios

> **Objetivo:** Crear herramientas de valor que atraigan tráfico y retengan dealers
> **Estimación:** 3-4 horas Claude Code
> **Dependencias:** Datos en BD (al menos Tank Ibérica como dealer)

### Parte A — Market Intelligence para dealers

**Ampliar `server/services/marketReport.ts`:**

- Para cada vehículo del dealer, calcular: precio medio de mercado, posición del precio del dealer, días medio en venta para vehículos similares
- Generar informe mensual por dealer

**Crear composable `app/composables/useMarketIntelligence.ts`:**

- Datos del dealer vs mercado
- Gráficos de tendencia de precios por categoría

**Integrar en dashboard del dealer:**

- Card "Tu stock vs mercado" con indicadores verde/amarillo/rojo
- Sugerencias: "Tu Scania R450 está un 12% por encima del mercado. Considera ajustar el precio."

### Parte B — Comparador público de precios (Kelley Blue Book de industriales)

**Completar `app/pages/valoracion.vue`:**

- Input: marca, modelo, año, km, categoría
- Output: rango de precio estimado basado en datos agregados del catálogo + histórico
- Mostrar gráfico de distribución de precios
- CTA: "¿Quieres vender al mejor precio? Publica gratis en Tracciona"

**Crear `server/api/market/valuation.get.ts`:**

- Query agregada: avg, min, max, p25, p75 de vehículos similares
- Cache con SWR (datos cambian lento)

### Parte C — Contenido editorial automatizado

**Crear `server/api/cron/generate-editorial.post.ts`:**

- Semanal: genera 2 borradores de artículos con Claude
- Temas basados en: tendencias de búsqueda, nuevos vehículos, normativa, guías de compra
- Status: 'draft' — requiere revisión humana antes de publicar
- Protegido con CRON_SECRET

---

## SESIÓN 59 — CSP avanzado + auditoría de licencias

> **Objetivo:** Seguridad avanzada para acercarse al 100/100
> **Estimación:** 2-3 horas Claude Code
> **Dependencias:** Nuxt 4 estable

### Parte A — Investigar nonce-based CSP

**Investigar si Nuxt 4 ya soporta nonce-based CSP nativo:**

- Si sí: implementar para eliminar `unsafe-inline` en script-src
- Si no: documentar la limitación y configurar report-uri para CSP violations
- `unsafe-eval` (Chart.js) puede mitigarse con Chart.js v5 o lazy loading solo en admin

### Parte B — CSP violation reporting

**Crear `server/api/infra/csp-report.post.ts`:**

- Recibe reportes de CSP violations
- Log en Sentry o en tabla de BD
- Permite detectar intentos de XSS reales

**Añadir a security-headers.ts:**

```typescript
// report-uri directive
'report-uri /api/infra/csp-report'
```

### Parte C — Auditoría de licencias npm

**Crear script `scripts/audit-licenses.mjs`:**

- Ejecuta `npx license-checker --json --production`
- Identifica dependencias con licencias copyleft (GPL, AGPL)
- Genera reporte
- Integrar en daily-audit.yml

### Parte D — API pública documentada

**Crear `docs/tracciona-docs/referencia/API-PUBLIC.md`:**

- Documentar endpoints públicos existentes en formato OpenAPI-like
- `/api/v1/` — qué endpoints hay, qué aceptan, qué devuelven
- Preparación para futuras integraciones de ERPs de dealers

---

## SESIÓN 60 — Nonce-based CSP (si viable) + PWA verification

> **Objetivo:** Eliminar unsafe-inline si Nuxt 4 lo permite
> **Estimación:** 2 horas Claude Code
> **Dependencias:** Sesión 59A (investigación)

### Parte A — Implementar nonce-based CSP (si viable)

Si la investigación de sesión 59A confirma que Nuxt 4 soporta nonces:

- Configurar `useRuntimeConfig().security.nonce` o equivalente
- Actualizar `security-headers.ts` para inyectar nonce dinámico
- Eliminar `unsafe-inline` de script-src
- Verificar que hydration funciona

### Parte B — PWA verification

- Verificar que `/icon-192x192.png` y `/icon-512x512.png` existen en `/public`
- Verificar installability con Lighthouse
- Verificar comportamiento offline con datos reales
- Verificar que el service worker cachea correctamente

---

## SESIÓN 61 — SEO Quick Wins: meta tags, sitemap, robots, OG, breadcrumbs

> **Objetivo:** Cubrir los fundamentos SEO técnicos que más impactan posicionamiento
> **Estimación:** 2-3 horas Claude Code
> **Dependencias:** Ninguna
> **Referencia:** CHECKLIST-SEO-UX-TECNICO.md — secciones 3, 4, 5, 6

### Parte A — Sitemap XML dinámico

**Verificar si `/sitemap.xml` existe y es dinámico.** Si no:

1. Instalar `@nuxtjs/sitemap` (o usar `nuxt-simple-sitemap`)
2. Configurar en `nuxt.config.ts`:
   - Incluir todas las rutas públicas: `/`, `/vehiculos`, `/vehiculos/[slug]`, `/dealers`, `/dealers/[slug]`, páginas legales, blog (cuando exista)
   - Excluir: `/admin/*`, `/api/*`, `/auth/*`
   - URLs dinámicas: generar desde BD (vehículos activos, dealers públicos)
   - Frecuencia de actualización: vehículos `weekly`, home `daily`, legales `monthly`
3. Verificar que se regenera automáticamente en cada deploy
4. Registrar en Google Search Console (fundadores — DOC2)

### Parte B — robots.txt

**Verificar/crear `/public/robots.txt`:**

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /auth/
Disallow: /dashboard/
Sitemap: https://tracciona.com/sitemap.xml
```

**Verificar que no bloquea:** CSS, JS, imágenes (Google necesita renderizar la página).

### Parte C — Meta tags únicos por página

**Auditar y corregir `useSeoMeta()` / `useHead()` en cada layout y página:**

1. **Home:** title "Tracciona — Marketplace de vehículos industriales" + description
2. **Listado vehículos:** title "Camiones y vehículos industriales en venta — Tracciona" + description con filtros activos
3. **Detalle vehículo:** title "[Marca] [Modelo] [Año] — Tracciona" + description generada por IA
4. **Detalle dealer:** title "[Nombre dealer] — Vehículos industriales — Tracciona"
5. **Páginas legales:** titles específicos
6. **404:** title "Página no encontrada — Tracciona"

**Cada página debe tener:**

- `<title>` único (50-60 chars)
- `<meta name="description">` único (120-160 chars)
- `<link rel="canonical">` apuntando a URL limpia
- NO títulos duplicados entre páginas

### Parte D — Open Graph + Twitter Cards

**Configurar en `useSeoMeta()` para cada tipo de página:**

```typescript
// Ejemplo para detalle de vehículo
useSeoMeta({
  ogTitle: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
  ogDescription: vehicle.aiDescription?.substring(0, 160),
  ogImage: vehicle.images?.[0]?.url,
  ogType: 'product',
  ogUrl: `https://tracciona.com/vehiculos/${vehicle.slug}`,
  ogLocale: 'es_ES',
  ogLocaleAlternate: ['en_GB'],
  ogSiteName: 'Tracciona',
  twitterCard: 'summary_large_image',
  twitterTitle: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
  twitterDescription: vehicle.aiDescription?.substring(0, 160),
  twitterImage: vehicle.images?.[0]?.url,
})
```

**Verificar con:** https://developers.facebook.com/tools/debug/ y https://cards-dev.twitter.com/validator

### Parte E — Hreflang tags

**Configurar alternates para i18n:**

```html
<link rel="alternate" hreflang="es" href="https://tracciona.com/vehiculos/camion-xyz" />
<link rel="alternate" hreflang="en" href="https://tracciona.com/en/vehicles/truck-xyz" />
<link rel="alternate" hreflang="x-default" href="https://tracciona.com/vehiculos/camion-xyz" />
```

Verificar que `@nuxtjs/i18n` genera esto automáticamente. Si no, configurar en `i18n` options de nuxt.config.

### Parte F — Canonical tags

**Verificar que cada página tiene canonical:**

- Detalle vehículo: canonical = URL limpia sin parámetros de tracking
- Listado con filtros: canonical = URL sin filtros (o con filtros si son páginas indexables)
- Paginación: canonical de cada página a sí misma, NO a la primera página

### Parte G — Breadcrumbs

**Crear componente `components/ui/Breadcrumbs.vue`:**

```
Home > Vehículos > Camiones > Mercedes-Benz > Actros 1845
Home > Dealers > Mesplet Trucks
Home > Blog > Título del artículo
```

- Schema.org BreadcrumbList (JSON-LD)
- Responsive: en móvil, truncar niveles intermedios con `...`
- Integrar en layouts de detalle de vehículo, dealer, y futuro blog

---

## SESIÓN 62 — Página 404, error pages, y auditoría semántica

> **Objetivo:** Gestión correcta de errores + HTML semántico + accesibilidad básica
> **Estimación:** 2 horas Claude Code
> **Dependencias:** Ninguna
> **Referencia:** CHECKLIST-SEO-UX-TECNICO.md — secciones 1.3, 5, 7

### Parte A — Página 404 personalizada

**Crear `error.vue` (Nuxt error page):**

Debe incluir:

1. Branding Tracciona (logo, colores)
2. Mensaje amigable bilingüe: "Esta página no existe o se ha movido"
3. Buscador de vehículos inline
4. Enlaces sugeridos: vehículos populares, categorías principales, contacto
5. CTA: "Volver al inicio" / "Buscar vehículos"
6. HTTP status 404 correcto (no soft 404)
7. Meta noindex para que Google no indexe la 404

**Diferenciación por tipo:**

- Si URL parece un vehículo eliminado: "Este vehículo ya no está disponible. Mira vehículos similares:"
- Si URL parece dealer: "Este dealer ya no está activo."
- Otros: mensaje genérico

### Parte B — Páginas de error 500/503

**Crear error handling para errores del servidor:**

- Error 500: "Algo salió mal. Estamos trabajando en ello."
- Error 503: "Tracciona está en mantenimiento. Volvemos enseguida."
- Con branding, sin información técnica al usuario
- Log del error real en servidor/Sentry

### Parte C — Redirecciones 301

**Crear `server/middleware/redirects.ts`:**

- Mapa de redirecciones para URLs que cambien de estructura
- Patrón: si se renombra `/vehiculos/[id]` a `/vehiculos/[slug]`, redirigir con 301
- Incluir redirección www → non-www (verificar que Cloudflare lo hace)
- Log de 404s frecuentes para identificar URLs que necesitan redirección

### Parte D — Auditoría de HTML semántico

**Verificar y corregir estructura semántica en layouts:**

```html
<!-- Estructura esperada -->
<header>
  <!-- Nav principal -->
  <nav>
    <!-- Menú -->
    <main>
      <!-- Contenido principal (uno por página) -->
      <article>
        <!-- En páginas de detalle -->
        <section>
          <!-- Agrupaciones lógicas -->
          <aside>
            <!-- Sidebars, filtros -->
            <footer><!-- Pie de página --></footer>
          </aside>
        </section>
      </article>
    </main>
  </nav>
</header>
```

**Verificar:**

- Solo un `<h1>` por página
- Jerarquía H1 > H2 > H3 sin saltos
- `<nav>` en menú principal y breadcrumbs
- `<main>` envolviendo contenido principal
- `<article>` en fichas de vehículo y entradas de blog
- Labels en todos los `<input>` y `<select>`

### Parte E — Skip to content + focus management

**Añadir al layout principal:**

```html
<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute ...">
  Saltar al contenido
</a>
<!-- ... header/nav ... -->
<main id="main-content"></main>
```

**Verificar focus rings:** Tailwind `ring` classes visibles en todos los elementos interactivos.

### Parte F — Alt text audit

**Script de auditoría: buscar todas las `<img>` y `<NuxtImg>` sin alt:**

```bash
grep -rn '<img\|<NuxtImg\|<nuxt-img' components/ pages/ --include="*.vue" | grep -v 'alt='
```

**Corregir:** Añadir alt descriptivo. Para imágenes de vehículos: `alt="${brand} ${model} ${year} - vista ${index}"`. Para iconos decorativos: `alt=""` + `aria-hidden="true"`.

---

## SESIÓN 63 — Schema.org (datos estructurados) + compartir en redes

> **Objetivo:** Rich snippets en Google + compartibilidad social
> **Estimación:** 2-3 horas Claude Code
> **Dependencias:** Sesión 61 (meta tags y OG deben existir)
> **Referencia:** CHECKLIST-SEO-UX-TECNICO.md — secciones 4.5, 6

### Parte A — Schema.org para vehículos (Product + Vehicle)

**Crear composable `composables/useStructuredData.ts`:**

```typescript
// Para detalle de vehículo
export function useVehicleSchema(vehicle: Vehicle) {
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Vehicle',
          name: `${vehicle.brand} ${vehicle.model}`,
          description: vehicle.aiDescription,
          image: vehicle.images?.map((i) => i.url),
          brand: { '@type': 'Brand', name: vehicle.brand },
          model: vehicle.model,
          vehicleModelDate: vehicle.year?.toString(),
          mileageFromOdometer: vehicle.km
            ? {
                '@type': 'QuantitativeValue',
                value: vehicle.km,
                unitCode: 'KMT',
              }
            : undefined,
          fuelType: vehicle.fuelType,
          offers: {
            '@type': 'Offer',
            price: vehicle.price,
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock',
            seller: {
              '@type': 'Organization',
              name: vehicle.dealer?.name,
            },
          },
        }),
      },
    ],
  })
}
```

### Parte B — Schema.org Organization

**En layout principal o `app.vue`:**

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Tracciona",
  "url": "https://tracciona.com",
  "logo": "https://tracciona.com/logo.png",
  "description": "Marketplace de vehículos industriales con IA",
  "foundingDate": "2024",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": "info@tracciona.com"
  },
  "sameAs": []
}
```

### Parte C — Schema.org BreadcrumbList

**Integrar con componente Breadcrumbs de sesión 61G:**

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://tracciona.com" },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Camiones",
      "item": "https://tracciona.com/vehiculos?type=camion"
    },
    { "@type": "ListItem", "position": 3, "name": "Mercedes-Benz Actros 1845" }
  ]
}
```

### Parte D — Schema.org WebSite (SearchAction)

**Para que Google muestre sitelinks searchbox:**

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "https://tracciona.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://tracciona.com/vehiculos?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

### Parte E — Botones de compartir en redes

**Crear componente `components/ui/ShareButtons.vue`:**

Botones para compartir ficha de vehículo en:

- WhatsApp (prioritario — B2B industrial usa mucho WhatsApp)
- LinkedIn (profesional)
- Email
- Copiar enlace

**Sin SDKs externos** (privacidad): usar URLs de intención directas:

```
WhatsApp: https://wa.me/?text={url}
LinkedIn: https://www.linkedin.com/sharing/share-offsite/?url={url}
Email: mailto:?subject={title}&body={url}
```

### Parte F — Verificación con herramientas

**Añadir a `scripts/seo-check.mjs`:**

1. Validar JSON-LD con Schema.org Validator API
2. Verificar que cada página de vehículo genera schema Vehicle válido
3. Verificar que OG tags existen en cada tipo de página
4. Integrar en daily-audit o CI

---

## SESIÓN 64 — URLs limpias (slugs SEO) + internal linking + SEO audit CI

> **Objetivo:** URLs descriptivas para vehículos + estrategia de enlaces internos + gate SEO automático
> **Estimación:** 2-3 horas Claude Code
> **Dependencias:** Sesión 47 (migración vehicles vertical)
> **Referencia:** CHECKLIST-SEO-UX-TECNICO.md — sección 4.4, 3.5

### Parte A — Slugs SEO para vehículos

**Problema actual:** URLs tipo `/vehiculos/12345` (ID numérico) no son descriptivas.

**Solución:**

1. Migración: añadir columna `slug` a `vehicles`:

```sql
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS slug text UNIQUE;
CREATE INDEX IF NOT EXISTS idx_vehicles_slug ON vehicles(slug);
```

2. Generar slugs automáticamente al crear/actualizar vehículo:

```typescript
// utils/generateSlug.ts
function generateVehicleSlug(v: Vehicle): string {
  const base = [v.brand, v.model, v.year, v.id?.toString().slice(-4)]
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
  return base // e.g. "mercedes-benz-actros-1845-a7f3"
}
```

3. Actualizar rutas Nuxt: `/vehiculos/[slug]` en vez de `/vehiculos/[id]`
4. Redirección 301 de `/vehiculos/[id]` a `/vehiculos/[slug]` para URLs existentes
5. Script para generar slugs a todos los vehículos existentes

### Parte B — Internal linking strategy

**Crear componente `components/vehicle/RelatedVehicles.vue`:**

- Al final de ficha de vehículo: "Vehículos similares" (misma marca, categoría, o rango de precio)
- Query: `vehicles WHERE brand = X AND id != current ORDER BY created_at DESC LIMIT 4`

**Crear componente `components/vehicle/CategoryLinks.vue`:**

- En listado: links a categorías populares ("Camiones Mercedes", "Furgonetas Ford", etc.)
- Mejora crawlability y distribución de PageRank

**En páginas de dealer:**

- Link a todos sus vehículos activos
- Link a vehículos similares de otros dealers (cuidado con UX)

### Parte C — SEO audit automático en CI

**Crear `.github/workflows/seo-audit.yml`:**

```yaml
name: SEO Audit
on:
  push:
    branches: [main]
    paths: ['pages/**', 'components/**', 'layouts/**']
jobs:
  seo:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: node scripts/seo-check.mjs
```

**`scripts/seo-check.mjs` verifica:**

1. Todas las páginas en `pages/` tienen `useSeoMeta()` o `useHead()` con title y description
2. Todas las `<img>` tienen `alt`
3. Solo un `<h1>` por página
4. JSON-LD válido en páginas de detalle
5. No hay `<a>` sin `href`
6. Sitemap incluye todas las rutas públicas

**Output:** Reporte en CI, fail si hay errores críticos (falta title, falta alt en imágenes principales).

---

## RESUMEN DE SESIONES

| Sesión | Foco                                                 | Dimensiones que mejora | Prioridad    |
| ------ | ---------------------------------------------------- | ---------------------- | ------------ |
| 47     | Hallazgos críticos + limpieza                        | 1,2,3                  | 🔴 URGENTE   |
| 48     | Modularización whatsapp                              | 2                      | 🔴 URGENTE   |
| 49     | DAST + tests seguridad                               | 1                      | 🟡 ALTA      |
| 50     | HSTS, CORS, WAF docs                                 | 1                      | 🟡 ALTA      |
| 51     | Testing → 40% coverage                               | 2                      | 🟡 ALTA      |
| 52     | Lighthouse CI + Web Vitals + accesibilidad           | 5                      | 🟢 MEDIA     |
| 53     | BD integridad + ERD                                  | 3                      | 🟢 MEDIA     |
| 54     | Docs: CHANGELOG, crons, estado                       | 8                      | 🟢 MEDIA     |
| 55     | Resiliencia: restore + mirror                        | 11                     | 🟢 MEDIA     |
| 56     | Event bus + feature flags                            | 2,4                    | 🟡 ALTA      |
| 57     | Demo mode + widget + importador                      | 5,6                    | 🟡 ALTA      |
| 58     | Market Intelligence + valoración + editorial         | 6,10                   | 🟢 MEDIA     |
| 59     | CSP avanzado + licencias                             | 1                      | 🔵 BAJA      |
| 60     | Nonce CSP + PWA                                      | 1,5                    | 🔵 BAJA      |
| **61** | **SEO: meta tags, sitemap, OG, breadcrumbs**         | **5,6**                | **🟡 ALTA**  |
| **62** | **404/error pages, semántica, accesibilidad**        | **5,7**                | **🟡 ALTA**  |
| **63** | **Schema.org + compartir en redes**                  | **5,6**                | **🟢 MEDIA** |
| **64** | **URLs limpias (slugs) + internal linking + SEO CI** | **5,6**                | **🟡 ALTA**  |

**Total estimado:** ~45-55 horas de Claude Code

### Orden de ejecución recomendado para SEO

Las sesiones 61-64 pueden ejecutarse **antes** de muchas otras sesiones, ya que no dependen de hallazgos críticos. El orden ideal sería:

1. **Sesión 47** (críticos) → obligatorio primero
2. **Sesión 61** (SEO quick wins) → alto impacto, baja dependencia
3. **Sesión 62** (404 + semántica) → complementa 61
4. **Sesión 48** (whatsapp) → urgente técnico
5. **Sesión 64** (slugs + linking) → depende de 47 (migración BD)
6. **Sesión 63** (schema.org) → depende de 61 (meta tags)
7. Resto según prioridad original
