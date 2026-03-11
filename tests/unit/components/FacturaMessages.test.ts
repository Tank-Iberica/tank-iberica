/**
 * Tests for app/components/dashboard/herramientas/factura/FacturaMessages.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import FacturaMessages from '../../../app/components/dashboard/herramientas/factura/FacturaMessages.vue'

describe('FacturaMessages', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(FacturaMessages, {
      props: { errorMessage: null, successMessage: null, ...overrides },
    })

  it('renders nothing when no messages', () => {
    const w = factory()
    expect(w.find('.message--error').exists()).toBe(false)
    expect(w.find('.message--success').exists()).toBe(false)
  })

  it('shows error message', () => {
    const w = factory({ errorMessage: 'Something failed' })
    expect(w.find('.message--error').text()).toContain('Something failed')
  })

  it('shows success message', () => {
    const w = factory({ successMessage: 'Saved!' })
    expect(w.find('.message--success').text()).toContain('Saved!')
  })

  it('shows both messages at once', () => {
    const w = factory({ errorMessage: 'Err', successMessage: 'OK' })
    expect(w.find('.message--error').exists()).toBe(true)
    expect(w.find('.message--success').exists()).toBe(true)
  })

  it('emits dismiss-error on close click', async () => {
    const w = factory({ errorMessage: 'Err' })
    await w.find('.message--error .message__close').trigger('click')
    expect(w.emitted('dismiss-error')).toBeTruthy()
  })

  it('emits dismiss-success on close click', async () => {
    const w = factory({ successMessage: 'OK' })
    await w.find('.message--success .message__close').trigger('click')
    expect(w.emitted('dismiss-success')).toBeTruthy()
  })
})
