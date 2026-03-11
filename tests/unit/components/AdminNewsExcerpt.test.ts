/**
 * Tests for app/components/admin/noticias/AdminNewsExcerpt.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminNewsExcerpt from '../../../app/components/admin/noticias/AdminNewsExcerpt.vue'

describe('AdminNewsExcerpt', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminNewsExcerpt, {
      props: {
        excerptEs: 'Test excerpt text here',
        excerptLengthClass: 'count-good',
        ...overrides,
      },
    })

  it('renders section', () => {
    expect(factory().find('.section').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.section-title').text()).toBe('admin.newsForm.excerpt')
  })

  it('shows hint text', () => {
    expect(factory().find('.section-hint').text()).toContain('admin.newsForm.excerptHint')
  })

  it('renders textarea with value', () => {
    const ta = factory().find('textarea')
    expect(ta.exists()).toBe(true)
    expect((ta.element as HTMLTextAreaElement).value).toBe('Test excerpt text here')
  })

  it('shows char count', () => {
    expect(factory().find('.char-count').text()).toContain('22/300')
  })

  it('applies length class to char count', () => {
    expect(factory().find('.char-count').classes()).toContain('count-good')
  })

  it('shows length label for ideal length', () => {
    const text = 'a'.repeat(150)
    const w = factory({ excerptEs: text })
    expect(w.text()).toContain('admin.newsForm.excerptIdealLength')
  })

  it('shows short label', () => {
    const w = factory({ excerptEs: 'short' })
    expect(w.text()).toContain('admin.newsForm.excerptTooShort')
  })

  it('emits update:excerptEs on input', async () => {
    const w = factory()
    const ta = w.find('textarea')
    Object.defineProperty(ta.element, 'value', { value: 'New text', writable: true })
    await ta.trigger('input')
    expect(w.emitted('update:excerptEs')![0]).toEqual(['New text'])
  })

  it('handles null excerptEs', () => {
    const w = factory({ excerptEs: null })
    expect(w.find('.char-count').text()).toContain('0/300')
  })

  it('shows Largo label when excerptEs exceeds 200 chars', () => {
    const w = factory({ excerptEs: 'A'.repeat(250) })
    expect(w.text()).toContain('admin.newsForm.excerptTooLong')
  })
})
