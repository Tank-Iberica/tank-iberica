# Estado Real del Producto — Tracciona

> Generado automáticamente: 2026-03-18
> Script: `node scripts/generate-product-status.mjs`

## Métricas del Código

| Categoría | Cantidad |
|-----------|----------|
| **Páginas (total)** | 134 |
| Páginas admin | 57 |
| Páginas dashboard | 31 |
| **Componentes Vue** | 536 |
| Componentes admin | 253 |
| **Composables** | 267 |
| Composables admin | 85 |
| Composables dashboard | 25 |
| **Server routes (API)** | 130 |
| Server middleware | 11 |
| **Tests unitarios** | 1004 |
| Tests E2E | 1 |
| **Migraciones BD** | 129 |
| Archivos CSS globales | 11 |
| Archivos i18n | 2 |

## Git

| Dato | Valor |
|------|-------|
| Branch actual | `main` |
| Total commits | 504 |

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
