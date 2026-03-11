/**
 * Tests for app/components/admin/layout/AdminSidebar.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { ref } from 'vue'

const mockToggleDropdown = vi.fn()
const mockToggleGroup = vi.fn()
const mockHandleLogout = vi.fn()
const mockOpenPopover = vi.fn()
const mockClosePopover = vi.fn()
const mockIsActive = vi.fn().mockReturnValue(false)
const mockIsActiveGroup = vi.fn().mockReturnValue(false)

const sidebarState = {
  showDropdown: ref(false),
  toggleDropdown: mockToggleDropdown,
  openGroups: ref({
    config: false,
    catalog: false,
    finance: false,
    communication: false,
    users: false,
    brokerage: false,
  }),
  toggleGroup: mockToggleGroup,
  pendingCatalog: ref(0),
  pendingComunicacion: ref(0),
  pendingUsuarios: ref(0),
  pendingDeals: ref(0),
  infraAlertCount: ref(0),
  isActive: mockIsActive,
  isActiveGroup: mockIsActiveGroup,
  configItems: ref([]),
  catalogItems: ref([]),
  financeItems: ref([]),
  communicationItems: ref([]),
  usersItems: ref([]),
  brokerageItems: ref([]),
  popover: ref({ visible: false, group: '', x: 0, y: 0 }),
  openPopover: mockOpenPopover,
  closePopover: mockClosePopover,
  handleLogout: mockHandleLogout,
}

vi.mock('~/composables/admin/useAdminSidebar', () => ({
  useAdminSidebar: () => sidebarState,
}))

beforeAll(() => {
  vi.stubGlobal('ref', ref)
})

import AdminSidebar from '../../../app/components/admin/layout/AdminSidebar.vue'

const factory = (props = {}) =>
  shallowMount(AdminSidebar, {
    props: { collapsed: false, open: false, ...props },
    global: {
      mocks: { $t: (k: string) => k },
      stubs: {
        NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
        AdminLayoutAdminSidebarNavGroup: { template: '<div class="nav-group" />' },
        AdminLayoutAdminSidebarPopover: { template: '<div class="sidebar-popover" />' },
        Transition: { template: '<div><slot /></div>' },
      },
    },
  })

describe('AdminSidebar', () => {
  it('renders aside.admin-sidebar', () => {
    const w = factory()
    expect(w.find('.admin-sidebar').exists()).toBe(true)
  })

  it('applies collapsed class when collapsed is true', () => {
    const w = factory({ collapsed: true })
    expect(w.find('.admin-sidebar').classes()).toContain('collapsed')
  })

  it('applies open class when open is true', () => {
    const w = factory({ open: true })
    expect(w.find('.admin-sidebar').classes()).toContain('open')
  })

  it('shows company dropdown when not collapsed', () => {
    const w = factory({ collapsed: false })
    expect(w.find('.company-dropdown').exists()).toBe(true)
  })

  it('hides company dropdown when collapsed', () => {
    const w = factory({ collapsed: true })
    expect(w.find('.company-dropdown').exists()).toBe(false)
  })

  it('shows logo icon when collapsed', () => {
    const w = factory({ collapsed: true })
    expect(w.find('.logo-icon').exists()).toBe(true)
  })

  it('calls toggleDropdown on company button click', async () => {
    const w = factory()
    await w.find('.company-btn').trigger('click')
    expect(mockToggleDropdown).toHaveBeenCalled()
  })

  it('shows dropdown menu when showDropdown is true', () => {
    sidebarState.showDropdown.value = true
    const w = factory()
    expect(w.find('.dropdown-menu').exists()).toBe(true)
    sidebarState.showDropdown.value = false
  })

  it('hides dropdown menu when showDropdown is false', () => {
    sidebarState.showDropdown.value = false
    const w = factory()
    expect(w.find('.dropdown-menu').exists()).toBe(false)
  })

  it('calls handleLogout on logout button click', async () => {
    sidebarState.showDropdown.value = true
    const w = factory()
    await w.find('.dropdown-item').trigger('click')
    expect(mockHandleLogout).toHaveBeenCalled()
    sidebarState.showDropdown.value = false
  })

  it('emits close when close button is clicked', async () => {
    const w = factory({ collapsed: false })
    await w.find('.close-btn-mobile').trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('emits toggle-collapse when collapse button is clicked', async () => {
    const w = factory()
    await w.find('button[class="header-btn"]').trigger('click')
    expect(w.emitted('toggle-collapse')).toHaveLength(1)
  })

  it('shows nav link to /admin', () => {
    const w = factory()
    const links = w.findAll('a')
    const adminLink = links.find((l) => l.attributes('href') === '/admin')
    expect(adminLink).toBeTruthy()
  })

  it('renders six nav groups', () => {
    const w = factory()
    expect(w.findAll('.nav-group')).toHaveLength(6)
  })

  it('renders sidebar popover', () => {
    const w = factory()
    expect(w.find('.sidebar-popover').exists()).toBe(true)
  })

  it('shows infra alert badge when infraAlertCount > 0', () => {
    sidebarState.infraAlertCount.value = 3
    const w = factory()
    expect(w.find('.badge-dot').exists()).toBe(true)
    sidebarState.infraAlertCount.value = 0
  })

  it('hides infra alert badge when infraAlertCount is 0', () => {
    sidebarState.infraAlertCount.value = 0
    const w = factory()
    expect(w.find('.badge-dot').exists()).toBe(false)
  })

  it('shows Abrir sitio link', () => {
    const w = factory()
    const link = w.find('a[href="/"]')
    expect(link.exists()).toBe(true)
  })

  it('hides nav labels when collapsed', () => {
    const w = factory({ collapsed: true })
    expect(w.findAll('.nav-label')).toHaveLength(0)
  })

  it('shows nav labels when not collapsed', () => {
    const w = factory({ collapsed: false })
    expect(w.findAll('.nav-label').length).toBeGreaterThan(0)
  })
})
