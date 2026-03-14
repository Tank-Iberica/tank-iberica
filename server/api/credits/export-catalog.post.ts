/**
 * POST /api/credits/export-catalog
 *
 * Credit gate for catalog exports (CSV/PDF).
 *
 * - premium / founding plans → free (no credit deduction, just records usage)
 * - basic / classic plans    → deducts 1 credit per export
 * - free plan                → 403 (plan upgrade required)
 *
 * Called by useDashboardExportar before the client-side export runs.
 */
import { defineEventHandler } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { safeError } from '../../utils/safeError'
import { verifyCsrf } from '../../utils/verifyCsrf'

const EXPORT_COST = 1

/** Plans where export is included (no credit charge) */
const FREE_EXPORT_PLANS = ['premium', 'founding'] as const

/** Plans where export costs 1 credit */
const PAID_EXPORT_PLANS = ['basic', 'classic'] as const

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Unauthenticated')

  verifyCsrf(event)

  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl || process.env.SUPABASE_URL
  const serviceKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY

  const headers: Record<string, string> = {
    apikey: serviceKey as string,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }

  // 1. Get dealer
  const dealerRes = await fetch(
    `${supabaseUrl}/rest/v1/dealers?user_id=eq.${user.id}&select=id&limit=1`,
    { headers },
  )
  const dealers = (await dealerRes.json()) as Array<{ id: string }>
  if (!dealers?.length) throw safeError(403, 'No dealer account found')
  const dealerId = dealers[0]!.id

  // 2. Get active subscription plan
  const subRes = await fetch(
    `${supabaseUrl}/rest/v1/dealer_subscriptions?dealer_id=eq.${dealerId}&status=eq.active&select=plan&limit=1`,
    { headers },
  )
  const subs = (await subRes.json()) as Array<{ plan: string }>
  const plan = (subs?.[0]?.plan ?? 'free') as string

  // 3. Check plan eligibility
  if (
    !FREE_EXPORT_PLANS.includes(plan as (typeof FREE_EXPORT_PLANS)[number]) &&
    !PAID_EXPORT_PLANS.includes(plan as (typeof PAID_EXPORT_PLANS)[number])
  ) {
    throw safeError(403, 'Export not available on your current plan. Upgrade to Basic or higher.')
  }

  // 4. Premium/Founding — free export
  if (FREE_EXPORT_PLANS.includes(plan as (typeof FREE_EXPORT_PLANS)[number])) {
    return { free: true, plan, creditsUsed: 0 }
  }

  // 5. Basic/Classic — deduct 1 credit
  const creditsRes = await fetch(
    `${supabaseUrl}/rest/v1/user_credits?user_id=eq.${user.id}&select=balance&limit=1`,
    { headers },
  )
  const creditRows = (await creditsRes.json()) as Array<{ balance: number }>
  const balance = creditRows?.[0]?.balance ?? 0

  if (balance < EXPORT_COST) {
    throw safeError(402, `Insufficient credits. Need ${EXPORT_COST}, have ${balance}.`)
  }

  const newBalance = balance - EXPORT_COST

  await fetch(`${supabaseUrl}/rest/v1/user_credits?user_id=eq.${user.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ balance: newBalance, updated_at: new Date().toISOString() }),
  })

  await fetch(`${supabaseUrl}/rest/v1/credit_transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      user_id: user.id,
      type: 'spend',
      credits: -EXPORT_COST,
      balance_after: newBalance,
      description: 'Exportar catálogo',
    }),
  })

  return { free: false, plan, creditsUsed: EXPORT_COST, creditsRemaining: newBalance }
})
