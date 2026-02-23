# CONTEXTO GLOBAL — LEER PRIMERO

> **Este documento es el punto de entrada obligatorio.** Cualquier IA o persona que trabaje en este proyecto debe leer este archivo ANTES que cualquier otro documento. Proporciona la visión completa del ecosistema empresarial, cómo encajan las piezas, y dónde encontrar cada información.

---

## 1. VISIÓN EN UNA FRASE

Construir el grupo líder de marketplaces B2B verticales en la Península Ibérica y Europa, empezando por vehículos industriales (Tracciona.com) y expandiendo a 6 verticales adicionales con la misma base tecnológica.

---

## 2. ESTRUCTURA EMPRESARIAL

```
                    ┌──────────────────────────┐
                    │    GRUPO TradeBase        │
                    │  (holding futuro)         │
                    └──────────┬───────────────┘
                               │
        ┌──────────┬───────────┼───────────┬──────────┐
        │          │           │           │          │
   Tank Ibérica   Tracciona   IberHaul   Gesturban   Verticales
   SL (existe)    .com        (futuro)   (futuro)    futuros
        │          │           │           │          │
   Compraventa    Marketplace  Transporte  Gestoría   Horecaria
   física de      digital de   de vehículos transferen- CampoIndustrial
   vehículos      vehículos    industriales cias y     Municipiante
   industriales   industriales entre        documentac. ReSolar
                               puntos      vehículos  Clinistock
                                                      BoxPort
```

### Tank Ibérica SL (empresa existente)

- **CIF:** B24724684
- **Facturación:** ~500.000€/año
- **Ubicación:** Onzonilla, León
- **Representante:** Vicente González Martín
- **Operaciones:** Compraventa física de vehículos industriales (cisternas, semirremolques, tractoras), alquiler de cisternas
- **Rol en el ecosistema:** Provee stock inicial para Tracciona, conocimiento profundo del sector, credibilidad ante dealers, infraestructura física (nave, contactos, proveedores)

### Tracciona.com (ESTE PROYECTO — en desarrollo)

- **Qué es:** Marketplace online de vehículos industriales — el "Idealista del transporte"
- **Modelo:** Plataforma de intermediación. Conecta dealers/vendedores con compradores. NO es parte de las transacciones.
- **Stack:** Nuxt 3 + Supabase + Cloudflare Pages + Cloudinary
- **Estado:** Migración en curso desde web monolítica de Tank Ibérica
- **Dominio:** tracciona.com (prefix_except_default: /en/, /fr/, /de/ para idiomas)

### IberHaul (futuro)

- **Qué será:** Servicio de transporte de vehículos industriales entre puntos (góndola, grúa)
- **Integración con Tracciona:** Calculadora de transporte embebida en cada ficha de vehículo (Anexo G-BIS)
- **Modelo:** Subcontratistas (chóferes autónomos con góndola), Tracciona cobra comisión
- **Estado:** No implementado. Tabla `transport_quotes` creada como placeholder.

### Gesturban (futuro)

- **Qué será:** Gestoría online especializada en transferencias de vehículos industriales
- **Integración con Tracciona:** Servicio post-venta ofrecido al comprador tras cada transacción (Anexo L)
- **Modelo:** Precio fijo por transferencia, Tracciona cobra comisión
- **Estado:** No implementado. Documentado en Anexo L.

---

## 3. LOS 7 VERTICALES

Todos comparten la misma base de código (Nuxt 3 + Supabase). Cambiar de vertical = cambiar categorías, subcategorías y atributos en la BD. El código no cambia.

| #   | Vertical            | Dominio previsto    | Sector                    | Estado        |
| --- | ------------------- | ------------------- | ------------------------- | ------------- |
| 1   | **Tracciona**       | tracciona.com       | Vehículos industriales    | En desarrollo |
| 2   | **Horecaria**       | horecaria.com       | Hostelería y restauración | Planeado      |
| 3   | **CampoIndustrial** | campoindustrial.com | Maquinaria agrícola       | Planeado      |
| 4   | **Municipiante**    | municipiante.com    | Vehículos municipales     | Planeado      |
| 5   | **ReSolar**         | resolar.com         | Energía renovable 2ª mano | Planeado      |
| 6   | **Clinistock**      | clinistock.com      | Equipamiento médico       | Planeado      |
| 7   | **BoxPort**         | boxport.com         | Contenedores marítimos    | Planeado      |

**Taxonomía completa:** 46 categorías, 209 subcategorías documentadas en el archivo "Categorías y Subcategorías de Verticales" (Word).

**Orden de lanzamiento:** Tracciona primero (validar modelo), después Horecaria o CampoIndustrial (mayor volumen de mercado).

---

## 4. SINERGIAS ENTRE EMPRESAS

```
Tank Ibérica ──→ Tracciona:
  - Stock inicial de vehículos (credibilidad desde el día 1)
  - Red de contactos de dealers y transportistas
  - Conocimiento de precios, marcas, modelos
  - Infraestructura física para hub de León (Anexo O)

Tracciona ──→ IberHaul:
  - Cada venta genera demanda de transporte
  - Calculadora embebida en fichas (Anexo G-BIS)
  - Leads cualificados: "compré un vehículo, necesito moverlo"

Tracciona ──→ Gesturban:
  - Cada venta genera demanda de transferencia
  - Flujo post-venta automatizado (Anexo L)
  - Cross-sell en el checkout: "¿Necesitas la transferencia?"

IberHaul ──→ Tracciona:
  - Los transportistas son potenciales compradores de vehículos
  - Red de logística para inspecciones físicas de verificación

Todos los verticales ──→ Monetización de datos (Anexo S):
  - Base de datos de precios acumulada = primer índice de referencia del sector
  - Venta de informes a financieras, aseguradoras, fabricantes
```

---

## 5. FUENTES DE INGRESO (16 identificadas)

| #   | Fuente                                            | Tipo                | Desde cuándo    |
| --- | ------------------------------------------------- | ------------------- | --------------- |
| 1   | Listings gratuitos (captación)                    | Freemium            | Día 1           |
| 2   | Listings destacados (pago por visibilidad)        | Transaccional       | Mes 1           |
| 3   | Suscripciones dealer (Gratis→Básico→Premium)      | Recurrente          | Mes 3           |
| 4   | Founding Dealer (early adopters, tarifa especial) | Recurrente          | Pre-lanzamiento |
| 5   | Publicidad directa en plataforma                  | CPM/CPC             | Mes 6           |
| 6   | Google AdSense                                    | CPM                 | Mes 3           |
| 7   | Google Ads (tráfico propio)                       | CPC invertido       | Mes 2           |
| 8   | Comisión por venta (intermediación)               | Transaccional       | Mes 6           |
| 9   | Subastas online (buyer's premium 8%)              | Transaccional       | Mes 9           |
| 10  | Verificación/informes (Km Score, DGT)             | Por uso             | Mes 6           |
| 11  | Calculadora de transporte (comisión IberHaul)     | Transaccional       | Mes 9           |
| 12  | Transferencias (comisión Gesturban)               | Transaccional       | Mes 12          |
| 13  | Merchandising para dealers                        | Margen producto     | Mes 6           |
| 14  | Venta de datos agregados                          | Suscripción/informe | Mes 18          |
| 15  | Widget embebible para webs de dealers             | SaaS                | Mes 12          |
| 16  | API de valoración                                 | Por query           | Mes 18          |

Detalle completo en Anexo D.

---

## 6. MAPA DE DOCUMENTOS

### Documentos técnicos (para implementación)

| Documento                           | Propósito                                                            | Audiencia                   | Actualizado |
| ----------------------------------- | -------------------------------------------------------------------- | --------------------------- | ----------- |
| **tracciona-docs/** (zip modular)   | Cómo construir Tracciona paso a paso. 31 archivos en 5 carpetas.     | Claude Code / desarrollador | ✅ Feb 2026 |
| **claude-code-migration-prompt.md** | Versión monolítica del mismo contenido (5.137 líneas, 22 anexos A-V) | Backup / referencia         | ✅ Feb 2026 |

### Documentos estratégicos (para negocio)

| Documento                           | Propósito                                                                                                  | Audiencia                              | Actualizado                                                  |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------ |
| **tradebase-business-bible** (Word) | Estrategia corporativa completa: visión, estructura, modelo de negocio, mercado, competencia, financiación | Inversores, socios, referencia interna | ⚠️ Actualizar (pre-i18n, pre-anexos T-V)                     |
| **tracciona-plan-operativo** (Word) | Calendario semana a semana (24 semanas), scripts comerciales, KPIs, onboarding dealers                     | Equipo operativo                       | ⚠️ Actualizar (falta i18n, traducción, calendario editorial) |

### Presentaciones

| Documento                    | Propósito                                                           | Audiencia                   | Actualizado                  |
| ---------------------------- | ------------------------------------------------------------------- | --------------------------- | ---------------------------- |
| **pitch-inversores-v2.html** | Deck de 11 slides para inversores                                   | Inversores, business angels | ⚠️ Revisar costes traducción |
| **pitch-dealers.html**       | Propuesta para concesionarios (tema oscuro, herramientas gratuitas) | Dealers, concesionarios     | ✅ Feb 2026                  |

### Transcripts (contexto histórico)

| Fecha     | Temas clave                                                                         |
| --------- | ----------------------------------------------------------------------------------- |
| 10 Feb    | Auditoría SEO Tank Ibérica, análisis competidores, keywords research                |
| 10 Feb    | Estrategia B2B, pitch inversores, análisis competitivo                              |
| 12 Feb    | Niveles de verificación, documentos por vehículo, costes IA                         |
| 13-14 Feb | Estructura corporativa, Business Bible, financiación 500K€                          |
| 16 Feb    | Plan operativo, staffing, costes año 1, automatización                              |
| 16 Feb    | Herramientas dealer, seguridad stack, subastas, hub León                            |
| 17 Feb    | Arquitectura URL, landings SEO dinámicas, anti-canibalización                       |
| 17 Feb    | Costes legales, GDPR, review código Nuxt/Supabase                                   |
| 18 Feb    | i18n escalable, traducción automática, calendario editorial, publicación programada |

---

## 7. SISTEMAS CLAVE (resumen ejecutivo)

### Sistema de internacionalización (Anexo T)

- Campos cortos (nombres, labels) → JSONB en la tabla
- Campos largos (descripciones) → tabla `content_translations` separada
- Añadir idioma = crear JSON de UI + empezar a traducir contenido. Cero ALTER TABLE.
- Traducción automática: GPT-4o mini Batch API (~0,001€/ficha)
- Fase lanzamiento: traducciones con Claude Max (0€)
- Preparado para francés, alemán, holandés, polaco, italiano + cualquier idioma futuro

### Sistema de contenido editorial (Anexos P + U)

- 2 secciones: /guia/[slug] (evergreen) + /noticias/[slug] (temporal con valor SEO). Sin /comunicacion/
- Artículos generados con Claude Max (0€), traducidos con GPT-4o mini
- Publicación programada: status scheduled → cron auto-publish
- Contenido por mercado: artículos universales, localizados (legislación), regionales (ferias)
- Calendario web: martes y jueves 09:00 CET
- Calendario redes: lunes-viernes (LinkedIn 3-5/semana, Instagram 2-3/semana)
- SEO Score Potenciador: 15+ checks automáticos antes de publicar

### Sistema de dealers (Anexos K + V)

- Tabla `dealers` con perfil, logo, suscripción, stats
- 4 niveles: Free → Básico → Premium → Founding (gratis para siempre, 10 plazas por vertical). Precios definitivos en Anexo K.3 y vertical_config (Anexo W.2)
- Cada vehículo tiene `dealer_id` desde el día uno
- Dashboard del dealer: gestión de stock, leads, estadísticas, facturación
- Merchandising: tarjetas, imanes, banners con QR del dealer

### Sistema de subastas (Anexo H)

- Online con anti-sniping (3 min extensión automática)
- Buyer's premium 8%, depósito previo obligatorio
- Tablas placeholder creadas: `auctions`, `auction_bids`, `auction_registrations`

### Sistema de verificación (Anexo G)

- 4 niveles: Nivel 0 (sin verificar) → Nivel 3 (inspección física completa)
- Informes DGT, Km Score (indicador estadístico de manipulación de km)
- Tabla placeholder: `verification_reports`

---

## 8. EQUIPO Y RECURSOS

| Rol                             | Persona                    | Desde cuándo           |
| ------------------------------- | -------------------------- | ---------------------- |
| Fundador / Producto / Comercial | Tú                         | Ahora                  |
| Operaciones León                | Hermano                    | Ahora                  |
| Desarrollo                      | Claude Code (IA)           | Ahora                  |
| Comercial a comisión            | Por contratar              | Mes 6-10               |
| Admin media jornada             | Por contratar              | Mes 12-18              |
| Chófer                          | Subcontratado por servicio | Cuando haya transporte |

**Costes primer año del marketplace:**

- Mínimo: ~900€ (solo infraestructura)
- Recomendado: ~2.500-3.000€ (+ Google Ads prueba)
- Cómodo: ~4.000-5.000€ (+ constitución SL nueva)

---

## 8b. SESIONES DE IMPLEMENTACIÓN (35 sesiones en INSTRUCCIONES-MAESTRAS.md)

### Pre-lanzamiento (sesiones 1-12)

| Sesión | Qué hace                                                                                    |
| ------ | ------------------------------------------------------------------------------------------- |
| 1      | Backup (ya completado)                                                                      |
| 2      | Migración SQL completa: renombrar tablas + JSONB i18n + 27 tablas nuevas + geo_regions seed |
| 3      | Actualizar frontend (composables, nombres de tabla, localizedField)                         |
| 4      | Landing pages SEO dinámicas                                                                 |
| 5      | Routing + rutas editoriales /guia/ y /noticias/                                             |
| 6      | Verificación de la migración                                                                |
| 7-8    | Mejoras pre-lanzamiento (seguridad, SEO, cache, schema, sitemap, disclaimers)               |
| 9      | Panel admin: configuración de vertical (10 secciones)                                       |
| 10     | Portal dealer personalizable                                                                |
| 11     | Sistema editorial + SEO Score Potenciador                                                   |
| 12     | Sistema de traducción (dashboard + batch)                                                   |

### Post-lanzamiento (sesiones 13-32)

| Sesión | Qué hace                                                                                  |
| ------ | ----------------------------------------------------------------------------------------- |
| 13     | Deuda técnica diferida                                                                    |
| 14     | Dealer Toolkit básico + suscripciones                                                     |
| 15     | Verificación vehículos: API DGT, Km Score, Claude Vision, inspecciones                    |
| 16     | Subastas online (anti-sniping, depósitos Stripe, buyer's premium 8%)                      |
| 16b    | Publicidad geolocalizada (10 posiciones, geo multinivel) + AdSense + Pro 24h + Google Ads |
| 16c    | Transporte, flujo post-venta, frescura del catálogo                                       |
| 16d    | Scraping de competidores + auto-publicación redes sociales                                |
| 17     | Stripe (suscripciones, Stripe Connect, webhooks)                                          |
| 18     | 30 emails automáticos + alertas de búsqueda                                               |
| 19     | Seguridad de producción (Cloudflare WAF, Sentry, CAPTCHA, rate limiting)                  |
| 20     | Testing (unit + E2E + Lighthouse CI)                                                      |
| 21     | WhatsApp publishing con IA                                                                |
| 22     | PWA + Performance                                                                         |
| 23     | Clonar vertical nueva (proceso repetible)                                                 |
| 24     | Zona de usuario: registro, login, perfil, roles, CRM dealer, import Excel                 |
| 25     | Compliance regulatorio (DSA, DAC7, AI Act, UK Online Safety Act)                          |
| 26     | Facturación con Quaderno                                                                  |
| 27     | Dashboard de métricas y KPIs                                                              |
| 28     | CRM dealers + onboarding guiado + health score                                            |
| 29     | Favoritos y búsquedas guardadas                                                           |
| 30     | Resiliencia y plan B técnico                                                              |
| 31     | Herramientas avanzadas dealer (facturas, contratos, presupuestos, widget, merchandising)  |
| 32     | Comercialización de datos (estilo Idealista: índice de precios, API, informes)            |
| 33     | Monitorización infra, pipeline imágenes híbrido, migración clusters                       |
| 34     | Auditoría de seguridad: remediación completa (críticos + altos + medios + bajos)          |

---

## 9. ORDEN DE LECTURA PARA UNA IA

```
0. CLAUDE.md (raíz del proyecto)                       → Prompt permanente de Claude Code: reglas, convenciones, stack
1. ESTE DOCUMENTO (contexto-global.md)                 → Entender la visión completa
2. tracciona-docs/INSTRUCCIONES-MAESTRAS.md            → Las 35 sesiones de ejecución paso a paso (DOCUMENTO PRINCIPAL)
3. tracciona-docs/README.md                            → Estructura técnica y tabla de anexos
4. tracciona-docs/migracion/01-pasos-0-6.md            → Detalle de la migración SQL + frontend (sesiones 1-8)
5. Anexos según necesidad (INSTRUCCIONES-MAESTRAS indica cuál por sesión)
6. referencia/addendum-business-bible.md               → Contexto de negocio actualizado
7. referencia/addendum-plan-operativo.md               → Contexto operativo actualizado
```

---

## 10. MAPA DE SESIONES (35 sesiones)

### Pre-lanzamiento (sesiones 1-12)

| #   | Sesión                | Qué hace                                                                   |
| --- | --------------------- | -------------------------------------------------------------------------- |
| 1   | Backup                | Ya completado (carpeta Tracciona = copia de Tank Ibérica)                  |
| 2   | Migración SQL         | Renombrar tablas + i18n JSONB + 27 tablas nuevas + geo_regions + RLS       |
| 3   | Frontend              | Actualizar componentes a nuevos nombres + useLocalized + useVerticalConfig |
| 4   | Landings SEO          | active_landings + landings dinámicas por categoría/marca                   |
| 5   | Routing               | Rutas multi-vertical + /comunicacion/                                      |
| 6   | Verificación          | Checklist completo pre-lanzamiento                                         |
| 7-8 | Mejoras pre-launch    | 20 mejoras (seguridad, SEO, cache, schema, disclaimers)                    |
| 9   | Admin config          | Panel admin 10 secciones (vertical_config)                                 |
| 10  | Portal dealer         | Tema dealer personalizable + useDealerTheme                                |
| 11  | Editorial + SEO Score | Editor artículos + SEO Score Potenciador 15+ checks + cron auto-publish    |
| 12  | Traducción            | Dashboard traducciones + botón "Traducir todo" + fallback chain            |

### Post-lanzamiento (sesiones 13-32)

| #   | Sesión                  | Qué hace                                                                                          |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| 13  | Deuda técnica           | Nominatim fallback, refactor stores, 5 ítems                                                      |
| 14  | Dealer Toolkit básico   | Homepage dealer, QR, tarjetas PDF, suscripciones                                                  |
| 15  | Verificación            | API DGT/InfoCar, Km Score, Claude Vision auto-verify, inspecciones                                |
| 16  | Subastas                | Online con anti-sniping, depósitos Stripe, buyer's premium 8%                                     |
| 16b | Publicidad + Pro        | 10 posiciones ad, geo multinivel, AdSense fallback, sistema Pro 24h, Google Ads                   |
| 16c | Transporte + post-venta | Calculadora transporte, flujo post-venta, frescura catálogo                                       |
| 16d | Automatización          | Scraping competidores, auto-publicación redes sociales                                            |
| 17  | Stripe                  | Suscripciones, webhooks, Stripe Connect 3-5%                                                      |
| 18  | Emails                  | 30 templates, alertas búsqueda, preferencias usuario                                              |
| 19  | Seguridad               | Cloudflare WAF, Sentry, CAPTCHA, rate limiting, CSP                                               |
| 20  | Testing                 | Unit + E2E (Playwright) + Lighthouse CI                                                           |
| 21  | WhatsApp                | WhatsApp Business API → Claude Vision → ficha auto                                                |
| 22  | PWA                     | Service worker, manifest, push notifications, Core Web Vitals                                     |
| 23  | Clonar vertical         | Script para lanzar nuevo vertical en 2-4h                                                         |
| 24  | Zona usuario            | Auth, perfil comprador, zona dealer, CRM leads, useSubscription                                   |
| 25  | Compliance              | DSA, DAC7, AI Act, UK Online Safety Act, RGPD reforzado                                           |
| 26  | Facturación             | Quaderno + facturas automáticas + OSS                                                             |
| 27  | Dashboard métricas      | MRR, ARR, conversión, churn, top dealers                                                          |
| 28  | CRM dealers             | Onboarding wizard, health score, reactivación automática                                          |
| 29  | Favoritos               | Favoritos, búsquedas guardadas, alertas precio                                                    |
| 30  | Resiliencia             | Backup semanal, plan migración Supabase→PostgreSQL, plan B                                        |
| 31  | Herramientas dealer     | Facturas, contratos, presupuestos, calculadora, widget, merchandising                             |
| 32  | Datos                   | Vistas materializadas, índice precios, informes, API valoración                                   |
| 33  | Infraestructura         | Monitorización de componentes, pipeline híbrido Cloudinary→CF Images, migración clusters Supabase |
| 34  | Seguridad               | Remediación auditoría: auth Stripe, firmas webhooks, CSRF, fallo cerrado, rate limit WAF          |

---

_Documento creado: 18 de febrero de 2026_
_Última actualización: 18 de febrero de 2026_
