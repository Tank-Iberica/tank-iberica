/**
 * useReferral — Dealer referral program composable.
 *
 * Backlog #230 — Referral program (dealer invites dealer).
 * Each dealer has a unique referral_code. When a new dealer signs up
 * using a referral code, both inviter and invitee receive credit bonuses.
 *
 * Tables: dealers (referral_code, referred_by), referral_rewards
 */

interface ReferralReward {
  id: string
  inviter_dealer_id: string
  invitee_dealer_id: string
  inviter_credits_awarded: number
  invitee_credits_awarded: number
  status: 'pending' | 'awarded' | 'expired'
  created_at: string
  awarded_at: string | null
}

export function useReferral() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const referralCode = ref<string | null>(null)
  const rewards = ref<ReferralReward[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** Load the current dealer's referral code */
  async function loadReferralCode(): Promise<void> {
    if (!user.value) return
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('dealers')
        .select('referral_code')
        .eq('user_id', user.value.id)
        .maybeSingle()

      if (err) throw err
      referralCode.value = (data as { referral_code: string | null } | null)?.referral_code ?? null
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  /** Load referral rewards for the current dealer */
  async function loadRewards(): Promise<void> {
    if (!user.value) return
    loading.value = true

    try {
      const { data: dealer } = await supabase
        .from('dealers')
        .select('id')
        .eq('user_id', user.value.id)
        .maybeSingle()

      if (!dealer) return

      const dealerId = (dealer as { id: string }).id

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: err } = await (supabase
        .from('referral_rewards' as never)
        .select(
          'id, inviter_dealer_id, invitee_dealer_id, inviter_credits_awarded, invitee_credits_awarded, status, created_at, awarded_at',
        ) as any)
        .or(`inviter_dealer_id.eq.${dealerId},invitee_dealer_id.eq.${dealerId}`)
        .order('created_at', { ascending: false })

      if (err) throw err
      rewards.value = (data ?? []) as ReferralReward[]
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  /** Apply a referral code during registration */
  async function applyReferralCode(code: string): Promise<boolean> {
    if (!user.value) return false
    error.value = null

    try {
      // Find inviter by code
      const { data: inviter, error: lookupErr } = await supabase
        .from('dealers')
        .select('id')
        .eq('referral_code', code.toUpperCase().trim())
        .maybeSingle()

      if (lookupErr) throw lookupErr
      if (!inviter) {
        error.value = 'Invalid referral code'
        return false
      }

      const inviterId = (inviter as { id: string }).id

      // Set referred_by on current dealer
      const { error: updateErr } = await supabase
        .from('dealers')
        .update({ referred_by: inviterId } as never)
        .eq('user_id', user.value.id)

      if (updateErr) throw updateErr

      // Get current dealer id
      const { data: currentDealer } = await supabase
        .from('dealers')
        .select('id')
        .eq('user_id', user.value.id)
        .maybeSingle()

      if (!currentDealer) return false

      const currentDealerId = (currentDealer as { id: string }).id

      // Create pending referral reward
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: rewardErr } = await (supabase.from('referral_rewards' as never) as any).insert({
        inviter_dealer_id: inviterId,
        invitee_dealer_id: currentDealerId,
        inviter_credits_awarded: 0,
        invitee_credits_awarded: 0,
        status: 'pending',
      } as never)

      if (rewardErr) throw rewardErr

      return true
    } catch (e) {
      error.value = String(e)
      return false
    }
  }

  /** Generate a shareable referral URL */
  const referralUrl = computed(() => {
    if (!referralCode.value) return null
    const siteUrl = (typeof globalThis.window !== 'undefined' ? globalThis.location.origin : '') || ''
    return `${siteUrl}/registro?ref=${referralCode.value}`
  })

  /** Count of successful referrals (awarded status) */
  const successfulReferrals = computed(
    () => rewards.value.filter((r) => r.status === 'awarded').length,
  )

  /** Total credits earned from referrals */
  const totalCreditsEarned = computed(() =>
    rewards.value
      .filter((r) => r.status === 'awarded')
      .reduce((sum, r) => sum + r.inviter_credits_awarded + r.invitee_credits_awarded, 0),
  )

  return {
    referralCode: readonly(referralCode),
    rewards: readonly(rewards),
    loading: readonly(loading),
    error: readonly(error),
    referralUrl,
    successfulReferrals,
    totalCreditsEarned,
    loadReferralCode,
    loadRewards,
    applyReferralCode,
  }
}
