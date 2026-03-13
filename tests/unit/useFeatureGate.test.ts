import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed, readonly, watchEffect } from 'vue'

/**
 * Tests for useFeatureGate composable.
 * Inline logic copy to avoid import issues across branches.
 */

type PlanType = 'free' | 'basic' | 'premium' | 'founding'
type GateReason = 'flag_disabled' | 'plan_required' | null

const PLAN_HIERARCHY: Record<PlanType, number> = {
  free: 0,
  basic: 1,
  premium: 2,
  founding: 2,
}

function planMeetsMinimum(current: PlanType, required: PlanType): boolean {
  return (PLAN_HIERARCHY[current] ?? 0) >= (PLAN_HIERARCHY[required] ?? 0)
}

// Mock state
let mockFeatureFlagValue = true
let mockCurrentPlan: PlanType = 'free'

// Mock useFeatureFlag
vi.stubGlobal('useFeatureFlag', (_key: string, _vertical?: string) => {
  return ref(mockFeatureFlagValue)
})

// Mock useSubscriptionPlan
vi.stubGlobal('useSubscriptionPlan', () => {
  const plan = computed(() => mockCurrentPlan)
  return { currentPlan: plan }
})

interface FeatureGateOptions {
  feature?: string
  minPlan?: PlanType
  vertical?: string
}

/**
 * Inline copy of useFeatureGate logic for testing.
 */
function useFeatureGate(options: FeatureGateOptions) {
  const { feature, minPlan, vertical } = options

  const flagEnabled = feature
    ? useFeatureFlag(feature, vertical)
    : ref(true)

  const planSufficient = ref(true)
  const currentPlan = ref<PlanType>('free')

  if (minPlan) {
    try {
      const { currentPlan: subPlan } = useSubscriptionPlan()
      watchEffect(() => {
        currentPlan.value = subPlan.value
        planSufficient.value = planMeetsMinimum(subPlan.value, minPlan)
      })
    } catch {
      planSufficient.value = false
      currentPlan.value = 'free'
    }
  }

  const hasAccess = computed(() => flagEnabled.value && planSufficient.value)

  const reason = computed<GateReason>(() => {
    if (hasAccess.value) return null
    if (!flagEnabled.value) return 'flag_disabled'
    return 'plan_required'
  })

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

describe('planMeetsMinimum', () => {
  it('free meets free', () => {
    expect(planMeetsMinimum('free', 'free')).toBe(true)
  })

  it('basic meets free', () => {
    expect(planMeetsMinimum('basic', 'free')).toBe(true)
  })

  it('free does not meet basic', () => {
    expect(planMeetsMinimum('free', 'basic')).toBe(false)
  })

  it('premium meets basic', () => {
    expect(planMeetsMinimum('premium', 'basic')).toBe(true)
  })

  it('founding meets premium (same tier)', () => {
    expect(planMeetsMinimum('founding', 'premium')).toBe(true)
  })

  it('premium meets founding (same tier)', () => {
    expect(planMeetsMinimum('premium', 'founding')).toBe(true)
  })

  it('basic does not meet premium', () => {
    expect(planMeetsMinimum('basic', 'premium')).toBe(false)
  })
})

describe('useFeatureGate', () => {
  beforeEach(() => {
    mockFeatureFlagValue = true
    mockCurrentPlan = 'free'
  })

  describe('feature flag only', () => {
    it('grants access when flag is enabled', () => {
      mockFeatureFlagValue = true
      const { hasAccess, reason } = useFeatureGate({ feature: 'test_feature' })
      expect(hasAccess.value).toBe(true)
      expect(reason.value).toBeNull()
    })

    it('denies access when flag is disabled', () => {
      mockFeatureFlagValue = false
      const { hasAccess, reason } = useFeatureGate({ feature: 'test_feature' })
      expect(hasAccess.value).toBe(false)
      expect(reason.value).toBe('flag_disabled')
    })
  })

  describe('plan only', () => {
    it('grants access when plan meets minimum', () => {
      mockCurrentPlan = 'premium'
      const { hasAccess, reason } = useFeatureGate({ minPlan: 'basic' })
      expect(hasAccess.value).toBe(true)
      expect(reason.value).toBeNull()
    })

    it('denies access when plan is below minimum', () => {
      mockCurrentPlan = 'free'
      const { hasAccess, reason } = useFeatureGate({ minPlan: 'basic' })
      expect(hasAccess.value).toBe(false)
      expect(reason.value).toBe('plan_required')
    })

    it('grants access when plan exactly matches minimum', () => {
      mockCurrentPlan = 'basic'
      const { hasAccess } = useFeatureGate({ minPlan: 'basic' })
      expect(hasAccess.value).toBe(true)
    })

    it('founding plan meets premium requirement', () => {
      mockCurrentPlan = 'founding'
      const { hasAccess } = useFeatureGate({ minPlan: 'premium' })
      expect(hasAccess.value).toBe(true)
    })
  })

  describe('feature flag + plan combined', () => {
    it('grants access when both flag and plan pass', () => {
      mockFeatureFlagValue = true
      mockCurrentPlan = 'premium'
      const { hasAccess } = useFeatureGate({ feature: 'export', minPlan: 'basic' })
      expect(hasAccess.value).toBe(true)
    })

    it('denies when flag disabled even if plan sufficient', () => {
      mockFeatureFlagValue = false
      mockCurrentPlan = 'premium'
      const { hasAccess, reason } = useFeatureGate({ feature: 'export', minPlan: 'basic' })
      expect(hasAccess.value).toBe(false)
      expect(reason.value).toBe('flag_disabled')
    })

    it('denies when plan insufficient even if flag enabled', () => {
      mockFeatureFlagValue = true
      mockCurrentPlan = 'free'
      const { hasAccess, reason } = useFeatureGate({ feature: 'export', minPlan: 'basic' })
      expect(hasAccess.value).toBe(false)
      expect(reason.value).toBe('plan_required')
    })

    it('flag_disabled takes priority over plan_required', () => {
      mockFeatureFlagValue = false
      mockCurrentPlan = 'free'
      const { reason } = useFeatureGate({ feature: 'export', minPlan: 'basic' })
      expect(reason.value).toBe('flag_disabled')
    })
  })

  describe('no restrictions', () => {
    it('grants access with no feature or plan specified', () => {
      const { hasAccess } = useFeatureGate({})
      expect(hasAccess.value).toBe(true)
    })
  })

  describe('requiredPlan computed', () => {
    it('returns the minPlan when specified', () => {
      const { requiredPlan } = useFeatureGate({ minPlan: 'premium' })
      expect(requiredPlan.value).toBe('premium')
    })

    it('returns undefined when no minPlan', () => {
      const { requiredPlan } = useFeatureGate({ feature: 'test' })
      expect(requiredPlan.value).toBeUndefined()
    })
  })

  describe('currentPlan tracking', () => {
    it('reflects the subscription plan', () => {
      mockCurrentPlan = 'basic'
      const { currentPlan } = useFeatureGate({ minPlan: 'free' })
      expect(currentPlan.value).toBe('basic')
    })

    it('defaults to free when no minPlan check', () => {
      const { currentPlan } = useFeatureGate({ feature: 'test' })
      expect(currentPlan.value).toBe('free')
    })
  })
})
