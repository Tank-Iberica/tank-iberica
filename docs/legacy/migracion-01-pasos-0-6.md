> ⚠️ **[LEGACY]** Documento histórico — solo referencia. No modificar ni usar como fuente de verdad. Ver `docs/tracciona-docs/` para documentación activa.

## PASO 1: RENOMBRAR TABLAS Y NOMENCLATURA

### 1.1 Contexto del esquema actual

El proyecto tiene estas tablas relevantes en Supabase (ver migraciones en /supabase/migrations/):

```
ACTUAL                          →  NUEVO NOMBRE
───────────────────────────────────────────────
vehicle_category (enum)         →  ELIMINAR (reemplazar por tabla 'actions')
  valores: alquiler, venta, terceros

subcategories (tabla)           →  categories
  Son las categorías principales: Cisternas, Tractoras, Rígidos, Semirremolques, Remolques, Ligeros, Especializados

types (tabla)                   →  subcategories
  Son los subtipos: Alimentarias, Combustibles, Químicas, ADR, Frigorífico, Lona, Plataforma, etc.

type_subcategories (junction)   →  subcategory_categories (renombrar para reflejar la nueva nomenclatura)
  Junction many-to-many entre types y subcategories actuales

filter_definitions (tabla)      →  attributes
  Son los atributos técnicos: Serpentín, Ejes, ADR, Volumen, CV, etc.

vehicles.category (enum col)    →  vehicles.action_id (UUID FK a actions)
vehicles.subcategory_id (FK)    →  vehicles.category_id (FK a categories, antes subcategories)
vehicles.filters_json (JSONB)   →  vehicles.attributes_json (renombrar para consistencia)
```

### 1.2 Crear nueva migración SQL

Crear archivo: `/supabase/migrations/00031_multivertical_rename.sql`

Esta migración debe:

**a) Crear tabla `actions` (reemplaza el enum vehicle_category):**

```sql
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  slug VARCHAR NOT NULL,
  name JSONB NOT NULL,  -- {"es": "Venta", "en": "Sale", "fr": "Vente", ...}
  sort_order INT DEFAULT 0,
  status VARCHAR DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vertical, slug)
);

-- Seed con los valores actuales del enum + subasta
INSERT INTO actions (vertical, slug, name, sort_order) VALUES
  ('tracciona', 'venta', '{"es": "Venta", "en": "Sale"}', 1),
  ('tracciona', 'alquiler', '{"es": "Alquiler", "en": "Rental"}', 2),
  ('tracciona', 'subasta', '{"es": "Subasta", "en": "Auction"}', 3);
-- NOTA: 'terceros' del código viejo se migra a 'subasta'. NO crear acción 'terceros'.
-- Migración de datos: UPDATE vehicles SET category = 'subasta' WHERE category = 'terceros';
```

**b) Renombrar tablas:**

```sql
-- Renombrar types → subcategories (PRIMERO, porque subcategories actual se va a renombrar)
-- CUIDADO: hay que hacer esto en orden correcto para evitar conflictos de nombres

-- 1. Renombrar subcategories actual → categories
ALTER TABLE subcategories RENAME TO categories;

-- 2. Renombrar types → subcategories
ALTER TABLE types RENAME TO subcategories;

-- 3. Renombrar junction table
ALTER TABLE type_subcategories RENAME TO subcategory_categories;
-- Y renombrar sus columnas:
ALTER TABLE subcategory_categories RENAME COLUMN type_id TO subcategory_id;
ALTER TABLE subcategory_categories RENAME COLUMN subcategory_id TO category_id;

-- 4. Renombrar filter_definitions → attributes
ALTER TABLE filter_definitions RENAME TO attributes;
```

**c) Añadir columna `vertical` a todas las tablas que no la tengan:**

```sql
ALTER TABLE categories ADD COLUMN IF NOT EXISTS vertical VARCHAR NOT NULL DEFAULT 'tracciona';
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS vertical VARCHAR NOT NULL DEFAULT 'tracciona';
ALTER TABLE attributes ADD COLUMN IF NOT EXISTS vertical VARCHAR NOT NULL DEFAULT 'tracciona';
```

**d) Migrar vehicles.category (enum) a vehicles.action_id (UUID FK):**

```sql
-- Añadir nueva columna
ALTER TABLE vehicles ADD COLUMN action_id UUID REFERENCES actions(id);

-- Migrar datos existentes
UPDATE vehicles SET action_id = (SELECT id FROM actions WHERE slug = vehicles.category::text AND vertical = 'tracciona');

-- Renombrar subcategory_id → category_id
ALTER TABLE vehicles RENAME COLUMN subcategory_id TO category_id;

-- Renombrar filters_json → attributes_json
ALTER TABLE vehicles RENAME COLUMN filters_json TO attributes_json;

-- Eliminar columna category antigua (después de verificar migración)
-- ALTER TABLE vehicles DROP COLUMN category;
-- NOTA: No eliminar el enum hasta confirmar que todo funciona. Comentar esta línea.
```

**e) Renombrar columnas de FK en subcategories (antes types):**

```sql
-- subcategories (antes types) tiene applicable_categories como TEXT[]
-- Estos valores referencian el enum antiguo ('alquiler', 'venta', 'terceros')
-- Necesitan referenciar action slugs ahora
-- El formato TEXT[] con slugs sigue funcionando, no necesita cambio de tipo
-- Pero renombrar para claridad:
ALTER TABLE categories RENAME COLUMN applicable_categories TO applicable_actions;
ALTER TABLE subcategories RENAME COLUMN applicable_categories TO applicable_actions;
```

**f) Actualizar RLS policies:**
Todas las policies que referencien los nombres de tabla antiguos necesitan actualizarse.
Revisar TODAS las policies en las migraciones 00003, 00010, 00013, 00020 y recrearlas con los nombres nuevos.

**g) Actualizar índices:**
Los índices con nombres que referencian tablas antiguas deben recrearse:

```sql
-- Ejemplo: idx_subcategories_slug ahora debe ser idx_categories_slug
-- idx_filter_definitions_subcategory ahora debe ser idx_attributes_category
-- etc.
```

**h) Actualizar triggers:**

```sql
-- set_updated_at_subcategories → set_updated_at_categories
-- set_updated_at_filter_definitions → set_updated_at_attributes
-- etc.
```

**i) Adaptar tablas legacy a multivertical (NO eliminar, solo añadir columnas):**

```sql
-- Tablas que ya existen del código viejo y se preservan
ALTER TABLE balance ADD COLUMN IF NOT EXISTS vertical VARCHAR NOT NULL DEFAULT 'tracciona';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS vertical VARCHAR NOT NULL DEFAULT 'tracciona';
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS vertical VARCHAR NOT NULL DEFAULT 'tracciona';
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS dealer_id UUID REFERENCES dealers(id);
ALTER TABLE rental_records ADD COLUMN IF NOT EXISTS vertical VARCHAR NOT NULL DEFAULT 'tracciona';
ALTER TABLE rental_records ADD COLUMN IF NOT EXISTS dealer_id UUID REFERENCES dealers(id);
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS vertical VARCHAR NOT NULL DEFAULT 'tracciona';
ALTER TABLE demands ADD COLUMN IF NOT EXISTS vertical VARCHAR NOT NULL DEFAULT 'tracciona';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS vertical VARCHAR NOT NULL DEFAULT 'tracciona';

-- Migrar 'terceros' → 'subasta' en vehicles
UPDATE vehicles SET category = 'subasta' WHERE category = 'terceros';
-- El enum vehicle_category se mantiene temporalmente pero 'terceros' ya no se usa
```

### 1.3 Lo que NO cambiar en la migración

- NO eliminar el enum `vehicle_category` todavía (mantener por compatibilidad hasta confirmar)
- NO modificar la estructura de `vehicles.attributes_json` (antes filters_json) — el JSONB sigue igual
- NO cambiar la lógica de `applicable_filters` en categories/subcategories — sigue siendo UUID[]
- NO tocar vehicle_images, config, news, ni tablas que no están involucradas
- NO eliminar balance, chat_messages, maintenance_records, rental_records, advertisements, demands, contacts — se preservan y adaptan

---

## PASO 2: ACTUALIZAR FRONTEND (COMPONENTES VUE)

### 2.1 Archivos a modificar

Buscar y reemplazar en TODO el directorio /app/:

```
BUSCAR                              →  REEMPLAZAR POR
──────────────────────────────────────────────────────
// En imports, types, interfaces:
VehicleCategory                     →  VehicleAction (o ActionType)
vehicle_category                    →  action (en contexto de tipo/enum)

// En queries Supabase:
.from('subcategories')              →  .from('categories')
  (CUIDADO: solo cuando se refiere a las categorías principales:
   Cisternas, Tractoras, etc. NO cuando se refiere a los tipos/subtipos)
.from('types')                      →  .from('subcategories')
.from('type_subcategories')         →  .from('subcategory_categories')
.from('filter_definitions')         →  .from('attributes')

// En columnas de vehicles:
vehicles.category                   →  vehicles.action_id (con join a actions)
vehicles.subcategory_id             →  vehicles.category_id
vehicles.filters_json               →  vehicles.attributes_json
subcategory_id                      →  category_id (en contexto de FK de vehicles)

// En junction table columns:
type_id                             →  subcategory_id (en contexto de subcategory_categories)
subcategory_id → category_id        →  (en contexto de subcategory_categories)

// En nombres de composables/variables:
activeSubcategoryId                 →  activeCategoryId (cuando se refiere a Cisternas/Tractoras)
activeTypeId                        →  activeSubcategoryId (cuando se refiere a Alimentarias/ADR)
subcategories (variable)            →  categories (cuando contiene Cisternas/Tractoras)
types (variable)                    →  subcategories (cuando contiene Alimentarias/ADR)
```

### 2.2 Archivos específicos a revisar

````
/app/components/catalog/CategoryBar.vue
  - Las categorías principales ('alquiler', 'venta', 'terceros') pasan a venir de tabla 'actions'
  - Fetch dinámico desde Supabase en vez de array hardcodeado
  - Añadir 'subasta' como opción

/app/components/catalog/SubcategoryBar.vue
  - Renombrar todas las referencias internas
  - 'subcategories' → 'categories' (nivel 1: Cisternas, Tractoras)
  - 'types' → 'subcategories' (nivel 2: Alimentarias, ADR)
  - 'filter_definitions' → 'attributes' (nivel 3: Serpentín, Ejes)
  - Actualizar queries Supabase
  - Actualizar emits y props

/app/components/catalog/FilterBar.vue
  - Si referencia filter_definitions, renombrar a attributes
  - MEJORA UX MÓVIL: Reestructurar filtros en 2 niveles:

    NIVEL 1 — Siempre visibles (5-7 máximo):
    Los que usa el 90% de usuarios: acción (venta/alquiler), categoría, subcategoría,
    precio (rango), año (rango), ubicación. Estos se muestran siempre.

    NIVEL 2 — "Más filtros" (desplegable):
    Filtros avanzados por contexto: ejes, MMA, km, marca, ADR, capacidad, etc.
    Se muestran al pulsar botón "Más filtros". Cambian según categoría seleccionada
    (cisternas muestra ADR/capacidad, plataformas muestra longitud/rampas).
    Ya funciona así con attributes vinculados a categorías en BD, solo falta
    separar visualmente nivel 1 de nivel 2.

    FORMATO MÓVIL CON POPOVER:
    En móvil, precio y año NO como sliders inline (difíciles de usar en táctil).
    En su lugar, botones compactos que muestran el valor actual:

    [Precio: 10k-40k ▾]  [Año: 2018-2024 ▾]

    Al tocar el botón, se abre un mini panel (popover/bottom sheet) con los sliders.
    El usuario ajusta, cierra el panel, y el botón actualiza su texto.
    Más cómodo en táctil y ocupa menos espacio en la barra de filtros.

    ```vue
    <!-- Ejemplo de estructura en móvil: -->
    <button @click="showPricePopover = true" class="filter-chip">
      Precio: {{ formatPrice(priceRange[0]) }}-{{ formatPrice(priceRange[1]) }} ▾
    </button>

    <Teleport to="body">
      <div v-if="showPricePopover" class="bottom-sheet">
        <RangeSlider v-model="priceRange" :min="0" :max="maxPrice" />
        <button @click="showPricePopover = false">Aplicar</button>
      </div>
    </Teleport>
    ```

    Referencia de buen UX: Idealista (4 filtros principales + "Más filtros"),
    Airbnb (destino, fechas, huéspedes + filtros avanzados).
    Regla: si un filtro lo usa <10% de usuarios → nivel 2. Si <2% → solo dato en ficha.

/app/composables/useCatalogState.ts (o .js)
  - Renombrar tipos y variables según nomenclatura nueva
  - VehicleCategory type → VehicleAction o similar

/app/composables/useFilters.ts (o .js)
  - Renombrar FilterDefinition → Attribute (o AttributeDefinition)
  - Actualizar queries a tabla 'attributes'

/app/pages/admin/utilidades.vue
  - Si referencia categorías/subcategorías en generadores de facturas/contratos, actualizar

/app/pages/ (TODAS las páginas que hagan queries a estas tablas)
  - Buscar .from('subcategories'), .from('types'), .from('filter_definitions')
  - Reemplazar según nueva nomenclatura
````

### 2.3 Internacionalización

Si hay archivos de traducción (i18n) con keys como `catalog.subcategories`, actualizar:

```
catalog.subcategories → catalog.categories (para Cisternas, Tractoras)
catalog.types → catalog.subcategories (para Alimentarias, ADR)
```

---

## PASO 3: AÑADIR TABLA ACTIVE_LANDINGS Y SISTEMA SEO

### 3.1 Nueva migración: `/supabase/migrations/00032_active_landings.sql`

```sql
-- Tabla core del sistema de landing pages dinámicas
CREATE TABLE active_landings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  slug VARCHAR NOT NULL UNIQUE,
  dimension_values UUID[] NOT NULL,
  parent_slug VARCHAR,
  vehicle_count INT NOT NULL DEFAULT 0,
  parent_vehicle_count INT DEFAULT 0,
  overlap_percentage DECIMAL(5,2) DEFAULT 0,
  overlap_threshold DECIMAL(5,2) DEFAULT 50, -- Umbral dinámico: ver función calculate_dynamic_threshold() abajo
  is_active BOOLEAN NOT NULL DEFAULT false,
  meta_title_es TEXT,
  meta_title_en TEXT,
  meta_description_es TEXT,
  meta_description_en TEXT,
  intro_text_es TEXT,
  intro_text_en TEXT,
  breadcrumb JSONB,
  schema_data JSONB,
  last_calculated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_active_landings_active ON active_landings(is_active) WHERE is_active = true;
CREATE INDEX idx_active_landings_vertical ON active_landings(vertical);
CREATE INDEX idx_active_landings_parent ON active_landings(parent_slug);

-- RLS
ALTER TABLE active_landings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "active_landings_public_read"
  ON active_landings FOR SELECT
  USING (is_active = true);

CREATE POLICY "active_landings_admin_all"
  ON active_landings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

-- ===========================================================
-- URLS FLAT (decisión SEO 17 Feb)
-- ===========================================================
-- El campo `slug` almacena URLs flat con guión:
--   'cisternas'                    (categoría)
--   'cisternas-alimentarias'       (subcategoría)
--   'cisternas-alimentarias-indox' (marca)
--   'alquiler-cisternas'           (acción + categoría)
--   'cabezas-tractoras-renault'    (categoría + marca)
-- NUNCA 'cisternas/alimentarias' (nested). Todo primer nivel.

-- ===========================================================
-- UMBRAL DINÁMICO DE SOLAPAMIENTO (decisión SEO 17 Feb)
-- ===========================================================
-- El umbral de solapamiento no es fijo. Varía según el tamaño
-- del catálogo en la categoría padre. Con pocos vehículos,
-- exigimos más diferenciación para evitar páginas redundantes.
--
-- | Vehículos en padre | Umbral máximo solapamiento |
-- |--------------------|----------------------------|
-- | 3-10               | 40%                        |
-- | 11-30              | 50%                        |
-- | 31-50              | 60%                        |
-- | 50+                | 70%                        |
--
-- Condiciones de activación (AMBAS deben cumplirse):
-- 1. vehicle_count >= 3
-- 2. overlap_percentage < umbral dinámico calculado

CREATE OR REPLACE FUNCTION calculate_dynamic_threshold(parent_count INT)
-- NOTA: Las comillas simples dobles ('') abajo deben ser dollar-quoting (dos signos de dólar seguidos) en SQL real
RETURNS DECIMAL(5,2) AS ''
BEGIN
  RETURN CASE
    WHEN parent_count <= 10 THEN 40.00
    WHEN parent_count <= 30 THEN 50.00
    WHEN parent_count <= 50 THEN 60.00
    ELSE 70.00
  END;
END;
'' LANGUAGE plpgsql IMMUTABLE;

-- El job de recálculo de landings debe:
-- 1. Contar vehículos por combinación de dimensiones
-- 2. Calcular overlap_percentage con la landing padre
-- 3. Calcular overlap_threshold = calculate_dynamic_threshold(parent_vehicle_count)
-- 4. is_active = (vehicle_count >= 3 AND overlap_percentage < overlap_threshold)
```

### 3.2 Normalizar marca y ubicación

Crear tabla para marcas normalizadas:

```sql
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  slug VARCHAR NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vertical, slug)
);

-- Migrar marcas existentes desde vehicles.brand (texto libre)
INSERT INTO brands (vertical, slug, name)
SELECT DISTINCT 'tracciona',
  lower(replace(replace(brand, ' ', '-'), '.', '')),
  brand
FROM vehicles
WHERE brand IS NOT NULL AND brand != '';

-- Añadir FK a vehicles
ALTER TABLE vehicles ADD COLUMN brand_id UUID REFERENCES brands(id);

-- Migrar datos
UPDATE vehicles v SET brand_id = b.id
FROM brands b
WHERE lower(replace(replace(v.brand, ' ', '-'), '.', '')) = b.slug
AND b.vertical = 'tracciona';
```

Crear tabla para ubicaciones normalizadas:

```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  slug VARCHAR NOT NULL,
  name_es TEXT NOT NULL,
  name_en TEXT,
  parent_id UUID REFERENCES locations(id), -- Para jerarquía: Madrid (ciudad) → Madrid (comunidad) → España
  level VARCHAR DEFAULT 'province', -- 'country', 'region', 'province', 'city'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vertical, slug)
);

-- Añadir FK a vehicles
ALTER TABLE vehicles ADD COLUMN location_id UUID REFERENCES locations(id);
```

---

## PASO 4: ACTUALIZAR ROUTING PARA MULTI-VERTICAL

### 4.1 Estructura de páginas

Verificar que la estructura de /app/pages/ soporta el catch-all:

```
pages/
  index.vue                    → Home
  vehiculo/[id].vue            → Ficha de vehículo
  guia/[slug].vue              → Guía evergreen (crear si no existe)
  noticias/[slug].vue          → Noticia temporal (crear si no existe)
  dashboard.vue                → Panel dealer (auth)
  admin/
    index.vue                  → Panel admin
    utilidades.vue             → Herramientas (ya existe)
  nosotros.vue                 → Sobre Tracciona (crear si no existe)
  legal.vue                    → Legal (crear si no existe)
  [...slug].vue                → Catch-all: landing pages + perfiles dealer
```

### 4.2 Crear [...slug].vue si no existe

Este archivo es el catch-all que resuelve:

1. Busca slug en active_landings (WHERE is_active = true) → renderiza landing page de catálogo
2. Si no, busca en tabla dealers (cuando exista) → renderiza perfil de dealer
3. Si no encuentra nada → 404

### 4.3 Lista de slugs reservados

Crear archivo de configuración con slugs que no pueden usarse por dealers ni landings:

```typescript
// /app/utils/reserved-slugs.ts
export const RESERVED_SLUGS = [
  'admin',
  'dashboard',
  'login',
  'register',
  'nosotros',
  'legal',
  'contacto',
  'privacidad',
  'cookies',
  'vehiculo',
  'guia',
  'noticias',
  'subastas',
  'precios',
  'api',
  'sitemap',
  'robots',
  'favicon',
  'manifest',
]
```

---

## PASO 5: VERIFICACIÓN

Después de hacer todos los cambios, verificar:

1. **SQL**: Las migraciones 00031 y 00032 se ejecutan sin errores en orden
2. **Frontend**: Buscar en TODO /app/ que no queden referencias a:
   - `.from('types')` (debería ser `.from('subcategories')`)
   - `.from('subcategories')` que se refiera a categorías (debería ser `.from('categories')`)
   - `.from('filter_definitions')` (debería ser `.from('attributes')`)
   - `.from('type_subcategories')` (debería ser `.from('subcategory_categories')`)
   - `vehicle_category` como enum
   - `filters_json` (debería ser `attributes_json`)
3. **TypeScript**: Los tipos/interfaces reflejan la nueva nomenclatura
4. **i18n**: Los archivos de traducción están actualizados
5. **No tocar tank-iberica/**: Verificar que la carpeta original no fue modificada

---

## PASO 6: MEJORAS TÉCNICAS PRE-LANZAMIENTO

Estas mejoras deben aplicarse durante la migración porque es más eficiente hacerlo ahora que volver a tocar los archivos después.

### 6.1 Eliminar console.log en auth

En `/app/plugins/supabase-auth.client.ts` hay un `console.log('Session active:...')`.
Eliminarlo. En producción no debe haber console.log.

### 6.2 Cambiar i18n strategy a prefix_except_default

En `nuxt.config.ts`, la configuración de i18n tiene `strategy: 'no_prefix'`.
Esto impide que Google indexe versiones en español e inglés por separado.

Cambiar a:

```typescript
i18n: {
  strategy: 'prefix_except_default',
  defaultLocale: 'es',
  // El resto de la configuración se mantiene igual
}
```

Esto hace que:

- Español (por defecto): `/cisternas`, `/vehiculo/slug`
- Inglés: `/en/cisternas`, `/en/vehiculo/slug`

Google podrá indexar ambas versiones con hreflang correcto.

**IMPORTANTE**: Este cambio afecta a TODAS las rutas. Verificar que:

- El catch-all `[...slug].vue` funciona en ambos idiomas
- Los links internos usan `localePath()` del módulo i18n de Nuxt
- Las landings activas generan URLs para ambos idiomas
- El sitemap incluye URLs en ambos idiomas con hreflang alternates

### 6.3 Optimizar carga de Google Fonts

En `nuxt.config.ts`, la fuente Inter se carga con `<link rel="stylesheet">` externo que bloquea el renderizado.

Opción A — Instalar módulo (PREFERIDA):

```bash
npm install @nuxtjs/google-fonts
```

```typescript
// nuxt.config.ts
modules: [
  // ... otros módulos
  '@nuxtjs/google-fonts',
],
googleFonts: {
  families: {
    Inter: [400, 500, 600, 700],
  },
  display: 'swap',
  preload: true,
  download: true, // Descarga las fuentes localmente
}
```

Opción B — Si no se quiere módulo extra:
Añadir `font-display: swap` y `preload` manualmente en la configuración existente.

Eliminar el `<link rel="stylesheet" href="https://fonts.googleapis.com/...">` del `nuxt.config.ts`.

### 6.4 Security headers para Cloudflare Pages

Crear archivo `/public/_headers` con:

```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

NO añadir Content-Security-Policy todavía — requiere definir whitelist de dominios (Supabase, Cloudinary, Google Fonts si no se descargan localmente) y es fácil romper cosas. Hacer en un paso posterior.

### 6.5 Meta robots explícito

En el layout principal o en `usePageSeo()` / `useSeoMeta()`, añadir meta robots por defecto:

```typescript
// En páginas públicas (catálogo, landings, fichas):
useSeoMeta({
  robots: 'index, follow',
  // ... resto de meta tags
})

// En páginas privadas (admin, dashboard):
useSeoMeta({
  robots: 'noindex, nofollow',
  // ... resto de meta tags
})
```

Verificar que `/app/pages/admin/` y `/app/pages/dashboard.vue` tienen `noindex, nofollow`.

### 6.6 Retry logic en useVehicles

El composable `useVehicles.ts` no tiene retry logic. Si Supabase falla, el usuario ve error inmediato.

Crear un wrapper de retry:

```typescript
// /app/utils/retryQuery.ts
export async function retryQuery<T>(
  queryFn: () => Promise<T>,
  maxRetries: number = 2,
  delayMs: number = 500,
): Promise<T> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn()
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)))
      }
    }
  }
  throw lastError
}
```

Usarlo en las queries principales de `useVehicles.ts`:

```typescript
const { data, error } = await retryQuery(() =>
  supabase.from('vehicles').select('*').eq('status', 'published'),
)
```

### 6.7 Cache del rol admin

El middleware de admin hace una consulta a BD en CADA navegación a páginas de admin. Esto es innecesario.

Crear un composable que cachee el rol:

```typescript
// /app/composables/useAdminRole.ts
export function useAdminRole() {
  const isAdmin = useState<boolean | null>('admin-role', () => null)
  const lastChecked = useState<number>('admin-role-checked', () => 0)
  const TTL = 5 * 60 * 1000 // 5 minutos

  async function checkAdmin(): Promise<boolean> {
    const now = Date.now()
    if (isAdmin.value !== null && (now - lastChecked.value) < TTL) {
      return isAdmin.value
    }
    // Aquí va la query actual a BD
    const { data } = await supabase.from('...').select('role')...
    isAdmin.value = data?.role === 'admin'
    lastChecked.value = now
    return isAdmin.value
  }

  function clearCache() {
    isAdmin.value = null
    lastChecked.value = 0
  }

  return { isAdmin, checkAdmin, clearCache }
}
```

Usar `checkAdmin()` en el middleware en vez de la query directa.

### 6.8 Schema Vehicle en fichas de vehículo

Actualmente las fichas usan schema `Product`. Schema.org tiene un tipo `Vehicle` específico con propiedades más relevantes.

En `vehiculo/[slug].vue`, cambiar el JSON-LD:

```typescript
// ANTES:
useJsonld({
  '@type': 'Product',
  name: vehicle.title,
  // ...
})

// DESPUÉS:
useJsonld({
  '@type': 'Vehicle',
  name: vehicle.title,
  brand: { '@type': 'Brand', name: vehicle.brand },
  model: vehicle.model,
  vehicleIdentificationNumber: vehicle.vin || undefined,
  numberOfAxles: vehicle.attributes_json?.ejes || undefined,
  fuelType: vehicle.attributes_json?.combustible || undefined,
  mileageFromOdometer: vehicle.km
    ? {
        '@type': 'QuantitativeValue',
        value: vehicle.km,
        unitCode: 'KMT',
      }
    : undefined,
  payload: vehicle.attributes_json?.capacidad
    ? {
        '@type': 'QuantitativeValue',
        value: vehicle.attributes_json.capacidad,
        unitCode: 'KGM',
      }
    : undefined,
  vehicleModelDate: vehicle.year?.toString(),
  offers: {
    '@type': 'Offer',
    price: vehicle.price,
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
    url: `https://tracciona.com/vehiculo/${vehicle.slug}`,
  },
  image: vehicle.images?.[0]?.url,
  description: vehicle.description_es,
  // Geolocalización del vehículo
  availableAtOrFrom: vehicle.location
    ? {
        '@type': 'Place',
        name: vehicle.location,
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'ES',
          addressRegion: vehicle.location_region || undefined,
        },
      }
    : undefined,
})
```

Esto incluye la geolocalización con schema Place para búsquedas tipo "cisterna en venta Andalucía".

### 6.9 Sitemap de imágenes

Cuando se actualice el sitemap para la nueva nomenclatura, extenderlo para incluir imágenes de vehículos:

En `server/api/__sitemap.ts` (o donde esté la generación del sitemap), añadir las URLs de Cloudinary de cada vehículo como imágenes asociadas:

```typescript
// Al generar las URLs del sitemap para vehículos:
{
  loc: `/vehiculo/${vehicle.slug}`,
  lastmod: vehicle.updated_at,
  images: vehicle.images?.map(img => ({
    loc: img.cloudinary_url,
    title: img.alt_text || `${vehicle.title} - Tracciona`,
    caption: img.alt_text || `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
  })) || [],
}
```

Esto permite que Google Images indexe las fotos con contexto descriptivo. En un sector visual como vehículos industriales, Google Images es fuente de tráfico significativa.

### 6.10 Anti-canibalización SEO

Para evitar que la home y las landing pages compitan por las mismas keywords:

- **Home (index.vue)**: H1 genérico → "Vehículos industriales en venta y alquiler"
  - Meta description genérica, NO mencionar subcategorías específicas
  - Canonical apunta a sí misma
- **Landing pages (active_landings)**: H1 específico → "Cisternas Alimentarias en Venta — Tracciona"
  - Meta description específica de la combinación
  - Canonical apunta a sí misma, NUNCA a la home

En la generación de `meta_title_es` de active_landings, asegurar que SIEMPRE incluye la categoría específica, nunca un título genérico que pueda competir con la home.

### 6.11 Texto auto-generado en landings

El campo `intro_text_es/en` de active_landings debe generarse automáticamente desde datos reales del catálogo. Cuando el job de recálculo actualice las landings, generar el intro_text así:

```sql
-- Pseudocódigo para la lógica de generación:
-- 1. Contar vehículos activos que matchean la landing
-- 2. Obtener rango de precios (min-max)
-- 3. Obtener marcas distintas disponibles
-- 4. Generar texto:
--    "Actualmente disponemos de {count} cisternas alimentarias,
--     desde {min_price}€ hasta {max_price}€.
--     Marcas disponibles: {brands_list}.
--     Opciones de {capacidades} litros con {ejes} ejes."
```

Este texto se regenera cada vez que cambia el catálogo, contiene keywords naturales, y diferencia cada landing de un simple listado vacío.

### 6.12 URLs en PDFs generados

Si existe `generateVehiclePdf.ts` (o equivalente), añadir al pie del PDF:

```typescript
// En la generación del PDF, al final del documento:
doc.addText(`Ver ficha completa: https://tracciona.com/vehiculo/${vehicle.slug}`)
doc.addText(`Más vehículos en tracciona.com`)
// Si es posible, añadir QR code con la URL del vehículo
```

Cada PDF compartido por WhatsApp o email entre transportistas es publicidad gratuita y un backlink potencial si Google indexa el PDF.

### 6.13 Esqueleto para Google Merchant Center feed

Crear server route vacía como placeholder para el futuro feed de Google Shopping:

```typescript
// /server/api/merchant-feed.get.ts
export default defineEventHandler(async (event) => {
  // TODO: Implementar cuando haya catálogo real con >50 vehículos
  // Este endpoint generará un feed XML/JSON para Google Merchant Center
  // que permite aparecer en la pestaña Shopping de Google gratuitamente.
  //
  // Campos necesarios por vehículo:
  // - id, title, description, link, image_link
  // - price, currency (EUR)
  // - availability (in_stock)
  // - condition (used/new)
  // - brand, model, year
  // - product_type (categoría > subcategoría)
  //
  // Formato: RSS 2.0 con namespace g: de Google
  // Docs: https://support.google.com/merchants/answer/7052112

  return { status: 'not_implemented', message: 'Merchant feed pendiente de implementación' }
})
```

No implementar la lógica ahora, pero dejar el esqueleto para no olvidarlo.

### 6.14 Mover logo de PDFs de Google Drive a Cloudinary

En `generatePdf.ts` hay:

```typescript
const LOGO_URL = 'https://lh3.googleusercontent.com/d/1LoKrBHe5pLXYdXDAhNdMTiP4Xkm_jDbD'
```

Esto depende de que un archivo en Google Drive siga siendo público. Google cambia URLs, bloquea hotlinking, o el dueño cambia permisos. Si eso pasa, todos los PDFs salen sin logo.

**Solución:** Subir el logo a Cloudinary (que ya se usa para todo lo demás) o copiarlo como asset local en `public/logo.png`. Cambiar la URL en generatePdf.ts:

```typescript
// Opción A — Cloudinary (preferida):
const LOGO_URL = 'https://res.cloudinary.com/djhcqgyjr/image/upload/v1/tracciona/logo.png'

// Opción B — Asset local:
const LOGO_URL = '/logo.png' // Servido desde /public/logo.png
```

### 6.15 Eliminar console.error en useUserChat.ts

En `useUserChat.ts` hay:

```typescript
catch (err) {
  console.error('Error marking messages as read:', err)
}
```

Mismo problema que el console.log del plugin de auth (6.1). Eliminar o reemplazar con un handler silencioso. Cuando se implemente Sentry o un servicio de logging, redirigir ahí.

### 6.16 Unificar teléfonos inconsistentes

Hay dos números de teléfono diferentes:

- `vehiculo/[slug].vue`: `+34645779594` hardcodeado para llamar y WhatsApp
- `AppHeader.vue`: `$t('nav.phoneNumber')` → en `es.json` es `+34911234567`

Uno parece real y el otro placeholder. **Solución:**

Definir UN SOLO número en i18n (o en una config central) y que TODOS los componentes lo lean de ahí:

```typescript
// /app/utils/contact.ts
export const CONTACT = {
  phone: '+34XXXXXXXXX', // Número real de la empresa
  whatsapp: '+34XXXXXXXXX', // Puede ser el mismo
  email: 'info@tracciona.com',
}
```

Actualizar `vehiculo/[slug].vue` y `AppHeader.vue` para usar esta fuente única. Si aún no se tiene número real, poner un TODO claro con el mismo placeholder en ambos sitios.

### 6.17 Eliminar redes sociales del header hasta que existan

En `AppHeader.vue` hay links hardcodeados a:

- `https://linkedin.com/company/tankiberica`
- `https://facebook.com/tankiberica`

Si esos perfiles no existen, el usuario hace clic y ve un 404 de LinkedIn/Facebook. Peor imagen que no tener iconos.

**Solución:** Comentar o eliminar los iconos de redes sociales del header. Cuando se creen los perfiles reales de Tracciona (Paso 9.3), añadirlos de vuelta con las URLs correctas:

```typescript
// Condicional: solo mostrar si la URL existe
const socialLinks = [
  // { icon: 'linkedin', url: 'https://linkedin.com/company/tracciona' }, // Descomentar cuando exista
  // { icon: 'facebook', url: 'https://facebook.com/tracciona' }, // Descomentar cuando exista
]
```

### 6.18 Internacionalizar página de error

`error.vue` tiene textos hardcodeados en español: "Página no encontrada", "Error del servidor", "Ver catálogo". Un usuario con idioma inglés ve la página de error en español.

**Solución:** Usar `$t()` como el resto de la app. Como `error.vue` es un componente fuera del layout normal, verificar que el plugin de i18n está disponible en ese contexto:

```typescript
// En error.vue, cambiar:
// "Página no encontrada" → $t('error.notFound')
// "Error del servidor" → $t('error.serverError')
// "Ver catálogo" → $t('error.backToCatalog')
```

Añadir las keys correspondientes en `es.json` y `en.json`.

**IMPORTANTE**: Con el cambio de i18n strategy a `prefix_except_default` (6.2), un usuario inglés va a llegar a páginas de error con más frecuencia durante la transición. Esto debe estar listo.

### 6.19 Filtrar fetchVehicleFilterValues por categoría

En `useFilters.ts`, para calcular valores únicos de filtros:

```typescript
const { data } = await supabase.from('vehicles').select('filters_json').eq('status', 'published')
```

Esto trae el `attributes_json` (antes `filters_json`) de TODOS los vehículos sin filtrar. Con 50 vehículos no pasa nada, pero con 500+ es un payload pesado en cada cambio de categoría.

**Solución:** Como ya se está renombrando `filters_json` → `attributes_json` y `subcategory_id` → `category_id`, aprovechar para añadir filtro:

```typescript
const { data } = await supabase
  .from('vehicles')
  .select('attributes_json')
  .eq('status', 'published')
  .eq('category_id', activeCategoryId) // ← AÑADIR ESTO
```

Solo una línea extra pero evita problemas de rendimiento cuando crezca el catálogo.

### 6.20 Validar buildProductName con datos vacíos

`buildProductName` puede generar nombres vacíos o sin sentido si un vehículo no tiene tipo, subcategoría, brand o model rellenos. El nombre podría quedar como solo `(2022)` o completamente vacío.

**Solución:** Añadir validación mínima:

```typescript
function buildProductName(vehicle: Vehicle): string {
  const parts = [
    vehicle.subcategory_name, // antes type_name
    vehicle.category_name, // antes subcategory_name
    vehicle.brand,
    vehicle.model,
    vehicle.year ? `(${vehicle.year})` : null,
  ].filter(Boolean)

  // Fallback si no hay datos suficientes
  if (parts.length === 0) return 'Vehículo sin especificar'
  if (parts.length === 1 && parts[0] === `(${vehicle.year})`) {
    return `Vehículo ${vehicle.year}`
  }

  return parts.join(' ')
}
```

---

## PASO 6B: DEUDA TÉCNICA DIFERIDA (NO hacer durante migración — referencia)

Estos problemas están identificados pero NO deben resolverse durante la migración. Requieren más trabajo o tienen dependencias externas. Se documentan aquí para no olvidarlos.

### 6B.1 Nominatim sin fallback robusto (Prioridad: MEDIA)

`useUserLocation` llama a `nominatim.openstreetmap.org` para reverse geocoding. Nominatim tiene rate limiting estricto (1 req/s) y exige identificar la aplicación. Con tráfico real, puede bloquear requests.

**Solución futura (post-lanzamiento):**

- Cachear respuestas de Nominatim en Supabase por coordenadas redondeadas (2 decimales = ~1km precisión)
- O migrar a Google Maps Geocoding API (tiene coste pero es fiable)
- O usar un servicio gratuito con más cuota como LocationIQ

### 6B.2 Favoritos en localStorage (Prioridad: MEDIA)

`useFavorites` usa localStorage. Los favoritos se pierden al cambiar de navegador o limpiar datos. El código tiene un comentario: "Will be migrated to Supabase favorites table in Step 3".

**Solución futura (Step 3 del roadmap):**

- Crear tabla `favorites` en Supabase con `user_id` + `vehicle_id`
- Sincronizar localStorage con Supabase cuando el usuario está autenticado
- Mantener localStorage como fallback para usuarios no autenticados

### 6B.3 Validación servidor en AdvertiseModal (Prioridad: MEDIA)

El formulario de "Anúnciate" valida solo en cliente. Un usuario autenticado puede insertar datos maliciosos directamente vía API de Supabase saltándose la validación Vue.

**Solución futura:**

- Añadir CHECK constraints en la tabla de Supabase (NOT NULL, longitud, formato)
- O crear Edge Function intermediaria que valide antes de insertar
- O crear server route en Nuxt como proxy con validación

### 6B.4 Cloudinary fallback hardcodeado (Prioridad: BAJA)

En `nuxt.config.ts`: `process.env.CLOUDINARY_CLOUD_NAME || 'djhcqgyjr'`. Si alguien clona el repo sin `.env`, tiene acceso de lectura a la cuenta Cloudinary real.

**Acción:** No es urgente (solo lectura, mismo patrón que la anon key de Supabase que es pública por diseño). Tener presente si se cambia a un plan de Cloudinary de pago con assets privados.

### 6B.5 Error boundary global (Prioridad: BAJA)

No hay `app:error` hook ni error boundaries por componente. Un fallo en el chat tumba toda la página en vez de solo el componente del chat.

**Solución futura:**

```typescript
// /app/plugins/error-handler.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:error', (error) => {
    // Log a Sentry cuando se implemente
    console.error('Global error:', error)
  })

  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    // Capturar errores de componentes sin tumbar la app
    console.error('Component error:', error, info)
  }
})
```

---
