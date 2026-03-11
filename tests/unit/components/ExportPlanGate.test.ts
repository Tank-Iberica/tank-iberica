/**
 * Tests for app/components/dashboard/herramientas/exportar/ExportPlanGate.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ExportPlanGate from '../../../app/components/dashboard/herramientas/exportar/ExportPlanGate.vue'

describe('ExportPlanGate', () => {
  const factory = () =>
    shallowMount(ExportPlanGate, {
      global: {
        mocks: { $t: (k: string) => k },
        stubs: {
          NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
        },
      },
    })

  it('renders plan gate', () => {
    expect(factory().find('.plan-gate').exists()).toBe(true)
  })

  it('shows lock icon', () => {
    expect(factory().find('.gate-icon').exists()).toBe(true)
  })

  it('shows plan required title', () => {
    expect(factory().find('h2').text()).toBe('dashboard.tools.export.planRequired')
  })

  it('shows description', () => {
    expect(factory().find('p').text()).toBe('dashboard.tools.export.planRequiredDesc')
  })

  it('upgrade link points to suscripcion', () => {
    expect(factory().find('.btn-primary').attributes('href')).toBe('/dashboard/suscripcion')
  })

  it('upgrade link has text', () => {
    expect(factory().find('.btn-primary').text()).toBe('dashboard.tools.export.upgradePlan')
  })
})
