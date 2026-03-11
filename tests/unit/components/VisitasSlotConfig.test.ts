/**
 * Tests for app/components/dashboard/herramientas/visitas/VisitasSlotConfig.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/dashboard/useDashboardVisitas', () => ({
  DAYS_KEYS: [
    'days.monday',
    'days.tuesday',
    'days.wednesday',
    'days.thursday',
    'days.friday',
    'days.saturday',
    'days.sunday',
  ],
}))

import VisitasSlotConfig from '../../../app/components/dashboard/herramientas/visitas/VisitasSlotConfig.vue'

const baseSlot = {
  id: 'slot-1',
  day_of_week: 1,
  start_time: '09:00',
  end_time: '13:00',
  max_visitors: 5,
}

const baseFormData = {
  day_of_week: 1,
  start_time: '10:00',
  end_time: '14:00',
  max_visitors: 3,
}

describe('VisitasSlotConfig', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(VisitasSlotConfig, {
      props: {
        sortedSlots: [baseSlot],
        formData: baseFormData,
        isFormValid: true,
        saving: false,
        ...overrides,
      },
      global: {
        mocks: { $t: (key: string) => key },
      },
    })

  it('renders section title', () => {
    const w = factory()
    expect(w.find('.section-title').text()).toBe('visits.slotsConfig')
  })

  it('renders form fields (day, start, end, max)', () => {
    const w = factory()
    expect(w.findAll('.field')).toHaveLength(4)
  })

  it('renders slot items for existing slots', () => {
    const w = factory()
    expect(w.findAll('.slot-item')).toHaveLength(1)
  })

  it('shows day label for slot', () => {
    const w = factory()
    expect(w.find('.slot-day').text()).toBe('days.monday')
  })

  it('shows time range for slot', () => {
    const w = factory()
    expect(w.find('.slot-time').text()).toBe('09:00 - 13:00')
  })

  it('shows max visitors for slot', () => {
    const w = factory()
    expect(w.find('.slot-capacity').text()).toContain('5')
  })

  it('shows empty state when no slots', () => {
    const w = factory({ sortedSlots: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
  })

  it('hides empty state when slots exist', () => {
    const w = factory()
    expect(w.find('.empty-state').exists()).toBe(false)
  })

  it('emits add-slot on button click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('add-slot')).toHaveLength(1)
  })

  it('disables add button when form is invalid', () => {
    const w = factory({ isFormValid: false })
    expect(w.find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('disables add button when saving', () => {
    const w = factory({ saving: true })
    expect(w.find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('emits delete-slot on delete button click', async () => {
    const w = factory()
    await w.find('.btn-icon.delete').trigger('click')
    expect(w.emitted('delete-slot')).toEqual([['slot-1']])
  })

  it('disables delete button when saving', () => {
    const w = factory({ saving: true })
    expect(w.find('.btn-icon.delete').attributes('disabled')).toBeDefined()
  })

  it('renders multiple slots', () => {
    const w = factory({
      sortedSlots: [
        baseSlot,
        { ...baseSlot, id: 'slot-2', day_of_week: 3 },
      ],
    })
    expect(w.findAll('.slot-item')).toHaveLength(2)
  })

  it('shows spinner when saving', () => {
    const w = factory({ saving: true })
    expect(w.find('.spinner-sm').exists()).toBe(true)
  })
})
