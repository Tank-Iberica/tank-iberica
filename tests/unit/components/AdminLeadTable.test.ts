/**
 * Tests for app/components/admin/captacion/AdminLeadTable.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import AdminLeadTable from '../../../app/components/admin/captacion/AdminLeadTable.vue'

const baseLead = {
  id: 'lead-1',
  company_name: 'Transport SA',
  source: 'mascus',
  location: 'Madrid',
  active_listings: 15,
  status: 'new',
  assigned_to: null as string | null,
  phone: '+34666111222',
  email: 'info@transport.com',
  source_url: 'https://mascus.com/dealer/1',
  contacted_at: null as string | null,
  vehicle_types: ['camion'],
  created_at: '2026-01-15T10:00:00Z',
}

const helperFns = {
  getSourceClass: (s: string) => `source-${s}`,
  getSourceLabel: (s: string) => s.toUpperCase(),
  getStatusClass: (s: string) => `status-${s}`,
  getStatusLabel: (s: string) => s,
  getAssignedName: (id: string | null) => id ? 'Admin' : 'Sin asignar',
  formatDate: (d: string | null) => d ? d.split('T')[0] : '-',
  formatVehicleTypes: (types: string[]) => types.join(', '),
}

describe('AdminLeadTable', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminLeadTable, {
      props: {
        leads: [baseLead],
        expandedId: null,
        editingNotes: '',
        savingNotes: false,
        updatingStatus: null,
        updatingAssign: null,
        statusOptions: ['new', 'contacted', 'interested', 'rejected'],
        adminUsers: [{ id: 'admin-1', full_name: 'Admin User', email: 'admin@test.com' }],
        allFilteredSelected: false,
        selectedIds: new Set<string>(),
        ...helperFns,
        ...overrides,
      },
      global: {
        mocks: { $t: (key: string) => key },
      },
    })

  it('renders a table with 9 header columns', () => {
    const w = factory()
    expect(w.findAll('th')).toHaveLength(9)
  })

  it('renders a row per lead', () => {
    const w = factory()
    expect(w.findAll('.table-row')).toHaveLength(1)
  })

  it('shows company name in cell', () => {
    const w = factory()
    expect(w.find('.cell-company').text()).toBe('Transport SA')
  })

  it('shows source badge', () => {
    const w = factory()
    expect(w.find('.source-badge').classes()).toContain('source-mascus')
  })

  it('shows status badge', () => {
    const w = factory()
    expect(w.find('.status-badge').classes()).toContain('status-new')
  })

  it('shows assigned name', () => {
    const w = factory()
    expect(w.find('.cell-assigned').text()).toBe('Sin asignar')
  })

  it('emits toggleExpand on row click', async () => {
    const w = factory()
    await w.find('.table-row').trigger('click')
    expect(w.emitted('toggleExpand')).toEqual([['lead-1']])
  })

  it('applies expanded class when expandedId matches', () => {
    const w = factory({ expandedId: 'lead-1' })
    expect(w.find('.table-row').classes()).toContain('expanded')
  })

  it('shows expanded row when expandedId matches', () => {
    const w = factory({ expandedId: 'lead-1' })
    expect(w.find('.expanded-row').exists()).toBe(true)
  })

  it('hides expanded row when not expanded', () => {
    const w = factory({ expandedId: null })
    expect(w.find('.expanded-row').exists()).toBe(false)
  })

  it('emits toggleSelectAll on header checkbox change', async () => {
    const w = factory()
    const headerCheckbox = w.find('.col-check input[type="checkbox"]')
    await headerCheckbox.trigger('change')
    expect(w.emitted('toggleSelectAll')).toHaveLength(1)
  })

  it('emits toggleSelect on row checkbox change', async () => {
    const w = factory()
    const checkboxes = w.findAll('input[type="checkbox"]')
    // First is header, second is row
    await checkboxes[1].trigger('change')
    expect(w.emitted('toggleSelect')).toEqual([['lead-1']])
  })

  it('applies selected class when lead is selected', () => {
    const w = factory({ selectedIds: new Set(['lead-1']) })
    expect(w.find('.table-row').classes()).toContain('selected')
  })

  it('shows phone link in expanded section', () => {
    const w = factory({ expandedId: 'lead-1' })
    const link = w.find('a[href="tel:+34666111222"]')
    expect(link.exists()).toBe(true)
  })

  it('shows contact-empty when phone is null', () => {
    const lead = { ...baseLead, phone: null }
    const w = factory({ leads: [lead], expandedId: 'lead-1' })
    expect(w.find('.contact-empty').exists()).toBe(true)
  })

  it('emits saveNotes on save button click', async () => {
    const w = factory({ expandedId: 'lead-1' })
    await w.find('.btn-save-notes').trigger('click')
    expect(w.emitted('saveNotes')).toEqual([['lead-1']])
  })

  it('disables save notes button when saving', () => {
    const w = factory({ expandedId: 'lead-1', savingNotes: true })
    expect(w.find('.btn-save-notes').attributes('disabled')).toBeDefined()
  })
})
