/**
 * Tests for app/components/perfil/comparador/ComparadorContent.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import ComparadorContent from '../../../app/components/perfil/comparador/ComparadorContent.vue'

describe('ComparadorContent', () => {
  const vehicles = [
    {
      id: 'v-1',
      slug: 'volvo-fh16',
      brand: 'Volvo',
      model: 'FH16',
      price: 85000,
      category: 'Camion',
      main_image_url: 'https://example.com/volvo.jpg',
      year: 2023,
      km: 50000,
    },
    {
      id: 'v-2',
      slug: 'scania-r450',
      brand: 'Scania',
      model: 'R450',
      price: 72000,
      category: null,
      main_image_url: null,
      year: 2022,
      km: 80000,
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ComparadorContent, {
      props: {
        vehicles,
        draftNotes: { 'v-1': 'Good truck', 'v-2': '' },
        draftRatings: { 'v-1': 4, 'v-2': 0 },
        specKeys: ['year', 'km', 'price'],
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: {
          NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
        },
      },
    })

  it('renders cmp content', () => {
    expect(factory().find('.cmp-content').exists()).toBe(true)
  })

  it('renders vehicle cards', () => {
    expect(factory().findAll('.v-card')).toHaveLength(2)
  })

  it('shows vehicle name', () => {
    expect(factory().find('.card-name').text()).toBe('Volvo FH16')
  })

  it('shows vehicle price', () => {
    expect(factory().find('.card-price').text()).toContain('85')
  })

  it('shows category badge when present', () => {
    const cards = factory().findAll('.v-card')
    expect(cards[0].find('.card-badge').text()).toBe('Camion')
  })

  it('hides category badge when null', () => {
    const cards = factory().findAll('.v-card')
    expect(cards[1].find('.card-badge').exists()).toBe(false)
  })

  it('shows image when main_image_url set', () => {
    const cards = factory().findAll('.v-card')
    expect(cards[0].find('.card-img img').exists()).toBe(true)
  })

  it('shows placeholder when no image', () => {
    const cards = factory().findAll('.v-card')
    expect(cards[1].find('.card-ph').text()).toBe('S')
  })

  it('shows remove buttons', () => {
    expect(factory().findAll('.btn-rm')).toHaveLength(2)
  })

  it('emits remove on remove click', async () => {
    const w = factory()
    await w.find('.btn-rm').trigger('click')
    expect(w.emitted('remove')?.[0]?.[0]).toBe('v-1')
  })

  // --- Specs table ---
  it('shows specs section title', () => {
    const titles = factory().findAll('.sec-title')
    expect(titles[0].text()).toBe('comparator.specs')
  })

  it('renders spec rows', () => {
    expect(factory().findAll('.spec-tbl tr')).toHaveLength(3)
  })

  it('renders spec header cells', () => {
    const firstRow = factory().find('.spec-tbl tr')
    expect(firstRow.find('th').text()).toBe('comparator.spec.year')
  })

  it('renders spec value cells per vehicle', () => {
    const firstRow = factory().find('.spec-tbl tr')
    expect(firstRow.findAll('td')).toHaveLength(2)
  })

  // --- Ratings ---
  it('shows rating section title', () => {
    const titles = factory().findAll('.sec-title')
    expect(titles[1].text()).toBe('comparator.rating')
  })

  it('renders rate cells per vehicle', () => {
    expect(factory().findAll('.rate-cell')).toHaveLength(2)
  })

  it('renders 5 star buttons per vehicle', () => {
    const firstCell = factory().findAll('.rate-cell')[0]
    expect(firstCell.findAll('.star-btn')).toHaveLength(5)
  })

  it('shows on class for rated stars', () => {
    const firstCell = factory().findAll('.rate-cell')[0]
    const stars = firstCell.findAll('.star-btn')
    // draftRatings['v-1'] = 4 → first 4 stars should have .on
    expect(stars[0].classes()).toContain('on')
    expect(stars[3].classes()).toContain('on')
    expect(stars[4].classes()).not.toContain('on')
  })

  it('emits set-rating on star click', async () => {
    const w = factory()
    const firstCell = w.findAll('.rate-cell')[0]
    await firstCell.findAll('.star-btn')[2].trigger('click')
    expect(w.emitted('set-rating')?.[0]).toEqual(['v-1', 3])
  })

  // --- Notes ---
  it('shows notes section title', () => {
    const titles = factory().findAll('.sec-title')
    expect(titles[2].text()).toBe('comparator.notes')
  })

  it('renders note cells per vehicle', () => {
    expect(factory().findAll('.note-cell')).toHaveLength(2)
  })

  it('shows note textarea with draft value', () => {
    const textarea = factory().find('#note-v-1')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('Good truck')
  })

  it('shows save button per note', () => {
    expect(factory().findAll('.btn-fill')).toHaveLength(2)
  })

  it('emits save-note on save click', async () => {
    const w = factory()
    await w.find('.btn-fill').trigger('click')
    expect(w.emitted('save-note')?.[0]?.[0]).toBe('v-1')
  })
})
