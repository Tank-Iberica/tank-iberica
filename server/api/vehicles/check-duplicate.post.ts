import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { findDuplicates } from '../../utils/vehicleDuplicateDetection'
import type { DuplicateCheckInput } from '../../utils/vehicleDuplicateDetection'

/**
 * POST /api/vehicles/check-duplicate
 * Check for potential duplicate vehicles before publishing.
 * Requires authentication (seller must be logged in).
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody<DuplicateCheckInput>(event)

  if (!body.brand || !body.model) {
    throw createError({ statusCode: 400, message: 'brand and model are required' })
  }

  const supabase = serverSupabaseServiceRole(event)
  const duplicates = await findDuplicates(supabase, {
    brand: body.brand,
    model: body.model,
    year: body.year,
    price: body.price,
    coverUrl: body.coverUrl,
    excludeId: body.excludeId,
  })

  return {
    hasDuplicates: duplicates.length > 0,
    duplicates,
  }
})
