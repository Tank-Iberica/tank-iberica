import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  useAdminReportes,
  reportFilters,
  statusColors,
  statusLabels,
  formatReportDate,
  truncateEmail,
} from '../../app/composables/admin/useAdminReportes'

// ─── Chain builder ────────────────────────────────────────────────────────

const CHAIN_METHODS = ['select', 'eq', 'order', 'update']

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

// ─── Fixtures ─────────────────────────────────────────────────────────────

function makeReport(overrides: Record<string, unknown> = {}) {
  return {
    id: 'r-1',
    vertical: 'tracciona',
    reporter_email: 'user@example.com',
    entity_type: 'vehicle',
    entity_id: 'v-1',
    reason: 'Fraude',
    details: null,
    status: 'pending' as const,
    admin_notes: null,
    resolved_at: null,
    created_at: '2026-01-01T10:00:00Z',
    ...overrides,
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────

const mockFrom = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom.mockReturnValue(makeChain())
  vi.stubGlobal('useSupabaseClient', () => ({ from: mockFrom }))
})

// ─── reportFilters constant ───────────────────────────────────────────────

describe('reportFilters', () => {
  it('has 5 entries (all + 4 statuses)', () => {
    expect(reportFilters).toHaveLength(5)
  })

  it('first entry has value "all"', () => {
    expect(reportFilters[0]!.value).toBe('all')
  })

  it('includes pending, reviewing, resolved_removed, resolved_kept', () => {
    const values = reportFilters.map((f) => f.value)
    expect(values).toContain('pending')
    expect(values).toContain('reviewing')
    expect(values).toContain('resolved_removed')
    expect(values).toContain('resolved_kept')
  })

  it('each entry has value and labelKey', () => {
    for (const f of reportFilters) {
      expect(f).toHaveProperty('value')
      expect(f).toHaveProperty('labelKey')
    }
  })
})

// ─── statusColors constant ────────────────────────────────────────────────

describe('statusColors', () => {
  it('has entries for all 4 statuses', () => {
    expect(statusColors).toHaveProperty('pending')
    expect(statusColors).toHaveProperty('reviewing')
    expect(statusColors).toHaveProperty('resolved_removed')
    expect(statusColors).toHaveProperty('resolved_kept')
  })
})

// ─── statusLabels constant ────────────────────────────────────────────────

describe('statusLabels', () => {
  it('has entries for all 4 statuses', () => {
    expect(statusLabels).toHaveProperty('pending')
    expect(statusLabels).toHaveProperty('reviewing')
    expect(statusLabels).toHaveProperty('resolved_removed')
    expect(statusLabels).toHaveProperty('resolved_kept')
  })

  it('values are i18n key strings containing "report.admin"', () => {
    expect(statusLabels.pending).toContain('report.admin')
    expect(statusLabels.reviewing).toContain('report.admin')
  })
})

// ─── formatReportDate (pure) ──────────────────────────────────────────────

describe('formatReportDate', () => {
  it('returns a non-empty string for a valid ISO date', () => {
    const result = formatReportDate('2026-01-15T10:30:00Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('contains the year in the output', () => {
    expect(formatReportDate('2026-06-01T00:00:00Z')).toContain('2026')
  })
})

// ─── truncateEmail (pure) ─────────────────────────────────────────────────

describe('truncateEmail', () => {
  it('returns email as-is when 24 chars or fewer', () => {
    const email = 'a@b.com'
    expect(truncateEmail(email)).toBe(email)
  })

  it('returns email as-is when exactly 24 chars', () => {
    // 20 chars + '@b.c' = 24
    const email = 'a'.repeat(20) + '@b.c'
    expect(truncateEmail(email)).toBe(email)
  })

  it('truncates local part when length > 24 and atIndex > 12', () => {
    // 'verylongemail@example.com': atIndex=13 > 12, length=25 > 24
    // substring(0,10) = 'verylongem', substring(13) = '@example.com'
    const email = 'verylongemail@example.com'
    expect(truncateEmail(email)).toBe('verylongem...@example.com')
  })

  it('returns email as-is when atIndex <= 12 even if length > 24', () => {
    // 'short@thisisaverylongdomain.com': atIndex=5 <= 12 → no truncation
    const email = 'short@thisisaverylongdomain.com'
    expect(truncateEmail(email)).toBe(email)
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('reports starts as empty array', () => {
    const c = useAdminReportes()
    expect(c.reports.value).toEqual([])
  })

  it('loading starts as true', () => {
    const c = useAdminReportes()
    expect(c.loading.value).toBe(true)
  })

  it('activeFilter starts as "all"', () => {
    const c = useAdminReportes()
    expect(c.activeFilter.value).toBe('all')
  })

  it('expandedId starts as null', () => {
    const c = useAdminReportes()
    expect(c.expandedId.value).toBeNull()
  })

  it('savingId starts as null', () => {
    const c = useAdminReportes()
    expect(c.savingId.value).toBeNull()
  })

  it('pendingCount starts as 0', () => {
    const c = useAdminReportes()
    expect(c.pendingCount.value).toBe(0)
  })
})

// ─── loadReports ──────────────────────────────────────────────────────────

describe('loadReports', () => {
  it('sets reports on success', async () => {
    const report = makeReport()
    mockFrom.mockReturnValue(makeChain({ data: [report], error: null }))
    const c = useAdminReportes()
    await c.loadReports()
    expect(c.reports.value).toHaveLength(1)
    expect(c.loading.value).toBe(false)
  })

  it('defaults to empty array when data is null', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminReportes()
    await c.loadReports()
    expect(c.reports.value).toEqual([])
  })

  it('silently handles error — reports becomes empty, no error state set', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' } }))
    const c = useAdminReportes()
    await c.loadReports()
    expect(c.reports.value).toEqual([])
    expect(c.loading.value).toBe(false)
  })

  it('does NOT apply eq filter when activeFilter is "all"', async () => {
    const chain = makeChain({ data: [], error: null })
    mockFrom.mockReturnValue(chain)
    const c = useAdminReportes()
    await c.loadReports()
    expect(chain.eq).not.toHaveBeenCalledWith('status', expect.anything())
  })

  it('applies eq("status", ...) when activeFilter is not "all"', async () => {
    const chain = makeChain({ data: [], error: null })
    mockFrom.mockReturnValue(chain)
    const c = useAdminReportes()
    c.activeFilter.value = 'pending'
    await c.loadReports()
    expect(chain.eq).toHaveBeenCalledWith('status', 'pending')
  })
})

// ─── updateStatus ─────────────────────────────────────────────────────────

describe('updateStatus', () => {
  it('calls update with status payload', async () => {
    const chain = makeChain({ data: null, error: null })
    mockFrom.mockReturnValue(chain)
    const c = useAdminReportes()
    await c.updateStatus('r-1', 'reviewing')
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'reviewing' }),
    )
  })

  it('includes resolved_at when status starts with "resolved"', async () => {
    const chain = makeChain({ data: null, error: null })
    mockFrom.mockReturnValue(chain)
    const c = useAdminReportes()
    await c.updateStatus('r-1', 'resolved_removed')
    const payload = (chain.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(typeof payload.resolved_at).toBe('string')
  })

  it('does NOT include resolved_at for non-resolved statuses', async () => {
    const chain = makeChain({ data: null, error: null })
    mockFrom.mockReturnValue(chain)
    const c = useAdminReportes()
    await c.updateStatus('r-1', 'reviewing')
    const payload = (chain.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(payload).not.toHaveProperty('resolved_at')
  })

  it('clears savingId after completion', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminReportes()
    await c.updateStatus('r-1', 'reviewing')
    expect(c.savingId.value).toBeNull()
  })
})

// ─── saveNotes ────────────────────────────────────────────────────────────

describe('saveNotes', () => {
  it('calls update with admin_notes from editNotes', async () => {
    const chain = makeChain({ data: null, error: null })
    mockFrom.mockReturnValue(chain)
    const c = useAdminReportes()
    c.updateEditNotes('r-1', 'Admin review note')
    await c.saveNotes('r-1')
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ admin_notes: 'Admin review note' }),
    )
  })

  it('uses empty string when editNotes has no entry for reportId', async () => {
    const chain = makeChain({ data: null, error: null })
    mockFrom.mockReturnValue(chain)
    const c = useAdminReportes()
    await c.saveNotes('r-1')
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ admin_notes: '' }),
    )
  })

  it('updates local report admin_notes', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminReportes()
    c.reports.value.push(makeReport({ id: 'r-1', admin_notes: null }) as never)
    c.updateEditNotes('r-1', 'New note')
    await c.saveNotes('r-1')
    expect(c.reports.value[0]!.admin_notes).toBe('New note')
  })

  it('clears savingId after completion', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminReportes()
    await c.saveNotes('r-1')
    expect(c.savingId.value).toBeNull()
  })
})

// ─── toggleExpand ─────────────────────────────────────────────────────────

describe('toggleExpand', () => {
  it('sets expandedId on first call', () => {
    const c = useAdminReportes()
    c.toggleExpand('r-1')
    expect(c.expandedId.value).toBe('r-1')
  })

  it('toggles back to null on second call with same id', () => {
    const c = useAdminReportes()
    c.toggleExpand('r-1')
    c.toggleExpand('r-1')
    expect(c.expandedId.value).toBeNull()
  })

  it('switches to a different id', () => {
    const c = useAdminReportes()
    c.toggleExpand('r-1')
    c.toggleExpand('r-2')
    expect(c.expandedId.value).toBe('r-2')
  })

  it('pre-fills editNotes with report.admin_notes on expand', () => {
    const c = useAdminReportes()
    c.reports.value.push(makeReport({ id: 'r-1', admin_notes: 'Existing note' }) as never)
    c.toggleExpand('r-1')
    expect(c.getEditNotes('r-1')).toBe('Existing note')
  })

  it('pre-fills editNotes with empty string when admin_notes is null', () => {
    const c = useAdminReportes()
    c.reports.value.push(makeReport({ id: 'r-1', admin_notes: null }) as never)
    c.toggleExpand('r-1')
    expect(c.getEditNotes('r-1')).toBe('')
  })
})

// ─── updateEditNotes / getEditNotes ───────────────────────────────────────

describe('updateEditNotes / getEditNotes', () => {
  it('stores and retrieves notes by report id', () => {
    const c = useAdminReportes()
    c.updateEditNotes('r-1', 'My note')
    expect(c.getEditNotes('r-1')).toBe('My note')
  })

  it('overwrites existing notes', () => {
    const c = useAdminReportes()
    c.updateEditNotes('r-1', 'First')
    c.updateEditNotes('r-1', 'Second')
    expect(c.getEditNotes('r-1')).toBe('Second')
  })

  it('returns empty string for unknown report id', () => {
    const c = useAdminReportes()
    expect(c.getEditNotes('unknown')).toBe('')
  })
})
