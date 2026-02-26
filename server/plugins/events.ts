/**
 * Nitro plugin — registers event bus listeners on server start.
 *
 * Events are emitted from server routes and services.
 * Handlers here keep the business logic decoupled from the API layer.
 */
import { on } from '~/server/utils/eventBus'
import { notifyAdmin } from '~/server/services/notifications'

// ── Event payload types ──

interface VehicleCreatedPayload {
  vehicleId: string
  dealerId: string
  title: string
  vertical?: string
}

interface VehicleSoldPayload {
  vehicleId: string
  dealerId: string
  title: string
  buyerUserId?: string
}

interface DealerRegisteredPayload {
  dealerId: string
  email: string
  companyName: string
}

interface SubscriptionChangedPayload {
  dealerId: string
  previousPlan: string | null
  newPlan: string
  action: 'created' | 'upgraded' | 'downgraded' | 'cancelled'
}

export default defineNitroPlugin(() => {
  // ── vehicle:created ──
  on('vehicle:created', async (_payload) => {
    const payload = _payload as VehicleCreatedPayload
    console.info(`[events] vehicle:created — ${payload.title} (dealer: ${payload.dealerId})`)

    // Notify admin of new listing
    await notifyAdmin('vehicle_created', {
      vehicleId: payload.vehicleId,
      dealerId: payload.dealerId,
      title: payload.title,
    })
  })

  // ── vehicle:sold ──
  on('vehicle:sold', async (_payload) => {
    const payload = _payload as VehicleSoldPayload
    console.info(`[events] vehicle:sold — ${payload.title} (dealer: ${payload.dealerId})`)

    // Notify admin
    await notifyAdmin('vehicle_sold', {
      vehicleId: payload.vehicleId,
      dealerId: payload.dealerId,
      title: payload.title,
    })
  })

  // ── dealer:registered ──
  on('dealer:registered', async (_payload) => {
    const payload = _payload as DealerRegisteredPayload
    console.info(`[events] dealer:registered — ${payload.companyName}`)

    await notifyAdmin('dealer_registered', {
      dealerId: payload.dealerId,
      email: payload.email,
      companyName: payload.companyName,
    })
  })

  // ── subscription:changed ──
  on('subscription:changed', async (_payload) => {
    const payload = _payload as SubscriptionChangedPayload
    console.info(`[events] subscription:changed — dealer ${payload.dealerId}: ${payload.action}`)

    await notifyAdmin('subscription_changed', {
      dealerId: payload.dealerId,
      action: payload.action,
      previousPlan: payload.previousPlan,
      newPlan: payload.newPlan,
    })
  })

  console.info('[events] Event bus listeners registered')
})
