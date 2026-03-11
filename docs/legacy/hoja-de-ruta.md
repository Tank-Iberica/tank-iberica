> ⚠️ **[LEGACY]** Documento histórico — solo referencia. No modificar ni usar como fuente de verdad. Ver [docs/README.md](../README.md) para navegación activa.

**TANK IBERICA**

Plataforma de Vehículos Industriales

**Hoja de Ruta Optimizada**

Orden de implementación para minimizar errores

Requisitos transversales:

**📱 Mobile-First --- el target principal usa móvil**

**🔗 Páginas Reales --- cada vehículo y noticia con su propia URL**

**🧩 Extensible --- añadir categorías, filtros y páginas sin tocar código**

v2 --- Febrero 2026 --- Complemento al Plan de Profesionalización v3

1\. Tres Requisitos que lo Cambian Todo

Estos tres requisitos no son «nice to have». Son restricciones de arquitectura que afectan a cada decisión técnica del proyecto.

1.1 Mobile-First: El Móvil es el Dispositivo Principal

El target principal de Tank Iberica usa móvil. Esto no significa «que se vea bien en móvil» --- significa que se diseña PARA móvil y se adapta a desktop, no al revés.

Qué implica en la práctica

---

**Aspecto** **Implementación**

CSS mobile-first Estilos base = móvil (360px). Se añaden breakpoints con min-width para tablet (768px) y desktop (1024px). Nunca max-width.

Componentes diseñados en 360px Cada componente se construye primero para 360px. El review de PR incluye screenshot móvil OBLIGATORIO.

Touch targets ≥ 44px Todo elemento interactivo mide al menos 44×44px (estándar Apple/Google). Los botones del FilterBar, las cards del catálogo, los iconos del header.

Sin hover como trigger principal Hover no existe en móvil. Los desplegables se activan con tap, no con hover. Los tooltips se muestran en un modal pequeño o bottom sheet.

Rendimiento en 3G Lighthouse con throttling 3G debe dar \>75. Imágenes lazy-load, code splitting agresivo, skeleton loaders.

Gestos nativos Swipe en galería de imágenes. Pull-to-refresh en listados. Botón atrás del sistema funciona siempre.

Test en dispositivo real Chrome DevTools no es suficiente. Test en Android + iOS reales (o BrowserStack) en cada step.

PWA instalable manifest.json + service worker = se puede «instalar» desde el navegador móvil, con icono en pantalla de inicio.

---

+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Regla de oro del proyecto** |
| |
| Ningún componente se considera «terminado» hasta que funciona correctamente en un móvil de 360px con conexión lenta. Desktop es la adaptación, no al revés. |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+

Breakpoints del proyecto

> /\* assets/css/tokens.css \*/
>
> /\* BASE = MÓVIL (sin media query) \*/
>
> \@media (min-width: 480px) { /\* Móvil grande / Landscape \*/ }
>
> \@media (min-width: 768px) { /\* Tablet \*/ }
>
> \@media (min-width: 1024px) { /\* Desktop \*/ }
>
> \@media (min-width: 1280px) { /\* Desktop grande \*/ }

1.2 Páginas Reales: Vehículos y Noticias con URL Propia

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Problema actual** |
| |
| index.html abre los detalles de vehículos y noticias en ventanas emergentes (modales JS). En móvil, si el usuario pulsa «atrás» después de ver un vehículo, no vuelve al catálogo: sale de la web entera (vuelve a Google, al enlace de WhatsApp, etc.). Esto es crítico cuando el 70%+ del tráfico viene de móvil. |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

Solución: Rutas reales de Nuxt

Nuxt 3 genera páginas reales con URL propia. Cada vehículo y cada noticia tiene su propia ruta:

> pages/
>
> vehiculo/\[slug\].vue → tankiberica.com/vehiculo/renault-master-2024
>
> noticias/\[slug\].vue → tankiberica.com/noticias/normativa-euro-7-2026

Qué cambia respecto a los modales actuales

---

**Ahora (Modal)** **Nuevo (Página Real)**

Modal JS: sin URL, sin historial Página real: URL única, entra en el historial del navegador

«atrás» en móvil = salir de la web «atrás» = volver al catálogo (comportamiento esperado)

No se puede compartir un vehículo concreto URL compartible: WhatsApp, email, redes sociales

Google no puede indexar vehículos individuales Cada vehículo es indexable: SEO individual, meta tags, Open Graph

Sin pre-renderizado: carga lenta en móvil Posibilidad de SSR/SSG: el HTML llega pre-renderizado al móvil

Scroll del catálogo se pierde al abrir modal Scroll preservado: al volver atrás, el catálogo está donde lo dejaste

---

Beneficios adicionales de las páginas reales

- **SEO por vehículo:** Cada vehículo tiene su propio \<title\>, \<meta description\>, og:image. Google puede mostrar «Renault Master 2024 --- Tank Iberica» directamente en resultados.

- **Deep linking:** Un enlace a tankiberica.com/vehiculo/iveco-daily-2023 lleva directamente al vehículo. Perfecto para compartir en WhatsApp, que es probablemente el canal principal del sector.

- **Analytics por página:** Puedes saber qué vehículos se visitan más, cuánto tiempo pasan en cada uno, desde dónde llegan. Con modales esto era imposible.

- **Preservar scroll del catálogo:** Nuxt + keep-alive permite que al pulsar «atrás» el catálogo esté exactamente donde lo dejaste, con los mismos filtros activos.

Patrón de navegación móvil

> Catálogo (/) → tap en card → Detalle (/vehiculo/slug)
>
> │
>
> «atrás» ▒ vuelve a /
>
> con scroll y filtros preservados
>
> Google/WhatsApp → Detalle (/vehiculo/slug)
>
> │
>
> «atrás» ▒ vuelve a Google/WhatsApp (correcto)
>
> │
>
> «Ver catálogo» ▒ navega a /

1.3 Extensible: Añadir Categorías, Filtros y Páginas sin Tocar Código

+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Requisito** |
| |
| Quiero tener la libertad de hacer cambios y ajustes en un futuro sin romper todo el código: añadir nuevas categorías, subcategorías, filtros, páginas, etc. |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+

Principio: datos, no código

El sistema distingue entre lo que se lee de la base de datos (dinámico, cambiable desde admin) y lo que está en el código (estructura, lógica). Todo lo que pueda cambiar en el futuro se saca del código y se pone en la base de datos.

---

**Elemento** **Cómo funciona en el nuevo sistema** **Problema actual**

Categorías Se leen de la BD (o de un enum extensible). Añadir una es insertar una fila. Actualmente hardcodeadas en HTML

Subcategorías Tabla subcategories en Supabase. Añadir una = insertar fila desde admin. Hardcodeadas en JS

Filtros Tabla filter_definitions. Soporta 6 tipos de filtro. Añadir un filtro = insertar fila + definir tipo. Hardcodeados en main.js

Valores de filtro Campo options (JSONB) en filter_definitions. Modificable desde admin. Embebidos en HTML

Banner Tabla config, clave «banner». Texto, color, enlace editables desde admin. Hardcodeado en HTML

Páginas de contenido Noticias: tabla news, CRUD desde admin. No requiere deploy. No existen como páginas propias

Traducciones i18n JSON files. Añadir texto = añadir clave en es.json/en.json. data-es/data-en en HTML

---

Ejemplo concreto: añadir una subcategoría

Situación: quieres añadir la subcategoría «Semiremolques Frigoríficos» a la categoría «Alquiler».

**Hoy (código actual):** Editar index.html para añadir el botón, editar main.js para añadir la lógica de filtrado, editar admin.html para añadirla al panel, probar que nada se rompe, subir 3 archivos al servidor.

**En el nuevo sistema:** Abrir /admin/config, escribir «Semiremolques Frigoríficos», seleccionar categoría «Alquiler», guardar. La subcategoría aparece automáticamente en el catálogo con sus filtros. Cero líneas de código.

Ejemplo: añadir un filtro nuevo

Quieres añadir «Capacidad frigorífica (kW)» como filtro tipo slider a la subcategoría recién creada.

**En el admin:** Ir a Filtros → Nueva Definición. Nombre: «Capacidad frigorífica». Tipo: slider. Unidad: kW. Min: 5. Max: 100. Subcategoría: Semiremolques Frigoríficos. Guardar.

**Resultado:** El catálogo muestra automáticamente un slider de 5-100 kW cuando el usuario selecciona esa subcategoría. El componente FilterBar ya sabe renderizar sliders porque el tipo «slider» está programado. Solo los DATOS son nuevos, no el código.

Arquitectura que lo hace posible

> filter_definitions (BD) FilterBar.vue (código)
>
> ┌──────────────────────────┐ ┌───────────────────────┐
>
> │ name: Cap. frigorífica │ │ type === \'slider\' │
>
> │ type: slider │ → │ → renderizar \<Slider\> │
>
> │ unit: kW │ │ type === \'desplegable\' │
>
> │ options: {min:5, max:100}│ │ → renderizar \<Select\> │
>
> └──────────────────────────┘ └───────────────────────┘
>
> DATOS cambian CÓDIGO no cambia
>
> (desde admin) (6 tipos ya programados)

Límites: qué SÍ requiere tocar código

Hay una distinción importante. Añadir elementos dentro de los tipos existentes no requiere código. Añadir un tipo completamente nuevo sí:

---

**✔ Sin tocar código (desde admin)** **✏️ Requiere código (desarrollo)**

Añadir subcategoría «Frigoríficos» Añadir tipo de filtro «mapa interactivo»

Añadir filtro slider «Capacidad kW» Añadir sección completamente nueva como «Subastas»

Cambiar banner, textos, colores del banner Cambiar la estructura de navegación (ej. añadir un mega-menú)

Crear nueva noticia con fotos Añadir un nuevo tipo de contenido como «Videos»

Editar/crear/archivar vehículos Cambiar el diseño de la VehicleCard

---

2\. Por Qué Vertical Slicing

2.1 El riesgo de implementar por capas

El Plan v3 organiza el trabajo por capas (toda la BD → todo el frontend → todo el admin). El riesgo: los errores de integración aparecen 2-3 meses después de crear las tablas.

2.2 La alternativa

Construir funcionalidades completas de arriba a abajo: tabla + RLS + composable + componente + test móvil. Cada «slice» es pequeño, testeable en móvil, y desplegable. Los errores se detectan y corrigen en el mismo step.

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **✅ Principio clave** |
| |
| Al final de cada step, tienes algo que puedes abrir en el móvil, probar con datos reales, y verificar que funciona. Nunca pasas más de 3-5 días sin poder testear de extremo a extremo en un dispositivo real. |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

2.3 Comparativa

---

**Hoja de Ruta por Capas (v3)** **Hoja de Ruta Vertical (este doc)**

Sem 1-4: 17 tablas + Auth Sem 1-2: Emergencia seguridad

Sem 5-12: \~35 componentes Vue Sem 3: Scaffold + Auth + Deploy

Sem 13-17: Panel admin entero Sem 4-7: Catálogo completo (BD→UI→test móvil)

Sem 18-20: Deploy y tests Sem 8-9: Interacción usuario

**Primer test en móvil: semana \~18** **Primer test en móvil: semana \~4**

---

3\. Principios de la Hoja de Ruta

**1. Mobile-first en cada step.** Cada componente se construye para 360px PRIMERO. El review incluye test en móvil real (o BrowserStack). No se pasa al siguiente step hasta que el móvil funciona perfectamente.

**2. Páginas reales, no modales.** Cada contenido con identidad propia (vehículo, noticia) tiene su propia ruta con URL, historial de navegación, y meta tags SEO. El botón atrás del móvil funciona siempre.

**3. Datos dinámicos desde el día 1.** Categorías, subcategorías y filtros se leen de la BD desde el primer momento. El código nunca asume qué categorías existen ni cuántos filtros hay.

**4. De lo simple a lo complejo.** Catálogo (solo lectura) → interacción (escritura) → contenido (Realtime) → admin.

**5. Auth lo antes posible.** Todo depende de saber si el usuario está logueado. Auth se configura en el Step 1 y se verifica antes de crear tablas.

**6. Test en cada step.** Cada step incluye test unitario + test móvil. Los bugs se atrapan donde se crean.

**7. Admin al final.** Es la parte más compleja (261 funciones) pero no es visible al usuario. Se construye cuando el esquema está estabilizado.

4\. Orden Lógico de Dependencias

> NIVEL 0: Emergencia seguridad (código actual, no necesita migración)
>
> NIVEL 1: Cimientos
>
> ├─ Supabase + Auth ← TODO depende de esto
>
> ├─ Nuxt 3 scaffold (mobile-first CSS) ← TODO el frontend
>
> └─ Cloudflare Pages ← deploy real, testeable en móvil
>
> NIVEL 2: Catálogo solo lectura (público, sin login)
>
> ├─ vehicles + vehicle_images ← páginas reales: /vehiculo/\[slug\]
>
> ├─ subcategories + filters ← dinámicos desde BD (extensible)
>
> ├─ Cloudinary ← imágenes optimizadas móvil
>
> └─ config ← banner dinámico
>
> NIVEL 3: Interacción (requiere login)
>
> ├─ favorites ← auth + vehicles
>
> ├─ advertisements + demands ← auth (bottom sheets en móvil)
>
> └─ subscriptions ← sin auth
>
> NIVEL 4: Contenido
>
> ├─ news + comments ← páginas reales: /noticias/\[slug\]
>
> └─ chat_messages (Realtime) ← auth
>
> NIVEL 5: Admin
>
> └─ Todo lo de admin ← esquema estabilizado

5\. Steps Detallados

Step 0 --- Emergencia de Seguridad

---

**STEP 0** **1-2 sem** **7 tareas** **Código actual --- sin migración**

---

**Objetivo:** Neutralizar vulnerabilidades críticas ANTES de tocar el nuevo stack. Se trabaja sobre index.html, admin.html y los 6 JS actuales.

---

**\#** **Tarea** **Verificación**

0.1 Revocar API_KEY en Google Cloud Console. Crear nueva con restricción de dominio DevTools \> Sources \> buscar API_KEY = 0 resultados

0.2 Eliminar Keys.txt del proyecto. Añadir al .gitignore Keys.txt no existe en repo

0.3 Crear proxy Apps Script para llamadas Sheets API (la API_KEY pasa al server) API_KEY fuera del código cliente

0.4 Reemplazar los 163 innerHTML por textContent o DOMPurify grep innerHTML = 0 en JS

0.5 Migrar localStorage de sesiones a sessionStorage Cerrar pestaña = sesión eliminada

0.6 Desactivar el Apps Script OTP antiguo Solo 1 URL de Apps Script activa

0.7 Eliminar ipapi.co/json/, usar navigator.language Sin peticiones a ipapi.co en Network

---

+-----------------------------------------------------------------------------------------------------------------+
| **Criterio de paso** |
| |
| La web actual funciona exactamente igual pero sin credenciales expuestas, sin innerHTML, y con un solo backend. |
+-----------------------------------------------------------------------------------------------------------------+

Step 1 --- Cimientos: Nuxt + Auth + Deploy

---

**STEP 1** **1 semana** **12 tareas** **Scaffold mobile-first + Auth + primera página desplegada**

---

**Objetivo:** Esqueleto del proyecto con auth funcionando y desplegado en Cloudflare Pages. Accesible desde un móvil real.

+---------------------------------------------------------------------------------------------------------------------------------------------------------+
| **¿Por qué Auth primero?** |
| |
| RLS depende de auth.uid(). Si Auth falla, TODAS las políticas fallan. Mejor verificar antes de crear tablas. Además, users es FK en 8 de las 17 tablas. |
+---------------------------------------------------------------------------------------------------------------------------------------------------------+

---

**\#** **Tarea** **Verificación**

1.1 Crear proyecto Supabase (región eu-west-1) Dashboard accesible

1.2 Configurar Auth: Email+Password + Google Login funcional en dashboard

1.3 Crear tabla users (uuid PK = auth.users.id) + RLS + trigger on signup Usuario creado al registrarse

1.4 npx nuxi init. Módulos: \@nuxtjs/supabase, \@nuxtjs/i18n, \@pinia/nuxt, \@vueuse/nuxt Proyecto arranca sin errores

1.5 Crear assets/css/tokens.css con tokens de DESIGN_SYSTEM.md. BREAKPOINTS MOBILE-FIRST Variables CSS definidas

1.6 Layout default: AppHeader (hamburger móvil, expandido desktop) + AppFooter Header funcional en 360px

1.7 AuthModal adaptado a móvil: bottom sheet en \<768px, modal centrado en desktop Login usable en móvil

1.8 Página / con catálogo placeholder («Próximamente») + AuthModal funcional Página visible

1.9 Conectar repo a Cloudflare Pages. Build + deploy automático en push a main URL pública accesible

1.10 Configurar ESLint + Prettier + Husky desde el día 1 Calidad forzada desde el inicio

1.11 Test en móvil real (o BrowserStack): registrar, login, ver header, logout Auth funcional en móvil

1.12 Verificar: botón atrás del móvil no rompe la navegación Navegación correcta

---

+-------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Criterio de paso** |
| |
| Puedes abrir la URL en tu móvil, registrarte, login, ver tu nombre en el header, logout. Auth funciona. Deploy automático activo. ESLint configurado. |
+-------------------------------------------------------------------------------------------------------------------------------------------------------+

Step 2 --- Catálogo Completo

---

**STEP 2** **3 semanas** **17 tareas** **Catálogo con datos reales + páginas de vehículo con URL propia**

---

**Objetivo:** Migrar vehículos, subcategorías y filtros a Supabase. Construir el catálogo completo donde cada vehículo tiene su propia página (/vehiculo/\[slug\]), no un modal. Filtros dinámicos desde la BD (extensibles sin código).

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **¿Por qué el catálogo primero?** |
| |
| Es lo que ve el 95% de los visitantes. Es solo lectura (RLS simple). Tiene la mayor complejidad de UI (filtros dinámicos, grid responsive, galería, paginación). Y es donde el cambio modal → página real tiene mayor impacto en móvil. |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

Semana A: BD + Migración + Cloudinary

---

**\#** **Tarea** **Verificación**

2.1 Crear tablas: vehicles + enums, vehicle_images (FK CASCADE), subcategories, filter_definitions (FK), config 5 tablas con constraints

2.2 RLS: SELECT público en vehicles (status=published), images, subcategories, filters, config Verificar con anon_key desde PostgREST

2.3 Exportar hojas vehiculos, subcategorias, filtros, config como CSV CSVs limpios listos

2.4 Script migración: CSV → Supabase. Normalizar datos, parsear filtros_json, separar URLs de imágenes Conteos coinciden con Sheets

2.5 Crear cuenta Cloudinary. Subir fotos desde Drive. Actualizar URLs en vehicle_images Fotos accesibles vía Cloudinary

---

Semana B: Catálogo UI (mobile-first)

---

**\#** **Tarea** **Verificación**

2.6 Composable useVehicles: fetch con filtros, paginación infinita, caché Test unitario pasa

2.7 Composable useFilters: lee filter_definitions de BD, construye filtros dinámicos por subcategoría Test unitario: 6 tipos de filtro

2.8 Store catalog.ts: estado del catálogo (categoría activa, filtros, subcategoría, scroll position) Store tipado funcional

2.9 CategoryBar.vue: botones horizontales con scroll en móvil. Categorías dinámicas desde BD Touch-friendly, scrollable

2.10 SubcategoryBar.vue: chips dinámicos. En móvil: fila scrollable. En desktop: wrap Extensible sin código

2.11 FilterBar.vue: renderiza 6 tipos de filtro según filter_definitions. En móvil: bottom sheet desplegable Añadir filtro en BD = aparece en UI

2.12 VehicleGrid + VehicleCard: 1 col en móvil, 2 en tablet, 3-4 en desktop. \@nuxt/image + Cloudinary Grid responsive con fotos WebP

---

Semana C: Página de Vehículo + Pulido Móvil

---

**\#** **Tarea** **Verificación**

2.13 vehiculo/\[slug\].vue: PÁGINA REAL (no modal). ImageGallery con swipe, VehicleInfo, ContactOptions URL propia: /vehiculo/renault-master-2024

2.14 useSeoMeta() en \[slug\].vue: title, description, og:image dinámicos por vehículo Compartir en WhatsApp muestra preview

2.15 AnnounceBanner desde config BD. i18n para textos del catálogo (es.json + en.json) Banner dinámico + bilingüe

2.16 Keep-alive en catálogo: al volver de /vehiculo/slug, el scroll y filtros se preservan Atrás = catálogo intacto

2.17 Test móvil completo: navegar catálogo, filtrar, tap en card, ver detalle, atrás, verificar scroll Flujo móvil perfecto

---

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Criterio de paso** |
| |
| Un usuario puede abrir la web en su móvil, ver vehículos con fotos optimizadas, filtrar por categoría/subcategoría/precio/año, entrar al detalle de un vehículo (página real con URL), pulsar atrás y volver al catálogo con scroll preservado, compartir el enlace por WhatsApp con preview. Todo sin login. |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

Step 3 --- Interacción de Usuario

---

**STEP 3** **2 semanas** **11 tareas** **Favoritos, anúnciate, solicitar, panel usuario**

---

**Objetivo:** Todo lo que requiere login. Formularios adaptados a móvil (bottom sheets, no modales centrados). Primera escritura real a la BD con RLS de INSERT.

---

**\#** **Tarea** **Verificación**

3.1 Crear tabla favorites (PK compuesta, RLS solo propio usuario) INSERT/DELETE seguros

3.2 Composable useFavorites + FavoriteButton en VehicleCard (toggle instantáneo) Tap en corazón = favorito

3.3 UserPanel.vue: en móvil = página completa (/mi-cuenta). En desktop = panel lateral Panel adaptado a móvil

3.4 Crear tabla advertisements (RLS: INSERT autenticado, SELECT propio+admin) Anuncios seguros

3.5 AdvertiseModal: en móvil = página /anunciate (scroll vertical). En desktop = modal grande Formulario usable en 360px

3.6 Crear tabla demands (misma RLS que advertisements) Solicitudes seguras

3.7 DemandModal: misma estrategia móvil que AdvertiseModal Formulario usable en 360px

3.8 Crear tabla subscriptions (INSERT público, sin auth) Suscripciones sin fricción

3.9 SubscribeModal: email + 6 checkboxes. Bottom sheet en móvil Modal adaptado

3.10 Edge Function: email bienvenida al registrarse + notificar admin de nuevo anuncio/solicitud Emails llegan correctamente

3.11 Test móvil: login → favorito → enviar anúnciate → ver en mi cuenta → logout Flujo completo en móvil

---

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Criterio de paso** |
| |
| Usuario puede registrarse, marcar favoritos, enviar anúnciate y solicitar (formularios usables en móvil), suscribirse, ver todo en su panel. Botón atrás funciona en todos los flujos. |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

Step 4 --- Contenido: Noticias + Chat

---

**STEP 4** **2 semanas** **10 tareas** **Noticias como páginas reales + chat en tiempo real**

---

**Objetivo:** Noticias con páginas reales (como vehículos), comentarios con hilos, y chat con Supabase Realtime.

---

**\#** **Tarea** **Verificación**

4.1 Crear tablas news + comments (FK news, self-ref parent_id para hilos, RLS: SELECT pub, INSERT auth) Esquema con hilos de comentarios

4.2 Migrar hojas noticias y comentarios (añadir slug, separar \_es/\_en) Datos migrados

4.3 noticias/index.vue: listado de noticias con cards, categorías, foto. 1 col móvil, 2-3 desktop Listado responsive

4.4 noticias/\[slug\].vue: PÁGINA REAL. Contenido + comentarios anidados + useSeoMeta() URL propia: /noticias/normativa-euro-7

4.5 Compartir noticia por WhatsApp muestra preview con imagen y título og:image + og:title correctos

4.6 Crear tabla chat_messages + enum msg_direction + RLS propio+admin Chat seguro

4.7 Migrar hoja chat a chat_messages Historial migrado

4.8 ChatWidget.vue con Supabase Realtime. En móvil: full-screen desde panel usuario Mensajes en tiempo real

4.9 Páginas estáticas: sobre-nosotros.vue, legal.vue Contenido completo

4.10 Test móvil: ver noticias, entrar a detalle, comentar, compartir por WhatsApp, enviar chat Todo funcional en móvil

---

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Criterio de paso** |
| |
| La web PÚBLICA está COMPLETA. Catálogo, páginas de vehículo, filtros dinámicos, favoritos, anúnciate, solicitar, noticias (páginas reales), comentarios, chat, suscripciones. Todo mobile-first. Falta solo el admin. |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

Step 5 --- Panel Admin

---

**STEP 5** **3-4 sem** **13 tareas** **Admin completo --- sustituye admin.html (8.859 líneas)**

---

**Objetivo:** Panel admin completo. Responsive pero optimizado para tablet/desktop (el admin se usa más en escritorio). Las tablas solo-admin (balance, intermediation, etc.) se crean aquí. Incluye la gestión extensible de categorías, subcategorías y filtros.

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **¿Por qué al final?** |
| |
| \(1\) El esquema está estabilizado por Steps 2-4. (2) La RLS admin se añade sobre políticas que ya funcionan. (3) Puedes seguir usando admin.html actual como backup. |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------+

Sem A: Infraestructura + Dashboard + CRUD Vehículos

---

**\#** **Tarea** **Verificación**

5.1 Middleware admin.ts: verificar role=admin. Layout admin con sidebar colapsable No-admin redirigido a /

5.2 Crear tablas solo-admin: balance, intermediation, history_log, viewed_vehicles + RLS admin-only 4 tablas creadas

5.3 Migrar hojas balance, intermediacion, historico, ojeados Datos migrados

5.4 /admin/index.vue (Dashboard): contadores, gráficos resumen Números correctos

5.5 /admin/vehiculos.vue: CRUD + drag & drop fotos a Cloudinary + preview CRUD completo

---

Sem B: Gestión de Contenido + Usuarios

---

**\#** **Tarea** **Verificación**

5.6 /admin/config.vue: CRUD subcategorías, CRUD filtros (los 6 tipos), banner, ajustes Añadir subcategoría/filtro desde admin → aparece en catálogo

5.7 /admin/anunciantes.vue + /admin/solicitantes.vue: aprobar/rechazar Gestión solicitudes

5.8 /admin/usuarios.vue: lista, roles, actividad (sustituye admin-users.js) Gestión usuarios

5.9 /admin/noticias.vue: CRUD noticias + moderación comentarios Contenido gestionable

---

Sem C-D: Finanzas + Chat Admin + Cierre

---

**\#** **Tarea** **Verificación**

5.10 /admin/chat.vue: todas las conversaciones con Realtime Chat admin funcional

5.11 /admin/balance.vue + /admin/intermediacion.vue: CRUD, Chart.js, exportar CSV/PDF Finanzas funcionales

5.12 /admin/ojeados.vue + history_log integrado en vehículos Seguimiento completo

5.13 Test E2E admin: crear vehículo → publicar → verificar en catálogo móvil → archivar Flujo admin → público verificado

---

+--------------------------------------------------------------------------------------------------------------------------------------------------+
| **Criterio de paso** |
| |
| Admin funcional en todas las secciones. Se puede desactivar admin.html. Añadir subcategoría o filtro desde admin aparece en catálogo sin deploy. |
+--------------------------------------------------------------------------------------------------------------------------------------------------+

Step 6 --- Hardening: Calidad + Performance + Cierre

---

**STEP 6** **2-3 sem** **13 tareas** **Tests, TypeScript, PWA, Lighthouse, desmantelamiento**

---

**Objetivo:** Blindar el proyecto: TypeScript estricto, cobertura de tests, performance móvil, headers de seguridad, PWA, y desmantelar completamente el sistema antiguo.

---

**\#** **Tarea** **Verificación**

6.1 TypeScript estricto en todo el proyecto. supabase gen types 0 errores TS

6.2 GitHub Actions: lint + type-check + tests en cada PR CI operativo

6.3 Tests unitarios: todos los composables Cobertura \>80%

6.4 Tests componente: VehicleCard, FilterBar, AuthModal, ChatWidget Componentes críticos testeados

6.5 E2E Playwright: 5-10 flujos con emulación móvil (Pixel 5, iPhone 12) E2E móvil verificados

6.6 Sentry: \@sentry/vue. Verificar captura de errores reales Monitoring activo

6.7 Security headers en Cloudflare \_headers: CSP, X-Frame, Referrer-Policy securityheaders.com = A

6.8 PWA: service worker, manifest.json, iconos, splash, offline mode Instalable desde móvil

6.9 Lighthouse MÓVIL con throttling: \>90 en Performance, Accessibility, Best Practices, SEO 4 métricas verdes EN MÓVIL

6.10 Optimizar Core Web Vitals móvil: LCP \<2.5s, FID \<100ms, CLS \<0.1 Vitals verdes

6.11 Migrar usuarios existentes: forzar password reset (SHA-256 → bcrypt) Todos en Supabase Auth

6.12 Desactivar API_KEY Google Sheets. Revocar Apps Scripts. Eliminar archivos antiguos Sistema antiguo eliminado

6.13 Test final: recorrer TODA la web en móvil, tablet, desktop. Verificar cada flujo Sign-off final

---

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **PROYECTO COMPLETADO** |
| |
| Web en producción. Sistema antiguo desmantelado. Tests en CI. Lighthouse \>90 en móvil. PWA instalable. Categorías, subcategorías y filtros extensibles desde admin. 37.685 líneas → \~4.500 líneas limpias. |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

6\. Resumen: Cronograma y Progreso

---

**Step** **Semana** **Tareas** **Qué se construye** **Progreso acumulado**

Step 0 Sem 1-2 7 Seguridad código actual Web actual sin credenciales ni XSS

Step 1 Sem 3 12 Nuxt + Auth + Deploy \+ Auth funcional + deploy + móvil verificado

Step 2 Sem 4-6 17 Catálogo completo \+ Filtros dinámicos + /vehiculo/\[slug\] + móvil perfecto

Step 3 Sem 7-8 11 Interacción usuario \+ Favoritos, anúnciate, solicitar, panel usuario

Step 4 Sem 9-10 10 Noticias + Chat \+ Web pública COMPLETA + /noticias/\[slug\]

Step 5 Sem 11-14 13 Admin completo \+ Admin funcional + extensibilidad desde admin

Step 6 Sem 15-17 13 Calidad + Cierre \+ Tests, PWA, Lighthouse móvil, desmantelamiento

**TOTAL** **17-19 sem** **83** **Proyecto completo, mobile-first, extensible**

---

7\. Cómo los 3 Requisitos Atraviesan Cada Step

Para verificar que los tres requisitos no quedan como «ideas abstractas», esta tabla muestra exactamente dónde se implementa cada uno:

---

**Step** **📱 Mobile-First** **🔗 Páginas Reales** **🧩 Extensible**

Step 1 AppHeader con hamburger móvil. AuthModal como bottom sheet. Test en móvil real Navegación con historial real desde el día 1 users tabla extensible con campos opcionales

Step 2 Filtros como bottom sheet. VehicleCard 1-col. ImageGallery con swipe. Cloudinary WebP /vehiculo/\[slug\] = página real. keep-alive preserva scroll. useSeoMeta() Categorías, subcategorías y filtros leídos de BD. Añadir = insertar fila

Step 3 Formularios como páginas completas en móvil (scroll vertical). Touch targets 44px Anúnciate/Solicitar como páginas en móvil (no modales) Tablas extensibles con campos JSONB para datos variables

Step 4 Noticias 1-col. Chat full-screen móvil /noticias/\[slug\] = página real. og:image por noticia Categorías de noticias dinámicas

Step 5 Admin responsive (sidebar colapsable) Admin usa mismas rutas reales para preview de vehículos CRUD subcategorías y filtros desde admin → catálogo actualizado

Step 6 Lighthouse móvil \>90. PWA instalable. Core Web Vitals móvil verdes Verificar todos los \[slug\] tienen meta tags Verificar: añadir subcategoría desde admin aparece en catálogo

---

8\. Anti-Patrones a Evitar

---

**Anti-Patrón** **Por Qué es Peligroso**

❌ Diseñar para desktop y «adaptar» a móvil Al revés. Diseñar para 360px y añadir complejidad con min-width. Si se hace al revés, la adaptación móvil siempre queda mal.

❌ Usar modales para contenido con identidad propia Vehículos y noticias son páginas, no modales. Si tiene slug y merece ser indexado por Google, es una página.

❌ Hardcodear categorías o filtros en el código Todo lo que pueda cambiar va en la BD. El código renderiza lo que la BD le dice, no asume qué existe.

❌ Crear las 17 tablas el día 1 Crea cada tabla cuando la necesites. El esquema se informa de lo que la UI necesita.

❌ Dejar tests para «cuando haya tiempo» Tests van en cada step o no se hacen nunca.

❌ Testear solo en Chrome DevTools Chrome DevTools no es un móvil real. Hay bugs de touch, scroll, teclado virtual que solo aparecen en dispositivo real.

❌ Construir todo sin desplegar Deploy en Step 1. Los bugs de entorno (CORS, env vars, CDN) se detectan pronto.

---

9\. Referencia: Creación de Tablas por Step

---

**Step** **Tabla** **Razón**

Step 1 users Primera tabla. FK en 8 tablas. RLS depende de auth.uid().

Step 2 vehicles Tabla principal del catálogo. Página /vehiculo/\[slug\].

Step 2 vehicle_images FK CASCADE a vehicles.

Step 2 subcategories Dinámicas: añadir desde admin sin código.

Step 2 filter_definitions 6 tipos de filtro. Añadir desde admin sin código.

Step 2 config Banner, ajustes. Key-value JSONB.

Step 3 favorites Requiere auth + vehicles.

Step 3 advertisements Primer INSERT de usuario. RLS escritura.

Step 3 demands Misma lógica que advertisements.

Step 3 subscriptions INSERT público sin auth.

Step 4 news Página real: /noticias/\[slug\].

Step 4 comments Hilos anidados (self-ref parent_id).

Step 4 chat_messages Supabase Realtime.

Step 5 balance Solo admin.

Step 5 intermediation Solo admin.

Step 5 history_log Solo admin. Audit log.

Step 5 viewed_vehicles Solo admin. Ojeados.

---

_Fin del documento --- Tank Iberica --- Hoja de Ruta Optimizada v2_

_Mobile-First · Páginas Reales · Extensible · Vertical Slicing_


