/**
 * Tests for app/components/admin/infra/InfraClusters.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import InfraClusters from '../../../app/components/admin/infra/InfraClusters.vue'

const clusters = [
  {
    id: 'c1',
    name: 'Cluster Principal',
    status: 'active',
    verticals: ['tracciona', 'agrimarket'],
    weight_used: 60,
    weight_limit: 100,
  },
  {
    id: 'c2',
    name: 'Cluster Secundario',
    status: 'full',
    verticals: ['iberhub'],
    weight_used: 100,
    weight_limit: 100,
  },
]

describe('InfraClusters', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(InfraClusters, {
      props: {
        clusters,
        getStatusColor: (p: number | null) => {
          if (p === null) return 'gray'
          if (p < 70) return 'green'
          if (p < 90) return 'yellow'
          return 'red'
        },
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string, fallback: string) => fallback || k },
      },
    })

  it('renders section block', () => {
    expect(factory().find('.section-block').exists()).toBe(true)
  })

  it('shows heading', () => {
    expect(factory().find('.section-heading').text()).toBe('Clusters')
  })

  it('shows empty state when no clusters', () => {
    const w = factory({ clusters: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
  })

  it('hides empty state when clusters exist', () => {
    expect(factory().find('.empty-state').exists()).toBe(false)
  })

  it('renders cluster cards', () => {
    expect(factory().findAll('.cluster-card')).toHaveLength(2)
  })

  it('shows cluster name', () => {
    expect(factory().find('.cluster-name').text()).toBe('Cluster Principal')
  })

  it('shows status badge with class', () => {
    const badges = factory().findAll('.cluster-badge')
    expect(badges[0].classes()).toContain('badge-active')
    expect(badges[1].classes()).toContain('badge-full')
  })

  it('shows vertical tags', () => {
    const tags = factory().findAll('.cluster-card')[0].findAll('.vertical-tag')
    expect(tags).toHaveLength(2)
    expect(tags[0].text()).toBe('tracciona')
  })

  it('shows capacity values', () => {
    const html = factory().html()
    expect(html).toContain('60')
    expect(html).toContain('100')
  })

  it('applies progress color class', () => {
    const fills = factory().findAll('.progress-bar-fill')
    expect(fills[0].classes()).toContain('progress-green')
    expect(fills[1].classes()).toContain('progress-red')
  })

  it('shows status label for active', () => {
    expect(factory().findAll('.cluster-badge')[0].text()).toBeTruthy()
  })

  it('shows status label for full', () => {
    expect(factory().findAll('.cluster-badge')[1].text()).toBeTruthy()
  })
})
