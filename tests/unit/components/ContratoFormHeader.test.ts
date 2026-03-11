/**
 * Tests for app/components/dashboard/herramientas/contrato/ContratoFormHeader.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ContratoFormHeader from '../../../app/components/dashboard/herramientas/contrato/ContratoFormHeader.vue'

describe('ContratoFormHeader', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ContratoFormHeader, {
      props: {
        contractType: 'arrendamiento',
        contractDate: '2026-03-01',
        contractLocation: 'León',
        ...overrides,
      },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders wrapper', () => {
    expect(factory().find('.contrato-form-header').exists()).toBe(true)
  })

  it('renders 2 radio cards', () => {
    expect(factory().findAll('.radio-card')).toHaveLength(2)
  })

  it('arrendamiento radio is active', () => {
    expect(factory().findAll('.radio-card')[0].classes()).toContain('active')
  })

  it('compraventa radio is active when selected', () => {
    const w = factory({ contractType: 'compraventa' })
    expect(w.findAll('.radio-card')[1].classes()).toContain('active')
  })

  it('emits update:contractType on radio change', async () => {
    const w = factory()
    const radio = w.findAll('input[type="radio"]')[1]
    Object.defineProperty(radio.element, 'value', { value: 'compraventa', writable: true })
    await radio.trigger('change')
    expect(w.emitted('update:contractType')).toBeTruthy()
    expect(w.emitted('update:contractType')![0]).toEqual(['compraventa'])
  })

  it('renders date input', () => {
    expect(factory().find('input[type="date"]').exists()).toBe(true)
  })

  it('renders location input', () => {
    expect(factory().find('input[type="text"]').exists()).toBe(true)
  })
})
