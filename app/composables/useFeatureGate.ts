/**
 * Universal feature gating composable.
 *
 * Combines feature flags (DB toggles) with subscription plan enforcement
 * to provide a single `hasAccess` check. Used by FeatureGate.vue and
 * programmatically in composables/pages.
 *
 * Usage:
 *   const { hasAccess } = useFeatureGate({ feature: 'auctions' })
 *   const { hasAccess } = useFeatureGate({ minPlan: 'premium' })
 *   const { hasAccess } = useFeatureGate({ feature: 'export', minPlan: 'basic' })
 */

import type { PlanType } from './useSubscriptionPlan'

export type GateReason = 'flag_disabled' | 'plan_required' | null

export interface FeatureGateOptions {
  /** Feature flag key from feature_flags table */
  feature?: string
  /** Minimum subscription plan required */
  minPlan?: PlanType
  /** Vertical to check feature flag against (defaults to runtime config) */
  vertical?: string
}

const PLAN_HIERARCHY: Record<PlanType, number> = {
  free: 0,
  basic: 1,
  classic: 1,
  premium: 2,
  founding: 2,
}

/**
 * Check if a plan meets or exceeds the required minimum.
 */
export function planMeetsMinimum(current: PlanType, required: PlanType): boolean {
  return (PLAN_HIERARCHY[current] ?? 0) >= (PLAN_HIERARCHY[required] ?? 0)
}

export function useFeatureGate(options: FeatureGateOptions) {
  const { feature, minPlan, vertical } = options

  // Feature flag check (reactive)
  const flagEnabled = feature
    ? useFeatureFlag(feature, vertical)
    : ref(true)

  // Plan check — need the current plan from subscription composable
  // We use a reactive ref that gets populated when subscription data loads
  const planSufficient = ref(true)
  const currentPlan = ref<PlanType>('free')

  if (minPlan) {
    // Try to get the dealer's subscription plan
    // This works in pages/components where the user is authenticated
    try {
      const { currentPlan: subPlan } = useSubscriptionPlan()
      watchEffect(() => {
        currentPlan.value = subPlan.value
        planSufficient.value = planMeetsMinimum(subPlan.value, minPlan)
      })
    } catch {
      // Outside Nuxt context or no auth — default to free
      planSufficient.value = false
      currentPlan.value = 'free'
    }
  }

  /** Whether the user has full access (flag enabled AND plan sufficient) */
  const hasAccess = computed(() => flagEnabled.value && planSufficient.value)

  /** Why access is denied (null if access granted) */
  const reason = computed<GateReason>(() => {
    if (hasAccess.value) return null
    if (!flagEnabled.value) return 'flag_disabled'
    return 'plan_required'
  })

  /** The minimum plan required (for upgrade prompts) */
  const requiredPlan = computed<PlanType | undefined>(() => minPlan)

  return {
    hasAccess,
    reason,
    currentPlan: readonly(currentPlan),
    requiredPlan,
    flagEnabled: readonly(flagEnabled),
    planSufficient: readonly(planSufficient),
  }
}
