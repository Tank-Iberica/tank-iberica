/**
 * Tests for app/components/admin/noticias/AdminNewsEnglishContent.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminNewsEnglishContent from '../../../app/components/admin/noticias/AdminNewsEnglishContent.vue'

describe('AdminNewsEnglishContent', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminNewsEnglishContent, {
      props: {
        titleEn: 'English title',
        descriptionEn: 'English description',
        contentEn: 'English content',
        open: true,
        ...overrides,
      },
    })

  it('renders section', () => {
    expect(factory().find('.section').exists()).toBe(true)
  })

  it('shows toggle button', () => {
    expect(factory().find('.section-toggle').text()).toContain('Contenido en Ingles')
  })

  it('shows content when open', () => {
    expect(factory().find('.section-body').exists()).toBe(true)
  })

  it('hides content when closed', () => {
    expect(factory({ open: false }).find('.section-body').exists()).toBe(false)
  })

  it('renders 3 fields', () => {
    expect(factory().findAll('.field')).toHaveLength(3)
  })

  it('renders title input', () => {
    expect(factory().find('input[type="text"]').exists()).toBe(true)
  })

  it('renders 2 textareas', () => {
    expect(factory().findAll('textarea')).toHaveLength(2)
  })

  it('shows field labels', () => {
    const labels = factory().findAll('.field label')
    expect(labels[0].text()).toBe('Titulo (EN)')
    expect(labels[1].text()).toBe('Meta Descripcion (EN)')
    expect(labels[2].text()).toBe('Contenido (EN)')
  })

  it('emits update:open on toggle click', async () => {
    const w = factory()
    await w.find('.section-toggle').trigger('click')
    expect(w.emitted('update:open')).toBeTruthy()
  })
})
