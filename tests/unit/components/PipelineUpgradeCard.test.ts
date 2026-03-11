/**
 * Tests for app/components/dashboard/pipeline/PipelineUpgradeCard.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import PipelineUpgradeCard from '../../../app/components/dashboard/pipeline/PipelineUpgradeCard.vue'

const NuxtLinkStub = { template: '<a :href="to"><slot /></a>', props: ['to'] }

describe('PipelineUpgradeCard', () => {
  const factory = () =>
    shallowMount(PipelineUpgradeCard, {
      global: {
        stubs: { NuxtLink: NuxtLinkStub },
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders upgrade card', () => {
    expect(factory().find('.upgrade-card').exists()).toBe(true)
  })

  it('shows star icon', () => {
    expect(factory().find('.upgrade-icon').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h2').text()).toBe('dashboard.pipeline.upgradeTitle')
  })

  it('shows description', () => {
    expect(factory().find('p').text()).toBe('dashboard.pipeline.upgradeDesc')
  })

  it('shows CTA button linking to subscription', () => {
    const btn = factory().find('.btn-primary')
    expect(btn.text()).toBe('dashboard.pipeline.upgradeCta')
    expect(btn.attributes('href')).toBe('/dashboard/suscripcion')
  })
})
