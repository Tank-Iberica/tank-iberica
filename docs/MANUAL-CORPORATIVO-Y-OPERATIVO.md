# Manual Corporativo y Operativo — TradeBase

> **SNAPSHOT:** Documento de referencia corporativa generado en marzo 2026. No se mantiene sesión a sesión. Para estado actual ver `STATUS.md`. Para arquitectura y visión ver `docs/PROYECTO-CONTEXTO.md`. Para estrategia ver `docs/ESTRATEGIA-NEGOCIO.md`. Regenerar este documento cuando se necesite (ej: reunión con inversores).

**Versión:** 1.0
**Fecha:** Marzo 2026
**Clasificación:** Confidencial — Uso interno
**Propietarios:** J.M.G. + J.C.G.

---

## Tabla de Contenidos

- [Preámbulo](#preámbulo)
- [S1 — Identidad Corporativa](#s1--identidad-corporativa)
- [S2 — Visión, Misión y Estrategia](#s2--visión-misión-y-estrategia)
- [S2B — Estudio de Mercado Comparativo](#s2b--estudio-de-mercado-comparativo)
- [S3 — Modelo de Negocio y Finanzas](#s3--modelo-de-negocio-y-finanzas)
- [S4 — Organización y Gobierno](#s4--organización-y-gobierno)
- [S5 — Mapa de Áreas de la Empresa](#s5--mapa-de-áreas-de-la-empresa)
- [S6 — Producto](#s6--producto)
- [S7 — Ingeniería y Tecnología](#s7--ingeniería-y-tecnología)
- [S8 — Datos e Inteligencia Artificial](#s8--datos-e-inteligencia-artificial)
- [S9 — Go-to-Market (GTM)](#s9--go-to-market-gtm)
- [S10 — Operaciones Core del Marketplace](#s10--operaciones-core-del-marketplace)
- [S11 — Administración General y Corporativo](#s11--administración-general-y-corporativo)
- [S12 — Procesos End-to-End](#s12--procesos-end-to-end)
- [S12B — MVP Operativo: 7 Procesos Críticos + RACI](#s12b--mvp-operativo-7-procesos-críticos--raci)
- [S13 — Métricas y KPIs](#s13--métricas-y-kpis)
- [S14 — Políticas y Normativa](#s14--políticas-y-normativa)
- [S15 — Herramientas y Stack](#s15--herramientas-y-stack)
- [S16 — Apéndices](#s16--apéndices)

---

## Executive Summary (1-pager)

### Qué es TradeBase

**TradeBase** es una plataforma SaaS que genera marketplaces B2B verticales sin código repetido. Un solo codebase, N verticales, cada una con su marca, dominio y mercado. **Tracciona** (tracciona.com) es la primera vertical en producción: compraventa y subastas de vehículos industriales en España, con expansión europea preparada.

### Cómo monetiza (4 layers)

| Layer            | Qué                                    | Horizonte | Ejemplo                                 |
| ---------------- | -------------------------------------- | --------- | --------------------------------------- |
| 1. Marketplace   | Tráfico + datos (listings gratis, SEO) | Día 1     | Destacados, AdSense, publicidad local   |
| 2. Dealer SaaS   | Revenue recurrente de herramientas     | Mes 1-6   | Suscripciones €19-79/mes, créditos      |
| 3. Transaccional | Alto margen por operación              | Mes 6-12  | Transporte, verificación, subastas 8%   |
| 4. Datos         | Moat estratégico irreplicable          | Año 2+    | Valoración, índice de mercado, datasets |

**Breakeven:** 6 dealers de pago (€114 MRR). **17+ canales** se apilan por transacción (hasta €3.785 por vehículo de €40K).

### Organización

| Rol                   | Quién            | Función                            |
| --------------------- | ---------------- | ---------------------------------- |
| Co-fundador digital   | J.M.G.           | Producto, tecnología, marketing    |
| Co-fundador operativo | J.C.G.           | Operaciones, ventas, dealers       |
| Ingeniero principal   | Claude Code (IA) | Desarrollo software (~15-20K€/año) |

**Sin empleados fijos.** Toda la arquitectura diseñada para automatización. Tank Ibérica SL financia (500K€/año ops + 200K€ caja).

### 5 KPIs North Star

| KPI                               | Objetivo actual  | Meta 12 meses  |
| --------------------------------- | ---------------- | -------------- |
| Dealers activos con publicaciones | 10 founding      | 50+ de pago    |
| Vehículos publicados activos      | 4.000+ (scraped) | 500+ orgánicos |
| Leads generados/mes               | 0 (pre-launch)   | 200+           |
| MRR (Monthly Recurring Revenue)   | €0               | €2.450+        |
| Tasa respuesta dealer <24h        | N/A              | >80%           |

### Estado actual (Marzo 2026)

**Plataforma:** Funcional, pre-lanzamiento. 125 páginas, 418 componentes, 92 tablas, 62 endpoints, 80 migraciones. Auditoría 83/100.

**Próximos 30 días:**

- Configurar Cloudflare WAF (P0 seguridad)
- Verificar Google Search Console (P0 SEO)
- Onboardear 10 Founding Dealers
- Activar Stripe (suscripciones + créditos)

**Próximos 90 días:**

- 20+ dealers activos de pago
- Activar AdSense + publicidad local
- Primeros ingresos de servicios transaccionales
- Lanzar contenido editorial (2 artículos/semana)
- Evaluar segundo vertical (Municipiante o CampoIndustrial)

### Stack (1 línea)

Nuxt 3 + Supabase + Cloudflare Pages + Stripe + Cloudinary + Claude AI + WhatsApp Business API

---

## Preámbulo

### Propósito del documento

Este Manual Corporativo y Operativo es la referencia única y consolidada de TradeBase: qué es, cómo funciona, cómo se opera y hacia dónde se dirige. Está diseñado para servir como:

1. **Onboarding** — Cualquier persona (fundador, colaborador, inversor, auditor) puede entender la empresa completa leyendo este documento.
2. **Gobernanza** — Documenta decisiones estratégicas, principios de diseño y criterios para tomar decisiones futuras.
3. **Operaciones** — Describe procesos end-to-end, flujos de trabajo y procedimientos.
4. **Referencia técnica** — Consolida la arquitectura, stack y patrones del producto.

### Audiencia

- Fundadores y socios
- Futuros empleados o colaboradores
- Inversores y asesores
- Auditores (internos y externos)
- Claude Code (ingeniero IA del proyecto)

### Historial del documento

| Versión | Fecha    | Cambios                                             |
| ------- | -------- | --------------------------------------------------- |
| 1.0     | Mar 2026 | Documento inicial generado desde toda la doc activa |

---

## S1 — Identidad Corporativa

### 1.1 Nombre y marca

**TradeBase** es la marca paraguas que engloba un grupo de marketplaces B2B verticales. Cada vertical opera con su propia marca, dominio y personalidad visual, pero comparte el 100% de la infraestructura técnica.

**Tracciona** (tracciona.com) es la primera vertical en producción: marketplace de vehículos industriales (semirremolques, cisternas, furgones, grúas, plataformas).

### 1.2 Entidades legales

| Entidad                             | CIF       | Función                                                            | Estado      |
| ----------------------------------- | --------- | ------------------------------------------------------------------ | ----------- |
| **TradeBase SL**                    | Pendiente | Titular de los marketplaces digitales                              | En registro |
| **Tank Ibérica SL**                 | B24724684 | Operaciones físicas: campa Onzonilla (León), compraventa, subastas | Operativa   |
| **IberHaul** (antes Transporteo SL) | Pendiente | Logística y transporte de vehículos industriales (góndola propia)  | En registro |
| **Gesturban**                       | Existente | Pendiente de definición por fundadores                             | Pendiente   |

**Separación intencionada:** TradeBase SL (digital) está aislada de la responsabilidad civil de las operaciones físicas de Tank Ibérica. Tracciona es **puro intermediario**: nunca posee, inspecciona ni garantiza los bienes.

### 1.3 Fundadores

- **J.M.G.** — Co-fundador. Perfil técnico-digital.
- **J.C.G.** — Co-fundador. Perfil operativo-comercial.

### 1.4 Hub físico

Campa de Onzonilla (León, España). Operada por Tank Ibérica SL. Ofrece:

- Subastas presenciales
- Inspecciones de vehículos
- Liquidaciones de flotas (~31.4K€ por empresa mediana)
- Almacenamiento temporal

### 1.5 Design system

| Elemento    | Valor actual                                 | Configurable desde                |
| ----------- | -------------------------------------------- | --------------------------------- |
| Color       | #23424A (petrol blue)                        | `vertical_config.branding`        |
| Tipografía  | Inter (Google Fonts), base 16px              | Admin → Branding → Tipografía     |
| Breakpoints | 480px, 768px, 1024px, 1280px (mobile-first)  | `app/assets/css/tokens.css`       |
| Spacing     | Escala de 4px (4, 8, 12, 16, 24, 32, 48, 64) | `app/assets/css/tokens.css`       |
| Modos       | Claro / Oscuro / Alto contraste              | `app/assets/css/themes.css`       |
| Logo        | Configurable por dealer y por vertical       | `dealers.logo_url`, `favicon_url` |

El design system usa CSS custom properties (`--color-*`, `--bg-*`, `--text-*`) que cambian por modo. Fuentes en `rem` (no `px`). Colores derivados con CSS Relative Color Syntax.

### 1.6 Propiedad intelectual

| Activo                   | Estado          | Acción pendiente               |
| ------------------------ | --------------- | ------------------------------ |
| Marca TRACCIONA          | Sin registrar   | Registrar en OEPM (~€150)      |
| Dominio tracciona.com    | Registrado      | Renovar anualmente             |
| Dominio tracciona.es     | Sin comprar     | Comprar (~€10/año)             |
| Codebase                 | Propiedad plena | Copyright TradeBase SL         |
| Base de datos de precios | En acumulación  | Moat competitivo a largo plazo |
| 7 dominios verticales    | Registrados     | Renovar anualmente             |

---

## S2 — Visión, Misión y Estrategia

### 2.1 Visión a 20 años (2026–2046)

**Marketplace → Plataforma de datos → Estándar del sector.**

Las decisiones de hoy (acumular datos, API pública, estructura multi-vertical) sirven a esta visión. TradeBase se convierte en el "Idealista de los activos industriales": la referencia de datos para todo el sector B2B de equipamiento industrial en Europa.

### 2.2 Misión

Crear el estándar digital para la compraventa B2B de activos industriales en mercados donde no existe incumbente digital, empezando por España y expandiendo por Europa.

### 2.3 Valores operativos

1. **Publicar es gratis** — Vendedores nunca pagan por listar. Compradores nunca pagan por buscar o contactar.
2. **Simplicidad** — Menos código, más claridad. La solución obvia pero refinada.
3. **Pragmatismo** — Perfecto es enemigo de lanzado. Deuda técnica se paga después, si hace falta.
4. **Mobile-first** — La mayoría de usuarios navegan en móvil/tablet.
5. **Dato como activo** — Cada interacción acumula dato que construye el moat a largo plazo.
6. **Anticipar problemas** — Resolver el "qué puede salir mal" ANTES del lanzamiento.

### 2.4 Estrategia competitiva

**Vacío competitivo:** No existe un marketplace B2B industrial profesional en España ni en Europa. Los dealers usan Milanuncios/Wallapop (generalistas) o Excel+WhatsApp (manual). No hay competidor directo.

| Competidor           | Debilidad vs TradeBase                                              |
| -------------------- | ------------------------------------------------------------------- |
| Mascus               | Sin IA, sin WhatsApp, UX anticuada, sin servicios integrados        |
| Wallapop/Milanuncios | Generalistas, sin herramientas dealer, sin datos de mercado, no B2B |
| Excel + WhatsApp     | Manual, sin SEO, sin datos, sin escalabilidad                       |

**Ventajas competitivas:**

- WhatsApp-first onboarding (fotos → IA → ficha bilingüe en minutos)
- Herramientas dealer integradas (facturas, contratos, CRM, export cross-platform)
- Acumulación de datos de mercado (primer dataset de precios del sector)
- Niche ibérico profundo con expansión europea preparada
- Sinergia físico-digital (campa + marketplace)

### 2.5 Flywheel del marketplace

```
Más fichas → más compradores (SEO) → más dealers publican
    ↑                                        ↓
    └──── más datos de mercado ←── más transacciones
```

Publicar gratis arranca el flywheel. Los ingresos vienen de servicios, nunca de frenar la rueda.

### 2.6 Verticales confirmados (7)

| Vertical            | Dominio             | Sector                  | Ticket medio |
| ------------------- | ------------------- | ----------------------- | ------------ |
| **Tracciona**       | tracciona.com       | Vehículos industriales  | 15-80K€      |
| **Municipiante**    | municipiante.com    | Maquinaria municipal    | 20-120K€     |
| **CampoIndustrial** | campoindustrial.com | Maquinaria agrícola     | 10-200K€     |
| **Horecaria**       | horecaria.com       | Equipamiento hostelería | 500-50K€     |
| **ReSolar**         | resolar.es          | Energía renovable       | 1-100K€      |
| **Clinistock**      | clinistock.com      | Equipamiento médico     | 2-500K€      |
| **BoxPort**         | boxport.es          | Contenedores marítimos  | 1.5-25K€     |

**Verticales futuros (4):** Relevo (traspasos), Maquinaria construcción, Equipamiento fábrica, Náutica profesional.

**Criterio de activación:** No se lanza un vertical hasta tener demanda real medida. Cada vertical es un beachhead independiente.

### 2.7 Sinergia físico-digital

Tank Ibérica compra/vende vehículos físicamente → los lista en Tracciona → los leads online generan transacciones físicas en la campa → y viceversa. Esto crea un ciclo de retroalimentación que ningún competidor puramente digital puede replicar.

### 2.8 Decisiones estratégicas tomadas (no reimplementar sin validación)

| Decisión                           | Detalle                                                         |
| ---------------------------------- | --------------------------------------------------------------- |
| Publicar es gratis                 | Vendedores nunca pagan por listar                               |
| Solo ES + EN por ahora             | Resto de idiomas activar cuando haya demanda medida             |
| Cloudinary + CF Images (fase 2)    | No migrar a fase 3 sin instrucción                              |
| Merchandising = solo formulario    | Sin flujo de compra completo                                    |
| API valoración pospuesta           | No activar hasta ≥500 transacciones históricas                  |
| Scraping = solo manual             | NUNCA cron en producción                                        |
| Claude Code como ingeniero         | Contratar humano cuando revenue > 2-3K€/mes                     |
| No Tailwind, no ORM                | CSS custom + Supabase directo                                   |
| No microservices                   | Monolito deliberado (2 personas no justifican la complejidad)   |
| Doble URL por vehículo             | `/vehiculo/[slug]` canonical + `/[dealer]/[slug]` portal dealer |
| Dominio custom dealers: descartado | Complejidad no justificada en fase de captación                 |

---

## S2B — Estudio de Mercado Comparativo

### 2B.1 Panorama del mercado de vehículos industriales de segunda mano en España

**Tamaño del mercado:** ~120.000 transacciones de vehículos industriales usados/año en España. Ticket medio €15-80K. Mercado total estimado: €3-6 mil millones/año. Sin líder digital claro.

**Fragmentación:** El 85% de las transacciones ocurren offline (WhatsApp, teléfono, visita a campa). Los dealers usan 3-5 plataformas simultáneamente sin un hub centralizado. No existe CRM sectorial ni herramientas de gestión integradas.

### 2B.2 Mapa de competidores

| Competidor                      | Origen     | Modelo                   | Fortalezas                                                       | Debilidades                                                                      |
| ------------------------------- | ---------- | ------------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Mascus** (Ritchie Bros)       | Suecia/USA | Listados + lead gen, CPL | Mayor base de datos global, marca consolidada, red internacional | UX anticuada, sin herramientas dealer, sin IA, CPM alto, sin datos de venta real |
| **Autoline** (Linemedia)        | Rusia/EU   | Listados gratuitos + ads | Multi-idioma, gran inventario, presencia global                  | UX pobre, sin servicios integrados, sin marketplace real, sin subastas online    |
| **TruckScout24** (AutoScout24)  | Alemania   | Listados + suscripción   | Marca reconocida en EU-oeste, integración con AutoScout24 eco    | Centrado en Alemania, sin presencia real en España, modelo legacy                |
| **MachineryTrader** (Sandhills) | USA        | Listados premium         | Referencia en USA, contenido editorial                           | Sin presencia en mercado ibérico, UX desktop-only, sin IA                        |
| **Milanuncios**                 | España     | Generalista + PRO        | Base de usuarios enorme, SEO dominio potente, UX conocida        | Generalista (no B2B), sin herramientas dealer, sin verificación, spam            |
| **Wallapop**                    | España     | Generalista C2C          | App móvil popular, envíos integrados, branding fuerte            | C2C no B2B, sin vehículos industriales realmente, sin CRM                        |
| **Facebook Marketplace**        | Global     | Social + marketplace     | Base usuarios masiva, gratuito, local                            | Sin especialización, sin filtros industriales, sin herramientas, riesgo fraude   |
| **Ritchie Bros (IronPlanet)**   | USA/Global | Subastas industriales    | Líder global en subastas, reputación, inspecciones               | Solo subastas, comisiones altas (10-15%), sin marketplace de listing             |

### 2B.3 Análisis competitivo por dimensión

| Dimensión                | Mascus             | Autoline     | TruckScout24        | Milanuncios  | **Tracciona**     |
| ------------------------ | ------------------ | ------------ | ------------------- | ------------ | ----------------- |
| **UX/Mobile**            | ⭐⭐               | ⭐           | ⭐⭐                | ⭐⭐⭐       | ⭐⭐⭐⭐          |
| **Herramientas dealer**  | ⭐                 | ⭐           | ⭐⭐                | ⭐           | ⭐⭐⭐⭐⭐        |
| **IA/Automatización**    | ✖️                 | ✖️           | ✖️                  | ✖️           | ⭐⭐⭐⭐          |
| **Subastas online**      | ✖️                 | ✖️           | ✖️                  | ✖️           | ⭐⭐⭐            |
| **Datos de mercado**     | ⭐ (solo listados) | ⭐           | ⭐                  | ✖️           | ⭐⭐⭐⭐          |
| **Servicios integrados** | ✖️                 | ✖️           | ⭐                  | ✖️           | ⭐⭐⭐            |
| **SEO España**           | ⭐⭐               | ⭐           | ⭐                  | ⭐⭐⭐⭐⭐   | ⭐⭐ (pre-launch) |
| **Coste para dealer**    | Alto (CPL)         | Gratis + ads | Medio (suscripción) | €50/mes PRO  | Gratis (publicar) |
| **Verificación/Trust**   | ✖️                 | ✖️           | ⭐                  | ✖️           | ⭐⭐⭐            |
| **Multi-idioma**         | ⭐⭐⭐⭐           | ⭐⭐⭐       | ⭐⭐⭐              | ⭐ (solo ES) | ⭐⭐ (ES+EN)      |

### 2B.4 Vacío competitivo (oportunidad TradeBase)

**No existe un competidor que combine:**

1. Marketplace especializado B2B industrial + herramientas de gestión para dealers
2. Generación de fichas por IA (WhatsApp → ficha bilingüe)
3. Subastas online integradas
4. Servicios transaccionales (transporte, verificación, seguros)
5. Acumulación de datos de mercado (precios reales de venta)

**El gap principal:** Los incumbentes son listados estáticos. Ninguno ofrece CRM, facturas, contratos, export cross-platform, pipeline de leads ni widget embeddable. Tracciona entra como **herramienta de gestión de negocio para dealers**, no como "otro portal de anuncios".

### 2B.5 Barreras de entrada y moats

| Barrera                        | Protección TradeBase                                    | Tiempo para replicar            |
| ------------------------------ | ------------------------------------------------------- | ------------------------------- |
| **Dataset de precios reales**  | Solo nosotros vemos precio publicado vs precio de venta | 2-3 años                        |
| **Reviews verificadas**        | Ningún competidor industrial las tiene                  | 1-2 años                        |
| **Herramientas de gestión**    | Facturas, contratos, CRM, export integrados             | 6-12 meses                      |
| **WhatsApp AI pipeline**       | Fotos → ficha bilingüe automática                       | 3-6 meses (pero nadie lo hace)  |
| **Sinergia físico-digital**    | Campa Onzonilla + marketplace                           | Requiere infraestructura física |
| **Lock-in de reputación**      | Dealer con 500 reviews no migra                         | Irreplicable                    |
| **Multi-vertical desde día 1** | Mismo codebase, N verticales                            | 12-18 meses                     |

### 2B.6 Sizing del mercado (TAM/SAM/SOM)

| Métrica                                         | Valor        | Cálculo                                                          |
| ----------------------------------------------- | ------------ | ---------------------------------------------------------------- |
| **TAM** (Total Addressable Market)              | €3-6B/año    | ~120K transacciones × €25-50K ticket medio (España)              |
| **SAM** (Serviceable Available Market)          | €500M-1B/año | Dealers profesionales (excluye particulares), segmento tracciona |
| **SOM** (Serviceable Obtainable Market — año 1) | €2-5M/año    | 50-100 dealers × 10-20 vehículos × servicios integrados          |
| **Expansión EU**                                | ×5-10 TAM    | España es ~10-20% del mercado industrial europeo                 |

### 2B.7 Tendencias del sector

1. **Digitalización acelerada post-COVID:** Los dealers que se resistían están ahora obligados a tener presencia online
2. **Normativa Euro VI/VII:** Fuerza renovación de flotas → más transacciones → más oportunidad
3. **Consolidación:** Grupos grandes comprando dealers pequeños → necesitan herramientas de gestión profesionales
4. **Electrificación:** Nuevas categorías (camiones eléctricos, híbridos) sin referencia de precios → oportunidad de datos
5. **Plataformización:** Los dealers quieren un hub de gestión, no 5 portales de anuncios diferentes

---

## S3 — Modelo de Negocio y Finanzas

### 3.1 Principio fundacional

**Vendedores nunca pagan por publicar. Compradores nunca pagan por buscar ni contactar al vendedor.** El contacto entre comprador y vendedor es siempre gratuito. Cualquier feature que ponga un muro entre comprador y vendedor mata el marketplace.

### 3.2 Los 4 layers de revenue

| Layer                        | Descripción                                                      | Horizonte | Ejemplo de ingresos                         |
| ---------------------------- | ---------------------------------------------------------------- | --------- | ------------------------------------------- |
| 1. Marketplace               | Tráfico + acumulación de datos (listados gratis, SEO, editorial) | Inmediato | AdSense, anuncios directos, destacados      |
| 2. Dealer SaaS               | Revenue recurrente de herramientas de gestión                    | Corto     | Suscripciones €19-79/mes                    |
| 3. Servicios transaccionales | Alto margen por operación                                        | Medio     | Transporte, verificación, seguros, subastas |
| 4. Productos de datos        | Moat defensivo a largo plazo                                     | Largo     | API valoración, índice de mercado, datasets |

Los layers se acumulan, no compiten. Un marketplace maduro genera revenue de los 4 simultáneamente.

### 3.3 Quién paga y cómo

| Pagador                  | Cómo paga                                                                          | Ingresos estimados                        |
| ------------------------ | ---------------------------------------------------------------------------------- | ----------------------------------------- |
| **Compradores**          | Suscripciones (Classic/Premium), créditos, buyer's premium subastas, informes      | €5-39/mes recurrente + créditos puntuales |
| **Vendedores / Dealers** | Créditos (destacar, renovar, exportar), suscripciones dealer, generación IA fichas | €19-79/mes recurrente + créditos          |
| **Anunciantes locales**  | Publicidad geolocalizada (gestorías, talleres, aseguradoras, financieras)          | €100-400/mes por slot                     |
| **Compradores de datos** | Informes de valoración, índice de mercado, datasets, API                           | €500-10.000/proyecto                      |

### 3.4 Suscripciones de usuario — Detalle completo

**Precios:**

|                    | **Basic** | **Classic**         | **Premium**         |
| ------------------ | --------- | ------------------- | ------------------- |
| **Precio mensual** | Gratis    | €19/mes             | €39/mes             |
| **Precio anual**   | —         | €149/año (~€12/mes) | €299/año (~€25/mes) |

Precios de lanzamiento. Subirán a €29/€59 tras 6 meses. Pricing B2B profesional: cifras redondas (sin ",90").

**Funcionalidades por tier (✔️ Incluido · ✖️ No incluido · ◯ Créditos):**

**Alertas:**

| Función               | Basic | Classic | Premium |
| --------------------- | ----- | ------- | ------- |
| Alertas semanales     | ✔️    | ✔️      | ✔️      |
| Alertas diarias       | ✖️    | ✔️      | ✔️      |
| Alertas inmediatas    | ✖️    | ✖️      | ✔️      |
| Price Down semanales  | ✔️    | ✔️      | ✔️      |
| Price Down diarias    | ✖️    | ✔️      | ✔️      |
| Price Down inmediatas | ✖️    | ✖️      | ✔️      |

**Gestión de anuncios:**

| Función                                     | Basic     | Classic   | Premium   |
| ------------------------------------------- | --------- | --------- | --------- |
| Ver anuncios en segmento oculto             | 24h delay | 12h delay | Inmediato |
| Anuncio protegido (inmunidad + visibilidad) | ◯         | ◯         | ✔️        |
| Reserva Prioritaria (48h)                   | ◯         | ◯         | ◯         |
| Desbloquear ocultos (batch)                 | ◯         | ◯         | ✔️        |

**Promoción y visibilidad:**

| Función                                | Basic | Classic | Premium |
| -------------------------------------- | ----- | ------- | ------- |
| Destacar anuncio                       | ◯     | ✔️      | ✔️      |
| Renovar anuncio                        | ◯     | ✔️      | ✔️      |
| Auto-renovar (toggle, 1 cr/ejecución)  | ◯     | ◯       | ✔️      |
| Auto-destacar (toggle, 1 cr/ejecución) | ◯     | ◯       | ✔️      |
| Color / Fondo / Marco especial         | ◯     | ◯       | ✔️      |
| Exportar catálogo                      | ◯     | ◯       | ✔️      |

**Informes DGT:** Siempre de pago con créditos, ningún plan los incluye.

**Mecanismos especiales:**

- **Reserva Prioritaria (2 créditos):** Comprador bloquea anuncio 48h. Vendedor responde → comprador tiene prioridad. Vendedor no responde → créditos devueltos. 1 reserva activa por anuncio. Anuncios Premium son inmunes.
- **Anuncio Protegido (2 créditos, pago único):** Inmunidad a Reserva Prioritaria + salta periodo oculto (24h/12h). Dura mientras el anuncio esté publicado.

### 3.5 Sistema de créditos

**5 packs — compra vía Stripe Checkout (one-time). Los créditos NO caducan.**

| Pack         | Pagas | Bonus      | **Recibes** | Precio | €/cr real |
| ------------ | ----- | ---------- | ----------- | ------ | --------- |
| Recarga      | 1     | —          | **1**       | €5,00  | €5,00     |
| Básico       | 3     | —          | **3**       | €9,90  | €3,30     |
| **Estándar** | 10    | +1 gratis  | **11**      | €19,90 | €1,81     |
| Pro          | 25    | +3 gratis  | **28**      | €39,90 | €1,43     |
| Empresa      | 50    | +10 gratis | **60**      | €64,90 | €1,08     |

**Psicología de precios:** Recarga y Básico sin bonus (entrada baja). Estándar marcado como "Más popular" en UI — salto agresivo de €3,30→€1,81/cr. No hay pack de 5 créditos: forzar salto 3→10. Créditos sobrantes = retención (usuario vuelve). Packs usan ",90" (e-commerce), suscripciones cifras redondas (B2B).

**Consumo de créditos por función:**

| Créditos | Funciones                                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------------------------- |
| **1**    | Renovar (manual/auto), Destacar (manual/auto), Exportar catálogo, Informe DGT básico, Desbloquear ocultos (batch) |
| **2**    | Reserva Prioritaria, Color/Marco, Anuncio protegido                                                               |
| **3**    | Informe DGT avanzado                                                                                              |

### 3.6 Suscripciones dealer

| Tier         | Precio                | Descripción                                                |
| ------------ | --------------------- | ---------------------------------------------------------- |
| **Founding** | Gratis para siempre   | Primeros 10 dealers — lock-in estratégico                  |
| Basic        | Gratis                | Publicar vehículos, leads básicos                          |
| Classic      | €19/mes (lanz.) → €29 | CRM, estadísticas, herramientas                            |
| Premium      | €39/mes (lanz.) → €59 | Todo incluido + exportar cross-platform + review analytics |

**Programa Founding Dealer:** 10 dealers = suscripción dealer gratis de por vida. Se convierten en evangelistas y casos de éxito para la segunda ola de captación.

### 3.7 Monetización adicional (en exploración)

**Del comprador:**

| #   | Concepto                                                                  | Modelo                            |
| --- | ------------------------------------------------------------------------- | --------------------------------- |
| 1   | Alerta premium personalizada (marca, modelo, año, km, zona, precio)       | Classic/Premium o créditos        |
| 2   | Informe de valoración de mercado ("Este vehículo está un 12% por encima") | Créditos (monetiza Capa 4)        |
| 3   | Comparador premium con métricas de mercado                                | Gratis básico / créditos avanzado |
| 4   | Historial de precio de un vehículo                                        | Gratis Premium / créditos resto   |
| 5   | Alertas de bajada con umbral ("Avísame cuando baje de €40K")              | Classic/Premium                   |

**Del vendedor:**

| #   | Concepto                                                       | Modelo                             |
| --- | -------------------------------------------------------------- | ---------------------------------- |
| 6   | Generación IA de ficha (WhatsApp → ficha bilingüe)             | 1 crédito. Diferenciador clave     |
| 7   | Estadísticas de rendimiento del anuncio (CTR, comparativa)     | Básico gratis / detallado créditos |
| 8   | Recomendación de precio IA ("Precio óptimo: €42K-€46K")        | Créditos                           |
| 9   | Exportar anuncio optimizado a Milanuncios/Wallapop/AutoScout24 | Créditos. Lock-in                  |
| 10  | Certificado de publicación (PDF con QR verificable)            | 1 crédito                          |

### 3.8 Los 17+ canales de monetización (3 fases)

**Fase 1 — Día 1 (ingresos inmediatos):**

| #   | Canal                                                      | Ingreso estimado            |
| --- | ---------------------------------------------------------- | --------------------------- |
| 1   | Anuncios destacados                                        | €2-5/día por vehículo       |
| 2   | Publicidad directa geolocalizada (7 posiciones, CPM €8-25) | €100-400/mes por slot       |
| 3   | Google AdSense (puente hasta anunciantes directos)         | €50-3.600/mes según tráfico |
| 4   | Suscripciones Pro dealers                                  | €19-79/mes por dealer       |
| 5   | Generación IA de fichas                                    | €0,99/ficha                 |

**Fase 2 — Meses 1-6 (servicios de valor añadido):**

| #   | Canal                                                  | Ingreso estimado         |
| --- | ------------------------------------------------------ | ------------------------ |
| 6   | Suscripciones dealer (CRM, estadísticas, herramientas) | €19-79/mes por dealer    |
| 7   | Comisión por venta                                     | 1-3% del precio          |
| 8   | Informes DGT / verificación                            | €3,50-15 por informe     |
| 9   | Inspecciones presenciales                              | €150-500 por inspección  |
| 10  | Transporte (vía IberHaul)                              | €250-1.200 por zona      |
| 11  | Documentación legal (contratos, facturas)              | Incluido en herramientas |
| 12  | Seguros (referidos)                                    | Comisión 5-15%           |

**Fase 3 — Año 2 (productos premium):**

| #   | Canal                                 | Ingreso estimado        |
| --- | ------------------------------------- | ----------------------- |
| 13  | Escrow / garantía de pago             | 1,5-2,5% del importe    |
| 14  | Financiación BNPL                     | Comisión financiera     |
| 15  | Informes de valoración                | €9,99-29,99 por informe |
| 16  | Índice de mercado / datos sectoriales | Suscripción mensual     |
| 17  | Subastas online (buyer's premium)     | 8% del precio de remate |

**Estimación de ingresos por vertical:**

| Fase               | Ingresos/mes   | Condición                                |
| ------------------ | -------------- | ---------------------------------------- |
| Fase 1 (día 1)     | €2.100-7.000   | >100 vehículos, >1.000 visitas/mes       |
| Fase 2 (meses 1-6) | €8.700-34.000  | 20+ dealers activos, servicios activados |
| Fase 3 (año 2)     | €17.000-50.500 | Productos premium, subastas, datos       |

### 3.9 Revenue stacking — Ejemplo por transacción

Un vehículo de **€40.000** puede generar **€2.650-3.785** sumando canales:

| Canal                               | Ingreso          |
| ----------------------------------- | ---------------- |
| Anuncio destacado (15 días × €3)    | €45              |
| Comisión por venta (3%)             | €1.200           |
| Transporte IberHaul                 | €600-900         |
| Inspección presencial               | €250-500         |
| Seguro (referido 10%)               | €200-400         |
| Documentación legal                 | €50-100          |
| Informe DGT avanzado (3 créditos)   | €3-9             |
| Generación IA ficha (1 crédito)     | €1-5             |
| Buyer's premium subasta (si aplica) | €3.200           |
| **Total sin subasta**               | **€2.349-3.359** |
| **Total con subasta**               | **€5.549-6.559** |

Los canales se apilan, no compiten.

### 3.10 Estructura de costes operativos

**Costes fijos mensuales (infraestructura digital):**

| Concepto                  | Coste/mes       | Notas                                        |
| ------------------------- | --------------- | -------------------------------------------- |
| Supabase Pro              | ~€25            | PostgreSQL + Auth + Storage + Realtime       |
| Cloudflare Pages          | ~€5             | Hosting + CDN + Workers                      |
| Resend (email)            | ~€10            | Transaccional + marketing                    |
| Dominios                  | ~€2             | tracciona.com + variantes                    |
| Cloudinary                | €0-20           | Transformación de imágenes (free tier → Pro) |
| APIs IA (Claude)          | €10-30          | Generación de fichas, análisis               |
| **Total infraestructura** | **~€52-92/mes** |                                              |

**Costes variables (crecen con uso):**

| Concepto              | Coste                | Escala             |
| --------------------- | -------------------- | ------------------ |
| Stripe comisiones     | 1,4% + €0,25/tx (EU) | Por transacción    |
| WhatsApp Business API | €0,05-0,10/mensaje   | Por conversación   |
| Cloudinary exceso     | €0,01/transformación | Por imagen         |
| Claude API exceso     | Variable             | Por ficha generada |

**Costes de personal: €0 fijos.** Toda la arquitectura diseñada para automatización y self-service. Claude Code como ingeniero principal (~€15-20K/año). Criterio de contratación: solo cuando ingresos recurrentes > 2-3K€/mes.

**Costes del fundador (no infraestructura):**

| Concepto          | Coste/mes     | Notas                                |
| ----------------- | ------------- | ------------------------------------ |
| Claude Code (IA)  | ~€1.250-1.667 | ~€15-20K/año                         |
| Tiempo fundadores | €0 contable   | No cobran sueldo en fase pre-revenue |

### 3.11 Breakeven — Análisis detallado

| Hito            | Cálculo                           | MRR     | Significado                               |
| --------------- | --------------------------------- | ------- | ----------------------------------------- |
| **Breakeven**   | 6 dealers × €19/mes               | €114    | Cubre costes de infraestructura (~€72-92) |
| **Margen sano** | 20 dealers × €49/mes              | €980    | Margen para reinvertir en marketing       |
| **Escalar**     | 50 dealers × €49/mes              | €2.450  | Puede contratar un comercial              |
| **Autonomía**   | 100 dealers × €49/mes + servicios | €5.000+ | Cubre Claude Code + marketing + reserva   |

**Financiación del experimento:** Tank Ibérica cubre todo hasta breakeven. ~500K€/año de operaciones físicas + 200K€ en caja + 150K€ en stock. **Sin presión de VC, sin runway clock.** El proyecto puede iterar sin prisas hasta encontrar PMF.

**Tiempo estimado a breakeven:** 3-6 meses desde lanzamiento (con 10 Founding Dealers gratuitos + 6 dealers de pago).

### 3.12 Google Ads — Presupuesto y KPIs (lado gasto)

Activar cuando haya >100 vehículos y landings indexadas.

**6 campañas:**

| Campaña                 | Objetivo                                     | CPC        | Presupuesto/mes        |
| ----------------------- | -------------------------------------------- | ---------- | ---------------------- |
| 0 — Branded             | Proteger marca "Tracciona"                   | ~€0,10     | €20                    |
| 1 — Categoría           | cisternas, semirremolques, cabezas tractoras | €0,50-1,80 | €150-200               |
| 2 — Marca               | Indox, Schmitz, Lecitrailer, etc.            | €0,30-0,80 | €100                   |
| 3 — Acción+tipo         | alquiler, subasta, liquidación flota         | €0,30-2,50 | €150                   |
| 4 — Remarketing Display | Usuarios que vieron fichas sin contactar     | €0,10-0,30 | €100                   |
| 5 — Shopping/Merchant   | Feed XML dinámico (orgánico + premium)       | Variable   | Solo si ROI demostrado |

**Presupuesto progresivo:**

| Periodo    | Presupuesto/mes | Campañas activas               |
| ---------- | --------------- | ------------------------------ |
| Meses 6-9  | €150-200        | 0 + 1 (validar keywords)       |
| Meses 9-12 | €500            | 0 + 1 + 2 + 3                  |
| Año 2+     | €800-1.200      | Todas (remarketing + Shopping) |

**Reglas de gestión:**

- **Parada:** €200 sin leads = pausar y revisar
- **Escalado:** CPC <€1 y conversión >3% = duplicar presupuesto

**KPIs objetivo:** CPC medio <€2 · CTR >3% · Conversión (contacto) >2% · Coste por lead <€30 · ROAS >3:1

### 3.13 Google AdSense — Ingresos publicitarios pasivos (lado ingreso)

AdSense = puente. Publicidad directa = destino. Transición progresiva:

| Fase       | Estrategia                                                       |
| ---------- | ---------------------------------------------------------------- |
| Meses 1-6  | AdSense en espacios disponibles                                  |
| Meses 6-12 | Anunciantes directos en slots premium + AdSense en resto         |
| Meses 12+  | Publicidad directa donde haya anunciante + AdSense solo residual |

**Proyección de ingresos AdSense:**

| Visitas/mes | CPM realista | Bloques/pág | Ingresos/mes |
| ----------- | ------------ | ----------- | ------------ |
| 5.000       | €5           | 2           | ~€50         |
| 15.000      | €9           | 2           | ~€270        |
| 30.000      | €12          | 2           | ~€720        |
| 100.000     | €18          | 2           | ~€3.600      |

**Reglas:** Máximo 2 bloques visibles simultáneamente. Nunca encima del botón de contacto, formulario, dashboard, subastas en vivo, emails ni PDFs. Activar solo con >100 vehículos y >1.000 visitas/mes.

**Roadmap de redes publicitarias:** AdSense → Ezoic (>10K visitas) → Mediavine (>50K sesiones) → Raptive (>100K pageviews).

### 3.14 Retargeting — Presupuesto y mecánica

**Presupuesto:** €6/día = €180/mes. Google €3/día + Meta €3/día. LinkedIn solo cuando haya +100 visitas/día (€10/día adicional).

**Mecánica:** Visitante ve vehículo → se va sin contactar → durante 7 días le aparecen anuncios de ESE vehículo concreto en Instagram, Facebook, YouTube, Gmail, webs. Catálogo dinámico vía feed XML (`/api/feed/products.xml`).

**Métricas esperadas:** Conversión retargeting 5-15% (vs 1-2% tráfico frío). CPC €0,10-0,50.

### 3.15 Plan de ejecución GTM con costes

```
SEMANA 1  (€0, sin código)
├─ Subir inventario Tank Ibérica (seed 20-30 fichas)
├─ Pedir a 3-5 dealers conocidos que prueben
├─ Crear perfil LinkedIn + primer post
└─ Google Business Profile

SEMANA 2  (€50)
├─ Milanuncios PRO + primeros anuncios con wa.me
├─ Facebook Marketplace + 2 grupos
├─ WhatsApp Channel + primer mensaje
└─ Emails personalizados a dealers (10/día)

SEMANA 3  (€6/día = €180/mes)
├─ Instalar Google Tag Manager + pixels
├─ Activar retargeting Meta + Google
├─ Primer vídeo YouTube en la campa
└─ Vinilo en la góndola (€300, una vez)

MES 2  (requiere código)
├─ SEO programático (landing pages marca/modelo)
├─ Herramienta de valoración pública
├─ Auto-publicación en redes (webhook → 4 plataformas)
├─ Feed de catálogo dinámico para retargeting
└─ Contactar 2-3 empresas de renting/leasing

MES 3+  (escalar lo que funcione)
├─ Newsletter semanal "El Industrial"
├─ Informe de mercado trimestral
├─ Calculadoras públicas
├─ Pinterest auto-pin
├─ Gestorías + talleres + corredores de seguros
└─ Medir, descartar lo que no funcione, doblar lo que sí
```

**Coste total primer mes: ~€250.** €50 Milanuncios PRO + €180 retargeting + €20 QR. Todo lo demás es tiempo del fundador.

### 3.16 Mecanismos de lock-in (3 tipos)

1. **Herramientas como coste de cambio:** Facturas, contratos, CRM, export, widget → el dealer no se va.
2. **Merchandising físico:** QR que apuntan al perfil del dealer en Tracciona.
3. **Export cross-platform:** Exportar fichas DESDE Tracciona HACIA Milanuncios/Wallapop. Tracciona = hub de gestión.

### 3.17 Subastas

Online con Supabase Realtime, anti-sniping (2 min), depósito Stripe, **8% buyer's premium**. Combina con subastas presenciales en campa (Tank Ibérica). Ingreso por subasta en vehículo de €40K = €3.200.

### 3.18 Transporte

Calculadora por zonas (€250-1.200), integración con IberHaul (góndola propia), tabla `transport_zones` en BD. Margen Tracciona: comisión de intermediación o markup sobre coste IberHaul.

### 3.19 Modelo de datos = Idealista

Acumular datos de mercado (precios reales de venta, tiempos de venta, volumen por zona, demanda vs oferta) y venderlos a bancos, leasings, aseguradoras, fabricantes. Los años de datos de precios se convierten en un **moat defensivo irreplicable** que ningún competidor puede replicar porque no controlan ambos extremos de la transacción.

**Dato más valioso:** Precio real de venta (`leads.sale_price_cents`) — la diferencia entre precio publicado y precio final = márgenes del mercado. Ningún competidor lo tiene.

### 3.20 Monetización de datos — ROI por vector

| Vector                                    | ROI anual esperado | Timeline  | Esfuerzo              |
| ----------------------------------------- | ------------------ | --------- | --------------------- |
| Reviews + badges (reputación)             | €20-50K            | Month 4-5 | 2-3 semanas           |
| Compliance tracking (alianza DGT)         | €100-300K          | Month 6-8 | 4-6 sem + negociación |
| Supply chain intelligence (network graph) | €50-100K           | Month 5-6 | 3-4 semanas           |
| **Total datos (month 8-12)**              | **€200-500K/año**  |           |                       |

**Reviews/badges:** Dealer "Top-Rated" badge (€50-100/mes), Review Analytics para dealers (incluido en Premium), Trust Badge API (€1-5/consulta). Lock-in: dealer con 500 reviews no se va.

**Compliance/DGT:** Euro standard, ITV status, cargas máximas. Monetización: alianza DGT (€2-5K/mes), aseguradoras (búsqueda premium), talleres/STT (lead generation €100-500/mes).

**Supply chain:** Mapa de distribución vertical (€2-5K/vertical/año), benchmark comparativo (€1-2K/trimestre), supply chain optimization (€3-5K/proyecto). Compradores: fabricantes, consultoras, fondos VC.

### 3.21 Escalabilidad de costes por vertical

| Verticales    | Clusters Supabase | Coste infra/mes | Capacidad        |
| ------------- | ----------------- | --------------- | ---------------- |
| 1 (Tracciona) | 1 ($25)           | ~$34            | 10M visitas/mes  |
| 7 verticales  | 2 ($50)           | ~$100           | 50M visitas/mes  |
| 11 verticales | 3 ($75)           | ~$200           | 100M visitas/mes |
| 20 verticales | 5 ($125)          | ~$600           | 200M visitas/mes |

**Cada nueva vertical replica los 17+ canales de monetización.** El coste incremental por vertical es marginal (solo cluster Supabase + dominio). Los ingresos se multiplican linealmente.

### 3.22 Proyección financiera consolidada

**Escenario conservador — 1 vertical (Tracciona):**

| Periodo    | Dealers activos      | MRR estimado  | Fuentes principales                  |
| ---------- | -------------------- | ------------- | ------------------------------------ |
| Pre-launch | 10 founding (gratis) | €0            | —                                    |
| Mes 3      | 10 founding + 6 pago | €114-294      | Suscripciones                        |
| Mes 6      | 20 pago + founding   | €980-1.580    | Suscripciones + AdSense + destacados |
| Mes 12     | 50 pago              | €2.450-4.000  | + Servicios Fase 2                   |
| Año 2      | 100+ pago            | €5.000-15.000 | + Datos + Subastas (Fase 3)          |

**Escenario a escala — 7 verticales (año 3+):**

| Concepto                    | Estimación                      |
| --------------------------- | ------------------------------- |
| Ingresos recurrentes (SaaS) | €35.000-105.000/mes             |
| Ingresos transaccionales    | Variable por vertical           |
| Ingresos datos              | €200-500K/año                   |
| Costes infra                | ~$100/mes (2 clusters)          |
| **Margen bruto**            | **>90%** (negocio digital puro) |

### 3.23 Resumen ejecutivo financiero

- **Breakeven operativo:** 6 dealers de pago (€114 MRR) — alcanzable en 3-6 meses
- **Sin presión externa:** Tank Ibérica financia el experimento (500K€/año + 200K€ caja + 150K€ stock)
- **Margen bruto >90%:** Costes fijos <€100/mes, sin personal fijo
- **17+ canales de monetización** que se apilan por transacción (hasta €3.785 por vehículo de €40K)
- **Moat de datos:** Precio real de venta + datos de ambos lados de la transacción = dataset único en el sector
- **Monetización de datos a month 8-12:** €200-500K/año potencial
- **Escalabilidad:** Cada vertical nueva = costes marginales (~$25/mes) con revenue multiplicado

---

## S4 — Organización y Gobierno

### 4.1 Modelo operativo: cero empleados fijos

| Rol                   | Quién                         | Función                                   |
| --------------------- | ----------------------------- | ----------------------------------------- |
| Co-fundador digital   | J.M.G.                        | Producto, tecnología, marketing digital   |
| Co-fundador operativo | J.C.G.                        | Operaciones, ventas, relación con dealers |
| Ingeniero principal   | Claude Code (IA)              | Desarrollo de software (~15-20K€/año)     |
| Partners externos     | Imprentas, IberHaul, abogados | Merchandising, transporte, legal          |

**Sin costes fijos de personal.** Toda la arquitectura está diseñada para automatización y self-service.

**Criterio de contratación:** Solo cuando ingresos recurrentes superen 2-3K€/mes.

### 4.2 Gobernanza

| Aspecto       | Implementación                                                      |
| ------------- | ------------------------------------------------------------------- |
| Activity logs | Tabla `activity_logs` registra todas las acciones admin             |
| Feature flags | Tabla `feature_flags` para activar/desactivar funcionalidades       |
| Auditoría     | Framework de 12 dimensiones, puntuación actual ~83/100              |
| Documentación | SSOT (Single Source of Truth) por tema, no documentos duplicados    |
| Decisiones    | Registradas en `docs/PROYECTO-CONTEXTO.md`                          |
| Backlog       | `docs/tracciona-docs/BACKLOG-EJECUTABLE.md` (116 items priorizados) |

### 4.3 Toma de decisiones

Las decisiones estratégicas quedan documentadas en `PROYECTO-CONTEXTO.md`. Si durante una sesión se toma una decisión de rumbo, se actualiza el documento en tiempo real tras confirmación.

**Criterios para tomar decisiones de código:**

1. Multi-vertical primero
2. Configuración en BD, no en código
3. Mobile-first
4. SSR obligatorio para contenido público
5. SWR edge-first
6. 10 Founding Dealers first (¿esto ayuda a conseguir o retener los primeros 10 dealers?)
7. No construir sin demanda

### 4.4 Workplace / Sede — Campa Onzonilla

**Ubicación:** Polígono Industrial de Onzonilla, León, España. Operada por Tank Ibérica SL.

**Función:**

- Almacenamiento de vehículos (stock propio + consigna)
- Subastas presenciales
- Inspecciones y verificaciones
- Punto de entrega/recogida de transporte (IberHaul)
- Grabación de contenido (vídeos YouTube, fotos para catálogo)

**Accesos y seguridad física:**

| Medida                           | Estado | Responsable  |
| -------------------------------- | ------ | ------------ |
| Vallado perimetral               | Activo | Tank Ibérica |
| Cámaras de vigilancia            | Activo | Tank Ibérica |
| Control de acceso (llave/código) | Activo | JCG          |
| Seguro de responsabilidad civil  | Activo | Tank Ibérica |
| Seguro de vehículos en campa     | Activo | Tank Ibérica |

**PRL (Prevención de Riesgos Laborales):**

- Evaluación de riesgos: pendiente formalizar (obligatorio si hay empleados, no aplica con 0 empleados)
- EPIs disponibles: casco, chaleco reflectante, guantes (para visitas a campa)
- Protocolo de visitas: siempre acompañados por JCG o personal autorizado
- Señalización de zona de maniobra de vehículos pesados

**Inventario de activos físicos:**

| Activo                        | Cantidad | Valor estimado | Ubicación           |
| ----------------------------- | -------- | -------------- | ------------------- |
| Góndola IberHaul              | 1        | ~€80-120K      | Onzonilla / en ruta |
| Stock de vehículos (rotativo) | 10-30    | ~€150K         | Campa               |
| Equipamiento de campa         | —        | ~€5-10K        | Campa               |
| Material de merchandising     | —        | ~€500          | Campa               |
| Equipamiento oficina          | —        | ~€2K           | Campa               |

**Proveedores y contactos críticos:**

| Proveedor/Servicio | Función                                 | Contacto          | Frecuencia      |
| ------------------ | --------------------------------------- | ----------------- | --------------- |
| IberHaul           | Transporte de vehículos                 | Interno (JCG)     | Diaria          |
| Gestoría fiscal    | Contabilidad, impuestos, transferencias | Por definir       | Mensual         |
| Abogado            | Legal, contratos, disputas              | Por definir       | Según necesidad |
| Imprenta           | Merchandising, vinilos, tarjetas        | Por definir       | Trimestral      |
| Seguro de campa    | RC + vehículos                          | Por definir       | Anual           |
| Taller mecánico    | Revisiones pre-venta                    | Local (Onzonilla) | Según necesidad |
| ITV                | Inspecciones                            | León              | Según necesidad |

---

## S5 — Mapa de Áreas de la Empresa

### 5.1 Áreas funcionales

```
TradeBase
├── Producto
│   ├── Catálogo y búsqueda
│   ├── Dashboard dealer
│   ├── Subastas
│   ├── Sistema de reservas
│   ├── WhatsApp AI Pipeline
│   └── Contenido editorial
│
├── Ingeniería
│   ├── Frontend (Nuxt 3 / Vue 3)
│   ├── Backend (Nitro / Cloudflare Workers)
│   ├── Base de datos (Supabase / PostgreSQL)
│   ├── Integraciones (Stripe, WhatsApp, IA)
│   ├── Infraestructura (CI/CD, monitoring)
│   └── Seguridad (WAF, RLS, auth)
│
├── Datos e IA
│   ├── Pipeline de datos de mercado
│   ├── Generación de contenido (Claude)
│   ├── Verificación automática (Vision)
│   ├── Traducción (GPT-4o mini batch)
│   └── Silent Safety (anti-fraude)
│
├── Go-to-Market
│   ├── SEO orgánico
│   ├── Google Ads
│   ├── Captación dealers
│   ├── Contenido editorial
│   └── Publicidad local
│
├── Operaciones
│   ├── Sinergia campa (Tank Ibérica)
│   ├── Transporte (IberHaul)
│   ├── Verificaciones
│   ├── Soporte dealer
│   └── Moderación contenido
│
└── Administración
    ├── Legal y compliance (GDPR, DSA)
    ├── Contabilidad
    ├── Facturación (Stripe)
    └── Propiedad intelectual
```

### 5.2 Responsabilidad por área

| Área              | Responsable          | Herramienta principal |
| ----------------- | -------------------- | --------------------- |
| Producto          | J.M.G. + Claude Code | Panel admin + código  |
| Ingeniería        | Claude Code          | VS Code + terminal    |
| Datos e IA        | Claude Code          | APIs Anthropic/OpenAI |
| GTM               | J.M.G.               | Google Ads, contenido |
| Operaciones campa | J.C.G.               | Tank Ibérica          |
| Captación dealers | J.C.G.               | WhatsApp + visitas    |
| Legal             | Ambos + asesor       | Documentos internos   |
| Contabilidad      | J.C.G. + gestoría    | Stripe + facturación  |

---

## S6 — Producto

### 6.1 Catálogo y búsqueda

- Filtros dinámicos leídos de BD (categoría, subcategoría, marca, modelo, precio, año, ubicación)
- Vista grid + tabla con export CSV/PDF
- SEO: JSON-LD (Product), hreflang, canonical, sitemap dinámico, breadcrumbs
- Landing pages automáticas por categoría/marca (umbral dinámico)
- URLs planas con slugs SEO: `/cisterna-alimentaria-indox-2019-madrid`
- Geo-fallback inteligente: escalera de 8 niveles geográficos, pill selector, preferencia persistente
- PromoCards en grid: split card en posición ~3, cascada de búsquedas similares al final
- Early access: vehículos con `visible_from` delay (24h Basic / 12h Classic / inmediato Premium)

### 6.2 Dashboard dealer

- CRM con pipeline de leads, estadísticas, email resumen semanal
- Herramientas: facturas, contratos, presupuestos, calculadora ROI
- Exportador cross-platform (Milanuncios, Wallapop)
- Widget embeddable, portal público (`/[dealer-slug]`)
- Doble URL por vehículo: `/vehiculo/[slug]` (canonical) + `/[dealer]/[slug]` (portal dealer, noindex)
- Onboarding funnel: día 0-30
- Importación masiva CSV/Excel
- Gestión de alquileres y mantenimientos

### 6.3 Subastas

- Online con Supabase Realtime, anti-sniping (2 min)
- Depósito vía Stripe (capture al ganar, cancel al perder)
- 8% buyer's premium
- Registro previo + verificación de documentos

### 6.4 WhatsApp AI Pipeline

- Fotos por WhatsApp → Claude Vision → ficha bilingüe auto-publicada
- **Moat competitivo:** ningún competidor lo ofrece
- Retry automático 15 min
- Target: dealers de 45-60 años que viven en WhatsApp

### 6.5 Sistema de reservas

- Reserva con depósito vía Stripe
- Reserva prioritaria: 2 créditos → pausa anuncio 48h
- Cron diario expira reservas no confirmadas

### 6.6 Contenido editorial

- `/guia/` (evergreen) + `/noticias/` (temporal)
- Generación con Claude Max batch
- Publicación programada
- SEO Score ≥50 para publicar
- Schema FAQ, linking interno a catálogo

### 6.7 Verificación (6 niveles)

| Nivel | Nombre        | Descripción                                   |
| ----- | ------------- | --------------------------------------------- |
| 0     | Sin verificar | Publicado sin documentos                      |
| 1     | Verificado    | Documentos básicos (ficha técnica, ITV)       |
| 2     | Extendido     | Historial de mantenimiento, fotos adicionales |
| 3     | Detallado     | Inspección técnica independiente              |
| 4     | Auditado      | Auditoría completa con informe profesional    |
| 5     | Certificado   | Certificación oficial del fabricante          |

### 6.8 Alertas, favoritos y notificaciones

- Búsquedas guardadas, favoritos con comparativa
- Alertas Pro 24h, price drop diario
- Push notifications (PWA)
- Email transaccional (30 templates predefinidos)

### 6.9 Sistema de demandas inverso

Compradores publican "busco X" → dealers reciben leads inversos.

### 6.10 Portal dealer público

- URL propia: `/[dealer-slug]`
- Branding propio (logo, colores, header) — gratis en lanzamiento
- Sin PromoCards del marketplace
- Card sutil al final: "Ver más en Tracciona →"
- SEO: noindex (el canonical es `/vehiculo/[slug]`)

### 6.11 Métricas del producto (Mar 2026)

| Métrica         | Valor                                            |
| --------------- | ------------------------------------------------ |
| Páginas Vue     | 125                                              |
| Componentes Vue | 418                                              |
| Composables     | 147                                              |
| Endpoints API   | 62                                               |
| Tablas BD       | 92                                               |
| Migraciones SQL | 80 (00001-00066 + 14 timestamped)                |
| Tests           | 34 (12 E2E + 5 seg + 11 unit + 3 comp + 3 setup) |
| CI/CD workflows | 7                                                |

---

## S7 — Ingeniería y Tecnología

### 7.1 Stack

| Capa          | Tecnología                             | Razón                                               |
| ------------- | -------------------------------------- | --------------------------------------------------- |
| Frontend/SSR  | Nuxt 3 (Vue 3 + Nitro)                 | SSR nativo para SEO                                 |
| Base de datos | Supabase (PostgreSQL + RLS + Realtime) | Open source, self-hostable, RLS integrado           |
| Hosting/CDN   | Cloudflare Pages                       | Edge rendering, free tier generoso                  |
| Pagos         | Stripe (Checkout, Connect, Webhooks)   | Estándar industria, Connect para pagos entre partes |
| Imágenes      | Cloudinary + CF Images                 | Pipeline híbrido ahorra 94% vs Cloudinary puro      |
| Email         | Resend                                 | Simple, barato, buena DX                            |
| IA            | Anthropic Claude + OpenAI (fallback)   | Failover automático vía env var                     |
| CAPTCHA       | Cloudflare Turnstile                   | Invisible, sin fricción, gratis                     |
| WhatsApp      | Meta Cloud API                         | Target (dealers) vive en WhatsApp                   |
| Analytics     | GA4 + Google Ads pixel                 | Gated por cookie consent                            |
| Monitoring    | Sentry + infra_metrics custom          | Cron cada 5 min recoge métricas                     |
| CI/CD         | GitHub Actions (7 workflows)           | lint, typecheck, build, E2E, Lighthouse, DAST       |

**No añadir dependencias sin justificación.** El proyecto es deliberadamente lean: no Tailwind, no ORM, no UI framework.

### 7.2 Arquitectura

**Monolito Nuxt full-stack deliberado.** Frontend en `app/`, backend en `server/api/*`. Con 2 personas, la complejidad operativa de microservices no se justifica.

```
app/
  pages/              # 125 rutas (index, vehiculo/[slug], admin/*, dashboard/*)
  components/         # 418 SFCs por dominio (catalog/, vehicle/, admin/)
  composables/        # 147 composables (useVehicles, useFilters...)
  layouts/            # default, admin
  middleware/         # auth.ts, admin.ts
  assets/css/         # tokens.css (design system), themes.css
server/
  api/                # 62 endpoints API (Nitro)
  services/           # Lógica de negocio (billing, marketReport, aiProvider)
  middleware/         # Security headers, rate limiting, CORS
  utils/              # verifyCronSecret, safeError
i18n/                 # Traducciones (es.json, en.json)
supabase/migrations/  # SQL (80 migraciones)
types/                # supabase.ts (auto-generated)
tests/                # Vitest + Playwright
```

### 7.3 Patrón multi-vertical

Un solo codebase, N deploys. Cada vertical es un deploy de Cloudflare Pages con variables de entorno distintas (`VERTICAL_SLUG`, `NUXT_PUBLIC_SITE_URL`, etc.).

La tabla `vertical_config` controla todo per-vertical: marca, colores, tipografía, idiomas, módulos activos (feature flags), plantillas de email, SEO, monetización.

**Clonar un vertical = 2-4 horas, cero código:** insertar filas en `vertical_config` + nuevo deploy CF Pages + dominio + env vars.

### 7.4 Base de datos

- **92 tablas** con RLS habilitado (89 con RLS activo)
- **80 migraciones** aplicadas
- Columna `vertical` en tablas clave para aislamiento de datos
- Índices compuestos para queries multi-vertical
- Full-text search en PostgreSQL
- Triggers automáticos para `updated_at`, generación de slugs SEO-friendly
- Precios en céntimos (convención Stripe)
- BD adelantada al frontend (Layer 2): varias tablas existen sin UI todavía

**Modelo multi-cluster Supabase:**

- Cada cluster ($25/mes) tiene capacidad 4.0 unidades
- Pesos por vertical: pesada=1.0, media=0.4, ligera=0.15
- Escalado: 1 vertical (1 cluster) → 7 verticales (2 clusters) → 20 verticales (~5 clusters, $125/mes)

### 7.5 Pipeline de imágenes

| Fase | Arquitectura                               | Estado     |
| ---- | ------------------------------------------ | ---------- |
| 1    | Cloudinary-only                            | Superada   |
| 2    | Cloudinary transforma + CF Images almacena | **Actual** |
| 3    | CF Images solo                             | Futuro     |

WebP, responsive sizes, lazy loading, blur placeholder. Cache immutable 30d. Ahorro 94% vs Cloudinary puro.

### 7.6 Rendimiento y caché

- **SWR (Stale-While-Revalidate)** en Cloudflare edge: absorbe 98% de lecturas
- El marketplace es 95% lecturas → el edge es extremadamente efectivo
- Objetivo: 20 verticales × 200M visitas/mes a $350-600/mes de infraestructura total

### 7.7 Seguridad (9 capas)

1. Cloudflare WAF + DDoS protection
2. Turnstile CAPTCHA en formularios
3. Rate limiting (CF WAF en producción)
4. Supabase RLS en todas las tablas
5. Auth JWT via Supabase Auth (Google Login habilitado)
6. Verificación de firma HMAC en webhooks (Stripe, WhatsApp)
7. `verifyCronSecret()` en los 13 endpoints cron
8. CSP headers + security headers
9. SAST (Semgrep) + DAST (OWASP ZAP) + npm audit en CI

**Rate limiting (Cloudflare WAF):**

| Regla            | Límite      |
| ---------------- | ----------- |
| Email endpoints  | 10 req/min  |
| Lead forms       | 5 req/min   |
| Stripe endpoints | 20 req/min  |
| Account delete   | 2 req/min   |
| API writes       | 30 req/min  |
| API reads        | 200 req/min |

### 7.8 API (62 endpoints)

| Tipo          | Cantidad | Auth                              |
| ------------- | -------- | --------------------------------- |
| Admin-only    | 14       | serverSupabaseUser + role check   |
| User auth     | 16       | serverSupabaseUser                |
| CRON_SECRET   | 13       | x-internal-secret header          |
| Public        | 8        | Sin auth, con cache SWR           |
| Internal      | 3        | x-internal-secret                 |
| Firma externa | 3        | HMAC (Stripe, WhatsApp)           |
| Dual          | 5        | Public + auth con diferente scope |

### 7.9 Testing

34 tests actuales: 12 E2E + 5 seguridad + 11 unit + 3 componentes + 3 setup. No se busca 100% coverage — tests para flujos críticos y lógica compleja.

### 7.10 Deploy pipeline

```
git push → GitHub Actions CI:
  lint → typecheck → build → E2E → Lighthouse → DAST
  → Cloudflare Pages auto-deploy (zero-downtime, edge)
```

### 7.11 Backups (3 capas)

| Capa                         | RPO | Retención                             | Encriptación |
| ---------------------------- | --- | ------------------------------------- | ------------ |
| Supabase PITR                | 0   | 7-28 días                             | —            |
| Daily a Backblaze B2         | 24h | 7 diarios + 4 semanales + 6 mensuales | AES-256-CBC  |
| Archivo mensual cold storage | 30d | 6 meses                               | AES-256-CBC  |

### 7.12 Rotación de secrets

- **Anual:** Supabase Service Role, Stripe, WhatsApp token, Resend, CRON_SECRET, Turnstile, Cloudinary, Backblaze
- **Cada 6 meses:** Anthropic y OpenAI API keys (billing-critical)
- **Nunca rotar:** Supabase URL, WhatsApp Phone Number ID, Cloudinary Cloud Name (estáticos/públicos)

### 7.13 Convenciones de código

| Convención        | Detalle                                                 |
| ----------------- | ------------------------------------------------------- |
| TypeScript strict | No `any`                                                |
| Composables       | `use` + PascalCase, uno por dominio                     |
| Componentes       | PascalCase, uno por archivo, <500 líneas                |
| Server routes     | Max 200 líneas, lógica en services/                     |
| CSS               | Scoped, tokens en `tokens.css`, mobile-first            |
| i18n              | `$t()` para UI, `localizedField()` para BD              |
| Migraciones       | Numeración incremental en supabase/migrations/          |
| Commits           | Conventional commits (feat:, fix:, refactor:...)        |
| Sin innerHTML     | Usar textContent o Vue binding, DOMPurify si inevitable |
| Sin console.log   | Error handling o Sentry en producción                   |

---

## S8 — Datos e Inteligencia Artificial

### 8.1 Proveedores de IA

| Proveedor          | Uso                                          | Failover             |
| ------------------ | -------------------------------------------- | -------------------- |
| Anthropic Claude   | Descripciones, verificación Vision, análisis | OpenAI automático    |
| OpenAI GPT-4o mini | Traducciones batch                           | DeepL (30× más caro) |

Failover automático Claude → OpenAI vía `callAI()` en `server/services/aiProvider.ts` con 3 presets:

- **Realtime:** 8s timeout (respuestas de chat)
- **Background:** 30s timeout (generación de fichas)
- **Deferred:** 60s timeout (batch processing)

### 8.2 Pipeline de datos de mercado

**Modelo Idealista:** Acumular datos de precios (primera BD de precios para vehículos industriales ibéricos).

**Datos recopilados:**

- Precios de listado y precios de venta
- Tiempos de venta por categoría y zona
- Volumen por región geográfica
- Patrones estacionales
- Comportamiento de búsqueda (zero-result logging)
- Vehicle duration tracking

**Productos de datos futuros:**

1. API valoración (min/avg/max/percentiles) — activar tras ≥500 transacciones
2. Informes sectoriales trimestrales
3. Datasets anualizados
4. Índice de precios sectorial
5. Alertas de mercado para dealers

### 8.3 IA en el producto

| Feature                  | Modelo        | Descripción                                  |
| ------------------------ | ------------- | -------------------------------------------- |
| WhatsApp → ficha         | Claude Vision | Fotos → extracción de datos → ficha bilingüe |
| Generación descripciones | Claude        | SEO-optimized para catálogo                  |
| Verificación documentos  | Claude Vision | Auto-verificación de ficha técnica, ITV      |
| Traducción batch         | GPT-4o mini   | ES↔EN a ~€0.001/ficha                        |
| Generación editorial     | Claude Max    | Artículos evergreen y noticias               |
| Social media posts       | Claude        | Posts para redes sociales desde fichas       |

### 8.4 Silent Safety (anti-fraude)

7 subsistemas definidos para detectar y prevenir fraude:

1. Detección de precios anómalos
2. Validación de documentos
3. Análisis de patrones de comportamiento
4. Cross-referencing con datos DGT
5. Scoring de fiabilidad por dealer
6. Alertas de actividad sospechosa
7. Logging comportamental (12 datos)

### 8.5 Internacionalización (i18n)

| Nivel                  | Qué traduce              | Mecanismo                    |
| ---------------------- | ------------------------ | ---------------------------- |
| UI (strings estáticos) | Botones, menús, mensajes | `$t()` + `i18n/XX.json`      |
| Campos cortos BD       | Nombres de categoría     | JSONB + `localizedField()`   |
| Contenido largo        | Descripciones, artículos | Tabla `content_translations` |

**Activos:** ES + EN. **Pospuestos:** FR, DE, NL, PL, IT (activar según demanda).

**Añadir idioma:** 1 línea en nuxt.config + `i18n/XX.json` + batch traducción. Sin código, sin migraciones.

---

## S9 — Go-to-Market (GTM)

### 9.1 Target demográfico

**Dealers de 45-60 años, WhatsApp-first, baja adopción digital.** Esto condiciona TODO el diseño UX:

- Interfaces simples, textos grandes, CTAs claros
- Mínimos pasos para cualquier acción
- Todo accesible por teléfono móvil
- Si algo se puede hacer por WhatsApp, hacerlo por WhatsApp
- Touch targets ≥ 44px
- No asumir familiaridad con patrones UX modernos

### 9.2 Estrategia de captación

**La acción de mayor impacto:** Grabar vídeo de 60 segundos del flujo WhatsApp → ficha, enviarlo a 50 dealers.

**3 fases de captación:**

1. **Founding Dealers (0-10):** Contacto directo J.C.G., demo WhatsApp, suscripción gratis forever
2. **Segunda ola (10-50):** Casos de éxito founding dealers, Google Ads branded, contenido en LinkedIn
3. **Escala (50+):** SEO orgánico, referidos, partnerships con asociaciones

### 9.3 SEO orgánico

- SSR obligatorio para contenido público
- JSON-LD (Product) en fichas de vehículo
- Hreflang ES/EN
- Sitemap dinámico
- Breadcrumbs estructurados
- URLs planas SEO-friendly
- Google Merchant Center feed
- Landing pages automáticas por categoría/marca

### 9.4 Google Ads

6 campañas definidas, incluyendo Campaña 0 branded. Presupuesto progresivo con reglas de parada/escalado. GTM implementation tracking.

### 9.5 Contenido editorial

- `/guia/` (evergreen: comparativas, guías de compra/venta)
- `/noticias/` (temporal: normativa, ferias, novedades sector)
- SEO Score ≥50 para publicar
- Linking interno a catálogo (machine learning futuro)

### 9.6 Publicidad local

Publicidad geolocalizada para anunciantes locales: gestorías, talleres, aseguradoras, financieras, empresas de transporte, proveedores de repuestos. Adaptada por vertical y por zona geográfica.

### 9.7 Repositioning

Posicionar como "herramienta de gestión de stock para dealers", no solo como "portal de anuncios". Esto genera lock-in y recurrencia.

### 9.8 Elevator pitches

- **30s general:** "TradeBase es un grupo de marketplaces B2B verticales. Tracciona, nuestra primera vertical, conecta compradores y vendedores de vehículos industriales con IA y herramientas de gestión integradas."
- **60s dealer:** "Tracciona te permite publicar tus vehículos industriales gratis, recibir leads cualificados, y gestionar tu negocio con facturas, contratos y CRM integrado. Solo tienes que enviar fotos por WhatsApp y la IA crea la ficha profesional en 2 idiomas."
- **2min inversor:** "No existe marketplace B2B industrial profesional en España ni Europa. TradeBase entra en un mercado de €3-6B sin incumbente digital, con un modelo de 4 layers de revenue y un moat de datos tipo Idealista."

### 9.9 Tácticas de captación de dealers (detalle)

**Semana 1 — Red personal (€0):**

- Subir inventario Tank Ibérica como seed (20-30 fichas reales)
- Pedir a 3-5 dealers conocidos que prueben: "Mándame fotos por WhatsApp, yo monto el anuncio"
- Objetivo: 50 fichas reales para arrancar

**Semanas 2-4 — Puerta fría (€0):**

- Lista de 50 dealers de Mascus/MachineryTrader/Milanuncios
- 10-15 emails personalizados/día: "He visto tus X vehículos en [plataforma]. Te los subo gratis a Tracciona"
- Tasa esperada: 5-15% responden sí. Objetivo: 15 dealers activos con 100+ fichas

**Publicación multicanal como servicio (€0):**

- "Me mandas fotos por WhatsApp → te publico en Tracciona + Milanuncios + Wallapop + Facebook desde un solo sitio"
- La herramienta "Exportar anuncio" ya está construida

**Milanuncios PRO paraguas (€50/mes):**

- Una cuenta PRO a nombre de Tracciona, subir vehículos de varios dealers
- Contacto va directo al dealer real. Ellos aparecen en PRO sin pagar

**Empresas de renting/leasing (€0):**

- Contactar ALD, Arval, LeasePlan, Northgate, Alphabet
- Al finalizar contratos, necesitan liquidar 20-50 vehículos rápido

**Vídeo WhatsApp 60s (€0) — ACCIÓN DE MAYOR IMPACTO:**

- Grabar vídeo del flujo WhatsApp → ficha desde el móvil
- Enviarlo a 50 dealers por WhatsApp directo
- Coste cero, 30 minutos, reutilizable en web/redes/email

### 9.10 Canales de promoción y distribución

**Redes sociales (€0 excepto retargeting):**

| Canal                         | Frecuencia        | Tiempo/día | Objetivo                                            |
| ----------------------------- | ----------------- | ---------- | --------------------------------------------------- |
| LinkedIn                      | 2-3 posts/semana  | 15 min     | Fleet managers, directores transporte               |
| YouTube                       | 1 vídeo/semana    | 30 min     | Reviews de vehículos en campa Onzonilla             |
| WhatsApp Channel              | 2-3 vehículos/día | 10 min     | Transportistas (automatizable)                      |
| Facebook Marketplace + grupos | 1 vehículo/día    | 30 min     | Compradores locales                                 |
| Telegram grupo                | Moderación diaria | 15 min     | Comunidad del sector                                |
| Pinterest                     | Automático        | Setup 3h   | SEO imágenes (auto-pin cada vehículo nuevo)         |
| Instagram + Facebook + X      | Automático        | Setup 3-4h | Auto-post por webhook desde cada INSERT en vehicles |

**Newsletter "El Industrial" (1h/semana):**

- 5 vehículos destacados + 1 dato de mercado + 1 consejo práctico
- Captura emails desde valoración, informe de mercado, registro
- Canal propio, independiente de algoritmos

**Herramientas de captación SEO (requieren código):**

| Herramienta                 | URL                                                                    | Objetivo                       |
| --------------------------- | ---------------------------------------------------------------------- | ------------------------------ |
| Landing pages programáticas | `/camiones/volvo-fh-500`, `/excavadoras/caterpillar-320-precio-madrid` | 200+ páginas indexables        |
| "¿Cuánto vale mi camión?"   | `/valoracion`                                                          | Captura vendedores             |
| Calculadoras públicas       | `/herramientas/coste-km`, `/herramientas/financiacion`                 | SEO + enlaces al catálogo      |
| Informe mercado trimestral  | PDF descargable (lead magnet)                                          | Emails cualificados del sector |

### 9.11 Alianzas offline (€0)

| Aliado                          | Qué ve/sabe                       | Propuesta                                     | Impacto |
| ------------------------------- | --------------------------------- | --------------------------------------------- | ------- |
| Gestorías de transferencias     | Todas las compraventas de la zona | "Recomienda Tracciona, €50 por venta cerrada" | Alto    |
| Talleres de camiones            | Quién va a vender su vehículo     | Tarjetas en recepción                         | Medio   |
| Corredores de seguros de flotas | 50-200 empresas de transporte     | "Si tu cliente vende, recomiéndanos"          | Alto    |
| ITV de vehículos pesados        | Todo vehículo industrial pasa     | Flyers: "¿No pasa ITV? Véndelo gratis"        | Medio   |

### 9.12 Branding físico pasivo

- **Vinilo en góndola IberHaul (€300, una vez):** "¿Vendes tu camión? tracciona.com" + QR grande. Miles de impresiones diarias en autopistas
- **QR en vehículos de la campa (€20):** Cartel plastificado en parabrisas → enlace a la ficha en Tracciona
- **Google Business Profile (€0, 10 min):** "Tracciona — Marketplace de Vehículo Industrial" en Google Maps

### 9.13 Estrategia de expansión geográfica

**Fase 1 — España (año 1):** Consolidar Tracciona en el mercado ibérico. Métrica: 50+ dealers activos, 500+ fichas orgánicas. Sin inversión en internacionalización.

**Fase 2 — Portugal + Francia (año 2):** Activar idiomas PT + FR. Mismos canales de captación adaptados. Dealers españoles con actividad transfronteriza como puente natural.

**Fase 3 — Europa occidental (año 3+):** DE, NL, IT, PL. Cada mercado activado solo con demanda medida. WhatsApp multi-país con smart routing + números locales.

**Expansión vertical (paralela):** Cada nuevo vertical (Municipiante, CampoIndustrial, etc.) se activa independientemente por mercado geográfico. El crecimiento es bidimensional: más verticales × más países.

---

## S10 — Operaciones Core del Marketplace

### 10.1 Flujo del comprador

```
SEO/Directo/SEM → Catálogo → Filtros → Ficha vehículo
    ├── Contactar dealer (teléfono, WhatsApp, formulario)
    ├── Favoritos + Alertas
    ├── Subastas (registro → depósito → pujas → adjudicación)
    └── Verificación (badges, informe DGT)
```

### 10.2 Flujo del dealer

```
Registro → Onboarding (5 pasos) → Dashboard
    ├── Publicar vehículo (manual / WhatsApp IA / Excel)
    ├── Gestionar inventario
    ├── Leads / CRM (pipeline: new → viewed → contacted → won/lost)
    ├── Estadísticas
    ├── Herramientas (factura, contrato, presupuesto, calculadora, export)
    ├── Portal público
    └── Suscripción
```

### 10.3 Flujo del admin

```
Dashboard métricas → Gestión:
    ├── Contenido (vehículos, dealers, noticias, subastas, verificaciones)
    ├── Marketing (publicidad, captación, social, banner)
    ├── Operaciones (usuarios, suscripciones, pagos, facturación, balance)
    ├── Infraestructura (métricas BD, alerts, clusters)
    └── Configuración (branding, navegación, homepage, idiomas, precios...)
```

### 10.4 Procesos automáticos (13 crons)

| Cron                | Frecuencia     | Función                                      |
| ------------------- | -------------- | -------------------------------------------- |
| freshness-check     | Diario         | Marca vehículos obsoletos (>90 días)         |
| search-alerts       | Diario         | Envía alertas de búsqueda                    |
| favorite-price-drop | Diario         | Notifica bajadas de precio en favoritos      |
| favorite-sold       | Diario         | Notifica favoritos vendidos                  |
| price-drop-alert    | Diario         | Notificaciones generales de bajada de precio |
| reservation-expiry  | Diario         | Expira reservas no confirmadas               |
| publish-scheduled   | Diario         | Publica contenido programado                 |
| founding-expiry     | Diario         | Gestión founding member                      |
| generate-editorial  | Diario/Semanal | Genera contenido editorial con IA            |
| auto-auction        | Cada 5 min     | Procesa subastas (ganadores)                 |
| infra-metrics       | Cada 5 min     | Recoge métricas infra                        |
| whatsapp-retry      | Cada 15 min    | Reintenta WhatsApp fallidos                  |
| dealer-weekly-stats | Lunes 09:00    | Resumen semanal a dealers                    |

Todos protegidos con `verifyCronSecret()`. Scheduler: GitHub Actions o cron-job.org.

### 10.5 Integraciones externas

```
Stripe: checkout, portal, webhook, Connect, depósitos
WhatsApp: webhook (verificación + recepción), procesamiento IA
Cloudinary: subida client-side, transformaciones, CDN
Email (Resend): envío con 30 templates, baja de emails
Push Notifications: Web Push con VAPID
```

### 10.6 Catálogo fresco (4 mecanismos)

1. Renovación obligatoria 30 días
2. Detección de inactividad
3. Scraping cross-platform (solo manual, nunca cron)
4. Incentivo "vendido" + auto-despublicación 90 días

---

## S11 — Administración General y Corporativo

### 11.1 Contabilidad y facturación

- **Stripe** como motor de pagos (checkout, suscripciones, Connect)
- **Precios en céntimos** en toda la BD (convención Stripe)
- Facturas generadas automáticamente via Stripe
- Herramienta de facturación para dealers en dashboard
- Balance financiero en admin (revenue, comisiones)
- Export CSV de facturas

### 11.2 Legal

| Área                   | Estado       | Documento                         |
| ---------------------- | ------------ | --------------------------------- |
| Términos y condiciones | Implementado | `/legal/condiciones`              |
| Política de privacidad | Implementado | `/legal/privacidad`               |
| Política de cookies    | Implementado | `/legal/cookies`                  |
| Aviso legal UK         | Implementado | `/legal/uk`                       |
| Transparencia DSA      | Implementado | `/transparencia`                  |
| Política divulgación   | Implementado | `/seguridad/politica-divulgacion` |
| RAT GDPR               | Borrador     | `docs/legal/RAT-BORRADOR.md`      |

### 11.3 GDPR Compliance

**13 actividades de tratamiento documentadas:**

- ACT-01: Registro y autenticación de usuarios
- ACT-02: Publicación de vehículos
- ACT-03: Mensajería comprador-vendedor
- ACT-04: Gestión de pagos y suscripciones
- ACT-05: Subastas online
- ACT-06: Alertas y favoritos
- ACT-07: Analítica web
- ACT-08: Email transaccional
- ACT-09: WhatsApp Business
- ACT-10: Verificación de documentos con IA
- ACT-11: Publicidad segmentada
- ACT-12: Datos de mercado
- ACT-13: Backups

**11 subprocesadores identificados:** Supabase, Cloudflare, Stripe, Anthropic, OpenAI, Meta, Resend, Cloudinary, Google, Backblaze, Sentry.

**Endpoints GDPR:**

- `/api/account/delete` — Derecho de supresión (anonimización inmediata)
- `/api/account/export` — Derecho de portabilidad (JSON)

### 11.4 Retención de datos

| Tipo de dato     | Retención               | Base legal          |
| ---------------- | ----------------------- | ------------------- |
| Error logs       | 30 días                 | Interés legítimo    |
| Session data     | 90 días                 | Consentimiento      |
| Analytics events | 6 meses                 | Consentimiento      |
| Vehicle listings | 2 años                  | Contrato            |
| User accounts    | 3 años post-inactividad | Interés legítimo    |
| Conversations    | 1 año                   | Contrato            |
| Invoices         | 10 años                 | Ley fiscal española |
| Contracts        | 10 años                 | Ley fiscal española |

### 11.5 Subvenciones y ayudas públicas

**Criterio para evaluar si merece la pena:**

- Solo aplicar si el esfuerzo de justificación no supera el 20% del tiempo de los fundadores
- Priorizar ayudas con dotación >€5.000 y tasa de concesión >30%
- Descartar convocatorias con reporting complejo si la empresa tiene 0 empleados

**Owner:** JMG (identificación y solicitud) + JCG (documentación fiscal/contable)

**Carpeta de evidencias y control documental:**

- Directorio: `docs/subvenciones/[convocatoria]/` (crear cuando aplique)
- Contenido mínimo por solicitud: convocatoria (PDF), solicitud presentada, presupuesto, resolución, justificaciones
- Archivo de facturas y pagos vinculados al proyecto subvencionado

**Trazabilidad contable por proyecto:**

- Cada subvención con cuenta contable separada (o etiqueta en software de contabilidad)
- Facturas marcadas con referencia a la convocatoria
- Control de plazos de justificación (calendario)

**Convocatorias potenciales (evaluar según disponibilidad):**

| Programa                          | Organismo       | Aplica a TradeBase         | Dotación típica           |
| --------------------------------- | --------------- | -------------------------- | ------------------------- |
| Kit Digital                       | Red.es / MINECO | Sí (digitalización PYME)   | €2.000-12.000             |
| ENISA (Jóvenes Emprendedores)     | ENISA           | Sí (si <40 años)           | €25.000-75.000 (préstamo) |
| Ayudas I+D+i autonómicas          | Junta de CyL    | Sí (IA, marketplace)       | Variable                  |
| NEOTEC                            | CDTI            | Posible (base tecnológica) | €250.000                  |
| Horizonte Europa (SME Instrument) | UE              | A futuro (con facturación) | €50.000-2.5M              |

**Estado actual:** No se ha solicitado ninguna subvención. Evaluar Kit Digital y ENISA como primeras opciones cuando TradeBase SL esté constituida.

### 11.6 Cookie consent

`useConsent()` gates todo tracking/analytics/ads. Sin consentimiento, nada se ejecuta.

---

## S12 — Procesos End-to-End

### 12.1 Publicación de vehículo (manual)

```
1. Dealer accede a Dashboard → Nuevo vehículo
2. Rellena formulario (datos básicos, categoría, precio)
3. Sube fotos → Cloudinary → CF Images
4. Escribe o genera descripción (IA opcional)
5. Selecciona subcategoría y características
6. Guarda como borrador (status: draft)
7. Revisa vista previa
8. Publica (status: published)
9. Vehículo aparece en catálogo con SEO completo
```

### 12.2 Publicación de vehículo (WhatsApp)

```
1. Dealer envía fotos + texto por WhatsApp
2. Meta Cloud API recibe webhook → server/api/whatsapp/webhook.post.ts
3. Claude Vision analiza imágenes y texto
4. Se crea ficha borrador bilingüe (ES + EN)
5. Dealer recibe confirmación por WhatsApp
6. Dealer revisa y confirma en dashboard
7. Vehículo publicado
   (Si falla → retry automático 15 min)
```

### 12.3 Compra / contacto

```
1. Comprador encuentra vehículo (SEO, catálogo, alerta)
2. Visualiza ficha (JSON-LD, fotos, especificaciones)
3. Contacta dealer (teléfono, WhatsApp, formulario)
4. INSERT en tabla leads (status: new)
5. Email al dealer con datos del lead
6. Dealer ve lead en CRM → status: viewed → contacted
7. Negociación directa entre partes
8. Resultado: won/lost + precio de venta (si vendido)
9. Si vendido: vehículo → historico, notificaciones a favoritos
```

### 12.4 Subasta online

```
1. Admin crea subasta (vehículo + precio inicio + duración)
2. Compradores se registran (documentos + depósito Stripe)
3. Subasta activa: pujas en tiempo real (Supabase Realtime)
4. Anti-sniping: puja en últimos 2 min extiende 2 min
5. Subasta termina → ganador determinado
6. Ganador: capture depósito + buyer's premium 8%
7. Perdedores: cancel depósitos
8. Notificaciones a todos los participantes
```

### 12.5 Suscripción dealer

```
1. Dealer selecciona plan (Basic/Classic/Premium)
2. Redirect a Stripe Checkout
3. Pago procesado → webhook → INSERT/UPDATE subscriptions
4. Features desbloqueadas según tier
5. Renovación automática mensual/anual
6. Portal Stripe para gestión (cambiar plan, cancelar, facturas)
```

### 12.6 Compra de créditos

```
1. Usuario va a /precios#creditos
2. Selecciona pack (1/3/10/25/50)
3. Redirect a Stripe Checkout (one-time)
4. Pago → webhook → UPDATE user_credits + INSERT credit_transactions
5. Créditos disponibles inmediatamente
6. Uso: destacar, renovar, desbloquear, reservar, etc.
```

### 12.7 Verificación de documento

```
1. Dealer sube documento (ficha técnica, ITV, etc.)
2. Claude Vision analiza el documento automáticamente
3. Resultado: verificado/rechazado con razón
4. Si verificado: nivel de verificación del vehículo sube
5. Badge visible en ficha pública
```

### 12.8 Onboarding dealer (día 0-30)

```
Día 0:  Registro + datos empresa
Día 1:  Primer vehículo publicado (WhatsApp o manual)
Día 3:  Email con tips de optimización
Día 7:  Resumen semanal de estadísticas
Día 14: Sugerencia de herramientas (factura, contrato)
Día 30: Evaluación de conversión
```

### 12.9 Disaster recovery

```
Detección de caída:
1. Monitorización: cron/infra-metrics cada 5 min
2. Si caída detectada:
   a. Supabase: check status.supabase.com → maintenance page si >1h
   b. Cloudflare Pages: failover DNS a Vercel
   c. Stripe: banner "pagos no disponibles", queue para retry
3. Restauración:
   a. Restaurar desde backup B2 más reciente
   b. Actualizar DNS
   c. Verificar integridad de datos
```

---

## S12B — MVP Operativo: 7 Procesos Críticos + RACI

> **Leyenda RACI:** R = Responsable (ejecuta) · A = Accountable (decide/aprueba) · C = Consultado · I = Informado
>
> **Roles:** JMG = J.M.G. (digital) · JCG = J.C.G. (operativo) · CC = Claude Code (IA) · EXT = Partner externo (abogado, gestoría, etc.)

### 12B.1 Incidentes (Sev1/2/3) + comunicación externa

| Severidad | Definición                             | Ejemplo                                             | Tiempo de respuesta |
| --------- | -------------------------------------- | --------------------------------------------------- | ------------------- |
| **Sev1**  | Plataforma caída o datos comprometidos | BD inaccesible, breach, Stripe down                 | <1h                 |
| **Sev2**  | Funcionalidad crítica rota             | Publicación no funciona, webhooks fallan, auth roto | <4h                 |
| **Sev3**  | Bug menor o degradación parcial        | Estilos rotos, filtro no funciona, email no llega   | <24h                |

| Paso                 | Sev1                    | Sev2                      | Sev3                |
| -------------------- | ----------------------- | ------------------------- | ------------------- |
| Detectar             | CC/JMG (monitoring)     | CC/JMG                    | Cualquiera (report) |
| Diagnosticar         | R: CC · A: JMG          | R: CC · A: JMG            | R: CC               |
| Resolver             | R: CC · A: JMG          | R: CC                     | R: CC               |
| Comunicar a usuarios | R: JMG · A: JMG         | I: JMG (si impacta)       | —                   |
| Post-mortem          | R: CC · A: JMG · I: JCG | R: CC (nota en STATUS.md) | —                   |

**Comunicación externa (Sev1):**

1. Banner en web: "Estamos trabajando en ello. Volvemos en breve." (automático si Cloudflare detecta caída)
2. Email a dealers afectados (si >1h de caída)
3. Post-mortem público si afecta a datos de usuarios

### 12B.2 Disputas / Claims

| Paso                                                 | R   | A   | C             | I   |
| ---------------------------------------------------- | --- | --- | ------------- | --- |
| Recibir queja (email, chat, formulario)              | JCG | —   | —             | JMG |
| Evaluar legitimidad (<24h)                           | JCG | JCG | JMG           | —   |
| Si legítima: contactar al dealer/comprador           | JCG | JCG | —             | JMG |
| Si requiere mediación                                | JCG | JCG | EXT (abogado) | JMG |
| Si requiere acción en plataforma (bloqueo, retirada) | CC  | JMG | JCG           | —   |
| Documentar resolución                                | JCG | —   | —             | JMG |

**Principio:** Tracciona es **puro intermediario**. No posee, inspecciona ni garantiza bienes. Las disputas se median, no se arbitran. Si la disputa escala, se refiere a arbitraje externo.

**Umbral de escalado:** Si un dealer recibe 3+ quejas verificadas → revisión de trust score. Si score <20 → revisión manual de todos sus anuncios.

### 12B.3 Cambios en pricing / políticas

| Paso                                                    | R         | A                      | C              | I       |
| ------------------------------------------------------- | --------- | ---------------------- | -------------- | ------- |
| Proponer cambio de precio/política                      | JMG o JCG | —                      | —              | —       |
| Analizar impacto (usuarios, revenue, legal)             | JMG       | JMG + JCG (ambos)      | EXT (si legal) | —       |
| Aprobar cambio                                          | —         | JMG + JCG (unanimidad) | —              | —       |
| Implementar en código/BD                                | CC        | JMG                    | —              | JCG     |
| Comunicar a dealers afectados (30 días antes)           | JMG       | JMG                    | JCG            | Dealers |
| Actualizar docs (ESTRATEGIA-NEGOCIO, PROYECTO-CONTEXTO) | CC        | JMG                    | —              | —       |

**Regla:** Nunca subir precios sin 30 días de aviso. Los Founding Dealers tienen precio bloqueado de por vida (€0).

### 12B.4 Onboarding buyer y dealer (checklist)

**Onboarding buyer:**

| #   | Paso                                 | Auto/Manual     | Trigger                  |
| --- | ------------------------------------ | --------------- | ------------------------ |
| 1   | Registro (email + Google Login)      | Auto            | Sign up                  |
| 2   | Verificar email                      | Auto            | Supabase Auth            |
| 3   | Completar perfil (nombre, ubicación) | Manual          | Primera visita dashboard |
| 4   | Crear primera alerta de búsqueda     | Manual (guiado) | CTA en dashboard         |
| 5   | Guardar primer favorito              | Manual          | CTA en catálogo          |
| 6   | Primer contacto con dealer           | Manual          | Botón contactar          |

**Onboarding dealer:**

| #   | Paso                                         | Auto/Manual         | Deadline | Responsable  |
| --- | -------------------------------------------- | ------------------- | -------- | ------------ |
| 1   | Registro empresa + datos fiscales            | Manual              | Día 0    | Dealer + JCG |
| 2   | Verificar email + teléfono                   | Auto                | Día 0    | Sistema      |
| 3   | Subir logo + configurar portal               | Manual (guiado)     | Día 1    | Dealer       |
| 4   | Publicar primer vehículo (WhatsApp o manual) | Manual (asistido)   | Día 1-3  | Dealer + JCG |
| 5   | Recibir email tips de optimización           | Auto                | Día 3    | Sistema      |
| 6   | Revisar resumen semanal de estadísticas      | Auto                | Día 7    | Sistema      |
| 7   | Descubrir herramientas (factura, contrato)   | Manual (sugerencia) | Día 14   | Sistema      |
| 8   | Evaluar conversión a suscripción de pago     | Manual              | Día 30   | JCG          |

**RACI onboarding dealer:**

| Paso                          | R           | A   | C   | I   |
| ----------------------------- | ----------- | --- | --- | --- |
| Contacto inicial              | JCG         | JCG | —   | JMG |
| Setup técnico (portal, fotos) | CC + Dealer | JMG | JCG | —   |
| Seguimiento primer mes        | JCG         | JCG | —   | JMG |
| Conversión a pago             | JCG         | JCG | JMG | —   |

### 12B.5 Pagos: refunds / chargebacks

| Paso                                       | R             | A         | C   | I   |
| ------------------------------------------ | ------------- | --------- | --- | --- |
| Recibir solicitud de refund                | JMG (webhook) | —         | —   | JCG |
| Evaluar si procede (<48h)                  | JMG           | JMG + JCG | —   | —   |
| Ejecutar refund vía Stripe                 | JMG           | JMG       | —   | JCG |
| Recibir chargeback de Stripe               | JMG (webhook) | —         | —   | JCG |
| Recopilar evidencia para disputa (<7 días) | JMG           | JMG       | JCG | —   |
| Responder a Stripe con evidencia           | JMG           | JMG       | —   | JCG |
| Si perdemos: contabilizar la pérdida       | JCG           | JCG       | JMG | —   |

**Política de refunds:**

- Créditos: **no reembolsables** una vez consumidos. Reembolsables si no usados (dentro de 14 días, derecho de desistimiento).
- Suscripciones: cancelación inmediata sin cargo adicional. Pro-rata del período no consumido si pago anual.
- Depósitos de subasta: devolución automática a perdedores (Stripe cancel). Ganador pierde depósito si no completa la compra.

### 12B.6 Publicación y moderación

| Paso                                                    | R                  | A                      | C   | I      |
| ------------------------------------------------------- | ------------------ | ---------------------- | --- | ------ |
| Vehículo publicado (auto o WhatsApp)                    | Sistema            | —                      | —   | —      |
| Detección automática (duplicados, spam, precio anómalo) | CC (Silent Safety) | —                      | —   | JMG    |
| Si alerta automática: revisión manual                   | JMG                | JMG                    | —   | JCG    |
| Retirar anuncio fraudulento                             | JMG                | JMG                    | JCG | Dealer |
| Comunicar al dealer (si retirado)                       | JMG                | JMG                    | —   | JCG    |
| Reportes de usuarios                                    | JCG                | JCG                    | JMG | —      |
| Bloqueo temporal de dealer (trust score <20)            | JMG                | JMG + JCG              | —   | Dealer |
| Bloqueo permanente                                      | —                  | JMG + JCG (unanimidad) | EXT | Dealer |

**Qué se bloquea automáticamente:**

- Imágenes con contenido explícito/violento (Claude Vision)
- > 30 publicaciones/hora del mismo dealer (rate limit, excepto fleet companies verificados)
- Duplicados exactos (hash de imágenes + título)
- Texto con datos bancarios visibles

**Qué se revisa manualmente:**

- Precio >50% por debajo de mercado
- Dealer con 3+ reportes de usuarios
- Cuentas nuevas (<7 días) con >10 publicaciones

### 12B.7 Seguridad y privacidad: GDPR + breach

**Petición de derechos GDPR (export/delete):**

| Paso                                   | R                                     | A   | Plazo legal    |
| -------------------------------------- | ------------------------------------- | --- | -------------- |
| Recibir solicitud (email o formulario) | JMG                                   | —   | —              |
| Verificar identidad del solicitante    | JMG                                   | JMG | <72h           |
| Derecho de acceso/portabilidad         | CC (`/api/account/export`)            | JMG | ≤30 días       |
| Derecho de supresión                   | CC (`/api/account/delete`)            | JMG | ≤30 días       |
| Derecho de rectificación               | JMG (manual) o usuario (self-service) | JMG | ≤30 días       |
| Derecho de oposición al tratamiento    | JMG                                   | JMG | ≤30 días       |
| Documentar solicitud y respuesta       | JMG                                   | —   | Archivo 3 años |

**Protocolo de breach (72h):**

| Hora | Acción                                                           | R      | A         |
| ---- | ---------------------------------------------------------------- | ------ | --------- |
| H+0  | Detectar y contener (revocar accesos, aislar sistema)            | CC/JMG | JMG       |
| H+1  | Evaluar alcance (qué datos, cuántos usuarios)                    | CC     | JMG       |
| H+4  | Notificar a fundadores                                           | JMG    | JMG + JCG |
| H+24 | Preparar notificación a AEPD (si >72h no es posible, justificar) | JMG    | JMG + JCG |
| H+48 | Si riesgo alto: notificar a usuarios afectados                   | JMG    | JMG + JCG |
| H+72 | Notificación formal a AEPD (Art. 33 GDPR)                        | JMG    | JMG       |
| D+7  | Post-mortem + plan de remediación                                | CC     | JMG       |

---

## S13 — Métricas y KPIs

### 13.1 North Star Metrics

| Métrica                      | Objetivo       | Frecuencia |
| ---------------------------- | -------------- | ---------- |
| Vehículos publicados activos | >4.000         | Semanal    |
| Dealers activos              | >10 (founding) | Mensual    |
| Leads generados/mes          | Creciente      | Mensual    |
| Tasa contacto→respuesta      | >80% en <24h   | Semanal    |

### 13.2 KPIs por área

**Marketplace:**

- Visitas únicas/mes
- Páginas vistas por sesión
- Tasa de rebote
- Tiempo medio en sitio
- Conversión visita→contacto

**Dealers:**

- Vehículos publicados por dealer
- Leads recibidos
- Tiempo medio de respuesta
- Tasa de conversión lead→venta
- Retención mensual (churn)

**Revenue:**

- MRR (Monthly Recurring Revenue)
- ARPU (Average Revenue Per User)
- Revenue por layer (SaaS, transaccional, datos)
- Breakeven: 6 dealers × €19/mes

**Producto:**

- Lighthouse score (>75 en 3G throttled)
- Uptime (>99.9%)
- Error rate (<0.1%)
- Build time
- Test pass rate

### 13.3 Dashboard admin

El admin panel incluye:

- KPI summary (vehículos, dealers, leads, revenue)
- Notifications center
- Health score del marketplace
- Quick actions
- Recent leads
- Top vehicles

### 13.4 Dealer weekly stats

Cron semanal envía a cada dealer:

- Vistas de sus vehículos
- Leads recibidos
- Tasa de respuesta
- Comparativa con mercado
- Sugerencias de optimización

---

## S14 — Políticas y Normativa

### 14.1 Política de seguridad

**9 capas de seguridad implementadas** (ver §7.7).

**Errores activos de seguridad:**

| ID   | Severidad | Problema                                                    |
| ---- | --------- | ----------------------------------------------------------- |
| P0-3 | Crítico   | Rate limiting deshabilitado en producción (requiere CF WAF) |
| P0-4 | Alto      | `/api/verify-document` sin validación de ownership          |
| P0-5 | Alto      | 5 server routes exponen nombres de servicio en errores      |

### 14.1B Riesgos Top 10 + Plan de mitigación 48-72h

| #   | Riesgo                                               | Sev     | Estado actual                                | Mitigación                                       | Owner   | Fecha objetivo |
| --- | ---------------------------------------------------- | ------- | -------------------------------------------- | ------------------------------------------------ | ------- | -------------- |
| 1   | **Rate limiting deshabilitado** (P0-3)               | Crítico | Sin CF WAF rules activas                     | Configurar 6 reglas WAF en Cloudflare dashboard  | JMG     | **48h**        |
| 2   | **`/api/verify-document` sin ownership** (P0-4)      | Alto    | Cualquier user puede verificar docs de otros | Añadir check `dealer_id === auth.user.dealer_id` | CC      | **48h**        |
| 3   | **Server routes exponen nombres de servicio** (P0-5) | Alto    | 5 endpoints leak info en errores             | Wrap con `safeError()` en las 5 rutas            | CC      | **48h**        |
| 4   | **Google Search Console no verificada**              | Alto    | 0 páginas indexadas                          | JMG verifica ownership en GSC                    | JMG     | **72h**        |
| 5   | **DMARC/SPF/DKIM no configurado**                    | Medio   | Email spoofing posible                       | 3 registros DNS en Cloudflare                    | JMG     | **72h**        |
| 6   | **Sin monitoring de uptime**                         | Medio   | Solo cron infra-metrics cada 5 min           | Configurar UptimeRobot (gratis)                  | JMG     | **72h**        |
| 7   | **Backup restore no testeado**                       | Medio   | Backups activos pero nunca restaurados       | Ejecutar test restore desde B2                   | JMG     | 1 semana       |
| 8   | **Sin seguro de responsabilidad profesional**        | Medio   | Solo RC de Tank Ibérica                      | Evaluar póliza para TradeBase SL                 | JCG     | 2 semanas      |
| 9   | **RAT GDPR en borrador**                             | Medio   | Documento existe pero no es legal            | Validar con abogado especializado                | JMG+EXT | 1 mes          |
| 10  | **Stripe suscripciones no configuradas**             | Medio   | Productos/precios no creados en Stripe       | Crear products + prices en Stripe dashboard      | JMG     | 1 semana       |

**Runbook de seguridad/producción:**

**Si la plataforma cae (Sev1):**

```
1. Verificar status.supabase.com + Cloudflare status
2. Si Supabase down → maintenance page automática (CF custom error page)
3. Si CF Pages down → failover DNS a Vercel (30 min)
4. Si Stripe down → banner "pagos no disponibles" + queue
5. Comunicar: email a dealers activos si >1h caída
6. Post-mortem en STATUS.md cuando se resuelva
```

**Si se detecta breach:**

```
1. Revocar inmediatamente: API keys comprometidas, tokens de sesión
2. Evaluar: ¿qué datos se expusieron? ¿cuántos usuarios?
3. Si PII expuesta: notificar AEPD <72h (Art. 33 GDPR)
4. Si alto riesgo: notificar usuarios afectados (Art. 34 GDPR)
5. Rotar TODOS los secrets (checklist en Apéndice C)
6. Post-mortem + plan de remediación
```

**Si dealer reporta fraude:**

```
1. JCG evalúa la queja (<24h)
2. Si legítima: pausar anuncios del dealer sospechoso
3. Revisar trust score + historial de reportes
4. Si 3+ reportes verificados: bloqueo temporal + revisión manual
5. Si fraude confirmado: bloqueo permanente (requiere unanimidad JMG+JCG)
6. Comunicar al denunciante la resolución
```

### 14.2 Política de datos (GDPR)

- **Puro intermediario:** Tracciona nunca posee, inspecciona ni garantiza bienes
- **Disclaimers** en verificación, subastas e informes DGT
- **RAT** con 13 actividades de tratamiento documentadas
- **44 tablas con PII** identificadas
- **11 subprocesadores** con SCC verificados
- **Medidas Art. 32:** TLS 1.3, AES-256, bcrypt, RLS, WAF, Turnstile, DOMPurify, CSP

### 14.3 Política de retención

Ver §11.4 para períodos de retención por tipo de dato.

### 14.4 Digital Services Act (DSA)

Módulo de transparencia implementado en `/transparencia`. Incluye información sobre:

- Moderación de contenido
- Publicidad y targeting
- Algoritmos de recomendación
- Mecanismos de reclamación

### 14.5 Política de cookies

Gestionada via `useConsent()`:

- **Esenciales:** Siempre activas (auth, sesión)
- **Analytics:** Solo con consentimiento (GA4)
- **Marketing:** Solo con consentimiento (Google Ads pixel)

### 14.6 Convenciones de código

Ver `CONTRIBUTING.md` para reglas completas. Resumen:

- TypeScript strict, no `any`
- Components <500 líneas, server routes <200 líneas
- Mobile-first obligatorio
- i18n en todo texto visible
- RLS en toda tabla nueva
- Conventional commits

### 14.7 Política de auditoría

**Framework de 12 dimensiones:**

1. Seguridad
2. Código y arquitectura
3. Base de datos e integridad
4. Infraestructura y operaciones
5. Rendimiento y UX
6. Negocio y monetización
7. Legal, compliance y regulatorio
8. Documentación y conocimiento
9. Equipo, procesos y gobernanza
10. Estrategia, mercado y competencia
11. Resiliencia y continuidad de negocio
12. Propiedad intelectual y activos digitales

**Puntuación actual:** ~83/100 (auditoría corregida mar-2026).

**Frecuencia:**

- Trimestral: Revisión de pricing de servicios
- Semestral: Test de procedimientos de failover
- Anual: Evaluación de servicios alternativos

---

## S15 — Herramientas y Stack

### 15.1 Herramientas de desarrollo

| Herramienta  | Uso                           |
| ------------ | ----------------------------- |
| Claude Code  | Ingeniero IA principal        |
| VS Code      | Editor de código              |
| GitHub       | Repositorio + CI/CD + Actions |
| npm          | Gestor de paquetes            |
| Supabase CLI | Migraciones, gen types        |
| Git          | Control de versiones          |

### 15.2 Servicios SaaS

| Servicio             | Función                        | Coste mensual | Plan B                       |
| -------------------- | ------------------------------ | ------------- | ---------------------------- |
| Supabase             | BD + Auth + Storage + Realtime | $25/cluster   | PostgreSQL + Auth0           |
| Cloudflare Pages     | Deploy + CDN + DNS             | Free tier     | Vercel / Netlify             |
| Stripe               | Pagos + Suscripciones          | 2.9% + €0.30  | Paddle / LemonSqueezy        |
| Anthropic Claude     | IA (primary)                   | Por uso       | OpenAI (failover automático) |
| OpenAI               | IA (fallback) + traducciones   | Por uso       | Anthropic (primary)          |
| Cloudinary           | Transformación imágenes        | Free tier     | CF Images directo            |
| Resend               | Email transaccional            | Free tier     | SendGrid / Mailgun           |
| Backblaze B2         | Backup storage                 | ~$5/mes       | AWS S3 / Wasabi              |
| Cloudflare Turnstile | CAPTCHA                        | Gratis        | hCaptcha                     |
| Meta WhatsApp        | WhatsApp Business API          | Por mensaje   | Twilio WhatsApp              |
| Google Analytics     | Web analytics                  | Gratis        | Plausible / Umami            |
| Google Fonts         | Tipografía (Inter)             | Gratis        | Self-hosted                  |
| Sentry               | Error monitoring               | Free tier     | —                            |

### 15.3 Failovers automáticos configurados

1. **IA:** Anthropic → OpenAI vía `callAI()` (3 presets de timeout)
2. **Imágenes:** Cloudinary → CF Images vía `IMAGE_PIPELINE_MODE`
3. **Backups:** Multi-tier a Backblaze B2 vía `scripts/backup-multi-tier.sh`
4. **Repositorio:** GitHub → Bitbucket mirror vía `.github/workflows/mirror.yml`

### 15.4 Herramientas del dealer (integradas en dashboard)

| Herramienta      | Ruta                                     | Descripción                        |
| ---------------- | ---------------------------------------- | ---------------------------------- |
| Factura          | /dashboard/herramientas/factura          | Generador de facturas PDF          |
| Contrato         | /dashboard/herramientas/contrato         | Generador de contratos compraventa |
| Presupuesto      | /dashboard/herramientas/presupuesto      | Presupuestos con servicios         |
| Calculadora      | /dashboard/herramientas/calculadora      | ROI, financiación, coste total     |
| Exportar anuncio | /dashboard/herramientas/exportar-anuncio | Cross-platform export              |
| Widget           | /dashboard/herramientas/widget           | Widget embeddable HTML             |
| Export datos     | /dashboard/herramientas/exportar         | CSV/PDF del inventario             |
| Merchandising    | /dashboard/herramientas/merchandising    | Formulario de interés              |
| Alquileres       | /dashboard/herramientas/alquileres       | Gestión de alquileres              |
| Mantenimientos   | /dashboard/herramientas/mantenimientos   | Registro de mantenimiento          |
| Visitas          | /dashboard/herramientas/visitas          | Slots de visita + reservas         |
| API              | /dashboard/herramientas/api              | API key del dealer                 |

### 15.5 Documentación del proyecto

| Documento                                   | Propósito                                   |
| ------------------------------------------- | ------------------------------------------- |
| `CLAUDE.md`                                 | Instrucciones para IA                       |
| `STATUS.md`                                 | Estado actual del proyecto                  |
| `docs/PROYECTO-CONTEXTO.md`                 | Visión y arquitectura (documento maestro)   |
| `docs/ESTRATEGIA-NEGOCIO.md`                | Monetización y GTM                          |
| `docs/IDEAS-A-REVISAR.md`                   | Banco de ideas (92+)                        |
| `docs/tracciona-docs/BACKLOG-EJECUTABLE.md` | Backlog ejecutable (116 items)              |
| `CONTRIBUTING.md`                           | Convenciones de código                      |
| `CHANGELOG.md`                              | Historial de cambios                        |
| `docs/tracciona-docs/referencia/`           | Docs técnicos (ERD, endpoints, crons, etc.) |
| `docs/auditorias/`                          | Auditorías (12 dimensiones)                 |
| `docs/legal/`                               | RAT GDPR (borrador)                         |
| `docs/legacy/`                              | 18 documentos históricos (solo referencia)  |

---

## S16 — Apéndices

### Apéndice A — Esquema de base de datos (92 tablas)

**Core:**
`users`, `profiles`, `dealers`, `vehicles`, `vehicle_images`, `categories`, `subcategories`, `subcategory_categories`, `articles`, `content_translations`, `vertical_config`, `config`, `actions`, `attributes`, `brands`, `locations`, `geo_regions`, `geocoding_cache`

**User engagement:**
`favorites`, `search_alerts`, `search_logs`, `user_vehicle_views`, `vehicle_comparisons`, `comparison_notes`, `comments`, `seller_reviews`, `activity_logs`, `analytics_events`, `consents`

**Messaging:**
`conversations`, `conversation_messages`, `chat_messages`, `contacts`

**Commerce:**
`reservations`, `auctions`, `auction_bids`, `auction_registrations`, `subscriptions`, `invoices`, `payments`, `balance`, `price_history`, `historico`, `transport_requests`, `transport_zones`, `service_requests`

**Credits:**
`credit_packs`, `credit_transactions`, `user_credits`

**Dealer tools:**
`dealer_leads`, `leads`, `dealer_stats`, `dealer_events`, `dealer_fiscal_data`, `dealer_invoices`, `dealer_stripe_accounts`, `dealer_platforms`, `dealer_quotes`, `dealer_contracts`, `pipeline_items`, `maintenance_records`, `rental_records`, `visit_slots`, `visit_bookings`, `merch_orders`, `whatsapp_submissions`

**Verification:**
`verification_documents`

**Advertising:**
`advertisements`, `demands`, `advertisers`, `ads`, `ad_events`, `ad_floor_prices`, `ad_revenue_log`, `user_ad_profiles`

**Content & social:**
`news`, `social_posts`, `active_landings`, `newsletter_subscriptions`

**Email:**
`email_preferences`, `push_subscriptions`, `email_logs`

**Data & market:**
`market_data`, `competitor_vehicles`, `demand_data`, `data_subscriptions`, `api_usage`, `platforms`

**Infrastructure:**
`infra_clusters`, `infra_alerts`, `infra_metrics`, `feature_flags`, `reports`

### Apéndice B — Endpoints API (62)

Ver `docs/tracciona-docs/referencia/INVENTARIO-ENDPOINTS.md` para la tabla completa con método, auth y propósito de cada endpoint.

### Apéndice C — Secrets y rotación

**15 secrets inventariados:**

| Secret                    | Localización              | Rotación |
| ------------------------- | ------------------------- | -------- |
| SUPABASE_SERVICE_ROLE_KEY | .env, CF Pages            | Anual    |
| SUPABASE_URL              | .env, CF Pages            | Nunca    |
| STRIPE_SECRET_KEY         | .env, CF Pages            | Anual    |
| STRIPE_WEBHOOK_SECRET     | .env, CF Pages            | Anual    |
| ANTHROPIC_API_KEY         | .env, CF Pages            | 6 meses  |
| OPENAI_API_KEY            | .env, CF Pages            | 6 meses  |
| CRON_SECRET               | .env, CF Pages, scheduler | Anual    |
| TURNSTILE_SECRET_KEY      | .env, CF Pages            | Anual    |
| WHATSAPP_TOKEN            | .env, CF Pages            | Anual    |
| WHATSAPP_APP_SECRET       | .env, CF Pages            | Anual    |
| RESEND_API_KEY            | .env, CF Pages            | Anual    |
| CLOUDINARY_API_SECRET     | .env, CF Pages            | Anual    |
| CLOUDINARY_API_KEY        | .env, CF Pages            | Anual    |
| BACKBLAZE_APP_KEY         | .env, backup scripts      | Anual    |
| VAPID keys                | .env, CF Pages            | Anual    |

### Apéndice D — Historia del proyecto

**Tank Ibérica (antes de 2026):** Monolito basado en Google Sheets como BD, admin.html (8.860 líneas) + index.html (12.788 líneas) en vanilla JS. 16 Google Sheets como base de datos. Google Drive para almacenamiento de documentos/imágenes.

**Migración a Tracciona (feb 2026):** Migración completa del monolito a Nuxt 3 + Supabase. 64 sesiones de implementación paso a paso. Renombrado de tablas (subcategories→categories, types→subcategories, filter_definitions→attributes). Migración de columnas `_es`/`_en` a JSONB.

**Estado actual (mar 2026):** Plataforma funcional con 4.000+ vehículos, 500+ dealers, 1.200+ transacciones históricas. ~83/100 en auditoría de 12 dimensiones. 80 migraciones, 92 tablas, 62 endpoints, 418 componentes.

### Apéndice E — Acciones pendientes de fundadores

1. Registrar marca TRACCIONA en OEPM (~€150)
2. Comprar dominio tracciona.es (~€10/año)
3. Configurar Cloudflare WAF rate limiting (P0-3)
4. Configurar UptimeRobot para monitorización
5. Verificar páginas legales con abogado
6. Formalizar RAT GDPR como documento legal
7. Verificar banner de cookies
8. Test de restore de backup
9. Lighthouse testing en producción
10. Verificar GA4 en producción
11. Registrar Tank Ibérica como primer dealer
12. Contactar 50 dealers (vídeo WhatsApp 60s)
13. Planificar sprint de trabajo
14. Contratos founding dealers
15. Asesor fiscal UK/ES
16. Seguro de responsabilidad profesional
17. Testing PWA en dispositivos reales
18. Configurar DMARC + SPF + DKIM
19. Actualizar seed credit_packs con nuevos packs
20. Implementar tiers Classic/Premium en Stripe

### Apéndice F — Glosario

| Término             | Definición                                                                            |
| ------------------- | ------------------------------------------------------------------------------------- |
| **TradeBase**       | Marca paraguas del grupo de marketplaces B2B verticales                               |
| **Tracciona**       | Primera vertical (vehículos industriales), tracciona.com                              |
| **Vertical**        | Un marketplace sectorial específico (Tracciona, Municipiante, etc.)                   |
| **Dealer**          | Vendedor profesional con perfil de empresa en la plataforma                           |
| **Founding Dealer** | Uno de los primeros 10 dealers con suscripción gratis de por vida                     |
| **Lead**            | Contacto de un comprador hacia un vendedor                                            |
| **RLS**             | Row Level Security — políticas de seguridad a nivel de fila en PostgreSQL             |
| **SWR**             | Stale-While-Revalidate — patrón de caché que sirve contenido stale mientras actualiza |
| **SSOT**            | Single Source of Truth — fuente de verdad única                                       |
| **Buyer's premium** | Comisión del 8% pagada por el comprador ganador en subastas                           |
| **Mobile-first**    | Diseño base para 360px, desktop es la adaptación                                      |
| **Flywheel**        | Ciclo virtuoso donde cada componente refuerza los demás                               |
| **Lock-in**         | Mecanismo que aumenta el coste de cambio para el dealer                               |
| **Pipeline**        | Flujo visual tipo kanban para gestión de leads                                        |
| **Composable**      | Función reutilizable de Vue 3 que encapsula lógica reactiva                           |
| **Nitro**           | Motor server de Nuxt 3 (compila a Cloudflare Workers)                                 |
| **Edge**            | Ejecución en el CDN, cerca del usuario final                                          |

---

**Fin del Manual Corporativo y Operativo — TradeBase v1.0**

_Documento generado a partir de la documentación completa del proyecto: CLAUDE.md, STATUS.md, PROYECTO-CONTEXTO.md, ESTRATEGIA-NEGOCIO.md, CONTRIBUTING.md, todos los documentos de referencia (ERD, endpoints, crons, seguridad, DR, WAF, retención, API pública, flujos operativos, dependencias, secrets, auditoría), documentos legales (RAT), y 18 documentos legacy históricos._
