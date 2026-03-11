# APM Setup — Sentry Performance Monitoring

**Status:** P1 § §7.1 Implementado (Sentry). Datadog pospuesto.

## Decision: Sentry vs Datadog

| Aspecto | Sentry | Datadog | Decision |
|---------|--------|---------|----------|
| **Costo** | Free tier: 5k errors/month + 10GB traces | $0.10/GB/month | **Sentry** (free tier covers MVP) |
| **Setup** | 5 min (DSN only) | 30 min (multiple integrations) | **Sentry** (fast) |
| **Performance Monitoring** | ✓ Built-in (tracesSampleRate) | ✓ Built-in | Empate |
| **Custom Metrics** | ✗ Limited | ✓ Full custom metrics | **Datadog** |
| **Error Tracking** | ✓ Excellent | ✓ Excellent | Empate |
| **Dashboard** | ✓ Clear, focused | ✓ Comprehensive | **Datadog** |
| **Scalability** | ⚠️ Upgrade needed at 100k+ events/month | ✓ Scales well | **Datadog** |

### Decision (made 11-mar):
- **MVP (now → 6 months):** Sentry (free, fast to set up)
- **Post-launch (6+ months, when scaling):** Datadog (full APM suite, custom metrics)
- **Fallback:** Both can be used simultaneously for redundancy

## Current Setup

### .env Configuration

```bash
SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project-id]
```

### plugin/error-handler.ts

```typescript
sentryInit({
  app: nuxtApp.vueApp,
  dsn: config.public.sentryDsn,
  environment: import.meta.dev ? 'development' : 'production',
  tracesSampleRate: 0.1,  // 10% of requests
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
```

**Note:** `tracesSampleRate: 0.1` = 10%. Can be increased to 1.0 for debugging, then reduced to 0.1–0.2 in production.

## Monitoring Checklist

### Daily
- [ ] Sentry Dashboard → **Issues** → Review new errors
- [ ] Filter: `is:unresolved` + `is:new`
- [ ] Resolve false positives, assign high-priority bugs

### Weekly
- [ ] Sentry → **Performance** → Check slow transactions (>1s)
- [ ] Sentry → **Releases** → Verify new release has errors decreasing
- [ ] Check error trend: errors should trend → 0 over time

### Monthly
- [ ] Review quota usage: `Organization Settings` → **Usage**
- [ ] If approaching 5k errors, increase sample rate or upgrade

## Manual Testing

### 1. Send test error to Sentry

```typescript
// In any component or server route:
import { captureException } from '@sentry/vue'

captureException(new Error('Test error from Tracciona'))
```

Visit Sentry dashboard → should see error in ~30s.

### 2. Test performance tracing

```typescript
// In composable or page:
const transaction = Sentry.startTransaction({
  name: 'test-transaction',
  op: 'http.request',
})

setTimeout(() => {
  transaction.finish()
}, 1000)
```

Check Sentry → Performance → should see transaction with 1s duration.

### 3. Check Server-Timing headers

```bash
curl -i https://tracciona.com/api/health | grep -i server-timing
# Output: Server-Timing: db;dur=45, cache;dur=10, total;dur=55
```

These timings are sent to Sentry automatically in performance events.

## Improvement Roadmap

### Now (P1)
- [x] Sentry DSN configured
- [x] Error handler captures exceptions
- [x] Performance traces at 10% sample rate
- [x] Server-Timing headers added
- [ ] Increase tracesSampleRate to 0.5 for debugging (temporary)

### 3 months (P2)
- [ ] Review Sentry data, identify slowest endpoints
- [ ] Add custom annotations to slow transactions
- [ ] Set up Sentry alerts: `alert if error_rate > 1%`
- [ ] Document 3 slowest queries + optimization plan

### 6 months (P2/P3)
- [ ] Evaluate if Datadog needed (if >100k events/month)
- [ ] If yes: integrate Datadog + disable Sentry (or keep both)
- [ ] Set up custom metrics: `requests_per_second`, `db_query_latency`, etc.

### Post-Launch (scaling phase)
- [ ] Full APM stack: Sentry + Datadog + custom Grafana dashboards
- [ ] SLO tracking: p95 latency, error rate, uptime
- [ ] Performance budgets per endpoint

## Alerting Rules (To Configure in Sentry)

### Critical (PagerDuty integration)
```
error_rate > 5% for 10 minutes
```

### High (Slack)
```
error_rate > 1% for 30 minutes
OR
new error appears in production
```

### Medium (GitHub issue)
```
performance regression: avg response time +20% vs last week
```

## Troubleshooting

### Errors not appearing in Sentry
1. Check `SENTRY_DSN` is set in `.env.production`
2. Check `import.meta.dev` correctly distinguishes dev/prod
3. In dev mode: errors still log to console, not sent to Sentry
4. Check browser console for CORS errors on sentry.io

### Sample rate too low (missing important errors)
```typescript
// Increase temporarily for debugging:
tracesSampleRate: 1.0  // 100% of requests

// Or use custom sampler:
tracesSampleRate: (context) => {
  if (context.transactionContext.op === 'http.request') {
    return context.transactionContext.name.includes('stripe')
      ? 1.0 // 100% for payment transactions
      : 0.1 // 10% for others
  }
  return 0.1
}
```

### Budget exceeded
- Reduce `tracesSampleRate` to 0.05 (5%)
- Increase to upgrade plan when needed

---

**Status:** ✓ IMPLEMENTED — Sentry active, monitoring ready. Datadog decision deferred to 6-month mark.
