/**
 * Tests for app/components/dashboard/herramientas/factura/FacturaActions.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'

beforeAll(() => {
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
})

import FacturaActions from '../../../app/components/dashboard/herramientas/factura/FacturaActions.vue'

describe('FacturaActions', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(FacturaActions, {
      props: { saving: false, ...overrides },
    })

  it('renders actions container', () => {
    expect(factory().find('.invoice-actions').exists()).toBe(true)
  })

  it('renders 3 buttons', () => {
    expect(factory().findAll('button')).toHaveLength(3)
  })

  it('shows generate PDF text', () => {
    expect(factory().find('.btn--primary').text()).toContain('dashboard.tools.invoice.generatePDF')
  })

  it('shows save draft text', () => {
    expect(factory().find('.btn--secondary').text()).toBe('dashboard.tools.invoice.saveDraft')
  })

  it('shows reset text', () => {
    expect(factory().find('.btn--ghost').text()).toBe('dashboard.tools.invoice.reset')
  })

  it('disables primary when saving', () => {
    expect(factory({ saving: true }).find('.btn--primary').attributes('disabled')).toBeDefined()
  })

  it('disables secondary when saving', () => {
    expect(factory({ saving: true }).find('.btn--secondary').attributes('disabled')).toBeDefined()
  })

  it('reset is never disabled', () => {
    expect(factory({ saving: true }).find('.btn--ghost').attributes('disabled')).toBeUndefined()
  })

  it('emits generate-pdf on primary click', async () => {
    const w = factory()
    await w.find('.btn--primary').trigger('click')
    expect(w.emitted('generate-pdf')).toBeTruthy()
  })

  it('emits save-draft on secondary click', async () => {
    const w = factory()
    await w.find('.btn--secondary').trigger('click')
    expect(w.emitted('save-draft')).toBeTruthy()
  })

  it('emits reset on ghost click', async () => {
    const w = factory()
    await w.find('.btn--ghost').trigger('click')
    expect(w.emitted('reset')).toBeTruthy()
  })
})
