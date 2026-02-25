# Cloudflare WAF Configuration Guide

> Production rate limiting must be configured in Cloudflare Dashboard because
> Cloudflare Workers/Pages use isolated memory per request — in-memory rate
> limiting is ineffective.

## Rate Limiting Rules

Configure these in **Cloudflare Dashboard > Security > WAF > Rate limiting rules**.

| Rule Name            | Path Pattern           | Method                   | Limit   | Window | Action          |
| -------------------- | ---------------------- | ------------------------ | ------- | ------ | --------------- |
| Email send           | `/api/email/send*`     | POST                     | 10 req  | 1 min  | Block 60s (429) |
| Lead forms           | `/api/lead*`           | POST, PUT, PATCH         | 5 req   | 1 min  | Block 60s (429) |
| Stripe endpoints     | `/api/stripe*`         | ALL                      | 20 req  | 1 min  | Block 60s (429) |
| Account delete       | `/api/account/delete*` | POST, DELETE             | 2 req   | 1 min  | Block 60s (429) |
| API writes (default) | `/api/*`               | POST, PUT, PATCH, DELETE | 30 req  | 1 min  | Block 60s (429) |
| API reads (default)  | `/api/*`               | GET                      | 200 req | 1 min  | Block 60s (429) |

### Step-by-step setup

1. Go to **Cloudflare Dashboard** > select your domain (tracciona.com)
2. Navigate to **Security** > **WAF** > **Rate limiting rules**
3. Click **Create rule** for each rule above
4. Set **Matching criteria**: URI Path contains the pattern + HTTP Method
5. Set **Rate**: requests per period as specified above
6. Set **Action**: Block with 429 status for 60 seconds
7. Set **Counting**: Per IP address
8. Order rules from most specific to least specific

## Managed Rulesets

Enable these Cloudflare Managed Rulesets:

- **Cloudflare Managed Ruleset** — Core WAF protection (SQLi, XSS, RCE)
- **Cloudflare OWASP Core Ruleset** — OWASP ModSecurity rules
- **Cloudflare Leaked Credentials Check** — Detects compromised credentials

### Custom exceptions

Add exceptions for these known patterns:

| Exception               | Reason                                               |
| ----------------------- | ---------------------------------------------------- |
| `/api/stripe/webhook`   | Stripe sends webhook POST with non-standard headers  |
| `/api/whatsapp/webhook` | Meta sends webhook requests with verification tokens |
| `User-Agent: Stripe/*`  | Stripe webhook delivery UA                           |

## Bot Management

If on Cloudflare Pro+:

1. **Security** > **Bots** > Enable **Bot Fight Mode**
2. Configure **Super Bot Fight Mode** if available:
   - Definitely automated: Block
   - Likely automated: Managed Challenge
   - Verified bots: Allow

## IP Access Rules

Block known bad actors at:
**Security** > **WAF** > **Tools** > **IP Access Rules**

## DDoS Protection

Cloudflare provides automatic DDoS protection. Verify it's enabled:
**Security** > **DDoS** > Ensure all protections are "On"

## Related files

- `server/middleware/rate-limit.ts` — In-memory rate limiting (dev only)
- `server/utils/rateLimit.ts` — Rate limit utility functions
- `server/middleware/security-headers.ts` — Security headers (CSP, HSTS, etc.)
- `server/middleware/cors.ts` — CORS configuration
