/**
 * POST /api/reservations/respond
 *
 * Allows a seller to respond to a reservation request.
 * The response must be at least 50 characters long (quality control).
 * Only the seller associated with the reservation can respond.
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { safeError } from '../../utils/safeError'
import { validateBody } from '../../utils/validateBody'

// -- Types ------------------------------------------------------------------

interface RespondResponse {
  success: boolean
}

const respondSchema = z.object({
  reservationId: z.string().uuid('reservationId must be a valid UUID'),
  response: z.string().min(50, 'Response must be at least 50 characters long').max(2000),
})

// -- Handler ----------------------------------------------------------------

export default defineEventHandler(async (event): Promise<RespondResponse> => {
  // ── 1. Auth check ─────────────────────────────────────────────────────────
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Authentication required')
  }

  // ── 2. Read and validate body ─────────────────────────────────────────────
  const { reservationId, response } = await validateBody(event, respondSchema)

  // ── 3. Get Supabase service role client ───────────────────────────────────
  const supabase = serverSupabaseServiceRole(event)

  // ── 4. Fetch reservation and verify seller ownership ──────────────────────
  const { data: reservation, error: fetchError } = await supabase
    .from('reservations')
    .select('id, seller_id, status')
    .eq('id', reservationId)
    .single()

  if (fetchError || !reservation) {
    throw safeError(404, 'Reservation not found')
  }

  // Verify the authenticated user is the seller for this reservation.
  // The seller_id on the reservation is the dealer's user_id.
  const { data: dealer } = await supabase
    .from('dealers')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!dealer || reservation.seller_id !== user.id) {
    throw safeError(403, 'Only the seller can respond to this reservation')
  }

  // Ensure reservation is in a respondable state
  if (!['pending', 'active'].includes(reservation.status as string)) {
    throw safeError(409, `Cannot respond to a reservation with status "${reservation.status}"`)

  }

  // ── 5. Update reservation with seller response ────────────────────────────
  const { error: updateError } = await supabase
    .from('reservations')
    .update({
      status: 'seller_responded',
      seller_response: response.trim(),
      seller_responded_at: new Date().toISOString(),
    })
    .eq('id', reservationId)

  if (updateError) {
    throw safeError(500, `Failed to update reservation: ${updateError.message}`)
  }

  // ── 6. Return success ─────────────────────────────────────────────────────
  return { success: true }
})
