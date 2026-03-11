/**
 * Tests for app/components/admin/noticias/AdminNewsTitleSlug.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminNewsTitleSlug from '../../../app/components/admin/noticias/AdminNewsTitleSlug.vue'

describe('AdminNewsTitleSlug', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminNewsTitleSlug, {
      props: {
        titleEs: 'Test Title',
        slug: 'test-title',
        titleLengthClass: 'count-good',
        ...overrides,
      },
    })

  it('renders section', () => {
    expect(factory().find('.section').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.section-title').text()).toBe('Titulo y URL')
  })

  it('renders title input with value', () => {
    const inputs = factory().findAll('.input')
    expect((inputs[0].element as HTMLInputElement).value).toBe('Test Title')
  })

  it('renders slug input with value', () => {
    const w = factory()
    const slugInput = w.find('.slug-field')
    expect((slugInput.element as HTMLInputElement).value).toBe('test-title')
  })

  it('shows slug prefix', () => {
    expect(factory().find('.slug-prefix').text()).toBe('/noticias/')
  })

  it('shows char count for title', () => {
    // 'Test Title' = 10 chars
    expect(factory().find('.char-count').text()).toContain('10/60')
  })

  it('applies length class to char count', () => {
    expect(factory().find('.char-count').classes()).toContain('count-good')
  })

  it('emits update:titleEs on title input', async () => {
    const w = factory()
    const input = w.findAll('.input')[0]
    Object.defineProperty(input.element, 'value', { value: 'New Title', writable: true })
    await input.trigger('input')
    expect(w.emitted('update:titleEs')![0]).toEqual(['New Title'])
  })

  it('emits update:slug on slug input', async () => {
    const w = factory()
    const slugInput = w.find('.slug-field')
    Object.defineProperty(slugInput.element, 'value', { value: 'new-slug', writable: true })
    await slugInput.trigger('input')
    expect(w.emitted('update:slug')![0]).toEqual(['new-slug'])
  })
})
