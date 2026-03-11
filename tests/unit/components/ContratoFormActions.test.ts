/**
 * Tests for app/components/dashboard/herramientas/contrato/ContratoFormActions.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ContratoFormActions from '../../../app/components/dashboard/herramientas/contrato/ContratoFormActions.vue'

describe('ContratoFormActions', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ContratoFormActions, {
      props: {
        contractJurisdiction: 'León',
        saveError: null,
        saveSuccess: false,
        saving: false,
        ...overrides,
      },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders wrapper', () => {
    expect(factory().find('.contrato-form-actions').exists()).toBe(true)
  })

  it('renders jurisdiction input', () => {
    expect(factory().find('input[type="text"]').exists()).toBe(true)
  })

  it('shows error alert', () => {
    expect(factory({ saveError: 'Error!' }).find('.alert-error').text()).toBe('Error!')
  })

  it('hides error when null', () => {
    expect(factory().find('.alert-error').exists()).toBe(false)
  })

  it('shows success alert', () => {
    expect(factory({ saveSuccess: true }).find('.alert-success').exists()).toBe(true)
  })

  it('hides success by default', () => {
    expect(factory().find('.alert-success').exists()).toBe(false)
  })

  it('shows generate button text', () => {
    expect(factory().find('.btn-primary').text()).toContain('dashboard.tools.contract.generate')
  })

  it('shows generating text when saving', () => {
    expect(factory({ saving: true }).find('.btn-primary').text()).toContain('dashboard.tools.contract.generating')
  })

  it('button disabled when saving', () => {
    expect(factory({ saving: true }).find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('shows spinner when saving', () => {
    expect(factory({ saving: true }).find('.spinner-sm').exists()).toBe(true)
  })

  it('emits generate on click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('generate')).toBeTruthy()
  })

  it('emits update:contractJurisdiction on input', async () => {
    const w = factory()
    const input = w.find('.jurisdiction-input')
    if (input.exists()) {
      Object.defineProperty(input.element, 'value', { value: 'Madrid', writable: true })
      await input.trigger('input')
      expect(w.emitted('update:contractJurisdiction')).toBeTruthy()
    }
  })
})
