/**
 * Tests for app/components/perfil/NotificationCategoryCard.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import NotificationCategoryCard from '../../../app/components/perfil/NotificationCategoryCard.vue'

const baseCategory = {
  id: 'activity',
  titleKey: 'profile.notifications.categoryActivity',
  types: [
    { key: 'lead_notification', labelKey: 'profile.notifications.leadNotification', descKey: 'profile.notifications.leadNotificationDesc' },
    { key: 'vehicle_published', labelKey: 'profile.notifications.vehiclePublished', descKey: 'profile.notifications.vehiclePublishedDesc' },
  ],
}

describe('NotificationCategoryCard', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(NotificationCategoryCard, {
      props: {
        category: { ...baseCategory },
        saving: false,
        isEnabled: (key: string) => key === 'lead_notification',
        isAlwaysOn: (_key: string) => false,
        ...overrides,
      },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders category card', () => {
    expect(factory().find('.category-card').exists()).toBe(true)
  })

  it('shows category title', () => {
    expect(factory().find('.category-title').text()).toBe('profile.notifications.categoryActivity')
  })

  it('renders preference items', () => {
    expect(factory().findAll('.preference-item')).toHaveLength(2)
  })

  it('shows preference labels', () => {
    const labels = factory().findAll('.preference-label')
    expect(labels[0].text()).toBe('profile.notifications.leadNotification')
    expect(labels[1].text()).toBe('profile.notifications.vehiclePublished')
  })

  it('shows preference descriptions', () => {
    const descs = factory().findAll('.preference-desc')
    expect(descs[0].text()).toBe('profile.notifications.leadNotificationDesc')
  })

  it('checks enabled checkboxes', () => {
    const checkboxes = factory().findAll('.toggle__input')
    expect((checkboxes[0].element as HTMLInputElement).checked).toBe(true)
    expect((checkboxes[1].element as HTMLInputElement).checked).toBe(false)
  })

  it('applies active class to enabled toggles', () => {
    const toggles = factory().findAll('.toggle')
    expect(toggles[0].classes()).toContain('toggle--active')
    expect(toggles[1].classes()).not.toContain('toggle--active')
  })

  it('disables always-on toggles', () => {
    const w = factory({ isAlwaysOn: (_k: string) => true })
    const checkboxes = w.findAll('.toggle__input')
    expect((checkboxes[0].element as HTMLInputElement).disabled).toBe(true)
  })

  it('applies disabled class to always-on toggles', () => {
    const w = factory({ isAlwaysOn: (k: string) => k === 'lead_notification' })
    expect(w.findAll('.toggle')[0].classes()).toContain('toggle--disabled')
  })

  it('disables all checkboxes when saving', () => {
    const w = factory({ saving: true })
    const checkboxes = w.findAll('.toggle__input')
    checkboxes.forEach(cb => {
      expect((cb.element as HTMLInputElement).disabled).toBe(true)
    })
  })

  it('emits toggle on checkbox change', async () => {
    const w = factory()
    await w.findAll('.toggle__input')[1].trigger('change')
    expect(w.emitted('toggle')?.[0]).toEqual(['vehicle_published'])
  })
})
