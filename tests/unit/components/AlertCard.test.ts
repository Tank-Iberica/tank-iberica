/**
 * Tests for app/components/perfil/alertas/AlertCard.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import AlertCard from '../../../app/components/perfil/alertas/AlertCard.vue'

describe('AlertCard', () => {
  const baseAlert = {
    id: 'alert-1',
    user_id: 'user-1',
    filters: {},
    frequency: 'daily',
    active: true,
    created_at: '2026-01-15T10:00:00Z',
    last_sent_at: null,
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AlertCard, {
      props: {
        alert: baseAlert,
        filterSummary: 'Camiones > 10t, Madrid',
        frequencyLabel: 'Diario',
        ...overrides,
      },
      global: { mocks: { $t: (key: string) => key } },
    })

  it('renders alert-card container', () => {
    const w = factory()
    expect(w.find('.alert-card').exists()).toBe(true)
  })

  it('shows filter summary', () => {
    const w = factory()
    expect(w.find('.alert-filters').text()).toBe('Camiones > 10t, Madrid')
  })

  it('shows frequency label', () => {
    const w = factory()
    expect(w.find('.alert-frequency').text()).toBe('Diario')
  })

  it('shows formatted date', () => {
    const w = factory()
    expect(w.find('.alert-date').text()).toBeTruthy()
  })

  it('has active toggle checked when alert is active', () => {
    const w = factory()
    const checkbox = w.find('.toggle__input')
    expect((checkbox.element as HTMLInputElement).checked).toBe(true)
  })

  it('has active toggle unchecked when alert is inactive', () => {
    const w = factory({ alert: { ...baseAlert, active: false } })
    const checkbox = w.find('.toggle__input')
    expect((checkbox.element as HTMLInputElement).checked).toBe(false)
  })

  it('adds inactive class when alert is not active', () => {
    const w = factory({ alert: { ...baseAlert, active: false } })
    expect(w.find('.alert-card--inactive').exists()).toBe(true)
  })

  it('does not add inactive class when alert is active', () => {
    const w = factory()
    expect(w.find('.alert-card--inactive').exists()).toBe(false)
  })

  it('emits toggle-active on checkbox change', async () => {
    const w = factory()
    await w.find('.toggle__input').trigger('change')
    expect(w.emitted('toggle-active')).toBeTruthy()
  })

  it('emits edit on edit button click', async () => {
    const w = factory()
    await w.find('.btn-edit').trigger('click')
    expect(w.emitted('edit')).toBeTruthy()
  })

  it('emits delete on delete button click', async () => {
    const w = factory()
    await w.find('.btn-delete').trigger('click')
    expect(w.emitted('delete')).toBeTruthy()
  })

  it('edit button has aria-label', () => {
    const w = factory()
    expect(w.find('.btn-edit').attributes('aria-label')).toBe('common.edit')
  })

  it('delete button has aria-label', () => {
    const w = factory()
    expect(w.find('.btn-delete').attributes('aria-label')).toBe('common.delete')
  })
})
