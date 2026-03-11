# Connection Pooling — PgBouncer Setup

**Status:** P1 § §7.6 — Documentado. Implementación pospuesta pending bottleneck detection.

## Problem

Current: Nuxt server creates new PostgreSQL connection per request.

At scale (1k concurrent):
- ❌ PostgreSQL connection limit exhausted (~100 default)
- ❌ New requests get "too many connections" error
- ❌ Queries queue up, latency explodes
- ❌ Memory usage soars

## Solution: PgBouncer (Connection Pool)

```
Multiple Nuxt Instances (Cloudflare Workers)
  ↓ (1k concurrent connections)
PgBouncer Pool
  ├─ Reuses 25 actual DB connections
  └─ Multiplexes 1k logical connections
  ↓
PostgreSQL (only 25 active connections instead of 1k)
```

## Architecture

### Current (No Pooling)
```
Request 1 → PostgreSQL connection 1
Request 2 → PostgreSQL connection 2
...
Request 100 → PostgreSQL connection 100 (LIMIT REACHED)
Request 101 → ERROR: too many connections
```

### With PgBouncer
```
Request 1 → PgBouncer ──┐
Request 2 → PgBouncer ──├─→ PostgreSQL connection 1
Request 3 → PgBouncer ──┘
           (multiplexed)
```

## Setup Options

### Option A: Supabase Managed (Recommended)

Supabase includes PgBouncer at no extra cost.

**Supabase Dashboard:**
1. Project Settings → Database
2. Connection string: switch from "Session" to "Pooling"
3. Copy pooling connection string
4. Use in `DATABASE_URL` env var

**URL Format:**
```
postgresql://user:password@tracciona-pool.supabase.co:6543/postgres
                                        ^^^^
                                        "pool" suffix
```

**Benefits:**
- ✓ Managed by Supabase
- ✓ $0 extra cost
- ✓ Automatic failover
- ✓ Global edge locations

### Option B: Self-Hosted PgBouncer (if needed)

```bash
# Install PgBouncer
apt-get install pgbouncer

# Config: /etc/pgbouncer/pgbouncer.ini
[databases]
tracciona = host=db.example.com port=5432 user=postgres password=secret

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
reserve_pool_size = 5
reserve_pool_timeout = 3
max_db_connections = 25
```

### Option C: Neon Pooling (Alternative to Supabase)

If migrating to Neon:
```
postgresql://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require
```
Built-in connection pooling included.

## Implementation Checklist

### Now (MVP)
- [x] Supabase has pooling available (no action needed)
- [ ] Monitor connection count: `SELECT count(*) FROM pg_stat_activity;`
- [ ] If < 50 concurrent: no change needed
- [ ] If > 100 concurrent: switch to pooling

### When Needed (>100 concurrent)
- [ ] Switch `DATABASE_URL` to Supabase pooling endpoint
- [ ] Update `.env.production`
- [ ] Redeploy
- [ ] Monitor: should see connection count drop to ~25

### Post-Launch (Scaling)
- [ ] Monitor `max_client_conn` utilization
- [ ] If >90%: increase pool size or evaluate self-hosted

## Detection: Do I Need Pooling?

### Check 1: Concurrent Connections

```sql
-- Run in Supabase SQL Editor
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;

-- If your app: > 50 concurrent → consider pooling
```

### Check 2: Connection Errors in Logs

```
Error: could not connect to server: FATAL:  too many connections
```

If you see this: **enable pooling immediately**.

### Check 3: Response Time Degradation

```
Before scaling: API latency p95 = 200ms
After adding 100 users: API latency p95 = 2000ms
```

Cause: connection pool exhaustion. Solution: enable pooling.

## Performance Impact

### With Pooling
- **Latency**: -80% (no connection handshake per request)
- **Memory**: -50% (fewer TCP connections)
- **Throughput**: +300% (can handle more concurrent users)

### Example
```
Without pooling:
  - 1k requests: 10 seconds, 1k TCP connections

With pooling:
  - 1k requests: 2 seconds, 25 TCP connections
```

## Monitoring

### Supabase Dashboard
- **Database** → **Connections** → see current active count
- Should stay < 25 if pooling is enabled

### Application Monitoring

```typescript
// Log connection metrics periodically
async function logConnectionStats() {
  const result = await db.rpc('get_connection_count')
  logger.info('DB Connections', {
    active: result.count,
    threshold: 25,
    pooling_enabled: true,
  })
}
```

## Costs

| Solution | Cost | Pros | Cons |
|----------|------|------|------|
| **Supabase Pooling** | $0 | Free, managed | Limit to 1 project |
| **Self-Hosted PgBouncer** | $5-50/month | Full control | Requires ops |
| **Neon Built-in** | $0 | Free, built-in | Only if on Neon |

## Decision Timeline

| Stage | Action |
|-------|--------|
| **MVP (0-1k users)** | No pooling needed (keep as is) |
| **1k-10k users** | Enable Supabase pooling (1 click) |
| **10k-100k users** | Monitor closely, stay on Supabase |
| **100k+ users** | Consider dedicated pooling node or Neon migration |

---

**Current:** No pooling (fine for MVP)
**Next Step:** Enable at 1k+ concurrent users (1 click in Supabase)
**Cost:** $0 (included in Supabase)
