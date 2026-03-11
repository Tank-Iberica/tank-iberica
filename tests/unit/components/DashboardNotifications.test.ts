/**
 * Tests for app/components/admin/dashboard/Notifications.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

const NuxtLinkStub = { template: '<a :href="to" :class="$attrs.class"><slot /></a>', props: ['to'] }

import Notifications from '../../../app/components/admin/dashboard/Notifications.vue'

describe('Notifications', () => {
  const stats = {
    anunciantes: 10, anunciantesPending: 2,
    solicitantes: 5, solicitantesPending: 0,
    comentarios: 20, comentariosPending: 3,
    chats: 8, chatsUnread: 1,
    suscripciones: 15, suscripcionesPending: 0,
  }
  const matches = [
    { id: 'm1', type: 'demand', typeLabel: 'Demanda', description: 'Camion test', link: '/admin/demandas/m1' },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(Notifications, {
      props: { stats, totalPending: 6, matches, ...overrides },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    })

  it('renders notifications grid', () => {
    expect(factory().find('.notifications-grid').exists()).toBe(true)
  })

  it('renders 5 notification cards', () => {
    expect(factory().findAll('.notification-card')).toHaveLength(5)
  })

  it('shows pending badge when count > 0', () => {
    const badges = factory().findAll('.notification-badge')
    expect(badges.length).toBeGreaterThanOrEqual(2) // anunciantes + comentarios + chats
  })

  it('adds has-pending class for cards with pending', () => {
    const cards = factory().findAll('.notification-card')
    expect(cards[0].classes()).toContain('has-pending') // anunciantes
    expect(cards[1].classes()).not.toContain('has-pending') // solicitantes
  })

  it('shows notification values', () => {
    const values = factory().findAll('.notification-value')
    expect(values[0].text()).toBe('10')
  })

  it('renders pending items section', () => {
    expect(factory().find('.pending-list').exists()).toBe(true)
  })

  it('shows pending items for counts > 0', () => {
    expect(factory().findAll('.pending-item').length).toBeGreaterThanOrEqual(3)
  })

  it('shows empty state when no pending', () => {
    const zeroPending = {
      ...stats, anunciantesPending: 0, comentariosPending: 0, chatsUnread: 0,
    }
    const w = factory({ stats: zeroPending, totalPending: 0 })
    expect(w.find('.pending-empty').exists()).toBe(true)
  })

  it('renders matches', () => {
    expect(factory().findAll('.match-item')).toHaveLength(1)
  })

  it('shows empty matches when none', () => {
    const w = factory({ matches: [] })
    expect(w.find('.matches-empty').exists()).toBe(true)
  })
})
