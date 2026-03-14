/**
 * POST /api/priority-reservations/:id/respond
 *
 * Seller accepts or rejects a Reserva Prioritaria.
 * - accepted: reservation stays active until expires_at
 * - rejected: buyer credits are refunded + vehicle priority_reserved_until cleared
 */
import { defineEventHandler, getRouterParam } from 'h3'
import { z } from 'zod'
import { serverSupabaseUser } from '#supabase/server'
import { verifyCsrf } from '../../../utils/verifyCsrf'
import { safeError } from '../../../utils/safeError'
import { validateBody } from '../../../utils/validateBody'

const respondSchema = z.object({
  response: z.enum(['accepted', 'rejected']),
})

export default defineEventHandler(async (event) => {
  verifyCsrf(event)
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Authentication required')
  }

  const reservationId = getRouterParam(event, 'id')
  if (!reservationId) {
    throw safeError(400, 'Reservation ID is required')
  }

  const { response } = await validateBody(event, respondSchema)

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

  // 1. Fetch the reservation
  const resRes = await fetch(
    `${supabaseUrl}/rest/v1/priority_reservations?id=eq.${reservationId}&select=id,vehicle_id,buyer_id,seller_id,status,credits_spent,expires_at`,
    { headers },
  )
  const reservations = (await resRes.json()) as Array<{
    id: string
    vehicle_id: string
    buyer_id: string
    seller_id: string
    status: string
    credits_spent: number
    expires_at: string
  }>
  const reservation = reservations[0]

  if (!reservation) {
    throw safeError(404, 'Reservation not found')
  }

  // 2. Only the seller can respond
  if (reservation.seller_id !== user.id) {
    throw safeError(403, 'Only the vehicle seller can respond to this reservation')
  }

  // 3. Must be in pending status
  if (reservation.status !== 'pending') {
    throw safeError(409, `Reservation is already ${reservation.status}`)
  }

  // 4. Must not be expired
  const now = new Date()
  if (new Date(reservation.expires_at) < now) {
    throw safeError(409, 'Reservation has already expired')
  }

  // 5. Update reservation status
  await fetch(`${supabaseUrl}/rest/v1/priority_reservations?id=eq.${reservationId}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({
      status: response,
      seller_responded_at: now.toISOString(),
      updated_at: now.toISOString(),
    }),
  })

  // 6. If rejected → refund buyer's credits + clear vehicle priority_reserved_until
  if (response === 'rejected') {
    // Fetch current buyer balance
    const buyerCreditsRes = await fetch(
      `${supabaseUrl}/rest/v1/user_credits?user_id=eq.${reservation.buyer_id}&select=balance`,
      { headers },
    )
    const buyerCredits = (await buyerCreditsRes.json()) as Array<{ balance: number }>
    const currentBalance = buyerCredits[0]?.balance ?? 0
    const newBalance = currentBalance + reservation.credits_spent

    // Refund credits
    if (buyerCredits[0]) {
      await fetch(`${supabaseUrl}/rest/v1/user_credits?user_id=eq.${reservation.buyer_id}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({ balance: newBalance, updated_at: now.toISOString() }),
      })
    }

    // Record refund transaction
    await fetch(`${supabaseUrl}/rest/v1/credit_transactions`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({
        user_id: reservation.buyer_id,
        type: 'refund',
        credits: reservation.credits_spent,
        balance_after: newBalance,
        vehicle_id: reservation.vehicle_id,
        description: 'Reembolso — Reserva Prioritaria rechazada',
        metadata: {
          reservation_id: reservationId,
          vertical: process.env.NUXT_PUBLIC_VERTICAL || 'tracciona',
        },
      }),
    })

    // Mark reservation as refunded
    await fetch(`${supabaseUrl}/rest/v1/priority_reservations?id=eq.${reservationId}`, {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'refunded', refunded_at: now.toISOString() }),
    })

    // Clear vehicle's priority_reserved_until
    await fetch(`${supabaseUrl}/rest/v1/vehicles?id=eq.${reservation.vehicle_id}`, {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ priority_reserved_until: null, updated_at: now.toISOString() }),
    })

    return { response: 'rejected', refunded: true, creditsRefunded: reservation.credits_spent }
  }

  return { response: 'accepted' }
})
