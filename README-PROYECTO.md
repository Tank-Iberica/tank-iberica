# Tracciona

> Grupo de marketplaces B2B verticales. Mismo codigo, N verticales.

## Que es

Plataforma multi-vertical de compraventa profesional. Cada vertical (vehiculos, maquinaria, hosteleria...) comparte el mismo codigo base, configurado por `vertical_config` en BD.

## Estado actual

Ver [`docs/ESTADO-REAL-PRODUCTO.md`](docs/ESTADO-REAL-PRODUCTO.md) para el estado real de cada modulo.

## Como empezar

Ver [Guia de onboarding](#guia-de-onboarding) mas abajo.

## Stack

- **Frontend:** Nuxt 3 + TypeScript + Tailwind (tokens.css)
- **Backend:** Server routes Nuxt (Nitro) -> Cloudflare Workers
- **BD:** Supabase (PostgreSQL + RLS + Realtime)
- **Pagos:** Stripe (suscripciones, depositos, checkout)
- **Imagenes:** Cloudinary -> CF Images (pipeline hibrido)
- **Email:** Resend + templates en BD
- **WhatsApp:** Meta Cloud API + Claude Vision
- **CI/CD:** GitHub Actions -> Cloudflare Pages
- **Seguridad CI:** Semgrep CE + Snyk free + npm audit

## Documentacion

### Documentos VIVOS (fuente de verdad)

| Documento                                                                                       | Que contiene                                     |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| [`INSTRUCCIONES-MAESTRAS.md`](docs/tracciona-docs/INSTRUCCIONES-MAESTRAS.md)                    | Sesiones de ejecucion (1-43, todas completadas)  |
| [`ESTADO-REAL-PRODUCTO.md`](docs/ESTADO-REAL-PRODUCTO.md)                                       | Estado real de cada modulo (generado del codigo) |
| [`contexto-global.md`](docs/tracciona-docs/contexto-global.md)                                  | Mapa del proyecto para Claude Code               |
| [`CLAUDE.md`](CLAUDE.md)                                                                        | Instrucciones rapidas para Claude Code           |
| [`INVENTARIO-ENDPOINTS.md`](docs/tracciona-docs/referencia/INVENTARIO-ENDPOINTS.md)             | Todos los endpoints con auth y proposito         |
| [`ARQUITECTURA-ESCALABILIDAD.md`](docs/tracciona-docs/referencia/ARQUITECTURA-ESCALABILIDAD.md) | Diseno multi-cluster, costes, decisiones         |

### Documentos HISTORICOS (referencia, no modificar)

| Documento                  | Por que existe                                        |
| -------------------------- | ----------------------------------------------------- |
| `docs/plan-v3.md`          | Diseno original pre-implementacion                    |
| `docs/hoja-de-ruta.md`     | Roadmap inicial (superado por INSTRUCCIONES-MAESTRAS) |
| `docs/guia-claude-code.md` | Guia original para IA (superado por CLAUDE.md)        |
| `docs/legacy/`             | Documentos de la version anterior                     |

### Auditorias (checklist de pendientes)

| Documento                                                                        | Contenido                                             |
| -------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [`CHECKLIST-POST-SESIONES.md`](docs/auditorias/CHECKLIST-POST-SESIONES.md)       | Pendientes accionables no cubiertos por sesiones 1-43 |
| [`RECOMENDACIONES-100-PUNTOS.md`](docs/auditorias/RECOMENDACIONES-100-PUNTOS.md) | 100 recomendaciones priorizadas por area              |
| [`VALORACION-PROYECTO-1-100.md`](docs/auditorias/VALORACION-PROYECTO-1-100.md)   | Puntuacion del proyecto por dimension                 |
| [`AUDITORIA-INTEGRAL-2026-02.md`](docs/auditorias/AUDITORIA-INTEGRAL-2026-02.md) | Auditoria tecnica completa (feb 2026)                 |
| [`ISSUES-AUDITORIA.md`](docs/auditorias/ISSUES-AUDITORIA.md)                     | Issues especificos con prioridad                      |

### Anexos (referencia tecnica)

| Carpeta                           | Contenido                                             |
| --------------------------------- | ----------------------------------------------------- |
| `docs/tracciona-docs/anexos/`     | Anexos A-X: especificaciones detalladas por modulo    |
| `docs/tracciona-docs/referencia/` | FLUJOS-OPERATIVOS, INVENTARIO-ENDPOINTS, ARQUITECTURA |

## Guia de onboarding

### Para Claude Code

1. Leer `CLAUDE.md` (instrucciones rapidas)
2. Leer `contexto-global.md` (mapa completo)
3. Si te piden ejecutar una sesion: leer `INSTRUCCIONES-MAESTRAS.md` -> sesion N

### Para un desarrollador humano

1. Clonar el repo
2. `cp .env.example .env` y rellenar variables
3. `npm install`
4. `npm run dev`
5. Leer este README y luego `ESTADO-REAL-PRODUCTO.md`
6. Para entender una funcionalidad: buscar en `INSTRUCCIONES-MAESTRAS.md` la sesion correspondiente

### Comandos utiles

| Comando                          | Que hace               |
| -------------------------------- | ---------------------- |
| `npm run dev`                    | Servidor de desarrollo |
| `npm run build`                  | Build de produccion    |
| `npm run lint`                   | Lint                   |
| `npm run typecheck`              | TypeScript check       |
| `npx vitest run`                 | Tests unitarios        |
| `npx vitest run tests/security/` | Tests de seguridad     |
| `npx playwright test`            | Tests E2E              |
| `npx nuxi analyze`               | Analizar bundle        |
