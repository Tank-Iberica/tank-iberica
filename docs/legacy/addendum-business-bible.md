# ADDENDUM — Business Bible TradeBase

## Actualizaciones posteriores a la versión original (13-14 Feb 2026)

> **Instrucción:** Este addendum debe leerse JUNTO con la Business Bible original. Contiene decisiones técnicas y estratégicas tomadas entre el 17-18 de febrero de 2026 que modifican o amplían secciones del documento original.

---

## A1. CAMBIO DE NOMENCLATURA

| Original (Business Bible)           | Actualizado                                                      | Motivo                                             |
| ----------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| "TradeBase" como nombre del holding | Se mantiene como nombre futuro del holding                       | Sin cambios                                        |
| Columnas `_es` / `_en` en BD        | Eliminadas. Sustituidas por JSONB + tabla `content_translations` | Escalabilidad a N idiomas (ver A3)                 |
| `filter_definitions` (tabla)        | Renombrada a `attributes`                                        | Claridad semántica                                 |
| `subcategories` (tabla)             | Renombrada a `categories` (nivel superior)                       | Alinear con terminología real del negocio          |
| `types` (tabla)                     | Renombrada a `subcategories` (nivel inferior)                    | Alinear con terminología real del negocio          |
| `vehicle_category` (enum)           | Eliminado. Sustituido por tabla `actions`                        | Permite añadir acciones (subasta) sin tocar código |

## A2. NUEVOS ANEXOS TÉCNICOS (T, U, V)

La documentación técnica se ha ampliado de 19 anexos (A-S) a 22 anexos (A-V):

**Anexo T — Sistema de internacionalización (i18n) escalable**

- Arquitectura de dos niveles: JSONB para campos cortos, tabla separada para campos largos
- Preparado para N idiomas sin ALTER TABLE
- Traducción automática con GPT-4o mini Batch API
- Coste traducción por ficha: ~0,001€
- Coste traducción 2M fichas (Horecaria): ~790€ con Batch API

**Anexo U — Publicación programada y calendario editorial**

- Sistema de scheduled publishing en la BD
- Calendario web: martes/jueves 09:00 CET
- Calendario redes sociales: lunes-viernes con horarios B2B optimizados
- SEO Score Potenciador: 15+ checks automáticos
- Flujo dominical: preparar toda la semana con Claude Max en una sesión

**Anexo V — Tablas placeholder de Capa 2**

- Tablas creadas desde el día uno pero sin frontend: `dealers`, `auctions`, `auction_bids`, `auction_registrations`, `verification_reports`, `ad_slots`, `ad_events`, `transport_quotes`
- Columnas adicionales en `vehicles`: `dealer_id`, `listing_type`, `verification_level`, `sold_at`, `pending_translations`, `location_data`

## A3. SISTEMA DE INTERNACIONALIZACIÓN — IMPACTO EN NEGOCIO

**Decisión estratégica:** tracciona.com con subdirectorios por idioma (`/en/`, `/fr/`, `/de/`) en vez de dominios locales (`.fr`, `.de`). El `.com` es el estándar en B2B industrial y los grandes del sector (Mascus, MachineryZone) lo usan así.

**Idiomas preparados para activar:**

- Español (default, sin prefijo en URL)
- Inglés (/en/)
- Francés (/fr/) — Francia es el 2º mercado de vehículos industriales en Europa
- Alemán (/de/) — Alemania es el 1er mercado
- Holandés (/nl/) — Benelux, hub logístico europeo
- Polaco (/pl/) — Europa del Este, mercado creciente
- Italiano (/it/) — Mercado sur de Europa

**Coste de activar un idioma nuevo:**

1. Crear archivo JSON de UI (~500 strings) → Claude Max, 0€
2. Traducir catálogo existente → GPT-4o mini, ~0,001€/ficha
3. Añadir una línea en nuxt.config.ts → 0€
4. Generar artículos editoriales localizados → Claude Max, 0€

**Impacto en el pitch de inversores:** La escalabilidad multi-idioma es un argumento de valoración. El mismo catálogo de 500 vehículos, traducido a 7 idiomas de lanzamiento, es visible en 7 mercados con un coste de traducción de ~0,50€ total.

**IMPORTANTE — Arquitectura para N idiomas, no solo 7:**
Los 7 idiomas de lanzamiento (ES, EN, FR, DE, NL, PL, IT) son el punto de partida. La arquitectura JSONB + content_translations + @nuxtjs/i18n soporta cualquier número de idiomas sin cambios de código ni migraciones SQL. Añadir un idioma nuevo (por ejemplo, portugués, rumano, turco, checo, sueco, árabe) requiere únicamente:

1. Una línea en `nuxt.config.ts` (locale + prefijo)
2. Un archivo `locales/XX.json` con ~500 strings de UI
3. Lanzar batch de traducción de contenido existente (~0,001€/ficha)
4. Opcionalmente, insertar regiones del nuevo país en `geo_regions` para publicidad geolocalizada

Idiomas naturales de expansión según mercado: PT (Portugal/Brasil), RO (Rumanía — mucho transporte), TR (Turquía), CS (Chequia), SV (Suecia). La decisión es de mercado, no de tecnología.

## A4. CONTENIDO EDITORIAL — NUEVA FUENTE DE TRÁFICO

**No incluido en la Business Bible original.** Se añade como canal de adquisición orgánica:

- 4 secciones: guías, noticias, normativa, comparativas
- Contenido por mercado: artículos universales + localizados por país
- Generación: Claude Max (0€) + traducción GPT-4o mini (~0,01€/artículo)
- Cadencia: 8-12 artículos/mes
- Impacto SEO: cada artículo es una nueva URL indexable con long-tail keywords

**Tipos de artículos por mercado:**

- Universales: "Cómo elegir una cisterna alimentaria" (se traduce a todos los idiomas)
- Localizados: "Normativa ITV en España" vs "Contrôle technique en France" (artículos distintos)
- Regionales: "Feria SOLUTRANS Lyon 2026" (solo ciertos mercados)

## A5. SISTEMA DE PUBLICACIÓN PROGRAMADA

**No incluido en la Business Bible original.** Impacto operativo:

- Los artículos se generan en batch (sesión dominical con Claude Max) y se programan
- Publicación automática: cron cada 15 minutos
- Redes sociales: textos pre-generados en todos los idiomas con Claude Max
- Calendario web: martes y jueves 09:00 CET
- Calendario redes: LinkedIn 3-5/semana (10:00 CET), Instagram 2-3/semana

## A6. COSTES ACTUALIZADOS

**Costes de traducción (añadir a la sección de costes operativos):**

| Concepto                                               | Tracciona (500 fichas) | Horecaria (2M fichas) |
| ------------------------------------------------------ | ---------------------- | --------------------- |
| Traducir catálogo completo a 7 idiomas (lanzamiento)   | ~0,50€                 | ~790€ (Batch API)     |
| Traducción mensual (nuevos vehículos)                  | <0,10€/mes             | ~10€/mes              |
| Artículos editoriales (10/mes × 7 idiomas lanzamiento) | <0,10€/mes             | <0,10€/mes            |
| Añadir 1 idioma nuevo (coste único por idioma)         | ~0,50€                 | ~113€                 |
| Términos fijos UI (una vez)                            | 0€ (Claude Max)        | 0€ (Claude Max)       |

**Comparativa de costes de motores de traducción:**

| Motor                 | Coste por 1M fichas × 7 idiomas | Calidad europeo |
| --------------------- | ------------------------------- | --------------- |
| GPT-4o mini Batch API | **~790€**                       | Buena (técnico) |
| Claude Haiku 4.5      | ~5.250€                         | Muy buena       |
| DeepL API             | ~24.000€                        | Excelente       |
| GPT-4o                | ~10.500€                        | Muy buena       |

**Decisión:** GPT-4o mini para fichas técnicas (calidad suficiente, 30× más barato que DeepL). Claude Max para artículos editoriales y términos fijos (0€ incluido en suscripción).

## A7. ESTRATEGIA DE CAPAS PARA IMPLEMENTACIÓN

**Decisión arquitectónica no incluida en Business Bible original:**

**Capa 1 — Hacer ahora, completo, con frontend:**
Todo lo que cambia URLs, estructura de BD, o routing. Si se hace después con datos reales y URLs indexadas, es caro y arriesgado.

**Capa 2 — Crear tablas ahora, pero sin frontend:**
Tablas y columnas en la BD para que cuando se implemente la funcionalidad no haya ALTER TABLE sobre datos en producción.

**Capa 3 — No tocar ahora, implementar después:**
Módulos independientes que se conectan al sistema sin modificar nada existente: WhatsApp publishing, Google Ads, scraping, widget embebible, merchandising, monetización de datos, social media auto-posting.

---

_Addendum creado: 18 de febrero de 2026_
_Aplica sobre: Business Bible TradeBase (13-14 Feb 2026)_
