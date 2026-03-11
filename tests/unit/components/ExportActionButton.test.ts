/**
 * Tests for app/components/dashboard/herramientas/exportar/ExportActionButton.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ExportActionButton from '../../../app/components/dashboard/herramientas/exportar/ExportActionButton.vue'

describe('ExportActionButton', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ExportActionButton, {
      props: {
        exporting: false,
        vehicleCount: 10,
        exportFormat: 'csv',
        ...overrides,
      },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders button', () => {
    expect(factory().find('.btn-export').exists()).toBe(true)
  })

  it('shows CSV text for csv format', () => {
    expect(factory().text()).toBe('dashboard.tools.export.downloadCSV')
  })

  it('shows PDF text for pdf format', () => {
    expect(factory({ exportFormat: 'pdf' }).text()).toBe('dashboard.tools.export.downloadPDF')
  })

  it('shows spinner when exporting', () => {
    expect(factory({ exporting: true }).find('.spinner-sm').exists()).toBe(true)
  })

  it('button disabled when exporting', () => {
    expect(factory({ exporting: true }).find('button').attributes('disabled')).toBeDefined()
  })

  it('button disabled when no vehicles', () => {
    expect(factory({ vehicleCount: 0 }).find('button').attributes('disabled')).toBeDefined()
  })

  it('button enabled with vehicles', () => {
    expect(factory().find('button').attributes('disabled')).toBeUndefined()
  })

  it('emits export on click', async () => {
    const w = factory()
    await w.find('button').trigger('click')
    expect(w.emitted('export')).toBeTruthy()
  })
})
