/**
 * Tests for app/components/dashboard/herramientas/ToolCard.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ToolCard from '../../../app/components/dashboard/herramientas/ToolCard.vue'

describe('ToolCard', () => {
  const baseTool = {
    key: 'invoices',
    titleKey: 'dashboard.tools.invoices.title',
    descriptionKey: 'dashboard.tools.invoices.description',
    icon: 'receipt',
    to: '/dashboard/facturas',
    requiredPlan: 'free' as const,
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ToolCard, {
      props: {
        tool: baseTool,
        locked: false,
        ...overrides,
      },
      global: {
        mocks: { $t: (key: string) => key },
        stubs: { NuxtLink: { template: '<a :href="to" :class="$attrs.class"><slot /></a>', props: ['to'] } },
      },
    })

  it('renders tool-card link', () => {
    const w = factory()
    expect(w.find('.tool-card').exists()).toBe(true)
  })

  it('links to tool.to path', () => {
    const w = factory()
    expect(w.find('.tool-card').attributes('href')).toBe('/dashboard/facturas')
  })

  it('shows tool title', () => {
    const w = factory()
    expect(w.find('.tool-title').text()).toBe('dashboard.tools.invoices.title')
  })

  it('shows tool description', () => {
    const w = factory()
    expect(w.find('.tool-description').text()).toBe('dashboard.tools.invoices.description')
  })

  it('shows icon SVG for receipt', () => {
    const w = factory()
    expect(w.find('.tool-icon svg').exists()).toBe(true)
  })

  it('shows free badge when requiredPlan is free', () => {
    const w = factory()
    expect(w.find('.badge-free').exists()).toBe(true)
    expect(w.find('.badge-free').text()).toBe('dashboard.tools.free')
  })

  it('shows basic badge when requiredPlan is basic', () => {
    const w = factory({ tool: { ...baseTool, requiredPlan: 'basic' } })
    expect(w.find('.badge-basic').exists()).toBe(true)
    expect(w.find('.badge-basic').text()).toBe('dashboard.tools.basic')
  })

  it('shows premium badge when requiredPlan is premium', () => {
    const w = factory({ tool: { ...baseTool, requiredPlan: 'premium' } })
    expect(w.find('.badge-premium').exists()).toBe(true)
    expect(w.find('.badge-premium').text()).toBe('dashboard.tools.premium')
  })

  it('adds locked class when locked', () => {
    const w = factory({ locked: true })
    expect(w.find('.tool-card').classes()).toContain('locked')
  })

  it('shows locked badge with lock icon when locked', () => {
    const w = factory({ locked: true })
    expect(w.find('.badge-locked').exists()).toBe(true)
    expect(w.find('.lock-icon').exists()).toBe(true)
  })

  it('does not show locked badge when not locked', () => {
    const w = factory({ locked: false })
    expect(w.find('.badge-locked').exists()).toBe(false)
  })

  it('renders different icon for file-text', () => {
    const w = factory({ tool: { ...baseTool, icon: 'file-text' } })
    expect(w.find('.tool-icon svg').exists()).toBe(true)
  })

  it('renders different icon for wrench', () => {
    const w = factory({ tool: { ...baseTool, icon: 'wrench' } })
    expect(w.find('.tool-icon svg').exists()).toBe(true)
  })

  it('shows raw plan name for unknown plan type', () => {
    const w = factory({ tool: { ...baseTool, requiredPlan: 'enterprise' }, locked: false })
    expect(w.text()).toContain('enterprise')
  })
})
