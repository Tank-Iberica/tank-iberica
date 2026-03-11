/**
 * Tests for app/components/admin/layout/AdminSidebarPopover.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import AdminSidebarPopover from '../../../app/components/admin/layout/AdminSidebarPopover.vue'

const basePopover = {
  show: true,
  top: 100,
  left: 60,
  title: 'Catálogo',
  items: [
    { to: '/admin/vehiculos', label: 'Vehículos', badge: 3 },
    { to: '/admin/categorias', label: 'Categorías', badge: 0 },
  ],
}

describe('AdminSidebarPopover', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminSidebarPopover, {
      props: {
        popover: { ...basePopover },
        isActiveFn: (path: string) => path === '/admin/vehiculos',
        ...overrides,
      },
      global: {
        stubs: {
          Teleport: true,
          Transition: true,
          NuxtLink: { template: '<a :href="to" @click="$emit(\'click\')"><slot /></a>', props: ['to'] },
        },
      },
    })

  it('renders popover when show=true', () => {
    expect(factory().find('.nav-popover').exists()).toBe(true)
  })

  it('does not render when show=false', () => {
    const w = factory({ popover: { ...basePopover, show: false } })
    expect(w.find('.nav-popover').exists()).toBe(false)
  })

  it('shows popover title', () => {
    expect(factory().find('.popover-title').text()).toBe('Catálogo')
  })

  it('renders items as links', () => {
    const items = factory().findAll('.popover-item')
    expect(items).toHaveLength(2)
  })

  it('shows item labels', () => {
    const items = factory().findAll('.popover-item')
    expect(items[0].text()).toContain('Vehículos')
    expect(items[1].text()).toContain('Categorías')
  })

  it('applies active class to active items', () => {
    const items = factory().findAll('.popover-item')
    expect(items[0].classes()).toContain('active')
    expect(items[1].classes()).not.toContain('active')
  })

  it('shows badge for items with badge > 0', () => {
    const badges = factory().findAll('.badge')
    expect(badges).toHaveLength(1)
    expect(badges[0].text()).toBe('3')
  })

  it('does not show badge for items with badge=0', () => {
    const w = factory({
      popover: {
        ...basePopover,
        items: [{ to: '/a', label: 'A', badge: 0 }],
      },
    })
    expect(w.findAll('.badge')).toHaveLength(0)
  })

  it('emits close on mouseleave', async () => {
    const w = factory()
    await w.find('.nav-popover').trigger('mouseleave')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on item click', async () => {
    const w = factory()
    await w.findAll('.popover-item')[0].trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('sets inline style from popover position', () => {
    const w = factory({ popover: { ...basePopover, top: 200, left: 80 } })
    const style = w.find('.nav-popover').attributes('style')
    expect(style).toContain('top: 200px')
    expect(style).toContain('left: 80px')
  })

  it('renders empty items list', () => {
    const w = factory({ popover: { ...basePopover, items: [] } })
    expect(w.findAll('.popover-item')).toHaveLength(0)
  })
})
