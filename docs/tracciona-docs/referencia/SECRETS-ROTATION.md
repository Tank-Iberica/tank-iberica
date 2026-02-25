# Secrets Rotation Guide

> All secrets should be rotated at least annually. Critical secrets (API keys
> with billing impact) should be rotated every 6 months.

## Secret Inventory

| Secret                      | Location                             | Rotation Frequency | Last Rotated  |
| --------------------------- | ------------------------------------ | ------------------ | ------------- |
| `SUPABASE_SERVICE_ROLE_KEY` | Cloudflare Pages env, GitHub Secrets | Annual             | Initial setup |
| `SUPABASE_URL`              | Cloudflare Pages env, GitHub Secrets | Never (static)     | N/A           |
| `ANTHROPIC_API_KEY`         | Cloudflare Pages env                 | 6 months           | Initial setup |
| `OPENAI_API_KEY`            | Cloudflare Pages env                 | 6 months           | Initial setup |
| `STRIPE_SECRET_KEY`         | Cloudflare Pages env                 | Annual             | Initial setup |
| `STRIPE_WEBHOOK_SECRET`     | Cloudflare Pages env                 | Annual             | Initial setup |
| `WHATSAPP_API_TOKEN`        | Cloudflare Pages env                 | Annual             | Initial setup |
| `WHATSAPP_PHONE_NUMBER_ID`  | Cloudflare Pages env                 | Never (static)     | N/A           |
| `WHATSAPP_VERIFY_TOKEN`     | Cloudflare Pages env                 | Annual             | Initial setup |
| `RESEND_API_KEY`            | GitHub Secrets                       | Annual             | Initial setup |
| `CRON_SECRET`               | Cloudflare Pages env, GitHub Secrets | Annual             | Initial setup |
| `TURNSTILE_SECRET_KEY`      | Cloudflare Pages env                 | Annual             | Initial setup |
| `CLOUDINARY_CLOUD_NAME`     | nuxt.config.ts (public)              | Never (static)     | N/A           |
| `CLOUDINARY_UPLOAD_PRESET`  | nuxt.config.ts (public)              | Annual             | Initial setup |
| `BACKBLAZE_KEY_ID`          | GitHub Secrets                       | Annual             | Initial setup |
| `BACKBLAZE_APPLICATION_KEY` | GitHub Secrets                       | Annual             | Initial setup |

## Rotation Procedures

### Supabase Service Role Key

1. Go to **Supabase Dashboard** > **Settings** > **API**
2. Click **Generate new key** under Service Role Key
3. Copy the new key
4. Update in:
   - Cloudflare Pages: **Settings** > **Environment variables** > `SUPABASE_SERVICE_ROLE_KEY`
   - GitHub Secrets: **Settings** > **Secrets** > `SUPABASE_SERVICE_ROLE_KEY`
5. Deploy to apply changes
6. Verify: `curl -H "apikey: NEW_KEY" https://PROJECT.supabase.co/rest/v1/`
7. Old key is automatically invalidated

### Anthropic / OpenAI API Keys

1. Go to **console.anthropic.com** or **platform.openai.com** > **API Keys**
2. Create a new API key with descriptive name (e.g., `tracciona-prod-2026-03`)
3. Update in Cloudflare Pages env vars
4. Deploy
5. Verify: check that AI-powered features work (WhatsApp processing, descriptions)
6. Delete the old key from the provider's dashboard

### Stripe Keys

> **Critical:** Stripe key rotation requires careful coordination.

1. Go to **Stripe Dashboard** > **Developers** > **API keys**
2. Click **Roll key** on the secret key
3. Stripe provides a grace period where both old and new keys work
4. Update `STRIPE_SECRET_KEY` in Cloudflare Pages env vars
5. Deploy
6. Verify: test a checkout flow
7. After confirming, expire the old key in Stripe Dashboard

For webhook secret:

1. Go to **Stripe Dashboard** > **Developers** > **Webhooks**
2. Click on the endpoint > **Reveal signing secret** > **Roll secret**
3. Update `STRIPE_WEBHOOK_SECRET` in Cloudflare Pages env vars
4. Deploy
5. Verify: trigger a test webhook event

### CRON_SECRET

1. Generate a new random secret: `openssl rand -hex 32`
2. Update in:
   - Cloudflare Pages env vars
   - GitHub Secrets (used by cron workflows)
3. Deploy
4. Verify: trigger a cron job manually

### Turnstile Secret Key

1. Go to **Cloudflare Dashboard** > **Turnstile** > your widget
2. Click **Rotate secret key**
3. Update `TURNSTILE_SECRET_KEY` in Cloudflare Pages env vars
4. Deploy
5. Verify: test form submissions that use Turnstile

### WhatsApp API Token

1. Go to **Meta Developer Portal** > your app > **WhatsApp** > **API Setup**
2. Generate a new permanent token or extend the temporary one
3. Update `WHATSAPP_API_TOKEN` in Cloudflare Pages env vars
4. Deploy
5. Verify: send a test message

### Resend API Key

1. Go to **resend.com/api-keys**
2. Create a new API key
3. Update in GitHub Secrets: `RESEND_API_KEY`
4. Delete the old key in Resend dashboard

### Backblaze B2 Keys

1. Go to **Backblaze** > **App Keys**
2. Create a new application key with same bucket permissions
3. Update in GitHub Secrets: `BACKBLAZE_KEY_ID` and `BACKBLAZE_APPLICATION_KEY`
4. Delete the old key

## Post-Rotation Checklist

After rotating any secret:

- [ ] Update the "Last Rotated" column in this document
- [ ] Verify the application works (build + smoke test)
- [ ] Delete/expire the old secret from the provider
- [ ] Confirm no errors in Cloudflare Pages deployment logs
- [ ] Monitor error rates for 24 hours after rotation
