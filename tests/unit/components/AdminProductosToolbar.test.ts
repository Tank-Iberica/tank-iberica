/**
 * Tests for app/components/admin/productos/AdminProductosToolbar.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import AdminProductosToolbar from '../../../app/components/admin/productos/AdminProductosToolbar.vue'

const baseGroups = [
  { id: 'core', name: 'Core', icon: '📦', columns: ['brand'], active: true, required: true },
  { id: 'pricing', name: 'Precios', icon: '💰', columns: ['price'], active: true },
  { id: 'seo', name: 'SEO', icon: '🔍', columns: ['seo'], active: false },
]

describe('AdminProductosToolbar', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminProductosToolbar, {
      props: {
        columnGroups: baseGroups,
        driveConnected: false,
        driveLoading: false,
        selectedCount: 0,
        isFullscreen: false,
        ...overrides,
      },
    })

  it('renders toolbar section', () => {
    expect(factory().find('.toolbar-section').exists()).toBe(true)
  })

  it('shows column toggles label', () => {
    expect(factory().find('.toggles-label').text()).toBe('Columnas:')
  })

  it('renders only non-required column toggle buttons', () => {
    // core is required, pricing and seo are not
    expect(factory().findAll('.column-toggle')).toHaveLength(2)
  })

  it('marks active toggle with active class', () => {
    const toggles = factory().findAll('.column-toggle')
    expect(toggles[0].classes()).toContain('active') // pricing active
    expect(toggles[1].classes()).not.toContain('active') // seo not active
  })

  it('emits toggle-group on column toggle click', async () => {
    const w = factory()
    await w.findAll('.column-toggle')[1].trigger('click')
    expect(w.emitted('toggle-group')?.[0]).toEqual(['seo'])
  })

  it('shows Drive button', () => {
    expect(factory().find('.btn-tool').text()).toContain('Drive')
  })

  it('shows green Drive icon when connected', () => {
    const w = factory({ driveConnected: true })
    expect(w.find('.btn-tool.drive-on').exists()).toBe(true)
  })

  it('disables Drive button when loading', () => {
    const w = factory({ driveLoading: true })
    expect(w.findAll('.btn-tool')[0].attributes('disabled')).toBeDefined()
  })

  it('emits connect-drive on Drive click when not connected', async () => {
    const w = factory()
    await w.findAll('.btn-tool')[0].trigger('click')
    expect(w.emitted('connect-drive')).toBeTruthy()
  })

  it('emits open-config on config click', async () => {
    const w = factory()
    await w.findAll('.btn-tool')[1].trigger('click')
    expect(w.emitted('open-config')).toBeTruthy()
  })

  it('emits open-export on export click', async () => {
    const w = factory()
    await w.findAll('.btn-tool')[2].trigger('click')
    expect(w.emitted('open-export')).toBeTruthy()
  })

  it('shows badge with selectedCount when > 0', () => {
    const w = factory({ selectedCount: 3 })
    expect(w.find('.badge').text()).toBe('3')
  })

  it('hides badge when selectedCount is 0', () => {
    expect(factory().find('.badge').exists()).toBe(false)
  })

  it('emits toggle-fullscreen on fullscreen click', async () => {
    const w = factory()
    await w.findAll('.btn-tool')[3].trigger('click')
    expect(w.emitted('toggle-fullscreen')).toBeTruthy()
  })

  it('shows exit icon when fullscreen', () => {
    const w = factory({ isFullscreen: true })
    const btns = w.findAll('.btn-tool')
    expect(btns[3].text()).toContain('✕')
  })
})
