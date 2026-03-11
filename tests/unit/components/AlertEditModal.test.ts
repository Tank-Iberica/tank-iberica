/**
 * Tests for app/components/perfil/alertas/AlertEditModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AlertEditModal from '../../../app/components/perfil/alertas/AlertEditModal.vue'

describe('AlertEditModal', () => {
  const targetAlert = {
    id: 'alert-1',
    user_id: 'u-1',
    name: 'Volvo alerts',
    filters: { brand: 'Volvo', price_min: 30000, price_max: 80000 },
    frequency: 'daily' as const,
    active: true,
    created_at: '2026-01-01',
  }

  const editForm = {
    frequency: 'daily' as const,
    filters: {
      brand: 'Volvo',
      price_min: 30000,
      price_max: 80000,
      year_min: null,
      year_max: null,
    },
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AlertEditModal, {
      props: {
        visible: true,
        targetAlert,
        editForm,
        ...overrides,
      },
      global: {
        stubs: { Teleport: true },
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders modal when visible and targetAlert present', () => {
    expect(factory().find('.modal').exists()).toBe(true)
  })

  it('hides modal when visible is false', () => {
    expect(factory({ visible: false }).find('.modal').exists()).toBe(false)
  })

  it('hides modal when targetAlert is null', () => {
    expect(factory({ targetAlert: null }).find('.modal').exists()).toBe(false)
  })

  it('shows title', () => {
    expect(factory().find('.modal-header h3').exists()).toBe(true)
  })

  it('renders frequency radio buttons', () => {
    expect(factory().findAll('.radio-label')).toHaveLength(3)
  })

  it('renders radio inputs for instant, daily, weekly', () => {
    const radios = factory().findAll('.radio-label input[type="radio"]')
    expect(radios).toHaveLength(3)
    expect(radios[0].attributes('value')).toBe('instant')
    expect(radios[1].attributes('value')).toBe('daily')
    expect(radios[2].attributes('value')).toBe('weekly')
  })

  it('renders brand input', () => {
    const inputs = factory().findAll('.form-input')
    expect(inputs.length).toBeGreaterThanOrEqual(1)
  })

  it('renders price min/max inputs', () => {
    const numberInputs = factory().findAll('input[type="number"]')
    expect(numberInputs.length).toBeGreaterThanOrEqual(2)
  })

  it('renders year min/max inputs', () => {
    const numberInputs = factory().findAll('input[type="number"]')
    expect(numberInputs.length).toBeGreaterThanOrEqual(4)
  })

  it('shows 2 form-row sections', () => {
    expect(factory().findAll('.form-row')).toHaveLength(2)
  })

  it('shows footer buttons', () => {
    expect(factory().find('.btn-primary').exists()).toBe(true)
    expect(factory().find('.btn-secondary').exists()).toBe(true)
  })

  it('emits close on close button click', async () => {
    const w = factory()
    await w.find('.modal-close').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits save on primary click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('save')).toBeTruthy()
  })

  it('emits close on secondary click', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
