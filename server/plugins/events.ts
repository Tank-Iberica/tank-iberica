/**
 * Nitro plugin — registers event bus listeners on server start.
 *
 * Events are emitted from server routes and services.
 * Handlers here keep the business logic decoupled from the API layer.
 */
import { on } from '~~/server/utils/eventBus'
import { notifyAdmin } from '~~/server/services/notifications'

export default defineNitroPlugin(() => {
  // ── vehicle:created ──────────────────────────────────────────────────────
  on('vehicle:created', async ({ vehicleId, dealerId, title }) => {
    console.info(`[events] vehicle:created — ${title} (dealer: ${dealerId})`)
    await notifyAdmin('vehicle_created', { vehicleId, dealerId, title })
  })

  // ── vehicle:sold ─────────────────────────────────────────────────────────
  on('vehicle:sold', async ({ vehicleId, dealerId, title }) => {
    console.info(`[events] vehicle:sold — ${title} (dealer: ${dealerId})`)
    await notifyAdmin('vehicle_sold', { vehicleId, dealerId, title })
  })

  // ── dealer:registered ────────────────────────────────────────────────────
  on('dealer:registered', async ({ dealerId, email, companyName }) => {
    console.info(`[events] dealer:registered — ${companyName}`)
    await notifyAdmin('dealer_registered', { dealerId, email, companyName })
  })

  // ── subscription:changed ─────────────────────────────────────────────────
  on('subscription:changed', async ({ dealerId, action, previousPlan, newPlan }) => {
    console.info(`[events] subscription:changed — dealer ${dealerId}: ${action}`)
    await notifyAdmin('subscription_changed', { dealerId, action, previousPlan, newPlan })
  })

  // ── job:dead_letter ──────────────────────────────────────────────────────
  on('job:dead_letter', async ({ jobId, jobType, error }) => {
    console.warn(`[events] job:dead_letter — ${jobType} (${jobId}): ${error}`)
    // Could notify admin or trigger alerting here
  })

  console.info('[events] Event bus listeners registered')
})
