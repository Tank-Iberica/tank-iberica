/**
 * Tests for app/components/dashboard/index/DashboardOnboarding.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import DashboardOnboarding from '../../../app/components/dashboard/index/DashboardOnboarding.vue'

const NuxtLinkStub = { template: '<a :href="to"><slot /></a>', props: ['to'] }

describe('DashboardOnboarding', () => {
  const steps = [
    { key: 'logo', label: 'Añadir logo', done: true },
    { key: 'vehicle', label: 'Publicar vehículo', done: false },
    { key: 'contact', label: 'Configurar contacto', done: false },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DashboardOnboarding, {
      props: { progress: 33, steps, ...overrides },
      global: {
        stubs: { NuxtLink: NuxtLinkStub },
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders onboarding card', () => {
    expect(factory().find('.onboarding-card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h3').text()).toBe('dashboard.onboarding.title')
  })

  it('shows progress text', () => {
    expect(factory().find('.progress-text').text()).toBe('33%')
  })

  it('sets progress bar width', () => {
    expect(factory().find('.progress-fill').attributes('style')).toContain('width: 33%')
  })

  it('renders all steps', () => {
    expect(factory().findAll('.step')).toHaveLength(3)
  })

  it('marks done steps', () => {
    const stepEls = factory().findAll('.step')
    expect(stepEls[0].classes()).toContain('done')
    expect(stepEls[1].classes()).not.toContain('done')
  })

  it('shows check mark for done steps', () => {
    expect(factory().findAll('.step-check')[0].text()).toBe('\u2713')
    expect(factory().findAll('.step-check')[1].text()).toBe('')
  })

  it('shows complete link', () => {
    const btn = factory().find('.btn-secondary')
    expect(btn.attributes('href')).toBe('/dashboard/portal')
  })
})
