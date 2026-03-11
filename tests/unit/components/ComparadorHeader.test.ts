/**
 * Tests for app/components/perfil/comparador/ComparadorHeader.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import ComparadorHeader from '../../../app/components/perfil/comparador/ComparadorHeader.vue'

describe('ComparadorHeader', () => {
  const comparisons = [
    { id: 'c-1', name: 'Tractoras', vehicle_ids: ['v-1', 'v-2'] },
    { id: 'c-2', name: 'Remolques', vehicle_ids: ['v-3'] },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ComparadorHeader, {
      props: {
        comparisons,
        activeComparison: comparisons[0],
        showNewForm: false,
        newCompName: '',
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders header', () => {
    expect(factory().find('.cmp-header').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.page-title').text()).toBe('comparator.title')
  })

  it('renders print button', () => {
    expect(factory().find('.btn-icon').exists()).toBe(true)
  })

  it('emits print on print click', async () => {
    const w = factory()
    await w.find('.btn-icon').trigger('click')
    expect(w.emitted('print')).toHaveLength(1)
  })

  it('renders comparison selector', () => {
    expect(factory().find('.cmp-select').exists()).toBe(true)
  })

  it('shows comparison options', () => {
    // 2 comparisons + 1 placeholder
    expect(factory().findAll('.cmp-select option')).toHaveLength(3)
  })

  it('shows new comparison button', () => {
    expect(factory().find('.btn-outline').text()).toBe('comparator.newComparison')
  })

  it('shows delete button when active comparison', () => {
    expect(factory().find('.btn-err').exists()).toBe(true)
  })

  it('hides delete button when no active comparison', () => {
    expect(factory({ activeComparison: null }).find('.btn-err').exists()).toBe(false)
  })

  it('shows new form when showNewForm is true', () => {
    expect(factory({ showNewForm: true }).find('.new-form').exists()).toBe(true)
  })

  it('shows new form when no comparisons', () => {
    expect(factory({ comparisons: [] }).find('.new-form').exists()).toBe(true)
  })

  it('hides selector when no comparisons', () => {
    expect(factory({ comparisons: [] }).find('.selector-row').exists()).toBe(false)
  })
})
