/**
 * POST /api/credits/highlight-vehicle
 *
 * Dealer pays 2 credits to apply a visual highlight style to a vehicle listing.
 * Styles: 'gold' | 'premium' | 'spotlight' | 'urgent'
 *
 * Highlight is permanent until the dealer removes it or replaces it.
 * Protected with CSRF + auth.
 */
import { defineEventHandler } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { safeError } from '../../utils/safeError'
import { verifyCsrf } from '../../utils/verifyCsrf'
import { validateBody } from '../../utils/validateBody'

const HIGHLIGHT_COST = 2

const VALID_STYLES = ['gold', 'premium', 'spotlight', 'urgent'] as const
type HighlightStyle = (typeof VALID_STYLES)[number]

interface HighlightBody {
  vehicleId: string
  style: HighlightStyle
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Unauthenticated')

  verifyCsrf(event)

  const body = await validateBody<HighlightBody>(event, ['vehicleId', 'style'])
  const { vehicleId, style } = body

  if (!VALID_STYLES.includes(style)) {
    throw safeError(400, `Invalid style. Allowed: ${VALID_STYLES.join(', ')}`)
  }

  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl || process.env.SUPABASE_URL
  const serviceKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }

  // 1. Verify vehicle belongs to this dealer (via dealer linked to user)
  const dealerRes = await fetch(`${supabaseUrl}/rest/v1/dealers?user_id=eq.${user.id}&select=id`, {
    headers,
  })
  const dealers = (await dealerRes.json()) as Array<{ id: string }>
  if (!dealers?.length) throw safeError(403, 'No dealer account found')
  const dealerId = dealers[0]!.id

  const vehicleRes = await fetch(
    `${supabaseUrl}/rest/v1/vehicles?id=eq.${vehicleId}&select=id,dealer_id,highlight_style,status`,
    { headers },
  )
  const vehicles = (await vehicleRes.json()) as Array<{
    id: string
    dealer_id: string | null
    highlight_style: string | null
    status: string
  }>
  if (!vehicles?.length) throw safeError(404, 'Vehicle not found')
  const vehicle = vehicles[0]!
  if (vehicle.dealer_id !== dealerId) throw safeError(403, 'Not your vehicle')

  // If already has this style — idempotent, no charge
  if (vehicle.highlight_style === style) {
    return { alreadyApplied: true, style }
  }

  // 2. Check dealer's credit balance
  const creditsRes = await fetch(
    `${supabaseUrl}/rest/v1/user_credits?user_id=eq.${user.id}&select=balance&limit=1`,
    { headers },
  )
  const creditRows = (await creditsRes.json()) as Array<{ balance: number }>
  const balance = creditRows?.[0]?.balance ?? 0
  if (balance < HIGHLIGHT_COST) {
    throw safeError(402, `Insufficient credits. Need ${HIGHLIGHT_COST}, have ${balance}.`)
  }

  const newBalance = balance - HIGHLIGHT_COST

  // 3. Deduct credits
  await fetch(`${supabaseUrl}/rest/v1/user_credits?user_id=eq.${user.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ balance: newBalance, updated_at: new Date().toISOString() }),
  })

  // 4. Record credit transaction
  await fetch(`${supabaseUrl}/rest/v1/credit_transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      user_id: user.id,
      type: 'spend',
      credits: -HIGHLIGHT_COST,
      balance_after: newBalance,
      vehicle_id: vehicleId,
      description: `Destacado especial: ${style}`,
    }),
  })

  // 5. Apply highlight style to vehicle
  await fetch(`${supabaseUrl}/rest/v1/vehicles?id=eq.${vehicleId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ highlight_style: style }),
  })

  return { highlighted: true, style, creditsRemaining: newBalance }
})
