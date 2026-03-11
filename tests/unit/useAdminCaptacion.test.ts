import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (before import) ─────────────────────────────────────

vi.mock('~/composables/useVerticalConfig', () => ({
  getVerticalSlug: vi.fn(() => 'tracciona'),
}))

vi.stubGlobal('useI18n', () => ({ t: (k: string) => k }))

// Supabase chainable mock — configurable per test
let supabaseResult: unknown = { data: [], error: null }
const mockFrom = vi.fn()

vi.stubGlobal('useSupabaseClient', () => ({
  from: mockFrom,
}))

import {
  useAdminCaptacion,
  STATUS_OPTIONS,
  SOURCE_LIST,
  type DealerLead,
} from '../../app/composables/admin/useAdminCaptacion'

// ─── Chain builder ─────────────────────────────────────────────

function makeChain(result: unknown = { data: [], error: null }) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'order', 'update', 'insert', 'in']
  methods.forEach((m) => {
    chain[m] = () => chain
  })
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return chain
}

function makeLead(overrides: Partial<DealerLead> = {}): DealerLead {
  return {
    id: 'lead-1',
    vertical: 'tracciona',
    source: 'mascus',
    source_url: null,
    company_name: 'Transportes SL',
    phone: '+34600000000',
    email: 'info@transportes.com',
    location: 'Madrid',
    active_listings: 5,
    vehicle_types: ['camion', 'furgon'],
    status: 'new',
    assigned_to: null,
    contact_notes: null,
    contacted_at: null,
    scraped_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: null,
    ...overrides,
  }
}

// ─── Setup ────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  supabaseResult = { data: [], error: null }
  mockFrom.mockImplementation(() => makeChain(supabaseResult))
})

// ─── Exported constants ────────────────────────────────────────

describe('constants', () => {
  it('STATUS_OPTIONS has 6 statuses', () => {
    expect(STATUS_OPTIONS).toHaveLength(6)
    expect(STATUS_OPTIONS).toContain('new')
    expect(STATUS_OPTIONS).toContain('active')
    expect(STATUS_OPTIONS).toContain('rejected')
  })

  it('SOURCE_LIST has expected sources', () => {
    expect(SOURCE_LIST).toContain('mascus')
    expect(SOURCE_LIST).toContain('manual')
  })
})

// ─── Initial state ────────────────────────────────────────────

describe('useAdminCaptacion — initial state', () => {
  it('initializes with loading=true and empty state', () => {
    const c = useAdminCaptacion()
    expect(c.loading.value).toBe(true)
    expect(c.leads.value).toEqual([])
    expect(c.adminUsers.value).toEqual([])
    expect(c.error.value).toBeNull()
    expect(c.successMessage.value).toBeNull()
    expect(c.activeTab.value).toBe('all')
    expect(c.expandedId.value).toBeNull()
    expect(c.editingNotes.value).toBe('')
    expect(c.savingNotes.value).toBe(false)
    expect(c.updatingStatus.value).toBeNull()
    expect(c.updatingAssign.value).toBeNull()
    expect(c.bulkProcessing.value).toBe(false)
    expect(c.showManualForm.value).toBe(false)
    expect(c.manualFormSaving.value).toBe(false)
  })

  it('initializes manualForm with defaults', () => {
    const c = useAdminCaptacion()
    expect(c.manualForm.value.company_name).toBe('')
    expect(c.manualForm.value.active_listings).toBe(0)
    expect(c.manualForm.value.vehicle_types).toBe('')
  })

  it('exposes all functions', () => {
    const c = useAdminCaptacion()
    expect(typeof c.fetchLeads).toBe('function')
    expect(typeof c.fetchAdminUsers).toBe('function')
    expect(typeof c.toggleExpand).toBe('function')
    expect(typeof c.updateStatus).toBe('function')
    expect(typeof c.updateAssignment).toBe('function')
    expect(typeof c.saveNotes).toBe('function')
    expect(typeof c.toggleSelectAll).toBe('function')
    expect(typeof c.toggleSelect).toBe('function')
    expect(typeof c.bulkMarkContacted).toBe('function')
    expect(typeof c.resetManualForm).toBe('function')
    expect(typeof c.saveManualLead).toBe('function')
    expect(typeof c.showSuccess).toBe('function')
  })
})

// ─── Helper functions ─────────────────────────────────────────

describe('formatDate', () => {
  it('returns - for null', () => {
    const c = useAdminCaptacion()
    expect(c.formatDate(null)).toBe('-')
  })

  it('returns formatted date for valid date string', () => {
    const c = useAdminCaptacion()
    const result = c.formatDate('2026-01-15T00:00:00Z')
    expect(result).toBeTruthy()
    expect(result).not.toBe('-')
  })
})

describe('getSourceClass', () => {
  it('returns correct class for known sources', () => {
    const c = useAdminCaptacion()
    expect(c.getSourceClass('mascus')).toBe('source-mascus')
    expect(c.getSourceClass('europa_camiones')).toBe('source-europa')
    expect(c.getSourceClass('milanuncios')).toBe('source-milanuncios')
    expect(c.getSourceClass('autoline')).toBe('source-autoline')
    expect(c.getSourceClass('manual')).toBe('source-manual')
  })

  it('returns source-manual for unknown source', () => {
    const c = useAdminCaptacion()
    expect(c.getSourceClass('unknown')).toBe('source-manual')
  })
})

describe('getStatusClass', () => {
  it('returns correct class for known statuses', () => {
    const c = useAdminCaptacion()
    expect(c.getStatusClass('new')).toBe('status-new')
    expect(c.getStatusClass('contacted')).toBe('status-contacted')
    expect(c.getStatusClass('interested')).toBe('status-interested')
    expect(c.getStatusClass('onboarding')).toBe('status-onboarding')
    expect(c.getStatusClass('active')).toBe('status-active')
    expect(c.getStatusClass('rejected')).toBe('status-rejected')
  })

  it('returns status-new for unknown status', () => {
    const c = useAdminCaptacion()
    expect(c.getStatusClass('unknown')).toBe('status-new')
  })
})

describe('formatVehicleTypes', () => {
  it('returns - for empty array', () => {
    const c = useAdminCaptacion()
    expect(c.formatVehicleTypes([])).toBe('-')
  })

  it('returns joined string for non-empty array', () => {
    const c = useAdminCaptacion()
    expect(c.formatVehicleTypes(['camion', 'furgon'])).toBe('camion, furgon')
  })

  it('returns - for null/falsy', () => {
    const c = useAdminCaptacion()
    expect(c.formatVehicleTypes(null as unknown as string[])).toBe('-')
  })
})

describe('getSourceLabel', () => {
  it('returns translation key for known source', () => {
    const c = useAdminCaptacion()
    // Our useI18n mock returns key as-is
    expect(c.getSourceLabel('mascus')).toBe('admin.captacion.sourceMascus')
    expect(c.getSourceLabel('manual')).toBe('admin.captacion.sourceManual')
  })

  it('returns raw source for unknown', () => {
    const c = useAdminCaptacion()
    expect(c.getSourceLabel('unknown_source')).toBe('unknown_source')
  })
})

describe('getStatusLabel', () => {
  it('returns translation key for known status', () => {
    const c = useAdminCaptacion()
    expect(c.getStatusLabel('new')).toBe('admin.captacion.statusNew')
    expect(c.getStatusLabel('active')).toBe('admin.captacion.statusActive')
  })

  it('returns raw status for unknown', () => {
    const c = useAdminCaptacion()
    expect(c.getStatusLabel('custom_status')).toBe('custom_status')
  })
})

describe('getAssignedName', () => {
  it('returns unassigned translation when userId is null', () => {
    const c = useAdminCaptacion()
    expect(c.getAssignedName(null)).toBe('admin.captacion.unassigned')
  })

  it('returns full_name when user found', () => {
    const c = useAdminCaptacion()
    c.adminUsers.value = [{ id: 'u1', email: 'a@b.com', full_name: 'Juan García' }]
    expect(c.getAssignedName('u1')).toBe('Juan García')
  })

  it('returns email when user has no full_name', () => {
    const c = useAdminCaptacion()
    c.adminUsers.value = [{ id: 'u1', email: 'a@b.com', full_name: null }]
    expect(c.getAssignedName('u1')).toBe('a@b.com')
  })

  it('returns truncated userId when user not found', () => {
    const c = useAdminCaptacion()
    c.adminUsers.value = []
    expect(c.getAssignedName('abcdefghij')).toBe('abcdefgh')
  })
})

// ─── fetchLeads ───────────────────────────────────────────────

describe('fetchLeads', () => {
  it('populates leads on success', async () => {
    const rows = [makeLead(), makeLead({ id: 'lead-2', company_name: 'Otra SL' })]
    supabaseResult = { data: rows, error: null }
    const c = useAdminCaptacion()
    await c.fetchLeads()
    expect(c.leads.value.length).toBe(2)
    expect(c.loading.value).toBe(false)
    expect(c.error.value).toBeNull()
  })

  it('sets error on fetch error', async () => {
    supabaseResult = { data: null, error: { message: 'DB error' } }
    const c = useAdminCaptacion()
    await c.fetchLeads()
    expect(c.error.value).toBe('DB error')
    expect(c.loading.value).toBe(false)
  })

  it('handles empty data', async () => {
    supabaseResult = { data: null, error: null }
    const c = useAdminCaptacion()
    await c.fetchLeads()
    expect(c.leads.value).toEqual([])
  })
})

// ─── fetchAdminUsers ──────────────────────────────────────────

describe('fetchAdminUsers', () => {
  it('populates adminUsers on success', async () => {
    supabaseResult = { data: [{ id: 'u1', email: 'admin@test.com', full_name: 'Admin' }], error: null }
    const c = useAdminCaptacion()
    await c.fetchAdminUsers()
    expect(c.adminUsers.value.length).toBe(1)
  })

  it('does not throw on error (non-blocking)', async () => {
    mockFrom.mockImplementationOnce(() => {
      throw new Error('Network error')
    })
    const c = useAdminCaptacion()
    await expect(c.fetchAdminUsers()).resolves.not.toThrow()
  })
})

// ─── toggleExpand ──────────────────────────────────────────────

describe('toggleExpand', () => {
  it('sets expandedId and editingNotes when expanding', () => {
    const c = useAdminCaptacion()
    c.leads.value = [makeLead({ id: 'lead-1', contact_notes: 'some note' })]
    c.toggleExpand('lead-1')
    expect(c.expandedId.value).toBe('lead-1')
    expect(c.editingNotes.value).toBe('some note')
  })

  it('collapses when same id toggled again', () => {
    const c = useAdminCaptacion()
    c.leads.value = [makeLead({ id: 'lead-1' })]
    c.toggleExpand('lead-1')
    c.toggleExpand('lead-1')
    expect(c.expandedId.value).toBeNull()
    expect(c.editingNotes.value).toBe('')
  })

  it('sets empty editingNotes when lead has no notes', () => {
    const c = useAdminCaptacion()
    c.leads.value = [makeLead({ id: 'lead-1', contact_notes: null })]
    c.toggleExpand('lead-1')
    expect(c.editingNotes.value).toBe('')
  })
})

// ─── updateStatus ─────────────────────────────────────────────

describe('updateStatus', () => {
  it('updates lead status locally on success', async () => {
    supabaseResult = { error: null }
    const c = useAdminCaptacion()
    c.leads.value = [makeLead({ id: 'lead-1', status: 'new' })]
    await c.updateStatus('lead-1', 'interested')
    expect(c.leads.value[0]!.status).toBe('interested')
    expect(c.updatingStatus.value).toBeNull()
  })

  it('sets contacted_at when moving to contacted', async () => {
    supabaseResult = { error: null }
    const c = useAdminCaptacion()
    c.leads.value = [makeLead({ id: 'lead-1', status: 'new', contacted_at: null })]
    await c.updateStatus('lead-1', 'contacted')
    expect(c.leads.value[0]!.contacted_at).toBeTruthy()
    expect(c.leads.value[0]!.status).toBe('contacted')
  })

  it('sets error on update failure', async () => {
    supabaseResult = { error: { message: 'Update error' } }
    const c = useAdminCaptacion()
    c.leads.value = [makeLead({ id: 'lead-1' })]
    await c.updateStatus('lead-1', 'active')
    expect(c.error.value).toBe('Update error')
  })
})

// ─── updateAssignment ─────────────────────────────────────────

describe('updateAssignment', () => {
  it('updates lead assignment on success', async () => {
    supabaseResult = { error: null }
    const c = useAdminCaptacion()
    c.leads.value = [makeLead({ id: 'lead-1', assigned_to: null })]
    await c.updateAssignment('lead-1', 'user-42')
    expect(c.leads.value[0]!.assigned_to).toBe('user-42')
    expect(c.updatingAssign.value).toBeNull()
  })

  it('clears assignment when userId is null', async () => {
    supabaseResult = { error: null }
    const c = useAdminCaptacion()
    c.leads.value = [makeLead({ id: 'lead-1', assigned_to: 'user-42' })]
    await c.updateAssignment('lead-1', null)
    expect(c.leads.value[0]!.assigned_to).toBeNull()
  })

  it('sets error on update failure', async () => {
    supabaseResult = { error: { message: 'Assign failed' } }
    const c = useAdminCaptacion()
    c.leads.value = [makeLead({ id: 'lead-1' })]
    await c.updateAssignment('lead-1', 'user-1')
    expect(c.error.value).toBe('Assign failed')
  })
})

// ─── saveNotes ────────────────────────────────────────────────

describe('saveNotes', () => {
  it('updates contact_notes locally on success', async () => {
    supabaseResult = { error: null }
    const c = useAdminCaptacion()
    c.leads.value = [makeLead({ id: 'lead-1', contact_notes: null })]
    c.editingNotes.value = '  good prospect  '
    await c.saveNotes('lead-1')
    expect(c.leads.value[0]!.contact_notes).toBe('good prospect')
    expect(c.savingNotes.value).toBe(false)
  })

  it('sets contact_notes to null when empty', async () => {
    supabaseResult = { error: null }
    const c = useAdminCaptacion()
    c.leads.value = [makeLead({ id: 'lead-1', contact_notes: 'old note' })]
    c.editingNotes.value = '   '
    await c.saveNotes('lead-1')
    expect(c.leads.value[0]!.contact_notes).toBeNull()
  })

  it('sets error on save failure', async () => {
    supabaseResult = { error: { message: 'Notes save failed' } }
    const c = useAdminCaptacion()
    c.leads.value = [makeLead()]
    await c.saveNotes('lead-1')
    expect(c.error.value).toBe('Notes save failed')
  })
})

// ─── toggleSelect / toggleSelectAll ──────────────────────────

describe('selection', () => {
  it('toggleSelect adds and removes id', () => {
    const c = useAdminCaptacion()
    c.toggleSelect('l1')
    expect(c.selectedIds.value.has('l1')).toBe(true)
    c.toggleSelect('l1')
    expect(c.selectedIds.value.has('l1')).toBe(false)
  })

  it('toggleSelectAll does not error with empty leads', () => {
    // computed is one-shot: filteredLeads evaluates at creation (empty), so toggleSelectAll is a no-op
    const c = useAdminCaptacion()
    c.toggleSelectAll()
    expect(c.selectedIds.value.size).toBe(0)
  })

  it('allFilteredSelected is false when no leads (initial state)', () => {
    const c = useAdminCaptacion()
    expect(c.allFilteredSelected.value).toBe(false)
  })
})

// ─── bulkMarkContacted ────────────────────────────────────────

describe('bulkMarkContacted', () => {
  it('does nothing when no selection', async () => {
    const c = useAdminCaptacion()
    await c.bulkMarkContacted()
    expect(c.bulkProcessing.value).toBe(false)
  })

  it('marks selected leads as contacted', async () => {
    supabaseResult = { error: null }
    const c = useAdminCaptacion()
    c.leads.value = [
      makeLead({ id: 'l1', status: 'new' }),
      makeLead({ id: 'l2', status: 'new' }),
    ]
    c.selectedIds.value = new Set(['l1', 'l2'])
    await c.bulkMarkContacted()
    expect(c.leads.value[0]!.status).toBe('contacted')
    expect(c.leads.value[1]!.status).toBe('contacted')
    expect(c.selectedIds.value.size).toBe(0)
    expect(c.bulkProcessing.value).toBe(false)
  })

  it('sets error on bulk update failure', async () => {
    supabaseResult = { error: { message: 'Bulk failed' } }
    const c = useAdminCaptacion()
    c.leads.value = [makeLead({ id: 'l1' })]
    c.selectedIds.value = new Set(['l1'])
    await c.bulkMarkContacted()
    expect(c.error.value).toBe('admin.captacion.errorBulk')
  })
})

// ─── resetManualForm ──────────────────────────────────────────

describe('resetManualForm', () => {
  it('clears form and hides it', () => {
    const c = useAdminCaptacion()
    c.manualForm.value.company_name = 'Test Company'
    c.showManualForm.value = true
    c.resetManualForm()
    expect(c.manualForm.value.company_name).toBe('')
    expect(c.showManualForm.value).toBe(false)
    expect(c.manualForm.value.active_listings).toBe(0)
    expect(c.manualForm.value.vehicle_types).toBe('')
  })
})

// ─── saveManualLead ───────────────────────────────────────────

describe('saveManualLead', () => {
  it('returns early when company_name is empty', async () => {
    const c = useAdminCaptacion()
    c.manualForm.value.company_name = '   '
    await c.saveManualLead()
    expect(c.manualFormSaving.value).toBe(false)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('inserts lead and prepends to list on success', async () => {
    const newLead = makeLead({ id: 'new-lead', company_name: 'Nueva SL' })
    supabaseResult = { data: [newLead], error: null }
    const c = useAdminCaptacion()
    c.manualForm.value.company_name = 'Nueva SL'
    c.manualForm.value.vehicle_types = 'camion, furgon'
    await c.saveManualLead()
    expect(c.leads.value.length).toBe(1)
    expect(c.leads.value[0]!.company_name).toBe('Nueva SL')
    expect(c.manualFormSaving.value).toBe(false)
    expect(c.showManualForm.value).toBe(false)
  })

  it('sets error on insert failure', async () => {
    supabaseResult = { data: null, error: { message: 'Insert failed' } }
    const c = useAdminCaptacion()
    c.manualForm.value.company_name = 'Test SL'
    await c.saveManualLead()
    expect(c.error.value).toBe('admin.captacion.errorSave')
  })

  it('handles empty data array from insert', async () => {
    supabaseResult = { data: [], error: null }
    const c = useAdminCaptacion()
    c.manualForm.value.company_name = 'Test SL'
    await c.saveManualLead()
    expect(c.leads.value.length).toBe(0)
  })
})

// ─── showSuccess ──────────────────────────────────────────────

describe('showSuccess', () => {
  it('sets successMessage', () => {
    const c = useAdminCaptacion()
    c.showSuccess('Done!')
    expect(c.successMessage.value).toBe('Done!')
  })
})

// ─── Computed: stats and tabCounts ────────────────────────────
// Note: computed is one-shot in test env — values reflect initial empty state

describe('computed stats and tabCounts', () => {
  it('stats has correct structure with initial empty leads', () => {
    const c = useAdminCaptacion()
    expect(c.stats.value).toHaveProperty('total')
    expect(c.stats.value).toHaveProperty('new')
    expect(c.stats.value).toHaveProperty('contacted')
    expect(c.stats.value).toHaveProperty('interested')
    expect(c.stats.value).toHaveProperty('active')
    expect(c.stats.value.total).toBe(0)
  })

  it('tabCounts has correct structure with initial empty leads', () => {
    const c = useAdminCaptacion()
    expect(c.tabCounts.value).toHaveProperty('all')
    expect(c.tabCounts.value).toHaveProperty('new')
    expect(c.tabCounts.value).toHaveProperty('contacted')
    expect(c.tabCounts.value).toHaveProperty('interested')
    expect(c.tabCounts.value).toHaveProperty('onboarding')
    expect(c.tabCounts.value).toHaveProperty('active')
    expect(c.tabCounts.value).toHaveProperty('rejected')
    expect(c.tabCounts.value.all).toBe(0)
  })

  it('filteredLeads is initially empty', () => {
    const c = useAdminCaptacion()
    expect(c.filteredLeads.value).toEqual([])
  })

  it('hasSelection is false initially', () => {
    const c = useAdminCaptacion()
    expect(c.hasSelection.value).toBe(false)
  })
})
