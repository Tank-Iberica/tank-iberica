/**
 * Tests for app/components/dashboard/herramientas/exportar/ExportOptionsCard.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'

beforeAll(() => {
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
})

import ExportOptionsCard from '../../../app/components/dashboard/herramientas/exportar/ExportOptionsCard.vue'

describe('ExportOptionsCard', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ExportOptionsCard, {
      props: {
        statusFilter: 'all' as const,
        categoryFilter: null,
        exportFormat: 'csv' as const,
        availableCategories: ['camiones', 'furgonetas'],
        vehicleCount: 15,
        ...overrides,
      },
    })

  it('renders options card', () => {
    expect(factory().find('.options-card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h2').text()).toBe('dashboard.tools.export.options')
  })

  it('shows vehicle count', () => {
    expect(factory().find('.vehicle-count').text()).toContain('15')
  })

  it('renders status select with 2 options', () => {
    const selects = factory().findAll('.field-select')
    expect(selects[0].findAll('option')).toHaveLength(2)
  })

  it('renders category select with all + categories', () => {
    const selects = factory().findAll('.field-select')
    expect(selects[1].findAll('option')).toHaveLength(3) // all + 2 categories
  })

  it('shows CSV button active by default', () => {
    const btns = factory().findAll('.format-btn')
    expect(btns[0].classes()).toContain('active')
    expect(btns[0].text()).toBe('CSV')
  })

  it('shows PDF button', () => {
    const btns = factory().findAll('.format-btn')
    expect(btns[1].text()).toContain('PDF')
  })

  it('emits update:exportFormat on format click', async () => {
    const w = factory()
    await w.findAll('.format-btn')[1].trigger('click')
    expect(w.emitted('update:exportFormat')![0]).toEqual(['pdf'])
  })

  it('emits update:statusFilter on status change', async () => {
    const w = factory()
    const sel = w.findAll('.field-select')[0]
    Object.defineProperty(sel.element, 'value', { value: 'published', writable: true })
    await sel.trigger('change')
    expect(w.emitted('update:statusFilter')![0]).toEqual(['published'])
  })

  it('emits update:categoryFilter on category change', async () => {
    const w = factory()
    const sel = w.findAll('.field-select')[1]
    Object.defineProperty(sel.element, 'value', { value: 'camiones', writable: true })
    await sel.trigger('change')
    expect(w.emitted('update:categoryFilter')![0]).toEqual(['camiones'])
  })

  it('emits update:exportFormat csv on csv button click', async () => {
    const w = factory()
    const csvBtn = w.findAll('.format-btn').find(b => b.text() === 'CSV')
    await csvBtn!.trigger('click')
    expect(w.emitted('update:exportFormat')![0]).toEqual(['csv'])
  })
})
