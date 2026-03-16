/**
 * POST /api/cron/auto-renew-feature
 *
 * Cron job for auto-renew and auto-feature dealer toggles.
 * For each published vehicle with auto_renew OR auto_feature enabled:
 *   1. Find the dealer owner
 *   2. Check the dealer's user_credits balance (≥ 1 required)
 *   3. Deduct 1 credit
 *   4. Apply the operation:
 *      - auto_renew: update updated_at → resets sort position in catalog
 *      - auto_feature: set featured = true
 *
 * One credit covers one vehicle per run.
 * If a vehicle has BOTH toggles active, it costs 2 credits (1 per operation).
 *
 * Protected by x-cron-secret header.
 */
import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { safeError } from '../../utils/safeError'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { logger } from '../../utils/logger'

interface CronBody {
  secret?: string
}

interface AutoVehicle {
  id: string
  dealer_id: string | null
  auto_renew: boolean
  auto_feature: boolean
}

export interface AutoRenewResult {
  processed: number
  renewed: number
  featured: number
  skipped: number
  timestamp: string
}

/**
 * Deduct 1 credit from a user's balance.
 * Returns the new balance, or null if insufficient credits.
 */
export async function deductOneCredit(
  supabase: SupabaseClient,
  userId: string,
  now: Date,
): Promise<number | null> {
  // user_credits / credit_transactions tables not yet in generated types
  const db = supabase

  const { data: creditRows } = await db
    .from('user_credits')
    .select('balance')
    .eq('user_id', userId)
    .limit(1)

  const balance = (creditRows as Array<{ balance: number }> | null)?.[0]?.balance ?? 0
  if (balance < 1) return null

  const newBalance = balance - 1
  await db
    .from('user_credits')
    .update({ balance: newBalance, updated_at: now.toISOString() })
    .eq('user_id', userId)

  return newBalance
}

async function applyAutoOperation(
  supabase: SupabaseClient,
  db: SupabaseClient,
  vehicleId: string,
  userId: string,
  dealerId: string,
  now: Date,
  op: 'renew' | 'feature',
): Promise<boolean> {
  const newBalance = await deductOneCredit(supabase, userId, now)
  if (newBalance === null) {
    logger.info(
      `[auto-renew-feature] Insufficient credits for dealer ${dealerId} — skipping auto_${op} on ${vehicleId}`,
    )
    return false
  }

  const update =
    op === 'renew'
      ? { updated_at: now.toISOString() }
      : { featured: true, updated_at: now.toISOString() }

  await supabase.from('vehicles').update(update).eq('id', vehicleId)

  await db.from('credit_transactions').insert({
    user_id: userId,
    type: 'spend',
    credits: -1,
    balance_after: newBalance,
    vehicle_id: vehicleId,
    description: op === 'renew' ? 'Auto-renovar anuncio' : 'Auto-destacar anuncio',
  })

  logger.info(
    `[auto-renew-feature] auto_${op} applied to vehicle ${vehicleId} (balance: ${newBalance})`,
  )
  return true
}

export default defineEventHandler(async (event): Promise<AutoRenewResult> => {
  const body = await readBody<CronBody>(event).catch(() => ({}) as CronBody)
  verifyCronSecret(event, body?.secret)

  // Tables like user_credits, credit_transactions, auto_renew/auto_feature columns not in generated types
  const supabase = serverSupabaseServiceRole(event) as SupabaseClient
  const db = supabase
  const now = new Date()

  // 1. Fetch published vehicles with auto settings enabled
  const { data: vehicles, error: vehiclesError } = await supabase
    .from('vehicles')
    .select('id, dealer_id, auto_renew, auto_feature')
    .eq('status', 'published')
    .or('auto_renew.eq.true,auto_feature.eq.true')
    .limit(500)

  if (vehiclesError) {
    throw safeError(500, `Failed to fetch auto-settings vehicles: ${vehiclesError.message}`)
  }

  if (!vehicles || vehicles.length === 0) {
    return { processed: 0, renewed: 0, featured: 0, skipped: 0, timestamp: now.toISOString() }
  }

  const typedVehicles = vehicles as unknown as AutoVehicle[]

  // 2. Get unique dealer IDs and map to user_ids
  const dealerIds = Array.from(
    new Set(typedVehicles.map((v) => v.dealer_id).filter(Boolean) as string[]),
  )

  const { data: dealers } = await supabase.from('dealers').select('id, user_id').in('id', dealerIds)

  const dealerUserMap = new Map<string, string>()
  for (const d of (dealers ?? []) as Array<{ id: string; user_id: string | null }>) {
    if (d.user_id) dealerUserMap.set(d.id, d.user_id)
  }

  let renewed = 0
  let featured = 0
  let skipped = 0

  // 3. Process each vehicle
  for (const vehicle of typedVehicles) {
    if (!vehicle.dealer_id) {
      skipped++
      continue
    }
    const userId = dealerUserMap.get(vehicle.dealer_id)
    if (!userId) {
      skipped++
      continue
    }

    if (vehicle.auto_renew) {
      const ok = await applyAutoOperation(
        supabase,
        db,
        vehicle.id,
        userId,
        vehicle.dealer_id,
        now,
        'renew',
      )
      if (ok) renewed++
      else skipped++
    }

    if (vehicle.auto_feature) {
      const ok = await applyAutoOperation(
        supabase,
        db,
        vehicle.id,
        userId,
        vehicle.dealer_id,
        now,
        'feature',
      )
      if (ok) featured++
      else skipped++
    }
  }

  return {
    processed: typedVehicles.length,
    renewed,
    featured,
    skipped,
    timestamp: now.toISOString(),
  }
})
