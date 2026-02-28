/**
 * POST /api/reservations/respond
 *
 * Allows a seller to respond to a reservation request.
 * The response must be at least 50 characters long (quality control).
 * Only the seller associated with the reservation can respond.
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { defineEventHandler, readBody, createError } from 'h3'
import { safeError } from '../../utils/safeError'

// -- Types ------------------------------------------------------------------

interface RespondBody {
  reservationId: string
  response: string
}

interface RespondResponse {
  success: boolean
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const MIN_RESPONSE_LENGTH = 50

// -- Handler ----------------------------------------------------------------

export default defineEventHandler(async (event): Promise<RespondResponse> => {
  // ── 1. Auth check ─────────────────────────────────────────────────────────
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  // ── 2. Read and validate body ─────────────────────────────────────────────
  const body = await readBody<RespondBody>(event)
  const { reservationId, response } = body

  if (!reservationId || !UUID_RE.test(reservationId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid or missing reservationId (UUID expected)',
    })
  }

  if (!response || typeof response !== 'string' || response.trim().length < MIN_RESPONSE_LENGTH) {
    throw createError({
      statusCode: 400,
      message: `Response must be at least ${MIN_RESPONSE_LENGTH} characters long`,
    })
  }

  // ── 3. Get Supabase service role client ───────────────────────────────────
  const supabase = serverSupabaseServiceRole(event)

  // ── 4. Fetch reservation and verify seller ownership ──────────────────────
  const { data: reservation, error: fetchError } = await supabase
    .from('reservations')
    .select('id, seller_id, status')
    .eq('id', reservationId)
    .single()

  if (fetchError || !reservation) {
    throw createError({ statusCode: 404, message: 'Reservation not found' })
  }

  // Verify the authenticated user is the seller for this reservation.
  // The seller_id on the reservation is the dealer's user_id.
  const { data: dealer } = await supabase
    .from('dealers')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!dealer || reservation.seller_id !== user.id) {
    throw createError({
      statusCode: 403,
      message: 'Only the seller can respond to this reservation',
    })
  }

  // Ensure reservation is in a respondable state
  if (!['pending', 'active'].includes(reservation.status)) {
    throw createError({
      statusCode: 409,
      message: `Cannot respond to a reservation with status "${reservation.status}"`,
    })
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
