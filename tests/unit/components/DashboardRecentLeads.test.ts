/**
 * Tests for app/components/dashboard/index/DashboardRecentLeads.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import DashboardRecentLeads from '../../../app/components/dashboard/index/DashboardRecentLeads.vue'

const NuxtLinkStub = { template: '<a :href="to"><slot /></a>', props: ['to'] }

describe('DashboardRecentLeads', () => {
  const leads = [
    {
      id: 'lead-1',
      buyer_name: 'Carlos López',
      buyer_email: 'carlos@test.com',
      vehicle_brand: 'Volvo',
      vehicle_model: 'FH 500',
      status: 'new',
      created_at: '2026-03-01',
    },
    {
      id: 'lead-2',
      buyer_name: '',
      buyer_email: 'anon@test.com',
      vehicle_brand: 'Scania',
      vehicle_model: 'R 450',
      status: 'contacted',
      created_at: '2026-03-02',
    },
  ]

  const getStatusColor = (s: string) => (s === 'new' ? '#22c55e' : '#f59e0b')
  const formatDate = (d: string | null) => d ?? ''

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DashboardRecentLeads, {
      props: {
        leads,
        getStatusColor,
        formatDate,
        ...overrides,
      },
      global: {
        stubs: { NuxtLink: NuxtLinkStub },
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders card section', () => {
    expect(factory().find('.card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.card-header h2').text()).toBe('dashboard.recentLeads')
  })

  it('shows view all link', () => {
    const link = factory().find('.link-more')
    expect(link.text()).toBe('dashboard.viewAll')
    expect(link.attributes('href')).toBe('/dashboard/leads')
  })

  it('shows empty state when no leads', () => {
    const w = factory({ leads: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
    expect(w.find('.leads-list').exists()).toBe(false)
  })

  it('renders lead items', () => {
    expect(factory().findAll('.lead-item')).toHaveLength(2)
  })

  it('shows buyer name', () => {
    expect(factory().findAll('.lead-name')[0].text()).toBe('Carlos López')
  })

  it('falls back to email when no buyer name', () => {
    expect(factory().findAll('.lead-name')[1].text()).toBe('anon@test.com')
  })

  it('shows vehicle brand and model', () => {
    expect(factory().findAll('.lead-vehicle')[0].text()).toBe('Volvo FH 500')
  })

  it('shows status badge', () => {
    expect(factory().findAll('.status-badge')).toHaveLength(2)
  })

  it('links lead item to detail page', () => {
    expect(factory().findAll('.lead-item')[0].attributes('href')).toBe('/dashboard/leads/lead-1')
  })

  it('shows formatted date', () => {
    expect(factory().findAll('.lead-date')[0].text()).toBe('2026-03-01')
  })
})
