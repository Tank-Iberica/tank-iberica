/**
 * Tests for app/components/admin/facturacion/FacturacionPeriodTabs.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import FacturacionPeriodTabs from '../../../app/components/admin/facturacion/FacturacionPeriodTabs.vue'

describe('FacturacionPeriodTabs', () => {
  const periods = [
    { value: '2026-01', label: () => 'Enero 2026' },
    { value: '2025-12', label: () => 'Diciembre 2025' },
    { value: '2025-11', label: () => 'Noviembre 2025' },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(FacturacionPeriodTabs, {
      props: {
        periods,
        selectedPeriod: '2026-01',
        ...overrides,
      },
    })

  it('renders period tabs', () => {
    expect(factory().find('.period-tabs').exists()).toBe(true)
  })

  it('renders correct number of tabs', () => {
    expect(factory().findAll('.period-tab')).toHaveLength(3)
  })

  it('shows period labels', () => {
    const tabs = factory().findAll('.period-tab')
    expect(tabs[0].text()).toBe('Enero 2026')
    expect(tabs[1].text()).toBe('Diciembre 2025')
  })

  it('marks selected period as active', () => {
    const tabs = factory().findAll('.period-tab')
    expect(tabs[0].classes()).toContain('active')
    expect(tabs[1].classes()).not.toContain('active')
  })

  it('emits select on tab click', async () => {
    const w = factory()
    await w.findAll('.period-tab')[1].trigger('click')
    expect(w.emitted('select')![0]).toEqual(['2025-12'])
  })
})
