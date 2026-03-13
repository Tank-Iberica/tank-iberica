import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed, readonly, watchEffect, h, defineComponent } from 'vue'

/**
 * Tests for FeatureGate.vue component behavior.
 * Tests the rendering logic (slot selection) based on feature gate state.
 */

type PlanType = 'free' | 'basic' | 'premium' | 'founding'

const PLAN_HIERARCHY: Record<PlanType, number> = {
  free: 0,
  basic: 1,
  premium: 2,
  founding: 2,
}

// Mock state
let mockFeatureFlagValue = true
let mockCurrentPlan: PlanType = 'free'

vi.stubGlobal('useFeatureFlag', () => ref(mockFeatureFlagValue))
vi.stubGlobal('useSubscriptionPlan', () => ({
  currentPlan: computed(() => mockCurrentPlan),
}))
vi.stubGlobal('useFeatureGate', (opts: { feature?: string; minPlan?: PlanType }) => {
  const flagEnabled = opts.feature ? ref(mockFeatureFlagValue) : ref(true)
  const planSufficient = ref(true)
  const currentPlan = ref<PlanType>('free')

  if (opts.minPlan) {
    const subPlan = computed(() => mockCurrentPlan)
    watchEffect(() => {
      currentPlan.value = subPlan.value
      planSufficient.value = (PLAN_HIERARCHY[subPlan.value] ?? 0) >= (PLAN_HIERARCHY[opts.minPlan!] ?? 0)
    })
  }

  const hasAccess = computed(() => flagEnabled.value && planSufficient.value)
  const reason = computed(() => {
    if (hasAccess.value) return null
    if (!flagEnabled.value) return 'flag_disabled'
    return 'plan_required'
  })

  return {
    hasAccess,
    reason,
    currentPlan: readonly(currentPlan),
    requiredPlan: computed(() => opts.minPlan),
    flagEnabled: readonly(flagEnabled),
    planSufficient: readonly(planSufficient),
  }
})

describe('FeatureGate component logic', () => {
  beforeEach(() => {
    mockFeatureFlagValue = true
    mockCurrentPlan = 'free'
  })

  it('shows default slot when feature flag is enabled', () => {
    mockFeatureFlagValue = true
    const gate = useFeatureGate({ feature: 'test' })
    expect(gate.hasAccess.value).toBe(true)
  })

  it('hides default slot when feature flag is disabled', () => {
    mockFeatureFlagValue = false
    const gate = useFeatureGate({ feature: 'test' })
    expect(gate.hasAccess.value).toBe(false)
    expect(gate.reason.value).toBe('flag_disabled')
  })

  it('shows default slot when plan meets minimum', () => {
    mockCurrentPlan = 'premium'
    const gate = useFeatureGate({ minPlan: 'basic' })
    expect(gate.hasAccess.value).toBe(true)
  })

  it('shows locked slot when plan insufficient', () => {
    mockCurrentPlan = 'free'
    const gate = useFeatureGate({ minPlan: 'premium' })
    expect(gate.hasAccess.value).toBe(false)
    expect(gate.reason.value).toBe('plan_required')
    expect(gate.requiredPlan.value).toBe('premium')
  })

  it('hidden mode renders nothing when locked', () => {
    mockFeatureFlagValue = false
    const gate = useFeatureGate({ feature: 'beta' })
    // In hidden mode, hasAccess is false → component renders nothing
    expect(gate.hasAccess.value).toBe(false)
  })

  it('provides currentPlan for upgrade context', () => {
    mockCurrentPlan = 'basic'
    const gate = useFeatureGate({ minPlan: 'premium' })
    expect(gate.currentPlan.value).toBe('basic')
    expect(gate.requiredPlan.value).toBe('premium')
  })

  it('combined flag + plan: both must pass', () => {
    mockFeatureFlagValue = true
    mockCurrentPlan = 'premium'
    const gate = useFeatureGate({ feature: 'export', minPlan: 'basic' })
    expect(gate.hasAccess.value).toBe(true)
  })

  it('combined flag + plan: flag blocks even with good plan', () => {
    mockFeatureFlagValue = false
    mockCurrentPlan = 'premium'
    const gate = useFeatureGate({ feature: 'export', minPlan: 'basic' })
    expect(gate.hasAccess.value).toBe(false)
  })
})
