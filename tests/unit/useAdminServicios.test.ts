import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  useAdminServicios,
  STATUS_OPTIONS,
  TYPE_TABS,
} from '../../app/composables/admin/useAdminServicios'

// ─── Supabase chain mock ──────────────────────────────────────────────────

function makeChain(result: unknown = { data: [], error: null }) {
  const chain: Record<string, (..._: unknown[]) => unknown> = {}
  for (const m of [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'in', 'order', 'limit', 'single', 'match',
  ]) {
    chain[m] = () => chain
  }
  Object.assign(chain, { then: (resolve: (v: unknown) => unknown) => resolve(result) })
  return chain
}

let mockFrom: ReturnType<typeof vi.fn>

vi.stubGlobal('useSupabaseClient', () => ({
  from: (...args: unknown[]) => mockFrom(...args),
}))

vi.stubGlobal('useI18n', () => ({
  t: (key: string) => key,
  locale: { value: 'es' },
}))

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom = vi.fn(() => makeChain({ data: [], error: null }))
})

// ─── Constants ────────────────────────────────────────────────────────────

describe('STATUS_OPTIONS', () => {
  it('has 4 statuses', () => {
    expect(STATUS_OPTIONS).toHaveLength(4)
  })

  it('includes pending, in_progress, completed, cancelled', () => {
    expect(STATUS_OPTIONS).toContain('pending')
    expect(STATUS_OPTIONS).toContain('in_progress')
    expect(STATUS_OPTIONS).toContain('completed')
    expect(STATUS_OPTIONS).toContain('cancelled')
  })
})

describe('TYPE_TABS', () => {
  it('has 5 tabs', () => {
    expect(TYPE_TABS).toHaveLength(5)
  })

  it('starts with "all"', () => {
    expect(TYPE_TABS[0]).toBe('all')
  })

  it('includes transport, transfer, insurance, inspection', () => {
    expect(TYPE_TABS).toContain('transport')
    expect(TYPE_TABS).toContain('transfer')
    expect(TYPE_TABS).toContain('insurance')
    expect(TYPE_TABS).toContain('inspection')
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('loading starts as true', () => {
    const c = useAdminServicios()
    expect(c.loading.value).toBe(true)
  })

  it('requests starts as empty array', () => {
    const c = useAdminServicios()
    expect(c.requests.value).toEqual([])
  })

  it('error starts as null', () => {
    const c = useAdminServicios()
    expect(c.error.value).toBeNull()
  })

  it('activeTab starts as "all"', () => {
    const c = useAdminServicios()
    expect(c.activeTab.value).toBe('all')
  })

  it('expandedId starts as null', () => {
    const c = useAdminServicios()
    expect(c.expandedId.value).toBeNull()
  })

  it('updatingStatus starts as null', () => {
    const c = useAdminServicios()
    expect(c.updatingStatus.value).toBeNull()
  })

  it('notifyingPartner starts as null', () => {
    const c = useAdminServicios()
    expect(c.notifyingPartner.value).toBeNull()
  })

  it('filteredRequests starts as empty array (one-shot, all tab)', () => {
    const c = useAdminServicios()
    expect(c.filteredRequests.value).toEqual([])
  })

  it('tabCounts starts with all zeros', () => {
    const c = useAdminServicios()
    expect(c.tabCounts.value).toEqual({
      all: 0,
      transport: 0,
      transfer: 0,
      insurance: 0,
      inspection: 0,
    })
  })
})

// ─── setActiveTab ─────────────────────────────────────────────────────────

describe('setActiveTab', () => {
  it('sets activeTab to transport', () => {
    const c = useAdminServicios()
    c.setActiveTab('transport')
    expect(c.activeTab.value).toBe('transport')
  })

  it('sets activeTab to all', () => {
    const c = useAdminServicios()
    c.setActiveTab('transport')
    c.setActiveTab('all')
    expect(c.activeTab.value).toBe('all')
  })
})

// ─── toggleExpand ─────────────────────────────────────────────────────────

describe('toggleExpand', () => {
  it('sets expandedId when null', () => {
    const c = useAdminServicios()
    c.toggleExpand('req-1')
    expect(c.expandedId.value).toBe('req-1')
  })

  it('collapses (sets null) when same id toggled', () => {
    const c = useAdminServicios()
    c.toggleExpand('req-1')
    c.toggleExpand('req-1')
    expect(c.expandedId.value).toBeNull()
  })

  it('switches to new id when different id toggled', () => {
    const c = useAdminServicios()
    c.toggleExpand('req-1')
    c.toggleExpand('req-2')
    expect(c.expandedId.value).toBe('req-2')
  })
})

// ─── clearError ───────────────────────────────────────────────────────────

describe('clearError', () => {
  it('sets error to null', () => {
    const c = useAdminServicios()
    c.error.value = 'some error'
    c.clearError()
    expect(c.error.value).toBeNull()
  })
})

// ─── fetchRequests ────────────────────────────────────────────────────────

describe('fetchRequests', () => {
  it('calls supabase.from("service_requests")', async () => {
    const c = useAdminServicios()
    await c.fetchRequests()
    expect(mockFrom).toHaveBeenCalledWith('service_requests')
  })

  it('sets requests.value from data', async () => {
    const data = [
      { id: 'r-1', type: 'transport', status: 'pending', vehicles: null },
    ]
    mockFrom.mockReturnValue(makeChain({ data, error: null }))
    const c = useAdminServicios()
    await c.fetchRequests()
    expect(c.requests.value).toHaveLength(1)
    expect(c.requests.value[0]).toMatchObject({ id: 'r-1' })
  })

  it('sets error on fetch failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fetch failed' } }))
    const c = useAdminServicios()
    await c.fetchRequests()
    expect(c.error.value).toBe('fetch failed')
  })

  it('sets loading to false after fetch', async () => {
    const c = useAdminServicios()
    await c.fetchRequests()
    expect(c.loading.value).toBe(false)
  })
})

// ─── updateStatus ─────────────────────────────────────────────────────────

describe('updateStatus', () => {
  it('calls supabase.from("service_requests")', async () => {
    const c = useAdminServicios()
    await c.updateStatus('r-1', 'completed')
    expect(mockFrom).toHaveBeenCalledWith('service_requests')
  })

  it('updates request status inline', async () => {
    const c = useAdminServicios()
    c.requests.value = [
      { id: 'r-1', type: 'transport', status: 'pending' } as never,
    ]
    await c.updateStatus('r-1', 'completed')
    expect(c.requests.value[0].status).toBe('completed')
  })

  it('sets error when update fails', async () => {
    mockFrom.mockReturnValue(makeChain({ error: { message: 'update error' } }))
    const c = useAdminServicios()
    await c.updateStatus('r-1', 'cancelled')
    expect(c.error.value).toBe('update error')
  })

  it('resets updatingStatus to null after call', async () => {
    const c = useAdminServicios()
    await c.updateStatus('r-1', 'completed')
    expect(c.updatingStatus.value).toBeNull()
  })
})

// ─── notifyPartner ────────────────────────────────────────────────────────

describe('notifyPartner', () => {
  it('calls supabase.from("service_requests")', async () => {
    const c = useAdminServicios()
    await c.notifyPartner('r-1')
    expect(mockFrom).toHaveBeenCalledWith('service_requests')
  })

  it('updates partner_notified_at inline', async () => {
    const c = useAdminServicios()
    c.requests.value = [
      { id: 'r-1', type: 'transport', status: 'pending', partner_notified_at: null } as never,
    ]
    await c.notifyPartner('r-1')
    expect(c.requests.value[0].partner_notified_at).not.toBeNull()
  })

  it('resets notifyingPartner to null after call', async () => {
    const c = useAdminServicios()
    await c.notifyPartner('r-1')
    expect(c.notifyingPartner.value).toBeNull()
  })
})

// ─── Helper functions ─────────────────────────────────────────────────────

describe('formatDate', () => {
  it('returns "-" for null', () => {
    const c = useAdminServicios()
    expect(c.formatDate(null)).toBe('-')
  })

  it('returns formatted date string for ISO date', () => {
    const c = useAdminServicios()
    const result = c.formatDate('2026-03-15')
    expect(typeof result).toBe('string')
    expect(result).not.toBe('-')
  })
})

describe('getTypeIcon', () => {
  it('returns emoji for "transport"', () => {
    const c = useAdminServicios()
    expect(c.getTypeIcon('transport')).toBeTruthy()
  })

  it('returns "⚙" for unknown type', () => {
    const c = useAdminServicios()
    expect(c.getTypeIcon('unknown')).toBe('\u2699')
  })

  it('returns different icons for different types', () => {
    const c = useAdminServicios()
    const transport = c.getTypeIcon('transport')
    const transfer = c.getTypeIcon('transfer')
    expect(transport).not.toBe(transfer)
  })
})

describe('getStatusClass', () => {
  it('returns "status-pending" for pending', () => {
    const c = useAdminServicios()
    expect(c.getStatusClass('pending')).toBe('status-pending')
  })

  it('returns "status-progress" for in_progress', () => {
    const c = useAdminServicios()
    expect(c.getStatusClass('in_progress')).toBe('status-progress')
  })

  it('returns "status-completed" for completed', () => {
    const c = useAdminServicios()
    expect(c.getStatusClass('completed')).toBe('status-completed')
  })

  it('returns "status-cancelled" for cancelled', () => {
    const c = useAdminServicios()
    expect(c.getStatusClass('cancelled')).toBe('status-cancelled')
  })

  it('returns "status-pending" for unknown status', () => {
    const c = useAdminServicios()
    expect(c.getStatusClass('unknown')).toBe('status-pending')
  })
})

describe('getTypeLabel', () => {
  it('returns i18n key for transport', () => {
    const c = useAdminServicios()
    expect(c.getTypeLabel('transport')).toBeTruthy()
  })

  it('returns type string itself for unknown type', () => {
    const c = useAdminServicios()
    expect(c.getTypeLabel('unknown-type')).toBe('unknown-type')
  })
})

describe('getStatusLabel', () => {
  it('returns i18n key for pending', () => {
    const c = useAdminServicios()
    expect(c.getStatusLabel('pending')).toBeTruthy()
  })

  it('returns status string itself for unknown status', () => {
    const c = useAdminServicios()
    expect(c.getStatusLabel('unknown-status')).toBe('unknown-status')
  })
})

describe('formatDetailValue', () => {
  it('returns "-" for null', () => {
    const c = useAdminServicios()
    expect(c.formatDetailValue(null)).toBe('-')
  })

  it('returns "-" for undefined', () => {
    const c = useAdminServicios()
    expect(c.formatDetailValue(undefined)).toBe('-')
  })

  it('stringifies objects', () => {
    const c = useAdminServicios()
    expect(c.formatDetailValue({ key: 'val' })).toBe('{"key":"val"}')
  })

  it('converts numbers to string', () => {
    const c = useAdminServicios()
    expect(c.formatDetailValue(42)).toBe('42')
  })

  it('converts boolean to string', () => {
    const c = useAdminServicios()
    expect(c.formatDetailValue(true)).toBe('true')
  })

  it('passes through strings', () => {
    const c = useAdminServicios()
    expect(c.formatDetailValue('hello')).toBe('hello')
  })
})
