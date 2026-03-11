/**
 * Tests for app/components/dashboard/herramientas/mantenimientos/MantenimientosFilters.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'

beforeAll(() => {
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
})

import MantenimientosFilters from '../../../app/components/dashboard/herramientas/mantenimientos/MantenimientosFilters.vue'

describe('MantenimientosFilters', () => {
  const vehicleOptions = [
    { id: 'v1', brand: 'Iveco', model: 'Daily', year: 2020 },
    { id: 'v2', brand: 'Volvo', model: 'FH16', year: 2022 },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(MantenimientosFilters, {
      props: {
        filterVehicle: null,
        filterType: null,
        vehicleOptions,
        ...overrides,
      },
    })

  it('renders filters bar', () => {
    expect(factory().find('.filters-bar').exists()).toBe(true)
  })

  it('renders 2 selects', () => {
    expect(factory().findAll('.filter-select')).toHaveLength(2)
  })

  it('vehicle select shows all vehicles option', () => {
    const opts = factory().findAll('.filter-select')[0].findAll('option')
    expect(opts[0].text()).toBe('dashboard.tools.maintenance.filters.allVehicles')
  })

  it('vehicle select shows vehicle options', () => {
    const opts = factory().findAll('.filter-select')[0].findAll('option')
    expect(opts).toHaveLength(3) // all + 2 vehicles
    expect(opts[1].text()).toContain('Iveco')
  })

  it('type select has 4 options', () => {
    const opts = factory().findAll('.filter-select')[1].findAll('option')
    expect(opts).toHaveLength(4) // all + 3 types
  })

  it('emits update:filterVehicle on vehicle change', async () => {
    const w = factory()
    const sel = w.findAll('.filter-select')[0]
    Object.defineProperty(sel.element, 'value', { value: 'v1', writable: true })
    await sel.trigger('change')
    expect(w.emitted('update:filterVehicle')![0]).toEqual(['v1'])
  })

  it('emits null for empty vehicle selection', async () => {
    const w = factory()
    const sel = w.findAll('.filter-select')[0]
    Object.defineProperty(sel.element, 'value', { value: '', writable: true })
    await sel.trigger('change')
    expect(w.emitted('update:filterVehicle')![0]).toEqual([null])
  })

  it('emits update:filterType on type change', async () => {
    const w = factory()
    const sel = w.findAll('.filter-select')[1]
    Object.defineProperty(sel.element, 'value', { value: 'preventivo', writable: true })
    await sel.trigger('change')
    expect(w.emitted('update:filterType')![0]).toEqual(['preventivo'])
  })

  it('emits clear on button click', async () => {
    const w = factory()
    await w.find('.btn-sm').trigger('click')
    expect(w.emitted('clear')).toBeTruthy()
  })
})
