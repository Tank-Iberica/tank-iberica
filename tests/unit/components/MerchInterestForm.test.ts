/**
 * Tests for app/components/dashboard/herramientas/merchandising/MerchInterestForm.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/dashboard/useDashboardMerchandising', () => ({
  products: [
    { id: 'tarjetas', name_es: 'Tarjetas', name_en: 'Cards', description_es: 'd', description_en: 'd', unit_es: 'u', unit_en: 'u', icon: '🪪', color: '#dbeafe' },
    { id: 'imanes', name_es: 'Imanes', name_en: 'Magnets', description_es: 'd', description_en: 'd', unit_es: 'u', unit_en: 'u', icon: '🚐', color: '#dcfce7' },
  ],
}))

import MerchInterestForm from '../../../app/components/dashboard/herramientas/merchandising/MerchInterestForm.vue'

const baseForm = {
  product: 'tarjetas',
  quantity: '500',
  email: 'test@test.com',
  notes: 'Urgente',
}

describe('MerchInterestForm', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(MerchInterestForm, {
      props: {
        submitted: false,
        submitting: false,
        submitError: null,
        form: { ...baseForm },
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders form section', () => {
    expect(factory().find('.form-section').exists()).toBe(true)
  })

  it('shows section title', () => {
    expect(factory().find('.section-title').text()).toBe('dashboard.tools.merchandising.formTitle')
  })

  it('shows form when not submitted', () => {
    expect(factory().find('.interest-form').exists()).toBe(true)
  })

  it('shows success when submitted', () => {
    const w = factory({ submitted: true })
    expect(w.find('.alert-success').exists()).toBe(true)
    expect(w.find('.interest-form').exists()).toBe(false)
  })

  it('emits reset on success button click', async () => {
    const w = factory({ submitted: true })
    await w.find('.btn-reset').trigger('click')
    expect(w.emitted('reset')).toBeTruthy()
  })

  it('renders product select with 2 options + placeholder', () => {
    const options = factory().find('#merch-product').findAll('option')
    expect(options).toHaveLength(3)
  })

  it('renders quantity input', () => {
    expect((factory().find('#merch-quantity').element as HTMLInputElement).value).toBe('500')
  })

  it('renders email input', () => {
    expect((factory().find('#merch-email').element as HTMLInputElement).value).toBe('test@test.com')
  })

  it('renders notes textarea', () => {
    expect((factory().find('#merch-notes').element as HTMLTextAreaElement).value).toBe('Urgente')
  })

  it('shows error message', () => {
    const w = factory({ submitError: 'Network error' })
    expect(w.find('.alert-error').text()).toBe('Network error')
  })

  it('hides error when null', () => {
    expect(factory().find('.alert-error').exists()).toBe(false)
  })

  it('disables submit when submitting', () => {
    expect(factory({ submitting: true }).find('.btn-submit').attributes('disabled')).toBeDefined()
  })

  it('shows spinner when submitting', () => {
    expect(factory({ submitting: true }).find('.spinner-sm').exists()).toBe(true)
  })

  it('shows saving text when submitting', () => {
    expect(factory({ submitting: true }).find('.btn-submit').text()).toContain('common.saving')
  })

  it('shows submit text when not submitting', () => {
    expect(factory().find('.btn-submit').text()).toContain('dashboard.tools.merchandising.submitBtn')
  })

  it('emits submit on form submit', async () => {
    const w = factory()
    await w.find('.interest-form').trigger('submit')
    expect(w.emitted('submit')).toBeTruthy()
  })

  it('shows form note', () => {
    expect(factory().find('.form-note').text()).toBe('dashboard.tools.merchandising.formNote')
  })
})
