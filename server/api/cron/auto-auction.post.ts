import { defineEventHandler, readBody } from 'h3'
import { safeError } from '../../utils/safeError'
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
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !supabaseKey) {
    throw safeError(500, 'Service not configured')
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

  // Fetch auction defaults from vertical_config (replaces hardcoded values)
  const vertical = process.env.NUXT_PUBLIC_VERTICAL || 'tracciona'
  let auctionDefaults = {
    bid_increment_cents: 50000,
    deposit_cents: 100000,
    anti_snipe_seconds: 120,
    duration_days: 7,
  }
  let buyerPremiumPct = 8

  let configRes: Awaited<ReturnType<typeof fetchWithRetry>> | null = null
  try {
    configRes = await fetchWithRetry(
      `${supabaseUrl}/rest/v1/vertical_config?vertical=eq.${vertical}&select=auction_defaults,commission_rates`,
      { headers },
    )
  } catch {
    // Use hardcoded defaults on config fetch failure
  }

  if (configRes?.ok) {
    const cfgData = (await configRes.json()) as Array<{
      auction_defaults?: typeof auctionDefaults
      commission_rates?: { auction_buyer_premium_pct?: number }
    }>
    if (cfgData?.[0]) {
      if (cfgData[0].auction_defaults) {
        auctionDefaults = { ...auctionDefaults, ...cfgData[0].auction_defaults }
      }
      if (cfgData[0].commission_rates?.auction_buyer_premium_pct != null) {
        buyerPremiumPct = cfgData[0].commission_rates.auction_buyer_premium_pct
      }
    }
  }

  // Prefetch all vehicle IDs with active auctions (dedup N+1)
  const vehicleIdsWithAuctions = new Set<string>()
  if (eligibleVehicles.length > 0) {
    const vehicleIdList = eligibleVehicles.map((v) => `"${v.id as string}"`).join(',')
    const auctionsRes = await fetchWithRetry(
      `${supabaseUrl}/rest/v1/auctions?vehicle_id=in.(${vehicleIdList})&status=not.eq.cancelled&select=vehicle_id`,
      { headers },
    )
    const auctions = (await auctionsRes.json()) as Array<{ vehicle_id: string }>
    auctions.forEach((a) => vehicleIdsWithAuctions.add(a.vehicle_id))
  }

  const result = await processBatch({
    items: eligibleVehicles,
    batchSize: 50,
    processor: async (v: Record<string, unknown>) => {
      // Skip if already has active auction
      if (vehicleIdsWithAuctions.has(v.id as string)) return

      // Calculate starting price
      const startPriceCents = Math.round(
        (((v.price as number) || 0) * 100 * ((v.auto_auction_starting_pct as number) || 70)) / 100,
      )

      // Create auction: starts tomorrow at 10:00, ends after configured duration at 20:00
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() + 1)
      startDate.setHours(10, 0, 0, 0)

      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + auctionDefaults.duration_days)
      endDate.setHours(20, 0, 0, 0)

      const auctionData = {
        vehicle_id: v.id,
        vertical,
        title: `${v.brand} ${v.model}`,
        start_price_cents: startPriceCents,
        bid_increment_cents: auctionDefaults.bid_increment_cents,
        deposit_cents: auctionDefaults.deposit_cents,
        buyer_premium_pct: buyerPremiumPct,
        starts_at: startDate.toISOString(),
        ends_at: endDate.toISOString(),
        anti_snipe_seconds: auctionDefaults.anti_snipe_seconds,
        status: 'scheduled',
      }

      const createRes = await fetchWithRetry(`${supabaseUrl}/rest/v1/auctions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(auctionData),
      })

      if (createRes.ok) {
        created++
        // Pending(2026-02): Notify seller and matching Pro subscribers via email/push once notification templates are available
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
