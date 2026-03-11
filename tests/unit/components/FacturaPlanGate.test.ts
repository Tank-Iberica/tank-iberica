/**
 * Tests for app/components/dashboard/herramientas/factura/FacturaPlanGate.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'

beforeAll(() => {
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
})

import FacturaPlanGate from '../../../app/components/dashboard/herramientas/factura/FacturaPlanGate.vue'

describe('FacturaPlanGate', () => {
  const factory = () =>
    shallowMount(FacturaPlanGate, {
      global: {
        stubs: {
          NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
        },
      },
    })

  it('renders plan gate', () => {
    expect(factory().find('.plan-gate').exists()).toBe(true)
  })

  it('shows lock icon', () => {
    expect(factory().find('.plan-gate__icon svg').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.plan-gate__title').text()).toBe('dashboard.tools.invoice.upgradeTitle')
  })

  it('shows description', () => {
    expect(factory().find('.plan-gate__text').text()).toBe('dashboard.tools.invoice.upgradeText')
  })

  it('shows CTA link', () => {
    expect(factory().find('.plan-gate__cta').text()).toBe('dashboard.tools.invoice.upgradeCTA')
  })

  it('CTA links to suscripcion', () => {
    expect(factory().find('.plan-gate__cta').attributes('href')).toBe('/dashboard/suscripcion')
  })
})
