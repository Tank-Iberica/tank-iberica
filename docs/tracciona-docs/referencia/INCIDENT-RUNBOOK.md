# Incident Runbook — Tracciona / TradeBase

> **Last updated:** 2026-03-07
> **Admin email:** tankiberica@gmail.com
> **Status page:** https://status.supabase.com / https://www.cloudflarestatus.com

---

## Severity Levels

| Level | Description | Response time | Example |
|---|---|---|---|
| **P0** | Service down, all users affected | <15 min | DB down, deploy broken, DDoS |
| **P1** | Major feature broken, many users affected | <1 hour | Payments broken, auth down |
| **P2** | Minor feature broken, workaround exists | <4 hours | Email not sending, image upload fails |
| **P3** | Cosmetic or non-urgent | Next business day | Typo, non-critical UI bug |

---

## Incident 1: Database Down / Supabase Outage

**Severity:** P0
**Detection:** Health check fails (`/api/health` returns non-200), user reports, monitoring alerts

### Steps

1. **Verify scope**
   ```bash
   curl -s https://tracciona.com/api/health | jq .
   ```
   If `database: false` → DB issue confirmed.

2. **Check Supabase status**
   - Visit https://status.supabase.com
   - Check Supabase dashboard: https://supabase.com/dashboard/project/gmnrfuzekbwyzkgsaftv

3. **If Supabase-wide outage:**
   - Wait for Supabase resolution (they handle infra)
   - Post status update on social / internal channel
   - Monitor recovery via health endpoint

4. **If project-specific issue:**
   - Check DB connections in Supabase dashboard → Pooler stats
   - Check if any migration broke something: `supabase db diff`
   - Check recent deploys in CF Pages dashboard
   - If migration caused it → rollback:
     ```bash
     supabase db reset --linked
     ```

5. **Post-incident:**
   - Verify all endpoints healthy
   - Check for data inconsistencies
   - Update STATUS.md with incident timeline

---

## Incident 2: Deploy Broken (500 on Production)

**Severity:** P0
**Detection:** CF Pages deploy notification, user reports, monitoring

### Steps

1. **Verify the broken state**
   ```bash
   curl -sI https://tracciona.com/ | head -5
   curl -s https://tracciona.com/api/health | jq .
   ```

2. **Rollback in Cloudflare Pages**
   - Go to CF Dashboard → Pages → tracciona → Deployments
   - Find the last working deployment
   - Click "Rollback to this deployment"
   - Wait ~30s for propagation

3. **If rollback not available, revert git:**
   ```bash
   git log --oneline -5   # Find last good commit
   git revert HEAD         # Revert bad commit
   git push origin main    # Triggers new deploy
   ```

4. **Investigate root cause:**
   - Check CF Pages build logs for errors
   - Check `git diff HEAD~1` for what changed
   - Run locally: `npm run build` to reproduce

5. **Post-incident:**
   - Fix the root cause in a separate branch
   - Test locally with `npm run build && npm run preview`
   - Deploy fix

---

## Incident 3: Rate Limit Flood / DDoS

**Severity:** P0-P1
**Detection:** CF Analytics spike, slow responses, WAF alerts

### Steps

1. **Enable CF Under Attack Mode**
   - CF Dashboard → tracciona.com → Security → Under Attack Mode → ON
   - This adds a JS challenge for all visitors

2. **Check WAF analytics**
   - CF Dashboard → Security → Events
   - Identify attacking IPs or patterns

3. **Block specific IPs/ranges**
   - CF Dashboard → Security → WAF → Custom Rules
   - Add rule: `ip.src in {bad_ip_range}` → Block

4. **Verify WAF rules are active:**
   | Ruta | Limit | Action |
   |---|---|---|
   | `/api/email/send` | 10 req/min/IP | Block 60s |
   | `/api/stripe/*` | 20 req/min/IP | Block 60s |
   | `/api/account/delete` | 2 req/min/IP | Block 60s |
   | `/api/* (POST/PUT)` | 30 req/min/IP | Block 60s |
   | `/api/cron/*` | Only CF Workers IPs | Block |

5. **If CF free tier WAF insufficient:**
   - Consider upgrading to CF Pro ($20/mo) for advanced WAF
   - Or temporarily enable Supabase-level rate limiting

6. **Post-incident:**
   - Disable Under Attack Mode when resolved
   - Review and tighten WAF rules if needed
   - Document attacking patterns for future prevention

---

## Incident 4: Stripe Webhook Failure

**Severity:** P1
**Detection:** Failed payments not reflected, Stripe dashboard shows webhook failures

### Steps

1. **Check Stripe webhook logs**
   - Stripe Dashboard → Developers → Webhooks → Select endpoint
   - Review failed events — note error codes

2. **Common causes:**
   - **Endpoint URL changed:** Verify webhook URL matches `https://tracciona.com/api/stripe/webhook`
   - **Secret mismatch:** Verify `STRIPE_WEBHOOK_SECRET` env var in CF Pages matches Stripe
   - **Server error:** Check CF Pages deployment logs

3. **Replay failed events**
   - In Stripe Dashboard → Webhooks → Failed events
   - Click "Resend" on each failed event
   - Or bulk retry: Stripe CLI `stripe events resend evt_xxx`

4. **If webhook endpoint is down:**
   - Fix the endpoint code
   - Deploy
   - Replay all failed events from Stripe dashboard

5. **Verify idempotency:**
   - `stripe/webhook.post.ts` checks `event.id` for dedup
   - Safe to replay — duplicates are ignored

6. **Post-incident:**
   - Verify all payments are reflected in DB
   - Check `subscriptions` and `payments` tables for consistency
   - Update CRON_SECRET if webhook secret was compromised

---

## Incident 5: Job Queue Dead Letters Accumulated

**Severity:** P2
**Detection:** Weekly report shows `deadLetterJobs > 0`, infra_metrics alert

### Steps

1. **Check dead letter jobs**
   ```sql
   SELECT id, job_type, error_message, retries, created_at
   FROM job_queue
   WHERE status = 'dead'
   ORDER BY created_at DESC
   LIMIT 20;
   ```

2. **Diagnose by job type:**
   - **email_send:** Check Resend API status, verify API key
   - **image_process:** Check Cloudinary API status, verify credentials
   - **ai_description:** Check AI provider (Anthropic/OpenAI) status
   - **import_stock:** Check payload for malformed data

3. **Fix the root cause** (API key expired, service down, bug in handler)

4. **Re-queue dead jobs:**
   ```sql
   UPDATE job_queue
   SET status = 'pending',
       retries = 0,
       error_message = NULL,
       scheduled_at = now()
   WHERE status = 'dead'
     AND job_type = 'email_send'  -- specific type
     AND created_at > now() - interval '24 hours';
   ```

5. **Verify processing:**
   ```sql
   SELECT status, count(*) FROM job_queue
   WHERE created_at > now() - interval '1 hour'
   GROUP BY status;
   ```

6. **Post-incident:**
   - Monitor for recurrence
   - Consider increasing `max_retries` if transient failures
   - Add specific error handling for the failure pattern

---

## Incident 6: Suspected Data Breach

**Severity:** P0
**Detection:** Unusual DB access patterns, user reports, security scan findings

### Steps

1. **IMMEDIATE: Revoke compromised credentials**
   ```bash
   # Rotate Supabase anon key (if compromised)
   # Go to Supabase Dashboard → Settings → API → Rotate anon key

   # Rotate service role key
   # Go to Supabase Dashboard → Settings → API → Rotate service_role key

   # Update all env vars in CF Pages with new keys
   ```

2. **Assess scope**
   - Check Supabase auth logs: Dashboard → Logs → Auth
   - Check API logs for unusual patterns
   - Identify which data may have been accessed

3. **Check RLS policies**
   ```sql
   SELECT tablename, policyname, cmd, qual
   FROM pg_policies
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```

4. **Review recent access:**
   ```sql
   -- Check for unusual data exports
   SELECT * FROM auth.audit_log_entries
   WHERE created_at > now() - interval '24 hours'
   ORDER BY created_at DESC;
   ```

5. **If PII was exposed (GDPR applies):**
   - **72-hour notification requirement** to AEPD (Spanish DPA)
   - Prepare incident report:
     - What data was exposed
     - How many users affected
     - Timeline of the breach
     - Remediation steps taken
   - AEPD contact: https://www.aepd.es/
   - Notify affected users

6. **Containment:**
   - Rotate ALL API keys and secrets
   - Force password reset for affected users (if auth compromised)
   - Review and tighten RLS policies
   - Enable Supabase audit logging if not already active

7. **Post-incident:**
   - Full security audit (run `npx vitest run tests/security/`)
   - Document lessons learned
   - Update `SECURITY-TESTING.md` with new test cases
   - Consider engaging external security auditor

---

## General Incident Checklist

For any incident:

- [ ] Identify severity level (P0-P3)
- [ ] Assign incident lead
- [ ] Start timeline log (when detected, when resolved, what changed)
- [ ] Communicate status to stakeholders
- [ ] Implement fix or workaround
- [ ] Verify fix in production
- [ ] Post-incident review (within 48h)
- [ ] Update runbook with new learnings
- [ ] Update STATUS.md

---

## Useful Commands

```bash
# Quick health check
curl -s https://tracciona.com/api/health | jq .

# Check recent CF Pages deploys
# CF Dashboard → Pages → tracciona → Deployments

# Supabase CLI
supabase db diff --linked     # Check migration drift
supabase db push --linked     # Apply pending migrations

# Security tests
npx vitest run tests/security/

# Load test (smoke)
npm run test:load:smoke
```

---

## Contacts

| Role | Contact | When to escalate |
|---|---|---|
| **Platform admin** | tankiberica@gmail.com | All P0, P1 |
| **Supabase support** | https://supabase.com/dashboard/support | DB issues, auth issues |
| **Cloudflare support** | CF Dashboard → Support | CDN, WAF, DDoS |
| **Stripe support** | https://dashboard.stripe.com/support | Payment issues |
| **AEPD (Spain DPA)** | https://www.aepd.es/ | Data breach (72h) |
