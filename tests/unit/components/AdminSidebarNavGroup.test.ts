/**
 * Tests for app/components/admin/layout/AdminSidebarNavGroup.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import AdminSidebarNavGroup from '../../../app/components/admin/layout/AdminSidebarNavGroup.vue'

const baseItems = [
  { to: '/admin/vehiculos', label: 'Vehículos', badge: 3 },
  { to: '/admin/categorias', label: 'Categorías', badge: 0 },
]

describe('AdminSidebarNavGroup', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminSidebarNavGroup, {
      props: {
        label: 'Catálogo',
        collapsed: false,
        isOpen: false,
        badge: 3,
        isActiveGroup: false,
        items: [...baseItems],
        isActiveFn: (path: string) => path === '/admin/vehiculos',
        ...overrides,
      },
      global: {
        stubs: { NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] } },
      },
    })

  it('renders nav group', () => {
    expect(factory().find('.nav-group').exists()).toBe(true)
  })

  it('shows label when not collapsed', () => {
    expect(factory().find('.nav-label').text()).toBe('Catálogo')
  })

  it('hides label when collapsed', () => {
    const w = factory({ collapsed: true })
    expect(w.find('.nav-label').exists()).toBe(false)
  })

  it('shows badge when not open and badge > 0', () => {
    expect(factory().find('.badge').text()).toBe('3')
  })

  it('hides header badge when open', () => {
    const w = factory({ isOpen: true })
    // Header badge hides when open; item badges still show
    const headerBadge = w.find('.nav-group-header > .badge')
    expect(headerBadge.exists()).toBe(false)
  })

  it('shows badge dot when collapsed and badge > 0', () => {
    const w = factory({ collapsed: true })
    expect(w.find('.badge-dot').exists()).toBe(true)
  })

  it('shows chevron when not collapsed', () => {
    expect(factory().find('.nav-chevron').exists()).toBe(true)
  })

  it('hides chevron when collapsed', () => {
    expect(factory({ collapsed: true }).find('.nav-chevron').exists()).toBe(false)
  })

  it('adds open class to chevron when open', () => {
    const w = factory({ isOpen: true })
    expect(w.find('.nav-chevron').classes()).toContain('open')
  })

  it('emits toggle on header click when not collapsed', async () => {
    const w = factory()
    await w.find('.nav-group-header').trigger('click')
    expect(w.emitted('toggle')).toBeTruthy()
  })

  it('emits openPopover on header click when collapsed', async () => {
    const w = factory({ collapsed: true })
    await w.find('.nav-group-header').trigger('click')
    expect(w.emitted('openPopover')).toBeTruthy()
  })

  it('shows items when open and not collapsed', () => {
    const w = factory({ isOpen: true })
    const items = w.findAll('.nav-item.sub')
    expect(items).toHaveLength(2)
  })

  it('applies active class to active items', () => {
    const w = factory({ isOpen: true })
    const items = w.findAll('.nav-item.sub')
    expect(items[0].classes()).toContain('active')
    expect(items[1].classes()).not.toContain('active')
  })

  it('shows item badges', () => {
    const w = factory({ isOpen: true })
    const badges = w.findAll('.nav-group-items .badge')
    expect(badges).toHaveLength(1) // Only items with badge > 0
    expect(badges[0].text()).toBe('3')
  })

  it('applies active class to group header when isActiveGroup', () => {
    const w = factory({ isActiveGroup: true })
    expect(w.find('.nav-group-header').classes()).toContain('active')
  })
})
