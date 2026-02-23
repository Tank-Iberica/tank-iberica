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
import { createError, defineEventHandler, readBody } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../../utils/verifyCronSecret'

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

  if (vehiclesError) {
    throw createError({
      statusCode: 500,
      message: `Failed to fetch vehicles: ${vehiclesError.message}`,
    })
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
  for (const vehicle of priceDropVehicles) {
    const { data: favorites, error: favsError } = await supabase
      .from('favorites')
      .select('user_id, users(id, email, name, lang)')
      .eq('vehicle_id', vehicle.id)

    if (favsError) {
      console.error(
        `[favorite-price-drop] Error fetching favorites for vehicle ${vehicle.id}: ${favsError.message}`,
      )
      continue
    }

    if (!favorites || favorites.length === 0) {
      continue
    }

    const typedFavorites = favorites as unknown as FavoriteWithUser[]
    const vehicleTitle = `${vehicle.brand} ${vehicle.model}`
    const oldPrice = vehicle.previous_price.toLocaleString('es-ES')
    const newPrice = vehicle.price.toLocaleString('es-ES')
    const vehicleUrl = `https://tracciona.com/vehiculo/${vehicle.slug}`

    // -- 4. Send notification to each user who favorited ----------------------
    for (const fav of typedFavorites) {
      const user = fav.users
      if (!user || !user.email) {
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
        console.error(
          `[favorite-price-drop] Failed to send email to ${user.email}: ${errorMessage}`,
        )
      }
    }
  }

  return {
    vehiclesChecked,
    notificationsSent,
    timestamp: now.toISOString(),
  }
})
