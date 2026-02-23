## ANEXO T: SISTEMA DE INTERNACIONALIZACIÓN (i18n) ESCALABLE

### T.1 Principio: preparar para N idiomas desde el día uno

El sistema actual tiene columnas `_es` y `_en` hardcodeadas en todas las tablas. Esto NO escala. Si mañana se añade francés, hay que hacer ALTER TABLE en 5+ tablas. Con 2 millones de productos (Horecaria), es inviable.

**Solución: sistema híbrido de dos niveles.**

### T.2 Nivel 1 — Campos cortos: JSONB en la propia fila

Nombres de categorías, labels de filtros, nombres de acciones, títulos de badges — son 5-50 caracteres por idioma. Van como JSONB directamente en la tabla. No necesitan JOIN adicional y pesan poco.

```sql
-- TODAS las tablas con campos traducibles cortos usan JSONB:
-- actions.name = {"es": "Venta", "en": "Sale", "fr": "Vente"}
-- categories.name = {"es": "Cisternas", "en": "Tankers", "fr": "Citernes"}
-- subcategories.name = {"es": "Alimentarias", "en": "Food-grade", "fr": "Alimentaires"}
-- attributes.label = {"es": "Capacidad", "en": "Capacity", "fr": "Capacité"}
-- NO se usa name_es, name_en. Se usa name JSONB.
```

**Migración de columnas existentes:**

```sql
-- Para cada tabla que tenga _es/_en, migrar a JSONB:
-- Ejemplo con categories (antes subcategories):
ALTER TABLE categories ADD COLUMN name JSONB;
UPDATE categories SET name = jsonb_build_object('es', name_es, 'en', COALESCE(name_en, name_es));
-- Después de verificar: ALTER TABLE categories DROP COLUMN name_es, DROP COLUMN name_en;

-- Mismo patrón para: subcategories, attributes, actions, news
-- Para singular: añadir name_singular JSONB si aplica
```

### T.3 Nivel 2 — Campos largos: tabla `content_translations` separada

Descripciones de vehículos, contenido de artículos, contenido de noticias — pueden ser 2.000+ caracteres en 8+ idiomas. Con 2 millones de productos = 32GB solo en traducciones. NO pueden ir en la fila principal.

```sql
CREATE TABLE content_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR NOT NULL,    -- 'vehicle', 'article', 'news', 'dealer'
  entity_id UUID NOT NULL,
  field VARCHAR NOT NULL,           -- 'description', 'content', 'excerpt', 'bio'
  locale VARCHAR(5) NOT NULL,       -- 'es', 'en', 'fr', 'de', 'nl', 'pl', 'it'
  value TEXT NOT NULL,
  source VARCHAR DEFAULT 'auto',    -- 'original', 'auto_gpt4omini', 'auto_haiku', 'auto_deepl', 'reviewed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(entity_type, entity_id, field, locale)
);

-- Índices para las queries reales
CREATE INDEX idx_ct_lookup ON content_translations(entity_type, entity_id, locale);
CREATE INDEX idx_ct_entity ON content_translations(entity_type, entity_id, field);
CREATE INDEX idx_ct_source ON content_translations(source);

-- Full-text search por idioma
CREATE INDEX idx_ct_fts_es ON content_translations USING GIN(to_tsvector('spanish', value)) WHERE locale = 'es';
CREATE INDEX idx_ct_fts_en ON content_translations USING GIN(to_tsvector('english', value)) WHERE locale = 'en';
CREATE INDEX idx_ct_fts_fr ON content_translations USING GIN(to_tsvector('french', value)) WHERE locale = 'fr';
CREATE INDEX idx_ct_fts_de ON content_translations USING GIN(to_tsvector('german', value)) WHERE locale = 'de';
-- Añadir más índices FTS según se activen idiomas
```

**RLS:** Lectura pública. Escritura: admin o dealer propietario del entity_id.

### T.4 Tabla `vehicles` limpia (sin columnas de idioma)

```sql
-- Eliminar columnas de idioma de vehicles:
-- description_es, description_en → migrar a content_translations
-- location, location_en → migrar a location JSONB

ALTER TABLE vehicles ADD COLUMN location_data JSONB DEFAULT '{}';
-- location_data = {"province": "León", "country": "ES", "region": "Castilla y León"}

-- Migrar descriptions existentes:
INSERT INTO content_translations (entity_type, entity_id, field, locale, value, source)
SELECT 'vehicle', id, 'description', 'es', description_es, 'original'
FROM vehicles WHERE description_es IS NOT NULL;

INSERT INTO content_translations (entity_type, entity_id, field, locale, value, source)
SELECT 'vehicle', id, 'description', 'en', description_en, 'original'
FROM vehicles WHERE description_en IS NOT NULL;

-- Después de verificar: DROP COLUMN description_es, description_en, location_en
```

### T.5 Helper frontend: `localizedField()`

```typescript
// composables/useLocalized.ts

/**
 * Lee un campo JSONB con fallback chain.
 * Ejemplo: localizedField(category.name, 'pl')
 *   → intenta 'pl' → 'en' → 'es' → primer valor disponible
 */
export function localizedField(
  jsonField: Record<string, string> | null | undefined,
  locale: string,
): string {
  if (!jsonField) return ''
  return (
    jsonField[locale] || jsonField['en'] || jsonField['es'] || Object.values(jsonField)[0] || ''
  )
}

/**
 * Lee una traducción larga de content_translations.
 * Se usa en páginas de detalle (ficha vehículo, artículo).
 * En listados NO se llama (no necesitamos descripción en el grid).
 */
export async function fetchTranslation(
  entityType: string,
  entityId: string,
  field: string,
  locale: string,
): Promise<string> {
  const supabase = useSupabaseClient()
  // Fallback chain en una sola query
  const { data } = await supabase
    .from('content_translations')
    .select('value, locale')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('field', field)
    .in('locale', [locale, 'en', 'es'])
    .order('locale') // deterministic

  if (!data || !data.length) return ''
  // Priorizar: idioma solicitado → inglés → español
  const match =
    data.find((d) => d.locale === locale) ||
    data.find((d) => d.locale === 'en') ||
    data.find((d) => d.locale === 'es')
  return match?.value || ''
}
```

### T.6 Configuración i18n en Nuxt

```typescript
// nuxt.config.ts — cambiar strategy a prefix_except_default
i18n: {
  locales: [
    { code: 'es', file: 'es.json', name: 'Español' },
    { code: 'en', file: 'en.json', name: 'English' },
    // Añadir idiomas simplemente agregando líneas aquí + crear el JSON:
    // { code: 'fr', file: 'fr.json', name: 'Français' },
    // { code: 'de', file: 'de.json', name: 'Deutsch' },
    // { code: 'nl', file: 'nl.json', name: 'Nederlands' },
    // { code: 'pl', file: 'pl.json', name: 'Polski' },
    // { code: 'it', file: 'it.json', name: 'Italiano' },
  ],
  defaultLocale: 'es',
  strategy: 'prefix_except_default', // CAMBIO CRÍTICO: /en/vehiculo/slug, /fr/vehiculo/slug
  // Español sin prefijo: /vehiculo/slug (es el default)
}
```

**Hreflang dinámico en sitemap:** Se genera automáticamente para N idiomas basándose en el array de locales.

### T.7 Sistema de traducción automática

#### T.7.1 Quién traduce qué

| Contenido                                       | Motor                                              | Cuándo      | Coste           |
| ----------------------------------------------- | -------------------------------------------------- | ----------- | --------------- |
| **Títulos de fichas**                           | Generados automáticamente (marca + modelo + specs) | Al publicar | 0€              |
| **Términos fijos** (UI, filtros, categorías)    | Admin con Claude Max, una sesión                   | Una vez     | 0€              |
| **Generar artículos SEO** (original en español) | Admin con Claude Max                               | Al crear    | 0€              |
| **Traducir fichas de vehículo** a N idiomas     | GPT-4o mini Batch API                              | Asíncrono   | ~0,001€/ficha   |
| **Traducir artículos editoriales** a N idiomas  | GPT-4o mini Batch API                              | Asíncrono   | ~0,01€/artículo |

#### T.7.2 Flujo asíncrono de traducción

```
1. Dealer/admin publica contenido en su idioma
2. Se guarda en content_translations con source='original' y locale del autor
3. El contenido es visible INMEDIATAMENTE en el idioma original
4. Se marca como pendiente de traducción (campo pending_translations=true en la entidad)
5. Proceso de traducción (ver T.7.3) genera traducciones a idiomas restantes
6. Se insertan en content_translations con source='auto_gpt4omini'
7. Se marca pending_translations=false
8. Si un comprador ve la ficha ANTES de que se complete: fallback chain (en → es → original)
```

#### T.7.3 Proceso de traducción — 3 opciones según fase

**Fase lanzamiento (meses 1-6, <50 fichas nuevas/semana):**
Admin abre Claude Code una vez al día y ejecuta: "traduce todas las fichas pendientes desde la última ejecución". Coste: 0€ (incluido en Claude Max).

**Fase crecimiento (meses 6-12, >50 fichas/semana):**
Script Python en el PC del admin programado con Windows Task Scheduler cada 3 horas. Se conecta a Supabase, detecta fichas sin traducir, llama a GPT-4o mini API, inserta traducciones. Coste: céntimos/día.

**Fase escala (mes 12+, múltiples verticales):**
Supabase Edge Function con trigger en la BD. Nuevo vehículo → Edge Function → GPT-4o mini API → traducciones insertadas en 30-60 segundos. Totalmente automático. Coste: ~0,001€/ficha.

#### T.7.4 Campo `source` en content_translations

```
'original'        — Lo que escribió el dealer/admin en su idioma
'auto_gpt4omini'  — Traducido por GPT-4o mini (fichas, artículos)
'auto_haiku'      — Traducido por Claude Haiku (si se usa para artículos premium)
'auto_deepl'      — Traducido por DeepL (si se integra en el futuro)
'reviewed'        — Traducción automática revisada por humano
'manual'          — Traducción escrita manualmente por admin
```

Esto permite re-traducir masivamente en el futuro: "todas las que son auto_gpt4omini, pasarlas por un motor mejor" con un script batch.

#### T.7.5 Detección de idioma del contenido original

No hace falta motor de detección: el dealer tiene un `locale` en su perfil (se registró desde tracciona.com/fr/, sabemos que es francés). Lo que escribe está en su idioma. Se traduce a los demás.

### T.8 Contenido por mercado

No todo el contenido es universal. Hay tres tipos:

| Tipo           | Ejemplo                                                     | Idiomas                                           |
| -------------- | ----------------------------------------------------------- | ------------------------------------------------- |
| **Universal**  | "Cómo elegir una cisterna alimentaria"                      | Se genera una vez, se traduce a todos             |
| **Localizado** | "Normativa ITV en España" vs "Contrôle technique en France" | Artículos distintos por país, NO son traducciones |
| **Regional**   | "Feria SOLUTRANS Lyon 2026"                                 | Solo interesa a ciertos mercados                  |

Para gestionar esto, `articles.target_markets`:

```sql
ALTER TABLE articles ADD COLUMN target_markets TEXT[] DEFAULT '{all}';
-- '{all}' = universal, se traduce a todos los idiomas activos
-- '{es}' = solo España
-- '{fr,be}' = Francia y Bélgica
-- '{de,at,ch}' = DACH (Alemania, Austria, Suiza germanoparlante)
```

---
