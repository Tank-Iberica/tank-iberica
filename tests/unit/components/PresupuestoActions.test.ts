/**
 * Tests for app/components/dashboard/herramientas/presupuesto/PresupuestoActions.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import PresupuestoActions from '../../../app/components/dashboard/herramientas/presupuesto/PresupuestoActions.vue'

describe('PresupuestoActions', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(PresupuestoActions, {
      props: { generatingPdf: false, saving: false, ...overrides },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders actions bar', () => {
    expect(factory().find('.actions-bar').exists()).toBe(true)
  })

  it('renders 2 buttons', () => {
    expect(factory().findAll('button')).toHaveLength(2)
  })

  it('shows generate PDF text', () => {
    expect(factory().find('.btn-primary').text()).toBe('dashboard.quote.generatePdf')
  })

  it('shows generating text when generatingPdf', () => {
    expect(factory({ generatingPdf: true }).find('.btn-primary').text()).toBe('dashboard.quote.generating')
  })

  it('disables primary when generatingPdf', () => {
    expect(factory({ generatingPdf: true }).find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('shows save quote text', () => {
    expect(factory().find('.btn-secondary').text()).toBe('dashboard.quote.saveQuote')
  })

  it('shows saving text when saving', () => {
    expect(factory({ saving: true }).find('.btn-secondary').text()).toBe('dashboard.quote.saving')
  })

  it('emits generate-pdf on click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('generate-pdf')).toBeTruthy()
  })

  it('emits save-quote on click', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('save-quote')).toBeTruthy()
  })
})
