# CHECKLIST SEO / UX / TÉCNICO — Tracciona

**Generado:** 26 febrero 2026
**Fuente:** Requisitos definidos por fundadores + auditoría baseline de código real
**Uso:** Referencia cruzada para fundadores y Claude Code. Cada ítem indica quién lo ejecuta.

---

## Leyenda de estado

| Icono | Significado                                                 |
| ----- | ----------------------------------------------------------- |
| ✅    | Hecho y verificado                                          |
| 🟡    | Parcialmente hecho o sin verificar                          |
| ❌    | No implementado                                             |
| 🔧    | Claude Code lo implementa                                   |
| 👤    | Fundadores deben hacerlo                                    |
| 🔧👤  | Ambos (Claude Code prepara, fundadores verifican/completan) |

---

## 1. EXPERIENCIA DE USUARIO (UX)

### 1.1 Velocidad de carga (Core Web Vitals)

| #     | Requisito                                          | Estado | Quién | Notas                                                                          |
| ----- | -------------------------------------------------- | ------ | ----- | ------------------------------------------------------------------------------ |
| 1.1.1 | LCP < 2.5s                                         | 🟡     | 🔧    | Nuxt SSR activo. Sin métricas Lighthouse reales medidas. Sesión 52 planificada |
| 1.1.2 | FID/INP < 200ms                                    | 🟡     | 🔧    | Sin medición real. Sesión 52 incluye Web Vitals monitoring                     |
| 1.1.3 | CLS < 0.1                                          | 🟡     | 🔧    | Sin medición real. Imágenes necesitan width/height explícitos                  |
| 1.1.4 | Lighthouse CI en pipeline                          | ❌     | 🔧    | Sesión 52: Lighthouse CI + budget de performance                               |
| 1.1.5 | Optimización de imágenes (WebP/AVIF, lazy loading) | 🟡     | 🔧    | Cloudinary gestiona imágenes, posiblemente sin formato moderno forzado         |
| 1.1.6 | Preload de recursos críticos (fonts, hero image)   | 🟡     | 🔧    | dns-prefetch existe en nuxt.config, revisar preload/preconnect                 |

### 1.2 Diseño responsive / móvil

| #     | Requisito                     | Estado | Quién | Notas                                                   |
| ----- | ----------------------------- | ------ | ----- | ------------------------------------------------------- |
| 1.2.1 | Mobile-first responsive       | ✅     | —     | Nuxt + Tailwind CSS, PWA configurada                    |
| 1.2.2 | Touch targets ≥ 48px          | 🟡     | 🔧    | Sin auditoría específica. Sesión 52 Parte accesibilidad |
| 1.2.3 | Viewport meta tag correcto    | ✅     | —     | Nuxt lo genera automáticamente                          |
| 1.2.4 | No horizontal scroll en móvil | 🟡     | 👤    | Verificar manualmente en dispositivo real               |
| 1.2.5 | PWA instalable                | ✅     | —     | manifest.json existe, service worker activo             |

### 1.3 Navegación clara e intuitiva

| #     | Requisito                                            | Estado | Quién | Notas                                            |
| ----- | ---------------------------------------------------- | ------ | ----- | ------------------------------------------------ |
| 1.3.1 | Menú principal claro con categorías                  | 🟡     | 🔧    | Existe, sin auditoría de usabilidad real         |
| 1.3.2 | Breadcrumbs en páginas de detalle                    | ❌     | 🔧    | **NUEVA sesión** — importante para SEO y UX      |
| 1.3.3 | Buscador accesible desde cualquier página            | 🟡     | 🔧    | Existe búsqueda de vehículos                     |
| 1.3.4 | Footer con enlaces legales, contacto, sobre nosotros | 🟡     | 🔧    | Footer existe, verificar completitud             |
| 1.3.5 | Página 404 personalizada                             | ❌     | 🔧    | **NUEVA sesión** — con sugerencias de navegación |
| 1.3.6 | Tabla de contenidos en artículos largos              | ❌     | 🔧    | Cuando exista sección editorial (sesión 58)      |

### 1.4 Tipografía y contraste

| #     | Requisito                             | Estado | Quién | Notas                                |
| ----- | ------------------------------------- | ------ | ----- | ------------------------------------ |
| 1.4.1 | Tamaño base ≥ 16px                    | 🟡     | 🔧    | Tailwind defaults, verificar         |
| 1.4.2 | Contraste WCAG AA (ratio ≥ 4.5:1)     | 🟡     | 🔧    | Sesión 52 incluye auditoría axe-core |
| 1.4.3 | Jerarquía visual clara (H1 > H2 > H3) | 🟡     | 🔧    | Verificar con auditoría semántica    |
| 1.4.4 | Line height ≥ 1.5 en bloques de texto | 🟡     | 🔧    | Tailwind defaults probablemente ok   |

---

## 2. BRANDING Y CONFIANZA

| #    | Requisito                                    | Estado | Quién | Notas                                                                                   |
| ---- | -------------------------------------------- | ------ | ----- | --------------------------------------------------------------------------------------- |
| 2.1  | Favicon correcto (ico + png + apple-touch)   | 🟡     | 🔧    | PWA tiene iconos, verificar favicon.ico en todas resoluciones                           |
| 2.2  | Página "Sobre nosotros" completa             | ❌     | 🔧👤  | Claude Code crea estructura, fundadores ponen contenido real (historia, equipo, misión) |
| 2.3  | Página "Contacto" completa                   | 🟡     | 🔧👤  | Existe formulario, verificar que incluye: email, teléfono, dirección, mapa              |
| 2.4  | Política de privacidad real (no placeholder) | 🟡     | 👤    | DOC2 tarea #6 — verificar contenido real vs clave i18n stub                             |
| 2.5  | Aviso legal / Términos y condiciones         | 🟡     | 👤    | DOC2 tarea #6                                                                           |
| 2.6  | Política de cookies con banner funcional     | 🟡     | 👤    | DOC2 tarea #8 — verificar que bloquea scripts antes de aceptar                          |
| 2.7  | Diseño profesional y coherente               | ✅     | —     | Tailwind + design system consistente                                                    |
| 2.8  | Reseñas y testimonios                        | ❌     | 👤    | Pre-revenue, no hay clientes aún. Añadir cuando haya founding dealers                   |
| 2.9  | Marca registrada OEPM                        | ❌     | 👤    | DOC2 tarea #1 — URGENTE                                                                 |
| 2.10 | Logo profesional en SVG                      | 🟡     | 👤    | Verificar que existe y es SVG (escalable)                                               |

---

## 3. CONTENIDO Y ENGAGEMENT

| #   | Requisito                                      | Estado | Quién | Notas                                                                             |
| --- | ---------------------------------------------- | ------ | ----- | --------------------------------------------------------------------------------- |
| 3.1 | Imágenes optimizadas con alt text descriptivo  | 🟡     | 🔧    | Cloudinary sirve imágenes, verificar alt text en componentes Vue                  |
| 3.2 | Vídeos/multimedia para engagement              | ❌     | 👤    | Vídeo 60s flujo WhatsApp (acción de mayor impacto del DOC3)                       |
| 3.3 | Tabla de contenidos en artículos largos        | ❌     | 🔧    | Implementar cuando haya contenido editorial (sesión 58)                           |
| 3.4 | Estructura visual: párrafos cortos, subtítulos | 🟡     | 🔧    | En descripciones IA de vehículos. Sin contenido editorial todavía                 |
| 3.5 | Enlaces internos bien organizados              | 🟡     | 🔧    | Vehículo → dealer, categorías → filtros. Falta estrategia de internal linking SEO |
| 3.6 | Breadcrumbs (migas de pan)                     | ❌     | 🔧    | **NUEVA sesión** — Home > Categoría > Marca > Vehículo                            |
| 3.7 | Blog / contenido editorial SEO                 | ❌     | 🔧    | Sesión 58 planificada — 2-4 artículos/semana con Claude                           |
| 3.8 | Tiempo medio en página > 2min                  | ❌     | 👤    | Sin analytics verificado. DOC2 tarea #12                                          |

---

## 4. SEO TÉCNICO

| #    | Requisito                                  | Estado | Quién | Notas                                                                                   |
| ---- | ------------------------------------------ | ------ | ----- | --------------------------------------------------------------------------------------- |
| 4.1  | Certificado SSL (HTTPS)                    | ✅     | —     | Cloudflare Pages, HTTPS por defecto                                                     |
| 4.2  | Sitemap XML (`/sitemap.xml`)               | 🟡     | 🔧    | Nuxt puede generarlo, verificar que existe y se actualiza                               |
| 4.3  | `robots.txt` bien configurado              | 🟡     | 🔧    | Verificar que existe y no bloquea contenido importante                                  |
| 4.4  | URLs limpias y descriptivas                | 🟡     | 🔧    | Nuxt genera rutas, verificar: `/camion-mercedes-actros-2024` mejor que `/vehicle/12345` |
| 4.5  | Datos estructurados (Schema.org)           | ❌     | 🔧    | **NUEVA sesión** — Product, Vehicle, Organization, BreadcrumbList                       |
| 4.6  | Canonical tags                             | 🟡     | 🔧    | Nuxt useHead puede generarlos, verificar implementación                                 |
| 4.7  | Meta title y description únicos por página | 🟡     | 🔧    | useHead/useSeoMeta, verificar que cada ruta tiene meta único                            |
| 4.8  | Hreflang tags (ES/EN)                      | ❌     | 🔧    | i18n existe, verificar que genera hreflang alternates                                   |
| 4.9  | Open Graph tags                            | 🟡     | 🔧    | Verificar og:title, og:description, og:image por página                                 |
| 4.10 | Twitter Cards                              | 🟡     | 🔧    | Verificar twitter:card, twitter:title, twitter:image                                    |
| 4.11 | Redirección www → non-www (o viceversa)    | 🟡     | 👤    | Cloudflare Page Rules, verificar                                                        |
| 4.12 | Compresión Gzip/Brotli                     | ✅     | —     | Cloudflare lo hace automáticamente                                                      |

---

## 5. GESTIÓN DE ERRORES Y REDIRECCIONES

| #   | Requisito                                   | Estado | Quién | Notas                                                   |
| --- | ------------------------------------------- | ------ | ----- | ------------------------------------------------------- |
| 5.1 | Página 404 personalizada                    | ❌     | 🔧    | **NUEVA sesión** — con buscador, enlaces populares, CTA |
| 5.2 | Redirección 301 de URLs rotas con valor     | 🟡     | 🔧    | Sin estrategia de redirecciones                         |
| 5.3 | Monitorización 404 en Google Search Console | ❌     | 👤    | Requiere verificar GSC está configurado                 |
| 5.4 | Páginas importantes no devuelven 404        | 🟡     | 🔧    | Verificar con crawl automático                          |
| 5.5 | Error pages amigables (500, 503)            | ❌     | 🔧    | **NUEVA sesión** — páginas de error con branding        |

---

## 6. REDES SOCIALES Y PRESENCIA EXTERNA

| #   | Requisito                          | Estado | Quién | Notas                                                                        |
| --- | ---------------------------------- | ------ | ----- | ---------------------------------------------------------------------------- |
| 6.1 | Open Graph bien configurado        | 🟡     | 🔧    | Verificar og:image (imagen representativa por vehículo)                      |
| 6.2 | Twitter Cards configuradas         | 🟡     | 🔧    | Verificar summary_large_image con foto del vehículo                          |
| 6.3 | Compartir en redes desde listings  | ❌     | 🔧    | Botones de compartir en ficha de vehículo                                    |
| 6.4 | Perfiles de redes sociales creados | ❌     | 👤    | LinkedIn empresa, Instagram, Twitter/X — no urgente pero útil para backlinks |
| 6.5 | Menciones de marca en otros sitios | ❌     | 👤    | Estrategia de link building cuando haya contenido editorial                  |
| 6.6 | Google Business Profile            | ❌     | 👤    | Si aplica (Tracciona no tiene sede física pública)                           |

---

## 7. ACCESIBILIDAD (WCAG 2.1 AA)

| #   | Requisito                                                      | Estado | Quién | Notas                                                         |
| --- | -------------------------------------------------------------- | ------ | ----- | ------------------------------------------------------------- |
| 7.1 | Alt text en todas las imágenes                                 | 🟡     | 🔧    | Verificar componentes Vue, especialmente galería de vehículos |
| 7.2 | Etiquetas semánticas HTML (header, nav, main, footer, article) | 🟡     | 🔧    | Nuxt layout, verificar estructura semántica                   |
| 7.3 | Contraste WCAG AA (4.5:1 texto normal, 3:1 texto grande)       | 🟡     | 🔧    | Sesión 52 — auditoría axe-core                                |
| 7.4 | Navegación por teclado (focus visible, tab order)              | 🟡     | 🔧    | Verificar focus rings en Tailwind                             |
| 7.5 | Labels en todos los inputs de formularios                      | 🟡     | 🔧    | Verificar con axe-core                                        |
| 7.6 | Skip to content link                                           | ❌     | 🔧    | **NUEVA sesión**                                              |
| 7.7 | ARIA landmarks donde sea necesario                             | 🟡     | 🔧    | Verificar en auditoría                                        |
| 7.8 | Reducir movimiento para `prefers-reduced-motion`               | ❌     | 🔧    | Si hay animaciones                                            |

---

## 8. MONETIZACIÓN (referencia — sesiones de negocio)

| #   | Requisito                                | Estado | Quién | Notas                                         |
| --- | ---------------------------------------- | ------ | ----- | --------------------------------------------- |
| 8.1 | Suscripción Founding Dealer implementada | ✅     | —     | Stripe integration existe                     |
| 8.2 | Planes de precios visibles en landing    | 🟡     | 🔧    | Página de pricing existe, verificar contenido |
| 8.3 | Informes DGT monetizables                | 🟡     | 🔧    | Endpoint existe, falta flujo de pago          |
| 8.4 | Destacados/boost de vehículos            | ❌     | 🔧    | Sesión 58 planificada                         |
| 8.5 | Demo mode (probar sin registrarse)       | ❌     | 🔧    | Sesión 57 planificada                         |
| 8.6 | Widget embebible para dealers            | ❌     | 🔧    | Sesión 57 planificada                         |

---

## RESUMEN EJECUTIVO

| Categoría                | Total  | ✅    | 🟡     | ❌     | % Hecho |
| ------------------------ | ------ | ----- | ------ | ------ | ------- |
| 1. UX                    | 15     | 3     | 10     | 2      | 20%     |
| 2. Branding/Confianza    | 10     | 2     | 5      | 3      | 20%     |
| 3. Contenido/Engagement  | 8      | 0     | 3      | 5      | 0%      |
| 4. SEO Técnico           | 12     | 2     | 8      | 2      | 17%     |
| 5. Errores/Redirecciones | 5      | 0     | 2      | 3      | 0%      |
| 6. Redes Sociales        | 6      | 0     | 2      | 4      | 0%      |
| 7. Accesibilidad         | 8      | 0     | 5      | 3      | 0%      |
| 8. Monetización          | 6      | 1     | 2      | 3      | 17%     |
| **TOTAL**                | **70** | **8** | **37** | **25** | **11%** |

**Nota:** Los 🟡 (37 ítems) son "probablemente parcialmente ok" pero sin verificación real. Muchos pasarán a ✅ tras las sesiones de auditoría (52, 61-64). El % real podría ser ~30-40%.

---

## PRIORIDAD DE IMPLEMENTACIÓN

### Fase 1 — Quick wins (sesiones 61-62, ~3-4h Claude Code)

Ítems que más impactan SEO sin mucho esfuerzo:

- Sitemap XML verificado y dinámico
- robots.txt correcto
- Meta tags únicos por página (title, description)
- Open Graph + Twitter Cards
- Canonical tags
- Hreflang (ES/EN)
- Página 404 personalizada
- Breadcrumbs
- Alt text audit
- Etiquetas semánticas audit

### Fase 2 — Schema + errores (sesión 63, ~2h Claude Code)

- Datos estructurados Schema.org (Vehicle, Product, Organization, BreadcrumbList)
- Páginas de error amigables (500, 503)
- Skip to content link
- Botones compartir en redes

### Fase 3 — Performance + accesibilidad (sesión 52 ya planificada + 64)

- Lighthouse CI
- Web Vitals monitoring
- Auditoría axe-core completa
- Contraste WCAG
- Focus management / keyboard nav

### Fase 4 — Contenido (sesión 58 ya planificada + fundadores)

- Blog/editorial SEO
- Tabla de contenidos automática
- Internal linking strategy
- Vídeo WhatsApp flow
- Perfiles redes sociales
