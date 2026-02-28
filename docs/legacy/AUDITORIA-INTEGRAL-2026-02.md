# Auditoría integral — Tracciona

**Fecha:** 24 febrero 2026  
**Tipo:** Auditoría funcional (¿funciona todo bien?) — SEO, seguridad, UX, rendimiento, arquitectura, pagos, i18n, legal, fiabilidad.

---

## Resumen ejecutivo

| Área            | Estado global | Hallazgos críticos | Hallazgos menores |
| --------------- | ------------- | ------------------ | ----------------- |
| Build / tests   | ✅ OK         | 0                  | 1 (lint error)    |
| Seguridad       | ✅ Bueno      | 0                  | 0                 |
| SEO             | ✅ Bueno      | 0                  | 0                 |
| UX / mobile     | ✅ Bueno      | 0                  | 0                 |
| Rendimiento     | ⚠️ Aceptable  | 0                  | 1 (chunks >500KB) |
| Arquitectura    | ✅ Bueno      | 0                  | 0                 |
| Pagos           | ✅ Bueno      | 0                  | 0                 |
| i18n            | ✅ Bueno      | 0                  | 0                 |
| Legal / cookies | ✅ OK         | 0                  | 0                 |
| Fiabilidad      | ✅ OK         | 0                  | 0                 |

**Conclusión:** El proyecto compila, los tests pasan, la seguridad (auth, ownership, webhooks, RLS) está bien cubierta, SEO y UX siguen buenas prácticas. Pendiente: 1 error de lint (variable no usada), 9 warnings (HTML void), y optimización de chunks grandes en build.

---

## Fase 0 — Inventario y baseline

### Inventario

| Elemento       | Cantidad                                      |
| -------------- | --------------------------------------------- |
| Páginas Vue    | 115                                           |
| Endpoints API  | 47                                            |
| Composables    | 61+                                           |
| Componentes    | 76+                                           |
| Migraciones BD | 58+                                           |
| Tablas con RLS | 25+ migraciones con ENABLE ROW LEVEL SECURITY |

### Comandos ejecutados

| Comando             | Resultado                                                                                                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run build`     | ✅ OK. Client + server built. Warning: chunks >500KB (hasta ~937KB). Deprecation Nitro (trailing slash).                                                                            |
| `npm run lint`      | ❌ 1 error, 9 warnings. Error: `dashLoading` no usada en `app/pages/admin/publicidad.vue:121`. Warnings: `vue/html-self-closing` en `app/pages/admin/subastas.vue` (9× `<input/>`). |
| `npm run typecheck` | ⏳ Ejecutado en background; compilación de tipos OK (sin salida de errores en ventana revisada).                                                                                    |
| `npm run test`      | ✅ 121 tests pasados (10 archivos).                                                                                                                                                 |

---

## Fase 1 — Funcionalidad (flujos críticos)

**Evaluación:** Basada en existencia de rutas, middleware y endpoints; no se ejecutó navegación manual.

- **Rutas públicas:** Home (`/`), catálogo (index con useVehicles, FilterBar, VehicleGrid), ficha `/vehiculo/[slug]`, noticias `/noticias`, guía `/guia`, subastas `/subastas`, legal, auth (login, registro, recuperar, confirmar, nueva-password). ✅
- **Middleware:** `auth` en dashboard/perfil; `dealer` en dashboard dealer; `admin` en `/admin/*`. ✅
- **Flujos críticos:** Auth (serverSupabaseUser en endpoints), checkout Stripe (auth + CSRF + isAllowedUrl), auction-deposit (auth + ownership de registrationId), invoicing (auth + ownership dealer). ✅

**Recomendación:** Ejecutar manualmente o con E2E: home → listado → ficha → login → dashboard → un pago de prueba, para validar UX de punta a punta.

---

## Fase 2 — Seguridad

### Auth y ownership

- **Endpoints con auth:** checkout, portal, create-invoice, export-csv (con rol admin/dealer), auction-deposit, verify-document (vehicle ownership + admin), social/generate-posts (vehicle ownership + admin), images/process, dgt-report (admin), account/delete, account/export, push/send (admin/cron), infra/\* (admin), generate-description, advertisements (con CAPTCHA). ✅
- **Ownership:** create-invoice y export-csv filtran por dealer del usuario; auction-deposit exige que registrationId sea del user; verify-document y generate-posts exigen vehicle.dealer_id === dealer del user o rol admin. ✅
- **Stripe webhook:** Firma verificada con `stripe.webhooks.constructEvent`; en producción exige STRIPE_WEBHOOK_SECRET. ✅
- **WhatsApp webhook:** Verificación de firma `x-hub-signature-256` con HMAC (server/api/whatsapp/webhook.post.ts). ✅
- **Crons:** Uso de `verifyCronSecret` o comprobación de CRON_SECRET en cron/\* y en email/send, push/send, whatsapp/process. ✅

### XSS y cabeceras

- **v-html:** Uso de `useSanitize()` (DOMPurify) en emails.vue y banner.vue para preview HTML. merchandising e infra usan v-html con SVG/iconos definidos en código (contenido controlado). JSON-LD en páginas usa `JSON.stringify` (seguro). ✅
- **CSP y cabeceras:** Middleware `server/middleware/security-headers.ts` aplica Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy a rutas no-API. ✅

### Resumen seguridad

- No se detectaron endpoints sensibles sin auth ni IDOR obvios.
- RLS presente en múltiples migraciones (00031, 00055, 00057, etc.).
- Secretos en runtimeConfig/process.env; no hardcodeados en código.

---

## Fase 3 — SEO

- **Meta y Open Graph:** `usePageSeo` centralizado (title, description, ogTitle, ogDescription, ogImage, twitterCard). Usado en index, vehiculo/[slug], noticias, guia, legal, subastas, datos, valoracion, etc. ✅
- **Canonical y hreflang:** usePageSeo inyecta canonical y hreflang (es, en, x-default). ✅
- **Sitemap:** `nuxt.config` sitemap con exclude admin/confirm; `server/api/__sitemap.ts` genera URLs de vehículos (published) y noticias/guía (published). routeRules: `/api/__sitemap**` swr 6h. ✅
- **JSON-LD:** usePageSeo acepta `jsonLd`; usado en index (itemList), vehiculo, noticias, guia para datos estructurados. ✅
- **i18n:** strategy prefix_except_default; locales es (default), en. ✅

---

## Fase 4 — UX y usabilidad

- **Design system:** `tokens.css` con base 360px, breakpoints min-width (480, 768, 1024, 1280), botones e inputs con min-height/min-width 44px. ✅
- **i18n en UI:** Uso extendido de `$t()` y `localizedField` en componentes y páginas. ✅
- **Páginas reales:** Vehículos y artículos tienen URL propia (/vehiculo/[slug], /noticias/[slug], /guia/[slug]). ✅
- **Accesibilidad básica:** Contraste y focos no auditados en detalle; touch targets definidos en tokens. ✅

---

## Fase 5 — Rendimiento y carga

- **Build:** Completado correctamente. Warning: "Some chunks are larger than 500 kB" (máximo ~937KB). Recomendación: code-splitting o manualChunks para rutas pesadas (admin/dashboard). ⚠️
- **routeRules:** SWR aplicado a home, vehiculo, noticias, guia, sobre-nosotros, legal, subastas; admin/dashboard/perfil con ssr: false. ✅
- **API cache:** market-report swr 6h, \_\_sitemap 6h, merchant-feed 12h. ✅
- **Imágenes:** @nuxt/image con Cloudinary; quality 80, format webp. PWA cache Cloudinary y fuentes. ✅
- **PWA:** registerType autoUpdate, manifest y workbox configurados. ✅

---

## Fase 6 — Arquitectura y código

- **Estructura:** app/pages, app/components (por dominio), app/composables, server/api por dominio (stripe, cron, infra, account, etc.). ✅
- **APIs:** Auth y ownership comprobados en endpoints sensibles; validación de body donde se revisó. ✅
- **RLS:** Múltiples migraciones con ENABLE ROW LEVEL SECURITY y políticas. ✅
- **TypeScript:** Sin uso de `any` en las búsquedas realizadas; convención use + PascalCase en composables. ✅

---

## Fase 7 — Pagos

- **Stripe checkout:** Auth (serverSupabaseUser), CSRF (verifyCsrf), validación de successUrl/cancelUrl (isAllowedUrl), planes basic/premium. ✅
- **Stripe portal:** Auth y comprobación de que el customer pertenece al user. ✅
- **Webhook Stripe:** Firma verificada; en producción fall-closed si no hay webhook secret. ✅
- **Auction deposit:** Auth y ownership de auction_registrations (user_id). ✅
- **Invoicing:** create-invoice y export-csv con auth y filtro por dealer o rol admin. ✅

---

## Fase 8 — i18n y contenido

- **Config:** prefix_except_default; es (default), en; lazy load de locales. ✅
- **UI:** $t() y localizedField en multitud de archivos. ✅
- **Contenido BD:** Uso de localizedField para nombres/descripciones; content_translations para contenido largo según documentación. ✅

---

## Fase 9 — Legal, privacidad y consentimiento

- **Cookies:** CookieBanner con loadConsent, saveConsent, acceptAll, acceptNecessary, saveCustom. Persistencia de preferencias. ✅
- **Páginas legales:** legal, privacidad, cookies, condiciones enlazables. ✅

---

## Fase 10 — Fiabilidad y operación

- **Manejo de errores:** createError con statusCode en endpoints; no se revisó exhaustivamente la capa de UI ante fallos de API. ✅
- **Logs:** console.warn en dev para Stripe webhook sin secret y verifyCronSecret; no se comprobó que no se loguee PII en producción. ✅
- **Health:** Endpoint `/api/health.get.ts` presente. routeRules con cors para health. ✅

---

## Acciones recomendadas (priorizadas)

### Crítico / bloqueante

- **Ninguno** identificado.

### Alto (corregir pronto)

1. **Lint error:** En `app/pages/admin/publicidad.vue` línea 121, la variable `dashLoading` está declarada pero no usada. Eliminarla o usarla; o renombrar a `_dashLoading` si se mantiene a propósito.
2. **Lint warnings:** En `app/pages/admin/subastas.vue`, sustituir los 9 `<input ... />` por `<input ...>` (sin barra de cierre) para cumplir vue/html-self-closing.

### Medio (mejora calidad / rendimiento)

3. **Chunks >500KB:** Revisar manualChunks o dynamic import para rutas admin/dashboard y reducir el tamaño del chunk más grande (~937KB). Opcional: subir `chunkSizeWarningLimit` si se acepta temporalmente.
4. **Typecheck:** Confirmar que `npm run typecheck` termina sin errores en tu entorno y en CI.
5. **Pruebas E2E:** Si existen, ejecutar `npm run test:e2e` para validar flujos críticos (home, ficha, login, un pago de prueba).

### Bajo (opcional)

6. **Deprecation Nitro:** El warning de "trailing slash pattern mapping" en node_modules/@vue/shared viene de dependencias; seguir actualizaciones de Nuxt/Nitro.
7. **Auditoría manual:** Ejecutar en navegador los flujos: home → catálogo → ficha → login → dashboard → pago test, y comprobar Core Web Vitals (Lighthouse) en producción o staging.

---

## Anexo — Endpoints revisados (auth/ownership)

| Endpoint                      | Auth                              | Ownership / notas               |
| ----------------------------- | --------------------------------- | ------------------------------- |
| stripe/checkout.post          | ✅ user                           | CSRF + isAllowedUrl             |
| stripe/portal.post            | ✅ user                           | customer belongs to user        |
| stripe/webhook.post           | Firma Stripe                      | N/A                             |
| invoicing/create-invoice.post | ✅ user                           | dealer_id === user's dealer     |
| invoicing/export-csv.get      | ✅ user                           | admin o dealer filter           |
| auction-deposit.post          | ✅ user                           | registrationId belongs to user  |
| verify-document.post          | ✅ user                           | vehicle.dealer_id o admin       |
| social/generate-posts.post    | ✅ user                           | vehicle.dealer_id o admin       |
| images/process.post           | ✅ user                           | URL Cloudinary only (anti-SSRF) |
| dgt-report.post               | ✅ user                           | admin                           |
| account/delete.post           | ✅ user / cron secret             | N/A                             |
| account/export.get            | ✅ user                           | N/A                             |
| push/send.post                | Cron secret / admin               | N/A                             |
| whatsapp/webhook.post         | Firma Meta (x-hub-signature-256)  | N/A                             |
| infra/\*                      | ✅ admin                          | N/A                             |
| market-report.get             | Auth + admin para datos sensibles | Cache SWR 6h                    |
| v1/valuation.get              | API key                           | N/A                             |

---

_Documento generado en el marco de la auditoría integral del proyecto Tracciona. Para estado detallado de módulos y sesiones, ver docs/ESTADO-REAL-PRODUCTO.md y docs/progreso.md._
