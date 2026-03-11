# Request Tracing E2E — Implementation Guide

**Objetivo:** Rastrear solicitudes desde cliente → Cloudflare → Nuxt → Supabase para debugging de latencia y errores.

**Status:** P1 § §7.2 — Parcialmente implementado. Estructura lista, falta integraciones finales.

## 1. Architecture

```
Client (Browser)
  ↓ [X-Request-ID, Trace-ID]
Cloudflare Pages (Edge)
  ↓ [X-CF-Request-ID, cf-ray]
Nuxt Server
  ↓ [OpenTelemetry span]
Supabase PostgreSQL
  ↓ [pg_stat_statements, query logs]
```

## 2. Implementation Status

### 2.1 Client → Server Tracing

**Status:** ✓ DONE

- `X-Request-ID` header: generated client-side, passed to all API calls
- `Trace-ID`: OpenTelemetry trace context (W3C format)
- See: `app/composables/useCorrelationId.ts`

```typescript
const traceId = crypto.randomUUID() // W3C Trace Context format
const { $fetch } = useAsyncData(async () => {
  return $fetch('/api/endpoint', {
    headers: {
      'X-Request-ID': traceId,
      'Traceparent': `00-${traceId}-${spanId}-01` // W3C standard
    }
  })
})
```

### 2.2 Cloudflare → Server Tracing

**Status:** ✓ DONE

- `cf-ray`: Cloudflare Ray ID (unique per request)
- `X-Forwarded-For`: Client IP
- `X-CF-Worker-Start-Time`: Edge processing time

See: `server/middleware/request-id.ts` — extracts CF headers

```typescript
const cfRay = getHeader(event, 'cf-ray') // 8a7b2c3d4e5f6g7h-LAX
const cfStartTime = getHeader(event, 'x-cf-worker-start-time')
event.context.cfRay = cfRay
```

### 2.3 Server → Database Tracing

**Status:** ⚠️ PARTIAL

- Supabase Realtime: ✓ ready (connection ID in logs)
- PostgreSQL query logging: ✓ ready
- OpenTelemetry: PENDING (requires @opentelemetry/api + instrumentation)

### 2.4 Aggregated Tracing Dashboard

**Status:** 🟡 PENDING

Need to integrate with:
- **Sentry** (already configured) — automatic performance monitoring
- **Datadog** (optional) — full APM suite
- **Google Cloud Trace** (optional) — lightweight tracing

## 3. Next Steps (Executable Now)

### 3.1 Enable PostgreSQL query logging

```sql
-- Supabase Dashboard → SQL Editor
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = 'on';
ALTER SYSTEM SET log_min_duration_statement = 100; -- log queries > 100ms
SELECT pg_reload_conf();
```

View logs in Supabase Dashboard → Database → Logs → Slow Queries

### 3.2 Add OpenTelemetry to Nuxt

```bash
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto @opentelemetry/exporter-trace-otlp-http
```

Create `server/utils/otel-init.ts`:

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'

const sdk = new NodeSDK({
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
  ],
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT, // e.g., Datadog collector
  }),
})

sdk.start()
process.on('SIGTERM', () => sdk.shutdown())
```

### 3.3 Add correlation ID propagation in all outgoing requests

Already done in `useCorrelationId.ts`. Verify all $fetch calls include headers:

```typescript
const { data } = await $fetch('/api/endpoint', {
  headers: {
    'X-Request-ID': correlationId,
  }
})
```

### 3.4 Enable Sentry Performance Monitoring

Already installed. Verify in `error-handler.ts`:

```typescript
import * as Sentry from '@sentry/vue'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0, // 100% of requests (tune to 0.1 in production)
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
```

Check Sentry Dashboard → Performance → Transactions

## 4. Manual Testing

### 4.1 Trace a request end-to-end

```bash
# Trigger API call with verbose output
curl -v -H "X-Request-ID: test-123" \
  https://tracciona.com/api/health

# Check headers
# Response should include:
#   X-Request-ID: test-123 (echoed back)
#   cf-ray: 8a7b2c-LAX
#   Server-Timing: db;dur=45, cache;dur=10
```

### 4.2 Check Sentry transaction traces

1. Go to Sentry Dashboard → Performance
2. Filter by "GET /api/endpoint"
3. Click on a transaction
4. See: total time, breakdown by operation (http, db, cache)

### 4.3 Check PostgreSQL logs

```bash
# via Supabase CLI
supabase logs postgres --tail 100

# Should show:
# statement: SELECT * FROM vehicles WHERE id = $1; [timing]
# duration: 45.234 ms
```

## 5. Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **W3C Trace Context** (not custom) | Standard format, recognized by all APM tools |
| **Sentry for tracing** (instead of Datadog) | Already integrated, free tier covers P1/P2, no extra cost |
| **PostgreSQL query logs** (not Supabase API) | Native DB logging, no overhead, easy to analyze |
| **100% sample rate initially** (reduce later) | Need data to understand latency patterns before optimization |

## 6. Monitoring SLOs

Track:
- **TTFB** (Time to First Byte): < 100ms (p95)
- **API latency**: < 300ms (p95)
- **DB query latency**: < 50ms (p95)
- **Cache hit ratio**: > 80%

See: `.lighthouserc.js` for CWV budgets

---

**P1 Status:** 3/5 implemented. Next: OpenTelemetry instrumentation + Datadog (optional).
