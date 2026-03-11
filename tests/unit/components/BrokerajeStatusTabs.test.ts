/**
 * Tests for app/components/admin/brokeraje/BrokerajeStatusTabs.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import BrokerajeStatusTabs from '../../../app/components/admin/brokeraje/BrokerajeStatusTabs.vue'

describe('BrokerajeStatusTabs', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(BrokerajeStatusTabs, {
      props: {
        activeTab: 'all',
        ...overrides,
      },
    })

  it('renders status tabs', () => {
    expect(factory().find('.status-tabs').exists()).toBe(true)
  })

  it('renders 4 tab buttons', () => {
    expect(factory().findAll('.tab-btn')).toHaveLength(4)
  })

  it('shows correct labels', () => {
    const labels = factory().findAll('.tab-btn').map(b => b.text())
    expect(labels).toEqual(['Todos', 'Calificacion', 'En curso', 'Cerrados'])
  })

  it('marks active tab', () => {
    const btns = factory({ activeTab: 'active' }).findAll('.tab-btn')
    expect(btns[0].classes()).not.toContain('active')
    expect(btns[2].classes()).toContain('active')
  })

  it('emits update:activeTab on click', async () => {
    const w = factory()
    await w.findAll('.tab-btn')[1].trigger('click')
    expect(w.emitted('update:activeTab')![0]).toEqual(['qualifying'])
  })

  it('marks all as active by default', () => {
    expect(factory().findAll('.tab-btn')[0].classes()).toContain('active')
  })
})
