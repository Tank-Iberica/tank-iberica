/**
 * Tests for app/components/dashboard/historico/HistoricoExportModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import HistoricoExportModal from '../../../app/components/dashboard/historico/HistoricoExportModal.vue'

describe('DashboardHistoricoExportModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(HistoricoExportModal, {
      props: {
        show: true,
        exportScope: 'filtered',
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: { Teleport: true },
      },
    })

  it('renders when show=true', () => {
    expect(factory().find('.modal-bg').exists()).toBe(true)
  })

  it('hides when show=false', () => {
    expect(factory({ show: false }).find('.modal-bg').exists()).toBe(false)
  })

  it('shows title', () => {
    expect(factory().find('.modal-head').text()).toContain('dashboard.historico.exportModal.title')
  })

  it('has 2 radio buttons', () => {
    expect(factory().findAll('input[type="radio"]')).toHaveLength(2)
  })

  it('checks filtered by default', () => {
    const radios = factory().findAll('input[type="radio"]')
    expect((radios[0].element as HTMLInputElement).checked).toBe(true)
  })

  it('checks all when exportScope=all', () => {
    const w = factory({ exportScope: 'all' })
    const radios = w.findAll('input[type="radio"]')
    expect((radios[1].element as HTMLInputElement).checked).toBe(true)
  })

  it('emits update:exportScope on radio change', async () => {
    const w = factory()
    const radios = w.findAll('input[type="radio"]')
    await radios[1].trigger('change')
    expect(w.emitted('update:exportScope')).toBeTruthy()
  })

  it('emits close on cancel click', async () => {
    const w = factory()
    const btns = w.findAll('.btn')
    await btns[0].trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits confirm on export click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('confirm')).toBeTruthy()
  })

  it('emits close on X click', async () => {
    const w = factory()
    await w.find('.modal-head button').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
