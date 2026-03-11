/**
 * Tests for app/components/dashboard/index/DashboardHeader.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import DashboardHeader from '../../../app/components/dashboard/index/DashboardHeader.vue'

describe('DashboardIndexHeader', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DashboardHeader, {
      props: {
        companyName: 'Transportes León SL',
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders header', () => {
    expect(factory().find('.page-header').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h1').text()).toBeTruthy()
  })

  it('shows subtitle', () => {
    expect(factory().find('.subtitle').text()).toBeTruthy()
  })

  it('shows publish new link', () => {
    expect(factory().find('.btn-primary').exists()).toBe(true)
  })
})
