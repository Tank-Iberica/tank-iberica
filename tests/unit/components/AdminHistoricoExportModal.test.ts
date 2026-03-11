/**
 * Tests for app/components/admin/historico/HistoricoExportModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import HistoricoExportModal from '../../../app/components/admin/historico/HistoricoExportModal.vue'

describe('AdminHistoricoExportModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(HistoricoExportModal, {
      props: {
        visible: true,
        exportFormat: 'excel',
        exportDataScope: 'filtered',
        ...overrides,
      },
      global: {
        stubs: { Teleport: true },
      },
    })

  it('renders modal when visible', () => {
    expect(factory().find('.modal-bg').exists()).toBe(true)
  })

  it('does not render when not visible', () => {
    const w = factory({ visible: false })
    expect(w.find('.modal-bg').exists()).toBe(false)
  })

  it('shows modal header', () => {
    expect(factory().find('.modal-head').text()).toContain('admin.historico.exportTitle')
  })

  it('has format radio buttons', () => {
    const radios = factory().findAll('input[type="radio"]')
    expect(radios.length).toBe(4) // 2 format + 2 scope
  })

  it('checks excel by default', () => {
    const radios = factory().findAll('input[type="radio"]')
    expect((radios[0].element as HTMLInputElement).checked).toBe(true)
  })

  it('checks pdf when exportFormat=pdf', () => {
    const w = factory({ exportFormat: 'pdf' })
    const radios = w.findAll('input[type="radio"]')
    expect((radios[1].element as HTMLInputElement).checked).toBe(true)
  })

  it('checks filtered data scope by default', () => {
    const radios = factory().findAll('input[type="radio"]')
    expect((radios[2].element as HTMLInputElement).checked).toBe(true)
  })

  it('emits update:exportFormat on format change', async () => {
    const w = factory()
    const radios = w.findAll('input[type="radio"]')
    await radios[1].trigger('change')
    expect(w.emitted('update:exportFormat')).toBeTruthy()
    expect(w.emitted('update:exportFormat')![0]).toEqual(['pdf'])
  })

  it('emits update:exportDataScope on scope change', async () => {
    const w = factory()
    const radios = w.findAll('input[type="radio"]')
    await radios[3].trigger('change')
    expect(w.emitted('update:exportDataScope')).toBeTruthy()
    expect(w.emitted('update:exportDataScope')![0]).toEqual(['all'])
  })

  it('emits close on cancel button', async () => {
    const w = factory()
    const btns = w.findAll('.btn')
    await btns[0].trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits confirm on export button', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('confirm')).toBeTruthy()
  })

  it('emits close on X button', async () => {
    const w = factory()
    await w.find('.modal-head button').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
