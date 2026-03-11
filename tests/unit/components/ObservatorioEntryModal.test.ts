/**
 * Tests for app/components/dashboard/observatorio/ObservatorioEntryModal.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/dashboard/useDashboardObservatorio', () => ({
  STATUS_OPTIONS: ['watching', 'sold', 'expired'],
}))

import ObservatorioEntryModal from '../../../app/components/dashboard/observatorio/ObservatorioEntryModal.vue'

const baseForm = {
  platform_id: 'p1',
  url: 'https://example.com',
  brand: 'Scania',
  model: 'R450',
  year: '2022',
  price: '85000',
  location: 'Madrid',
  status: 'watching' as const,
  notes: 'Buen estado',
}

const platforms = [
  { id: 'p1', name: 'Wallapop' },
  { id: 'p2', name: 'MilAnuncios' },
]

describe('ObservatorioEntryModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ObservatorioEntryModal, {
      props: {
        visible: true,
        editingEntry: null,
        form: { ...baseForm },
        saving: false,
        selectablePlatforms: platforms,
        ...overrides,
      },
      global: {
        stubs: { Teleport: true },
        mocks: { $t: (k: string) => k },
      },
    })

  it('hides modal when not visible', () => {
    expect(factory({ visible: false }).find('.modal-overlay').exists()).toBe(false)
  })

  it('shows modal when visible', () => {
    expect(factory().find('.modal-overlay').exists()).toBe(true)
  })

  it('shows add title when not editing', () => {
    expect(factory().find('h2').text()).toBe('dashboard.observatory.addEntry')
  })

  it('shows edit title when editing', () => {
    const w = factory({ editingEntry: { id: 'e1' } })
    expect(w.find('h2').text()).toBe('dashboard.observatory.editEntry')
  })

  it('renders platform select with options', () => {
    const options = factory().find('#obs-platform').findAll('option')
    // 1 placeholder + 2 platforms
    expect(options).toHaveLength(3)
  })

  it('renders url input', () => {
    expect((factory().find('#obs-url').element as HTMLInputElement).value).toBe('https://example.com')
  })

  it('renders brand input', () => {
    expect((factory().find('#obs-brand').element as HTMLInputElement).value).toBe('Scania')
  })

  it('renders model input', () => {
    expect((factory().find('#obs-model').element as HTMLInputElement).value).toBe('R450')
  })

  it('renders year input', () => {
    expect((factory().find('#obs-year').element as HTMLInputElement).value).toBe('2022')
  })

  it('renders price input', () => {
    expect((factory().find('#obs-price').element as HTMLInputElement).value).toBe('85000')
  })

  it('renders location input', () => {
    expect((factory().find('#obs-location').element as HTMLInputElement).value).toBe('Madrid')
  })

  it('renders status select with 3 options', () => {
    const options = factory().find('#obs-status').findAll('option')
    expect(options).toHaveLength(3)
  })

  it('renders notes textarea', () => {
    expect((factory().find('#obs-notes').element as HTMLTextAreaElement).value).toBe('Buen estado')
  })

  it('emits close on overlay click', async () => {
    const w = factory()
    await w.find('.modal-overlay').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on close button', async () => {
    const w = factory()
    await w.find('.btn-close').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on cancel button', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits save on form submit', async () => {
    const w = factory()
    await w.find('.modal-form').trigger('submit')
    expect(w.emitted('save')).toBeTruthy()
  })

  it('disables save when saving', () => {
    expect(factory({ saving: true }).find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('disables save when brand empty', () => {
    const w = factory({ form: { ...baseForm, brand: '' } })
    expect(w.find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('disables save when model empty', () => {
    const w = factory({ form: { ...baseForm, model: '' } })
    expect(w.find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('shows saving text', () => {
    expect(factory({ saving: true }).find('.btn-primary').text()).toContain('common.loading')
  })

  it('shows save text when not saving', () => {
    expect(factory().find('.btn-primary').text()).toContain('common.save')
  })
})
