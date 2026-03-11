/**
 * Tests for app/components/admin/captacion/AdminLeadCards.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import AdminLeadCards from '../../../app/components/admin/captacion/AdminLeadCards.vue'

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
  vehicle_types: ['camion', 'furgoneta'],
  created_at: '2026-01-15T10:00:00Z',
}

const helperFns = {
  getSourceClass: (s: string) => `source-${s}`,
  getSourceLabel: (s: string) => s.toUpperCase(),
  getStatusClass: (s: string) => `status-${s}`,
  getStatusLabel: (s: string) => s.charAt(0).toUpperCase() + s.slice(1),
  formatDate: (d: string | null) => d ? d.split('T')[0] : '-',
  formatVehicleTypes: (types: string[]) => types.join(', '),
}

describe('AdminLeadCards', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminLeadCards, {
      props: {
        leads: [baseLead],
        expandedId: null,
        editingNotes: '',
        savingNotes: false,
        updatingStatus: null,
        updatingAssign: null,
        statusOptions: ['new', 'contacted', 'interested', 'rejected'],
        adminUsers: [{ id: 'admin-1', full_name: 'Admin User', email: 'admin@test.com' }],
        selectedIds: new Set<string>(),
        ...helperFns,
        ...overrides,
      },
      global: {
        mocks: { $t: (key: string) => key },
      },
    })

  it('renders a card for each lead', () => {
    const w = factory()
    expect(w.findAll('.lead-card')).toHaveLength(1)
  })

  it('shows company name', () => {
    const w = factory()
    expect(w.find('.card-company').text()).toBe('Transport SA')
  })

  it('shows status badge with correct class', () => {
    const w = factory()
    expect(w.find('.status-badge').classes()).toContain('status-new')
  })

  it('shows source badge', () => {
    const w = factory()
    expect(w.find('.source-badge').classes()).toContain('source-mascus')
  })

  it('shows location', () => {
    const w = factory()
    expect(w.text()).toContain('Madrid')
  })

  it('shows active listings count', () => {
    const w = factory()
    expect(w.text()).toContain('15')
  })

  it('emits toggleExpand on header click', async () => {
    const w = factory()
    await w.find('.card-header').trigger('click')
    expect(w.emitted('toggleExpand')).toEqual([['lead-1']])
  })

  it('applies expanded class when expandedId matches', () => {
    const w = factory({ expandedId: 'lead-1' })
    expect(w.find('.lead-card').classes()).toContain('expanded')
  })

  it('shows expanded section when expandedId matches', () => {
    const w = factory({ expandedId: 'lead-1' })
    expect(w.find('.card-expanded').exists()).toBe(true)
  })

  it('hides expanded section when not expanded', () => {
    const w = factory({ expandedId: null })
    expect(w.find('.card-expanded').exists()).toBe(false)
  })

  it('shows phone link in expanded section', () => {
    const w = factory({ expandedId: 'lead-1' })
    const link = w.find('a[href="tel:+34666111222"]')
    expect(link.exists()).toBe(true)
  })

  it('shows email link in expanded section', () => {
    const w = factory({ expandedId: 'lead-1' })
    const link = w.find('a[href="mailto:info@transport.com"]')
    expect(link.exists()).toBe(true)
  })

  it('shows "no phone" when phone is null', () => {
    const lead = { ...baseLead, phone: null }
    const w = factory({ leads: [lead], expandedId: 'lead-1' })
    expect(w.find('.contact-empty').exists()).toBe(true)
  })

  it('shows source URL link', () => {
    const w = factory({ expandedId: 'lead-1' })
    const link = w.find('a[href="https://mascus.com/dealer/1"]')
    expect(link.exists()).toBe(true)
  })

  it('emits toggleSelect on checkbox change', async () => {
    const w = factory()
    await w.find('.card-checkbox').trigger('change')
    expect(w.emitted('toggleSelect')).toEqual([['lead-1']])
  })

  it('applies selected class when id is in selectedIds', () => {
    const w = factory({ selectedIds: new Set(['lead-1']) })
    expect(w.find('.lead-card').classes()).toContain('selected')
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

  it('shows vehicle types in expanded section', () => {
    const w = factory({ expandedId: 'lead-1' })
    expect(w.text()).toContain('camion, furgoneta')
  })
})
