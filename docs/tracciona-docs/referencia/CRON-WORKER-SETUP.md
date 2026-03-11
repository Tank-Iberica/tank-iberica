# Dedicated Cron Worker — Implementation Guide

**Status:** P1 § §7.4 — Documentado. Implementación pospuesta pending load analysis.

## Problem

Current: Cron jobs corren en API routes (inline en `/api/cron/*.post.ts`)

Issues:
- ❌ Cron jobs compete with user requests for cold start time
- ❌ If cron fails, user requests stall
- ❌ No dedicated monitoring/alerting for cron health
- ❌ Hard to scale independently

## Solution: Dedicated Cloudflare Worker

```
User Requests
  ↓
API Worker (Nuxt on CF Pages)

Scheduled Cron
  ↓
Dedicated Cron Worker (separate CF Worker)
  ├─ 00:00 → run-daily-jobs
  ├─ 06:00 → generate-reports
  ├─ */15min → check-auctions
```

## Architecture

### Current (Inline)
```
Cloudflare Pages [Nuxt Server]
  ├─ API routes
  └─ Cron routes: /api/cron/auto-auction.post.ts
```

### Proposed (Dedicated Worker)
```
Cloudflare Pages [Nuxt Server]
  └─ API routes only

Dedicated Cloudflare Worker [Cron]
  ├─ auto-auction (every 15min)
  ├─ search-alerts (hourly)
  ├─ price-drop (daily 09:00)
  ├─ generate-editorial (weekly)
  └─ dealer-stats (daily 23:00)
```

## Implementation

### Step 1: Create Dedicated Worker

```bash
wrangler generate cron-worker
cd cron-worker
npm install
```

### Step 2: Handler

```typescript
// cron-worker/src/index.ts

import { Router } from 'itty-router'

const router = Router()

// Health check
router.get('/health', () => new Response('OK'))

// Auto-auction (triggered every 15 minutes)
router.post('/auto-auction', async (request) => {
  try {
    const response = await fetch('https://tracciona.com/api/cron/auto-auction', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'X-Cron-Worker': 'true',
      },
    })
    return new Response(JSON.stringify({ status: 'ok' }), { status: 200 })
  } catch (error) {
    console.error('Cron job failed:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})

// Search alerts (hourly)
router.post('/search-alerts', async (request) => {
  return await invokeCronRoute('/api/cron/search-alerts')
})

// Price drop alerts (daily 09:00)
router.post('/price-drop', async (request) => {
  return await invokeCronRoute('/api/cron/price-drop-alert')
})

// Other jobs...
router.post('/generate-editorial', async () => invokeCronRoute('/api/cron/generate-editorial'))
router.post('/dealer-stats', async () => invokeCronRoute('/api/cron/dealer-weekly-stats'))

// Helper
async function invokeCronRoute(path: string) {
  try {
    const response = await fetch(`https://tracciona.com${path}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'X-Cron-Worker': 'true',
      },
    })
    return new Response(JSON.stringify({ status: 'ok' }), { status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

export default {
  fetch: router.handle,
}
```

### Step 3: Scheduled Triggers (wrangler.toml)

```toml
# cron-worker/wrangler.toml

name = "tracciona-cron-worker"
main = "src/index.ts"
compatibility_date = "2024-12-19"

[env.production]
routes = [
  { pattern = "https://cron.tracciona.com/*", zone_name = "tracciona.com" }
]

[[triggers.crons]]
cron = "*/15 * * * *"  # Every 15 minutes
handler = "auto-auction"

[[triggers.crons]]
cron = "0 * * * *"  # Every hour
handler = "search-alerts"

[[triggers.crons]]
cron = "0 9 * * *"  # Daily at 09:00 UTC
handler = "price-drop"

[[triggers.crons]]
cron = "0 0 * * MON"  # Weekly Monday 00:00
handler = "generate-editorial"

[[triggers.crons]]
cron = "0 23 * * *"  # Daily 23:00 UTC
handler = "dealer-stats"
```

### Step 4: Deploy

```bash
wrangler deploy --env production
```

Verify:
```bash
curl https://cron.tracciona.com/health
# Output: OK
```

## Migration Path

### Phase 1 (Now) — Keep inline cron
- [x] Current state: `/api/cron/*.post.ts` routes

### Phase 2 (When inline causes issues)
- [ ] Create dedicated worker (above)
- [ ] Set up scheduled triggers
- [ ] Deploy + test (shadow mode: don't disable inline yet)
- [ ] Monitor: verify both workers produce same results

### Phase 3 (Validated)
- [ ] Disable inline cron routes (404 them)
- [ ] Monitor: alerts should only come from dedicated worker
- [ ] Decommission inline cron code

## Monitoring

### Cloudflare Dashboard
- **Workers** → **Schedules** → View trigger status
- **Analytics** → Requests to cron-worker subdomain

### Logging (Cron Worker)

```typescript
// With structured logging
logger.info('Cron job started', {
  job: 'auto-auction',
  timestamp: new Date().toISOString(),
  worker: 'cron-worker',
})

logger.info('Cron job completed', {
  job: 'auto-auction',
  duration: Date.now() - startTime,
  status: 'success',
})
```

### Alerting

If any cron job fails 3 times in a row:
```typescript
if (failureCount >= 3) {
  await sendAlert({
    severity: 'high',
    message: `Cron job ${jobName} failed 3 times. Check logs.`,
    channel: 'slack', // or email
  })
}
```

## Cost Impact

- Current (inline): $0 (included in Pages)
- Proposed (dedicated): ~$0.50/month (mostly free tier)
  - 1M requests/month: ~$0.50
  - Scheduled execution: $0

## Fallback: Stay Inline

If cron jobs are light (<100ms each):
- ✓ Keep inline (current state)
- ✓ No additional complexity
- ⚠️ Disable if causing P50+ latency spike

Monitor with: `Server-Timing: process;dur=XXX`

---

**Current:** Inline cron ✓
**Recommended:** Dedicated worker when cron jobs consistently >500ms
**Cost:** ~$0.50/month (negligible)
