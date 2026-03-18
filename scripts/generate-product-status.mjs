#!/usr/bin/env node
/**
 * Generates ESTADO-REAL-PRODUCTO.md with real project metrics.
 * Run: node scripts/generate-product-status.mjs
 */
import { writeFileSync } from 'node:fs'
import { glob } from 'glob'
import { execSync } from 'node:child_process'

const now = new Date().toISOString().slice(0, 10)

// Count files by pattern
async function count(pattern) {
  return (await glob(pattern)).length
}

// Safe exec
function exec(cmd) {
  try { return execSync(cmd, { encoding: 'utf-8', cwd: process.cwd() }).trim() }
  catch { return '0' }
}

const [
  pages, adminPages, dashPages,
  components, adminComponents,
  composables, adminComposables, dashComposables,
  serverRoutes, middleware,
  tests, e2eTests,
  migrations,
  cssFiles, i18nKeys,
] = await Promise.all([
  count('app/pages/**/*.vue'),
  count('app/pages/admin/**/*.vue'),
  count('app/pages/dashboard/**/*.vue'),
  count('app/components/**/*.vue'),
  count('app/components/admin/**/*.vue'),
  count('app/composables/**/*.ts'),
  count('app/composables/admin/**/*.ts'),
  count('app/composables/dashboard/**/*.ts'),
  count('server/api/**/*.ts'),
  count('server/middleware/**/*.ts'),
  count('tests/unit/**/*.test.ts'),
  count('tests/e2e/**/*.test.ts'),
  count('supabase/migrations/*.sql'),
  count('app/assets/css/**/*.css'),
  count('i18n/*.json'),
])

const gitCommits = exec('git rev-list --count HEAD')
const gitBranch = exec('git branch --show-current')

const content = `# Estado Real del Producto — Tracciona

> Generado automáticamente: ${now}
> Script: \`node scripts/generate-product-status.mjs\`

## Métricas del Código

| Categoría | Cantidad |
|-----------|----------|
| **Páginas (total)** | ${pages} |
| Páginas admin | ${adminPages} |
| Páginas dashboard | ${dashPages} |
| **Componentes Vue** | ${components} |
| Componentes admin | ${adminComponents} |
| **Composables** | ${composables} |
| Composables admin | ${adminComposables} |
| Composables dashboard | ${dashComposables} |
| **Server routes (API)** | ${serverRoutes} |
| Server middleware | ${middleware} |
| **Tests unitarios** | ${tests} |
| Tests E2E | ${e2eTests} |
| **Migraciones BD** | ${migrations} |
| Archivos CSS globales | ${cssFiles} |
| Archivos i18n | ${i18nKeys} |

## Git

| Dato | Valor |
|------|-------|
| Branch actual | \`${gitBranch}\` |
| Total commits | ${gitCommits} |

## Stack

- **Framework:** Nuxt 3 (Vue 3 + Nitro)
- **BD:** Supabase (PostgreSQL)
- **Hosting:** Cloudflare Pages
- **CSS:** Custom design system con CSS Layers
- **i18n:** ES + EN (vue-i18n)
- **Auth:** Supabase Auth + admin middleware
- **Pagos:** Stripe
- **Imágenes:** Cloudinary + Cloudflare Images

## Arquitectura

- Mobile-first (360px base, breakpoints: 480/768/1024/1280)
- Multi-vertical ready (vertical_config en BD)
- JSONB para campos multi-idioma
- Scoped CSS + CSS custom properties
- Composables pattern para lógica reutilizable
`

writeFileSync('docs/ESTADO-REAL-PRODUCTO.md', content)
console.log('Generated docs/ESTADO-REAL-PRODUCTO.md')
console.log(`Pages: ${pages} | Components: ${components} | Composables: ${composables} | Tests: ${tests}`)
