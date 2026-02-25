import { createError, defineEventHandler } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Get dealer for this user
  const { data: dealer } = await supabase
    .from('dealers')
    .select('id, subscription_type')
    .eq('user_id', user.id)
    .single()

  if (!dealer) {
    throw createError({ statusCode: 404, message: 'Dealer not found' })
  }

  // Get existing API key from data_subscriptions
  const { data: sub } = await supabase
    .from('data_subscriptions')
    .select('api_key, rate_limit_daily, active')
    .eq('contact_email', user.email)
    .eq('active', true)
    .maybeSingle()

  // Get usage count for today
  let usageToday = 0
  if (sub?.api_key) {
    const today = new Date().toISOString().split('T')[0]
    const { count } = await supabase
      .from('api_usage')
      .select('*', { count: 'exact', head: true })
      .eq('api_key', sub.api_key)
      .gte('created_at', today + 'T00:00:00Z')

    usageToday = count || 0
  }

  // Determine rate limit based on plan
  const planLimits: Record<string, number> = {
    free: 50,
    basic: 500,
    premium: 5000,
    founding: 5000,
  }
  const rateLimit = planLimits[dealer.subscription_type || 'free'] || 50

  // Mask API key for display (show only last 8 chars)
  const maskedKey = sub?.api_key
    ? `trk_${'*'.repeat(Math.max(0, sub.api_key.length - 12))}${sub.api_key.slice(-8)}`
    : null

  return {
    apiKey: maskedKey,
    hasKey: !!sub?.api_key,
    usageToday,
    rateLimit,
    plan: dealer.subscription_type || 'free',
  }
})
