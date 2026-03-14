/**
 * Tests for app/components/admin/historico/HistoricoRestoreModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import HistoricoRestoreModal from '../../../app/components/admin/historico/HistoricoRestoreModal.vue'

const baseTarget = { brand: 'Volvo', model: 'FH 500', year: 2022 }

describe('AdminHistoricoRestoreModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(HistoricoRestoreModal, {
      props: {
        visible: true,
        target: { ...baseTarget },
        confirmText: '',
        canRestore: false,
        saving: false,
        ...overrides,
      },
      global: {
        stubs: { Teleport: true },
        mocks: {
          $t: (key: string) => {
            const map: Record<string, string> = {
              'vertical.itemNameCapitalized': 'Vehículo',
              'vertical.itemName': 'vehículo',
            }
            return map[key] || key
          },
        },
      },
    })

  it('renders when visible', () => {
    expect(factory().find('.modal-bg').exists()).toBe(true)
  })

  it('hides when not visible', () => {
    expect(factory({ visible: false }).find('.modal-bg').exists()).toBe(false)
  })

  it('shows header title', () => {
    expect(factory().find('.modal-head').text()).toContain('Restaurar Vehículo')
  })

  it('shows target vehicle info', () => {
    const info = factory().find('.restore-info')
    expect(info.text()).toContain('Volvo')
    expect(info.text()).toContain('FH 500')
    expect(info.text()).toContain('2022')
  })

  it('shows warning message', () => {
    expect(factory().find('.warning').text()).toContain('borrador')
  })

  it('disables restore button when canRestore=false', () => {
    expect(factory().find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('disables restore button when saving', () => {
    const w = factory({ canRestore: true, saving: true })
    expect(w.find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('enables restore button when canRestore and not saving', () => {
    const w = factory({ canRestore: true })
    expect(w.find('.btn-primary').attributes('disabled')).toBeUndefined()
  })

  it('emits confirm on restore click', async () => {
    const w = factory({ canRestore: true })
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('confirm')).toBeTruthy()
  })

  it('emits close on cancel click', async () => {
    const w = factory()
    const btns = w.findAll('.btn')
    await btns[0].trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on X click', async () => {
    const w = factory()
    await w.find('.modal-head button').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits update:confirmText on input', async () => {
    const w = factory()
    const input = w.find('.field input')
    const el = input.element as HTMLInputElement
    Object.defineProperty(el, 'value', { value: 'Restaurar', writable: true })
    await input.trigger('input')
    expect(w.emitted('update:confirmText')).toBeTruthy()
  })
})
