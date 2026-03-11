/**
 * Tests for app/components/admin/noticias/AdminNewsMetaDescription.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminNewsMetaDescription from '../../../app/components/admin/noticias/AdminNewsMetaDescription.vue'

describe('AdminNewsMetaDescription', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminNewsMetaDescription, {
      props: {
        descriptionEs: 'Test meta description',
        descLengthClass: 'count-good',
        ...overrides,
      },
    })

  it('renders section', () => {
    expect(factory().find('.section').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.section-title').text()).toBe('Meta Descripcion (SEO)')
  })

  it('shows hint text', () => {
    expect(factory().find('.section-hint').text()).toContain('Google')
  })

  it('renders textarea with value', () => {
    const ta = factory().find('textarea')
    expect(ta.exists()).toBe(true)
    expect((ta.element as HTMLTextAreaElement).value).toBe('Test meta description')
  })

  it('shows char count', () => {
    // 'Test meta description' = 21 chars
    expect(factory().find('.char-count').text()).toContain('21/160')
  })

  it('applies length class to char count', () => {
    expect(factory().find('.char-count').classes()).toContain('count-good')
  })

  it('shows ideal label for correct length', () => {
    const text = 'a'.repeat(140)
    const w = factory({ descriptionEs: text })
    expect(w.text()).toContain('Longitud ideal')
  })

  it('shows short label', () => {
    const w = factory({ descriptionEs: 'short' })
    expect(w.text()).toContain('Muy corta')
  })

  it('emits update:descriptionEs on input', async () => {
    const w = factory()
    const ta = w.find('textarea')
    Object.defineProperty(ta.element, 'value', { value: 'New desc', writable: true })
    await ta.trigger('input')
    expect(w.emitted('update:descriptionEs')![0]).toEqual(['New desc'])
  })

  it('handles null descriptionEs', () => {
    const w = factory({ descriptionEs: null })
    expect(w.find('.char-count').text()).toContain('0/160')
  })

  it('shows Larga label when descriptionEs exceeds 160 chars', () => {
    const w = factory({ descriptionEs: 'A'.repeat(200) })
    expect(w.text()).toContain('Larga')
  })
})
