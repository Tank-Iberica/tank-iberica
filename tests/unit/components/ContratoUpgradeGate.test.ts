/**
 * Tests for app/components/dashboard/herramientas/contrato/ContratoUpgradeGate.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ContratoUpgradeGate from '../../../app/components/dashboard/herramientas/contrato/ContratoUpgradeGate.vue'

describe('ContratoUpgradeGate', () => {
  const factory = () =>
    shallowMount(ContratoUpgradeGate, {
      props: { currentPlan: 'free' },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: {
          NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
        },
      },
    })

  it('renders page header', () => {
    expect(factory().find('.page-header').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h1').text()).toBe('dashboard.tools.contract.title')
  })

  it('shows plan badge', () => {
    expect(factory().find('.plan-badge').text()).toBe('dashboard.plans.free')
  })

  it('shows upgrade card', () => {
    expect(factory().find('.upgrade-card').exists()).toBe(true)
  })

  it('shows upgrade title', () => {
    expect(factory().find('.upgrade-card h2').text()).toBe('dashboard.tools.contract.upgradeTitle')
  })

  it('upgrade link points to suscripcion', () => {
    expect(factory().find('.btn-primary').attributes('href')).toBe('/dashboard/suscripcion')
  })
})
