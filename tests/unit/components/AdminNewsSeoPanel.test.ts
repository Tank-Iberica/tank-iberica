/**
 * Tests for app/components/admin/noticias/AdminNewsSeoPanel.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminNewsSeoPanel from '../../../app/components/admin/noticias/AdminNewsSeoPanel.vue'

describe('AdminNewsSeoPanel', () => {
  const analysis = {
    score: 72,
    level: 'warning',
    snippetPreview: {
      title: 'Artículo de prueba',
      url: 'https://tracciona.com/noticias/articulo',
      description: 'Descripción SEO',
    },
    criteria: [
      { id: 'title', label: 'Título', score: 15, level: 'good', description: 'Longitud correcta' },
      { id: 'desc', label: 'Descripción', score: 8, level: 'warning', description: 'Muy corta' },
      { id: 'content', label: 'Contenido', score: 5, level: 'bad', description: 'Necesita más texto' },
    ],
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminNewsSeoPanel, {
      props: {
        analysis,
        seoPanel: true,
        getLevelLabel: (l: string) => l.toUpperCase(),
        ...overrides,
      },
    })

  it('renders component', () => {
    expect(factory().find('.nf-seo').exists()).toBe(true)
  })

  it('shows mobile toggle', () => {
    expect(factory().find('.seo-toggle-mobile').text()).toContain('Panel SEO')
  })

  it('shows score in mini badge', () => {
    expect(factory().find('.seo-score-mini').text()).toBe('72')
  })

  it('applies level class to mini badge', () => {
    expect(factory().find('.seo-score-mini').classes()).toContain('warning')
  })

  it('shows score circle', () => {
    expect(factory().find('.score-number').text()).toBe('72')
  })

  it('applies level class to score circle', () => {
    expect(factory().find('.score-circle').classes()).toContain('warning')
  })

  it('shows level label', () => {
    expect(factory().find('.level-text').text()).toBe('WARNING')
  })

  it('shows snippet preview', () => {
    expect(factory().find('.snippet-title').text()).toBe('Artículo de prueba')
    expect(factory().find('.snippet-url').text()).toBe('https://tracciona.com/noticias/articulo')
    expect(factory().find('.snippet-desc').text()).toBe('Descripción SEO')
  })

  it('renders criteria rows', () => {
    expect(factory().findAll('.criterion-row')).toHaveLength(3)
  })

  it('shows criterion labels', () => {
    const labels = factory().findAll('.criterion-label')
    expect(labels[0].text()).toBe('Título')
    expect(labels[1].text()).toBe('Descripción')
  })

  it('shows criterion scores', () => {
    const scores = factory().findAll('.criterion-score')
    expect(scores[0].text()).toBe('15')
  })

  it('applies criterion level dots', () => {
    const dots = factory().findAll('.criterion-dot')
    expect(dots[0].classes()).toContain('good')
    expect(dots[1].classes()).toContain('warning')
    expect(dots[2].classes()).toContain('bad')
  })

  it('shows criterion descriptions', () => {
    expect(factory().findAll('.criterion-desc')[0].text()).toBe('Longitud correcta')
  })

  it('emits update:seoPanel on toggle click', async () => {
    const w = factory()
    await w.find('.seo-toggle-mobile').trigger('click')
    expect(w.emitted('update:seoPanel')).toBeTruthy()
  })
})
