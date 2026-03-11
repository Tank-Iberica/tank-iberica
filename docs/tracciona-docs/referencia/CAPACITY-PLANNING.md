# Capacity Planning — Tracciona / TradeBase

> **Date:** 2026-03-07
> **Stack:** Nuxt 3 + Supabase (Postgres) + Cloudflare Pages + Cloudinary + Stripe
> **Current tier:** Free/Pro Supabase, CF Pages Free, Cloudinary Free

---

## Current Architecture

```
Client → CF Pages (CDN + SSR) → Supabase (Postgres + Auth + Realtime)
                               → Cloudinary (images)
                               → Stripe (payments)
                               → Resend (email)
                               → WhatsApp Cloud API
```

---

## Tier Projections

| Tier | Users/month | Vehicles | Dealers | Bottleneck | Action | Monthly cost |
|---|---|---|---|---|---|---|
| **Current** | <10K | <500 | <50 | None | Option A (0€ infra) | $0 |
| **Tier 1** | 10K-50K | 500-2K | 50-200 | Search latency | Monitor p95 search, consider pg_trgm tuning | $0 |
| **Tier 2** | 50K-100K | 2K-10K | 200-500 | Cron polling delay, DB connections | CF Queues ($5), Supabase Pro ($25) | ~$30/mo |
| **Tier 3** | 100K-500K | 10K-50K | 500-2K | Search, connection pooling | Meilisearch Cloud ($29), PgBouncer, Supabase Team ($599) | ~$650/mo |
| **Tier 4** | 500K-1M | 50K-200K | 2K-5K | Supabase limits, CDN | CF Pro ($20), read replicas, image CDN optimization | ~$900/mo |
| **Tier 5** | 1M-10M | 200K+ | 5K+ | Everything | CF Business, Supabase Enterprise, dedicated search, edge caching | Custom |

---

## Component-Level Analysis

### 1. Database (Supabase Postgres)

| Metric | Current | Limit (Free) | Limit (Pro) | Limit (Team) |
|---|---|---|---|---|
| DB size | ~50MB | 500MB | 8GB | 100GB |
| Connections | ~5 | 60 | 200 direct + Supavisor | 300 + pooler |
| Monthly API requests | ~10K | 500K | Unlimited | Unlimited |
| Realtime connections | ~0 | 200 | 500 | 10K |

**Scaling triggers:**
- DB size >400MB → Supabase Pro
- Connections >50 concurrent → Enable Supavisor pooling
- Query p95 >200ms on catalog → Add composite index or materialized views

**Indexes present (validated 2026-03-07):**
- `idx_vehicles_vertical_status` — catalog listing filter
- `idx_vehicles_fts` — full-text search (GIN)
- `idx_vehicles_search_trgm` — trigram fuzzy search (GIN)
- `idx_vehicles_price`, `idx_vehicles_year` — range filters
- `idx_job_queue_pending` — job worker claims
- `idx_analytics_funnel` — funnel queries

### 2. CDN / Hosting (Cloudflare Pages)

| Metric | Free | Pro ($20/mo) | Business ($200/mo) |
|---|---|---|---|
| Requests/month | Unlimited | Unlimited | Unlimited |
| Custom domains | 100 | 250 | 500 |
| WAF rules | 5 | 20 | 100 |
| Analytics | Basic | Detailed | Full |

**Scaling triggers:**
- Need >5 WAF rules → CF Pro
- Need advanced analytics → CF Pro
- Need custom cache rules by vertical → CF Business

**SWR strategy:** All public GET APIs have `routeRules` SWR configured. Cache hit target: >85%.

### 3. Search

| Approach | Cost | Latency (p95) | Max vehicles | Notes |
|---|---|---|---|---|
| **pg_trgm + FTS** (current) | $0 | <200ms at 10K rows | ~50K | Built into Supabase |
| **Meilisearch Cloud** | $29/mo | <50ms | 1M+ | Dedicated search, typo tolerance |
| **Typesense Cloud** | $25/mo | <30ms | 1M+ | Alternative to Meilisearch |

**Scaling trigger:** Search p95 >200ms consistently with >10K vehicles → migrate to Meilisearch.

### 4. Background Jobs (Postgres Queue)

| Approach | Cost | Throughput | Latency | Notes |
|---|---|---|---|---|
| **Postgres job_queue** (current) | $0 | ~20 jobs/min | 30s polling | Cron-based worker |
| **CF Queues** | $5/mo | 10K msg/s | <1s | Event-driven, no polling |
| **BullMQ + Redis** | $7/mo | 50K msg/s | <100ms | Full-featured, requires Redis |

**Scaling trigger:** Job processing delay >2min consistently → migrate to CF Queues.

### 5. Images (Cloudinary)

| Plan | Credits/mo | Transformations | Storage | Bandwidth |
|---|---|---|---|---|
| Free (current) | 25 | 25K | 25GB | 25GB |
| Plus | $89/mo | 225K | 225GB | 225GB |

**Strategy:** Cloudinary transforms, CF Images for CDN delivery with immutable 30d cache.
**Scaling trigger:** Credits usage >80% → Cloudinary Plus.

### 6. Email (Resend)

| Plan | Emails/month | Cost |
|---|---|---|
| Free | 3,000 | $0 |
| Pro | 50,000 | $20/mo |
| Business | 100,000 | $45/mo |

**Scaling trigger:** Monthly email volume >2,500 → Resend Pro.

---

## Multi-Vertical Scaling

Each new vertical adds:
- 1 row in `vertical_config`
- N rows in `categories` and `subcategories`
- Separate DNS + CF Pages deployment
- Shared Supabase instance (RLS-isolated by `vertical` column)

**Vertical isolation strategy:**
- All tables with user data have `vertical` column
- RLS policies filter by vertical
- Indexes include vertical for query performance
- Separate CF Pages deployment per domain

**When to split DB:**
- Total vehicles >200K across all verticals
- Connection pool >80% utilization
- Consider Neon/Railway for read replicas or vertical-specific DBs

---

## SLO Targets

| Metric | Current | Target (10/10) | Measurement |
|---|---|---|---|
| API p95 (cache hit) | <50ms | <100ms | k6 + CF Analytics |
| API p95 (cache miss) | <200ms | <300ms | k6 |
| Error rate | <0.1% | <0.5% | k6 + structured logs |
| CDN hit ratio | N/A (pre-launch) | >85% | CF Analytics |
| DB pool utilization | <10% | <80% | Supabase dashboard |

---

## Decision Matrix

Use this when deciding whether to scale up:

```
If metric consistently exceeds threshold for >1 week:
  1. Verify with monitoring (not just one-time spike)
  2. Check if query optimization can solve it (cheaper)
  3. If not → upgrade to next tier component
  4. Document decision in CHANGELOG.md
```

---

## Cost Projection Summary

| Users/month | Supabase | CF | Search | Jobs | Images | Email | Total |
|---|---|---|---|---|---|---|---|
| <50K | $0 | $0 | $0 | $0 | $0 | $0 | **$0** |
| 100K | $25 | $0 | $0 | $5 | $0 | $0 | **$30** |
| 500K | $599 | $20 | $29 | $5 | $0 | $20 | **$673** |
| 1M | $599 | $20 | $29 | $7 | $89 | $45 | **$789** |
| 10M | Custom | $200 | $99 | $20 | $249 | $145 | **Custom** |

> **Key insight:** TradeBase can operate at $0 until ~50K users/month. First paid tier is ~$30/mo, well within revenue expectations from dealer subscriptions (29-79€/mo each).
