/**
 * Tests for app/components/admin/comentarios/FiltersBar.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import FiltersBar from '../../../app/components/admin/comentarios/FiltersBar.vue'

const baseTabs = [
  { label: 'Todos', value: null, color: '#23424a' },
  { label: 'Pendiente', value: 'pending', color: '#f59e0b' },
  { label: 'Aprobado', value: 'approved', color: '#22c55e' },
  { label: 'Rechazado', value: 'rejected', color: '#ef4444' },
]

describe('ComentariosFiltersBar', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(FiltersBar, {
      props: {
        activeFilter: null,
        searchQuery: '',
        statusTabs: [...baseTabs],
        ...overrides,
      },
    })

  it('renders filters bar', () => {
    expect(factory().find('.filters-bar').exists()).toBe(true)
  })

  it('renders all status buttons', () => {
    expect(factory().findAll('.filter-btn')).toHaveLength(4)
  })

  it('shows tab labels', () => {
    const btns = factory().findAll('.filter-btn')
    expect(btns[0].text()).toBe('Todos')
    expect(btns[1].text()).toBe('Pendiente')
  })

  it('applies active class to matching filter', () => {
    const w = factory({ activeFilter: 'pending' })
    const btns = w.findAll('.filter-btn')
    expect(btns[1].classes()).toContain('active')
    expect(btns[0].classes()).not.toContain('active')
  })

  it('applies inline style when active with color', () => {
    const w = factory({ activeFilter: 'pending' })
    const btn = w.findAll('.filter-btn')[1]
    expect(btn.attributes('style')).toContain('#f59e0b')
  })

  it('emits update:activeFilter on button click', async () => {
    const w = factory()
    await w.findAll('.filter-btn')[2].trigger('click')
    expect(w.emitted('update:activeFilter')).toBeTruthy()
    expect(w.emitted('update:activeFilter')![0]).toEqual(['approved'])
  })

  it('renders search input', () => {
    expect(factory().find('.filter-search').exists()).toBe(true)
  })

  it('shows search query value', () => {
    const w = factory({ searchQuery: 'test' })
    expect((w.find('.filter-search').element as HTMLInputElement).value).toBe('test')
  })

  it('emits update:searchQuery on input', async () => {
    const w = factory()
    const input = w.find('.filter-search')
    const el = input.element as HTMLInputElement
    Object.defineProperty(el, 'value', { value: 'buscar', writable: true })
    await input.trigger('input')
    expect(w.emitted('update:searchQuery')).toBeTruthy()
  })
})
