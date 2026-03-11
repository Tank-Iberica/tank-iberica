/**
 * Tests for app/components/admin/productos/AdminProductoDescription.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminProductoDescription from '../../../app/components/admin/productos/AdminProductoDescription.vue'

describe('AdminProductoDescription', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminProductoDescription, {
      props: {
        open: true,
        descriptionEs: 'Camión en buen estado',
        descriptionEn: 'Truck in good condition',
        ...overrides,
      },
    })

  it('renders section', () => {
    expect(factory().find('.section').exists()).toBe(true)
  })

  it('shows toggle button', () => {
    expect(factory().find('.section-toggle').exists()).toBe(true)
  })

  it('shows minus when open', () => {
    expect(factory().find('.section-toggle').text()).toContain('−')
  })

  it('shows plus when closed', () => {
    expect(factory({ open: false }).find('.section-toggle').text()).toContain('+')
  })

  it('shows content when open', () => {
    expect(factory().find('.section-content').exists()).toBe(true)
  })

  it('hides content when closed', () => {
    expect(factory({ open: false }).find('.section-content').exists()).toBe(false)
  })

  it('emits update:open on toggle click', async () => {
    const w = factory()
    await w.find('.section-toggle').trigger('click')
    expect(w.emitted('update:open')![0]).toEqual([false])
  })

  it('renders 2 textareas', () => {
    expect(factory().findAll('textarea')).toHaveLength(2)
  })

  it('sets ES textarea value', () => {
    const ta = factory().find('#desc-es')
    expect((ta.element as HTMLTextAreaElement).value).toBe('Camión en buen estado')
  })

  it('sets EN textarea value', () => {
    const ta = factory().find('#desc-en')
    expect((ta.element as HTMLTextAreaElement).value).toBe('Truck in good condition')
  })

  it('shows char count for ES', () => {
    expect(factory().text()).toContain('21/300')
  })

  it('emits update:descriptionEs on ES input', async () => {
    const w = factory()
    const ta = w.find('#desc-es')
    Object.defineProperty(ta.element, 'value', { value: 'nuevo', writable: true })
    await ta.trigger('input')
    expect(w.emitted('update:descriptionEs')![0]).toEqual(['nuevo'])
  })

  it('emits update:descriptionEn on EN input', async () => {
    const w = factory()
    const ta = w.find('#desc-en')
    Object.defineProperty(ta.element, 'value', { value: 'new', writable: true })
    await ta.trigger('input')
    expect(w.emitted('update:descriptionEn')![0]).toEqual(['new'])
  })
})
