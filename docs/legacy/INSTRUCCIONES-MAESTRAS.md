> ⚠️ **[LEGACY]** Documento histórico — solo referencia. No modificar ni usar como fuente de verdad. Ver [docs/README.md](../README.md) para navegación activa.
> Sesiones 1-64 ya ejecutadas. El trabajo activo vive en [BACKLOG-EJECUTABLE.md](../tracciona-docs/BACKLOG-EJECUTABLE.md).

# INSTRUCCIONES MAESTRAS DE EJECUCIÓN

> **PARA CLAUDE CODE:** Este archivo define el orden exacto de ejecución, qué archivos leer en cada paso, y qué crear. El usuario te indicará "ejecuta la sesión N" y tú lees esta sección.

## REGLAS OBLIGATORIAS DE EJECUCIÓN

### Regla 1: LEE ANTES DE ESCRIBIR

Antes de escribir UNA SOLA línea de código en cada sesión:

1. Lee TODOS los archivos listados en "Leer" de esa sesión
2. Lee los anexos referenciados
3. Si una sesión dice "ya creado en sesión X", ve a verificar qué se creó antes de asumir
4. Relee estas reglas al inicio de cada sesión

### Regla 2: NO IMPROVISES — PREGUNTA

Si no tienes datos suficientes para implementar algo, **PARA y pregunta al usuario**. Específicamente:

- Si un anexo describe una funcionalidad pero no da detalle técnico suficiente → **PREGUNTA**
- Si necesitas una API key, URL, credencial, o dato de configuración que no está en los archivos → **PREGUNTA**
- Si hay ambigüedad entre dos formas de implementar algo → **PREGUNTA**
- Si un componente depende de otro que no existe aún → **PREGUNTA** si debe crearlo o dejarlo como placeholder
- Si tienes que elegir entre librerías/dependencias alternativas → **PREGUNTA**
- NUNCA inventes datos de ejemplo, precios, textos de marketing, o lógica de negocio que no esté documentada
- NUNCA asumas que "probablemente" funciona de cierta manera — si no está escrito, pregunta

### Regla 3: MOBILE-FIRST + MULTILENGUAJE EN TODO

Cada componente, página y layout que crees debe cumplir:

- **Mobile-first obligatorio:** Diseñar primero para móvil (360px), luego tablet (768px), luego desktop (1024px+). El target principal es el transportista que mira su móvil. Los breakpoints de Tailwind (`sm:`, `md:`, `lg:`) se usan de menor a mayor.
- **Touch-friendly:** Botones mínimo 44x44px, espaciado entre elementos táctiles suficiente, no depender de hover
- **Multilenguaje nativo:** Todos los textos de UI usan `$t('key')` de @nuxtjs/i18n, NUNCA texto hardcodeado en español. Los datos dinámicos usan `localizedField(field, locale)` para leer JSONB. Las descripciones largas se leen de `content_translations`.
- **RTL-ready:** Usar `gap`, `flex`, `grid` en vez de margin-left/right cuando sea posible. Esto no es urgente pero facilita expansión futura.

### Regla 4: VERIFICAR ANTES DE CADA ACCIÓN

Antes de crear un archivo, verifica que no existe ya. Antes de crear una tabla, verifica que no se creó en una sesión anterior. Antes de instalar un paquete npm, verifica que no está ya en package.json.

### Regla 5: MOBILE-FIRST NO NEGOCIABLE (del proyecto original Tank Ibérica)

> **Ningún componente se considera "terminado" hasta que funciona correctamente en un móvil de 360px con conexión lenta. Desktop es la adaptación, no al revés.**

Reglas concretas heredadas del proyecto original:

- **CSS base = móvil (360px).** Breakpoints con `min-width` (nunca `max-width`). Orden: base → `sm:` (480px) → `md:` (768px) → `lg:` (1024px) → `xl:` (1280px).
- **Touch targets ≥ 44px** en todo elemento interactivo. Los botones del FilterBar, cards, iconos del header.
- **Sin hover como trigger principal.** Hover no existe en móvil. Desplegables con tap, no hover. Tooltips como modal pequeño o bottom sheet.
- **Bottom sheet en móvil para formularios y filtros:** AuthModal, FilterBar, AdvertiseModal, DemandModal → bottom sheet animado en `<768px`, modal centrado en desktop. Formularios largos → página completa en móvil (scroll vertical), no modal.
- **Keep-alive + scroll preservation:** Al volver de `/vehiculo/[slug]` al catálogo, el scroll y los filtros se preservan. Usar `<NuxtPage keepalive>` + `useCatalogState` (ya implementado). Verificar en cada sesión que modifique navegación.
- **Gestos nativos:** Swipe en galería de imágenes. El botón atrás del sistema funciona SIEMPRE.
- **Rendimiento en 3G:** Lighthouse con throttling 3G debe dar >75. Imágenes lazy-load, code splitting, skeleton loaders.

### Regla 6: REUTILIZAR CÓDIGO EXISTENTE

Antes de implementar cualquier funcionalidad nueva, Claude Code debe:

1. Buscar en `app/composables/`, `app/utils/`, `app/pages/admin/` si ya existe código funcional
2. Si existe → adaptar a multivertical (añadir `vertical`, `dealer_id` donde aplique). NO reescribir.
3. Consultar los Bloques D-BIS, D-TER y D-QUATER de esta misma sesión 2 para ver el inventario completo.

Código existente crítico:

- `useGoogleDrive` → integración Google Drive (herramienta opcional del dealer)
- `useSeoScore` → cálculo SEO score (Sesión 11)
- `useFavorites` → sistema favoritos (Sesión 29)
- `useUserChat` → chat usuario (convive con leads)
- `useAdminHistorico` → historial ventas (Sesión 28)
- `generatePdf.ts` → fichas PDF vehículo (Sesión 31)
- `fuzzyMatch.ts` → búsqueda difusa (buscador global)
- `geoData.ts` + `parseLocation.ts` → geolocalización
- `admin/utilidades.vue` → generador facturas/contratos (Sesión 31)

### Regla 8: CREAR CLAUDE.md + COMMANDS + SKILLS PARA TRACCIONA

El proyecto Tank Ibérica tenía `.claude/commands/` (5 comandos: next-task, status, fix-errors, mobile-check, verify) y `.claude/skills/` (2 skills: mobile-first, nuxt-supabase) que guían a Claude Code. Tracciona debe tener equivalentes.

**En la primera sesión que modifique la raíz del proyecto (si no existen ya), crear:**

1. `CLAUDE.md` en la raíz del proyecto con:
   - Stack: Nuxt 3, Supabase, Cloudflare Pages, Cloudinary, Stripe
   - Comandos: dev, build, lint, typecheck, test, test:e2e, supabase gen types
   - Los 3 requisitos no negociables: mobile-first 360px, páginas reales (no modales), extensible (datos en BD no en código)
   - Estructura de carpetas
   - Convenciones: TS estricto, no `any`, composables `use` + PascalCase, i18n obligatorio, no innerHTML
   - Referencia a INSTRUCCIONES-MAESTRAS.md para el orden de sesiones

2. `.claude/commands/next-task.md` — Lee INSTRUCCIONES-MAESTRAS.md, identifica sesión actual, planifica, implementa, verifica (lint+typecheck+test), actualiza progreso, commit
3. `.claude/commands/status.md` — Muestra resumen de sesiones completadas vs pendientes
4. `.claude/commands/fix-errors.md` — Ejecuta lint+typecheck, corrige errores automáticamente
5. `.claude/commands/mobile-check.md` — Audita componentes en 360px: touch targets, overflow, bottom sheets
6. `.claude/commands/verify.md` — Verifica que la sesión actual cumple todos los criterios de paso
7. `.claude/skills/mobile-first/SKILL.md` — Guía detallada de patrones mobile-first (bottom sheet, touch targets, breakpoints)
8. `.claude/skills/nuxt-supabase/SKILL.md` — Patrones de Nuxt 3 + Supabase (composables, RLS, Realtime, Edge Functions)

### Regla 9: HERRAMIENTAS EXTERNAS

Claude Code tiene acceso a:

- **Sistema de archivos completo** del proyecto (lectura y escritura)
- **Terminal** para ejecutar comandos (npm, npx, supabase, git)
- **Variables de entorno** en `.env` y `.env.local`
- Si necesitas acceder a Supabase dashboard, Stripe dashboard, Cloudflare dashboard, Cloudinary dashboard u otra herramienta externa que requiera navegador → **PREGUNTA al usuario**, él te dará los datos o lo hará manualmente. No intentes abrir URLs de dashboards.
- Si necesitas ejecutar `supabase db push`, `supabase gen types`, o cualquier comando de CLI de Supabase → hazlo directamente, tienes acceso.
- Si necesitas instalar dependencias npm → hazlo directamente (`npm install X`).

---

---

## SESIÓN 1 — Paso 0: Backup

**Estado:** ✅ YA COMPLETADO (la carpeta Tracciona es la copia de tank-iberica)
**Acción:** Saltar. Ir a sesión 2.

---

## SESIÓN 2 — Paso 1A: Migración SQL (renombrar tablas + i18n + tablas nuevas)

**Leer ANTES de escribir código:**

1. `docs/tracciona-docs/migracion/01-pasos-0-6-migracion.md (alias de compatibilidad histórica)` — Sección PASO 1 (renombrar tablas)
2. `docs/tracciona-docs/anexos/T-internacionalizacion-i18n.md (alias de compatibilidad histórica)` — Secciones T.2, T.3, T.4 (JSONB + content_translations)
3. `docs/tracciona-docs/anexos/V-tablas-placeholder-capa2.md (alias de compatibilidad histórica)` — Todas las tablas placeholder
4. `docs/tracciona-docs/anexos/W-panel-configuracion.md (alias de compatibilidad histórica)` — Secciones W.2 y W.9 (vertical_config + activity_logs)
5. `docs/esquema-bd.md` — Esquema actual de la BD (ubicado en `docs/`, NO en `docs/tracciona-docs/`)

**Crear una SOLA migración:** `supabase/migrations/00031_tracciona_migration.sql`

**Esta migración debe hacer TODO esto en orden:**

### Bloque A — Renombrar tablas (del Paso 1)

- Crear tabla `actions` con campo `name JSONB` (NO name_es/name_en)
- Renombrar `subcategories` → `categories`
- Renombrar `types` → `subcategories`
- Renombrar `type_subcategories` → `subcategory_categories` (y sus columnas)
- Renombrar `filter_definitions` → `attributes`
- Añadir columna `vertical` a categories, subcategories, attributes
- Migrar `vehicles.category` (enum) → `vehicles.action_id` (UUID FK)
- Renombrar `vehicles.subcategory_id` → `vehicles.category_id`
- Renombrar `vehicles.filters_json` → `vehicles.attributes_json`
- Renombrar `applicable_categories` → `applicable_actions` en categories y subcategories
- Actualizar RLS policies con nombres nuevos
- Recrear índices con nombres nuevos

### Bloque B — Migrar columnas de idioma a JSONB (del Anexo T)

- En TODAS las tablas que tengan `name_es`/`name_en`: crear columna `name JSONB`, migrar datos, (NO dropear columnas antiguas todavía — comentar el DROP)
- Mismo para `name_singular_es`/`name_singular_en` → `name_singular JSONB`
- Mismo para `description_es`/`description_en` en news → migrar a content_translations
- Para vehicles: migrar `description_es`/`description_en` a content_translations, `location`/`location_en` a `location_data JSONB`

### Bloque C — Crear tabla content_translations (del Anexo T.3)

- CREATE TABLE content_translations con todos los campos e índices
- Full-text search indexes por idioma (es, en)
- RLS: lectura pública, escritura admin/owner

### Bloque D — Crear tablas placeholder (del Anexo V + K + sesión 24)

- dealers (con todos los campos del Anexo K.1 + W.4: slug, company_name, logo_url, cover_image_url, description, phone, whatsapp, email, website, location, tax_id, legal_name, badge, auto_reply_message, notification_preferences JSONB, total_listings, active_listings, total_leads, avg_response_time_hours, rating, status)
- Columnas adicionales en vehicles (dealer_id, listing_type, verification_level, sold_at, pending_translations, location_data, auto_auction_after_days, auto_auction_starting_pct, ai_generated BOOLEAN, visible_from TIMESTAMPTZ — para sistema Pro 24h del Anexo E.2) del Anexo V.2
- Columnas adicionales en users: user_type VARCHAR DEFAULT 'buyer' ('buyer'|'dealer'|'admin'), company_name, phone_verified BOOLEAN, onboarding_completed BOOLEAN, last_login_at TIMESTAMPTZ, login_count INT
- leads (Anexo K.2: dealer_id, vehicle_id, buyer_user_id, buyer_name, buyer_phone, buyer_email, buyer_location, message, source, status 'new'→'viewed'→'contacted'→'negotiating'→'won'/'lost', dealer_notes, first_viewed_at, first_responded_at, closed_at, close_reason, sale_price_cents)
- user_vehicle_views (user_id, vehicle_id, viewed_at, PRIMARY KEY(user_id, vehicle_id))
- favorites (user_id, vehicle_id, created_at, UNIQUE(user_id, vehicle_id))
- search_alerts (user_id, vertical, filters JSONB, frequency 'instant'|'daily'|'weekly', active BOOLEAN, last_sent_at)
- subscriptions (Anexo E.2: user_id, vertical, plan, status, price_cents, started_at, expires_at, stripe_subscription_id)
- dealer_stats (Anexo K.5: dealer_id, period_date, vehicle_views, profile_views, leads_received, leads_responded, favorites_added, conversion_rate, avg_response_minutes)
- dealer_events (dealer_id, event_type, metadata JSONB, created_at)
- dealer_stripe_accounts (dealer_id, stripe_account_id, onboarding_completed, charges_enabled)
- dealer_fiscal_data (dealer_id, tax_id, tax_country, tax_address, verified)
- dealer_leads (Anexo I.2: fuente captación, source, company_name, phone, email, status)
- auctions, bids, auction_registrations del Anexo H
- verification_documents del Anexo G.3 (vehicle_id, doc_type, file_url, verified_by, status)
- advertisers (empresa anunciante: company_name, logo_url, contact_email, contact_phone, website, tax_id)
- ads del Anexo F.3 expandido (advertiser_id FK, title, description, image_url, logo_url, link_url, phone, email, cta_text, countries[], regions[], provinces[], category_slugs[], action_slugs[], positions[], format, include_in_pdf, include_in_email, price_monthly_cents, starts_at, ends_at)
- ad_events (ad_id, event_type, user_country, user_region, user_province, page_path)
- geo_regions (country_code, region_level, region_slug, region_name JSONB, parent_slug, postal_code_pattern, lat/lng) + ejecutar seed desde `docs/tracciona-docs/seeds/geo_regions_spain.sql` (70 registros: 1 país + 17 CCAA + 52 provincias). Escala a nuevos mercados con solo INSERT.
- transport_zones, transport_requests del Anexo G-BIS
- service_requests (type, vehicle_id, user_id, status, partner_notified_at)
- social_posts del Anexo I.3 (vehicle_id, platform, content, image_url, status)
- invoices del Anexo I.4 (user_id, stripe_invoice_id, service_type, amount, tax, pdf_url)
- consents (user_id, consent_type, granted, ip_address, timestamp)
- analytics_events (sesión 32: event_type, vehicle_id, user_id, metadata JSONB)
- merch_orders (sesión 31: dealer_id, product_type, quantity, design_pdf_url, stripe_payment_id, status)
- dealer_invoices (sesión 31: facturas generadas POR el dealer, no DE Tracciona)

### Bloque D-BIS — Preservar tablas legacy del código actual

Estas tablas ya existen en el código viejo (Tank Ibérica). NO eliminar en la migración. Adaptar a multivertical añadiendo columna `vertical VARCHAR DEFAULT 'tracciona'` donde no exista.

- **balance** (migr. 00017): Sistema de balance/saldo financiero. Mantener para Sesión 26 (facturación). Añadir columna `vertical`.
- **chat_messages** (migr. 00021): Mensajería interna entre compradores y vendedores. Convive con el sistema de leads (Anexo K.2). Leads = primer contacto formal. Chat = conversación posterior. Añadir columna `vertical`.
- **maintenance_records** (migr. 00016): Registros de mantenimiento de vehículos. Útil para dealers que gestionan su flota internamente. Integrar en Sesión 31 (herramientas dealer). Añadir `vertical`, `dealer_id`.
- **rental_records** (migr. 00016): Registros de alquiler de vehículos. Misma lógica que maintenance. Integrar en Sesión 31. Añadir `vertical`, `dealer_id`.
- **advertisements + demands** (migr. 00012, 00029): Clasificados y demandas ("busco cisterna alimentaria 2020+"). Las demands alimentan las alertas de match en subastas (Sesión 16) y el dashboard Premium (Sesión 27). Añadir `vertical`.
- **filter_definitions** (migr. 00002): Los 6 tipos de filtro dinámico (caja, desplegable, desplegable_tick, tick, slider, calc) se preservan. Conviven con el sistema de `dimensions`/`dimension_values` (landing pages SEO). Las dimensions generan landing pages indexables; los filter_definitions controlan la UI de filtrado dentro de cada landing. NO son redundantes. Añadir `vertical`.

> **NOTA para Claude Code**: En la migración 00031, NO hacer DROP de estas tablas. Solo ALTER TABLE ADD COLUMN vertical/dealer_id donde corresponda. Los datos existentes se preservan.

### Bloque D-TER — Preservar código funcional del código actual

Estos archivos ya existen y funcionan en Tank Ibérica. NO reescribir desde cero. Adaptar a multivertical.

**Páginas admin que se preservan (renombrar ruta de `/admin/` a `/dashboard/` para dealers, mantener `/admin/` para superadmin):**

- **admin/agenda.vue** → CRM de contactos del dealer (clientes, proveedores, transportistas). Mover a `/dashboard/crm` en Sesión 28. Ya funcional con CRUD completo.
- **admin/cartera.vue** → Pipeline comercial (ojeados, negociando, cerrado). Mover a `/dashboard/pipeline` en Sesión 28. Es placeholder, implementar sobre la estructura existente.
- **admin/comentarios.vue** → Moderación de comentarios en artículos. Mantener en `/admin/comentarios` (solo superadmin). Es placeholder, implementar en Sesión 11 (editorial).
- **admin/historico.vue** → Historial de vehículos vendidos/archivados con estadísticas. Mover a `/dashboard/historico`. Ya funcional con `useAdminHistorico`.
- **admin/productos/** → CRUD de vehículos de intermediación (terceros que piden a Tank Ibérica que publique por ellos). Adaptar como "publicar en nombre de" en `/dashboard/vehiculos` con flag `published_by_dealer_id != owner_dealer_id`. Integrar en Sesión 10 (portal dealer).
- **admin/utilidades.vue** → Generador de facturas y contratos. Ya funcional. Base directa para Sesión 31 (herramientas dealer). Copiar lógica, no reescribir.

**Composables que se preservan:**

- **useGoogleDrive** → Integración Google Drive con OAuth, carpetas, subida. Mantener como herramienta opcional del dealer en Sesión 31. No todos los dealers la usarán pero Tank Ibérica sí. Documentos privados: Google Drive (si dealer lo conecta) O Supabase Storage (por defecto).
- **useSeoScore** → Cálculo de SEO score. Ya existe, usarlo directamente en Sesión 11 (SEO Score Potentiator). No reimplementar.
- **useUserChat** → Chat del usuario. Usar en combinación con el sistema de leads (leads = primer contacto, chat = conversación posterior).
- **useFavorites** → Sistema de favoritos. Usar directamente en Sesión 29. Ya funcional.
- **useAdminHistorico** → Historial completo. Integrar en dashboard dealer.

**Utils que se preservan:**

- **generatePdf.ts** → Generador de fichas PDF de vehículo (foto + specs + precio). Reutilizar en Sesión 31 (export catálogo PDF). Ya funciona.
- **fileNaming.ts** → Nomenclatura: `V42_Renault_2024_1234ABC`. Mantener como opción de naming para Google Drive. UUID para BD, nombre legible para archivos.
- **geoData.ts + parseLocation.ts + server/api/geo.get.ts** → Geolocalización. Complementa `geo_regions` (seeds). El parser ya funciona, usarlo.
- **fuzzyMatch.ts** → Búsqueda difusa. Usar en autocomplete de buscador global y filtros.

> **REGLA para Claude Code**: Antes de implementar una funcionalidad nueva, buscar en el código existente (`app/composables/`, `app/utils/`, `app/pages/admin/`) si ya existe algo funcional. Si existe, adaptar. No reescribir desde cero.

### Bloque D-QUATER — Tareas pendientes del plan original (docs/plan-v3.md)

El proyecto Tank Ibérica tenía un plan de profesionalización (46 tareas en 4 fases) del que varias tareas no se completaron. Las que aplican a Tracciona:

**Ya cubiertas por sesiones existentes:**

- Sentry → Sesión 19 (seguridad producción)
- DOMPurify/XSS → Sesión 19
- Security headers (\_headers CSP) → Sesión 19
- Playwright E2E → Sesión 20 (testing)
- PWA + Service Worker → Sesión 22
- Lighthouse >90 → Sesión 22
- Edge Functions → Múltiples sesiones (16, 18, 21, etc.)

**NO cubiertas — añadir a sesiones:**

1. **Pinia stores** → El código actual usa composables (patrón correcto para Nuxt 3) pero plan-v3 planificaba 3 stores centrales: `catalog.ts`, `auth.ts`, `ui.ts`. Decisión: **mantener composables** (ya funcionan), no migrar a Pinia salvo que el estado compartido lo requiera. Claude Code debe evaluar en Sesión 3.

2. **Unit tests con Vitest** → Sesión 20 menciona E2E con Playwright pero no Vitest para composables. **Añadir a Sesión 20**: tests unitarios para `useVehicles`, `useFilters`, `useCatalogState`, `useSeoScore` con Vitest.

3. **Husky pre-commit hooks** → ESLint existe (`eslint.config.mjs`) pero no hay Husky ni lint-staged. **Añadir a Sesión 19**: `npx husky init`, hook pre-commit con `lint-staged` (ESLint + Prettier).

4. **GitHub Actions CI/CD** → No hay `.github/workflows/`. **Añadir a Sesión 19**: workflow básico `ci.yml` (lint + type-check + vitest en cada PR), workflow `deploy.yml` (build + deploy Cloudflare Pages en merge a main).

5. **@nuxt/image con Cloudinary provider** → El módulo `@nuxt/image` está en nuxt.config.ts pero no hay evidencia de configuración del provider Cloudinary. **Verificar en Sesión 3**: que `<NuxtImg>` use Cloudinary provider con transformaciones automáticas.

6. **localStorage audit** → plan-v3 identificó 21 usos inseguros de localStorage. Supabase Auth usa cookies httpOnly pero pueden quedar usos legacy. **Añadir a Sesión 19**: grep de `localStorage` en todo el código, migrar a composables con `useLocalStorage` de VueUse o eliminar.

7. **ipapi.co eliminación** → `useUserLocation.ts` puede seguir usando servicios externos para geolocalización. **Verificar en Sesión 19**: que no envíe IPs a servicios externos sin consentimiento. Usar `navigator.language` + datos del perfil.

8. **Intermediación (tabla del plan-v3)** → plan-v3 planificaba tabla `intermediation` para operaciones donde Tank Ibérica intermedia entre comprador y vendedor cobrando comisión. La tabla existe como `admin/productos/` (Bloque D-TER). **Ya cubierto** por la adaptación de productos a "publicar en nombre de" en Sesión 10.

9. **Tabla `viewed_vehicles` (ojeados)** → plan-v3 planificaba tracking de vehículos vistos en otras plataformas (competencia). No es la misma que `user_vehicle_views` (analytics interno). **Añadir a Sesión 28** (CRM): herramienta para que el dealer registre vehículos de la competencia que ha observado (precio, contacto, plataforma, notas). Reutilizar concepto de `admin/cartera.vue`.

### Bloque D-QUINQUIES — Funcionalidades del admin original no detalladas (docs/admin-funcionalidades.md + inventario-ui.md)

El admin original de Tank Ibérica (8.860 líneas, 453 elementos UI, 16 secciones) tiene funcionalidades detalladas que las sesiones de Tracciona mencionan pero sin suficiente profundidad. Se documentan aquí como referencia obligatoria para Claude Code:

**A) Tabla `intermediation` + flujo de comisión** → Integrar en Sesión 10 (portal dealer).

- Vehículos de intermediación (IDs con prefijo P) son vehículos que el dealer publica por cuenta de un tercero cobrando comisión
- Campos específicos: propietario, contacto, comisión, gastos_json, ingresos_json
- Cálculo automático de beneficio = ingresos - gastos - comisión
- En Tracciona: crear tabla `intermediations` (dealer_id, vehicle_id, owner_name, owner_phone, owner_email, commission_pct, commission_amount, expenses JSONB, income JSONB, status, notes)
- Vista en `/dashboard/intermediacion` con CRUD y cálculos
- Plan mínimo: Básico

**B) Flujo registrar transacción (venta/alquiler)** → Integrar en Sesión 31 (herramientas dealer).

- Botón "Vender" en lista de vehículos abre modal con 2 tabs:
  - Tab Alquilar: fechas desde/hasta, cliente, importe, factura → crea entrada en balance automáticamente, cambia estado a 'alquilado'
  - Tab Vender: fecha, comprador, precio, flag exportación → mueve a histórico + crea entrada en balance
- Este flujo conecta: vehicles → balance → history_log
- En Tracciona: crear componente `<TransactionModal>` reutilizable en `/dashboard/vehiculos`

**C) Sistema de exportación avanzado** → Integrar en Sesión 31.

- 6 modales de exportación en el admin original:
  1. Exportar vehículos (Excel/PDF, filtrados/todos, selección de columnas)
  2. Exportar balance (Excel/PDF, por año/tipo/razón)
  3. Exportar resumen financiero (totales + desglose por razón + mensual)
  4. Exportar histórico (Excel/PDF, con datos de venta/beneficio)
  5. Exportar intermediación
  6. Exportar ojeados/competencia
- En Tracciona: crear herramienta genérica de exportación en `/dashboard/herramientas/exportar` con selector de sección + formato + columnas. Usar SheetJS (xlsx) para Excel y jsPDF para PDF (ambos ya usados en el admin original)

**D) Configuración de tabla dinámica (tabla_config)** → Integrar en Sesión 9 (panel admin).

- Grupos de columnas que se activan/desactivan con toggle (DOCS, TÉCNICO, CUENTAS, ALQUILER, FILTROS)
- Columnas con fallback (si volumen está vacío, mostrar capacidad)
- Drag & drop para reordenar columnas
- Configuración persistida en BD (tabla `table_config`: tipo, nombre, elementos, obligatorio, activo_defecto, orden, seccion)
- En Tracciona: crear tabla `table_config` + componente `<ConfigurableTable>` reutilizable. Los dealers pueden personalizar qué columnas ven en su listado de vehículos

**E) Cálculos financieros en histórico** → Integrar en Sesión 28 (historial de ventas).

- Categoría de venta: venta directa, intermediación, exportación
- Beneficio automático = precio_venta - coste_total (adquisición + mantenimiento - renta)
- Cards resumen: total ventas, total ingresos, total beneficio, margen promedio %
- Filtros por año, categoría venta, subcategoría, marca

**F) Motor de matching demanda/oferta** → Integrar en Sesión 16 (subastas) + Sesión 27 (métricas).

- Cruce automático: demands.specs vs vehicles.attributes_json
- Campo `vehiculo_match_id` para vincular manualmente
- Panel "Coincidencias" en dashboard con matches potenciales
- Alertas: "Hay 3 solicitantes que buscan lo que tú vendes"
- En Tracciona: Edge Function `match_demands()` que corre al publicar vehículo o crear demanda. Notifica por email al dealer/comprador.

**G) Generador de contratos (detalle)** → Ampliar en Sesión 31.

- Contrato de compraventa: datos vendedor/comprador, vehículo, precio, forma de pago, cláusulas (garantía, estado, responsabilidad), firmas
- Contrato de arrendamiento: datos arrendador/arrendatario, vehículo, renta mensual, duración, fianza, opción de compra, valor residual, cláusulas (mantenimiento, seguro, devolución)
- PDF con logo del dealer, datos legales, número de contrato auto-generado

**H) Gráficos de balance** → Integrar en Sesión 27 (métricas).

- Chart.js: gráfico de barras (ingresos vs gastos mensual) + gráfico circular (desglose por razón)
- Toggle barras/circular
- Desglose por razón: Venta, Alquiler, Exportación, Taller, Seguro, etc.
- En Tracciona: usar Recharts (ya disponible en React artifacts) o Chart.js para dashboard del dealer

**I) Referencia UI completa** → Para Claude Code.

- El archivo `docs/legacy/inventario-ui.md` contiene 453 elementos UI documentados (212 públicos + 241 admin)
- Usar como referencia al implementar componentes equivalentes en Tracciona
- No reimplementar 1:1, pero verificar que ninguna funcionalidad se pierda

> **REGLA para Claude Code**: Antes de cada sesión, consultar `docs/legacy/admin-funcionalidades.md` e `inventario-ui.md` del proyecto tank-iberica para verificar que no se pierde funcionalidad del admin original. Especial atención a las secciones de Balance, Histórico, Intermediación y Utilidades.

### Bloque E — Crear tabla articles (del Anexo P.5 — definición canónica)

- CREATE TABLE articles **exactamente como está en Anexo P.5** (copiar SQL literal). Incluye:
  - id, slug (UNIQUE), vertical, section ('guias'|'noticias'|'normativa'|'comparativas')
  - title JSONB, meta_description JSONB, excerpt JSONB (multiidioma)
  - cover_image_url, author, tags TEXT[], related_categories TEXT[]
  - faq_schema JSONB (para featured snippets)
  - status ('draft'|'scheduled'|'published'|'archived'), scheduled_at, published_at, updated_at, expires_at
  - seo_score INT, reading_time_minutes, views, pending_translations BOOLEAN
  - target_markets TEXT[] DEFAULT '{all}'
  - social_posted, social_post_text JSONB, social_scheduled_at
- Índices: idx_articles_section, idx_articles_scheduled, idx_articles_market (todos definidos en P.5)
- RLS: lectura pública si status='published', escritura solo admin
- El contenido largo (body) va en content_translations (tabla del Bloque C), NO en esta tabla

### Bloque F — Crear tablas de configuración (del Anexo W)

- vertical_config con TODO el schema de W.2
- activity_logs con schema de W.9
- INSERT seed de vertical_config para 'tracciona'
- RLS en ambas tablas

### Bloque G — RLS para TODAS las tablas nuevas

- Verificar que CADA tabla tiene RLS enabled y policies definidas

**Al terminar:** Ejecutar `npx supabase db push` para aplicar. Si hay errores, corregir la migración.

---

## SESIÓN 3 — Paso 2: Actualizar frontend

**Leer ANTES de escribir código:**

1. `docs/tracciona-docs/migracion/01-pasos-0-6-migracion.md (alias de compatibilidad histórica)` — Sección PASO 2
2. `docs/tracciona-docs/anexos/T-internacionalizacion-i18n.md (alias de compatibilidad histórica)` — Secciones T.5 (localizedField), T.6 (config i18n)

**Hacer:**

- Crear composable `useLocalized.ts` con `localizedField()` y `fetchTranslation()` (código en Anexo T.5)
- Crear composable `useVerticalConfig.ts` (código en Anexo W.3)
- Actualizar TODOS los componentes que referencian nombres de tabla antiguos:
  - `subcategory` → `category` (en queries, props, variables)
  - `type` → `subcategory`
  - `filter_definition` → `attribute`
  - `filters_json` → `attributes_json`
  - `.name_es` / `.name_en` → `localizedField(.name, locale)`
- Actualizar `nuxt.config.ts`: cambiar i18n strategy a `prefix_except_default` (código en Anexo T.6)
- Actualizar `useVehicles.ts`, `useFilters.ts`, `useCatalogState.ts`, `useVehicleTypeSelector.ts` con nuevos nombres
- Verificar que la app compila sin errores: `npm run build`

---

## SESIÓN 4 — Paso 3: Landing pages SEO dinámicas

**Leer ANTES de escribir código:**

1. `docs/tracciona-docs/migracion/01-pasos-0-6-migracion.md (alias de compatibilidad histórica)` — Sección PASO 3

**Hacer:**

- Crear migración `00032_active_landings.sql` (ya definida en Paso 3)
- Implementar sistema de landings dinámicas
- Normalizar marca y ubicación

---

## SESIÓN 5 — Paso 4: Routing + rutas editoriales

**Leer ANTES de escribir código:**

1. `docs/tracciona-docs/migracion/01-pasos-0-6-migracion.md (alias de compatibilidad histórica)` — Sección PASO 4
2. `docs/tracciona-docs/anexos/P-contenido-editorial.md (alias de compatibilidad histórica)` — Secciones P.1 (URLs) y P.3 (estructura)

**Hacer:**

- Actualizar routing para multi-vertical
- Crear rutas editoriales (SIN `/comunicacion/` — decisión SEO del 17 Feb):
  - `pages/guia/index.vue` → Índice de guías (/guia) — solo contenido evergreen
  - `pages/guia/[slug].vue` → Guía individual (/guia/normativa-adr-cisternas)
  - `pages/noticias/index.vue` → Índice de noticias (/noticias) — solo temporal relevante
  - `pages/noticias/[slug].vue` → Noticia individual (/noticias/nuevo-reglamento-adr-2027)
  - NOTA: Normativa y comparativas van en `/guia/` (son evergreen). No crear subsecciones separadas.
  - NOTA: Noticias temporales de eventos van a LinkedIn/WhatsApp, NO a /noticias/. Solo publicar en /noticias/ si tiene valor SEO a 3+ meses.
- Páginas placeholder con "Próximamente" es aceptable inicialmente

---

## SESIÓN 6 — Paso 5: Verificación

**Leer:**

1. `docs/tracciona-docs/migracion/01-pasos-0-6-migracion.md (alias de compatibilidad histórica)` — Sección PASO 5

**Hacer:**

- Ejecutar TODAS las verificaciones del checklist
- Confirmar que la BD, el frontend, el routing y las landings funcionan

---

## SESIÓN 7 — Paso 6: Mejoras pre-lanzamiento (ítems 1-10)

**Leer:**

1. `docs/tracciona-docs/migracion/01-pasos-0-6-migracion.md (alias de compatibilidad histórica)` — Sección PASO 6, ítems 6.1 a 6.10

**Hacer:**

- Implementar las mejoras 6.1 a 6.10 (seguridad, SEO, cache, schema, sitemap)

---

## SESIÓN 8 — Paso 6: Mejoras pre-lanzamiento (ítems 11-20)

**Leer:**

1. `docs/tracciona-docs/migracion/01-pasos-0-6-migracion.md (alias de compatibilidad histórica)` — Sección PASO 6, ítems 6.11 a 6.20
2. `docs/tracciona-docs/anexos/R-marco-legal.md (alias de compatibilidad histórica)` — Para disclaimers

**Hacer:**

- Implementar las mejoras 6.11 a 6.20 (textos, PDFs, disclaimers, errores, filtros)
- Crear componentes DisclaimerFooter.vue y DisclaimerBadge.vue
- Crear páginas /legal, /privacidad, /cookies, /condiciones (placeholder OK)

---

## SESIÓN 9 — Panel admin: Configuración de vertical

**Leer:**

1. `docs/tracciona-docs/anexos/W-panel-configuracion.md (alias de compatibilidad histórica)` — Completo

**Hacer:**

- Páginas de admin:
  - `/admin/config/branding` (W.6.1)
  - `/admin/config/navigation` (W.6.2)
  - `/admin/config/homepage` (W.6.3)
  - `/admin/config/catalog` (W.6.4) — CRUD categorías, subcategorías, atributos
  - `/admin/config/languages` (W.6.5) — checkboxes idiomas, estado traducciones
  - `/admin/config/pricing` (W.6.6)
  - `/admin/config/integrations` (W.6.7)
  - `/admin/config/emails` (W.6.8)
  - `/admin/config/editorial` (W.6.9)
  - `/admin/config/system` (W.6.10)

---

## SESIÓN 10 — Portal dealer personalizable

**Leer:**

1. `docs/tracciona-docs/anexos/W-panel-configuracion.md (alias de compatibilidad histórica)` — Secciones W.4, W.5, W.7
2. `docs/tracciona-docs/anexos/K-dealer-toolkit.md (alias de compatibilidad histórica)` — Para contexto

**Hacer:**

- Composable `useDealerTheme.ts` (W.5)
- Página `/admin/dealer/config` con toda la UI de W.7
- Portal público del dealer: se resuelve por catch-all `[...slug].vue` → URL `tracciona.com/{dealer-slug}` (sin prefijo `/dealer/`)
- Vista previa del portal del dealer

---

## SESIÓN 11 — Sistema editorial + SEO Score

**Leer:**

1. `docs/tracciona-docs/anexos/P-contenido-editorial.md (alias de compatibilidad histórica)`
2. `docs/tracciona-docs/anexos/U-publicacion-programada-calendario.md (alias de compatibilidad histórica)`

**Hacer:**

- Editor de artículos en admin con todos los campos (título JSONB, contenido, FAQ schema, excerpt, social_post_text)
- SEO Score Potenciador: **REUTILIZAR** `composables/admin/useSeoScore.ts` existente (Bloque D-TER). Ampliar con 15+ checks, panel lateral en editor — Anexo U.6
- Sistema de comentarios en artículos: **REUTILIZAR** placeholder `admin/comentarios.vue` existente. Crear tabla `comments` (article_id, user_id, content, status 'pending'|'approved'|'spam', created_at). Moderación en `/admin/comentarios`
- Cron de auto-publish (cada 15 min) — Anexo U.2
- Vista de artículos programados en admin
- Schema JSON-LD para artículos y FAQ

---

## SESIÓN 12 — Sistema de traducción

**Leer:**

1. `docs/tracciona-docs/anexos/T-internacionalizacion-i18n.md (alias de compatibilidad histórica)` — Sección T.7

**Hacer:**

- Dashboard de traducciones en `/admin/config/languages` (barra de progreso por idioma, cola pendientes)
- Botón "Traducir todo ahora" que lanza traducción manual (fase lanzamiento: Claude Code)
- Marcar fichas como `pending_translations=true` cuando se publican
- Implementar fallback chain en las páginas de detalle (fetchTranslation con fallback)

---

---

# POST-LANZAMIENTO (ejecutar después de completar sesiones 1-12)

> Las siguientes sesiones implementan funcionalidades que NO son necesarias para el lanzamiento. Solo ejecutar cuando las sesiones 1-12 estén completas y el sitio esté en producción.

---

## SESIÓN 13 — Deuda técnica diferida

**Leer:**

1. `docs/tracciona-docs/migracion/02-deuda-tecnica-diferida.md (alias de compatibilidad histórica)`

**Hacer:**

- Los 5 ítems de deuda técnica (Nominatim fallback, refactor stores, etc.)

### Deuda heredada de Tank Ibérica (Bloque D-QUINQUIES)

Estos ítems estaban pendientes en el proyecto original (docs/progreso.md (alias de compatibilidad histórica) Step 2.5, 2.17, Steps 3-6 completos) y aplican a Tracciona:

**1. Auditoría mobile-first retroactiva (sesiones 1-12):**

- Recorrer TODAS las páginas y componentes creados en sesiones 1-12
- Verificar en 360px: touch targets ≥44px, sin overflow horizontal, formularios usables
- Corregir modales que no sean bottom sheet en móvil: AuthModal, FilterBar, AdvertiseModal, DemandModal, SubscribeModal
- Patrón bottom sheet: `position: fixed; bottom: 0; border-radius: 16px 16px 0 0; max-height: 85vh; overflow-y: auto;` en `<768px`
- Verificar que `<NuxtPage keepalive>` preserva scroll y filtros al navegar entre catálogo y fichas

**2. Chat con Supabase Realtime:**

- El `useUserChat` actual usa refresco manual (herencia del chat original de Tank Ibérica)
- Migrar a Supabase Realtime: `supabase.channel('chat').on('postgres_changes', ...)` para mensajes instantáneos
- Aplicar tanto al chat usuario→admin como al chat dealer→usuario (leads)

**3. Migración de usuarios existentes de Tank Ibérica:**

- Tank Ibérica tiene usuarios registrados con contraseñas SHA-256 sin salt (en Google Sheets, ya migrados a Supabase)
- Estrategia: marcar todos como `password_reset_required = true`
- Al primer login, forzar flujo de "Recuperar contraseña" → nuevo password con bcrypt
- Script SQL: `UPDATE auth.users SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{force_password_reset}', 'true') WHERE migrated_from = 'tank-iberica';`
- En AuthModal: detectar `force_password_reset` y redirigir a cambio de contraseña

**4. Cloudinary provider para @nuxt/image:**

- El módulo `@nuxt/image` está en nuxt.config.ts pero verificar que el provider Cloudinary esté configurado con transformaciones automáticas
- Configurar: `image: { cloudinary: { baseURL: 'https://res.cloudinary.com/CLOUD_NAME/image/upload/' } }`
- Verificar que `<NuxtImg>` genera WebP automático, lazy loading, y srcset responsive

**5. Design system (tokens.css):**

- Tank Ibérica tenía `DESIGN_SYSTEM.md` con paleta completa, tipografía, espaciado, breakpoints
- Tracciona hace rebranding pero los tokens son útiles como estructura:
  - Verificar que `assets/css/tokens.css` tiene variables CSS para: colores primario/secundario/acento, tipografía (Inter), spacing (escala 4px), breakpoints mobile-first, touch targets 44px
  - Si no existe o está incompleto, crear basándose en el DESIGN_SYSTEM.md original pero con colores Tracciona
  - Reset global: box-sizing border-box, font-size 18px base, line-height 1.6

**6. Crear CLAUDE.md + .claude/commands/ + .claude/skills/ (Regla 8):**

- Si no se han creado aún, esta sesión es el momento de hacerlo
- Ver detalle en Regla 8 de las reglas obligatorias

---

## SESIÓN 14 — Post-lanzamiento Fase 1: Primeras semanas

**Leer:**

1. `docs/tracciona-docs/migracion/03-roadmap-post-lanzamiento.md (alias de compatibilidad histórica)` — Sección PASO 7
2. `docs/tracciona-docs/anexos/K-dealer-toolkit.md (alias de compatibilidad histórica)`
3. `docs/tracciona-docs/anexos/E-sistema-pro.md (alias de compatibilidad histórica)`

**Hacer:**

- Dealer Toolkit básico (homepage dealer, QR dinámico, tarjetas PDF)
- Sistema de suscripciones (Free/Basic/Premium/Founding)
- Widget de WhatsApp publishing (si aplica)

---

## SESIÓN 15 — Verificación de vehículos, API DGT y Km Score

**Leer:**

1. `docs/tracciona-docs/anexos/G-verificacion-carfax.md (alias de compatibilidad histórica)` — Completo
2. `docs/tracciona-docs/anexos/R-marco-legal.md (alias de compatibilidad histórica)` — Sección R.1 (disclaimers de verificación)

**Hacer:**

### UI del dealer para subir documentos de verificación

- En `/dashboard/vehiculos/[id].vue` (edición de vehículo):
  - Sección "Documentación y verificación" con lista de documentos según el nivel objetivo
  - Upload de documentos a Cloudinary (PDF/imagen)
  - Cada documento tiene: tipo, archivo, estado (pending/approved/rejected)
  - Mostrar nivel actual y qué falta para subir al siguiente nivel
  - Barra de progreso visual: ✓ → ✓✓ → ✓✓✓ → ★ → 🛡

### UI del admin para gestionar verificaciones

- Página `/admin/verificaciones` con cola de documentos pendientes de revisión
- Filtrar por estado, dealer, tipo de documento
- Vista detalle: foto del documento + datos declarados del vehículo al lado
- Botones: Aprobar / Rechazar (con motivo)
- Al aprobar todos los docs de un nivel → auto-actualizar `vehicles.verification_level`

### Análisis automático con Claude Vision (niveles ✓ automático)

- Edge Function `/api/verify-document`
- Recibe: imagen del documento + datos declarados del vehículo
- Claude Vision extrae: marca, modelo, matrícula, km, MMA, ejes
- Compara con datos declarados en el anuncio
- Si coinciden → auto-approve (nivel ✓ sin intervención humana)
- Si hay discrepancia → flag para revisión manual del admin
- Composable `useVehicleVerification.ts` reutilizable para todos los verticales

### Integración API DGT/InfoCar (nivel ★ Auditado)

- Server route `/server/api/dgt-report.post.ts`
- Proveedor recomendado: InfoCar (API REST, datos DGT directos, 2-4€/consulta)
- Alternativa manual: consulta sede electrónica DGT con certificado digital (si <20 informes/mes)
- Flujo: comprador/vendedor paga (Stripe one-time) → API consulta → Claude analiza → PDF generado
- Datos obtenidos: primera matriculación, titulares, historial ITVs con km, cargas/embargos, seguro
- Guardar informe en `verification_documents` + actualizar `verification_level` a 'audited'
- **Patrón adaptable:** Server route acepta parámetro `provider` para poder cambiar de InfoCar a Carvertical u otro sin tocar el frontend

### Km Score (algoritmo + visualización)

- Función `analyzeKmReliability(itvHistory)`: analiza progresión de km entre ITVs
  - Km que bajan → FRAUDE (0-20)
  - Km suben demasiado rápido → SOSPECHOSO (30-50)
  - Progresión lineal consistente → FIABLE (80-100)
- Componente `<KmScoreBadge>` en ficha del vehículo: barra 0-100, label, explicación breve
- Score gratuito como badge. Informe completo de pago (25-50€)
- **Adaptable a otros verticales:** `analyzeUsageReliability(history, unit)` donde unit = 'km' | 'hours' | 'cycles'

### Inspección física (🛡 Certificado)

- Formulario de solicitud de inspección (comprador o vendedor)
- Pago vía Stripe (200-500€ según vertical/tipo)
- Admin recibe notificación → coordina con mecánico inspector
- Checklist estándar de 30 puntos (configurable por vertical en admin)
- Claude genera informe PDF desde checklist + fotos del inspector
- Guardar en `verification_documents` + actualizar nivel

### Disclaimers automáticos

- Componente `<VerificationDisclaimer>` que se muestra junto a cada badge
- Textos del Anexo R.1 integrados

---

## SESIÓN 16 — Subastas online

**Leer:**

1. `docs/tracciona-docs/anexos/H-subastas.md (alias de compatibilidad histórica)` — Completo
2. `docs/tracciona-docs/anexos/E-sistema-pro.md (alias de compatibilidad histórica)` — Sección E.5 (alertas Pro para subastas)

**Hacer:**

### Tablas SQL

- Crear tabla `auctions` completa del Anexo H.3 (vertical, vehicle_id, starting_price, reserve_price, bid_increment, buyers_premium_pct, deposit, starts_at, ends_at, anti_snipe_seconds, extended_until, status, winner_id)
- Crear tabla `bids` (auction_id, user_id, amount_cents, created_at)
- Crear tabla `auction_registrations` del Anexo H.2 (user_id, auction_id, id_type, id_number, id_document_url, deposit via Stripe PaymentIntent manual capture)
- RLS: subastas públicas de lectura, pujas solo propietario lee, admin todo
- Trigger `validate_bid()` del Anexo H.3: valida que subasta está live, usuario registrado con depósito, puja > actual + incremento, anti-sniping
- Añadir a vehicles: `auto_auction_after_days INT`, `auto_auction_starting_pct DECIMAL`

### Páginas públicas

- `/subastas` — Listado de subastas: programadas, en vivo, finalizadas
- `/subastas/[id]` — Detalle de subasta con componente `<AuctionBidPanel>`
  - Countdown en tiempo real (cada segundo)
  - Puja actual, total pujas, pujadores
  - Historial de pujas (Supabase Realtime: INSERT en bids)
  - Extensión anti-sniping visual
  - Botón "Regístrate para pujar" si no registrado
  - Botones de puja rápida (mínima, +500€, +1000€)
  - Buyer's premium visible: "Precio final = puja + 8%"
  - Usuario no registrado ve panel en modo lectura

### Registro de pujador

- Formulario: DNI/CIF + foto documento + datos fiscales
- Depósito vía Stripe PaymentIntent con `capture_method: 'manual'` (retiene sin cobrar)
- Admin aprueba o auto-aprobación si DNI ya verificado
- Post-subasta: ganador → capture, perdedores → cancel

### Admin

- `/admin/subastas` — CRUD de subastas (crear, editar, cancelar, adjudicar)
- `/admin/subastas/[id]` — Detalle con lista de registrados, pujas, adjudicar manualmente si reserve no alcanzado

### Flujo automático marketplace → subasta

- Cron diario: vehículos con `auto_auction_after_days` expirado → crear subasta automáticamente
- Notificar al vendedor + suscriptores Pro con demandas que matcheen

### Disclaimers de subasta

- Texto del Anexo R.1 ("los vehículos se venden tal cual")
- Buyer's premium no reembolsable
- Puja = compromiso vinculante

---

## SESIÓN 16b — Publicidad + AdSense + Sistema Pro 24h + Google Ads

**Leer:**

1. `docs/tracciona-docs/anexos/F-publicidad-directa.md (alias de compatibilidad histórica)` — Completo
2. `docs/tracciona-docs/anexos/J-adsense-google-ads.md (alias de compatibilidad histórica)` — Completo
3. `docs/tracciona-docs/anexos/E-sistema-pro.md (alias de compatibilidad histórica)` — Secciones E.2 y E.4 (visible_from + UX conversión)

**Hacer:**

---

### 1. TABLA DE ANUNCIANTES Y ANUNCIOS

```sql
CREATE TABLE advertisers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  logo_url TEXT,              -- Logo del anunciante (Cloudinary)
  website TEXT,
  tax_id VARCHAR,             -- CIF/NIF
  billing_address TEXT,
  status VARCHAR DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES advertisers(id),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  -- Contenido del anuncio
  title TEXT,                 -- "Taller García - Reparación de cisternas"
  description TEXT,           -- 1-2 líneas
  image_url TEXT,             -- Banner/imagen (Cloudinary)
  logo_url TEXT,              -- Si NULL, hereda de advertisers.logo_url
  link_url TEXT NOT NULL,
  phone TEXT,                 -- Teléfono visible en el anuncio (opcional)
  email TEXT,                 -- Email visible en el anuncio (opcional)
  cta_text VARCHAR DEFAULT 'Más info',
  -- Segmentación geográfica multinivel
  countries TEXT[] DEFAULT '{ES}',    -- '{ES}', '{ES,PT}', '{all}'
  regions TEXT[] DEFAULT '{}',        -- CCAA: '{aragon,cataluna}' o vacío=todas
  provinces TEXT[] DEFAULT '{}',      -- '{zaragoza,huesca}' o vacío=todas
  -- Segmentación por contenido
  category_slugs TEXT[] DEFAULT '{}', -- '{cisternas,semirremolques}' o vacío=todas
  action_slugs TEXT[] DEFAULT '{}',   -- '{venta,alquiler}' o vacío=todas
  -- Posiciones
  positions TEXT[] NOT NULL,          -- ver mapa de 10 posiciones abajo
  format VARCHAR DEFAULT 'card',      -- 'card'|'banner'|'text'|'logo_strip'
  -- Contrato
  price_monthly_cents INT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  -- Canales extra
  include_in_pdf BOOLEAN DEFAULT false,
  include_in_email BOOLEAN DEFAULT false,
  -- Estado
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ad_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id),
  event_type VARCHAR NOT NULL, -- 'impression','click','phone_click','email_click','pdf_impression','email_impression'
  user_country VARCHAR,
  user_region VARCHAR,
  user_province VARCHAR,
  page_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ads_active ON ads(status, vertical) WHERE status = 'active';
CREATE INDEX idx_ads_geo ON ads USING GIN(countries, regions, provinces);
CREATE INDEX idx_ads_positions ON ads USING GIN(positions);
CREATE INDEX idx_ad_events_ad ON ad_events(ad_id, event_type);
CREATE INDEX idx_ad_events_date ON ad_events(created_at);
```

-- Sistema de regiones internacionales (escala a cualquier país)
CREATE TABLE geo_regions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
country_code VARCHAR(2) NOT NULL, -- 'ES', 'PT', 'FR', 'DE', 'UK', etc.
region_level VARCHAR NOT NULL, -- 'country', 'region', 'province' (o equivalente local)
region_slug VARCHAR NOT NULL, -- 'aragon', 'ile_de_france', 'bayern'
region_name JSONB NOT NULL, -- {"es": "Aragón", "en": "Aragon", "fr": "Aragon"}
parent_slug VARCHAR, -- NULL para país, 'aragon' para provincia de Aragón
postal_code_pattern VARCHAR, -- '50\_\_\_' para Zaragoza (para matching por CP)
latitude DECIMAL(9,6),
longitude DECIMAL(9,6),
sort_order INT DEFAULT 0,
UNIQUE(country_code, region_slug)
);

CREATE INDEX idx_geo_country ON geo_regions(country_code, region_level);
CREATE INDEX idx_geo_parent ON geo_regions(parent_slug);

-- Seed inicial: España (17 CCAA + 52 provincias)
-- Cuando se active un nuevo mercado (ej: Francia), añadir:
-- INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug)
-- VALUES ('FR', 'region', 'ile_de_france', '{"es":"Isla de Francia","en":"Ile-de-France","fr":"Île-de-France"}', NULL),
-- ('FR', 'province', 'paris', '{"es":"París","en":"Paris","fr":"Paris"}', 'ile_de_france');
-- Esto habilita automáticamente publicidad geolocalizada en Francia
-- sin tocar código — solo INSERT de datos.

````

> **NOTA:** Estas tablas (advertisers, ads, ad_events, geo_regions) deben añadirse al Bloque D de la sesión 2 si aún no existen.
> El sistema geo_regions permite que al activar un nuevo mercado (Francia, Alemania, Portugal...) la publicidad geolocalizada funcione automáticamente: los anunciantes de ese país se segmentan por sus regiones/provincias nativas, y los anuncios se muestran a usuarios de esa zona. No requiere cambio de código, solo insertar las regiones del nuevo país.

### 2. COMPOSABLE useAds.ts — LÓGICA DE MATCHING GEOLOCALIZADA

```typescript
// useAds(position: string, category?: string, action?: string, vehicleLocation?: string)
//
// Determinar geo del usuario (cascada de prioridad):
//   1. Si se está viendo un vehículo → usar ubicación del vehículo (más relevante para el anunciante)
//   2. Si el usuario está logueado con ubicación guardada → usar esa
//   3. Cloudflare headers: CF-IPCountry + CF-IPCity → mapear a región/provincia
//   4. Fallback: país=ES, región/provincia=vacío (recibe anuncios nacionales)
//
// Query: SELECT * FROM ads WHERE status='active'
//   AND position @> ARRAY[props.position]
//   AND (countries = '{all}' OR countries @> ARRAY[user_country])
//   AND (regions = '{}' OR regions @> ARRAY[user_region])
//   AND (provinces = '{}' OR provinces @> ARRAY[user_province])
//   AND (category_slugs = '{}' OR category_slugs @> ARRAY[category])
//   ORDER BY RANDOM() LIMIT maxAds
//
// Registrar impresión (INSERT ad_events type='impression')
// Al clic en link: INSERT type='click' + navegar
// Al clic en teléfono: INSERT type='phone_click' + tel: link
// Al clic en email: INSERT type='email_click' + mailto: link
````

### 3. MAPA COMPLETO DE 10 POSICIONES DE ANUNCIO

```
POS  NOMBRE              DÓNDE                          FORMATO        MAX  ADENSE FALLBACK
────────────────────────────────────────────────────────────────────────────────────────────
 1   pro_teaser          Catálogo: arriba del todo       banner/CTA     1    NO (es del sistema)
 2   catalog_inline      Catálogo: cada 8-10 resultados  card           1    SÍ
 3   sidebar             Landings + Artículos: derecha   card           2    SÍ
 4   search_top          Catálogo: arriba de resultados  card           1    NO (premium, 300-500€)
 5   vehicle_services    Ficha: bajo specs               card           2    NO (premium, 200-400€)
 6   dealer_portal       Portal dealer: cada 8 veh.      card           1    SÍ (si dealer no Premium)
 7   landing_sidebar     Landing SEO: derecha desktop    banner         2    SÍ
 8   article_inline      Artículos: entre párrafos 2-3   banner/text    1    SÍ
 9   email_footer        Emails alertas: antes footer    card           1    NO (no AdSense en email)
10   pdf_footer          PDFs generados: pie página      logo_strip     1    NO (no AdSense en PDF)
```

**Reglas anti-intrusión:**

- Máximo 2 anuncios visibles simultáneamente en cualquier vista
- Posición 6 (portal dealer) NO aparece si el dealer tiene plan Premium o Founding
- Posición 1 (pro_teaser) solo aparece si HAY vehículos ocultos en 24h para esa búsqueda
- NUNCA anuncios en: botón de contacto, registro/login, formulario de publicación, panel admin, subasta en vivo, checkout/pago
- En móvil: sidebar (pos 3, 7) se convierte en inline intercalado después del resultado 4

### 4. MOCKUPS POR PÁGINA

**CATÁLOGO PRINCIPAL (`/cisternas`, `/semirremolques`, etc.):**

```
┌─────────────────────────────────────────────────────────────┐
│ Filtros [categoría] [precio] [año] [marca] [zona]          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ POS 4: SEARCH_TOP (anuncio premium arriba de resultados)    │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ Patrocinado · [Logo] Financiera ABC                      │ │
│ │ Financiación de vehículos industriales desde 3,5% TAE    │ │
│ │ 📞 900 123 456  [Solicitar info →]                       │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                             │
│ POS 1: PRO_TEASER (solo si hay vehículos ocultos en 24h)    │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ 🔒 3 vehículos nuevos coinciden con tu búsqueda         │ │
│ │ Los suscriptores Pro ya los están viendo              │ │
│ │ [Hazte Pro — 29€/mes]  [Pase 72h — 9,99€]            │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                             │
│ [Vehículo 1] [Vehículo 2] [Vehículo 3] [Vehículo 4]       │
│ [Vehículo 5] [Vehículo 6] [Vehículo 7] [Vehículo 8]       │
│                                                             │
│ POS 2: CATALOG_INLINE (cada 8-10 resultados)               │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ Patrocinado · [Logo] Taller García                     │ │
│ │ Reparación de cisternas en Zaragoza                   │ │
│ │ 📞 976 123 456  ·  [Ver más →]                        │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                             │
│ [Vehículo 9] ... [Vehículo 16]                               │
│                                                             │
│ POS 3: SIDEBAR (desktop derecha, móvil=inline tras item 4)  │
│ Máx 2 anuncios: logo + nombre + 1 línea + teléfono         │
└─────────────────────────────────────────────────────────────┘
```

**FICHA DE VEHÍCULO (`/vehiculo/[slug]`):**

```
┌─────────────────────────────────────────────────────────────┐
│ [Galería de fotos]                                          │
│ Cisterna Indox Alimentaria 3 ejes 2019                     │
│ 42.000€ · Zaragoza · ✓✓ Verificado                          │
│                                                             │
│ [Especificaciones técnicas]                                 │
│                                                             │
│ ┌─ TARJETA DEL DEALER (NO es anuncio, es nativo) ────────┐  │
│ │ [Logo] Transportes García  🏅 Founding Dealer           │  │
│ │ [📞 Llamar]  [💬 WhatsApp]  [✉️ Contactar]             │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ 🚛 Transporte puerta a puerta (componente, no anuncio)      │
│ [Calcular transporte a tu zona]                             │
│                                                             │
│ POS 5: VEHICLE_SERVICES (anuncios premium geolocalizados)   │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ Servicios recomendados en Aragón                        │ │
│ │ [Logo] Seguros Martínez     [Logo] Taller ITV Plus     │ │
│ │ Seguros industriales       ITV + reparación            │ │
│ │ 📞 976 111 222              📞 976 333 444              │ │
│ │ Patrocinado                Patrocinado                │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                             │
│ [Descripción] ... [Km Score] ... [Vehículos similares]      │
│ 👥 3 personas han contactado · 12 en favoritos              │
└─────────────────────────────────────────────────────────────┘
```

**PORTAL DEALER (`tracciona.com/{dealer-slug}` vía catch-all):**

```
┌─────────────────────────────────────────────────────────────┐
│ [Cover + Logo] Transportes García  🏅 Founding Dealer       │
│ [V1] [V2] [V3] [V4] [V5] [V6] [V7] [V8]                  │
│                                                             │
│ POS 6: DEALER_PORTAL_INLINE (después de 8 vehículos)       │
│ Solo 1 anuncio. NO si el dealer es Premium/Founding.        │
│ Geo = ubicación del dealer (no del visitante)               │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ Patrocinado · [Logo] Neumáticos Europa                  │ │
│ │ Neumáticos para cisternas y remolques                  │ │
│ │ 📞 976 555 666  ·  [Ver más →]                        │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                             │
│ [V9] [V10] ... más vehículos                                │
└─────────────────────────────────────────────────────────────┘
```

**EMAILS ALERTA (sesión 18):**

```
┌─────────────────────────────────────────────────────────────┐
│ Nuevos vehículos que coinciden con tu búsqueda:             │
│ [Vehículo 1] [Vehículo 2] [Vehículo 3]                     │
│                                                             │
│ POS 9: EMAIL_FOOTER (antes del footer, 1 anuncio)           │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ [Logo] Neumáticos Europa — Zaragoza                    │ │
│ │ Neumáticos para cisternas · neumaticoseuropa.es        │ │
│ │ 📞 976 555 666                                          │ │
│ └───────────────────────────────────────────────────────┘ │
│ La geo para el email = ubicación del usuario destinatario   │
│ [Footer: desactivar alerta | preferencias]                  │
└─────────────────────────────────────────────────────────────┘
```

**PDFs GENERADOS (sesión 31: factura, presupuesto, catálogo, ficha):**

```
┌─────────────────────────────────────────────────────────────┐
│ [PDF ficha/catálogo/presupuesto]                             │
│ Fotos + Specs + Precio + QR + Datos dealer                  │
│                                                             │
│ POS 10: PDF_FOOTER (pie de página, 1 anuncio logo_strip)    │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ Partner: [Logo] Taller ITV Plus — Zaragoza — 976 333 444│ │
│ └───────────────────────────────────────────────────────┘ │
│ Geo del PDF = ubicación del vehículo (siempre conocida)      │
│ Si el usuario está logueado, usar también su ubicación      │
└─────────────────────────────────────────────────────────────┘
```

### 5. SISTEMA PRO 24h EN EL CATÁLOGO (del Anexo E)

Implementar `visible_from` en vehicles y la lógica de filtrado:

- Al publicar vehículo: `visible_from = NOW() + INTERVAL '24 hours'`
- Query catálogo público (usuario gratuito/anónimo):
  - `WHERE status='published' AND visible_from <= NOW()`
- Query catálogo Pro (usuario con suscripción activa):
  - `WHERE status='published'` (sin filtro visible_from)
- Sitemap: NO incluir vehículos en periodo exclusivo Pro (Google no debe indexar antes)

**Componente `<ProTeaser>` (posición 1):**

- Query: contar vehículos con `visible_from > NOW()` que matcheen los filtros actuales del catálogo
- Si count > 0 y usuario NO es Pro:
  ```
  ┌───────────────────────────────────────────────────────┐
  │ 🔒 {count} vehículos nuevos coinciden con tu búsqueda  │
  │ Los suscriptores Pro ya los están viendo              │
  │ [Hazte Pro — 29€/mes]  [Pase 72h — 9,99€]            │
  └───────────────────────────────────────────────────────┘
  ```
- El count es REAL, no fake. Si no hay vehículos ocultos, no se muestra nada.
- El count se filtra según los filtros activos del catálogo (categoría, precio, zona, marca). Ejemplo: si el usuario filtró "cisternas alimentarias en Aragón < 50.000€" y hay 2 cisternas alimentarias en Aragón < 50.000€ publicadas hace 12h, dice "2 vehículos".

**Si el usuario llega por URL directa a un vehículo en periodo exclusivo:**

- No mostrar la ficha
- Mostrar:
  ```
  Este vehículo estará disponible en {horas}h
  Los suscriptores Pro ya pueden verlo
  [Ver ahora con Pase 72h — 9,99€]  [Suscribirme a Pro — 29€/mes]
  ```
- Si el usuario es Pro → mostrar la ficha normalmente

### 6. COMPONENTES

**`<AdSlot>` — Anuncio directo:**

- Props: position, category, action, vehicleLocation, maxAds (default 1)
- Usa useAds.ts para obtener anuncios geolocalizados
- Renderiza según format: card (logo+title+desc+phone+CTA), banner (solo imagen), text (texto+link), logo_strip (logo pequeño+nombre+tel)
- Badge "Patrocinado" siempre visible
- Registra eventos (impression, click, phone_click, email_click)

**`<AdSenseSlot>` — Con fallback:**

- Props: position, category, format ('horizontal'|'vertical'|'rectangle'|'in-feed')
- Lógica:
  1. Llamar useAds() para esa posición
  2. Si hay anuncio directo → renderizar `<AdSlot>` (prioridad SIEMPRE)
  3. Si NO hay → renderizar bloque AdSense
- Lazy loading con IntersectionObserver (cargar AdSense solo cuando entra en viewport)
- AdSense NO en posiciones 1, 4, 5, 9, 10 (ver tabla de posiciones)

**`<ProTeaser>` — Banner Pro 24h:**

- Props: filters (los filtros activos del catálogo)
- Query: COUNT vehicles WHERE visible_from > NOW() AND matchean filtros
- Si count > 0 y usuario no Pro → mostrar banner
- Si count = 0 o usuario Pro → no renderizar nada

### 7. ADMIN DE PUBLICIDAD

`/admin/publicidad`:

- **Anunciantes:** CRUD con logo, datos contacto, datos fiscales
- **Anuncios:** CRUD con preview de cómo se verá el anuncio en cada posición
  - Mapa visual para configurar geo: seleccionar país → regiones → provincias
  - Selector múltiple de posiciones con preview
  - Selector de categorías
  - Toggle include_in_pdf / include_in_email
- **Dashboard:** Impresiones y clics por anunciante, por posición, por región
  - Gráfico de rendimiento temporal
  - CTR por posición (para pitch comercial: "tu anuncio en fichas de cisternas tiene 4,2% CTR")
  - Exportar informe mensual PDF por anunciante (para enviar como justificación de pago)

### 8. LÓGICA GEO PARA PDFs Y EMAILS

**Para PDFs (posición 10):**

- Server route de generación de PDF recibe `vehicleId` + opcionalmente `userId`
- Geo primaria = ubicación del vehículo (siempre disponible)
- Geo secundaria = ubicación del usuario (si logueado)
- Query ads WHERE include_in_pdf=true AND geo matches
- Si hay match → añadir al pie del PDF: logo + nombre + teléfono + web
- Si no hay match → pie genérico de Tracciona
- Registrar ad_event type='pdf_impression'

**Para emails (posición 9):**

- La Edge Function de envío de emails (sesión 18) recibe `userId`
- Geo = ubicación del usuario destinatario
- Query ads WHERE include_in_email=true AND geo matches
- Insertar bloque HTML del anuncio antes del footer del email
- Registrar ad_event type='email_impression'
- El link del anuncio en email lleva UTM: `?utm_source=email&utm_medium=alert&utm_campaign=ad_{ad_id}`

### 9. GOOGLE ADS + TRACKING

- Instalar pixel Google Ads (gtag) en nuxt.config.ts
- Configurar conversiones:
  - `contact_dealer` → usuario contacta por teléfono/WhatsApp/formulario
  - `request_transport` → solicita transporte
  - `register` → se registra
  - `subscribe_pro` → se suscribe a Pro
  - `bid` → puja en subasta
- Eventos gtag: view_item, search, generate_lead, begin_checkout
- Audiencias de remarketing: visitors que vieron fichas sin contactar, visitors de subastas que no pujaron

### 10. GOOGLE MERCHANT CENTER

- Server route `/server/api/merchant-feed.get.ts` → feed XML
- Campos: title, description, link, image_link, price, availability, condition='used'
- Solo vehículos con visible_from <= NOW() (no incluir los que están en 24h Pro)
- Registrar en Google Merchant Center para listados gratuitos en Shopping

---

## SESIÓN 16c — Transporte, flujo post-venta y frescura del catálogo

**Leer:**

1. `docs/tracciona-docs/anexos/G-BIS-transporte.md (alias de compatibilidad histórica)` — Completo
2. `docs/tracciona-docs/anexos/L-flujo-post-venta.md (alias de compatibilidad histórica)` — Completo

**Hacer:**

### Calculadora de transporte (Anexo G-BIS)

- Tabla `transport_zones` (vertical, zone_name, zone_slug, price_cents, regions[])
- Seed con zonas de Tracciona: local, norte, centro, sur, Portugal, Francia sur
- Tabla `transport_requests` (vehicle_id, buyer_id, origin_zone, destination_zone, destination_postal_code, price_cents, status 'requested'|'confirmed'|'completed'|'cancelled', created_at)
- Componente `<TransportCalculator>` en ficha de vehículo:
  - Obtiene ubicación del vehículo (ya en vehicle.location)
  - Input: "Tu código postal" (o auto-detect con useUserLocation)
  - Calcula zona destino → muestra precio cerrado
  - Botón "Solicitar transporte" → INSERT en transport_requests + notificar admin
- Admin: vista de transport_requests en panel
- Configurable por vertical en admin (zonas y precios editables)

### Flujo post-venta (Anexo L)

- Botón "Marcar como vendido" en `/dashboard/vehiculos`:
  - Pantalla de felicitación: "🎉 ¡Enhorabuena!"
  - Pregunta: "¿Se vendió a través de Tracciona?" (para métricas)
  - Cross-sell de servicios con un solo clic:
    - 🚛 Transporte (precio cerrado según zona)
    - 📄 Gestión transferencia (250€)
    - 🛡 Seguro (presupuesto en 24h)
    - 📋 Contrato de compraventa (GRATIS, genera desde sesión 31)
  - Sugerencia: "¿Tienes otro vehículo para publicar?"
- Email automático al comprador (si hay lead vinculado) con servicios post-venta
- Enlace compartible `/servicios-postventa?v=[slug]` para que el dealer envíe por WhatsApp

### Frescura del catálogo (Anexo L)

- Cron cada 30 días: para vehículos publicados sin edición:
  - WhatsApp/email al dealer: "¿Tu [vehículo] sigue disponible?"
  - Si responde SÍ → `updated_at = NOW()` (renueva frescura SEO)
  - Si responde NO → `status = 'sold'` + trigger flujo post-venta
  - Sin respuesta en 7 días → segundo aviso
  - Sin respuesta en 14 días → `status = 'paused'`
- Auto-despublicación: vehículos >90 días sin actualizar → `status = 'expired'`
  - Notificar: "Lo hemos pausado. [Renovar] [Marcar vendido] [Pasar a subasta]"

### Servicios de partners (derivación)

- Tabla `service_requests` (type 'transfer'|'insurance'|'inspection'|'transport', vehicle_id, user_id, status, partner_notified_at)
- Al solicitar servicio → notificar al partner correspondiente (email)
- Comisión por derivación: seguros 15-25%, transferencias fijo 50-80€
- Admin: vista de service_requests

---

## SESIÓN 16d — Automatización: scraping captación + auto-publicación redes sociales

**Leer:**

1. `docs/tracciona-docs/anexos/I-automatizacion-ia.md (alias de compatibilidad histórica)` — Secciones I.2 y I.3

**Hacer:**

### Scraping de competidores para captación (Anexo I.2)

- Script `/scripts/scrape-competitors.ts` (ejecutar manualmente o cron semanal)
- Scrapear: Mascus.es, Europa-Camiones.com, Milanuncios (cat. vehículos industriales), Autoline.es
- Para cada vendedor profesional detectado con >5 anuncios: extraer nombre, teléfono, email, ubicación, nº anuncios, tipos de vehículos
- Tabla `dealer_leads` del Anexo I.2 (source, company_name, phone, email, status 'new'→'contacted'→'interested'→'onboarding'→'active'→'rejected')
- Admin: `/admin/captacion` con lista de leads, asignar a persona, registrar notas de llamada
- Deduplicación por nombre + fuente
- **Nota legal:** Scraping de datos públicos está permitido en la UE (CJEU C-30/14). No scrapear datos personales sin legitimidad.

### Auto-publicación en redes sociales (Anexo I.3)

- Tabla `social_posts` del Anexo I.3 (vehicle_id, platform 'linkedin'|'facebook'|'instagram', content, image_url, status 'pending'|'approved'|'published', published_at)
- Trigger post-INSERT en vehicles (status='published'):
  1. Claude Haiku genera texto adaptado a cada plataforma
  2. Selecciona mejor foto
  3. INSERT en social_posts con status='pending'
- Admin: `/admin/social` con cola de posts pendientes. Botón aprobar/editar/rechazar
- Al aprobar: publicar vía API de cada plataforma
  - **LinkedIn:** POST api.linkedin.com/v2/ugcPosts (OAuth2 de empresa)
  - **Facebook:** POST graph.facebook.com/v18.0/{page_id}/feed (Page token)
  - **Instagram:** vía Facebook Graph API (requiere cuenta business)
- Composable `useSocialPublisher.ts` con método `publish(platform, content, imageUrl)`
- **Patrón adaptable:** Cada plataforma tiene un adapter. Añadir nueva plataforma = crear nuevo adapter sin tocar el resto.
- Configuración de OAuth tokens en `vertical_config.social_tokens` (JSONB)

---

## SESIÓN 17 — Pasarela de pago (Stripe)

**Leer:**

1. `docs/tracciona-docs/anexos/E-sistema-pro.md (alias de compatibilidad histórica)` — Tiers de suscripción
2. `docs/tracciona-docs/anexos/D-monetizacion.md (alias de compatibilidad histórica)` — 16 fuentes de ingreso
3. `docs/tracciona-docs/anexos/H-subastas.md (alias de compatibilidad histórica)` — Buyer premium y depósitos

**Hacer:**

- Instalar `stripe` y `@stripe/stripe-js`
- **NO crear tabla `subscriptions`** — ya creada en sesión 2 Bloque D (definición canónica en Anexo E.2: user_id, vertical, plan, status, price_cents, started_at, expires_at, stripe_subscription_id, stripe_customer_id). Solo verificar que existe y añadir `stripe_customer_id` si no está.
- Crear tabla `payments` (id, user_id, vertical, type, amount_cents, stripe_payment_intent_id, status, created_at)
- Implementar Stripe Checkout para suscripciones dealer (Free→Basic→Premium)
- Implementar webhook `/api/stripe/webhook` para:
  - `checkout.session.completed` → activar suscripción
  - `invoice.payment_succeeded` → renovar
  - `invoice.payment_failed` → notificar + grace period
  - `customer.subscription.deleted` → downgrade a Free
- Página `/precios` con comparativa de planes y botón "Suscribirse"
- En admin dealer: ver estado de suscripción, facturas, cambiar plan
- Para subastas: Stripe Payment Intents para depósitos + cobro buyer premium
- Comisiones por verificación: cobro puntual via Stripe
- **Stripe Connect** (para comisión de intermediación 3-5% del Anexo D):
  - Modo "destination charges" (el más simple para marketplace)
  - Server route `/server/api/stripe-connect-onboard.post.ts`: crea connected account para dealer
  - Tabla `dealer_stripe_accounts` (dealer_id, stripe_account_id, onboarding_completed, charges_enabled)
  - Cuando hay venta intermediada: cobrar al comprador, retener comisión, transferir resto al dealer
  - El % de comisión se lee de `vertical_config` (adaptable por vertical)
  - Dashboard admin: transacciones intermediadas, comisiones cobradas
- En `/admin/config/pricing`: los precios de vertical_config se sincronizan con Stripe Products

---

## SESIÓN 18 — Sistema completo de emails automáticos

**Leer:**

1. `docs/tracciona-docs/anexos/W-panel-configuracion.md (alias de compatibilidad histórica)` — Sección W.6.8 (templates de email)
2. `docs/tracciona-docs/anexos/D-monetizacion.md (alias de compatibilidad histórica)` — Fuentes de ingreso que generan emails
3. `docs/tracciona-docs/anexos/K-dealer-toolkit.md (alias de compatibilidad histórica)` — Comunicación dealer

**Hacer:**

### Infraestructura

- Integrar Resend (3.000 emails/mes gratis, buen deliverability, API simple)
- Crear Edge Function `/api/email/send` que:
  - Lee el template de `vertical_config.email_templates`
  - Sustituye variables ({{dealer_name}}, {{vehicle_title}}, {{vertical_name}}, etc.)
  - Aplica colores del vertical al template HTML (desde vertical_config.theme)
  - Envía via Resend API
- Tabla `email_logs` (id, vertical, to, template_key, variables JSONB, status, sent_at, opened_at, clicked_at, error)
- Tabla `email_preferences` (user_id, email_type, enabled BOOLEAN) — el usuario controla qué recibe
- Tabla `search_alerts` (id, user_id, name, filters JSONB, frequency, last_sent_at, active)

### Emails para DEALERS (B2B)

1. **Bienvenida** — Al registrarse como dealer. Incluye: link a su portal, guía rápida, contacto soporte
2. **Nuevo lead recibido** — Cuando un comprador contacta por un vehículo. Incluye: nombre, email, teléfono del interesado, vehículo concreto, link directo
3. **Vehículo publicado** — Confirmación de que el vehículo está online. Incluye: link a la ficha, SEO score, sugerencias de mejora
4. **Vehículo vendido** — Cuando se marca como vendido. Incluye: estadísticas (días publicado, visitas, leads recibidos)
5. **Resumen semanal** — Cron dominical. Incluye: visitas totales, leads nuevos, vehículos más vistos, comparativa con semana anterior
6. **Resumen mensual** — Cron primer día del mes. Incluye: métricas del mes, posición en ranking de dealers, ROI estimado
7. **Suscripción activada/renovada** — Confirmación con factura adjunta
8. **Suscripción por vencer** — 7 días antes de expirar. CTA para renovar
9. **Pago fallido** — Intento de cobro falló. Link para actualizar tarjeta. Grace period de 7 días
10. **Suscripción cancelada** — Confirmación + lo que pierden al bajar a Free
11. **Verificación completada** — Informe listo. Link para ver/descargar
12. **Subasta: registro confirmado** — Depósito recibido, detalles de la subasta
13. **Subasta: comienza en 24h** — Recordatorio con link directo
14. **Subasta: finalizada** — Resultado (vendido/no vendido), precio final, siguiente paso
15. **Nuevo artículo publicado en tu sector** — Cuando se publica contenido editorial relevante para el dealer

### Emails para COMPRADORES (B2B/B2C)

16. **Bienvenida** — Al registrarse. Incluye: cómo buscar, cómo guardar favoritos, cómo activar alertas
17. **Alerta de búsqueda** — Nuevos vehículos que coinciden con sus filtros guardados. Configurable: diario, semanal, inmediato
18. **Favorito con cambio de precio** — Un vehículo en favoritos bajó de precio
19. **Favorito vendido** — Un vehículo en favoritos se vendió. Sugerencia de similares
20. **Solicitud de búsqueda confirmada** — "Estamos buscando lo que necesitas". Cuando publica una demanda
21. **Match de búsqueda encontrado** — Un vehículo nuevo coincide con su demanda publicada
22. **Subasta: puja superada** — Alguien pujó más. Link para pujar de nuevo
23. **Subasta: ganaste** — Felicitación + instrucciones de pago + contacto del vendedor
24. **Subasta: no ganaste** — Resultado + sugerencia de vehículos similares
25. **Verificación disponible** — Un vehículo que sigue tiene verificación nueva

### Emails del SISTEMA

26. **Confirmar email** — Doble opt-in al registrarse
27. **Resetear contraseña** — Link de recuperación
28. **Cambio de email** — Confirmación del nuevo email
29. **Cuenta eliminada** — Confirmación de eliminación + datos borrados (RGPD)
30. **Actividad sospechosa** — Login desde nuevo dispositivo/ubicación

### Alertas de búsqueda (motor)

- El comprador guarda una búsqueda con filtros (categoría, precio, año, ubicación...)
- Elige frecuencia: inmediata, diaria (09:00), semanal (lunes 09:00)
- Cron compara `search_alerts.filters` con vehículos nuevos
- Si hay matches → email con lista de vehículos nuevos que coinciden
- Botón "Desactivar alerta" en cada email (un clic, sin login)
- En perfil del usuario: gestionar alertas activas, editar filtros, cambiar frecuencia

### Panel de admin para emails (`/admin/config/emails`)

- CRUD de todos los templates (30 templates)
- Editor visual con variables disponibles listadas
- Vista previa renderizada con datos de ejemplo
- Botón "Enviar test" a email del admin
- Cada template es JSONB multi-idioma (se envía en el idioma del destinatario)
- Estadísticas: enviados, abiertos, clicados, errores (por template)
- Toggle on/off por template (ej: desactivar "resumen mensual" temporalmente)
- Los templates heredan colores del vertical automáticamente

### Preferencias del usuario

- Página `/perfil/notificaciones` donde el usuario activa/desactiva cada tipo
- Link "Gestionar preferencias" en el footer de cada email
- Respetar opt-out inmediatamente (tabla email_preferences)
- "Desuscribirse de todo" con un clic (excepto transaccionales obligatorios: confirmación email, reset password)

---

## SESIÓN 19 — Seguridad de producción

**Leer:**

1. `docs/tracciona-docs/anexos/N-seguridad-mantenimiento.md (alias de compatibilidad histórica)`

**Hacer:**

### Cloudflare (configurar en dashboard)

- Activar WAF (Web Application Firewall) con reglas managed
- Activar Bot Fight Mode (protección anti-scraping básica)
- Activar DDoS protection (incluido en free tier)
- Configurar Page Rules: cache agresivo en assets, no cache en /admin/
- Activar SSL/TLS en modo Full (Strict)
- Configurar Rate Limiting: max 100 requests/min por IP en /api/

### Supabase (configurar en dashboard)

- Activar Rate Limiting en Auth: max 30 signups/hora, max 100 logins/hora
- Verificar que service_role_key SOLO está en Edge Functions, NUNCA en frontend
- Activar log de auth events para detectar fuerza bruta
- Configurar backup automático diario (Supabase Pro lo incluye)
- Revisar RLS de TODAS las tablas con test queries

### Aplicación

- Integrar Sentry para error monitoring: `@sentry/vue` + `@sentry/nuxt`
- Configurar Sentry alerts para errores críticos (>5 mismos errores en 1h)
- Implementar health check endpoint `/api/health` que verifica BD + servicios
- Configurar UptimeRobot o similar (gratis) para monitorizar uptime cada 5 min
- Sanitizar TODOS los inputs de usuario con DOMPurify antes de render
- Verificar que no hay SQL injection posible (Supabase client lo previene, pero revisar custom queries)
- Añadir CAPTCHA (hCaptcha o Turnstile de Cloudflare, gratis) en:
  - Formulario de registro
  - Formulario de contacto/lead
  - Formulario de publicar vehículo
- Implementar rate limiting en Edge Functions críticas:
  - POST /api/lead: max 5/min por IP
  - POST /api/vehicle: max 10/min por usuario
  - POST /api/translate: max 50/hora
- Content Security Policy estricto en \_headers de Cloudflare Pages
- Añadir CORS restrictivo en Supabase (solo dominios propios)

### Tareas pendientes del plan original (Bloque D-QUATER)

- **Husky + lint-staged**: `npx husky init`, hook pre-commit con `lint-staged` (ESLint + Prettier). Rechazar commits con errores de lint.
- **GitHub Actions CI/CD**: Crear `.github/workflows/ci.yml` (lint + type-check + vitest en cada PR) y `.github/workflows/deploy.yml` (build + deploy Cloudflare Pages en merge a main).
- **localStorage audit**: `grep -r "localStorage" app/` — migrar usos inseguros a composables con `useLocalStorage` de VueUse o eliminar. Supabase Auth ya usa cookies httpOnly.
- **ipapi.co eliminación**: Verificar `useUserLocation.ts` — no debe enviar IPs a servicios externos sin consentimiento. Usar `navigator.language` + datos del perfil de usuario.

### RGPD/GDPR

- Banner de cookies funcional (no solo visual) con Cookiebot o propio
- Página de privacidad con datos del responsable (Tank Ibérica SL / nueva SL)
- Botón "Eliminar mi cuenta" funcional en perfil de usuario
- Exportar datos del usuario (derecho de portabilidad) — botón en perfil
- Registro de consentimientos en BD (tabla `consents`)
- DPA (Data Processing Agreement) con Supabase, Cloudflare, Stripe, Resend

---

## SESIÓN 20 — Testing y calidad

**Hacer:**

- Instalar Vitest: `npm install -D vitest @vue/test-utils happy-dom`
- Tests unitarios para composables críticos (Vitest + happy-dom):
  - `useLocalized.ts` (localizedField con todos los fallbacks)
  - `useVerticalConfig.ts` (loadConfig, isSectionActive, isLocaleActive)
  - `useSeoScore.ts` (cada check individual)
  - `useVehicles.ts` (queries, filtrado, paginación)
  - `useFilters.ts` (6 tipos de filtro, opciones dinámicas, rangos)
  - `useCatalogState.ts` (estado, categorías, subcategorías)
  - `fuzzyMatch.ts` (matching difuso con edge cases)
- Tests de componentes para:
  - Formulario de publicar vehículo (validación campos obligatorios)
  - Filtros dinámicos (cambian según categoría seleccionada)
  - SEO Score panel (muestra checks correctos)
- Tests E2E con Playwright:
  - Flujo completo: buscar → filtrar → ver ficha → contactar dealer
  - Flujo admin: login → publicar vehículo → verificar en catálogo
  - Flujo i18n: cambiar idioma → URLs correctas → contenido traducido
  - Flujo dealer: registrar → personalizar portal → publicar vehículo
- Lighthouse CI: verificar score >90 en Performance, SEO, Accessibility
- Configurar GitHub Actions para run tests en cada PR

---

## SESIÓN 21 — WhatsApp publishing con IA

**Leer:**

1. `docs/tracciona-docs/anexos/I-automatizacion-ia.md (alias de compatibilidad histórica)`

**Hacer:**

- Integrar WhatsApp Business API (via Twilio o Meta directamente)
- Flujo: dealer envía fotos al número de Tracciona → webhook recibe → Claude Vision extrae datos → genera ficha → publica con status='draft' → notifica al dealer para aprobar
- Edge Function `/api/whatsapp/webhook` para recibir mensajes
- Edge Function `/api/whatsapp/process` para procesar con IA
- Respuesta automática al dealer confirmando recepción
- En admin: cola de vehículos recibidos por WhatsApp pendientes de aprobación

---

## SESIÓN 22 — PWA + Performance

**Hacer:**

- Configurar `@vite-pwa/nuxt` para Progressive Web App
- Service worker para cache offline de páginas visitadas
- Manifest.json con iconos, colores de tema (desde vertical_config)
- Push notifications (opcional, requiere VAPID keys)
- Lazy loading de imágenes con Cloudinary transformaciones automáticas
- Preload de fuentes críticas
- Verificar Core Web Vitals: LCP <2.5s, FID <100ms, CLS <0.1
- ISR (Incremental Static Regeneration) para páginas de catálogo si Nuxt 3 lo soporta

---

## SESIÓN 23 — Clonar vertical nueva

> Esta sesión se ejecuta cada vez que se lanza un vertical nuevo. Repetir para cada uno.

**Leer:**

1. `docs/tracciona-docs/contexto-global.md (alias de compatibilidad)` — Sección 3 (los 7 verticales)
2. `docs/tracciona-docs/anexos/W-panel-configuracion.md (alias de compatibilidad histórica)` — Sección W.8 (flujo de clonado)
3. `docs/tracciona-docs/anexos/A-verticales-confirmados.md (alias de compatibilidad histórica)`
4. `docs/tracciona-docs/anexos/B-verticales-futuros.md (alias de compatibilidad histórica)`

**Hacer:**

### Opción A — Mismo deploy, variable de entorno (recomendado para empezar)

1. En `vertical_config` insertar nueva fila para el vertical (ej: 'horecaria')
2. Configurar desde el panel admin (`/admin/config/*`): logo, colores, categorías, subcategorías, atributos, idiomas
3. Crear nuevo deploy en Cloudflare Pages con variable de entorno `VERTICAL=horecaria`
4. Apuntar dominio (ej: horecaria.com) al nuevo deploy
5. El mismo código sirve — solo cambia la variable VERTICAL que filtra `vertical_config`

### Opción B — Repositorio clonado (cuando los verticales divergen)

1. Clonar el repo de Tracciona
2. Cambiar la constante VERTICAL en `useVerticalConfig.ts`
3. Personalizar desde admin (todo en BD, cero código)
4. Deploy independiente

**Para cada vertical nuevo, también:**

- Generar archivo de UI (`locales/es.json`, `en.json`) con términos del sector (no 'vehículo' sino 'equipo', no 'cisterna' sino 'horno')
- Generar las categorías y subcategorías del vertical (ver documento "Categorías y Subcategorías de Verticales")
- Generar artículos editoriales iniciales adaptados al sector
- Configurar `target_markets` según los mercados relevantes del vertical

**Verticales previstos y su orden:**

| #   | Vertical        | Dominio             | Cuándo                          |
| --- | --------------- | ------------------- | ------------------------------- |
| 1   | Tracciona       | tracciona.com       | Ahora (sesiones 1-12)           |
| 2   | Horecaria       | horecaria.com       | Cuando Tracciona tenga tracción |
| 3   | CampoIndustrial | campoindustrial.com | Después de Horecaria            |
| 4   | Municipiante    | municipiante.com    | Según demanda                   |
| 5   | ReSolar         | resolar.com         | Según demanda                   |
| 6   | Clinistock      | clinistock.com      | Según demanda                   |
| 7   | BoxPort         | boxport.com         | Según demanda                   |

---

## SESIÓN 24 — Zona de usuario: registro, login, perfil, roles

> Prerequisito para sesiones 17, 18, 28, 29 y 31. Sin esto no hay usuarios registrados.
> **NOTA:** Las tablas SQL (users.user_type, leads, favorites, user_vehicle_views, subscriptions, dealer_stats, dealer_events) ya fueron creadas en la sesión 2 (Bloque D). Esta sesión SOLO crea páginas, composables, middleware y lógica frontend.

**Leer:**

1. `docs/tracciona-docs/anexos/E-sistema-pro.md (alias de compatibilidad histórica)` — Tipos de suscripción y sistema Pro
2. `docs/tracciona-docs/anexos/K-dealer-toolkit.md (alias de compatibilidad histórica)` — Funcionalidades del dealer (K.1 a K.6)
3. `docs/tracciona-docs/anexos/W-panel-configuracion.md (alias de compatibilidad histórica)` — Sección W.4 (portal dealer)

**Hacer:**

### Verificar tablas (no crear, solo verificar que existen de sesión 2)

- `users` tiene columnas: user_type, company_name, phone_verified, onboarding_completed, last_login_at, login_count
- `leads`, `favorites`, `user_vehicle_views`, `subscriptions`, `dealer_stats`, `dealer_events` existen
- Si alguna falta, crearla ahora (safety net)

### Páginas de autenticación

- `pages/auth/login.vue` — Login con email+password y login social (Google). Diseño limpio con branding del vertical
- `pages/auth/registro.vue` — Registro con selección: "¿Eres comprador o profesional?"
  - Comprador: nombre, email, password, teléfono (opcional)
  - Dealer/profesional: nombre, email, password, nombre empresa, CIF, teléfono
- `pages/auth/confirmar.vue` — Pantalla post-confirmación de email
- `pages/auth/recuperar.vue` — Reset de contraseña
- `pages/auth/nueva-password.vue` — Formulario de nueva contraseña (enlace del email)
- Middleware `auth.ts`: redirige a `/auth/login` si no autenticado en rutas protegidas
- Middleware `dealer.ts`: verifica que user_type='dealer' para rutas de `/dashboard/*`

### Zona privada del COMPRADOR (`/perfil/*`)

- `pages/perfil/index.vue` — Dashboard del comprador:
  - Resumen: X favoritos, X alertas activas, X contactos enviados
  - Últimos vehículos vistos (histórico)
  - Vehículos recomendados (basado en búsquedas/favoritos)
- `pages/perfil/datos.vue` — Editar datos personales (nombre, email, teléfono, idioma preferido, avatar)
- `pages/perfil/favoritos.vue` — Grid de vehículos guardados (de sesión 28)
- `pages/perfil/alertas.vue` — Alertas de búsqueda activas (de sesión 18/28)
- `pages/perfil/contactos.vue` — Historial de leads enviados a dealers (estado: enviado, leído, respondido)
- `pages/perfil/notificaciones.vue` — Preferencias de email (de sesión 18)
- `pages/perfil/suscripcion.vue` — Plan actual (Free/Pro), historial de pagos, cambiar plan
- `pages/perfil/seguridad.vue` — Cambiar contraseña, activar 2FA, sesiones activas, eliminar cuenta

### Zona privada del DEALER (`/dashboard/*`)

- `pages/dashboard/index.vue` — Dashboard del dealer:
  - KPIs: vehículos activos, visitas totales, leads este mes, tasa de respuesta
  - Gráfico de visitas últimos 30 días
  - Leads recientes (nombre, vehículo, fecha, estado)
  - Vehículos con más visitas
  - Barra de progreso onboarding (si no completado)
- `pages/dashboard/vehiculos/index.vue` — Mis vehículos publicados (grid con acciones: editar, pausar, marcar vendido, eliminar)
- `pages/dashboard/vehiculos/nuevo.vue` — Publicar vehículo (formulario completo: fotos, datos, precio, descripción)
- `pages/dashboard/vehiculos/[id].vue` — Editar vehículo existente
- `pages/dashboard/leads/index.vue` — Todos los leads recibidos (filtrable por vehículo, fecha, estado)
- `pages/dashboard/leads/[id].vue` — Detalle del lead (datos contacto, vehículo, historial de comunicación)
- `pages/dashboard/portal.vue` — Configurar portal público (colores, bio, logo, contacto) — del Anexo W.7
- `pages/dashboard/estadisticas.vue` — Analytics detallado (visitas por vehículo, leads por semana, conversión)
- `pages/dashboard/facturas.vue` — Historial de facturas y suscripción (de sesión 25)
- `pages/dashboard/suscripcion.vue` — Plan actual, cambiar plan, founding badge

### Portal público del dealer (ya en sesión 10, pero conectar)

- Se resuelve por el catch-all `pages/[...slug].vue` (NO existe ruta `/dealer/[slug]`)
- URL pública: `tracciona.com/transportes-garcia` (sin prefijo, directo por slug)
- Lógica en catch-all (Anexo K.9): 1º busca en active_landings, 2º busca en dealers WHERE slug = input
- Carga tema del dealer (useDealerTheme)
- Muestra: logo, bio, certificaciones, contacto, catálogo de sus vehículos
- SEO: title = "[Nombre dealer] — Vehículos en Tracciona"

> Las tablas `user_vehicle_views`, `leads`, `favorites`, `search_alerts` ya existen de sesión 2 (Bloque D). No crear aquí.

### CRM de leads integrado en el dashboard del dealer

La tabla `leads` del Anexo K.2 tiene campos de estado avanzados. Implementar la UI:

- Estados del lead: `new` → `viewed` → `contacted` → `negotiating` → `won`/`lost`
- Cambio de estado con dropdown en la lista de leads
- Campo `dealer_notes` editable en el detalle del lead (notas privadas)
- Campo `close_reason` obligatorio al marcar como `lost` (precio, no interesado, compró en otro sitio)
- Campo `sale_price_cents` al marcar como `won` (para estadísticas)
- Auto-reply configurable: `dealers.auto_reply_message` → se envía al comprador al recibir lead
- Cálculo automático de `dealers.avg_response_time_hours` (cron diario desde leads)

### Estadísticas pre-calculadas del dealer

- Crear tabla `dealer_stats` del Anexo K.5 (métricas por día)
- Edge Function cron diario: calcular vehicle_views, leads_received, leads_responded, conversion_rate por dealer
- Métricas escalonadas por plan:
  - Free: solo totales (visitas totales, leads totales)
  - Básico: por vehículo (visitas, leads, favoritos) + gráfico mensual
  - Premium/Founding: todo + comparativa con media del sector + demandas que matchean
- Componente `<DealerStatsGate :requires="'basic'">` que muestra blur + CTA upgrade si el plan no lo incluye

### Generación de descripción con IA

En el formulario de publicación (`/dashboard/vehiculos/nuevo.vue`):

- Botón "Generar descripción con IA" junto al campo de descripción
- Edge Function `/api/generate-description` que recibe: marca, modelo, año, km, categoría, subcategoría, atributos
- Claude Haiku genera descripción SEO optimizada en español (~150 palabras)
- El dealer puede editar antes de publicar
- Límite según plan: Free=3/mes, Básico=20/mes, Premium=ilimitado
- Campo `ai_generated=true` en el vehículo (para badge AI Act)

### Import masivo por Excel/CSV

- Página `/dashboard/vehiculos/importar.vue`
- Subir Excel/CSV con columnas estándar (marca, modelo, año, km, precio, categoría, descripción)
- Vista previa de los vehículos parseados antes de publicar
- Validación: campos obligatorios, precio >0, categoría válida
- Publicación en batch (todos como draft o todos como published)
- Template Excel descargable con columnas esperadas

### Composables

- `useAuth.ts` — login, register, logout, resetPassword, currentUser, isDealer, isBuyer, isAdmin
- `useSubscription.ts` — **CRÍTICO para sistema Pro 24h y plan-gating:**
  ```typescript
  // Composable que resuelve el estado de suscripción del usuario actual
  // Se usa en: catálogo (filtro visible_from), ficha (bloqueo Pro), herramientas dealer (plan-gate), stats (plan-gate)
  //
  // const { isPro, isDealer, dealerPlan, hasActiveSub, subscription, canAccess } = useSubscription()
  //
  // isPro: computed → true si tiene suscripción Pro activa (pro_monthly, pro_annual, pass_72h no expirado)
  // isDealer: computed → true si user_type='dealer'
  // dealerPlan: computed → 'free'|'basic'|'premium'|'founding' (para plan-gating de herramientas)
  // hasActiveSub: computed → true si cualquier suscripción activa (Pro O dealer)
  // canAccess(feature): método → verifica si el plan actual permite acceder a una feature específica
  //
  // Lógica interna:
  // 1. Leer auth.uid() → query subscriptions WHERE user_id=uid AND status='active' AND (expires_at IS NULL OR expires_at > NOW())
  // 2. Cachear resultado en useState (no re-query en cada página)
  // 3. Para Stripe webhooks: cuando subscription.status cambia en BD, el composable se re-evalua automáticamente
  //    vía Supabase Realtime subscription en tabla subscriptions
  //
  // Mapeo de features por plan (para canAccess):
  // 'view_hidden_vehicles' → isPro (Pro mensual, anual, o pase 72h)
  // 'instant_alerts' → isPro
  // 'advanced_stats' → dealerPlan >= 'basic'
  // 'ai_descriptions' → dealerPlan >= 'free' (con límites: free=3/mes, basic=20/mes, premium=unlimited)
  // 'export_catalog' → dealerPlan >= 'basic'
  // 'widget' → dealerPlan >= 'premium'
  // 'sector_comparison' → dealerPlan >= 'premium'
  ```
- `useUserProfile.ts` — loadProfile, updateProfile, deleteAccount, exportData
- `useDealerDashboard.ts` — loadStats, loadLeads, loadVehicles, markLeadRead, updateLeadStatus
- `useBuyerDashboard.ts` — loadFavorites, loadAlerts, loadContactHistory, loadRecentViews
- `useDealerStats.ts` — loadDailyStats, loadMonthlyStats, canAccessMetric(plan, metric)

### Navegación dinámica según rol

En el header:

- Anónimo: botón "Iniciar sesión" + "Registrarse"
- Comprador autenticado: avatar + dropdown (Mi perfil, Favoritos, Alertas, Cerrar sesión)
- Dealer autenticado: avatar + dropdown (Mi panel, Mis vehículos, Leads, Publicar vehículo, Cerrar sesión)
- Admin: acceso al panel admin además de todo lo anterior

---

## SESIÓN 25 — Compliance regulatorio (UE + UK)

> Renumerado: antes era sesión 24.

> Obligatorio legalmente para operar un marketplace en la UE y UK.

**Leer:**

1. `docs/tracciona-docs/anexos/R-marco-legal.md (alias de compatibilidad histórica)`
2. `docs/tracciona-docs/anexos/N-seguridad-mantenimiento.md (alias de compatibilidad histórica)`

**Hacer:**

### DSA (Digital Services Act — UE)

- Formulario "Reportar anuncio" visible en cada ficha de vehículo (botón 🚩)
- Tabla `reports` (id, reporter_email, entity_type, entity_id, reason, status, admin_notes, created_at, resolved_at)
- Punto de contacto único visible en footer y página /legal (email + formulario)
- Verificación de identidad del dealer al registrarse: NIF/CIF obligatorio, nombre legal, dirección
- Datos del vendedor visibles para el comprador en cada ficha (nombre empresa, ubicación, CIF)
- Página `/transparencia` con informe anual descargable (PDF generado desde admin)
- Flujo admin para gestionar reports: pendientes → revisados → acción tomada (eliminar/mantener)

### UK Online Safety Act 2023 + UK GDPR

Si se activa el mercado británico (idioma EN con `.co.uk` o tráfico UK significativo):

- **Risk assessment de contenido ilegal:** Evaluar riesgos de contenido ilegal en la plataforma (fraude, vehículos robados) y documentar medidas. Ofcom lo exige a todos los servicios con usuarios UK
- **Mecanismo de denuncia:** El botón "Reportar" del DSA también cumple esta obligación, pero añadir categoría específica "fraud/scam" para UK
- **Términos claros en inglés:** Los T&C deben ser "clear and accessible" — no vale solo traducir los españoles
- **UK GDPR (Data Protection Act 2018):** Sustancialmente igual al RGPD de la UE, pero:
  - Nombrar representante en UK si no tienes establecimiento allí (Art. 27 UK GDPR)
  - Registrarse en el ICO (Information Commissioner's Office) — £40/año para pymes
  - Política de privacidad específica UK (o sección dedicada en la existente)
- **IVA UK:** Si vendes suscripciones digitales a dealers en UK, necesitas registrarte para VAT en HMRC o usar un intermediario de pago (Stripe hace esto automáticamente con Stripe Tax)
- Añadir página `/legal/uk` con T&C específicos para UK si hay dealers británicos

### DAC7 (intercambio fiscal — UE)

- Recopilar datos fiscales de dealers: NIF, dirección fiscal, país de residencia fiscal
- Tabla `dealer_fiscal_data` (dealer_id, tax_id, tax_country, tax_address, verified)
- Cron anual (enero): generar informe DAC7 con dealers que superen umbrales (>30 operaciones o >2.000€)
- Exportar en formato requerido por AEAT
- **UK equivalente (DAC6/HMRC):** Si hay operaciones con UK, reportar según normativa HMRC equivalente

### AI Act (UE, en vigor progresivo 2025-2027)

- Badge "Traducido automáticamente" en content*translations donde source='auto*\*'
- Badge "Descripción asistida por IA" si la descripción fue generada con IA
- Campo `ai_generated BOOLEAN DEFAULT false` en vehicles y articles
- Informar en T&C y política de privacidad que se usan sistemas de IA para traducciones y generación de contenido

### RGPD / UK GDPR reforzado

- Tabla `consents` (user_id, consent_type, granted, ip_address, timestamp)
- Registro de consentimiento al aceptar cookies, términos, newsletter
- Botón "Eliminar mi cuenta" funcional (borra datos personales, anonimiza vehículos)
- Botón "Exportar mis datos" (genera JSON con todos los datos del usuario)
- Política de privacidad con sección específica sobre comercialización de datos anonimizados (ver sesión 31)

---

## SESIÓN 26 — Facturación y contabilidad

**Hacer:**

- Integrar Quaderno (auto-calcula IVA por país UE, genera facturas legales españolas, se integra con Stripe)
- Factura automática al cobrar suscripción, comisión o verificación
- Tabla `invoices` (id, dealer_id, stripe_invoice_id, amount_cents, vat_pct, vat_country, pdf_url, status, created_at)
- Portal de facturas para el dealer: `/admin/dealer/facturas` (lista, descarga PDF)
- Exportación mensual CSV para la asesoría (todas las facturas emitidas)
- Registro en OSS (One-Stop Shop) de AEAT si hay clientes fuera de España
- En admin: vista de ingresos por mes, por tipo (suscripción/comisión/verificación), por vertical

---

## SESIÓN 27 — Dashboard de métricas y KPIs

**Hacer:**

- Página `/admin/dashboard` con gráficos (Recharts o Chart.js):
  - MRR y ARR (de tabla subscriptions + invoices)
  - Vehículos publicados/vendidos por mes
  - Leads generados por mes (de tabla contacts)
  - Top 10 dealers por actividad
  - Top 10 vehículos por visitas
  - Conversión: visitas → fichas vistas → leads → ventas
  - Churn rate de dealers (cancelaciones/total)
  - Desglose por vertical (cuando haya más de uno)
- Widget resumen en home del admin (4 cards: ingresos mes, vehículos activos, dealers activos, leads mes)
- Comparativa mes actual vs anterior (flechas ↑↓ con %)
- Exportar a CSV/Excel (para asesoría e inversores)

---

## SESIÓN 28 — CRM de dealers + onboarding guiado

**Leer:**

1. `docs/tracciona-docs/anexos/K-dealer-toolkit.md (alias de compatibilidad histórica)`

**Hacer:**

### Onboarding guiado

- Wizard de 5 pasos al registrarse como dealer:
  1. Verificar email
  2. Completar perfil empresa (nombre, CIF, logo, ubicación)
  3. Subir primer vehículo (formulario simplificado)
  4. Personalizar portal (colores, bio)
  5. Publicar
- Barra de progreso visible (0-100%) hasta completar los 5 pasos
- Checklist en dashboard del dealer: ✅/❌ por cada paso

### Health score del dealer

- Calculado automáticamente (cron diario o al consultar):
  - Fotos de calidad (>3 por vehículo): +10
  - Descripción completa: +10
  - Responde leads <24h: +20
  - Actualiza precios mensualmente: +10
  - Perfil completo (logo, bio, contacto): +10
  - Vehículos activos: +10 por cada 5
  - Score 0-100
- Visible en admin: lista de dealers ordenable por health score
- Badge en portal público si score >80 ("Dealer activo")

### CRM de contactos del dealer (`/dashboard/crm`)

- **REUTILIZAR** `admin/agenda.vue` + `useAdminContacts` existentes (Bloque D-TER)
- Adaptar: filtrar por `dealer_id`, añadir columna `vertical`
- CRUD de contactos: clientes, proveedores, transportistas, otros
- Campos: empresa, nombre, teléfono, email, notas, tipo, último contacto
- Búsqueda y filtros por tipo
- Plan mínimo: Básico

### Pipeline comercial (`/dashboard/pipeline`)

- **REUTILIZAR** estructura `admin/cartera.vue` existente (Bloque D-TER, es placeholder)
- Kanban visual: Interesado → Contactado → Negociando → Cerrado/Perdido
- Vinculado a leads + vehículos del dealer
- Drag & drop para mover entre columnas
- Valor estimado por columna (suma de precios de vehículos en negociación)
- Plan mínimo: Premium

### Historial de ventas (`/dashboard/historico`)

- **REUTILIZAR** `admin/historico.vue` + `useAdminHistorico` existentes (Bloque D-TER)
- Adaptar: filtrar por `dealer_id`
- Vehículos vendidos/archivados con estadísticas, filtros por año/marca/tipo
- Botón restaurar vehículo (re-publicar)
- Plan mínimo: Free

### Flujo completo de transacción: Alquilar / Vender (`/dashboard/vehiculos/[id]/transaccion`)

- Origen: admin-funcionalidades.md §6.1.5 (modalTransaccion del proyecto original)
- Modal/página con 2 pestañas: **Alquilar** y **Vender**
- **Pestaña Alquilar:**
  - Fechas desde/hasta, cliente, importe, subida de factura
  - Al confirmar: crea entrada automática en `rental_records`, crea entrada en balance, cambia estado del vehículo a `rented`
- **Pestaña Vender:**
  - Fecha de venta, comprador, precio de venta, subida de factura, checkbox "Exportación"
  - Al confirmar: crea entrada en balance, mueve vehículo a histórico (`sold_at = NOW()`, `status = 'sold'`), calcula beneficio automático (precio_venta - coste_total)
  - Warning: "Esta acción mueve el vehículo al histórico"
- Este flujo es crítico para Tank Ibérica y cualquier dealer que gestione flota
- Plan mínimo: Free

### Observatorio de competencia (`/dashboard/observatorio`)

- Tabla `competitor_vehicles` (dealer_id, platform, url, brand, model, year, price, location, notes, status 'watching'|'sold'|'expired', created_at, updated_at)
- El dealer registra vehículos que ha visto en otras plataformas (Milanuncios, Wallapop, etc.)
- Campos: plataforma, enlace, marca/modelo/año/precio, ubicación, notas
- Vista lista con filtros por plataforma y estado
- Útil para inteligencia de mercado: ¿a qué precio vende la competencia?
- Plan mínimo: Premium
- Origen: tabla `viewed_vehicles`/"ojeados" del plan original Tank Ibérica
- **Sistema de plataformas configurables** (herencia de admin-funcionalidades.md §6.3):
  - Tabla `platforms` (id, name, url_base, icon, sort_order) o campo JSONB en config
  - Panel desplegable con botón engranaje para añadir/eliminar plataformas dinámicamente
  - Plataformas predefinidas: Milanuncios, Wallapop, Autoscout24, Mobile.de, TruckScout24, Mascus, Facebook Marketplace
  - Opción "Otra" para plataformas puntuales
  - Cada dealer configura SUS plataformas habituales

### Reactivación automática

- Emails automáticos (añadir a sesión 18):
  - 7 días sin login → "Tienes leads sin responder"
  - 30 días sin publicar → "Tu catálogo necesita actualización"
  - 60 días inactivo → "¿Necesitas ayuda? Llámanos"
- Tabla `dealer_events` (dealer_id, event_type, metadata JSONB, created_at)

---

## SESIÓN 29 — Favoritos y búsquedas guardadas

**Hacer:**

- Tabla `favorites` (user_id, vehicle_id, created_at, UNIQUE(user_id, vehicle_id))
- Botón ❤️ en fichas y en grid del catálogo (toggle, instantáneo)
- Página `/perfil/favoritos` con grid de vehículos guardados
- Página `/perfil/alertas` con alertas activas (de tabla search_alerts de sesión 18)
  - Editar filtros de la alerta
  - Cambiar frecuencia (inmediata, diaria, semanal)
  - Desactivar/activar
- Notificación cuando un favorito baja de precio (email automático #18)
- Notificación cuando un favorito se vende (email automático #19)
- Contador de favoritos visible para el dealer: "Tu cisterna tiene 12 interesados" (motiva al dealer)
- En admin: métricas de favoritos por vehículo (indica demanda real)
- Botón "Guardar búsqueda" en la página de catálogo (captura filtros actuales como alerta)
- RLS: cada usuario solo ve sus propios favoritos

---

## SESIÓN 30 — Resiliencia y plan B técnico

**Hacer:**

- Documentar procedimiento de migración:
  - Supabase → PostgreSQL autoalojado (Railway, Neon, o VPS)
  - Cloudflare Pages → Vercel o Netlify
  - Cloudinary → Cloudflare Images o bunny.net
  - Resend → SendGrid o Amazon SES
  - Stripe → no hay alternativa real, pero documentar cómo exportar datos
- Script de backup semanal completo:
  - `pg_dump` de toda la BD (via Supabase CLI)
  - Subir a Backblaze B2 o S3 (cifrado)
  - Retención: 4 backups semanales + 3 mensuales
- Script de restauración testeado: backup → nueva instancia PostgreSQL → verificar
- Documentar todo en `docs/tracciona-docs/migracion/04-plan-contingencia.md (alias de compatibilidad histórica)`
- GitHub como fuente de verdad (no OneDrive). Push diario obligatorio.

---

## SESIÓN 31 — Herramientas avanzadas del dealer

> Genera retención y lock-in. Cada herramienta es una razón más para no irse de Tracciona.

**Leer:**

1. `docs/tracciona-docs/anexos/M-herramientas-dealer.md (alias de compatibilidad histórica)` — Completo
2. `docs/tracciona-docs/anexos/K-dealer-toolkit.md (alias de compatibilidad histórica)` — Secciones K.7

**Hacer:**

### Generador de facturas (`/dashboard/herramientas/factura`)

- Adaptar el generador existente en `/admin/utilidades.vue` para dealers
- Datos del emisor pre-rellenados desde perfil del dealer (empresa, CIF, dirección, logo)
- Seleccionar vehículo de SU catálogo (autocomplete)
- Rellenar datos del comprador (nombre, CIF, dirección)
- Líneas múltiples (venta, alquiler, servicio, transporte, transferencia)
- Cálculo automático de IVA (21% o exento intracomunitario)
- Número de factura auto-generado (prefijo dealer + secuencial)
- Generar PDF profesional con logo del dealer
- Guardar en tabla `dealer_invoices` para historial
- Plan mínimo: Básico

### Generador de contratos (`/dashboard/herramientas/contrato`)

- **REUTILIZAR** lógica de `admin/utilidades.vue` tab "Contratos" (Bloque D-TER)
- Dos tipos: compraventa y arrendamiento (del código existente)
- Pre-rellenar datos del dealer y vehículo seleccionado
- Cláusulas legales estándar incluidas
- Arrendamiento: opción de compra, valor residual, fianza, duración
- Compraventa: condiciones, garantía, forma de pago
- PDF descargable
- Plan mínimo: Básico

### Plantilla de presupuesto (`/dashboard/herramientas/presupuesto`)

- Documento pre-venta para enviar al comprador
- Incluye: vehículo con foto, precio, servicios opcionales (transporte, transferencia, inspección, seguro)
- Validez configurable (15 días por defecto)
- Los servicios opcionales son cross-sell de Tracciona (IberHaul, Gesturban)
- QR con enlace a la ficha del vehículo en Tracciona
- PDF descargable
- Plan mínimo: Free (es gancho para que use la plataforma)

### Calculadora de rentabilidad de alquiler (`/dashboard/herramientas/calculadora`)

- Inputs: precio compra, renta mensual, seguro, mantenimiento, impuestos
- Outputs: ROI anual, meses para recuperar inversión, beneficio neto, punto de equilibrio, valor residual estimado
- Gráfico de payback (línea temporal)
- Útil para dealers que alquilan (como Tank Ibérica con cisternas)
- Plan mínimo: Free

### Generador de anuncios para otras plataformas (`/dashboard/herramientas/exportar-anuncio`)

- Seleccionar vehículo → seleccionar plataforma destino
- Plataformas: Milanuncios (4.000 chars), Wallapop (640 chars), Facebook Marketplace, LinkedIn, Instagram
- Edge Function con Claude Haiku genera texto adaptado al formato y límites de cada plataforma
- Siempre incluye backlink: "Más fotos y detalles en tracciona.com/vehiculo/[slug]"
- Botón "Copiar al portapapeles"
- Plan mínimo: Básico

### Widget embebible (`/dashboard/herramientas/widget`)

- Genera código iframe para que el dealer pegue en su propia web
- Server route `/embed/[dealer-slug]` que renderiza HTML con CSS inline
- Parámetros: limit (nº vehículos), theme (light/dark), category
- Clic en vehículo → abre ficha en tracciona.com (nueva pestaña)
- Vista previa del widget en la página de configuración
- Plan mínimo: Premium/Founding

### Export catálogo (`/dashboard/herramientas/exportar`)

- CSV: para importar en otros portales o Excel
- PDF catálogo: portada con logo + 1 vehículo por página (fotos, specs, precio) + pie con QR
- Útil para ferias, visitas comerciales, enviar por email
- Plan mínimo: Básico

### Sistema de exportación completo (herencia de admin-funcionalidades.md §12)

- Origen: Tank Ibérica tenía 6 modales de exportación independientes. Unificar en componente reutilizable `ExportModal.vue`:
- **Componente genérico `ExportModal`:** recibe `dataSource` (vehículos/balance/histórico/etc.), `columns` (configurables), `format` (Excel/PDF)
- Aplicar en:
  - `/dashboard/vehiculos` → Exportar inventario activo (Excel/PDF, todos o filtrados, columnas seleccionables)
  - `/dashboard/historico` → Exportar histórico de ventas (con datos financieros: coste, precio venta, beneficio, margen)
  - `/dashboard/herramientas/alquileres` → Exportar alquileres activos/finalizados
  - `/dashboard/herramientas/mantenimientos` → Exportar registros de mantenimiento
  - `/dashboard/observatorio` → Exportar vehículos de competencia observados
- En admin (Sesión 27): exportar balance, resumen financiero mensual, facturas emitidas
- Usar SheetJS (xlsx) para Excel, jsPDF+autoTable para PDF (ya en dependencias originales)
- Plan mínimo: Básico

### Configuración de tabla con grupos de columnas (herencia de admin-funcionalidades.md §11)

- Origen: Tank Ibérica tenía sistema sofisticado de grupos de columnas configurables (DOCS, TÉCNICO, CUENTAS, ALQUILER, FILTROS)
- Componente reutilizable `ConfigurableTable.vue`:
  - Grupos de columnas activables/desactivables (toggle chips encima de la tabla)
  - Cada grupo contiene N columnas relacionadas
  - Estado de visibilidad persistido en `localStorage` o `user_preferences`
  - Botón "Configurar" abre modal con: reordenar grupos (drag-and-drop), añadir/editar grupos, marcar obligatorios
- Aplicar en: `/dashboard/vehiculos` (lista), `/dashboard/historico`, admin: `/admin/vehiculos`
- Plan mínimo: Básico

### Intermediación como flujo completo (herencia de admin-funcionalidades.md §6.2)

- Los vehículos con `published_by_dealer_id != owner_dealer_id` (Sesión 10) ya cubren el concepto básico
- Añadir:
  - IDs visuales con prefijo: vehículos propios = V42, intermediación = P3 (legacy de Tank Ibérica, usar `fileNaming.ts`)
  - Estados propios para intermediación: Disponible, Reservado, En gestión, Vendido
  - Campos del propietario real: nombre, contacto, notas (solo visibles para el dealer, NO público)
  - Gastos e ingresos por vehículo intermediado (sub-balance por operación)
  - Cálculo de beneficio: comisión pactada - gastos de gestión
  - Fondo visual diferenciado en listas (amarillo claro para intermediación vs blanco para propios)
- Plan mínimo: Básico

### Merchandising para dealers (`/dashboard/herramientas/merchandising`)

- Catálogo de productos físicos (tarjetas visita, imanes furgoneta, lona feria, pegatinas QR, roll-up)
- Preview automático con logo del dealer, datos, QR dinámico y URL del portal
- Pago vía Stripe one-time
- Pedido se envía automáticamente a imprenta partner (email con datos + diseño PDF generado)
- Cada producto físico lleva URL de Tracciona + QR trackeable → el dealer paga por hacer marketing de Tracciona
- Plan mínimo: Free (es gancho)
- Tabla `merch_orders` (dealer_id, product_type, quantity, design_pdf_url, stripe_payment_id, status, created_at)

### Registro de mantenimientos (`/dashboard/herramientas/mantenimientos`)

- Tabla legacy `maintenance_records` adaptada con `dealer_id` (Bloque D-BIS de migración)
- CRUD básico: fecha, vehículo (de SU catálogo), tipo (preventivo/correctivo/ITV), descripción, coste, km
- Historial por vehículo visible en la ficha interna del dealer
- Exportar a CSV
- Plan mínimo: Básico
- Útil para dealers que gestionan flotas propias de alquiler (como Tank Ibérica)

### Registro de alquileres (`/dashboard/herramientas/alquileres`)

- Tabla legacy `rental_records` adaptada con `dealer_id` (Bloque D-BIS)
- CRUD: vehículo, cliente, fecha inicio/fin, renta mensual, depósito, estado (activo/finalizado/mora)
- Calendario visual de disponibilidad por vehículo
- Alertas automáticas: fin de contrato en 30 días, vehículo disponible próximamente
- Exportar a CSV
- Plan mínimo: Básico

### Navegación del dealer actualizada

Añadir en sidebar/menú del dealer:

```
/dashboard               → Mi panel (dashboard)
/dashboard/vehiculos     → Mis vehículos
  ├ /dashboard/vehiculos/nuevo    → Publicar nuevo
  ├ /dashboard/vehiculos/importar → Importar Excel
  └ /dashboard/vehiculos          → Listado
/dashboard/leads         → Leads
/dashboard/estadisticas  → Estadísticas
/dashboard/herramientas  → Herramientas
  ├ /factura
  ├ /contrato
  ├ /presupuesto
  ├ /calculadora
  ├ /mantenimientos
  ├ /alquileres
  ├ /exportar-anuncio
  ├ /widget
  └ /exportar
/dashboard/portal        → Mi portal
/dashboard/suscripcion   → Suscripción
/dashboard/facturas      → Facturas
```

---

## SESIÓN 32 — Comercialización de datos (estilo Idealista)

> Esta es la fuente de ingresos de mayor margen a largo plazo. Activar a partir del mes 12.

**Leer:**

1. `docs/tracciona-docs/anexos/S-monetizacion-datos.md (alias de compatibilidad histórica)` — Completo
2. `docs/tracciona-docs/anexos/R-marco-legal.md (alias de compatibilidad histórica)` — Sección RGPD

**Hacer:**

### Fase A — Infraestructura de datos (mes 6-12, antes de vender nada)

#### Tablas y vistas materializadas

```sql
-- Vista materializada de mercado (cron diario a las 03:00)
CREATE MATERIALIZED VIEW market_data AS
SELECT
  vertical, action, category, subcategory, brand,
  location_province, location_country,
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS listings,
  AVG(price_cents)/100.0 AS avg_price,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price_cents)/100.0 AS median_price,
  MIN(price_cents)/100.0 AS min_price,
  MAX(price_cents)/100.0 AS max_price,
  AVG(EXTRACT(EPOCH FROM (sold_at - created_at))/86400) AS avg_days_to_sell,
  COUNT(*) FILTER (WHERE status = 'sold') AS sold_count
FROM vehicles
WHERE status IN ('published','sold','expired')
GROUP BY vertical, action, category, subcategory, brand, location_province, location_country, month
HAVING COUNT(*) >= 5;  -- Mínimo 5 para anonimización

-- Vista de demanda (qué busca la gente)
CREATE MATERIALIZED VIEW demand_data AS
SELECT
  vertical,
  (filters->>'category')::text AS category,
  (filters->>'subcategory')::text AS subcategory,
  (filters->>'brand')::text AS brand,
  (filters->>'province')::text AS province,
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS alert_count
FROM search_alerts
WHERE active = true
GROUP BY vertical, category, subcategory, brand, province, month;

-- Vista de precios históricos (para tendencias)
CREATE MATERIALIZED VIEW price_history AS
SELECT
  vertical, category, subcategory, brand,
  DATE_TRUNC('week', created_at) AS week,
  AVG(price_cents)/100.0 AS avg_price,
  COUNT(*) AS sample_size
FROM vehicles
WHERE price_cents > 0 AND status IN ('published','sold')
GROUP BY vertical, category, subcategory, brand, week
HAVING COUNT(*) >= 3;
```

#### Tracking de eventos para datos de demanda

- Tabla `analytics_events` (id, vertical, event_type, entity_type, entity_id, metadata JSONB, session_id, created_at)
- Eventos a trackear (además de GA4):
  - `vehicle_view`: qué fichas se ven y desde dónde
  - `search_performed`: qué filtros se aplican en el catálogo
  - `lead_sent`: contactos enviados a dealers
  - `favorite_added`: qué vehículos se guardan
  - `price_change`: cuando un dealer cambia el precio (old_price, new_price)
  - `vehicle_sold`: fecha de venta, días en catálogo, precio final vs inicial
- Cron semanal: agregar eventos en `analytics_events` y actualizar vistas materializadas
- RLS: solo admin puede leer analytics_events

### Fase B — Datos para uso interno (mes 6-12, gratis, genera valor)

#### Valoración automática en ficha del dealer

Cuando un dealer publica un vehículo:

- Comparar precio con `market_data` (misma categoría, subcategoría, marca, año similar, provincia)
- Mostrar badge: "🟢 Precio competitivo", "🟡 Por encima del mercado (+12%)", "🔴 Muy por encima (+30%)"
- Sugerir rango de precio recomendado
- Esto genera confianza del comprador y motiva al dealer a poner precios realistas

#### Índice de precios público (SEO + autoridad)

- Página `/precios` (pública, indexable): "Índice de precios de vehículos industriales en España"
- Grid de categorías con precio medio, tendencia (↑↓), volumen
- Ejemplo: "Cisternas alimentarias: precio medio 35.000€ (↑12% vs trimestre anterior)"
- Gráficos de tendencia de los últimos 12 meses por categoría
- Esto es lo que hace Idealista con su índice de precios — genera backlinks, autoridad SEO, y posiciona a Tracciona como referencia del sector
- Schema JSON-LD Dataset para que Google lo indexe como fuente de datos
- Actualizar automáticamente cada mes (cron que regenera la página)

#### Informe de mercado trimestral (PDF)

- Generar PDF automáticamente desde `market_data`:
  - Portada con branding Tracciona
  - Resumen ejecutivo (2 párrafos)
  - Precios medios por categoría con gráficos
  - Top marcas por volumen
  - Zonas geográficas más activas
  - Tiempo medio de venta
  - Tendencias (qué sube, qué baja)
- Los primeros 2-3 informes: enviarlo GRATIS a financieras, asociaciones y fabricantes como gancho
- Publicar versión resumida en `/guia/` como artículo evergreen (SEO)

### Fase C — Productos de datos de pago (mes 12-18)

#### 1. Informe de valoración individual (50-100€)

- Página `/valoracion`: el usuario introduce marca, modelo, año, km, provincia
- El sistema consulta `market_data` + `price_history` y genera:
  - Precio estimado (rango min-max)
  - Comparativa con mercado actual
  - Tendencia de precio (subiendo/bajando)
  - Tiempo estimado de venta
  - Recomendación de precio
- Versión básica: gratis (solo rango de precio, sin detalle)
- Versión completa: 50-100€ (informe PDF detallado con gráficos)
- Pago por Stripe (cobro único)
- Añadir a tabla `invoices` como tipo 'valuation_report'

#### 2. Suscripción a datos sectoriales (500-1.000€/trimestre)

- Dashboard privado para suscriptores (financieras, aseguradoras, fabricantes):
  - Acceso a `market_data` filtrable por categoría, zona, periodo
  - Gráficos interactivos de tendencias
  - Exportar a CSV/Excel
  - Alertas automáticas: "Los precios de X han variado >10% este mes"
- Página `/datos` con comparativa de planes:
  - Básico (500€/trim): datos agregados por categoría, actualización mensual
  - Premium (1.000€/trim): datos por subcategoría+marca+zona, actualización semanal, alertas
  - Enterprise (a medida): API, dataset completo, soporte dedicado
- Tabla `data_subscriptions` (id, company_name, plan, stripe_subscription_id, api_key, active)
- Autenticación por API key para acceso programmático

#### 3. API de valoración (1-5€/consulta)

- Endpoint autenticado: `GET /api/v1/valuation?brand=indox&model=alimentaria&year=2019&km=120000`
- Respuesta JSON:

```json
{
  "estimated_price": { "min": 32000, "median": 35000, "max": 38000 },
  "market_trend": "rising",
  "trend_pct": 4.2,
  "avg_days_to_sell": 45,
  "sample_size": 23,
  "confidence": "high",
  "data_date": "2027-01-15"
}
```

- Rate limiting: 100 consultas/día (básico), 1.000/día (premium), ilimitado (enterprise)
- Documentación de API en `/api/docs` (Swagger/OpenAPI)
- Tabla `api_usage` (api_key, endpoint, params JSONB, response_time_ms, created_at) para tracking

#### 4. Dataset anualizado (2.000-5.000€)

- CSV/JSON anonimizado con todos los datos del año:
  - Precios por categoría/subcategoría/marca/zona/mes
  - Volúmenes de oferta y demanda
  - Tiempos de venta
  - Tendencias
- Generado automáticamente en enero (cron)
- Entregado por email o descarga autenticada
- Sin datos personales, sin IDs, sin posibilidad de re-identificación

### Fase D — Escalado multi-vertical (mes 18+)

Cuando haya 2+ verticales, los datos se multiplican:

- "Índice de precios de equipamiento hostelero en España" (Horecaria)
- "Índice de precios de maquinaria agrícola" (CampoIndustrial)
- Cross-vertical insights: "La demanda de cisternas alimentarias sube cuando bajan las inversiones en hostelera" (análisis cruzado)
- Cada vertical genera sus propias vistas materializadas con el mismo código (filtrado por `vertical`)

### Compliance de datos

- **Anonimización real:** Nunca vender datos de menos de 5 vehículos por grupo (cláusula HAVING >= 5)
- **RGPD Art. 6.1.f:** Interés legítimo para datos anonimizados. Para datos agregados no personales, el RGPD no aplica
- **Política de privacidad:** Sección explícita: "Tracciona utiliza datos anonimizados y agregados del marketplace para generar informes de mercado. Estos datos nunca permiten identificar a usuarios individuales."
- **Términos del dealer:** Al registrarse, el dealer acepta que los precios de sus publicaciones se usen de forma anonimizada en informes de mercado
- **UK Data Protection Act 2018:** Mismas garantías de anonimización aplican

---

## SESIÓN 33 — Monitorización de infraestructura, pipeline de imágenes híbrido y migración de clusters

> Sistema de alertas proactivas para saber cuándo escalar, pipeline híbrido Cloudinary→CF Images para optimizar costes de imágenes, y herramientas de migración de clusters Supabase ejecutables desde el admin.

**Leer:**

1. `docs/tracciona-docs/anexos/N-seguridad-mantenimiento.md (alias de compatibilidad histórica)` — Arquitectura de seguridad por capas
2. `docs/tracciona-docs/anexos/W-panel-configuracion.md (alias de compatibilidad histórica)` — Estructura de `vertical_config` y principios del admin
3. `docs/tracciona-docs/anexos/X-integraciones-externas.md (alias de compatibilidad histórica)` — Integraciones actuales
4. `app/pages/admin/index.vue` — Dashboard actual (patrón de KPIs y notificaciones)
5. `app/components/admin/layout/AdminSidebar.vue` — Sidebar del admin (para añadir sección)
6. `server/api/push/send.post.ts` — Sistema de push notifications existente
7. `nuxt.config.ts` — Configuración actual (Cloudinary, runtime config)

**Hacer:**

### Parte A — Panel de monitorización de infraestructura

#### A.1 Variables de entorno

Añadir a `.env` y registrar en `nuxt.config.ts` → `runtimeConfig` (NO en `public`):

```env
# Cloudflare API
CLOUDFLARE_API_TOKEN=           # Token con permisos de lectura de analytics
CLOUDFLARE_ACCOUNT_ID=          # ID de la cuenta de Cloudflare
CLOUDFLARE_IMAGES_ACCOUNT_HASH= # Hash de la cuenta para CF Images

# Supabase Management API
SUPABASE_PROJECT_REF=gmnrfuzekbwyzkgsaftv
SUPABASE_MANAGEMENT_API_KEY=    # Token de la Management API

# Sentry
SENTRY_ORG_SLUG=
SENTRY_AUTH_TOKEN=              # Token con scope project:read

# Cloudflare Images
CLOUDFLARE_IMAGES_API_TOKEN=
CLOUDFLARE_IMAGES_DELIVERY_URL= # https://imagedelivery.net/{account_hash}

# Pipeline config
IMAGE_PIPELINE_MODE=hybrid       # 'cloudinary', 'hybrid', 'cf_images_only'

# Umbrales de alerta
INFRA_ALERT_THRESHOLD_WARNING=70
INFRA_ALERT_THRESHOLD_CRITICAL=85
INFRA_ALERT_THRESHOLD_EMERGENCY=95
```

#### A.2 Migración SQL — `supabase/migrations/00051_infra_monitoring.sql`

3 tablas nuevas:

**`infra_metrics`** — Snapshots horarios de métricas por componente:

- `id` UUID PK, `vertical` VARCHAR DEFAULT 'global', `component` VARCHAR NOT NULL ('supabase', 'cloudflare', 'cloudinary', 'cf_images', 'resend', 'sentry')
- `metric_name` VARCHAR NOT NULL ('db_size_bytes', 'connections_used', 'transformations_used', etc.)
- `metric_value` NUMERIC NOT NULL, `metric_limit` NUMERIC (límite del plan actual)
- `usage_percent` NUMERIC GENERATED ALWAYS AS (CASE WHEN metric_limit > 0 THEN ROUND((metric_value / metric_limit) \* 100, 1) ELSE NULL END) STORED
- `recorded_at` TIMESTAMPTZ DEFAULT now(), `metadata` JSONB DEFAULT '{}'
- Índices: por component+metric_name, por recorded_at DESC, por usage_percent DESC
- RLS: solo admins pueden SELECT

**`infra_alerts`** — Alertas generadas con cooldown anti-spam:

- `id` UUID PK, `component` VARCHAR, `metric_name` VARCHAR, `alert_level` VARCHAR ('warning', 'critical', 'emergency')
- `message` TEXT, `sent_at` TIMESTAMPTZ DEFAULT now()
- `acknowledged_at` TIMESTAMPTZ (NULL = sin reconocer), `acknowledged_by` UUID REFERENCES users(id)
- Índice: por acknowledged_at WHERE NULL
- RLS: admins can ALL

**`infra_clusters`** — Configuración de clusters Supabase:

- `id` UUID PK, `name` VARCHAR, `supabase_url` TEXT, `supabase_anon_key` TEXT, `supabase_service_role_key` TEXT
- `verticals` TEXT[] DEFAULT '{}', `weight_used` NUMERIC DEFAULT 0, `weight_limit` NUMERIC DEFAULT 4.0
- `status` VARCHAR DEFAULT 'active' ('active', 'migrating', 'full')
- `created_at` TIMESTAMPTZ, `metadata` JSONB
- RLS: admins can ALL
- Seed: INSERT cluster actual ('cluster-principal', URL actual, keys placeholder, ARRAY['tracciona'], weight 1.0)

Además: `ALTER TABLE vertical_config ADD COLUMN IF NOT EXISTS infra_weight NUMERIC DEFAULT 1.0;`

Pesos default por tipo de vertical:

- 🔴 Pesada (1.0): tracciona, horecaria, campoindustrial
- 🟡 Media (0.4): resolar
- 🟢 Ligera (0.15): municipiante, clinistock, boxport

#### A.3 Server routes de métricas

**`server/api/cron/infra-metrics.post.ts`** — Cron horario (protegido por CRON_SECRET). Consulta APIs de cada componente y guarda snapshots:

| Componente | Métrica              | API                                                 | Límite free/pro  |
| ---------- | -------------------- | --------------------------------------------------- | ---------------- |
| Supabase   | db_size_bytes        | Management API GET /v1/projects/{ref}/database/size | 500MB / 8GB      |
| Supabase   | connections_active   | Query: SELECT count(\*) FROM pg_stat_activity       | 60 / 200         |
| Cloudflare | workers_requests_day | CF Analytics API                                    | 100K / 10M       |
| Cloudinary | transformations_used | Cloudinary Admin API GET /usage                     | 25K / 100K       |
| Cloudinary | storage_used_bytes   | Cloudinary Admin API GET /usage                     | 25GB             |
| CF Images  | images_stored        | CF Images API GET /accounts/{id}/images/v1/stats    | $5/100K          |
| Resend     | emails_sent_today    | Resend API (contar)                                 | 100/day / 50K/mo |
| Sentry     | events_month         | Sentry API GET /api/0/organizations/{org}/stats/    | 5K / 50K         |

**IMPORTANTE:** Si una API key no está configurada, SALTAR ese componente (log warning, no error). El panel muestra "No configurado" en gris.

Lógica de alertas con cooldown:

- `emergency` (≥95%): email (Resend) + push + insertar alerta. Cooldown: 24h
- `critical` (≥85%): solo insertar alerta visible en dashboard. Cooldown: 48h
- `warning` (≥70%): solo insertar alerta. Cooldown: 7 días

**`server/api/infra/metrics.get.ts`** — Requiere admin auth. Params: `?component=supabase&period=24h` (24h, 7d, 30d). Devuelve snapshots con tendencias.

**`server/api/infra/alerts.get.ts`** — Alertas no reconocidas. Param `?all=true` para historial.

**`server/api/infra/alerts/[id].patch.ts`** — Marcar alerta como reconocida.

#### A.4 Notificaciones automáticas

Cuando nivel `emergency`:

1. **Email** via Resend → template `server/utils/email-templates/infra-alert.ts`
   - Subject: `🔴 [Tracciona] Alerta infraestructura: {componente} al {usage}%`
   - Body: métrica, valor vs límite, enlace a `/admin/infraestructura`
2. **Push** via `server/api/push/send.post.ts` existente
   - Title: `⚠️ Infraestructura: {componente}`
   - URL: `/admin/infraestructura`

#### A.5 Composables

**`app/composables/useInfraMetrics.ts`** — Fetch y cache de métricas + alertas para la página admin.

**`app/composables/useInfraRecommendations.ts`** — Mensajes de acción recomendada por componente y umbral:

| Componente + umbral               | Recomendación                                           |
| --------------------------------- | ------------------------------------------------------- |
| Supabase cluster peso > 80%       | "Crear nuevo cluster y migrar verticales ligeras"       |
| Cloudinary transformaciones > 70% | "Verificar pipeline híbrido (CF Images) activo"         |
| Cloudinary transformaciones > 90% | "Upgrade a Plus ($89/mes) o activar pipeline híbrido"   |
| CF Workers requests > 70%         | "Revisar SWR de routeRules"                             |
| Resend emails > 80%               | "Upgrade a Resend Pro ($20/mes)"                        |
| Sentry eventos > 80%              | "Upgrade a Sentry Team ($26/mes) o ajustar sample rate" |

#### A.6 Página `/admin/infraestructura.vue`

Página con 4 tabs:

**Tab 1: Estado actual** — Grid de cards por componente. Cada card muestra métricas con barras de progreso, icono de estado (✅ verde <70%, ⚠️ amarillo 70-85%, 🔴 rojo >85%, ⚫ gris no configurado). Sección especial de capacidad de clusters con barra de peso y detalle de verticales.

**Tab 2: Alertas** — Lista filtrable (todas / sin reconocer / por componente). Botón "Marcar como vista".

**Tab 3: Historial** — Gráficos con Chart.js (ya instalado). Selector de periodo (24h, 7d, 30d). Un gráfico por componente.

**Tab 4: Migración** — Vista de clusters + wizard de migración (ver Parte C).

#### A.7 Sidebar del admin

Añadir en `AdminSidebar.vue` un nuevo enlace al final, antes de Configuración:

```
🖥️ Infraestructura → /admin/infraestructura
```

Con badge-dot si hay alertas `critical`/`emergency` sin reconocer.

---

### Parte B — Pipeline híbrido Cloudinary → Cloudflare Images

#### B.1 Server route `server/api/images/process.post.ts`

Flujo del pipeline:

```
Recibe URL Cloudinary (tras upload del dealer)
  ↓
Pide 4 variantes procesadas a Cloudinary:
  - thumb:   w_300,h_200,c_fill,g_auto,e_improve,q_auto,f_webp
  - card:    w_600,h_400,c_fill,g_auto,e_improve,q_auto,f_webp
  - gallery: w_1200,h_800,c_fill,g_auto,e_improve,q_auto,f_webp
  - og:      w_1200,h_630,c_fill,g_auto,e_improve,q_auto,f_webp
  ↓
Descarga las 4 variantes como buffer
  ↓
Sube cada variante a CF Images vía API
  ↓
Devuelve URLs de CF Images
  ↓
(Opcional) Borra original de Cloudinary
```

Controlado por `IMAGE_PIPELINE_MODE`:

- `cloudinary`: no hace nada, devuelve URLs Cloudinary (backward compatible)
- `hybrid`: pipeline completo
- `cf_images_only`: sube directo a CF Images sin Cloudinary (sin mejora de calidad)

#### B.2 Setup de variantes en CF Images

`server/api/infra/setup-cf-variants.post.ts` — Crea las 4 variantes (thumb, card, gallery, og) en CF Images via API. Ejecutar 1 sola vez. Admin auth.

#### B.3 Composable `app/composables/useImageUrl.ts`

Devuelve URL correcta según origen de la imagen:

- Si URL contiene `imagedelivery.net` → `{url}/{variant}` (CF Images)
- Si URL contiene `cloudinary.com` → insertar transformaciones en URL

Todos los componentes que muestran imágenes deben usar este composable. Imágenes antiguas (Cloudinary) y nuevas (CF Images) conviven sin problemas.

#### B.4 Migración batch de imágenes existentes

`server/api/infra/migrate-images.post.ts` — Admin auth. Recibe `{ batchSize: 50 }`. Lee vehículos con imágenes en Cloudinary, ejecuta pipeline para cada una, actualiza URLs en BD. Devuelve progreso: `{ processed: 50, remaining: 234, errors: 2 }`. Ejecutable desde admin con botón "Migrar imágenes pendientes".

#### B.5 Integrar pipeline en uploads existentes

Buscar componentes de upload de imágenes en el proyecto. El flujo actual:

```
[Vue] → upload a Cloudinary → guardar URL en BD
```

Cambiar a:

```
[Vue] → upload a Cloudinary → POST /api/images/process → guardar URLs CF Images en BD
```

Solo se activa si `IMAGE_PIPELINE_MODE !== 'cloudinary'`.

#### B.6 Sección "Imágenes" en admin/infraestructura

Dentro de las cards de componentes, Cloudinary y CF Images muestran:

- Pipeline activo: `hybrid` / `cloudinary` / `cf_images_only`
- Imágenes en Cloudinary: X (pendientes de migrar)
- Imágenes en CF Images: Y
- Botón: "Migrar imágenes pendientes"
- Botón: "Configurar variantes CF Images" (1 vez)
- Toggle de modo pipeline (con instrucciones para cambiar env var en Cloudflare Pages)

---

### Parte C — Herramientas de migración de clusters Supabase

#### C.1 Server routes de clusters

- `server/api/infra/clusters/index.get.ts` — Listar clusters con verticales y peso
- `server/api/infra/clusters/index.post.ts` — Crear cluster nuevo (nombre, URL, keys)
- `server/api/infra/clusters/[id].patch.ts` — Actualizar cluster
- `server/api/infra/clusters/[id]/prepare-migration.post.ts` — Generar plan de migración
- `server/api/infra/clusters/[id]/execute-migration.post.ts` — Ejecutar migración
- `server/api/infra/clusters/[id]/verify-migration.post.ts` — Verificar post-migración

Todos protegidos por admin auth.

#### C.2 Plan de migración

El endpoint `prepare-migration` recibe `{ verticalToMigrate: 'horecaria', targetClusterId: 'uuid' }` y devuelve:

- Lista de tablas a copiar con filtro por vertical y filas estimadas:
  - vehicles, dealers, categories, subcategories, attributes, articles, content_translations, vertical_config, active_landings, geo_regions (shared)
- Tablas que NO se copian: users, infra_metrics, infra_alerts
- Variables de entorno a cambiar en Cloudflare Pages
- Tiempo estimado, warnings (auth separado, imágenes no requieren migración)

#### C.3 Ejecución de migración

Lógica paso a paso:

1. Status cluster origen → 'migrating'
2. Para cada tabla: SELECT con filtro → INSERT en destino → verificar conteo
3. Actualizar `infra_clusters`: quitar vertical del origen, añadir al destino, recalcular peso
4. Status → 'active'
5. Log en `activity_logs`

**NO borra datos del origen.** Solo copia. Borrado manual después de verificar.

#### C.4 Wizard de migración en admin (Tab 4)

Vista de clusters con barra de peso visual. 5 pasos:

1. **Seleccionar vertical** — Dropdown de verticales del cluster origen
2. **Seleccionar destino** — Dropdown de clusters o "Crear nuevo"
3. **Revisar plan** — Tablas, filas, warnings
4. **Ejecutar** — Con checkbox de confirmación
5. **Resultado** — Progreso, verificación, instrucciones para Cloudflare Pages

Al crear nuevo cluster, mostrar instrucciones:

1. Crear proyecto en supabase.com/dashboard
2. Copiar URL, anon key, service role key
3. Aplicar migraciones: `npx supabase db push --project-ref NUEVO_REF`
4. Introducir datos en formulario

---

### Resumen de archivos a crear

| Archivo                                                    | Tipo           |
| ---------------------------------------------------------- | -------------- |
| `supabase/migrations/00051_infra_monitoring.sql`           | Migración SQL  |
| `server/api/infra/collect-metrics.post.ts`                 | Server route   |
| `server/api/infra/metrics.get.ts`                          | Server route   |
| `server/api/infra/alerts.get.ts`                           | Server route   |
| `server/api/infra/alerts/[id].patch.ts`                    | Server route   |
| `server/api/infra/setup-cf-variants.post.ts`               | Server route   |
| `server/api/infra/migrate-images.post.ts`                  | Server route   |
| `server/api/infra/clusters/index.get.ts`                   | Server route   |
| `server/api/infra/clusters/index.post.ts`                  | Server route   |
| `server/api/infra/clusters/[id].patch.ts`                  | Server route   |
| `server/api/infra/clusters/[id]/prepare-migration.post.ts` | Server route   |
| `server/api/infra/clusters/[id]/execute-migration.post.ts` | Server route   |
| `server/api/infra/clusters/[id]/verify-migration.post.ts`  | Server route   |
| `server/api/cron/infra-metrics.post.ts`                    | Cron job       |
| `server/api/images/process.post.ts`                        | Server route   |
| `server/utils/email-templates/infra-alert.ts`              | Email template |
| `app/composables/useImageUrl.ts`                           | Composable     |
| `app/composables/useInfraRecommendations.ts`               | Composable     |
| `app/composables/useInfraMetrics.ts`                       | Composable     |
| `app/pages/admin/infraestructura.vue`                      | Página admin   |

### Archivos a modificar

| Archivo                                        | Cambio                                                   |
| ---------------------------------------------- | -------------------------------------------------------- |
| `.env`                                         | Añadir variables de CF Images, Management APIs, umbrales |
| `nuxt.config.ts`                               | Registrar nuevas variables en runtimeConfig              |
| `app/components/admin/layout/AdminSidebar.vue` | Añadir enlace Infraestructura con badge                  |
| Componentes de upload de imágenes              | Integrar pipeline híbrido                                |

### Orden de ejecución

1. Migración SQL (00051)
2. Variables de entorno en .env y nuxt.config.ts
3. Composables (useImageUrl, useInfraRecommendations, useInfraMetrics)
4. Server routes de métricas + cron
5. Server routes de imágenes + setup variantes
6. Server routes de clusters + migración
7. Página admin/infraestructura.vue (4 tabs)
8. Sidebar: añadir enlace con badge
9. Email template + integración push
10. Integrar pipeline en uploads existentes

### Preguntas para el usuario antes de implementar

1. ¿Tienes cuenta de Cloudflare Images activa? Si no, activarla en CF dashboard ($5/mes).
2. ¿Email de alertas: tankiberica@gmail.com u otro?
3. ¿Puedes generar Supabase Management API Key? (supabase.com/dashboard/account/tokens, scope projects.read)
4. ¿Tienes API key + secret de Cloudinary del dashboard actual?
5. ¿Borrado de datos del cluster origen tras migración: manual (recomendado) o automático?

---

## SESIÓN 34 — Auditoría de seguridad: remediación completa

> Correcciones de seguridad identificadas por auditoría externa. Ordenadas por criticidad. Todos los fixes deben aplicarse ANTES de lanzar a producción.

**Leer:**

1. `server/api/stripe/checkout.post.ts` — Endpoint sin auth
2. `server/api/stripe/portal.post.ts` — Endpoint sin auth
3. `server/api/stripe/webhook.post.ts` — Webhook sin verificación de firma obligatoria
4. `server/api/stripe-connect-onboard.post.ts` — Endpoint sin auth
5. `server/api/whatsapp/webhook.post.ts` — Webhook sin verificación de firma de Meta
6. `server/api/email/send.post.ts` — Endpoint abierto con service role
7. `server/api/cron/*.post.ts` — Crons que aceptan ejecución sin secreto
8. `server/middleware/rate-limit.ts` + `server/utils/rateLimit.ts` — Rate limit en memoria
9. `server/utils/verifyTurnstile.ts` — Falla abierto sin secreto
10. `nuxt.config.ts` — devtools, CORS, encoding

**Hacer:**

### Parte A — CRÍTICOS (arreglar primero, sin excepción)

#### A.1 Autenticación en endpoints de Stripe

**Problema:** `checkout.post.ts`, `portal.post.ts` y `stripe-connect-onboard.post.ts` aceptan `userId`, `customerId` o `dealerId` del body sin verificar que el usuario autenticado es quien dice ser. Cualquiera puede crear sesiones de checkout o portales para otros usuarios.

**Fix para `server/api/stripe/checkout.post.ts`:**

Añadir `import { serverSupabaseUser } from '#supabase/server'` al inicio. Dentro del handler, antes de leer body: obtener `user` con `serverSupabaseUser(event)`, si no hay user → 401. Eliminar `userId` del body, usar `user.id` directamente. Validar `successUrl` y `cancelUrl` con `isAllowedUrl()` (util a crear).

**Fix para `server/api/stripe/portal.post.ts`:**

Mismo patrón de auth. Además, verificar que `customerId` del body pertenece al usuario autenticado consultando `subscriptions` donde `user_id = user.id AND stripe_customer_id = customerId`. Si no coincide → 403. Validar `returnUrl` con `isAllowedUrl()`.

**Fix para `server/api/stripe-connect-onboard.post.ts`:**

Mismo patrón de auth. Verificar que `dealerId` del body pertenece al usuario autenticado consultando `dealers` donde `id = dealerId AND user_id = user.id`. Si no coincide → 403. Validar `returnUrl` y `refreshUrl` con `isAllowedUrl()`.

**Crear `server/utils/isAllowedUrl.ts`:**

```typescript
export function isAllowedUrl(url: string): boolean {
  const ALLOWED_ORIGINS = [
    'https://tracciona.com',
    'https://www.tracciona.com',
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '',
  ].filter(Boolean)
  try {
    const parsed = new URL(url)
    return ALLOWED_ORIGINS.some((origin) => parsed.origin === origin)
  } catch {
    return false
  }
}
```

#### A.2 Webhook de Stripe: fallo cerrado obligatorio

**Problema:** Si `STRIPE_WEBHOOK_SECRET` no está configurado, el webhook procesa eventos sin verificación de firma.

**Fix en `server/api/stripe/webhook.post.ts`:** Reemplazar el bloque if/else de verificación de firma. Si no hay `webhookSecret`: en producción → throw 500 "Webhook secret not configured"; en dev → warn y parsear sin firma. Si hay secreto pero falta header `stripe-signature` → throw 400. Si la firma no valida → throw 400.

#### A.3 Webhook de WhatsApp: verificación de firma de Meta

**Problema:** No se valida `X-Hub-Signature-256`. Cualquiera puede inyectar mensajes falsos.

**Fix en `server/api/whatsapp/webhook.post.ts`:** Añadir verificación de firma al inicio del handler. En producción: leer `WHATSAPP_APP_SECRET`, leer header `x-hub-signature-256`, usar `readRawBody` + `createHmac('sha256', appSecret)` para calcular firma esperada `sha256=...`, comparar con la recibida. Si no coincide → return error. Parsear body desde raw. En dev: mantener `readBody` sin verificación.

Nuevas variables: `.env`: `WHATSAPP_APP_SECRET=` | `nuxt.config.ts` → `runtimeConfig.whatsappAppSecret`

---

### Parte B — ALTOS (arreglar antes de lanzar)

#### B.1 Email send: requiere autenticación

**Problema:** `/api/email/send` está abierto con service role.

**Fix en `server/api/email/send.post.ts`:** Doble vía de acceso: (1) llamadas internas con header `x-internal-secret` = CRON_SECRET, (2) usuarios autenticados con `serverSupabaseUser`. Si no es ninguna → 401. Si es usuario, forzar `body.userId = user.id` para impedir enviar emails como otro usuario. Buscar en el proyecto todos los callers de `/api/email/send` y añadir auth o internal secret según corresponda.

#### B.2 Cron endpoints: fallo cerrado sin secreto

**Problema:** `if (cronSecret && body?.secret !== cronSecret)` permite ejecución si cronSecret es falsy.

**Crear `server/utils/verifyCronSecret.ts`:** Función que lee `CRON_SECRET`. Si no existe: en producción → throw 500; en dev → warn y continuar. Si existe y no coincide → throw 401.

**Modificar TODOS los archivos en `server/api/cron/*.post.ts`:** Reemplazar el patrón actual de verificación por llamada a `verifyCronSecret(body?.secret)`. Archivos: auto-auction, dealer-weekly-stats, favorite-price-drop, favorite-sold, freshness-check, publish-scheduled, search-alerts, infra-metrics, y cualquier otro que exista.

---

### Parte C — MEDIOS (arreglar antes de lanzar, menor urgencia)

#### C.1 Rate limiting: migrar a Cloudflare WAF

**Problema:** Rate limit en memoria local no funciona en Workers/serverless.

**Fix recomendado: Cloudflare WAF Rate Limiting (zero code).** El usuario configura en CF Dashboard → Security → WAF → Rate limiting rules:

- `/api/email/send`: 10 req/min por IP
- `/api/stripe/*`: 20 req/min por IP
- `/api/account/delete`: 2 req/min por IP
- `/api/lead*` POST: 5 req/min por IP
- `/api/*` POST/PUT/PATCH/DELETE: 30 req/min por IP

Tras configurar: ELIMINAR `server/middleware/rate-limit.ts` y `server/utils/rateLimit.ts`.

**PREGUNTAR al usuario:** "¿Configuras las reglas de rate limiting en Cloudflare WAF o prefieres mantener el código actual con un comentario explicando su limitación?"

#### C.2 CORS restrictivo

**Fix en `nuxt.config.ts`:** Eliminar `'/api/**': { cors: true }`. Añadir CORS solo a rutas que lo necesitan: `merchant-feed*`, `__sitemap*`, `health*`. El resto de rutas `/api/*` no necesitan CORS.

#### C.3 Devtools deshabilitado en producción

**Fix en `nuxt.config.ts`:** `devtools: { enabled: process.env.NODE_ENV !== 'production' }`

---

### Parte D — BAJOS / CALIDAD

#### D.1 Encoding roto en textos

Verificar que `nuxt.config.ts` está en UTF-8 sin BOM. Si no, reconvertir con `iconv`. Buscar textos con mojibake y corregir.

#### D.2 Turnstile: fallo cerrado en producción

En `server/utils/verifyTurnstile.ts`: si no hay secreto Y `NODE_ENV === 'production'` → return `false` (fallo cerrado). En dev: return `true`.

#### D.3 Logging sensible en WhatsApp webhook

Reemplazar `console.warn` del payload completo por log mínimo (solo número de entries recibidas, no contenido).

#### D.4 Service role encapsulado

Crear `server/utils/supabaseAdmin.ts` con `useSupabaseAdmin(event)` (wrapper de `serverSupabaseServiceRole`) y `useSupabaseRest()` (helper REST con headers preconfigurados). Nuevos endpoints deben usar estos helpers. Refactorizar los existentes progresivamente.

#### D.5 Protección CSRF

Crear `server/utils/verifyCsrf.ts` que verifica header `x-requested-with: XMLHttpRequest`. Añadir a: `account/delete`, `stripe/checkout`, `stripe/portal`, `stripe-connect-onboard`. En frontend, añadir el header en las llamadas `$fetch`. NO añadir a webhooks (son server-to-server).

#### D.6 .env.example

Crear `.env.example` con todas las variables sin valores. Verificar `.gitignore` incluye `.env`. Verificar que nunca se ha commiteado con `git log`.

---

### Resumen de archivos

**Crear:** `server/utils/verifyCronSecret.ts`, `server/utils/verifyCsrf.ts`, `server/utils/supabaseAdmin.ts`, `server/utils/isAllowedUrl.ts`, `.env.example`

**Modificar:**

| Archivo                                     | Cambio                        | Prioridad  |
| ------------------------------------------- | ----------------------------- | ---------- |
| `server/api/stripe/checkout.post.ts`        | Auth + URL validation + CSRF  | 🔴 Crítico |
| `server/api/stripe/portal.post.ts`          | Auth + ownership check + CSRF | 🔴 Crítico |
| `server/api/stripe-connect-onboard.post.ts` | Auth + ownership check + CSRF | 🔴 Crítico |
| `server/api/stripe/webhook.post.ts`         | Fallo cerrado sin secreto     | 🔴 Crítico |
| `server/api/whatsapp/webhook.post.ts`       | Firma Meta + log mínimo       | 🔴 Crítico |
| `.env` + `nuxt.config.ts` runtimeConfig     | WHATSAPP_APP_SECRET           | 🔴 Crítico |
| `server/api/email/send.post.ts`             | Auth requerida                | 🟠 Alto    |
| `server/api/cron/*.post.ts` (todos)         | verifyCronSecret()            | 🟠 Alto    |
| `nuxt.config.ts`                            | devtools + CORS + encoding    | 🟡 Medio   |
| `server/middleware/rate-limit.ts`           | Eliminar (tras WAF)           | 🟡 Medio   |
| `server/utils/rateLimit.ts`                 | Eliminar (tras WAF)           | 🟡 Medio   |
| `server/utils/verifyTurnstile.ts`           | Fallo cerrado prod            | 🟢 Bajo    |
| `server/api/account/delete.post.ts`         | CSRF                          | 🟢 Bajo    |

### Orden de ejecución

1. Crear utils (verifyCronSecret, isAllowedUrl, verifyCsrf, supabaseAdmin)
2. Críticos A.1 — Auth en 3 endpoints Stripe
3. Crítico A.2 — Fallo cerrado webhook Stripe
4. Crítico A.3 — Firma Meta en webhook WhatsApp + env var
5. Alto B.1 — Auth en email/send
6. Alto B.2 — verifyCronSecret en todos los crons
7. Medio C.1 — Rate limiting (preguntar WAF vs mantener)
8. Medio C.2 — CORS granular
9. Medio C.3 — Devtools
10. Bajos D.1-D.6 — Encoding, Turnstile, logging, supabaseAdmin, CSRF, .env.example
11. Verificar — `npm run build` + `npm run lint` + `npm run typecheck`

### Tests mínimos post-remediación

- [ ] checkout.post: sin auth → 401; successUrl de otro dominio → 400
- [ ] portal.post: sin auth → 401; customerId de otro usuario → 403
- [ ] stripe-connect-onboard: sin auth → 401; dealerId de otro usuario → 403
- [ ] Webhook Stripe sin secreto en production → 500
- [ ] Webhook Stripe con firma inválida → 400
- [ ] Webhook WhatsApp sin firma en production → error
- [ ] email/send sin auth ni internal secret → 401
- [ ] Cron sin CRON_SECRET en production → 500
- [ ] Cron con secreto incorrecto → 401
- [ ] verifyTurnstile sin secret en production → false
- [ ] Requests con CSRF sin header X-Requested-With → 403
- [ ] npm run build compila sin errores

---

## SESIÓN 34b — Hardening, robustez y deuda técnica

> Segunda pasada de la auditoría: idempotencia, Turnstile en servidor, sanitización de logs, batching de crons, ownership en endpoints, reintentos, colas y trazabilidad. Pulir todo antes de producción.

**Leer:**

1. `server/api/stripe/webhook.post.ts` — Falta idempotencia
2. `server/utils/verifyTurnstile.ts` + `server/api/advertisements.post.ts` — Turnstile no verificado en servidor
3. `server/api/error-report.post.ts` + `server/utils/whatsappApi.ts` — Logs con PII
4. `server/api/cron/freshness-check.post.ts` — Patrón de cron sin batching
5. `server/api/whatsapp/process.post.ts` — Proceso largo sin cola
6. `app/plugins/error-handler.ts` — Trazabilidad actual
7. Todos los `server/api/cron/*.post.ts` — Mismos problemas de batching

**Hacer:**

### Parte A — Idempotencia del webhook de Stripe [punto 4 auditoría]

**Problema:** Si Stripe reenvía un evento (lo hace por diseño si no recibe 200 rápido), el código actual puede crear suscripciones, payments e invoices duplicados.

**Fix en `server/api/stripe/webhook.post.ts`:**

Añadir comprobación de idempotencia al inicio de cada case del switch, ANTES de ejecutar cualquier escritura:

```typescript
// Para checkout.session.completed:
const sessionId = session.id as string
// Comprobar si ya se procesó este checkout
const existingPayment = await fetch(
  `${supabaseUrl}/rest/v1/payments?stripe_checkout_session_id=eq.${sessionId}&status=eq.succeeded&select=id`,
  { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
)
const existingPaymentData = await existingPayment.json()
if (existingPaymentData?.length > 0) {
  // Ya procesado — return sin hacer nada
  return { received: true, idempotent: true }
}

// Para invoice.payment_succeeded:
// Comprobar si ya existe payment con stripe_subscription_id + event invoice.id
const invoiceId = invoice.id as string
const existingInvoicePayment = await fetch(
  `${supabaseUrl}/rest/v1/payments?metadata->>event_invoice_id=eq.${invoiceId}&select=id`,
  { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
)
const existingInvoiceData = await existingInvoicePayment.json()
if (existingInvoiceData?.length > 0) {
  return { received: true, idempotent: true }
}
// Además, añadir event_invoice_id al metadata del payment insert:
metadata: { event: 'invoice.payment_succeeded', event_invoice_id: invoiceId }

// Para customer.subscription.deleted:
// Comprobar si la suscripción ya está canceled
const existingSub = await fetch(
  `${supabaseUrl}/rest/v1/subscriptions?stripe_subscription_id=eq.${subscriptionId}&status=eq.canceled&select=id`,
  { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
)
const existingSubData = await existingSub.json()
if (existingSubData?.length > 0) {
  return { received: true, idempotent: true }
}
```

Patrón general: antes de escribir, comprobar si el resultado ya existe. Si existe, devolver 200 sin hacer nada.

---

### Parte B — Turnstile verificado en servidor [puntos 2/16]

**Problema:** `verifyTurnstile()` existe pero NO se llama desde ningún endpoint de formulario público. El CAPTCHA solo está en el componente Vue (cliente), que un bot ignora directamente.

**Fix — Añadir verificación de Turnstile en todos los endpoints de formularios públicos:**

Buscar todos los endpoints que reciben datos de formularios públicos (sin auth requerida). Como mínimo:

- `server/api/advertisements.post.ts` — Publicar anuncio
- Cualquier endpoint de contacto, solicitud o lead que acepte datos sin autenticación

**Cambio en cada endpoint afectado:**

```typescript
import { getRequestIP } from 'h3'

// Al inicio del handler, ANTES de procesar datos:
const turnstileToken = body.turnstileToken
if (!turnstileToken) {
  throw createError({ statusCode: 400, message: 'CAPTCHA verification required' })
}

const ip = getRequestIP(event, { xForwardedFor: true }) || undefined
const turnstileValid = await verifyTurnstile(turnstileToken, ip)
if (!turnstileValid) {
  throw createError({ statusCode: 403, message: 'CAPTCHA verification failed' })
}
```

**Cambio en los componentes Vue que usan estos formularios:**

Asegurar que `TurnstileWidget.vue` está incluido en cada formulario y que el token se envía en el body:

```typescript
const { data } = await $fetch('/api/advertisements', {
  method: 'POST',
  body: { ...formData, turnstileToken: turnstileToken.value },
})
```

**Nota para Claude Code:** Buscar en `app/components/` y `app/pages/` todos los formularios que hacen POST a endpoints públicos y verificar que incluyen TurnstileWidget + envían el token. Los formularios que requieren auth (dashboard del dealer) NO necesitan Turnstile — ya están protegidos por sesión.

---

### Parte C — Sanitización de logs con PII [punto 7]

**Problema:** Varios archivos loguean datos sensibles: números de teléfono, emails, payloads completos, IPs.

**Fix en `server/api/error-report.post.ts`:**

```typescript
// REEMPLAZAR el log actual:
console.error('[error-report]', JSON.stringify(report))

// POR log sanitizado:
const sanitizedReport = {
  message: report.message,
  url: report.url,
  source: report.source,
  component: report.component,
  timestamp: report.timestamp,
  // NO loguear: stack (puede contener datos de usuario), ip, userAgent completo
}
console.error('[error-report]', JSON.stringify(sanitizedReport))
```

**Fix en `server/utils/whatsappApi.ts`:**

```typescript
// REEMPLAZAR en sendWhatsAppMessage:
console.warn(`[WhatsApp Dev] Would send to ${to}: ${text}`)
// POR:
console.warn(`[WhatsApp Dev] Would send message (${text.length} chars)`)

// REEMPLAZAR en downloadWhatsAppMedia:
console.warn(`[WhatsApp Dev] Would download media: ${mediaId}`)
// POR:
console.warn(`[WhatsApp Dev] Would download media (id redacted)`)

// REEMPLAZAR logs de error que incluyen errorBody completo:
console.error(`[WhatsApp] Failed to send message to ${to}:`, errorBody)
// POR:
console.error(`[WhatsApp] Failed to send message: ${response.status} ${response.statusText}`)
// Solo loguear status code, no el body completo ni el número de teléfono
```

**Fix en `server/api/whatsapp/process.post.ts`:**

Revisar todos los `console.error` y `console.warn`. Eliminar datos de usuario:

- NO loguear `submission.phone_number`
- NO loguear contenido de `text_content`
- SÍ loguear IDs de submission, vehicle, y códigos de error

**Crear `server/utils/sanitizeLog.ts` (opcional pero recomendado):**

```typescript
/**
 * Redact sensitive fields from objects before logging.
 * Replaces phone numbers, emails, and long text content.
 */
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

---

### Parte D — Batching en cron jobs [punto 9]

**Problema:** Los crons hacen `SELECT *` sin límite y luego iteran uno a uno con PATCH individual. Con miles de vehículos, esto genera picos de carga en la BD y puede tardar más del timeout del Worker.

**Fix — Patrón de batching para todos los crons:**

Crear `server/utils/batchProcessor.ts`:

```typescript
/**
 * Process items in batches with configurable size and delay.
 * Prevents overloading DB with too many sequential requests.
 */
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
  let processed = 0
  let errors = 0

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

    // Delay between batches to avoid overloading
    if (i + batchSize < items.length && delayBetweenBatchesMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatchesMs))
    }
  }

  return { processed, errors }
}
```

**Aplicar a `server/api/cron/freshness-check.post.ts`:**

```typescript
// Añadir LIMIT a los queries REST:
const reminderUrl = `${supabaseUrl}/rest/v1/vehicles?${reminderQuery}&...&limit=200`

// Reemplazar el for loop por processBatch:
import { processBatch } from '../../utils/batchProcessor'

const reminderResult = await processBatch({
  items: vehiclesToRemind,
  batchSize: 50,
  processor: async (vehicle) => {
    await fetch(`${supabaseUrl}/rest/v1/vehicles?id=eq.${vehicle.id}`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ freshness_reminded_at: now.toISOString(), ... }),
    })
  },
})
reminded = reminderResult.processed
```

**Aplicar el mismo patrón a TODOS los crons que iteran:**

- `auto-auction.post.ts`
- `freshness-check.post.ts` (3 loops)
- `favorite-price-drop.post.ts`
- `favorite-sold.post.ts`
- `search-alerts.post.ts`
- `dealer-weekly-stats.post.ts`

El patrón es siempre el mismo: añadir `&limit=200` al query, usar `processBatch()`, y añadir delay entre batches.

---

### Parte E — Validación de ownership en endpoints con Service Role [punto 11]

**Problema:** La sesión 34 corrigió los endpoints de Stripe, pero hay otros endpoints que usan service role sin validar que el usuario es dueño del recurso.

**Fix — Auditar y corregir:**

Claude Code debe buscar en `server/api/` todos los endpoints que:

1. Reciben un `userId`, `dealerId`, `vehicleId` o similar en el body/params
2. Usan `serverSupabaseServiceRole` para operar sobre esos datos
3. NO verifican que el usuario autenticado es el dueño

Comando de búsqueda:

```bash
grep -rn 'serverSupabaseServiceRole\|supabaseServiceRoleKey' server/api/ | grep -v 'cron\|webhook\|infra'
```

Para cada endpoint encontrado que NO sea cron, webhook o admin:

- Añadir `serverSupabaseUser(event)` al inicio
- Verificar ownership del recurso antes de operar
- Si es un endpoint solo para admins, verificar `user.role === 'admin'`

**Excluir de esta revisión:** crons (protegidos por secret), webhooks (protegidos por firma), y endpoints de admin (protegidos por middleware admin).

---

### Parte F — isAllowedUrl como patrón obligatorio [punto 15]

**Problema:** `isAllowedUrl` se creó en la sesión 34 pero solo se usa en los endpoints de Stripe. Cualquier futuro endpoint que acepte URLs externas podría olvidarse de validar.

**Fix — Documentar y auditar:**

1. Buscar en `server/api/` todos los endpoints que reciben URLs en el body o params:

```bash
grep -rn 'Url\|url\|URL\|redirect\|return_url\|callback' server/api/ --include='*.ts'
```

2. Verificar que cada uno usa `isAllowedUrl()` si la URL se usa para redirección o se envía al cliente.

3. Añadir comentario en `server/utils/isAllowedUrl.ts`:

```typescript
/**
 * PATRÓN OBLIGATORIO: Todo endpoint que reciba URLs externas
 * (successUrl, returnUrl, redirectUrl, callbackUrl, etc.)
 * DEBE validarlas con esta función antes de usarlas.
 * Ver sesión 34 de INSTRUCCIONES-MAESTRAS.md.
 */
```

---

### Parte G — Reintentos con backoff para Supabase REST [punto 17]

**Problema:** Las llamadas REST a Supabase no tienen reintentos. Si Supabase devuelve 503 temporal o timeout, el endpoint falla directamente.

**Crear `server/utils/fetchWithRetry.ts`:**

```typescript
/**
 * Fetch with exponential backoff retry for transient errors.
 * Retries on: 429 (rate limit), 500, 502, 503, 504, network errors.
 * Does NOT retry on: 400, 401, 403, 404 (errores del cliente).
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  { maxRetries = 3, baseDelayMs = 500 } = {},
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      // No reintentar errores del cliente
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response
      }

      // Reintentar errores del servidor y rate limit
      if (response.status >= 500 || response.status === 429) {
        if (attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
      }

      return response
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('fetchWithRetry: all retries exhausted')
}
```

Refactorizar progresivamente: los nuevos endpoints y los crons (que son los que más sufren por errores transitorios) deben usar `fetchWithRetry()` en vez de `fetch()` para las llamadas a Supabase REST. NO refactorizar todo de golpe — priorizar crons y webhook de Stripe.

---

### Parte H — Proceso WhatsApp con cola/retry [punto 18]

**Problema:** `whatsapp/process.post.ts` es un proceso largo (descarga media, llama a Claude Vision, sube a Cloudinary, crea vehículo). Si falla a mitad, no hay retry automático.

**Fix — Mecanismo de retry basado en status:**

El sistema ya tiene `status: 'received' | 'processing' | 'processed' | 'failed'` en `whatsapp_submissions`. Añadir:

1. **Campo `retry_count`** en `whatsapp_submissions`:

```sql
ALTER TABLE whatsapp_submissions ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE whatsapp_submissions ADD COLUMN IF NOT EXISTS last_error TEXT;
```

2. **Lógica de retry en el cron de WhatsApp** (crear o añadir a un cron existente):

Crear `server/api/cron/whatsapp-retry.post.ts`:

```
- Buscar submissions con status = 'failed' AND retry_count < 3
- Para cada una: llamar a /api/whatsapp/process con submissionId
- Incrementar retry_count
- Si retry_count >= 3: marcar como 'permanently_failed' y notificar admin
```

3. **En `whatsapp/process.post.ts`:** Al marcar como failed, guardar también `retry_count` incrementado y `last_error`.

4. **Timeout protection:** Cloudflare Workers tienen timeout de 30s (free) o 15min (paid). El proceso de WhatsApp puede tardar más de 30s (Claude Vision + Cloudinary). Si estáis en Workers Paid, estáis bien. Si no, considerar partir el proceso en pasos asíncronos.

---

### Parte I — Trazabilidad centralizada con request IDs [punto 19]

**Problema:** Los logs usan `console.error` sin correlación entre requests. Si hay un error en producción, es difícil trazar qué request lo causó.

**Fix — Middleware de request ID + logger:**

Crear `server/middleware/request-id.ts`:

```typescript
import { defineEventHandler, setResponseHeader } from 'h3'
import { randomUUID } from 'crypto'

/**
 * Assigns a unique request ID to every incoming request.
 * Available via event.context.requestId in all handlers.
 * Also sent back in X-Request-ID response header for debugging.
 */
export default defineEventHandler((event) => {
  const requestId = (event.node.req.headers['x-request-id'] as string) || randomUUID().slice(0, 8)
  event.context.requestId = requestId
  setResponseHeader(event, 'x-request-id', requestId)
})
```

Crear `server/utils/logger.ts`:

```typescript
import type { H3Event } from 'h3'

/**
 * Structured logger that includes request ID for traceability.
 * Use this instead of console.log/error/warn in server routes.
 */
export function createLogger(event: H3Event) {
  const reqId = event.context.requestId || 'no-id'
  const path = event.path || 'unknown'

  return {
    info: (msg: string, data?: Record<string, unknown>) =>
      console.info(JSON.stringify({ level: 'info', reqId, path, msg, ...data })),
    warn: (msg: string, data?: Record<string, unknown>) =>
      console.warn(JSON.stringify({ level: 'warn', reqId, path, msg, ...data })),
    error: (msg: string, data?: Record<string, unknown>) =>
      console.error(JSON.stringify({ level: 'error', reqId, path, msg, ...data })),
  }
}
```

Refactorizar progresivamente: los nuevos endpoints deben usar `createLogger(event)` en vez de `console.*`. Los existentes se migran gradualmente. Priorizar los endpoints críticos (webhooks, crons, pagos).

**Integración con Sentry:** El plugin `error-handler.ts` ya envía errores a Sentry. Añadir el `requestId` como tag:

```typescript
Sentry.captureException(error, { tags: { requestId: event.context?.requestId } })
```

---

### Parte J — TODOs pendientes [punto 20]

**Problema:** Hay TODOs sin completar en áreas funcionales.

Claude Code debe:

```bash
grep -rn 'TODO\|FIXME\|HACK\|XXX' server/ app/ --include='*.ts' --include='*.vue' | grep -v node_modules | grep -v .nuxt
```

Para cada TODO encontrado, decidir:

1. **Implementar ahora** si es funcionalidad core (notificaciones de freshness, Cloudinary cleanup)
2. **Crear issue/ticket** si es mejora futura (añadir como comentario con fecha y contexto)
3. **Eliminar** si es obsoleto (ya implementado en otra sesión)

TODOs conocidos que probablemente aparezcan:

- `freshness-check.post.ts`: "TODO: Send reminder notification/email to dealer" — **Implementar:** llamar a `/api/email/send` con template `freshness_reminder` y header `x-internal-secret`
- `auto-auction.post.ts`: TODOs de lógica de subasta — **Revisar** si la sesión 16 ya los resolvió
- `admin/index.vue`: "TODO: Implementar lógica de coincidencias" — **Implementar o dejar como placeholder** con fecha
- Cualquier TODO de Cloudinary — **Probablemente resuelto** por la sesión 33 (pipeline híbrido)

---

### Resumen de archivos

**Crear:**

| Archivo                                  | Tipo                               |
| ---------------------------------------- | ---------------------------------- |
| `server/utils/batchProcessor.ts`         | Util de procesamiento por lotes    |
| `server/utils/fetchWithRetry.ts`         | Fetch con reintentos y backoff     |
| `server/utils/sanitizeLog.ts`            | Sanitización de PII en logs        |
| `server/utils/logger.ts`                 | Logger estructurado con request ID |
| `server/middleware/request-id.ts`        | Middleware de request ID           |
| `server/api/cron/whatsapp-retry.post.ts` | Cron de reintentos WhatsApp        |

**Modificar:**

| Archivo                                           | Cambio                                  |
| ------------------------------------------------- | --------------------------------------- |
| `server/api/stripe/webhook.post.ts`               | Idempotencia en cada case               |
| `server/api/advertisements.post.ts`               | Añadir verifyTurnstile                  |
| Otros endpoints de formularios públicos           | Añadir verifyTurnstile                  |
| Componentes Vue con formularios públicos          | Añadir TurnstileWidget + enviar token   |
| `server/api/error-report.post.ts`                 | Sanitizar logs                          |
| `server/utils/whatsappApi.ts`                     | Sanitizar logs                          |
| `server/api/whatsapp/process.post.ts`             | Sanitizar logs + retry_count            |
| `server/api/cron/*.post.ts` (todos)               | Batching con processBatch() + LIMIT     |
| `server/utils/isAllowedUrl.ts`                    | Añadir comentario de patrón obligatorio |
| `app/plugins/error-handler.ts`                    | Añadir requestId a Sentry tags          |
| Todos los endpoints con service role (auditarlos) | Ownership validation                    |
| TODOs encontrados                                 | Implementar, crear ticket o eliminar    |

**Migración SQL (añadir a 00052 o al final de 00051):**

```sql
ALTER TABLE whatsapp_submissions ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE whatsapp_submissions ADD COLUMN IF NOT EXISTS last_error TEXT;
```

### Orden de ejecución

1. Crear utils (batchProcessor, fetchWithRetry, sanitizeLog, logger)
2. Crear middleware request-id
3. Idempotencia webhook Stripe (Parte A)
4. Turnstile en servidor (Parte B) — endpoints + componentes Vue
5. Sanitización de logs (Parte C)
6. Batching en crons (Parte D)
7. Ownership audit (Parte E)
8. isAllowedUrl pattern doc (Parte F)
9. fetchWithRetry en crons y webhook (Parte G)
10. WhatsApp retry cron + migración SQL (Parte H)
11. Logger + request-id en endpoints críticos (Parte I)
12. Resolver TODOs (Parte J)
13. Verificar — `npm run build` + `npm run lint` + `npm run typecheck`

### Tests mínimos

- [ ] Webhook Stripe: enviar mismo evento 2 veces → solo 1 payment/invoice creado
- [ ] advertisements.post sin turnstileToken → 400
- [ ] advertisements.post con token inválido → 403
- [ ] Logs no contienen teléfonos, emails ni payloads completos
- [ ] Cron freshness-check con 500 vehículos → procesa en batches de 50
- [ ] whatsapp-retry cron reintenta submissions fallidas
- [ ] Response headers incluyen X-Request-ID
- [ ] Todos los TODOs están resueltos o documentados
- [ ] npm run build compila sin errores

---

## SESIÓN 35 — Auditoría integral: 10/10 en todas las áreas

> Resultado de cruzar 3 auditorías externas con auditoría propia. Objetivo: que la próxima auditoría arroje 10/10 en seguridad, código, escalabilidad, SEO y CI. Incluye hallazgos nuevos no cubiertos por sesiones 34/34b.

**Leer:**

1. `server/api/invoicing/create-invoice.post.ts` — Sin auth, IDOR
2. `server/api/invoicing/export-csv.get.ts` — Sin auth, expone todas las facturas
3. `server/api/auction-deposit.post.ts` — Sin auth, crea PaymentIntents para cualquiera
4. `server/api/images/process.post.ts` — Sin auth, validación URL débil (SSRF)
5. `server/api/social/generate-posts.post.ts` — Auth pero sin ownership del vehículo
6. `server/api/verify-document.post.ts` — Auth pero sin ownership del vehículo
7. `server/api/market-report.get.ts` — Carga datos completos sin cache
8. `server/api/v1/valuation.get.ts` — Bug: nombre incorrecto de config key
9. `nuxt.config.ts` — Falta CSP, @vueuse/nuxt sin usar
10. `package.json` — Dependencias sin usar, xlsx vulnerable
11. Migraciones SQL — RLS policies con gaps críticos
12. Todos los `.vue` con `v-html` — Buscar y sanitizar

**Hacer:**

### Parte A — CRÍTICOS DE SEGURIDAD

#### A.1 Invoicing: auth + ownership + filtrado

**`server/api/invoicing/create-invoice.post.ts`:** Sin auth. Añadir `serverSupabaseUser(event)` → 401 si no hay user. Verificar que `dealerId` pertenece al usuario autenticado consultando `dealers` donde `user_id = user.id AND id = dealerId`. Si no coincide → 403. Eliminar `body.userId`, usar `user.id`.

**`server/api/invoicing/export-csv.get.ts`:** Sin auth, exporta TODAS las facturas. Añadir auth. Si el usuario es admin, puede exportar todas. Si es dealer, filtrar por `dealer_id=eq.{userDealerId}` en el query REST.

#### A.2 Auction deposit: auth + ownership

**`server/api/auction-deposit.post.ts`:** Sin auth. Añadir `serverSupabaseUser(event)` → 401. Verificar que `registrationId` pertenece al usuario consultando `auction_registrations` donde `id = registrationId AND user_id = user.id`. Si no coincide → 403.

#### A.3 Images process: auth + validación URL estricta (anti-SSRF)

**`server/api/images/process.post.ts`:** Sin auth. Añadir `serverSupabaseUser(event)` → 401. Reemplazar validación débil `includes('cloudinary.com')` por validación estricta con `new URL(url)` verificando que `hostname.endsWith('.cloudinary.com')` y `protocol === 'https:'`. La validación actual permite URLs como `https://evil.com/path?q=cloudinary.com`.

#### A.4 Social generate-posts: ownership del vehículo

Ya tiene auth, pero no verifica que el vehículo pertenece al dealer del usuario. Añadir `dealer_id` al select del vehículo, luego verificar que coincide con el dealer del usuario autenticado. Admins pueden operar sobre cualquier vehículo.

#### A.5 Verify-document: ownership del vehículo

Ya verifica que el documento pertenece al vehículo, pero NO que el vehículo pertenece al dealer del usuario. Añadir verificación de ownership (misma lógica que A.4). Admins exentos.

#### A.6 Bug en valuation.get.ts

Usa `config.supabaseServiceKey` que no existe en runtimeConfig. El nombre correcto es `config.supabaseServiceRoleKey`. Fix: renombrar la referencia.

---

### Parte B — RLS POLICIES EN SUPABASE

**Crear migración `00052_rls_hardening.sql`:**

1. `advertisements`: cambiar INSERT de público a `authenticated` con `auth.uid() IS NOT NULL`
2. `demands`: idem
3. `payments`: añadir política INSERT con `user_id = auth.uid()`
4. `config`: evaluar si contiene secretos. Si sí → restringir SELECT a `authenticated`. Si no → dejar público.
5. `auction_bids`: añadir UPDATE/DELETE con `user_id = auth.uid()`
6. `auction_registrations`: añadir UPDATE con `user_id = auth.uid()`
7. `saved_searches`: añadir UPDATE/DELETE con `user_id = auth.uid()`
8. Crear función `is_admin()` reutilizable para estandarizar verificación de admin en policies

**ANTES de aplicar:** Verificar políticas existentes con `SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public'` para evitar conflictos.

---

### Parte C — SEO: hreflang + subastas

#### C.1 Hreflang tags

Añadir generación automática de hreflang en el composable de SEO principal. Para cada página pública, generar `<link rel="alternate" hreflang="es" href="...">`, `hreflang="en"`, y `hreflang="x-default"` apuntando a la versión española.

#### C.2 SEO para subastas

Añadir `useHead()` con title y description en `subastas/index.vue` y `subastas/[id].vue`. Añadir structured data JSON-LD tipo `Event` para cada subasta. Añadir subastas activas al sitemap en `server/api/__sitemap.ts`.

---

### Parte D — SECURITY HEADERS (CSP + otros)

Crear `server/middleware/security-headers.ts` que añada a respuestas HTML (no APIs):

- `Content-Security-Policy` con directivas para self, cloudinary, supabase, stripe, cloudflare
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`

Tras aplicar, verificar que no hay errores de CSP en la consola del navegador. Si los hay, añadir los dominios necesarios.

**Alternativa:** Configurar estos headers en Cloudflare Dashboard → Rules → Transform Rules (zero code).

---

### Parte E — BUILD/CI: typecheck, dependencias, v-html

#### E.1 Generar database.types.ts

```bash
npx supabase gen types typescript --project-id gmnrfuzekbwyzkgsaftv > app/types/database.types.ts
```

Tras generar, ejecutar `npm run typecheck` y corregir errores restantes. NO usar `any`.

#### E.2 Eliminar dependencias sin usar

- `@stripe/stripe-js` → eliminar (se usa stripe server-side)
- `@vueuse/nuxt` → eliminar del package.json Y de modules en nuxt.config.ts
- `@sentry/nuxt` → eliminar (se usa @sentry/vue directamente)
- `xlsx` → reemplazar por `exceljs` (xlsx@0.18.5 sin parches desde 2022)
- Añadir `@types/web-push` en devDependencies

#### E.3 v-html + DOMPurify

Buscar todas las instancias de `v-html` en `app/`. Instalar `dompurify` + `@types/dompurify`. Crear `app/composables/useSanitize.ts`. Envolver todo contenido de BD renderizado con v-html en `sanitize()`.

#### E.4 Eliminar console.\* del código cliente

Buscar `console.error/log/warn` en `app/` (excluyendo plugins). Eliminar o envolver en `if (import.meta.dev)`.

#### E.5 Reemplazar alert() por toast + i18n

Buscar `alert(` en `app/`. Crear `useToast()` composable si no existe. Reemplazar cada alert por toast con texto internacionalizado.

---

### Parte F — ESCALABILIDAD: índices, cache, queries

#### F.1 Índices de BD

**Migración `00053_performance_indexes.sql`:**

- `idx_vehicles_location_province`
- `idx_vehicles_location_region`
- `idx_vehicles_location_country`
- `idx_vehicles_brand_trgm` (requiere `pg_trgm`)
- `idx_vehicles_status_created` (status + created_at DESC)
- `idx_vehicles_visible_from`
- `idx_invoices_dealer_created`
- `idx_payments_checkout_session`

#### F.2 .limit() en queries sin límite

Buscar queries con `.select()` que devuelven listas sin `.limit()`. Añadir `.limit(1000)` como máximo, especialmente en market-report y crons.

#### F.3 Cache para market-report

Añadir `'/api/market-report': { swr: 60 * 60 * 6 }` en routeRules de nuxt.config.ts (cache 6 horas).

---

### Parte G — CALIDAD DE CÓDIGO

#### G.1 Páginas >800 líneas

Buscar con `wc -l`. Para cada página >800 líneas, extraer tabs/secciones en sub-componentes. Criterio: ninguna página >500 líneas.

#### G.2 Push send: limpiar import

Eliminar `createSupabaseServerClient` helper innecesario. Usar import directo de `serverSupabaseServiceRole`.

#### G.3 WhatsApp process: lectura doble del body

Si hay lectura doble de `readBody`, refactorizar para leer una sola vez.

---

### Parte H — DEPENDENCIAS

#### H.1 Reemplazar xlsx por exceljs

Buscar todos los imports de `xlsx`, reemplazar por `exceljs`. La API difiere pero ambas manejan Excel.

#### H.2 npm audit

Ejecutar `npm audit` y corregir vulnerabilidades.

---

### Resumen de archivos

**Crear:**

| Archivo                                   | Tipo                                     |
| ----------------------------------------- | ---------------------------------------- |
| `server/middleware/security-headers.ts`   | Middleware CSP + headers                 |
| `app/composables/useSanitize.ts`          | Wrapper DOMPurify                        |
| `app/composables/useToast.ts`             | Sistema de notificaciones (si no existe) |
| `app/types/database.types.ts`             | Tipos generados de Supabase              |
| Migración `00052_rls_hardening.sql`       | RLS policies                             |
| Migración `00053_performance_indexes.sql` | Índices de BD                            |

**Modificar:**

| Archivo                                       | Cambio                           | Prioridad  |
| --------------------------------------------- | -------------------------------- | ---------- |
| `server/api/invoicing/create-invoice.post.ts` | Auth + ownership                 | 🔴 Crítico |
| `server/api/invoicing/export-csv.get.ts`      | Auth + filtro por dealer         | 🔴 Crítico |
| `server/api/auction-deposit.post.ts`          | Auth + ownership                 | 🔴 Crítico |
| `server/api/images/process.post.ts`           | Auth + URL estricta              | 🔴 Crítico |
| `server/api/social/generate-posts.post.ts`    | Ownership vehículo               | 🟠 Alto    |
| `server/api/verify-document.post.ts`          | Ownership vehículo               | 🟠 Alto    |
| `server/api/v1/valuation.get.ts`              | Fix config key name              | 🟠 Alto    |
| `server/api/market-report.get.ts`             | Cache + limit                    | 🟡 Medio   |
| `nuxt.config.ts`                              | Quitar @vueuse/nuxt, body size   | 🟡 Medio   |
| `package.json`                                | Deps sin usar, xlsx→exceljs      | 🟡 Medio   |
| Páginas con v-html                            | Sanitizar con DOMPurify          | 🟡 Medio   |
| Páginas con alert()                           | Toast + i18n                     | 🟢 Bajo    |
| Páginas con console.\*                        | Eliminar/condicionar             | 🟢 Bajo    |
| Composable SEO                                | hreflang                         | 🟡 Medio   |
| Subastas index + [id]                         | Meta + structured data + sitemap | 🟡 Medio   |

### Orden de ejecución

1. Migraciones SQL (00052 RLS + 00053 índices)
2. Críticos A.1-A.3 (auth en invoicing, auction-deposit, images/process)
3. Altos A.4-A.6 (ownership social/verify, fix valuation bug)
4. Security headers middleware
5. Dependencias (eliminar sin usar, xlsx→exceljs, generar database.types.ts)
6. v-html + DOMPurify
7. SEO (hreflang + subastas)
8. Escalabilidad (.limit, cache, índices)
9. Calidad (console.\*, alert(), páginas grandes)
10. RLS policies en BD
11. Verificar — `npm run build` + `npm run lint` + `npm run typecheck`

### Tests mínimos

- [ ] invoicing/create-invoice sin auth → 401; dealerId de otro → 403
- [ ] invoicing/export-csv sin auth → 401; dealer solo ve sus facturas
- [ ] auction-deposit sin auth → 401; registration de otro → 403
- [ ] images/process sin auth → 401; URL no-cloudinary → 400; URL `evil.com/cloudinary.com` → 400
- [ ] social/generate-posts con vehículo de otro dealer → 403
- [ ] verify-document con vehículo de otro dealer → 403
- [ ] Response headers incluyen CSP, X-Content-Type-Options, X-Frame-Options
- [ ] hreflang tags en páginas públicas
- [ ] Subastas tienen meta tags y structured data
- [ ] v-html no permite inyección de script
- [ ] npm run typecheck pasa (0 errores)
- [ ] npm run build compila sin errores
- [ ] npm audit sin vulnerabilidades críticas

### Decisiones tomadas (sesión de planificación 23 Feb 2026)

1. **Tabla `config` (RLS):** La tabla `vertical_config` contiene datos de UI/tema, NO secretos (los secretos van en `.env`). **Decisión: dejar SELECT público.** Claude Code debe verificar antes de aplicar la migración 00052 ejecutando `SELECT * FROM config LIMIT 5` — si encuentra API keys o tokens, cambiar a `authenticated` y avisar al usuario. Si solo hay configuración de UI → mantener público.
2. **CSP:** Implementar via **middleware Nitro** (`server/middleware/security-headers.ts`). Queda versionado en git, Claude Code lo gestiona directamente. Si en el futuro se quiere mover a Cloudflare Dashboard, basta con eliminar el middleware y crear Transform Rules equivalentes.
3. **Sub-componentes >800 líneas:** Hacer **ahora**, dentro de esta sesión 35. Criterio: ningún `.vue` supere 500 líneas. Extraer tabs/secciones en sub-componentes. Esto evita arrastrar deuda técnica a cada vertical futura.

---

## SESIÓN 36 — Auditoría cruzada: gaps residuales + alineación docs/realidad

> Resultado de cruzar la 4ª auditoría externa (auditoría de 10 puntos, 24 Feb 2026) con las sesiones 34, 34b y 35. Verificación rigurosa de cada hallazgo. Solo incluye lo que NO estaba cubierto o estaba incompleto.

**Contexto:** Se verificó línea por línea que las sesiones 34 (auth Stripe, webhooks, crons, rate limit), 34b (idempotencia, Turnstile, PII logs, batching, ownership, reintentos, request IDs) y 35 (auth invoicing/auction/images, RLS hardening, CSP, índices, DOMPurify, hreflang, dependencias, typecheck) cubren los hallazgos técnicos de las 4 auditorías. Los hallazgos ya cubiertos NO se repiten aquí.

**Resultado de la verificación:**

| Hallazgo auditoría 4                      | ¿Cubierto? | Dónde                                                                                |
| ----------------------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| Service role sin ownership (punto 10)     | ✅ Sí      | Sesión 34 A.1-A.3, 34b E, 35 A.1-A.5                                                 |
| Crons sin secreto (punto 3)               | ✅ Sí      | Sesión 34 B.2 (verifyCronSecret)                                                     |
| Endpoints sin cache (punto 5.2)           | ✅ Sí      | Sesión 35 F.3 (market-report SWR 6h)                                                 |
| RLS gaps (punto 10.2)                     | ✅ Sí      | Sesión 35 B (migración 00052)                                                        |
| Tests IDOR (punto 10.3)                   | ✅ Sí      | Sesión 35 tests mínimos (13 checks)                                                  |
| Subastas capture/cancel (punto 7.1)       | ✅ Sí      | Sesión 16 línea 732: ganador→capture, perdedores→cancel                              |
| Verificación end-to-end (punto 7.1)       | ✅ Sí      | Sesión 15 completa (Claude Vision + DGT + niveles)                                   |
| Pro enforcement catálogo (punto 7.1)      | ✅ Sí      | Sesión 16b + 24 (visible_from + useSubscription)                                     |
| CI/CD (punto 6)                           | ✅ Sí      | Sesión 19 (GitHub Actions ci.yml + deploy.yml)                                       |
| Índices vehicles(status,created_at)       | ✅ Sí      | Sesión 35 F.1 (idx_vehicles_status_created)                                          |
| Índices location                          | ✅ Sí      | Sesión 35 F.1 (province, region, country)                                            |
| Infra endpoints protegidos                | ✅ Sí      | Sesión 33 especifica "Admin auth" en cada GET, CRON_SECRET en cron                   |
| Cron endpoints protegidos                 | ✅ Sí      | Sesión 34 B.2: verifyCronSecret en TODOS los cron/\*.post.ts                         |
| Webhook Stripe/WhatsApp                   | ✅ Sí      | Sesión 34 A.2 (firma Stripe) + A.3 (firma Meta HMAC)                                 |
| Cache market-report                       | ✅ Sí      | Sesión 35 F.3 (SWR 6h en routeRules)                                                 |
| **Cache merchant-feed + sitemap**         | ❌ No      | Sesión 35 solo cubre market-report                                                   |
| **Índice vehicles(category_id)**          | ❌ No      | Falta en migración 00053                                                             |
| **Índice auction_bids(auction_id)**       | ❌ No      | Falta en migración 00053                                                             |
| **Índice articles(status, published_at)** | ⚠️ Parcial | Sesión 2 define idx_articles_scheduled pero no es exactamente (status, published_at) |
| **account/\* auth explícita**             | ⚠️ Parcial | Sesión 34 D.5 añade CSRF pero no verifica auth explícitamente                        |
| **dgt-report auth**                       | ❌ No      | Sesión 15 describe el flujo pero no especifica auth check                            |
| **push/send auth**                        | ❌ No      | Sesión 35 G.2 limpia imports pero no añade auth                                      |
| **market-report auth**                    | ⚠️ Parcial | Sesión 35 F.3 añade cache pero no auth (¿debería ser público?)                       |
| **Desalineación docs/realidad**           | ❌ No      | Ninguna sesión actualiza progreso.md                                                 |
| **Diagrama flujos operativos**            | ❌ No      | No existe en ningún documento                                                        |
| **Duplicación admin/dashboard**           | ❌ No      | Ninguna sesión la aborda                                                             |
| **i18n convivencia \_es/\_en + JSONB**    | ⚠️ Parcial | Sesión 2 describe migración pero no verifica completitud                             |
| **Lazy-load rutas admin**                 | ❌ No      | Ninguna sesión lo especifica                                                         |
| **Inventario formal de endpoints**        | ❌ No      | No existe documento de referencia                                                    |
| **Separar crons (punto 8.2)**             | ✅ N/A     | Los crons YA son Workers en CF Pages, no hay "runtime principal" separado            |

**Leer:**

1. `docs/tracciona-docs/referencia/ARQUITECTURA-ESCALABILIDAD.md` — Contexto de arquitectura
2. `docs/progreso.md (alias de compatibilidad histórica)` — Estado actual (desactualizado)
3. `app/pages/admin/` — Verificar duplicación con dashboard
4. `server/api/` — Endpoints a auditar

**Hacer:**

### Parte A — ÍNDICES FALTANTES (añadir a migración 00053)

La migración `00053_performance_indexes.sql` de la sesión 35 tiene 8 índices. Faltan 3 que la auditoría identifica correctamente:

```sql
-- Añadir al final de 00053_performance_indexes.sql:

-- Filtrado por categoría en catálogo (query frecuente)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_category_id ON vehicles (category_id);

-- Pujas por subasta (consulta constante durante subasta en vivo)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auction_bids_auction_id ON auction_bids (auction_id, created_at DESC);

-- Artículos publicados por fecha (listado público de noticias/guías)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_status_published ON articles (status, published_at DESC) WHERE status = 'published';
```

**Total índices migración 00053: 11** (8 originales + 3 nuevos).

---

### Parte A-BIS — CACHE CDN PARA ENDPOINTS PÚBLICOS PESADOS

La sesión 35 F.3 añade SWR 6h a market-report. Pero la auditoría 4 (punto 5.3) también pide cache CDN para `merchant-feed` y `sitemap`, que son endpoints públicos que regeneran datos completos en cada request.

**Fix — Añadir a `routeRules` en `nuxt.config.ts`:**

```typescript
routeRules: {
  // Ya existente (sesión 35):
  '/api/market-report': { swr: 60 * 60 * 6 },      // 6 horas
  // NUEVOS (sesión 36):
  '/api/merchant-feed*': { swr: 60 * 60 * 12 },     // 12 horas (Google re-crawlea ~1/día)
  '/api/__sitemap*': { swr: 60 * 60 * 6 },           // 6 horas
}
```

**Justificación:** merchant-feed genera XML completo de todos los vehículos públicos. Sitemap idem. Ambos son costosos y cambian lentamente (nuevo vehículo cada horas, no cada segundo). SWR los sirve desde cache y regenera en background.

---

### Parte B — AUTH EN ENDPOINTS RESIDUALES

La sesión 35 cubrió invoicing, auction-deposit, images/process, social/generate-posts, verify-document. Pero la auditoría 4 (punto 10.1) lista endpoints adicionales con service role que ninguna sesión anterior audita explícitamente.

#### B.1 dgt-report.post.ts: añadir auth

**Problema:** La sesión 15 describe el flujo (pago Stripe → consulta DGT → PDF) pero no especifica verificación de autenticación en el endpoint.

**Fix:** Añadir `serverSupabaseUser(event)` → 401. Verificar que el vehículo existe. Si el usuario es dealer, verificar ownership del vehículo. Si es comprador, verificar que tiene un lead activo para ese vehículo O que ha pagado la consulta.

#### B.2 push/send.post.ts: añadir auth

**Problema:** La sesión 35 G.2 limpia el import innecesario, pero no añade auth. Este endpoint permite enviar push notifications.

**Fix:** Doble vía (mismo patrón que email/send de sesión 34 B.1): (1) header `x-internal-secret` = CRON_SECRET para llamadas internas, (2) admin auth para llamadas desde el panel. Si no es ninguna → 401.

#### B.3 account/\* endpoints: verificar auth completa

**Problema:** La sesión 34 D.5 añade CSRF a `account/delete`, pero no verifica que TODOS los endpoints de `account/*` tengan auth.

**Fix:** Claude Code debe ejecutar:

```bash
ls server/api/account/
```

Para cada endpoint encontrado, verificar que tiene `serverSupabaseUser(event)` al inicio y que opera sobre `user.id` (no acepta userId del body). Si alguno no lo tiene → añadir.

#### B.4 market-report.get.ts: decisión de acceso

**Problema:** La sesión 35 F.3 añade cache SWR 6h pero no especifica auth. La auditoría lo lista como endpoint con service role.

**Decisión:** market-report es un endpoint que genera un informe HTML del mercado. Puede ser:

- Público (si es el índice de precios de la sesión 32) → dejar sin auth, con cache agresivo
- Privado (si es informe detallado para admins) → añadir admin auth

Claude Code debe leer el contenido del archivo para determinar qué hace. Si genera datos agregados públicos → mantener sin auth + cache. Si accede a datos sensibles o individuales → añadir admin auth.

---

### Parte C — ESTADO REAL DEL PRODUCTO (docs/progreso.md (alias de compatibilidad histórica))

**Problema (punto 1.4-1.5 auditoría):** `docs/progreso.md (alias de compatibilidad histórica)` dice "Step 2 en progreso" pero el código ya tiene subastas, pagos Stripe, WhatsApp pipeline, sistema de ads, panel de infraestructura, etc. Esto puede llevar a decisiones erróneas y a reescribir código que ya existe.

Este es el hallazgo más valioso de la 4ª auditoría y ninguna sesión anterior lo aborda.

**Fix — Crear `docs/ESTADO-REAL-PRODUCTO.md (alias de compatibilidad)`:**

Claude Code debe generar este documento ejecutando análisis del código real:

```bash
# Verificar qué módulos existen realmente
ls app/pages/
ls app/pages/admin/
ls app/pages/dashboard/
ls app/pages/subastas/
ls app/pages/perfil/
ls server/api/
ls server/api/stripe/
ls server/api/whatsapp/
ls server/api/cron/
ls server/api/infra/
ls server/api/invoicing/
ls supabase/migrations/
```

Para cada módulo, documentar:

| Módulo           | Estado                     | Archivos clave                                    | Sesión que lo completa |
| ---------------- | -------------------------- | ------------------------------------------------- | ---------------------- |
| Catálogo público | ✅ Operativo               | pages/index.vue, composables/useVehicles          | Sesión 3               |
| Fichas vehículo  | ✅ Operativo               | pages/vehiculo/[slug].vue                         | Sesión 3               |
| Subastas         | ✅ UI+BD completa          | pages/subastas/\*, composables/useAuction         | Sesión 16              |
| Pagos Stripe     | ✅ Checkout+Portal+Webhook | server/api/stripe/\*                              | Sesión 17              |
| WhatsApp         | ✅ Pipeline completo       | server/api/whatsapp/\*                            | Sesión 21              |
| Ads/Publicidad   | ✅ CRUD+Matching           | pages/admin/publicidad, composables/useAds        | Sesión 16b             |
| Infra monitoring | ✅ Panel+Crons             | pages/admin/infraestructura, server/api/infra/\*  | Sesión 33              |
| Dashboard dealer | ⚠️ Parcial                 | pages/dashboard/\* (verificar qué páginas faltan) | Sesión 24              |
| Editorial        | ⚠️ Parcial                 | pages/guia/_, pages/noticias/_                    | Sesión 11              |
| Verificación     | ⚠️ Parcial                 | componentes existen, flujo no cerrado             | Sesión 15              |
| Multi-vertical   | ⚠️ Conceptual              | vertical_config existe, pipeline de clonado no    | Sesión 23              |
| CI/CD            | ❌ No existe               | Sin .github/workflows/                            | Sesión 19              |

El documento debe reflejar la REALIDAD del código, no las aspiraciones de las sesiones.

**Además:** Actualizar `docs/progreso.md (alias de compatibilidad histórica)` para que apunte a `ESTADO-REAL-PRODUCTO.md` como fuente de verdad.

---

### Parte D — DIAGRAMA DE FLUJOS OPERATIVOS

**Problema (punto 2.4 auditoría):** No existe diagrama operativo formal que muestre los flujos de usuario/dealer/admin. Dificulta onboarding de nuevos miembros del equipo y de Claude Code en sesiones nuevas.

**Fix — Crear `docs/tracciona-docs/referencia/FLUJOS-OPERATIVOS.md`:**

Documento con diagramas ASCII (interpretables por Claude Code) de los 3 flujos principales:

**Flujo 1: Comprador**

```
SEO/Directo → Catálogo → Filtros → Ficha vehículo
                                      ↓
                              [Contactar dealer]
                              ├── Teléfono
                              ├── WhatsApp
                              └── Formulario → INSERT lead → Email dealer
                                      ↓
                              [Favoritos / Alertas]
                              ├── ❤️ Guardar → INSERT favorites
                              └── 🔔 Alerta → INSERT search_alerts → Cron diario
                                      ↓
                              [Subastas]
                              └── Registro → Docs + Depósito Stripe → Pujas RT → Resultado
```

**Flujo 2: Dealer**

```
Registro → Onboarding (5 pasos) → Dashboard
                                      ↓
                              [Publicar vehículo]
                              ├── Manual (formulario)
                              ├── WhatsApp (fotos → IA → ficha)
                              └── Excel (import masivo)
                                      ↓
                              [Gestionar]
                              ├── Leads → CRM (new→viewed→contacted→won/lost)
                              ├── Estadísticas → visitas, leads, conversión
                              ├── Herramientas → facturas, contratos, presupuestos
                              └── Portal público → personalizar colores/bio
                                      ↓
                              [Vender]
                              └── Marcar vendido → Post-venta (transporte, seguro, contrato)
```

**Flujo 3: Admin**

```
Login admin → Dashboard métricas
                    ↓
            [Gestión]
            ├── Vehículos → aprobar, editar, eliminar
            ├── Dealers → verificar, activar, desactivar
            ├── Subastas → crear, adjudicar, cancelar
            ├── Verificaciones → cola de docs pendientes
            ├── Publicidad → CRUD anunciantes + anuncios
            ├── Captación → leads de competidores
            ├── Social → cola de posts pendientes
            └── Infraestructura → métricas, alertas, clusters
                    ↓
            [Configuración]
            ├── Branding, navegación, homepage, catálogo
            ├── Idiomas, precios, integraciones
            ├── Emails (30 templates), editorial
            └── Sistema (mantenimiento, logs)
```

---

### Parte E — VERIFICACIÓN i18n: completar migración \_es/\_en → JSONB

**Problema (punto 3 auditoría):** La sesión 2 Bloque B describe la migración de columnas `_es/_en` a JSONB, pero incluye la nota "NO dropear columnas antiguas todavía — comentar el DROP". Esto significa que en el código pueden convivir ambos patrones.

**Fix:** Claude Code debe verificar:

```bash
# 1. ¿Existen todavía columnas _es/_en en la BD?
grep -rn 'name_es\|name_en\|description_es\|description_en\|location_en' server/api/ app/composables/ app/pages/ --include='*.ts' --include='*.vue' | grep -v node_modules | grep -v '.nuxt'

# 2. ¿Se usa localizedField() consistentemente?
grep -rn 'localizedField' app/ --include='*.ts' --include='*.vue' | wc -l

# 3. ¿Quedan accesos directos a .name_es o .name_en?
grep -rn '\.name_es\|\.name_en' app/ --include='*.ts' --include='*.vue' | grep -v node_modules
```

Si se encuentran accesos directos a `_es/_en`:

- Reemplazar TODOS por `localizedField(item.name, locale)`
- Si la columna JSONB `name` no existe en esa tabla → la migración de sesión 2 no se completó → completarla

Si todos los accesos usan `localizedField()`, la migración está completa y este punto se cierra.

---

### Parte F — CONSOLIDACIÓN ADMIN/DASHBOARD (deuda técnica)

**Problema (punto 4.2 auditoría):** Hay lógica y UI duplicada entre `/admin/*` y `/dashboard/*`. Operaciones similares se implementan dos veces.

**Fix — Crear módulos compartidos:**

Claude Code debe identificar la duplicación:

```bash
# Buscar composables duplicados o similares
ls app/composables/admin/
ls app/composables/
# Comparar funciones similares (ej: useAdminVehicles vs useDealerVehicles)
```

Patrón de consolidación:

1. Crear `app/composables/shared/useVehicleOperations.ts` con lógica común (CRUD, filtros, estados)
2. `useAdminVehicles` y `useDealerVehicles` importan de `shared/` y añaden permisos específicos
3. Crear `app/components/shared/VehicleTable.vue`, `LeadsList.vue`, etc. — componentes reutilizables con prop `role: 'admin' | 'dealer'` que controla qué columnas/acciones se muestran

**Prioridad:** 🟢 Baja. No bloquea lanzamiento. Pero hacerlo ahora evita que la duplicación se multiplique ×20 con las verticales.

Claude Code debe:

1. Listar pares de archivos duplicados (admin vs dashboard)
2. Para cada par, extraer lógica común a `shared/`
3. Refactorizar ambos para importar de `shared/`

---

### Parte G — LAZY-LOAD DE RUTAS ADMIN

**Problema (punto 5.2 auditoría):** Bundle grande en admin/dashboard. Las rutas admin se cargan aunque el usuario sea comprador.

**Fix en `nuxt.config.ts`:**

Nuxt 3 ya hace code-splitting por ruta automáticamente, pero verificar que:

1. Las dependencias pesadas de admin (Chart.js, SheetJS/ExcelJS, editores) no se importan globalmente:

```bash
grep -rn "import.*Chart\|import.*xlsx\|import.*exceljs\|import.*editor" app/pages/ app/components/ --include='*.vue' --include='*.ts' | grep -v node_modules
```

2. Si alguna se importa de forma estática en un composable global → moverla a `defineAsyncComponent` o `import()` dinámico

3. Añadir experimentación de prefetch selectivo:

```typescript
// nuxt.config.ts
experimental: {
  payloadExtraction: true, // Extrae payload de datos para caching
}
```

4. Verificar con:

```bash
npx nuxi analyze
```

Que las rutas `/admin/*` y `/dashboard/*` están en chunks separados del bundle público.

---

### Parte H — INVENTARIO FORMAL DE ENDPOINTS

**Problema (punto 3 auditoría, prioridad baja):** No existe un documento que liste todos los endpoints del servidor con su auth, método, y propósito.

**Fix — Generar `docs/tracciona-docs/referencia/INVENTARIO-ENDPOINTS.md`:**

Claude Code debe generar automáticamente:

```bash
find server/api/ -name '*.ts' | sort
```

Para cada endpoint, documentar:

| Ruta                      | Método | Auth                     | Propósito           | Sesión |
| ------------------------- | ------ | ------------------------ | ------------------- | ------ |
| /api/stripe/checkout      | POST   | User (sesión 34)         | Crear sesión Stripe | 17     |
| /api/stripe/webhook       | POST   | Firma Stripe (sesión 34) | Procesar eventos    | 17     |
| /api/cron/freshness-check | POST   | CRON_SECRET (sesión 34)  | Verificar frescura  | 16c    |
| ...                       | ...    | ...                      | ...                 | ...    |

Este inventario sirve como checklist para futuras auditorías y para Claude Code al añadir nuevos endpoints.

---

### Resumen de archivos

**Crear:**

| Archivo                                                  | Tipo                                              |
| -------------------------------------------------------- | ------------------------------------------------- |
| `docs/ESTADO-REAL-PRODUCTO.md (alias de compatibilidad)`                           | Estado real de cada módulo vs docs                |
| `docs/tracciona-docs/referencia/FLUJOS-OPERATIVOS.md`    | Diagramas ASCII de flujos usuario/dealer/admin    |
| `docs/tracciona-docs/referencia/INVENTARIO-ENDPOINTS.md` | Tabla de todos los endpoints con auth y propósito |

**Modificar:**

| Archivo                                   | Cambio                                                | Prioridad |
| ----------------------------------------- | ----------------------------------------------------- | --------- |
| Migración `00053_performance_indexes.sql` | Añadir 3 índices: category_id, auction_bids, articles | 🟡 Medio  |
| `nuxt.config.ts` routeRules               | Añadir SWR merchant-feed (12h) + sitemap (6h)         | 🟡 Medio  |
| `server/api/dgt-report.post.ts`           | Añadir auth + ownership                               | 🟠 Alto   |
| `server/api/push/send.post.ts`            | Añadir auth (internal secret o admin)                 | 🟠 Alto   |
| `server/api/account/*.ts`                 | Verificar auth completa en todos                      | 🟠 Alto   |
| `server/api/market-report.get.ts`         | Decidir auth según contenido (público vs admin)       | 🟡 Medio  |
| `docs/progreso.md (alias de compatibilidad histórica)`                        | Apuntar a ESTADO-REAL-PRODUCTO.md                     | 🟡 Medio  |
| Archivos con `.name_es`/`.name_en`        | Migrar a `localizedField()` si quedan                 | 🟡 Medio  |
| Composables admin+dashboard               | Extraer lógica común a `shared/`                      | 🟢 Bajo   |
| `nuxt.config.ts`                          | Verificar code-splitting admin                        | 🟢 Bajo   |

### Orden de ejecución

1. Índices faltantes (añadir a 00053)
2. Cache SWR para merchant-feed + sitemap (añadir a routeRules)
3. Auth en dgt-report, push/send, account/\*
4. Decisión market-report (leer archivo, decidir)
5. Verificar i18n (\_es/\_en vs JSONB)
6. Crear ESTADO-REAL-PRODUCTO.md (análisis del código real)
7. Crear FLUJOS-OPERATIVOS.md
8. Crear INVENTARIO-ENDPOINTS.md
9. Consolidación admin/dashboard (shared/)
10. Lazy-load admin (verificar + nuxi analyze)
11. Actualizar progreso.md
12. Verificar — `npm run build` + `npm run lint`

### Tests mínimos

- [ ] dgt-report sin auth → 401
- [ ] push/send sin auth ni internal secret → 401
- [ ] account/delete sin auth → 401
- [ ] Todos los endpoints de account/\* tienen auth
- [ ] npm run build compila sin errores
- [ ] nuxi analyze muestra chunks separados para admin/dashboard
- [ ] grep `.name_es` en app/ devuelve 0 resultados
- [ ] ESTADO-REAL-PRODUCTO.md refleja código real
- [ ] INVENTARIO-ENDPOINTS.md lista todos los endpoints

---

## SESIÓN 37 — Seguridad CI: Semgrep + Snyk + tests de seguridad automatizados + mensajes error

> Cierra las brechas de seguridad que las sesiones 34/34b/35 dejaron como manuales: automatizar tests de seguridad en CI, añadir análisis estático (Semgrep CE) y monitorizar dependencias (Snyk free). También sanitiza mensajes de error en producción.
> **Origen:** Recomendaciones 100 puntos §1 (seguridad) + Semgrep CE + Snyk free.

**Leer:**

1. `.github/workflows/ci.yml` — CI actual
2. `server/api/` — Endpoints a analizar
3. `server/middleware/security-headers.ts` — CSP actual
4. `package.json` — Dependencias

**Hacer:**

### Parte A — SEMGREP CE EN CI

Añadir Semgrep Community Edition como paso del CI. Es gratuito, sin límites, open source.

**Crear `.github/workflows/security.yml`:**

```yaml
name: Security Scan
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
  schedule:
    - cron: '0 6 * * 1' # Cada lunes a las 6am

jobs:
  semgrep:
    runs-on: ubuntu-latest
    container:
      image: semgrep/semgrep
    steps:
      - uses: actions/checkout@v4
      - run: semgrep scan --config auto --config p/typescript --config p/nodejs --config p/owasp-top-ten --error --json --output semgrep-results.json .
      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: semgrep-results
          path: semgrep-results.json

  npm-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm audit --audit-level=high
```

**Reglas Semgrep seleccionadas:**

- `auto` — reglas recomendadas por Semgrep para el lenguaje detectado
- `p/typescript` — patrones inseguros específicos de TypeScript
- `p/nodejs` — problemas de Node.js (path traversal, exec, etc.)
- `p/owasp-top-ten` — las 10 vulnerabilidades más comunes

`--error` hace que el CI falle si encuentra algo crítico.

---

### Parte B — SNYK FREE: MONITORIZAR DEPENDENCIAS

Snyk free permite 400 tests/mes de Open Source. Suficiente para 1 repo.

**Opción 1 (recomendada): Conectar via web**

1. Ir a https://app.snyk.io/org/ → Settings → Integrations → GitHub
2. Autorizar el repo Tracciona
3. Snyk escanea `package.json` y `package-lock.json` automáticamente
4. Abre PRs automáticas si encuentra vulnerabilidades

**Opción 2: Añadir a CI (más control)**

Añadir al workflow `security.yml`:

```yaml
snyk:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
    - run: npm ci
    - uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high
```

Para obtener `SNYK_TOKEN`: crear cuenta en snyk.io → Account Settings → API Token → añadir como GitHub Secret.

**Nota:** Snyk free es suficiente para 1-3 developers. No escala por usuarios de la web sino por committers.

---

### Parte C — TESTS DE SEGURIDAD AUTOMATIZADOS

La sesión 35 define 13 checks manuales. Convertirlos en tests ejecutables con Vitest.

**Crear `tests/security/auth-endpoints.test.ts`:**

```typescript
import { describe, it, expect } from 'vitest'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'

// Helpers
async function fetchAPI(path: string, options?: RequestInit) {
  return fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
}

describe('Auth: endpoints requieren autenticación', () => {
  const protectedEndpoints = [
    {
      path: '/api/invoicing/create-invoice',
      method: 'POST',
      body: { dealerId: 'fake', serviceType: 'subscription', amountCents: 100 },
    },
    { path: '/api/invoicing/export-csv', method: 'GET' },
    {
      path: '/api/auction-deposit',
      method: 'POST',
      body: { auctionId: 'fake', registrationId: 'fake' },
    },
    { path: '/api/images/process', method: 'POST', body: { url: 'https://example.com/img.jpg' } },
    { path: '/api/social/generate-posts', method: 'POST', body: { vehicleId: 'fake' } },
    { path: '/api/verify-document', method: 'POST', body: { vehicleId: 'fake' } },
    { path: '/api/dgt-report', method: 'POST', body: { vehicleId: 'fake' } },
    { path: '/api/stripe/checkout', method: 'POST', body: { plan: 'basic', interval: 'month' } },
    { path: '/api/stripe/portal', method: 'POST', body: {} },
    { path: '/api/account/delete', method: 'POST', body: {} },
  ]

  for (const ep of protectedEndpoints) {
    it(`${ep.method} ${ep.path} sin auth → 401`, async () => {
      const res = await fetchAPI(ep.path, {
        method: ep.method,
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      })
      expect(res.status).toBe(401)
    })
  }
})

describe('Webhooks: rechazan sin firma', () => {
  it('Stripe webhook sin firma → 400', async () => {
    const res = await fetchAPI('/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({ type: 'test' }),
    })
    expect([400, 500]).toContain(res.status) // 400 si falta firma, 500 si falta config
  })

  it('WhatsApp webhook sin firma → rechazado', async () => {
    const res = await fetchAPI('/api/whatsapp/webhook', {
      method: 'POST',
      body: JSON.stringify({ object: 'whatsapp_business_account' }),
    })
    // En producción rechaza; en dev puede pasar (warn)
    expect(res.status).toBeLessThan(500)
  })
})

describe('Crons: rechazan sin CRON_SECRET', () => {
  const crons = [
    '/api/cron/freshness-check',
    '/api/cron/search-alerts',
    '/api/cron/publish-scheduled',
    '/api/cron/favorite-price-drop',
    '/api/cron/dealer-weekly-stats',
  ]

  for (const path of crons) {
    it(`${path} sin secret → 401`, async () => {
      const res = await fetchAPI(path, { method: 'POST', body: '{}' })
      expect(res.status).toBe(401)
    })
  }
})

describe('Security headers', () => {
  it('Página pública tiene CSP y X-Frame-Options', async () => {
    const res = await fetch(`${BASE}/`)
    expect(res.headers.get('x-frame-options')).toBeTruthy()
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })
})
```

**Añadir al CI (`ci.yml`):**

```yaml
security-tests:
  runs-on: ubuntu-latest
  needs: [build]
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - run: npm ci
    - run: npm run build
    - run: npx nuxi preview &
    - run: sleep 5
    - run: TEST_BASE_URL=http://localhost:3000 npx vitest run tests/security/
```

---

### Parte D — MENSAJES DE ERROR GENÉRICOS EN PRODUCCIÓN

Revisar todos los `createError` del proyecto. En producción, los mensajes no deben filtrar información interna.

**Crear `server/utils/safeError.ts`:**

```typescript
import { createError } from 'h3'

const isProd = process.env.NODE_ENV === 'production'

const GENERIC_MESSAGES: Record<number, string> = {
  400: 'Solicitud inválida',
  401: 'Autenticación requerida',
  403: 'Operación no permitida',
  404: 'Recurso no encontrado',
  429: 'Demasiadas solicitudes',
  500: 'Error interno del servidor',
}

export function safeError(statusCode: number, devMessage: string) {
  return createError({
    statusCode,
    message: isProd ? GENERIC_MESSAGES[statusCode] || 'Error' : devMessage,
  })
}
```

**Instrucción para Claude Code:** Buscar todos los `createError` en `server/api/` que contengan mensajes detallados (nombres de tabla, nombres de columna, stack traces, o detalles de queries). Reemplazar por `safeError()` importándolo de `../../utils/safeError`. NO cambiar los 401/403 que ya tienen mensajes genéricos.

```bash
grep -rn 'createError.*message.*table\|createError.*message.*column\|createError.*message.*query\|createError.*message.*supabase\|createError.*message.*SQL' server/api/ --include='*.ts'
```

---

### Parte E — SECURITY.TXT + POLÍTICA DE DIVULGACIÓN

Alternativa gratuita a bug bounty. Investigadores de seguridad buscan este archivo.

**Crear `public/.well-known/security.txt`:**

```
Contact: mailto:security@tracciona.com
Expires: 2027-02-24T00:00:00.000Z
Preferred-Languages: es, en
Canonical: https://tracciona.com/.well-known/security.txt
Policy: https://tracciona.com/seguridad/politica-divulgacion
```

**Crear página `/seguridad/politica-divulgacion`** (puede ser una página estática):

- Qué reportar y qué no
- Cómo reportar (email security@)
- Compromiso de respuesta (72h acuse, 30d resolución)
- Hall of fame para quienes reporten
- NO se tomarán acciones legales contra investigadores de buena fe

---

### Parte F — REVISIÓN CSP: ELIMINAR UNSAFE-INLINE/EVAL

Revisar `server/middleware/security-headers.ts` y verificar que la Content Security Policy NO permita `unsafe-inline` ni `unsafe-eval` donde no sea estrictamente necesario.

```bash
# Ver CSP actual
grep -A 20 'content-security-policy\|Content-Security-Policy' server/middleware/security-headers.ts
```

**Si encuentra `unsafe-inline` en `script-src`:**

- Reemplazar por nonces o hashes si es posible. Nuxt 3 soporta `useHead` con nonces.
- Si Nuxt requiere `unsafe-inline` para hidración (común en SSR): documentar en comentario POR QUÉ es necesario y que es una limitación conocida de Nuxt.
- Si hay `unsafe-eval`: eliminar. Solo Chart.js podría necesitarlo en admin; en ese caso, aplicar CSP diferente para `/admin/*` vs rutas públicas.

**Si la CSP es restrictiva y funciona:** Documentar en ARQUITECTURA-ESCALABILIDAD.md sección "Seguridad" que la CSP está endurecida.

---

### Parte G — .ENV.EXAMPLE DOCUMENTADO

El `.env.example` debe documentar CADA variable con comentario explicativo:

```bash
# Verificar que existe y tiene todas las variables
diff <(grep -oP '^[A-Z_]+=' .env.example | sort) <(grep -oP '^[A-Z_]+=' .env | sort)
```

**Claude Code debe:**

1. Leer `.env` actual (sin valores sensibles)
2. Verificar que `.env.example` tiene TODAS las variables con placeholder y comentario
3. Formato esperado:

```
# Supabase — URL del proyecto (Dashboard → Settings → API)
SUPABASE_URL=https://xxxxx.supabase.co
# Supabase — Anon key (público, seguro para frontend)
SUPABASE_KEY=eyJ...
# Supabase — Service role key (NUNCA exponer en frontend)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
# Stripe — Clave secreta (Dashboard → Developers → API keys)
STRIPE_SECRET_KEY=sk_test_...
```

---

### Resumen archivos sesión 37

| Archivo                                 | Tipo                                |
| --------------------------------------- | ----------------------------------- |
| `.github/workflows/security.yml`        | CI: Semgrep CE + npm audit + Snyk   |
| `tests/security/auth-endpoints.test.ts` | Tests automatizados de seguridad    |
| `server/utils/safeError.ts`             | Mensajes de error genéricos en prod |
| `public/.well-known/security.txt`       | Política de divulgación             |
| `server/middleware/security-headers.ts` | Revisión CSP (unsafe-inline/eval)   |
| `.env.example`                          | Documentar todas las variables      |

### Orden de ejecución

1. Crear `safeError.ts` y reemplazar `createError` detallados
2. Crear `tests/security/auth-endpoints.test.ts`
3. Ejecutar tests localmente: `npx vitest run tests/security/`
4. Crear `.github/workflows/security.yml` (Semgrep + npm audit)
5. Configurar Snyk free (web o CI)
6. Crear `security.txt`
7. Revisar CSP en security-headers.ts (unsafe-inline/eval)
8. Documentar .env.example con comentarios
9. Verificar — `npm run build` + todos los tests pasan

### Tests mínimos

- [ ] Todos los endpoints protegidos devuelven 401 sin auth
- [ ] Webhooks rechazan sin firma
- [ ] Crons rechazan sin CRON_SECRET
- [ ] Semgrep no reporta críticos en el código
- [ ] npm audit sin vulnerabilidades high/critical
- [ ] security.txt accesible en `/.well-known/security.txt`
- [ ] CSP en security-headers.ts no tiene unsafe-inline/eval innecesario (o documentado por qué)
- [ ] .env.example tiene TODAS las variables con comentario explicativo

---

## SESIÓN 38 — Claridad documental: single source of truth + onboarding + convenciones

> Unifica la documentación fragmentada en un punto de entrada único, clasifica docs como vivos vs históricos, crea guía de onboarding y documenta convenciones de código.
> **Origen:** Recomendaciones 100 puntos §6 (claridad) + §2d (convenciones) + §5a (nombre package).

**Leer:**

1. `docs/` — Estructura actual de documentación
2. `docs/progreso.md (alias de compatibilidad histórica)` — Estado de progreso
3. `CLAUDE.md` — Instrucciones para Claude Code
4. `package.json` — Name actual

**Hacer:**

### Parte A — FIX TRIVIAL: NOMBRE PACKAGE.JSON

```bash
# Cambiar "tank-iberica" a "tracciona" en package.json
sed -i 's/"name": "tank-iberica"/"name": "tracciona"/' package.json
```

Verificar que no hay otras referencias a "tank-iberica" en el código (excepto migraciones históricas que no se tocan):

```bash
grep -rn 'tank-iberica' --include='*.ts' --include='*.vue' --include='*.json' --include='*.md' . | grep -v node_modules | grep -v .git | grep -v migrations
```

---

### Parte B — README-PROYECTO.md (SINGLE SOURCE OF TRUTH)

**Crear `README-PROYECTO.md`** en la raíz del proyecto. Este es el PUNTO DE ENTRADA para cualquier persona (o IA) que llegue al proyecto.

```markdown
# Tracciona

> Grupo de marketplaces B2B verticales. Mismo código, N verticales.

## Qué es

Plataforma multi-vertical de compraventa profesional. Cada vertical (vehículos, maquinaria, hostelería...) comparte el mismo código base, configurado por `vertical_config` en BD.

## Estado actual

Ver [`STATUS.md`](../../STATUS.md) para el estado operativo actual y [`docs/README.md`](../README.md) para el mapa documental vigente.

## Cómo empezar

Ver [Guía de onboarding](#guía-de-onboarding) más abajo.

## Stack

- **Frontend:** Nuxt 3 + TypeScript + Tailwind (tokens.css)
- **Backend:** Server routes Nuxt (Nitro) → Cloudflare Workers
- **BD:** Supabase (PostgreSQL + RLS + Realtime)
- **Pagos:** Stripe (suscripciones, depósitos, checkout)
- **Imágenes:** Cloudinary → CF Images (pipeline híbrido)
- **Email:** Resend + templates en BD
- **WhatsApp:** Meta Cloud API + Claude Vision
- **CI/CD:** GitHub Actions → Cloudflare Pages
- **Seguridad CI:** Semgrep CE + Snyk free + npm audit

## Documentación

### Documentos VIVOS (fuente de verdad)

| Documento                                                                                       | Qué contiene                                     |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| [`README.md`](../../README.md)                                                                  | Punto de entrada general del repositorio         |
| [`STATUS.md`](../../STATUS.md)                                                                  | Estado actual: métricas, errores y changelog     |
| [`PROYECTO-CONTEXTO.md`](../PROYECTO-CONTEXTO.md)                                               | Visión, arquitectura y decisiones activas        |
| [`BACKLOG-EJECUTABLE.md`](../tracciona-docs/BACKLOG-EJECUTABLE.md)                              | Única fuente de verdad del trabajo pendiente     |
| [`CLAUDE.md`](../../CLAUDE.md)                                                                  | Instrucciones rápidas para Claude Code           |
| [`INVENTARIO-ENDPOINTS.md`](../tracciona-docs/referencia/INVENTARIO-ENDPOINTS.md)               | Todos los endpoints con auth y propósito         |
| [`ARQUITECTURA-ESCALABILIDAD.md`](../tracciona-docs/referencia/ARQUITECTURA-ESCALABILIDAD.md)   | Diseño multi-cluster, costes y decisiones        |

### Documentos HISTÓRICOS (referencia, no modificar)

| Documento                | Por qué existe                                        |
| ------------------------ | ----------------------------------------------------- |
| `docs/plan-v3/`          | Diseño original pre-implementación                    |
| `docs/hoja-de-ruta/`     | Roadmap inicial (superado por INSTRUCCIONES-MAESTRAS) |
| `docs/guia-claude-code/` | Guía original para IA (superado por CLAUDE.md)        |
| `docs/legacy/`           | Documentos de la versión anterior                     |

### Anexos (referencia técnica)

| Carpeta                           | Contenido                                             |
| --------------------------------- | ----------------------------------------------------- |
| `docs/tracciona-docs/anexos/`     | Anexos A-X: especificaciones detalladas por módulo (aliases de compatibilidad histórica) |
| `docs/tracciona-docs/referencia/` | FLUJOS-OPERATIVOS, INVENTARIO-ENDPOINTS, ARQUITECTURA |

## Guía de onboarding

### Para Claude Code

1. Leer `CLAUDE.md` (instrucciones rápidas)
2. Leer `contexto-global.md` (alias de compatibilidad, mapa completo)
3. Si te piden ejecutar una sesión: leer `INSTRUCCIONES-MAESTRAS.md` → sesión N

### Para un desarrollador humano

1. Clonar el repo
2. `cp .env.example .env` y rellenar variables
3. `npm install`
4. `npm run dev`
5. Leer este README y luego `ESTADO-REAL-PRODUCTO.md` (alias de compatibilidad)
6. Para entender una funcionalidad: buscar en `INSTRUCCIONES-MAESTRAS.md` la sesión correspondiente

### Comandos útiles

| Comando                          | Qué hace               |
| -------------------------------- | ---------------------- |
| `npm run dev`                    | Servidor de desarrollo |
| `npm run build`                  | Build de producción    |
| `npm run lint`                   | Lint                   |
| `npm run typecheck`              | TypeScript check       |
| `npx vitest run`                 | Tests unitarios        |
| `npx vitest run tests/security/` | Tests de seguridad     |
| `npx playwright test`            | Tests E2E              |
| `npx nuxi analyze`               | Analizar bundle        |
```

---

### Parte C — MARCAR DOCS HISTÓRICOS

Claude Code debe añadir un banner al inicio de cada documento histórico:

```bash
for dir in "docs/plan-v3" "docs/hoja-de-ruta" "docs/guia-claude-code" "docs/legacy"; do
  find "$dir" -name '*.md' -exec sed -i '1i\> ⚠️ **DOCUMENTO HISTÓRICO.** Este documento es referencia del diseño original. La fuente de verdad actual es [`README-PROYECTO.md`](../../README-PROYECTO.md) y [`INSTRUCCIONES-MAESTRAS.md`](../tracciona-docs/INSTRUCCIONES-MAESTRAS.md).\n' {} \;
done
```

---

### Parte D — CONVENCIONES DE CÓDIGO (CONTRIBUTING.md)

**Crear `CONTRIBUTING.md`:**

```markdown
# Convenciones de código

## Tamaño de archivos

- Componentes Vue: máximo 500 líneas. Si crece, extraer sub-componentes.
- Server routes: máximo 200 líneas. Si crece, extraer lógica a `server/utils/` o `server/services/`.

## Composables

- Un composable por dominio: `useVehicles`, `useAuction`, `useAuth`.
- Si necesitas compartir entre admin y dashboard: `composables/shared/`.
- NO crear composables genéricos tipo `useHelper` o `useUtils`.

## Componentes

- Específicos de admin: `components/admin/`
- Específicos de dashboard: `components/dashboard/`
- Compartidos: `components/shared/`
- Genéricos (UI): `components/ui/`

## Server routes

- Auth: siempre `serverSupabaseUser(event)` al inicio.
- Service role: solo cuando RLS no es suficiente. Verificar ownership después.
- Errores: usar `safeError()` para mensajes genéricos en producción.

## i18n

- Textos UI: siempre `$t('key')`, nunca texto hardcodeado.
- Datos dinámicos: `localizedField(item.name, locale)`.
- NUNCA acceder a `.name_es` o `.name_en` directamente.

## Tests

- Seguridad: `tests/security/` — se ejecutan en CI
- Unitarios: `tests/unit/` — Vitest
- E2E: `tests/e2e/` — Playwright
```

---

### Parte E — SCRIPT GENERADOR DE ESTADO-REAL-PRODUCTO

Script que genera automáticamente el documento de estado del producto a partir del código.

**Crear `scripts/generate-estado-real.sh`:**

````bash
#!/bin/bash
# Genera docs/ESTADO-REAL-PRODUCTO.md a partir del código real
OUTPUT="docs/ESTADO-REAL-PRODUCTO.md"

echo "# Estado real del producto" > $OUTPUT
echo "" >> $OUTPUT
echo "_Generado automáticamente: $(date '+%Y-%m-%d %H:%M')_" >> $OUTPUT
echo "" >> $OUTPUT

echo "## Páginas" >> $OUTPUT
echo '```' >> $OUTPUT
find app/pages -name '*.vue' | sort >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

echo "## Composables" >> $OUTPUT
echo '```' >> $OUTPUT
find app/composables -name '*.ts' | sort >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

echo "## Server API" >> $OUTPUT
echo '```' >> $OUTPUT
find server/api -name '*.ts' | sort >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

echo "## Migraciones BD" >> $OUTPUT
echo '```' >> $OUTPUT
ls supabase/migrations/ >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

echo "## Middlewares" >> $OUTPUT
echo '```' >> $OUTPUT
find server/middleware -name '*.ts' | sort >> $OUTPUT
find app/middleware -name '*.ts' | sort >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

echo "## Utils" >> $OUTPUT
echo '```' >> $OUTPUT
find server/utils -name '*.ts' | sort >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

echo "Total páginas: $(find app/pages -name '*.vue' | wc -l)" >> $OUTPUT
echo "Total composables: $(find app/composables -name '*.ts' | wc -l)" >> $OUTPUT
echo "Total endpoints: $(find server/api -name '*.ts' | wc -l)" >> $OUTPUT
echo "Total migraciones: $(ls supabase/migrations/ | wc -l)" >> $OUTPUT
````

Hacerlo ejecutable: `chmod +x scripts/generate-estado-real.sh`

Puede añadirse como paso opcional en CI o ejecutarse manualmente antes de releases.

---

### Resumen archivos sesión 38

| Archivo                           | Tipo                           |
| --------------------------------- | ------------------------------ |
| `README-PROYECTO.md`              | Single source of truth         |
| `CONTRIBUTING.md`                 | Convenciones de código         |
| `scripts/generate-estado-real.sh` | Generador automático de estado |
| `package.json`                    | Fix nombre a "tracciona"       |
| Docs históricos                   | Banner "⚠️ HISTÓRICO"          |

### Orden de ejecución

1. Fix nombre package.json
2. Crear README-PROYECTO.md
3. Marcar docs históricos con banner
4. Crear CONTRIBUTING.md
5. Crear script generador de estado
6. Ejecutar script: `bash scripts/generate-estado-real.sh`
7. Verificar — `npm run build`

---

## SESIÓN 39 — UX: accesibilidad, Core Web Vitals, formularios y code-splitting

> Auditoría de accesibilidad, medición de Core Web Vitals, revisión de formularios críticos, y code-splitting agresivo para reducir bundles.
> **Origen:** Recomendaciones 100 puntos §7 (UX) + §3a (chunks <500KB).

**Leer:**

1. `app/pages/index.vue` — Home (ruta crítica para LCP)
2. `app/pages/vehiculo/[slug].vue` — Ficha (ruta crítica)
3. `app/pages/auth/login.vue` — Login (formulario crítico)
4. `nuxt.config.ts` — Configuración actual
5. `.lighthouserc.js` — Config Lighthouse existente

**Hacer:**

### Parte A — AUDITORÍA DE ACCESIBILIDAD

Ejecutar Lighthouse en modo accesibilidad para las 5 rutas críticas:

```bash
# Asegurar que lighthouse está instalado
npm install -g lighthouse

# Ejecutar en las rutas principales (requiere servidor corriendo)
for route in "/" "/vehiculo/ejemplo-slug" "/subastas" "/auth/login" "/dashboard"; do
  lighthouse "http://localhost:3000$route" \
    --only-categories=accessibility \
    --output=json \
    --output-path="./lighthouse-a11y-$(echo $route | tr '/' '-').json" \
    --chrome-flags='--headless'
done
```

**Errores comunes a corregir:**

1. **Imágenes sin alt:** Buscar `<img` y `<NuxtImg` sin `alt` o con `alt=""`

```bash
grep -rn '<img\|<NuxtImg' app/ --include='*.vue' | grep -v 'alt=' | head -20
```

Fix: añadir `alt` descriptivo o `alt=""` + `aria-hidden="true"` si es decorativa.

2. **Formularios sin labels:** Buscar `<input` sin `<label>` asociado o sin `aria-label`

```bash
grep -rn '<input' app/ --include='*.vue' | grep -v 'aria-label\|id=' | head -20
```

3. **Contraste insuficiente:** Verificar en tokens.css que los colores de texto sobre fondo cumplen ratio 4.5:1 (AA).

4. **Focus visible:** Verificar que al navegar con Tab, los elementos interactivos muestran outline visible.

```css
/* Añadir a tokens.css si no existe */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

---

### Parte B — CODE-SPLITTING: CHUNKS < 500KB

Objetivo: que el chunk inicial (home, catálogo) sea < 250KB y ningún chunk supere 500KB.

**Paso 1: Analizar bundle actual**

```bash
npx nuxi analyze
```

**Paso 2: Identificar imports pesados en rutas públicas**

```bash
# Buscar imports estáticos de librerías pesadas en páginas públicas
grep -rn "import.*Chart\|import.*xlsx\|import.*exceljs\|import.*mapbox\|import.*leaflet\|import.*editor\|import.*dompurify" app/pages/ --include='*.vue' | grep -v admin | grep -v dashboard
```

**Paso 3: Configurar manual chunks en nuxt.config.ts**

```typescript
// nuxt.config.ts
vite: {
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Separar dependencias pesadas de admin
          if (id.includes('chart.js') || id.includes('Chart')) return 'vendor-charts'
          if (id.includes('exceljs') || id.includes('xlsx')) return 'vendor-excel'
          if (id.includes('dompurify')) return 'vendor-sanitize'
          // Separar Stripe
          if (id.includes('@stripe')) return 'vendor-stripe'
        }
      }
    }
  }
}
```

**Paso 4: Lazy imports para componentes pesados de admin**

En páginas admin que usan Chart.js o editores pesados:

```vue
<script setup>
const AdminChart = defineAsyncComponent(() => import('~/components/admin/AdminChart.vue'))
</script>
```

**Paso 5: Verificar resultado**

```bash
npx nuxi analyze
# Comparar con resultados del paso 1
```

---

### Parte C — FORMULARIOS CRÍTICOS: VALIDACIÓN Y ERRORES

**Formularios a revisar (por prioridad):**

1. Login (`app/pages/auth/login.vue`)
2. Registro (`app/pages/auth/register.vue`)
3. Contacto/Lead (`app/components/vehicle/VehicleContactForm.vue` o similar)
4. Alta de vehículo (`app/pages/dashboard/vehiculos/nuevo.vue`)
5. Checkout Stripe

**Para cada formulario, verificar:**

- [ ] Validación en tiempo real (no solo al submit)
- [ ] Mensajes de error en el idioma del usuario (`$t('validation.required')`)
- [ ] No se pierden datos si falla el submit (el formulario mantiene los valores)
- [ ] Botón de submit deshabilitado mientras se envía (evitar doble envío)
- [ ] Feedback visual de carga (spinner o skeleton)
- [ ] `aria-invalid="true"` en campos con error
- [ ] `aria-describedby` apuntando al mensaje de error

**Patrón recomendado:**

```vue
<div class="form-field">
  <label :for="'field-email'">{{ $t('form.email') }}</label>
  <input
    id="field-email"
    v-model="form.email"
    type="email"
    :aria-invalid="!!errors.email"
    :aria-describedby="errors.email ? 'error-email' : undefined"
  />
  <p v-if="errors.email" id="error-email" class="error" role="alert">
    {{ errors.email }}
  </p>
</div>
```

---

### Parte D — CORE WEB VITALS: MEDICIÓN Y OBJETIVOS

Definir objetivos y medir:

| Métrica | Objetivo | Ruta crítica                        |
| ------- | -------- | ----------------------------------- |
| LCP     | < 2.5s   | Home, catálogo, ficha               |
| INP     | < 200ms  | Catálogo (filtros), ficha (galería) |
| CLS     | < 0.1    | Home, ficha                         |

**Añadir medición en producción:**

Si no existe, crear `app/plugins/web-vitals.client.ts`:

```typescript
import { onCLS, onINP, onLCP } from 'web-vitals'

export default defineNuxtPlugin(() => {
  if (process.env.NODE_ENV === 'production') {
    onCLS(console.log)
    onINP(console.log)
    onLCP(console.log)
    // Opcionalmente enviar a Sentry o analytics
  }
})
```

Instalar: `npm install web-vitals`

**Añadir a Lighthouse CI (`.lighthouserc.js`):**

```javascript
assert: {
  assertions: {
    'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
    'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
    'interactive': ['warn', { maxNumericValue: 3500 }],
  }
}
```

---

### Parte E — TOUCH Y MÓVIL: VERIFICACIÓN

```bash
# Buscar elementos interactivos que podrían ser pequeños
grep -rn 'class=.*btn.*sm\|class=.*text-xs.*cursor\|padding:.*2px' app/ --include='*.vue' | head -20
```

Verificar manualmente en Chrome DevTools (360px viewport):

- [ ] No hay overflow horizontal en ninguna página pública
- [ ] Filtros del catálogo son usables (bottom sheet o fullscreen en móvil)
- [ ] Galería de imágenes funciona con swipe
- [ ] Botones de contacto (WhatsApp, tel) tienen área ≥ 44px

---

### Parte F — DIVIDIR COMPONENTES VUE > 500 LÍNEAS

Las recomendaciones de modulabilidad piden archivos < 400 líneas. Identificar y dividir.

```bash
# Identificar componentes/páginas Vue de más de 500 líneas
find app/pages app/components -name '*.vue' -exec sh -c 'lines=$(wc -l < "$1"); if [ $lines -gt 500 ]; then echo "$lines $1"; fi' _ {} \; | sort -rn
```

**Para cada archivo >500 líneas:**

1. Identificar bloques lógicos (tabs, secciones, modales, formularios)
2. Extraer cada bloque a un subcomponente: `ComponenteSeccionX.vue`
3. La página original queda como "orquestador" que importa subcomponentes
4. Mantener props/emits mínimos; usar composables para estado compartido

**NO dividir si:**

- El archivo es largo solo por tipos/interfaces → extraer tipos a `types/`
- El archivo es largo por template repetitivo → extraer a componente reutilizable
- Dividir rompería la cohesión lógica (todo el contenido está íntimamente relacionado)

---

### Parte G — PWA: MENSAJE OFFLINE AMIGABLE

Cuando no hay conexión, la PWA debe mostrar un mensaje amigable en lugar de error genérico del navegador.

**Verificar si existe `app/pages/offline.vue`:**

```bash
ls app/pages/offline.vue 2>/dev/null || echo "NO EXISTE"
```

**Si no existe, crear `app/pages/offline.vue`:**

```vue
<template>
  <div class="offline-page">
    <h1>{{ $t('offline.title') }}</h1>
    <p>{{ $t('offline.message') }}</p>
    <button @click="retry">{{ $t('offline.retry') }}</button>
  </div>
</template>

<script setup>
const retry = () => window.location.reload()
</script>
```

**Añadir a `i18n/es.json`:**

```json
"offline": {
  "title": "Sin conexión",
  "message": "No tienes conexión a internet. Comprueba tu conexión e inténtalo de nuevo.",
  "retry": "Reintentar"
}
```

**Verificar en `nuxt.config.ts`** que el service worker (workbox) tiene fallback a esta página para navegaciones offline.

**Prioridad:** 🟢 Baja. Solo mejora UX en escenarios edge.

---

### Resumen archivos sesión 39

| Archivo                            | Tipo                                  |
| ---------------------------------- | ------------------------------------- |
| `app/plugins/web-vitals.client.ts` | Métricas de rendimiento en producción |
| `nuxt.config.ts`                   | manualChunks para code-splitting      |
| `.lighthouserc.js`                 | Umbrales de Core Web Vitals           |
| `app/assets/css/tokens.css`        | Fix focus-visible si falta            |
| Formularios críticos               | Validación + aria + feedback          |
| Imágenes                           | alt text                              |
| Componentes Vue >500 líneas        | Dividir en subcomponentes             |
| `app/pages/offline.vue`            | Mensaje offline PWA                   |

### Orden de ejecución

1. Instalar web-vitals: `npm install web-vitals`
2. Crear plugin web-vitals
3. Ejecutar `npx nuxi analyze` (baseline)
4. Configurar manualChunks en nuxt.config.ts
5. Lazy-load componentes pesados de admin
6. Ejecutar `npx nuxi analyze` (verificar mejora)
7. Identificar y dividir componentes Vue >500 líneas
8. Auditoría Lighthouse accesibilidad en 5 rutas
9. Corregir errores de a11y (alt, labels, contraste, focus)
10. Revisar formularios críticos
11. Verificar touch/móvil en 360px
12. Crear página offline.vue para PWA
13. Verificar — `npm run build` + Lighthouse score ≥ 90 en a11y

---

## SESIÓN 40 — Monetización avanzada: trials, dunning, métricas por canal y canales nuevos

> Completa los flujos de monetización: trial periods, dunning (reintentos de pago), métricas de ingresos por canal, y cierra al menos 2 canales de ingreso adicionales.
> **Origen:** Recomendaciones 100 puntos §4 (monetización).

**Leer:**

1. `server/api/stripe/` — Flujos Stripe actuales
2. `server/api/stripe/webhook.post.ts` — Eventos de pago
3. `docs/tracciona-docs/anexos/E-sistema-pro.md (alias de compatibilidad histórica)` — Sistema Pro
4. `app/pages/admin/facturacion.vue` — Panel actual
5. Sesión 17 (Stripe) y sesión 27 (Métricas) en INSTRUCCIONES-MAESTRAS

**Hacer:**

### Parte A — TRIAL PERIOD PARA SUSCRIPCIONES

Añadir trial de 14 días para nuevos dealers.

**Modificar `server/api/stripe/checkout.post.ts`:**

Añadir `subscription_data.trial_period_days: 14` al crear la sesión de checkout SI el dealer no ha tenido nunca una suscripción antes.

```typescript
// Verificar si es primer trial
const { data: existingSub } = await supabase
  .from('subscriptions')
  .select('id')
  .eq('dealer_id', dealerId)
  .limit(1)
  .single()

const sessionParams: any = {
  mode: 'subscription',
  // ... resto de params
}

if (!existingSub) {
  sessionParams.subscription_data = {
    trial_period_days: 14,
    metadata: { dealer_id: dealerId },
  }
}
```

**UI:** En la página de precios, mostrar "14 días gratis" solo si el dealer no ha tenido trial.

---

### Parte B — DUNNING: FLUJO DE REINTENTOS DE PAGO

Stripe ya hace reintentos automáticos (hasta 4 intentos en 3 semanas). Lo que falta es reaccionar a esos eventos.

**Añadir handlers en `stripe/webhook.post.ts`:**

```typescript
case 'invoice.payment_failed': {
  const invoice = stripeEvent.data.object
  const dealerId = invoice.subscription_details?.metadata?.dealer_id
  const attemptCount = invoice.attempt_count

  if (attemptCount === 1) {
    // Primer fallo: email amable
    await sendEmail(dealerId, 'payment-failed-soft')
  } else if (attemptCount === 3) {
    // Tercer fallo: email urgente + banner en dashboard
    await sendEmail(dealerId, 'payment-failed-urgent')
    await supabase.from('dealers').update({ payment_warning: true }).eq('id', dealerId)
  }
  break
}

case 'customer.subscription.deleted': {
  // Suscripción cancelada (tras agotar reintentos o cancelación manual)
  const sub = stripeEvent.data.object
  const dealerId = sub.metadata?.dealer_id

  // Downgrade: mantener datos, quitar acceso premium
  await supabase.from('dealers').update({
    plan: 'free',
    plan_expires_at: new Date().toISOString(),
    payment_warning: false,
  }).eq('id', dealerId)

  // Ocultar vehículos que excedan límite free
  // (NO eliminar, solo cambiar status)
  await sendEmail(dealerId, 'subscription-cancelled')
  break
}
```

**Crear 2 templates de email:**

- `payment-failed-soft` — "Tu pago no se ha procesado. Actualiza tu método de pago."
- `payment-failed-urgent` — "Tu suscripción se cancelará pronto. Actualiza ahora."

---

### Parte C — MÉTRICAS DE MONETIZACIÓN POR CANAL

Ampliar el dashboard de métricas (sesión 27) con desglose por canal de ingresos.

**Añadir a la página de admin de métricas:**

```typescript
// Composable useRevenueMetrics()
const channels = [
  {
    key: 'subscriptions',
    label: 'Suscripciones',
    query: supabase.from('payments').select('amount_cents').eq('type', 'subscription'),
  },
  {
    key: 'auction_premium',
    label: 'Comisión subastas',
    query: supabase.from('payments').select('amount_cents').eq('type', 'auction_premium'),
  },
  {
    key: 'ads',
    label: 'Publicidad',
    query: supabase.from('payments').select('amount_cents').eq('type', 'ad'),
  },
  {
    key: 'verification',
    label: 'Verificaciones DGT',
    query: supabase.from('payments').select('amount_cents').eq('type', 'verification'),
  },
  {
    key: 'transport',
    label: 'Transporte',
    query: supabase.from('payments').select('amount_cents').eq('type', 'transport'),
  },
]

// Calcular MRR, ARR por canal
```

**Mostrar en admin:** Tabla con MRR por canal + gráfico de evolución mensual (Chart.js ya disponible).

---

### Parte D — 2 CANALES NUEVOS: API VALORACIÓN + WIDGET EMBEBIBLE

**Canal 1: API de valoración (cerrar modelo de precios)**

El endpoint `server/api/v1/valuation.get.ts` ya existe. Falta:

1. Crear tabla `api_keys` (dealer_id, key, plan, requests_this_month, max_requests)
2. Middleware de API key: verificar header `x-api-key`, contar requests
3. Planes: Free (50 consultas/mes), Basic (€29/mes, 500), Premium (€99/mes, 5000)
4. Endpoint `server/api/v1/valuation.get.ts` verifica API key en lugar de auth de usuario
5. Página en dashboard dealer para gestionar su API key

**Canal 2: Widget embebible para dealers**

1. Crear `server/api/widget/[dealerId].get.ts` — devuelve HTML+CSS+JS embebible
2. El widget muestra los últimos 6 vehículos del dealer como grid responsive
3. Cada vehículo enlaza a la ficha en Tracciona (con UTM para tracking)
4. Página en dashboard con código de embed: `<iframe src="https://tracciona.com/api/widget/DEALER_ID" />`
5. Plan gratuito: con "Powered by Tracciona". Plan premium: sin marca.

---

### Parte E — CUANTIFICACIÓN DE LEAD GEN

Añadir tracking de acciones de contacto para cuantificar el valor de la plataforma para dealers.

**1. Eventos a trackear (añadir a analytics/composable existente):**

```typescript
// app/composables/useLeadTracking.ts
export function useLeadTracking() {
  const track = (event: string, data: Record<string, unknown>) => {
    const supabase = useSupabaseClient()
    supabase.from('activity_logs').insert({
      action: event,
      metadata: data,
      created_at: new Date().toISOString(),
    })
  }

  return {
    trackContactClick: (
      vehicleId: string,
      dealerId: string,
      method: 'phone' | 'whatsapp' | 'form',
    ) => track('contact_click', { vehicle_id: vehicleId, dealer_id: dealerId, method }),
    trackFichaView: (vehicleId: string, dealerId: string) =>
      track('ficha_view', { vehicle_id: vehicleId, dealer_id: dealerId }),
    trackFavorite: (vehicleId: string) => track('favorite_add', { vehicle_id: vehicleId }),
  }
}
```

**2. Métricas para dashboard dealer (ampliar `useDealerDashboard`):**

- Total contactos recibidos (phone + whatsapp + form) este mes
- Fichas vistas este mes
- Ratio contacto/vista (conversión)
- Comparativa con mes anterior

**3. Métricas para admin (ampliar `useRevenueMetrics` de Parte C):**

- Leads totales generados por la plataforma
- Valor estimado por lead (configurable en admin, ej: €15/lead)
- Valor total generado para dealers = leads × valor/lead

Esto permite decir a dealers "Tracciona te generó 47 contactos este mes, valor estimado: €705".

---

### Resumen archivos sesión 40

| Archivo                                | Tipo                                       |
| -------------------------------------- | ------------------------------------------ |
| `server/api/stripe/checkout.post.ts`   | Añadir trial_period_days                   |
| `server/api/stripe/webhook.post.ts`    | Handlers dunning                           |
| Templates email                        | payment-failed-soft, payment-failed-urgent |
| `app/composables/useRevenueMetrics.ts` | Métricas por canal                         |
| `app/composables/useLeadTracking.ts`   | Tracking de contactos y valor lead         |
| `server/api/v1/valuation.get.ts`       | Cerrar con API key                         |
| `server/api/widget/[dealerId].get.ts`  | Widget embebible                           |
| Migración `00058_api_keys.sql`         | Tabla api_keys                             |

### Orden de ejecución

1. Trial period en checkout
2. Handlers dunning en webhook
3. Templates de email de pago fallido
4. Métricas de ingresos por canal
5. API de valoración con API keys
6. Widget embebible
7. Verificar — `npm run build` + tests

---

## SESIÓN 41 — Arquitectura: capa de servicios, diagrama técnico, umbrales y refactors

> Introduce capa de servicios para endpoints largos, crea diagrama de arquitectura técnico, define umbrales de alertas, y verifica extensibilidad del sistema multi-vertical.
> **Origen:** Recomendaciones 100 puntos §5 (arquitectura) + §3d-e (escalabilidad operativa, umbrales) + §8e (extensibilidad).

**Leer:**

1. `server/api/market-report.get.ts` — Endpoint largo a refactorizar
2. `docs/tracciona-docs/referencia/ARQUITECTURA-ESCALABILIDAD.md` — Ampliar
3. Sesión 33 (infraestructura) en INSTRUCCIONES-MAESTRAS

**Hacer:**

### Parte A — CAPA DE SERVICIOS (server/services/)

Para endpoints con >200 líneas de lógica, extraer a servicios por dominio.

**Crear `server/services/` con:**

```
server/services/
  marketReport.ts    ← Lógica extraída de market-report.get.ts
  billing.ts         ← Lógica compartida de invoicing/checkout/webhook
  vehicles.ts        ← Queries comunes de vehículos (si se repiten)
```

**Patrón:**

```typescript
// server/services/marketReport.ts
export async function generateMarketReport(supabase: any, options: ReportOptions) {
  // Toda la lógica pesada aquí
  return reportData
}

// server/api/market-report.get.ts (refactorizado)
import { generateMarketReport } from '../services/marketReport'

export default defineEventHandler(async (event) => {
  // Solo: validar, llamar servicio, devolver
  const options = getQuery(event)
  const supabase = serverSupabaseServiceRole(event)
  return generateMarketReport(supabase, options)
})
```

Claude Code debe identificar endpoints >200 líneas:

```bash
find server/api/ -name '*.ts' -exec sh -c 'lines=$(wc -l < "$1"); if [ $lines -gt 200 ]; then echo "$lines $1"; fi' _ {} \; | sort -rn
```

---

### Parte B — DIAGRAMA DE ARQUITECTURA TÉCNICO

Añadir al final de `ARQUITECTURA-ESCALABILIDAD.md`:

```
## Diagrama de flujo de datos

┌───────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Usuario     │─────│  Cloudflare CDN   │─────│  Cloudflare Pages │
│  (navegador)  │     │  (cache + WAF)    │     │  (Nuxt 3 SSR)    │
└───────────────┘     └──────────────────┘     └────────┬─────────┘
                                                       │
                    ┌─────────────────┬─────────┴─────────┬─────────────────┐
                    │                 │                   │                 │
              ┌─────┴───────┐ ┌────┴───────────┐ ┌───┴─────────┐ ┌───┴─────────┐
              │  Supabase   │ │    Stripe      │ │  Cloudinary  │ │   Resend     │
              │  (BD+RLS+   │ │ (pagos+webhook)│ │  → CF Images │ │  (emails)    │
              │  Realtime)  │ │               │ │             │ │             │
              └─────────────┘ └───────────────┘ └─────────────┘ └─────────────┘
                                    │
                    ┌─────────────┴──────────────┐
                    │   WhatsApp Meta Cloud API  │
                    │   + Claude Vision (IA)      │
                    └─────────────────────────────┘

Crons (Workers CF):
  freshness-check, search-alerts, publish-scheduled,
  favorite-price-drop, dealer-weekly-stats, auto-auction,
  whatsapp-retry, infra-metrics

Seguridad CI:
  Semgrep CE → análisis estático
  Snyk free → dependencias
  npm audit → vulnerabilidades
  Vitest → tests de auth/IDOR
```

---

### Parte C — UMBRALES Y ALERTAS FORMALES

Ampliar la sección de monitorización de sesión 33 con umbrales concretos.

**Añadir a la tabla de config de `infra_thresholds` (o a vertical_config):**

| Métrica                         | Umbral warning  | Umbral crítico | Acción         |
| ------------------------------- | --------------- | -------------- | -------------- |
| Supabase DB size                | 80% del plan    | 90%            | Email admin    |
| Supabase API requests/min       | 500             | 800            | Email + Sentry |
| Cloudinary transformaciones/mes | 80% del plan    | 95%            | Email admin    |
| CF Images stored                | 80%             | 95%            | Email admin    |
| Error rate (Sentry)             | >1% de requests | >5%            | Sentry alert   |
| Stripe webhook failures         | 3 consecutivos  | 5              | Email + Sentry |
| Build time CI                   | >5 min          | >10 min        | Warning en PR  |
| Bundle size (mayor chunk)       | >500KB          | >800KB         | Warning en PR  |

**Implementación:** El cron `infra-metrics.post.ts` (sesión 33) ya recopila métricas. Añadir comparación contra umbrales y envío de alerta si se superan.

---

### Parte C-BIS — DOCUMENTAR RATE LIMIT Y WAF EN ARQUITECTURA-ESCALABILIDAD

La sesión 34 implementó rate limiting en middleware pero no se documentó en el documento de referencia de escalabilidad.

**Añadir sección a `ARQUITECTURA-ESCALABILIDAD.md`:**

```markdown
## Rate Limiting y WAF

### Middleware de rate limiting (server/middleware/rate-limit.ts)

- Implementado en sesión 34
- Basado en IP para rutas públicas
- Límites por tipo de ruta:
  | Ruta | Límite | Ventana |
  |---|---|---|
  | /api/auth/_ | 10 req | 1 min |
  | /api/stripe/checkout | 5 req | 1 min |
  | /api/email/send | 3 req | 1 min |
  | /api/_ (general) | 60 req | 1 min |
  | Páginas públicas | Sin límite | — (cache CDN) |

### Cloudflare WAF (configuración recomendada)

- Bot Fight Mode: activado
- Security Level: Medium
- Rate Limiting Rules (CF Dashboard):
  - /api/auth/\*: 20 req/min por IP → Challenge
  - /api/stripe/\*: 10 req/min por IP → Block
  - /api/cron/\*: Solo IPs de Cloudflare Workers → Block resto
- Nota: El rate limiting del middleware es la primera línea; CF WAF es la segunda.
```

---

### Parte D — VERIFICACIÓN DE EXTENSIBILIDAD

Script que verifica que añadir una nueva categoría, idioma o mercado es "solo datos".

**Crear `scripts/verify-extensibility.sh`:**

```bash
#!/bin/bash
echo "=== Verificación de extensibilidad ==="
echo ""

# 1. ¿Hay categorías hardcodeadas en el código?
echo "1. Categorías hardcodeadas:"
grep -rn 'vehiculos\|maquinaria\|hosteleria\|horecaria' app/ server/ --include='*.ts' --include='*.vue' | grep -v node_modules | grep -v '.nuxt' | grep -v 'i18n' | grep -v 'migrations' | head -10
echo ""

# 2. ¿Hay idiomas hardcodeados (que no sean config)?
echo "2. Idiomas hardcodeados fuera de config:"
grep -rn "'es'\|'en'\|'fr'" app/ --include='*.ts' --include='*.vue' | grep -v 'i18n' | grep -v 'locale' | grep -v 'node_modules' | grep -v '.nuxt' | head -10
echo ""

# 3. ¿Hay URLs/dominios hardcodeados?
echo "3. Dominios hardcodeados:"
grep -rn 'tracciona\.com\|tank-iberica\.com' app/ server/ --include='*.ts' --include='*.vue' | grep -v node_modules | head -10
echo ""

echo "Si alguna sección muestra resultados, hay acoplamiento que corregir."
```

---

### Parte E — DECISIONES SOBRE MÓDULOS PARCIALES

La valoración identifica 2 módulos parciales. Documentar decisiones:

**1. Landing pages builder avanzado:**
Decisión: POSPONER. Las landing pages SEO dinámicas de la sesión 4 cubren el caso de uso principal. Un builder visual tipo Webflow es excesivo para la fase actual. Se reconsiderará si dealers lo piden.

**2. OAuth social (Google, Facebook login):**
Decisión: IMPLEMENTAR MÍNIMO. Google Login ya está en la sesión 24. Facebook Login se pospone (bajo uso en B2B). Si se necesita, Supabase Auth lo soporta con 2 líneas de config.

Documentar en ESTADO-REAL-PRODUCTO.md.

---

### Resumen archivos sesión 41

| Archivo                                 | Tipo                                             |
| --------------------------------------- | ------------------------------------------------ |
| `server/services/marketReport.ts`       | Refactor de endpoint largo                       |
| `server/services/billing.ts`            | Lógica compartida de pagos                       |
| `ARQUITECTURA-ESCALABILIDAD.md`         | Diagrama + umbrales + rate limit/WAF documentado |
| `scripts/verify-extensibility.sh`       | Check de extensibilidad                          |
| `server/api/cron/infra-metrics.post.ts` | Comparación contra umbrales                      |
| `ESTADO-REAL-PRODUCTO.md`               | Decisiones sobre módulos parciales               |

### Orden de ejecución

1. Identificar endpoints >200 líneas
2. Crear server/services/ y refactorizar
3. Añadir diagrama a ARQUITECTURA-ESCALABILIDAD.md
4. Definir umbrales y añadir alertas a infra-metrics
5. Crear script verify-extensibility.sh y ejecutar
6. Documentar decisiones sobre módulos parciales
7. Verificar — `npm run build` + tests

---

## SESIÓN 42 — Testing E2E: user journeys + flujos de punta a punta con Playwright

> Define y ejecuta 8 user journeys completos con Playwright. Estos tests verifican que los flujos críticos funcionan de extremo a extremo, no solo endpoints individuales.
> **Origen:** Recomendaciones 100 puntos §7c (flujos de punta a punta) + §8a (sesiones pendientes).

**Leer:**

1. `playwright.config.ts` — Configuración actual
2. `tests/e2e/` — Tests E2E existentes (si los hay)
3. Sesión 20 (Testing) en INSTRUCCIONES-MAESTRAS

**Hacer:**

### Parte A — DEFINIR 8 USER JOURNEYS

Cada journey es un test E2E completo que simula un usuario real. Se ejecutan con Playwright contra servidor de preview.

**Crear `tests/e2e/journeys/`:**

| #   | Journey              | Archivo                    | Flujo                                                                |
| --- | -------------------- | -------------------------- | -------------------------------------------------------------------- |
| 1   | Comprador anónimo    | `anonymous-browse.spec.ts` | Home → catálogo → filtrar → ver ficha → ver galería → volver         |
| 2   | Comprador registrado | `buyer-register.spec.ts`   | Registro → confirmar email → login → favorito → alerta búsqueda      |
| 3   | Comprador contacta   | `buyer-contact.spec.ts`    | Login → ficha → clic WhatsApp/teléfono → formulario contacto         |
| 4   | Dealer publica       | `dealer-publish.spec.ts`   | Login dealer → dashboard → nuevo vehículo → rellenar → publicar      |
| 5   | Dealer gestiona      | `dealer-manage.spec.ts`    | Login dealer → dashboard → editar vehículo → pausar → marcar vendido |
| 6   | Admin aprueba        | `admin-approve.spec.ts`    | Login admin → productos → cambiar estado → verificar                 |
| 7   | Subasta básica       | `auction-flow.spec.ts`     | Login → subastas → inscribirse → pujar (mock)                        |
| 8   | SEO landing          | `seo-landing.spec.ts`      | Visitar landing SEO → verificar h1, meta, schema.org, enlaces        |

### Parte B — IMPLEMENTACIÓN PATRÓN

```typescript
// tests/e2e/journeys/anonymous-browse.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Journey: Comprador anónimo navega catálogo', () => {
  test('Home → catálogo → filtrar → ficha → galería', async ({ page }) => {
    // 1. Home
    await page.goto('/')
    await expect(page).toHaveTitle(/Tracciona/)

    // 2. Navegar a catálogo (clic en CTA o enlace)
    await page.click('text=Ver cat\u00e1logo') // Ajustar selector real
    await expect(page.url()).toContain('/')

    // 3. Clic en primer vehículo
    await page.click('[data-testid="vehicle-card"]:first-child')
    await expect(page.url()).toContain('/vehiculo/')

    // 4. Verificar ficha cargada
    await expect(page.locator('h1')).toBeVisible()

    // 5. Galería de imágenes
    const gallery = page.locator('[data-testid="vehicle-gallery"]')
    if (await gallery.isVisible()) {
      await gallery.click()
    }
  })
})
```

**Nota para Claude Code:** Los selectores exactos dependen del código real. Claude Code debe:

1. Leer las páginas reales para encontrar selectores correctos
2. Añadir `data-testid` donde falten para selectores estables
3. Usar `page.waitForLoadState('networkidle')` después de navegaciones

### Parte C — INTEGRACIÓN EN CI

Añadir a `.github/workflows/ci.yml`:

```yaml
e2e-journeys:
  runs-on: ubuntu-latest
  needs: [build]
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - run: npm ci
    - run: npx playwright install --with-deps chromium
    - run: npm run build
    - run: npx nuxi preview &
    - run: sleep 10
    - run: BASE_URL=http://localhost:3000 npx playwright test tests/e2e/journeys/
    - uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/
```

---

### Resumen archivos sesión 42

| Archivo                        | Tipo                              |
| ------------------------------ | --------------------------------- |
| `tests/e2e/journeys/*.spec.ts` | 8 user journeys E2E               |
| `.github/workflows/ci.yml`     | Job e2e-journeys                  |
| Páginas/componentes            | Añadir `data-testid` donde falten |

### Orden de ejecución

1. Crear carpeta `tests/e2e/journeys/`
2. Implementar journey 1 (anónimo) como prueba de concepto
3. Ejecutar localmente: `npx playwright test tests/e2e/journeys/anonymous-browse.spec.ts`
4. Ajustar selectores hasta que pase
5. Implementar journeys 2-8
6. Añadir `data-testid` a elementos críticos donde falten
7. Integrar en CI
8. Verificar — todos los journeys pasan

### Tests mínimos

- [ ] Los 8 journeys pasan en local con Playwright
- [ ] CI ejecuta journeys sin fallos
- [ ] Cada journey tarda < 30 segundos
- [ ] Si falla, genera screenshot y video para debug

---

## MAPA COMPLETO DE RUTAS (REFERENCIA CANÓNICA)

> **Para Claude Code:** Este mapa es la fuente de verdad para la estructura de `pages/`. Cuando haya contradicción con cualquier otro documento, este mapa prevalece.

```
pages/
│
├── index.vue                              → Home (/)
├── vehiculo/[slug].vue                    → Ficha de vehículo (/vehiculo/cisterna-indox-25000l)
├── subastas/
│   ├── index.vue                          → Listado subastas (/subastas)
│   └── [id].vue                           → Detalle subasta (/subastas/abc123)
├── guia/                                  → Contenido editorial EVERGREEN (decisión SEO 17 Feb)
│   ├── index.vue                          → Índice de guías (/guia)
│   └── [slug].vue                         → Guía individual (/guia/normativa-adr-cisternas)
├── noticias/                              → Contenido temporal con valor SEO a 3+ meses
│   ├── index.vue                          → Índice de noticias (/noticias)
│   └── [slug].vue                         → Noticia individual (/noticias/nuevo-reglamento-adr-2027)
├── precios.vue                            → Planes de suscripción (/precios) [sesión 17]
├── datos.vue                              → Índice de precios de mercado público (/datos) [sesión 32]
├── valoracion.vue                         → Valoración individual de vehículo (/valoracion) [sesión 32]
├── transparencia.vue                      → Informe DSA anual (/transparencia) [sesión 25]
├── servicios-postventa.vue                → Cross-sell post-venta (/servicios-postventa?v=slug) [sesión 16c]
├── nosotros.vue                           → Sobre Tracciona (/nosotros)
├── legal.vue                              → Aviso legal (/legal)
├── privacidad.vue                         → Política de privacidad (/privacidad)
├── cookies.vue                            → Política de cookies (/cookies)
├── condiciones.vue                        → Términos y condiciones (/condiciones)
├── auth/
│   ├── login.vue                          → /auth/login
│   ├── registro.vue                       → /auth/registro
│   ├── confirmar.vue                      → /auth/confirmar
│   ├── recuperar.vue                      → /auth/recuperar
│   └── nueva-password.vue                 → /auth/nueva-password
├── perfil/                                → Zona privada COMPRADOR (auth requerido)
│   ├── index.vue                          → /perfil (dashboard comprador)
│   ├── datos.vue                          → /perfil/datos
│   ├── favoritos.vue                      → /perfil/favoritos
│   ├── alertas.vue                        → /perfil/alertas
│   ├── contactos.vue                      → /perfil/contactos
│   ├── notificaciones.vue                 → /perfil/notificaciones
│   ├── suscripcion.vue                    → /perfil/suscripcion
│   └── seguridad.vue                      → /perfil/seguridad
├── dashboard/                             → Zona privada DEALER (auth + user_type=dealer)
│   ├── index.vue                          → /dashboard (panel dealer)
│   ├── vehiculos/
│   │   ├── index.vue                      → /dashboard/vehiculos
│   │   ├── nuevo.vue                      → /dashboard/vehiculos/nuevo
│   │   ├── importar.vue                   → /dashboard/vehiculos/importar
│   │   └── [id].vue                       → /dashboard/vehiculos/:id (editar)
│   ├── leads/
│   │   ├── index.vue                      → /dashboard/leads
│   │   └── [id].vue                       → /dashboard/leads/:id
│   ├── estadisticas.vue                   → /dashboard/estadisticas
│   ├── portal.vue                         → /dashboard/portal
│   ├── herramientas/
│   │   ├── factura.vue                    → /dashboard/herramientas/factura
│   │   ├── contrato.vue                   → /dashboard/herramientas/contrato
│   │   ├── presupuesto.vue                → /dashboard/herramientas/presupuesto
│   │   ├── calculadora.vue                → /dashboard/herramientas/calculadora
│   │   ├── exportar-anuncio.vue           → /dashboard/herramientas/exportar-anuncio
│   │   ├── widget.vue                     → /dashboard/herramientas/widget
│   │   ├── exportar.vue                   → /dashboard/herramientas/exportar
│   │   └── merchandising.vue              → /dashboard/herramientas/merchandising
│   ├── suscripcion.vue                    → /dashboard/suscripcion
│   └── facturas.vue                       → /dashboard/facturas
├── admin/                                 → Panel administración (auth + role=admin)
│   ├── index.vue                          → /admin (dashboard métricas)
│   ├── config/
│   │   ├── branding.vue                   → /admin/config/branding
│   │   ├── navigation.vue                 → /admin/config/navigation
│   │   ├── homepage.vue                   → /admin/config/homepage
│   │   ├── catalog.vue                    → /admin/config/catalog
│   │   ├── languages.vue                  → /admin/config/languages
│   │   ├── pricing.vue                    → /admin/config/pricing
│   │   ├── integrations.vue               → /admin/config/integrations
│   │   ├── emails.vue                     → /admin/config/emails
│   │   ├── editorial.vue                  → /admin/config/editorial
│   │   └── system.vue                     → /admin/config/system
│   ├── verificaciones.vue                 → /admin/verificaciones [sesión 15]
│   ├── subastas/                          → /admin/subastas [sesión 16]
│   ├── publicidad.vue                     → /admin/publicidad [sesión 16b]
│   ├── captacion.vue                      → /admin/captacion [sesión 16d]
│   ├── social.vue                         → /admin/social [sesión 16d]
│   ├── infraestructura.vue                → /admin/infraestructura [sesión 33]
│   └── utilidades.vue                     → /admin/utilidades (ya existe)
└── [...slug].vue                          → CATCH-ALL (ver lógica abajo)
```

### Lógica del catch-all `[...slug].vue`

> **DECISIÓN SEO 17 Feb:** Landing pages con URLs flat (guión, primer nivel).
> `/cisternas-alimentarias` NO `/cisternas/alimentarias`.
> Landing solo se activa cuando: (a) 3+ vehículos reales Y (b) solapamiento con padre < umbral dinámico.
> Umbral dinámico: 3-10 veh en padre → 40%, 11-30 → 50%, 31-50 → 60%, 50+ → 70%.
> Ver 01-pasos-0-6-migracion.md Paso 3.1 para tabla y lógica.

Orden de resolución (Anexo K.9):

1. Buscar en `active_landings` WHERE slug = input AND is_active = true
   → Si encuentra → renderizar landing de catálogo (/cisternas, /cisternas-alimentarias, /cisternas-alimentarias-indox)
   NOTA: URLs flat con guión (decisión SEO 17 Feb). NUNCA /cisternas/alimentarias (nested)
2. Si landing existe pero is_active = false → 302 redirect a parent_slug
3. Buscar en `dealers` WHERE slug = input AND status = 'active'
   → Si encuentra → renderizar portal público del dealer (tracciona.com/transportes-garcia)
4. Nada encontrado → 404

### Slugs reservados (no pueden ser usados por dealers ni landings)

```typescript
export const RESERVED_SLUGS = [
  'admin',
  'dashboard',
  'perfil',
  'auth',
  'vehiculo',
  'subastas',
  'guia',
  'noticias',
  'precios',
  'datos',
  'valoracion',
  'transparencia',
  'servicios-postventa',
  'nosotros',
  'legal',
  'privacidad',
  'cookies',
  'condiciones',
  'api',
  'embed',
  'sitemap',
  'robots',
  'favicon',
  'manifest',
]
```

### Ejemplos de URLs públicas resueltas

```
tracciona.com/                                       → index.vue (Home)
tracciona.com/cisternas                              → [...slug].vue → active_landings → Landing categoría
tracciona.com/cisternas-alimentarias                 → [...slug].vue → active_landings → Landing subcategoría (flat)
tracciona.com/cisternas-alimentarias-indox           → [...slug].vue → active_landings → Landing marca (flat)
tracciona.com/alquiler-cisternas                     → [...slug].vue → active_landings → Landing acción+cat (flat)
tracciona.com/cabezas-tractoras-renault              → [...slug].vue → active_landings → Landing cat+marca (flat)
tracciona.com/vehiculo/cisterna-indox-25000l-2019     → vehiculo/[slug].vue → Ficha de vehículo
tracciona.com/transportes-garcia                     → [...slug].vue → dealers → Portal público dealer
tracciona.com/guia/como-elegir-cisterna                → guia/[slug].vue → Guía evergreen
tracciona.com/noticias/nuevo-reglamento-adr-2027        → noticias/[slug].vue → Noticia temporal
tracciona.com/subastas                               → subastas/index.vue → Listado subastas
tracciona.com/precios                                → precios.vue → Planes suscripción
tracciona.com/en/cisternas                           → i18n prefix + [...slug].vue → Landing EN
tracciona.com/fr/vehiculo/citerne-indox-25000l       → i18n prefix + vehiculo/[slug].vue → Ficha FR
```

---

## SESIÓN 43 — Cierre: actualizar estado real del producto y progreso

> Actualizar toda la documentación de estado para reflejar el trabajo completado en las sesiones 1-42.
> **Origen:** Checklist post-sesiones (docs/auditorias/CHECKLIST-POST-SESIONES.md).

**Leer:**

1. `docs/progreso.md (alias de compatibilidad histórica)` — Estado actual (desactualizado)
2. `docs/ESTADO-REAL-PRODUCTO.md (alias de compatibilidad)` — Generado automáticamente
3. `docs/auditorias/CHECKLIST-POST-SESIONES.md` — Pendientes post-sesiones
4. `scripts/generate-estado-real.sh` — Script generador

**Hacer:**

### Parte A — REGENERAR ESTADO-REAL-PRODUCTO

```bash
bash scripts/generate-estado-real.sh
```

Verificar que el output refleja todas las páginas, composables, endpoints y migraciones actuales.

### Parte B — ACTUALIZAR PROGRESO.MD

Reescribir `docs/progreso.md (alias de compatibilidad histórica)` con:

1. Lista de sesiones 1-42 con estado (completada / parcial / pendiente)
2. Resumen de módulos implementados vs pendientes
3. Referencia al checklist de pendientes post-sesiones
4. Fecha de última actualización

### Parte C — DOCUMENTAR MÓDULOS POSPUESTOS

Añadir sección en `docs/ESTADO-REAL-PRODUCTO.md (alias de compatibilidad)`:

- **Landing pages builder** → POSPUESTO (diseño en anexos, no implementado)
- **OAuth social** → MÍNIMO (solo email+password activo, Google OAuth preparado pero no activado)
- **Prebid demand partners** → PLACEHOLDER (IDs de partners no configurados)

### Parte D — VERIFICAR COHERENCIA DOCUMENTAL

1. README-PROYECTO.md apunta a docs correctos
2. CLAUDE.md refleja estado actual (sesiones 1-42 completadas)
3. contexto-global.md (alias de compatibilidad) actualizado con nuevos módulos (conversación, reservas, comparador, etc.)

### Resumen archivos sesión 43

| Archivo                        | Tipo                   |
| ------------------------------ | ---------------------- |
| `docs/ESTADO-REAL-PRODUCTO.md (alias de compatibilidad)` | Regenerado             |
| `docs/progreso.md (alias de compatibilidad histórica)`             | Reescrito completo     |
| `README-PROYECTO.md`           | Verificado/actualizado |
| `CLAUDE.md`                    | Verificado/actualizado |

---

## SESIÓN 44 — Alineación con decisiones estratégicas de FLUJOS-OPERATIVOS (25 Feb 2026)

> Aplicar las 12 decisiones estratégicas documentadas en `docs/tracciona-docs/FLUJOS-OPERATIVOS-TRACCIONA.md §30` al código, configuración y documentación del proyecto. Estas decisiones provienen de una auditoría externa del stack técnico y fueron validadas por el fundador.

**Leer ANTES de escribir código:**

1. `docs/tracciona-docs/FLUJOS-OPERATIVOS-TRACCIONA.md` — Secciones §1, §2, §7, §11, §13, §15, §18, §30 (buscar marcas ⚠️ DECISIÓN)
2. `docs/tracciona-docs/INSTRUCCIONES-MAESTRAS.md (alias de compatibilidad)` — Sesiones 3 (i18n), 16b (publicidad), 16d (scraping), 18 (emails), 31 (merchandising/herramientas), 32 (datos), 33 (infra)
3. `nuxt.config.ts` — Configuración actual de i18n (locales activos)
4. `server/api/cron/infra-metrics.post.ts` — Cron de monitorización actual

**Esta sesión aplica los cambios derivados de 12 decisiones estratégicas. Ejecutar en orden:**

---

### Parte A — i18n: Reducir a ES+EN al lanzamiento

**Decisión §7:** Lanzar con español + inglés únicamente. La arquitectura sigue preparada para N idiomas (JSONB, content_translations, fallback chain). Los demás idiomas se activan cuando haya demanda real.

**Cambios en código:**

1. **`nuxt.config.ts`** — Comentar (NO eliminar) los locales de fr, de, nl, pl, it. Dejar solo:

   ```typescript
   i18n: {
     strategy: 'prefix_except_default',
     locales: [
       { code: 'es', file: 'es.json', name: 'Español' },
       { code: 'en', file: 'en.json', name: 'English' },
       // POSPUESTOS — activar bajo demanda (ver FLUJOS-OPERATIVOS §7)
       // { code: 'fr', file: 'fr.json', name: 'Français' },
       // { code: 'de', file: 'de.json', name: 'Deutsch' },
       // { code: 'nl', file: 'nl.json', name: 'Nederlands' },
       // { code: 'pl', file: 'pl.json', name: 'Polski' },
       // { code: 'it', file: 'it.json', name: 'Italiano' },
     ],
     defaultLocale: 'es',
   }
   ```

2. **NO eliminar** los archivos `locales/fr.json`, `locales/de.json`, etc. Se quedan en el repo listos para reactivar.

3. **`server/api/cron/translate-pending.post.ts`** (o equivalente) — Si existe un job de traducción batch, verificar que solo traduzca a idiomas activos (leer de `nuxt.config.ts` o de `vertical_config.active_languages`). NO traducir a 7 idiomas si solo 2 están activos.

4. **Sitemap y hreflang** — Verificar que `@nuxtjs/sitemap` solo genera URLs para idiomas activos. Si genera `/fr/`, `/de/` etc., esas URLs 404 perjudican SEO.

5. **Workflow dominical de contenido** — Actualizar instrucciones: traducir artículos a EN únicamente al lanzamiento, no a 7 idiomas.

6. **`vertical_config`** — Si la tabla tiene campo `active_languages`, verificar que el seed de Tracciona tenga `['es', 'en']`, no `['es', 'en', 'fr', 'de', 'nl', 'pl', 'it']`.

**Tests:**

- [ ] `npm run build` compila sin errores
- [ ] Navegar a `/en/` funciona
- [ ] Navegar a `/fr/` devuelve 404 (no redirect roto)
- [ ] Sitemap no contiene URLs con `/fr/`, `/de/`, etc.

---

### Parte B — Pipeline de imágenes: cache immutable + Cloudinary no retiene

**Decisión §1:** Cloudinary transforma, CF Images almacena y sirve. Cloudinary NO retiene las imágenes. Cache agresivo de 30 días en imágenes.

**Cambios en código:**

1. **`server/middleware/security-headers.ts`** o **`nuxt.config.ts` routeRules** — Añadir header de cache para URLs de imagen:

   ```typescript
   // En routeRules o en middleware, para rutas de imagen:
   // Imágenes servidas desde CF Images (imagedelivery.net) o Cloudinary (res.cloudinary.com)
   // ya son servidas por sus CDNs con cache propio.
   // Pero para imágenes proxied o servidas desde nuestro dominio:
   routeRules: {
     // ... reglas existentes ...
     '/images/**': { headers: { 'Cache-Control': 'public, max-age=2592000, immutable' } },
   }
   ```

2. **`server/api/images/process.post.ts`** (pipeline híbrido, si existe) — Verificar que tras subir a CF Images, el endpoint **NO conserva** la imagen en Cloudinary. Añadir paso de cleanup:

   ```typescript
   // Después de confirmar upload a CF Images:
   // await cloudinary.uploader.destroy(publicId) // Eliminar de Cloudinary
   ```

   Si el endpoint no existe aún (fase 1), documentar este paso como TODO para cuando se active el pipeline híbrido.

3. **`app/composables/useImageUrl.ts`** — Verificar que el composable añade version query param o hash a las URLs para permitir invalidación de cache:
   ```typescript
   // Si la URL no tiene query params de versión, añadir ?v=timestamp_upload
   ```

**Tests:**

- [ ] Respuestas de imagen incluyen `Cache-Control: public, max-age=2592000, immutable`
- [ ] `npm run build` compila sin errores

---

### Parte C — Supabase: documentar dependencias reales

**Decisión §2:** Documentar que Supabase proporciona 4 servicios críticos (PostgreSQL, GoTrue/Auth, Realtime, Vault) y que migrar no es solo "mover la BD". Cuando llegue el 2º cluster, considerar Neon/Railway para diversificar.

**Cambios en documentación (NO en código):**

1. **`docs/tracciona-docs/referencia/ARQUITECTURA-ESCALABILIDAD.md`** — Añadir sección "Dependencias reales de Supabase":

   ```markdown
   ## Dependencias reales de Supabase

   Supabase proporciona 4 servicios críticos simultáneos:

   | Servicio      | Qué usamos                              | Alternativa si falla     | Tiempo migración real     |
   | ------------- | --------------------------------------- | ------------------------ | ------------------------- |
   | PostgreSQL    | BD completa, RLS, vistas materializadas | Neon, Railway, VPS       | 4-8h                      |
   | GoTrue (Auth) | Login, tokens, sesiones, PKCE           | Auth.js, Clerk           | 24-48h (sesiones activas) |
   | Realtime      | Subastas en vivo (websockets)           | CF Durable Objects, Ably | 8-16h                     |
   | Vault         | Secretos (si se usa)                    | Variables de entorno CF  | 1h                        |

   **Riesgo:** Si Supabase cae o cambia precios, las 4 capas se afectan.
   **Mitigación:** Cuando se cree un 2º cluster, considerar Neon o Railway
   (solo PostgreSQL) para empezar a diversificar vendor lock-in.
   Auth y Realtime seguirían en cluster principal Supabase.
   ```

2. **`CLAUDE.md`** — Añadir en sección de decisiones/notas:
   ```
   NOTA: El segundo cluster de BD (cuando se necesite) debe considerar
   Neon o Railway como alternativa a Supabase para diversificar dependencias.
   Ver ARQUITECTURA-ESCALABILIDAD.md §Dependencias reales de Supabase.
   ```

---

### Parte D — Monitorización: ampliar recomendaciones + vista estado del stack + métricas por vertical

**Decisión §13:** Ampliar tabla de recomendaciones automáticas, crear vista "Estado del stack" en admin, y añadir tag `vertical` a `infra_metrics`.

**Cambios en código:**

1. **`server/api/cron/infra-metrics.post.ts`** — Ampliar las recomendaciones automáticas. La tabla actual tiene recomendaciones básicas. Añadir las siguientes (si no existen):

   ```typescript
   const RECOMMENDATIONS = [
     // ... existentes ...
     {
       condition: 'supabase_connections_pct > 70',
       message: 'Revisar connection pooling o considerar upgrade',
     },
     {
       condition: 'cf_images_storage_pct > 80',
       message: 'Verificar que no se están duplicando imágenes',
     },
     {
       condition: 'resend_emails_pct > 80 && plan === "free"',
       message: 'Upgrade a Resend Pro ($20/mes, 50K/mes)',
     },
     { condition: 'stripe_volume > 100000', message: 'Negociar tarifa personalizada con Stripe' },
     {
       condition: 'supabase_realtime_connections > 150',
       message: 'Optimizar subastas o considerar Durable Objects para Realtime',
     },
   ]
   ```

2. **Tabla `infra_metrics`** — Añadir columna `vertical VARCHAR DEFAULT NULL` si no existe:

   ```sql
   -- Migración 000XX_infra_metrics_vertical.sql
   ALTER TABLE infra_metrics ADD COLUMN IF NOT EXISTS vertical VARCHAR DEFAULT NULL;
   COMMENT ON COLUMN infra_metrics.vertical IS 'NULL = global metric, otherwise per-vertical metric for cost allocation';
   ```

3. **`server/api/cron/infra-metrics.post.ts`** — Al insertar métricas, añadir desglose por vertical cuando sea posible:

   ```typescript
   // Tras insertar métrica global (vertical = null):
   // Si la métrica es desglosable (ej: storage por vertical), insertar también por vertical:
   // INSERT INTO infra_metrics (metric, value, vertical) VALUES ('db_size_bytes', X, 'tracciona')
   ```

4. **`app/pages/admin/infraestructura.vue`** — Añadir pestaña/sección "Estado del stack" con tabla resumen de todos los servicios:
   - Columnas: Servicio, Plan actual, Uso %, Próximo paso
   - Cada fila con botón "Ver detalle" que muestra historial y proyección
   - Los datos vienen de `infra_metrics` (último registro por servicio)
   - Si la pestaña ya existe, verificar que incluye TODOS los servicios (Supabase, Cloudinary, CF Images, Resend, Sentry, CF Workers, Stripe, GitHub Actions)

**Tests:**

- [ ] Migración aplica sin errores
- [ ] Cron infra-metrics inserta métricas con vertical = NULL (global) y con vertical específica
- [ ] Admin infraestructura muestra tabla de estado del stack
- [ ] `npm run build` compila sin errores

---

### Parte E — Merchandising: convertir a formulario de interés

**Decisión §11:** No implementar flujo completo de merchandising (imprenta, PDF, Stripe). En su lugar, mostrar opción visual atractiva con formulario que mide demanda real.

**Cambios en código:**

1. **`app/pages/dashboard/herramientas/merchandising.vue`** — Si existe el flujo completo con catálogo de productos, pago Stripe y generación de PDF, **reemplazar** por versión simplificada:

   ```vue
   <!-- Versión simplificada: banner + catálogo visual + formulario de interés -->
   <!-- NO: integración con imprenta, NO: pago Stripe, NO: generación PDF diseño -->
   <!-- SÍ: preview de productos con logo del dealer (mockup estático) -->
   <!-- SÍ: formulario con campos: producto_interesado, cantidad_estimada, email -->
   <!-- SÍ: INSERT en service_requests (type='merchandising', metadata JSONB) -->
   ```

   Si NO existe aún (solo placeholder), crear la versión simplificada directamente.

2. **`server/api/service-requests.post.ts`** (o equivalente) — Verificar que acepta `type='merchandising'` y guarda `metadata` con producto y cantidad.

3. **Eliminar** (si existen) dependencias o código relacionado con:
   - Generación de PDF de diseño para imprenta
   - Integración con servicio de imprenta
   - Stripe checkout para pedidos de merchandising
   - Tabla `merch_orders` — **NO eliminar la tabla**, pero marcar como no utilizada por ahora con comentario en migración o en ESTADO-REAL-PRODUCTO.md

**Tests:**

- [ ] La página de merchandising muestra banner atractivo + formulario
- [ ] El formulario envía correctamente a service_requests
- [ ] No hay código de pago Stripe asociado a merchandising
- [ ] `npm run build` compila sin errores

---

### Parte F — Datos de pago: posponer API de valoración y productos de pago

**Decisión §15:** El índice de precios público gratuito (`/precios`) se mantiene (SEO). Pero la API de valoración de pago, suscripciones de datos sectoriales, y datasets anualizados se posponen hasta tener volumen estadístico.

**Cambios en código:**

1. **`server/api/v1/valuation.get.ts`** (si existe) — Añadir early return con mensaje:

   ```typescript
   // POSPUESTO — Activar cuando haya ≥500 transacciones históricas
   // Ver FLUJOS-OPERATIVOS §15 para criterios de activación
   throw createError({
     statusCode: 503,
     message: 'Valuation API coming soon. Insufficient market data.',
   })
   ```

   Si NO existe, no crearlo.

2. **`app/pages/datos.vue`** (índice de precios público) — Se mantiene tal cual. Es gratuito y genera autoridad SEO.

3. **`app/pages/admin/config/pricing.vue`** o equivalente — Si hay opciones de pricing para "API valoración" o "dataset anualizado", marcarlas como deshabilitadas o eliminarlas de la UI.

4. **Documentar** en `docs/ESTADO-REAL-PRODUCTO.md (alias de compatibilidad)`:

   ```markdown
   ## Módulos pospuestos

   - **API valoración de pago**: Pospuesto hasta ≥500 transacciones históricas (FLUJOS-OPERATIVOS §15)
   - **Suscripción datos sectoriales**: Pospuesto hasta ≥1.000 vehículos en catálogo
   - **Dataset anualizado**: Pospuesto hasta ≥12 meses de datos acumulados
   ```

**Tests:**

- [ ] `/precios` (índice público) sigue funcionando
- [ ] Si `/api/v1/valuation` existe, devuelve 503
- [ ] `npm run build` compila sin errores

---

### Parte G — Scraping: convertir cron a script manual

**Decisión §18:** El script de scraping de competidores NO debe ejecutarse como cron automatizado en producción. Debe ser un script CLI ejecutable manualmente.

**Cambios en código:**

1. **Si existe `server/api/cron/scrape-competitors.post.ts`** — Eliminar el archivo. El scraping NO es un endpoint de servidor.

2. **Crear o verificar `scripts/scrape-competitors.ts`** — Script CLI ejecutable con Node:

   ```typescript
   #!/usr/bin/env npx tsx
   // USO: npx tsx scripts/scrape-competitors.ts --source=mascus --min-ads=5
   // IMPORTANTE: Ejecutar MANUALMENTE desde terminal local.
   // NUNCA como cron en servidor de producción.
   // El contacto con dealers es SIEMPRE manual y humano.
   ```

3. **Si hay referencia en `.github/workflows/`** o en cualquier cron schedule a scraping — Eliminarla.

4. **Si hay referencia en `admin/captacion.vue`** a un botón "Ejecutar scraping" que llama a un endpoint del servidor — Eliminarlo. El admin solo ve el pipeline de leads (new → contacted → interested → onboarding → active → rejected), NO dispara scraping.

**Tests:**

- [ ] No existe endpoint `/api/cron/scrape*` ni `/api/scrape*`
- [ ] El script `scripts/scrape-competitors.ts` existe y se ejecuta con `npx tsx`
- [ ] No hay referencia a scraping en cron schedules ni en CI
- [ ] `npm run build` compila sin errores

---

### Parte H — Actualizar documentación de referencia

**Aplicar cambios de las decisiones §30 a documentos de referencia:**

1. **`CLAUDE.md`** — Añadir sección al final:

   ```markdown
   ## Decisiones estratégicas (25 Feb 2026)

   - Idiomas activos: ES + EN. Resto pospuesto (ver FLUJOS-OPERATIVOS §7)
   - Pipeline imágenes: Cloudinary transforma, CF Images almacena. Cache immutable 30d
   - Merchandising: solo formulario de interés, no flujo completo
   - API valoración de pago: pospuesta hasta volumen suficiente
   - Scraping: solo script manual, NUNCA cron en producción
   - 2º cluster BD: considerar Neon/Railway para diversificar
   - Métricas infra: tag vertical en infra_metrics desde día 1
   ```

2. **`docs/tracciona-docs/contexto-global.md (alias de compatibilidad)`** — Añadir sección "Decisiones estratégicas activas" con tabla de las 12 decisiones de §30.

3. **`docs/progreso.md (alias de compatibilidad histórica)`** — Añadir sesión 44 como pendiente/completada según corresponda.

4. **`docs/ESTADO-REAL-PRODUCTO.md (alias de compatibilidad)`** — Si existe, añadir módulos pospuestos (merchandising completo, API valoración, idiomas 3-7).

---

### Resumen archivos sesión 44

| Archivo                                                        | Acción                                          |
| -------------------------------------------------------------- | ----------------------------------------------- |
| `nuxt.config.ts`                                               | Comentar locales fr/de/nl/pl/it                 |
| `nuxt.config.ts` routeRules                                    | Añadir cache immutable para imágenes            |
| `vertical_config` seed                                         | Verificar active_languages = ['es', 'en']       |
| `server/api/cron/infra-metrics.post.ts`                        | Ampliar recomendaciones + desglose por vertical |
| `supabase/migrations/000XX_infra_metrics_vertical.sql`         | ALTER TABLE infra_metrics ADD vertical          |
| `app/pages/admin/infraestructura.vue`                          | Añadir/ampliar vista "Estado del stack"         |
| `app/pages/dashboard/herramientas/merchandising.vue`           | Simplificar a formulario de interés             |
| `server/api/v1/valuation.get.ts`                               | Posponer con 503 (si existe)                    |
| `server/api/cron/scrape-competitors.post.ts`                   | ELIMINAR (si existe)                            |
| `scripts/scrape-competitors.ts`                                | Verificar que es script CLI manual              |
| `CLAUDE.md`                                                    | Añadir decisiones estratégicas                  |
| `docs/tracciona-docs/contexto-global.md (alias de compatibilidad)`                       | Añadir sección decisiones                       |
| `docs/tracciona-docs/referencia/ARQUITECTURA-ESCALABILIDAD.md` | Añadir dependencias Supabase                    |
| `docs/ESTADO-REAL-PRODUCTO.md (alias de compatibilidad)`                                 | Añadir módulos pospuestos                       |
| `docs/progreso.md (alias de compatibilidad histórica)`                                             | Añadir sesión 44                                |

### Orden de ejecución

1. Parte A — i18n (cambio más impactante, afecta build y sitemap)
2. Parte B — Cache imágenes (cambio simple en config)
3. Parte D — Monitorización (migración SQL + código + UI)
4. Parte E — Merchandising (simplificación de página)
5. Parte F — API valoración (posponer)
6. Parte G — Scraping (eliminar cron)
7. Parte C — Documentación Supabase (solo docs)
8. Parte H — Documentación general (solo docs)
9. Verificar: `npm run build` + `npm run typecheck` + `npm run lint`

### Tests mínimos de la sesión

- [ ] Build compila sin errores con solo 2 idiomas activos
- [ ] Sitemap solo contiene URLs en `/` (español) y `/en/` (inglés)
- [ ] Admin infraestructura muestra tabla de estado del stack con todos los servicios
- [ ] Página merchandising muestra formulario de interés, no flujo de pago
- [ ] No existe endpoint de scraping en servidor
- [ ] Script de scraping existe en `scripts/` y se ejecuta manualmente
- [ ] Documentación actualizada refleja las 12 decisiones

---

## SESIÓN 45 — Auditoría continua, backups multi-capa, aislamiento vertical, desacoplamiento, modularización y failover de IA

> 6 mejoras transversales de resiliencia, calidad y preparación multi-vertical.
> Origen: requisitos del fundador (25 Feb 2026).
> Prioridad: ALTA — afectan a la supervivencia del negocio si algo falla.

**Leer ANTES de escribir código:**

1. `.github/workflows/ci.yml` — CI actual
2. `.github/workflows/security.yml` — Escaneo de seguridad actual
3. `.github/workflows/backup.yml` — Backup semanal actual
4. `scripts/backup-weekly.sh` — Script de backup actual
5. `scripts/verify-extensibility.sh` — Script de extensibilidad actual
6. `server/utils/fetchWithRetry.ts` — Retry actual
7. `server/api/generate-description.post.ts` — Patrón actual de llamada a IA
8. `server/api/whatsapp/process.post.ts` — Patrón actual de llamada a IA (Vision)
9. `server/api/verify-document.post.ts` — Patrón actual (placeholder Vision)
10. `app/composables/useVerticalConfig.ts` — Config de vertical actual

---

### Parte A — Auditoría continua automatizada

**Problema:** Hoy la auditoría de código, seguridad y calidad es manual o reactiva (solo en PRs). No hay forma de detectar regresiones de seguridad, acoplamientos nuevos, o degradación de performance entre PRs.

**Solución: GitHub Actions scheduled + informe consolidado con alerta por email**

#### A1. Crear `.github/workflows/daily-audit.yml` — auditoría diaria

```yaml
name: Daily Audit
on:
  schedule:
    - cron: '0 5 * * *' # Todos los días a las 05:00 UTC
  workflow_dispatch: {}

jobs:
  # ── Seguridad ──
  semgrep:
    runs-on: ubuntu-latest
    container:
      image: semgrep/semgrep
    steps:
      - uses: actions/checkout@v4
      - run: semgrep scan --config auto --config p/typescript --config p/nodejs --config p/owasp-top-ten --json --output semgrep-results.json . || true
      - uses: actions/upload-artifact@v4
        with:
          name: semgrep-results
          path: semgrep-results.json

  npm-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm audit --audit-level=moderate --json > npm-audit.json 2>&1 || true
      - uses: actions/upload-artifact@v4
        with:
          name: npm-audit-results
          path: npm-audit.json

  # ── Calidad de código ──
  lint-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: npm }
      - run: npm ci
      - run: npm run lint -- --format json --output-file eslint-report.json 2>&1 || true
      - run: npm run typecheck 2>&1 | tee typecheck.log || true
      - uses: actions/upload-artifact@v4
        with:
          name: lint-typecheck
          path: |
            eslint-report.json
            typecheck.log

  # ── Extensibilidad (hardcoded values) ──
  extensibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check hardcoded values
        run: |
          echo "=== Extensibility Audit ===" > extensibility-report.txt

          echo "## Hardcoded categories in code:" >> extensibility-report.txt
          grep -rn "cisternas\|cabezas.tractoras\|semirremolques\|camiones\|furgonetas" app/ server/ --include='*.ts' --include='*.vue' \
            | grep -v node_modules | grep -v '.nuxt' | grep -v 'i18n' | grep -v 'locales/' | grep -v 'migrations' \
            | grep -v '\.spec\.' | grep -v 'test' >> extensibility-report.txt 2>&1 || echo "  None found ✓" >> extensibility-report.txt

          echo "" >> extensibility-report.txt
          echo "## Hardcoded domain 'tracciona' in code (outside config):" >> extensibility-report.txt
          grep -rn "tracciona\.com\|tracciona\.es" app/ server/ --include='*.ts' --include='*.vue' \
            | grep -v node_modules | grep -v '.nuxt' | grep -v nuxt.config | grep -v CLAUDE.md | grep -v README \
            | grep -v '\.spec\.' >> extensibility-report.txt 2>&1 || echo "  None found ✓" >> extensibility-report.txt

          echo "" >> extensibility-report.txt
          echo "## Hardcoded vertical slug 'tracciona' outside getVerticalSlug():" >> extensibility-report.txt
          grep -rn "'tracciona'" app/ server/ --include='*.ts' --include='*.vue' \
            | grep -v node_modules | grep -v '.nuxt' | grep -v useVerticalConfig | grep -v nuxt.config \
            | grep -v getVerticalSlug >> extensibility-report.txt 2>&1 || echo "  None found ✓" >> extensibility-report.txt

          echo "" >> extensibility-report.txt
          echo "## Hardcoded AI model strings:" >> extensibility-report.txt
          grep -rn "claude-3\|claude-sonnet\|claude-haiku\|gpt-4o" server/ --include='*.ts' \
            | grep -v node_modules | grep -v aiConfig.ts >> extensibility-report.txt 2>&1 || echo "  None found ✓" >> extensibility-report.txt

          cat extensibility-report.txt

      - uses: actions/upload-artifact@v4
        with:
          name: extensibility-report
          path: extensibility-report.txt

  # ── Build sanity ──
  build-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: npm }
      - run: npm ci
      - run: npm run build 2>&1 | tee build.log
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: build-failure-log
          path: build.log

  # ── Consolidar y notificar ──
  report:
    runs-on: ubuntu-latest
    needs: [semgrep, npm-audit, lint-typecheck, extensibility, build-check]
    if: always()
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          path: audit-artifacts/
      - name: Generate consolidated report
        run: node scripts/audit-report.mjs
      - name: Notify if issues found
        if: env.AUDIT_HAS_ISSUES == 'true'
        env:
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          ALERT_EMAIL: ${{ secrets.INFRA_ALERT_EMAIL }}
        run: node scripts/send-audit-alert.mjs
```

#### A2. Crear `scripts/audit-report.mjs`

Script que lee los artefactos descargados y genera un resumen consolidado:

```javascript
// scripts/audit-report.mjs
// Lee semgrep-results.json, npm-audit.json, eslint-report.json, extensibility-report.txt
// Genera audit-summary.json con:
//   { date, semgrep: { errors, warnings }, npm: { critical, high, moderate },
//     eslint: { errors, warnings }, extensibility: { hardcoded_count },
//     build: 'pass' | 'fail', overall: 'green' | 'yellow' | 'red' }
// Escribe AUDIT_HAS_ISSUES=true en $GITHUB_ENV si overall != 'green'
```

Implementar la lectura de cada JSON, contar issues por severidad, y escribir el resumen.

#### A3. Crear `scripts/send-audit-alert.mjs`

Envía email via Resend con el resumen de la auditoría cuando hay issues críticos:

```javascript
// scripts/send-audit-alert.mjs
// Lee audit-summary.json
// Envía email con Resend API con el resumen
// Solo si overall == 'red' (critical issues) o si hay semgrep errors
```

#### A4. Lighthouse scheduled (performance)

Añadir al daily audit o como job semanal separado:

```yaml
lighthouse:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version: '20', cache: npm }
    - run: npm ci && npm run build
    - run: npx lhci autorun --collect.url=https://tracciona.com --collect.url=https://tracciona.com/en/
```

**Resultado:** Cada mañana a las 05:00 UTC tienes un informe de seguridad, calidad, extensibilidad y build. Si hay algo crítico, recibes email. Los artefactos quedan en GitHub Actions 90 días para auditoría.

**Coste:** 0€. GitHub Actions free tier da 2.000 minutos/mes. Esta auditoría usa ~15 min/día = ~450 min/mes. Sobra.

---

### Parte B — Backups multi-capa (24h + 72h + semanal)

**Problema:** Hoy solo hay backup semanal (domingos 03:00). Si la BD se corrompe un viernes, pierdes hasta 6 días de datos de dealers, compradores y transacciones.

**Solución: 3 capas de backup complementarias**

#### B1. Capa 1 — Supabase PITR (Point-in-Time Recovery) — RPO 0 minutos

Supabase Pro incluye PITR. Esto ya está activo si estás en Pro ($25/mes). Permite restaurar a CUALQUIER segundo de las últimas 24-72 horas (dependiendo del plan).

**Verificar:** Entrar en dashboard.supabase.com → Settings → Database → Backups → confirmar que PITR está habilitado. Si no lo está, activarlo. Es la protección más valiosa y ya la estás pagando.

**Documentar en `docs/tracciona-docs/referencia/DISASTER-RECOVERY.md`:**

```markdown
## Capa 1: Supabase PITR (incluido en Pro)

- RPO: 0 minutos (restaura a cualquier segundo)
- Retención: 7 días (Pro) / 28 días (Team)
- Cómo restaurar: Dashboard → Database → Backups → Point in Time Recovery
- Tiempo de restauración: 5-30 minutos según tamaño de BD
- LIMITACIÓN: Solo restaura la BD de Supabase, NO archivos en Cloudflare/Cloudinary
```

#### B2. Capa 2 — Backup diario automatizado a B2 — RPO 24 horas

Reemplazar el workflow de backup actual para ejecutar diariamente:

```yaml
# .github/workflows/backup.yml — REEMPLAZAR el actual
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * *' # Diario a las 02:00 UTC
  workflow_dispatch:
    inputs:
      backup_type:
        description: 'Backup type'
        required: false
        default: 'daily'
        type: choice
        options: [daily, manual]

jobs:
  backup:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - name: Install tools
        run: |
          npm i -g supabase
          pip install b2
      - name: Run backup
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}
          BACKUP_ENCRYPTION_KEY: ${{ secrets.BACKUP_ENCRYPTION_KEY }}
          B2_APPLICATION_KEY_ID: ${{ secrets.B2_APPLICATION_KEY_ID }}
          B2_APPLICATION_KEY: ${{ secrets.B2_APPLICATION_KEY }}
          B2_BUCKET_NAME: ${{ secrets.B2_BUCKET_NAME }}
        run: bash scripts/backup-multi-tier.sh
      - name: Alert on failure
        if: failure()
        env:
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          ALERT_EMAIL: ${{ secrets.INFRA_ALERT_EMAIL }}
        run: |
          curl -X POST https://api.resend.com/emails \
            -H "Authorization: Bearer $RESEND_API_KEY" \
            -H "Content-Type: application/json" \
            -d "{\"from\":\"backups@tracciona.com\",\"to\":\"$ALERT_EMAIL\",\"subject\":\"⚠️ Backup FAILED $(date +%Y-%m-%d)\",\"text\":\"Daily backup failed. Check GitHub Actions.\"}"
```

#### B3. Crear `scripts/backup-multi-tier.sh`

Evolución de `backup-weekly.sh` con retención multi-capa:

```bash
#!/usr/bin/env bash
# Retención:
#   daily/   → últimos 7 backups (1 semana)
#   weekly/  → últimos 4 backups (1 mes) — se guarda si es domingo
#   monthly/ → últimos 6 backups (6 meses) — se guarda si es día 1-7 del mes
#
# Estructura en B2:
#   tracciona-backups/
#     daily/tracciona_20260225_020000.sql.enc
#     weekly/tracciona_20260223_020000.sql.enc
#     monthly/tracciona_202602.sql.enc
```

Modificaciones respecto al script actual:

1. Cambiar `WEEKLY_RETENTION=4` a `DAILY_RETENTION=7`
2. Subir SIEMPRE a `daily/`
3. Si es domingo (`DAY_OF_WEEK == 7`), copiar también a `weekly/` (retención 4)
4. Si es primer domingo del mes (`DAY_OF_MONTH <= 7`), copiar también a `monthly/` (retención 6)
5. Cleanup por cada tier independiente

**RPO resultante:**

| Escenario                              | Capa que te salva      | Datos perdidos (máximo) |
| -------------------------------------- | ---------------------- | ----------------------- |
| Error hace 2 horas                     | PITR de Supabase       | 0 minutos               |
| Error hace 12 horas                    | PITR de Supabase       | 0 minutos               |
| Supabase borra tu proyecto             | Backup diario en B2    | 24 horas                |
| Corrupción detectada 3 días después    | Backup diario (hay 7)  | 0-24 horas              |
| Corrupción detectada 2 semanas después | Backup semanal (hay 4) | 0-7 días                |
| Desastre mayor hace 3 meses            | Backup mensual (hay 6) | 0-30 días               |

#### B4. Script de restauración mejorado — `scripts/backup-restore.sh`

El script actual existe pero verificar que incluye:

1. Descargar de B2 (elegir tier: daily/weekly/monthly, elegir fecha)
2. Descifrar con la key
3. Restaurar en nueva instancia PostgreSQL (Railway/Neon como destino temporal)
4. Verificar conteos de tablas clave (vehicles, dealers, users, subscriptions)
5. Imprimir resumen de verificación

**Test:** Ejecutar restauración de prueba 1x/trimestre (añadir recordatorio en PLAN-AUDITORIA).

**Coste adicional:** 0€. B2 cobra $0.005/GB/mes. Con una BD de 500MB, 7 dailies + 4 weeklies + 6 monthlies ≈ 8.5GB = $0.04/mes.

---

### Parte C — Aislamiento entre verticales

**Problema:** Hoy todas las verticales comparten el mismo cluster Supabase. Si un bug en Horecaria corrompe datos, podría afectar a Tracciona.

**Solución: Aislamiento por capas (datos, config, deploy)**

#### C1. RLS por vertical — ya parcialmente implementado

Verificar que TODAS las tablas con datos de vertical tienen RLS policy que incluye filtro por vertical:

```sql
-- Verificar en cada tabla que tiene columna vertical o dealer.vertical:
-- vehicles, dealers, categories, subcategories, articles, advertisements,
-- active_landings, transport_zones, auction_events, etc.

-- Ejemplo de policy correcta:
CREATE POLICY "vehicles_by_vertical" ON vehicles
  FOR ALL USING (
    vertical = current_setting('app.current_vertical', true)
    OR current_setting('app.current_vertical', true) IS NULL  -- admin sin filtro
  );
```

Si las policies actuales no filtran por vertical, AÑADIRLAS. Esto es la primera línea de defensa.

#### C2. Middleware de vertical — aislar contexto en cada request

Crear `server/middleware/vertical-context.ts`:

```typescript
// En cada request, setear el contexto de vertical para que RLS y queries lo usen
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const vertical = config.public.vertical || 'tracciona'

  // Setear en el contexto del evento para que los endpoints lo lean
  event.context.vertical = vertical

  // Si usamos Supabase con session variables para RLS:
  // SET LOCAL app.current_vertical = 'tracciona'
  // Esto se haría en cada query con el service role client
})
```

#### C3. Variables de entorno por deploy — ya implementado

Cada deploy de Cloudflare Pages ya tiene `NUXT_PUBLIC_VERTICAL`. Verificar que NO hay cross-contamination: un deploy de Horecaria NUNCA debe poder leer datos de Tracciona.

#### C4. Migración 000XX — índice compuesto para aislamiento

```sql
-- Si no existe ya, crear índice compuesto en tablas principales:
CREATE INDEX IF NOT EXISTS idx_vehicles_vertical_status ON vehicles(vertical, status);
CREATE INDEX IF NOT EXISTS idx_dealers_vertical ON dealers(vertical);
CREATE INDEX IF NOT EXISTS idx_articles_vertical ON articles(vertical);
-- Esto acelera las queries filtradas por vertical Y previene scans completos
```

#### C5. Test de aislamiento

Crear `tests/security/vertical-isolation.test.ts`:

```typescript
// Test que verifica que con NUXT_PUBLIC_VERTICAL=tracciona
// las queries NO devuelven datos de vertical='horecaria'
// Requiere datos de test en ambas verticales
```

---

### Parte D — Deshardcodear todo lo posible

**Problema detectado en el código actual:**

1. `generate-description.post.ts` tiene hardcoded `claude-3-5-haiku-20241022`
2. `whatsapp/process.post.ts` tiene hardcoded `claude-sonnet-4-5-20250929`
3. `verify-document.post.ts` tiene hardcoded `claude-sonnet-4-20250514` (en comentario)
4. `nuxt.config.ts` tiene hardcoded `tracciona.com` en site.url, meta, dns-prefetch
5. `nuxt.config.ts` tiene hardcoded `gmnrfuzekbwyzkgsaftv` como project ref
6. `whatsapp/process.post.ts` tiene hardcoded `tracciona.com` en el mensaje al dealer
7. `whatsapp/process.post.ts` tiene hardcoded categorías en español en el prompt de Claude
8. `backup.yml` tiene hardcoded `gmnrfuzekbwyzkgsaftv`

#### D1. Crear `server/utils/aiConfig.ts` — Centralizar modelos de IA

```typescript
// server/utils/aiConfig.ts
export const AI_MODELS = {
  // Modelo para tareas rápidas y baratas (descripciones, traducciones)
  fast: process.env.AI_MODEL_FAST || 'claude-3-5-haiku-20241022',
  // Modelo para tareas complejas (visión, análisis de documentos)
  vision: process.env.AI_MODEL_VISION || 'claude-sonnet-4-5-20250929',
  // Modelo para generación de contenido largo (artículos, informes)
  content: process.env.AI_MODEL_CONTENT || 'claude-sonnet-4-5-20250929',
} as const

export type AIModelRole = keyof typeof AI_MODELS
```

Actualizar `generate-description.post.ts`, `whatsapp/process.post.ts`, `verify-document.post.ts` y `social/generate-posts.post.ts` para usar `AI_MODELS.fast`, `AI_MODELS.vision`, etc. en vez de strings hardcodeados.

#### D2. Centralizar URLs de dominio

```typescript
// server/utils/siteConfig.ts
export function getSiteUrl(): string {
  return process.env.SITE_URL || process.env.NUXT_PUBLIC_SITE_URL || 'https://tracciona.com'
}

export function getSiteName(): string {
  return process.env.SITE_NAME || 'Tracciona'
}
```

Actualizar `whatsapp/process.post.ts` línea del mensaje:

```typescript
// ANTES:
;`Enlace: https://tracciona.com/vehiculo/${vehicleResult.slug}`
// DESPUÉS:
`Enlace: ${getSiteUrl()}/vehiculo/${vehicleResult.slug}`
```

Actualizar `nuxt.config.ts`:

```typescript
site: {
  url: process.env.SITE_URL || 'https://tracciona.com',
},
```

#### D3. Mover Supabase project ref a secret

En `backup.yml`, cambiar:

```yaml
# ANTES:
SUPABASE_PROJECT_REF: gmnrfuzekbwyzkgsaftv
# DESPUÉS:
SUPABASE_PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}
```

En `nuxt.config.ts`, ya usa `process.env.SUPABASE_PROJECT_REF` con fallback. Eliminar el fallback hardcodeado:

```typescript
// ANTES:
supabaseProjectRef: process.env.SUPABASE_PROJECT_REF || 'gmnrfuzekbwyzkgsaftv',
// DESPUÉS:
supabaseProjectRef: process.env.SUPABASE_PROJECT_REF || '',
```

#### D4. Externalizar categorías del prompt de Claude

En `whatsapp/process.post.ts`, el prompt de Claude tiene hardcodeado:

```
"category_name_es": "one of 'Cabezas tractoras', 'Camiones', 'Semirremolques', ..."
```

Cambiar para que las categorías se lean de la BD:

```typescript
// En whatsapp/process.post.ts, antes de llamar a Claude:
const { data: categories } = await supabase
  .from('categories')
  .select('name_es, slug')
  .eq('vertical', event.context.vertical || 'tracciona')

const categoryList =
  categories?.map((c) => c.name_es).join("', '") ||
  'Sin categorías'
  // Usar categoryList en el prompt:
  `"category_name_es": "string -- one of '${categoryList}'"`
```

Esto hace que cuando se clone a otra vertical, el prompt se adapte automáticamente a las categorías de esa vertical.

#### D5. Actualizar `scripts/verify-extensibility.sh`

Añadir verificaciones para los nuevos patrones:

```bash
echo "## Hardcoded AI model strings:"
grep -rn "claude-3\|claude-sonnet\|claude-haiku\|gpt-4o" server/ --include='*.ts' \
  | grep -v node_modules | grep -v aiConfig.ts | head -10

echo "## Hardcoded Supabase project ref:"
grep -rn "gmnrfuzekbwyzkgsaftv" . --include='*.ts' --include='*.yml' --include='*.yaml' \
  | grep -v node_modules | head -10
```

---

### Parte E — Modularización

**Problema:** Algunos endpoints son demasiado largos y mezclan responsabilidades. `whatsapp/process.post.ts` tiene 350+ líneas con lógica de descarga, IA, upload, BD y notificación todo junto.

#### E1. Extraer servicios de los endpoints largos

**Regla existente (sesión 28):** endpoint >200 líneas → extraer a `server/services/`.

Crear estos servicios:

```
server/services/
  aiProvider.ts        ← NUEVO: wrapper de llamadas a IA con failover (ver Parte F)
  vehicleCreator.ts    ← NUEVO: lógica de crear vehículo desde datos extraídos
  imageUploader.ts     ← NUEVO: upload a Cloudinary/CF Images
  whatsappProcessor.ts ← NUEVO: orquestación del flujo WhatsApp
  billing.ts           ← EXISTE
  marketReport.ts      ← EXISTE
  vehicles.ts          ← CREAR: queries comunes de vehículos
  notifications.ts     ← NUEVO: envío de WhatsApp + email + push unificado
```

**Ejemplo: refactor de `whatsapp/process.post.ts`**

El endpoint actual de 350+ líneas se convierte en:

```typescript
// server/api/whatsapp/process.post.ts — DESPUÉS del refactor
export default defineEventHandler(async (event) => {
  // 1. Auth (10 líneas)
  // 2. Validar input (5 líneas)
  // 3. Orquestar
  const result = await processWhatsAppSubmission(event, body.submissionId)
  return result
})
```

Y `server/services/whatsappProcessor.ts` contiene la lógica real, que a su vez llama a `aiProvider`, `imageUploader`, `vehicleCreator` y `notifications`.

#### E2. Unificar patrón de notificaciones

Hoy hay 3 formas distintas de enviar notificaciones en el código:

- WhatsApp: `sendWhatsAppMessage()` directo
- Email: `$fetch('/api/email/send')` o Resend directo
- Push: `$fetch('/api/push/send')`

Crear `server/services/notifications.ts`:

```typescript
// server/services/notifications.ts
export async function notify(
  userId: string,
  opts: {
    type: 'lead' | 'vehicle_sold' | 'payment_failed' | 'verification' | string
    channels?: ('email' | 'whatsapp' | 'push')[] // default: según preferencias del usuario
    data: Record<string, unknown>
  },
) {
  // 1. Leer preferencias del usuario (email_preferences)
  // 2. Para cada canal habilitado, enviar
  // 3. Log en tabla notification_log
}
```

#### E3. Crear `server/utils/supabaseQuery.ts` — helpers tipados

```typescript
// Helpers que inyectan automáticamente el filtro de vertical
export function vehiclesQuery(supabase: SupabaseClient, vertical?: string) {
  const v = vertical || getVerticalSlug()
  return supabase.from('vehicles').select('*').eq('vertical', v)
}
```

Esto evita olvidar el `WHERE vertical = X` en queries manuales.

---

### Parte F — Failover de proveedores de IA

**Problema:** Si la API de Anthropic cae, las funciones que usan IA fallan sin plan B:

- `generate-description.post.ts` → dealer no puede generar descripción
- `whatsapp/process.post.ts` → vehículos WhatsApp no se procesan
- `verify-document.post.ts` → verificaciones se paran
- `social/generate-posts.post.ts` → posts no se generan

Cada función tiene criticidad diferente:

- **Experiencia en vivo** (descripción mientras el dealer espera): timeout corto, failover rápido
- **Background** (WhatsApp, social): puede reintentar, timeout más largo
- **No crítico** (verificación): puede esperar horas

#### F1. Crear `server/services/aiProvider.ts`

```typescript
// server/services/aiProvider.ts
import { fetchWithRetry } from '~/server/utils/fetchWithRetry'

interface AIProviderConfig {
  /** Tiempo máximo de espera antes de intentar fallback */
  timeoutMs: number
  /** Prioridad de proveedores a intentar */
  providers: AIProvider[]
  /** Número máximo de reintentos por proveedor */
  maxRetries: number
}

interface AIProvider {
  name: 'anthropic' | 'openai'
  model: string
  apiKey: string
  endpoint: string
}

interface AIRequest {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: unknown }>
  maxTokens: number
  system?: string
}

interface AIResponse {
  text: string
  provider: string
  model: string
  latencyMs: number
}

// Presets por criticidad
export const AI_PRESETS = {
  /** Dealer esperando en UI — timeout corto, failover inmediato */
  realtime: {
    timeoutMs: 8_000,
    maxRetries: 1,
  },
  /** Procesamiento en background — puede esperar más */
  background: {
    timeoutMs: 30_000,
    maxRetries: 2,
  },
  /** No crítico — puede fallar y reintentar en el próximo cron */
  deferred: {
    timeoutMs: 60_000,
    maxRetries: 3,
  },
} as const

export async function callAI(
  request: AIRequest,
  preset: keyof typeof AI_PRESETS = 'background',
  modelRole: 'fast' | 'vision' | 'content' = 'fast',
): Promise<AIResponse> {
  const config = useRuntimeConfig()
  const presetConfig = AI_PRESETS[preset]

  // Construir lista de proveedores por orden de preferencia
  const providers: AIProvider[] = []

  // Proveedor principal: Anthropic
  if (config.anthropicApiKey) {
    providers.push({
      name: 'anthropic',
      model: AI_MODELS[modelRole],
      apiKey: config.anthropicApiKey as string,
      endpoint: 'https://api.anthropic.com/v1/messages',
    })
  }

  // Fallback: OpenAI (si configurado)
  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey) {
    const openaiModels = {
      fast: process.env.AI_FALLBACK_MODEL_FAST || 'gpt-4o-mini',
      vision: process.env.AI_FALLBACK_MODEL_VISION || 'gpt-4o',
      content: process.env.AI_FALLBACK_MODEL_CONTENT || 'gpt-4o',
    }
    providers.push({
      name: 'openai',
      model: openaiModels[modelRole],
      apiKey: openaiKey,
      endpoint: 'https://api.openai.com/v1/chat/completions',
    })
  }

  if (providers.length === 0) {
    throw new Error('No AI providers configured')
  }

  // Intentar cada proveedor en orden
  const errors: string[] = []

  for (const provider of providers) {
    const start = Date.now()

    try {
      const text = await callProvider(provider, request, {
        timeoutMs: presetConfig.timeoutMs,
        maxRetries: presetConfig.maxRetries,
      })

      return {
        text,
        provider: provider.name,
        model: provider.model,
        latencyMs: Date.now() - start,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      errors.push(`${provider.name}/${provider.model}: ${message}`)
      console.warn(`[aiProvider] ${provider.name} failed, trying next...`, message)
    }
  }

  throw new Error(`All AI providers failed:\n${errors.join('\n')}`)
}

async function callProvider(
  provider: AIProvider,
  request: AIRequest,
  opts: { timeoutMs: number; maxRetries: number },
): Promise<string> {
  if (provider.name === 'anthropic') {
    return callAnthropic(provider, request, opts)
  } else if (provider.name === 'openai') {
    return callOpenAI(provider, request, opts)
  }
  throw new Error(`Unknown provider: ${provider.name}`)
}

async function callAnthropic(
  provider: AIProvider,
  request: AIRequest,
  opts: { timeoutMs: number; maxRetries: number },
): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs)

  try {
    const response = await fetchWithRetry(
      provider.endpoint,
      {
        method: 'POST',
        headers: {
          'x-api-key': provider.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: provider.model,
          max_tokens: request.maxTokens,
          system: request.system,
          messages: request.messages,
        }),
        signal: controller.signal,
      },
      { maxRetries: opts.maxRetries, baseDelayMs: 500 },
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic ${response.status}: ${errorText.slice(0, 200)}`)
    }

    const data = (await response.json()) as { content: Array<{ type: string; text: string }> }
    const text = data.content?.find((b) => b.type === 'text')?.text
    if (!text) throw new Error('Empty response from Anthropic')
    return text
  } finally {
    clearTimeout(timeout)
  }
}

async function callOpenAI(
  provider: AIProvider,
  request: AIRequest,
  opts: { timeoutMs: number; maxRetries: number },
): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs)

  try {
    // Convertir formato Anthropic → OpenAI
    const openaiMessages = []
    if (request.system) {
      openaiMessages.push({ role: 'system', content: request.system })
    }
    for (const msg of request.messages) {
      openaiMessages.push({ role: msg.role, content: msg.content })
    }

    const response = await fetchWithRetry(
      provider.endpoint,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: provider.model,
          max_tokens: request.maxTokens,
          messages: openaiMessages,
        }),
        signal: controller.signal,
      },
      { maxRetries: opts.maxRetries, baseDelayMs: 500 },
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI ${response.status}: ${errorText.slice(0, 200)}`)
    }

    const data = (await response.json()) as { choices: Array<{ message: { content: string } }> }
    const text = data.choices?.[0]?.message?.content
    if (!text) throw new Error('Empty response from OpenAI')
    return text
  } finally {
    clearTimeout(timeout)
  }
}
```

#### F2. Actualizar endpoints para usar `callAI`

**`generate-description.post.ts`** (experiencia en vivo del dealer):

```typescript
// ANTES: llamada directa a Anthropic con $fetch
// DESPUÉS:
import { callAI } from '~/server/services/aiProvider'

const response = await callAI(
  { messages: [{ role: 'user', content: prompt }], maxTokens: 500 },
  'realtime', // timeout 8s, failover rápido
  'fast', // modelo barato
)
return { description: response.text.trim() }
```

**`whatsapp/process.post.ts`** (background, no hay usuario esperando):

```typescript
// El refactor es más complejo por las imágenes Vision
// Pero el patrón es el mismo:
import { callAI } from '~/server/services/aiProvider'

const response = await callAI(
  {
    system: buildClaudePrompt(submission.text_content),
    messages: [{ role: 'user', content: userContent }],
    maxTokens: 4096,
  },
  'background', // timeout 30s, más reintentos
  'vision', // modelo con capacidad de visión
)
```

**Nota sobre Vision fallback:** GPT-4o también tiene Vision. El formato de imagen (base64) es compatible. El `callOpenAI` necesitaría adaptar el formato de contenido multimodal. Implementar como segunda iteración si se necesita — para MVP del failover, que la descripción de texto funcione con fallback es suficiente.

**`social/generate-posts.post.ts`** (no crítico, puede fallar):

```typescript
const response = await callAI(
  { messages: [{ role: 'user', content: prompt }], maxTokens: 1000 },
  'deferred', // timeout 60s, 3 reintentos — si falla, el post no se genera y ya
  'fast',
)
```

#### F3. Variables de entorno nuevas

Añadir a `.env.example`:

```bash
# AI Provider Configuration
AI_MODEL_FAST=claude-3-5-haiku-20241022
AI_MODEL_VISION=claude-sonnet-4-5-20250929
AI_MODEL_CONTENT=claude-sonnet-4-5-20250929

# Fallback: OpenAI (opcional — activar para tener failover)
OPENAI_API_KEY=
AI_FALLBACK_MODEL_FAST=gpt-4o-mini
AI_FALLBACK_MODEL_VISION=gpt-4o
AI_FALLBACK_MODEL_CONTENT=gpt-4o
```

**Coste del failover:** 0€ si OpenAI no se usa. Solo se activa si Anthropic falla. GPT-4o mini es comparable en precio a Haiku. Es un seguro, no un gasto recurrente.

#### F4. Logging de failover

En `callAI`, registrar cada failover en `infra_metrics` o en logs:

```typescript
// Si se usó fallback, loguearlo para monitorización
if (response.provider !== 'anthropic') {
  console.warn(
    `[aiProvider] Used fallback ${response.provider}/${response.model} (${response.latencyMs}ms)`,
  )
  // Opcionalmente: INSERT en infra_alerts si hay muchos failovers en 1 hora
}
```

---

### Resumen archivos sesión 45

| Archivo                                               | Acción                                           |
| ----------------------------------------------------- | ------------------------------------------------ |
| `.github/workflows/daily-audit.yml`                   | CREAR — auditoría diaria automatizada            |
| `.github/workflows/backup.yml`                        | REEMPLAZAR — backup diario multi-capa            |
| `scripts/backup-multi-tier.sh`                        | CREAR — evolución de backup-weekly.sh            |
| `scripts/audit-report.mjs`                            | CREAR — consolidador de informes de auditoría    |
| `scripts/send-audit-alert.mjs`                        | CREAR — envío de alertas por email               |
| `scripts/verify-extensibility.sh`                     | AMPLIAR — nuevas verificaciones                  |
| `server/utils/aiConfig.ts`                            | CREAR — modelos de IA centralizados              |
| `server/utils/siteConfig.ts`                          | CREAR — URLs y nombres de sitio centralizados    |
| `server/services/aiProvider.ts`                       | CREAR — wrapper con failover multi-proveedor     |
| `server/services/whatsappProcessor.ts`                | CREAR — lógica extraída de endpoint              |
| `server/services/imageUploader.ts`                    | CREAR — upload a Cloudinary/CF Images            |
| `server/services/vehicleCreator.ts`                   | CREAR — crear vehículo desde datos extraídos     |
| `server/services/notifications.ts`                    | CREAR — envío unificado de notificaciones        |
| `server/services/vehicles.ts`                         | CREAR — queries comunes con filtro vertical      |
| `server/middleware/vertical-context.ts`               | CREAR — inyectar vertical en cada request        |
| `server/api/generate-description.post.ts`             | REFACTOR — usar callAI + aiConfig                |
| `server/api/whatsapp/process.post.ts`                 | REFACTOR — usar servicios extraídos              |
| `server/api/verify-document.post.ts`                  | REFACTOR — usar callAI cuando se active Vision   |
| `server/api/social/generate-posts.post.ts`            | REFACTOR — usar callAI                           |
| `nuxt.config.ts`                                      | EDITAR — eliminar hardcoded domain y project ref |
| `supabase/migrations/000XX_vertical_isolation.sql`    | CREAR — índices + RLS por vertical               |
| `tests/security/vertical-isolation.test.ts`           | CREAR — test de aislamiento                      |
| `docs/tracciona-docs/referencia/DISASTER-RECOVERY.md` | CREAR — documentación de backup y recovery       |
| `.env.example`                                        | AMPLIAR — nuevas variables de IA y backup        |

### Orden de ejecución

1. **Parte D** — Deshardcodear primero (crea `aiConfig.ts`, `siteConfig.ts`)
2. **Parte F** — Failover de IA (crea `aiProvider.ts`, depende de aiConfig)
3. **Parte E** — Modularización (extrae servicios, refactoriza endpoints)
4. **Parte C** — Aislamiento vertical (migración SQL, middleware, tests)
5. **Parte B** — Backups multi-capa (nuevo workflow + script)
6. **Parte A** — Auditoría diaria (nuevo workflow + scripts)
7. Verificar: `npm run build` + `npm run typecheck` + `npm run test`

### Tests mínimos de la sesión

- [ ] Build compila sin errores
- [ ] `generate-description.post.ts` funciona con `callAI` (test manual o unit test)
- [ ] Si se quita `ANTHROPIC_API_KEY` y se pone `OPENAI_API_KEY`, el failover funciona
- [ ] `verify-extensibility.sh` no reporta nuevos hardcoded values
- [ ] Backup diario se ejecuta correctamente (workflow_dispatch manual)
- [ ] Auditoría diaria genera artefactos correctos (workflow_dispatch manual)
- [ ] Test de aislamiento vertical pasa
- [ ] No hay modelos de IA hardcodeados en endpoints (todos usan `AI_MODELS`)
- [ ] No hay `tracciona.com` hardcodeado en server/ (todos usan `getSiteUrl()`)

---

## SESIÓN 46 — Pentest automatizado (DAST): OWASP ZAP + Nuclei contra producción

> Escaneo dinámico de seguridad contra la app desplegada. Reemplaza el 70-80% de un pentest externo básico.
> Origen: requisito P0 de pentest externo (25 Feb 2026). Automatización como primera capa.
> Prioridad: ALTA — detecta vulnerabilidades reales en producción que el análisis estático (Semgrep) no puede ver.
> Coste: 0€/mes.

**Leer ANTES de escribir código:**

1. `.github/workflows/security.yml` — Escaneo estático actual (Semgrep + npm audit)
2. `server/middleware/security-headers.ts` — Headers CSP actuales
3. `tests/security/auth-endpoints.test.ts` — Tests de seguridad existentes
4. `nuxt.config.ts` — Configuración del sitio (URL, módulos)

**Qué cubre esto vs. un pentest humano:**

| Área                                        | DAST automatizado (esta sesión) | Pentest humano (futuro) |
| ------------------------------------------- | ------------------------------- | ----------------------- |
| OWASP Top 10 (XSS, SQLi, CSRF, etc.)        | ✅ Completo                     | ✅ Completo             |
| Headers de seguridad mal configurados       | ✅ Completo                     | ✅ Completo             |
| Puertos/servicios expuestos                 | ✅ Nuclei                       | ✅ Completo             |
| SSL/TLS mal configurado                     | ✅ Nuclei                       | ✅ Completo             |
| Información sensible expuesta               | ✅ Parcial                      | ✅ Completo             |
| Lógica de negocio (dealer ve datos de otro) | ❌ No cubre                     | ✅ Sí                   |
| Escalación de privilegios creativa          | ❌ No cubre                     | ✅ Sí                   |
| Ataques encadenados con contexto            | ❌ No cubre                     | ✅ Sí                   |
| Ingeniería social                           | ❌ No cubre                     | ✅ Sí                   |

**Recomendación:** Automatizar DAST ahora. Contratar pentest humano puntual (~1.500-3.000€) cuando haya clientes pagando.

---

### Parte A — OWASP ZAP (escaneo DAST principal)

**Qué es:** OWASP ZAP es el escáner de seguridad web más usado del mundo. Navega tu app como un atacante, prueba formularios, busca inyecciones, analiza headers, y genera un informe con vulnerabilidades clasificadas por severidad.

**Dos modos:**

- **Baseline scan** (~5 min): escaneo pasivo, solo analiza lo que encuentra navegando. Ideal para CI semanal.
- **Full scan** (~30-60 min): escaneo activo, intenta inyecciones reales. Ideal para mensual.

#### A1. Crear `.github/workflows/dast-scan.yml`

```yaml
name: DAST Security Scan

on:
  schedule:
    - cron: '0 4 * * 0'   # Domingos a las 04:00 UTC (baseline semanal)
  workflow_dispatch:
    inputs:
      scan_type:
        description: 'Scan type'
        required: false
        default: 'baseline'
        type: choice
        options: [baseline, full]
      target_url:
        description: 'Target URL'
        required: false
        default: 'https://tracciona.com'
        type: string

env:
  TARGET_URL: ${{ inputs.target_url || 'https://tracciona.com' }}
  SCAN_TYPE: ${{ inputs.scan_type || 'baseline' }}

jobs:
  # ── OWASP ZAP ──
  zap-scan:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v4

      - name: ZAP Baseline Scan
        if: env.SCAN_TYPE == 'baseline'
        uses: zaproxy/action-baseline@v0.14.0
        with:
          target: ${{ env.TARGET_URL }}
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a -j'
          allow_issue_writing: false

      - name: ZAP Full Scan
        if: env.SCAN_TYPE == 'full'
        uses: zaproxy/action-full-scan@v0.12.0
        with:
          target: ${{ env.TARGET_URL }}
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a -j'
          allow_issue_writing: false

      - name: Upload ZAP Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: zap-report-${{ github.run_number }}
          path: |
            report_html.html
            report_json.json
          retention-days: 90

  # ── Nuclei ──
  nuclei-scan:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4

      - name: Install Nuclei
        run: |
          go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
          echo "$HOME/go/bin" >> $GITHUB_PATH

      - name: Run Nuclei
        run: |
          nuclei \
            -u ${{ env.TARGET_URL }} \
            -t cves/ \
            -t vulnerabilities/ \
            -t misconfiguration/ \
            -t exposures/ \
            -t technologies/ \
            -t ssl/ \
            -t dns/ \
            -severity critical,high,medium \
            -json-export nuclei-results.json \
            -markdown-export nuclei-report.md \
            -silent \
            || true

      - name: Upload Nuclei Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: nuclei-report-${{ github.run_number }}
          path: |
            nuclei-results.json
            nuclei-report.md
          retention-days: 90

  # ── SSL/TLS Check ──
  ssl-check:
    runs-on: ubuntu-latest
    steps:
      - name: Check SSL/TLS configuration
        run: |
          echo "=== SSL/TLS Report for ${{ env.TARGET_URL }} ===" > ssl-report.txt

          # Check certificate expiry
          echo "## Certificate Info:" >> ssl-report.txt
          echo | openssl s_client -servername tracciona.com -connect tracciona.com:443 2>/dev/null \
            | openssl x509 -noout -dates -subject -issuer >> ssl-report.txt 2>&1

          # Check supported protocols
          echo "" >> ssl-report.txt
          echo "## Protocol Support:" >> ssl-report.txt
          for proto in tls1 tls1_1 tls1_2 tls1_3; do
            result=$(echo | openssl s_client -$proto -connect tracciona.com:443 2>&1)
            if echo "$result" | grep -q "CONNECTED"; then
              echo "  $proto: SUPPORTED" >> ssl-report.txt
            else
              echo "  $proto: NOT SUPPORTED" >> ssl-report.txt
            fi
          done

          # Check HSTS
          echo "" >> ssl-report.txt
          echo "## HSTS Header:" >> ssl-report.txt
          curl -sI https://tracciona.com | grep -i strict-transport >> ssl-report.txt 2>&1 \
            || echo "  HSTS: NOT FOUND ⚠️" >> ssl-report.txt

          cat ssl-report.txt

      - uses: actions/upload-artifact@v4
        with:
          name: ssl-report-${{ github.run_number }}
          path: ssl-report.txt
          retention-days: 90

  # ── Consolidar y alertar ──
  report:
    runs-on: ubuntu-latest
    needs: [zap-scan, nuclei-scan, ssl-check]
    if: always()
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          path: dast-artifacts/

      - name: Analyze results
        id: analyze
        run: |
          echo "=== DAST Scan Summary ===" > dast-summary.txt
          echo "Date: $(date -u)" >> dast-summary.txt
          echo "Target: ${{ env.TARGET_URL }}" >> dast-summary.txt
          echo "Scan type: ${{ env.SCAN_TYPE }}" >> dast-summary.txt
          echo "" >> dast-summary.txt

          # Count ZAP alerts by risk
          if [ -f dast-artifacts/zap-report-*/report_json.json ]; then
            echo "## ZAP Results:" >> dast-summary.txt
            HIGH=$(cat dast-artifacts/zap-report-*/report_json.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
alerts = data.get('site', [{}])[0].get('alerts', []) if data.get('site') else []
print(sum(1 for a in alerts if a.get('riskcode') == '3'))" 2>/dev/null || echo 0)
            MEDIUM=$(cat dast-artifacts/zap-report-*/report_json.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
alerts = data.get('site', [{}])[0].get('alerts', []) if data.get('site') else []
print(sum(1 for a in alerts if a.get('riskcode') == '2'))" 2>/dev/null || echo 0)
            echo "  High: $HIGH" >> dast-summary.txt
            echo "  Medium: $MEDIUM" >> dast-summary.txt
          fi

          # Count Nuclei findings
          if [ -f dast-artifacts/nuclei-report-*/nuclei-results.json ]; then
            echo "" >> dast-summary.txt
            echo "## Nuclei Results:" >> dast-summary.txt
            CRITICAL=$(grep -c '"critical"' dast-artifacts/nuclei-report-*/nuclei-results.json 2>/dev/null || echo 0)
            HIGH_N=$(grep -c '"high"' dast-artifacts/nuclei-report-*/nuclei-results.json 2>/dev/null || echo 0)
            echo "  Critical: $CRITICAL" >> dast-summary.txt
            echo "  High: $HIGH_N" >> dast-summary.txt
          fi

          cat dast-summary.txt

          # Set flag if critical/high issues found
          if [ "${HIGH:-0}" -gt 0 ] || [ "${CRITICAL:-0}" -gt 0 ] || [ "${HIGH_N:-0}" -gt 0 ]; then
            echo "HAS_CRITICAL=true" >> $GITHUB_ENV
          fi

      - name: Alert on critical findings
        if: env.HAS_CRITICAL == 'true'
        env:
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          ALERT_EMAIL: ${{ secrets.INFRA_ALERT_EMAIL }}
        run: |
          SUMMARY=$(cat dast-summary.txt)
          curl -X POST https://api.resend.com/emails \
            -H "Authorization: Bearer $RESEND_API_KEY" \
            -H "Content-Type: application/json" \
            -d "{\"from\":\"security@tracciona.com\",\"to\":\"$ALERT_EMAIL\",\"subject\":\"🔴 DAST: Critical vulnerabilities found\",\"text\":\"$SUMMARY\\n\\nCheck GitHub Actions for full reports.\"}"

      - uses: actions/upload-artifact@v4
        with:
          name: dast-summary-${{ github.run_number }}
          path: dast-summary.txt
          retention-days: 90
```

#### A2. Crear `.zap/rules.tsv` — Personalizar reglas de ZAP

Este archivo controla qué alertas ignorar (falsos positivos conocidos) y cuáles escalar:

```tsv
# ZAP Rules Configuration for Tracciona
# Format: rule_id\taction (IGNORE, WARN, FAIL)
# See: https://www.zaproxy.org/docs/docker/baseline-scan/#rules-file

# Ignorar: Nuxt inyecta inline scripts/styles por diseño (documentado en security-headers.ts)
10055	WARN	# CSP: unsafe-inline — known Nuxt 3 requirement
10098	WARN	# Cross-Domain Misconfiguration — Supabase/Stripe are expected

# Escalar a FAIL: estas son críticas
40012	FAIL	# XSS (Reflected)
40014	FAIL	# XSS (Persistent)
40018	FAIL	# SQL Injection
40019	FAIL	# SQL Injection (MySQL)
40020	FAIL	# SQL Injection (Hypersonic)
40021	FAIL	# SQL Injection (Oracle)
40022	FAIL	# SQL Injection (PostgreSQL)
90021	FAIL	# XPath Injection
90023	FAIL	# XML External Entity Attack
40003	FAIL	# CRLF Injection
40008	FAIL	# Parameter Tampering
40009	FAIL	# Server Side Include
40028	FAIL	# ELMAH Information Leak
40032	FAIL	# .htaccess Information Leak
90019	FAIL	# Server Side Code Injection
```

---

### Parte B — Tests de seguridad ampliados (complemento a DAST)

ZAP y Nuclei escanean desde fuera. Pero hay vulnerabilidades de lógica de negocio que solo se detectan con tests internos. Ampliar `tests/security/` con tests que simulan ataques de lógica.

#### B1. Crear `tests/security/idor-protection.test.ts` — Insecure Direct Object Reference

```typescript
// tests/security/idor-protection.test.ts
import { describe, it, expect } from 'vitest'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'

describe('IDOR: endpoints no exponen datos de otros dealers', () => {
  // Estos tests verifican que las APIs que aceptan IDs
  // NO devuelven datos si el ID pertenece a otro dealer/vertical

  it('GET /api/vehicles/[id] con ID de otro dealer → 403 o datos filtrados', async () => {
    // Requiere: crear 2 dealers de test en distintas verticales
    // Intentar acceder a vehículo del dealer B con token del dealer A
    // Verificar que devuelve 403 o que los campos sensibles no están
  })

  it('POST /api/generate-description con vehicleId de otro dealer → 403', async () => {
    // Intentar generar descripción para vehículo ajeno
  })

  it('GET /api/invoicing/export-csv no incluye facturas de otro dealer', async () => {
    // Exportar CSV y verificar que solo contiene facturas propias
  })
})

describe('IDOR: rutas públicas no exponen datos sensibles', () => {
  it('GET /api/vehicles/public/[slug] no incluye dealer.email ni dealer.phone', async () => {
    // La vista pública de un vehículo NO debe exponer datos del dealer
    // que no estén explícitamente marcados como públicos
  })

  it('Sitemap no contiene rutas de admin', async () => {
    const res = await fetch(`${BASE}/sitemap.xml`)
    const text = await res.text()
    expect(text).not.toContain('/admin')
    expect(text).not.toContain('/api/')
  })
})
```

#### B2. Crear `tests/security/rate-limiting.test.ts`

```typescript
// tests/security/rate-limiting.test.ts
import { describe, it, expect } from 'vitest'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'

describe('Rate limiting: endpoints sensibles limitan requests', () => {
  it('POST /api/generate-description × 20 rápidos → 429 en algún momento', async () => {
    const results = []
    for (let i = 0; i < 20; i++) {
      const res = await fetch(`${BASE}/api/generate-description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: 'test', text: 'test' }),
      })
      results.push(res.status)
    }
    // Al menos alguno debería ser 429 (rate limited) o 401 (no auth)
    // Si todos son 200, no hay rate limiting y es un problema
    const hasProtection = results.some((s) => s === 429 || s === 401)
    expect(hasProtection).toBe(true)
  })

  it('POST /api/stripe/webhook × 50 sin firma → no causa DoS', async () => {
    const start = Date.now()
    const promises = Array.from({ length: 50 }, () =>
      fetch(`${BASE}/api/stripe/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'test' }),
      }),
    )
    await Promise.all(promises)
    const elapsed = Date.now() - start
    // Si 50 requests tardan >10s, posible DoS vulnerability
    expect(elapsed).toBeLessThan(10_000)
  })
})
```

#### B3. Crear `tests/security/information-leakage.test.ts`

```typescript
// tests/security/information-leakage.test.ts
import { describe, it, expect } from 'vitest'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'

describe('Information leakage: la app no expone datos internos', () => {
  it('Errores 500 no exponen stack traces', async () => {
    // Provocar un error enviando datos malformados
    const res = await fetch(`${BASE}/api/generate-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{malformed json!!!',
    })
    const text = await res.text()
    expect(text).not.toContain('node_modules')
    expect(text).not.toContain('at Object.')
    expect(text).not.toContain('server/api/')
    expect(text).not.toContain('ANTHROPIC_API_KEY')
    expect(text).not.toContain('SUPABASE')
  })

  it('/.env no es accesible', async () => {
    const res = await fetch(`${BASE}/.env`)
    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  it('/.git no es accesible', async () => {
    const res = await fetch(`${BASE}/.git/config`)
    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  it('/api/__sitemap no expone rutas internas', async () => {
    const res = await fetch(`${BASE}/api/__sitemap`)
    if (res.ok) {
      const text = await res.text()
      expect(text).not.toContain('/admin')
    }
  })

  const sensitiveFiles = [
    '/.env',
    '/.env.local',
    '/.env.production',
    '/package.json',
    '/nuxt.config.ts',
    '/tsconfig.json',
    '/.git/HEAD',
    '/.git/config',
    '/server/utils/aiConfig.ts',
    '/server/services/aiProvider.ts',
  ]

  for (const file of sensitiveFiles) {
    it(`${file} no es accesible públicamente`, async () => {
      const res = await fetch(`${BASE}${file}`)
      // Should be 404 or 403, not 200
      expect(res.status).not.toBe(200)
    })
  }
})

describe('Headers de seguridad en producción', () => {
  it('No expone X-Powered-By', async () => {
    const res = await fetch(`${BASE}/`)
    expect(res.headers.get('x-powered-by')).toBeNull()
  })

  it('Tiene Referrer-Policy', async () => {
    const res = await fetch(`${BASE}/`)
    expect(res.headers.get('referrer-policy')).toBeTruthy()
  })

  it('Tiene Permissions-Policy', async () => {
    const res = await fetch(`${BASE}/`)
    expect(res.headers.get('permissions-policy')).toBeTruthy()
  })

  it('No tiene HSTS con max-age < 1 año', async () => {
    const res = await fetch(`${BASE}/`)
    const hsts = res.headers.get('strict-transport-security')
    if (hsts) {
      const maxAge = parseInt(hsts.match(/max-age=(\d+)/)?.[1] || '0')
      expect(maxAge).toBeGreaterThanOrEqual(31536000) // 1 año
    }
    // Si no tiene HSTS, ZAP lo detectará — no fail aquí porque Cloudflare puede manejarlo
  })
})
```

---

### Parte C — Integrar DAST en el pipeline existente

#### C1. Actualizar `.github/workflows/security.yml` para referenciar DAST

No modificar el workflow existente (que corre en PRs y push), pero añadir un comentario que indique la existencia del DAST:

```yaml
# Nota: Este workflow hace análisis ESTÁTICO (SAST).
# Para análisis DINÁMICO contra producción, ver .github/workflows/dast-scan.yml
# SAST: Semgrep + npm audit (en cada PR y push a main)
# DAST: ZAP + Nuclei (semanal contra producción)
```

#### C2. Crear `docs/tracciona-docs/referencia/SECURITY-TESTING.md`

```markdown
# Security Testing Strategy

## Capas de seguridad

| Capa              | Herramienta           | Frecuencia                  | Qué detecta                         |
| ----------------- | --------------------- | --------------------------- | ----------------------------------- |
| SAST (código)     | Semgrep               | Cada PR + diario            | Patrones inseguros en código fuente |
| Dependencias      | npm audit             | Cada PR + diario            | Vulnerabilidades en dependencias    |
| DAST (producción) | OWASP ZAP             | Semanal (baseline)          | XSS, SQLi, CSRF, headers, cookies   |
| Infraestructura   | Nuclei                | Semanal                     | CVEs, misconfigs, exposiciones, SSL |
| Lógica de negocio | Vitest security tests | Cada PR                     | IDOR, rate limiting, info leakage   |
| Pentest humano    | Externo               | Anual (cuando haya revenue) | Ataques creativos, lógica compleja  |

## Cómo ejecutar

### Escaneo DAST manual (full scan)

GitHub Actions → dast-scan.yml → Run workflow → scan_type: full

### Interpretar resultados de ZAP

- **High** (rojo): Vulnerabilidad explotable. Corregir ANTES de seguir.
- **Medium** (naranja): Vulnerabilidad potencial. Corregir en la siguiente sesión.
- **Low** (amarillo): Mejora de seguridad. Planificar.
- **Informational** (azul): Solo información. Revisar si es relevante.

Los informes HTML se descargan de GitHub Actions → Artifacts.

### Interpretar resultados de Nuclei

- **Critical/High**: Acción inmediata.
- **Medium**: Planificar corrección.
- **Info**: Templates que detectaron la tecnología (normal).

## Falsos positivos conocidos

Ver `.zap/rules.tsv` para la lista de reglas ignoradas/rebajadas con justificación.

## Cuándo contratar pentest humano

Cuando se cumplan 2 de estos 3:

1. Revenue mensual > 1.000€
2. > 50 dealers activos con datos reales
3. Procesamiento de pagos activo (Stripe live mode)

Proveedores recomendados: Cobalt (~3.000€), HackerOne (~2.000€ bug bounty), freelance senior (~1.500€).
```

---

### Resumen archivos sesión 46

| Archivo                                              | Acción                                       |
| ---------------------------------------------------- | -------------------------------------------- |
| `.github/workflows/dast-scan.yml`                    | CREAR — ZAP + Nuclei + SSL semanal           |
| `.zap/rules.tsv`                                     | CREAR — Reglas de falsos positivos           |
| `tests/security/idor-protection.test.ts`             | CREAR — Tests de IDOR                        |
| `tests/security/rate-limiting.test.ts`               | CREAR — Tests de rate limiting               |
| `tests/security/information-leakage.test.ts`         | CREAR — Tests de info leakage                |
| `docs/tracciona-docs/referencia/SECURITY-TESTING.md` | CREAR — Documentación de estrategia          |
| `.github/workflows/security.yml`                     | EDITAR — Añadir comentario referencia a DAST |

### Orden de ejecución

1. **Parte A** — Crear workflow DAST + reglas ZAP (lo más importante)
2. **Parte B** — Crear tests de seguridad ampliados
3. **Parte C** — Documentación + integración con pipeline existente
4. Verificar: ejecutar `workflow_dispatch` del DAST y revisar artefactos
5. Verificar: `npm run build` + `npx vitest run tests/security/`

### Tests mínimos de la sesión

- [ ] DAST workflow se ejecuta sin errores (workflow_dispatch manual, baseline)
- [ ] ZAP genera informe HTML descargable en artefactos
- [ ] Nuclei genera informe JSON/MD descargable en artefactos
- [ ] SSL check reporta TLS 1.2+ y certificado válido
- [ ] Si hay findings High/Critical, se envía email de alerta
- [ ] Tests de information-leakage pasan (no se exponen .env, .git, stack traces)
- [ ] Tests de auth-endpoints siguen pasando (no se rompió nada)
- [ ] `.zap/rules.tsv` tiene documentados los falsos positivos conocidos
- [ ] Build compila sin errores

---

## SESIÓN 47 — Hallazgos críticos y deuda técnica inmediata

> **Objetivo:** Resolver los hallazgos críticos C1, C2 y los menores de limpieza.
> **Estimación:** 2-3 horas Claude Code
> **Dependencias:** Ninguna

### Parte A — Columna `vertical` en vehicles y advertisements (C1)

**Problema:** `vehiclesQuery()` devuelve TODO sin filtrar. La migración 62 confirma que vehicles y advertisements NO tienen columna vertical. Si se despliega Horecaria, los datos se mezclan.

**Crear migración `00063_vehicles_vertical_column.sql`:**

```sql
-- Add vertical column to vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vertical text NOT NULL DEFAULT 'tracciona';
CREATE INDEX IF NOT EXISTS idx_vehicles_vertical ON vehicles(vertical);
CREATE INDEX IF NOT EXISTS idx_vehicles_vertical_status ON vehicles(vertical, status);

-- Add vertical column to advertisements
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS vertical text NOT NULL DEFAULT 'tracciona';
CREATE INDEX IF NOT EXISTS idx_advertisements_vertical ON advertisements(vertical);

-- Update existing records (all current data is Tracciona)
UPDATE vehicles SET vertical = 'tracciona' WHERE vertical IS NULL OR vertical = '';
UPDATE advertisements SET vertical = 'tracciona' WHERE vertical IS NULL OR vertical = '';

-- RLS policy: vehicles scoped by vertical
-- (Uses app.current_vertical set by middleware, matching dealers pattern)
```

**Actualizar `server/utils/supabaseQuery.ts`:**

- Eliminar el comentario "vehicles table does not currently have a vertical column"
- `vehiclesQuery()` debe filtrar por vertical igual que `dealersQuery()`

**Actualizar migración 62 nota:** eliminar el NOTE que dice que se salta vehicles/advertisements.

### Parte B — Tests reales de vertical-isolation (C2)

**Problema:** `vertical-isolation.test.ts` tiene `expect(true).toBe(true)`.

**Reescribir `tests/security/vertical-isolation.test.ts`:**

```typescript
// Tests reales que verifican:
// 1. vehiclesQuery('tracciona') NO devuelve vehículos de 'horecaria'
// 2. dealersQuery('tracciona') NO devuelve dealers de 'horecaria'
// 3. categoriesQuery('tracciona') NO devuelve categorías de 'horecaria'
// 4. vertical-context middleware inyecta vertical correctamente
// 5. supabaseQuery helpers aplican filtro .eq('vertical', v)
```

Usar mocks de Supabase client para verificar que las queries incluyen el filtro correcto sin necesitar conexión real a BD.

### Parte C — Limpieza de archivos (hallazgos menores)

- **Eliminar** `NUL` de la raíz del proyecto
- **Eliminar** `lighthouserc.js` (duplicado de `.lighthouserc.js`)
- **Eliminar** `scripts/backup-weekly.sh` (obsoleto, reemplazado por `backup-multi-tier.sh`)
- **Cambiar** `infraAlertEmail` default en nuxt.config.ts de `tankiberica@gmail.com` a `admin@tracciona.com`
- **Cambiar** `.env.example`: reemplazar `SUPABASE_PROJECT_REF=gmnrfuzekbwyzkgsaftv` por `SUPABASE_PROJECT_REF=your-project-ref-here`
- **Verificar** `scrape-competitors.ts` — si sesión 44 lo deprecó, añadir comentario header o mover a `scripts/legacy/`

### Parte D — Hardcoded Supabase ref en nuxt.config.ts (I5)

**Problema:** `dns-prefetch` apunta a `https://gmnrfuzekbwyzkgsaftv.supabase.co` directamente.

**Solución:** Mover a variable de entorno:

```typescript
// En nuxt.config.ts, sección app.head.link:
{ rel: 'dns-prefetch', href: `https://${process.env.SUPABASE_PROJECT_REF || 'xxxxx'}.supabase.co` },
```

O mejor: usar `process.env.SUPABASE_URL` directamente (ya existe como variable).

### Parte E — social/generate-posts.post.ts sin callAI (I7)

**Problema:** Usa templates estáticos en vez de `callAI()`. Inconsistente con el patrón.

**Solución:** Refactorizar para usar `callAI(..., 'deferred', 'fast')` con un prompt que genere posts para cada plataforma. Mantener templates como fallback si AI falla.

### Tests mínimos de la sesión

- [ ] Build compila sin errores
- [ ] `generate-description.post.ts` funciona con `callAI` (test manual o unit test)
- [ ] Si se quita `ANTHROPIC_API_KEY` y se pone `OPENAI_API_KEY`, el failover funciona
- [ ] `verify-extensibility.sh` no reporta nuevos hardcoded values
- [ ] Backup diario se ejecuta correctamente (workflow_dispatch manual)
- [ ] Auditoría diaria genera artefactos correctos (workflow_dispatch manual)
- [ ] Test de aislamiento vertical pasa
- [ ] No hay modelos de IA hardcodeados en endpoints (todos usan `AI_MODELS`)
- [ ] No hay `tracciona.com` hardcodeado en server/ (todos usan `getSiteUrl()`)

---

### Tests mínimos de la sesión

- [ ] Build compila sin errores
- [ ] `generate-description.post.ts` funciona con `callAI` (test manual o unit test)
- [ ] Si se quita `ANTHROPIC_API_KEY` y se pone `OPENAI_API_KEY`, el failover funciona
- [ ] `verify-extensibility.sh` no reporta nuevos hardcoded values
- [ ] Backup diario se ejecuta correctamente (workflow_dispatch manual)
- [ ] Auditoría diaria genera artefactos correctos (workflow_dispatch manual)
- [ ] Test de aislamiento vertical pasa
- [ ] No hay modelos de IA hardcodeados en endpoints (todos usan `AI_MODELS`)
- [ ] No hay `tracciona.com` hardcodeado en server/ (todos usan `getSiteUrl()`)

---

## SESIÓN 48 — Completar sesión 45E (Modularización)

> **Objetivo:** Descomponer `whatsapp/process.post.ts` (18KB) en servicios (I1)
> **Estimación:** 3-4 horas Claude Code
> **Dependencias:** Sesión 47A completada

### Parte A — Extraer servicios

**Crear los 4 servicios planificados en sesión 45E:**

1. **`server/services/imageUploader.ts`**
   - `uploadToCloudinary(imageBuffer, options)` → `{ publicId, secureUrl, width, height }`
   - `uploadToCFImages(imageBuffer, options)` → similar
   - `uploadImage(imageBuffer, options)` — decide según `IMAGE_PIPELINE_MODE`

2. **`server/services/vehicleCreator.ts`**
   - `createVehicleFromAI(analysisResult, dealerId, images, vertical)` → `{ vehicleId, slug }`
   - Maneja: insertar en vehicles, asociar imágenes, generar slug, asignar categoría

3. **`server/services/whatsappProcessor.ts`**
   - `processWhatsAppSubmission(submissionId)` → orquesta todo el flujo
   - Llama a: descargar imágenes → `callAI` (no SDK directo) → `uploadImage` → `createVehicleFromAI` → notificar

4. **`server/services/notifications.ts`**
   - `notifyDealer(dealerId, type, data)` — unifica WhatsApp + email + push
   - `notifyAdmin(type, data)` — alertas internas
   - `notifyBuyer(userId, type, data)` — alertas de favoritos, subastas, etc.

### Parte B — Refactorizar endpoint

**`whatsapp/process.post.ts` pasa de ~450 líneas a ~50:**

```typescript
export default defineEventHandler(async (event) => {
  // Auth + validate (10 líneas)
  const body = await readBody(event)
  // ...verificar submissionId...

  const result = await processWhatsAppSubmission(body.submissionId)
  return result
})
```

### Parte C — Migrar de SDK directo a callAI

**Problema:** `whatsapp/process.post.ts` usa `import Anthropic from '@anthropic-ai/sdk'` directamente, bypasseando el failover de `aiProvider.ts`.

**Solución:** El nuevo `whatsappProcessor.ts` debe usar `callAI(..., 'background', 'vision')` que ya soporta timeouts de 30s y retry con fallback a OpenAI.

**Nota:** `callAI` actualmente acepta `messages` como array de `{ role, content: string }`. Para Claude Vision con imágenes en base64, hay que extender la interfaz `AIRequest` para soportar `content` como array de bloques (text + image). Verificar si ya lo soporta o si hay que añadirlo.

### Parte D — Migrar verify-document.post.ts

**Mismo problema:** usa SDK de Anthropic directamente. Refactorizar para usar `callAI(..., 'background', 'vision')`.

### Tests mínimos de la sesión

- [ ] DAST workflow se ejecuta sin errores (workflow_dispatch manual, baseline)
- [ ] ZAP genera informe HTML descargable en artefactos
- [ ] Nuclei genera informe JSON/MD descargable en artefactos
- [ ] SSL check reporta TLS 1.2+ y certificado válido
- [ ] Si hay findings High/Critical, se envía email de alerta
- [ ] Tests de information-leakage pasan (no se exponen .env, .git, stack traces)
- [ ] Tests de auth-endpoints siguen pasando (no se rompió nada)
- [ ] `.zap/rules.tsv` tiene documentados los falsos positivos conocidos
- [ ] Build compila sin errores

---

## SESIÓN 49 — Completar sesión 46 (DAST + Tests de seguridad)

> **Objetivo:** Implementar OWASP ZAP + Nuclei + tests de seguridad expandidos (I2)
> **Estimación:** 2-3 horas Claude Code
> **Dependencias:** Ninguna

### Parte A — Workflow DAST

**Crear `.github/workflows/dast-scan.yml`:**

- Schedule: domingos 04:00 UTC
- Job 1: OWASP ZAP baseline scan (5 min, pasivo)
- Job 2: Nuclei scan (CVEs, misconfigs, SSL)
- Job 3: SSL/TLS check (certificado, protocolos, HSTS)
- Job 4: Consolidar resultados + email si hallazgos críticos/altos
- Trigger manual con `workflow_dispatch`
- Full scan mensual (primer domingo del mes)

**Crear `.zap/rules.tsv`:**

```tsv
10055	WARN	# CSP: unsafe-inline — required by Nuxt 3 SSR
10098	WARN	# Cross-Domain Misconfiguration — Supabase/Stripe expected
40012	FAIL	# XSS (Reflected)
40014	FAIL	# XSS (Persistent)
40018	FAIL	# SQL Injection
```

### Parte B — Tests de seguridad expandidos

**Crear `tests/security/idor-protection.test.ts`:**

- Verificar que cambiar dealerId en requests devuelve 403
- Verificar que un dealer no puede ver vehículos de otro dealer via API
- Verificar que un dealer no puede editar suscripción de otro

**Crear `tests/security/rate-limiting.test.ts`:**

- Verificar que endpoints sensibles devuelven 429 tras exceso de requests
- (Nota: en memoria solo funciona en dev, pero el test documenta el comportamiento esperado)

**Crear `tests/security/information-leakage.test.ts`:**

- Errores 500 no exponen stack traces, API keys, o rutas internas
- `/.env`, `/.git` no son accesibles
- No hay header `X-Powered-By`
- Respuestas de error usan mensajes genéricos de `safeError.ts`

### Parte C — Documentación

**Crear `docs/tracciona-docs/referencia/SECURITY-TESTING.md`:**

- Explicación de las 6 capas de seguridad
- Cómo ejecutar cada herramienta manualmente
- Cómo interpretar los reportes
- Cuándo escalar a pentest humano

**Editar `.github/workflows/security.yml`:** añadir comentario que diferencia SAST (este) de DAST (dast-scan.yml).

### Tests mínimos de la sesión

- [ ] DAST workflow se ejecuta sin errores (workflow_dispatch manual, baseline)
- [ ] ZAP genera informe HTML descargable en artefactos
- [ ] Nuclei genera informe JSON/MD descargable en artefactos
- [ ] SSL check reporta TLS 1.2+ y certificado válido
- [ ] Si hay findings High/Critical, se envía email de alerta
- [ ] Tests de information-leakage pasan (no se exponen .env, .git, stack traces)
- [ ] Tests de auth-endpoints siguen pasando (no se rompió nada)
- [ ] `.zap/rules.tsv` tiene documentados los falsos positivos conocidos
- [ ] Build compila sin errores

---

## SESIÓN 50 — Seguridad: HSTS, CORS, rate limiting WAF

> **Objetivo:** Cerrar gaps de seguridad para subir dimensión 1 a ~90+
> **Estimación:** 1-2 horas Claude Code
> **Dependencias:** Ninguna

### Parte A — HSTS header

**Editar `server/middleware/security-headers.ts`:**

```typescript
headers.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
```

### Parte B — CORS explícito

**Verificar si Nuxt ya tiene CORS configurado.** Si no, añadir en nuxt.config.ts o como middleware:

```typescript
// Solo permitir origin propio + Supabase + Stripe
const allowedOrigins = [
  getSiteUrl(),
  process.env.SUPABASE_URL,
  'https://js.stripe.com',
  'https://challenges.cloudflare.com',
].filter(Boolean)
```

### Parte C — Documentar configuración WAF de Cloudflare

**Crear `docs/tracciona-docs/referencia/CLOUDFLARE-WAF-CONFIG.md`:**

- Copiar las reglas documentadas en `rate-limit.ts` (email/send: 10/min, lead: 5/min, stripe: 20/min, account/delete: 2/min, POST general: 30/min, GET: 200/min)
- Screenshots o instrucciones paso a paso para configurar en Cloudflare Dashboard
- Esto no es ejecución de Claude Code sino documentación para que los fundadores lo configuren

### Parte D — Rotación de secretos documentada

**Crear `docs/tracciona-docs/referencia/SECRETS-ROTATION.md`:**

- Lista de todos los secretos con fecha de creación (si se conoce)
- Frecuencia recomendada de rotación (anual para la mayoría)
- Procedimiento paso a paso para rotar cada secreto sin downtime

### Tests mínimos de la sesión

- [ ] DAST workflow se ejecuta sin errores (workflow_dispatch manual, baseline)
- [ ] ZAP genera informe HTML descargable en artefactos
- [ ] Nuclei genera informe JSON/MD descargable en artefactos
- [ ] SSL check reporta TLS 1.2+ y certificado válido
- [ ] Si hay findings High/Critical, se envía email de alerta
- [ ] Tests de information-leakage pasan (no se exponen .env, .git, stack traces)
- [ ] Tests de auth-endpoints siguen pasando (no se rompió nada)
- [ ] `.zap/rules.tsv` tiene documentados los falsos positivos conocidos
- [ ] Build compila sin errores

---

## SESIÓN 51 — Testing: subir cobertura de 5% a 40%

> **Objetivo:** Plan de tests incremental para cumplir objetivo año 1
> **Estimación:** 4-6 horas Claude Code (puede dividirse en sub-sesiones)
> **Dependencias:** Sesión 48 (servicios extraídos facilitan testing)

### Parte A — Tests unitarios de servicios server

**Tests prioritarios (cubren lógica de negocio crítica):**

1. `tests/unit/server/aiProvider.test.ts` — mock de fetch, verificar failover, timeouts, presets
2. `tests/unit/server/billing.test.ts` — mock de Stripe, verificar flujos de suscripción
3. `tests/unit/server/rateLimit.test.ts` — verificar sliding window, cleanup, key extraction
4. `tests/unit/server/safeError.test.ts` — verificar mensajes genéricos en prod, detallados en dev
5. `tests/unit/server/verifyCronSecret.test.ts` — verificar fail-closed en prod, warn en dev
6. `tests/unit/server/siteConfig.test.ts` — verificar fallbacks
7. `tests/unit/server/aiConfig.test.ts` — verificar defaults y overrides

### Parte B — Tests de composables faltantes

**Composables críticos sin test:**

1. `tests/unit/useAuth.test.ts` — verificar estados de auth, redirect a login
2. `tests/unit/useSubscriptionPlan.test.ts` — verificar lógica de planes, límites
3. `tests/unit/useOnboarding.test.ts` — verificar pasos, completitud
4. `tests/unit/useFavorites.test.ts` — verificar add/remove, persistencia
5. `tests/unit/useImageUrl.test.ts` — verificar transformaciones Cloudinary/CF

### Parte C — Coverage gate en CI

**Editar `.github/workflows/ci.yml`:**

```yaml
- name: Run tests with coverage
  run: npx vitest run --coverage --reporter=json --outputFile=coverage.json
- name: Check coverage threshold
  run: |
    COVERAGE=$(node -e "const c=require('./coverage.json'); console.log(c.total.lines.pct)")
    if (( $(echo "$COVERAGE < 40" | bc -l) )); then
      echo "Coverage $COVERAGE% is below 40% threshold"
      exit 1
    fi
```

### Parte D — E2E para user journeys críticos

**Crear specs Playwright para los 8 journeys del plan de auditoría:**

1. `tests/e2e/journeys/visitor-search.spec.ts` — Home → filtros → ficha → contacto
2. `tests/e2e/journeys/dealer-publish.spec.ts` — Login → dashboard → nuevo → fotos → datos → publicar
3. `tests/e2e/journeys/dealer-subscription.spec.ts` — Dashboard → suscripción → cambiar plan
4. `tests/e2e/journeys/buyer-favorite.spec.ts` — Ver ficha → favorito → perfil → favoritos
5. `tests/e2e/journeys/admin-approve.spec.ts` — Admin → pendientes → aprobar/rechazar

(Los journeys 6-8: blog, WhatsApp, subasta — requieren setup más complejo, para fase posterior)

### Tests mínimos de la sesión

- [ ] DAST workflow se ejecuta sin errores (workflow_dispatch manual, baseline)
- [ ] ZAP genera informe HTML descargable en artefactos
- [ ] Nuclei genera informe JSON/MD descargable en artefactos
- [ ] SSL check reporta TLS 1.2+ y certificado válido
- [ ] Si hay findings High/Critical, se envía email de alerta
- [ ] Tests de information-leakage pasan (no se exponen .env, .git, stack traces)
- [ ] Tests de auth-endpoints siguen pasando (no se rompió nada)
- [ ] `.zap/rules.tsv` tiene documentados los falsos positivos conocidos
- [ ] Build compila sin errores

---

## SESIÓN 52 — Rendimiento: Lighthouse CI + Web Vitals

> **Objetivo:** Subir dimensión 5 (UX/Rendimiento) con datos reales
> **Estimación:** 1-2 horas Claude Code
> **Dependencias:** Ninguna

### Parte A — Lighthouse CI en workflow

**Crear `.github/workflows/lighthouse.yml`:**

```yaml
name: Lighthouse CI
on:
  schedule:
    - cron: '0 6 * * 0' # Domingos 06:00 UTC
  workflow_dispatch: {}

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install -g @lhci/cli
      - run: lhci autorun
        env:
          LHCI_BUILD_CONTEXT__CURRENT_HASH: ${{ github.sha }}
```

**Configurar `.lighthouserc.js`** (el que ya existe) para las 5 rutas críticas:

- `/` (home)
- `/vehiculo/ejemplo-slug` (ficha vehículo — necesita URL real o seed)
- `/noticias` (listado)
- `/dashboard` (panel dealer — requiere auth, puede omitirse inicialmente)
- `/subastas` (listado)

**Thresholds:**

```javascript
assert: {
  assertions: {
    'categories:performance': ['error', { minScore: 0.8 }],
    'categories:accessibility': ['error', { minScore: 0.9 }],
    'categories:best-practices': ['error', { minScore: 0.9 }],
    'categories:seo': ['error', { minScore: 0.9 }],
  }
}
```

### Parte B — Web Vitals reporting

**Verificar si `web-vitals` (ya en dependencies) envía datos a algún sitio.**

Si no, crear `app/plugins/web-vitals.client.ts`:

```typescript
// Enviar Core Web Vitals a Google Analytics o a un endpoint propio
import { onCLS, onINP, onLCP } from 'web-vitals'

export default defineNuxtPlugin(() => {
  if (process.env.NODE_ENV !== 'production') return

  const sendToAnalytics = (metric) => {
    // Enviar a GA4 o a /api/infra/vitals
  }

  onCLS(sendToAnalytics)
  onINP(sendToAnalytics)
  onLCP(sendToAnalytics)
})
```

### Parte C — Accesibilidad

**Añadir `axe-core` como devDependency** y crear test de accesibilidad básico:

```typescript
// tests/e2e/accessibility.spec.ts
import AxeBuilder from '@axe-core/playwright'

test('Home page should not have accessibility violations', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
```

### Tests mínimos de la sesión

- [ ] DAST workflow se ejecuta sin errores (workflow_dispatch manual, baseline)
- [ ] ZAP genera informe HTML descargable en artefactos
- [ ] Nuclei genera informe JSON/MD descargable en artefactos
- [ ] SSL check reporta TLS 1.2+ y certificado válido
- [ ] Si hay findings High/Critical, se envía email de alerta
- [ ] Tests de information-leakage pasan (no se exponen .env, .git, stack traces)
- [ ] Tests de auth-endpoints siguen pasando (no se rompió nada)
- [ ] `.zap/rules.tsv` tiene documentados los falsos positivos conocidos
- [ ] Build compila sin errores

---

## SESIÓN 53 — Base de datos: integridad, esquema, archivado

> **Objetivo:** Subir dimensión 3 a ~90+ con scripts de verificación
> **Estimación:** 2-3 horas Claude Code
> **Dependencias:** Sesión 47A (columna vertical en vehicles)

### Parte A — Script de integridad de datos

**Crear `scripts/db-integrity-check.mjs`:**

Queries de verificación (ejecutar con Supabase Management API o pg directa):

```sql
-- Vehículos con dealer_id inexistente
SELECT v.id FROM vehicles v LEFT JOIN dealers d ON v.dealer_id = d.id WHERE d.id IS NULL;

-- Subastas cerradas sin resolución
SELECT id FROM auctions WHERE status = 'closed' AND winner_id IS NULL AND end_date < NOW();

-- Usuarios con roles inconsistentes
SELECT u.id FROM users u LEFT JOIN dealers d ON u.id = d.user_id WHERE u.role = 'dealer' AND d.id IS NULL;

-- Vehículos sin vertical (después de migración 63)
SELECT id FROM vehicles WHERE vertical IS NULL OR vertical = '';

-- Contenido sin traducir (articles con title_en vacío)
SELECT id, title_es FROM articles WHERE (title_en IS NULL OR title_en = '') AND status = 'published';

-- Datos de test en producción
SELECT id, email FROM users WHERE email LIKE '%@example.com' OR email LIKE '%test%';
SELECT id FROM vehicles WHERE price < 100 AND status = 'active';
```

**Integrar en `daily-audit.yml`** como job adicional (o semanal).

### Parte B — ERD del esquema actual

**Crear `docs/tracciona-docs/referencia/ERD.md`:**

Generar diagrama Mermaid del esquema actual basándose en las 62+ migraciones:

```mermaid
erDiagram
    users ||--o{ dealers : "has"
    dealers ||--o{ vehicles : "owns"
    vehicles ||--o{ vehicle_images : "has"
    vehicles ||--o{ auction_bids : "receives"
    dealers ||--o{ subscriptions : "has"
    ...etc
```

Incluir todas las tablas con sus relaciones FK, columnas clave, y notas sobre RLS.

### Parte C — Política de archivado

**Crear `docs/tracciona-docs/referencia/DATA-RETENTION.md`:**

- Vehículos vendidos: mantener 2 años para histórico de precios, luego archivar
- Logs de actividad: mantener 6 meses activos, archivar 2 años
- Sesiones expiradas: purgar tras 30 días
- Datos de usuario eliminado: anonimizar según GDPR (30 días tras solicitud)

### Parte D — Monitorización de queries lentas

**Crear endpoint `server/api/infra/slow-queries.get.ts`:**

- Consulta `pg_stat_statements` (si disponible en Supabase Pro)
- Devuelve top 10 queries más lentas
- Solo accesible para admin con CRON_SECRET

### Tests mínimos de la sesión

- [ ] DAST workflow se ejecuta sin errores (workflow_dispatch manual, baseline)
- [ ] ZAP genera informe HTML descargable en artefactos
- [ ] Nuclei genera informe JSON/MD descargable en artefactos
- [ ] SSL check reporta TLS 1.2+ y certificado válido
- [ ] Si hay findings High/Critical, se envía email de alerta
- [ ] Tests de information-leakage pasan (no se exponen .env, .git, stack traces)
- [ ] Tests de auth-endpoints siguen pasando (no se rompió nada)
- [ ] `.zap/rules.tsv` tiene documentados los falsos positivos conocidos
- [ ] Build compila sin errores

---

## SESIÓN 54 — Documentación: CHANGELOG, onboarding, docs vivos

> **Objetivo:** Subir dimensión 8 a ~95+
> **Estimación:** 2 horas Claude Code
> **Dependencias:** Ninguna

### Parte A — CHANGELOG.md actualizado

**Crear/actualizar `CHANGELOG.md`** en raíz del proyecto:

- Formato: Keep a Changelog (https://keepachangelog.com)
- Retroactivamente documentar las sesiones más importantes como "releases"
- Desde sesión 1 hasta la actual

### Parte B — ESTADO-REAL-PRODUCTO.md regenerado

**Ejecutar `scripts/generate-estado-real.sh`** y verificar que refleja el estado actual.
Si el script está desactualizado, actualizarlo para incluir:

- Conteo de endpoints, composables, componentes, tests
- Estado de cada feature (implementado / stub / planificado)
- Versiones de dependencias clave

### Parte C — Documentación de crons

**Crear `docs/tracciona-docs/referencia/CRON-JOBS.md`:**

| Cron endpoint               | Qué hace                  | Frecuencia | Quién lo llama | Configurado |
| --------------------------- | ------------------------- | ---------- | -------------- | ----------- |
| `/api/cron/freshness-check` | Marca vehículos inactivos | Diario     | ¿?             | ¿?          |
| `/api/cron/search-alerts`   | Envía alertas de búsqueda | Diario     | ¿?             | ¿?          |
| ... (12 crons)              | ...                       | ...        | ...            | ...         |

**Problema detectado:** Los 12 cron endpoints existen pero no hay scheduler documentado. ¿Se llaman desde cron-job.org? ¿Cloudflare Workers Cron Triggers? ¿GitHub Actions? Documentar y si no están configurados, configurarlos.

### Parte D — Marcadores de docs históricos

**Revisar los 25 anexos (A-Y):** ¿alguno es obsoleto? Si sí, añadir banner:

```markdown
> ⚠️ **DOCUMENTO HISTÓRICO** — Este documento refleja decisiones de [fecha].
> Puede no reflejar el estado actual del proyecto. Consultar INSTRUCCIONES-MAESTRAS.md para la versión vigente.
```

### Tests mínimos de la sesión

- [ ] DAST workflow se ejecuta sin errores (workflow_dispatch manual, baseline)
- [ ] ZAP genera informe HTML descargable en artefactos
- [ ] Nuclei genera informe JSON/MD descargable en artefactos
- [ ] SSL check reporta TLS 1.2+ y certificado válido
- [ ] Si hay findings High/Critical, se envía email de alerta
- [ ] Tests de information-leakage pasan (no se exponen .env, .git, stack traces)
- [ ] Tests de auth-endpoints siguen pasando (no se rompió nada)
- [ ] `.zap/rules.tsv` tiene documentados los falsos positivos conocidos
- [ ] Build compila sin errores

---

## SESIÓN 55 — Resiliencia: test de restore + mirror + DR drill

> **Objetivo:** Subir dimensión 11 a ~90+
> **Estimación:** 1-2 horas Claude Code
> **Dependencias:** Backups funcionando (sesión 45B ✅)

### ⚠️ PRERREQUISITOS (los fundadores deben completar ANTES de ejecutar esta sesión)

**1. Crear cuenta en Neon (https://neon.tech) — plan free**

- Registrarse con email
- Crear un proyecto temporal (nombre: `tracciona-restore-test`)
- Copiar la connection string (`postgres://...@...neon.tech/...`)
- Añadir como GitHub Secret: `Settings → Secrets → Actions → New secret`:
  - Nombre: `TEST_RESTORE_DB_URL`
  - Valor: la connection string de Neon
- **Nota:** Tras verificar el restore, se puede borrar el proyecto en Neon para liberar recursos. Claude Code NO puede crear esta cuenta ni el secret — requiere intervención humana.

**2. Crear cuenta en Bitbucket (si no existe) — para Parte B (mirror)**

- Registrarse en https://bitbucket.org
- Crear repo privado: `tracciona/tracciona`
- Generar App Password: `Settings → Personal → App passwords → Create` (permisos: repo write)
- Añadir como GitHub Secrets:
  - `BITBUCKET_USER`: tu username de Bitbucket
  - `BITBUCKET_TOKEN`: el App Password generado
- **Nota:** Si preferís no usar Bitbucket, se puede usar GitLab como alternativa. Esta parte es opcional pero recomendada.

**3. Verificar que UptimeRobot está configurado (DOC2, tarea #4)**

- Si no se ha hecho, configurar ahora: https://uptimerobot.com
- Monitores: `https://tracciona.com` + `https://tracciona.com/api/health`
- Alertas a email de ambos fundadores
- **Nota:** Esto es independiente de Claude Code pero esta sesión asume que ya hay monitorización externa activa.

**4. Verificar que la marca está registrada en OEPM (DOC2, tarea #1)**

- No bloquea esta sesión, pero es un recordatorio de prioridad: cada semana sin registro es riesgo.

---

### Parte A — Script de test de restore automatizado

**Crear `scripts/test-restore.sh`:**

1. Descargar último backup daily de B2
2. Descifrar con openssl
3. Restaurar en BD temporal usando `TEST_RESTORE_DB_URL` (secret de GitHub, proporcionado por los fundadores — ver prerrequisitos)
4. Ejecutar queries de verificación: conteo de tablas clave (users, dealers, vehicles, subscriptions)
5. Comparar conteos con producción
6. Documentar resultado
7. Limpiar BD temporal (DROP tables o borrar proyecto Neon tras verificación)

**Añadir como job manual en `backup.yml`** (solo workflow_dispatch, no scheduled).

**Si `TEST_RESTORE_DB_URL` no está configurado como secret, el script debe:**

- Detectar la ausencia de la variable
- Mostrar mensaje claro: "⚠️ TEST_RESTORE_DB_URL not configured. Founders must create a Neon free account and add the connection string as a GitHub Secret. See DOC2 task #10."
- Salir con código 0 (no romper el workflow, solo avisar)

### Parte B — Mirror del repo

**Crear `.github/workflows/mirror.yml`:**

```yaml
name: Mirror to Bitbucket
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 3 * * 0' # Semanal
jobs:
  mirror:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - run: |
          git remote add mirror https://${{ secrets.BITBUCKET_USER }}:${{ secrets.BITBUCKET_TOKEN }}@bitbucket.org/tracciona/tracciona.git
          git push mirror --all --force
          git push mirror --tags --force
```

### Parte C — Dependencias de terceros documentadas

**Crear `docs/tracciona-docs/referencia/THIRD-PARTY-DEPENDENCIES.md`:**

| Servicio         | Para qué            | Plan B                                      | Tiempo migración |
| ---------------- | ------------------- | ------------------------------------------- | ---------------- |
| Supabase         | BD + Auth + Storage | PostgreSQL gestionado + Auth0               | 2-4 semanas      |
| Cloudflare Pages | Deploy + CDN        | Vercel / Netlify                            | 1-2 días         |
| Stripe           | Pagos               | Paddle / LemonSqueezy                       | 1-2 semanas      |
| Anthropic        | IA                  | OpenAI (ya configurado como fallback)       | 0 (automático)   |
| Cloudinary       | Imágenes            | CF Images (ya configurado como alternativa) | 1-2 días         |
| Resend           | Email               | SendGrid / Mailgun                          | 1 día            |
| GitHub           | Repo + CI/CD        | GitLab / Bitbucket                          | 1-2 días         |
| Backblaze B2     | Backups             | AWS S3 / Wasabi                             | 1 hora           |

### Tests mínimos de la sesión

- [ ] DAST workflow se ejecuta sin errores (workflow_dispatch manual, baseline)
- [ ] ZAP genera informe HTML descargable en artefactos
- [ ] Nuclei genera informe JSON/MD descargable en artefactos
- [ ] SSL check reporta TLS 1.2+ y certificado válido
- [ ] Si hay findings High/Critical, se envía email de alerta
- [ ] Tests de information-leakage pasan (no se exponen .env, .git, stack traces)
- [ ] Tests de auth-endpoints siguen pasando (no se rompió nada)
- [ ] `.zap/rules.tsv` tiene documentados los falsos positivos conocidos
- [ ] Build compila sin errores

---

## SESIÓN 56 — Escalabilidad: event bus + feature flags

> **Objetivo:** Preparar arquitectura para escalar sin reescribir
> **Estimación:** 3-4 horas Claude Code
> **Dependencias:** Sesión 48 (modularización completada)

### Parte A — Event bus simple con Nitro hooks

**Crear `server/utils/eventBus.ts`:**

```typescript
type EventHandler = (payload: unknown) => Promise<void> | void
const handlers: Map<string, EventHandler[]> = new Map()

export function on(event: string, handler: EventHandler) { ... }
export function emit(event: string, payload: unknown) { ... }
```

**Eventos iniciales:**

- `vehicle:created` → generar posts sociales, actualizar market report, notificar búsquedas
- `vehicle:sold` → notificar favoritos, actualizar stats
- `dealer:registered` → enviar email bienvenida, crear onboarding
- `subscription:changed` → actualizar límites, notificar

**Registrar listeners en `server/plugins/events.ts`** (Nitro plugin).

### Parte B — Feature flags

**Crear migración `00064_feature_flags.sql`:**

```sql
CREATE TABLE IF NOT EXISTS feature_flags (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  description text,
  percentage integer DEFAULT 100,  -- rollout percentage
  allowed_dealers text[],          -- specific dealers (NULL = all)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed initial flags
INSERT INTO feature_flags (key, enabled, description) VALUES
  ('whatsapp_flow', true, 'WhatsApp submission processing'),
  ('auctions', false, 'Live auctions feature'),
  ('social_posts_ai', false, 'AI-generated social media posts'),
  ('market_intelligence', false, 'Market price comparisons for dealers'),
  ('dgt_reports', false, 'DGT vehicle reports (paid)'),
  ('featured_boost', false, 'Paid vehicle boost/highlight');
```

**Crear `server/utils/featureFlags.ts`:**

```typescript
export async function isFeatureEnabled(key: string, dealerId?: string): Promise<boolean> { ... }
```

**Crear composable `app/composables/useFeatureFlags.ts`:**

```typescript
export function useFeatureFlag(key: string): Ref<boolean> { ... }
```

### Parte C — Multi-tenant verification script

**Crear `scripts/verify-multi-tenant.sh`:**

- Grep por strings hardcodeados: "tracciona", "Tracciona", categorías en español
- Verificar que todo pasa por `vertical_config`, `getSiteName()`, `getSiteUrl()`
- Verificar que i18n no tiene textos hardcoded de Tracciona (salvo defaults)
- Output: lista de archivos con posibles hardcodes a revisar

### Tests mínimos de la sesión

- [ ] DAST workflow se ejecuta sin errores (workflow_dispatch manual, baseline)
- [ ] ZAP genera informe HTML descargable en artefactos
- [ ] Nuclei genera informe JSON/MD descargable en artefactos
- [ ] SSL check reporta TLS 1.2+ y certificado válido
- [ ] Si hay findings High/Critical, se envía email de alerta
- [ ] Tests de information-leakage pasan (no se exponen .env, .git, stack traces)
- [ ] Tests de auth-endpoints siguen pasando (no se rompió nada)
- [ ] `.zap/rules.tsv` tiene documentados los falsos positivos conocidos
- [ ] Build compila sin errores

---

## SESIÓN 57 — Producto: demo mode + widget embebible

> **Objetivo:** Reducir fricción de onboarding y ampliar canales de distribución
> **Estimación:** 4-5 horas Claude Code
> **Dependencias:** Sesiones 47-48 completadas

### Parte A — Demo mode para dealers

**Crear endpoint `server/api/demo/try-vehicle.post.ts`:**

- Acepta: 1-4 imágenes + texto básico (marca, modelo)
- No requiere autenticación
- Usa `callAI('background', 'vision')` para analizar
- Devuelve: preview del listing generado (título, descripción, categoría, fotos procesadas)
- NO guarda nada en BD
- Rate limited: 3 intentos por IP por día

**Crear página `app/pages/demo.vue`:**

- Formulario simple: drag-and-drop de fotos + campos marca/modelo
- Muestra preview del resultado en tiempo real
- CTA: "¿Te gusta? Regístrate gratis y publica tu primer vehículo"
- Alternativa: "¿Prefieres WhatsApp? Envía las fotos al +34 XXX XXX XXX"

### Parte B — Widget embebible

**Completar `server/api/widget/dealer/[dealerId].get.ts`:**

- Devuelve HTML/JS embedable con los vehículos activos del dealer
- Personalizable: tema claro/oscuro, número de vehículos, layout (grid/lista)
- Incluye link "Powered by Tracciona" (backlink SEO)

**Crear página `app/pages/widget.vue`:**

- Generador de widget: el dealer elige opciones y copia el snippet
- Preview en tiempo real

### Parte C — Importador de stock (con consentimiento)

**Crear `server/api/dealer/import-stock.post.ts`:**

- Acepta: URL del perfil público del dealer en Mascus/MachineryZone
- Scrape con consentimiento explícito del dealer
- Crea drafts (status: 'draft') que el dealer revisa y publica
- Usa `callAI` para enriquecer las descripciones

**Nota:** Esto es diferente del scraping de competidores (eliminado en sesión 44). Aquí el dealer solicita importar SU PROPIO stock desde otra plataforma.

### Tests mínimos de la sesión

- [ ] DAST workflow se ejecuta sin errores (workflow_dispatch manual, baseline)
- [ ] ZAP genera informe HTML descargable en artefactos
- [ ] Nuclei genera informe JSON/MD descargable en artefactos
- [ ] SSL check reporta TLS 1.2+ y certificado válido
- [ ] Si hay findings High/Critical, se envía email de alerta
- [ ] Tests de information-leakage pasan (no se exponen .env, .git, stack traces)
- [ ] Tests de auth-endpoints siguen pasando (no se rompió nada)
- [ ] `.zap/rules.tsv` tiene documentados los falsos positivos conocidos
- [ ] Build compila sin errores

---

## SESIÓN 58 — Producto: Market Intelligence + Comparador de precios

> **Objetivo:** Crear herramientas de valor que atraigan tráfico y retengan dealers
> **Estimación:** 3-4 horas Claude Code
> **Dependencias:** Datos en BD (al menos Tank Ibérica como dealer)

### Parte A — Market Intelligence para dealers

**Ampliar `server/services/marketReport.ts`:**

- Para cada vehículo del dealer, calcular: precio medio de mercado, posición del precio del dealer, días medio en venta para vehículos similares
- Generar informe mensual por dealer

**Crear composable `app/composables/useMarketIntelligence.ts`:**

- Datos del dealer vs mercado
- Gráficos de tendencia de precios por categoría

**Integrar en dashboard del dealer:**

- Card "Tu stock vs mercado" con indicadores verde/amarillo/rojo
- Sugerencias: "Tu Scania R450 está un 12% por encima del mercado. Considera ajustar el precio."

### Parte B — Comparador público de precios (Kelley Blue Book de industriales)

**Completar `app/pages/valoracion.vue`:**

- Input: marca, modelo, año, km, categoría
- Output: rango de precio estimado basado en datos agregados del catálogo + histórico
- Mostrar gráfico de distribución de precios
- CTA: "¿Quieres vender al mejor precio? Publica gratis en Tracciona"

**Crear `server/api/market/valuation.get.ts`:**

- Query agregada: avg, min, max, p25, p75 de vehículos similares
- Cache con SWR (datos cambian lento)

### Parte C — Contenido editorial automatizado

**Crear `server/api/cron/generate-editorial.post.ts`:**

- Semanal: genera 2 borradores de artículos con Claude
- Temas basados en: tendencias de búsqueda, nuevos vehículos, normativa, guías de compra
- Status: 'draft' — requiere revisión humana antes de publicar
- Protegido con CRON_SECRET

### Tests mínimos de la sesión

- [ ] DAST workflow se ejecuta sin errores (workflow_dispatch manual, baseline)
- [ ] ZAP genera informe HTML descargable en artefactos
- [ ] Nuclei genera informe JSON/MD descargable en artefactos
- [ ] SSL check reporta TLS 1.2+ y certificado válido
- [ ] Si hay findings High/Critical, se envía email de alerta
- [ ] Tests de information-leakage pasan (no se exponen .env, .git, stack traces)
- [ ] Tests de auth-endpoints siguen pasando (no se rompió nada)
- [ ] `.zap/rules.tsv` tiene documentados los falsos positivos conocidos
- [ ] Build compila sin errores

---

## SESIÓN 59 — CSP avanzado + auditoría de licencias

> **Objetivo:** Seguridad avanzada para acercarse al 100/100
> **Estimación:** 2-3 horas Claude Code
> **Dependencias:** Nuxt 4 estable

### Parte A — Investigar nonce-based CSP

**Investigar si Nuxt 4 ya soporta nonce-based CSP nativo:**

- Si sí: implementar para eliminar `unsafe-inline` en script-src
- Si no: documentar la limitación y configurar report-uri para CSP violations
- `unsafe-eval` (Chart.js) puede mitigarse con Chart.js v5 o lazy loading solo en admin

### Parte B — CSP violation reporting

**Crear `server/api/infra/csp-report.post.ts`:**

- Recibe reportes de CSP violations
- Log en Sentry o en tabla de BD
- Permite detectar intentos de XSS reales

**Añadir a security-headers.ts:**

```typescript
// report-uri directive
'report-uri /api/infra/csp-report'
```

### Parte C — Auditoría de licencias npm

**Crear script `scripts/audit-licenses.mjs`:**

- Ejecuta `npx license-checker --json --production`
- Identifica dependencias con licencias copyleft (GPL, AGPL)
- Genera reporte
- Integrar en daily-audit.yml

### Parte D — API pública documentada

**Crear `docs/tracciona-docs/referencia/API-PUBLIC.md`:**

- Documentar endpoints públicos existentes en formato OpenAPI-like
- `/api/v1/` — qué endpoints hay, qué aceptan, qué devuelven
- Preparación para futuras integraciones de ERPs de dealers

### Tests mínimos de la sesión

- [ ] DAST workflow se ejecuta sin errores (workflow_dispatch manual, baseline)
- [ ] ZAP genera informe HTML descargable en artefactos
- [ ] Nuclei genera informe JSON/MD descargable en artefactos
- [ ] SSL check reporta TLS 1.2+ y certificado válido
- [ ] Si hay findings High/Critical, se envía email de alerta
- [ ] Tests de information-leakage pasan (no se exponen .env, .git, stack traces)
- [ ] Tests de auth-endpoints siguen pasando (no se rompió nada)
- [ ] `.zap/rules.tsv` tiene documentados los falsos positivos conocidos
- [ ] Build compila sin errores

---

## SESIÓN 60 — Nonce-based CSP (si viable) + PWA verification

> **Objetivo:** Eliminar unsafe-inline si Nuxt 4 lo permite
> **Estimación:** 2 horas Claude Code
> **Dependencias:** Sesión 59A (investigación)

### Parte A — Implementar nonce-based CSP (si viable)

Si la investigación de sesión 59A confirma que Nuxt 4 soporta nonces:

- Configurar `useRuntimeConfig().security.nonce` o equivalente
- Actualizar `security-headers.ts` para inyectar nonce dinámico
- Eliminar `unsafe-inline` de script-src
- Verificar que hydration funciona

### Parte B — PWA verification

- Verificar que `/icon-192x192.png` y `/icon-512x512.png` existen en `/public`
- Verificar installability con Lighthouse
- Verificar comportamiento offline con datos reales
- Verificar que el service worker cachea correctamente

### Tests mínimos de la sesión

- [ ] DAST workflow se ejecuta sin errores (workflow_dispatch manual, baseline)
- [ ] ZAP genera informe HTML descargable en artefactos
- [ ] Nuclei genera informe JSON/MD descargable en artefactos
- [ ] SSL check reporta TLS 1.2+ y certificado válido
- [ ] Si hay findings High/Critical, se envía email de alerta
- [ ] Tests de information-leakage pasan (no se exponen .env, .git, stack traces)
- [ ] Tests de auth-endpoints siguen pasando (no se rompió nada)
- [ ] `.zap/rules.tsv` tiene documentados los falsos positivos conocidos
- [ ] Build compila sin errores

---

## SESIÓN 61 — SEO Quick Wins: meta tags, sitemap, robots, OG, breadcrumbs

> **Objetivo:** Cubrir los fundamentos SEO técnicos que más impactan posicionamiento
> **Estimación:** 2-3 horas Claude Code
> **Dependencias:** Ninguna
> **Referencia:** CHECKLIST-SEO-UX-TECNICO.md — secciones 3, 4, 5, 6

### Parte A — Sitemap XML dinámico

**Verificar si `/sitemap.xml` existe y es dinámico.** Si no:

1. Instalar `@nuxtjs/sitemap` (o usar `nuxt-simple-sitemap`)
2. Configurar en `nuxt.config.ts`:
   - Incluir todas las rutas públicas: `/`, `/vehiculos`, `/vehiculos/[slug]`, `/dealers`, `/dealers/[slug]`, páginas legales, blog (cuando exista)
   - Excluir: `/admin/*`, `/api/*`, `/auth/*`
   - URLs dinámicas: generar desde BD (vehículos activos, dealers públicos)
   - Frecuencia de actualización: vehículos `weekly`, home `daily`, legales `monthly`
3. Verificar que se regenera automáticamente en cada deploy
4. Registrar en Google Search Console (fundadores — DOC2)

### Parte B — robots.txt

**Verificar/crear `/public/robots.txt`:**

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /auth/
Disallow: /dashboard/
Sitemap: https://tracciona.com/sitemap.xml
```

**Verificar que no bloquea:** CSS, JS, imágenes (Google necesita renderizar la página).

### Parte C — Meta tags únicos por página

**Auditar y corregir `useSeoMeta()` / `useHead()` en cada layout y página:**

1. **Home:** title "Tracciona — Marketplace de vehículos industriales" + description
2. **Listado vehículos:** title "Camiones y vehículos industriales en venta — Tracciona" + description con filtros activos
3. **Detalle vehículo:** title "[Marca] [Modelo] [Año] — Tracciona" + description generada por IA
4. **Detalle dealer:** title "[Nombre dealer] — Vehículos industriales — Tracciona"
5. **Páginas legales:** titles específicos
6. **404:** title "Página no encontrada — Tracciona"

**Cada página debe tener:**

- `<title>` único (50-60 chars)
- `<meta name="description">` único (120-160 chars)
- `<link rel="canonical">` apuntando a URL limpia
- NO títulos duplicados entre páginas

### Parte D — Open Graph + Twitter Cards

**Configurar en `useSeoMeta()` para cada tipo de página:**

```typescript
// Ejemplo para detalle de vehículo
useSeoMeta({
  ogTitle: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
  ogDescription: vehicle.aiDescription?.substring(0, 160),
  ogImage: vehicle.images?.[0]?.url,
  ogType: 'product',
  ogUrl: `https://tracciona.com/vehiculos/${vehicle.slug}`,
  ogLocale: 'es_ES',
  ogLocaleAlternate: ['en_GB'],
  ogSiteName: 'Tracciona',
  twitterCard: 'summary_large_image',
  twitterTitle: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
  twitterDescription: vehicle.aiDescription?.substring(0, 160),
  twitterImage: vehicle.images?.[0]?.url,
})
```

**Verificar con:** https://developers.facebook.com/tools/debug/ y https://cards-dev.twitter.com/validator

### Parte E — Hreflang tags

**Configurar alternates para i18n:**

```html
<link rel="alternate" hreflang="es" href="https://tracciona.com/vehiculos/camion-xyz" />
<link rel="alternate" hreflang="en" href="https://tracciona.com/en/vehicles/truck-xyz" />
<link rel="alternate" hreflang="x-default" href="https://tracciona.com/vehiculos/camion-xyz" />
```

Verificar que `@nuxtjs/i18n` genera esto automáticamente. Si no, configurar en `i18n` options de nuxt.config.

### Parte F — Canonical tags

**Verificar que cada página tiene canonical:**

- Detalle vehículo: canonical = URL limpia sin parámetros de tracking
- Listado con filtros: canonical = URL sin filtros (o con filtros si son páginas indexables)
- Paginación: canonical de cada página a sí misma, NO a la primera página

### Parte G — Breadcrumbs

**Crear componente `components/ui/Breadcrumbs.vue`:**

```
Home > Vehículos > Camiones > Mercedes-Benz > Actros 1845
Home > Dealers > Mesplet Trucks
Home > Blog > Título del artículo
```

- Schema.org BreadcrumbList (JSON-LD)
- Responsive: en móvil, truncar niveles intermedios con `...`
- Integrar en layouts de detalle de vehículo, dealer, y futuro blog

### Tests mínimos de la sesión

- [ ] DAST workflow se ejecuta sin errores (workflow_dispatch manual, baseline)
- [ ] ZAP genera informe HTML descargable en artefactos
- [ ] Nuclei genera informe JSON/MD descargable en artefactos
- [ ] SSL check reporta TLS 1.2+ y certificado válido
- [ ] Si hay findings High/Critical, se envía email de alerta
- [ ] Tests de information-leakage pasan (no se exponen .env, .git, stack traces)
- [ ] Tests de auth-endpoints siguen pasando (no se rompió nada)
- [ ] `.zap/rules.tsv` tiene documentados los falsos positivos conocidos
- [ ] Build compila sin errores

---

## SESIÓN 62 — Página 404, error pages, y auditoría semántica

> **Objetivo:** Gestión correcta de errores + HTML semántico + accesibilidad básica
> **Estimación:** 2 horas Claude Code
> **Dependencias:** Ninguna
> **Referencia:** CHECKLIST-SEO-UX-TECNICO.md — secciones 1.3, 5, 7

### Parte A — Página 404 personalizada

**Crear `error.vue` (Nuxt error page):**

Debe incluir:

1. Branding Tracciona (logo, colores)
2. Mensaje amigable bilingüe: "Esta página no existe o se ha movido"
3. Buscador de vehículos inline
4. Enlaces sugeridos: vehículos populares, categorías principales, contacto
5. CTA: "Volver al inicio" / "Buscar vehículos"
6. HTTP status 404 correcto (no soft 404)
7. Meta noindex para que Google no indexe la 404

**Diferenciación por tipo:**

- Si URL parece un vehículo eliminado: "Este vehículo ya no está disponible. Mira vehículos similares:"
- Si URL parece dealer: "Este dealer ya no está activo."
- Otros: mensaje genérico

### Parte B — Páginas de error 500/503

**Crear error handling para errores del servidor:**

- Error 500: "Algo salió mal. Estamos trabajando en ello."
- Error 503: "Tracciona está en mantenimiento. Volvemos enseguida."
- Con branding, sin información técnica al usuario
- Log del error real en servidor/Sentry

### Parte C — Redirecciones 301

**Crear `server/middleware/redirects.ts`:**

- Mapa de redirecciones para URLs que cambien de estructura
- Patrón: si se renombra `/vehiculos/[id]` a `/vehiculos/[slug]`, redirigir con 301
- Incluir redirección www → non-www (verificar que Cloudflare lo hace)
- Log de 404s frecuentes para identificar URLs que necesitan redirección

### Parte D — Auditoría de HTML semántico

**Verificar y corregir estructura semántica en layouts:**

```html
<!-- Estructura esperada -->
<header>
  <!-- Nav principal -->
  <nav>
    <!-- Menú -->
    <main>
      <!-- Contenido principal (uno por página) -->
      <article>
        <!-- En páginas de detalle -->
        <section>
          <!-- Agrupaciones lógicas -->
          <aside>
            <!-- Sidebars, filtros -->
            <footer><!-- Pie de página --></footer>
          </aside>
        </section>
      </article>
    </main>
  </nav>
</header>
```

**Verificar:**

- Solo un `<h1>` por página
- Jerarquía H1 > H2 > H3 sin saltos
- `<nav>` en menú principal y breadcrumbs
- `<main>` envolviendo contenido principal
- `<article>` en fichas de vehículo y entradas de blog
- Labels en todos los `<input>` y `<select>`

### Parte E — Skip to content + focus management

**Añadir al layout principal:**

```html
<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute ...">
  Saltar al contenido
</a>
<!-- ... header/nav ... -->
<main id="main-content"></main>
```

**Verificar focus rings:** Tailwind `ring` classes visibles en todos los elementos interactivos.

### Parte F — Alt text audit

**Script de auditoría: buscar todas las `<img>` y `<NuxtImg>` sin alt:**

```bash
grep -rn '<img\|<NuxtImg\|<nuxt-img' components/ pages/ --include="*.vue" | grep -v 'alt='
```

**Corregir:** Añadir alt descriptivo. Para imágenes de vehículos: `alt="${brand} ${model} ${year} - vista ${index}"`. Para iconos decorativos: `alt=""` + `aria-hidden="true"`.

### Tests mínimos de la sesión

- [ ] DAST workflow se ejecuta sin errores (workflow_dispatch manual, baseline)
- [ ] ZAP genera informe HTML descargable en artefactos
- [ ] Nuclei genera informe JSON/MD descargable en artefactos
- [ ] SSL check reporta TLS 1.2+ y certificado válido
- [ ] Si hay findings High/Critical, se envía email de alerta
- [ ] Tests de information-leakage pasan (no se exponen .env, .git, stack traces)
- [ ] Tests de auth-endpoints siguen pasando (no se rompió nada)
- [ ] `.zap/rules.tsv` tiene documentados los falsos positivos conocidos
- [ ] Build compila sin errores

---

## SESIÓN 63 — Schema.org (datos estructurados) + compartir en redes

> **Objetivo:** Rich snippets en Google + compartibilidad social
> **Estimación:** 2-3 horas Claude Code
> **Dependencias:** Sesión 61 (meta tags y OG deben existir)
> **Referencia:** CHECKLIST-SEO-UX-TECNICO.md — secciones 4.5, 6

### Parte A — Schema.org para vehículos (Product + Vehicle)

**Crear composable `composables/useStructuredData.ts`:**

```typescript
// Para detalle de vehículo
export function useVehicleSchema(vehicle: Vehicle) {
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Vehicle',
          name: `${vehicle.brand} ${vehicle.model}`,
          description: vehicle.aiDescription,
          image: vehicle.images?.map((i) => i.url),
          brand: { '@type': 'Brand', name: vehicle.brand },
          model: vehicle.model,
          vehicleModelDate: vehicle.year?.toString(),
          mileageFromOdometer: vehicle.km
            ? {
                '@type': 'QuantitativeValue',
                value: vehicle.km,
                unitCode: 'KMT',
              }
            : undefined,
          fuelType: vehicle.fuelType,
          offers: {
            '@type': 'Offer',
            price: vehicle.price,
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock',
            seller: {
              '@type': 'Organization',
              name: vehicle.dealer?.name,
            },
          },
        }),
      },
    ],
  })
}
```

### Parte B — Schema.org Organization

**En layout principal o `app.vue`:**

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Tracciona",
  "url": "https://tracciona.com",
  "logo": "https://tracciona.com/logo.png",
  "description": "Marketplace de vehículos industriales con IA",
  "foundingDate": "2024",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": "info@tracciona.com"
  },
  "sameAs": []
}
```

### Parte C — Schema.org BreadcrumbList

**Integrar con componente Breadcrumbs de sesión 61G:**

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://tracciona.com" },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Camiones",
      "item": "https://tracciona.com/vehiculos?type=camion"
    },
    { "@type": "ListItem", "position": 3, "name": "Mercedes-Benz Actros 1845" }
  ]
}
```

### Parte D — Schema.org WebSite (SearchAction)

**Para que Google muestre sitelinks searchbox:**

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "https://tracciona.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://tracciona.com/vehiculos?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

### Parte E — Botones de compartir en redes

**Crear componente `components/ui/ShareButtons.vue`:**

Botones para compartir ficha de vehículo en:

- WhatsApp (prioritario — B2B industrial usa mucho WhatsApp)
- LinkedIn (profesional)
- Email
- Copiar enlace

**Sin SDKs externos** (privacidad): usar URLs de intención directas:

```
WhatsApp: https://wa.me/?text={url}
LinkedIn: https://www.linkedin.com/sharing/share-offsite/?url={url}
Email: mailto:?subject={title}&body={url}
```

### Parte F — Verificación con herramientas

**Añadir a `scripts/seo-check.mjs`:**

1. Validar JSON-LD con Schema.org Validator API
2. Verificar que cada página de vehículo genera schema Vehicle válido
3. Verificar que OG tags existen en cada tipo de página
4. Integrar en daily-audit o CI

### Tests mínimos de la sesión

- [ ] DAST workflow se ejecuta sin errores (workflow_dispatch manual, baseline)
- [ ] ZAP genera informe HTML descargable en artefactos
- [ ] Nuclei genera informe JSON/MD descargable en artefactos
- [ ] SSL check reporta TLS 1.2+ y certificado válido
- [ ] Si hay findings High/Critical, se envía email de alerta
- [ ] Tests de information-leakage pasan (no se exponen .env, .git, stack traces)
- [ ] Tests de auth-endpoints siguen pasando (no se rompió nada)
- [ ] `.zap/rules.tsv` tiene documentados los falsos positivos conocidos
- [ ] Build compila sin errores

---

## SESIÓN 64 — URLs limpias (slugs SEO) + internal linking + SEO audit CI

> **Objetivo:** URLs descriptivas para vehículos + estrategia de enlaces internos + gate SEO automático
> **Estimación:** 2-3 horas Claude Code
> **Dependencias:** Sesión 47 (migración vehicles vertical)
> **Referencia:** CHECKLIST-SEO-UX-TECNICO.md — sección 4.4, 3.5

### Parte A — Slugs SEO para vehículos

**Problema actual:** URLs tipo `/vehiculos/12345` (ID numérico) no son descriptivas.

**Solución:**

1. Migración: añadir columna `slug` a `vehicles`:

```sql
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS slug text UNIQUE;
CREATE INDEX IF NOT EXISTS idx_vehicles_slug ON vehicles(slug);
```

2. Generar slugs automáticamente al crear/actualizar vehículo:

```typescript
// utils/generateSlug.ts
function generateVehicleSlug(v: Vehicle): string {
  const base = [v.brand, v.model, v.year, v.id?.toString().slice(-4)]
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
  return base // e.g. "mercedes-benz-actros-1845-a7f3"
}
```

3. Actualizar rutas Nuxt: `/vehiculos/[slug]` en vez de `/vehiculos/[id]`
4. Redirección 301 de `/vehiculos/[id]` a `/vehiculos/[slug]` para URLs existentes
5. Script para generar slugs a todos los vehículos existentes

### Parte B — Internal linking strategy

**Crear componente `components/vehicle/RelatedVehicles.vue`:**

- Al final de ficha de vehículo: "Vehículos similares" (misma marca, categoría, o rango de precio)
- Query: `vehicles WHERE brand = X AND id != current ORDER BY created_at DESC LIMIT 4`

**Crear componente `components/vehicle/CategoryLinks.vue`:**

- En listado: links a categorías populares ("Camiones Mercedes", "Furgonetas Ford", etc.)
- Mejora crawlability y distribución de PageRank

**En páginas de dealer:**

- Link a todos sus vehículos activos
- Link a vehículos similares de otros dealers (cuidado con UX)

### Parte C — SEO audit automático en CI

**Crear `.github/workflows/seo-audit.yml`:**

```yaml
name: SEO Audit
on:
  push:
    branches: [main]
    paths: ['pages/**', 'components/**', 'layouts/**']
jobs:
  seo:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: node scripts/seo-check.mjs
```

**`scripts/seo-check.mjs` verifica:**

1. Todas las páginas en `pages/` tienen `useSeoMeta()` o `useHead()` con title y description
2. Todas las `<img>` tienen `alt`
3. Solo un `<h1>` por página
4. JSON-LD válido en páginas de detalle
5. No hay `<a>` sin `href`
6. Sitemap incluye todas las rutas públicas

**Output:** Reporte en CI, fail si hay errores críticos (falta title, falta alt en imágenes principales).

### Tests mínimos de la sesión

- [ ] DAST workflow se ejecuta sin errores (workflow_dispatch manual, baseline)
- [ ] ZAP genera informe HTML descargable en artefactos
- [ ] Nuclei genera informe JSON/MD descargable en artefactos
- [ ] SSL check reporta TLS 1.2+ y certificado válido
- [ ] Si hay findings High/Critical, se envía email de alerta
- [ ] Tests de information-leakage pasan (no se exponen .env, .git, stack traces)
- [ ] Tests de auth-endpoints siguen pasando (no se rompió nada)
- [ ] `.zap/rules.tsv` tiene documentados los falsos positivos conocidos
- [ ] Build compila sin errores

---

## NOTAS GENERALES

- **Cada sesión es independiente.** Si Claude Code pierde contexto, el usuario abre un nuevo chat y dice "ejecuta la sesión N" y Claude Code lee este archivo.
- **Verificar después de cada sesión:** `npm run build` debe compilar sin errores.
- **Si algo falla:** No seguir adelante. Corregir primero.
- **Los anexos son referencia, no tareas.** Solo se leen cuando esta guía los indica.
- **No implementar roadmap post-lanzamiento** (pasos 7-9) hasta completar todas las sesiones 1-12.

