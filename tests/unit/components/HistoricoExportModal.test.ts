/**
 * Tests for app/components/admin/historico/HistoricoExportModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ExportModal from '../../../app/components/admin/historico/HistoricoExportModal.vue'

describe('HistoricoExportModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ExportModal, {
      props: {
        visible: true,
        exportFormat: 'excel' as const,
        exportDataScope: 'filtered' as const,
        ...overrides,
      },
      global: { stubs: { Teleport: true } },
    })

  it('hides when not visible', () => {
    expect(factory({ visible: false }).find('.modal-bg').exists()).toBe(false)
  })

  it('shows when visible', () => {
    expect(factory().find('.modal-bg').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.modal-head span').text()).toContain('admin.historico.exportTitle')
  })

  it('shows format radio buttons', () => {
    const radios = factory().findAll('input[type="radio"]')
    expect(radios.length).toBeGreaterThanOrEqual(4)
  })

  it('checks excel format by default', () => {
    const excelRadio = factory().find('input[value="excel"]')
    expect(excelRadio.attributes('checked')).toBeDefined()
  })

  it('checks filtered scope by default', () => {
    const filteredRadio = factory().find('input[value="filtered"]')
    expect(filteredRadio.attributes('checked')).toBeDefined()
  })

  it('emits update:exportFormat on format change', async () => {
    const w = factory()
    await w.find('input[value="pdf"]').trigger('change')
    expect(w.emitted('update:exportFormat')?.[0]).toEqual(['pdf'])
  })

  it('emits update:exportDataScope on scope change', async () => {
    const w = factory()
    await w.find('input[value="all"]').trigger('change')
    expect(w.emitted('update:exportDataScope')?.[0]).toEqual(['all'])
  })

  it('emits close on overlay click', async () => {
    const w = factory()
    await w.find('.modal-bg').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on X click', async () => {
    const w = factory()
    await w.find('.modal-head button').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on cancel click', async () => {
    const w = factory()
    const btns = w.findAll('.btn')
    const cancelBtn = btns.find(b => !b.classes().includes('btn-primary'))
    await cancelBtn!.trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits confirm on export click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('confirm')).toBeTruthy()
  })

  it('emits close on overlay click', async () => {
    const w = factory()
    await w.find('.modal-bg').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
