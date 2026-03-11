# Query Budget — Tracciona

> **Creado:** 2026-03-06 · **Fuente:** pg_indexes sobre Supabase producción (gmnrfuzekbwyzkgsaftv)
> **⚠️ Nota staging:** La BD de staging tiene ~4 filas — los planes EXPLAIN no son representativos del
> comportamiento en producción. Este documento registra los índices disponibles y los targets de rendimiento
> para validar en producción cuando el volumen sea significativo (>1000 vehículos).

---

## Objetivos de rendimiento (SLO)

| Consulta                      | P95 cache-hit | P95 cache-miss | P99 máximo |
|-------------------------------|:-------------:|:--------------:|:----------:|
| Catálogo (listing paginado)   | < 50 ms       | < 300 ms       | 1 000 ms   |
| Detalle vehículo (por slug)   | < 20 ms       | < 100 ms       | 500 ms     |
| Listado dealer (por dealer_id)| < 30 ms       | < 150 ms       | 500 ms     |
| Subastas activas              | < 30 ms       | < 150 ms       | 500 ms     |
| Búsqueda full-text (trigram)  | < 100 ms      | < 500 ms       | 2 000 ms   |
| Historial de precio           | < 20 ms       | < 80 ms        | 300 ms     |
| Reservas activas              | < 20 ms       | < 80 ms        | 300 ms     |
| Health check (light)          | —             | < 5 ms         | 50 ms      |
| Health check (deep)           | —             | < 500 ms       | 2 000 ms   |

> Cache-hit = resultado servido desde SWR en Cloudflare CDN (configura en `nuxt.config.ts → routeRules`).
> Fuente de tiempo: `x-response-time` header en Cloudflare Analytics o logs de Supabase.

---

## Consultas críticas

### Q1 — Catálogo (listing paginado)

```sql
SELECT v.*, d.company_name, d.slug AS dealer_slug, d.logo_url
FROM vehicles v
LEFT JOIN dealers d ON d.id = v.dealer_id
WHERE v.vertical = $1
  AND v.status = 'published'
  AND v.is_online = true
  -- filtros opcionales:
  AND ($2 IS NULL OR v.category_id = $2)
  AND ($3 IS NULL OR v.price BETWEEN $3 AND $4)
  AND ($4 IS NULL OR v.year >= $5)
  AND ($5 IS NULL OR v.location_province = $6)
ORDER BY v.sort_boost DESC, v.created_at DESC
LIMIT 24 OFFSET $7;
```

**Índices usados:**
- `idx_vehicles_vertical_status` (vertical, status) — filtro principal
- `idx_vehicles_is_online` — filtro secundario
- `idx_vehicles_category_id` — si hay filtro de categoría
- `idx_vehicles_price` — si hay filtro de precio
- `idx_vehicles_year` — si hay filtro de año
- `idx_vehicles_location_province` — si hay filtro de provincia
- `idx_vehicles_sort_boost` — ORDER BY
- `dealers_pkey` — JOIN

**Cache SWR:** `/api/catalog**` → no configurado explícitamente (páginas SSR con revalidación). Considerar añadir `swr: 60` para requests sin sesión.

---

### Q2 — Detalle de vehículo (por slug)

```sql
SELECT v.*, d.company_name, d.slug AS dealer_slug, d.logo_url, d.phone, d.whatsapp
FROM vehicles v
LEFT JOIN dealers d ON d.id = v.dealer_id
WHERE v.slug = $1
  AND v.status IN ('published', 'reserved', 'sold');
```

**Índices usados:**
- `vehicles_slug_key` (UNIQUE) — lookup O(log n)
- `dealers_pkey` — JOIN

**Notas:** Único index scan garantizado. La UNIQUE constraint evita ambigüedad.

---

### Q3 — Listado de vehículos de un dealer

```sql
SELECT v.id, v.slug, v.title, v.price, v.status, v.images, v.created_at
FROM vehicles v
WHERE v.dealer_id = $1
  AND v.vertical = $2
ORDER BY v.created_at DESC
LIMIT 50 OFFSET $3;
```

**Índices usados:**
- `idx_vehicles_dealer` (dealer_id) — filtro principal
- `idx_vehicles_vertical` o `idx_vehicles_vertical_status` — filtro vertical
- `idx_vehicles_status_created` — ORDER BY si se filtra por status

---

### Q4 — Subastas activas

```sql
SELECT a.*, v.title, v.images, v.slug
FROM auctions a
JOIN vehicles v ON v.id = a.vehicle_id
WHERE a.vertical = $1
  AND a.status IN ('upcoming', 'active')
ORDER BY a.ends_at ASC;
```

**Índices usados:**
- `idx_auctions_vertical` (vertical)
- `idx_auctions_status` (status, ends_at) — composite: filtro + sort
- `idx_auctions_vehicle` (vehicle_id) → JOIN → `vehicles_pkey`

---

### Q5 — Búsqueda full-text por marca (trigram)

```sql
SELECT v.id, v.slug, v.title, v.brand, v.price, v.images
FROM vehicles v
WHERE v.vertical = $1
  AND v.status = 'published'
  AND v.brand % $2  -- similarity operator
ORDER BY similarity(v.brand, $2) DESC, v.sort_boost DESC
LIMIT 20;
```

**Índices usados:**
- `idx_vehicles_brand_trgm` (GIN, gin_trgm_ops) — búsqueda por similaridad
- `idx_vehicles_vertical_status` — pre-filtro

**Notas:** Requiere extensión `pg_trgm` (instalada). Para búsquedas full-text más amplias (title, description) se recomienda añadir un índice GIN adicional sobre `to_tsvector('spanish', title || ' ' || description)`.

---

### Q6 — Vehículos destacados (homepage)

```sql
SELECT v.id, v.slug, v.title, v.price, v.images, v.brand
FROM vehicles v
WHERE v.vertical = $1
  AND v.status = 'published'
  AND v.featured = true
ORDER BY v.sort_boost DESC
LIMIT 6;
```

**Índices usados:**
- `idx_vehicles_featured` (featured = true) — índice parcial, muy selectivo
- `idx_vehicles_vertical_status` — pre-filtro
- `idx_vehicles_sort_boost` — ORDER BY

**Notas:** El índice parcial solo indexa filas con `featured = true`, haciéndolo muy pequeño y eficiente.

---

### Q7 — Historial de precio de un vehículo

```sql
SELECT price, created_at
FROM price_history
WHERE vehicle_id = $1
ORDER BY created_at DESC
LIMIT 30;
```

**Índices usados:**
- `idx_price_history_vehicle_date` (vehicle_id, created_at DESC) — composite perfecto para esta query

---

### Q8 — Reservas activas de un comprador

```sql
SELECT r.*, v.title, v.slug, v.images
FROM reservations r
JOIN vehicles v ON v.id = r.vehicle_id
WHERE r.buyer_id = $1
  AND r.status IN ('pending', 'accepted')
ORDER BY r.created_at DESC;
```

**Índices usados:**
- `idx_reservations_buyer_status` (buyer_id, status) — composite exacto
- `vehicles_pkey` — JOIN

---

### Q9 — Pujas de una subasta

```sql
SELECT b.amount_cents, b.created_at, b.bidder_id
FROM bids b
WHERE b.auction_id = $1
ORDER BY b.amount_cents DESC
LIMIT 20;
```

**Índices usados:** `bids_pkey` para lookup por `auction_id` — verificar si existe `idx_bids_auction`. Si el volumen de pujas crece (>1000/subasta), añadir `CREATE INDEX idx_bids_auction_amount ON bids (auction_id, amount_cents DESC)`.

---

### Q10 — Freshness check (cron)

```sql
SELECT id, slug, updated_at
FROM vehicles
WHERE status = 'published'
  AND updated_at < NOW() - INTERVAL '60 days'
LIMIT 100;
```

**Índices usados:**
- `idx_vehicles_freshness` (status, updated_at) — composite diseñado para este cron

---

## Inventario de índices — tabla `vehicles` (25 total)

| Índice | Tipo | Columnas | Notas |
|--------|------|----------|-------|
| `vehicles_pkey` | UNIQUE BTREE | `id` | PK |
| `vehicles_slug_key` | UNIQUE BTREE | `slug` | Lookup detalle |
| `idx_vehicles_slug` | BTREE | `slug` | Duplica vehicles_slug_key — candidato a eliminar |
| `idx_vehicles_vertical` | BTREE | `vertical` | Filtro por vertical |
| `idx_vehicles_vertical_status` | BTREE | `vertical, status` | Q1 principal |
| `idx_vehicles_status` | BTREE | `status` | Filtro simple |
| `idx_vehicles_status_created` | BTREE | `status, created_at DESC` | Sort por fecha |
| `idx_vehicles_freshness` | BTREE | `status, updated_at` | Q10 cron |
| `idx_vehicles_is_online` | BTREE | `is_online` | Filtro visible |
| `idx_vehicles_dealer` | BTREE | `dealer_id` | Q3 dealer listing |
| `idx_vehicles_category` | BTREE | `category_id` | Filtro categoría |
| `idx_vehicles_category_id` | BTREE | `category_id` | Duplica idx_vehicles_category — candidato a eliminar |
| `idx_vehicles_brand_trgm` | GIN (trgm) | `brand` | Q5 búsqueda fuzzy |
| `idx_vehicles_price` | BTREE | `price` | Filtro precio |
| `idx_vehicles_year` | BTREE | `year` | Filtro año |
| `idx_vehicles_location_country` | BTREE | `location_country` | Filtro país |
| `idx_vehicles_location_region` | BTREE | `location_region` | Filtro región |
| `idx_vehicles_location_province` | BTREE | `location_province` | Filtro provincia |
| `idx_vehicles_listing` | BTREE | `listing_type` | Filtro tipo anuncio |
| `idx_vehicles_featured` | BTREE parcial | `featured WHERE featured=true` | Q6 destacados |
| `idx_vehicles_sort_boost` | BTREE | `sort_boost DESC` | ORDER BY boost |
| `idx_vehicles_verification_level` | BTREE parcial | `verification_level WHERE <> 'none'` | Filtro verificados |
| `idx_vehicles_plate` | BTREE | `plate` | Lookup por matrícula |
| `idx_vehicles_action` | BTREE | `action_id` | FK acciones |
| `idx_vehicles_visible_from` | BTREE | `visible_from` | Early access Pro |

### Duplicados candidatos a eliminar

| A eliminar | Reemplazado por |
|------------|----------------|
| `idx_vehicles_slug` | `vehicles_slug_key` (ya es UNIQUE, más restrictivo) |
| `idx_vehicles_category` | `idx_vehicles_category_id` (mismo nombre de columna) |

> Verificar con `SELECT * FROM pg_stat_user_indexes WHERE relname='vehicles' AND idx_scan=0` en producción
> para confirmar cuáles nunca se usan antes de eliminar.

---

## Inventario de índices — tablas relacionadas

### `dealers`
| Índice | Tipo | Columnas |
|--------|------|----------|
| `dealers_pkey` | UNIQUE BTREE | `id` |
| `dealers_slug_key` | UNIQUE BTREE | `slug` |
| `idx_dealers_slug` | BTREE | `slug` | Duplica dealers_slug_key |
| `idx_dealers_user` | BTREE | `user_id` |
| `idx_dealers_vertical` | BTREE | `vertical` |
| `idx_dealers_sort_boost` | BTREE | `sort_boost DESC` |

### `auctions`
| Índice | Tipo | Columnas |
|--------|------|----------|
| `auctions_pkey` | UNIQUE BTREE | `id` |
| `idx_auctions_vehicle` | BTREE | `vehicle_id` |
| `idx_auctions_status` | BTREE | `status, ends_at` |
| `idx_auctions_vertical` | BTREE | `vertical` |

### `categories` / `subcategories`
| Índice | Tipo | Columnas |
|--------|------|----------|
| `subcategories_pkey1` / `subcategories_pkey` | UNIQUE BTREE | `id` |
| `idx_categories_vertical` | BTREE | `vertical` |
| `idx_categories_status` | BTREE | `status` |
| `idx_categories_slug` | BTREE | `slug` |
| `idx_categories_sort` | BTREE | `sort_order` |
| `idx_subcategories_vertical` | BTREE | `vertical` |
| `idx_subcategories_slug` | BTREE | `slug` |
| `idx_subcategories_sort` | BTREE | `sort_order` |

### `reservations`
| Índice | Tipo | Columnas |
|--------|------|----------|
| `reservations_pkey` | UNIQUE BTREE | `id` |
| `idx_reservations_vehicle_status` | BTREE | `vehicle_id, status` |
| `idx_reservations_buyer_status` | BTREE | `buyer_id, status` |

### `price_history`
| Índice | Tipo | Columnas |
|--------|------|----------|
| `price_history_pkey` | UNIQUE BTREE | `id` |
| `idx_price_history_vehicle_date` | BTREE | `vehicle_id, created_at DESC` |

---

## Índices faltantes identificados

| Query | Problema | Solución recomendada |
|-------|----------|----------------------|
| Q9 (bids) | No hay index en `bids.auction_id` | `CREATE INDEX idx_bids_auction ON bids (auction_id, amount_cents DESC)` |
| Q5 (full-text title) | Solo trigram en `brand`, no en `title` | `CREATE INDEX idx_vehicles_title_trgm ON vehicles USING gin (title gin_trgm_ops)` — añadir cuando haya demanda |
| Catálogo multi-filtro | Sin composite de `vertical+status+price+year` | Materializar con vista si los filtros son frecuentes |

---

## Procedimiento de análisis en producción

Cuando el volumen supere ~1 000 vehículos, ejecutar en la BD de producción:

```sql
-- 1. Ver índices que nunca se usan (candidatos a DROP)
SELECT s.relname AS tabla, s.indexrelname AS indice, s.idx_scan
FROM pg_stat_user_indexes s
JOIN pg_index i ON i.indexrelid = s.indexrelid
WHERE s.relname IN ('vehicles', 'dealers', 'auctions')
  AND s.idx_scan = 0
  AND NOT i.indisprimary
ORDER BY s.relname, s.indexrelname;

-- 2. EXPLAIN ANALYZE de Q1 con datos reales
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT v.id, v.slug, v.title, v.price, v.images
FROM vehicles v
WHERE v.vertical = 'trucks'
  AND v.status = 'published'
  AND v.is_online = true
ORDER BY v.sort_boost DESC, v.created_at DESC
LIMIT 24;

-- 3. Tamaño de índices más grandes
SELECT indexrelname, pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE relname = 'vehicles'
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## Cache SWR configurado en nuxt.config.ts

| Ruta | TTL | Justificación |
|------|-----|---------------|
| `/api/v1/valuation**` | 1 h | Precio de mercado no cambia al minuto |
| `/api/market/valuation**` | 1 h | Idem |
| `/api/widget/**` | 5 min | Embed dealer: balance entre frescura y carga |
| `/api/geo` | ❌ NO cache | Responde con IP de la request (CF header) |
| `/api/health` (light) | ❌ NO cache | Monitorización en tiempo real |

---

*Documento mantenido por el equipo de Tracciona. Actualizar al añadir nuevas queries críticas o modificar índices.*
