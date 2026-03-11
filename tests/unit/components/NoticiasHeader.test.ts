/**
 * Tests for app/components/admin/noticias/index/NoticiasHeader.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import NoticiasHeader from '../../../app/components/admin/noticias/index/NoticiasHeader.vue'

describe('NoticiasHeader', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(NoticiasHeader, {
      props: {
        total: 42,
        ...overrides,
      },
    })

  it('renders header', () => {
    expect(factory().find('.page-header').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h1').text()).toBe('Noticias')
  })

  it('shows total count badge', () => {
    expect(factory().find('.count-badge').text()).toBe('42')
  })

  it('renders new article link', () => {
    expect(factory().html()).toContain('/admin/noticias/nuevo')
  })

  it('shows zero count', () => {
    const w = factory({ total: 0 })
    expect(w.find('.count-badge').text()).toBe('0')
  })
})
