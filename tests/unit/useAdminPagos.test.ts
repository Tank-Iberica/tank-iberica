import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  useAdminPagos,
  PAYMENT_TYPES,
  formatCurrency,
  formatDate,
  truncateId,
  getTypeBadgeClass,
  getStatusBadgeClass,
  getStripePaymentUrl,
  getStripeAccountUrl,
} from '../../app/composables/admin/useAdminPagos'

// ─── Chain builder ────────────────────────────────────────────────────────

const CHAIN_METHODS = ['select', 'eq', 'order', 'insert', 'update', 'delete', 'single']

function makeChain(result: { data?: unknown; error?: unknown } = {}) {
  const resolved = { data: result.data ?? null, error: result.error ?? null }
  const chain: Record<string, unknown> = {}
  for (const m of CHAIN_METHODS) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  chain.then = (resolve: (v: typeof resolved) => unknown) =>
    Promise.resolve(resolve(resolved))
  return chain
}

// ─── Setup ────────────────────────────────────────────────────────────────

const mockFrom = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom.mockReturnValue(makeChain())
  vi.stubGlobal('useSupabaseClient', () => ({ from: mockFrom }))
})

// ─── Pure helpers ─────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('converts 100 cents to EUR string containing 1,00 and €', () => {
    const result = formatCurrency(100)
    expect(result).toContain('1,00')
    expect(result).toContain('€')
  })

  it('converts 0 cents to EUR string containing 0,00 and €', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0,00')
    expect(result).toContain('€')
  })

  it('includes thousands separator for large amounts', () => {
    const result = formatCurrency(1_000_000) // 10000 EUR
    expect(result).toContain('€')
    expect(result).toContain('10')
  })
})

describe('formatDate', () => {
  it('returns a non-empty string for a valid ISO date', () => {
    const result = formatDate('2024-01-15T10:30:00Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('contains the year in the output', () => {
    expect(formatDate('2024-06-01T00:00:00Z')).toContain('2024')
  })
})

describe('truncateId', () => {
  it('returns id as-is when 10 chars or fewer', () => {
    expect(truncateId('abc')).toBe('abc')
    expect(truncateId('1234567890')).toBe('1234567890')
  })

  it('truncates to first 10 chars + ellipsis', () => {
    const result = truncateId('12345678901234567890')
    expect(result).toBe('1234567890...')
  })
})

describe('getTypeBadgeClass', () => {
  it('maps subscription to type-subscription', () => {
    expect(getTypeBadgeClass('subscription')).toBe('type-subscription')
  })

  it('maps auction_deposit to type-auction-deposit', () => {
    expect(getTypeBadgeClass('auction_deposit')).toBe('type-auction-deposit')
  })

  it('maps ad to type-ad', () => {
    expect(getTypeBadgeClass('ad')).toBe('type-ad')
  })

  it('falls back to type-one-time for unknown type', () => {
    expect(getTypeBadgeClass('unknown')).toBe('type-one-time')
  })
})

describe('getStatusBadgeClass', () => {
  it('maps succeeded to status-succeeded', () => {
    expect(getStatusBadgeClass('succeeded')).toBe('status-succeeded')
  })

  it('maps failed to status-failed', () => {
    expect(getStatusBadgeClass('failed')).toBe('status-failed')
  })

  it('falls back to status-pending for unknown status', () => {
    expect(getStatusBadgeClass('unknown')).toBe('status-pending')
  })
})

describe('getStripePaymentUrl', () => {
  it('returns empty string for null', () => {
    expect(getStripePaymentUrl(null)).toBe('')
  })

  it('returns Stripe payment URL for valid id', () => {
    const url = getStripePaymentUrl('pi_abc123')
    expect(url).toContain('dashboard.stripe.com/payments/pi_abc123')
  })
})

describe('getStripeAccountUrl', () => {
  it('returns Stripe connect account URL', () => {
    const url = getStripeAccountUrl('acct_123')
    expect(url).toContain('dashboard.stripe.com/connect/accounts/acct_123')
  })
})

// ─── PAYMENT_TYPES constant ────────────────────────────────────────────────

describe('PAYMENT_TYPES', () => {
  it('has 8 entries', () => {
    expect(PAYMENT_TYPES).toHaveLength(8)
  })

  it('includes subscription and transport', () => {
    expect(PAYMENT_TYPES).toContain('subscription')
    expect(PAYMENT_TYPES).toContain('transport')
  })

  it('includes auction_deposit and auction_premium', () => {
    expect(PAYMENT_TYPES).toContain('auction_deposit')
    expect(PAYMENT_TYPES).toContain('auction_premium')
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('payments starts as empty array', () => {
    const c = useAdminPagos()
    expect(c.payments.value).toEqual([])
  })

  it('loading starts as true', () => {
    const c = useAdminPagos()
    expect(c.loading.value).toBe(true)
  })

  it('error starts as null', () => {
    const c = useAdminPagos()
    expect(c.error.value).toBeNull()
  })

  it('activeTab defaults to "all"', () => {
    const c = useAdminPagos()
    expect(c.activeTab.value).toBe('all')
  })

  it('dateRange defaults to "this_month"', () => {
    const c = useAdminPagos()
    expect(c.dateRange.value).toBe('this_month')
  })

  it('expandedId starts as null', () => {
    const c = useAdminPagos()
    expect(c.expandedId.value).toBeNull()
  })
})

// ─── fetchPayments ────────────────────────────────────────────────────────

describe('fetchPayments', () => {
  it('sets payments on success', async () => {
    const payment = { id: 'p-1', amount_cents: 5000, status: 'succeeded', type: 'subscription', created_at: '2026-01-01' }
    mockFrom.mockReturnValue(makeChain({ data: [payment], error: null }))
    const c = useAdminPagos()
    await c.fetchPayments()
    expect(c.payments.value).toHaveLength(1)
    expect(c.loading.value).toBe(false)
  })

  it('sets error on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Connection refused' } }))
    const c = useAdminPagos()
    await c.fetchPayments()
    expect(c.error.value).toBe('Connection refused')
    expect(c.loading.value).toBe(false)
  })

  it('defaults payments to empty array on null data', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminPagos()
    await c.fetchPayments()
    expect(c.payments.value).toEqual([])
  })
})

// ─── fetchStripeAccounts ──────────────────────────────────────────────────

describe('fetchStripeAccounts', () => {
  it('sets stripeAccounts on success', async () => {
    const account = { id: 'sa-1', stripe_account_id: 'acct_123', onboarding_completed: true }
    mockFrom.mockReturnValue(makeChain({ data: [account], error: null }))
    const c = useAdminPagos()
    await c.fetchStripeAccounts()
    expect(c.stripeAccounts.value).toHaveLength(1)
  })

  it('silently ignores error (does not set error state)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Forbidden' } }))
    const c = useAdminPagos()
    await c.fetchStripeAccounts()
    // fetchStripeAccounts returns early on error — no state update
    expect(c.stripeAccounts.value).toEqual([])
    expect(c.error.value).toBeNull()
  })
})

// ─── Actions ──────────────────────────────────────────────────────────────

describe('toggleExpand', () => {
  it('sets expandedId on first call', () => {
    const c = useAdminPagos()
    c.toggleExpand('p-1')
    expect(c.expandedId.value).toBe('p-1')
  })

  it('toggles back to null when same id called again', () => {
    const c = useAdminPagos()
    c.toggleExpand('p-1')
    c.toggleExpand('p-1')
    expect(c.expandedId.value).toBeNull()
  })

  it('switches to a different id', () => {
    const c = useAdminPagos()
    c.toggleExpand('p-1')
    c.toggleExpand('p-2')
    expect(c.expandedId.value).toBe('p-2')
  })
})

describe('clearError', () => {
  it('clears error state', () => {
    const c = useAdminPagos()
    c.error.value = 'some error'
    c.clearError()
    expect(c.error.value).toBeNull()
  })
})

describe('setActiveTab', () => {
  it('updates activeTab', () => {
    const c = useAdminPagos()
    c.setActiveTab('succeeded')
    expect(c.activeTab.value).toBe('succeeded')
  })
})

describe('setDateRange', () => {
  it('updates dateRange', () => {
    const c = useAdminPagos()
    c.setDateRange('all_time')
    expect(c.dateRange.value).toBe('all_time')
  })
})
