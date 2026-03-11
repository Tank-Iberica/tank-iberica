/**
 * Tests for app/components/admin/noticias/AdminNewsContentEditor.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminNewsContentEditor from '../../../app/components/admin/noticias/AdminNewsContentEditor.vue'

describe('AdminNewsContentEditor', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminNewsContentEditor, {
      props: {
        contentEs: 'Contenido de prueba para la noticia',
        contentWordCount: 150,
        wordCountClass: 'count-warning',
        ...overrides,
      },
    })

  it('renders section', () => {
    expect(factory().find('.section').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.section-title').text()).toBe('admin.newsForm.contentEs *')
  })

  it('renders textarea', () => {
    expect(factory().find('textarea').exists()).toBe(true)
  })

  it('shows character count', () => {
    expect(factory().find('.char-count').text()).toContain('35 admin.newsForm.characters')
  })

  it('shows word count', () => {
    expect(factory().find('.word-count').text()).toContain('150 admin.newsForm.words')
  })

  it('applies word count class', () => {
    expect(factory().find('.word-count').classes()).toContain('count-warning')
  })

  it('shows recommendation when under 300 words', () => {
    expect(factory().find('.word-target').exists()).toBe(true)
  })

  it('hides recommendation at 0 words', () => {
    expect(factory({ contentWordCount: 0 }).find('.word-target').exists()).toBe(false)
  })

  it('hides recommendation at 300+ words', () => {
    expect(factory({ contentWordCount: 350 }).find('.word-target').exists()).toBe(false)
  })

  it('emits update:contentEs on textarea input', async () => {
    const w = factory()
    await w.find('textarea').trigger('input')
    expect(w.emitted('update:contentEs')).toBeTruthy()
  })
})
