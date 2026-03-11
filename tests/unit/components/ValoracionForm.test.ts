/**
 * Tests for app/components/valoracion/ValoracionForm.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ValoracionForm from '../../../app/components/valoracion/ValoracionForm.vue'

const baseForm = { brand: '', model: '', year: null, km: null, province: '', subcategory: '', email: '' }
const baseSubcats = [
  { id: 'sc-1', slug: 'tractora', name: 'Tractora', name_en: 'Tractor' },
  { id: 'sc-2', slug: 'rigido', name: 'Rígido', name_en: 'Rigid' },
]

describe('ValoracionForm', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ValoracionForm, {
      props: {
        form: { ...baseForm },
        formErrors: {},
        loading: false,
        subcategories: [...baseSubcats],
        provinces: ['Madrid', 'Barcelona'],
        subcategoryLabel: (sub: any) => sub.name,
        ...overrides,
      },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders form', () => {
    expect(factory().find('.valuation-form').exists()).toBe(true)
  })

  it('renders brand input', () => {
    expect(factory().find('#val-brand').exists()).toBe(true)
  })

  it('renders model input', () => {
    expect(factory().find('#val-model').exists()).toBe(true)
  })

  it('renders year input', () => {
    expect(factory().find('#val-year').exists()).toBe(true)
  })

  it('renders province select with options', () => {
    const options = factory().find('#val-province').findAll('option')
    expect(options).toHaveLength(3) // placeholder + 2 provinces
  })

  it('renders subcategory select with options', () => {
    const options = factory().find('#val-subcategory').findAll('option')
    expect(options).toHaveLength(3) // placeholder + 2 subcats
  })

  it('shows error class when formErrors has field', () => {
    const w = factory({ formErrors: { brand: true } })
    expect(w.findAll('.form-group--error').length).toBeGreaterThan(0)
  })

  it('shows error message for errored field', () => {
    const w = factory({ formErrors: { brand: true } })
    expect(w.find('.form-error').text()).toBe('valuation.requiredField')
  })

  it('shows submit button', () => {
    expect(factory().find('.submit-btn').text()).toBe('valuation.calculate')
  })

  it('shows calculating text when loading', () => {
    const w = factory({ loading: true })
    expect(w.find('.submit-btn').text()).toContain('valuation.calculating')
  })

  it('disables submit when loading', () => {
    const w = factory({ loading: true })
    expect(w.find('.submit-btn').attributes('disabled')).toBeDefined()
  })

  it('shows spinner when loading', () => {
    const w = factory({ loading: true })
    expect(w.find('.spinner').exists()).toBe(true)
  })

  it('emits submit on form submit', async () => {
    const w = factory()
    await w.find('.valuation-form').trigger('submit')
    expect(w.emitted('submit')).toBeTruthy()
  })
})
