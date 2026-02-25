> **DOCUMENTO HISTORICO.** Este documento es referencia del diseno original. La fuente de verdad actual es [`README-PROYECTO.md`](../README-PROYECTO.md) y [`INSTRUCCIONES-MAESTRAS.md`](tracciona-docs/INSTRUCCIONES-MAESTRAS.md).

**TANK IBERICA**

Plataforma de Vehículos Industriales

**Plan de Profesionalización**

Supabase · Nuxt 3 · Cloudflare Pages · Cloudinary

Stack 100% gratuito --- Modular --- Escalable --- Seguro

Basado en auditoría completa de 22 archivos (37.685 líneas totales)

17 hojas de Google Sheets + 2 Apps Script + 6 JS + 4 CSS + 5 docs

Versión 3 --- Febrero 2026

Índice

1\. Resumen Ejecutivo

2\. Inventario Completo del Proyecto

3\. Auditoría de Seguridad

4\. Stack Elegido y Límites Gratuitos

5\. Arquitectura del Sistema

6\. Esquema de Base de Datos (Supabase/PostgreSQL)

7\. API y Row Level Security

8\. Estructura del Proyecto Nuxt 3

9\. Componentes Frontend

10\. Autenticación (Supabase Auth)

11\. Gestión de Imágenes (Cloudinary)

12\. Despliegue en Cloudflare Pages

13\. Herramientas de Calidad

14\. Seguridad Integral

15\. Migración de Datos

16\. Panel Admin

17\. Hoja de Ruta por Fases

18\. Estimación de Esfuerzo y Costes

1\. Resumen Ejecutivo

Este documento define el plan completo para transformar Tank Iberica de un prototipo monolítico a una aplicación web profesional, modular y segura, utilizando exclusivamente herramientas con tier gratuito.

**Estado actual:** 22 archivos con 37.685 líneas de código. 2 monolitos HTML con CSS+JS embebido (21.646 líneas), 6 archivos JS externos (2.638 líneas), 4 hojas CSS (12.268 líneas, con duplicación masiva), 2 Apps Scripts con sistemas de auth incompatibles, 17 hojas de Google Sheets como base de datos, credenciales expuestas en 9 archivos, 163 vectores XSS (innerHTML), 221 console.log en producción, sin tests, sin CI/CD.

**Estado objetivo:** SPA modular con \~35 componentes Vue, backend PostgreSQL con Row Level Security, autenticación server-side segura, imágenes optimizadas por CDN, despliegue automático, TypeScript, testing completo, y cero credenciales expuestas.

2\. Inventario Completo del Proyecto

2.1 Archivos del Proyecto (22 archivos)

---

**Archivo** **Líneas** **Descripción y Problemas**

index.html 12.787 Web pública principal. Monolito con CSS+HTML+JS embebido. Carga 4 JS externos.

admin.html 8.859 Panel admin. Monolito independiente con CSS+JS embebido. Carga Chart.js, jsPDF, xlsx.

auth-system.js 777 Sistema de auth actual: email+contraseña. Genera modal dinámicamente. Textos bilingües.

user-panel-functions.js 522 Funciones del panel Mi Cuenta: chat, favoritos, suscripciones, eliminación de cuenta.

admin-users.js 470 Gestión de usuarios desde admin. CRUD, filtros, exportación CSV. URL Apps Script diferente.

main.js 465 Core del frontend: carga datos Sheets, filtros, renderizado. Duplica CONFIG de google-sheets-api.js.

google-sheets-api.js 213 Wrapper de Sheets API. Define CONFIG con API_KEY y SPREADSHEET_ID. Funciones de lectura.

user-panel.js 191 Panel Mi Cuenta básico: abrir/cerrar, mostrar datos, cargar favoritos.

AppsScript.gs 627 Apps Script ACTUAL: auth email+contraseña, SHA-256, recuperación, perfil, appendRow.

apps-script-completo.js 506 Apps Script ANTIGUO: auth por OTP email, 6 dígitos, activación. URL diferente.

styles.css 5.675 CSS completo del sitio público. Duplicación parcial del CSS embebido en index.html.

main.css 5.077 Otra versión del CSS público. Mismos design tokens que styles.css.

auth-user-panel.css 888 Estilos específicos para modal auth y panel de usuario.

admin.css 628 Estilos específicos del panel admin (independiente de admin.html embebido).

DESIGN_SYSTEM.md 359 Design tokens: colores, tipografía, espaciado, breakpoints, componentes.

PARAMETROS_ADMIN_ORIGINAL.md 307 Referencia: 404 IDs, 261 funciones, 16 secciones, 15+ modales del admin.

README.md 195 Instrucciones de instalación del sistema de usuarios OTP (desactualizado).

INSTRUCCIONES_AUTH.md 144 Guía de migración OTP → email+contraseña (parcialmente completada).

Keys.txt 6 TODAS las credenciales en texto plano: API_KEY, SHEET_ID, Apps Script URL, CLIENT_ID.

generate-png-icons.html 95 Generador de iconos PWA en canvas.

---

2.2 Totales por Tipo

---

**Tipo** **Cantidad** **Líneas** **Notas**

HTML (monolitos) 2 archivos 21.646 index.html + admin.html con CSS+JS embebido

JavaScript externo 6 archivos 2.638 auth, panel, main, admin-users, sheets-api, user-panel

CSS externo 4 archivos 12.268 styles.css + main.css (duplicados) + auth + admin

Apps Script (servidor) 2 archivos 1.133 Dos versiones incompatibles (OTP vs password)

Documentación 5 archivos --- Design system, readme, instrucciones, params, keys

Utilidades 1 archivo 95 Generador de iconos PWA

**TOTAL** **22 archivos** **37.685**

---

2.3 Problemas Estructurales Detectados

- **Duplicación de código:** CONFIG con API_KEY y SPREADSHEET_ID se define en google-sheets-api.js, main.js, user-panel-functions.js E index.html. Cualquier cambio exige editar 4 archivos.

- **Dos sistemas de auth incompatibles:** apps-script-completo.js usa OTP por email (6 dígitos, sin contraseña). AppsScript.gs usa email+contraseña con SHA-256. Dos URLs de Apps Script diferentes. README.md documenta el sistema antiguo.

- **CSS duplicado:** styles.css (5.675 líneas) y main.css (5.077 líneas) comparten los mismos design tokens y gran parte del código. Además, index.html tiene \~6.000 líneas de CSS embebido.

- **Admin aislado:** admin.html no comparte código con index.html: tiene su propia copia de readSheetData(), auth, y estilos. Duplica 100% de la lógica de conexión a Sheets.

- **Documentación desactualizada:** README.md describe el sistema OTP, pero auth-system.js usa contraseñas. INSTRUCCIONES_AUTH.md describe una migración parcial.

3\. Auditoría de Seguridad

Análisis de los 22 archivos del proyecto. Se encontraron vulnerabilidades críticas que deben resolverse antes o durante la migración.

3.1 Credenciales Expuestas

---

**Credencial** **Exposición** **Detalle**

API_KEY de Google 5 archivos google-sheets-api.js, main.js, user-panel-functions.js, index.html, Keys.txt. Permite a cualquiera leer TODAS las hojas de Sheets.

SPREADSHEET_ID 9 archivos Los 5 anteriores + admin-users.js, admin.html, README.md, Keys.txt. Identifica la BD exacta.

Apps Script URL 8 archivos auth-system.js, user-panel.js, user-panel-functions.js, admin-users.js, admin.html, Keys.txt, README.md, INSTRUCCIONES_AUTH.md. Permite enviar requests al backend.

OAuth CLIENT_ID 2 archivos admin.html (línea embebida), Keys.txt. Permite suplantar la app en flujos OAuth.

Keys.txt 1 archivo Contiene TODAS las credenciales en texto plano. Si llega a un repo público, exposición total e inmediata.

---

3.2 Vulnerabilidades por Severidad

---

**Severidad** **Vulnerabilidad** **Impacto**

**CRÍTICO** API_KEY expuesta en 5 archivos cliente Cualquiera lee datos personales (emails, teléfonos, direcciones) de todas las hojas

**CRÍTICO** 163 innerHTML sin sanitizar (38 index + 101 admin + 24 JS) XSS: inyección de código malicioso vía datos de Sheets o inputs de usuario

**CRÍTICO** Contraseñas enviadas sin hash desde el frontend auth-system.js envía password en texto plano vía FormData al Apps Script

**CRÍTICO** Sesión y datos de usuario en localStorage (21 usos en 4 archivos JS) XSS puede robar token, datos personales, y suplantar al usuario

**CRÍTICO** Keys.txt con todas las credenciales en texto plano Si se sube a Git, exposición total inmediata de todo el sistema

**ALTO** Dos sistemas de auth incompatibles en paralelo OTP (apps-script-completo.js) y password (AppsScript.gs) con URLs diferentes. Confusión y superficie de ataque doble

**ALTO** SHA-256 sin salt para hash de contraseñas AppsScript.gs usa Utilities.computeDigest(SHA_256, password) sin salt. Vulnerable a rainbow tables

**ALTO** admin-users.js usa una URL de Apps Script DIFERENTE Dos backends independientes, posible inconsistencia de datos. URL: AKfycbwKvLd\... vs AKfycbzvweS\...

**ALTO** 37.685 líneas en archivos sin modularizar Inmantenible: cambios simples requieren editar múltiples archivos

**ALTO** 221 console.log/warn/error en producción Fuga de información: estructura de datos, errores internos, flujos de auth visibles en consola

**MEDIO** CSS duplicado: styles.css y main.css casi idénticos (10.752 líneas) Confusión sobre cuál es el activo. Cambios de estilo pueden no reflejarse

**MEDIO** Sin validación de input en formularios del frontend Datos malformados llegan al backend y a Sheets sin filtrar

**MEDIO** ipapi.co/json/ en main.js para detectar idioma Envía IP del usuario a servicio externo sin consentimiento

---

3.3 Mapa de Credenciales por Archivo

---

**Archivo** **API_KEY** **SHEET_ID** **Script URL** **CLIENT_ID** **Passwords** **Total**

index.html ✔ ✔ --- --- --- 2

google-sheets-api.js ✔ ✔ --- --- --- 2

main.js ✔ ✔ --- --- --- 2

user-panel-functions.js ✔ ✔ ✔ --- --- 3

auth-system.js --- --- ✔ --- ✔ cleartext 2

user-panel.js --- --- ✔ --- --- 1

admin-users.js --- ✔ ✔ (diferente) --- --- 2

admin.html ✔ ✔ ✔ ✔ ✔ token 5

Keys.txt ✔ ✔ ✔ ✔ --- 4

---

4\. Stack Elegido y Límites Gratuitos

4.1 Componentes del Stack

---

**Servicio** **Función** **Límite Gratuito** **Qué Reemplaza**

Supabase Backend + BD + Auth + Storage + Realtime 500MB PostgreSQL, 50K MAU, 1GB storage, 500K Edge Functions Sustituye Google Sheets + OAuth + Apps Script (ambos)

Nuxt 3 Framework frontend (Vue 3) Open source, sin límites Sustituye index.html (12.787 lín.) + 6 JS + 4 CSS

Cloudflare Pages Hosting + CDN + DNS + SSL + DDoS Ancho de banda ilimitado, 500 builds/mes Hosting con rendimiento global

Cloudinary Imágenes CDN + transformación 25 créditos/mes (10GB storage, 20GB BW) Sustituye Google Drive para fotos

GitHub Actions Repositorio + CI/CD 2.000 min/mes (privados), ilimitado (públicos) Código fuente + deploy automático

Sentry Monitoring errores 5K errores/mes Sustituye los 221 console.log/error

---

4.2 Coste Total

**0 €/mes** mientras el tráfico se mantenga dentro de los límites gratuitos. Primer upgrade probable: Supabase Pro (25\$/mes) al superar 500MB de BD.

5\. Arquitectura del Sistema

5.1 Antes vs Después

---

**Actual** **Propuesto**

Navegador → Google Sheets API (directo, API_KEY expuesta) Navegador → Supabase API (anon_key segura, RLS)

22 archivos sueltos sin estructura Proyecto Nuxt modular con \~35 componentes

2 Apps Script como «backend» (incompatibles entre sí) 1 backend unificado: Supabase (PostgREST + Edge Functions)

Google Sheets como BD (sin tipos, sin FK, sin índices) PostgreSQL con tipos, FK, índices, enums, RLS

Imágenes en Google Drive (sin optimizar, sin CDN) Imágenes en Cloudinary (WebP auto, resize, CDN global)

CSS duplicado en 3 sitios (embebido + 2 archivos) 1 design system en CSS Modules / tokens.css

Auth: password cleartext → SHA-256 sin salt en Sheets Auth: Supabase Auth (bcrypt, httpOnly cookies, OAuth)

Deploy manual: copiar archivos al servidor Deploy automático: push a main → Cloudflare Pages

---

5.2 Flujo de Datos

> Navegador (Nuxt 3 SPA)
>
> │
>
> ├─ HTTPS → Cloudflare Pages (CDN global, SSL, DDoS)
>
> │ └─ Sirve HTML/JS/CSS estático
>
> │
>
> ├─ HTTPS → Supabase (PostgREST API autogenerada)
>
> │ ├─ PostgreSQL (datos)
>
> │ ├─ Auth (Google, Apple, Email+Password)
>
> │ ├─ Storage (docs, fichas técnicas)
>
> │ └─ Realtime (chat en tiempo real)
>
> │
>
> └─ HTTPS → Cloudinary (CDN de imágenes)
>
> └─ Fotos de vehículos optimizadas (WebP, resize)

5.3 Principios de Arquitectura

1.  Cero credenciales en el cliente: todas las API keys en variables de entorno de Supabase

2.  Principio de mínimo privilegio: Row Level Security en cada tabla

3.  Frontend stateless: validación crítica en servidor (Edge Functions)

4.  Imágenes nunca en la BD: URLs de Cloudinary como referencia

5.  Despliegue atómico: push a main → deploy automático

6.  Un solo repositorio: frontend + admin en el mismo proyecto Nuxt

6\. Esquema de Base de Datos (Supabase/PostgreSQL)

Migración de las 17 hojas de Google Sheets a tablas PostgreSQL relacionales con tipos, índices y restricciones.

6.1 Tablas Principales

---

**Tabla PostgreSQL** **Columnas Principales** **Origen Sheets**

vehicles id (uuid PK), slug (unique), brand, model, year (int), price (numeric), rental_price, category (enum), subcategory_id (FK), location, description_es/en, filters_json (jsonb), status (enum), featured, created_at, updated_at vehiculos

vehicle_images id (uuid PK), vehicle_id (FK CASCADE), cloudinary_public_id, url, thumbnail_url, position (int), alt_text URLs en vehiculos

subcategories id (uuid PK), name_es, name_en, slug (unique), applicable_categories (text\[\]), stock_count, status (enum), sort_order subcategorias

filter_definitions id (uuid PK), subcategory_id (FK), name, type (enum), label_es/en, unit, options (jsonb), is_extra, is_hidden, status, sort_order filtros

users id (uuid PK, = auth.users.id), email (unique), pseudonimo, name, apellidos, avatar_url, provider, role (enum), phone, lang, created_at usuarios + admins

favorites user_id (FK), vehicle_id (FK), created_at --- PK compuesta favoritos_usuarios + localStorage

advertisements id (uuid PK), user_id (FK), vehicle_type, brand, model, year, price, location, description, photos, contact\_\*, status (enum), created_at anunciantes

demands id (uuid PK), user_id (FK), vehicle_type, year_min/max, price_min/max, specs (jsonb), contact\_\*, status (enum), created_at solicitantes

subscriptions id (uuid PK), email (unique), pref_web, pref_press, pref_newsletter, pref_featured, pref_events, pref_csr, created_at subscripciones

news id (uuid PK), title_es/en, slug, category (enum), image_url, content_es/en, hashtags, views, status, published_at noticias

comments id (uuid PK), news_id (FK), user_id (FK), parent_id (FK self-ref), content, status, likes, created_at comentarios

chat_messages id (uuid PK), user_id (FK), content, direction (enum), is_read, created_at chat

config key (text PK), value (jsonb) config + tabla_config

balance id (uuid PK), vehicle_id (FK nullable), concept, amount (numeric), invoice_url, date, type (enum) balance

intermediation id (uuid PK), vehicle_id (FK), buyer, seller, commission, status, notes, created_at intermediacion

history_log id (uuid PK), vehicle_id (FK), action (enum), details (jsonb), performed_by (FK), created_at historico

viewed_vehicles id (uuid PK), vehicle_id (FK), viewer_ip (inet), user_id (FK nullable), viewed_at ojeados

---

6.2 Enums PostgreSQL

> CREATE TYPE vehicle_status AS ENUM (\'draft\',\'published\',\'sold\',\'archived\');
>
> CREATE TYPE vehicle_category AS ENUM (\'alquiler\',\'venta\',\'terceros\');
>
> CREATE TYPE user_role AS ENUM (\'visitor\',\'user\',\'admin\');
>
> CREATE TYPE filter_type AS ENUM (\'caja\',\'desplegable\',\'desplegable_tick\',\'tick\',\'slider\',\'calc\');
>
> CREATE TYPE msg_direction AS ENUM (\'user_to_admin\',\'admin_to_user\');
>
> CREATE TYPE balance_type AS ENUM (\'income\',\'expense\',\'recurring_income\',\'recurring_expense\');

7\. API y Row Level Security

7.1 API Autogenerada (PostgREST)

Supabase genera automáticamente una API REST para cada tabla. Esto reemplaza tanto readSheetData() (usado en 4 archivos) como los 2 Apps Scripts completos.

> // Listar vehículos publicados con filtros y paginación
>
> const { data } = await supabase
>
> .from(\'vehicles\')
>
> .select(\'\*, vehicle_images(\*), subcategories(name_es,name_en)\')
>
> .eq(\'status\', \'published\')
>
> .gte(\'price\', 10000).lte(\'price\', 50000)
>
> .order(\'created_at\', { ascending: false })
>
> .range(0, 19)

7.2 Row Level Security (RLS)

---

**Tabla** **Operación** **Política RLS**

vehicles SELECT Público: solo status = \'published\'. Admin: todos

vehicles INSERT/UPDATE/DELETE Solo admin (role = \'admin\')

favorites SELECT/INSERT/DELETE Solo el propio usuario (auth.uid() = user_id)

advertisements INSERT Cualquier usuario autenticado

advertisements SELECT Propio usuario: las suyas. Admin: todas

demands INSERT/SELECT Mismo patrón que advertisements

chat_messages SELECT Propio usuario: sus mensajes. Admin: todos

chat_messages INSERT Autenticado (dirección user_to_admin)

subscriptions INSERT Público (no requiere auth)

users SELECT/UPDATE (propio) Cada usuario solo ve/edita su perfil

balance / intermediation ALL Solo admin

config SELECT público / UPDATE admin Lectura libre, escritura solo admin

---

7.3 Edge Functions

Lógica servidor que no se resuelve solo con RLS:

- Email de bienvenida al registrarse (sustituye enviarEmailBienvenida() de AppsScript.gs)

- Email de recuperación de contraseña (sustituye enviarEmailRecuperacion() de AppsScript.gs)

- Notificar admin de nuevo anúnciate/solicitante

- Validar y subir fotos a Cloudinary (sustituye uploadFileToDrive() de admin.html)

- Generar PDF de folleto del vehículo server-side

8\. Estructura del Proyecto Nuxt 3

Un solo proyecto que unifica index.html + admin.html + 6 JS + 4 CSS en una estructura modular:

> tank-iberica/
>
> ├─ nuxt.config.ts
>
> ├─ app.vue
>
> ├─ pages/
>
> │ ├─ index.vue ← Catálogo (sustituye index.html)
>
> │ ├─ vehiculo/\[slug\].vue ← Detalle vehículo
>
> │ ├─ noticias/index.vue ← Listado noticias
>
> │ ├─ noticias/\[slug\].vue ← Detalle noticia
>
> │ ├─ sobre-nosotros.vue
>
> │ ├─ legal.vue
>
> │ └─ admin/ ← Sustituye admin.html (8.859 lín.)
>
> │ ├─ index.vue ← Dashboard
>
> │ ├─ vehiculos.vue ← CRUD vehículos
>
> │ ├─ anunciantes.vue
>
> │ ├─ solicitantes.vue
>
> │ ├─ noticias.vue
>
> │ ├─ usuarios.vue ← Sustituye admin-users.js
>
> │ ├─ chat.vue
>
> │ ├─ balance.vue
>
> │ ├─ intermediacion.vue
>
> │ └─ config.vue
>
> ├─ components/
>
> │ ├─ layout/ (AppHeader, AppFooter, AnnounceBanner)
>
> │ ├─ catalog/ (CategoryBar, SubcategoryBar, FilterBar, VehicleGrid, VehicleCard)
>
> │ ├─ vehicle/ (ImageGallery, VehicleInfo, ContactOptions)
>
> │ ├─ modals/ (AuthModal, AdvertiseModal, DemandModal, SubscribeModal)
>
> │ ├─ chat/ (ChatWidget, ChatMessage) ← sustituye user-panel-functions.js chat
>
> │ └─ ui/ (DualSlider, ImageCarousel, Badge, FavoriteButton)
>
> ├─ composables/
>
> │ ├─ useVehicles.ts ← Sustituye loadVehiculos() de google-sheets-api.js
>
> │ ├─ useFilters.ts ← Sustituye renderFilters() de main.js
>
> │ ├─ useFavorites.ts ← Sustituye cargarFavoritosUsuario() de user-panel.js
>
> │ ├─ useChat.ts ← Sustituye enviarMensajeChat() de user-panel-functions.js
>
> │ └─ useCloudinary.ts
>
> ├─ stores/ (catalog.ts, auth.ts, ui.ts) ← Sustituye \~20 variables globales
>
> ├─ i18n/ (es.json, en.json) ← Sustituye data-es/data-en + AUTH_TEXTS
>
> ├─ middleware/ (auth.ts, admin.ts)
>
> ├─ assets/css/ (tokens.css, global.css) ← Sustituye styles.css + main.css + embebido
>
> └─ public/ (favicon, manifest.json)

8.1 Módulos Nuxt

---

**Módulo** **Función**

\@nuxtjs/supabase Cliente Supabase inyectado, middleware de auth, composables useSupabaseClient() y useSupabaseUser()

\@nuxtjs/i18n Traducciones JSON, switcher, detección automática idioma, SEO hreflang. Sustituye detectLanguageByIP()

\@pinia/nuxt State management tipado. Sustituye las \~20 variables globales + localStorage manual

\@nuxt/image Integración con Cloudinary, lazy loading nativo, srcset automático

\@vueuse/nuxt useInfiniteScroll, useLocalStorage, useDebounceFn, useBreakpoints

\@nuxtjs/seo Meta tags, sitemap, robots.txt, Open Graph automáticos

---

9\. Componentes Frontend

---

**Componente** **Sub-componentes** **Notas** **Sustituye**

AppHeader Logo, ContactDropdown, LangSwitcher, AccountBtn Fijo, responsive Líneas 6087-6450 de index.html

AnnounceBanner BannerText, CloseBtn Dinámico desde config BD initBanner() de main.js

CategoryBar CategoryButton ×4, AnunciateBtn Multi-select selectCategory() de main.js

SubcategoryBar SubcategoryButton ×N Dinámico desde BD renderSubcategories() de main.js

FilterBar PriceSlider, BrandSelect, YearSlider, DynamicFilter 6 tipos dinámicos renderFilters/Filtro() de main.js

VehicleGrid + VehicleCard Grid/Lista, paginación infinita, carrusel, badge, favorito Lazy loading renderProducts() de main.js

ImageGallery MainImage, ThumbnailStrip, NavArrows Full-screen, swipe Modal detalle index.html

AuthModal LoginForm, RegisterForm, ForgotForm, ProviderButtons Bilingüe auth-system.js (777 líneas) completo

UserPanel Perfil, Favoritos, Chat, Suscripciones, Facturas Panel lateral user-panel.js + user-panel-functions.js

ChatWidget MessageList, SendInput, EmojiPicker Supabase Realtime enviarMensajeChat() + cargarMensajesChat()

AdvertiseModal 15+ campos, PhotoUpload 4-col responsive Modal anúnciate index.html

DemandModal 12+ campos, DualSliders 4-col responsive Modal solicitar index.html

AppFooter Links, Social, Newsletter, Copyright Stacked en móvil Footer index.html

---

10\. Autenticación (Supabase Auth)

10.1 Qué Reemplaza

Supabase Auth unifica y reemplaza 4 archivos y 2 backends:

- auth-system.js (777 líneas): modal de login, registro, recuperación, textos bilingües

- AppsScript.gs (627 líneas): handleLogin, handleRegistrar, handleRecuperarPassword, hashPassword (SHA-256 sin salt)

- apps-script-completo.js (506 líneas): handleEnviarOTP, handleValidarOTP, handleActivarCuenta (sistema OTP obsoleto)

- Parte de user-panel.js (191 líneas): guardarSesion, verificarSesionActiva, localStorage manual

10.2 Comparativa de Seguridad

---

**Sistema Actual (Inseguro)** **Supabase Auth (Seguro)**

Contraseña enviada en texto plano vía FormData Contraseña hasheada con bcrypt server-side por Supabase

SHA-256 sin salt (rainbow tables vulnerable) bcrypt con salt automático (estándar industria)

Token UUID en localStorage (robable vía XSS) Sesión en cookie httpOnly/secure/sameSite

Dos URLs de Apps Script como backend Un backend unificado con API REST + RLS

Sin rate limiting en login Rate limiting incluido en Supabase Auth

Recuperación por email sin verificar expiración server-side Tokens de recuperación firmados con expiración automática

CLIENT_ID expuesto en admin.html Credenciales OAuth en variables de entorno de Supabase

---

11\. Gestión de Imágenes (Cloudinary)

11.1 Transformaciones por Contexto

---

**Uso** **Transformación** **Resultado**

Thumbnail catálogo w_400,h_300,c_fill,q_auto,f_auto 400×300, recortada, WebP auto

Carrusel detalle w_800,h_600,c_fit,q_auto,f_auto 800×600, sin recorte

Miniatura w_100,h_75,c_fill,q_60,f_auto Carga instantánea

Full-screen w_1200,q_auto,f_auto Máx 1200px ancho

Placeholder blur w_40,h_30,e_blur:1000,q_10 LQIP ultra-comprimido

---

12\. Despliegue en Cloudflare Pages

12.1 Configuración

7.  Conectar repo GitHub al dashboard de Cloudflare Pages

8.  Build: npx nuxt build \--preset=cloudflare-pages

9.  Output: dist/

10. Variables: SUPABASE_URL, SUPABASE_ANON_KEY, CLOUDINARY_CLOUD_NAME

11. Dominio: tankiberica.com → DNS en Cloudflare

12.2 Flujo

- Push a main → deploy automático a producción

- Push a rama → preview URL única

- Rollback instantáneo desde dashboard

- Ancho de banda ilimitado (crítico para catálogo con fotos)

13\. Herramientas de Calidad

---

**Herramienta** **Función**

TypeScript Tipado estático. Nuxt 3 nativo. supabase gen types genera tipos de las tablas. Previene los errores de undefined que plagan el código actual.

ESLint Análisis estático. Detectaría los 163 innerHTML, variables no usadas, imports faltantes. \@nuxt/eslint-config.

Prettier Formateo automático. Elimina inconsistencias de estilo entre los 22 archivos actuales.

Husky Pre-commit hooks: lint + format + tests. Rechaza commits con errores.

Vitest Tests unitarios para composables (useFilters, useVehicles) y lógica de negocio.

Vue Test Utils Tests de componentes: VehicleCard, FilterBar, AuthModal.

Playwright E2E: buscar → filtrar → ver detalle → favorito → formulario.

GitHub Actions CI/CD: lint + type-check + tests en PR. Build + deploy en merge a main.

Sentry Monitoring producción. Sustituye los 221 console.log/warn/error.

---

14\. Seguridad Integral

14.1 Resolución de Cada Vulnerabilidad

---

**Problema Actual** **Solución en Nuevo Stack**

API_KEY expuesta en 5 archivos Eliminada. Supabase anon_key (limitada por RLS)

SPREADSHEET_ID en 9 archivos Eliminado. PostgreSQL accesible solo vía API

Apps Script URL en 8 archivos Eliminada. Supabase como único backend

CLIENT_ID en admin.html y Keys.txt Movido a variables de entorno de Supabase

163 innerHTML sin sanitizar Vue escapa HTML por defecto. v-html solo con DOMPurify

Passwords en texto plano desde frontend Supabase Auth gestiona hashing con bcrypt

SHA-256 sin salt en AppsScript.gs bcrypt con salt automático en Supabase

localStorage para tokens (21 usos) Cookies httpOnly/secure/sameSite

Keys.txt con todas las credenciales Eliminado. .env + .gitignore + secretos en CI

221 console.log en producción Sentry + strip-console en build producción

ipapi.co envía IP a tercero navigator.language + \@nuxtjs/i18n

Dos Apps Scripts incompatibles Un único backend Supabase

Sin CORS, sin CSP, sin rate limiting Supabase CORS auto + Cloudflare \_headers + rate limit

Sin validación server-side de inputs Zod schemas en Edge Functions + constraints PostgreSQL

---

15\. Migración de Datos

15.1 Mapeo Completo de Hojas a Tablas

---

**Hoja Sheets** **Tabla PostgreSQL** **Usado en** **Transformaciones**

vehiculos vehicles + vehicle_images index + admin Separar imágenes, parsear filtros_json

subcategorias subcategories index + admin Añadir slug, sort_order

filtros filter_definitions index + admin Normalizar estado (pub/ocul/inact)

config config index + admin Merge con tabla_config

noticias news index + admin Añadir slug, separar \_es/\_en

comentarios comments index + admin Añadir parent_id para hilos

anunciantes advertisements admin Asociar a user_id

solicitantes demands admin Asociar a user_id

usuarios users admin + auth Unificar con admins, migrar passwords a Supabase Auth

admins users (role=admin) admin Merge: campo role en users

subscripciones subscriptions admin Deduplicar por email

favoritos_usuarios favorites panel usuario Migrar de localStorage a tabla relacional

chat chat_messages panel + admin Añadir Realtime, limpiar chatUserId temp

balance balance admin Añadir tipo enum

historico history_log admin Vincular a vehicle_id

intermediacion intermediation admin Vincular a vehicle_id

ojeados viewed_vehicles admin Índice por vehicle_id

---

15.2 Migración de Usuarios (Especial)

Los usuarios actuales tienen contraseñas hasheadas con SHA-256 sin salt en Google Sheets. Supabase Auth usa bcrypt. Estrategia:

12. Crear usuarios en Supabase Auth con email como identificador

13. Marcar todos como «password reset required»

14. Al primer login, forzar flujo de «Recuperar contraseña»

15. El usuario establece nueva contraseña (ahora con bcrypt+salt)

16. Migrar pseudonimo, nombre, apellidos, telefono a tabla users con FK a auth.users

16\. Panel Admin

16.1 Estrategia

admin.html (8.859 líneas, 484 KB, 404 IDs, 261 funciones, 16 secciones, 15+ modales) se integra como rutas /admin/\* en el mismo proyecto Nuxt. Esto elimina la duplicación masiva de readSheetData(), auth, y estilos.

16.2 Páginas Admin

---

**Página** **Funcionalidad**

/admin (Dashboard) Resumen: vehículos activos, anuncios pendientes, solicitudes, mensajes sin leer, balance

/admin/vehiculos CRUD: crear, editar, publicar, archivar, drag & drop fotos a Cloudinary. Mantenimiento y renta.

/admin/intermediacion CRUD intermediación: comprador, vendedor, comisión, características, documentos

/admin/ojeados Vehículos observados en otras plataformas: precio, contacto, notas, estado negociación

/admin/anunciantes Aprobar/rechazar solicitudes Anúnciate. Match con vehículos.

/admin/solicitantes Aprobar/rechazar solicitudes Solicitar. Match con catálogo.

/admin/noticias CRUD noticias: editor contenido, categorías, hashtags, moderación comentarios

/admin/usuarios Lista usuarios, cambiar roles, ver actividad. Sustituye admin-users.js (470 lín.)

/admin/chat Todas las conversaciones. Supabase Realtime. Sustituye chat en admin.html.

/admin/balance Ingresos, gastos, facturas, gráficos (Chart.js), exportar CSV/PDF

/admin/config Banner, subcategorías, filtros, ajustes sitio

---

17\. Hoja de Ruta por Fases

Fase 0 --- Emergencia de Seguridad (1--2 semanas)

**Objetivo:** Neutralizar vulnerabilidades críticas del sistema actual ANTES de cualquier migración.

---

**\#** **Tarea** **Resultado**

0.1 Revocar API_KEY actual en Google Cloud Console y crear nueva con restricción de dominio Los 5 archivos que la exponen dejan de funcionar sin autorización

0.2 Eliminar Keys.txt del proyecto y añadir al .gitignore Credenciales fuera del repositorio

0.3 Crear Apps Script web app como proxy temporal (mover API_KEY al servidor) API_KEY sale del código cliente

0.4 Reemplazar los 163 innerHTML críticos por textContent o DOMPurify Elimina vectores XSS

0.5 Migrar localStorage de sesiones a sessionStorage con expiración Reduce ventana de ataque

0.6 Desactivar el Apps Script OTP antiguo (apps-script-completo.js URL) Elimina backend duplicado

0.7 Eliminar ipapi.co, usar navigator.language Deja de enviar IPs a terceros

---

Fase 1 --- Supabase: Backend + BD + Auth (3--4 semanas)

**Objetivo:** Infraestructura backend completa y migración de todos los datos.

---

**\#** **Tarea** **Resultado**

1.1 Crear proyecto Supabase (región: eu-west) Backend listo

1.2 Ejecutar SQL: 17 tablas + enums + índices + FKs Esquema completo

1.3 Configurar RLS en todas las tablas Seguridad a nivel de BD

1.4 Configurar Auth: Google, Apple, Email+Password Auth funcional

1.5 Exportar 17 hojas de Sheets como CSV Datos raw listos

1.6 Script migración: CSVs → PostgreSQL (normalizar, parsear JSON, vincular FKs) Datos migrados

1.7 Migrar usuarios: forzar password reset para transición SHA-256 → bcrypt Usuarios en Supabase Auth

1.8 Crear cuenta Cloudinary + migrar imágenes desde Google Drive Imágenes migradas

1.9 Crear Edge Functions: emails, notificaciones, upload fotos Lógica servidor

1.10 Tests integridad: conteos, checksums, verificar relaciones Migración validada

---

Fase 2 --- Nuxt 3: Frontend Modular (6--8 semanas)

**Objetivo:** Reemplazar index.html + 6 JS + 4 CSS por una SPA modular.

---

**\#** **Tarea** **Resultado**

2.1 Inicializar proyecto Nuxt 3 con módulos Proyecto base configurado

2.2 Migrar design system: tokens.css desde DESIGN_SYSTEM.md Estilos base (sustituye 3 CSS)

2.3 Crear stores Pinia: catalog, auth, ui Estado centralizado (sustituye \~20 globales)

2.4 Crear composables: useVehicles, useFilters, useFavorites, useChat Lógica reutilizable

2.5 Componentes layout: AppHeader, AppFooter, AnnounceBanner Estructura base

2.6 Catálogo: CategoryBar, SubcategoryBar, FilterBar, VehicleGrid, VehicleCard Catálogo funcional

2.7 Detalle: ImageGallery, VehicleInfo, ContactOptions Detalle funcional

2.8 Modales: AuthModal (sustituye auth-system.js), AdvertiseModal, DemandModal Formularios funcionales

2.9 Panel usuario: perfil, favoritos, chat (sustituye user-panel\*.js) Panel funcional

2.10 i18n: extraer data-es/data-en + AUTH_TEXTS a es.json y en.json Bilingüe completo

2.11 Routing + middleware: auth.ts, admin.ts Navegación segura

2.12 \@nuxt/image con Cloudinary provider Imágenes optimizadas

2.13 Responsive: verificar 360/480/768/1024 en todos los componentes Mobile-first OK

---

Fase 3 --- Admin + Calidad (4--5 semanas, paralela a Fase 2)

**Objetivo:** Integrar admin y establecer estándares de calidad.

---

**\#** **Tarea** **Resultado**

3.1 Migrar admin: /admin/\* (Dashboard, Vehículos, Balance, etc. --- 16 secciones) Admin integrado (sustituye admin.html 8.859 lín.)

3.2 Migrar admin-users.js a /admin/usuarios.vue Gestión usuarios integrada

3.3 Configurar TypeScript estricto + supabase gen types Tipado completo

3.4 ESLint + Prettier + Husky Calidad automática en commits

3.5 Unit tests (Vitest) para composables y lógica filtrado Lógica testeada

3.6 Component tests para VehicleCard, FilterBar, AuthModal UI testeada

3.7 GitHub Actions: lint + type-check + tests en cada PR CI operativo

---

Fase 4 --- Despliegue + Optimización (2--3 semanas)

**Objetivo:** Producción y rendimiento óptimo.

---

**\#** **Tarea** **Resultado**

4.1 Cloudflare Pages: conectar repo, build, env vars, dominio Deploy automático activo

4.2 Security headers: \_headers con CSP, X-Frame-Options, etc. Headers seguros

4.3 Sentry: \@sentry/vue integrado Monitoring activo

4.4 PWA: service worker, offline mode, push notifications PWA completa

4.5 E2E tests con Playwright: 5-10 flujos críticos E2E verificados

4.6 Lighthouse audit \> 90 en las 4 categorías Rendimiento óptimo

4.7 Completar secciones: Noticias, Sobre Nosotros, Legal Contenido completo

4.8 Desactivar Google Sheets API_KEY definitivamente Migración completada

4.9 Eliminar los 2 Apps Scripts y revocar permisos Backend antiguo desmantelado

---

18\. Estimación de Esfuerzo y Costes

18.1 Tiempos por Fase

---

**Fase** **Duración** **Tareas** **Notas**

Fase 0: Emergencia Seguridad 1--2 semanas 7 tareas Sobre el código actual, sin migración

Fase 1: Supabase Backend 3--4 semanas 10 tareas Migración completa de 17 hojas + imágenes + usuarios

Fase 2: Nuxt 3 Frontend 6--8 semanas 13 tareas \~35 componentes + stores + i18n

Fase 3: Admin + Calidad 4--5 semanas 7 tareas Paralela a Fase 2. admin.html completo

Fase 4: Deploy + Optimización 2--3 semanas 9 tareas Puesta en producción + PWA + Lighthouse

**TOTAL** **16--22 semanas** **46 tareas** **4--5.5 meses con 1 developer full-time**

---

18.2 Archivos que se Eliminan

Al completar la migración, los 22 archivos actuales se reemplazan por el proyecto Nuxt:

---

**Archivo** **Estado** **Reemplazo**

index.html (12.787 lín.) ✔ Eliminado Sustituido por pages/ + components/ + composables/

admin.html (8.859 lín.) ✔ Eliminado Sustituido por pages/admin/\*.vue

auth-system.js (777) ✔ Eliminado Sustituido por Supabase Auth + AuthModal.vue

user-panel-functions.js (522) ✔ Eliminado Sustituido por composables/ + ChatWidget.vue

admin-users.js (470) ✔ Eliminado Sustituido por pages/admin/usuarios.vue

main.js (465) ✔ Eliminado Sustituido por composables/ + stores/

google-sheets-api.js (213) ✔ Eliminado Sustituido por Supabase SDK

user-panel.js (191) ✔ Eliminado Sustituido por UserPanel.vue + composables/

AppsScript.gs (627) ✔ Eliminado Sustituido por Supabase Auth + Edge Functions

apps-script-completo.js (506) ✔ Eliminado Sistema OTP obsoleto, ya inactivo

styles.css + main.css (10.752) ✔ Eliminados Sustituidos por assets/css/tokens.css + scoped styles

auth-user-panel.css (888) ✔ Eliminado Estilos scoped en componentes Vue

admin.css (628) ✔ Eliminado Estilos scoped en pages/admin/

Keys.txt (6) ✔ Eliminado .env + variables de entorno en CI/CD

**37.685 líneas eliminadas** **\~4.000-5.000 líneas de código limpio, tipado y testeado**

---

18.3 Costes Mensuales

---

**Servicio** **Fase Inicial** **Escalado** **Cuándo Pagar**

Supabase 0 € 25 € (Pro) Upgrade cuando \> 500MB BD o \> 50K MAU

Cloudflare Pages 0 € 0 € BW ilimitado, sin necesidad de upgrade

Cloudinary 0 € 89 € (Plus) Upgrade cuando \> 25 créditos/mes

GitHub 0 € 0 € Gratuito para equipo pequeño

Sentry 0 € 26 € (Team) Upgrade cuando \> 5K errores/mes

Dominio (.com) \~1 €/mes \~1 €/mes Coste fijo (\~12€/año)

**TOTAL** **\~1 €/mes** **\~141 €/mes** **El salto se da gradualmente según creces**

---

_Fin del documento --- Tank Iberica --- Plan de Profesionalización v3_

_Supabase + Nuxt 3 + Cloudflare Pages + Cloudinary_
