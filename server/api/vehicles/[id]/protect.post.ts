/**
 * POST /api/vehicles/:id/protect
 *
 * Dealer pays 2 credits to mark a vehicle as is_protected = true.
 * Protected vehicles:
 *   - are visible to ALL users regardless of visible_from date
 *   - are immune to Reserva Prioritaria (#11)
 *
 * Only the dealer who owns the vehicle can protect it.
 */
import { defineEventHandler, getRouterParam } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { verifyCsrf } from '../../../utils/verifyCsrf'
import { safeError } from '../../../utils/safeError'

const PROTECT_COST = 2 // credits required to protect a vehicle

export default defineEventHandler(async (event) => {
  verifyCsrf(event)
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Authentication required')
  }

  const vehicleId = getRouterParam(event, 'id')
  if (!vehicleId) {
    throw safeError(400, 'Vehicle ID is required')
  }

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

  // 1. Verify vehicle exists, is owned by this dealer, and is published
  const vehicleRes = await fetch(
    `${supabaseUrl}/rest/v1/vehicles?id=eq.${vehicleId}&select=id,is_protected,status,dealer_id`,
    { headers },
  )
  const vehicles = (await vehicleRes.json()) as Array<{
    id: string
    is_protected: boolean
    status: string
    dealer_id: string | null
  }>
  const vehicle = vehicles[0]

  if (!vehicle) {
    throw safeError(404, 'Vehicle not found')
  }
  if (vehicle.status !== 'published') {
    throw safeError(400, 'Vehicle must be published to be protected')
  }

  // 2. Verify ownership — must be the dealer who owns this vehicle
  const dealerRes = await fetch(`${supabaseUrl}/rest/v1/dealers?user_id=eq.${user.id}&select=id`, {
    headers,
  })
  const dealers = (await dealerRes.json()) as Array<{ id: string }>
  const dealerId = dealers[0]?.id

  if (!dealerId || vehicle.dealer_id !== dealerId) {
    throw safeError(403, 'You do not own this vehicle')
  }

  // 3. Already protected?
  if (vehicle.is_protected) {
    return { alreadyProtected: true }
  }

  // 4. Fetch current credit balance
  const creditsRes = await fetch(
    `${supabaseUrl}/rest/v1/user_credits?user_id=eq.${user.id}&select=balance`,
    { headers },
  )
  const creditsData = (await creditsRes.json()) as Array<{ balance: number }>

  if (!creditsData[0]) {
    throw safeError(402, 'Insufficient credits')
  }

  const currentBalance = creditsData[0].balance
  if (currentBalance < PROTECT_COST) {
    throw safeError(402, 'Insufficient credits')
  }

  const newBalance = currentBalance - PROTECT_COST

  // 5. Deduct credits
  await fetch(`${supabaseUrl}/rest/v1/user_credits?user_id=eq.${user.id}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ balance: newBalance, updated_at: new Date().toISOString() }),
  })

  // 6. Mark vehicle as protected
  await fetch(`${supabaseUrl}/rest/v1/vehicles?id=eq.${vehicleId}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ is_protected: true, updated_at: new Date().toISOString() }),
  })

  // 7. Record credit transaction
  await fetch(`${supabaseUrl}/rest/v1/credit_transactions`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({
      user_id: user.id,
      type: 'spend',
      credits: -PROTECT_COST,
      balance_after: newBalance,
      vehicle_id: vehicleId,
      description: 'Protección de vehículo (acceso anticipado + inmune a reservas)',
      metadata: { vertical: process.env.NUXT_PUBLIC_VERTICAL || 'tracciona' },
    }),
  })

  return { protected: true, creditsRemaining: newBalance }
})
