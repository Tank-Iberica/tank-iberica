/**
 * Tests for app/components/admin/productos/nuevo/NuevoFilters.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { defineComponent } from 'vue'

import NuevoFilters from '../../../app/components/admin/productos/nuevo/NuevoFilters.vue'

const DynamicFiltersStub = defineComponent({
  name: 'AdminProductDynamicFilters',
  template: '<div class="stub-filters" />',
})

describe('NuevoFilters', () => {
  const dynamicFilters = [
    { id: 'f1', name: 'color', type: 'desplegable', label_es: 'Color', options: { values: ['Rojo', 'Azul'] } },
    { id: 'f2', name: 'adr', type: 'tick', label_es: 'ADR' },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(NuevoFilters, {
      props: {
        open: true,
        dynamicFilters,
        getFilterValue: (_id: string) => undefined,
        ...overrides,
      },
      global: { stubs: { AdminProductDynamicFilters: DynamicFiltersStub } },
    })

  it('renders collapsible section', () => {
    expect(factory().find('.collapsible').exists()).toBe(true)
  })

  it('shows toggle title', () => {
    expect(factory().find('.section-toggle').text()).toContain('Filtros')
  })

  it('emits update:open on toggle click', async () => {
    const w = factory()
    await w.find('.section-toggle').trigger('click')
    expect(w.emitted('update:open')?.[0]?.[0]).toBe(false)
  })

  it('hides content when closed', () => {
    const w = factory({ open: false })
    expect(w.find('.section-content').exists()).toBe(false)
  })

  it('shows content when open', () => {
    expect(factory().find('.section-content').exists()).toBe(true)
  })

  it('forwards update-filter from child', async () => {
    const w = factory()
    const stub = w.findComponent(DynamicFiltersStub)
    await stub.vm.$emit('update-filter', 'fuel', 'diesel')
    expect(w.emitted('update-filter')?.[0]).toEqual(['fuel', 'diesel'])
  })
})
