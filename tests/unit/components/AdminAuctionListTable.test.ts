/**
 * Tests for app/components/admin/subastas/AdminAuctionListTable.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminAuctionListTable from '../../../app/components/admin/subastas/AdminAuctionListTable.vue'

describe('AdminAuctionListTable', () => {
  const auctions = [
    {
      id: 'a-1',
      title: 'Subasta Volvo',
      start_price_cents: 5000000,
      current_bid_cents: 6500000,
      status: 'active',
      starts_at: '2026-03-01',
      ends_at: '2026-03-15',
      bid_count: 7,
      vehicles: { brand: 'Volvo', model: 'FH 500' },
    },
    {
      id: 'a-2',
      title: null,
      start_price_cents: 3000000,
      current_bid_cents: 0,
      status: 'draft',
      starts_at: null,
      ends_at: null,
      bid_count: 0,
      vehicles: { brand: 'Scania', model: 'R 450' },
    },
  ]

  const NuxtLinkStub = {
    template: '<a :href="to"><slot /></a>',
    props: ['to'],
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminAuctionListTable, {
      props: {
        auctions,
        loading: false,
        error: '',
        formatDate: (d: string | null) => d || '-',
        formatPriceCents: (c: number | null) => (c ? `${c / 100} €` : '-'),
        getStatusClass: (s: string) => `status-${s}`,
        getStatusLabel: (s: string) => s.toUpperCase(),
        getVehicleTitle: (a: Record<string, unknown>) => `${(a.vehicles as Record<string, string>).brand} ${(a.vehicles as Record<string, string>).model}`,
        canEdit: () => true,
        canCancel: () => true,
        canAdjudicate: (a: Record<string, unknown>) => a.status === 'active',
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: { NuxtLink: NuxtLinkStub },
      },
    })

  it('renders table', () => {
    expect(factory().find('.data-table').exists()).toBe(true)
  })

  it('renders 9 headers', () => {
    expect(factory().findAll('th')).toHaveLength(9)
  })

  it('renders auction rows', () => {
    // 2 data rows
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows vehicle title', () => {
    expect(factory().find('strong').text()).toBe('Volvo FH 500')
  })

  it('shows auction title', () => {
    const cells = factory().findAll('tbody tr')[0].findAll('td')
    expect(cells[1].text()).toBe('Subasta Volvo')
  })

  it('shows dash for missing title', () => {
    const cells = factory().findAll('tbody tr')[1].findAll('td')
    expect(cells[1].text()).toBe('-')
  })

  it('shows status badge', () => {
    const badge = factory().find('.status-badge')
    expect(badge.classes()).toContain('status-active')
    expect(badge.text()).toBe('ACTIVE')
  })

  it('shows bid count', () => {
    const cells = factory().findAll('tbody tr')[0].findAll('td')
    expect(cells[7].text()).toContain('7')
  })

  it('shows error state', () => {
    const w = factory({ error: 'Error loading' })
    expect(w.find('.alert-error').text()).toBe('Error loading')
  })

  it('shows loading state', () => {
    const w = factory({ loading: true })
    expect(w.find('.loading-state').exists()).toBe(true)
  })

  it('shows empty state when no auctions', () => {
    const w = factory({ auctions: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
  })

  it('shows adjudicate button for active auctions', () => {
    expect(factory().find('.action-adjudicate').exists()).toBe(true)
  })

  it('emits edit on edit click', async () => {
    const w = factory()
    const editBtns = w.findAll('.action-btn').filter((b) => b.attributes('title') === 'admin.subastas.actions.edit')
    await editBtns[0].trigger('click')
    expect(w.emitted('edit')).toBeTruthy()
  })

  it('emits cancel on cancel click', async () => {
    const w = factory()
    await w.find('.action-cancel').trigger('click')
    expect(w.emitted('cancel')).toBeTruthy()
  })

  it('emits adjudicate on adjudicate click', async () => {
    const w = factory()
    await w.find('.action-adjudicate').trigger('click')
    expect(w.emitted('adjudicate')).toBeTruthy()
  })
})
