/**
 * Tests for app/components/admin/noticias/AdminNewsRelatedCategories.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminNewsRelatedCategories from '../../../app/components/admin/noticias/AdminNewsRelatedCategories.vue'

describe('AdminNewsRelatedCategories', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminNewsRelatedCategories, {
      props: {
        relatedCategories: ['Camiones', 'Furgonetas'],
        relatedCategoryInput: '',
        ...overrides,
      },
    })

  it('renders section', () => {
    expect(factory().find('.section').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.section-title').text()).toBe('Categorias relacionadas')
  })

  it('renders input row', () => {
    expect(factory().find('.hashtag-input-row').exists()).toBe(true)
  })

  it('renders category chips', () => {
    const chips = factory().findAll('.hashtag-chip')
    expect(chips).toHaveLength(2)
    expect(chips[0].text()).toContain('Camiones')
    expect(chips[1].text()).toContain('Furgonetas')
  })

  it('hides chip list when empty', () => {
    expect(factory({ relatedCategories: [] }).find('.hashtag-list').exists()).toBe(false)
  })

  it('handles null relatedCategories', () => {
    expect(factory({ relatedCategories: null }).find('.hashtag-list').exists()).toBe(false)
  })

  it('emits update:relatedCategoryInput on input', async () => {
    const w = factory()
    const input = w.find('.input')
    Object.defineProperty(input.element, 'value', { value: 'nuevo', writable: true })
    await input.trigger('input')
    expect(w.emitted('update:relatedCategoryInput')![0]).toEqual(['nuevo'])
  })

  it('emits addCategory on button click', async () => {
    const w = factory()
    await w.find('.btn').trigger('click')
    expect(w.emitted('addCategory')).toBeTruthy()
  })

  it('emits removeCategory on chip remove click', async () => {
    const w = factory()
    await w.findAll('.chip-remove')[0].trigger('click')
    expect(w.emitted('removeCategory')![0]).toEqual(['Camiones'])
  })

  it('shows add button text', () => {
    expect(factory().find('.btn').text()).toContain('Anadir')
  })

  it('emits addCategory on enter key', async () => {
    const w = factory()
    await w.find('input').trigger('keydown.enter')
    expect(w.emitted('addCategory')).toBeTruthy()
  })
})
