/**
 * Tests for app/components/admin/productos/nuevo/NuevoDescription.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import NuevoDescription from '../../../app/components/admin/productos/nuevo/NuevoDescription.vue'

describe('NuevoDescription', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(NuevoDescription, {
      props: {
        open: true,
        descriptionEs: 'Descripcion en espanol',
        descriptionEn: 'English description',
        ...overrides,
      },
    })

  it('renders collapsible section', () => {
    expect(factory().find('.collapsible').exists()).toBe(true)
  })

  it('shows toggle button', () => {
    expect(factory().find('.section-toggle').text()).toContain('admin.productos.descriptionSection')
  })

  it('shows content when open', () => {
    expect(factory().find('.section-content').exists()).toBe(true)
  })

  it('hides content when closed', () => {
    expect(factory({ open: false }).find('.section-content').exists()).toBe(false)
  })

  it('shows ES textarea with value', () => {
    const textareas = factory().findAll('textarea')
    expect((textareas[0].element as HTMLTextAreaElement).value).toBe('Descripcion en espanol')
  })

  it('shows EN textarea with value', () => {
    const textareas = factory().findAll('textarea')
    expect((textareas[1].element as HTMLTextAreaElement).value).toBe('English description')
  })

  it('shows char count for ES', () => {
    const counts = factory().findAll('.char-count')
    expect(counts[0].text()).toContain('22/300')
  })

  it('emits update:open on toggle click', async () => {
    const w = factory()
    await w.find('.section-toggle').trigger('click')
    expect(w.emitted('update:open')?.[0]?.[0]).toBe(false)
  })

  it('emits update:descriptionEs on input', async () => {
    const w = factory()
    await w.findAll('textarea')[0].trigger('input')
    expect(w.emitted('update:descriptionEs')).toBeTruthy()
  })

  it('emits update:descriptionEn on input', async () => {
    const w = factory()
    await w.findAll('textarea')[1].trigger('input')
    expect(w.emitted('update:descriptionEn')).toBeTruthy()
  })
})
