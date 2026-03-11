/**
 * Tests for app/components/admin/historico/HistoricoColumnToggles.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import HistoricoColumnToggles from '../../../app/components/admin/historico/HistoricoColumnToggles.vue'

describe('HistoricoColumnToggles', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(HistoricoColumnToggles, {
      props: {
        showDocs: true,
        showTecnico: false,
        showAlquiler: true,
        total: 42,
        ...overrides,
      },
    })

  it('renders column toggles', () => {
    expect(factory().find('.column-toggles').exists()).toBe(true)
  })

  it('renders 3 checkboxes', () => {
    expect(factory().findAll('.toggle-check')).toHaveLength(3)
  })

  it('shows correct labels', () => {
    const labels = factory().findAll('.toggle-check').map(l => l.text())
    expect(labels).toEqual(['DOCS', 'TÉCNICO', 'ALQUILER'])
  })

  it('reflects showDocs checked state', () => {
    const cb = factory().findAll('input[type="checkbox"]')[0]
    expect((cb.element as HTMLInputElement).checked).toBe(true)
  })

  it('reflects showTecnico unchecked state', () => {
    const cb = factory().findAll('input[type="checkbox"]')[1]
    expect((cb.element as HTMLInputElement).checked).toBe(false)
  })

  it('shows total count', () => {
    expect(factory().find('.count').text()).toBe('42 registros')
  })

  it('emits update:showDocs on change', async () => {
    const w = factory()
    await w.findAll('input[type="checkbox"]')[0].setValue(false)
    expect(w.emitted('update:showDocs')).toBeTruthy()
  })

  it('emits update:showTecnico on change', async () => {
    const w = factory()
    await w.findAll('input[type="checkbox"]')[1].setValue(true)
    expect(w.emitted('update:showTecnico')).toBeTruthy()
  })

  it('emits update:showAlquiler on change', async () => {
    const w = factory()
    await w.findAll('input[type="checkbox"]')[2].setValue(false)
    expect(w.emitted('update:showAlquiler')).toBeTruthy()
  })
})
