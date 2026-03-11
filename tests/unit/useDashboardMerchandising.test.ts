import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDashboardMerchandising } from '../../app/composables/dashboard/useDashboardMerchandising'

// ─── Stubs ────────────────────────────────────────────────────────────────────

const mockDealerProfile = { value: { id: 'dealer-1', email: 'dealer@test.com', company_name: 'Dealer Corp' } as unknown }

function makeChain(data: unknown = null, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  ;['insert', 'select', 'eq', 'order'].forEach((m) => { chain[m] = () => chain })
  const resolved = { data, error }
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  mockDealerProfile.value = { id: 'dealer-1', email: 'dealer@test.com', company_name: 'Dealer Corp' }
  vi.stubGlobal('ref', (v: unknown) => {
    let _v = v
    return { get value() { return _v }, set value(x) { _v = x } }
  })
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => makeChain(),
  }))
  vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1', email: 'user@test.com' } }))
  vi.stubGlobal('useDealerDashboard', () => ({
    dealerProfile: mockDealerProfile,
    loadDealer: vi.fn().mockResolvedValue(mockDealerProfile.value),
  }))
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('pageLoading starts as false', () => {
    const c = useDashboardMerchandising()
    expect(c.pageLoading.value).toBe(false)
  })

  it('submitting starts as false', () => {
    const c = useDashboardMerchandising()
    expect(c.submitting.value).toBe(false)
  })

  it('submitted starts as false', () => {
    const c = useDashboardMerchandising()
    expect(c.submitted.value).toBe(false)
  })

  it('submitError starts as null', () => {
    const c = useDashboardMerchandising()
    expect(c.submitError.value).toBeNull()
  })

  it('form starts with empty fields', () => {
    const c = useDashboardMerchandising()
    expect(c.form.value.product).toBe('')
    expect(c.form.value.email).toBe('')
  })
})

// ─── updateFormField ──────────────────────────────────────────────────────────

describe('updateFormField', () => {
  it('updates a field in the form', () => {
    const c = useDashboardMerchandising()
    c.updateFormField('product', 'tshirt')
    expect(c.form.value.product).toBe('tshirt')
  })

  it('updates email field', () => {
    const c = useDashboardMerchandising()
    c.updateFormField('email', 'test@example.com')
    expect(c.form.value.email).toBe('test@example.com')
  })
})

// ─── resetSubmitted ───────────────────────────────────────────────────────────

describe('resetSubmitted', () => {
  it('sets submitted back to false', () => {
    const c = useDashboardMerchandising()
    c.submitted.value = true
    c.resetSubmitted()
    expect(c.submitted.value).toBe(false)
  })
})

// ─── submitInterest validation ────────────────────────────────────────────────

describe('submitInterest', () => {
  it('sets error when product is empty', async () => {
    const c = useDashboardMerchandising()
    c.form.value.product = ''
    c.form.value.email = 'test@test.com'
    await c.submitInterest()
    expect(c.submitError.value).toBeTruthy()
  })

  it('sets error when email is empty', async () => {
    const c = useDashboardMerchandising()
    c.form.value.product = 'tshirt'
    c.form.value.email = ''
    await c.submitInterest()
    expect(c.submitError.value).toBeTruthy()
  })

  it('sets submitted to true on success', async () => {
    const c = useDashboardMerchandising()
    c.form.value.product = 'tshirt'
    c.form.value.email = 'test@test.com'
    await c.submitInterest()
    expect(c.submitted.value).toBe(true)
    expect(c.submitError.value).toBeNull()
  })

  it('resets form on success', async () => {
    const c = useDashboardMerchandising()
    c.form.value.product = 'tshirt'
    c.form.value.email = 'test@test.com'
    c.form.value.notes = 'Some note'
    await c.submitInterest()
    expect(c.form.value.product).toBe('')
    expect(c.form.value.notes).toBe('')
  })

  it('sets error on DB failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => makeChain(null, { message: 'DB error' }),
    }))
    const c = useDashboardMerchandising()
    c.form.value.product = 'tshirt'
    c.form.value.email = 'test@test.com'
    await c.submitInterest()
    expect(c.submitError.value).toBeTruthy()
    expect(c.submitted.value).toBe(false)
  })
})

// ─── init ─────────────────────────────────────────────────────────────────────

describe('init', () => {
  it('loads dealer and sets email from profile', async () => {
    const c = useDashboardMerchandising()
    await c.init()
    expect(c.pageLoading.value).toBe(false)
    expect(c.form.value.email).toBe('dealer@test.com')
  })

  it('falls back to user email when no dealer email', async () => {
    mockDealerProfile.value = { id: 'dealer-1', email: null }
    vi.stubGlobal('useDealerDashboard', () => ({
      dealerProfile: mockDealerProfile,
      loadDealer: vi.fn().mockResolvedValue(mockDealerProfile.value),
    }))
    const c = useDashboardMerchandising()
    await c.init()
    expect(c.form.value.email).toBe('user@test.com')
  })
})
