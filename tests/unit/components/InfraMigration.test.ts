/**
 * Tests for app/components/admin/infra/InfraMigration.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import InfraMigration from '../../../app/components/admin/infra/InfraMigration.vue'

const clusters = [
  {
    id: 'c1',
    name: 'Cluster A',
    status: 'active',
    verticals: ['tracciona'],
    weight_used: 40,
    weight_limit: 100,
  },
]

describe('InfraMigration', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(InfraMigration, {
      props: {
        clusters,
        wizardOpen: false,
        wizardStep: 1,
        wizardVertical: '',
        wizardTargetCluster: '',
        wizardConfirmed: false,
        wizardExecuting: false,
        wizardComplete: false,
        wizardProgress: 0,
        wizardResult: 'success' as const,
        wizardErrorMessage: '',
        getStatusColor: () => 'green' as const,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string, fallback: string) => fallback || k },
      },
    })

  it('renders migration section', () => {
    expect(factory().find('.infra-migration').exists()).toBe(true)
  })

  it('shows heading', () => {
    expect(factory().find('.section-heading').text()).toBe('Clusters disponibles')
  })

  it('shows empty state when no clusters', () => {
    const w = factory({ clusters: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
  })

  it('renders cluster cards', () => {
    expect(factory().findAll('.cluster-card')).toHaveLength(1)
  })

  it('shows cluster name', () => {
    expect(factory().find('.cluster-name').text()).toBe('Cluster A')
  })

  it('shows new migration button', () => {
    expect(factory().find('.btn-new-migration').exists()).toBe(true)
  })

  it('emits open-wizard on button click', async () => {
    const w = factory()
    await w.find('.btn-new-migration').trigger('click')
    expect(w.emitted('open-wizard')).toBeTruthy()
  })

  it('hides wizard when not open', () => {
    expect(factory().html()).not.toContain('infra-migration-wizard')
  })

  it('shows wizard stub when open', () => {
    const w = factory({ wizardOpen: true })
    // shallowMount stubs unknown children — just verify the v-if renders something extra
    const html = w.html()
    // The stub tag name varies; check that more content appears vs closed
    const closedHtml = factory({ wizardOpen: false }).html()
    expect(html.length).toBeGreaterThan(closedHtml.length)
  })

  it('shows vertical tags', () => {
    expect(factory().find('.vertical-tag').text()).toBe('tracciona')
  })

  it('shows capacity', () => {
    expect(factory().html()).toContain('40')
    expect(factory().html()).toContain('100')
  })
})
