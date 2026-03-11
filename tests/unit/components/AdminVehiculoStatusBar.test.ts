/**
 * Tests for app/components/admin/vehiculos/AdminVehiculoStatusBar.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import AdminVehiculoStatusBar from '../../../app/components/admin/vehiculos/AdminVehiculoStatusBar.vue'

const statusOptions = [
  { value: 'draft', label: 'Borrador' },
  { value: 'published', label: 'Publicado' },
  { value: 'rented', label: 'Alquilado' },
  { value: 'workshop', label: 'Taller' },
]

describe('AdminVehiculoStatusBar', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminVehiculoStatusBar, {
      props: {
        status: 'draft',
        featured: false,
        statusOptions,
        ...overrides,
      },
    })

  it('renders status section', () => {
    expect(factory().find('.status-section').exists()).toBe(true)
  })

  it('shows section title', () => {
    expect(factory().find('.section-title').text()).toBe('Estado')
  })

  it('renders status option buttons', () => {
    expect(factory().findAll('.status-option')).toHaveLength(4)
  })

  it('marks active status option', () => {
    const opts = factory().findAll('.status-option')
    expect(opts[0].classes()).toContain('active')
    expect(opts[1].classes()).not.toContain('active')
  })

  it('applies status value as class', () => {
    const opts = factory().findAll('.status-option')
    expect(opts[0].classes()).toContain('draft')
    expect(opts[1].classes()).toContain('published')
  })

  it('shows status labels', () => {
    const opts = factory().findAll('.status-option')
    expect(opts[0].find('.status-label').text()).toBe('Borrador')
    expect(opts[1].find('.status-label').text()).toBe('Publicado')
  })

  it('shows status dot for each option', () => {
    expect(factory().findAll('.status-dot')).toHaveLength(4)
  })

  it('emits update:status on status click', async () => {
    const w = factory()
    await w.findAll('.status-option')[1].trigger('click')
    expect(w.emitted('update:status')?.[0]).toEqual(['published'])
  })

  it('shows featured checkbox', () => {
    expect(factory().find('.featured-toggle input[type="checkbox"]').exists()).toBe(true)
  })

  it('shows featured label', () => {
    expect(factory().find('.featured-toggle').text()).toContain('Destacado')
  })

  it('checkbox is unchecked when featured is false', () => {
    const cb = factory().find('.featured-toggle input') as any
    expect(cb.element.checked).toBe(false)
  })

  it('checkbox is checked when featured is true', () => {
    const cb = factory({ featured: true }).find('.featured-toggle input') as any
    expect(cb.element.checked).toBe(true)
  })

  it('emits update:featured on checkbox change', async () => {
    const w = factory()
    await w.find('.featured-toggle input').trigger('change')
    expect(w.emitted('update:featured')).toBeTruthy()
  })
})
