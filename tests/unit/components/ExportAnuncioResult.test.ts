/**
 * Tests for app/components/dashboard/herramientas/exportar-anuncio/ExportAnuncioResult.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ExportAnuncioResult from '../../../app/components/dashboard/herramientas/exportar-anuncio/ExportAnuncioResult.vue'

describe('ExportAnuncioResult', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ExportAnuncioResult, {
      props: {
        generatedText: 'Camión Scania R450 en venta...',
        charCount: 30,
        maxChars: 500,
        charCountClass: 'count-ok',
        copySuccess: false,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders card section', () => {
    expect(factory().find('.card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.card-title').text()).toBeTruthy()
  })

  it('shows textarea with generated text', () => {
    const ta = factory().find('.generated-textarea')
    expect(ta.exists()).toBe(true)
    expect((ta.element as HTMLTextAreaElement).value).toBe('Camión Scania R450 en venta...')
  })

  it('shows char counter', () => {
    expect(factory().find('.char-counter').text()).toBe('30/500')
  })

  it('applies char count class', () => {
    expect(factory().find('.char-counter').classes()).toContain('count-ok')
  })

  it('shows copy button', () => {
    expect(factory().find('.btn-copy').exists()).toBe(true)
  })

  it('shows success state on copy button', () => {
    const w = factory({ copySuccess: true })
    expect(w.find('.btn-copy').classes()).toContain('success')
  })

  it('emits copy on copy click', async () => {
    const w = factory()
    await w.find('.btn-copy').trigger('click')
    expect(w.emitted('copy')).toBeTruthy()
  })

  it('emits update:text on textarea input', async () => {
    const w = factory()
    await w.find('.generated-textarea').setValue('new text')
    expect(w.emitted('update:text')).toBeTruthy()
  })
})
