import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useValoracion, PROVINCES } from '../../app/composables/useValoracion'

// ─── Stubs ────────────────────────────────────────────────────────────────────

function stubChain(results: { data?: unknown; error?: unknown } = { data: [], error: null }) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'order', 'gte', 'lte', 'ilike', 'select', 'contains'].forEach((m) => {
    chain[m] = () => chain
  })
  const resolved = { data: results.data ?? [], error: results.error ?? null, count: 0 }
  chain.range = () => Promise.resolve(resolved)
  chain.single = () => Promise.resolve({ data: results.data ?? null, error: results.error ?? null })
  chain.limit = () => Promise.resolve(resolved)
  // Make chain thenable so `await query` works without explicit terminal method
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('useI18n', () => ({
    t: (key: string) => key,
    locale: { value: 'es' },
  }))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => stubChain(),
      insert: () => Promise.resolve({ data: null, error: null }),
    }),
  }))
  vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('form.brand starts as empty string', () => {
    const c = useValoracion()
    expect(c.form.brand).toBe('')
  })

  it('form.year starts as null', () => {
    const c = useValoracion()
    expect(c.form.year).toBeNull()
  })

  it('loading starts as false', () => {
    const c = useValoracion()
    expect(c.loading.value).toBe(false)
  })

  it('showResults starts as false', () => {
    const c = useValoracion()
    expect(c.showResults.value).toBe(false)
  })

  it('result starts as null', () => {
    const c = useValoracion()
    expect(c.result.value).toBeNull()
  })

  it('noData starts as false', () => {
    const c = useValoracion()
    expect(c.noData.value).toBe(false)
  })

  it('exposes PROVINCES constant', () => {
    const c = useValoracion()
    expect(c.provinces).toBe(PROVINCES)
    expect(c.provinces.length).toBeGreaterThan(0)
  })
})

// ─── validateForm ─────────────────────────────────────────────────────────────

describe('validateForm', () => {
  it('returns false when brand is empty', () => {
    const c = useValoracion()
    c.form.brand = ''
    c.form.model = 'MAN TGX'
    c.form.year = 2020
    expect(c.validateForm()).toBe(false)
    expect(c.formErrors.brand).toBe(true)
  })

  it('returns false when model is empty', () => {
    const c = useValoracion()
    c.form.brand = 'MAN'
    c.form.model = ''
    c.form.year = 2020
    expect(c.validateForm()).toBe(false)
    expect(c.formErrors.model).toBe(true)
  })

  it('returns false when year is null', () => {
    const c = useValoracion()
    c.form.brand = 'MAN'
    c.form.model = 'TGX'
    c.form.year = null
    expect(c.validateForm()).toBe(false)
    expect(c.formErrors.year).toBe(true)
  })

  it('returns false when year is less than 1970', () => {
    const c = useValoracion()
    c.form.brand = 'MAN'
    c.form.model = 'TGX'
    c.form.year = 1960
    expect(c.validateForm()).toBe(false)
    expect(c.formErrors.year).toBe(true)
  })

  it('returns true when all fields are valid', () => {
    const c = useValoracion()
    c.form.brand = 'MAN'
    c.form.model = 'TGX'
    c.form.year = 2020
    expect(c.validateForm()).toBe(true)
    expect(c.formErrors.brand).toBe(false)
    expect(c.formErrors.model).toBe(false)
    expect(c.formErrors.year).toBe(false)
  })

  it('returns false when brand is only whitespace', () => {
    const c = useValoracion()
    c.form.brand = '   '
    c.form.model = 'TGX'
    c.form.year = 2020
    expect(c.validateForm()).toBe(false)
  })
})

// ─── updateFormField ──────────────────────────────────────────────────────────

describe('updateFormField', () => {
  it('updates brand field', () => {
    const c = useValoracion()
    c.updateFormField('brand', 'Volvo')
    expect(c.form.brand).toBe('Volvo')
  })

  it('updates year field', () => {
    const c = useValoracion()
    c.updateFormField('year', 2019)
    expect(c.form.year).toBe(2019)
  })

  it('updates province field', () => {
    const c = useValoracion()
    c.updateFormField('province', 'Madrid')
    expect(c.form.province).toBe('Madrid')
  })

  it('can set field to null', () => {
    const c = useValoracion()
    c.updateFormField('year', null)
    expect(c.form.year).toBeNull()
  })
})

// ─── resetForm ────────────────────────────────────────────────────────────────

describe('resetForm', () => {
  it('clears all form fields', () => {
    const c = useValoracion()
    c.form.brand = 'MAN'
    c.form.model = 'TGX'
    c.form.year = 2020
    c.resetForm()
    expect(c.form.brand).toBe('')
    expect(c.form.model).toBe('')
    expect(c.form.year).toBeNull()
  })

  it('hides results', () => {
    const c = useValoracion()
    c.showResults.value = true
    c.resetForm()
    expect(c.showResults.value).toBe(false)
  })

  it('clears result data', () => {
    const c = useValoracion()
    c.result.value = { min: 1000, max: 2000, median: 1500, trend: 'stable', trendPct: 0, daysToSell: 30, sampleSize: 5, confidence: 'high' }
    c.resetForm()
    expect(c.result.value).toBeNull()
  })

  it('clears noData flag', () => {
    const c = useValoracion()
    c.noData.value = true
    c.resetForm()
    expect(c.noData.value).toBe(false)
  })

  it('clears form errors', () => {
    const c = useValoracion()
    c.form.brand = ''
    c.validateForm()
    expect(c.formErrors.brand).toBe(true)
    c.resetForm()
    expect(c.formErrors.brand).toBe(false)
  })
})

// ─── formatPrice ──────────────────────────────────────────────────────────────

describe('formatPrice', () => {
  it('formats number as EUR currency', () => {
    const c = useValoracion()
    const result = c.formatPrice(25000)
    expect(result).toContain('25')
    expect(result).toContain('€')
  })

  it('formats 0 as currency', () => {
    const c = useValoracion()
    const result = c.formatPrice(0)
    expect(result).toContain('0')
  })

  it('formats large numbers with maximumFractionDigits 0', () => {
    const c = useValoracion()
    // es-ES uses '.' as thousands separator and ',' as decimal — no trailing decimals
    const result = c.formatPrice(25001)
    expect(result).toContain('25')
    expect(result).toContain('001')
  })
})

// ─── priceBarPosition ─────────────────────────────────────────────────────────

describe('priceBarPosition', () => {
  it('returns 50 when max equals min', () => {
    const c = useValoracion()
    expect(c.priceBarPosition(1000, 1000, 1000)).toBe(50)
  })

  it('returns 0 when value equals min', () => {
    const c = useValoracion()
    expect(c.priceBarPosition(0, 0, 100)).toBe(0)
  })

  it('returns 100 when value equals max', () => {
    const c = useValoracion()
    expect(c.priceBarPosition(100, 0, 100)).toBe(100)
  })

  it('returns 50 when value is midpoint', () => {
    const c = useValoracion()
    expect(c.priceBarPosition(50, 0, 100)).toBe(50)
  })

  it('clamps below 0 to 0', () => {
    const c = useValoracion()
    expect(c.priceBarPosition(-10, 0, 100)).toBe(0)
  })

  it('clamps above 100 to 100', () => {
    const c = useValoracion()
    expect(c.priceBarPosition(200, 0, 100)).toBe(100)
  })
})

// ─── confidenceColor ──────────────────────────────────────────────────────────

describe('confidenceColor', () => {
  it('returns success color for high confidence', () => {
    const c = useValoracion()
    expect(c.confidenceColor('high')).toBe('var(--color-success)')
  })

  it('returns warning color for medium confidence', () => {
    const c = useValoracion()
    expect(c.confidenceColor('medium')).toBe('var(--color-warning)')
  })

  it('returns error color for low confidence', () => {
    const c = useValoracion()
    expect(c.confidenceColor('low')).toBe('var(--color-error)')
  })

  it('returns error color for unknown confidence', () => {
    const c = useValoracion()
    expect(c.confidenceColor('unknown')).toBe('var(--color-error)')
  })
})

// ─── trendIcon ────────────────────────────────────────────────────────────────

describe('trendIcon', () => {
  it('returns up arrow for rising trend', () => {
    const c = useValoracion()
    expect(c.trendIcon('rising')).toBe('↗')
  })

  it('returns down arrow for falling trend', () => {
    const c = useValoracion()
    expect(c.trendIcon('falling')).toBe('↘')
  })

  it('returns right arrow for stable trend', () => {
    const c = useValoracion()
    expect(c.trendIcon('stable')).toBe('→')
  })
})

// ─── trendLabel / confidenceLabel ─────────────────────────────────────────────

describe('trendLabel', () => {
  it('returns i18n key for rising', () => {
    const c = useValoracion()
    expect(c.trendLabel('rising')).toBe('valuation.rising')
  })

  it('returns i18n key for falling', () => {
    const c = useValoracion()
    expect(c.trendLabel('falling')).toBe('valuation.falling')
  })

  it('returns stable key for unknown trend', () => {
    const c = useValoracion()
    expect(c.trendLabel('stable')).toBe('valuation.stable')
  })
})

describe('confidenceLabel', () => {
  it('returns high label for high confidence', () => {
    const c = useValoracion()
    expect(c.confidenceLabel('high')).toBe('valuation.confidenceHigh')
  })

  it('returns medium label for medium confidence', () => {
    const c = useValoracion()
    expect(c.confidenceLabel('medium')).toBe('valuation.confidenceMedium')
  })

  it('returns low label for low confidence', () => {
    const c = useValoracion()
    expect(c.confidenceLabel('low')).toBe('valuation.confidenceLow')
  })
})

// ─── subcategoryLabel ─────────────────────────────────────────────────────────

describe('subcategoryLabel', () => {
  it('returns localized name from name object when available', () => {
    const c = useValoracion()
    const sub = { id: '1', name: { es: 'Tractoras', en: 'Tractors' }, name_es: 'Tractoras', slug: 'tractoras' }
    const result = c.subcategoryLabel(sub)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('falls back to name_es when name is null', () => {
    const c = useValoracion()
    const sub = { id: '1', name: null, name_es: 'Tractoras', slug: 'tractoras' }
    expect(c.subcategoryLabel(sub)).toBe('Tractoras')
  })
})

// ─── calculateValuation (noData path) ────────────────────────────────────────

describe('calculateValuation', () => {
  it('does not proceed when form is invalid', async () => {
    const c = useValoracion()
    // brand empty → invalid
    c.form.brand = ''
    c.form.model = 'TGX'
    c.form.year = 2020
    await c.calculateValuation()
    expect(c.loading.value).toBe(false)
    expect(c.showResults.value).toBe(false)
  })

  it('sets noData when market data is empty', async () => {
    // default stub already returns empty data
    const c = useValoracion()
    c.form.brand = 'MAN'
    c.form.model = 'TGX'
    c.form.year = 2020
    await c.calculateValuation()
    expect(c.noData.value).toBe(true)
    expect(c.showResults.value).toBe(true)
  })

  it('sets loading to false after calculation', async () => {
    const c = useValoracion()
    c.form.brand = 'MAN'
    c.form.model = 'TGX'
    c.form.year = 2020
    await c.calculateValuation()
    expect(c.loading.value).toBe(false)
  })

  it('sets result when market data has prices', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => stubChain({ data: [
          { avg_price: 20000, avg_days_listed: 30 },
          { avg_price: 25000, avg_days_listed: 45 },
        ] as unknown }),
        insert: () => Promise.resolve({ data: null, error: null }),
      }),
    }))
    const c = useValoracion()
    c.form.brand = 'MAN'
    c.form.model = 'TGX'
    c.form.year = 2020
    await c.calculateValuation()
    expect(c.result.value).not.toBeNull()
    expect(c.showResults.value).toBe(true)
  })

  it('applies subcategory filter when set', async () => {
    const eqCalls: string[] = []
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => {
          const chain: Record<string, unknown> = {}
          ;['order', 'gte', 'lte', 'ilike', 'select', 'contains'].forEach((m) => { chain[m] = () => chain })
          chain.eq = (_col: string, val: string) => { eqCalls.push(val); return chain }
          chain.limit = () => Promise.resolve({ data: [], error: null })
          chain.then = (resolve: (v: unknown) => void) => Promise.resolve({ data: [], error: null }).then(resolve)
          chain.catch = (reject: (e: unknown) => void) => Promise.resolve({ data: [], error: null }).catch(reject)
          return chain
        },
        insert: () => Promise.resolve({ data: null, error: null }),
      }),
    }))
    const c = useValoracion()
    c.form.brand = 'MAN'
    c.form.model = 'TGX'
    c.form.year = 2020
    c.form.subcategory = 'tractoras'
    await c.calculateValuation()
    expect(eqCalls).toContain('tractoras')
  })

  it('applies province filter when set', async () => {
    const eqCalls: string[] = []
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => {
          const chain: Record<string, unknown> = {}
          ;['order', 'gte', 'lte', 'ilike', 'select', 'contains'].forEach((m) => { chain[m] = () => chain })
          chain.eq = (_col: string, val: string) => { eqCalls.push(val); return chain }
          chain.limit = () => Promise.resolve({ data: [], error: null })
          chain.then = (resolve: (v: unknown) => void) => Promise.resolve({ data: [], error: null }).then(resolve)
          chain.catch = (reject: (e: unknown) => void) => Promise.resolve({ data: [], error: null }).catch(reject)
          return chain
        },
        insert: () => Promise.resolve({ data: null, error: null }),
      }),
    }))
    const c = useValoracion()
    c.form.brand = 'MAN'
    c.form.model = 'TGX'
    c.form.year = 2020
    c.form.province = 'Madrid'
    await c.calculateValuation()
    expect(eqCalls).toContain('Madrid')
  })
})

// ─── formatDate ──────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats date string in Spanish locale', () => {
    const c = useValoracion()
    const result = c.formatDate('2026-03-05T10:00:00Z')
    expect(result).toContain('2026')
    expect(result.length).toBeGreaterThan(0)
  })

  it('formats date in English locale', () => {
    vi.stubGlobal('useI18n', () => ({
      t: (key: string) => key,
      locale: { value: 'en' },
    }))
    const c = useValoracion()
    const result = c.formatDate('2026-03-05T10:00:00Z')
    expect(result).toContain('2026')
  })
})

// ─── init ────────────────────────────────────────────────────────────────

describe('init', () => {
  it('loads subcategories on init', async () => {
    const subcatData = [{ id: 's1', name: { es: 'Tractoras' }, name_es: 'Tractoras', slug: 'tractoras' }]
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => stubChain({ data: subcatData }),
        insert: () => Promise.resolve({ data: null, error: null }),
      }),
    }))
    const c = useValoracion()
    await c.init()
    expect(c.subcategories.value).toHaveLength(1)
  })

  it('loads history when user is authenticated', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
    const historyData = [{ id: 'h1', created_at: '2026-03-01', brand: 'MAN', model: 'TGX', year: 2020, estimated_min: 15000, estimated_max: 25000, estimated_median: 20000, confidence: 'high' }]
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => stubChain({ data: historyData }),
        insert: () => Promise.resolve({ data: null, error: null }),
      }),
    }))
    const c = useValoracion()
    await c.init()
    expect(c.history.value).toHaveLength(1)
  })

  it('does not load history when no user', async () => {
    const c = useValoracion()
    await c.init()
    expect(c.history.value).toHaveLength(0)
  })
})

// ─── resetForm extended ──────────────────────────────────────────────────

describe('resetForm extended', () => {
  it('resets km, province, subcategory, email', () => {
    const c = useValoracion()
    c.form.km = 150000
    c.form.province = 'Barcelona'
    c.form.subcategory = 'tractoras'
    c.form.email = 'test@test.com'
    c.resetForm()
    expect(c.form.km).toBeNull()
    expect(c.form.province).toBe('')
    expect(c.form.subcategory).toBe('')
    expect(c.form.email).toBe('')
  })
})
