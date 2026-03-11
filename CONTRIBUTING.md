# Contributing to Tracciona

## Quick Start

```bash
git clone <repo-url>
cp .env.example .env.local   # Fill in your Supabase/Cloudinary/Stripe keys
npm install
npm run dev                   # http://localhost:3000
```

## Stack

- **Frontend:** Nuxt 3 (Vue 3), TypeScript
- **Backend:** Supabase (PostgreSQL + Auth + RLS + Edge Functions)
- **Images:** Cloudinary via @nuxt/image
- **Deploy:** Cloudflare Pages (auto-deploy on push to main)
- **i18n:** @nuxtjs/i18n (ES + EN)

## Project Structure

```
app/
  pages/          # Nuxt routes
  components/     # Vue SFCs by domain (catalog/, vehicle/, modals/, layout/, ui/)
  composables/    # Reusable logic (useVehicles, useFilters, etc.)
  layouts/        # default, admin
  middleware/     # auth.ts, admin.ts
  assets/css/     # tokens.css (design system), global.css
server/
  api/            # API endpoints
  middleware/     # Security headers, CORS, rate limiting
  services/       # Business logic (billing, marketReport)
  utils/          # Shared server utilities
i18n/             # es.json, en.json
supabase/migrations/  # SQL migrations (numbered 00001+)
types/            # supabase.ts (auto-generated), index.d.ts
tests/            # Unit tests (Vitest) + E2E (Playwright)
```

## Non-Negotiable Rules

1. **Mobile-first:** CSS base = 360px. Breakpoints with `min-width`. Touch targets >= 44px.
2. **Real pages:** Vehicles and articles are pages with their own URL, NOT modals.
3. **Extensible:** Categories, subcategories, filters, and languages come from DB. Adding one = inserting a row, not touching code.
4. **Vertical isolation:** All vehicle/ad queries must include `.eq('vertical', getVerticalSlug())`.
5. **RLS mandatory:** Every new Supabase table must have Row Level Security policies.
6. **No hardcoded values:** Categories, subcategories, filters, brands — always from DB.
7. **No `innerHTML`:** Use `textContent` or Vue template binding. If unavoidable, use DOMPurify.
8. **No `console.log`:** Use proper error handling or Sentry in production code.

## Code Conventions

### File size limits

- Components Vue: max 500 lines. If it grows, extract sub-components.
- Server routes: max 200 lines. If it grows, extract logic to `server/utils/` or `server/services/`.

### Composables

- One composable per domain: `useVehicles`, `useAuction`, `useAuth`.
- Shared between admin and dashboard: `composables/shared/`.
- NO generic composables like `useHelper` or `useUtils`.

### Components

- Admin-specific: `components/admin/`
- Dashboard-specific: `components/dashboard/`
- Shared: `components/shared/`
- Generic UI: `components/ui/`

### Server routes

- Auth: always `serverSupabaseUser(event)` at the start.
- Service role: only when RLS is not enough. Verify ownership afterwards.
- Errors: use `safeError()` for generic messages in production.

### i18n

- UI text: always `$t('key')`, never hardcoded text.
- Dynamic data: `localizedField(item.name, locale)`.
- NEVER access `.name_es` or `.name_en` directly.

### TypeScript

- Strict mode. No `any`.
- Composables: `use` + PascalCase (e.g., `useVehicles`, `useLocalized`)
- Components: PascalCase, one file per component

### CSS

- Scoped in Vue components. Global variables in `tokens.css`.
- Design tokens: `--color-primary`, `--text-primary`, `--bg-secondary`, etc.
- Breakpoints: 480px, 768px, 1024px, 1280px (always `min-width`).

### Migrations

- Incremental numbering in `supabase/migrations/` (00065, 00066...).
- Apply with `npx supabase db push`.
- Regenerate types: `npx supabase gen types typescript --project-id <id> > types/supabase.ts`.
- **Staging project** (`xddjhrgkwwolpugtxgfk`): usado para tests IDOR/RLS. Si una migración afecta RLS policies, aplicar también en staging con `npx supabase link --project-ref xddjhrgkwwolpugtxgfk && npx supabase db push`, luego re-vincular a producción.

## Tests

- Security: `tests/security/` — integration tests (require running server for some)
  - **IDOR/RLS** (`tests/security/idor-protection.test.ts`): 13 tests contra Supabase staging. Requiere `STAGING_SUPABASE_URL` + `STAGING_SUPABASE_KEY` en `.env` o como env vars. Sin ellas, los tests se saltan automáticamente.
- Unit: `tests/unit/` — Vitest
- E2E: `tests/e2e/` — Playwright

### Clasificación de tests (qué herramienta usar)

| Situación | Herramienta |
|-----------|-------------|
| Lógica pura sin deps externas | Vitest |
| Composable con useI18n/useRouter simples | Vitest + mocks de `tests/setup.ts` |
| Composable con contexto Nuxt complejo | Vitest + `@nuxt/test-utils` |
| Necesita servidor HTTP real | Playwright |
| Necesita navegador real | Playwright |
| Necesita BD real (RLS) | Vitest contra Supabase staging (IDOR tests) |
| Seguridad de endpoints (sin servidor real) | Vitest + MSW |

### Notas arquitectónicas de tests

- **`e2e-journeys` mantiene `continue-on-error: true`** — necesita secrets de E2E (emails, passwords). Es exploratorio/informativo, no bloqueante.
- **`@nuxt/test-utils`** — solo instalar si se testean composables con contexto Nuxt complejo (`useNuxtApp`, `useRuntimeConfig` con plugins). Para composables simples, los mocks de `tests/setup.ts` son suficientes. No instalar preventivamente.
- **Supabase staging** (`xddjhrgkwwolpugtxgfk`) — proyecto separado con fixtures fijos (2 dealers, 5 vehículos, 4 facturas, 3 pipeline items, 2 historico). Nunca usar datos de producción en tests.

### Regla de tests para funciones puras

**Toda función en `app/utils/` o `server/utils/` que sea pura (sin dependencias de Supabase, Nuxt ni DOM) debe tener un archivo de test correspondiente en `tests/unit/`.**

CI verifica esto automáticamente. Un nuevo `app/utils/foo.ts` sin `tests/unit/foo.test.ts` bloqueará el merge.

Criterio de "función pura" a efectos de esta regla:
- No importa `useSupabaseClient`, `useSupabaseUser`, ni hace `fetch`
- No importa `useNuxtApp`, `useRuntimeConfig`, `useI18n` directamente
- No usa `document`, `window` ni APIs de browser

Si la función usa DOM (ej: genera un `<a>` para descarga), se testea igualmente mockeando las APIs con `vi.stubGlobal`. Ver `tests/unit/adminMetricsExport.test.ts` como referencia.

Clasificación de tests → sección "Clasificación de tests" más abajo en este documento

## Before Submitting

```bash
npm run lint        # Must pass
npm run typecheck   # Must pass
npm run test        # Must pass
npm run build       # Must compile without errors
```

## Git

- Branch: `main`
- Commits: conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`)
- Always lint + typecheck before merging

## Key Documentation

- `docs/PROYECTO-CONTEXTO.md` — Full project vision and architecture
- `docs/tracciona-docs/BACKLOG-EJECUTABLE.md` — Executable backlog (116 items, prioritized)
- `CLAUDE.md` — AI assistant instructions and project conventions
