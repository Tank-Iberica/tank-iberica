# Security Decisions — Tracciona

Decisions taken on security-sensitive topics, with rationale and alternatives considered.

---

## CSRF Protection Strategy

**Decision (Session 64, Mar 2026):** Maintain `X-Requested-With: XMLHttpRequest` header check.

### Current Implementation

- `server/utils/verifyCsrf.ts` checks for `X-Requested-With: XMLHttpRequest` header
- Applied to all state-changing endpoints that accept browser-originated requests (account delete, credit operations, reservations, Stripe onboarding)
- NOT applied to server-to-server webhooks (Stripe, WhatsApp) or cron endpoints (use CRON_SECRET)

### Why X-Requested-With is Sufficient

1. **SameSite cookies:** Supabase auth tokens use `SameSite=Lax` by default, preventing cross-origin POST requests from carrying the session cookie
2. **CORS policy:** Server middleware restricts `Access-Control-Allow-Origin` — cross-origin requests from malicious sites are blocked by the browser
3. **X-Requested-With header:** Cannot be set by HTML forms or `<img>` tags; only by JavaScript `fetch()`/`XMLHttpRequest` — which are subject to CORS preflight checks
4. **Defense in depth:** The combination of SameSite + CORS + X-Requested-With provides equivalent protection to double-submit cookie patterns

### Alternatives Considered

| Method                         | Pros                                       | Cons                                                                   | Decision |
| ------------------------------ | ------------------------------------------ | ---------------------------------------------------------------------- | -------- |
| **X-Requested-With (current)** | Simple, no state, works with SameSite+CORS | Older pattern                                                          | **Keep** |
| **Double-submit cookie**       | Stateless, industry standard               | Adds complexity, cookie management, no real benefit over current combo | Skip     |
| **Synchronizer token**         | Strongest guarantee                        | Requires server-side state (sessions), doesn't fit Supabase JWT model  | Skip     |
| **Origin header check**        | Simple                                     | Some browsers omit Origin on same-origin; less reliable                | Skip     |

### Endpoints Using verifyCsrf

- `POST /api/account/delete`
- `POST /api/credits/unlock-vehicle`
- `POST /api/credits/highlight-vehicle`
- `POST /api/credits/unlock-advanced-comparison`
- `POST /api/credits/export-catalog`
- `POST /api/credits/listing-certificate`
- `POST /api/priority-reservations/[id]/respond`
- `POST /api/stripe-connect-onboard`

### Revisit When

- Moving away from Supabase auth (different cookie policy)
- Adding non-browser API consumers that need CSRF exemption
- Adopting server-side sessions (would warrant synchronizer token)

---

## CSP unsafe-inline / unsafe-eval

**Decision (Session 60):** Keep `unsafe-inline` and `unsafe-eval` in CSP. Documented in `server/middleware/security-headers.ts` file header.

- `unsafe-inline` in script-src: Required by Nuxt SSR hydration
- `unsafe-eval` in script-src: Required by Chart.js expression parser (admin only)
- `unsafe-inline` in style-src: Required by Vue scoped styles + SSR inline styles
- Mitigated by: `report-uri` + `Reporting-Endpoints` monitoring CSP violations
- Revisit when: Nuxt 5 / `nuxt-security` module v2+ stable

---

## Rate Limiting Architecture

**Decision:** Cloudflare WAF handles rate limiting in production; in-memory middleware disabled.

- CF Workers are stateless — in-memory counters reset per-invocation
- `ENABLE_MEMORY_RATE_LIMIT=true` enables local development rate limiting
- Production uses 6 CF WAF rules (documented in BACKLOG #200)
- Login brute force: separate server-side DB-backed lockout (`check-lockout.post.ts`)

---

## JWT Signing Algorithm

**Current:** HS256 (Supabase default)
**Future consideration:** RS256 migration (Backlog #156) — requires Supabase Dashboard configuration
