/**
 * POST /api/cron/data-quality
 *
 * Daily cron: detects data anomalies in published vehicles and alerts admin.
 * Checks:
 *   1. price = 0 or negative on published vehicles
 *   2. year > current year + 2 or year < 1950
 *   3. km < 0
 *   4. Published vehicles with zero images
 *   5. Missing brand or model
 *
 * Logs findings to infra_alerts for admin review.
 *
 * Protected by x-cron-secret header.
 * Schedule: daily 04:00 UTC
 *
 * #389 — Data quality monitoring cron (audit #4 N96)
 */
import { defineEventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { acquireDbCronLock } from '../../utils/cronLock'
import { logger } from '../../utils/logger'

interface QualityCheck {
  name: string
  count: number
  vehicleIds: string[]
}

export default defineEventHandler(async (event) => {
  verifyCronSecret(event)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = serverSupabaseServiceRole(event) as any

  if (!(await acquireDbCronLock(supabase, 'data-quality'))) {
    return { skipped: true, reason: 'already_ran_in_window', timestamp: new Date().toISOString() }
  }

  const vertical = process.env.NUXT_PUBLIC_VERTICAL ?? 'tracciona'
  const currentYear = new Date().getFullYear()
  const checks: QualityCheck[] = []

  // 1. Price = 0 or negative on published vehicles
  const { data: zeroPriceVehicles } = await supabase
    .from('vehicles')
    .select('id')
    .eq('status', 'published')
    .lte('price', 0)
    .limit(50)

  if (zeroPriceVehicles?.length) {
    checks.push({
      name: 'zero_or_negative_price',
      count: zeroPriceVehicles.length,
      vehicleIds: zeroPriceVehicles.map((v: { id: string }) => v.id),
    })
  }

  // 2. Unrealistic year (>current+2 or <1950)
  const { data: badYearHigh } = await supabase
    .from('vehicles')
    .select('id')
    .eq('status', 'published')
    .gt('year', currentYear + 2)
    .limit(50)

  const { data: badYearLow } = await supabase
    .from('vehicles')
    .select('id')
    .eq('status', 'published')
    .not('year', 'is', null)
    .lt('year', 1950)
    .limit(50)

  const badYearIds = [
    ...(badYearHigh || []).map((v: { id: string }) => v.id),
    ...(badYearLow || []).map((v: { id: string }) => v.id),
  ]
  if (badYearIds.length) {
    checks.push({ name: 'unrealistic_year', count: badYearIds.length, vehicleIds: badYearIds })
  }

  // 3. Negative km
  const { data: negativeKm } = await supabase
    .from('vehicles')
    .select('id')
    .eq('status', 'published')
    .lt('km', 0)
    .limit(50)

  if (negativeKm?.length) {
    checks.push({
      name: 'negative_km',
      count: negativeKm.length,
      vehicleIds: negativeKm.map((v: { id: string }) => v.id),
    })
  }

  // 4. Published vehicles with zero images
  const { data: noImageVehicles } = await supabase
    .from('vehicles')
    .select('id, vehicle_images(id)')
    .eq('status', 'published')
    .limit(200)

  const noImageIds = (noImageVehicles || [])
    .filter((v: { vehicle_images: unknown[] }) => !v.vehicle_images?.length)
    .map((v: { id: string }) => v.id)

  if (noImageIds.length) {
    checks.push({
      name: 'no_images',
      count: noImageIds.length,
      vehicleIds: noImageIds.slice(0, 50),
    })
  }

  // 5. Missing brand or model
  const { data: missingBrand } = await supabase
    .from('vehicles')
    .select('id')
    .eq('status', 'published')
    .or('brand.is.null,brand.eq.,model.is.null,model.eq.')
    .limit(50)

  if (missingBrand?.length) {
    checks.push({
      name: 'missing_brand_model',
      count: missingBrand.length,
      vehicleIds: missingBrand.map((v: { id: string }) => v.id),
    })
  }

  // Insert alerts for any anomalies found
  const alertsToInsert = checks.map((c) => ({
    vertical,
    metric: `data_quality_${c.name}`,
    current_value: c.count,
    threshold_value: 0,
    is_critical: c.count > 10,
    message: `Data quality: ${c.count} vehicles with ${c.name}`,
    metadata: { vehicle_ids: c.vehicleIds.slice(0, 20) },
  }))

  if (alertsToInsert.length) {
    await supabase.from('infra_alerts').insert(alertsToInsert)
    logger.warn('[data-quality] Anomalies found', {
      checks: checks.map((c) => ({ name: c.name, count: c.count })),
    })
  } else {
    logger.info('[data-quality] No anomalies found')
  }

  return {
    checks: checks.map((c) => ({ name: c.name, count: c.count })),
    alertsCreated: alertsToInsert.length,
    timestamp: new Date().toISOString(),
  }
})
