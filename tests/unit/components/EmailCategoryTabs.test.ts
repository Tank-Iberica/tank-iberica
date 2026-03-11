/**
 * Tests for app/components/admin/config/emails/EmailCategoryTabs.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import EmailCategoryTabs from '../../../app/components/admin/config/emails/EmailCategoryTabs.vue'

describe('EmailCategoryTabs', () => {
  const categories = [
    { key: 'all', labelKey: 'admin.emails.all' },
    { key: 'transactional', labelKey: 'admin.emails.transactional' },
    { key: 'marketing', labelKey: 'admin.emails.marketing' },
  ]

  const factory = (activeCategory = 'all') =>
    shallowMount(EmailCategoryTabs, {
      props: {
        activeCategory,
        categories,
        categoryCount: (cat: string) => ({ all: 30, transactional: 20, marketing: 10 }[cat] || 0),
      },
      global: { mocks: { $t: (key: string) => key } },
    })

  it('renders category-tabs container', () => {
    const w = factory()
    expect(w.find('.category-tabs').exists()).toBe(true)
  })

  it('renders one tab per category', () => {
    const w = factory()
    expect(w.findAll('.category-tab')).toHaveLength(3)
  })

  it('shows translated labels', () => {
    const w = factory()
    const tabs = w.findAll('.category-tab')
    expect(tabs[0].find('.category-tab__label').text()).toBe('admin.emails.all')
  })

  it('shows category count', () => {
    const w = factory()
    const tabs = w.findAll('.category-tab')
    expect(tabs[0].find('.category-tab__count').text()).toBe('30')
    expect(tabs[1].find('.category-tab__count').text()).toBe('20')
  })

  it('active tab has active class', () => {
    const w = factory('transactional')
    expect(w.findAll('.category-tab')[1].classes()).toContain('category-tab--active')
  })

  it('emits select on tab click', async () => {
    const w = factory()
    await w.findAll('.category-tab')[2].trigger('click')
    expect(w.emitted('select')).toBeTruthy()
    expect(w.emitted('select')![0]).toEqual(['marketing'])
  })
})
