import { defineEventHandler } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { randomUUID } from 'node:crypto'
import { safeError } from '../../utils/safeError'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Authentication required')
  }

  const supabase = serverSupabaseServiceRole(event)

  // Get dealer for this user
  const { data: dealer } = await supabase
    .from('dealers')
    .select('id, company_name, subscription_type')
    .eq('user_id', user.id)
    .single()

  if (!dealer) {
    throw safeError(404, 'Dealer not found')
  }

  // Require at least basic plan
  const plan = dealer.subscription_type || 'free'
  if (plan === 'free') {
    throw safeError(403, 'API access requires at least a Basic subscription')
  }

  // Determine rate limit based on plan
  const planLimits: Record<string, number> = {
    basic: 500,
    premium: 5000,
    founding: 5000,
  }
  const rateLimit = planLimits[plan] || 500

  // Generate new API key
  const apiKey = `trk_${randomUUID().replaceAll('-', '')}`

  // Deactivate any existing keys for this email
  await supabase
    .from('data_subscriptions')
    .update({ active: false })
    .eq('contact_email', user.email ?? '')

  // Insert new subscription with API key
  const companyName =
    typeof dealer.company_name === 'object' && dealer.company_name !== null
      ? (dealer.company_name as Record<string, string>).es ||
        Object.values(dealer.company_name as Record<string, string>)[0] ||
        ''
      : String(dealer.company_name || '')

  const { error } = await supabase.from('data_subscriptions').insert({
    company_name: companyName,
    contact_email: user.email,
    contact_name: user.user_metadata?.display_name || user.email?.split('@')[0] || '',
    plan,
    api_key: apiKey,
    rate_limit_daily: rateLimit,
    active: true,
    starts_at: new Date().toISOString(),
  })

  if (error) {
    throw safeError(500, 'Failed to generate API key')
  }

  return {
    apiKey,
    rateLimit,
    plan,
  }
})
