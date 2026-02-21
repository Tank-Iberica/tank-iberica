# Tracciona.com — Marketplace de Vehículos Industriales

## Información del proyecto

- **Email admin:** tankiberica@gmail.com
- **Supabase Project ID:** gmnrfuzekbwyzkgsaftv
- **Proyecto anterior:** Tank Ibérica (monolítico) → migración en curso a Tracciona (marketplace)

## Documentación

Toda la documentación de la migración está en `docs/tracciona-docs/`.

**Si necesitas entender el proyecto:**

1. Lee `docs/tracciona-docs/contexto-global.md` — Visión completa del ecosistema
2. Lee `docs/tracciona-docs/README.md` — Estructura y reglas de ejecución

**Si necesitas ejecutar un paso:**

- Lee el archivo de migración correspondiente en `docs/tracciona-docs/migracion/`
- Consulta los anexos que el paso referencia en `docs/tracciona-docs/anexos/`

**Si necesitas ejecutar el proyecto:**

- Lee `docs/tracciona-docs/INSTRUCCIONES-MAESTRAS.md` — Define las 35 sesiones de trabajo (12 pre-lanzamiento + 22 post-lanzamiento + 1 clonado de vertical). Las sesiones 16b, 16c, 16d son subsesiones del antiguo bloque post-lanzamiento Fase 3, en orden, con qué archivos leer en cada una. El usuario te dirá "ejecuta la sesión N".

**Regla principal:** Ejecutar solo lo que dicen las INSTRUCCIONES-MAESTRAS. Los anexos son REFERENCIA, no tareas independientes.

**Reglas críticas:**

- LEE los archivos de la sesión ANTES de escribir código. Relee las reglas del inicio de INSTRUCCIONES-MAESTRAS.
- Si no sabes cómo implementar algo, PREGUNTA al usuario. No improvises.
- Mobile-first obligatorio. Multilenguaje ($t() + localizedField) en todo.
- Si necesitas dashboards web (Supabase, Stripe, Cloudflare) → pregunta al usuario.

**Acceso a herramientas:**

- Tienes acceso completo al sistema de archivos y terminal (npm, supabase CLI, git).
- Puedes leer y modificar .env / .env.local para configurar variables de entorno.
- Puedes ejecutar `supabase db push`, `supabase gen types`, `npm install`, `npm run build` directamente.
- NO tienes acceso a navegador web ni dashboards. Si necesitas crear algo en Stripe/Supabase/Cloudflare dashboard, pide al usuario que lo haga.

**Documentación legacy (referencia del proyecto original):**

- `docs/esquema-bd.md` — Esquema BD actual (pre-migración)
- `docs/admin-funcionalidades.md` — Funcionalidades del admin actual
- `docs/index-funcionalidades.md` — Funcionalidades del frontend actual
- `docs/legacy/` — Documentación del sitio original

## Stack

- **Frontend:** Nuxt 3 (Vue 3), TypeScript, Pinia, @nuxtjs/i18n
- **Backend:** Supabase (PostgreSQL + Auth + RLS + Realtime + Edge Functions)
- **Imágenes:** Cloudinary via @nuxt/image
- **Deploy:** Cloudflare Pages (auto-deploy on push to main)
- **i18n strategy:** prefix_except_default (español sin prefijo, /en/, /fr/, etc.)

## Comandos

```bash
npm run dev          # Dev server (http://localhost:3000)
npm run build        # Build producción
npm run lint         # ESLint
npm run lint:fix     # ESLint auto-fix
npm run typecheck    # nuxi typecheck
npm run test         # Vitest
npx supabase db push # Aplicar migraciones
npx supabase gen types typescript --project-id gmnrfuzekbwyzkgsaftv > types/supabase.ts
```

## Estructura del proyecto

```
app/
  pages/              → Rutas (index, vehiculo/[slug], noticias/[slug], admin/*)
  components/         → SFCs por dominio (catalog/, vehicle/, modals/, layout/, ui/)
  composables/        → Lógica reutilizable (useVehicles, useFilters, etc.)
  layouts/            → Layouts (default, admin)
  middleware/         → auth.ts, admin.ts
  assets/css/         → tokens.css (design system), global.css
i18n/                 → Traducciones (es.json, en.json)
supabase/migrations/  → SQL (00001-00030 existentes, nuevas desde 00031)
types/                → supabase.ts (auto-generated), index.d.ts
docs/tracciona-docs/  → Documentación de migración (NO modificar)
```

## Convenciones de código

- TypeScript estricto. No `any`.
- Composables: `use` + PascalCase (useVehicles, useLocalized, useVerticalConfig)
- Componentes: PascalCase, un archivo por componente
- CSS: scoped en componentes Vue. Variables globales en tokens.css. Custom properties para tema (--primary, --accent)
- Nunca innerHTML sin DOMPurify
- Nunca console.log en producción
- Nunca hardcodear categorías, subcategorías ni filtros — siempre leer de BD
- Nunca hardcodear idiomas (\_es, \_en) — usar JSONB + localizedField()
- i18n: todo texto de UI va en locales/\*.json
- Migraciones en `supabase/migrations/` con numeración incremental (00031, 00032...)
- RLS obligatorio en TODAS las tablas nuevas
- JSONB para campos traducibles cortos (name, label, tagline)
- Tabla content_translations para campos traducibles largos (description, content)

## Tres reglas no negociables

1. **Mobile-first:** CSS base = 360px. Breakpoints con `min-width`. Touch targets ≥ 44px.
2. **Páginas reales:** Vehículos y artículos son páginas con URL propia, NO modales.
3. **Extensible:** Categorías, subcategorías, filtros e idiomas se leen de la BD. Añadir uno = insertar fila, no tocar código.

## Design system

- Color primario: #23424A (petrol blue) — cambiará a los colores de Tracciona vía vertical_config
- Tipografía: Inter (Google Fonts) — configurable desde admin
- Breakpoints: 480px, 768px, 1024px, 1280px (mobile-first)
- Spacing: escala de 4px (4, 8, 12, 16, 24, 32, 48, 64)

## Git workflow

- Branch principal: `main`
- Commits: conventional commits (feat:, fix:, refactor:, test:, docs:)
- Antes de merge: lint + typecheck
