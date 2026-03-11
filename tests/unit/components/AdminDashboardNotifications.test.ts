/**
 * Tests for app/components/admin/dashboard/Notifications.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import Notifications from '../../../app/components/admin/dashboard/Notifications.vue'

const baseStats = {
  anunciantes: 10,
  anunciantesPending: 2,
  solicitantes: 5,
  solicitantesPending: 0,
  comentarios: 20,
  comentariosPending: 3,
  chats: 8,
  chatsUnread: 1,
  suscripciones: 4,
  suscripcionesPending: 0,
}

const baseMatches = [
  { id: 'm1', type: 'demand', typeLabel: 'Demanda', description: 'Camión MAN', link: '/admin/solicitantes/m1' },
  { id: 'm2', type: 'vehicle', typeLabel: 'Vehículo', description: 'Scania R450', link: '/admin/vehiculos/m2' },
]

describe('AdminDashboardNotifications', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(Notifications, {
      props: {
        stats: { ...baseStats },
        totalPending: 6,
        matches: [...baseMatches],
        ...overrides,
      },
      global: {
        stubs: { NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] } },
      },
    })

  it('renders notifications grid', () => {
    expect(factory().find('.notifications-grid').exists()).toBe(true)
  })

  it('shows 5 notification cards', () => {
    expect(factory().findAll('.notification-card')).toHaveLength(5)
  })

  it('shows notification-badge for pending anunciantes', () => {
    const badges = factory().findAll('.notification-badge')
    expect(badges.length).toBeGreaterThan(0)
    expect(badges[0].text()).toBe('2')
  })

  it('adds has-pending class when pending > 0', () => {
    const cards = factory().findAll('.notification-card')
    // anunciantes: pending=2
    expect(cards[0].classes()).toContain('has-pending')
    // solicitantes: pending=0
    expect(cards[1].classes()).not.toContain('has-pending')
  })

  it('shows notification labels', () => {
    const labels = factory().findAll('.notification-label')
    expect(labels[0].text()).toBe('admin.notifications.anunciantesLabel')
    expect(labels[1].text()).toBe('admin.notifications.solicitantesLabel')
    expect(labels[2].text()).toBe('admin.notifications.comentariosLabel')
    expect(labels[3].text()).toBe('admin.notifications.chatsLabel')
    expect(labels[4].text()).toBe('admin.notifications.suscripcionesLabel')
  })

  it('shows notification values', () => {
    const values = factory().findAll('.notification-value')
    expect(values[0].text()).toBe('10')
    expect(values[3].text()).toBe('8')
  })

  it('shows pending items section', () => {
    const pending = factory().findAll('.pending-item')
    // anunciantesPending=2, comentariosPending=3, chatsUnread=1
    expect(pending).toHaveLength(3)
  })

  it('shows pending-empty when totalPending=0', () => {
    const w = factory({
      stats: { ...baseStats, anunciantesPending: 0, comentariosPending: 0, chatsUnread: 0 },
      totalPending: 0,
    })
    expect(w.find('.pending-empty').exists()).toBe(true)
    expect(w.find('.pending-empty').text()).toContain('admin.notifications.allUpToDate')
  })

  it('pluralizes pending text correctly (singular)', () => {
    const w = factory({
      stats: { ...baseStats, anunciantesPending: 1, comentariosPending: 0, chatsUnread: 0 },
      totalPending: 1,
    })
    const item = w.find('.pending-item')
    expect(item.text()).toContain('1 anunciante por revisar')
    expect(item.text()).not.toContain('anunciantes')
  })

  it('pluralizes pending text correctly (plural)', () => {
    const pending = factory().findAll('.pending-item')
    expect(pending[0].text()).toContain('2 anunciantes por revisar')
  })

  it('shows matches list', () => {
    const items = factory().findAll('.match-item')
    expect(items).toHaveLength(2)
  })

  it('shows match type and description', () => {
    const items = factory().findAll('.match-item')
    expect(items[0].find('.match-type').text()).toBe('Demanda')
    expect(items[0].find('.match-text').text()).toBe('Camión MAN')
  })

  it('shows matches-empty when no matches', () => {
    const w = factory({ matches: [] })
    expect(w.find('.matches-empty').exists()).toBe(true)
    expect(w.find('.matches-empty').text()).toContain('admin.notifications.noMatches')
  })

  it('links to correct admin pages', () => {
    const cards = factory().findAll('.notification-card')
    expect(cards[0].attributes('href')).toBe('/admin/anunciantes')
    expect(cards[3].attributes('href')).toBe('/admin/chats')
  })

  it('applies type class to match-type', () => {
    const items = factory().findAll('.match-item')
    expect(items[0].find('.match-type').classes()).toContain('demand')
    expect(items[1].find('.match-type').classes()).toContain('vehicle')
  })
})
