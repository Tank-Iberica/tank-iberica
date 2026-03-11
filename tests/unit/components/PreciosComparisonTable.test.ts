/**
 * Tests for app/components/precios/PreciosComparisonTable.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import PreciosComparisonTable from '../../../app/components/precios/PreciosComparisonTable.vue'

const baseRows = [
  { label: 'Anuncios', free: '5', basic: '25', premium: 'Ilimitado', founding: 'Ilimitado' },
  { label: 'Estadísticas', free: false, basic: true, premium: true, founding: true },
]

describe('PreciosComparisonTable', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(PreciosComparisonTable, {
      props: { rows: [...baseRows], ...overrides },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders comparison section', () => {
    expect(factory().find('.comparison-section').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.comparison-title').text()).toBe('pricing.compareTitle')
  })

  it('renders table with 5 header columns', () => {
    expect(factory().findAll('th')).toHaveLength(5)
  })

  it('renders rows', () => {
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows feature labels', () => {
    const cells = factory().findAll('.comparison-feature-cell')
    expect(cells[0].text()).toBe('Anuncios')
    expect(cells[1].text()).toBe('Estadísticas')
  })

  it('shows text values', () => {
    const firstRow = factory().findAll('tbody tr')[0]
    const cells = firstRow.findAll('.comparison-value-cell')
    expect(cells[0].text()).toBe('5')
    expect(cells[1].text()).toBe('25')
  })

  it('shows check icon for boolean true', () => {
    const secondRow = factory().findAll('tbody tr')[1]
    const checks = secondRow.findAll('.check-icon')
    expect(checks.length).toBeGreaterThan(0)
  })

  it('shows cross icon for boolean false', () => {
    const secondRow = factory().findAll('tbody tr')[1]
    expect(secondRow.find('.cross-icon').exists()).toBe(true)
  })

  it('renders empty table', () => {
    const w = factory({ rows: [] })
    expect(w.findAll('tbody tr')).toHaveLength(0)
  })
})
