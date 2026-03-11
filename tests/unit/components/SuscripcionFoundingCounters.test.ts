/**
 * Tests for app/components/admin/dealers/SuscripcionFoundingCounters.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import SuscripcionFoundingCounters from '../../../app/components/admin/dealers/SuscripcionFoundingCounters.vue'

describe('SuscripcionFoundingCounters', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(SuscripcionFoundingCounters, {
      props: {
        foundingCountByVertical: { tracciona: 8, maquinaria: 3 },
        uniqueVerticals: ['tracciona', 'maquinaria'],
        foundingMaxPerVertical: 10,
        ...overrides,
      },
    })

  it('renders founding stats', () => {
    expect(factory().find('.founding-stats').exists()).toBe(true)
  })

  it('renders cards for each vertical', () => {
    expect(factory().findAll('.founding-stat-card')).toHaveLength(2)
  })

  it('shows vertical name in label', () => {
    const labels = factory().findAll('.founding-label')
    expect(labels[0].text()).toContain('tracciona')
    expect(labels[1].text()).toContain('maquinaria')
  })

  it('shows count / max', () => {
    const values = factory().findAll('.founding-value')
    expect(values[0].text()).toContain('8 / 10')
    expect(values[1].text()).toContain('3 / 10')
  })

  it('applies at-max class when count reaches max', () => {
    const w = factory({
      foundingCountByVertical: { tracciona: 10, maquinaria: 3 },
    })
    const values = w.findAll('.founding-value')
    expect(values[0].classes()).toContain('at-max')
    expect(values[1].classes()).not.toContain('at-max')
  })

  it('hides when no data', () => {
    const w = factory({ foundingCountByVertical: {} })
    expect(w.find('.founding-stats').exists()).toBe(false)
  })
})
