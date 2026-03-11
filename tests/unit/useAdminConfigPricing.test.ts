import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  useAdminConfigPricing,
  planDefinitions,
  commissionDefinitions,
} from '../../app/composables/admin/useAdminConfigPricing'

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('getVerticalSlug', () => 'tracciona')
})

// ─── planDefinitions (exported constant) ──────────────────────────────────

describe('planDefinitions', () => {
  it('has 3 plans (founding, basic, premium)', () => {
    expect(planDefinitions).toHaveLength(3)
  })

  it('founding plan is readonly', () => {
    const founding = planDefinitions.find((p) => p.key === 'founding')
    expect(founding?.readonly).toBe(true)
  })

  it('basic plan is not readonly', () => {
    const basic = planDefinitions.find((p) => p.key === 'basic')
    expect(basic?.readonly).toBe(false)
  })

  it('premium plan is not readonly', () => {
    const premium = planDefinitions.find((p) => p.key === 'premium')
    expect(premium?.readonly).toBe(false)
  })

  it('each plan has key and labelKey', () => {
    for (const plan of planDefinitions) {
      expect(plan).toHaveProperty('key')
      expect(plan).toHaveProperty('labelKey')
    }
  })
})

// ─── commissionDefinitions (exported constant) ────────────────────────────

describe('commissionDefinitions', () => {
  it('has 7 commission types', () => {
    expect(commissionDefinitions).toHaveLength(7)
  })

  it('sale_pct is of type pct', () => {
    const salePct = commissionDefinitions.find((c) => c.key === 'sale_pct')
    expect(salePct?.type).toBe('pct')
  })

  it('verification_level1_cents is of type cents', () => {
    const v1 = commissionDefinitions.find((c) => c.key === 'verification_level1_cents')
    expect(v1?.type).toBe('cents')
  })

  it('each definition has key, labelKey, type', () => {
    for (const def of commissionDefinitions) {
      expect(def).toHaveProperty('key')
      expect(def).toHaveProperty('labelKey')
      expect(def).toHaveProperty('type')
    }
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('loading starts as true', () => {
    const c = useAdminConfigPricing()
    expect(c.loading.value).toBe(true)
  })

  it('savingPrices starts as false', () => {
    const c = useAdminConfigPricing()
    expect(c.savingPrices.value).toBe(false)
  })

  it('savingCommissions starts as false', () => {
    const c = useAdminConfigPricing()
    expect(c.savingCommissions.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useAdminConfigPricing()
    expect(c.error.value).toBeNull()
  })

  it('successPrices starts as false', () => {
    const c = useAdminConfigPricing()
    expect(c.successPrices.value).toBe(false)
  })

  it('successCommissions starts as false', () => {
    const c = useAdminConfigPricing()
    expect(c.successCommissions.value).toBe(false)
  })

  it('subscriptionPrices has founding, basic, premium with 0 values', () => {
    const c = useAdminConfigPricing()
    expect(c.subscriptionPrices.value['founding']).toEqual({ monthly: 0, annual: 0 })
    expect(c.subscriptionPrices.value['basic']).toEqual({ monthly: 0, annual: 0 })
    expect(c.subscriptionPrices.value['premium']).toEqual({ monthly: 0, annual: 0 })
  })

  it('commissionRates has all 7 keys defaulting to 0', () => {
    const c = useAdminConfigPricing()
    for (const def of commissionDefinitions) {
      expect(c.commissionRates.value[def.key]).toBe(0)
    }
  })
})

// ─── updatePrice ──────────────────────────────────────────────────────────

describe('updatePrice', () => {
  it('updates monthly price for basic plan', () => {
    const c = useAdminConfigPricing()
    c.updatePrice('basic', 'monthly', 29)
    expect(c.subscriptionPrices.value['basic']?.monthly).toBe(29)
  })

  it('updates annual price for premium plan', () => {
    const c = useAdminConfigPricing()
    c.updatePrice('premium', 'annual', 790)
    expect(c.subscriptionPrices.value['premium']?.annual).toBe(790)
  })
})

// ─── updateRate ───────────────────────────────────────────────────────────

describe('updateRate', () => {
  it('updates sale_pct commission rate', () => {
    const c = useAdminConfigPricing()
    c.updateRate('sale_pct', 5)
    expect(c.commissionRates.value['sale_pct']).toBe(5)
  })

  it('updates verification_level1_cents', () => {
    const c = useAdminConfigPricing()
    c.updateRate('verification_level1_cents', 49)
    expect(c.commissionRates.value['verification_level1_cents']).toBe(49)
  })
})

// ─── dismissError ─────────────────────────────────────────────────────────

describe('dismissError', () => {
  it('clears the error value', () => {
    const c = useAdminConfigPricing()
    c.error.value = 'Some error'
    c.dismissError()
    expect(c.error.value).toBeNull()
  })
})

// ─── loadConfig ───────────────────────────────────────────────────────────

describe('loadConfig', () => {
  it('sets loading to false after completion', async () => {
    const c = useAdminConfigPricing()
    await c.loadConfig()
    expect(c.loading.value).toBe(false)
  })

  it('sets an error when data is null (null access throws internally)', async () => {
    // Default mock returns { data: null, error: null }.
    // Code does `data.subscription_prices` → TypeError → caught → error.value set.
    const c = useAdminConfigPricing()
    await c.loadConfig()
    expect(c.error.value).toBeTruthy()
    expect(c.loading.value).toBe(false)
  })

  it('sets error when fetchError is returned', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      }),
    }))
    const c = useAdminConfigPricing()
    await c.loadConfig()
    expect(c.error.value).toBe('Not found')
    expect(c.loading.value).toBe(false)
  })

  it('populates subscriptionPrices from config data', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: {
                  subscription_prices: {
                    basic: { monthly_cents: 2900, annual_cents: 29000 },
                    premium: { monthly_cents: 7900, annual_cents: 79000 },
                  },
                  commission_rates: {},
                },
                error: null,
              }),
          }),
        }),
      }),
    }))
    const c = useAdminConfigPricing()
    await c.loadConfig()
    expect(c.subscriptionPrices.value['basic']?.monthly).toBe(29) // centsToEuros(2900)
    expect(c.subscriptionPrices.value['premium']?.annual).toBe(790) // centsToEuros(79000)
  })
})
