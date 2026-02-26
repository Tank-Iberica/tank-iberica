/**
 * Dealer Market Intelligence endpoint.
 *
 * Returns pricing insights for a dealer's vehicles compared to market.
 * Requires authentication as the dealer or admin.
 *
 * GET /api/dealer/market-intelligence?dealerId=xxx
 */
import { defineEventHandler, getQuery, createError } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { generateDealerIntelligence } from '~/server/services/marketReport'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  const query = getQuery(event)
  const dealerId = query.dealerId as string

  if (!dealerId) {
    throw createError({ statusCode: 400, statusMessage: 'dealerId is required' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Verify the user is the dealer or admin
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (userProfile?.role !== 'admin') {
    const { data: dealer } = await supabase
      .from('dealers')
      .select('id')
      .eq('id', dealerId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!dealer) {
      throw createError({ statusCode: 403, statusMessage: 'Not authorized for this dealer' })
    }
  }

  const report = await generateDealerIntelligence(supabase, dealerId)
  return report
})
