# TradeBase — Marketplace de Vehículos Industriales (Tracciona)

> **TradeBase** es la plataforma de software que genera 11 marketplaces B2B verticales. **Tracciona** es la primera vertical en producción: compra, venta y subastas de vehículos industriales.

## Qué es

**TradeBase** es una plataforma SaaS que genera marketplaces B2B verticales sin código repetido:

- Mismo codebase (Nuxt 3 + Supabase + Cloudflare)
- N verticales (vehículos, maquinaria, hostelería, inmuebles, etc.)
- Configuración por `vertical_config` + datos en BD (sin hardcodes)

**Tracciona** (tracciona.com) es la primera vertical: 4.000+ vehículos industriales en catálogo, 500+ dealers, 1.200+ transacciones históricas.

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

## Documentacion

### Fuentes de verdad (SSOT)

| Que                         | Donde                                                              |
| --------------------------- | ------------------------------------------------------------------ |
| Estado actual               | [`STATUS.md`](STATUS.md)                                           |
| Vision y arquitectura       | [`docs/PROYECTO-CONTEXTO.md`](docs/PROYECTO-CONTEXTO.md)           |
| Estrategia de negocio       | [`docs/ESTRATEGIA-NEGOCIO.md`](docs/ESTRATEGIA-NEGOCIO.md)         |
| Ideas pendientes            | [`docs/IDEAS-A-REVISAR.md`](docs/IDEAS-A-REVISAR.md)               |
| Backlog tecnico             | [`docs/tracciona-docs/BACKLOG.md`](docs/tracciona-docs/BACKLOG.md) |
| Instrucciones para IA       | [`CLAUDE.md`](CLAUDE.md)                                           |
| Contribucion y convenciones | [`CONTRIBUTING.md`](CONTRIBUTING.md)                               |

### Documentacion tecnica

| Documento                                                                                       | Que contiene                                       |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| [`INVENTARIO-ENDPOINTS.md`](docs/tracciona-docs/referencia/INVENTARIO-ENDPOINTS.md)             | Todos los endpoints con auth y proposito           |
| [`ARQUITECTURA-ESCALABILIDAD.md`](docs/tracciona-docs/referencia/ARQUITECTURA-ESCALABILIDAD.md) | Diseno multi-cluster, costes, decisiones           |
| [`FLUJOS-OPERATIVOS.md`](docs/tracciona-docs/referencia/FLUJOS-OPERATIVOS.md)                   | Diagramas ASCII de flujos principales              |
| [`ERD.md`](docs/tracciona-docs/referencia/ERD.md)                                               | Diagrama entidad-relacion (Mermaid)                |
| `docs/tracciona-docs/referencia/`                                                               | Seguridad, WAF, cron jobs, disaster recovery, etc. |
| `docs/tracciona-docs/anexos/`                                                                   | Anexos A-Y: especificaciones por modulo            |

### Legal

| Documento                                       | Contenido                             |
| ----------------------------------------------- | ------------------------------------- |
| [`RAT-BORRADOR.md`](docs/legal/RAT-BORRADOR.md) | Registro Actividades Tratamiento GDPR |

### Auditorias

| Documento                                                                        | Contenido                                |
| -------------------------------------------------------------------------------- | ---------------------------------------- |
| [`AUDITORIA-26-FEBRERO.md`](docs/auditorias/AUDITORIA-26-FEBRERO.md)             | Auditoria mas reciente (12 dimensiones)  |
| [`CHECKLIST-POST-SESIONES.md`](docs/auditorias/CHECKLIST-POST-SESIONES.md)       | Pendientes accionables                   |
| [`RECOMENDACIONES-100-PUNTOS.md`](docs/auditorias/RECOMENDACIONES-100-PUNTOS.md) | 100 recomendaciones priorizadas          |
| [`ISSUES-AUDITORIA.md`](docs/auditorias/ISSUES-AUDITORIA.md)                     | Issues tecnicos con prioridad            |
| `docs/auditorias/externa/`                                                       | Auditoria externa profunda (25 feb 2026) |

### Historico

| Carpeta        | Contenido                                            |
| -------------- | ---------------------------------------------------- |
| `docs/legacy/` | 30+ documentos obsoletos o superseded (no modificar) |

## Contribuir

Ver [`CONTRIBUTING.md`](CONTRIBUTING.md) para reglas de codigo, workflow de PRs y convenciones.
