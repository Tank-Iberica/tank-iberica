/**
 * Tests for app/components/dashboard/herramientas/widget/WidgetConfigCard.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'

beforeAll(() => {
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
})

import WidgetConfigCard from '../../../app/components/dashboard/herramientas/widget/WidgetConfigCard.vue'

describe('WidgetConfigCard', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(WidgetConfigCard, {
      props: {
        vehicleCount: 6,
        theme: 'light' as const,
        categories: [{ id: 'c1', slug: 'camiones', name_es: 'Camiones' }],
        selectedCategory: '',
        widgetWidth: '100%',
        widgetHeight: '600',
        useAutoHeight: false,
        countOptions: [3, 6, 9, 12],
        ...overrides,
      },
    })

  it('renders config card', () => {
    expect(factory().find('.config-card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.card-title').text()).toBe('dashboard.widget.configTitle')
  })

  it('renders count buttons', () => {
    expect(factory().findAll('.count-btn')).toHaveLength(4)
  })

  it('marks active count button', () => {
    const btns = factory().findAll('.count-btn')
    expect(btns[1].classes()).toContain('active') // 6 is index 1
  })

  it('emits set-count on count click', async () => {
    const w = factory()
    await w.findAll('.count-btn')[2].trigger('click')
    expect(w.emitted('set-count')![0]).toEqual([9])
  })

  it('renders 2 theme buttons', () => {
    expect(factory().findAll('.theme-btn')).toHaveLength(2)
  })

  it('emits set-theme on theme click', async () => {
    const w = factory()
    await w.find('.theme-dark').trigger('click')
    expect(w.emitted('set-theme')![0]).toEqual(['dark'])
  })

  it('renders category select', () => {
    const sel = factory().find('.form-select')
    expect(sel.findAll('option')).toHaveLength(2) // all + 1 category
  })

  it('shows height input when autoHeight=false', () => {
    const inputs = factory({ useAutoHeight: false }).findAll('.form-input')
    expect(inputs.length).toBeGreaterThanOrEqual(2) // width + height
  })

  it('hides height input when autoHeight=true', () => {
    const w = factory({ useAutoHeight: true })
    // only width input should be present
    const inputs = w.findAll('.form-input')
    expect(inputs).toHaveLength(1)
  })

  it('emits toggle-auto-height on checkbox change', async () => {
    const w = factory()
    const cb = w.find('.form-checkbox')
    Object.defineProperty(cb.element, 'checked', { value: true, writable: true })
    await cb.trigger('change')
    expect(w.emitted('toggle-auto-height')![0]).toEqual([true])
  })
})
