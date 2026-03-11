/**
 * Tests for app/components/admin/dealer/DealerNotificationsSection.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import DealerNotificationsSection from '../../../app/components/admin/dealer/DealerNotificationsSection.vue'

describe('DealerNotificationsSection', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DealerNotificationsSection, {
      props: {
        emailOnLead: true,
        emailOnSale: false,
        emailWeeklyStats: true,
        emailAuctionUpdates: false,
        ...overrides,
      },
    })

  it('renders config card', () => {
    expect(factory().find('.config-card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.card-title').text()).toBe('Notificaciones')
  })

  it('shows subtitle', () => {
    expect(factory().find('.card-subtitle').text()).toContain('notificaciones por email')
  })

  it('renders 4 notification items', () => {
    expect(factory().findAll('.notification-item')).toHaveLength(4)
  })

  it('shows notification labels', () => {
    const labels = factory().findAll('.notification-text strong')
    expect(labels[0].text()).toBe('Nuevo lead')
    expect(labels[1].text()).toBe('Nueva venta')
    expect(labels[2].text()).toBe('Resumen semanal')
    expect(labels[3].text()).toBe('Actualizaciones de subastas')
  })

  it('checkbox reflects emailOnLead state', () => {
    const checkboxes = factory().findAll('input[type="checkbox"]')
    expect((checkboxes[0].element as HTMLInputElement).checked).toBe(true)
  })

  it('checkbox reflects emailOnSale state', () => {
    const checkboxes = factory().findAll('input[type="checkbox"]')
    expect((checkboxes[1].element as HTMLInputElement).checked).toBe(false)
  })

  it('renders descriptions', () => {
    const descs = factory().findAll('.notification-text span')
    expect(descs[0].text()).toContain('cliente solicita')
  })
})
