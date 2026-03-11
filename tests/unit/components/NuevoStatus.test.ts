/**
 * Tests for app/components/admin/productos/nuevo/NuevoStatus.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import NuevoStatus from '../../../app/components/admin/productos/nuevo/NuevoStatus.vue'

describe('NuevoStatus', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(NuevoStatus, {
      props: {
        status: 'published',
        ...overrides,
      },
    })

  it('renders section', () => {
    expect(factory().find('.section').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.section-title').text()).toBe('common.status')
  })

  it('shows 4 status options', () => {
    expect(factory().findAll('.estado-opt')).toHaveLength(4)
  })

  it('marks published as active', () => {
    expect(factory().findAll('.estado-opt')[0].classes()).toContain('active')
  })

  it('does not mark draft as active', () => {
    expect(factory().findAll('.estado-opt')[1].classes()).not.toContain('active')
  })

  it('marks draft when status is draft', () => {
    const w = factory({ status: 'draft' })
    expect(w.findAll('.estado-opt')[1].classes()).toContain('active')
  })

  it('shows colored dots', () => {
    expect(factory().find('.dot.green').exists()).toBe(true)
    expect(factory().find('.dot.gray').exists()).toBe(true)
    expect(factory().find('.dot.blue').exists()).toBe(true)
    expect(factory().find('.dot.red').exists()).toBe(true)
  })

  it('shows status labels', () => {
    const opts = factory().findAll('.estado-opt')
    expect(opts[0].text()).toContain('common.published')
    expect(opts[1].text()).toContain('common.hidden')
    expect(opts[2].text()).toContain('common.rented')
    expect(opts[3].text()).toContain('common.maintenance')
  })

  it('emits update:status on change', async () => {
    const w = factory()
    await w.findAll('.estado-opt input')[1].trigger('change')
    expect(w.emitted('update:status')?.[0]?.[0]).toBe('draft')
  })
})
