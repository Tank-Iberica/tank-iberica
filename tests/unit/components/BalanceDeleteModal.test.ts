/**
 * Tests for app/components/admin/balance/DeleteModal.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminBalance', () => ({
  BALANCE_REASONS: {
    venta: 'Venta directa',
    comision: 'Comisión',
    otros: 'Otros',
  },
}))
vi.mock('~/composables/admin/useAdminBalanceUI', () => ({
  fmt: (n: number) => `€${n?.toFixed(2) ?? '0.00'}`,
}))

import BalanceDeleteModal from '../../../app/components/admin/balance/DeleteModal.vue'

const baseTarget = { id: 'tx-1', razon: 'venta', importe: 1500 }

describe('BalanceDeleteModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(BalanceDeleteModal, {
      props: {
        show: true,
        deleteTarget: { ...baseTarget },
        deleteConfirm: '',
        canDelete: false,
        saving: false,
        ...overrides,
      },
      global: { stubs: { Teleport: true } },
    })

  it('renders when show=true', () => {
    expect(factory().find('.modal-bg').exists()).toBe(true)
  })

  it('hides when show=false', () => {
    expect(factory({ show: false }).find('.modal-bg').exists()).toBe(false)
  })

  it('shows header title', () => {
    expect(factory().find('.modal-head').text()).toContain('admin.balance.deleteTransaction')
  })

  it('shows delete target info', () => {
    const w = factory()
    expect(w.find('.delete-info').text()).toContain('Venta directa')
  })

  it('disables button when canDelete=false', () => {
    expect(factory().find('.btn-danger').attributes('disabled')).toBeDefined()
  })

  it('disables button when saving', () => {
    const w = factory({ canDelete: true, saving: true })
    expect(w.find('.btn-danger').attributes('disabled')).toBeDefined()
  })

  it('enables button when canDelete and not saving', () => {
    const w = factory({ canDelete: true })
    expect(w.find('.btn-danger').attributes('disabled')).toBeUndefined()
  })

  it('emits confirmDelete on delete click', async () => {
    const w = factory({ canDelete: true })
    await w.find('.btn-danger').trigger('click')
    expect(w.emitted('confirmDelete')).toBeTruthy()
  })

  it('emits close on cancel click', async () => {
    const w = factory()
    await w.find('.btn').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on X click', async () => {
    const w = factory()
    await w.find('.modal-head button').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on backdrop click', async () => {
    const w = factory()
    await w.find('.modal-bg').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits update:deleteConfirm on input', async () => {
    const w = factory()
    const input = w.find('.field input')
    const el = input.element as HTMLInputElement
    Object.defineProperty(el, 'value', { value: 'Borrar', writable: true })
    await input.trigger('input')
    expect(w.emitted('update:deleteConfirm')).toBeTruthy()
  })
})
