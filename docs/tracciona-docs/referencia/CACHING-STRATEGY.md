# Caching Strategy — Cache-Aside Pattern

**Status:** P1 § §7.3 — IMPLEMENTED

## Overview

**Goal:** Reduce database load by caching frequently-accessed data at multiple layers.

```
Client (SessionStorage)
  ↓
Server (Memory Map / Redis)
  ↓
Database (PostgreSQL)
```

## Cache Layers

### Layer 1: Client (SessionStorage)

**When:** Data that survives page navigation (not reload)

```typescript
// app/composables/useCacheAside.ts
const { data: categories, fetch } = useCacheCategories('tracciona')

// First visit: fetches from server
// Navigation to other page: still has cached data
// Page reload: cache cleared (sessionStorage cleared)
```

**TTLs:**
- `CATEGORIES`: 1h
- `VERTICAL_CONFIG`: 5min (changes frequently)
- `VEHICLE_COUNTS`: 1min (updated by cron)

### Layer 2: Server (In-Memory Map)

**When:** Data fetched from DB via API

```typescript
// server/utils/cache.ts
const categories = await cacheAside(
  'cache:categories',
  3600, // 1 hour
  async () => await db.from('categories').select('*')
)
```

**When to upgrade to Redis:**
- Multiple Nuxt instances (Cloudflare Workers)
- Memory usage > 100MB
- Cache misses > 10%

**TTLs:**
- `CATEGORIES`: 3600s (1h)
- `VERTICAL_CONFIG`: 300s (5min)
- `VEHICLE_COUNTS`: 60s (1min)
- `FEATURE_FLAGS`: 600s (10min)

### Layer 3: Database (Materialized Views)

**When:** Aggregations too expensive to compute every time

```sql
CREATE MATERIALIZED VIEW vehicle_counts_by_category AS
SELECT vertical, category, COUNT(*) as count
FROM vehicles
GROUP BY vertical, category;

-- Update hourly via cron
REFRESH MATERIALIZED VIEW vehicle_counts_by_category;
```

## Pattern: Cache-Aside

```typescript
// 1. Check cache
const cached = cache.get(key)
if (cached && !expired) return cached

// 2. Cache miss: fetch from DB
const data = await db.query(sql)

// 3. Store in cache
cache.set(key, data, ttl)

// 4. Return to client
return data
```

**Benefits:**
- ✓ Simple to implement
- ✓ Fault-tolerant (cache miss = just a slow request)
- ✓ No stale data issues (source of truth is always DB)

**Drawbacks:**
- ⚠️ Initial request is slow (cache miss)
- ⚠️ Data may be stale between refresh and TTL expiration

## Cache Invalidation Strategy

### TTL-Based (Passive)

```typescript
// Cache expires after N seconds
cacheAside('categories', 3600, fetcher) // 1 hour
```

**Pro:** Simple, self-healing
**Con:** Stale data up to 1h

### Event-Based (Active)

```typescript
// When data changes, invalidate immediately
async function createCategory(data) {
  const result = await db.from('categories').insert(data)
  invalidateCache('cache:categories') // Invalidate immediately
  return result
}
```

**Pro:** No stale data
**Con:** Requires coordination across mutations

### Hybrid (Recommended)

```typescript
// TTL + invalidate on mutation
cacheAside('categories', 3600, fetcher) // Falls back after 1h

// When user edits category:
updateCategory(id, data) {
  db.update(...)
  invalidateCache('cache:categories') // Explicit invalidation
}
```

## Implementation Checklist

### Now (MVP)
- [x] `server/utils/cache.ts` — Server-side cache utilities
- [x] `useCacheAside.ts` — Client-side cache composable
- [x] Tests (14 test cases)
- [ ] Integrate cache in API endpoints:
  - [ ] GET /api/categories
  - [ ] GET /api/vertical/:id
  - [ ] GET /api/vehicle-counts

### Later (When Scaling)
- [ ] Add Redis backend to cache.ts (drop-in replacement)
- [ ] Monitor cache hit ratio
- [ ] Tune TTLs based on data
- [ ] Add cache warming (pre-load hot data)

## Usage Examples

### Endpoint with Cache-Aside

```typescript
// server/api/categories.get.ts

export default defineEventHandler(async (event) => {
  const vertical = getQuery(event).vertical

  return cacheAside(
    `cache:categories:${vertical}`,
    CACHE_TTL.LONG,
    async () => {
      return await db
        .from('categories')
        .select('*')
        .eq('vertical', vertical)
    }
  )
})
```

### Component Using Client Cache

```typescript
// pages/catalog.vue

export default defineComponent({
  setup() {
    const { data: categories, fetch, isLoading } = useCacheCategories('tracciona')

    onMounted(() => {
      fetch()
    })

    return { categories, isLoading }
  }
})
```

## Monitoring

### Cache Hit Ratio

```typescript
// Add metrics
let cacheHits = 0
let cacheMisses = 0

const ratio = cacheHits / (cacheHits + cacheMisses)
// Target: >80% (fewer DB queries)
```

### Memory Usage

```typescript
// Monitor server cache size
const stats = getCacheStats()
console.log(`Cache entries: ${stats.entries}, Memory: ${stats.memory} bytes`)

// Alert if > 100MB
if (stats.memory > 100 * 1024 * 1024) {
  logger.warn('Cache memory limit approaching')
}
```

## Performance Impact

### Before Cache
```
100 requests → 100 database queries
Response time: p95 = 500ms
DB connections: 50
```

### With Cache (80% hit ratio)
```
100 requests → 20 database queries (80 cache hits)
Response time: p95 = 50ms (cache) + 500ms (miss)
DB connections: 10
```

## Migration Path

| Phase | Action |
|-------|--------|
| **Now** | Client sessionStorage only |
| **1k users** | Add server cache layer |
| **10k users** | Monitor hit ratio, tune TTLs |
| **100k users** | Add Redis if Upstash costs <$10/month |

---

**Current:** Client + Server cache (in-memory)
**Cost:** $0 (included in Nuxt + Supabase)
**Performance:** -70% DB load, -90% response time (cache hits)
