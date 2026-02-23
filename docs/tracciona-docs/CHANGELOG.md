# CHANGELOG — Decisiones del Proyecto Tracciona / TradeBase

> **Propósito:** Registro cronológico de todas las decisiones tomadas que afectan al producto, la tecnología, o la estrategia. Cualquier IA o persona nueva puede leer este archivo para entender POR QUÉ se tomó cada decisión.

---

## 10 de febrero de 2026 — Sesión 1

### Auditoría SEO + Estrategia inicial

**DECISIÓN:** Migrar Tank Ibérica de web monolítica a marketplace multi-vertical

- **Contexto:** Tank Ibérica tiene web propia con ~200 URLs indexadas, 500K€/año facturación física
- **Alternativa descartada:** Mejorar la web existente (limitada, monolítica, sin escalabilidad)
- **Rationale:** El mercado de vehículos industriales online está dominado por plataformas obsoletas (Mascus, Europa-Camiones, Autoline). Hay ventana de oportunidad.

**DECISIÓN:** Nuxt 3 + Supabase como stack

- **Alternativas descartadas:** WordPress + WooCommerce (limitado), React + backend custom (más trabajo), Laravel (monolítico)
- **Rationale:** SSR para SEO, Supabase para RLS + realtime + auth + edge functions gratis, Cloudflare Pages gratis, Cloudinary con tier gratuito generoso

**DECISIÓN:** Nombre "Tracciona.com" para el vertical de vehículos industriales

- **Alternativas descartadas:** Tank Ibérica Marketplace, VehiculosIndustriales.com
- **Rationale:** Marca propia desvinculada de Tank Ibérica permite escalar sin conflicto de identidad

---

## 12 de febrero de 2026 — Sesión 2

### Sistema de verificación + Documentos

**DECISIÓN:** 4 niveles de verificación (0-3) en vez de binario verificado/no-verificado

- **Rationale:** Permite monetizar por capas. Nivel 0 = gratis (cualquiera publica). Nivel 3 = inspección física (~150€). Los compradores ven exactamente qué está verificado.

**DECISIÓN:** Km Score como indicador estadístico (no afirmación legal)

- **Rationale:** No podemos afirmar legalmente que los km están manipulados, pero sí que "estadísticamente, un vehículo de este tipo con estas características suele tener entre X y Y km". Evita responsabilidad legal.

---

## 13-14 de febrero de 2026 — Sesión 3

### Business Bible + Estructura corporativa

**DECISIÓN:** Estructura de holding futuro (TradeBase) con SLs por vertical

- **Rationale:** Aísla riesgo legal. Si un vertical tiene problemas, no arrastra a los demás. Tank Ibérica queda como empresa operativa independiente.

**DECISIÓN:** 7 verticales confirmados con taxonomía completa

- **Rationale:** Los 7 comparten la misma base de código. Cambiar vertical = cambiar categorías en BD. 46 categorías × 209 subcategorías documentadas.

**DECISIÓN:** IberHaul y Gesturban como empresas/servicios satélite

- **Rationale:** Cada venta en Tracciona genera demanda de transporte (IberHaul) y transferencia (Gesturban). Cross-sell natural con márgenes altos.

---

## 16 de febrero de 2026 — Sesión 4

### Plan Operativo + Costes

**DECISIÓN:** Lanzamiento con 2 personas (fundador + operaciones)

- **Alternativa descartada:** Contratar comercial desde el día 1
- **Rationale:** Validar modelo antes de gastar en salarios. Primer comercial a comisión en mes 6-10 si hay tracción.

**DECISIÓN:** OPEX primer año: 900-5.000€ (toda la tecnología gratis o casi)

- **Rationale:** Supabase free tier, Cloudflare free, Cloudinary free tier, Claude Max suscripción ya existente. Los costes son dominio + Google Ads de prueba + posible SL nueva.

**DECISIÓN:** Founding Dealer program (premium gratis para siempre para los primeros 10-20)

- **Rationale:** Resolver chicken-and-egg: sin vehículos no hay compradores, sin compradores no vienen dealers. Los founding dealers llenan el catálogo a cambio de trato VIP permanente.

**DECISIÓN:** Subastas presenciales en hub de León además de online

- **Rationale:** El sector industrial es presencial. La subasta física genera confianza, el online amplía audiencia. Modelo híbrido.

---

## 17 de febrero de 2026 — Sesión 5

### Arquitectura URL + SEO + Legal

**DECISIÓN:** Estructura de URLs con landings dinámicas generadas desde BD

- **Formato:** `/vehiculo/[slug]`, `/cisternas`, `/cisternas-alimentarias`, `/cisternas-alimentarias-indox` (flat, decisión SEO 17 Feb)
- **Rationale:** Cada combinación de categoría/subcategoría/marca genera una landing indexable. Anti-canibalización: solo se genera landing si hay ≥3 vehículos con esa combinación.

**DECISIÓN:** Disclaimers de intermediación en toda la web

- **Rationale:** Tracciona NO es parte de las transacciones. Es un intermediario. Debe quedar claro legalmente para evitar responsabilidad sobre el estado de los vehículos.

**DECISIÓN:** RGPD y cookies desde el día 1

- **Rationale:** Obligatorio por ley. Setup coste-0 con banner de cookies propio y páginas legales con texto generado.

**DECISIÓN:** Costes legales SL nueva: ~3.000€

- **Alternativa:** Operar bajo Tank Ibérica inicialmente y crear SL cuando haya ingresos
- **Rationale:** Ambas opciones válidas. La SL nueva es más limpia pero no urgente.

---

## 17 de febrero de 2026 — Sesión 6

### Contenido editorial + Merchandising + Legal + Datos

**DECISIÓN:** 4 Nuevos Anexos (P, Q, R, S)

- **P:** Contenido editorial en 4 secciones (guías, noticias, normativa, comparativas) bajo `/comunicacion/`
- **Q:** Merchandising para dealers (imprenta partner, comisiones sobre productos)
- **R:** Marco legal detallado (disclaimers, RGPD, clausulas tipo)
- **S:** Monetización de datos (índice de precios, informes, API de valoración)

---

## 18 de febrero de 2026 — Sesión 7

### i18n + Traducción + Calendario editorial + Publicación programada

**DECISIÓN CRÍTICA:** No abstraer la plataforma genéricamente. Enfocarse en Tracciona como primer vertical.

- **Alternativa descartada:** Crear un framework genérico multi-vertical desde el principio
- **Rationale:** La arquitectura ya es genérica por diseño (categorías en BD, filtros dinámicos). Abstraer más sin datos reales de un segundo vertical = ingeniería prematura. Clonar para el segundo vertical cuando exista aprendizaje real.

**DECISIÓN CRÍTICA:** Cambiar sistema de idiomas de columnas `_es`/`_en` a JSONB + tabla separada

- **Contexto:** El sistema tenía `name_es`, `name_en`, `description_es`, `description_en` hardcodeados en todas las tablas
- **Alternativa descartada:** Seguir añadiendo columnas `_fr`, `_de` etc.
- **Rationale:** Añadir francés con el sistema antiguo = ALTER TABLE en 5+ tablas con datos en producción. Con 2M productos (Horecaria) sería semanas de trabajo. Cambiar ahora con 500 fichas y 200 URLs indexadas es trivial.
- **Solución:** Campos cortos → JSONB. Campos largos (>200 chars) → tabla `content_translations` separada. Fallback chain: idioma pedido → inglés → español → cualquiera.

**DECISIÓN:** Subdirectorios (`/fr/`, `/de/`) en vez de dominios locales (`.fr`, `.de`)

- **Alternativas descartadas:** ccTLDs (.fr, .de), subdominios (fr.tracciona.com)
- **Rationale:** `.com` es estándar B2B industrial (Mascus, MachineryZone, Alibaba usan .com). Un deploy, un Supabase, un sitemap. Hreflang gestiona la geolocalización. Los ccTLDs importan más en B2C.

**DECISIÓN:** GPT-4o mini Batch API como motor de traducción para producción

- **Alternativas evaluadas con costes reales:**
  - LibreTranslate (self-hosted): 0€ pero calidad baja
  - DeepL API: Excelente calidad pero 24.000€/1M fichas
  - Claude Sonnet: Ganó WMT24 (9/11 pares de idiomas) pero 15.750€/1M fichas
  - Claude Haiku: Buen balance pero 5.250€/1M fichas
  - GPT-4o: 10.500€/1M fichas
  - **GPT-4o mini Batch API: 790€/1M fichas, calidad suficiente para texto técnico repetitivo**
- **Rationale:** Las fichas de vehículos son texto técnico ("Cisterna alimentaria Indox 25.000L, AISI 316, 3 ejes"). No necesitan la sutileza literaria de Claude Sonnet. GPT-4o mini es 30× más barato que DeepL con calidad aceptable para este caso de uso.
- **Excepción:** Artículos editoriales se generan con Claude Max (suscripción ya pagada, 0€ marginal) porque necesitan mejor tono y estructura SEO.

**DECISIÓN:** i18n strategy cambia de `no_prefix` a `prefix_except_default`

- **Antes:** Solo español e inglés, sin prefijo para ninguno
- **Después:** Español sin prefijo (default), `/en/`, `/fr/`, `/de/`, `/nl/`, `/pl/`, `/it/`
- **Rationale:** Necesario para que Google entienda las versiones en cada idioma. Hreflang apunta a la versión correcta.

**DECISIÓN:** Traducción en 3 fases según escala del negocio

- **Fase lanzamiento (0-6 meses):** Admin ejecuta traducciones con Claude Code/Max manualmente. Coste: 0€.
- **Fase crecimiento (6-12 meses):** Script Python en PC del admin, programado cada 3 horas. Llama a GPT-4o mini API. Coste: céntimos/día.
- **Fase escala (12+ meses):** Supabase Edge Function con trigger automático. Vehículo nuevo → traducido en 30-60 segundos. Coste: ~0,001€/ficha.

**DECISIÓN:** Publicación programada con cron auto-publish

- **Alternativa descartada:** Publicar manualmente
- **Rationale:** Google premia la constancia. 2 artículos/semana durante 12 meses >> 50 artículos en enero y luego silencio. El sistema permite preparar el contenido el domingo y que se publique solo durante la semana.

**DECISIÓN:** Calendario editorial: martes y jueves 09:00 CET para web

- **Basado en:** Datos de engagement B2B de Sprout Social, Hootsuite, LinkedIn 2024-2025
- **Rationale:** Martes-miércoles-jueves son los días de mayor engagement B2B. 9-11 AM es el pico de lectura. CET cubre España, Francia, Alemania, Italia, Benelux y Polonia simultáneamente.

**DECISIÓN:** Calendario redes: LinkedIn 3-5/semana, Instagram 2-3/semana

- **Regla:** Máximo 1 post/día en LinkedIn (el algoritmo penaliza más)
- **Rationale:** LinkedIn es la red B2B principal. Instagram para visual (fotos de vehículos, ferias). Facebook replica lo de LinkedIn. Twitter/TikTok opcionales y baja prioridad para industrial B2B.

**DECISIÓN:** SEO Score Potenciador ampliado a 15+ checks

- **Contexto:** Ya existía un `useSeoScore.ts` básico (título, meta, H1)
- **Añadido:** Keyword en URL, en H2, longitud de contenido, internal links al catálogo, FAQ schema, imagen de portada, excerpt, categorías relacionadas, traducciones, scheduling, textos de redes
- **Rationale:** El admin no es un experto SEO. El score le dice exactamente qué falta antes de publicar.

**DECISIÓN:** Tablas placeholder de Capa 2 — crear ahora, sin frontend

- **Tablas:** dealers, auctions, auction_bids, auction_registrations, verification_reports, ad_slots, ad_events, transport_quotes
- **Rationale:** ALTER TABLE sobre millones de filas en producción es peligroso. Crear las tablas vacías ahora cuesta 0 en rendimiento y evita problemas futuros. La columna `dealer_id` en vehicles existe desde el día uno (nullable).

**DECISIÓN:** Contenido por mercado con `target_markets`

- **Tipos:** Universal (se traduce a todos), localizado (artículos distintos por país), regional (solo ciertos mercados)
- **Rationale:** "Normativa ITV en España" NO es una traducción de "Contrôle technique en France". Son artículos completamente diferentes. El campo `target_markets TEXT[]` en articles gestiona esta distinción.

**DECISIÓN:** Flujo dominical como rutina operativa

- **Qué es:** Cada domingo, 1-2 horas con Claude Max para generar y programar todo el contenido de la semana
- **Rationale:** Concentrar esfuerzo creativo en un bloque. El resto de la semana, el sistema publica solo. Máxima eficiencia para 1-2 personas.

**DECISIÓN:** Panel de configuración completo editable desde UI (Anexo W)

- **Contexto:** Cambiar logo, colores, categorías, idiomas activos, precios requería tocar código o BD directamente
- **Alternativa descartada:** Mantener configuración en archivos de código y variables de entorno
- **Rationale:** "Cero VS Code para operar." Si clonar una vertical nueva requiere abrir un editor de código, no escala. Con el panel de admin, clonar Horecaria = INSERT en vertical_config + 2-4 horas configurando desde el navegador. Cero código.
- **Solución:** Tabla `vertical_config` con toda la configuración de la vertical (identidad, colores, header, footer, homepage, idiomas, categorías, atributos, precios, emails, banners, integraciones). Campos de tema en `dealers` para personalización del portal. 10 secciones de UI de admin. Activity logs para auditoría.
- **Beneficio para dealers:** Cada dealer personaliza su "mini-web" dentro de Tracciona: logo, colores de acento, bio, contacto, certificaciones, vehículos fijados, CTA personalizado, respuesta automática a leads.
- **Beneficio para verticales nuevos:** Clonar = INSERT + configurar desde UI. No tocar código. El mismo deploy sirve para N verticales cambiando la variable VERTICAL.

---

## Documentos generados/actualizados en esta sesión

| Documento                       | Acción                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| claude-code-migration-prompt.md | Actualizado: actions usa JSONB, articles con i18n+scheduling, 4 nuevos anexos T/U/V/W |
| tracciona-docs.zip              | Regenerado: 31 archivos, README actualizado                                           |
| contexto-global.md              | **NUEVO** — Documento puente para cualquier IA                                        |
| addendum-business-bible.md      | **NUEVO** — Actualización de la Business Bible                                        |
| addendum-plan-operativo.md      | **NUEVO** — Tareas i18n + editorial + calendario                                      |
| pitch-inversores-v3.html        | Actualizado: i18n, multilingüe, contenido editorial, costes traducción                |
| pitch-dealers-v2.html           | Actualizado: bilingüe → 7 idiomas                                                     |
| CHANGELOG.md                    | **NUEVO** — Este archivo                                                              |

---

---

## 18 de febrero de 2026 — Sesión 8 (continuación)

### Expansión de sesiones 17→35

**DECISIÓN:** Ampliar de 17 a 35 sesiones para cubrir producción real

- **Contexto:** Las sesiones originales 1-17 cubrían la migración y MVP pero dejaban fuera Stripe, emails, seguridad, testing, PWA, compliance regulatorio y comercialización de datos.
- **Rationale:** Mejor documentar todo ahora que perder contexto luego. Cada sesión es independiente y ejecutable.

### 2-Year Strategic Audit (sesiones 25-32)

**DECISIÓN:** Auditoría de gaps identificando 6 áreas críticas no cubiertas

- DSA/DAC7/AI Act/UK compliance (sesión 25)
- Facturación con Quaderno (sesión 26)
- Dashboard de métricas (sesión 27)
- CRM dealer con onboarding guiado (sesión 28)
- Favoritos y búsquedas guardadas (sesión 29)
- Resiliencia y plan B técnico (sesión 30)

### Sesión 16b reescrita — Sistema de publicidad completo

**DECISIÓN:** Sistema de publicidad geolocalizada multinivel

- **Modelo:** 10 posiciones de anuncio, segmentadas por país → región → provincia
- **Tabla `geo_regions`:** Escala a cualquier país europeo con solo INSERT de datos, cero código
- **Precios:** 50-500€/mes según posición y geo
- **AdSense como fallback:** Si no hay anuncio directo, mostrar AdSense
- **Pro Teaser:** Posición 1 muestra count REAL de vehículos ocultos en 24h que matchean filtros

### 5 reglas obligatorias de ejecución añadidas

**DECISIÓN:** Añadir 5 reglas para Claude Code en INSTRUCCIONES-MAESTRAS.md

1. LEE ANTES DE ESCRIBIR
2. NO IMPROVISES — PREGUNTA
3. MOBILE-FIRST + MULTILANGUAGE ($t() + localizedField)
4. VERIFICAR ANTES DE CADA ACCIÓN
5. HERRAMIENTAS EXTERNAS (filesystem + terminal sí, dashboards no)

### Arquitectura N idiomas

**DECISIÓN:** Los 7 idiomas (ES, EN, FR, DE, NL, PL, IT) son lanzamiento, no techo

- **Rationale:** La arquitectura JSONB + content_translations + @nuxtjs/i18n soporta N idiomas sin cambios de código
- **Expansión:** Añadir un idioma = 1 línea en nuxt.config + locales/XX.json + batch traducción
- **Candidatos:** PT, RO, TR, CS, SV
- **Actualizado en:** addendum-business-bible.md, addendum-plan-operativo.md

### Auditoría de documentación — 14 incidencias detectadas y corregidas

**DECISIÓN:** Corregir 5 inconsistencias críticas, 4 gaps, 5 mejoras

- IC-3: dealers.description_es/\_en → description JSONB (Anexo K)
- IC-4: subscriptions unificada (definición canónica = Anexo E.2 + stripe_customer_id)
- GAP-1: esquema-bd.md encontrado en docs/ (ruta corregida en sesión 2)
- GAP-2: Seed completo geo_regions España creado (seeds/geo_regions_spain.sql)
- GAP-3: CLAUDE.md referenciado en orden de lectura
- GAP-4: CREATE TABLE articles referenciado explícitamente a Anexo P.5
- MR-1: contexto-global.md actualizado con tabla de 35 sesiones
- MR-5: Anexo Y creado (mapa de 15+ composables con dependencias)
- IC-1, IC-2, IC-5: pendientes de decisión del usuario

### Documentos generados/actualizados

| Documento                   | Acción                                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| pitch-inversores.html       | **NUEVO** — Rediseño editorial, Instrument Serif, 9 slides                                               |
| pitch-dealers.html          | **NUEVO** — Dark futuristic, 8 herramientas gratis                                                       |
| pitch-compradores.html      | **NUEVO** — Warm earthy, trust-focused, 4 niveles verificación                                           |
| pitch-anunciantes.html      | **NUEVO** — Corporate blue, 10 posiciones, geo multinivel                                                |
| addendum-business-bible.md  | Actualizado: N idiomas, costes por idioma nuevo                                                          |
| addendum-plan-operativo.md  | Actualizado: candidatos expansión, KPI idiomas ≥7                                                        |
| K-dealer-toolkit.md         | Corregido: description JSONB                                                                             |
| E-sistema-pro.md            | Actualizado: stripe_customer_id en subscriptions                                                         |
| INSTRUCCIONES-MAESTRAS.md   | Corregido: sesión 17 no recrea subscriptions, ruta esquema-bd, articles referencia P.5, geo_regions seed |
| contexto-global.md          | Actualizado: 35 sesiones, CLAUDE.md en orden lectura, precios flexibles                                  |
| seeds/geo_regions_spain.sql | **NUEVO** — 70 registros (1 país + 17 CCAA + 52 provincias)                                              |
| Y-mapa-composables.md       | **NUEVO** — 15+ composables con dependencias                                                             |
| auditoria-documentacion.md  | **NUEVO** — Informe completo de auditoría                                                                |

---

## 18 de febrero de 2026 — Sesión 12 (Auditoría en profundidad + correcciones)

### Auditoría completa cruzando ~30 archivos

**DECISIÓN:** Verticales 5-7 definitivos: ReSolar, Clinistock, BoxPort (del Anexo A)

- contexto-global.md e INSTRUCCIONES-MAESTRAS.md tenían nombres obsoletos (MaquinariaYa, EquipoMédico, AlmacénPro)
- Corregido en ambos documentos para alinear con Anexo A/C

**DECISIÓN:** Precios dealer definitivos: 29€/mes Básico, 79€/mes Premium

- Anexo K tenía precios obsoletos (100€/250€)
- Corregido Anexo K y Anexo D para alinear con vertical_config (Anexo W)

**DECISIÓN:** Ruta base de zona privada dealer: `/dashboard/*`

- INSTRUCCIONES-MAESTRAS.md sesiones 15, 16c, 24, 31 usaban `/dealer/*`
- Anexo K ya usaba `/dashboard/`
- Corregido en todo INSTRUCCIONES-MAESTRAS.md (~25 ocurrencias)
- `/dealer/[slug]` se mantiene como página PÚBLICA del dealer

### Documentos generados/actualizados

| Documento                   | Acción                                                            |
| --------------------------- | ----------------------------------------------------------------- |
| INSTRUCCIONES-MAESTRAS.md   | Corregido: verticales 5-7, rutas /dashboard/, importar.vue        |
| contexto-global.md          | Corregido: verticales 5-7, añadida sección 10 mapa 35 sesiones    |
| K-dealer-toolkit.md         | Corregido: precios 29€/79€, estructura rutas /dashboard/ ampliada |
| D-monetizacion.md           | Corregido: precios suscripciones dealer                           |
| README.md                   | Añadida nota de sesión 13-32 referencia INSTRUCCIONES-MAESTRAS    |
| seeds/geo_regions_spain.sql | **NUEVO** — 72 registros (1 país + 19 regiones + 52 provincias)   |

**DECISIÓN:** Rutas editoriales: `/guia/[slug]` + `/noticias/[slug]`. Eliminado `/comunicacion/`.

- Decisión original del 17 Feb, reintroducida por error en Anexo P el 18 Feb, corregida ahora
- Normativa, comparativas, guías de compra → todo en `/guia/` (evergreen)
- Noticias temporales → `/noticias/` solo si valor SEO a 3+ meses, resto a LinkedIn/WhatsApp
- Tabla articles.section: valores 'guia' o 'noticias' (no 4 subsecciones)

| Documento                 | Acción                                                                           |
| ------------------------- | -------------------------------------------------------------------------------- |
| INSTRUCCIONES-MAESTRAS.md | Sesión 5: /comunicacion/ → /guia/ + /noticias/. Mapa de rutas canónico corregido |
| P-contenido-editorial.md  | P.1 reescrito: /guia/ + /noticias/. P.5 articles.section actualizado             |
| contexto-global.md        | §7 corregido: 2 secciones sin /comunicacion/                                     |
| README.md                 | Tabla anexos y punto 4 actualizados                                              |
| 01-pasos-0-6-migracion.md | Paso 4.1 + 4.3 slugs reservados actualizados                                     |

**CORRECCIÓN:** URLs landing pages flat (no nested) + umbral dinámico solapamiento.

- Decisión 17 Feb: `/cisternas-alimentarias` (flat). Documentado erróneamente como `/cisternas/alimentarias` (nested)
- Umbral dinámico: 3-10 veh → 40%, 11-30 → 50%, 31-50 → 60%, 50+ → 70%. Estaba como DEFAULT 50 estático
- `/marcas/indox` → `/cisternas-indox` (flat)

| Documento                 | Acción                                                                    |
| ------------------------- | ------------------------------------------------------------------------- |
| INSTRUCCIONES-MAESTRAS.md | Catch-all: ejemplos nested → flat. Añadida nota decisión SEO con umbrales |
| 01-pasos-0-6-migracion.md | Añadida función calculate_dynamic_threshold(), notas URLs flat            |
| P-contenido-editorial.md  | /marcas/indox → /cisternas-indox                                          |
| CHANGELOG.md              | Formato URLs corregido a flat                                             |

**CORRECCIÓN:** Integrar 6 funcionalidades legacy del código actual (no contempladas en sesiones nuevas).

- `balance`, `chat_messages`, `maintenance_records`, `rental_records`, `advertisements`+`demands`, `filter_definitions`
- Categoría `terceros` → `subasta` (UPDATE vehicles, eliminar action 'terceros' del seed)
- Añadido Bloque D-BIS en INSTRUCCIONES-MAESTRAS (tablas legacy a preservar)
- Añadida sección i) en migración 00031 (ALTER TABLE ADD COLUMN vertical/dealer_id)
- Añadidos mantenimientos/alquileres a Sesión 31 (herramientas dealer)

| Documento                 | Acción                                                         |
| ------------------------- | -------------------------------------------------------------- |
| INSTRUCCIONES-MAESTRAS.md | Bloque D-BIS + Sesión 31 ampliada (mantenimientos, alquileres) |
| 01-pasos-0-6-migracion.md | Sección i) legacy tables + terceros→subasta en seed            |
| CHANGELOG.md              | Registro de cambios                                            |

**CORRECCIÓN:** Integrar 11 funcionalidades de código existente (páginas, composables, utils) no contempladas.

- 6 páginas admin: agenda→CRM, cartera→pipeline, comentarios, historico, productos, utilidades
- 5 composables: useGoogleDrive, useSeoScore, useUserChat, useFavorites, useAdminHistorico
- 4 utils: generatePdf, fileNaming, geoData+parseLocation+geo.get, fuzzyMatch
- Añadido Bloque D-TER en INSTRUCCIONES-MAESTRAS (código funcional a preservar)
- Sesiones actualizadas: 11 (SEO Score + comentarios), 28 (CRM + pipeline + historico), 31 (utilidades)
- Regla para Claude Code: buscar código existente antes de reimplementar

| Documento                 | Acción                                         |
| ------------------------- | ---------------------------------------------- |
| INSTRUCCIONES-MAESTRAS.md | Bloque D-TER + Sesión 11 + Sesión 28 ampliadas |
| CHANGELOG.md              | Registro de cambios                            |

**CORRECCIÓN:** Cruzar plan-v3.md (46 tareas originales Tank Ibérica) con sesiones Tracciona.

- 7 tareas ya cubiertas (Sentry, XSS, CSP, Playwright, PWA, Lighthouse, Edge Functions)
- 7 tareas nuevas integradas: Vitest (S.20), Husky+GitHub Actions+localStorage+ipapi (S.19), Cloudinary provider (S.3), observatorio competencia (S.28)
- 2 ya cubiertos por bloques anteriores (intermediación=Bloque D-TER, Pinia=composables)
- Añadido Bloque D-QUATER con mapeo completo plan-v3 → sesiones

| Documento                 | Acción                                         |
| ------------------------- | ---------------------------------------------- |
| INSTRUCCIONES-MAESTRAS.md | Bloque D-QUATER + S.19 + S.20 + S.28 ampliadas |
| CHANGELOG.md              | Registro de cambios                            |

**CORRECCIÓN:** Cruzar 10 documentos completos de /tank-iberica/docs/ (plan-v3, hoja-de-ruta, progreso, admin-funcionalidades, index-funcionalidades, inventario-ui, esquema-bd, GUIA_CONFIGURACION, intermediacion_estructura, tabla_config_inicial).

- 9 funcionalidades con gaps reales encontradas
- Añadido Bloque D-QUINQUIES: intermediation+comisión (S.10), transacciones venta/alquiler (S.31), 6 exportaciones avanzadas (S.31), tabla_config dinámica (S.9), cálculos financieros histórico (S.28), motor matching demanda/oferta (S.16+27), detalle contratos (S.31), gráficos balance (S.27), referencia 453 UI elements

| Documento                 | Acción                                                 |
| ------------------------- | ------------------------------------------------------ |
| INSTRUCCIONES-MAESTRAS.md | Bloque D-QUINQUIES (9 funcionalidades + referencia UI) |
| CHANGELOG.md              | Registro de cambios                                    |

**CORRECCIÓN (Ronda 5 — cruce exhaustivo):** Revisados los 10 documentos completos de /tank-iberica/ incluyendo hoja-de-ruta.md (83 tareas), progreso.md, admin-funcionalidades.md (261 funciones), index-funcionalidades.md (12.788 líneas), inventario-ui.md (453 elementos), CLAUDE.md, .claude/commands/ y .claude/skills/.

12 gaps identificados y todos integrados (sesiones 1-12 ya ejecutadas, cambios en 13+):

| #   | Gap                               | Dónde se integró                             |
| --- | --------------------------------- | -------------------------------------------- |
| 1   | Mobile-first transversal          | Regla 5 (nueva) + S.13 auditoría retroactiva |
| 2   | Bottom sheet móvil                | Regla 5 + S.13 corrección modales            |
| 3   | Keep-alive + scroll preservation  | Regla 5 + S.13 verificación                  |
| 4   | 6 exportaciones Excel/PDF         | S.31 ExportModal.vue genérico                |
| 5   | Configuración tabla columnas      | S.31 ConfigurableTable.vue                   |
| 6   | Flujo transacción alquilar/vender | S.28 nueva sección                           |
| 7   | Generador contratos reutilizar    | S.31 REUTILIZAR utilidades.vue               |
| 8   | Design system tokens.css          | S.13 verificar/crear                         |
| 9   | Intermediación flujo completo     | S.31 IDs P#, estados, beneficio              |
| 10  | Ojeados plataformas configurables | S.28 observatorio ampliado                   |
| 11  | Migración usuarios SHA-256→bcrypt | S.13 password reset                          |
| 12  | CLAUDE.md + commands + skills     | Regla 8 (nueva) + S.13 crear                 |

| Documento                 | Acción                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| INSTRUCCIONES-MAESTRAS.md | Reglas 5-8 nuevas + S.13 Bloque D-QUINQUIES ampliado + S.28 transacciones + S.31 exportaciones/tabla/intermediación |
| CHANGELOG.md              | Registro de cambios                                                                                                 |

---

_Última actualización: 19 de febrero de 2026_
