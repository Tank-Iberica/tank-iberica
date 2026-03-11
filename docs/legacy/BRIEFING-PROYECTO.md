> ⚠️ **[LEGACY]** Documento histórico — solo referencia. No modificar ni usar como fuente de verdad. Ver [docs/README.md](../README.md) para navegación activa.

# BRIEFING COMPLETO DEL PROYECTO — Para cualquier sesión de Claude

> **Propósito de este documento:** Que cualquier sesión de Claude (Code, chat, o lo que sea) entienda al 100% qué es este proyecto, dónde está, qué queda por hacer, y cómo continuar. No es un resumen — es la fuente de verdad comprimida.

---

## 1. QUÉ ES ESTO

### La empresa

Estamos construyendo un **grupo de marketplaces B2B verticales**. Un solo código base que sirve para N verticales. Cada vertical es un marketplace especializado en un sector industrial/profesional con su propio dominio, branding, categorías y mercado.

### Los verticales planificados

| #   | Vertical        | Dominio             | Sector                                                                   | Estado                             |
| --- | --------------- | ------------------- | ------------------------------------------------------------------------ | ---------------------------------- |
| 1   | **Tracciona**   | tracciona.com       | Vehículos industriales (cisternas, cabezas tractoras, semirremolques...) | 🟢 En desarrollo activo            |
| 2   | Horecaria       | horecaria.com       | Equipamiento hostelería/restauración                                     | ⏳ Cuando Tracciona tenga tracción |
| 3   | CampoIndustrial | campoindustrial.com | Maquinaria agrícola e industrial                                         | ⏳ Después de Horecaria            |
| 4   | Municipiante    | municipiante.com    | Vehículos y equipos municipales                                          | ⏳ Según demanda                   |
| 5   | ReSolar         | resolar.com         | Equipamiento energía solar/renovables                                    | ⏳ Según demanda                   |
| 6   | Clinistock      | clinistock.com      | Equipamiento clínico/hospitalario                                        | ⏳ Según demanda                   |
| 7   | BoxPort         | boxport.com         | Contenedores y logística portuaria                                       | ⏳ Según demanda                   |

### Cómo funciona el multi-vertical

Un solo repositorio de código. La tabla `vertical_config` en BD controla todo: logo, colores, categorías, subcategorías, atributos, filtros, idiomas, precios de suscripción, % de comisión. Lanzar un vertical nuevo = insertar filas en BD + nuevo deploy en Cloudflare Pages con variable `VERTICAL=horecaria` + apuntar dominio.

---

## 2. EL PRODUCTO (Tracciona como primer vertical)

### Qué hace

Marketplace B2B donde **dealers profesionales** (concesionarios, empresas de transporte, importadores) publican vehículos industriales usados y nuevos, y **compradores profesionales** los encuentran, contactan y compran.

### Los 3 roles

| Rol                                        | Qué hace                                                                                                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Comprador** (anónimo o registrado)       | Navega catálogo, filtra, ve fichas, favoritos, alertas de búsqueda, contacta por WhatsApp/teléfono/formulario, puja en subastas                                |
| **Dealer** (profesional, paga suscripción) | Publica vehículos, gestiona leads, ve estadísticas, portal público personalizable, herramientas (facturas, contratos, calculadora, widget embebible), subastas |
| **Admin**                                  | Modera contenido, gestiona dealers, configura vertical (branding, categorías, precios), dashboard de métricas, publicidad, infraestructura                     |

### Estructura de la web

```
PÁGINAS PÚBLICAS (SEO)
├── / (Home)
├── /cisternas, /cabezas-tractoras... (Landing pages SEO dinámicas por categoría/marca/acción)
├── /vehiculo/[slug] (Ficha de vehículo — página real con URL propia, NO modal)
├── /subastas (Listado y detalle de subastas)
├── /guia/[slug] (Contenido editorial evergreen)
├── /noticias/[slug] (Noticias temporales)
├── /precios (Planes de suscripción)
├── /datos (Índice de precios de mercado público)
├── /valoracion (Valorador de vehículo individual)
├── /[dealer-slug] (Portal público del dealer — tracciona.com/transportes-garcia)
├── /transparencia, /legal, /privacidad, /cookies, /condiciones

ZONA COMPRADOR (/perfil/*)
├── Dashboard, datos, favoritos, alertas, contactos, notificaciones, suscripción, seguridad

ZONA DEALER (/dashboard/*)
├── Panel, vehículos (CRUD + importar), leads, estadísticas, portal
├── Herramientas: factura, contrato, presupuesto, calculadora, widget, exportar, merchandising
├── Suscripción y facturas

ZONA ADMIN (/admin/*)
├── Dashboard métricas, configuración vertical completa (branding, categorías, precios, idiomas, emails, editorial)
├── Verificaciones, subastas, publicidad, captación, social, infraestructura, utilidades
```

---

## 3. MODELO DE NEGOCIO Y MONETIZACIÓN

### Fuentes de ingreso (16 documentadas, 5 activas)

| Canal                                         | Estado              | Cómo funciona                                                               |
| --------------------------------------------- | ------------------- | --------------------------------------------------------------------------- |
| **Suscripciones dealer** (Free/Basic/Premium) | ✅ Implementado     | Stripe Checkout, planes mensuales. Trial 14 días (pendiente S40).           |
| **Depósitos de subasta**                      | ✅ Implementado     | Stripe PaymentIntent, buyer premium al ganar.                               |
| **Publicidad directa**                        | ✅ Estructura lista | 10 posiciones de anuncio, segmentación geográfica, floor prices por slot.   |
| **Comisión por venta intermediada**           | ✅ Stripe Connect   | Destination charges, % configurable por vertical_config.                    |
| **Facturación/invoicing**                     | ✅ Implementado     | Crear facturas, exportar CSV.                                               |
| API de valoración                             | 📋 Sesión 40        | API con api_keys: Free (50/mes), Basic (€29), Premium (€99).                |
| Widget embebible                              | 📋 Sesión 40        | iframe con últimos 6 vehículos del dealer. Free con marca, premium sin.     |
| Comercialización de datos                     | 📋 Sesión 32        | Estilo Idealista: índices de precios, tendencias, informes por suscripción. |
| Google AdSense                                | 📋 Sesión 16b       | Slots en páginas con poco inventario.                                       |
| Comisión verificación DGT                     | 📋 Sesión 15        | Cobro puntual por informe DGT.                                              |
| Servicios post-venta (transporte)             | 📋 Sesión 16c       | Referral a transportistas, comisión por intermediación.                     |
| Lead gen cuantificado                         | 📋 Sesión 40        | Tracking contactos, valor €/lead para justificar suscripción al dealer.     |
| Trials + dunning                              | 📋 Sesión 40        | Trial 14d, reintentos de pago fallido, downgrade automático.                |

### Planes de suscripción dealer

| Plan    | Precio   | Incluye                                                          |
| ------- | -------- | ---------------------------------------------------------------- |
| Free    | €0       | 3 vehículos, ficha básica, sin estadísticas                      |
| Basic   | ~€49/mes | 20 vehículos, estadísticas, portal personalizable                |
| Premium | ~€99/mes | Ilimitado, herramientas avanzadas, prioridad en catálogo, widget |

(Precios configurables desde `vertical_config` y `/admin/config/pricing`, sincronizados con Stripe Products)

---

## 4. STACK TÉCNICO

| Capa              | Tecnología                                                                        |
| ----------------- | --------------------------------------------------------------------------------- |
| **Frontend**      | Nuxt 3 (Vue 3) + TypeScript strict + Tailwind (tokens.css) + Pinia + @nuxtjs/i18n |
| **Backend**       | Server routes Nuxt (Nitro) → Cloudflare Workers                                   |
| **Base de datos** | Supabase (PostgreSQL + RLS + Realtime + Auth)                                     |
| **Pagos**         | Stripe (Checkout, Connect, Webhooks, PaymentIntents)                              |
| **Imágenes**      | Cloudinary → Cloudflare Images (pipeline híbrido)                                 |
| **Email**         | Resend + templates en BD                                                          |
| **WhatsApp**      | Meta Cloud API + Claude Vision (IA para publicar)                                 |
| **Búsqueda**      | Supabase full-text + landing pages dinámicas                                      |
| **CI/CD**         | GitHub Actions → Cloudflare Pages (auto-deploy on push main)                      |
| **Seguridad CI**  | Semgrep CE + Snyk free + npm audit (pendiente S37)                                |
| **Testing**       | Vitest (unit + security) + Playwright (E2E)                                       |
| **PWA**           | Service worker con workbox, manifest, offline page                                |

### Convenciones de código (NO negociables)

1. **Mobile-first:** CSS base = 360px. Breakpoints `min-width`. Touch ≥ 44px.
2. **Páginas reales:** Vehículos y artículos = URL propia, NO modales.
3. **Extensible:** Categorías, filtros, idiomas en BD. Añadir = insertar fila.
4. **TypeScript estricto.** No `any`.
5. **i18n obligatorio.** `$t('key')` para UI, `localizedField()` para datos BD.
6. **RLS obligatorio** en toda tabla nueva.
7. **Auth obligatoria** en todo endpoint protegido (`serverSupabaseUser`).
8. **Nunca innerHTML sin DOMPurify.**
9. **Commits en español:** `feat:`, `fix:`, `refactor:`, `test:`, `docs:`

---

## 5. ESTADO ACTUAL DEL DESARROLLO

### Sesiones de trabajo (INSTRUCCIONES-MAESTRAS.md)

El proyecto se ejecuta por **sesiones numeradas** definidas en `docs/tracciona-docs/INSTRUCCIONES-MAESTRAS.md (alias de compatibilidad)` (5.719 líneas). Cada sesión tiene: qué leer, qué hacer, orden de ejecución, tests mínimos.

| Sesiones    | Contenido                                                                                             | Estado        |
| ----------- | ----------------------------------------------------------------------------------------------------- | ------------- |
| 1-13        | Migración base, catálogo, admin, editorial, i18n, deuda técnica                                       | ✅ Ejecutadas |
| 14-33       | Verificación DGT, subastas, publicidad, pagos, emails, WhatsApp, PWA, CRM, datos, infra               | ✅ Ejecutadas |
| 34, 34b, 35 | Auditoría seguridad: auth endpoints, RLS hardening, CSP, DOMPurify, índices BD                        | ✅ Ejecutadas |
| **36**      | Gaps residuales: 3 índices faltantes, cache CDN, auth endpoints restantes, docs estado real           | 📋 Pendiente  |
| **37**      | Seguridad CI: Semgrep CE + Snyk + tests automatizados + safeError + security.txt                      | 📋 Pendiente  |
| **38**      | Claridad: README.md (single source of truth) + CONTRIBUTING.md + convenciones                         | 📋 Pendiente  |
| **39**      | UX: accesibilidad Lighthouse, code-splitting <500KB, formularios, Core Web Vitals, PWA offline        | 📋 Pendiente  |
| **40**      | Monetización: trial 14d, dunning, métricas MRR/canal, API valoración, widget embebible, lead tracking | 📋 Pendiente  |
| **41**      | Arquitectura: server/services/, diagrama técnico, umbrales alertas, extensibilidad, rate limit docs   | 📋 Pendiente  |
| **42**      | Testing E2E: 8 user journeys con Playwright en CI                                                     | 📋 Pendiente  |

### Puntuación actual (auditoría interna)

| Dimensión     | Puntuación |
| ------------- | ---------- |
| Seguridad     | 82/100     |
| Modulabilidad | 78/100     |
| Escalabilidad | 80/100     |
| Monetización  | 72/100     |
| Arquitectura  | 81/100     |
| Claridad      | 70/100     |
| UX            | 74/100     |
| Proyección    | 79/100     |
| **Media**     | **77/100** |

Las sesiones 36-42 están diseñadas para llevar TODAS las dimensiones a ≥95/100.

### Archivos de seguridad ya en el repo

- `server/utils/verifyCronSecret.ts`, `verifyCsrf.ts`, `isAllowedUrl.ts`, `supabaseAdmin.ts`
- `server/utils/sanitizeLog.ts`, `logger.ts`, `fetchWithRetry.ts`, `batchProcessor.ts`
- `server/middleware/security-headers.ts`, `request-id.ts`, `rate-limit.ts`
- `app/composables/useSanitize.ts` (DOMPurify)
- `.github/workflows/ci.yml`

### Migraciones BD relevantes

- 00001-00054: esquema base + features
- 00055: `is_admin()` + RLS hardening
- 00056: 8 índices de rendimiento
- 00057: estandarización RLS en todas las tablas

---

## 6. HERRAMIENTAS DE DESARROLLO (Claude Code)

### MCP Servers: Context7 ✅, Sequential Thinking ✅, GitHub ✅, Playwright ⚠️, Supabase ⚠️

### Slash Commands: `/project:plan`, `/project:build`, `/project:review`, `/project:debug`, `/project:test`, `/project:session`, `/project:db`

### Skills: supabase-rls, nuxt-security, tracciona-conventions, mobile-first, nuxt-supabase

---

## 7. DOCUMENTACIÓN

| Documento                     | Ubicación                                    |
| ----------------------------- | -------------------------------------------- |
| **INSTRUCCIONES-MAESTRAS.md** | docs/tracciona-docs/ — 42 sesiones completas (alias de compatibilidad) |
| **CLAUDE.md**                 | raíz — stack, comandos, convenciones         |
| **contexto-global.md**        | docs/tracciona-docs/ — mapa del proyecto (alias de compatibilidad) |
| **BRIEFING-PROYECTO.md**      | docs/ — **ESTE ARCHIVO**                     |
| ARQUITECTURA-ESCALABILIDAD.md | docs/tracciona-docs/referencia/              |
| RECOMENDACIONES-100-PUNTOS.md | docs/                                        |
| VALORACION-PROYECTO-1-100.md  | docs/                                        |
| Anexos A-X                    | docs/tracciona-docs/anexos/ (aliases de compatibilidad histórica) |

---

## 8. CÓMO CONTINUAR

### Ejecutar sesiones: `/project:session 36` (orden: 36→37→38→39→40→41→42)

### Feature nueva: `/project:plan [descripción]`

### Revisar código: `/project:review`

### Desde cero en chat nuevo:

> "Estoy construyendo un grupo de marketplaces B2B verticales. El primero es Tracciona (vehículos industriales). Lee docs/BRIEFING-PROYECTO.md para entender el proyecto al 100%. Las sesiones 1-35 están ejecutadas. Las sesiones 36-42 están pendientes. Continúa donde lo dejamos."

---

## 9. VISIÓN A LARGO PLAZO

**Fase 1 (ahora):** Tracciona operativo y generando ingresos con dealers reales.
**Fase 2 (6-12 meses):** Segundo vertical (Horecaria). Comercialización de datos.
**Fase 3 (12-24 meses):** 3-4 verticales. API de valoración como producto. Equipo de 3-5 personas.
**Fase 4 (24+ meses):** 7 verticales. El "grupo Idealista" de B2B industrial.

El código ya está preparado para esto. Añadir un vertical nuevo = insertar filas en BD + deploy + dominio. Cero cambios de código.


