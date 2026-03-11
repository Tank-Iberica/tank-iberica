/**
 * Tests for app/components/dashboard/herramientas/factura/FacturaTabs.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'

beforeAll(() => {
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
})

import FacturaTabs from '../../../app/components/dashboard/herramientas/factura/FacturaTabs.vue'

describe('FacturaTabs', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(FacturaTabs, {
      props: { activeTab: 'new' as const, historyCount: 0, ...overrides },
    })

  it('renders tabs container', () => {
    expect(factory().find('.tool-tabs').exists()).toBe(true)
  })

  it('renders 2 tab buttons', () => {
    expect(factory().findAll('.tool-tabs__btn')).toHaveLength(2)
  })

  it('first tab shows new label', () => {
    expect(factory().findAll('.tool-tabs__btn')[0].text()).toBe('dashboard.tools.invoice.tabNew')
  })

  it('second tab shows history label', () => {
    expect(factory().findAll('.tool-tabs__btn')[1].text()).toContain('dashboard.tools.invoice.tabHistory')
  })

  it('new tab active by default', () => {
    expect(factory().findAll('.tool-tabs__btn')[0].classes()).toContain('tool-tabs__btn--active')
  })

  it('history tab active when set', () => {
    const w = factory({ activeTab: 'history' })
    expect(w.findAll('.tool-tabs__btn')[1].classes()).toContain('tool-tabs__btn--active')
  })

  it('hides badge when historyCount=0', () => {
    expect(factory({ historyCount: 0 }).find('.tool-tabs__badge').exists()).toBe(false)
  })

  it('shows badge with count when historyCount>0', () => {
    const badge = factory({ historyCount: 5 }).find('.tool-tabs__badge')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('5')
  })

  it('emits change with new on first tab click', async () => {
    const w = factory({ activeTab: 'history' })
    await w.findAll('.tool-tabs__btn')[0].trigger('click')
    expect(w.emitted('change')![0]).toEqual(['new'])
  })

  it('emits change with history on second tab click', async () => {
    const w = factory()
    await w.findAll('.tool-tabs__btn')[1].trigger('click')
    expect(w.emitted('change')![0]).toEqual(['history'])
  })
})
