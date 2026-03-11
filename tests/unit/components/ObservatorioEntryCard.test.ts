/**
 * Tests for app/components/dashboard/observatorio/ObservatorioEntryCard.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/shared/useListingUtils', () => ({
  formatPrice: (n: number) => `${n.toLocaleString()} €`,
}))

import ObservatorioEntryCard from '../../../app/components/dashboard/observatorio/ObservatorioEntryCard.vue'

describe('ObservatorioEntryCard', () => {
  const entry = {
    id: 'e-1',
    brand: 'Volvo',
    model: 'FH 500',
    year: 2022,
    price: 85000,
    location: 'León',
    notes: 'Buen estado general',
    url: 'https://example.com/listing',
    platform_id: 'p1',
    status: 'watching',
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ObservatorioEntryCard, {
      props: {
        entry,
        platformName: 'Wallapop',
        platformColor: '#13c1ac',
        statusClass: 'status-watching',
        isConfirmingDelete: false,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders entry card', () => {
    expect(factory().find('.entry-card').exists()).toBe(true)
  })

  it('shows platform badge', () => {
    expect(factory().find('.platform-badge').text()).toBe('Wallapop')
  })

  it('hides platform badge when no platform', () => {
    const noPlat = { ...entry, platform_id: null }
    expect(factory({ entry: noPlat }).find('.platform-badge').exists()).toBe(false)
  })

  it('shows status badge with class', () => {
    const badge = factory().find('.status-badge')
    expect(badge.classes()).toContain('status-watching')
  })

  it('shows brand and model', () => {
    expect(factory().find('.card-title').text()).toContain('Volvo FH 500')
  })

  it('shows year', () => {
    expect(factory().find('.card-year').text()).toContain('2022')
  })

  it('shows formatted price', () => {
    expect(factory().find('.card-price').text()).toContain('85')
  })

  it('shows location', () => {
    expect(factory().find('.card-location').text()).toBe('León')
  })

  it('shows notes', () => {
    expect(factory().find('.card-notes').text()).toBe('Buen estado general')
  })

  it('truncates long notes', () => {
    const longNotes = 'A'.repeat(150)
    const e = { ...entry, notes: longNotes }
    expect(factory({ entry: e }).find('.card-notes').text()).toContain('...')
  })

  it('shows view listing link', () => {
    expect(factory().find('.btn-link').attributes('href')).toBe('https://example.com/listing')
  })

  it('hides link when no url', () => {
    const e = { ...entry, url: '' }
    expect(factory({ entry: e }).find('.btn-link').exists()).toBe(false)
  })

  it('emits edit on edit button', async () => {
    const w = factory()
    await w.find('.btn-action:not(.btn-danger)').trigger('click')
    expect(w.emitted('edit')![0]).toEqual([entry])
  })

  it('emits delete on delete button', async () => {
    const w = factory()
    await w.find('.btn-danger').trigger('click')
    expect(w.emitted('delete')![0]).toEqual(['e-1'])
  })

  it('shows confirm text when confirming delete', () => {
    const w = factory({ isConfirmingDelete: true })
    expect(w.find('.btn-danger').text()).toBe('dashboard.observatory.confirmDelete')
  })
})
