/**
 * useDealerTrustScore
 *
 * Fetches the dealer's current trust_score and breakdown from the DB.
 * Used in the dealer dashboard to show score + improvement guide (#32).
 *
 * Trust badge tiers:
 *   score < 60  → no badge
 *   score 60-79 → 'verified' (blue checkmark)
 *   score ≥ 80  → 'top' (gold star)
 */

import type { TrustScoreBreakdown } from '~~/server/utils/trustScore'

export type TrustBadgeTier = 'top' | 'verified' | null

export interface TrustScoreData {
  score: number
  breakdown: TrustScoreBreakdown
  updatedAt: string | null
  badge: TrustBadgeTier
}

const BADGE_THRESHOLDS = { top: 80, verified: 60 } as const

function deriveBadge(score: number): TrustBadgeTier {
  if (score >= BADGE_THRESHOLDS.top) return 'top'
  if (score >= BADGE_THRESHOLDS.verified) return 'verified'
  return null
}

export function useDealerTrustScore(dealerId: Ref<string | null>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabaseClient() as any

  const score = ref<number>(0)
  const breakdown = ref<TrustScoreBreakdown | null>(null)
  const updatedAt = ref<string | null>(null)
  const badge = computed<TrustBadgeTier>(() => deriveBadge(score.value))
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** Percentage toward next tier (0-100) for a progress bar */
  const progressPct = computed<number>(() => {
    const s = score.value
    if (s >= BADGE_THRESHOLDS.top) return 100
    if (s >= BADGE_THRESHOLDS.verified) {
      // progress from 60→80
      return Math.round(((s - BADGE_THRESHOLDS.verified) / (BADGE_THRESHOLDS.top - BADGE_THRESHOLDS.verified)) * 100)
    }
    // progress from 0→60
    return Math.round((s / BADGE_THRESHOLDS.verified) * 100)
  })

  /** Points still needed to reach the next tier */
  const pointsToNextTier = computed<number>(() => {
    const s = score.value
    if (s >= BADGE_THRESHOLDS.top) return 0
    if (s >= BADGE_THRESHOLDS.verified) return BADGE_THRESHOLDS.top - s
    return BADGE_THRESHOLDS.verified - s
  })

  /** Next tier name */
  const nextTier = computed<TrustBadgeTier>(() => {
    if (score.value >= BADGE_THRESHOLDS.top) return null
    if (score.value >= BADGE_THRESHOLDS.verified) return 'top'
    return 'verified'
  })

  async function fetchTrustScore() {
    const id = dealerId.value
    if (!id) return

    loading.value = true
    error.value = null

    const { data, error: fetchErr } = await supabase
      .from('dealers')
      .select('trust_score, trust_score_breakdown, trust_score_updated_at')
      .eq('id', id)
      .single()

    loading.value = false

    if (fetchErr || !data) {
      error.value = fetchErr?.message ?? 'Unknown error'
      return
    }

    score.value = (data as { trust_score: number }).trust_score ?? 0
    breakdown.value = ((data as { trust_score_breakdown: TrustScoreBreakdown | null }).trust_score_breakdown) ?? null
    updatedAt.value = (data as { trust_score_updated_at: string | null }).trust_score_updated_at ?? null
  }

  watch(dealerId, (id) => {
    if (id) fetchTrustScore()
  }, { immediate: true })

  return {
    score: readonly(score),
    breakdown: readonly(breakdown),
    updatedAt: readonly(updatedAt),
    badge,
    progressPct,
    pointsToNextTier,
    nextTier,
    loading: readonly(loading),
    error: readonly(error),
    fetchTrustScore,
  }
}
