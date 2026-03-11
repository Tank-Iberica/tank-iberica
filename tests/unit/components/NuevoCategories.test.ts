/**
 * Tests for app/components/admin/productos/nuevo/NuevoCategories.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import NuevoCategories from '../../../app/components/admin/productos/nuevo/NuevoCategories.vue'

describe('NuevoCategories', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(NuevoCategories, {
      props: {
        categories: ['venta'],
        featured: false,
        ...overrides,
      },
    })

  it('renders section', () => {
    expect(factory().find('.section').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.section-title').text()).toBe('Categorias *')
  })

  it('shows 3 category checkboxes', () => {
    expect(factory().findAll('.cat-check')).toHaveLength(3)
  })

  it('shows featured checkbox', () => {
    expect(factory().find('.feat-check').exists()).toBe(true)
  })

  it('marks active category', () => {
    expect(factory().findAll('.cat-check')[0].classes()).toContain('active')
  })

  it('does not mark inactive category', () => {
    expect(factory().findAll('.cat-check')[1].classes()).not.toContain('active')
  })

  it('checks venta checkbox', () => {
    const checkboxes = factory().findAll('.cat-check input')
    expect((checkboxes[0].element as HTMLInputElement).checked).toBe(true)
  })

  it('unchecks alquiler checkbox', () => {
    const checkboxes = factory().findAll('.cat-check input')
    expect((checkboxes[1].element as HTMLInputElement).checked).toBe(false)
  })

  it('emits toggle-category on checkbox change', async () => {
    const w = factory()
    await w.findAll('.cat-check input')[1].trigger('change')
    expect(w.emitted('toggle-category')?.[0]?.[0]).toBe('alquiler')
  })

  it('emits update:featured on featured change', async () => {
    const w = factory()
    await w.find('.feat-check input').trigger('change')
    expect(w.emitted('update:featured')?.[0]?.[0]).toBe(true)
  })

  it('checks featured when true', () => {
    const w = factory({ featured: true })
    expect((w.find('.feat-check input').element as HTMLInputElement).checked).toBe(true)
  })
})
