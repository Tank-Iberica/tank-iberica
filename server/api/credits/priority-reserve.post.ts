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

const RESERVE_COST = 2 // credits required

const reserveSchema = z.object({
  vehicleId: z.string().uuid(),
})

const IMMUNE_PLANS = ['premium', 'founding']

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

  // 2. Check seller's plan immunity (Premium/Founding dealers cannot be priority-reserved)
  if (vehicle.dealer_id) {
    const dealerUserRes = await fetch(
      `${supabaseUrl}/rest/v1/dealers?id=eq.${vehicle.dealer_id}&select=user_id`,
      { headers },
    )
    const dealerUsers = (await dealerUserRes.json()) as Array<{ user_id: string | null }>
    const sellerUserId = dealerUsers[0]?.user_id

    if (sellerUserId) {
      const subsRes = await fetch(
        `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${sellerUserId}&status=eq.active&select=plan`,
        { headers },
      )
      const subs = (await subsRes.json()) as Array<{ plan: string }>
      const sellerPlan = subs[0]?.plan ?? 'free'

      if (IMMUNE_PLANS.includes(sellerPlan)) {
        throw safeError(
          409,
          'This seller has a Premium subscription — their vehicles cannot be priority-reserved',
        )
      }
    }
  }

  // 3. Buyer must not be the seller
  if (vehicle.dealer_id) {
    const buyerDealerRes = await fetch(
      `${supabaseUrl}/rest/v1/dealers?user_id=eq.${user.id}&select=id`,
      { headers },
    )
    const buyerDealers = (await buyerDealerRes.json()) as Array<{ id: string }>
    if (buyerDealers[0]?.id === vehicle.dealer_id) {
      throw safeError(400, 'You cannot reserve your own vehicle')
    }
  }

  // 4. Get seller user_id from dealer (needed for priority_reservations record)
  let sellerUserId: string | null = null
  if (vehicle.dealer_id) {
    const dealerUserRes2 = await fetch(
      `${supabaseUrl}/rest/v1/dealers?id=eq.${vehicle.dealer_id}&select=user_id`,
      { headers },
    )
    const dealerUsers2 = (await dealerUserRes2.json()) as Array<{ user_id: string | null }>
    sellerUserId = dealerUsers2[0]?.user_id ?? null
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
