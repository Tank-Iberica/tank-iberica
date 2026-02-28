# TradeBase / Tracciona — Contexto Completo del Proyecto

> **Propósito:** Documento de referencia única para que Claude Code entienda la visión, arquitectura, decisiones y dirección del proyecto. Leer SIEMPRE antes de cualquier tarea.
> **Última actualización:** 2026-02-28

---

## 1. Qué es TradeBase

TradeBase es un **grupo de marketplaces B2B verticales** que comparten un solo codebase. Cada vertical opera con su propio dominio, marca y configuración, pero reutiliza el 100% de la infraestructura técnica.

**Trayectoria a largo plazo:** Marketplace → plataforma de datos → estándar del sector. Las decisiones de hoy (acumular datos, API pública, estructura multi-vertical) sirven a esta visión a 20 años.

### 1.1 Entidades legales

| Entidad                             | Función                                                                                                   | Por qué separada                                                         |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **TradeBase SL**                    | Titular de los marketplaces digitales (Tracciona, Municipiante, etc.)                                     | Digital, escalable, bajo coste fijo                                      |
| **Tank Ibérica SL**                 | Operaciones físicas: campa en Onzonilla (León), compraventa directa, subastas presenciales, liquidaciones | Revenue existente (~500K€/año), responsabilidad civil por bienes físicos |
| **IberHaul** (antes Transporteo SL) | Logística y transporte de vehículos industriales (góndola propia)                                         | Operación especializada de transporte                                    |
| **Gesturban**                       | [Pendiente de definición por fundadores]                                                                  | —                                                                        |

**La separación es intencionada:** TradeBase SL (digital) está aislada de la responsabilidad civil de las operaciones físicas de Tank Ibérica. Tracciona es **puro intermediario**: nunca posee, inspecciona ni garantiza los bienes. Esto limita responsabilidad legal y condiciona cómo se redactan disclaimers y se construyen features (informar, no garantizar).

### 1.2 Modelo operativo: cero empleados fijos

- **2 fundadores** gestionan todo
- **Claude Code** actúa como ingeniero principal (ahorra 15-20K€/año)
- **Partners externos** para merchandising (imprentas), transporte (IberHaul), contenido (Claude Max)
- **Sin costes fijos de personal** — toda la arquitectura está diseñada para automatización y self-service
- **Contratación:** solo cuando ingresos recurrentes superen 2-3K€/mes
- **Tank Ibérica financia el experimento:** 500K€/año de operaciones físicas + 200K€ en caja + 150K€ en stock. Sin presión de VC, sin runway clock. Iterar con paciencia, preferir sostenible sobre rápido.

### 1.3 Verticales confirmados (7)

| Vertical            | Dominio             | Sector                                                       | Ticket medio |
| ------------------- | ------------------- | ------------------------------------------------------------ | ------------ |
| **Tracciona**       | tracciona.com       | Vehículos industriales (semirremolques, cisternas, furgones) | 15-80K€      |
| **Municipiante**    | municipiante.com    | Maquinaria municipal (barredoras, quitanieves, grúas)        | 20-120K€     |
| **CampoIndustrial** | campoindustrial.com | Maquinaria agrícola (tractores, cosechadoras)                | 10-200K€     |
| **Horecaria**       | horecaria.com       | Equipamiento hostelería (hornos, cámaras, mobiliario)        | 500-50K€     |
| **ReSolar**         | resolar.es          | Energía renovable (paneles, inversores, baterías)            | 1-100K€      |
| **Clinistock**      | clinistock.com      | Equipamiento médico (TAC, ecógrafos, mobiliario clínico)     | 2-500K€      |
| **BoxPort**         | boxport.es          | Contenedores marítimos (dry, reefer, tank, open top)         | 1.5-25K€     |

**Cada vertical tiene su propia taxonomía** de categorías/subcategorías en BD. No es universal: Tracciona tiene semirremolques/cisternas/furgones; Horecaria tiene hornos/cámaras/mobiliario. La taxonomía se lee de la BD, no está hardcodeada.

**Cada vertical es un beachhead independiente:** No hace falta que los 7 funcionen. Si solo Tracciona tiene tracción, ya valida el modelo y financia los demás. La estrategia multi-vertical es opcionalidad, no necesidad.

### 1.4 Verticales futuros (4)

| Vertical                | Dominio     | Sector                            |
| ----------------------- | ----------- | --------------------------------- |
| **Relevo**              | relevo.com  | Traspasos de negocios             |
| Maquinaria construcción | Por definir | Excavadoras, grúas torre, etc.    |
| Equipamiento fábrica    | Por definir | CNC, tornos, líneas de producción |
| Náutica profesional     | Por definir | Embarcaciones de trabajo, pesca   |

**Criterio de activación:** No se lanza un vertical hasta tener demanda real medida (tráfico, consultas, dealers interesados). No construir sin demanda.

### 1.5 Sinergia físico-digital

Tank Ibérica compra/vende vehículos físicamente → los lista en Tracciona → los leads online generan transacciones físicas en la campa de León → y viceversa. Esta retroalimentación entre lo físico y lo digital es única en el sector.

La campa de León ofrece:

- Espacio para subastas presenciales
- Inspecciones de vehículos
- Servicio de liquidaciones de flotas (~31.4K€ por empresa mediana)
- Almacenamiento temporal durante transacciones

### 1.6 Vacío competitivo

No existe un marketplace B2B industrial profesional en España ni en Europa. Los dealers usan Milanuncios/Wallapop (generalistas) o nada. No hay competidor directo. TradeBase entra en un mercado sin incumbente digital.

---

## 2. Modelo de Negocio

### 2.1 Principio fundacional: publicar es GRATIS

**Vendedores nunca pagan por publicar. Compradores nunca pagan por buscar ni por contactar al vendedor.** El contacto entre comprador y vendedor es siempre gratuito. Cualquier feature que ponga un muro entre comprador y vendedor mata el marketplace.

El paywall está en herramientas y servicios opcionales, nunca en la comunicación ni en el listado.

### 2.2 Quién paga

| Pagador                  | Cómo paga                                                                                                                                                                                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Compradores**          | Suscripción Pro (acceso anticipado 24h), buyer's premium en subastas (8%), informes de valoración, verificación                                                                                                                                                                               |
| **Vendedores / Dealers** | Anuncios destacados, suscripciones dealer (herramientas/CRM/stats), generación IA de fichas, comisión por venta                                                                                                                                                                               |
| **Anunciantes locales**  | Publicidad geolocalizada: gestorías, talleres, aseguradoras, financieras, empresas de transporte, proveedores de repuestos. Adaptada por vertical (ej: en Tracciona → talleres de semirremolques, ITVs industriales; en Horecaria → servicios de mantenimiento hostelero, proveedores de gas) |
| **Compradores de datos** | Informes de valoración, índice de mercado sectorial, datasets anualizados, API de datos                                                                                                                                                                                                       |

### 2.3 Modelo de datos = Idealista

Acumular datos de mercado (precios, tiempos de venta, volumen por zona) y venderlos a bancos, leasings, aseguradoras, fabricantes, asociaciones, consultoras, fondos de inversión. Exactamente como Idealista hace con datos inmobiliarios para la banca española. Los años de datos de precios se convierten en un **moat defensivo irreplicable**: ningún competidor puede fabricar un histórico.

### 2.4 Los 4 layers de revenue

1. **Marketplace** — Tráfico y acumulación de datos (listados gratis, SEO, editorial)
2. **Dealer SaaS** — Revenue recurrente de herramientas (free / basic €29 / premium €79 / founding gratis forever)
3. **Servicios transaccionales** — Alto margen por operación (transporte, verificación, docs, seguros, subastas)
4. **Productos de datos** — Valor a largo plazo (API valoración, informes sectoriales, datasets). Activar tras masa crítica.

### 2.5 Revenue stacking por transacción

Un vehículo de €40K puede generar €2.650-3.785 sumando canales: destacado + comisión + transporte + verificación + seguro + documentación. Los canales se apilan, no compiten.

### 2.6 Los 17+ canales de monetización (3 fases)

**Fase 1 — Día 1 (ingresos inmediatos)**

1. Anuncios destacados (€2-5/día por vehículo)
2. Publicidad directa geolocalizada — 7 posiciones de ad (CPM €8-25), anunciantes por vertical
3. Google AdSense — monetización puente hasta tener anunciantes directos suficientes. Se sustituye progresivamente por publicidad directa (mayor CPM, mejor UX)
4. Suscripciones Pro dealers (Free / Basic €29 / Premium €79 / Founding: gratis permanente para los 10 primeros)
5. Generación IA de fichas (€0.99/ficha con Claude Haiku)

**Fase 2 — Meses 1-6 (servicios de valor añadido)** 6. Suscripciones dealer (CRM, estadísticas, herramientas) 7. Comisión por venta (1-3% del precio) 8. Informes DGT / verificación (€3.50-15 por informe) 9. Inspecciones presenciales (€150-500) 10. Transporte (€250-1.200 por zona, vía IberHaul) 11. Documentación legal (contratos, facturas) 12. Seguros (referidos, comisión 5-15%)

**Fase 3 — Año 2 (productos premium)** 13. Escrow / garantía de pago (1.5-2.5% del importe) 14. Financiación BNPL 15. Informes de valoración (€9.99-29.99) 16. Índice de mercado / datos sectoriales (suscripción mensual) 17. Subastas online (8% buyer's premium)

**Estimación por vertical:** Fase 1: €2.1-7K/mes · Fase 2: €8.7-34K/mes · Fase 3: €17-50.5K/mes

### 2.7 Flywheel del marketplace

Más fichas → más compradores → más dealers quieren publicar → más fichas. Efecto de red clásico de marketplace bilateral. Publicar gratis es lo que arranca el flywheel. Los ingresos vienen de servicios, no de frenar la rueda.

### 2.8 Sistema Pro

- Acceso anticipado 24h a nuevos anuncios (`visible_from` en BD)
- Alertas de búsqueda con prioridad
- 3 planes: Pass €9.99 (puntual), Mensual €29, Anual €249
- **Programa Founding Dealer:** primeros 10 dealers = gratis de por vida (lock-in estratégico). Estos dealers se convierten en evangelistas y casos de éxito para la segunda ola.

### 2.9 Sistema de verificación (6 niveles)

| Nivel | Nombre        | Descripción                                       |
| ----- | ------------- | ------------------------------------------------- |
| 0     | Sin verificar | Publicado sin documentos                          |
| 1     | Verificado    | Documentos básicos revisados (ficha técnica, ITV) |
| 2     | Extendido     | Historial de mantenimiento, fotos adicionales     |
| 3     | Detallado     | Inspección técnica independiente                  |
| 4     | Auditado      | Auditoría completa con informe profesional        |
| 5     | Certificado   | Certificación oficial del fabricante              |

Cada vertical tiene sus propios documentos requeridos por nivel. Claude Vision se usa para auto-verificación de documentos subidos. DGT km reliability score vía InfoCar.

### 2.10 Mecanismos de lock-in (3 tipos)

1. **Herramientas como coste de cambio:** El dealer que usa facturas, contratos, CRM, export y widget de Tracciona no se va. El repositioning estratégico es "herramienta de gestión de stock", no "portal de anuncios".
2. **Merchandising físico:** Tarjetas, imanes y banners con QR que apuntan al perfil del dealer en Tracciona. El dealer paga por materiales que promocionan la URL de Tracciona. Lock-in disfrazado de servicio.
3. **Export cross-platform como caballo de Troya:** Los dealers exportan fichas DESDE Tracciona HACIA Milanuncios/Wallapop. Tracciona se convierte en el hub de gestión; los competidores pasan a ser canales de distribución.

---

## 3. Crecimiento y Go-to-Market

### 3.1 Supply-side first

En un marketplace bilateral, primero se resuelve la oferta (dealers/inventario), luego la demanda (compradores) viene sola con SEO. Todo feature early-stage debe optimizar para captar y retener dealers.

**Los 10 Founding Dealers son LA métrica.** Todo lo demás es secundario hasta que estos 10 estén onboarded y activos. Cada decisión de feature debe pasar el filtro: "¿esto ayuda a conseguir o retener los primeros 10 dealers?"

### 3.2 Go-to-market

1. Scraping de competidores (Milanuncios, Wallapop) → identificar dealers → añadir a `dealer_leads` → contactar
2. Ofrecer Founding Dealer (gratis forever) a los primeros 10
3. Onboarding con funnel diseñado: día 0 (registro) → día 1-3 (primera ficha) → día 7 (primer email stats) → día 14 (trial expiry) → día 30 (conversión o free tier)
4. Éxitos de Founding Dealers = casos de estudio para la segunda ola

### 3.3 SEO orgánico como canal principal de adquisición

No se empieza con paid ads. El funnel es: contenido editorial → tráfico orgánico → usuarios → dealers siguen a los usuarios. Esto explica por qué el motor de contenido es tan crítico.

**Estrategia de linking interno:** Cada artículo editorial enlaza a 2+ páginas de catálogo/categoría. El contenido editorial existe para bombear autoridad SEO hacia las páginas de catálogo, no es contenido por contenido.

**El sitio NO está indexado en Google todavía** (0 resultados en `site:tracciona.com`). Google Search Console necesita verificación por los fundadores. Todo el trabajo SEO (SSR, Schema.org, hreflang, editorial) depende de esto.

### 3.4 Motor de contenido editorial

- **Rutina dominical:** 1-2h con Claude Max → 2 artículos/semana + traducción + social posts
- **Publicación programada:** Martes y jueves 09:00 CET (cron cada 15 min)
- **Calendario social:** LinkedIn (lunes, miércoles, viernes) + Instagram (martes, jueves)
- **Gate de calidad:** SEO Score ≥50 para publicar. 15 checks ponderados (keyword en título, longitud, links internos, FAQ schema, imágenes con alt, excerpt, traducciones, etc.)
- **Schema.org implementados:** Product (vehículos), Organization (dealers), Article (editorial), FAQ (artículos), BreadcrumbList, WebSite → rich snippets en Google

### 3.5 Google Ads (lado gasto)

5 campañas cuando haya presupuesto: búsqueda por categoría, búsqueda por marca, acción+tipo, remarketing, Shopping. Conversiones trackeadas via `useGtag()` con 6 eventos: viewItem, search, generateLead, beginCheckout, subscribe, register. Gated por `useConsent()`.

### 3.6 WhatsApp multi-país

Fases: ahora €0 (un número español) → año 2 smart routing por país → año 3+ números locales por mercado.

### 3.7 Pricing intelligence futura

"Tu vehículo está un 15% por encima del mercado." Los datos acumulados crean valor para vendedores, no solo compradores. Justifica acumular datos desde el día 1 aunque no se moneticen inmediatamente.

---

## 4. Arquitectura Técnica

### 4.1 Stack y por qué

| Capa          | Tecnología                                                                                                        | Por qué esta y no otra                                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Frontend/SSR  | **Nuxt 3** (Vue 3 + Nitro)                                                                                        | SSR nativo para SEO (todo el negocio depende de búsqueda orgánica). Toda página indexable DEBE ser server-side rendered. |
| Base de datos | **Supabase** (PostgreSQL + RLS + Realtime + Auth + Storage)                                                       | Open source = exit strategy si cambian precios. Self-hostable. RLS integrado. Realtime para subastas.                    |
| Hosting/CDN   | **Cloudflare Pages** (edge, serverless)                                                                           | Edge rendering, free tier generoso, Workers integration, Pages Functions                                                 |
| Pagos         | **Stripe** (Checkout, Connect, Webhooks con firma HMAC)                                                           | Estándar de la industria, Connect para futuros pagos entre partes                                                        |
| Imágenes      | **Cloudinary** (transformaciones) + **CF Images** (almacenamiento CDN)                                            | Pipeline híbrido ahorra 94% vs Cloudinary puro                                                                           |
| Email         | **Resend** (transaccional)                                                                                        | Simple, barato, buena DX                                                                                                 |
| IA            | **Anthropic Claude** (descripciones, verificación Vision) · **OpenAI** (fallback, traducciones batch GPT-4o mini) | Failover automático Claude → OpenAI vía env var                                                                          |
| CAPTCHA       | **Cloudflare Turnstile**                                                                                          | Invisible, sin fricción, gratis                                                                                          |
| Mensajería    | **WhatsApp Meta Cloud API**                                                                                       | El target (dealers 45-60) vive en WhatsApp                                                                               |
| Analytics     | **GA4** + Google Ads pixel                                                                                        | Estándar, gated por cookie consent                                                                                       |
| Monitoring    | **Sentry** (errores) · `infra_metrics` + `infra_alerts` (custom)                                                  | Cron cada 5 min recoge métricas de BD y caché                                                                            |
| CI/CD         | **GitHub Actions** (7 workflows)                                                                                  | lint, typecheck, build, E2E, Lighthouse, DAST, backup                                                                    |

**No añadir dependencias sin justificación.** El proyecto es deliberadamente lean: no Tailwind, no ORM, no UI framework. CSS custom con design system propio + Supabase client directo. No proponer instalar librerías nuevas salvo que el usuario lo pida.

**No proponer microservices.** Monolito Nuxt + Supabase es deliberado. Con 2 personas, la complejidad operativa de microservices no se justifica.

### 4.2 Patrón multi-vertical

Un solo codebase, N deploys. Cada vertical es un deploy de Cloudflare Pages con variables de entorno distintas (`VERTICAL_SLUG`, `NUXT_PUBLIC_SITE_URL`, etc.).

La tabla `vertical_config` controla todo per-vertical: marca, colores, tipografía, idiomas, módulos activos (feature flags), plantillas de email, SEO, monetización. Se pueden activar/desactivar funcionalidades por vertical sin tocar código (no todos los verticales necesitan subastas, transporte o verificación DGT).

**Clonar un vertical = 2-4 horas, cero código:** insertar filas en `vertical_config` + nuevo deploy CF Pages + dominio + env vars.

### 4.3 Base de datos

- **89 tablas** con RLS habilitado
- **65 migraciones** aplicadas
- Columna `vertical` en tablas clave para aislamiento de datos
- Índices compuestos para queries multi-vertical (migraciones 62-63)
- Full-text search en PostgreSQL
- Triggers automáticos para `updated_at`, generación de slugs SEO-friendly
- Precios en céntimos (convención Stripe). Display en euros. Evita errores de punto flotante.
- **BD adelantada al frontend (Layer 2):** Varias tablas existen en schema pero no tienen UI todavía. Verificar SIEMPRE si una tabla ya existe antes de proponer crearla.
- **Activity logs:** Tabla `activity_logs` registra todas las acciones admin. Audit trail para gobernanza.

**Modelo multi-cluster Supabase:**

- Cada cluster ($25/mes) tiene capacidad 4.0 unidades
- Pesos por vertical: pesada=1.0, media=0.4, ligera=0.15
- Escalado: 1 vertical (1 cluster) → 7 verticales (2 clusters) → 20 verticales (~5 clusters, $125/mes)

### 4.4 Pipeline de imágenes (3 fases evolutivas)

- **Fase 1:** Cloudinary-only (actual para transformaciones)
- **Fase 2:** Cloudinary transforma + CF Images almacena (ACTUAL — ahorra 94%)
- **Fase 3:** CF Images solo (futuro, cuando justificado)
- WebP, responsive sizes, lazy loading, blur placeholder en frontend
- Cache immutable 30d
- **No migrar a fase 3 sin instrucción explícita**

### 4.5 Rendimiento y caché

- **SWR (Stale-While-Revalidate)** en Cloudflare edge: absorbe 98% de lecturas
- El marketplace es 95% lecturas → el edge es extremadamente efectivo
- Objetivo: 20 verticales × 200M visitas/mes a $350-600/mes de infraestructura total

### 4.6 Seguridad (9 capas)

1. Cloudflare WAF + DDoS protection
2. Turnstile CAPTCHA en formularios
3. Rate limiting (middleware in-memory para dev, CF WAF para producción)
4. Supabase RLS en todas las tablas
5. Auth JWT via Supabase Auth (Google Login habilitado)
6. Verificación de firma HMAC en webhooks (Stripe, WhatsApp)
7. `verifyCronSecret()` en los 13 endpoints cron
8. CSP headers + security headers
9. SAST (Semgrep) + DAST (OWASP ZAP) + npm audit en CI

**Cookie consent como gate universal:** `useConsent()` controla analytics, ads y tracking. Sin consentimiento, nada se ejecuta. Cualquier nueva integración de terceros DEBE pasar por este gate.

### 4.7 Patrones de código en API

- **Auth endpoints:** `serverSupabaseUser()` para autenticación
- **Cron endpoints:** `verifyCronSecret()` para verificación
- **Webhooks:** Firma HMAC (Stripe `constructEvent()`, WhatsApp)
- **Errores:** `safeError()` para nunca exponer detalles internos al usuario
- **Convención:** No improvisar otra. Usar estos patrones establecidos.

### 4.8 Testing

No se busca 100% coverage. 34 tests actuales:

- **E2E** (12): Flujos críticos de usuario
- **Seguridad** (5): Vulnerabilidades (IDOR, info leak, rate limit)
- **Unit** (11): Lógica compleja de composables
- **Componentes** (3): Rendering de componentes clave
- Claude Code no debe proponer "añadir tests para todo". Tests para flujos críticos y lógica compleja.

### 4.9 Deploy pipeline

git push → GitHub Actions CI (lint → typecheck → build → E2E → Lighthouse → DAST) → Cloudflare Pages auto-deploy. Zero-downtime, edge deployment. Claude Code debe saber que **el CI validará su código** — lint y typecheck deben pasar.

### 4.10 Backups (3 capas)

1. **Supabase PITR**: RPO 0, retención 7-28 días
2. **Daily automático a Backblaze B2**: RPO 24h, AES-256-CBC, 7 diarios + 4 semanales + 6 mensuales
3. **Archivo mensual a 6 meses** (cold storage)

### 4.11 Rotación de secrets

- **Anual:** Supabase Service Role, Stripe, WhatsApp token, Resend, CRON_SECRET, Turnstile, Cloudinary, Backblaze
- **Cada 6 meses:** Anthropic y OpenAI API keys (billing-critical)
- **Nunca rotar:** Supabase URL, WhatsApp Phone Number ID, Cloudinary Cloud Name (estáticos/públicos)

---

## 5. Funcionalidades Principales

### 5.1 Catálogo y búsqueda

- Filtros dinámicos leídos de BD (categoría, subcategoría, marca, modelo, precio, año, ubicación, etc.)
- Vista grid + tabla con export CSV/PDF
- SEO: JSON-LD (Product), hreflang, canonical, sitemap dinámico, breadcrumbs (BreadcrumbList)
- Landing pages automáticas por categoría/marca (umbral dinámico: 3-10 items: 40%, 50+: 70%)
- URLs planas con slugs SEO: `/cisterna-alimentaria-indox-2019-madrid` (no IDs en URLs)

### 5.2 Dashboard dealer

- CRM con pipeline de leads
- Estadísticas (vistas, leads, conversiones) — email resumen semanal automático
- Herramientas: generador de facturas, contratos, presupuestos
- Calculadora ROI de alquiler
- Exportador cross-platform (Milanuncios, Wallapop formato CSV) — caballo de Troya estratégico
- Widget embeddable para web del dealer
- Portal público del dealer con perfil y listado (`/[dealer-slug]`)
- **Ficha de vehículo en contexto dealer** (`/[dealer-slug]/[vehicle-slug]`): misma ficha pero con branding del dealer (logo, colores). `noindex` + canonical → `/vehiculo/[slug]`. Lock-in: el dealer comparte links propios desde Tracciona.
- Onboarding funnel diseñado: día 0-30

### 5.3 Subastas

- Subastas online con Supabase Realtime (bidding en vivo)
- Anti-sniping: extensión automática si puja en últimos 2 min
- Depósito vía Stripe PaymentIntent (captura manual — dinero retenido, no cobrado)
- 8% buyer's premium
- Flujo: marketplace → subasta cuando el vendedor elige

### 5.4 WhatsApp AI Pipeline

- Dealer envía fotos por WhatsApp → Claude Vision extrae datos → auto-publica ficha bilingüe
- **Moat competitivo:** Ningún otro marketplace industrial permite publicar por WhatsApp. Para el target (dealers 45-60 años, baja adopción digital), es game-changer.
- Retry automático cada 15 min para mensajes fallidos

### 5.5 Sistema de reservas

- Reserva de vehículos con depósito vía Stripe
- Cron diario expira reservas no confirmadas

### 5.6 Contenido editorial

- Rutas: `/guia/` (evergreen) + `/noticias/` (temporal)
- Generación con Claude Max en sesión dominical batch
- Publicación programada (cron cada 15 min)
- SEO Score (15 checks, 0-100) con panel en editor — gate: ≥50 para publicar
- Schema.org FAQ para featured snippets
- Linking interno: cada artículo enlaza a 2+ páginas de catálogo
- Calendario social integrado (LinkedIn/Instagram)

### 5.7 Transporte

- Calculadora por zonas (€250-1.200)
- Integración con IberHaul
- Tabla `transport_zones` con pricing por zona

### 5.8 Sistema de alertas, favoritos y notificaciones

- Búsquedas guardadas con notificación push/email
- Favoritos con comparativa
- Alertas Pro con prioridad 24h
- **Price drop notifications:** Cron diario notifica bajadas de precio en favoritos. Driver de engagement y retorno.
- Push notifications via service worker (PWA)

### 5.9 Sistema de demandas inverso

- Compradores publican "busco cisterna alimentaria 2018-2022 <30K€"
- Dealers reciben estas demandas
- Canal de leads inverso que complementa el catálogo

### 5.10 Features legacy preservadas

6 funcionalidades de Tank Ibérica que se mantienen activas:

- **Balance/crédito** de dealers
- **Chat** comprador-vendedor
- **Registros de mantenimiento** de vehículos
- **Tracking de alquileres** con tabla rental_records
- **Publicidad** (sistema de ads)
- **Demandas** (punto 5.9)

Ya existen como tablas y código. **No reconstruir de cero** — verificar que existen antes de implementar.

### 5.11 Datos de mercado

- Base de datos de precios (primera de su tipo para vehículos industriales ibéricos)
- API de valoración (`/api/market/valuation`): min/avg/max/percentiles con nivel de confianza
- API avanzada (`/v1/valuation`): pospuesta hasta ≥500 transacciones históricas
- 5 productos de datos futuros: valoración individual, informe trimestral, API, dataset anual, alertas de mercado
- Clientes potenciales: leasings, aseguradoras, fabricantes, asociaciones, consultoras, fondos

### 5.12 Catálogo fresco (4 mecanismos)

1. Renovación obligatoria a 30 días
2. Detección de inactividad
3. Scraping cross-platform (¿el vehículo se vendió en otra plataforma?)
4. Incentivo de "vendido" (el dealer marca como vendido → datos de precio real)
5. Auto-despublicación a 90 días si no se renueva

### 5.13 PWA y offline

- Service worker con capacidad offline
- Prompt de instalación
- Crítico para el target: dealers en campa/nave sin buena conexión móvil

### 5.14 Accesibilidad

- ARIA live regions (polite + assertive) en default.vue
- useToast anuncia a screen readers
- Touch targets ≥ 44px (obligatorio por design system)

### 5.15 Google Ads conversion tracking

- `useGtag()` composable con 6 eventos trackeados
- Gated por `useConsent()` — sin consentimiento de cookies, no se ejecuta
- Claude Code debe usar este composable para cualquier tracking nuevo, no crear otro

---

## 6. Internacionalización (i18n)

### Arquitectura

| Nivel                  | Qué traduce                   | Mecanismo                                             |
| ---------------------- | ----------------------------- | ----------------------------------------------------- |
| UI (strings estáticos) | Botones, menús, mensajes      | `$t()` + archivos `locales/XX.json`                   |
| Campos cortos BD       | Nombres de categoría, títulos | JSONB (`{es: "...", en: "..."}`) + `localizedField()` |
| Contenido largo        | Descripciones, artículos      | Tabla `content_translations` con índice full-text     |

### Estado actual

- **Activos:** ES + EN
- **Pospuestos:** FR, DE, NL, PL, IT (activar según demanda real)
- **Routing:** `prefix_except_default` (ES sin prefijo, `/en/`, `/fr/`)
- **Traducción:** GPT-4o mini Batch API (~€0.001/ficha, 30× más barato que DeepL)
- **Añadir idioma:** 1 línea en nuxt.config + `locales/XX.json` + batch traducción. Sin código, sin migraciones.

---

## 7. Decisiones Estratégicas Tomadas (no reimplementar sin validación)

| Decisión                                    | Detalle                                                                                                                      |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Publicar es gratis**                      | Vendedores nunca pagan por listar. Compradores nunca pagan por buscar o contactar.                                           |
| **Solo ES + EN por ahora**                  | Resto de idiomas activar cuando haya demanda medida                                                                          |
| **Cloudinary + CF Images (fase 2)**         | No migrar a fase 3 sin instrucción. Cache immutable 30d                                                                      |
| **Merchandising = solo formulario**         | Sin flujo de compra completo. Solo formulario de interés                                                                     |
| **API valoración pospuesta**                | No activar hasta ≥500 transacciones históricas                                                                               |
| **Scraping = solo manual**                  | NUNCA cron en producción                                                                                                     |
| **i18n JSONB + tabla**                      | No columnas `_es`/`_en` (no escala)                                                                                          |
| **prefix_except_default**                   | URLs limpias ES, prefijo para otros idiomas                                                                                  |
| **GPT-4o mini para traducción**             | 30× más barato, calidad suficiente para texto técnico                                                                        |
| **Claude Code como ingeniero**              | Contratar humano cuando revenue > 2-3K€/mes                                                                                  |
| **Dominio único .com**                      | Abandonados dominios regionales. Hreflang en .com                                                                            |
| **URLs planas**                             | `/cisternas-indox` no `/cisternas/alimentarias` (anti-canibalización SEO)                                                    |
| **No dependencias extras**                  | No Tailwind, no ORM, no UI framework. CSS custom + Supabase directo                                                          |
| **No microservices**                        | Monolito deliberado. 2 personas no justifican la complejidad                                                                 |
| **Documentación legacy intocable**          | `docs/legacy/` = referencia histórica, no modificar                                                                          |
| **Admin panel solo español (P2)**           | Solo 2 personas lo usan. Lo que ve el usuario final va primero                                                               |
| **Doble URL por vehículo**                  | `/vehiculo/[slug]` = canonical (marketplace). `/[dealer]/[slug]` = portal dealer (noindex). Misma ficha, branding diferente. |
| **Branding dealer en portal: gratis**       | Logo, colores y header del dealer en su contexto de ficha son gratuitos en launch. Monetizar en futuro si hay demanda.       |
| **Dominio custom para dealers: descartado** | Complejidad operativa no justificada en fase de captación. Reevaluar tras masa crítica.                                      |

---

## 8. Target Demográfico y sus Implicaciones

**Dealers de 45-60 años, WhatsApp-first, baja adopción digital.** Esto condiciona TODO el diseño UX:

- Interfaces simples, textos grandes, CTAs claros
- Mínimos pasos para cualquier acción
- Todo accesible por teléfono móvil (mobile-first no es opcional, es supervivencia)
- Si algo se puede hacer por WhatsApp, hacerlo por WhatsApp
- Touch targets ≥ 44px (dedos grandes, pantallas pequeñas)
- No asumir familiaridad con patrones UX modernos (drag & drop, gestos complejos)

---

## 9. Criterios para Tomar Decisiones de Código

Cuando Claude Code tenga que elegir entre opciones, aplicar estos criterios:

### 9.1 Principios de arquitectura

1. **Multi-vertical primero**: Toda tabla, query y componente debe funcionar con N verticales. Usar `vertical` como filtro. Nunca hardcodear lógica de un solo vertical.
2. **Configuración en BD, no en código**: Categorías, subcategorías, filtros, idiomas, colores, módulos → `vertical_config` o tablas de configuración. Añadir = insertar fila.
3. **Mobile-first**: CSS base = 360px. Breakpoints con `min-width`. Touch targets ≥ 44px.
4. **SSR obligatorio para contenido público**: Toda página indexable DEBE ser server-side rendered. Sin excepciones.
5. **SWR edge-first**: 95% de lecturas desde Cloudflare edge. Siempre considerar `Cache-Control` + `stale-while-revalidate`.
6. **Adapter pattern para servicios**: Cada proveedor externo tiene un server route que abstrae el vendor. Cambiar proveedor = cambiar adapter, nunca frontend.

### 9.2 Principios de código

1. **Composables para lógica**: Todo estado + lógica → `useXxx.ts`. Script de página ≤ 30 líneas. Hay 147 composables — verificar si ya existe uno antes de crear otro.
2. **$t() y localizedField()**: Todo texto visible al usuario usa i18n. Sin excepciones.
3. **Páginas reales, no modales**: Vehículos y artículos tienen URL propia con SEO (JSON-LD, OG, hreflang).
4. **RLS siempre**: Toda tabla nueva tiene RLS habilitado. Policies de dealer: `dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())`.
5. **Archivos < 500 líneas**: Extraer lógica a composable o subcomponentes. Excepción: archivos dominados por CSS (>60% CSS).
6. **Verificar antes de crear**: 89 tablas, 147 composables, 418 componentes ya existen. Verificar si algo existe antes de construirlo de cero.
7. **Precios en céntimos**: Toda la BD almacena precios en cents (convención Stripe). Display en euros.

### 9.3 Principios de negocio

1. **10 Founding Dealers first**: Todo feature debe pasar el filtro: "¿esto ayuda a conseguir o retener los primeros 10 dealers?"
2. **No construir sin demanda**: Los módulos pospuestos tienen condiciones de activación específicas.
3. **Coste ≈ 0**: Infraestructura en tiers gratuitos o casi gratuitos hasta que haya revenue.
4. **Supply-side first**: Priorizar features que atraen y retienen dealers sobre features para compradores.
5. **Contacto siempre gratis**: Nunca poner un muro entre comprador y vendedor.
6. **WhatsApp-first UX**: Si algo se puede hacer por WhatsApp, hacerlo por WhatsApp.

### 9.4 Decisiones que NO tomar unilateralmente

- `docs/gobernanza/A REVISAR.md` tiene ~10 decisiones abiertas de fundadores. Claude Code debe preguntar, no decidir.

---

## 10. Integraciones Externas y Contingencias

| Servicio           | Función                          | Plan B                              |
| ------------------ | -------------------------------- | ----------------------------------- |
| Supabase           | BD + Auth + Realtime             | PostgreSQL + Auth0 (2-4 semanas)    |
| Stripe             | Pagos                            | Paddle / LemonSqueezy (1-2 semanas) |
| Cloudinary         | Transformación imágenes          | CF Images directo                   |
| CF Images          | Almacenamiento imágenes          | Backblaze B2 + CF R2                |
| Anthropic Claude   | IA (descripciones, verificación) | OpenAI (cambio vía env var)         |
| OpenAI GPT-4o mini | Traducciones batch               | DeepL API (30× más caro)            |
| Resend             | Email transaccional              | Postmark / SendGrid                 |
| Meta WhatsApp      | Pipeline publicación             | Twilio (1-2 semanas)                |
| Cloudflare Pages   | Hosting edge                     | Vercel / Netlify                    |
| Turnstile          | CAPTCHA                          | hCaptcha                            |

**Failovers automáticos**: IA (Anthropic → OpenAI), Imágenes (Cloudinary → CF Images), Backups (B2), Repo mirror (GitHub → Bitbucket).

---

## 11. Crons y Automatizaciones

| Cron                | Frecuencia  | Función                                                 |
| ------------------- | ----------- | ------------------------------------------------------- |
| freshness-check     | Diario      | Detecta vehículos obsoletos (>90 días), auto-despublica |
| search-alerts       | Diario      | Envía alertas de búsqueda a usuarios                    |
| price-drop          | Diario      | Notifica bajadas de precio en favoritos                 |
| reservation-expiry  | Diario      | Expira reservas no confirmadas                          |
| publish-scheduled   | Diario      | Publica artículos programados                           |
| auto-auction        | Cada 5 min  | Procesa ganadores de subastas                           |
| infra-metrics       | Cada 5 min  | Recoge métricas de BD y caché → `infra_metrics`         |
| whatsapp-retry      | Cada 15 min | Reintenta mensajes WhatsApp fallidos                    |
| dealer-weekly-stats | Lunes 09:00 | Envía resumen semanal a dealers                         |

Todos protegidos con `verifyCronSecret()`. Scheduler recomendado: GitHub Actions o cron-job.org.

---

## 12. GDPR y Legal

- **Puro intermediario**: Tracciona nunca posee, inspecciona ni garantiza bienes. Disclaimers en verificación, subastas e informes DGT.
- **13 actividades de tratamiento** documentadas en RAT borrador
- **11 subprocesadores** identificados (Supabase, Stripe, Meta, Anthropic, etc.)
- **Retención de datos**: 30 días (logs) → 10 años (facturas, ley fiscal española)
- **Endpoints GDPR**: `/api/account/delete` (anonimización), `/api/account/export` (portabilidad)
- **7 páginas legales** implementadas
- **Compliance DSA** (Digital Services Act): módulo de transparencia implementado
- **Cookie consent**: `useConsent()` gates todo tracking/analytics/ads
- **Pendiente**: Formalizar RAT como documento legal, registrar marca OEPM (~€150)

---

## 13. Estado Actual del Proyecto (28 Feb 2026)

> **Nota:** Para errores críticos y estado detallado, consultar `STATUS.md` (se actualiza más frecuentemente que este documento).

### Métricas

| Métrica              | Valor                                                            |
| -------------------- | ---------------------------------------------------------------- |
| Puntuación auditoría | **79/100** (corregida de 71/100 por auditoría externa imprecisa) |
| Sesiones completadas | 0–64 + 14 iteraciones de auditoría                               |
| Páginas Vue          | 124                                                              |
| Componentes Vue      | 418                                                              |
| Composables          | 147                                                              |
| Endpoints API        | 62                                                               |
| Migraciones SQL      | 65                                                               |
| Tablas BD            | 89                                                               |
| Tests                | 34 (12 E2E + 5 seguridad + 11 unit + 3 componentes + 3 setup)    |
| CI/CD workflows      | 7                                                                |

### Módulos pospuestos

| Módulo                         | Condición de activación          |
| ------------------------------ | -------------------------------- |
| API valoración `/v1/valuation` | ≥500 transacciones históricas    |
| Suscripción datos sectoriales  | ≥1.000 vehículos en catálogo     |
| Dataset anualizado             | ≥12 meses de datos               |
| Merchandising completo         | Demanda medida                   |
| Idiomas 3-7                    | Demanda real                     |
| Prebid demand partners         | Registro en SSPs + placement IDs |
| Landing pages builder          | Solo si dealers lo solicitan     |

### Tareas de fundadores (no-código)

| Tarea                                   | Urgencia | Coste  |
| --------------------------------------- | -------- | ------ |
| Registrar marca Tracciona en OEPM       | Alta     | ~€150  |
| Configurar Cloudflare WAF rate limiting | Alta     | €0     |
| Verificar Google Search Console         | Alta     | €0     |
| Configurar UptimeRobot                  | Media    | €0     |
| Probar restauración de backup           | Media    | €0     |
| Contactar 50 dealers potenciales        | Media    | Tiempo |

---

## 14. Roadmap y Proyección

### Corto plazo (pre-launch)

1. Aplicar migración 00065 y corregir RLS
2. Regenerar types/supabase.ts
3. Configurar Cloudflare WAF
4. Verificar Google Search Console
5. Contactar primeros 10 Founding Dealers

### Medio plazo (meses 1-6)

- Activar canales de monetización Fase 2
- Alcanzar 90/100 en auditoría
- Validar PMF con Founding Dealers
- Evaluar lanzamiento de segundo vertical (Municipiante o CampoIndustrial)

### Largo plazo (año 1-2)

- 3-5 verticales activos
- Productos de datos (valoración, índice de mercado)
- Subastas online activas
- Considerar segundo cluster Supabase
- Evaluar idiomas adicionales según tráfico

### Escalabilidad probada

| Verticales | Clusters Supabase | Coste infra/mes | Capacidad        |
| ---------- | ----------------- | --------------- | ---------------- |
| 1          | 1 ($25)           | ~$34            | 10M visitas/mes  |
| 7          | 2 ($50)           | ~$100           | 50M visitas/mes  |
| 11         | 3 ($75)           | ~$200           | 100M visitas/mes |
| 20         | 5 ($125)          | ~$600           | 200M visitas/mes |

---

## 15. Referencia Rápida de Archivos

| Necesitas...                   | Lee...                                                       |
| ------------------------------ | ------------------------------------------------------------ |
| Entender el proyecto completo  | Este documento                                               |
| Ejecutar una sesión de trabajo | `docs/tracciona-docs/INSTRUCCIONES-MAESTRAS.md`              |
| Estado actual y errores        | `STATUS.md` (raíz)                                           |
| Convenciones de código         | `CONTRIBUTING.md`                                            |
| Esquema de BD                  | `docs/tracciona-docs/referencia/ERD.md`                      |
| Endpoints API                  | `docs/tracciona-docs/referencia/INVENTARIO-ENDPOINTS.md`     |
| Crons                          | `docs/tracciona-docs/referencia/CRON-JOBS.md`                |
| Seguridad                      | `docs/tracciona-docs/referencia/SECURITY-TESTING.md`         |
| Disaster recovery              | `docs/tracciona-docs/referencia/DISASTER-RECOVERY.md`        |
| Dependencias externas          | `docs/tracciona-docs/referencia/THIRD-PARTY-DEPENDENCIES.md` |
| Secrets y rotación             | `docs/tracciona-docs/referencia/SECRETS-ROTATION.md`         |
| WAF config                     | `docs/tracciona-docs/referencia/CLOUDFLARE-WAF-CONFIG.md`    |
| Retención de datos GDPR        | `docs/tracciona-docs/referencia/DATA-RETENTION.md`           |
| API pública                    | `docs/tracciona-docs/referencia/API-PUBLIC.md`               |
| Flujos operativos              | `docs/tracciona-docs/referencia/FLUJOS-OPERATIVOS.md`        |
| Checklist SEO/UX               | `docs/tracciona-docs/CHECKLIST-SEO-UX-TECNICO.md`            |
| Auditoría detallada            | `docs/auditorias/AUDITORIA-26-FEBRERO.md`                    |
| Decisiones abiertas fundadores | `docs/gobernanza/A REVISAR.md`                               |
| Documentación legacy           | `docs/legacy/` (solo referencia, no modificar)               |
