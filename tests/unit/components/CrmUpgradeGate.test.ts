/**
 * Tests for app/components/dashboard/crm/CrmUpgradeGate.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import CrmUpgradeGate from '../../../app/components/dashboard/crm/CrmUpgradeGate.vue'

describe('CrmUpgradeGate', () => {
  const factory = () =>
    shallowMount(CrmUpgradeGate, {
      global: {
        mocks: { $t: (k: string) => k },
        stubs: {
          NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
        },
      },
    })

  it('renders upgrade gate', () => {
    expect(factory().find('.upgrade-gate').exists()).toBe(true)
  })

  it('shows lock icon', () => {
    expect(factory().find('.upgrade-icon').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h2').text()).toBe('dashboard.crm.upgradeTitle')
  })

  it('shows description', () => {
    expect(factory().find('p').text()).toBe('dashboard.crm.upgradeDesc')
  })

  it('upgrade link points to suscripcion', () => {
    expect(factory().find('.btn-primary').attributes('href')).toBe('/dashboard/suscripcion')
  })
})
