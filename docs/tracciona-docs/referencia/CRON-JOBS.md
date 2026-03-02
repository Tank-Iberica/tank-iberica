# Cron Jobs Documentation

> All cron endpoints require `x-internal-secret: <CRON_SECRET>` header.
> They should be scheduled via an external scheduler (GitHub Actions, cron-job.org, or Cloudflare Workers Cron Triggers).
> Last updated: Mar 2026 (13 crons verified against server/api/cron/).

## Cron Endpoints

| Endpoint                        | Purpose                                                       | Frequency          | Priority |
| ------------------------------- | ------------------------------------------------------------- | ------------------ | -------- |
| `/api/cron/freshness-check`     | Mark stale vehicles as inactive (>90 days without update)     | Daily              | High     |
| `/api/cron/search-alerts`       | Send email to users with saved searches matching new vehicles | Daily              | High     |
| `/api/cron/favorite-price-drop` | Notify users when a favorited vehicle's price drops           | Daily              | High     |
| `/api/cron/favorite-sold`       | Notify users when a favorited vehicle is sold                 | Daily              | Medium   |
| `/api/cron/price-drop-alert`    | General price drop notifications (all users)                  | Daily              | Medium   |
| `/api/cron/reservation-expiry`  | Expire reservations past their hold date                      | Daily              | High     |
| `/api/cron/publish-scheduled`   | Publish vehicles and articles scheduled for future dates      | Daily              | High     |
| `/api/cron/founding-expiry`     | Handle founding member subscription expirations               | Daily              | Low      |
| `/api/cron/generate-editorial`  | Generate editorial content automatically with AI              | Daily/Weekly       | Low      |
| `/api/cron/auto-auction`        | Process auction end times, determine winners                  | Every 5 min        | High     |
| `/api/cron/infra-metrics`       | Collect infrastructure metrics (DB size, cache, etc.)         | Every 5 min        | Low      |
| `/api/cron/whatsapp-retry`      | Retry failed WhatsApp submissions                             | Every 15 min       | Medium   |
| `/api/cron/dealer-weekly-stats` | Send weekly performance digest to dealers                     | Weekly (Mon 09:00) | Medium   |

## Scheduler Configuration

### Option A: GitHub Actions (recommended)

Create `.github/workflows/cron-scheduler.yml`:

```yaml
name: Cron Scheduler
on:
  schedule:
    - cron: '0 2 * * *' # Daily at 02:00 UTC
    - cron: '*/5 * * * *' # Every 5 minutes
    - cron: '0 9 * * 1' # Weekly Monday 09:00 UTC

jobs:
  daily:
    if: github.event.schedule == '0 2 * * *'
    runs-on: ubuntu-latest
    steps:
      - run: |
          for endpoint in freshness-check search-alerts favorite-price-drop favorite-sold \
                          price-drop-alert reservation-expiry publish-scheduled \
                          founding-expiry generate-editorial; do
            curl -s -X POST "https://tracciona.com/api/cron/$endpoint" \
              -H "x-internal-secret: ${{ secrets.CRON_SECRET }}" || true
          done

  frequent:
    if: github.event.schedule == '*/5 * * * *'
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -s -X POST "https://tracciona.com/api/cron/auto-auction" \
            -H "x-internal-secret: ${{ secrets.CRON_SECRET }}" || true
          curl -s -X POST "https://tracciona.com/api/cron/infra-metrics" \
            -H "x-internal-secret: ${{ secrets.CRON_SECRET }}" || true

  whatsapp-retry:
    if: github.event.schedule == '*/5 * * * *'
    runs-on: ubuntu-latest
    steps:
      - run: |
          # Only run every 15 min (skip if minute % 15 != 0)
          if [ $(( $(date +%M) % 15 )) -eq 0 ]; then
            curl -s -X POST "https://tracciona.com/api/cron/whatsapp-retry" \
              -H "x-internal-secret: ${{ secrets.CRON_SECRET }}" || true
          fi

  weekly:
    if: github.event.schedule == '0 9 * * 1'
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -s -X POST "https://tracciona.com/api/cron/dealer-weekly-stats" \
            -H "x-internal-secret: ${{ secrets.CRON_SECRET }}" || true
```

### Option B: cron-job.org (free tier)

1. Create an account at https://cron-job.org
2. Add each endpoint as a job
3. Set HTTP method to POST
4. Add header: `x-internal-secret: <CRON_SECRET>`
5. Configure schedule per the table above

### Option C: Cloudflare Workers Cron Triggers

Requires Cloudflare Workers Paid plan. Create a worker that calls the endpoints on schedule.

## Monitoring

- Failed cron jobs log errors to the console
- The `infra-metrics` cron stores data in `infra_metrics` table
- Weekly stats failures are logged but don't block other crons
- Configure alerts in Cloudflare or set up the daily-audit workflow to check cron health

## Authentication

All cron endpoints verify the `x-internal-secret` header against `CRON_SECRET` environment variable using the `verifyCronSecret()` utility. In development, a warning is logged but the request is allowed to proceed.
