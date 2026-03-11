# Event Taxonomy — Tracciona Analytics

**Version:** 1.0
**Schema version:** `EVENT_SCHEMA_VERSION = 1` (in `useAnalyticsTracking.ts`)
**Table:** `analytics_events`
**Last updated:** 2026-03-11

---

## Conventions

- **event_type** uses `snake_case`, namespaced with `:` for funnel events
- **entity_type** is the domain object (vehicle, dealer, auction, ad)
- **entity_id** is the UUID of that entity
- **metadata** is JSONB — always flat keys, no nesting beyond 1 level
- **version** field tracks schema version — bump when breaking changes occur

### Breaking vs non-breaking changes

| Change | Breaking? | Action |
|--------|-----------|--------|
| Add new event_type | No | Just add, bump minor |
| Add optional metadata field | No | Just add |
| Rename event_type | **Yes** | Bump EVENT_SCHEMA_VERSION, migrate consumers |
| Remove event_type | **Yes** | Deprecate first (1 quarter), then remove |
| Change metadata field type | **Yes** | Bump EVENT_SCHEMA_VERSION |

---

## Event Catalog

### Core Events

| event_type | entity_type | entity_id | metadata | Description |
|------------|-------------|-----------|----------|-------------|
| `vehicle_view` | `vehicle` | vehicle UUID | `{ source?: string, position?: number }` | User views vehicle detail page |
| `vehicle_duration` | `vehicle` | vehicle UUID | `{ duration_seconds: number }` | Time spent on detail page (min 3s) |
| `search_performed` | — | — | `{ category?, subcategory?, price_min?, price_max?, location?, ... }` | User performs catalog search |
| `lead_sent` | `vehicle` | vehicle UUID | `{ dealer_id: string }` | User sends contact/lead to dealer |
| `favorite_added` | `vehicle` | vehicle UUID | — | User adds vehicle to favorites |

### Funnel Events

Funnel events track the buyer journey sequentially. Namespace: `funnel:`.

| event_type | entity_type | entity_id | metadata | Funnel step |
|------------|-------------|-----------|----------|-------------|
| `funnel:search` | — | — | `{ ...filters }` | 1. Search |
| `funnel:view_vehicle` | `vehicle` | vehicle UUID | `{ source?: string }` | 2. View detail |
| `funnel:contact_seller` | `vehicle` | vehicle UUID | `{ dealer_id: string }` | 3. Contact |
| `funnel:reservation` | `vehicle` | vehicle UUID | — | 4. Reserve |

### Ad Events

Tracked by `useAds.ts` and `useAdViewability.ts`.

| event_type | entity_type | entity_id | metadata | Description |
|------------|-------------|-----------|----------|-------------|
| `impression` | `ad` | ad UUID | `{ position: string, source?: string }` | Ad rendered in viewport |
| `viewable_impression` | `ad` | ad UUID | `{ position: string }` | Ad visible ≥1s (IAB standard) |
| `click` | `ad` | ad UUID | `{ position: string }` | User clicks ad |
| `phone_click` | `ad` | ad UUID | `{ position: string }` | User clicks phone CTA |
| `email_click` | `ad` | ad UUID | `{ position: string }` | User clicks email CTA |

---

## Schema (analytics_events table)

```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
event_type  TEXT NOT NULL
entity_type TEXT
entity_id   TEXT
metadata    JSONB
session_id  TEXT
user_id     UUID REFERENCES auth.users
vertical    TEXT NOT NULL
version     INTEGER NOT NULL DEFAULT 1
created_at  TIMESTAMPTZ DEFAULT now()
```

### Indexes

- `idx_analytics_events_type_created` — (event_type, created_at DESC)
- `idx_analytics_events_entity` — (entity_type, entity_id) WHERE entity_id IS NOT NULL
- `idx_analytics_events_vertical_created` — (vertical, created_at DESC)

---

## Consumers

| Consumer | Events consumed | Purpose |
|----------|----------------|---------|
| `VehicleAnalyticsFunnel.vue` | `vehicle_view`, `favorite_added`, `lead_sent` | Dealer vehicle funnel |
| `useAdminMetricsActivity.ts` | All core events | Admin dashboard activity metrics |
| `useAdminPublicidad.ts` | Ad events | Ad performance dashboard |
| `cron/favorite-price-drop.post.ts` | `favorite_added` (indirect) | Price drop alerts |
| Market reports | Aggregated counts | Monthly/weekly reports |

---

## Adding a new event

1. Add the event_type to this document with full metadata schema
2. Add a typed helper function in `useAnalyticsTracking.ts`
3. Add the event constant to `ANALYTICS_EVENTS` map
4. Update consumers if needed
5. No schema version bump needed for new events (non-breaking)

---

## Deprecation log

| event_type | Deprecated | Removed | Replacement |
|------------|-----------|---------|-------------|
| _(none yet)_ | — | — | — |
