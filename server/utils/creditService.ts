/**
 * creditService — Server-side credit deduction utility.
 * Uses Supabase service-role REST API directly to avoid auth context issues.
 */

export interface CreditDeductResult {
  success: true
  newBalance: number
}

export interface CreditDeductError {
  success: false
  reason: 'insufficient' | 'not_configured' | 'db_error'
}

export type CreditDeductResponse = CreditDeductResult | CreditDeductError

/**
 * Deducts `amount` credits from a user and records the transaction.
 * Returns the new balance on success or a typed error reason on failure.
 */
export async function deductUserCredits(
  userId: string,
  amount: number,
  description: string,
  vehicleId?: string,
): Promise<CreditDeductResponse> {
  const config = useRuntimeConfig()
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !supabaseKey) {
    return { success: false, reason: 'not_configured' }
  }

  const headers: Record<string, string> = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  }

  // Fetch current balance
  const creditsRes = await fetch(
    `${supabaseUrl}/rest/v1/user_credits?user_id=eq.${userId}&select=balance`,
    { headers },
  )

  if (!creditsRes.ok) {
    return { success: false, reason: 'db_error' }
  }

  const creditsData = (await creditsRes.json()) as Array<{ balance: number }>
  const currentBalance = creditsData[0]?.balance ?? 0

  if (currentBalance < amount) {
    return { success: false, reason: 'insufficient' }
  }

  if (creditsData.length === 0) {
    return { success: false, reason: 'insufficient' }
  }

  const newBalance = currentBalance - amount

  // Deduct credits
  const updateRes = await fetch(
    `${supabaseUrl}/rest/v1/user_credits?user_id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ balance: newBalance, updated_at: new Date().toISOString() }),
    },
  )

  if (!updateRes.ok) {
    return { success: false, reason: 'db_error' }
  }

  // Record credit transaction
  const transactionBody: Record<string, unknown> = {
    user_id: userId,
    type: 'spend',
    credits: -amount,
    balance_after: newBalance,
    description,
    metadata: { vertical: process.env.NUXT_PUBLIC_VERTICAL || 'tracciona' },
  }
  if (vehicleId) transactionBody.vehicle_id = vehicleId

  await fetch(`${supabaseUrl}/rest/v1/credit_transactions`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify(transactionBody),
  })

  return { success: true, newBalance }
}
