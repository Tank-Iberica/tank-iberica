# AUDITORÍA UX MÓVIL — Tracciona

**Fecha:** 26 febrero 2026
**Método:** Análisis de código, arquitectura y documentación del proyecto
**Target:** Dealers de vehículos industriales (45-60 años, WhatsApp-first, móvil como dispositivo principal)

---

## HALLAZGO #0 — TRACCIONA NO ESTÁ INDEXADA EN GOOGLE

**Severidad: BLOCKER**

Una búsqueda de `site:tracciona.com` y `"tracciona.com"` en Google devuelve 0 resultados.

**Posibles causas:**

1. `robots.txt` bloqueando el crawling
2. Meta `noindex` en las páginas
3. El sitio no ha sido dado de alta en Google Search Console
4. El sitio está detrás de autenticación o devuelve errores
5. DNS/Cloudflare mal configurado

**Acción urgente (fundadores):**

- Verificar que `https://tracciona.com` carga correctamente en navegador
- Abrir Google Search Console → añadir propiedad → verificar
- Enviar sitemap manualmente
- Verificar que `robots.txt` no tiene `Disallow: /`

**Sin esto, todo lo demás (SEO, UX, monetización) no sirve de nada.**

---

## RESUMEN EJECUTIVO

El código usa Nuxt 3 + Tailwind CSS + PWA, que es una base sólida para móvil. Sin embargo, hay **8 problemas concretos** que afectan directamente a vuestro target (dealers 45-60 años con móvil):

| #   | Problema                                         | Impacto                              | Quién lo arregla |
| --- | ------------------------------------------------ | ------------------------------------ | ---------------- |
| 1   | Sin métricas Lighthouse reales                   | No sabemos si es rápido              | 🔧 Sesión 52     |
| 2   | Imágenes posiblemente sin dimensiones explícitas | CLS en móvil                         | 🔧 Sesión 61/52  |
| 3   | Sin página 404                                   | Pantalla en blanco si URL rota       | 🔧 Sesión 62     |
| 4   | Touch targets no auditados                       | Botones pequeños para dedos grandes  | 🔧 Sesión 62     |
| 5   | Filtros móvil: ¿bottom sheet o modal?            | UX crítica en catálogo               | 🔧 Verificar     |
| 6   | WhatsApp CTA no verificado en móvil              | El flujo estrella del producto       | 👤 Verificar     |
| 7   | Dashboard dealer no optimizado móvil             | Donde el dealer pasa más tiempo      | 🔧 Nueva tarea   |
| 8   | PWA no verificada en dispositivo real            | ¿Se instala bien? ¿Funciona offline? | 👤 DOC2 tarea    |

---

## ANÁLISIS DETALLADO

### 1. VELOCIDAD — Sin datos reales

**Estado:** Nuxt SSR + Cloudflare CDN + Tailwind = stack que debería ser rápido. PERO:

- Los chunks eran de **937KB** (auditoría anterior). Si no se ha corregido, en móvil con 3G esto tarda 3-5 segundos
- No hay Lighthouse CI en pipeline (sesión 52 planificada)
- No se han medido Core Web Vitals reales en dispositivo

**Impacto para dealers:** Si la primera carga tarda >3s en un móvil Android medio (Samsung Galaxy A, Xiaomi Redmi — los que usan tus dealers), se van. No tienen paciencia.

**Acción:**

- Fundadores: abrir tracciona.com en Chrome móvil → Lighthouse → anotar LCP, FID, CLS
- Claude Code: sesión 52 (Lighthouse CI) + code-splitting si chunks >500KB

### 2. IMÁGENES — Probable CLS

**Estado:** Cloudinary sirve imágenes con transformaciones (`g_auto,e_improve,q_auto,f_webp`), que es correcto. PERO:

- No hay evidencia de que los componentes Vue usen `width` y `height` explícitos en `<img>` o `<NuxtImg>`
- Sin dimensiones, el navegador no reserva espacio → el contenido salta cuando carga la imagen (CLS)

**Impacto para dealers:** Están scrolleando el catálogo, las fotos cargan y la página salta. Es desorientador, especialmente para gente mayor.

**Acción:**

- Sesión 61 (alt text audit) ya incluye verificar imágenes
- Añadir: verificar `width`/`height` o `aspect-ratio` en todos los `<img>` de catálogo y fichas

### 3. NAVEGACIÓN MÓVIL — Puntos ciegos

**Estado:** Nuxt + Tailwind con responsive. PWA instalable. PERO:

**a) Sin página 404:**
Si un dealer comparte un enlace de un vehículo que luego se elimina, el comprador ve una pantalla en blanco o un error genérico. En móvil, donde la barra de URL está oculta, el usuario no sabe qué pasó.

**b) Sin breadcrumbs:**
En móvil, breadcrumbs son la forma más fácil de "volver atrás" sin usar el botón del navegador. Sin ellos, el usuario se pierde en la ficha de un vehículo.

**c) Footer en móvil:**
¿El footer es accesible? En muchos sitios móviles, el footer queda enterrado y nunca se ve. Los enlaces legales, contacto y "sobre nosotros" deberían ser accesibles desde el menú hamburguesa.

**Acción:** Sesiones 61 (breadcrumbs) y 62 (404 y semántica)

### 4. TOUCH TARGETS — Crítico para tu target

**Estado:** Tailwind defaults no garantizan 48px mínimo en todos los botones e inputs.

**Impacto para dealers:** Hombres de 45-60 años con dedos grandes, usando el móvil en la campa (al sol, con guantes a veces). Los botones de filtro, los corazones de favoritos, los toggles del dashboard tienen que ser GRANDES.

**Regla:** Todo elemento interactivo ≥ 48x48px con ≥8px de separación entre elementos.

**Puntos críticos a verificar:**

- Botones de filtro en catálogo
- Botón "Publicar vehículo" en dashboard
- Botón WhatsApp/teléfono en ficha
- Checkbox/radio en formularios
- Iconos de editar/borrar en listados del dealer

**Acción:** Añadir a sesión 62 (accesibilidad) una auditoría específica de touch targets

### 5. FILTROS EN MÓVIL — La interacción más frecuente

**Estado:** Hay 6 tipos de filtro (caja, desplegable, tick, slider, etc.). La documentación menciona "bottom sheet" como patrón para móvil, pero no está claro si está implementado.

**Lo que debería pasar en móvil:**

1. Catálogo: barra con 3-4 chips de filtro rápido (precio, tipo, marca)
2. Tap en chip → bottom sheet con opciones (NO dropdown nativo, NO modal a pantalla completa)
3. Slider de precio: ancho completo en bottom sheet, con inputs numéricos además del slider
4. Botón "Ver X resultados" fijo en la parte inferior del bottom sheet
5. Filtros activos visibles como tags eliminables debajo de la barra

**Lo que NO debería pasar:**

- Dropdown nativo del navegador (difícil de usar en Android)
- Modal que cubre toda la pantalla (desorientador)
- Slider demasiado pequeño (imposible con dedos)
- Tener que scrollear para encontrar "Aplicar filtros"

**Acción:** Verificar manualmente en dispositivo real. Si los filtros no usan bottom sheet, crear tarea para Claude Code.

### 6. FLUJO WHATSAPP — El arma diferencial

**Estado:** El flujo WhatsApp→Vehículo es la feature estrella. En móvil, el CTA "Publicar por WhatsApp" debe ser PROMINENTE.

**Verificar en móvil:**

1. ¿Hay un botón "Publicar por WhatsApp" visible en el dashboard del dealer sin scroll?
2. ¿El link `wa.me/34XXX?text=...` abre WhatsApp directamente en móvil?
3. Cuando el dealer recibe la notificación de vuelta ("✅ Tu vehículo se ha procesado"), ¿el link a /dashboard/vehiculos/[id] funciona bien en móvil?
4. ¿La respuesta de WhatsApp incluye preview del vehículo con imagen?

**Para compradores:**

1. En la ficha del vehículo, ¿el botón "Contactar por WhatsApp" es prominente?
2. ¿Abre WhatsApp con mensaje prellenado?
3. ¿El número de teléfono es "tap to call"?

**Acción:** Fundadores verificar manualmente. Si algo falla, crear tarea.

### 7. DASHBOARD DEALER EN MÓVIL — Donde vive el dealer

**Estado:** El dashboard tiene ~15 páginas (/dashboard/\*). Si un dealer usa el móvil como dispositivo principal, necesita poder:

- Ver sus vehículos activos
- Ver leads nuevos (notificación push idealmente)
- Editar un vehículo (cambiar precio, marcar vendido)
- Ver estadísticas básicas

**Problemas potenciales en móvil:**

- Tablas de datos (listado de vehículos, leads) → necesitan scroll horizontal o diseño de tarjetas
- Formularios de edición → inputs largos con muchos campos
- Estadísticas con gráficos → Chart.js puede ser lento en móvil

**Patrón recomendado:**

- Listados: tarjetas en vez de tablas (en móvil)
- Formularios: agrupar por secciones con acordeón
- Stats: cards con número grande + sparkline (no gráficos complejos)

**Acción:** Verificar manualmente + potencial sesión nueva de "dashboard mobile optimization"

### 8. PWA — ¿Funciona realmente?

**Estado:** @vite-pwa/nuxt configurado. manifest.json existe. Service worker activo.

**Verificar:**

1. ¿Se muestra el banner "Añadir a pantalla de inicio" en Chrome Android?
2. Una vez instalada, ¿abre sin barra del navegador?
3. ¿Los iconos (192x192, 512x512) se ven bien?
4. ¿Funciona sin conexión? (al menos mostrar última página visitada)
5. ¿Push notifications configuradas? (para notificar leads al dealer)

**Acción:** DOC2 tarea existente (verificar PWA en dispositivo real)

---

## CHECKLIST RÁPIDO — VERIFICAR HOY (15 minutos)

Los fundadores pueden verificar esto ahora mismo con su móvil:

| #   | Test                                   | Cómo                                          | ✅/❌ |
| --- | -------------------------------------- | --------------------------------------------- | ----- |
| 1   | ¿Tracciona.com carga en <3s?           | Abrir en Chrome móvil, cronometrar            |       |
| 2   | ¿El menú hamburguesa funciona?         | Tap en icono ≡                                |       |
| 3   | ¿Los filtros de catálogo son usables?  | Ir a catálogo, intentar filtrar por precio    |       |
| 4   | ¿Las fotos de vehículos cargan rápido? | Abrir ficha de un vehículo                    |       |
| 5   | ¿El botón WhatsApp funciona?           | Tap en "Contactar" → ¿abre WhatsApp?          |       |
| 6   | ¿Se puede publicar desde WhatsApp?     | Enviar foto al número de Tracciona            |       |
| 7   | ¿El dashboard funciona en móvil?       | Login como dealer → ¿se ve bien?              |       |
| 8   | ¿Se puede instalar como PWA?           | Chrome → menú → "Añadir a inicio"             |       |
| 9   | ¿Los textos son legibles sin zoom?     | Leer descripción de un vehículo               |       |
| 10  | ¿Los botones son fáciles de tocar?     | Intentar tocar todos los botones de una ficha |       |

**Resultado:** Anotar qué falla y crear tareas específicas.

---

## RECOMENDACIONES ORDENADAS POR IMPACTO

### URGENTE (esta semana)

1. **Verificar que tracciona.com está online y accesible** — si no lo está, nada más importa
2. **Dar de alta Google Search Console** y enviar sitemap
3. **Test manual móvil** con el checklist de arriba

### ALTA PRIORIDAD (sesiones Claude Code)

4. **Sesión 52** — Lighthouse CI + Web Vitals reales
5. **Sesión 62** — Página 404 + touch targets + semántica
6. **Code-splitting** si chunks >500KB (dentro de sesión 52)

### MEDIA PRIORIDAD

7. **Dashboard dealer mobile** — verificar y optimizar si necesario
8. **Filtros bottom sheet** — verificar y implementar si falta
9. **PWA en dispositivo real** — verificar instalación y offline

---

## NOTA SOBRE LIMITACIÓN DEL ANÁLISIS

No pude acceder a tracciona.com directamente (ni vía web_fetch ni vía Chrome). El análisis se basa en:

- Código real del repositorio (revisado en auditoría anterior)
- Arquitectura documentada (INSTRUCCIONES-MAESTRAS, flujos operativos, CHANGELOG)
- Conocimiento del stack (Nuxt 3 + Tailwind + PWA)
- Perfil del target (dealers 45-60 años, móvil como dispositivo principal)

Para una auditoría visual completa necesitaría que conectéis la extensión Claude in Chrome y naveguemos juntos, o que me compartáis capturas de pantalla del móvil.
