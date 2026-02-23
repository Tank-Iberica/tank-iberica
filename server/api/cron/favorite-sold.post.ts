/**
 * POST /api/cron/favorite-sold
 *
 * Cron job that checks if any favorited vehicles have been recently sold
 * (status = 'sold' with sold_at in the last 24 hours) and sends email
 * notifications to the users who had favorited them.
 *
 * Protected by x-cron-secret header.
 */
import { createError, defineEventHandler, readBody } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

// -- Types --------------------------------------------------------------------

interface CronBody {
  secret?: string
}

interface SoldVehicle {
  id: string
  brand: string
  model: string
  slug: string
  sold_at: string
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
  const config = useRuntimeConfig()
  const cronSecret = config.cronSecret || process.env.CRON_SECRET

  if (cronSecret && body.secret !== cronSecret) {
    const headerSecret = event.node.req.headers['x-cron-secret']
    if (headerSecret !== cronSecret) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }
  }

  const supabase = serverSupabaseServiceRole(event)
  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

  let soldVehicles = 0
  let notificationsSent = 0

  // -- 2. Query vehicles recently marked as sold (last 24h) -------------------
  const { data: vehicles, error: vehiclesError } = await supabase
    .from('vehicles')
    .select('id, brand, model, slug, sold_at, category_id')
    .eq('status', 'sold')
    .not('sold_at', 'is', null)
    .gte('sold_at', twentyFourHoursAgo)

  if (vehiclesError) {
    throw createError({
      statusCode: 500,
      message: `Failed to fetch sold vehicles: ${vehiclesError.message}`,
    })
  }

  if (!vehicles || vehicles.length === 0) {
    return { soldVehicles: 0, notificationsSent: 0, timestamp: now.toISOString() }
  }

  const typedVehicles = vehicles as unknown as SoldVehicle[]
  soldVehicles = typedVehicles.length

  // -- 3. For each sold vehicle, find users who favorited it ------------------
  for (const vehicle of typedVehicles) {
    const { data: favorites, error: favsError } = await supabase
      .from('favorites')
      .select('user_id, users(id, email, name, lang)')
      .eq('vehicle_id', vehicle.id)

    if (favsError) {
      console.error(
        `[favorite-sold] Error fetching favorites for vehicle ${vehicle.id}: ${favsError.message}`,
      )
      continue
    }

    if (!favorites || favorites.length === 0) {
      continue
    }

    const typedFavorites = favorites as unknown as FavoriteWithUser[]
    const vehicleTitle = `${vehicle.brand} ${vehicle.model}`

    // Build a URL to similar vehicles based on the same category
    const similarParams = vehicle.category_id ? `?category=${vehicle.category_id}` : ''
    const similarUrl = `https://tracciona.com/catalogo${similarParams}`

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
        similarUrl,
      }

      try {
        await $fetch('/api/email/send', {
          method: 'POST',
          body: {
            templateKey: 'buyer_favorite_sold',
            to: user.email,
            userId: user.id,
            variables,
            locale,
          },
        })

        notificationsSent++
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        console.error(`[favorite-sold] Failed to send email to ${user.email}: ${errorMessage}`)
      }
    }
  }

  return {
    soldVehicles,
    notificationsSent,
    timestamp: now.toISOString(),
  }
})
