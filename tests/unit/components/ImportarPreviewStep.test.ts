/**
 * Tests for app/components/dashboard/importar/ImportarPreviewStep.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import ImportarPreviewStep from '../../../app/components/dashboard/importar/ImportarPreviewStep.vue'

const validRow = {
  isValid: true,
  brand: 'Scania',
  model: 'R450',
  year: 2022,
  km: 150000,
  price: 85000,
  category: 'venta',
  errors: [] as string[],
}

const invalidRow = {
  isValid: false,
  brand: '',
  model: 'G500',
  year: null,
  km: null,
  price: null,
  category: '',
  errors: ['brand required', 'year required'],
}

describe('ImportarPreviewStep', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ImportarPreviewStep, {
      props: {
        parsedRows: [validRow, invalidRow],
        validRowsCount: 1,
        invalidRowsCount: 1,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders step section', () => {
    expect(factory().find('.step-section').exists()).toBe(true)
  })

  it('shows preview title', () => {
    expect(factory().find('h2').text()).toBe('dashboard.import.preview')
  })

  it('shows valid count', () => {
    expect(factory().find('.stat-valid').text()).toContain('1')
  })

  it('shows invalid count when > 0', () => {
    expect(factory().find('.stat-invalid').text()).toContain('1')
  })

  it('hides invalid count when 0', () => {
    const w = factory({ invalidRowsCount: 0 })
    expect(w.find('.stat-invalid').exists()).toBe(false)
  })

  it('renders table with 8 headers', () => {
    expect(factory().findAll('th')).toHaveLength(8)
  })

  it('renders 2 data rows', () => {
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows check mark for valid row', () => {
    expect(factory().find('.status-ok').exists()).toBe(true)
  })

  it('shows X mark for invalid row', () => {
    expect(factory().find('.status-error').exists()).toBe(true)
  })

  it('shows invalid row class', () => {
    const rows = factory().findAll('tbody tr')
    expect(rows[1].classes()).toContain('row-invalid')
  })

  it('shows error list for invalid row', () => {
    expect(factory().find('.error-list').text()).toBe('brand required, year required')
  })

  it('shows brand cell', () => {
    const cells = factory().findAll('tbody tr')[0].findAll('td')
    expect(cells[1].text()).toBe('Scania')
  })

  it('shows dash for empty values', () => {
    const cells = factory().findAll('tbody tr')[1].findAll('td')
    expect(cells[1].text()).toBe('-') // empty brand
  })

  it('emits back on back button', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('back')).toBeTruthy()
  })

  it('shows publish buttons when valid rows > 0', () => {
    expect(factory().find('.btn-primary').exists()).toBe(true)
  })

  it('hides publish buttons when no valid rows', () => {
    const w = factory({ validRowsCount: 0 })
    expect(w.find('.btn-primary').exists()).toBe(false)
  })

  it('emits publish draft on draft button', async () => {
    const w = factory()
    const btns = w.findAll('.btn-secondary')
    // second btn-secondary is "publish draft" (first is "back")
    await btns[1].trigger('click')
    expect(w.emitted('publish')?.[0]?.[0]).toBe(true)
  })

  it('emits publish all on publish button', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('publish')?.[0]?.[0]).toBe(false)
  })
})
