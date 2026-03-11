/**
 * Dealer Market Intelligence endpoint.
 *
 * Returns pricing insights for a dealer's vehicles compared to market.
 * Requires authentication as the dealer or admin.
 *
 * GET /api/dealer/market-intelligence?dealerId=xxx
 */
import { defineEventHandler, getQuery, setResponseHeader } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { generateDealerIntelligence } from '~~/server/services/marketReport'
import { safeError } from '~~/server/utils/safeError'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Authentication required')
  }

  const query = getQuery(event)
  const dealerId = query.dealerId as string

  if (!dealerId) {
    throw safeError(400, 'dealerId is required')
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
      throw safeError(403, 'Not authorized for this dealer')
    }
  }

  const report = await generateDealerIntelligence(supabase, dealerId)
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  return report
})
