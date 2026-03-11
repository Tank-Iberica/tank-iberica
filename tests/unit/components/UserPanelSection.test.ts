/**
 * Tests for app/components/user/UserPanelSection.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import UserPanelSection from '../../../app/components/user/UserPanelSection.vue'

describe('UserPanelSection', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(UserPanelSection, {
      props: {
        sectionId: 'profile',
        title: 'Mi Perfil',
        activeSection: null,
        ...overrides,
      },
      slots: { default: '<p class="slot-content">Content here</p>' },
      global: {
        stubs: { Transition: true },
      },
    })

  it('renders panel section', () => {
    expect(factory().find('.panel-section').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.section-header').text()).toContain('Mi Perfil')
  })

  it('shows down arrow when collapsed', () => {
    expect(factory().find('.section-arrow').text()).toBe('▼')
  })

  it('shows up arrow when active', () => {
    const w = factory({ activeSection: 'profile' })
    expect(w.find('.section-arrow').text()).toBe('▲')
  })

  it('applies active class when active', () => {
    const w = factory({ activeSection: 'profile' })
    expect(w.find('.section-header').classes()).toContain('active')
  })

  it('does not apply active class when not active', () => {
    expect(factory().find('.section-header').classes()).not.toContain('active')
  })

  it('emits toggle with sectionId on click', async () => {
    const w = factory()
    await w.find('.section-header').trigger('click')
    expect(w.emitted('toggle')).toBeTruthy()
    expect(w.emitted('toggle')![0]).toEqual(['profile'])
  })

  it('shows content when active', () => {
    const w = factory({ activeSection: 'profile' })
    expect(w.find('.section-content').exists()).toBe(true)
  })

  it('hides content when not active', () => {
    expect(factory().find('.section-content').exists()).toBe(false)
  })

  it('shows badge when provided', () => {
    const w = factory({ badge: 3 })
    expect(w.find('.badge').text()).toBe('3')
  })

  it('hides badge when 0', () => {
    const w = factory({ badge: 0 })
    expect(w.find('.badge').exists()).toBe(false)
  })

  it('applies danger class', () => {
    const w = factory({ danger: true })
    expect(w.find('.panel-section').classes()).toContain('panel-section--danger')
    expect(w.find('.section-header').classes()).toContain('section-header--danger')
  })

  it('shows danger content class when active and danger', () => {
    const w = factory({ danger: true, activeSection: 'profile' })
    expect(w.find('.section-content').classes()).toContain('section-content--danger')
  })
})
