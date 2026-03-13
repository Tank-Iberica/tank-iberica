/**
 * Fire-and-forget trigger for instant alerts.
 *
 * Call this after publishing a vehicle to notify Pro subscribers
 * whose saved searches match the vehicle. Does NOT block the caller.
 */
import { logger } from './logger'

/**
 * Trigger instant alert processing for a newly published vehicle.
 * Uses $fetch to call the internal endpoint. Errors are logged, never thrown.
 *
 * @param vehicleId - The UUID of the newly published vehicle
 */
export function triggerInstantAlerts(vehicleId: string): void {
  const secret = process.env.INTERNAL_API_SECRET || process.env.CRON_SECRET || ''

  // Fire-and-forget — don't await, don't block the caller
  $fetch('/api/alerts/instant', {
    method: 'POST',
    headers: secret ? { 'x-internal-secret': secret } : {},
    body: { vehicle_id: vehicleId },
  })
    .then(() => {
      logger.info(`[instant-alerts] Triggered for vehicle ${vehicleId}`)
    })
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`[instant-alerts] Failed to trigger for vehicle ${vehicleId}: ${msg}`)
    })
}
