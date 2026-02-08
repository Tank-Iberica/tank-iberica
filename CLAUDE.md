# Tank Iberica — Plataforma de Vehículos Industriales

## Información del proyecto

- **Email admin:** tankiberica@gmail.com
- **Supabase Project ID:** gmnrfuzekbwyzkgsaftv

## Qué es este proyecto

Migración de una web monolítica (22 archivos, 37.685 líneas) a una aplicación profesional con Nuxt 3 + Supabase + Cloudflare Pages + Cloudinary. Es una réplica visual y funcional del sitio actual, con arquitectura moderna por debajo.

## Stack

- **Frontend:** Nuxt 3 (Vue 3), TypeScript, Pinia, @nuxtjs/i18n
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Edge Functions + Storage)
- **Imágenes:** Cloudinary via @nuxt/image
- **Deploy:** Cloudflare Pages (auto-deploy on push to main)
- **Tests:** Vitest (unit), Vue Test Utils (component), Playwright (E2E)
- **Calidad:** ESLint (@nuxt/eslint-config), Prettier, Husky

## Comandos

```bash
npm run dev          # Desarrollo local (http://localhost:3000)
npm run build        # Build producción (Cloudflare Pages preset)
npm run lint         # ESLint
npm run lint:fix     # ESLint con auto-fix
npm run typecheck    # nuxi typecheck
npm run test         # Vitest (unit + component)
npm run test:e2e     # Playwright E2E
npx supabase gen types typescript --project-id <ID> > types/supabase.ts
```

## Tres requisitos no negociables

1. **Mobile-first:** CSS base = 360px. Breakpoints con `min-width` (nunca max-width). Touch targets ≥ 44px. Cada componente se prueba en móvil ANTES que desktop.
2. **Páginas reales:** Vehículos (`/vehiculo/[slug]`) y noticias (`/noticias/[slug]`) son páginas con URL propia, NO modales. El botón atrás del móvil debe funcionar siempre.
3. **Extensible:** Categorías, subcategorías y filtros se leen de la BD. Añadir uno = insertar fila en la tabla, no tocar código.

## Estructura del proyecto

```
pages/              → Rutas (index, vehiculo/[slug], noticias/[slug], admin/*)
components/         → Vue SFCs organizados por dominio (catalog/, vehicle/, modals/, chat/, layout/, ui/)
composables/        → Lógica reutilizable (useVehicles, useFilters, useFavorites, useChat, useCloudinary)
stores/             → Pinia stores (catalog.ts, auth.ts, ui.ts)
i18n/               → Traducciones (es.json, en.json)
middleware/          → auth.ts, admin.ts
assets/css/         → tokens.css (design system), global.css
types/              → supabase.ts (auto-generated), index.d.ts
server/             → Edge functions si es necesario
supabase/           → migrations/ (SQL), seed.sql
tests/              → unit/, component/, e2e/
docs/               → Documentación de referencia del proyecto
```

## Convenciones de código

- TypeScript estricto. No `any`.
- Composables: `use` + PascalCase (useVehicles, useFilters).
- Componentes: PascalCase, un archivo por componente.
- CSS: scoped en componentes Vue. Variables globales en tokens.css.
- Nunca innerHTML. Vue escapa por defecto. Si necesitas v-html, usa DOMPurify.
- Nunca console.log en producción. Usa Sentry para errores.
- Nunca hardcodear categorías, subcategorías ni filtros. Siempre leer de BD.
- i18n: todo texto visible al usuario va en es.json/en.json, nunca hardcodeado.
- Cada composable tiene su test unitario en tests/unit/.
- Cada componente crítico tiene test en tests/component/.

## Base de datos (Supabase)

- 17 tablas PostgreSQL. Ver @docs/esquema-bd.md para esquema completo.
- RLS activado en TODAS las tablas. Nunca desactivar RLS.
- Enums: vehicle_status, vehicle_category, user_role, filter_type, msg_direction, balance_type.
- Las tablas se crean progresivamente según la hoja de ruta, NO todas de golpe.

## Seguridad

- SUPABASE_URL y SUPABASE_ANON_KEY en .env (nunca hardcodeadas).
- anon_key es segura (limitada por RLS). service_role_key SOLO en Edge Functions server-side.
- Passwords gestionados por Supabase Auth (bcrypt). Nunca hash manual.
- Sessions en cookies httpOnly/secure/sameSite (gestionadas por @nuxtjs/supabase).

## Design system

- Color primario: #23424A (petrol blue). Ver @docs/DESIGN_SYSTEM.md
- Tipografía: Inter (Google Fonts)
- Breakpoints: 480px, 768px, 1024px, 1280px (mobile-first, min-width)
- Spacing: escala de 4px (4, 8, 12, 16, 24, 32, 48, 64)

## Hoja de ruta

El proyecto se implementa en 7 steps siguiendo vertical slicing. Ver @docs/hoja-de-ruta.md para detalle. Resumen:

- **Step 0:** Emergencia seguridad (código actual, sin migración)
- **Step 1:** Nuxt + Auth + Deploy (scaffold + primera página)
- **Step 2:** Catálogo completo (BD + filtros dinámicos + /vehiculo/[slug])
- **Step 3:** Interacción usuario (favoritos, anúnciate, solicitar)
- **Step 4:** Noticias + Chat (páginas reales + Realtime)
- **Step 5:** Admin completo (sustituye admin.html)
- **Step 6:** Hardening (TypeScript, tests, PWA, Lighthouse, desmantelamiento)

## Git workflow

- Branch principal: `main` (auto-deploy a Cloudflare Pages)
- Cada step: crear branch `step-N/descripcion` (ej: `step-2/catalogo`)
- Cada tarea: crear branch desde step `step-2/task-2.6-composable-vehicles`
- Commits: conventional commits (feat:, fix:, refactor:, test:, docs:)
- Antes de merge: lint + typecheck + tests deben pasar

## Referencia del código actual

Los archivos del sitio actual están en `docs/legacy/`. Usarlos como referencia visual y funcional para replicar comportamiento exacto:
- `docs/legacy/index-funcionalidades.md` — Documentación funcional de index.html
- `docs/legacy/admin-funcionalidades.md` — Documentación funcional de admin.html
- `docs/legacy/DESIGN_SYSTEM.md` — Tokens de diseño
- `docs/legacy/PARAMETROS_ADMIN_ORIGINAL.md` — IDs, funciones, secciones del admin
