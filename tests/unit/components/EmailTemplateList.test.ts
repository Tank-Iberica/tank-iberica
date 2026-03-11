/**
 * Tests for app/components/admin/config/emails/EmailTemplateList.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import EmailTemplateList from '../../../app/components/admin/config/emails/EmailTemplateList.vue'

describe('EmailTemplateList', () => {
  const filteredTemplates = [
    { key: 'welcome', category: 'onboarding', subject_es: '', subject_en: '' },
    { key: 'invoice', category: 'billing', subject_es: '', subject_en: '' },
  ]
  const templates: Record<string, { active: boolean }> = {
    welcome: { active: true },
    invoice: { active: false },
  }

  const factory = (selected = 'welcome') =>
    shallowMount(EmailTemplateList, {
      props: { filteredTemplates, templates, selectedTemplateKey: selected },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders template list', () => {
    expect(factory().find('.template-list').exists()).toBe(true)
  })

  it('shows header', () => {
    expect(factory().find('.template-list__header').text()).toBe('admin.emails.templates')
  })

  it('renders template items', () => {
    expect(factory().findAll('.template-item')).toHaveLength(2)
  })

  it('active item has active class', () => {
    const items = factory('welcome').findAll('.template-item')
    expect(items[0].classes()).toContain('template-item--active')
    expect(items[1].classes()).not.toContain('template-item--active')
  })

  it('disabled template has disabled class', () => {
    const items = factory().findAll('.template-item')
    expect(items[1].classes()).toContain('template-item--disabled')
  })

  it('shows status dot on for active', () => {
    expect(factory().findAll('.status-dot')[0].classes()).toContain('status-dot--on')
  })

  it('shows status dot off for inactive', () => {
    expect(factory().findAll('.status-dot')[1].classes()).toContain('status-dot--off')
  })

  it('shows template key', () => {
    expect(factory().find('.template-item__key').text()).toBe('welcome')
  })

  it('emits select on click', async () => {
    const w = factory()
    await w.findAll('.template-item')[1].trigger('click')
    expect(w.emitted('select')).toBeTruthy()
    expect(w.emitted('select')![0]).toEqual(['invoice'])
  })
})
