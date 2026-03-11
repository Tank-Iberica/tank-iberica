/**
 * Tests for app/components/admin/usuarios/AdminUsuariosStatsGrid.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminUsuariosStatsGrid from '../../../app/components/admin/usuarios/AdminUsuariosStatsGrid.vue'

describe('AdminUsuariosStatsGrid', () => {
  const stats = { total: 100, users: 80, admins: 5, visitors: 15 }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminUsuariosStatsGrid, {
      props: {
        stats,
        ...overrides,
      },
    })

  it('renders stats grid', () => {
    expect(factory().find('.stats-grid').exists()).toBe(true)
  })

  it('renders 4 stat cards', () => {
    expect(factory().findAll('.stat-card')).toHaveLength(4)
  })

  it('shows total value', () => {
    const cards = factory().findAll('.stat-card')
    expect(cards[0].find('.stat-value').text()).toBe('100')
  })

  it('shows users value', () => {
    const cards = factory().findAll('.stat-card')
    expect(cards[1].find('.stat-value').text()).toBe('80')
  })

  it('shows admins value', () => {
    const cards = factory().findAll('.stat-card')
    expect(cards[2].find('.stat-value').text()).toBe('5')
  })

  it('shows visitors value', () => {
    const cards = factory().findAll('.stat-card')
    expect(cards[3].find('.stat-value').text()).toBe('15')
  })

  it('shows labels', () => {
    const text = factory().text()
    expect(text).toContain('common.total')
    expect(text).toContain('Usuarios')
    expect(text).toContain('Admins')
    expect(text).toContain('Visitantes')
  })
})
