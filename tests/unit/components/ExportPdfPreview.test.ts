/**
 * Tests for app/components/dashboard/herramientas/exportar/ExportPdfPreview.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ExportPdfPreview from '../../../app/components/dashboard/herramientas/exportar/ExportPdfPreview.vue'

describe('ExportPdfPreview', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ExportPdfPreview, {
      props: {
        vehicleCount: 5,
        companyName: 'Transportes León SL',
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders card', () => {
    expect(factory().find('.options-card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h2').text()).toBeTruthy()
  })

  it('shows company name', () => {
    expect(factory().html()).toContain('Transportes León SL')
  })

  it('shows fallback when no company name', () => {
    const w = factory({ companyName: '' })
    expect(w.html()).toContain('--')
  })

  it('shows page count', () => {
    // vehicleCount + 1 = 6
    expect(factory().html()).toContain('6')
  })

  it('renders 4 info items', () => {
    expect(factory().findAll('.pdf-info-item')).toHaveLength(4)
  })
})
