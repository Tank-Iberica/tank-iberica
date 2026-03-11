import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminTransporte, STATUS_OPTIONS } from '../../app/composables/admin/useAdminTransporte'

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
}))

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom = vi.fn(() => makeChain({ data: [], error: null }))
})

// ─── STATUS_OPTIONS ───────────────────────────────────────────────────────

describe('STATUS_OPTIONS', () => {
  it('has 5 statuses', () => {
    expect(STATUS_OPTIONS).toHaveLength(5)
  })

  it('includes quoted, accepted, in_transit, completed, cancelled', () => {
    expect(STATUS_OPTIONS).toContain('quoted')
    expect(STATUS_OPTIONS).toContain('accepted')
    expect(STATUS_OPTIONS).toContain('in_transit')
    expect(STATUS_OPTIONS).toContain('completed')
    expect(STATUS_OPTIONS).toContain('cancelled')
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('loading starts as true', () => {
    const c = useAdminTransporte()
    expect(c.loading.value).toBe(true)
  })

  it('requests starts as empty array', () => {
    const c = useAdminTransporte()
    expect(c.requests.value).toEqual([])
  })

  it('error starts as null', () => {
    const c = useAdminTransporte()
    expect(c.error.value).toBeNull()
  })

  it('activeTab starts as "all"', () => {
    const c = useAdminTransporte()
    expect(c.activeTab.value).toBe('all')
  })

  it('expandedId starts as null', () => {
    const c = useAdminTransporte()
    expect(c.expandedId.value).toBeNull()
  })

  it('editingNotes starts as empty string', () => {
    const c = useAdminTransporte()
    expect(c.editingNotes.value).toBe('')
  })

  it('savingNotes starts as false', () => {
    const c = useAdminTransporte()
    expect(c.savingNotes.value).toBe(false)
  })

  it('updatingStatus starts as null', () => {
    const c = useAdminTransporte()
    expect(c.updatingStatus.value).toBeNull()
  })

  it('filteredRequests starts as empty array (one-shot, all tab)', () => {
    const c = useAdminTransporte()
    expect(c.filteredRequests.value).toEqual([])
  })

  it('stats.total starts as 0', () => {
    const c = useAdminTransporte()
    expect(c.stats.value.total).toBe(0)
  })

  it('tabCounts.all starts as 0', () => {
    const c = useAdminTransporte()
    expect(c.tabCounts.value.all).toBe(0)
  })
})

// ─── toggleExpand ─────────────────────────────────────────────────────────

describe('toggleExpand', () => {
  it('sets expandedId when null', () => {
    const c = useAdminTransporte()
    c.toggleExpand('r-1')
    expect(c.expandedId.value).toBe('r-1')
  })

  it('collapses when same id toggled', () => {
    const c = useAdminTransporte()
    c.toggleExpand('r-1')
    c.toggleExpand('r-1')
    expect(c.expandedId.value).toBeNull()
  })

  it('resets editingNotes to empty when collapsing', () => {
    const c = useAdminTransporte()
    c.toggleExpand('r-1')
    c.editingNotes.value = 'some notes'
    c.toggleExpand('r-1') // collapse
    expect(c.editingNotes.value).toBe('')
  })

  it('switches to new id when different id clicked', () => {
    const c = useAdminTransporte()
    c.toggleExpand('r-1')
    c.toggleExpand('r-2')
    expect(c.expandedId.value).toBe('r-2')
  })

  it('loads admin_notes from matching request when expanding', () => {
    const c = useAdminTransporte()
    c.requests.value = [
      { id: 'r-5', admin_notes: 'Important note', status: 'quoted' } as never,
    ]
    c.toggleExpand('r-5')
    expect(c.editingNotes.value).toBe('Important note')
  })

  it('sets editingNotes to empty when request has no admin_notes', () => {
    const c = useAdminTransporte()
    c.requests.value = [
      { id: 'r-5', admin_notes: null, status: 'quoted' } as never,
    ]
    c.toggleExpand('r-5')
    expect(c.editingNotes.value).toBe('')
  })
})

// ─── fetchRequests ────────────────────────────────────────────────────────

describe('fetchRequests', () => {
  it('calls supabase.from("transport_requests")', async () => {
    const c = useAdminTransporte()
    await c.fetchRequests()
    expect(mockFrom).toHaveBeenCalledWith('transport_requests')
  })

  it('populates requests from data', async () => {
    const data = [{ id: 'r-1', status: 'quoted', vehicles: { title: 'Truck', slug: 'truck' } }]
    mockFrom.mockReturnValue(makeChain({ data, error: null }))
    const c = useAdminTransporte()
    await c.fetchRequests()
    expect(c.requests.value).toHaveLength(1)
    expect(c.requests.value[0]).toMatchObject({ id: 'r-1' })
  })

  it('sets error on fetch failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Network error' } }))
    const c = useAdminTransporte()
    await c.fetchRequests()
    expect(c.error.value).toBe('Network error')
  })

  it('sets loading to false after fetch', async () => {
    const c = useAdminTransporte()
    await c.fetchRequests()
    expect(c.loading.value).toBe(false)
  })
})

// ─── saveNotes ────────────────────────────────────────────────────────────

describe('saveNotes', () => {
  it('calls supabase.from("transport_requests")', async () => {
    const c = useAdminTransporte()
    await c.saveNotes('r-1')
    expect(mockFrom).toHaveBeenCalledWith('transport_requests')
  })

  it('updates admin_notes inline on success', async () => {
    const c = useAdminTransporte()
    c.requests.value = [
      { id: 'r-1', admin_notes: null, status: 'quoted' } as never,
    ]
    c.editingNotes.value = 'Updated note'
    await c.saveNotes('r-1')
    expect(c.requests.value[0].admin_notes).toBe('Updated note')
  })

  it('saves null when editingNotes is empty/whitespace', async () => {
    const c = useAdminTransporte()
    c.requests.value = [
      { id: 'r-1', admin_notes: 'Old note', status: 'quoted' } as never,
    ]
    c.editingNotes.value = '   '
    await c.saveNotes('r-1')
    expect(c.requests.value[0].admin_notes).toBeNull()
  })

  it('sets savingNotes to false after completion', async () => {
    const c = useAdminTransporte()
    await c.saveNotes('r-1')
    expect(c.savingNotes.value).toBe(false)
  })

  it('sets error on save failure', async () => {
    mockFrom.mockReturnValue(makeChain({ error: { message: 'save error' } }))
    const c = useAdminTransporte()
    await c.saveNotes('r-1')
    expect(c.error.value).toBe('save error')
  })
})

// ─── updateStatus ─────────────────────────────────────────────────────────

describe('updateStatus', () => {
  it('calls supabase.from("transport_requests")', async () => {
    const c = useAdminTransporte()
    await c.updateStatus('r-1', 'completed')
    expect(mockFrom).toHaveBeenCalledWith('transport_requests')
  })

  it('updates request status inline on success', async () => {
    const c = useAdminTransporte()
    c.requests.value = [
      { id: 'r-1', status: 'quoted' } as never,
    ]
    await c.updateStatus('r-1', 'accepted')
    expect(c.requests.value[0].status).toBe('accepted')
  })

  it('resets updatingStatus to null after completion', async () => {
    const c = useAdminTransporte()
    await c.updateStatus('r-1', 'completed')
    expect(c.updatingStatus.value).toBeNull()
  })

  it('sets error on update failure', async () => {
    mockFrom.mockReturnValue(makeChain({ error: { message: 'update failed' } }))
    const c = useAdminTransporte()
    await c.updateStatus('r-1', 'cancelled')
    expect(c.error.value).toBe('update failed')
  })
})

// ─── Helper functions ─────────────────────────────────────────────────────

describe('formatDate', () => {
  it('returns "-" for null', () => {
    const c = useAdminTransporte()
    expect(c.formatDate(null)).toBe('-')
  })

  it('returns formatted date string for valid ISO date', () => {
    const c = useAdminTransporte()
    const result = c.formatDate('2026-03-15')
    expect(typeof result).toBe('string')
    expect(result).not.toBe('-')
  })
})

describe('getStatusClass', () => {
  it('returns "status-pending" for "quoted"', () => {
    const c = useAdminTransporte()
    expect(c.getStatusClass('quoted')).toBe('status-pending')
  })

  it('returns "status-accepted" for "accepted"', () => {
    const c = useAdminTransporte()
    expect(c.getStatusClass('accepted')).toBe('status-accepted')
  })

  it('returns "status-transit" for "in_transit"', () => {
    const c = useAdminTransporte()
    expect(c.getStatusClass('in_transit')).toBe('status-transit')
  })

  it('returns "status-completed" for "completed"', () => {
    const c = useAdminTransporte()
    expect(c.getStatusClass('completed')).toBe('status-completed')
  })

  it('returns "status-cancelled" for "cancelled"', () => {
    const c = useAdminTransporte()
    expect(c.getStatusClass('cancelled')).toBe('status-cancelled')
  })

  it('returns "status-pending" for unknown status', () => {
    const c = useAdminTransporte()
    expect(c.getStatusClass('unknown')).toBe('status-pending')
  })
})

describe('getStatusLabel', () => {
  it('returns i18n key for quoted', () => {
    const c = useAdminTransporte()
    expect(c.getStatusLabel('quoted')).toBeTruthy()
  })

  it('returns status itself for unknown status', () => {
    const c = useAdminTransporte()
    expect(c.getStatusLabel('unknown')).toBe('unknown')
  })
})
