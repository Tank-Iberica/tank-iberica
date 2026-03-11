/**
 * Tests for app/components/admin/pagos/PagosStripeConnect.vue
 */
import { vi, describe, it, expect } from 'vitest'

vi.mock('~/composables/admin/useAdminPagos', () => ({
  truncateId: (id: string) => id.slice(0, 10) + '...',
  getStripeAccountUrl: (id: string) => `https://dashboard.stripe.com/connect/accounts/${id}`,
}))

import { shallowMount } from '@vue/test-utils'
import PagosStripeConnect from '../../../app/components/admin/pagos/PagosStripeConnect.vue'

const accounts = [
  {
    id: 'sa1',
    stripe_account_id: 'acct_1234567890',
    dealers: { company_name: 'Dealer Motors' },
    onboarding_completed: true,
    charges_enabled: true,
  },
  {
    id: 'sa2',
    stripe_account_id: 'acct_0987654321',
    dealers: { company_name: null },
    onboarding_completed: false,
    charges_enabled: false,
  },
]

describe('PagosStripeConnect', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(PagosStripeConnect, {
      props: {
        accounts,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders section', () => {
    expect(factory().find('.stripe-connect-section').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h2').text()).toBeTruthy()
  })

  it('shows subtitle', () => {
    expect(factory().find('.section-subtitle').exists()).toBe(true)
  })

  it('renders desktop table with 2 rows', () => {
    expect(factory().findAll('.data-table tbody tr')).toHaveLength(2)
  })

  it('shows dealer name', () => {
    expect(factory().html()).toContain('Dealer Motors')
  })

  it('shows dash for missing company name', () => {
    expect(factory().findAll('.connect-card-name')[1].text()).toBe('-')
  })

  it('shows truncated account ID as link', () => {
    expect(factory().find('.stripe-link').text()).toBe('acct_12345...')
  })

  it('shows onboarding completed status', () => {
    const statuses = factory().findAll('.data-table .connect-status')
    expect(statuses[0].classes()).toContain('connect-ok')
  })

  it('shows onboarding pending status', () => {
    const statuses = factory().findAll('.data-table .connect-status')
    expect(statuses[2].classes()).toContain('connect-pending')
  })

  it('renders mobile cards', () => {
    expect(factory().findAll('.connect-card')).toHaveLength(2)
  })
})
