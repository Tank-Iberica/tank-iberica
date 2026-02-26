# Tracciona

> Grupo de marketplaces B2B verticales. Mismo codigo, N verticales.

## Que es

Plataforma multi-vertical de compraventa profesional. Cada vertical (vehiculos industriales, maquinaria, hosteleria...) comparte el mismo codigo base, configurado por `vertical_config` en BD.

## Stack

- **Frontend:** Nuxt 3 (Vue 3) + TypeScript
- **Backend:** Server routes Nuxt (Nitro) → Cloudflare Workers
- **BD:** Supabase (PostgreSQL + RLS + Realtime)
- **Pagos:** Stripe (suscripciones, depositos, checkout)
- **Imagenes:** Cloudinary → CF Images (pipeline hibrido)
- **Email:** Resend + templates en BD
- **WhatsApp:** Meta Cloud API + Claude Vision
- **CI/CD:** GitHub Actions → Cloudflare Pages
- **i18n:** ES + EN (extensible a FR, DE)

## Inicio rapido

```bash
# 1. Clonar e instalar
git clone <repo-url>
cd tracciona
cp .env.example .env   # rellenar variables
npm install

# 2. Desarrollo
npm run dev            # http://localhost:3000

# 3. Verificar
npm run lint           # ESLint
npm run typecheck      # nuxi typecheck
npm run test           # Vitest
npm run build          # Build produccion
```

## Estructura del proyecto

```
app/
  pages/              # Rutas (index, vehiculo/[slug], admin/*)
  components/         # SFCs por dominio (catalog/, vehicle/, admin/)
  composables/        # Logica reutilizable (useVehicles, useFilters...)
  layouts/            # Layouts (default, admin)
  middleware/         # auth.ts, admin.ts
  assets/css/         # tokens.css (design system), global.css
server/
  api/                # Endpoints API (Nitro)
  services/           # Logica de negocio (billing, marketReport)
  middleware/         # Security headers, rate limiting, CORS
i18n/                 # Traducciones (es.json, en.json)
supabase/migrations/  # SQL (00001-00064+)
types/                # supabase.ts (auto-generated), index.d.ts
tests/                # Vitest + Playwright
docs/                 # Documentacion del proyecto
```

## Documentacion

| Documento                                                                                       | Contenido                      |
| ----------------------------------------------------------------------------------------------- | ------------------------------ |
| [`CLAUDE.md`](CLAUDE.md)                                                                        | Instrucciones para Claude Code |
| [`INSTRUCCIONES-MAESTRAS.md`](docs/tracciona-docs/INSTRUCCIONES-MAESTRAS.md)                    | Sesiones de ejecucion          |
| [`ESTADO-REAL-PRODUCTO.md`](docs/ESTADO-REAL-PRODUCTO.md)                                       | Estado real de cada modulo     |
| [`contexto-global.md`](docs/tracciona-docs/contexto-global.md)                                  | Mapa del proyecto              |
| [`INVENTARIO-ENDPOINTS.md`](docs/tracciona-docs/referencia/INVENTARIO-ENDPOINTS.md)             | Endpoints con auth y proposito |
| [`ARQUITECTURA-ESCALABILIDAD.md`](docs/tracciona-docs/referencia/ARQUITECTURA-ESCALABILIDAD.md) | Arquitectura multi-cluster     |

## Comandos

| Comando                                                                                   | Que hace                 |
| ----------------------------------------------------------------------------------------- | ------------------------ |
| `npm run dev`                                                                             | Servidor de desarrollo   |
| `npm run build`                                                                           | Build de produccion      |
| `npm run lint`                                                                            | ESLint                   |
| `npm run typecheck`                                                                       | TypeScript check         |
| `npm run test`                                                                            | Tests unitarios (Vitest) |
| `npx playwright test`                                                                     | Tests E2E                |
| `npx supabase db push`                                                                    | Aplicar migraciones      |
| `npx supabase gen types typescript --project-id gmnrfuzekbwyzkgsaftv > types/supabase.ts` | Regenerar tipos BD       |

## Contribuir

Ver [`CONTRIBUTING.md`](CONTRIBUTING.md) para reglas de codigo, workflow de PRs y convenciones.
