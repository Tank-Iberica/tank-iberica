/**
 * Tests for app/components/admin/dashboard/Notifications.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import Notifications from '../../../app/components/admin/dashboard/Notifications.vue'

const baseStats = {
  anunciantes: 10,
  anunciantesPending: 2,
  solicitantes: 8,
  solicitantesPending: 1,
  comentarios: 30,
  comentariosPending: 3,
  chats: 15,
  chatsUnread: 5,
  suscripciones: 20,
  suscripcionesPending: 0,
}

const baseMatches = [
  { id: '1', type: 'demand', typeLabel: 'Demanda', description: 'Volvo FH 500', link: '/admin/demandas/1' },
  { id: '2', type: 'vehicle', typeLabel: 'Vehículo', description: 'Scania R450', link: '/admin/vehiculos/2' },
]

describe('AdminNotifications', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(Notifications, {
      props: {
        stats: { ...baseStats },
        totalPending: 11,
        matches: [...baseMatches],
        ...overrides,
      },
      global: {
        stubs: { NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] }, Transition: true },
      },
    })

  it('renders notifications grid', () => {
    expect(factory().find('.notifications-grid').exists()).toBe(true)
  })

  it('renders 5 notification cards', () => {
    expect(factory().findAll('.notification-card')).toHaveLength(5)
  })

  it('shows notification values', () => {
    const cards = factory().findAll('.notification-card')
    expect(cards[0].find('.notification-value').text()).toBe('10')
    expect(cards[1].find('.notification-value').text()).toBe('8')
  })

  it('shows pending badges when count > 0', () => {
    const w = factory()
    const badges = w.findAll('.notification-badge')
    // anunciantesPending=2, solicitantesPending=1, comentariosPending=3, chatsUnread=5 → 4 badges
    expect(badges.length).toBe(4)
  })

  it('no badge for suscripciones (pending=0)', () => {
    const cards = factory().findAll('.notification-card')
    const suscCard = cards[4]
    expect(suscCard.find('.notification-badge').exists()).toBe(false)
  })

  it('applies has-pending class when pending > 0', () => {
    const cards = factory().findAll('.notification-card')
    expect(cards[0].classes()).toContain('has-pending') // anunciantesPending=2
    expect(cards[4].classes()).not.toContain('has-pending') // suscripcionesPending=0
  })

  it('renders pending items list', () => {
    const w = factory()
    const items = w.findAll('.pending-item')
    expect(items.length).toBe(4) // anunciantes, solicitantes, comentarios, chats
  })

  it('shows empty pending message when totalPending=0', () => {
    const w = factory({
      stats: {
        ...baseStats,
        anunciantesPending: 0,
        solicitantesPending: 0,
        comentariosPending: 0,
        chatsUnread: 0,
      },
      totalPending: 0,
    })
    expect(w.find('.pending-empty').exists()).toBe(true)
  })

  it('renders matches', () => {
    const items = factory().findAll('.match-item')
    expect(items).toHaveLength(2)
  })

  it('shows match type with correct class', () => {
    const types = factory().findAll('.match-type')
    expect(types[0].classes()).toContain('demand')
    expect(types[1].classes()).toContain('vehicle')
  })

  it('shows empty matches message when no matches', () => {
    const w = factory({ matches: [] })
    expect(w.find('.matches-empty').exists()).toBe(true)
  })

  it('shows match descriptions', () => {
    const items = factory().findAll('.match-text')
    expect(items[0].text()).toBe('Volvo FH 500')
    expect(items[1].text()).toBe('Scania R450')
  })

  it('shows section titles', () => {
    const titles = factory().findAll('.section-title')
    expect(titles.length).toBe(2)
    expect(titles[0].text()).toContain('admin.notifications.pendingTitle')
    expect(titles[1].text()).toContain('admin.notifications.matchesTitle')
  })
})
