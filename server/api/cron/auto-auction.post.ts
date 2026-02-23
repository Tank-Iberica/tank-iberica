import { createError, defineEventHandler, readBody } from 'h3'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { processBatch } from '../../utils/batchProcessor'
import { fetchWithRetry } from '../../utils/fetchWithRetry'

interface CronBody {
  secret?: string
}

export default defineEventHandler(async (event) => {
  // Verify cron secret to prevent unauthorized calls
  const body = await readBody<CronBody>(event).catch(() => ({}) as CronBody)
  verifyCronSecret(event, body?.secret)

  const config = useRuntimeConfig()
  const supabaseUrl = config.public?.supabaseUrl || process.env.SUPABASE_URL
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw createError({ statusCode: 500, message: 'Supabase not configured' })
  }

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }

  // Find vehicles eligible for auto-auction:
  // - status = 'published'
  // - auto_auction_after_days IS NOT NULL
  // - created_at + auto_auction_after_days < NOW()
  // - No existing non-cancelled auction for this vehicle
  const _vehiclesRes = await fetchWithRetry(
    `${supabaseUrl}/rest/v1/rpc/find_auto_auction_candidates`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    },
  ).catch(() => null)

  // If the RPC doesn't exist, fall back to a direct query
  // For now, use a simpler approach via REST
  const query = `${supabaseUrl}/rest/v1/vehicles?select=id,brand,model,price,auto_auction_after_days,auto_auction_starting_pct,created_at&status=eq.published&auto_auction_after_days=not.is.null&limit=200`
  const res = await fetchWithRetry(query, { headers })
  const vehicles = await res.json()

  if (!Array.isArray(vehicles)) {
    return { processed: 0, message: 'No vehicles found or query error' }
  }

  const now = new Date()
  let created = 0

  // Filter vehicles that are past their auto-auction threshold
  const eligibleVehicles = vehicles.filter((v: Record<string, unknown>) => {
    const createdAt = new Date(v.created_at as string)
    const thresholdDate = new Date(
      createdAt.getTime() + (v.auto_auction_after_days as number) * 24 * 60 * 60 * 1000,
    )
    return thresholdDate <= now
  })

  const result = await processBatch({
    items: eligibleVehicles,
    batchSize: 50,
    processor: async (v: Record<string, unknown>) => {
      // Check no existing active auction
      const existingRes = await fetchWithRetry(
        `${supabaseUrl}/rest/v1/auctions?vehicle_id=eq.${v.id}&status=not.eq.cancelled&select=id&limit=1`,
        { headers },
      )
      const existing = await existingRes.json()
      if (existing?.length > 0) return

      // Calculate starting price
      const startPriceCents = Math.round(
        (((v.price as number) || 0) * 100 * ((v.auto_auction_starting_pct as number) || 70)) / 100,
      )

      // Create auction: starts tomorrow at 10:00, ends 7 days later at 20:00
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() + 1)
      startDate.setHours(10, 0, 0, 0)

      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 7)
      endDate.setHours(20, 0, 0, 0)

      const auctionData = {
        vehicle_id: v.id,
        vertical: process.env.NUXT_PUBLIC_VERTICAL || 'tracciona',
        title: `${v.brand} ${v.model}`,
        start_price_cents: startPriceCents,
        bid_increment_cents: 50000,
        deposit_cents: 100000,
        buyer_premium_pct: 8.0,
        starts_at: startDate.toISOString(),
        ends_at: endDate.toISOString(),
        anti_snipe_seconds: 120,
        status: 'scheduled',
      }

      const createRes = await fetchWithRetry(`${supabaseUrl}/rest/v1/auctions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(auctionData),
      })

      if (createRes.ok) {
        created++
        // TODO(2026-02): Notify seller and matching Pro subscribers via email/push once notification templates are available
      }
    },
  })

  return {
    processed: vehicles.length,
    created,
    batchResult: { processed: result.processed, errors: result.errors },
    timestamp: now.toISOString(),
  }
})
