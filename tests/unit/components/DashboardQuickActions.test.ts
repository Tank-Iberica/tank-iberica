/**
 * Tests for app/components/dashboard/index/DashboardQuickActions.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import DashboardQuickActions from '../../../app/components/dashboard/index/DashboardQuickActions.vue'

const NuxtLinkStub = { template: '<a :href="to"><slot /></a>', props: ['to'] }

describe('DashboardQuickActions', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DashboardQuickActions, {
      props: {
        currentPlan: 'basic',
        ...overrides,
      },
      global: {
        stubs: { NuxtLink: NuxtLinkStub },
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders quick actions grid', () => {
    expect(factory().find('.quick-actions').exists()).toBe(true)
  })

  it('renders 8 action cards', () => {
    expect(factory().findAll('.action-card')).toHaveLength(8)
  })

  it('first card links to nuevo vehiculo', () => {
    const cards = factory().findAll('.action-card')
    expect(cards[0].attributes('href')).toBe('/dashboard/vehiculos/nuevo')
  })

  it('shows plan name in last card', () => {
    const cards = factory().findAll('.action-card')
    expect(cards[7].text()).toContain('dashboard.plans.basic')
  })

  it('each card has an icon', () => {
    const icons = factory().findAll('.action-icon')
    expect(icons).toHaveLength(8)
  })

  it('shows + icon for publish action', () => {
    expect(factory().findAll('.action-icon')[0].text()).toBe('+')
  })
})
