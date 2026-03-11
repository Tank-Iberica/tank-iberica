/**
 * Tests for app/components/admin/dashboard/CollapsibleStats.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { computed, ref, watch } from 'vue'

// Use real Vue reactivity for component tests
beforeAll(() => {
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('watch', watch)
})

import CollapsibleStats from '../../../app/components/admin/dashboard/CollapsibleStats.vue'

const productStats = {
  total: 100,
  published: 80,
  unpublished: 20,
  byCategory: [
    { name: 'Camiones', count: 50 },
    { name: 'Furgonetas', count: 30 },
  ],
  byType: [
    { name: 'Rígido', count: 25 },
    { name: 'Articulado', count: 15 },
  ],
}

const userStats = {
  registered: 500,
  visits: 10000,
  uniqueVisits: 7500,
  buyers: 200,
  renters: 50,
  requests: 150,
  advertisers: 30,
  newsVisits: 2000,
  newsComments: 100,
}

describe('CollapsibleStats', () => {
  const factory = (sectionsOpen = { products: false, users: false }) =>
    shallowMount(CollapsibleStats, {
      props: { productStats, userStats, sectionsOpen },
    })

  it('renders two collapsible sections', () => {
    const w = factory()
    expect(w.findAll('.collapsible-section')).toHaveLength(2)
  })

  it('displays product stats summary', () => {
    const w = factory()
    const headers = w.findAll('.collapsible-header')
    expect(headers[0].text()).toContain('admin.collapsibleStats.productsTitle')
    expect(headers[0].text()).toContain('100')
    expect(headers[0].text()).toContain('80')
  })

  it('displays user stats summary', () => {
    const w = factory()
    const headers = w.findAll('.collapsible-header')
    expect(headers[1].text()).toContain('admin.collapsibleStats.communityTitle')
    expect(headers[1].text()).toContain('500')
  })

  it('shows product stats when products section is open', () => {
    const w = factory({ products: true, users: false })
    const content = w.findAll('.collapsible-content')
    expect(content[0].isVisible()).toBe(true)
  })

  it('section is not open when products is closed', () => {
    const w = factory({ products: false, users: false })
    const sections = w.findAll('.collapsible-section')
    expect(sections[0].classes()).not.toContain('open')
  })

  it('renders category breakdown', () => {
    const w = factory({ products: true, users: false })
    const items = w.findAll('.breakdown-item')
    expect(items.length).toBeGreaterThanOrEqual(2)
    expect(items[0].text()).toContain('Camiones')
    expect(items[0].text()).toContain('50')
  })

  it('renders type breakdown', () => {
    const w = factory({ products: true, users: false })
    const breakdown = w.findAll('.stats-breakdown')
    expect(breakdown.length).toBeGreaterThanOrEqual(2)
  })

  it('shows product mini stats', () => {
    const w = factory({ products: true, users: false })
    const values = w.findAll('.mini-stat-value')
    expect(values.length).toBeGreaterThanOrEqual(3)
  })

  it('renders user stats grid items', () => {
    const w = factory({ products: false, users: true })
    const items = w.findAll('.user-stat-item')
    expect(items.length).toBe(6)
  })

  it('toggles products section on header click', async () => {
    const w = factory({ products: false, users: false })
    const headers = w.findAll('.collapsible-header')
    await headers[0].trigger('click')
    // After click, the section should toggle open
    expect(w.findAll('.collapsible-content')[0].isVisible()).toBe(true)
  })

  it('shows empty state when byCategory is empty', () => {
    const w = shallowMount(CollapsibleStats, {
      props: {
        productStats: { ...productStats, byCategory: [] },
        userStats,
        sectionsOpen: { products: true, users: false },
      },
    })
    expect(w.find('.breakdown-empty').exists()).toBe(true)
    expect(w.find('.breakdown-empty').text()).toBe('admin.collapsibleStats.noData')
  })
})
