/**
 * Nitro plugin — registers event bus listeners on server start.
 *
 * Events are emitted from server routes and services.
 * Handlers here keep the business logic decoupled from the API layer.
 */
import { on } from '~~/server/utils/eventBus'
import { notifyAdmin } from '~~/server/services/notifications'
import { invalidateVehicleCaches } from '~~/server/utils/distributedEvents'
import { logger } from '~~/server/utils/logger'

export default defineNitroPlugin(() => {
  // ── vehicle:created ──────────────────────────────────────────────────────
  on('vehicle:created', async ({ vehicleId, dealerId, title, vertical }) => {
    console.info(`[events] vehicle:created — ${title} (dealer: ${dealerId})`)
    await notifyAdmin('vehicle_created', { vehicleId, dealerId, title })
    // §7.3: Event-driven cache invalidation
    await invalidateVehicleCaches(vehicleId, dealerId, vertical)
  })

  // ── vehicle:sold ─────────────────────────────────────────────────────────
  on('vehicle:sold', async ({ vehicleId, dealerId, title }) => {
    console.info(`[events] vehicle:sold — ${title} (dealer: ${dealerId})`)
    await notifyAdmin('vehicle_sold', { vehicleId, dealerId, title })
    // §7.3: Invalidate caches when vehicle sold
    await invalidateVehicleCaches(vehicleId, dealerId)
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
  on('job:dead_letter', async ({ jobId, jobType, error: errorMsg }) => {
    logger.warn(`[events] job:dead_letter — ${jobType} (${jobId}): ${errorMsg}`)
    await notifyAdmin('job_dead_letter', { jobId, jobType, error: errorMsg })
  })

  console.info('[events] Event bus listeners registered')
})
