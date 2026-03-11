> ⚠️ **[LEGACY]** Documento histórico — solo referencia. No modificar ni usar como fuente de verdad. Ver [docs/README.md](../README.md) para navegación activa.

# CONTEXTO COMPLETO — TRACCIONA / TRADEBASE

> **INSTRUCCIÓN:** Si estás leyendo esto, eres un Claude nuevo. Este documento contiene TODO lo que necesitas saber sobre el proyecto. Léelo entero antes de responder. No hay otro documento que necesites leer primero.

---

## QUIÉN SOY

Soy uno de dos hermanos que heredamos **Tank Ibérica SL** de nuestro padre al jubilarse. Llevamos años en compraventa de vehículos industriales (cisternas, tractoras, semirremolques, rígidos).

- **Mi hermano** opera desde **León, España** — compraventa física, almacén, operaciones de campo.
- **Yo** vivo en **Liverpool, UK** — desarrollo tech, estrategia, viajo a León y Europa regularmente. No planeo volver a España.
- Somos 2 personas. No hay empleados. No hay inversores. No hay equipo técnico. Yo desarrollo todo con **Claude Code**.

**Tank Ibérica SL hoy:**

- Facturación bruta: 500.000€/año
- Gastos fijos: 70.000€/año (incluye nuestros salarios: 2.000€ brutos × 2)
- SL limpia de deudas
- Stock habitual: ~15 unidades (cisternas, tractoras, rígidos, remolques)
- Precio medio venta: 17.000€/unidad
- Compradores: 75% España, 20% África (exportación), 5% Europa
- También hacemos alquiler de cisternas (alimentarias en verano) e intermediación

---

## QUÉ ESTAMOS CONSTRUYENDO

### El producto: Tracciona.com

Un **marketplace B2B vertical** para vehículos industriales de segunda mano. No es un portal de anuncios como Mascus — es una plataforma que acompaña TODA la transacción de principio a fin.

**Funcionalidades clave:**

- **Publicación con IA:** Dealer manda fotos por WhatsApp → Claude Vision extrae datos → listado publicado automáticamente (ES+EN). Coste: 0,05€/listing.
- **Verificación 5 niveles:** ✓ → ✓✓ → ✓✓✓ → ★ → 🛡 — basados en documentación real (ITV, ficha técnica, DGT, certificado fabricante, inspección independiente).
- **Servicios integrados en la ficha:** transporte por góndola, trámites/transferencia, informe DGT, inspección pre-venta, seguros, financiación.
- **Herramientas dealer:** Dashboard con métricas, CRM de leads, facturación, contratos, presupuestos, calculadora alquiler, widget embebible, catálogo exportable, generador de anuncios para RRSS.
- **3 roles:** Comprador, Dealer, Admin.
- **Multiidioma:** 7 idiomas de lanzamiento, arquitectura para N idiomas.
- **SEO agresivo:** Google Merchant Center, landing pages dinámicas por categoría/ubicación, schema Product, IndexNow.

### La visión mayor: TradeBase — grupo de 7 marketplaces B2B

Tracciona es el PRIMER vertical. La plataforma está diseñada desde el código para soportar múltiples verticales (tabla `vertical_config` en BD). Misma infraestructura, diferentes dominios/categorías:

| #   | Vertical                | Mercado                | Por qué en ese orden                         |
| --- | ----------------------- | ---------------------- | -------------------------------------------- |
| 1   | **Tracciona.com**       | Vehículos industriales | Nuestro sector, stock propio                 |
| 2   | **Municipiante.com**    | Maquinaria municipal   | Sinergia con Gesturban, 0 competencia online |
| 3   | **CampoIndustrial.com** | Maquinaria agrícola    | León zona agrícola, volumen alto             |
| 4   | **Horecaria.com**       | Equipam. hostelería    | Mercado enorme (300.000+ bares en España)    |
| 5   | **ReSolar.com**         | Energía renovable      | Potencial internacional, lotes grandes       |
| 6   | **Clinistock.com**      | Equipam. médico        | Requiere partner biomédico                   |
| 7   | **BoxPort.com**         | Contenedores marítimos | Producto estandarizado, bajo valor añadido   |

### Estructura corporativa

- **TradeBase SL** — holding, propietaria de la plataforma tech y dominios
- **Tank Ibérica SL** — compraventa y alquiler (ya operativa, 500K€)
- **IberHaul SL** — logística/transporte por góndola (pendiente de adquisición del primer vehículo)
- **Gesturban** — licitaciones municipales, en partnership con taller con ingeniero mecánico

Red de subcontratistas con márgenes: transportistas (10-15%), gestorías (30-40%), peritos (40-50%), talleres (15-25%). Coste variable, se paga cuando el comprador ya pagó. Flujo de caja positivo por diseño.

---

## MODELO DE NEGOCIO — 16 FUENTES DE INGRESO

### Ingresos seguros (servicios que el comprador NECESITA):

| Fuente                   | Margen/ud | Probabilidad de demanda                         |
| ------------------------ | --------- | ----------------------------------------------- |
| Transporte (góndola)     | 200-400€  | 95% — no hay alternativa si está lejos          |
| Trámites y documentación | 100-180€  | 80% — especialmente compradores internacionales |
| Informe DGT              | 15-20€    | 70% — barrera bajísima para compra de 40K€      |

### Ingresos recurrentes (requieren tracción):

| Fuente                                  | Ingreso                | Prob.                |
| --------------------------------------- | ---------------------- | -------------------- |
| Destacados                              | 30-50€/mes por anuncio | 60%                  |
| Publicidad geo-segmentada               | 50-600€/mes            | 40-50%               |
| Suscripción dealer (Free/Basic/Premium) | 100-300€/mes           | 50-60%               |
| Comisión intermediación                 | 3-5% del precio venta  | 50% (sin escrow 30%) |
| Inspección técnica                      | 150-350€               | 40-50%               |

### Ingresos de escala (mes 12+):

Subastas (buyer premium 5-10%), informes de valoración (50-1.000€), financiación BNPL (comisión 1-2%), escrow (habilita cobro automático de comisión), TI Market Index (gratis, genera autoridad).

**Dato clave:** Una transacción completa de cisterna de 40.000€ genera ~2.650-3.785€ en servicios combinados. Una transacción/mes cubre un año de infraestructura.

**Proyecciones:**

- Mes 1-6: 2.100-7.000€/mes
- Mes 6-12: 7.275-30.750€/mes
- Mes 12-18+: 12.075-42.650€/mes
- (Rangos inferiores = realistas para primer año)

---

## COMPETENCIA

**Mascus** (propiedad de Ritchie Bros, NYSE): 360.000+ listings, 3.2M visitas/mes, 58 países. Pero es un tablón de anuncios caro. No verifican, no gestionan transporte, no hacen inspecciones, no tienen herramientas de dealer reales. Su modelo: "cobra al dealer y déjalo solo."

**Nuestro modelo:** "Acompaña la transacción de principio a fin y gana con cada servicio."

Diferenciadores: verificación 5 niveles, IA para publicación, servicios integrados, herramientas dealer completas, geo-segmentación publicitaria, subastas (fase 2).

---

## ESTRATEGIA DE CAPTACIÓN

1. **Founding Dealers:** 15 dealers gratis Premium × 12 meses → generan catálogo para SEO + casos de éxito.
2. **Tank Ibérica como dealer ancla:** Nuestros 15 vehículos son el catálogo día 1.
3. **SEO:** Google Merchant Center (nadie en el nicho lo usa), landing pages dinámicas, schema Product, IndexNow.
4. **Google Ads:** 300€/mes × 6 meses prueba. CPC bajo en este nicho.

---

## STACK TÉCNICO

| Capa          | Tecnología                                                              |
| ------------- | ----------------------------------------------------------------------- |
| Frontend      | **Nuxt 3** (Vue 3, SSR)                                                 |
| Base de datos | **Supabase** (PostgreSQL + Auth + RLS + Storage)                        |
| Hosting       | **Cloudflare Pages** (edge, gratis)                                     |
| Pagos         | **Stripe** (suscripciones, checkout, Connect para escrow futuro)        |
| Imágenes      | **Cloudinary** → migración a **CF Images** cuando haya volumen          |
| Email         | **Resend** (transaccional)                                              |
| WhatsApp      | **Meta Cloud API** (notificaciones, publicación IA)                     |
| IA            | **Claude** (publicación automática, contenido, soporte)                 |
| Desarrollo    | **Claude Code** con MCP servers (Context7, Sequential Thinking, GitHub) |

### Convenciones NO negociables del código:

1. **Mobile-first** — diseño desde 320px, luego escala
2. **Páginas reales** — cada URL es un archivo en `pages/`, no componentes renderizados por router dinámico
3. **Extensible** — todo pensado para N verticales sin reescribir
4. **TypeScript estricto** — no `any`, no `@ts-ignore`
5. **i18n con useI18n()** — nunca texto hardcodeado en español
6. **RLS obligatorio** — toda tabla con datos de usuario tiene Row Level Security
7. **Auth en server** — toda ruta `/server/api/` verifica sesión
8. **DOMPurify** — todo contenido dinámico se sanitiza
9. **Commits en español** — formato: `feat(módulo): descripción`

**Coste infraestructura primer año:** 900-1.500€ (Supabase Pro 25€/mes + Cloudinary + dominios + email).

---

## ESTADO DEL DESARROLLO

### Documentación maestra

El proyecto tiene un archivo **INSTRUCCIONES-MAESTRAS.md** de 5.719 líneas con 42 sesiones de implementación que Claude Code ejecuta secuencialmente.

### Sesiones ejecutadas (1-35):

Cubren: migración de Tank Ibérica a Tracciona, estructura BD multi-vertical, sistema de auth, dashboard dealer, publicación de vehículos, filtros, búsqueda, favoritos, sistema de notificaciones, email templates (30), WhatsApp API, Stripe suscripciones, sistema de verificación, SEO (sitemaps, schema, meta tags), editorial (/guia/, /noticias/), landing pages dinámicas, publicidad geo-segmentada, subastas, herramientas dealer (7 tools), infraestructura monitorización, auditorías de seguridad (4 externas), remediación.

### Sesiones pendientes (36-42):

| Sesión | Contenido                                                                      |
| ------ | ------------------------------------------------------------------------------ |
| 36     | Gaps residuales: índices BD, auth endpoints, cache CDN, consolidación admin    |
| 37     | Seguridad: Semgrep CE + Snyk + tests + safeError + security.txt + CSP          |
| 38     | Documentación: README, CONTRIBUTING, docs históricos, script estado            |
| 39     | UX: Lighthouse a11y, code-splitting, formularios, Core Web Vitals, PWA         |
| 40     | Monetización: Trial 14d, dunning, métricas MRR, API valoración, widget, leads  |
| 41     | Arquitectura: server/services/, diagrama, umbrales, extensibilidad, rate limit |
| 42     | Testing: 8 user journeys Playwright E2E en CI                                  |

### Puntuación actual (valoración externa): 77/100

- Seguridad: 82 | Modulabilidad: 78 | Escalabilidad: 80
- Monetización: 72 | Arquitectura: 81 | Claridad docs: 70
- UX: 74 | Proyección: 79

### Herramientas Claude Code instaladas:

- **MCP Servers:** Context7 (docs actualizadas), Sequential Thinking (razonamiento profundo), GitHub (PRs automáticas)
- **7 slash commands:** `/project:plan`, `/project:build`, `/project:review`, `/project:debug`, `/project:test`, `/project:session`, `/project:db`
- **3 skills de dominio:** supabase-rls, nuxt-security, tracciona-conventions

---

## NÚMEROS Y PRESUPUESTO

| Concepto                  | Dato                                                                             |
| ------------------------- | -------------------------------------------------------------------------------- |
| Facturación Tank Ibérica  | 500.000€/año bruto                                                               |
| Gastos fijos totales      | 70.000€/año                                                                      |
| Coste marketplace año 1   | 900-5.000€                                                                       |
| Coste desarrollo          | 0€ (Claude Code)                                                                 |
| Empleados                 | 0 (nosotros 2)                                                                   |
| Primera contratación      | Mes 8-10: comercial a comisión                                                   |
| Subvenciones investigadas | 17 CCAA españolas, mejor opción: CyL (residencia real en León) + La Rioja (ADER) |

---

## RIESGOS HONESTOS

1. **Desintermediación** — comprador y vendedor se van por fuera. Mitigación: escrow + servicios integrados.
2. **Gallina y huevo** — sin dealers no hay catálogo, sin catálogo no hay compradores. Mitigación: Founding Dealers + stock propio.
3. **Dependencia de 1 dev** — si me pasa algo, se para. Mitigación: 5.700+ líneas de docs, stack estándar.
4. **Mercado pequeño** — cisternas en España es limitado. Mitigación: multi-vertical desde el diseño.
5. **Mascus reacciona** — poco probable, es gigante lento (NYSE, no van a localizar servicios para España).

---

## HOJA DE RUTA

- **Fase 1 (ahora → mes 6):** Tracciona operativo + Founding Dealers + primeros servicios + SEO
- **Fase 2 (mes 6-12):** Segundo vertical (Municipiante) + suscripciones pago + IberHaul
- **Fase 3 (mes 12-24):** 3-4 verticales + API valoración + subastas + escrow + primer comercial
- **Fase 4 (24+ meses):** 7 verticales, "el Idealista de los B2B industriales", datos como producto

---

## CÓMO AYUDARME

Cuando me ayudes, ten en cuenta:

- **Conozco el sector** — no necesito explicaciones genéricas de marketplaces
- **No tengo equipo técnico** — todo lo implemento yo con Claude Code
- **El dinero es limitado** — priorizo soluciones gratuitas/baratas
- **Opero desde UK** — implicaciones fiscales, horarias, y de residencia
- **Tank Ibérica ya funciona** — el marketplace es inversión adicional, no supervivencia
- **La documentación existe** — INSTRUCCIONES-MAESTRAS.md tiene todo el detalle técnico, no dupliques

Si necesitas más detalle técnico: pídeme que suba INSTRUCCIONES-MAESTRAS.md o BRIEFING-PROYECTO.md.
Si necesitas más detalle de negocio: pregúntame directamente, tengo todas las respuestas.

---

_Última actualización: 24 febrero 2026_


