/**
 * Tests for app/components/admin/banner/AdminBannerPreview.vue
 */
import { vi, describe, it, expect } from 'vitest'

vi.stubGlobal('useSanitize', () => ({
  sanitize: (html: string) => html,
}))

import { shallowMount } from '@vue/test-utils'
import AdminBannerPreview from '../../../app/components/admin/banner/AdminBannerPreview.vue'

describe('AdminBannerPreview', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminBannerPreview, {
      props: {
        previewHtml: '<b>Oferta especial</b>',
        previewLang: 'es' as const,
        ...overrides,
      },
    })

  it('renders preview panel', () => {
    expect(factory().find('.preview-panel').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h4').text()).toBe('Vista previa')
  })

  it('renders two lang toggle buttons', () => {
    expect(factory().findAll('.preview-lang-toggle button')).toHaveLength(2)
  })

  it('marks ES button active when previewLang is es', () => {
    const btns = factory().findAll('.preview-lang-toggle button')
    expect(btns[0].classes()).toContain('active')
    expect(btns[1].classes()).not.toContain('active')
  })

  it('marks EN button active when previewLang is en', () => {
    const btns = factory({ previewLang: 'en' }).findAll('.preview-lang-toggle button')
    expect(btns[0].classes()).not.toContain('active')
    expect(btns[1].classes()).toContain('active')
  })

  it('emits update-lang es on ES click', async () => {
    const w = factory({ previewLang: 'en' })
    await w.findAll('.preview-lang-toggle button')[0].trigger('click')
    expect(w.emitted('update-lang')?.[0]).toEqual(['es'])
  })

  it('emits update-lang en on EN click', async () => {
    const w = factory()
    await w.findAll('.preview-lang-toggle button')[1].trigger('click')
    expect(w.emitted('update-lang')?.[0]).toEqual(['en'])
  })

  it('shows banner preview with html when previewHtml provided', () => {
    const w = factory()
    expect(w.find('.banner-preview').exists()).toBe(true)
    expect(w.find('.banner-preview').html()).toContain('Oferta especial')
  })

  it('shows empty state when previewHtml is empty', () => {
    const w = factory({ previewHtml: '' })
    expect(w.find('.banner-preview').exists()).toBe(false)
    expect(w.find('.preview-empty').text()).toBe('Sin texto configurado para este idioma')
  })
})
