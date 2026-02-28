> ⚠️ **[LEGACY]** Documento histórico — solo referencia. No modificar ni usar como fuente de verdad. Ver `docs/tracciona-docs/` para documentación activa.

## PASO 7: MEJORAS POST-LANZAMIENTO — FASE 1 (Primeras semanas)

Estas mejoras requieren que el dominio esté activo y/o que haya contenido real cargado. NO hacerlas durante la migración técnica, sino inmediatamente después del primer deploy.

### 7.1 Google Search Console + Analytics 4 ⚡ CRÍTICO

Configurar INMEDIATAMENTE después del primer deploy:

**Search Console:**

- Verificar dominio tracciona.com (DNS TXT record o archivo HTML)
- Enviar sitemap.xml
- Verificar indexación de las primeras páginas
- Monitorizar errores de rastreo

**Analytics 4:**

- Crear propiedad GA4 para tracciona.com
- Instalar con `@nuxtjs/gtag` o script manual en `nuxt.config.ts`
- Configurar eventos de conversión:
  - `view_vehicle` — usuario abre ficha de vehículo
  - `contact_dealer` — usuario envía mensaje/llama
  - `apply_filter` — usuario filtra catálogo
  - `download_pdf` — usuario descarga ficha PDF
  - `landing_view` — usuario llega a landing SEO

### 7.2 IndexNow vía Cloudflare ⚡ FÁCIL

Activar IndexNow en el dashboard de Cloudflare (es un toggle, no requiere código).
Esto notifica a Bing y Yandex instantáneamente cuando hay contenido nuevo.

Para Google, considerar usar la Indexing API cuando se publican vehículos nuevos:

```typescript
// /server/api/notify-google.post.ts (futuro)
// Llamar a Google Indexing API cada vez que se publica/actualiza un vehículo
// Docs: https://developers.google.com/search/apis/indexing-api
```

### 7.3 Google Business Profile

Crear ficha de empresa cuando la SL esté constituida:

- Categoría: "Concesionario de vehículos industriales" o "Marketplace de vehículos"
- Dirección física de la empresa
- Teléfono, horario, web
- Fotos de vehículos/instalaciones
- Solicitar reseñas a primeros clientes

### 7.4 Alt text descriptivo en imágenes

Rellenar el campo `alt_text` de `vehicle_images` para cada vehículo con descripciones específicas:

```
"Cisterna Indox alimentaria 3 ejes 38.000 litros vista lateral"
"Cabeza tractora Renault T480 2022 interior cabina"
"Semirremolque frigorífico Schmitz SKO24 puertas abiertas"
```

Configurar Cloudinary para que las URLs incluyan nombre descriptivo:

```
tracciona/cisterna-indox-3-ejes-lateral.webp
en vez de:
tracciona/a8f3k2m9x.webp
```

### 7.5 Completar "Sobre Nosotros" con datos reales

Reescribir textos en i18n con contenido real:

- Historia de la empresa
- Equipo con nombres y fotos
- Dirección física y CIF de la SL
- Años de experiencia en el sector
- Valores y diferenciación
- Datos verificables que transmitan E-E-A-T

### 7.6 Títulos SEO optimizados por página

Ajustar `usePageSeo()` y `nuxt.config.ts`:

```
Home:       "Tracciona — Semirremolques, Cisternas y Camiones en Venta y Alquiler"
Landing:    "[Tipo] en [Acción] — Tracciona" (generado desde active_landings.meta_title_es)
Vehículo:   "[Marca] [Modelo] [Año] — [Tipo] en [Acción] | Tracciona" (ya se hace ✅)
Guía:       "[Título Artículo] — Guía Tracciona"
Nosotros:   "Sobre Tracciona — Marketplace de Vehículos Industriales"
```

### 7.7 Schema FAQPage en landing pages

Añadir JSON-LD de FAQPage en las landing pages activas. Las FAQs pueden generarse automáticamente desde plantillas:

```typescript
// Ejemplo para una landing de cisternas en alquiler:
const faqs = [
  {
    question: '¿Cuánto cuesta alquilar una cisterna?',
    answer: `Los precios de alquiler de cisternas en Tracciona van desde ${minPrice}€ hasta ${maxPrice}€ al mes según capacidad y tipo.`,
  },
  {
    question: '¿Qué documentación necesito para alquilar una cisterna?',
    answer:
      'Para alquilar una cisterna necesitas permiso de conducir válido, certificado ADR si es para mercancías peligrosas, y seguro de responsabilidad civil.',
  },
]
```

Incluir en el campo `schema_data` de active_landings.

### 7.8 Schema ItemList en catálogo

Añadir JSON-LD ItemList en la home y en cada landing activa con los primeros 10-20 vehículos:

```typescript
useJsonld({
  '@type': 'ItemList',
  itemListElement: vehicles.slice(0, 20).map((v, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `https://tracciona.com/vehiculo/${v.slug}`,
    name: v.title,
    image: v.images?.[0]?.url,
  })),
})
```

### 7.9 Rate limiting en catálogo público

Proteger contra scraping masivo:

**Opción rápida:** Cloudflare Rate Limiting Rules → 100 requests/minuto por IP para rutas de API.

**Opción robusta:** Crear server route como proxy:

```typescript
// /server/api/vehicles.get.ts
// Proxy entre cliente y Supabase con rate limiting propio
// Cachear resultados de queries frecuentes (categorías populares) con TTL de 5 min
```

### 7.10 Registrar dominio tracciona.es

Si no se tiene ya:

- Registrar tracciona.es como protección de marca
- Configurar redirección 301 → tracciona.com
- Coste: ~10€/año
- Evita que un competidor o domainer lo registre

---

## PASO 8: MEJORAS POST-LANZAMIENTO — FASE 2 (Meses 1-6)

Estas mejoras requieren catálogo real con contenido y tracción inicial. Implementar progresivamente.

### 8.1 Sección de noticias / contenido editorial

Completar Step 4 del roadmap original. Crear las tablas `news` + `comments` y las páginas correspondientes.

**Tipos de contenido editorial a publicar:**

| Tipo           | Ejemplo                                            | Frecuencia | Impacto SEO                  |
| -------------- | -------------------------------------------------- | ---------- | ---------------------------- |
| Guía de compra | "Cómo elegir una cisterna alimentaria"             | 2/mes      | Alto (long-tail informativo) |
| Normativa      | "Nueva normativa ADR 2026: qué cambia"             | 1/mes      | Alto (búsquedas específicas) |
| Comparativa    | "Cisterna Indox vs Parcisa: diferencias"           | 2/mes      | Muy alto (fase de decisión)  |
| Mercado        | "Precios de semirremolques en España Q1 2026"      | Trimestral | Alto (datos únicos)          |
| Tendencia      | "Vehículos industriales eléctricos: estado actual" | 1/mes      | Medio (tráfico general)      |

**Objetivo:** Mínimo 2 artículos/semana. Cada artículo con:

- H1 optimizado para keyword objetivo
- 800-1.500 palabras
- Enlaces internos a fichas de vehículos y landings de categoría
- Schema Article con JSON-LD
- Imágenes con alt text descriptivo

### 8.2 Comparativas de marcas

Contenido de altísimo valor SEO que nadie en el nicho crea:

```
"Cisterna Indox vs Parcisa: diferencias, precios y cuál elegir"
"Mejores semirremolques frigoríficos 2026: comparativa completa"
"Schmitz vs Kögel vs Krone: ¿qué semirremolque de lona comprar?"
"Renault T vs Volvo FH: cabezas tractoras para larga distancia"
```

Incluir:

- Tabla comparativa con especificaciones
- Pros y contras de cada marca
- Rango de precios real (desde vuestro catálogo)
- Enlaces a vehículos disponibles de cada marca
- Conclusión con recomendación por caso de uso

Potencial de fragmentos destacados y People Also Ask muy alto.

### 8.3 Internal linking desde descripciones

Cambiar `description_es/en` de vehículos de texto plano a markdown/HTML sanitizado con enlaces internos:

```html
<!-- Antes: -->
"Cisterna alimentaria Indox en perfecto estado, 3 ejes, 38.000 litros."

<!-- Después: -->
"Cisterna alimentaria Indox en perfecto estado, 3 ejes, 38.000 litros. Consulta más
<a href="/cisternas-alimentarias">cisternas alimentarias</a> disponibles o explora nuestro catálogo
de <a href="/cisternas">cisternas</a>."
```

Los enlaces contextuales dentro del contenido son la señal de enlazado interno más fuerte que Google reconoce.

### 8.4 Fragmentos destacados (position zero)

En artículos editoriales y landing pages, estructurar contenido para capturar featured snippets:

```html
<h2>¿Cuánto cuesta alquilar un semirremolque en España?</h2>
<p>
  El alquiler de un semirremolque en España cuesta entre 800€ y 2.500€ al mes dependiendo del tipo.
  Los frigoríficos son los más caros (1.500-2.500€/mes), seguidos de las cisternas
  (1.200-2.000€/mes) y las lonas (800-1.200€/mes). El precio incluye normalmente seguro y
  mantenimiento básico.
</p>
```

Formato: pregunta como H2 → párrafo de 40-60 palabras con respuesta directa → desarrollo.

### 8.5 Estrategia de backlinks

**Directorios de empresa (mes 1-2):**

- Páginas Amarillas, Cylex, QDQ, Europages
- Directorios sectoriales de transporte
- Registro como proveedor en marketplaces complementarios

**Asociaciones sectoriales (mes 2-4):**

- ASTIC (Asociación del Transporte Internacional)
- FENADISMER (Federación Nacional de Transporte)
- ASFARES (Asociación de Fabricantes de Semirremolques)
- AECOC (si aplica por vertical de hostelería futuro)

**Medios especializados (mes 3-6):**

- Transporte Profesional — nota de prensa o colaboración
- Todotransporte — artículo patrocinado o colaboración editorial
- Alimarket (para futuros verticales de hostelería/alimentación)

**Contenido linkable (continuo):**

- Informes de precios del sector (datos propios del catálogo)
- Calculadoras (coste por km, capacidad de carga, rentabilidad de alquiler)
- Infografías sobre normativa ADR, pesos máximos, etc.

### 8.6 Google Merchant Center (Listados gratuitos)

Cuando haya >50 vehículos publicados, implementar el feed de la server route creada en 6.13:

```typescript
// /server/api/merchant-feed.get.ts — Implementación real
export default defineEventHandler(async (event) => {
  const vehicles = await supabase.from('vehicles').select('*').eq('status', 'published').limit(1000)

  // Generar RSS 2.0 con namespace g: de Google
  const feed = generateMerchantFeed(vehicles.data)

  setResponseHeader(event, 'content-type', 'application/xml')
  return feed
})
```

Subir feed a Google Merchant Center para aparecer en Google Shopping gratuitamente. Ningún competidor en el nicho lo hace.

### 8.7 Actualizar updated_at activamente

Establecer rutina de actualización de contenido:

- Revisar precios semanalmente
- Actualizar descripciones de vehículos destacados
- Añadir fotos nuevas a listados existentes

Cada UPDATE en Supabase cambia `updated_at` automáticamente y el sitemap refleja fechas nuevas. Google prioriza sitios con contenido fresco y recrawlea más frecuentemente URLs con fechas recientes.

---

## PASO 9: MEJORAS POST-LANZAMIENTO — FASE 3 (Meses 6-18)

Estas mejoras son para cuando haya tracción real: tráfico, catálogo consolidado, y primeros ingresos.

### 9.1 PWA con Push Notifications

Implementar Progressive Web App (Step 6 del roadmap original):

```bash
npm install @vite-pwa/nuxt
```

Funcionalidades:

- Instalación en móvil como app nativa
- Notificaciones push para:
  - Nuevos vehículos en categorías que el usuario sigue
  - Bajadas de precio en vehículos favoritos
  - Respuestas de dealers a consultas
- Offline básico (página de "sin conexión" con últimos vehículos vistos)

Requiere service worker, manifest.json, y sistema de suscripciones vía Supabase Edge Functions.

### 9.2 Google Ads / SEM

Activar publicidad de pago SOLO cuando haya:

- Catálogo real con >100 vehículos
- Modelo de monetización activo (leads o comisiones)
- Landing pages indexadas y optimizadas

**Campañas recomendadas:**

| Campaña            | Keywords                             | Landing                              | Presupuesto |
| ------------------ | ------------------------------------ | ------------------------------------ | ----------- |
| Búsqueda marca     | "cisterna Indox venta"               | /marcas/indox                        | 200€/mes    |
| Búsqueda categoría | "semirremolque frigorífico alquiler" | /semirremolques-frigorifico-alquiler | 300€/mes    |
| Remarketing        | Usuarios que vieron fichas           | Display genérico                     | 150€/mes    |
| Shopping           | Feed Merchant Center                 | Fichas de vehículo                   | 250€/mes    |

**Presupuesto inicial recomendado:** 500-900€/mes. Escalar según ROI medido en GA4.

### 9.3 Redes sociales

Abrir perfiles SOLO cuando haya contenido publicable regularmente:

**LinkedIn (prioritario — B2B):**

- Perfil de empresa Tracciona
- Publicar: nuevos vehículos destacados, artículos del blog, datos del sector
- Frecuencia: 3-5 posts/semana
- Conectar con profesionales del transporte, dealers, fabricantes

**Instagram:**

- Fotos y vídeos de vehículos de calidad
- Stories mostrando detalles, interiores, proceso de inspección
- Reels de 30-60s con walkthroughs de vehículos
- Frecuencia: 3-4 posts/semana

**YouTube:**

- Vídeos de 1-3 minutos por vehículo destacado
- Walkthroughs, inspecciones, entregas
- Guías en vídeo ("Qué revisar al comprar una cisterna usada")
- Frecuencia: 1-2 vídeos/semana

**TikTok (opcional):**

- Clips cortos de vehículos espectaculares
- Behind the scenes
- Potencial viral en nicho de transporte

### 9.4 Web Stories para Google Discover

Crear historias visuales a pantalla completa para móvil:

```
5-6 slides por vehículo destacado:
1. Foto principal fullscreen + precio
2. Detalle exterior
3. Interior / cabina
4. Especificaciones clave
5. CTA "Ver ficha completa" con enlace
```

Generar como páginas estáticas en Nuxt. Google Discover tiene alcance masivo en móvil y puede generar picos de tráfico inesperados. Nadie en el sector lo hace.

### 9.5 Reseñas con Schema Review

Cuando haya transacciones reales:

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  vehicle_id UUID REFERENCES vehicles(id),
  dealer_id UUID, -- Referencia futura a tabla dealers
  author_name TEXT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified BOOLEAN DEFAULT false,
  status VARCHAR DEFAULT 'pending', -- pending, published, rejected
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Mostrar en fichas y en "Sobre Nosotros" con JSON-LD:

```typescript
useJsonld({
  '@type': 'AggregateRating',
  ratingValue: avgRating,
  reviewCount: totalReviews,
  bestRating: 5,
  worstRating: 1,
})
```

Las estrellas en resultados de búsqueda aumentan CTR entre 15-30%.

### 9.6 Content-Security-Policy

Implementar cuando el stack esté estabilizado:

```
Content-Security-Policy:
  default-src 'self';
  img-src 'self' https://res.cloudinary.com https://*.googletagmanager.com;
  script-src 'self' 'unsafe-inline' https://*.googletagmanager.com https://*.google-analytics.com;
  style-src 'self' 'unsafe-inline';
  font-src 'self';
  connect-src 'self' https://*.supabase.co https://*.google-analytics.com;
```

Ajustar según dominios activos en ese momento (AdSense, Merchant Center, etc.).

### 9.7 Lighthouse >90

Medir Lighthouse como baseline después de la migración. Optimizar iterativamente:

**Objetivos:**

- Performance: >90
- Accessibility: >95
- Best Practices: >95
- SEO: >95

**Áreas típicas de mejora:**

- Lazy loading de imágenes below-the-fold
- Preload de recursos críticos
- Reducir JavaScript no utilizado
- Optimizar imágenes (ya cubierto por Cloudinary)
- Reducir CLS con dimensiones explícitas en imágenes

---

## NOTAS IMPORTANTES

- La carpeta original `tank-iberica/` es el BACKUP. NO TOCARLA.
- Todos los cambios van en `Tracciona/`.
- Si algún rename genera conflictos (ej: renombrar subcategories a categories cuando categories ya existe como nombre), resolver con tabla temporal intermedia.
- El orden de los ALTER TABLE RENAME es CRÍTICO. Planificar el orden para evitar colisiones de nombres.
- Los datos existentes en la BD deben migrarse. Las migraciones SQL incluyen UPDATEs para mover datos del formato antiguo al nuevo.
- El enum `vehicle_category` se mantiene temporalmente hasta confirmar que todo funciona con la tabla `actions`.
- Este es un refactor de nomenclatura + añadir columna vertical + nuevas tablas. La lógica de negocio NO cambia.

---
