/**
 * Tests for app/components/admin/historico/HistoricoHeader.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import HistoricoHeader from '../../../app/components/admin/historico/HistoricoHeader.vue'

describe('HistoricoHeader', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(HistoricoHeader, {
      props: {
        isFullscreen: false,
        ...overrides,
      },
    })

  it('renders header', () => {
    expect(factory().find('.page-header').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h1').text()).toContain('Histórico de Ventas')
  })

  it('shows fullscreen toggle button', () => {
    expect(factory().find('.btn-icon-only').exists()).toBe(true)
  })

  it('shows export button', () => {
    const btns = factory().findAll('.btn')
    const exportBtn = btns.find(b => b.text().includes('Exportar'))
    expect(exportBtn).toBeTruthy()
  })

  it('emits toggle-fullscreen on fullscreen click', async () => {
    const w = factory()
    await w.find('.btn-icon-only').trigger('click')
    expect(w.emitted('toggle-fullscreen')).toHaveLength(1)
  })

  it('emits open-export on export click', async () => {
    const w = factory()
    const btns = w.findAll('.btn')
    const exportBtn = btns.find(b => b.text().includes('Exportar'))!
    await exportBtn.trigger('click')
    expect(w.emitted('open-export')).toHaveLength(1)
  })
})
