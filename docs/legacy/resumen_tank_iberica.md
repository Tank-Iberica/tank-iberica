> ⚠️ **[LEGACY]** Documento histórico — solo referencia. No modificar ni usar como fuente de verdad. Ver `docs/tracciona-docs/` para documentación activa.

# Resumen Exhaustivo — Auditoría y Análisis SEO de Tank Ibérica / Tracciona

> **Fuente:** Conversación de 2,165 páginas con Claude (extraída el 25/02/2026)
> **Proyecto:** Tank Ibérica → Tracciona.com (marketplace de vehículos industriales)
> **Empresa:** Tank Ibérica SL · CIF B24724684

---

## ÍNDICE

1. [Visión y Alcance del Proyecto](#1-visión-y-alcance-del-proyecto)
2. [SEO y Posicionamiento](#2-seo-y-posicionamiento)
3. [Arquitectura y Decisiones Técnicas](#3-arquitectura-y-decisiones-técnicas)
4. [Producto, UX y Diseño](#4-producto-ux-y-diseño)
5. [Estrategia y Ejecución](#5-estrategia-y-ejecución)
6. [Contenidos y Marketing](#6-contenidos-y-marketing)
7. [Equipo y Responsabilidades](#7-equipo-y-responsabilidades)
8. [Presupuesto y Recursos](#8-presupuesto-y-recursos)
9. [Decisiones y Cambios](#9-decisiones-y-cambios)
10. [Código y Snippets](#10-código-y-snippets)

---

## 1. VISIÓN Y ALCANCE DEL PROYECTO

### 1.1 Objetivo del proyecto y evolución

**Objetivo original:** Auditar la web existente de Tank Ibérica (compraventa de vehículos industriales — cisternas, semirremolques, cabezas tractoras) y mejorar su SEO.

**Evolución durante la conversación:** El proyecto creció desde una auditoría SEO a una reestructuración completa del negocio:

1. Auditoría SEO → se detectaron problemas estructurales graves (i18n, URLs, schema)
2. Corrección técnica → se plantearon landing pages dinámicas y estrategia de contenidos
3. Monetización → de "web escaparate" a marketplace con 16 fuentes de ingresos
4. Multi-vertical → de un solo producto a un ecosistema de 7-20 verticales
5. Rebrand → de Tank Ibérica (compraventa física) a Tracciona.com (marketplace digital)
6. Estructura corporativa → holding TradeBase + IberHaul (transporte) + Gesturban (municipal)

### 1.2 Alcance definido

**Entra:**

- Marketplace digital multi-vertical (Tracciona como vertical principal)
- Compraventa física mediante Tank Ibérica como "Founding Dealer"
- Transporte de vehículos industriales (IberHaul)
- Licitaciones municipales (Gesturban, solo registro de marca por ahora)
- 7 verticales confirmados, extensible a 20

**Queda fuera:**

- App nativa (se usa PWA en su lugar)
- Vertical de traspasos de negocios (Relevo.com — ficha radicalmente diferente)
- BoxPort (contenedores) — descartado por bajo diferencial
- Bug bounty formal (se usa security.txt + política de divulgación)

### 1.3 Público objetivo / mercado

- **Compradores:** Empresas de transporte, cooperativas, autónomos del sector industrial, ayuntamientos (vertical municipal)
- **Vendedores:** Dealers profesionales (concesionarios de vehículo industrial), particulares que venden flota, empresas en liquidación
- **Geográfico:** Península Ibérica como base, con expansión a Francia, Alemania, Italia, Benelux
- **Idiomas:** 7 al lanzamiento (ES, EN, FR, DE, IT, PT, NL)

### 1.4 Propuesta de valor / diferenciador

> "No vendemos anuncios. Vendemos confianza en transacciones de alto valor."

**Diferenciadores clave:**

- **IA genera fichas:** El vendedor envía fotos/fichas técnicas por WhatsApp → Claude Vision genera el anuncio bilingüe en minutos. Coste: ~0,05€/listing
- **5 niveles de verificación** (de gratis a certificación completa con inspección física)
- **Servicios integrados:** transporte (IberHaul), gestoría, seguros, financiación, informes DGT
- **TI Market Index:** informe mensual gratuito de precios del mercado ibérico (genera backlinks y autoridad)
- **Subastas online** para liquidaciones de flotas
- **Google Merchant Center:** ningún competidor en el nicho lo hace

### 1.5 Estructura corporativa

| Entidad             | Tipo                                       | Función                                                         |
| ------------------- | ------------------------------------------ | --------------------------------------------------------------- |
| **TradeBase SL**    | Holding (nombre tentativo)                 | Propietaria de tecnología, datos y marcas                       |
| **Tank Ibérica SL** | Existente (heredada)                       | Compraventa física de vehículos. "Founding Dealer" en Tracciona |
| **IberHaul**        | Marca (SL cuando el volumen lo justifique) | Transporte de vehículos industriales                            |
| **Gesturban**       | Solo marca registrada                      | Licitaciones municipales                                        |

> **CAMBIO:** Se propuso "Transporteo SL" inicialmente → Se decidió "IberHaul" por ser más potente e internacional.

> **CAMBIO:** Se propuso una SL por vertical → Se decidió 3 SLs máximo (coste innecesario).

### 1.6 Ecosistema de verticales

| #   | Vertical               | Dominio             | Estado                        | Cuándo        |
| --- | ---------------------- | ------------------- | ----------------------------- | ------------- |
| 1   | Vehículos industriales | tracciona.com       | Activo (sesiones 1-12)        | Ahora         |
| 2   | Hostelería             | horecaria.com       | Planeado                      | Mes 6-12      |
| 3   | Maquinaria agrícola    | campoindustrial.com | Planeado                      | Mes 12-18     |
| 4   | Vehículos municipales  | municipiante.com    | Planeado                      | Según demanda |
| 5   | Energía renovable      | resolar.com         | Planeado                      | Según demanda |
| 6   | Equipamiento médico    | clinistock.com      | Planeado                      | Según demanda |
| 7   | Contenedores           | boxport.com         | Descartado (bajo diferencial) | —             |

> **Nombres anteriores descartados:** MaquinariaYa, EquipoMédico, AlmacénPro → Corregidos a ReSolar, Clinistock, BoxPort (18 Feb 2026).

**Orden de lanzamiento:** Tracciona (meses 0-6) → segundo vertical CampoIndustrial o Municipiante según contactos (meses 6-12) → tercero con datos reales (meses 12-18). Los demás: registrar dominios (~70€ total) y apartar.

---

## 2. SEO Y POSICIONAMIENTO

### 2.1 Diagnóstico del estado actual

**Problemas críticos detectados:**

1. **i18n roto:** `strategy: 'no_prefix'` en `nuxt.config.ts` impide que Google indexe la versión inglesa por separado. Las versiones ES e EN comparten la misma URL → bomba SEO si se indexa así.
2. **Sin landing pages por categoría:** Todo el catálogo junto en `/` sin segmentación. Falta `/cisternas`, `/semirremolques`, `/tractoras`, etc.
3. **Schema Product en vez de Vehicle:** Las fichas usan schema genérico Product cuando existe Vehicle con más propiedades específicas.
4. **Alt text inexistente** en imágenes de Cloudinary.
5. **URLs de imágenes genéricas** en Cloudinary (IDs aleatorios en vez de nombres descriptivos).
6. **Security headers ausentes** (CSP, HSTS, X-Frame-Options).
7. **console.log en producción:** `console.log('Session active:', session.user?.email)` filtra emails.
8. **Teléfono inconsistente:** código tiene `+34645779594`, i18n tiene `+34911234567` (placeholder).

### 2.2 Palabras clave objetivo

**Gap de mercado identificado:** "alquiler" — Mascus y Europa-Camiones están centrados en venta; el segmento alquiler está menos trabajado y es una oportunidad real de posicionamiento.

**Keywords principales:**

- cisterna de segunda mano
- semirremolque [tipo] venta/alquiler
- cabeza tractora segunda mano
- cisterna alimentaria / combustible / ADR
- alquiler cisterna industrial
- vehículo industrial segunda mano España

> Se generó una tabla con volumen estimado y dificultad, pero el análisis no incluía datos de herramientas externas (Semrush/Ahrefs) — son estimaciones de Claude.

### 2.3 Estrategia de contenidos

**39 medidas SEO compiladas.** Las 5 críticas sin las cuales el resto no sirve:

1. Schema Vehicle en fichas (reemplaza/extiende Product)
2. Cambiar i18n a `prefix_except_default`
3. Landing pages por categoría con URLs limpias
4. Alt text descriptivo en todas las imágenes
5. Nombres descriptivos en URLs de imágenes Cloudinary

**Landing pages dinámicas:**

- Una sola página dinámica que decide qué mostrar según umbral de vehículos disponibles
- Crear `/cisternas` cuando haya ≥3 cisternas totales
- Anti-canibalización: si dos páginas tienen >70% de solapamiento, eliminar la más específica y redirigir
- URLs planas: `/cisternas-alimentarias` (keywords juntas) mejor que `/cisternas/alimentarias`
- Tabla SQL `active_landings` con `schema_data JSONB`, meta titles, intro text auto-generado
- Umbrales adaptativos: 3-10 vehículos → 40% overlap, 50+ → 70%

**Cadencia de publicación:**

- Web: Martes 09:00 CET (guía evergreen) + Jueves 09:00 CET (noticia/normativa)
- LinkedIn: Lu-Vi con posts distintos por día (10:00 CET)
- `/guia/` para contenido evergreen, `/noticias/` solo para contenido con valor SEO a 3+ meses
- Noticias temporales de eventos → LinkedIn/WhatsApp, NO a `/noticias/`
- Objetivo: 50-100 artículos para tráfico informativo significativo

### 2.4 SEO técnico

**Velocidad e indexación:**

- IndexNow via Cloudflare para Bing/Yandex — indexación instantánea al publicar/actualizar vehículo
- Google Merchant Center — nadie en el nicho lo hace. Las fichas con schema Product + precio + disponibilidad califican para Shopping gratuito
- Endpoint `merchant-feed.get.ts` existente con CORS
- Cache CDN: Home 10min SWR, fichas 5min, noticias 30min, guías 1h, merchant-feed 12h, sitemap 6h, market-report 6h

**Estructura de URLs:**

- Flat (sin anidamiento): `tracciona.com/cisternas-alimentarias-indox`
- Routing catch-all `[...slug].vue`: consulta `active_landings` → `dealers` → 404
- i18n: `prefix_except_default` (ES sin prefijo, `/en/`, `/fr/`, etc.)

**Core Web Vitals:**

- Problema detectado: chunks de 937KB bajan la nota
- Sesión 39 pendiente: Lighthouse + code-splitting + manualChunks en Vite (chunks <500KB)

### 2.5 SEO on-page

- Titles y metas: generados desde tabla `active_landings` con `meta_title_es/en`
- Intro text auto-generado: "23 cisternas disponibles, desde 15.000€, marcas: Indox, Parcisa, Guillén"
- Schema Vehicle en fichas
- hreflang para 7 idiomas (sesión 35)
- Alt text descriptivo en imágenes

### 2.6 SEO off-page

- **TI Market Index:** informe mensual gratuito como generador de backlinks y autoridad
- **Founding Dealers:** 3-5 dealers conocidos como generadores de contenido indexable ("Un dealer con 30 vehículos = más contenido indexable que 3 meses de SEO")

### 2.7 SEO local

- `useUserLocation.ts` existente: cadena de detección localStorage → navigator.geolocation (Nominatim) → Cloudflare `cf-ipcountry` header → null
- Mapping de 60+ ciudades españolas a provincia
- Publicidad geo-segmentada por país, comunidad autónoma y provincia

> **Geo meta tags:** Google los ignora. Impacto SEO: cero. Decisión: NO implementar.

### 2.8 Competidores analizados

| Competidor        | Páginas  | Antigüedad | Notas                                                   |
| ----------------- | -------- | ---------- | ------------------------------------------------------- |
| Mascus            | 50,000+  | 20+ años   | Autoridad alta, mercado global                          |
| Europa-Camiones   | 100,000+ | —          | Líder en España                                         |
| Autoline          | —        | —          | Internacional                                           |
| BAS World         | —        | —          | Internacional                                           |
| Machineseeker     | —        | —          | Alemania                                                |
| Portrailer        | —        | —          | Semirremolques                                          |
| Javier Esteban SL | —        | —          | Burgos, local                                           |
| Ritchie Bros      | —        | —          | Subastas, construcción pesada (no compite en cisternas) |
| Euro Auctions     | —        | —          | Subastas, construcción pesada                           |

**Benchmark de filtros:** Mascus/Europa-Camiones tienen 30-40 filtros visibles → ralentiza decisión. Tracciona: 5-6 filtros clave + avanzados en desplegable.

### 2.9 Herramientas mencionadas

- Google Search Console (enviar URLs para indexación rápida)
- Google Merchant Center (Shopping gratuito)
- IndexNow via Cloudflare (Bing/Yandex)
- Sentry (monitorización errores)
- Lighthouse (accesibilidad y rendimiento — sesión 39 pendiente)

> Semrush, Ahrefs: NO mencionados como herramientas en uso. Las estimaciones de volumen/dificultad de keywords son de Claude, no de herramientas externas.

### 2.10 Métricas y KPIs

- No se definieron KPIs SEO formales con números objetivo
- Valoración actual del proyecto: **77/100** media (UX 74, Monetización 72, Seguridad 82, Escalabilidad 80)
- Filosofía: "Un 77/100 con el proyecto en producción vale infinitamente más que un 95/100 que nunca se lanza"

**Dominios — CAMBIO registrado:**

- PLANTEADO: registrar tracciona.fr, .de, .it, .pt
- FINAL: solo tracciona.com + `prefix_except_default` + hreflang
- RAZÓN: B2B industrial usa .com (Mascus, MachineryZone, Alibaba). .com da más autoridad que .fr

---

## 3. ARQUITECTURA Y DECISIONES TÉCNICAS

### 3.1 Stack tecnológico

| Capa           | Tecnología                                                                       |
| -------------- | -------------------------------------------------------------------------------- |
| Frontend       | Nuxt 3 v4.3.0 (Vue 3), TypeScript estricto, Pinia                                |
| Estilos        | Tailwind CSS (tokens.css con design system)                                      |
| Backend        | Supabase (PostgreSQL + Auth PKCE + RLS + Realtime + Edge Functions)              |
| Imágenes       | Pipeline híbrido: Cloudinary procesa → CF Images sirve a escala                  |
| Deploy         | Cloudflare Pages (auto-deploy on push a main, CDN, WAF)                          |
| Auth           | serverSupabaseUser + serverSupabaseServiceRole                                   |
| i18n           | @nuxtjs/i18n (prefix_except_default, 7 idiomas)                                  |
| Emails         | Resend                                                                           |
| Pagos          | Stripe Connect (split payments)                                                  |
| WhatsApp       | Meta Cloud API                                                                   |
| Push           | Web Push (tabla push_subscriptions)                                              |
| Monitorización | Sentry                                                                           |
| IA             | Anthropic API (Claude Haiku para fichas, Claude Vision para WhatsApp → vehículo) |
| Sitemap        | @nuxtjs/sitemap                                                                  |
| PWA            | @vite-pwa/nuxt                                                                   |

**Supabase Project ID:** `gmnrfuzekbwyzkgsaftv` (región eu-west-1)

### 3.2 Arquitectura del sitio web

```
app/
  pages/              → Rutas (index, vehiculo/[slug], noticias/[slug], admin/*, dashboard/*)
  components/         → SFCs por dominio (catalog/, vehicle/, modals/, layout/, ui/)
  composables/        → Lógica reutilizable (useVehicles, useFilters, useSanitize, etc.)
  layouts/            → Layouts (default, admin)
  middleware/         → auth.ts, admin.ts, request-id.ts, security-headers.ts
  assets/css/         → tokens.css (design system), global.css
i18n/                 → Traducciones (es.json, en.json, fr.json, ...)
server/
  api/                → Endpoints (stripe/, cron/, social/, invoicing/, whatsapp/, etc.)
  utils/              → Utilidades servidor (isAllowedUrl, verifyCsrf, sanitizeLog, batchProcessor, fetchWithRetry, safeError, verifyCronSecret, logger)
  middleware/         → request-id.ts, security-headers.ts
supabase/migrations/  → 57 migraciones SQL (00001-00057)
types/                → supabase.ts (auto-generated), index.d.ts
docs/tracciona-docs/  → INSTRUCCIONES-MAESTRAS.md, contexto-global.md, anexos
.claude/
  commands/           → 12 slash commands (plan.md, build.md, session.md, db.md, ...)
  skills/             → 7 skills (supabase-rls, nuxt-security, ...)
```

**Routing catch-all:** `[...slug].vue` consulta `active_landings` → `dealers` → 404

**Dashboard vendedor:**

```
/dashboard/leads/             → Leads recibidos
/dashboard/estadisticas       → Estadísticas del dealer
/dashboard/portal             → Portal personalizable
/dashboard/herramientas/
  factura, contrato, presupuesto, calculadora,
  exportar-anuncio, widget, exportar, merchandising
/dashboard/suscripcion        → Gestión suscripción
/dashboard/facturas           → Historial facturas
```

**Panel admin:**

```
/admin/                       → Dashboard métricas + KPIs
/admin/config/branding        → Logo, colores, tipografía
/admin/config/navigation      → Menús
/admin/config/homepage        → Configuración home
/admin/config/catalog         → Categorías, filtros CRUD
/admin/config/languages       → Idiomas activos
/admin/config/pricing         → Precios suscripción
/admin/config/integrations    → Integraciones externas
/admin/infraestructura        → Estado sistema, alertas, migración clusters
```

### 3.3 Escalabilidad y modularidad

**Arquitectura multi-vertical:**

- Un mismo deploy con variable de entorno `VERTICAL` (Opción A — recomendada para empezar)
- Cada vertical configurable desde `vertical_config` en BD
- Opción B: repositorio clonado cuando los verticales divergan

**Sistema de "peso" por vertical:**

| Vertical        | Peso          |
| --------------- | ------------- |
| Tracciona       | 1.0 (pesada)  |
| Horecaria       | 1.0 (pesada)  |
| CampoIndustrial | 1.0 (pesada)  |
| Municipiante    | 0.15 (ligera) |
| ReSolar         | 0.4 (media)   |
| Clinistock      | 0.15 (ligera) |
| BoxPort         | 0.15 (ligera) |

- 1 Supabase Pro aguanta ~4 "Horecarias equivalentes"
- 20 verticales = 5-6 clusters = $200-300/mes total infraestructura

**Escalabilidad por componente:**

| Componente | Plan          | Límite                        | Siguiente tier    | Coste           |
| ---------- | ------------- | ----------------------------- | ----------------- | --------------- |
| Supabase   | Pro ($25)     | ~4 verticales pesadas         | Nuevo cluster Pro | +$25/mes        |
| CF Pages   | Free          | Sin límite (BW ilimitado)     | —                 | —               |
| CF Workers | Free          | 100K req/día                  | Paid ($5/mes)     | $5/mes          |
| Cloudinary | Free          | 25K trans/mes (625 vehículos) | Plus ($89/mes)    | $89/mes         |
| CF Images  | Pay-as-you-go | Sin límite                    | —                 | $5/100K imgs    |
| Resend     | Free          | 100 emails/día                | Pro ($20/mes)     | $20/mes         |
| Sentry     | Free          | 5K eventos/mes                | Team ($26/mes)    | $26/mes         |
| Stripe     | Pay-as-you-go | Sin límite                    | —                 | 1.4% + 0.25€/tx |

### 3.4 Integraciones con terceros

- **Stripe Connect:** split payments (vendedor 85% / plataforma 15%), checkout sessions, customer portal, webhooks con firma
- **Meta/WhatsApp Cloud API:** webhook con verificación HMAC X-Hub-Signature-256, retry queue
- **Anthropic API:** Claude Haiku para descripciones, Claude Sonnet 4.5 para WhatsApp → Vehicle (vision)
- **DGT:** API o scraping manual para informes de vehículos (burocracia compleja)
- **Cloudinary:** transformaciones de imagen (thumb, card, gallery, OG) con `g_auto,e_improve,q_auto,f_webp`
- **Google Merchant Center:** feed XML público
- **IndexNow:** indexación instantánea Bing/Yandex

### 3.5 Rendimiento web (Core Web Vitals)

- **Problema:** chunks de 937KB
- **Cache CDN (4 capas):**
  1. CDN Cloudflare (assets estáticos, HTML con SWR)
  2. In-memory Nuxt (useState, composables)
  3. Query cache Supabase (latencia <50ms)
  4. Vistas materializadas (market_data, price_history — refresh diario 03:00)
- **routeRules configurados:**
  - `/api/market-report`: SWR 6h
  - `/api/merchant-feed*`: SWR 12h
  - `/api/__sitemap*`: SWR 6h
- **Sesión 39 (pendiente):** Lighthouse, code-splitting, manualChunks, Core Web Vitals plugin

### 3.6 Seguridad

**9 capas documentadas (Anexo N).** Resumen de medidas implementadas:

- **Auth:** `serverSupabaseUser(event)` obligatorio en todos los endpoints protegidos
- **RLS:** Row Level Security en todas las tablas, función `is_admin()` centralizada
- **CSRF:** `verifyCsrf()` utility
- **CORS:** solo en merchant-feed, sitemap y health (NO global)
- **CSP + headers:** `security-headers.ts` middleware
- **Stripe webhooks:** fail-closed en producción (requiere `STRIPE_WEBHOOK_SECRET`)
- **WhatsApp webhooks:** HMAC con `WHATSAPP_APP_SECRET`
- **Crons:** `verifyCronSecret()` en todos los endpoints cron
- **Sanitización:** DOMPurify (isomorphic-dompurify) via `useSanitize.ts`
- **PII en logs:** `sanitizeForLog()` elimina phone, email, text_content, ip
- **Rate limiting:** CF WAF (zero code) — `Map()` en memoria descartado (no persiste entre Workers)
- **devtools:** `enabled: NODE_ENV !== 'production'`
- **safeError():** errores seguros para producción (sin stack traces)

**Migraciones de seguridad:**

- `00055_rls_hardening.sql`: función `is_admin()`, políticas RLS corregidas
- `00056_performance_indexes.sql`: 8 índices estratégicos
- `00057_rls_standardization.sql`: estandarización final

**Herramientas de seguridad CI (sesión 37, pendiente):**

- Semgrep CE (gratis sin límites)
- Snyk free (400 tests/mes)
- Claude Code (ya disponible)
- `security.txt` + política de divulgación responsable

> **CodeQL** descartado: gratis solo en repos públicos; Semgrep CE cubre lo mismo para equipo pequeño.

### 3.7 Migraciones y BD

**57 migraciones SQL** (00001-00057). Lista completa:

```
00001_create_users → 00010_fix_rls_jwt_based
00011_add_online_offline → 00020_fix_subcategories_rls
00021_chat_messages → 00030_subscriptions_users_admin
00031_tracciona_migration → 00040_transport_postventa_freshness
00041_dealer_leads → 00050_dealer_crm_session28
00051_dealer_tools → 00057_rls_standardization
```

**17 tablas principales con RLS:** vehicles, vehicle_images, subcategories, filter_definitions, users, favorites, advertisements, demands, subscriptions, news, comments, chat_messages, config, balance, intermediation, history_log, viewed_vehicles.

**6 tipos de filtro:** caja, desplegable, desplegable_tick, tick, slider, calc.

**Decisión BD crítica — CAMBIO:**

- ORIGINAL: columnas `name_es`, `name_en`, `description_es`, `description_en`
- FINAL: JSONB para campos cortos + tabla `content_translations` para campos largos
- RAZÓN: Horecaria con millones de productos × 8 idiomas = 32GB con el sistema original

**Campo `source` en traducciones:**

```
'original' | 'auto_libre' | 'auto_deepl' | 'auto_gpt4o_mini' | 'auto_claude' | 'reviewed'
```

**Índices estratégicos (migración 00056):**

```sql
idx_vehicles_location_province    -- Filtro por provincia
idx_vehicles_location_region      -- Filtro por comunidad autónoma
idx_vehicles_location_country     -- Filtro por país
idx_vehicles_brand_trgm           -- Búsqueda fuzzy por marca (gin_trgm_ops)
idx_vehicles_status_created       -- Listados activos ordenados por fecha
idx_vehicles_visible_from         -- Sistema Pro 24h
idx_invoices_dealer_created       -- Facturas por dealer
idx_payments_checkout_session     -- Idempotencia pagos
```

**Índices faltantes (auditoría sesión 36, pendiente):**

- `vehicles(category_id)`
- `auction_bids(auction_id)`
- `articles(status, published_at)`

### 3.8 Deuda técnica reconocida

- Chunks de 937KB (sesión 39 pendiente)
- Columnas `_es`/`_en` residuales sin dropear (i18n migración parcial)
- TODOs en código: "Implementar lógica de coincidencias" en admin/index.vue
- Duplicación admin/dashboard (sesión 36-G pendiente)
- `contexto-global.md` se encontró vacío y tuvo que reescribirse el 24/02/2026
- market-report: no decidido si necesita auth (sesión 36 pendiente)
- Admin routes sin lazy-load (sesión 36-H pendiente)

---

## 4. PRODUCTO, UX Y DISEÑO

### 4.1 Funcionalidades definidas

**Catálogo y búsqueda:**

- Catálogo dinámico con filtros contextuales por categoría/subcategoría
- 6 tipos de filtro (caja, desplegable, desplegable_tick, tick, slider, calc)
- Landing pages dinámicas por combinación categoría/tipo/marca/ubicación
- Búsqueda fuzzy por marca (trigram index)

**Verificación de vehículos (5 niveles):**

| Nivel | Badge        | Implica                | Documentos                                         | Coste     |
| ----- | ------------ | ---------------------- | -------------------------------------------------- | --------- |
| ✓     | Verificado   | Identidad del vehículo | Ficha técnica + foto km + fotos estado             | Gratis    |
| ✓✓    | Verificado+  | Historial oficial      | Informe DGT                                        | 15-20€    |
| ✓✓✓   | Verificado++ | Seguridad específica   | Prueba estanqueidad (cisternas) / Cert. fabricante | 50-150€   |
| ★     | Auditado     | Inspección física      | Inspección certificada por TI                      | 300-500€  |
| Badge | Certificado  | Garantía TI            | Certificación completa                             | A definir |

> **CAMBIO:** Las facturas de mantenimiento se propusieron para ✓✓✓ → Se descartaron del nivel (documentación opcional sin nivel) porque no son verificables ni estandarizadas.

**Subastas online:**

- Motor: Supabase Realtime + tablas `auctions` y `bids`
- Buyer's premium: 5-10%
- Anti-sniping: extensión automática si puja en últimos N minutos
- Depósitos vía Stripe Connect (5-10% o 500-1.000€)
- Lanzar cuando catálogo ≥50-100 vehículos
- Una subasta puede generar 4.050€ (premium + transporte + trámites)

**WhatsApp → Vehicle:**

- Dealer envía fotos por WhatsApp → Claude Vision (Sonnet 4.5) → draft vehicle → notifica dealer
- Retry automático con campos `retry_count`, `last_error` en `whatsapp_submissions`

**Herramientas del dealer:**

- Generador de facturas con IVA automático (21% o exento intracomunitario)
- Generador de contratos (compraventa y arrendamiento)
- Generador de presupuestos
- Calculadora de financiación
- Exportación de anuncios
- Widget embebible
- Merchandising

**Sistema Pro 24h:**

- Campo `visible_from = NOW() + 24h` al publicar gratuito
- Usuarios Pro ven sin filtro temporal
- Banner FOMO: "5 vehículos nuevos publicados hoy — los suscriptores Pro ya los están viendo"
- Pase 72h por 9,99€ (compra por impulso)

**Panel de infraestructura admin:**

- 4 pestañas: Estado, Alertas, Historial, Migración
- Thresholds: 70% warning, 85% critical, 95% emergency
- Wizard migración clusters (5 pasos UI)

### 4.2 Priorización (MVP vs futuro)

**3 capas de implementación:**

- Capa 1: hacer ahora (estructural, difícil de cambiar después)
- Capa 2: placeholder tables solo con schema SQL, sin frontend
- Capa 3: módulos completos en meses 3-18

### 4.3 Decisiones de UX/UI

**Principios non-negotiables:**

- Mobile-first: CSS base = 360px, breakpoints 480/768/1024/1280px
- Touch targets mínimos 44px
- Páginas reales con URL propia (NO modales)
- Extensible via BD (añadir categoría = insertar fila, no tocar código)

**Design tokens:**

- Primary: `#23424A` (petrol blue)
- Accent: `#7FD1C8`
- Gold: `#D4A017`
- Font: Inter
- Spacing: escala 4px (4, 8, 12, 16, 24, 32, 48, 64)

**Filtros móvil:** Precio y año como botones chip ("Precio: 10k-40k ▾") que abren bottom sheet, en vez de sliders inline.

**Decisión sobre filtros — SIMPLIFICAR:** 5-6 filtros clave visibles + avanzados en desplegable (vs 30-40 de Mascus).

**Portal dealer personalizable:** logo, colores de acento, bio, contacto (visible/click-to-reveal/solo formulario), CTA personalizado, badges, vehículos pineados.

### 4.4 CRO (Optimización de conversión)

- Programa Founding Dealers: 10 primeros dealers por vertical, gratis para siempre, badge exclusivo
- AdSlot.vue: 10 posiciones publicitarias contextuales
- Publicidad geo-segmentada por país/CCAA/provincia
- Google Merchant Center para Shopping gratuito

---

## 5. ESTRATEGIA Y EJECUCIÓN

### 5.1 Fases del proyecto

**42 sesiones de trabajo definidas:**

- Sesiones 1-12: pre-lanzamiento (estructura, catálogo, auth, i18n, admin)
- Sesiones 13-35: post-lanzamiento (features, seguridad, hardening)
- Sesiones 36-42: pendientes (auditoría, CI, UX, monetización, testing)

**Estado al 24/02/2026:**

- Sesiones 1-35: ejecutadas (código real en el repo)
- Sesiones 36-42: especificadas, pendientes de ejecución

> **CAMBIO CRÍTICO:** Inicialmente se afirmó que sesiones 34, 34b y 35 no estaban ejecutadas → Se corrigió tras verificar el código real: SÍ fueron ejecutadas por Claude Code.

### 5.2 Timeline

| Período     | Objetivo                                     | Ingresos estimados                                         |
| ----------- | -------------------------------------------- | ---------------------------------------------------------- |
| Meses 0-6   | Lanzar Tracciona, conseguir Founding Dealers | 0€                                                         |
| Meses 6-12  | Primer ingreso, segundo vertical             | 200-500€/mes                                               |
| Meses 12-18 | Escalar servicios, tercer vertical           | 1.000-2.000€/mes                                           |
| Meses 18-24 | Consolidar, 3.000€/mes objetivo              | 3.000€/mes base, 8.000-15.000€/mes con servicios completos |

### 5.3 Sesiones pendientes (36-42)

| Sesión | Contenido                                                  | Origen                         |
| ------ | ---------------------------------------------------------- | ------------------------------ |
| 36     | Auditoría cruzada: gaps residuales + docs/realidad         | 4ª auditoría externa           |
| 37     | Seguridad CI: Semgrep + Snyk + safeError + security.txt    | Recomendaciones 100pts §1      |
| 38     | Docs: single source of truth + CONTRIBUTING.md             | Recomendaciones 100pts §6      |
| 39     | UX: Lighthouse, code-splitting (937KB), Core Web Vitals    | Recomendaciones 100pts §7+§3a  |
| 40     | Monetización: trials, dunning, MRR, API valoración, widget | Recomendaciones 100pts §4      |
| 41     | Arquitectura: capa servicios, diagramas, umbrales          | Recomendaciones 100pts §5+§3   |
| 42     | Testing E2E: 8 user journeys con Playwright                | Recomendaciones 100pts §7c+§8a |

**Plan de ejecución paralela con worktrees:**

```
Ronda 1 (secuencial): sesión 36 sola
Ronda 2 (paralela):   sesión 37 + sesión 38
Ronda 3 (paralela):   sesión 39 + sesión 40
Ronda 4 (paralela):   sesión 41 + sesión 42
```

### 5.4 Riesgos identificados

- **Desintermediación:** Comprador y vendedor se ponen en contacto fuera de la plataforma → se pierde la comisión. Mitigación: servicios de valor añadido (escrow, transporte, documentación)
- **Dependencia de IA:** Claude Code como "ingeniero" → el proyecto depende de la suscripción
- **DGT API:** Dificultad burocrática alta para obtener acceso
- **Chunks 937KB:** Impacto en Core Web Vitals y experiencia móvil
- **contexto-global.md se encontró vacío** — riesgo de pérdida de documentación

### 5.5 Auditorías realizadas

| #                 | Tipo                          | Resultado                 | Remediado en          |
| ----------------- | ----------------------------- | ------------------------- | --------------------- |
| 1ª                | Técnica (endpoints, auth)     | Gaps en auth y RLS        | Sesiones 34, 34b      |
| 2ª                | Técnica (RLS, índices, cache) | Gaps en BD y performance  | Sesión 35             |
| 3ª                | Técnica (XSS, CSP, deps)      | DOMPurify, CSP, headers   | Sesiones 34b, 35      |
| 4ª                | Estratégica/organizativa      | Desalineación docs/código | Sesión 36 (pendiente) |
| Valoración 100pts | 8 dimensiones (77/100 media)  | Recomendaciones           | Sesiones 37-42        |

### 5.6 Bloqueantes antes de producción

1. Verificar que migraciones 00055-00057 se aplicaron a Supabase real
2. `npm run build` sin errores
3. 5 flujos E2E manuales
4. Aplicar migraciones de sesión 36 (3 índices faltantes)

---

## 6. CONTENIDOS Y MARKETING

### 6.1 Estrategia de contenidos

**Tipos de artículo:**

1. **Universales:** se generan en español, se traducen a todos (comparativas, guías técnicas)
2. **Localizados:** artículos distintos por país (legislación diferente)
3. **Regionales:** solo interesan a ciertos mercados

**Campo `target_markets TEXT[]`:** `{all}`, `{es}`, `{fr,be}`, `{de,at,ch}`

**IA genera fichas de vehículos:**

- Claude Haiku genera descripción profesional (~150 palabras, SEO, sin emojis)
- Coste: ~0,05€/listing
- Argumento comercial: "Mándame las fichas técnicas por WhatsApp y mañana tienes tus 30 vehículos publicados con anuncios profesionales bilingües"

**TI Market Index:**

- Informe mensual gratuito de precios del mercado ibérico
- Genera backlinks, autoridad SEO
- Modelo: como Idealista con su índice de precios
- Versión de pago: 50-100€ individual, 500-1.000€/trimestre para financieras/aseguradoras
- Anonimización: mínimo 5 vehículos por combinación (RGPD)

### 6.2 Sistema de traducción

| Tarea                 | Motor                               | Coste           |
| --------------------- | ----------------------------------- | --------------- |
| Títulos               | Auto-generados (marca+modelo+specs) | 0€              |
| Términos UI/filtros   | Claude Max, una vez                 | 0€              |
| Artículos SEO         | Claude Sonnet vía Claude Max        | 0€              |
| Fichas técnicas       | GPT-4o mini Batch API               | ~0,001€/ficha   |
| Artículos editoriales | Claude Haiku o GPT-4o mini          | ~0,04€/artículo |

> **CAMBIO:** DeepL propuesto inicialmente → GPT-4o mini Batch API decidido (30× más barato: 790€ vs 24.000€ por millón de fichas a 7 idiomas).

**Flujo asíncrono:** producto visible inmediatamente en idioma original → job en background traduce → 30-60 segundos → fallback: idioma solicitado → en → es → original.

### 6.3 Redes sociales

- **LinkedIn:** publicaciones diarias Lu-Vi 10:00 CET (foco B2B)
- **Auto-publicación:** endpoint `social/generate-posts.post.ts` genera posts para LinkedIn, Facebook, Instagram, X
- **Tabla `social_posts`:** vehicle_id, platform, content, image_url, status, impressions, clicks

### 6.4 Email marketing

- **Resend** como proveedor transaccional
- Tabla `email_templates` con templates configurables desde admin
- Alertas premium (5-15€/mes): notificación instantánea cuando coincide con búsqueda guardada

### 6.5 Paid media

- **Google Ads:** opcional, mínimo útil 300€/mes. Solo meses 7-12 si da ROI
- **CPM estimado B2B industrial:** 8-25€ (vs 5-15€ generalista)
- No se discutió Social Ads específicamente

### 6.6 Analítica y tracking

- **Sentry:** monitorización de errores
- **Tabla `ad_events`:** impresiones, clics, clics teléfono, clics email
- **GA4/GTM:** no mencionados explícitamente en la conversación

### 6.7 Posiciones publicitarias (10 definidas)

| POS | Nombre           | Dónde                | AdSense fallback   |
| --- | ---------------- | -------------------- | ------------------ |
| 1   | pro_teaser       | Catálogo arriba      | NO (sistema)       |
| 2   | catalog_inline   | Cada 8-10 resultados | SÍ                 |
| 3   | sidebar          | Landings + artículos | SÍ                 |
| 4   | search_top       | Arriba resultados    | NO (300-500€)      |
| 5   | vehicle_services | Ficha bajo specs     | NO (200-400€)      |
| 6   | dealer_portal    | Portal dealer        | SÍ (si no Premium) |
| 7   | landing_sidebar  | Landing SEO derecha  | SÍ                 |
| 8   | article_inline   | Entre párrafos 2-3   | SÍ                 |
| 9   | email_footer     | Emails antes footer  | NO                 |
| 10  | pdf_footer       | PDFs pie página      | NO                 |

---

## 7. EQUIPO Y RESPONSABILIDADES

### 7.1 Roles definidos

| Persona              | Edad | Ubicación | Rol                                                               |
| -------------------- | ---- | --------- | ----------------------------------------------------------------- |
| Hermano 1 (fundador) | 38   | Liverpool | Estrategia, desarrollo con Claude Code, exportación internacional |
| Hermano 2            | 32   | León      | Operaciones físicas, campas, vehículos (carnet tractora en curso) |

### 7.2 Compromisos

- **Claude Code:** ejecuta todas las sesiones de implementación
- **Claude (chat):** planificación, auditorías, decisiones de arquitectura
- **Red de subcontratas:** gestorías, aseguradoras, talleres, transportistas (modelo referral)
- **Freelance de emergencia:** 500-1.000€ reservados

### 7.3 Necesidad de contratar

**Primer hire:** cuando Tracciona genere 2.000-3.000€/mes consistentes

- Perfil: comercial bilingüe (español+portugués)
- Conocimiento del sector transporte
- Remuneración: 100% variable sobre lo que genere

**Modelo operativo (coste variable, no fijo):**

- Chófer: paga por trabajo → coste fijo = 0€
- Mecánico inspector: 100-150€/inspección (subcontrata)
- Gestoría: 80-120€/trámite (subcontrata)
- Aseguradora: acuerdo de referral

---

## 8. PRESUPUESTO Y RECURSOS

### 8.1 Datos financieros de Tank Ibérica

> **CAMBIO:** Facturación reportada inicialmente como 300.000€ → Corregida a 500.000€/año.

| Concepto                | Cifra                                                |
| ----------------------- | ---------------------------------------------------- |
| Facturación bruta anual | 500.000€                                             |
| Capital disponible      | 200.000€ efectivo + 150.000€ en stock (15 vehículos) |
| Gastos fijos anuales    | 70.000€ (incluye 2×2.000€ brutos/mes salarios)       |
| Stock                   | 10 cisternas + 2 tractoras + 2 rígidos + 1 remolque  |
| Campas                  | 500€/mes actual → 1.500€/mes objetivo                |

### 8.2 Costos de infraestructura

**OPEX compartido entre todos los verticales:**

| Servicio               | Coste/mes                                    |
| ---------------------- | -------------------------------------------- |
| Supabase Pro           | 25€                                          |
| Cloudinary             | 0€ (free) → 89€ (Plus) si >625 vehículos/mes |
| Claude Pro/Max         | 18-92€                                       |
| Dominio + email        | 6€                                           |
| **Total base**         | **~150-250€/mes**                            |
| Por vertical adicional | ~3-5€ (solo dominio)                         |

**Escalado:**

| Fase          | Coste infraestructura |
| ------------- | --------------------- |
| Lanzamiento   | ~$34/mes              |
| 7 verticales  | ~$108/mes             |
| 20 verticales | ~$236-316/mes         |

### 8.3 Inversión total 24 meses

| Escenario                             | Inversión         |
| ------------------------------------- | ----------------- |
| Sin Google Ads (Claude Code)          | 2.200€ - 4.600€   |
| Con Ads moderados                     | 9.400€ - 11.800€  |
| Con desarrollador humano (referencia) | 15.000€ - 20.000€ |

> **CAMBIO:** La ecuación de costes cambió completamente cuando el usuario reveló que usa Claude Code como "ingeniero" → coste de desarrollo = 0€ (solo suscripción).

### 8.4 Subvenciones

- La Rioja (ADER/PPA): 75% de inversión elegible
- Con 10.000€ elegible → 7.500€ subvención, coste real 2.500€
- SaaS (Supabase, Cloudflare, Claude) es gasto elegible confirmado

### 8.5 Monetización — 16 vías de ingreso

**Fase 1 (día 1):**

- Destacados: 30-50€/mes por anuncio (margen 100%)
- Publicidad geo-segmentada: 150€/mes/zona
- Alertas premium: 5-15€/mes
- IA genera fichas: gratis (motor de captación)

**Fase 2 (meses 6-12):**

- Suscripciones dealer: Básico 29€/mes, Premium 79€/mes
- Comisión intermediación: 3-5% (ticket medio 35k€ → 1.050€/operación)
- Informe DGT: 25-35€ (margen 15-20€)
- Inspección TI: 300-500€ (margen 150-350€)
- Transporte IberHaul: tarifas planas (margen 200-400€)
- Trámites: 200-300€ (margen 100-180€)
- Seguros: comisión 15-25% de prima

**Fase 3 (meses 12-18+):**

- Escrow vía Stripe Connect
- Financiación BNPL: comisión 1-2%
- Informes de valoración: 50-100€ individual, 500-1.000€/trimestre empresas
- TI Market Index (gratuito, generador de autoridad)
- Subastas online: buyer's premium 5-10%
- API datos (financieras, aseguradoras, fabricantes)

**Transacción completa cisterna 40.000€:**

- Ingresos totales: ~2.650-3.785€
- Margen bruto: ~1.750-2.375€
- **Una sola transacción cubre un año de infraestructura**

**Timeline para 3.000€/mes:**

- Meses 0-6: 0€
- Meses 6-12: 200-500€
- Meses 12-18: 1.000-2.000€
- Meses 18-24: 3.000€ base → 8.000-15.000€/mes con servicios completos

---

## 9. DECISIONES Y CAMBIOS

### 9.1 Registro completo de cambios

| #   | Tema                          | Propuesta original                     | Decisión final                        | Motivo                                          |
| --- | ----------------------------- | -------------------------------------- | ------------------------------------- | ----------------------------------------------- |
| 1   | Nombre transporte             | Transporteo SL                         | IberHaul                              | Más potente e internacional                     |
| 2   | SLs por vertical              | Una por vertical                       | 3 máximo                              | Coste innecesario                               |
| 3   | Marca marketplace             | Tank Ibérica                           | Tracciona.com                         | Separar negocio físico de marketplace           |
| 4   | App móvil                     | App nativa                             | PWA con @vite-pwa/nuxt                | Coste cero, sin Apple 30%, B2B no descarga apps |
| 5   | Facturación declarada         | 300.000€/año                           | 500.000€/año                          | Corrección del usuario                          |
| 6   | Inversión con dev humano      | 15-25k€                                | 2,2-4,6k€ con Claude Code             | Eliminación coste desarrollo                    |
| 7   | Dominios regionales           | .fr, .de, .it, .pt                     | Solo .com + hreflang                  | B2B industrial = .com                           |
| 8   | i18n strategy                 | `no_prefix`                            | `prefix_except_default`               | no_prefix = bomba SEO                           |
| 9   | BD idiomas                    | Columnas `_es`, `_en`                  | JSONB + content_translations          | Escalabilidad N idiomas                         |
| 10  | Tercer nivel jerárquico       | Tabla dedicada                         | 2 niveles + atributos dinámicos       | Atributos ya actúan como nivel 3                |
| 11  | Motor traducción              | DeepL                                  | GPT-4o mini Batch API                 | 30× más barato                                  |
| 12  | Vertical traspasos            | Implementar ahora                      | Relevo.com para futuro                | Ficha radicalmente distinta                     |
| 13  | Docs Claude Code              | Monolito 5.000+ líneas                 | 36 archivos modulares + 17 sesiones   | Context management                              |
| 14  | Rate limiting                 | Map() en memoria                       | CF WAF (zero code)                    | Map() no persiste Workers                       |
| 15  | CORS                          | Global '/api/\*\*'                     | Solo merchant-feed, sitemap, health   | Riesgo abuso cross-site                         |
| 16  | devtools                      | `enabled: true`                        | `enabled: NODE_ENV !== 'production'`  | Riesgo en prod                                  |
| 17  | Imágenes                      | Solo Cloudinary                        | Pipeline híbrido Cloudinary→CF Images | CF Images más barato a escala                   |
| 18  | Webhook Stripe                | Fail-open sin secret                   | Fail-closed en producción             | Seguridad                                       |
| 19  | WhatsApp webhook              | Sin validación firma                   | HMAC X-Hub-Signature-256              | Inyección mensajes falsos                       |
| 20  | Facturas mantenimiento en ✓✓✓ | Incluidas                              | Opcional sin nivel                    | No verificables                                 |
| 21  | Geo meta tags                 | Implementar                            | NO implementar                        | Google los ignora                               |
| 22  | Sesiones 34/34b/35            | "No ejecutadas"                        | SÍ ejecutadas                         | Verificación de código real                     |
| 23  | Nombres verticales            | MaquinariaYa, EquipoMédico, AlmacénPro | ReSolar, Clinistock, BoxPort          | Corrección 18 Feb 2026                          |
| 24  | Ejes como filtro              | Filtro activo                          | Eliminado                             | 95% semirremolques = 3 ejes                     |
| 25  | Material como filtro          | Filtro activo                          | Eliminado (implícito)                 | Alimentaria=inox, combustible=aluminio          |

### 9.2 Propuestas descartadas

- **Milanuncios como modelo:** El usuario preguntó cuánto costaba replicar Milanuncios → Se explicó que no debería intentarlo, sino crear un nicho especializado
- **Versión de pago sin anuncios (tipo Spotify):** Descartada porque el usuario no consume contenido durante horas
- **App nativa:** Descartada por coste y porque B2B no descarga apps
- **BoxPort (contenedores):** Descartado por bajo diferencial
- **CodeQL:** Descartado (gratis solo en repos públicos)
- **Bug bounty formal (HackerOne):** Descartado para fase de lanzamiento

### 9.3 Pendientes de definir

- Precio de Certificación TI (nivel 5 de verificación)
- Auth para market-report (sesión 36)
- i18n: dropear columnas `_es`/`_en` residuales
- Estrategia de bug bounty formal (cuando haya tráfico)
- Admin/dashboard consolidación (sesión 36-G)

---

## 10. CÓDIGO Y SNIPPETS

### 10.1 Configuración i18n (CAMBIO PENDIENTE)

```typescript
// nuxt.config.ts — ESTADO ACTUAL (INCORRECTO)
i18n: {
  strategy: 'no_prefix',  // ← CAMBIAR
  locales: [
    { code: 'es', file: 'es.json', name: 'Español' },
    { code: 'en', file: 'en.json', name: 'English' },
  ],
  defaultLocale: 'es',
}

// CORRECTO (pendiente de aplicar):
i18n: {
  strategy: 'prefix_except_default',
  // ...
}
```

### 10.2 Utilidades de seguridad

**sanitizeForLog (server/utils/sanitizeLog.ts):**

```typescript
export function sanitizeForLog(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitive = [
    'phone',
    'phone_number',
    'email',
    'contact_email',
    'text_content',
    'stack',
    'ip',
  ]
  const result = { ...obj }
  for (const key of sensitive) {
    if (key in result && result[key]) {
      result[key] = '[REDACTED]'
    }
  }
  return result
}
```

**useSanitize (app/composables/useSanitize.ts):**

```typescript
import DOMPurify from 'isomorphic-dompurify'
export function useSanitize() {
  function sanitize(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h2', 'h3', 'h4'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
    })
  }
  function sanitizeStrict(dirty: string): string {
    return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
  }
  return { sanitize, sanitizeStrict }
}
```

**batchProcessor (server/utils/batchProcessor.ts):**

```typescript
export async function processBatch<T>({
  items,
  batchSize = 50,
  delayBetweenBatchesMs = 100,
  processor,
}: {
  items: T[]
  batchSize?: number
  delayBetweenBatchesMs?: number
  processor: (item: T) => Promise<void>
}): Promise<{ processed: number; errors: number }> {
  let processed = 0,
    errors = 0
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    await Promise.allSettled(
      batch.map(async (item) => {
        try {
          await processor(item)
          processed++
        } catch {
          errors++
        }
      }),
    )
    if (i + batchSize < items.length && delayBetweenBatchesMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatchesMs))
    }
  }
  return { processed, errors }
}
```

### 10.3 Stripe webhook (fail-closed)

```typescript
// server/api/stripe/webhook.post.ts
const sig = event.node.req.headers['stripe-signature'] as string
const webhookSecret = config.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET

if (!webhookSecret) {
  if (process.env.NODE_ENV === 'production') {
    throw createError({ statusCode: 500, message: 'Stripe webhook secret not configured' })
  }
  console.warn('[Stripe Webhook] No webhook secret — dev mode')
  stripeEvent = JSON.parse(rawBody)
} else {
  if (!sig) throw createError({ statusCode: 400, message: 'Missing stripe-signature header' })
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err: unknown) {
    throw createError({
      statusCode: 400,
      message: `Webhook verification failed: ${err instanceof Error ? err.message : 'Unknown'}`,
    })
  }
}
```

### 10.4 Precios Stripe

```typescript
const PRICES: Record<string, Record<string, number>> = {
  basic: { month: 2900, year: 29000 }, // 29€/mes o 290€/año
  premium: { month: 7900, year: 79000 }, // 79€/mes o 790€/año
}
```

### 10.5 WhatsApp webhook (HMAC Meta)

```typescript
// server/api/whatsapp/webhook.post.ts
import { createHmac, timingSafeEqual } from 'node:crypto'

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

function phoneVariants(phone: string): string[] {
  const digits = normalizePhone(phone)
  const variants = new Set<string>()
  variants.add(digits)
  variants.add(`+${digits}`)
  if (digits.startsWith('34') && digits.length > 9) {
    variants.add(digits.slice(2))
  }
  if (!digits.startsWith('34') && digits.length === 9) {
    variants.add(`34${digits}`)
    variants.add(`+34${digits}`)
  }
  return Array.from(variants)
}

// Firma HMAC:
const appSecret = config.whatsappAppSecret || process.env.WHATSAPP_APP_SECRET
if (appSecret && process.env.NODE_ENV === 'production') {
  // Verificar x-hub-signature-256 con timingSafeEqual
}
```

### 10.6 RLS — función is_admin()

```sql
-- Migración 00055_rls_hardening.sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin');
$$;

-- Ejemplo de políticas
CREATE POLICY "advertisements_authenticated_insert" ON public.advertisements
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "demands_authenticated_insert" ON public.demands
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

### 10.7 Índices de rendimiento

```sql
-- Migración 00056_performance_indexes.sql
CREATE INDEX IF NOT EXISTS idx_vehicles_location_province ON public.vehicles (location_province);
CREATE INDEX IF NOT EXISTS idx_vehicles_location_region ON public.vehicles (location_region);
CREATE INDEX IF NOT EXISTS idx_vehicles_location_country ON public.vehicles (location_country);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand_trgm ON public.vehicles USING gin (brand gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_vehicles_status_created ON public.vehicles (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicles_visible_from ON public.vehicles (visible_from) WHERE visible_from IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_dealer_created ON public.invoices (dealer_id, created_at DESC);
```

### 10.8 Sistema Pro 24h

```sql
-- Al publicar gratuito:
-- visible_from = NOW() + INTERVAL '24 hours'
-- Query pública: WHERE status = 'published' AND visible_from <= NOW()
-- Query Pro: WHERE status = 'published' (ignora visible_from)
```

### 10.9 Claude Haiku — Generador de descripciones

```typescript
const response = await $fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  },
  body: {
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  },
})
```

### 10.10 Cache CDN (routeRules)

```typescript
// nuxt.config.ts
routeRules: {
  '/api/market-report': { swr: 60 * 60 * 6 },       // 6 horas
  '/api/merchant-feed*': { swr: 60 * 60 * 12 },      // 12 horas
  '/api/__sitemap*': { swr: 60 * 60 * 6 },            // 6 horas
}
```

### 10.11 localizedField helper

```typescript
function localizedField(jsonField: Record<string, string>, locale: string): string {
  return (
    jsonField[locale] || jsonField['en'] || jsonField['es'] || Object.values(jsonField)[0] || ''
  )
}
```

### 10.12 EU VAT rates

```typescript
const EU_VAT_RATES: Record<string, number> = {
  ES: 21,
  PT: 23,
  FR: 20,
  DE: 19,
  IT: 22,
  NL: 21,
  BE: 21,
  AT: 20,
  IE: 23,
  PL: 23,
  SE: 25,
  DK: 25,
  FI: 24,
  CZ: 21,
  RO: 19,
  HU: 27,
  BG: 20,
  HR: 25,
  SK: 20,
  SI: 22,
  LT: 21,
  LV: 21,
  EE: 22,
  CY: 19,
  MT: 18,
  LU: 17,
  GR: 24,
  GB: 20,
}
```

### 10.13 Slash commands de Claude Code

**`/plan`** — planificar feature sin escribir código
**`/build`** — implementar feature completa
**`/session N`** — ejecutar sesión N de INSTRUCCIONES-MAESTRAS
**`/db`** — crear migración SQL

### 10.14 Skills de Claude Code

- **supabase-rls:** patrones RLS (público, owner, admin)
- **nuxt-security:** checklist de seguridad por endpoint (auth, ownership, safeError)

### 10.15 MCP Servers configurados

```bash
# Context7 (docs actualizadas)
claude mcp add context7 -s user -- npx -y @upstash/context7-mcp

# Sequential Thinking
claude mcp add sequential-thinking -s user -- cmd /c npx -y @modelcontextprotocol/server-sequential-thinking

# Supabase
claude mcp add supabase --transport http -s user -- https://mcp.supabase.com

# Playwright
claude mcp add playwright -s user -- cmd /c npx -y @playwright/mcp-server

# GitHub
claude mcp add github -s user --env GITHUB_PERSONAL_ACCESS_TOKEN=TOKEN -- cmd /c npx -y @modelcontextprotocol/server-github
```

---

## APÉNDICE A: Pitch para inversores (resumen)

> "No vendemos anuncios. Vendemos confianza en transacciones de alto valor."

**Datos clave del pitch:**

- Mercado ibérico vehículo industrial: 2-3B€/año en transacciones de segunda mano
- Ticket medio: 35.000€
- Comisión media: 3-5% = 1.050€/operación
- Una transacción completa = 2.650-3.785€ de ingresos
- Coste operativo: <250€/mes
- Break-even: 1-2 transacciones/mes
- Diferencial: IA + verificación + servicios integrados + multi-vertical

**Preguntas due diligence preparadas:** tracción real, unit economics, competencia, barreras de entrada, equipo, escalabilidad, regulación, exit.

---

## APÉNDICE B: Comandos de desarrollo

```bash
npm run dev          # Dev server
npm run build        # Build producción
npm run lint         # ESLint
npm run lint:fix     # ESLint auto-fix
npm run typecheck    # nuxi typecheck
npm run test         # Vitest
npx supabase db push # Aplicar migraciones
npx supabase gen types typescript --project-id gmnrfuzekbwyzkgsaftv > types/supabase.ts
```

---

## APÉNDICE C: Variables de entorno requeridas

```env
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
WHATSAPP_APP_SECRET=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
CRON_SECRET=
SENTRY_DSN=
IMAGE_PIPELINE_MODE=  # cloudinary | hybrid | cf_images
```

---

> **Documento generado el 25/02/2026** a partir de la conversación completa de 2,165 páginas con Claude.
> Procesado en 6 secciones de ~15,000 líneas cada una.
