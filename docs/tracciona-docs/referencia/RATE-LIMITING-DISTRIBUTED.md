# Rate Limiting Distribuido — Redis/Upstash Implementation

**Status:** P1 § §7.5 — Documentado. Implementación pospuesta pending traffic validation.

**Current State:** In-memory rate limiting vía Map en `server/middleware/rate-limit.ts` (SESSION-LOCAL, no distribuido).

## Problem

Current implementation:
```typescript
// In-memory Map — works single-instance, FAILS on multi-instance
const rateLimitMap = new Map<string, RateLimitEntry>()
```

When deployed to Cloudflare Pages or multi-region:
- Instance A allows 100 requests
- Instance B has separate limit counter
- Attacker exploits: 100 × N instances = easy bypass

## Solution: Redis / Upstash

### Option A: Upstash (Recommended for MVP)

**Why Upstash:**
- Serverless Redis (no ops burden)
- Pay-per-request (~$0/month for MVP scale)
- Global edge locations (low latency from CF)
- REST API (works from Cloudflare Workers)
- Free tier: 10k commands/day

**Setup:**
1. Create account: https://upstash.com
2. Create Redis DB in closest region
3. Get REST endpoint + token from console
4. Add to `.env.production`:
   ```bash
   UPSTASH_REDIS_REST_URL=https://[name].upstash.io
   UPSTASH_REDIS_REST_TOKEN=[token]
   ```

### Option B: Self-hosted Redis

**Why NOT for MVP:**
- Requires EC2 instance (~$5/month)
- Requires monitoring + backups
- Single point of failure (unless multi-region)

**Use when:** Traffic > 1M requests/day or Upstash costs exceed $50/month.

## Implementation Roadmap

### Phase 1 (Now) — Documentation
- [x] Document decision (Upstash)
- [x] Document setup steps
- [ ] Create `server/utils/redis.ts` client

### Phase 2 (When needed) — Integration
- [ ] Replace in-memory Map with Redis in rate-limit.ts
- [ ] Add Redis tests
- [ ] Verify distributed limit works

### Phase 3 (Scaling) — Optimization
- [ ] Add caching layer: Redis for limits + local LRU for cache
- [ ] Tune TTL + key expiration
- [ ] Monitor Redis usage + costs

## Code Template (when implementing)

```typescript
// server/utils/redis.ts
import { Cluster } from 'redis'

const redis = new Cluster([
  {
    host: process.env.UPSTASH_REDIS_REST_URL,
    port: 443,
    password: process.env.UPSTASH_REDIS_REST_TOKEN,
  }
])

export async function incrementCounter(key: string, ttl: number = 3600) {
  const value = await redis.incr(key)
  if (value === 1) {
    await redis.expire(key, ttl)
  }
  return value
}

export async function getCounter(key: string) {
  return await redis.get(key)
}
```

Then in `rate-limit.ts`:

```typescript
import { incrementCounter } from '~/server/utils/redis'

const limit = 100
const key = `rate-limit:${userOrIp}`
const current = await incrementCounter(key, 3600)

if (current > limit) {
  throw createError({ statusCode: 429 })
}
```

## Monitoring

### Upstash Dashboard
- Monitor commands/day
- Check response times
- Alert if approaching rate limits

### Application Logs
- Track `429` responses per IP
- Alert if any IP consistently hitting limits

## Decision Points

| When | Action |
|------|--------|
| **Now** | Keep in-memory. Works for MVP (<100k req/day). |
| **10k users** | Switch to Upstash. Multi-instance safety. |
| **1M req/day** | Evaluate self-hosted Redis or upgrade plan. |
| **10M req/day** | Self-hosted Redis cluster + dedicated ops. |

## Costs Estimation

| Traffic | Upstash | Self-Hosted |
|---------|---------|-------------|
| 10k req/day | ~$0 (free tier) | N/A |
| 100k req/day | ~$5/month | $5/month (EC2) |
| 1M req/day | ~$50/month | $15/month (t3.medium) |
| 10M req/day | $500+/month | $50/month (c6i.xlarge) |

---

**Current:** In-memory ✓ (MVP scale)
**Recommended:** Migrate to Upstash when multi-instance needed
**Post-MVP:** Evaluate self-hosted Redis at 1M+ req/day
