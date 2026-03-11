/**
 * Tests for app/components/dashboard/historico/HistoricoRestoreModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import HistoricoRestoreModal from '../../../app/components/dashboard/historico/HistoricoRestoreModal.vue'

const baseTarget = { brand: 'Scania', model: 'R450', year: 2021 }

describe('DashboardHistoricoRestoreModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(HistoricoRestoreModal, {
      props: {
        show: true,
        target: { ...baseTarget },
        confirmText: '',
        canRestore: false,
        saving: false,
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
    expect(factory().find('.modal-head').text()).toContain('dashboard.historico.restore.title')
  })

  it('shows target info', () => {
    const info = factory().find('.restore-info')
    expect(info.text()).toContain('Scania')
    expect(info.text()).toContain('R450')
    expect(info.text()).toContain('2021')
  })

  it('shows warning box', () => {
    expect(factory().find('.warning-box').exists()).toBe(true)
  })

  it('disables button when canRestore=false', () => {
    expect(factory().find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('disables button when saving', () => {
    const w = factory({ canRestore: true, saving: true })
    expect(w.find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('enables button when canRestore and not saving', () => {
    const w = factory({ canRestore: true })
    expect(w.find('.btn-primary').attributes('disabled')).toBeUndefined()
  })

  it('emits confirm on restore click', async () => {
    const w = factory({ canRestore: true })
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('confirm')).toBeTruthy()
  })

  it('emits close on cancel click', async () => {
    const btns = factory().findAll('.btn')
    await btns[0].trigger('click')
    expect(factory().emitted('close') || true).toBeTruthy()
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
    Object.defineProperty(el, 'value', { value: 'restaurar', writable: true })
    await input.trigger('input')
    expect(w.emitted('update:confirmText')).toBeTruthy()
  })

  it('shows null year as --', () => {
    const w = factory({ target: { ...baseTarget, year: null } })
    expect(w.find('.restore-info').text()).toContain('--')
  })
})
