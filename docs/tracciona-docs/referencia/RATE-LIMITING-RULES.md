# Rate Limiting Rules — Tracciona

**Status:** Implemented (in-memory for dev/test; Cloudflare WAF for production)
**Last updated:** 2026-03-13
**Related:** `server/middleware/rate-limit.ts`, `server/utils/rateLimit.ts`, `RATE-LIMITING-DISTRIBUTED.md`

---

## Overview

Rate limiting protects Tracciona from:
- Credential stuffing on auth endpoints
- Lead spam from bots
- Stripe checkout abuse
- AI generation cost abuse (`/api/generate-description`)
- Account deletion brute force

**Architecture:**
- **Development/test:** In-memory `Map` in `server/middleware/rate-limit.ts` (enabled via `ENABLE_MEMORY_RATE_LIMIT=true`)
- **Production:** Cloudflare WAF (stateless Workers cannot share in-memory state across instances)
- **Distributed upgrade path:** Redis/Upstash when multi-instance needed — see `RATE-LIMITING-DISTRIBUTED.md`

---

## Rules by Endpoint

### Specific Endpoint Rules

| Endpoint pattern | Limit | Window | Methods | Rationale |
|---|---|---|---|---|
| `/api/email/send` | 10 req | 1 min | ALL | Prevent email spam; Resend costs per email |
| `/api/lead*` | 5 req | 1 min | POST, PUT, PATCH | Prevent lead spam / fake leads |
| `/api/stripe/*` | 20 req | 1 min | ALL | Protect Stripe checkout flow from abuse |
| `/api/account/delete` | 2 req | 1 min | ALL | Account deletion is destructive; prevent accidental loops |

### Default Rules

| Endpoint | Limit | Window | Methods | Rationale |
|---|---|---|---|---|
| `/api/*` | 30 req | 1 min | POST/PUT/PATCH/DELETE | General write protection |
| `/api/*` | 200 req | 1 min | GET | Catalog browsing headroom |

---

## Key Dimensions

Rate limiting uses a **composite key** to be effective in multiple scenarios:

```
compositeKey = userOrIpKey + fingerprintKey

userOrIpKey:
  - Authenticated:   user:{uuid}       ← one quota per user, regardless of IP
  - Anonymous:       ip:{ip_address}   ← fallback for unauthenticated

fingerprintKey:
  - fp:{djb2_hash(user-agent + accept-language)}
  - Catches bots rotating IPs with same browser fingerprint
```

**Why user-aware keys:**
- Shared NAT (office / mobile carrier): multiple users share one IP
- Without user-aware keys, one user could exhaust quota for all on that IP
- Authenticated writes use `user:{id}`, reads use `ip:{ip}` (no JWT decode on every GET)

---

## Auto-Ban: 4xx Threshold

Beyond per-endpoint rate limiting, IPs generating excessive 4xx errors are automatically banned:

| Setting | Value | Reasoning |
|---|---|---|
| Window | 5 minutes | Sliding window for recent activity |
| Threshold | 100 errors | 100 4xx in 5min = clear scanner/attacker |
| Ban duration | 30 minutes | Long enough to stop attack, short enough to not break legit users |
| Ban type | `403 Forbidden` | Distinct from 429; signals "you are banned", not "slow down" |

**Implementation:** `rateLimit.ts` → `record4xxError()` + `isIpBanned()`

**Security event:** When ban triggers → `recordSecurityEvent({ type: 'ip_banned' })`

---

## Cloudflare WAF Rules (Production)

Since Cloudflare Workers are stateless (new isolate per request), in-memory rate limiting
is disabled in production. Configure equivalent rules in **CF Dashboard → Security → WAF → Rate limiting rules**:

### Rule 1: Email Spam Protection
```
Rule name: email-send-rate-limit
Expression: http.request.uri.path contains "/api/email/send"
Rate limit: 10 requests per 60 seconds per IP
Action: Block (429) for 60 seconds
```

### Rule 2: Lead Spam Protection
```
Rule name: lead-rate-limit
Expression: http.request.uri.path contains "/api/lead" and http.request.method in {"POST" "PUT" "PATCH"}
Rate limit: 5 requests per 60 seconds per IP
Action: Block (429) for 60 seconds
```

### Rule 3: Stripe Checkout Protection
```
Rule name: stripe-rate-limit
Expression: http.request.uri.path contains "/api/stripe"
Rate limit: 20 requests per 60 seconds per IP
Action: Block (429) for 60 seconds
```

### Rule 4: Account Deletion Protection
```
Rule name: account-delete-rate-limit
Expression: http.request.uri.path eq "/api/account/delete"
Rate limit: 2 requests per 60 seconds per IP
Action: Block (429) for 120 seconds
```

### Rule 5: General POST/PUT/PATCH/DELETE
```
Rule name: api-write-rate-limit
Expression: http.request.uri.path starts_with "/api/" and http.request.method in {"POST" "PUT" "PATCH" "DELETE"}
Rate limit: 30 requests per 60 seconds per IP
Action: Block (429) for 60 seconds
Exclude: paths covered by rules 1-4 (CF evaluates in order, first match wins)
```

### Rule 6: General GET
```
Rule name: api-read-rate-limit
Expression: http.request.uri.path starts_with "/api/" and http.request.method eq "GET"
Rate limit: 200 requests per 60 seconds per IP
Action: Block (429) for 30 seconds
```

**CF WAF evaluation order:** Rules are evaluated top-to-bottom. More specific rules should be placed before general ones.

---

## Exemptions

Some cases should bypass or increase limits:

| Case | Rule | Implementation |
|---|---|---|
| Verified dealer (subscription tier ≥ Basic) | Rate limit +500%/hour | Backlog #34 — pending |
| Admin users | No rate limiting | Not yet enforced — rely on CF bypass |
| Cron jobs (CRON_SECRET auth) | No rate limiting | Internal endpoints skip by pattern |
| Health check `/api/health` | No rate limiting | GET, public, low cost |

---

## Headers

Responses include `Retry-After` header (seconds) when rate limited:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 47
Content-Type: application/json

{"statusCode": 429, "error": "Too many requests", "retryAfter": 47}
```

---

## Monitoring & Alerting

Rate limit events are recorded in the centralized security event store:

- `rate_limit_exceeded` → IP exceeded a per-endpoint or default limit
- `ip_banned` → IP triggered auto-ban (>100 4xx in 5 min)

**Admin threat map:** `GET /api/admin/security-events` shows active IPs, event counts, and top paths.

**Log pattern:** `[SECURITY-ALERT] IP exceeded threat threshold` (from `server/plugins/security-alerts.ts`)

---

## Testing

```bash
# Run rate limit tests (unit, no server needed)
npx vitest run tests/security/rate-limiting.test.ts

# Run all security tests
npx vitest run tests/security/

# Enable in-memory rate limiting locally
echo "ENABLE_MEMORY_RATE_LIMIT=true" >> .env.local
```

---

## Related Documentation

- `RATE-LIMITING-DISTRIBUTED.md` — Architecture decision for Redis/Upstash migration
- `CF-WAF-SETUP.md` — Cloudflare WAF configuration walkthrough
- `SECURITY-TESTING.md` — Security testing methodology
- `INCIDENT-RUNBOOK.md` — Response playbook for rate limit incidents
