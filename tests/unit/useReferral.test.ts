import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, readonly, computed } from 'vue'

// Mock Supabase chain
const mockMaybeSingle = vi.fn()
const mockEq = vi.fn()
const mockOr = vi.fn()
const mockOrder = vi.fn()
const mockSelect = vi.fn()
const mockUpdate = vi.fn()
const mockInsert = vi.fn()

function buildChain() {
  return {
    select: mockSelect,
    update: mockUpdate,
    insert: mockInsert,
    eq: mockEq,
    or: mockOr,
    order: mockOrder,
    maybeSingle: mockMaybeSingle,
  }
}

const mockFrom = vi.fn().mockReturnValue(buildChain())

vi.stubGlobal('useSupabaseClient', () => ({
  from: mockFrom,
}))
vi.stubGlobal('useSupabaseUser', () => ref({ id: 'user-abc' }))
vi.stubGlobal('ref', ref)
vi.stubGlobal('readonly', readonly)
vi.stubGlobal('computed', computed)

describe('useReferral', () => {
  let useReferral: typeof import('../../app/composables/useReferral').useReferral

  beforeEach(async () => {
    vi.clearAllMocks()

    // Reset chain
    mockFrom.mockReturnValue(buildChain())
    mockSelect.mockReturnValue({ eq: mockEq, or: mockOr })
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle, order: mockOrder })
    mockOr.mockReturnValue({ order: mockOrder })
    mockOrder.mockResolvedValue({ data: [], error: null })
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockInsert.mockResolvedValue({ error: null })

    vi.resetModules()
    const mod = await import('../../app/composables/useReferral')
    useReferral = mod.useReferral
  })

  it('exports expected properties', () => {
    const result = useReferral()
    expect(result.referralCode).toBeDefined()
    expect(result.rewards).toBeDefined()
    expect(result.loading).toBeDefined()
    expect(result.error).toBeDefined()
    expect(result.referralUrl).toBeDefined()
    expect(result.successfulReferrals).toBeDefined()
    expect(result.totalCreditsEarned).toBeDefined()
    expect(typeof result.loadReferralCode).toBe('function')
    expect(typeof result.loadRewards).toBe('function')
    expect(typeof result.applyReferralCode).toBe('function')
  })

  it('loadReferralCode fetches dealer referral code', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { referral_code: 'ABC12345' },
      error: null,
    })

    const { loadReferralCode, referralCode } = useReferral()
    await loadReferralCode()

    expect(mockFrom).toHaveBeenCalledWith('dealers')
    expect(referralCode.value).toBe('ABC12345')
  })

  it('loadReferralCode handles null user', async () => {
    vi.stubGlobal('useSupabaseUser', () => ref(null))
    vi.resetModules()
    const mod = await import('../../app/composables/useReferral')
    const { loadReferralCode, referralCode } = mod.useReferral()

    await loadReferralCode()

    expect(referralCode.value).toBeNull()
  })

  it('referralUrl returns null when no code', () => {
    const { referralUrl } = useReferral()
    expect(referralUrl.value).toBeNull()
  })

  it('successfulReferrals counts awarded rewards', () => {
    const result = useReferral()
    // No rewards initially
    expect(result.successfulReferrals.value).toBe(0)
  })

  it('totalCreditsEarned sums awarded rewards', () => {
    const result = useReferral()
    expect(result.totalCreditsEarned.value).toBe(0)
  })

  it('applyReferralCode returns false for null user', async () => {
    vi.stubGlobal('useSupabaseUser', () => ref(null))
    vi.resetModules()
    const mod = await import('../../app/composables/useReferral')
    const { applyReferralCode } = mod.useReferral()

    const result = await applyReferralCode('ABC12345')
    expect(result).toBe(false)
  })
})
