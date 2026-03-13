/**
 * POST /api/cron/favorite-price-drop
 *
 * Cron job that checks if any favorited vehicles have dropped in price
 * (updated in the last 24 hours with previous_price > current price)
 * and sends email notifications to the users who favorited them.
 *
 * Protected by x-cron-secret header.
 *
 * NOTE: Requires a `previous_price` column on the vehicles table.
 * When a dealer updates the price, the old price should be stored in
 * `previous_price` before overwriting `price`.
 */
import { defineEventHandler, readBody } from 'h3'
import { safeError } from '../../utils/safeError'
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { acquireCronLock } from '../../utils/cronLock'
import { processBatch } from '../../utils/batchProcessor'
import { logger } from '../../utils/logger'

// -- Types --------------------------------------------------------------------

interface CronBody {
  secret?: string
}

interface PriceDropVehicle {
  id: string
  brand: string
  model: string
  slug: string
  price: number
  previous_price: number
  updated_at: string
  category_id: string | null
}

interface FavoriteWithUser {
  user_id: string
  price_threshold: number | null
  users: UserRow | null
}

interface UserRow {
  id: string
  email: string
  name: string | null
  lang: string | null
}

// -- Handler ------------------------------------------------------------------

export default defineEventHandler(async (event) => {
  // -- 1. Verify cron secret --------------------------------------------------
  const body = await readBody<CronBody>(event).catch(() => ({}) as CronBody)
  verifyCronSecret(event, body?.secret)

  const supabase = serverSupabaseServiceRole(event)

  // Cron lock — prevent duplicate emails if scheduler fires twice in the same hour
  if (!(await acquireCronLock(supabase, 'favorite-price-drop'))) {
    return { skipped: true, reason: 'already_ran_in_window', timestamp: new Date().toISOString() }
  }

  const _internalSecret = useRuntimeConfig().cronSecret || process.env.CRON_SECRET
  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

  let vehiclesChecked = 0
  let notificationsSent = 0

  // -- 2. Query vehicles updated in last 24h with a price drop ----------------
  const { data: vehicles, error: vehiclesError } = await supabase
    .from('vehicles')
    .select('id, brand, model, slug, price, previous_price, updated_at, category_id')
    .eq('status', 'published')
    .not('previous_price', 'is', null)
    .gte('updated_at', twentyFourHoursAgo)
    .limit(200)

  if (vehiclesError) {
    throw safeError(500, `Failed to fetch vehicles: ${vehiclesError.message}`)
  }

  if (!vehicles || vehicles.length === 0) {
    return { vehiclesChecked: 0, notificationsSent: 0, timestamp: now.toISOString() }
  }

  // Filter to only those where price actually dropped
  const priceDropVehicles = (vehicles as unknown as PriceDropVehicle[]).filter(
    (v) => v.previous_price > v.price,
  )

  vehiclesChecked = priceDropVehicles.length

  if (priceDropVehicles.length === 0) {
    return { vehiclesChecked: 0, notificationsSent: 0, timestamp: now.toISOString() }
  }

  // -- 3. For each price-dropped vehicle, find users who favorited it ---------
  const result = await processBatch({
    items: priceDropVehicles,
    batchSize: 50,
    processor: async (vehicle: PriceDropVehicle) => {
      const { data: favorites, error: favsError } = await supabase
        .from('favorites')
        .select('user_id, price_threshold, users(id, email, name, lang)')
        .eq('vehicle_id', vehicle.id)

      if (favsError) {
        logger.error(`[favorite-price-drop] Error fetching favorites for vehicle ${vehicle.id}: ${favsError.message}`)
        return
      }

      if (!favorites || favorites.length === 0) {
        return
      }

      const typedFavorites = favorites as unknown as FavoriteWithUser[]
      const vehicleTitle = `${vehicle.brand} ${vehicle.model}`
      const oldPrice = vehicle.previous_price.toLocaleString('es-ES')
      const newPrice = vehicle.price.toLocaleString('es-ES')
      const vehicleUrl = `${getSiteUrl()}/vehiculo/${vehicle.slug}`

      // -- 4. Send notification to each user who favorited ----------------------
      for (const fav of typedFavorites) {
        const user = fav.users
        if (!user?.email) {
          continue
        }

        // Respect configurable price threshold: skip if price hasn't reached target
        if (fav.price_threshold !== null && vehicle.price > fav.price_threshold) {
          continue
        }

        const locale = user.lang ?? 'es'
        const variables: Record<string, string> = {
          name: user.name ?? user.email,
          vehicleTitle,
          oldPrice: `${oldPrice} EUR`,
          newPrice: `${newPrice} EUR`,
          vehicleUrl,
        }

        try {
          await $fetch('/api/email/send', {
            method: 'POST',
            headers: _internalSecret ? { 'x-internal-secret': _internalSecret } : {},
            body: {
              templateKey: 'buyer_favorite_price_drop',
              to: user.email,
              userId: user.id,
              variables,
              locale,
            },
          })

          notificationsSent++
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error'
          logger.error(`[favorite-price-drop] Failed to send email to user ${user.id}: ${errorMessage}`)
        }
      }
    },
  })

  return {
    vehiclesChecked,
    notificationsSent,
    batchResult: { processed: result.processed, errors: result.errors },
    timestamp: now.toISOString(),
  }
})
