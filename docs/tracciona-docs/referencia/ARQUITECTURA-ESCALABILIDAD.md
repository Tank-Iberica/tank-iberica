# ARQUITECTURA DE ESCALABILIDAD — Documento técnico de referencia

> **Audiencia:** Auditores externos, Claude Code, desarrolladores, inversores técnicos.
> **Propósito:** Explicar por qué la arquitectura de Tracciona escala a 20 verticales × 10M visitas/mes (200M total) con costes controlados, y cómo cada decisión de diseño contribuye a ello.
> **Última actualización:** 23 de febrero de 2026

---

## 1. RESUMEN EJECUTIVO

Tracciona no es una app monolítica que escala "tirando hardware". Es una arquitectura distribuida diseñada desde el día 1 para multiplicarse horizontalmente sin que los costes se multipliquen linealmente.

**Cifras objetivo:**

| Escenario   | Verticales | Visitas/mes | Coste infra estimado |
| ----------- | ---------- | ----------- | -------------------- |
| Lanzamiento | 1          | 50K-200K    | $34/mes              |
| Año 1       | 1-3        | 500K-2M     | $60-90/mes           |
| Año 2       | 4-7        | 2M-10M      | $108-200/mes         |
| Año 3+      | 10-20      | 10M-200M    | $250-600/mes         |

**Comparativa con enfoque "bruto" (1 servidor grande para todo):**

| Componente    | Enfoque bruto (10M)                 | Arquitectura Tracciona (10M)     | Ahorro   |
| ------------- | ----------------------------------- | -------------------------------- | -------- |
| Base de datos | $2,000/mes (Supabase Dedicated 2XL) | $150-350/mes (multi-cluster Pro) | 83-93%   |
| Imágenes      | $2,500/mes (Cloudinary Pro)         | $0-89/mes (pipeline híbrido)     | 96-100%  |
| CDN/Hosting   | $200/mes                            | $0 (Cloudflare Pages free)       | 100%     |
| Email         | $500/mes                            | $500/mes (Resend)                | 0%       |
| Monitoring    | $200/mes                            | $200/mes (Sentry)                | 0%       |
| **Total**     | **$5,750/mes**                      | **$350-600/mes**                 | **~90%** |

La diferencia no es magia: es arquitectura. Este documento explica cada pieza.

---

## 2. STACK TECNOLÓGICO Y POR QUÉ CADA PIEZA

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO (navegador/móvil)                 │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼───────────────────────────────────┐
│              CLOUDFLARE (CDN + Edge + WAF)                   │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────────┐  │
│  │  Pages   │  │ Workers  │  │  Cache  │  │  WAF + Rate  │  │
│  │ (hosting)│  │ (SSR)    │  │  (edge) │  │  Limiting    │  │
│  └─────────┘  └──────────┘  └─────────┘  └──────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
┌────────▼──────┐  ┌──────▼───────┐  ┌─────▼─────────┐
│  SUPABASE     │  │  CLOUDINARY  │  │  CF IMAGES    │
│  (PostgreSQL  │  │  (proceso)   │  │  (almacén)    │
│   + Auth      │  │              │  │               │
│   + Realtime) │  │  25K trans/  │  │  $5/100K img  │
│               │  │  mes gratis  │  │               │
│  Multi-cluster│  └──────────────┘  └───────────────┘
│  Pro $25/u    │
└───────────────┘
         │
    ┌────┼────┐
    │    │    │
┌───▼┐ ┌▼──┐ ┌▼────┐
│ C1 │ │C2 │ │ C3  │  ← Clusters Supabase
│Pro │ │Pro│ │ Pro │     (1 proyecto = 4 unid. de peso)
│$25 │ │$25│ │ $25 │
└────┘ └───┘ └─────┘
```

### ¿Por qué este stack?

| Componente                         | Alternativas evaluadas                       | Razón de elección                                                                       |
| ---------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Nuxt 3** (SSR + SPA)             | Next.js, SvelteKit, Astro                    | Vue ecosystem maduro, SSR híbrido, ISR/SWR nativo, i18n excelente, auto-imports         |
| **Supabase** (BaaS PostgreSQL)     | Firebase, PlanetScale, Neon                  | PostgreSQL real (no NoSQL), RLS nativo, Auth incluido, Realtime, precio predecible      |
| **Cloudflare Pages** (hosting)     | Vercel, Netlify, AWS Amplify                 | Free tier generoso (unlimited bandwidth), Workers integrados, edge global, WAF incluido |
| **Cloudinary** (proceso de imagen) | imgix, Uploadcare, Sharp                     | 25K transformaciones/mes gratis, AI auto-crop, WebP automático, CDN incluido            |
| **CF Images** (almacén de imagen)  | Cloudinary storage, S3+CloudFront, bunny.net | $5/100K imágenes almacenadas, delivery via CF CDN gratis, variantes predefinidas        |

**Principio de diseño:** Cada componente tiene un tier gratuito generoso o un precio por uso muy bajo. El coste crece proporcionalmente al uso real, no en escalones de $500.

---

## 3. SISTEMA DE CLUSTERS SUPABASE (el corazón de la escalabilidad)

### 3.1 El problema que resuelve

Un solo proyecto Supabase Pro ($25/mes) tiene límites prácticos:

- 8GB de almacenamiento
- ~200 conexiones simultáneas (con pgBouncer)
- 500 Edge Function invocations/segundo

Con 20 verticales y millones de visitas, un solo proyecto no aguanta. La solución "bruta" es Supabase Dedicated ($2,000+/mes). Nuestra solución: distribuir verticales en múltiples proyectos Pro.

### 3.2 Modelo de peso por vertical

No todas las verticales consumen igual. Clasificamos por "peso":

| Tipo      | Peso | Ejemplo                               | Características                                                 |
| --------- | ---- | ------------------------------------- | --------------------------------------------------------------- |
| 🔴 Pesada | 1.0  | Tracciona, Horecaria, CampoIndustrial | Alto volumen de listings, imágenes pesadas, búsquedas complejas |
| 🟡 Media  | 0.4  | ReSolar                               | Volumen moderado, menos imágenes                                |
| 🟢 Ligera | 0.15 | Municipiante, Clinistock, BoxPort     | Bajo volumen, nicho                                             |

**Regla: 1 proyecto Supabase Pro = 4.0 unidades de peso.**

### 3.3 Distribución progresiva

```
AÑO 1: 1 cluster
┌─────────────────────────────────┐
│ Cluster 1 (Pro $25/mes)        │
│ Tracciona (1.0)                │
│ Peso: 1.0 / 4.0 = 25%         │
└─────────────────────────────────┘
Total: $25/mes

AÑO 2: 2 clusters
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│ Cluster 1                       │  │ Cluster 2                       │
│ Tracciona (1.0)                │  │ CampoIndustrial (1.0)          │
│ Horecaria (1.0)                │  │ ReSolar (0.4)                  │
│ Municipiante (0.15)            │  │ Clinistock (0.15)              │
│ Peso: 2.15 / 4.0 = 54%        │  │ Peso: 1.55 / 4.0 = 39%        │
└─────────────────────────────────┘  └─────────────────────────────────┘
Total: $50/mes

AÑO 3: 5-6 clusters (20 verticales)
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ C1     │ │ C2     │ │ C3     │ │ C4     │ │ C5     │ │ C6     │
│ Tracc. │ │ Campo  │ │ Horc.  │ │ V10-12 │ │ V13-16 │ │ V17-20 │
│ +3 lig │ │ +3 lig │ │ +3 lig │ │ (ligs) │ │ (ligs) │ │ (ligs) │
│ 1.45/4 │ │ 1.45/4 │ │ 1.45/4 │ │ 0.6/4  │ │ 0.6/4  │ │ 0.6/4  │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
Total: $150/mes (6 × $25)
```

### 3.4 Cuándo migrar verticales entre clusters

La tabla `infra_clusters` y el cron `infra-metrics` monitorizan el peso de cada cluster. Reglas de migración:

| Peso del cluster | Estado        | Acción                                               |
| ---------------- | ------------- | ---------------------------------------------------- |
| < 70%            | ✅ Normal     | Ninguna                                              |
| 70-85%           | ⚠️ Warning    | Planificar migración en próximos 30 días             |
| 85-95%           | 🔴 Crítico    | Migrar vertical más ligera a otro cluster en <7 días |
| > 95%            | ⚫ Emergencia | Crear nuevo cluster + migrar inmediatamente          |

### 3.5 Proceso de migración (zero downtime)

1. Crear nuevo proyecto Supabase Pro
2. Aplicar migraciones SQL (`npx supabase db push --project-ref NUEVO`)
3. Copiar datos filtrados por vertical (SELECT WHERE vertical = X → INSERT en destino)
4. Actualizar variable `SUPABASE_URL` en el deploy de Cloudflare Pages del vertical
5. Verificar que todo funciona en destino
6. Borrar datos del origen (manual, después de verificar)

El código fuente NO cambia. Solo cambia la variable de entorno que apunta al cluster correcto.

## Dependencias reales de Supabase

Supabase proporciona 4 servicios críticos simultáneos:

| Servicio      | Qué usamos                              | Alternativa si falla     | Tiempo migración real     |
| ------------- | --------------------------------------- | ------------------------ | ------------------------- |
| PostgreSQL    | BD completa, RLS, vistas materializadas | Neon, Railway, VPS       | 4-8h                      |
| GoTrue (Auth) | Login, tokens, sesiones, PKCE           | Auth.js, Clerk           | 24-48h (sesiones activas) |
| Realtime      | Subastas en vivo (websockets)           | CF Durable Objects, Ably | 8-16h                     |
| Vault         | Secretos (si se usa)                    | Variables de entorno CF  | 1h                        |

**Riesgo:** Si Supabase cae o cambia precios, las 4 capas se afectan simultáneamente.

**Mitigación:** Cuando se cree un 2º cluster, considerar Neon o Railway (solo PostgreSQL) para empezar a diversificar vendor lock-in. Auth y Realtime seguirían en cluster principal Supabase.

### 3.6 Por qué NO necesitamos Supabase Dedicated

Las auditorías externas sugieren Supabase Dedicated ($2,000/mes) para 10M usuarios. Esto asume:

1. **Un solo servidor para todo** — Nosotros distribuimos en clusters
2. **Alto write throughput** — Un marketplace B2B es 95%+ lecturas (fichas, catálogos, búsquedas). Las escrituras (leads, publicaciones, pagos) son una fracción mínima
3. **Sin caching** — Nosotros cacheamos agresivamente en Cloudflare edge (ver sección 4)
4. **Sin pgBouncer** — Supabase Pro incluye pgBouncer, que multiplica las conexiones efectivas ×10

Un marketplace no es un juego online ni una red social con chat en tiempo real. El patrón de acceso (95% lecturas, 5% escrituras, datos que cambian cada horas no segundos) es ideal para Supabase Pro + cache en edge.

---

## 4. CAPA DE CACHE (Cloudflare Edge)

### 4.1 Stale-While-Revalidate (SWR) en Nuxt 3

`nuxt.config.ts` define reglas de cache por ruta:

```
Ruta                    │ Cache SWR      │ Razón
────────────────────────┼────────────────┼──────────────────────────
/                       │ 10 minutos     │ Home cambia poco
/vehiculo/**            │ 5 minutos      │ Fichas: precios pueden cambiar
/noticias               │ 10 minutos     │ Índice de noticias
/noticias/**            │ 30 minutos     │ Artículo individual
/guia/**                │ 1 hora         │ Contenido evergreen
/sobre-nosotros         │ 24 horas       │ Casi estático
/legal                  │ 24 horas       │ Estático
/subastas               │ 1 minuto       │ Necesita frescura (pujas)
/subastas/**            │ 1 minuto       │ Idem
/admin/**               │ Sin SSR        │ Client-side only (SPA)
/dashboard/**           │ Sin SSR        │ Client-side only (SPA)
/perfil/**              │ Sin SSR        │ Client-side only (SPA)
```

**Impacto:** Una ficha de vehículo con 1,000 visitas/hora genera 1 request a Supabase (la primera), no 1,000. Las siguientes 999 se sirven desde Cloudflare edge (latencia <50ms, coste $0).

### 4.2 Flujo de una request con cache

```
Usuario solicita /vehiculo/cisterna-indox-2019
        │
        ▼
   Cloudflare Edge (Madrid)
        │
        ├─ Cache HIT? ─────── SÍ → Devolver HTML cacheado (< 50ms, $0)
        │                            │
        │                            ├─ ¿Cache stale? → Revalidar en background
        │                            │                   (usuario no espera)
        │                            └─ ¿Cache fresh? → Fin
        │
        └─ Cache MISS ─────── NO → Worker ejecuta SSR
                                      │
                                      ├─ Query a Supabase (~100ms)
                                      ├─ Renderizar HTML (~50ms)
                                      ├─ Guardar en cache edge
                                      └─ Devolver al usuario (~200ms)
```

### 4.3 Reducción de carga en Supabase (estimación)

| Sin cache                  | Con SWR                     | Reducción |
| -------------------------- | --------------------------- | --------- |
| 10M requests/mes a BD      | ~200K requests/mes a BD     | 98%       |
| 200 conexiones simultáneas | 5-10 conexiones simultáneas | 95%       |

Esta es la razón principal por la que Supabase Pro ($25/mes) aguanta millones de visitas.

---

## 5. PIPELINE HÍBRIDO DE IMÁGENES

### 5.1 El problema del coste de imágenes

Un marketplace de vehículos es intensivo en imágenes: cada ficha tiene 10-30 fotos × 4 variantes (thumb, card, gallery, og) × miles de fichas. Cloudinary cobra por transformación y almacenamiento.

**Coste Cloudinary si procesamos todo ahí:**

| Verticales | Imágenes | Transformaciones/mes | Almacenamiento | Coste estimado        |
| ---------- | -------- | -------------------- | -------------- | --------------------- |
| 1          | 50K      | ~200K                | 50GB           | $89/mes (Plus)        |
| 7          | 350K     | ~1.4M                | 350GB          | $500/mes (Advanced)   |
| 20         | 1M       | ~4M                  | 1TB            | $2,500/mes (estimado) |

### 5.2 La solución: pipeline híbrido

```
Dealer sube foto
       │
       ▼
  Cloudinary (proceso)           CF Images (almacén)
  ┌───────────────────┐          ┌───────────────────┐
  │ 1. Recibe imagen  │          │                   │
  │ 2. Auto-crop AI   │──────── │ 4. Almacena WebP  │
  │ 3. Mejora calidad │ 4 vars  │ 5. Sirve via CDN  │
  │    + WebP convert │          │    ($5 / 100K img)│
  │                   │          │                   │
  │ GRATIS (25K/mes)  │          │ $0.05 / 1K imgs   │
  └───────────────────┘          └───────────────────┘
```

**Flujo detallado:**

1. Dealer sube foto original a Cloudinary (upload gratuito)
2. Server route `/api/images/process` pide 4 variantes a Cloudinary con transformaciones AI (auto-crop, mejora, WebP)
3. Descarga las 4 variantes procesadas
4. Sube las 4 variantes a CF Images (almacenamiento permanente, $5/100K imágenes)
5. Guarda las URLs de CF Images en la BD
6. La foto se sirve desde Cloudflare CDN global (gratis, incluido en CF Images)

**Coste real con pipeline híbrido:**

| Verticales | Imágenes nuevas/mes | Trans. Cloudinary       | CF Images almacén | Coste total          |
| ---------- | ------------------- | ----------------------- | ----------------- | -------------------- |
| 1          | 5K                  | 20K (gratis)            | 50K imgs × $0.05  | $2.50/mes            |
| 7          | 30K                 | 25K (gratis) + overflow | 350K × $0.05      | $17.50/mes           |
| 20         | 80K                 | 25K gratis + $89 Plus   | 1M × $0.05        | $50 + $89 = $139/mes |

Comparativa: **$139/mes** vs **$2,500/mes** con Cloudinary puro = ahorro del 94%.

### 5.3 Modos del pipeline

Controlado por variable de entorno `IMAGE_PIPELINE_MODE`:

| Modo             | Comportamiento                                | Cuándo usar                                    |
| ---------------- | --------------------------------------------- | ---------------------------------------------- |
| `cloudinary`     | Devuelve URLs de Cloudinary directamente      | Desarrollo, o si CF Images no está configurado |
| `hybrid`         | Procesa en Cloudinary → almacena en CF Images | **Producción (recomendado)**                   |
| `cf_images_only` | Sube directo a CF Images sin Cloudinary       | Si se agotan transformaciones Cloudinary       |

### 5.4 Convivencia de imágenes antiguas y nuevas

El composable `useImageUrl` detecta el origen de la imagen por la URL:

- Si contiene `imagedelivery.net` → es CF Images → servir con variante
- Si contiene `cloudinary.com` → es Cloudinary legacy → servir con transformaciones en URL

Las imágenes antiguas (Cloudinary) siguen funcionando. Las nuevas van a CF Images. La migración batch es opcional y ejecutable desde el admin.

---

## 6. HOSTING Y EDGE COMPUTING (Cloudflare)

### 6.1 Por qué Cloudflare Pages (y no Vercel/Netlify)

| Feature                 | Cloudflare Pages     | Vercel                 | Netlify                |
| ----------------------- | -------------------- | ---------------------- | ---------------------- |
| Bandwidth               | **Ilimitado gratis** | 100GB/mes (free), $20+ | 100GB/mes (free), $19+ |
| Builds                  | 500/mes (free)       | 100/mes (free)         | 300/mes (free)         |
| Workers/Functions       | **Incluidos**        | Incluidos              | Incluidas              |
| WAF                     | **Incluido**         | $150/mes (Enterprise)  | No incluido            |
| Rate Limiting           | **Incluido**         | Manual                 | Manual                 |
| DDoS Protection         | **Incluido (L3-L7)** | Básico                 | Básico                 |
| Edge locations          | **300+ ciudades**    | ~20 regiones           | ~10 regiones           |
| Custom domains          | Ilimitados           | Ilimitados             | Ilimitados             |
| Coste a 10M visitas/mes | **$0**               | ~$150/mes              | ~$100/mes              |

**Conclusión:** Cloudflare Pages ofrece hosting gratuito con protecciones de seguridad que otros cobran $150+/mes. Para un marketplace donde el tráfico es impredecible (un artículo viral puede generar picos), el bandwidth ilimitado elimina la preocupación.

### 6.2 Seguridad en edge (WAF + Rate Limiting)

Configurado en Cloudflare Dashboard (zero code en la app):

```
Capa 1: DDoS Protection (automático, L3-L7)
Capa 2: Bot Fight Mode (anti-scraping)
Capa 3: WAF Managed Rules (OWASP Top 10)
Capa 4: Rate Limiting por ruta:
         /api/email/send:     10 req/min por IP
         /api/stripe/*:       20 req/min por IP
         /api/account/delete:  2 req/min por IP
         /api/* POST:          30 req/min por IP
Capa 5: Turnstile CAPTCHA (formularios públicos)
Capa 6: SSL/TLS Full (Strict)
```

**Ventaja clave:** El rate limiting se ejecuta en edge (antes de que la request llegue al Worker). Un ataque de 10,000 requests/segundo a `/api/email/send` se corta en Cloudflare, no en nuestro servidor.

### 6.3 Multi-deploy para verticales

Cada vertical tiene su propio deploy en Cloudflare Pages:

```
tracciona.com       → Deploy 1  (VERTICAL=tracciona,  SUPABASE_URL=cluster-1)
horecaria.com       → Deploy 2  (VERTICAL=horecaria,   SUPABASE_URL=cluster-1)
campoindustrial.com → Deploy 3  (VERTICAL=campoindustrial, SUPABASE_URL=cluster-2)
```

**El mismo código fuente** se despliega N veces con diferentes variables de entorno. Cero duplicación de código. Cada deploy apunta al cluster Supabase correcto para su vertical.

---

## 7. PATRÓN DE DATOS: 95% LECTURAS

### 7.1 Por qué esto importa

Un marketplace B2B no es Twitter ni un videojuego. El patrón de acceso es:

| Operación     | Frecuencia | Ejemplo                                              |
| ------------- | ---------- | ---------------------------------------------------- |
| **Lectura**   | 95-98%     | Ver fichas, buscar, filtrar, catálogo, landing pages |
| **Escritura** | 2-5%       | Publicar vehículo, enviar lead, pujar, registrarse   |

Esto significa que la optimización de lecturas (cache, índices, queries eficientes) tiene un impacto 20x mayor que optimizar escrituras.

### 7.2 Capas de optimización de lectura

```
Lectura: "Ver ficha de cisterna Indox 2019"

Capa 1: Cloudflare Edge Cache (SWR)
         → 98% de requests se sirven aquí
         → Latencia: <50ms
         → Coste: $0

Capa 2: Nuxt SSR con pgBouncer
         → 2% de requests llegan aquí (cache miss o revalidación)
         → pgBouncer reutiliza conexiones (60 reales → 600+ virtuales)
         → Latencia: ~200ms

Capa 3: PostgreSQL con índices
         → Query optimizado por índices (brand, status, location, etc.)
         → 6 índices estratégicos (sesión 35)
         → Latencia del query: <50ms

Capa 4: Vista materializada (datos de mercado)
         → market_data, price_history, demand_data
         → Refresh diario a las 03:00 (cron)
         → Evita aggregations costosas en cada request
```

### 7.3 Índices de BD (estratégicos, no exhaustivos)

```sql
-- Los 8 índices que cubren el 90% de las queries del catálogo:
idx_vehicles_location_province    -- Filtro por provincia
idx_vehicles_location_region      -- Filtro por comunidad autónoma
idx_vehicles_location_country     -- Filtro por país
idx_vehicles_brand_trgm           -- Búsqueda fuzzy por marca (gin_trgm_ops)
idx_vehicles_status_created       -- Listados activos ordenados por fecha
idx_vehicles_visible_from         -- Sistema Pro 24h (filtro temporal)
idx_invoices_dealer_created       -- Facturas por dealer
idx_payments_checkout_session     -- Idempotencia de pagos
```

---

## 8. ESCALABILIDAD POR COMPONENTE (TABLA DE LÍMITES)

| Componente             | Plan actual   | Límite práctico                           | Cuando escalar  | Siguiente tier    | Coste siguiente |
| ---------------------- | ------------- | ----------------------------------------- | --------------- | ----------------- | --------------- |
| **Supabase**           | Pro ($25)     | ~4 verticales pesadas por cluster         | Peso > 80%      | Nuevo cluster Pro | +$25/mes        |
| **Cloudflare Pages**   | Free          | Sin límite práctico (bandwidth ilimitado) | —               | —                 | —               |
| **Cloudflare Workers** | Free          | 100K req/día                              | >70K req/día    | Paid ($5/mes)     | $5/mes          |
| **Cloudinary**         | Free          | 25K transformaciones/mes                  | >20K trans/mes  | Plus ($89/mes)    | $89/mes         |
| **CF Images**          | Pay-as-you-go | Sin límite                                | —               | —                 | $5/100K imgs    |
| **Resend**             | Free          | 100 emails/día                            | >80 emails/día  | Pro ($20/mes)     | $20/mes         |
| **Sentry**             | Free          | 5K eventos/mes                            | >4K eventos/mes | Team ($26/mes)    | $26/mes         |
| **Stripe**             | Pay-as-you-go | Sin límite                                | —               | —                 | 1.4% + 0.25€/tx |

### 8.1 Puntos de inflexión (cuándo cuesta más)

```
$34/mes   ──────────────→ 1 vertical, <200K visitas/mes
                          (Supabase Pro + todo free)

$60/mes   ──────────────→ 1-3 verticales, <1M visitas/mes
                          (+ Resend Pro si >100 emails/día)

$110/mes  ──────────────→ 4-7 verticales, <5M visitas/mes
                          (+ 2º cluster + CF Workers Paid)

$200/mes  ──────────────→ 7-12 verticales, <10M visitas/mes
                          (+ Cloudinary Plus si pipeline híbrido no basta)

$350/mes  ──────────────→ 12-20 verticales, <50M visitas/mes
                          (5-6 clusters + todos los tiers pagados)

$600/mes  ──────────────→ 20 verticales, ~200M visitas/mes
                          (máximo del modelo actual)
```

### 8.2 Techo del modelo actual y plan B

El modelo de multi-cluster Supabase Pro tiene un techo natural: ~20 verticales pesadas requerirían ~10 clusters ($250/mes), lo cual sigue siendo excelente. Pero si una sola vertical crece tanto que 1 cluster Pro no basta (ej: Tracciona llega a 50M visitas/mes por sí sola), entonces:

**Plan B — Supabase Dedicated (solo para esa vertical):**

- Migrar la vertical congestionada a Dedicated
- El resto sigue en clusters Pro
- Coste incremental: $200-400/mes por esa vertical específica
- No necesario hasta >10M visitas/mes en UNA sola vertical

**Plan C — PostgreSQL autoalojado:**

- Railway, Neon, o VPS con PostgreSQL
- Script de migración documentado (sesión 30)
- Mismas queries, mismos índices, solo cambia la URL de conexión

---

## 9. MONITORIZACIÓN Y ALERTAS AUTOMÁTICAS

### 9.1 Sistema proactivo (sesión 33)

No esperamos a que algo se caiga. El cron `infra-metrics` (cada hora) consulta las APIs de cada componente y genera alertas automáticas:

```
┌─────────────────────────────────────────────┐
│          Cron infra-metrics (1h)             │
│                                             │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  │
│  │Supabase │  │Cloudflare│  │Cloudinary │  │
│  │ API     │  │ API      │  │ API       │  │
│  └────┬────┘  └────┬─────┘  └─────┬─────┘  │
│       └──────┬─────┴──────────────┘         │
│              ▼                               │
│     ┌────────────────┐                       │
│     │ infra_metrics   │ (snapshots horarios)  │
│     └────────┬───────┘                       │
│              ▼                               │
│     ┌────────────────┐                       │
│     │ Evaluar umbrales│                       │
│     │ >70%: warning   │                       │
│     │ >85%: critical  │                       │
│     │ >95%: emergency │                       │
│     └────────┬───────┘                       │
│              ▼                               │
│     ┌────────────────┐                       │
│     │ infra_alerts    │                       │
│     │ + email + push  │ (con cooldown)        │
│     └────────────────┘                       │
└─────────────────────────────────────────────┘
```

### 9.2 Panel en admin

Página `/admin/infraestructura` con 4 tabs:

1. **Estado actual** — Cards por componente con barras de uso (%)
2. **Alertas** — Lista filtrable, botón reconocer
3. **Historial** — Gráficos de tendencia (24h, 7d, 30d)
4. **Migración** — Wizard de migración de clusters

### 9.3 Recomendaciones automáticas

Cada alerta incluye una acción concreta:

| Situación              | Recomendación                                     |
| ---------------------- | ------------------------------------------------- |
| Cluster peso > 80%     | "Crear nuevo cluster y migrar verticales ligeras" |
| Cloudinary trans > 70% | "Verificar que pipeline híbrido está activo"      |
| CF Workers req > 70%   | "Revisar SWR de routeRules (aumentar cache)"      |
| Resend emails > 80%    | "Upgrade a Resend Pro ($20/mes)"                  |

---

## 10. DISEÑO PARA MULTI-VERTICAL (CÓDIGO COMPARTIDO)

### 10.1 Un solo codebase, N deploys

El mismo código Nuxt 3 sirve para todos los verticales. Lo que cambia entre verticales son **datos en base de datos**, no código:

| Qué cambia por vertical    | Dónde se configura                 | Ejemplo                                    |
| -------------------------- | ---------------------------------- | ------------------------------------------ |
| Nombre, logo, colores      | `vertical_config` (BD)             | Tracciona = verde oscuro, Horecaria = rojo |
| Categorías y subcategorías | `categories`, `subcategories` (BD) | Cisternas vs Hornos industriales           |
| Atributos de filtrado      | `attributes` (BD)                  | MMA, ejes vs Potencia, consumo             |
| Textos de UI               | `i18n/es.json`, `en.json`          | "Vehículo" vs "Equipo"                     |
| Artículos editoriales      | `articles` (BD)                    | Normativa ADR vs Normativa sanitaria       |

### 10.2 Clonar un vertical = 30 minutos

```bash
# 1. Insertar configuración en BD (desde admin o SQL)
INSERT INTO vertical_config (vertical, name, ...) VALUES ('horecaria', ...);
INSERT INTO categories (vertical, name, ...) VALUES ('horecaria', ...);

# 2. Crear nuevo deploy en Cloudflare Pages
# Variable de entorno: VERTICAL=horecaria, SUPABASE_URL=...

# 3. Apuntar dominio
# horecaria.com → CNAME al deploy de Cloudflare Pages

# Listo. Zero cambios de código.
```

### 10.3 Aislamiento de datos

Cada vertical tiene sus datos aislados por la columna `vertical` en todas las tablas:

```sql
-- Queries del catálogo siempre filtran por vertical:
SELECT * FROM vehicles
WHERE vertical = 'tracciona'  -- Variable de entorno
AND status = 'published'
AND visible_from <= NOW();

-- RLS policies refuerzan el aislamiento:
CREATE POLICY "vehicles_select" ON vehicles
FOR SELECT USING (vertical = current_setting('app.vertical', true) OR vertical IS NULL);
```

Un dealer de Tracciona nunca ve datos de Horecaria, aunque estén en el mismo cluster Supabase.

---

## 11. SEGURIDAD EN PROFUNDIDAD

### 11.1 Capas de seguridad (Defense in Depth)

```
Capa 1: Cloudflare WAF + DDoS + Bot Fight Mode
         ↓ (filtra 90%+ del tráfico malicioso)
Capa 2: Rate Limiting en edge (por ruta, por IP)
         ↓ (limita abuso restante)
Capa 3: Turnstile CAPTCHA (formularios públicos)
         ↓ (filtra bots que pasan rate limit)
Capa 4: Autenticación (Supabase Auth + JWT)
         ↓ (identifica al usuario)
Capa 5: Ownership validation (¿es tu recurso?)
         ↓ (IDOR protection)
Capa 6: RLS en PostgreSQL (Row Level Security)
         ↓ (última línea de defensa en BD)
Capa 7: CSP + Security Headers
         ↓ (mitigación XSS client-side)
Capa 8: DOMPurify (sanitización v-html)
         ↓ (contenido de BD limpio)
```

### 11.2 Estado actual de remediación

Las sesiones 34, 34b y 35 cubren la totalidad de hallazgos de 3 auditorías externas + auditoría propia:

| Área                     | Hallazgos                        | Estado            |
| ------------------------ | -------------------------------- | ----------------- |
| Auth en endpoints        | 8 endpoints sin auth             | Sesiones 34 + 35  |
| Webhooks sin firma       | Stripe + WhatsApp                | Sesión 34         |
| IDOR (ownership)         | 5 endpoints                      | Sesiones 34 + 35  |
| RLS gaps                 | 7 tablas con policies faltantes  | Sesión 35         |
| CSP headers              | Ausentes                         | Sesión 35         |
| v-html sin sanitizar     | Instancias con DOMPurify ausente | Sesión 35         |
| Rate limiting            | En memoria (ineficaz)            | Sesión 34 (→ WAF) |
| SSRF                     | 1 endpoint (images/process)      | Sesión 35         |
| PII en logs              | 3 archivos                       | Sesión 34b        |
| Dependencias vulnerables | xlsx sin parches                 | Sesión 35         |

---

## 12. ROADMAP DE ESCALABILIDAD

```
Hoy ─────────────── Mes 3 ─────────── Mes 12 ─────────── Mes 24+
│                    │                  │                   │
│ 1 vertical         │ 1-3 verticales   │ 7 verticales      │ 20 verticales
│ 1 cluster          │ 1-2 clusters     │ 3-4 clusters      │ 5-6 clusters
│ Pipeline cloudinary │ Pipeline hybrid  │ Pipeline hybrid   │ CF Images only
│ $34/mes            │ $60-90/mes       │ $150-200/mes      │ $350-600/mes
│                    │                  │                   │
│ Sesiones 34-35:    │ Monitorización   │ Auto-migración    │ Si 1 vertical
│ seguridad 10/10    │ activa (sesión   │ entre clusters    │ supera 50M/mes
│                    │ 33)               │ vía admin wizard  │ → Plan B
```

---

## 13. PREGUNTAS FRECUENTES DE AUDITORES

### "¿Y si Supabase se cae?"

Supabase Pro tiene SLA de 99.9% (8.7h downtime/año). Además:

- Backups automáticos diarios (incluidos en Pro)
- Script de migración a PostgreSQL autoalojado documentado (sesión 30)
- Los datos se exportan con `pg_dump` estándar — no hay vendor lock-in

### "¿Y si Cloudflare cambia sus precios?"

El código es Nuxt 3 estándar, desplegable en Vercel o Netlify con 1 cambio de configuración. No usamos APIs propietarias de Cloudflare en el código (solo Workers estándar).

### "¿Por qué no Kubernetes/Docker/microservicios?"

Porque la complejidad operativa sería 10x mayor para el mismo resultado. Nuxt 3 + Supabase + Cloudflare es un stack serverless que escala automáticamente sin gestionar servidores, contenedores ni orquestadores. Para un equipo de 1-5 personas, esto es óptimo.

### "¿Puede un solo desarrollador mantener 20 verticales?"

Sí, porque:

1. Un solo codebase (no 20 repos)
2. Verticales se diferencian por datos en BD (no por código)
3. Monitorización automática con alertas (no hay que revisar logs manualmente)
4. Migraciones de cluster ejecutables desde admin (no SSH ni DevOps manual)
5. Claude Code puede ejecutar sesiones de mantenimiento de forma autónoma

### "¿Cuántas requests/segundo soporta?"

Con la capa de cache SWR + Cloudflare edge:

- **Lecturas:** Ilimitadas (Cloudflare absorbe el 98%)
- **Escrituras a BD:** ~200/segundo por cluster Pro (suficiente para un marketplace B2B)
- **Concurrencia real en BD:** 5-10 conexiones simultáneas (el 98% de requests no llegan a BD)

---

## 14. DIAGRAMA DE FLUJO COMPLETO (request → response)

```
[Usuario en Madrid]
       │
       ▼
[Cloudflare Edge Madrid]
       │
       ├── WAF check ────── Bloqueado? → 403
       ├── Rate limit ───── Excedido? → 429
       ├── Cache lookup ─── Hit? → Devolver HTML (50ms, $0)
       │                         │
       │                         ├── Stale? → Revalidar async (usuario no espera)
       │                         └── Fresh? → Fin
       │
       └── Cache miss ────→ [Cloudflare Worker]
                                  │
                                  ├── Nuxt SSR
                                  │   ├── Auth check (JWT en cookie)
                                  │   ├── Query Supabase (pgBouncer → PostgreSQL)
                                  │   │   └── RLS filtra por vertical + permisos
                                  │   ├── Renderizar HTML con datos
                                  │   └── Guardar en edge cache
                                  │
                                  ├── Imágenes
                                  │   └── CF Images CDN (imagedelivery.net)
                                  │       └── Variante correcta (thumb/card/gallery)
                                  │
                                  └── Devolver HTML (200ms)
```

---

## 15. DIAGRAMA DE FLUJO DE DATOS (sesión 41)

```
┌───────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Usuario     │─────│  Cloudflare CDN   │─────│  Cloudflare Pages │
│  (navegador)  │     │  (cache + WAF)    │     │  (Nuxt 3 SSR)    │
└───────────────┘     └──────────────────┘     └────────┬─────────┘
                                                        │
                    ┌─────────────────┬─────────┴─────────┬─────────────────┐
                    │                 │                   │                 │
              ┌─────┴───────┐ ┌──────┴──────────┐ ┌─────┴───────┐ ┌─────┴───────┐
              │  Supabase   │ │    Stripe       │ │  Cloudinary  │ │   Resend     │
              │  (BD+RLS+   │ │ (pagos+webhook) │ │  → CF Images │ │  (emails)    │
              │  Realtime)  │ │                 │ │              │ │              │
              └─────────────┘ └─────────────────┘ └─────────────┘ └─────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │   WhatsApp Meta Cloud API     │
                    │   + Claude Vision (IA)         │
                    └───────────────────────────────┘

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

### 15.1 Capa de servicios (server/services/)

Sesión 41 introduce una capa de servicios para endpoints con >200 líneas de lógica:

| Servicio          | Archivo                           | Responsabilidad                                         |
| ----------------- | --------------------------------- | ------------------------------------------------------- |
| `marketReport.ts` | `server/services/marketReport.ts` | Computación de stats + generación de HTML para reportes |
| `billing.ts`      | `server/services/billing.ts`      | REST helpers, lookup de usuario, dunning, facturas auto |

Los endpoints quedan como orquestadores: validan, llaman al servicio, devuelven resultado.

---

## 16. UMBRALES Y ALERTAS FORMALES (sesión 41)

El cron `infra-metrics.post.ts` (sesión 33) recopila métricas horarias. Los umbrales definen cuándo generar alertas:

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

### Configuración actual en infra-metrics.post.ts

```typescript
const THRESHOLDS = {
  db_size_bytes: { warning: 70, critical: 85, emergency: 95 },
  connections_used: { warning: 70, critical: 85, emergency: 95 },
  cloudinary_credits: { warning: 70, critical: 85, emergency: 95 },
  cloudinary_storage: { warning: 70, critical: 85, emergency: 95 },
  resend_emails_today: { warning: 70, critical: 85, emergency: 95 },
  stripe_webhook_failures: { warning: 50, critical: 70, emergency: 90 },
}
```

### Cooldown de alertas

| Nivel     | Cooldown | Canal                |
| --------- | -------- | -------------------- |
| Emergency | 24h      | Email + push + BD    |
| Critical  | 48h      | Dashboard alert + BD |
| Warning   | 7 días   | Solo BD              |

---

## 17. RATE LIMITING Y WAF (sesión 34 + 41)

### Middleware de rate limiting (server/middleware/rate-limit.ts)

- Implementado en sesión 34
- Basado en IP para rutas públicas
- Desactivado en producción por defecto (in-memory Map no funciona en Workers)
- Activable con `ENABLE_MEMORY_RATE_LIMIT=true` para desarrollo local

| Ruta                  | Límite     | Ventana       |
| --------------------- | ---------- | ------------- |
| `/api/email/send`     | 10 req     | 1 min         |
| `/api/lead*`          | 5 req      | 1 min         |
| `/api/stripe*`        | 20 req     | 1 min         |
| `/api/account/delete` | 2 req      | 1 min         |
| `/api/*` (POST/PUT)   | 30 req     | 1 min         |
| `/api/*` (GET)        | 200 req    | 1 min         |
| Páginas públicas      | Sin límite | — (cache CDN) |

### Cloudflare WAF (configuración recomendada)

- Bot Fight Mode: activado
- Security Level: Medium
- Rate Limiting Rules (CF Dashboard):
  - `/api/auth/*`: 20 req/min por IP → Challenge
  - `/api/stripe/*`: 10 req/min por IP → Block
  - `/api/cron/*`: Solo IPs de Cloudflare Workers → Block resto
- Nota: El rate limiting del middleware es la primera línea; CF WAF es la segunda.

---

## 18. REFERENCIAS

| Documento                                           | Contenido                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------- |
| `INSTRUCCIONES-MAESTRAS.md` sesión 33               | Implementación del sistema de monitorización y pipeline de imágenes |
| `INSTRUCCIONES-MAESTRAS.md` sesión 35               | Auditoría integral: índices, RLS, CSP, dependencias                 |
| `contexto-global.md` sección 3                      | Los 7 verticales y su taxonomía                                     |
| `nuxt.config.ts`                                    | routeRules (SWR), runtimeConfig, modules                            |
| `supabase/migrations/00051_infra_monitoring.sql`    | Tablas de monitorización y clusters                                 |
| `supabase/migrations/00053_performance_indexes.sql` | Índices estratégicos                                                |
| `server/api/cron/infra-metrics.post.ts`             | Cron de recolección de métricas                                     |
| `server/api/images/process.post.ts`                 | Pipeline híbrido de imágenes                                        |
| `app/pages/admin/infraestructura.vue`               | Panel de monitorización                                             |
| `server/services/marketReport.ts`                   | Servicio de generación de informes de mercado                       |
| `server/services/billing.ts`                        | Servicio compartido de facturación y pagos                          |
| `server/middleware/rate-limit.ts`                   | Rate limiting middleware (sesión 34)                                |

---

> **Para Claude Code:** Este documento es referencia, no una sesión ejecutable. Cuando un auditor pregunte "¿cómo escala?", apunta aquí. Cuando necesites tomar una decisión de arquitectura, consulta este documento para mantener coherencia.
>
> **Para auditores:** Si desea verificar cualquier afirmación de este documento, las fuentes de código están listadas en la sección 18. El proyecto es open-source internamente y todas las configuraciones son auditables.
