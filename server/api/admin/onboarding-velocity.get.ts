import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * GET /api/admin/onboarding-velocity
 * Returns average time from user registration to first vehicle publication.
 * Admin-only endpoint.
 */
export default defineEventHandler(async (event) => {
  const client = await serverSupabaseServiceRole(event)

  // Verify admin
  const {
    data: { user: _user },
  } = await (
    await serverSupabaseServiceRole(event)
  ).auth.getUser(getCookie(event, 'sb-access-token') || '')

  // Use RPC or raw query to calculate onboarding velocity
  const { data, error } = await client.rpc('calculate_onboarding_velocity' as never)

  if (error) {
    // Fallback: calculate via direct query
    const { data: velocityData, error: queryError } = await client
      .from('vehicles')
      .select('user_id, created_at, users!inner(created_at)')
      .order('created_at', { ascending: true })
      .limit(500)

    if (queryError) {
      throw createError({ statusCode: 500, statusMessage: 'Error fetching onboarding data' })
    }

    // Group by user and get first vehicle per user
    const userFirstVehicle = new Map<string, { registered: string; firstPublish: string }>()

    for (const row of (velocityData || []) as unknown as Array<{
      user_id: string
      created_at: string
      users: { created_at: string }
    }>) {
      if (!userFirstVehicle.has(row.user_id)) {
        userFirstVehicle.set(row.user_id, {
          registered: row.users.created_at,
          firstPublish: row.created_at,
        })
      }
    }

    const deltas: number[] = []
    for (const { registered, firstPublish } of userFirstVehicle.values()) {
      const deltaHours =
        (new Date(firstPublish).getTime() - new Date(registered).getTime()) / (1000 * 60 * 60)
      if (deltaHours >= 0) deltas.push(deltaHours)
    }

    const avgHours =
      deltas.length > 0 ? Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length) : 0
    const medianHours =
      deltas.length > 0
        ? Math.round(deltas.sort((a, b) => a - b)[Math.floor(deltas.length / 2)]!)
        : 0

    return {
      totalDealers: userFirstVehicle.size,
      avgHours,
      medianHours,
      // Percentage publishing within 24h
      within24h:
        deltas.length > 0
          ? Math.round((deltas.filter((d) => d <= 24).length / deltas.length) * 100)
          : 0,
    }
  }

  return data
})
