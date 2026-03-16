import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { serverSupabaseUser } from '#supabase/server'
import { verifyCsrf } from '../../utils/verifyCsrf'
import { safeError } from '../../utils/safeError'
import { validateBody } from '../../utils/validateBody'

const UNLOCK_COST = 1 // credits required to unlock early access

const unlockSchema = z.object({
  vehicleId: z.string().uuid(),
})

export default defineEventHandler(async (event) => {
  verifyCsrf(event)
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Authentication required')
  }

  const { vehicleId } = await validateBody(event, unlockSchema)

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

  // 1. Check vehicle exists and has a future visible_from
  const vehicleRes = await fetch(
    `${supabaseUrl}/rest/v1/vehicles?id=eq.${vehicleId}&select=id,visible_from,is_protected,status`,
    { headers },
  )
  const vehicles = (await vehicleRes.json()) as Array<{
    id: string
    visible_from: string | null
    is_protected: boolean
    status: string
  }>
  const vehicle = vehicles[0]

  if (!vehicle) {
    throw safeError(404, 'Vehicle not found')
  }
  if (vehicle.status !== 'published') {
    throw safeError(400, 'Vehicle is not available')
  }

  const now = new Date()
  const visibleFrom = vehicle.visible_from ? new Date(vehicle.visible_from) : null
  // is_protected vehicles bypass visible_from — already visible to everyone
  if (vehicle.is_protected || !visibleFrom || visibleFrom <= now) {
    return { alreadyVisible: true }
  }

  // 2. Check if already unlocked
  const existingRes = await fetch(
    `${supabaseUrl}/rest/v1/vehicle_unlocks?user_id=eq.${user.id}&vehicle_id=eq.${vehicleId}&select=id`,
    { headers },
  )
  const existing = await existingRes.json()
  if (Array.isArray(existing) && existing.length) {
    return { alreadyUnlocked: true }
  }

  // 3. Fetch current credit balance
  const creditsRes = await fetch(
    `${supabaseUrl}/rest/v1/user_credits?user_id=eq.${user.id}&select=balance`,
    { headers },
  )
  const creditsData = (await creditsRes.json()) as Array<{ balance: number }>
  const currentBalance = creditsData[0]?.balance ?? 0

  if (currentBalance < UNLOCK_COST) {
    throw safeError(402, 'Insufficient credits')
  }

  const newBalance = currentBalance - UNLOCK_COST

  // 4. Deduct credits
  if (creditsData.length) {
    await fetch(`${supabaseUrl}/rest/v1/user_credits?user_id=eq.${user.id}`, {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ balance: newBalance, updated_at: new Date().toISOString() }),
    })
  } else {
    // No credits row at all — can't deduct
    throw safeError(402, 'Insufficient credits')
  }

  // 5. Record unlock
  await fetch(`${supabaseUrl}/rest/v1/vehicle_unlocks`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({
      user_id: user.id,
      vehicle_id: vehicleId,
      credits_spent: UNLOCK_COST,
    }),
  })

  // 6. Record credit transaction
  await fetch(`${supabaseUrl}/rest/v1/credit_transactions`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({
      user_id: user.id,
      type: 'spend',
      credits: -UNLOCK_COST,
      balance_after: newBalance,
      vehicle_id: vehicleId,
      description: 'Desbloqueo acceso anticipado',
      metadata: { vertical: process.env.NUXT_PUBLIC_VERTICAL || 'tracciona' },
    }),
  })

  return { unlocked: true, creditsRemaining: newBalance }
})
