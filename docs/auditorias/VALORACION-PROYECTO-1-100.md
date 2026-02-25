# Valoración del proyecto Tracciona — 1 a 100 puntos

**Fecha:** 24 febrero 2026  
**Criterio:** Estado real del código, documentación y arquitectura conocida (auditoría integral + ESTADO-REAL-PRODUCTO + ARQUITECTURA-ESCALABILIDAD).

---

## Resumen por dimensión

| Dimensión                  | Puntuación | Nivel      |
| -------------------------- | ---------- | ---------- |
| **Seguridad**              | 82/100     | Alto       |
| **Modulabilidad**          | 78/100     | Alto       |
| **Escalabilidad**          | 80/100     | Alto       |
| **Monetización**           | 72/100     | Medio-Alto |
| **Arquitectura**           | 81/100     | Alto       |
| **Claridad**               | 70/100     | Medio-Alto |
| **Experiencia de usuario** | 74/100     | Medio-Alto |
| **Proyección**             | 79/100     | Alto       |
| **MEDIA PONDERADA**        | **77/100** | —          |

---

## 1. Seguridad — 82/100

**Qué se valora:** Auth, ownership, RLS, webhooks, secretos, XSS, cabeceras, crons.

**Fortalezas:**

- Auth en todos los endpoints sensibles (checkout, portal, invoicing, auction-deposit, verify-document, social/generate-posts, images/process, account, infra).
- Comprobación de ownership (dealer, registration, vehicle) antes de operaciones críticas.
- Webhooks: Stripe con `constructEvent`, WhatsApp con HMAC `x-hub-signature-256`.
- Crons protegidos con CRON_SECRET (fail-closed en producción).
- RLS en múltiples tablas; migraciones 00055, 00057 de endurecimiento.
- v-html solo con DOMPurify (emails, banner) o contenido controlado (SVG en código).
- CSP y cabeceras de seguridad (X-Frame-Options, Referrer-Policy, etc.) en middleware.
- Secretos en runtimeConfig; no hardcodeados.

**Debilidades / techo:**

- No hay auditoría de penetración externa ni tests de seguridad automatizados.
- Rate limiting no revisado en detalle en todas las rutas sensibles.
- Algunos mensajes de error podrían ser más genéricos para no filtrar información.

**Justificación de la nota:** Nivel muy sólido para un producto en desarrollo; falta el último 15–20% que suele venir de pentest y hardening exhaustivo.

---

## 2. Modulabilidad — 78/100

**Qué se valora:** Separación de responsabilidades, composables, componentes por dominio, APIs por dominio, reutilización.

**Fortalezas:**

- Composables numerosos (61+) con convención `use` + PascalCase; lógica reutilizable bien extraída (useVehicles, useFilters, useCatalogState, useVerticalConfig, useAuth, etc.).
- Componentes agrupados por dominio (catalog/, vehicle/, layout/, modals/, ads/, admin/).
- Server API organizada por dominio (stripe/, cron/, infra/, account/, invoicing/, whatsapp/, social/, images/).
- Middleware específicos (auth, admin, dealer) y definePageMeta por ruta.
- Design system centralizado (tokens.css); no estilos dispersos sin criterio.

**Debilidades / techo:**

- Duplicación parcial entre admin y dashboard (mencionada en sesión 36); consolidación pendiente.
- Algunos componentes muy grandes (p. ej. páginas admin con muchos bloques); podría fragmentarse más.
- Dependencias compartidas (Supabase, Stripe) bien usadas pero sin una capa de abstracción única para “servicios”.

**Justificación de la nota:** Buena modulabilidad; pierde puntos por duplicación admin/dashboard y por componentes/páginas que podrían dividirse más.

---

## 3. Escalabilidad — 80/100

**Qué se valora:** Diseño multi-vertical, BD, cache, CDN, costes proyectados, documentación de escalabilidad.

**Fortalezas:**

- Documento ARQUITECTURA-ESCALABILIDAD con objetivos claros (1→20 verticales, costes $34–600/mes).
- Modelo multi-vertical: vertical_config, categorías/subcategorías por vertical, mismo código para N verticales.
- Supabase con RLS; estrategia multi-cluster documentada.
- Cloudflare Pages (bandwidth ilimitado); cache en edge (routeRules SWR para páginas y APIs).
- Pipeline de imágenes híbrido (Cloudinary → CF Images) para controlar costes.
- Sitemap y APIs pesadas (market-report, merchant-feed, \_\_sitemap) con SWR 6–12 h.
- Migraciones y esquema preparados para crecimiento (índices, tablas placeholder).

**Debilidades / techo:**

- Chunks de build >500 KB (hasta ~937 KB); impacto en primera carga si no se hace code-splitting más agresivo.
- Rate limiting y WAF no auditados en detalle.
- Escalabilidad “operativa” (equipo, procesos) no valorada aquí (solo técnica).

**Justificación de la nota:** Arquitectura pensada para escalar; documentación y decisiones técnicas alineadas. La nota refleja que la ejecución (bundles, límites) aún puede afinarse.

---

## 4. Monetización — 72/100

**Qué se valora:** Canales de ingreso implementados, integración de pagos, facturación, roadmap de monetización.

**Fortalezas:**

- Stripe integrado: checkout (suscripciones Basic/Premium), portal, webhook; flujos operativos.
- Depósitos de subasta (PaymentIntent, ownership de inscripción).
- Módulo de facturación (invoicing create/export, Quaderno referenciado en docs).
- Ads/publicidad: estructura (anunciantes, slots, floor prices, dashboard).
- Modelo de negocio documentado (16 fuentes de ingreso en anexos); precios en vertical_config.

**Debilidades / techo:**

- Parte de la monetización está en roadmap (API de valoración, datos agregados, widget embebible, comisión por venta, etc.).
- Suscripciones y planes operativos; no revisado si hay trials, dunning, downgrades.
- Monetización “indirecta” (lead gen, branding) no cuantificada en producto.

**Justificación de la nota:** Base de monetización sólida (pagos, suscripciones, subastas, ads, facturación). Sube cuando más canales estén cerrados y medidos.

---

## 5. Arquitectura — 81/100

**Qué se valora:** Coherencia del stack, separación front/back, BD, APIs, convenciones, mantenibilidad.

**Fortalezas:**

- Stack claro: Nuxt 3, Supabase, Cloudflare Pages, Cloudinary, Stripe; cada pieza con rol definido.
- Frontend y servidor bien delimitados (app/ vs server/); API REST coherente.
- Base de datos con migraciones incrementales, RLS y tipos generados.
- Convenciones consistentes: TypeScript estricto, composables use+PascalCase, i18n centralizado.
- PWA, sitemap, i18n, design system integrados en la misma arquitectura.

**Debilidades / techo:**

- package.json aún con name "tank-iberica"; herencia nominal.
- Algún endpoint con lógica muy larga (p. ej. market-report); podría extraerse a servicios.
- No hay capa de “dominio” explícita (DDD) entre API y BD; aceptable para el tamaño actual.

**Justificación de la nota:** Arquitectura madura y coherente; pequeñas deudas y herencias que no restan mucho.

---

## 6. Claridad — 70/100

**Qué se valora:** Documentación, naming, estructura de carpetas, onboarding, estado real vs aspiracional.

**Fortalezas:**

- ESTADO-REAL-PRODUCTO generado del código; progreso y sesiones documentados.
- INSTRUCCIONES-MAESTRAS y anexos (A–X) para ejecución y dominio.
- ARQUITECTURA-ESCALABILIDAD e INVENTARIO-ENDPOINTS para referencia técnica.
- Código con nombres claros (composables, rutas, endpoints); estructura de carpetas comprensible.

**Debilidades / techo:**

- Varios “enfoques” documentales (tracciona-docs, plan-v3, hoja-de-ruta, guia-claude-code, legacy); ningún documento único de verdad.
- INSTRUCCIONES-MAESTRAS cubre solo parte del total; quien llega nuevo debe integrar varias fuentes.
- Progreso y ESTADO-REAL requieren actualización manual o automatizada para no desfasarse.

**Justificación de la nota:** Hay mucha información y es útil, pero está fragmentada; la claridad sube con un “single source of truth” y doc al día con el código.

---

## 7. Experiencia de usuario — 74/100

**Qué se valora:** Mobile-first, accesibilidad, i18n, navegación, formularios, rendimiento percibido, PWA.

**Fortalezas:**

- Design system mobile-first (360px base, breakpoints min-width, touch 44px en tokens).
- i18n con prefix_except_default; $t() y localizedField usados de forma amplia.
- Páginas con URL propia (vehículos, noticias, guía); no modales para contenido principal.
- PWA con manifest y workbox; cache de imágenes y fuentes.
- CookieBanner con consent (necessary, analytics, marketing); páginas legales enlazables.
- routeRules con SWR para reducir carga en rutas estáticas.

**Debilidades / techo:**

- No se ha hecho auditoría de accesibilidad (a11y) ni Lighthouse UX en todas las rutas.
- Algunos formularios o flujos no validados de punta a punta en esta valoración.
- Chunks grandes pueden afectar tiempo hasta interactivo en dispositivos lentos.

**Justificación de la nota:** Base de UX sólida (móvil, i18n, PWA, legal). Falta medición sistemática (Core Web Vitals, a11y) y refinado en flujos críticos.

---

## 8. Proyección — 79/100

**Qué se valora:** Visión a futuro, multi-vertical, roadmap, estado de módulos, extensibilidad.

**Fortalezas:**

- Visión clara: grupo de marketplaces B2B, 7 verticales, mismo código.
- 18/20 módulos operativos (ESTADO-REAL-PRODUCTO); 2 parciales (landing builder, OAuth social).
- Roadmap de 35 sesiones (pre y post lanzamiento); muchas ya ejecutadas.
- vertical_config y taxonomía en BD permiten lanzar nuevos verticales sin reescribir código.
- Documentación de negocio (Business Bible, plan operativo, anexos de monetización) alineada con producto.

**Debilidades / techo:**

- Algunas sesiones futuras (compliance, datos, resiliencia) aún por ejecutar.
- Proyección depende de ejecución comercial y operativa, no solo técnica.

**Justificación de la nota:** Proyección técnica y de producto muy buena; la nota refleja que parte del camino sigue por delante y que el éxito final depende también de negocio y operaciones.

---

## Media ponderada (opcional)

Si se ponderan todas las dimensiones por igual:

**Media simple:** (82 + 78 + 80 + 72 + 81 + 70 + 74 + 79) / 8 ≈ **77/100**.

Si se quiere priorizar seguridad y escalabilidad (por ejemplo 1,5×) y claridad/UX un poco menos (0,9×), la media ponderada podría situarse en **76–78/100**.

---

## Conclusión

El proyecto está **por encima de 75/100** en la mayoría de dimensiones y en la media global. Los puntos fuertes son **seguridad**, **arquitectura** y **escalabilidad**; los de mejora más claros son **claridad** (documentación fragmentada) y **monetización** (más canales por cerrar). La **proyección** y la **modulabilidad** refuerzan que el producto está pensado para crecer y mantenerse de forma ordenada.

---

_Documento de valoración interna. No sustituye una auditoría externa ni una valoración financiera._
