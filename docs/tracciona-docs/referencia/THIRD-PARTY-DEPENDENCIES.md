# Third-Party Dependencies

> Risk assessment and migration plans for all external services.
> Last updated: Mar 2026 (verified against codebase).

## Service Dependency Matrix

| Service              | Purpose                        | Plan B                                   | Migration Time | Risk Level |
| -------------------- | ------------------------------ | ---------------------------------------- | -------------- | ---------- |
| Supabase             | DB + Auth + Storage + Realtime | PostgreSQL managed + Auth0               | 2-4 weeks      | High       |
| Cloudflare Pages     | Deploy + CDN + DNS             | Vercel / Netlify                         | 1-2 days       | Low        |
| Stripe               | Payments + Subscriptions       | Paddle / LemonSqueezy                    | 1-2 weeks      | Medium     |
| Anthropic            | AI (primary)                   | OpenAI (automatic fallback via callAI()) | 0 (automatic)  | Low        |
| OpenAI               | AI (fallback)                  | Anthropic (primary provider)             | 0 (automatic)  | Low        |
| Cloudinary           | Image hosting + transforms     | CF Images (partially configured)         | 1-2 days       | Low        |
| Resend               | Transactional email            | SendGrid / Mailgun                       | 1 day          | Low        |
| GitHub               | Repository + CI/CD + Actions   | GitLab / Bitbucket (mirror configured)   | 1-2 days       | Low        |
| Backblaze B2         | Backup storage                 | AWS S3 / Wasabi                          | 1 hour         | Low        |
| Cloudflare Turnstile | CAPTCHA / bot protection       | hCaptcha / reCAPTCHA                     | 2-4 hours      | Low        |
| Meta (WhatsApp)      | WhatsApp Business API          | Twilio WhatsApp                          | 1-2 weeks      | Medium     |
| Google Fonts         | Typography (Inter)             | Self-hosted fonts                        | 1 hour         | Low        |
| Google Analytics     | Web analytics                  | Plausible / Umami                        | 1-2 days       | Low        |

## Automatic Failovers (Already Configured)

1. **AI Provider**: Anthropic (primary) -> OpenAI (fallback) via `callAI()` in `server/services/aiProvider.ts` with 3 presets: realtime (8s timeout), background (30s), deferred (60s)
2. **Image Pipeline**: Cloudinary (default) -> CF Images via `IMAGE_PIPELINE_MODE` env var in `server/services/imageUploader.ts`
3. **Backups**: Multi-tier (daily/weekly/monthly) to Backblaze B2 via `scripts/backup-multi-tier.sh`
4. **Repository**: GitHub (primary) -> Bitbucket (mirror) via `.github/workflows/mirror.yml`

## Manual Failover Procedures

### Supabase Outage (Critical)

1. Check https://status.supabase.com for ETA
2. If prolonged (>1h), activate maintenance page
3. If >4h, begin migration to self-hosted PostgreSQL:
   - Restore from latest B2 backup
   - Point DNS to new database
   - Update env vars in Cloudflare Pages

### Stripe Outage

1. Display "payments temporarily unavailable" banner
2. Queue subscription events for retry
3. No data loss — Stripe handles catch-up via webhooks

### Cloudflare Pages Outage

1. Failover DNS to Vercel deployment
2. Push to Vercel via `vercel deploy --prod`
3. Update Supabase auth redirect URLs

## Vendor Lock-in Assessment

| Area            | Lock-in Level | Notes                                                                                |
| --------------- | ------------- | ------------------------------------------------------------------------------------ |
| Database schema | Low           | Standard PostgreSQL, no Supabase-specific extensions                                 |
| Auth            | Medium        | Supabase Auth with RLS. Migration requires auth provider swap + user re-verification |
| File storage    | Low           | Standard S3-compatible API                                                           |
| Edge functions  | Low           | Using Nuxt server routes, not Supabase Edge Functions                                |
| Realtime        | Low           | Only used for admin notifications, easy to replace                                   |
| RLS policies    | Medium        | 60+ policies tied to Supabase auth.uid(). Would need adaptation                      |

## Review Schedule

- Quarterly: Check service pricing changes
- Semi-annually: Test failover procedures
- Annually: Evaluate alternative services
