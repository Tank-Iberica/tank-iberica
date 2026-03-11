/**
 * Tests for app/components/admin/noticias/AdminNewsHashtags.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminNewsHashtags from '../../../app/components/admin/noticias/AdminNewsHashtags.vue'

describe('AdminNewsHashtags', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminNewsHashtags, {
      props: {
        hashtags: ['camiones', 'industriales'],
        hashtagInput: '',
        ...overrides,
      },
    })

  it('renders section', () => {
    expect(factory().find('.section').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.section-title').text()).toBe('Etiquetas')
  })

  it('renders input row', () => {
    expect(factory().find('.hashtag-input-row').exists()).toBe(true)
  })

  it('renders hashtag chips', () => {
    const chips = factory().findAll('.hashtag-chip')
    expect(chips).toHaveLength(2)
    expect(chips[0].text()).toContain('#camiones')
    expect(chips[1].text()).toContain('#industriales')
  })

  it('hides chip list when empty', () => {
    expect(factory({ hashtags: [] }).find('.hashtag-list').exists()).toBe(false)
  })

  it('emits update:hashtagInput on input', async () => {
    const w = factory()
    const input = w.find('.input')
    Object.defineProperty(input.element, 'value', { value: 'nuevo', writable: true })
    await input.trigger('input')
    expect(w.emitted('update:hashtagInput')![0]).toEqual(['nuevo'])
  })

  it('emits addHashtag on button click', async () => {
    const w = factory()
    await w.find('.btn').trigger('click')
    expect(w.emitted('addHashtag')).toBeTruthy()
  })

  it('emits removeHashtag on chip remove click', async () => {
    const w = factory()
    await w.findAll('.chip-remove')[0].trigger('click')
    expect(w.emitted('removeHashtag')![0]).toEqual(['camiones'])
  })

  it('shows add button text', () => {
    expect(factory().find('.btn').text()).toContain('Anadir')
  })

  it('emits addHashtag on enter key', async () => {
    const w = factory()
    await w.find('input').trigger('keydown.enter')
    expect(w.emitted('addHashtag')).toBeTruthy()
  })
})
