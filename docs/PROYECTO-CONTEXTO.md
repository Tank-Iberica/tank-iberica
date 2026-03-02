# TradeBase / Tracciona — Contexto Completo del Proyecto

> **Propósito:** Documento de referencia única para que Claude Code entienda la visión, arquitectura, decisiones y dirección del proyecto. Leer SIEMPRE antes de cualquier tarea.
> **Última actualización:** 2026-03-10
>
> **Documentos complementarios (leer solo cuando la tarea lo requiera):**
>
> - `docs/ESTRATEGIA-NEGOCIO.md` — Detalle de monetización (créditos/suscripciones completo), go-to-market, captación dealers, SEO/Ads, estrategia de datos, anti-fraude, roadmap
> - `docs/IDEAS-A-REVISAR.md` — Banco de 92 ideas no implementadas organizadas en 12 categorías

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

**Cada vertical tiene su propia taxonomía** de categorías/subcategorías en BD. No es universal. La taxonomía se lee de la BD, no está hardcodeada.

**Cada vertical es un beachhead independiente:** No hace falta que los 7 funcionen. Si solo Tracciona tiene tracción, ya valida el modelo y financia los demás.

### 1.4 Verticales futuros (4)

| Vertical                | Dominio     | Sector                            |
| ----------------------- | ----------- | --------------------------------- |
| **Relevo**              | relevo.com  | Traspasos de negocios             |
| Maquinaria construcción | Por definir | Excavadoras, grúas torre, etc.    |
| Equipamiento fábrica    | Por definir | CNC, tornos, líneas de producción |
| Náutica profesional     | Por definir | Embarcaciones de trabajo, pesca   |

**Criterio de activación:** No se lanza un vertical hasta tener demanda real medida (tráfico, consultas, dealers interesados). No construir sin demanda.

### 1.5 Sinergia físico-digital

Tank Ibérica compra/vende vehículos físicamente → los lista en Tracciona → los leads online generan transacciones físicas en la campa de León → y viceversa. La campa ofrece subastas presenciales, inspecciones, liquidaciones de flotas (~31.4K€ por empresa mediana), almacenamiento temporal.

### 1.6 Vacío competitivo

No existe un marketplace B2B industrial profesional en España ni en Europa. Los dealers usan Milanuncios/Wallapop (generalistas) o nada. No hay competidor directo. TradeBase entra en un mercado sin incumbente digital.

---

## 2. Modelo de Negocio

### 2.1 Principio fundacional: publicar es GRATIS

**Vendedores nunca pagan por publicar. Compradores nunca pagan por buscar ni por contactar al vendedor.** El contacto entre comprador y vendedor es siempre gratuito. Cualquier feature que ponga un muro entre comprador y vendedor mata el marketplace.

El paywall está en herramientas y servicios opcionales, nunca en la comunicación ni en el listado.

### 2.2 Quién paga

| Pagador                  | Cómo paga                                                                                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Compradores**          | Suscripciones (Classic €19/Premium €39), créditos (reserva prioritaria, desbloquear ocultos, informes DGT), buyer's premium en subastas (8%), informes de valoración |
| **Vendedores / Dealers** | Créditos (destacar, renovar, anuncio protegido, color/marco, exportar), suscripciones dealer (herramientas/CRM/stats), generación IA de fichas, comisión por venta   |
| **Anunciantes locales**  | Publicidad geolocalizada: gestorías, talleres, aseguradoras, financieras, empresas de transporte, proveedores de repuestos. Adaptada por vertical                    |
| **Compradores de datos** | Informes de valoración, índice de mercado sectorial, datasets anualizados, API de datos                                                                              |

### 2.3 Modelo de datos = Idealista

Acumular datos de mercado (precios, tiempos de venta, volumen por zona) y venderlos a bancos, leasings, aseguradoras, fabricantes. Exactamente como Idealista hace con datos inmobiliarios. Los años de datos de precios se convierten en un **moat defensivo irreplicable**.

### 2.4 Los 4 layers de revenue

1. **Marketplace** — Tráfico y acumulación de datos (listados gratis, SEO, editorial)
2. **Dealer SaaS** — Revenue recurrente de herramientas (free / basic €29 / premium €79 / founding gratis forever)
3. **Servicios transaccionales** — Alto margen por operación (transporte, verificación, docs, seguros, subastas)
4. **Productos de datos** — Valor a largo plazo (API valoración, informes sectoriales, datasets). Activar tras masa crítica.

### 2.4.1 Créditos y Suscripciones (resumen)

> **Detalle completo:** Ver `docs/ESTRATEGIA-NEGOCIO.md` §2.4.1

**3 tiers de suscripción:** Basic (gratis) · Classic (€19/mes, €149/año) · Premium (€39/mes, €299/año). Precios de lanzamiento — subirán a €29/€59 tras 6 meses.

**Diferencias clave entre tiers:**

- **Alertas:** Basic=semanales · Classic=diarias · Premium=inmediatas
- **Early access:** Basic=24h delay · Classic=12h · Premium=inmediato
- **Promoción:** Basic=solo créditos · Classic=destacar+renovar incluidos · Premium=auto-renovar/destacar+color/marco

**Créditos:** 5 packs (1→€5, 3→€9.90, 10+1→€19.90, 25+3→€39.90, 50+10→€64.90). No caducan. Compra via Stripe Checkout.

**Costes:** 1 cr = renovar/destacar/exportar/DGT básico/desbloquear ocultos · 2 cr = reserva prioritaria/color-marco/anuncio protegido · 3 cr = DGT avanzado

**Reserva Prioritaria:** 2 cr → pausa anuncio 48h → comprador tiene prioridad. Si vendedor no responde → refund. Anuncios Premium son inmunes.

**Anuncio protegido:** 2 cr → inmunidad a reserva + visibilidad inmediata (salta delay oculto).

### 2.7 Flywheel del marketplace

Más fichas → más compradores → más dealers quieren publicar → más fichas. Efecto de red clásico. Publicar gratis arranca el flywheel. Los ingresos vienen de servicios, no de frenar la rueda.

### 2.8 Programa Founding Dealer

Primeros 10 dealers = suscripción dealer gratis de por vida (lock-in estratégico). Estos dealers se convierten en evangelistas y casos de éxito para la segunda ola.

### 2.9 Sistema de verificación (6 niveles)

| Nivel | Nombre        | Descripción                                       |
| ----- | ------------- | ------------------------------------------------- |
| 0     | Sin verificar | Publicado sin documentos                          |
| 1     | Verificado    | Documentos básicos revisados (ficha técnica, ITV) |
| 2     | Extendido     | Historial de mantenimiento, fotos adicionales     |
| 3     | Detallado     | Inspección técnica independiente                  |
| 4     | Auditado      | Auditoría completa con informe profesional        |
| 5     | Certificado   | Certificación oficial del fabricante              |

Cada vertical tiene sus propios documentos requeridos por nivel. Claude Vision para auto-verificación. DGT km reliability score vía InfoCar.

### 2.10 Mecanismos de lock-in (3 tipos)

1. **Herramientas como coste de cambio:** Facturas, contratos, CRM, export, widget → el dealer no se va. Repositioning: "herramienta de gestión de stock", no "portal de anuncios".
2. **Merchandising físico:** QR que apuntan al perfil del dealer en Tracciona. El dealer paga por materiales que promocionan la URL de Tracciona.
3. **Export cross-platform como caballo de Troya:** Exportar fichas DESDE Tracciona HACIA Milanuncios/Wallapop. Tracciona = hub de gestión; competidores = canales de distribución.

> **Estrategia de datos, anti-fraude y go-to-market:** Ver `docs/ESTRATEGIA-NEGOCIO.md` (§2.11, §2.12, §3)

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

**No añadir dependencias sin justificación.** El proyecto es deliberadamente lean: no Tailwind, no ORM, no UI framework. CSS custom con design system propio + Supabase client directo.

**No proponer microservices.** Monolito Nuxt + Supabase es deliberado. Con 2 personas, la complejidad operativa de microservices no se justifica.

### 4.2 Patrón multi-vertical

Un solo codebase, N deploys. Cada vertical es un deploy de Cloudflare Pages con variables de entorno distintas (`VERTICAL_SLUG`, `NUXT_PUBLIC_SITE_URL`, etc.).

La tabla `vertical_config` controla todo per-vertical: marca, colores, tipografía, idiomas, módulos activos (feature flags), plantillas de email, SEO, monetización. Se pueden activar/desactivar funcionalidades por vertical sin tocar código.

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

**Cookie consent como gate universal:** `useConsent()` controla analytics, ads y tracking. Sin consentimiento, nada se ejecuta.

### 4.7 Patrones de código en API

- **Auth endpoints:** `serverSupabaseUser()` para autenticación
- **Cron endpoints:** `verifyCronSecret()` para verificación
- **Webhooks:** Firma HMAC (Stripe `constructEvent()`, WhatsApp)
- **Errores:** `safeError()` para nunca exponer detalles internos al usuario
- **Convención:** No improvisar otra. Usar estos patrones establecidos.

### 4.8 Testing

No se busca 100% coverage. 34 tests actuales: 12 E2E + 5 seguridad + 11 unit + 3 componentes + 3 setup. Tests para flujos críticos y lógica compleja, no "tests para todo".

### 4.9 Deploy pipeline

git push → GitHub Actions CI (lint → typecheck → build → E2E → Lighthouse → DAST) → Cloudflare Pages auto-deploy. Zero-downtime, edge deployment. **El CI validará el código** — lint y typecheck deben pasar.

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

- Filtros dinámicos leídos de BD (categoría, subcategoría, marca, modelo, precio, año, ubicación)
- Vista grid + tabla con export CSV/PDF
- SEO: JSON-LD (Product), hreflang, canonical, sitemap dinámico, breadcrumbs
- Landing pages automáticas por categoría/marca (umbral dinámico)
- URLs planas con slugs SEO: `/cisterna-alimentaria-indox-2019-madrid`
- **Geo-fallback inteligente:** Escalera de 8 niveles geográficos (provincia→mundo), pill selector, preferencia persistente en perfil
- **PromoCards en grid:** Split card en posición ~3 (demanda + vehículos ocultos), cascada de búsquedas similares al final, grid de promos si 0 resultados
- **Early access:** Vehículos con `visible_from` delay (24h Basic / 12h Classic / inmediato Premium). PromoCard dorada con conteo y CTA de créditos
- **Portal dealer:** `/[dealer-slug]` sin PromoCards del marketplace. Card sutil al final: "Ver más en Tracciona →"

### 5.2 Dashboard dealer

- CRM con pipeline de leads, estadísticas (vistas, leads, conversiones), email resumen semanal
- Herramientas: facturas, contratos, presupuestos, calculadora ROI alquiler
- Exportador cross-platform (Milanuncios, Wallapop) — caballo de Troya
- Widget embeddable, portal público (`/[dealer-slug]`)
- **Doble URL por vehículo:** `/vehiculo/[slug]` = canonical (marketplace) · `/[dealer]/[slug]` = portal dealer (noindex, branding dealer)
- Onboarding funnel: día 0-30

### 5.3 Subastas

- Online con Supabase Realtime, anti-sniping (2 min), depósito Stripe, 8% buyer's premium

### 5.4 WhatsApp AI Pipeline

- Fotos por WhatsApp → Claude Vision → ficha bilingüe auto-publicada. **Moat competitivo:** ningún competidor lo ofrece. Retry automático 15 min.

### 5.5 Sistema de reservas

- Reserva con depósito vía Stripe. Cron diario expira reservas no confirmadas.

### 5.6 Contenido editorial

- `/guia/` (evergreen) + `/noticias/` (temporal). Generación con Claude Max batch. Publicación programada. SEO Score ≥50 para publicar. Schema FAQ. Linking interno a catálogo. Calendario social.

### 5.7 Transporte

- Calculadora por zonas (€250-1.200), integración IberHaul, tabla `transport_zones`.

### 5.8 Alertas, favoritos y notificaciones

- Búsquedas guardadas, favoritos con comparativa, alertas Pro 24h, price drop diario, push notifications (PWA).

### 5.9 Sistema de demandas inverso

- Compradores publican "busco X" → dealers reciben leads inversos.

### 5.10 Features legacy preservadas

- Balance/crédito, chat, registros mantenimiento, tracking alquileres, publicidad, demandas. Ya existen como tablas y código — **no reconstruir de cero**.

### 5.11 Datos de mercado

- BD de precios (primera para vehículos industriales ibéricos). API valoración (min/avg/max/percentiles). API avanzada `/v1` pospuesta hasta ≥500 transacciones. 5 productos futuros.

### 5.12 Catálogo fresco (4 mecanismos)

- Renovación obligatoria 30d, detección inactividad, scraping cross-platform, incentivo "vendido", auto-despublicación 90d.

### 5.13 PWA y offline

- Service worker, prompt instalación. Crítico: dealers en campa sin buena conexión.

### 5.14 Accesibilidad

- ARIA live regions, useToast con screen readers, touch targets ≥ 44px.

### 5.15 Google Ads conversion tracking

- `useGtag()` con 6 eventos, gated por `useConsent()`. Usar este composable para cualquier tracking nuevo.

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

| Decisión                                    | Detalle                                                                                                                                                                                                                                                                                   |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Publicar es gratis**                      | Vendedores nunca pagan por listar. Compradores nunca pagan por buscar o contactar.                                                                                                                                                                                                        |
| **Solo ES + EN por ahora**                  | Resto de idiomas activar cuando haya demanda medida                                                                                                                                                                                                                                       |
| **Cloudinary + CF Images (fase 2)**         | No migrar a fase 3 sin instrucción. Cache immutable 30d                                                                                                                                                                                                                                   |
| **Merchandising = solo formulario**         | Sin flujo de compra completo. Solo formulario de interés                                                                                                                                                                                                                                  |
| **API valoración pospuesta**                | No activar hasta ≥500 transacciones históricas                                                                                                                                                                                                                                            |
| **Scraping = solo manual**                  | NUNCA cron en producción. Scraping externo (Wallapop, Milanuncios) es frágil y arriesga bloqueo de IP/legal. Ejecutar manualmente con revisión humana. Nota: infra_metrics y otras tareas en APIs propias (Supabase, Cloudflare) sí pueden usar cron/Edge Functions cuando sea necesario. |
| **i18n JSONB + tabla**                      | No columnas `_es`/`_en` (no escala)                                                                                                                                                                                                                                                       |
| **prefix_except_default**                   | URLs limpias ES, prefijo para otros idiomas                                                                                                                                                                                                                                               |
| **GPT-4o mini para traducción**             | 30× más barato, calidad suficiente para texto técnico                                                                                                                                                                                                                                     |
| **Claude Code como ingeniero**              | Contratar humano cuando revenue > 2-3K€/mes                                                                                                                                                                                                                                               |
| **Dominio único .com**                      | Abandonados dominios regionales. Hreflang en .com                                                                                                                                                                                                                                         |
| **URLs planas**                             | `/cisternas-indox` no `/cisternas/alimentarias` (anti-canibalización SEO)                                                                                                                                                                                                                 |
| **No dependencias extras**                  | No Tailwind, no ORM, no UI framework. CSS custom + Supabase directo                                                                                                                                                                                                                       |
| **No microservices**                        | Monolito deliberado. 2 personas no justifican la complejidad                                                                                                                                                                                                                              |
| **Documentación legacy intocable**          | `docs/legacy/` = referencia histórica, no modificar                                                                                                                                                                                                                                       |
| **Admin panel solo español (P2)**           | Solo 2 personas lo usan. Lo que ve el usuario final va primero                                                                                                                                                                                                                            |
| **Doble URL por vehículo**                  | `/vehiculo/[slug]` = canonical (marketplace). `/[dealer]/[slug]` = portal dealer (noindex). Misma ficha, branding diferente.                                                                                                                                                              |
| **Branding dealer en portal: gratis**       | Logo, colores y header del dealer en su contexto de ficha son gratuitos en launch. Monetizar en futuro si hay demanda.                                                                                                                                                                    |
| **Dominio custom para dealers: descartado** | Complejidad operativa no justificada en fase de captación. Reevaluar tras masa crítica.                                                                                                                                                                                                   |

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

- Hay decisiones abiertas de fundadores (ver `docs/ESTRATEGIA-NEGOCIO.md` §15). Claude Code debe preguntar, no decidir.

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

## 13. Referencia Rápida de Archivos

| Necesitas...                         | Lee...                                                         |
| ------------------------------------ | -------------------------------------------------------------- |
| Entender el proyecto completo        | Este documento                                                 |
| Estrategia de negocio y monetización | `docs/ESTRATEGIA-NEGOCIO.md`                                   |
| Ideas no implementadas (103)         | `docs/IDEAS-A-REVISAR.md`                                      |
| Backlog técnico pendiente            | `docs/tracciona-docs/BACKLOG.md`                               |
| Estado actual y errores              | `STATUS.md` (raíz)                                             |
| Convenciones de código               | `CONTRIBUTING.md`                                              |
| Esquema de BD                        | `docs/tracciona-docs/referencia/ERD.md`                        |
| Endpoints API                        | `docs/tracciona-docs/referencia/INVENTARIO-ENDPOINTS.md`       |
| Crons                                | `docs/tracciona-docs/referencia/CRON-JOBS.md`                  |
| Seguridad                            | `docs/tracciona-docs/referencia/SECURITY-TESTING.md`           |
| Disaster recovery                    | `docs/tracciona-docs/referencia/DISASTER-RECOVERY.md`          |
| Dependencias externas                | `docs/tracciona-docs/referencia/THIRD-PARTY-DEPENDENCIES.md`   |
| Secrets y rotación                   | `docs/tracciona-docs/referencia/SECRETS-ROTATION.md`           |
| WAF config                           | `docs/tracciona-docs/referencia/CLOUDFLARE-WAF-CONFIG.md`      |
| Retención de datos GDPR              | `docs/tracciona-docs/referencia/DATA-RETENTION.md`             |
| API pública                          | `docs/tracciona-docs/referencia/API-PUBLIC.md`                 |
| Flujos operativos                    | `docs/tracciona-docs/referencia/FLUJOS-OPERATIVOS.md`          |
| RAT GDPR (borrador)                  | `docs/legal/RAT-BORRADOR.md`                                   |
| Arquitectura y escalabilidad         | `docs/tracciona-docs/referencia/ARQUITECTURA-ESCALABILIDAD.md` |
| Auditoría canónica (~83/100)         | `docs/auditorias/AUDITORIA-26-FEBRERO.md`                      |
| Metodología de auditoría             | `docs/tracciona-docs/referencia/AUDIT-METHODOLOGY.md`          |
| Historial de cambios                 | `CHANGELOG.md`                                                 |
| Tareas negocio pendientes            | `docs/ESTRATEGIA-NEGOCIO.md` §15                               |
| Documentación legacy                 | `docs/legacy/` (solo referencia, no modificar)                 |
