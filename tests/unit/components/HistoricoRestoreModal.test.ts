/**
 * Tests for app/components/admin/historico/HistoricoRestoreModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import RestoreModal from '../../../app/components/admin/historico/HistoricoRestoreModal.vue'

const baseTarget = { id: 'h1', brand: 'Volvo', model: 'FH16', year: 2021 }

describe('HistoricoRestoreModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(RestoreModal, {
      props: {
        visible: true,
        target: { ...baseTarget },
        confirmText: '',
        canRestore: false,
        saving: false,
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
    expect(factory().find('.modal-head span').text()).toContain('Restaurar')
  })

  it('shows vehicle info', () => {
    const info = factory().find('.restore-info')
    expect(info.text()).toContain('Volvo')
    expect(info.text()).toContain('FH16')
    expect(info.text()).toContain('2021')
  })

  it('shows warning', () => {
    expect(factory().find('.warning').exists()).toBe(true)
  })

  it('shows confirm input', () => {
    const input = factory().find('input[type="text"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toBe('Restaurar')
  })

  it('disables restore when canRestore false', () => {
    expect(factory().find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('disables restore when saving', () => {
    const w = factory({ canRestore: true, saving: true })
    expect(w.find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('enables restore when canRestore and not saving', () => {
    const w = factory({ canRestore: true, saving: false })
    expect(w.find('.btn-primary').attributes('disabled')).toBeUndefined()
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

  it('emits confirm on restore click', async () => {
    const w = factory({ canRestore: true })
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('confirm')).toBeTruthy()
  })

  it('emits update:confirmText on input', async () => {
    const w = factory()
    const input = w.find('input[type="text"]')
    Object.defineProperty(input.element, 'value', { value: 'restaurar', writable: true })
    await input.trigger('input')
    expect(w.emitted('update:confirmText')).toBeTruthy()
  })
})
