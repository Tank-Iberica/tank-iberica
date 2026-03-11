/**
 * Tests for app/components/admin/noticias/AdminNewsPublicationSection.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminNewsPublicationSection from '../../../app/components/admin/noticias/AdminNewsPublicationSection.vue'

describe('AdminNewsPublicationSection', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminNewsPublicationSection, {
      props: {
        section: 'noticias',
        status: 'draft',
        category: 'general',
        publishedAt: null,
        scheduledAt: null,
        ...overrides,
      },
    })

  it('renders section', () => {
    expect(factory().find('.section').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.section-title').text()).toBe('admin.newsForm.publication')
  })

  it('shows section radios', () => {
    const opts = factory().findAll('.estado-opt')
    expect(opts.length).toBeGreaterThanOrEqual(2)
    expect(opts[0].text()).toContain('news.title')
    expect(opts[1].text()).toContain('guide.title')
  })

  it('marks active section', () => {
    const opts = factory().findAll('.estado-opt')
    expect(opts[0].classes()).toContain('active')
    expect(opts[1].classes()).not.toContain('active')
  })

  it('shows 4 status radios', () => {
    const text = factory().text()
    expect(text).toContain('common.draft')
    expect(text).toContain('common.published')
    expect(text).toContain('common.scheduled')
    expect(text).toContain('common.archived')
  })

  it('marks draft as active by default', () => {
    const opts = factory().findAll('.estado-opt')
    // First 2 are section opts, next 4 are status opts
    const draftOpt = opts[2]
    expect(draftOpt.text()).toContain('common.draft')
    expect(draftOpt.classes()).toContain('active')
  })

  it('shows category select', () => {
    const select = factory().find('select')
    expect(select.exists()).toBe(true)
  })

  it('has 4 category options', () => {
    const options = factory().findAll('option')
    expect(options).toHaveLength(4)
    expect(options[0].text()).toBe('news.prensa')
    expect(options[1].text()).toBe('news.eventos')
  })

  it('hides published date input for draft', () => {
    const inputs = factory().findAll('input[type="datetime-local"]')
    expect(inputs).toHaveLength(0)
  })

  it('shows published date for published status', () => {
    const w = factory({ status: 'published' })
    expect(w.find('input[type="datetime-local"]').exists()).toBe(true)
  })

  it('shows scheduled date for scheduled status', () => {
    const w = factory({ status: 'scheduled' })
    expect(w.find('input[type="datetime-local"]').exists()).toBe(true)
    expect(w.text()).toContain('admin.newsForm.autoPublishHint')
  })

  it('emits update:section on section change', async () => {
    const w = factory()
    const guiaRadio = w.findAll('.estado-opt')[1].find('input')
    await guiaRadio.trigger('change')
    expect(w.emitted('update:section')![0]).toEqual(['guia'])
  })

  it('emits update:status on status change', async () => {
    const w = factory()
    // published radio is the 4th estado-opt (index 3)
    const publishedRadio = w.findAll('.estado-opt')[3].find('input')
    await publishedRadio.trigger('change')
    expect(w.emitted('update:status')![0]).toEqual(['published'])
  })

  it('emits update:category on select change', async () => {
    const w = factory()
    const select = w.find('select')
    Object.defineProperty(select.element, 'value', { value: 'eventos', writable: true })
    await select.trigger('change')
    expect(w.emitted('update:category')![0]).toEqual(['eventos'])
  })
})
