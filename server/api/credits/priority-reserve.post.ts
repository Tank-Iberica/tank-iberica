/**
 * POST /api/credits/priority-reserve
 *
 * Buyer pays 2 credits to create a Reserva Prioritaria on a vehicle.
 * The vehicle is paused for 48h (priority_reserved_until = now + 48h).
 * The seller must respond within 48h; otherwise the cron auto-refunds.
 *
 * Immunity:
 *   - is_protected vehicles cannot be priority-reserved
 *   - Premium/Founding dealers' vehicles cannot be priority-reserved
 */
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { serverSupabaseUser } from '#supabase/server'
import { verifyCsrf } from '../../utils/verifyCsrf'
import { safeError } from '../../utils/safeError'
import { validateBody } from '../../utils/validateBody'
import { CREDIT_COSTS } from '../../utils/creditsConfig'

const RESERVE_COST = CREDIT_COSTS.PRIORITY_RESERVE

const reserveSchema = z.object({
  vehicleId: z.string().uuid(),
})

const IMMUNE_PLANS = new Set(['premium', 'founding'])

/**
 * Check seller immunity: fetches their subscription and throws if plan is immune.
 * Returns the seller's user_id for later use.
 */
async function checkSellerImmunity(
  dealerId: string,
  headers: Record<string, string>,
  supabaseUrl: string,
): Promise<string | null> {
  const dealerUserRes = await fetch(
    `${supabaseUrl}/rest/v1/dealers?id=eq.${dealerId}&select=user_id`,
    { headers },
  )
  const dealerUsers = (await dealerUserRes.json()) as Array<{ user_id: string | null }>
  const sellerUserId = dealerUsers[0]?.user_id ?? null

  if (sellerUserId) {
    const subsRes = await fetch(
      `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${sellerUserId}&status=eq.active&select=plan`,
      { headers },
    )
    const subs = (await subsRes.json()) as Array<{ plan: string }>
    const sellerPlan = subs[0]?.plan ?? 'free'
    if (IMMUNE_PLANS.has(sellerPlan)) {
      throw safeError(
        409,
        'This seller has a Premium subscription — their vehicles cannot be priority-reserved',
      )
    }
  }

  return sellerUserId
}

/** Throws if the buyer is also the seller of the vehicle. */
async function checkBuyerIsNotSeller(
  dealerId: string,
  buyerUserId: string,
  headers: Record<string, string>,
  supabaseUrl: string,
): Promise<void> {
  const res = await fetch(`${supabaseUrl}/rest/v1/dealers?user_id=eq.${buyerUserId}&select=id`, {
    headers,
  })
  const dealers = (await res.json()) as Array<{ id: string }>
  if (dealers[0]?.id === dealerId) {
    throw safeError(400, 'You cannot reserve your own vehicle')
  }
}

export default defineEventHandler(async (event) => {
  verifyCsrf(event)
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Authentication required')
  }

  const { vehicleId } = await validateBody(event, reserveSchema)

  const config = useRuntimeConfig()
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !supabaseKey) {
    throw safeError(500, 'Service not configured')
  }

  const headers: Record<string, string> = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  }

  // 1. Check vehicle is published and not already protected/reserved
  const vehicleRes = await fetch(
    `${supabaseUrl}/rest/v1/vehicles?id=eq.${vehicleId}&select=id,status,is_protected,priority_reserved_until,dealer_id`,
    { headers },
  )
  const vehicles = (await vehicleRes.json()) as Array<{
    id: string
    status: string
    is_protected: boolean
    priority_reserved_until: string | null
    dealer_id: string | null
  }>
  const vehicle = vehicles[0]

  if (!vehicle) {
    throw safeError(404, 'Vehicle not found')
  }
  if (vehicle.status !== 'published') {
    throw safeError(400, 'Vehicle is not available for reservation')
  }
  if (vehicle.is_protected) {
    throw safeError(409, 'Vehicle is protected and cannot be priority-reserved')
  }

  const now = new Date()
  if (vehicle.priority_reserved_until && new Date(vehicle.priority_reserved_until) > now) {
    throw safeError(409, 'Vehicle already has an active priority reservation')
  }

  // 2–4. Seller immunity + buyer-is-not-seller checks (consolidated)
  let sellerUserId: string | null = null
  if (vehicle.dealer_id) {
    sellerUserId = await checkSellerImmunity(vehicle.dealer_id, headers, supabaseUrl)
    await checkBuyerIsNotSeller(vehicle.dealer_id, user.id, headers, supabaseUrl)
  }

  if (!sellerUserId) {
    throw safeError(400, 'Vehicle has no valid seller')
  }

  // 5. Fetch buyer credits
  const creditsRes = await fetch(
    `${supabaseUrl}/rest/v1/user_credits?user_id=eq.${user.id}&select=balance`,
    { headers },
  )
  const creditsData = (await creditsRes.json()) as Array<{ balance: number }>

  if (!creditsData[0] || creditsData[0].balance < RESERVE_COST) {
    throw safeError(402, 'Insufficient credits')
  }

  const currentBalance = creditsData[0].balance
  const newBalance = currentBalance - RESERVE_COST

  // 6. Deduct credits
  await fetch(`${supabaseUrl}/rest/v1/user_credits?user_id=eq.${user.id}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ balance: newBalance, updated_at: now.toISOString() }),
  })

  // 7. Create priority_reservation record
  const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString()
  const insertRes = await fetch(`${supabaseUrl}/rest/v1/priority_reservations`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({
      vehicle_id: vehicleId,
      buyer_id: user.id,
      seller_id: sellerUserId,
      credits_spent: RESERVE_COST,
      status: 'pending',
      expires_at: expiresAt,
    }),
  })
  const insertData = (await insertRes.json()) as Array<{ id: string }>
  const reservationId = insertData[0]?.id

  // 8. Set priority_reserved_until on vehicle
  await fetch(`${supabaseUrl}/rest/v1/vehicles?id=eq.${vehicleId}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ priority_reserved_until: expiresAt, updated_at: now.toISOString() }),
  })

  // 9. Record credit transaction
  await fetch(`${supabaseUrl}/rest/v1/credit_transactions`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({
      user_id: user.id,
      type: 'spend',
      credits: -RESERVE_COST,
      balance_after: newBalance,
      vehicle_id: vehicleId,
      description: 'Reserva Prioritaria (48h)',
      metadata: {
        reservation_id: reservationId,
        vertical: process.env.NUXT_PUBLIC_VERTICAL || 'tracciona',
      },
    }),
  })

  return {
    reserved: true,
    reservationId,
    expiresAt,
    creditsRemaining: newBalance,
  }
})
