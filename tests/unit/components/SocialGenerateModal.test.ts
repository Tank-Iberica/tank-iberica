/**
 * Tests for app/components/admin/social/GenerateModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import GenerateModal from '../../../app/components/admin/social/GenerateModal.vue'

const baseVehicleResults = [
  {
    id: 'v1',
    brand: 'Scania',
    model: 'R450',
    location: 'Madrid',
    vehicle_images: [{ url: 'https://img.test/1.jpg' }],
  },
  {
    id: 'v2',
    brand: 'MAN',
    model: 'TGX',
    location: null,
    vehicle_images: [],
  },
]

describe('SocialGenerateModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(GenerateModal, {
      props: {
        show: true,
        vehicleSearch: '',
        vehicleResults: [],
        selectedVehicleId: null,
        hasSelectedVehicle: false,
        vehicleSearchLoading: false,
        actionLoading: false,
        ...overrides,
      },
      global: {
        stubs: { Teleport: true, Transition: true },
      },
    })

  it('renders when show=true', () => {
    expect(factory().find('.modal-overlay').exists()).toBe(true)
  })

  it('hides when show=false', () => {
    expect(factory({ show: false }).find('.modal-overlay').exists()).toBe(false)
  })

  it('shows modal header', () => {
    expect(factory().find('.modal-header').exists()).toBe(true)
    expect(factory().find('.modal-header').text()).toContain('admin.social.generatePosts')
  })

  it('shows search input', () => {
    expect(factory().find('.search-input').exists()).toBe(true)
  })

  it('emits close on close button click', async () => {
    const w = factory()
    await w.find('.modal-close').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on cancel button click', async () => {
    const w = factory()
    await w.find('.btn-cancel').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('shows vehicle results when present', () => {
    const w = factory({ vehicleResults: baseVehicleResults })
    expect(w.find('.vehicle-list').exists()).toBe(true)
    expect(w.findAll('.vehicle-option')).toHaveLength(2)
  })

  it('hides vehicle list when empty', () => {
    expect(factory().find('.vehicle-list').exists()).toBe(false)
  })

  it('shows vehicle image when available', () => {
    const w = factory({ vehicleResults: baseVehicleResults })
    const options = w.findAll('.vehicle-option')
    expect(options[0].find('.vehicle-thumb').exists()).toBe(true)
    expect(options[1].find('.vehicle-thumb-placeholder').exists()).toBe(true)
  })

  it('shows vehicle info', () => {
    const w = factory({ vehicleResults: baseVehicleResults })
    const info = w.findAll('.vehicle-info')
    expect(info[0].find('strong').text()).toBe('Scania R450')
    expect(info[0].find('.vehicle-loc').text()).toBe('Madrid')
  })

  it('applies selected class to selected vehicle', () => {
    const w = factory({ vehicleResults: baseVehicleResults, selectedVehicleId: 'v1' })
    const options = w.findAll('.vehicle-option')
    expect(options[0].classes()).toContain('selected')
    expect(options[1].classes()).not.toContain('selected')
  })

  it('shows check icon for selected vehicle', () => {
    const w = factory({ vehicleResults: baseVehicleResults, selectedVehicleId: 'v1' })
    const options = w.findAll('.vehicle-option')
    expect(options[0].find('.check-icon').exists()).toBe(true)
    expect(options[1].find('.check-icon').exists()).toBe(false)
  })

  it('emits selectVehicle on vehicle click', async () => {
    const w = factory({ vehicleResults: baseVehicleResults })
    await w.findAll('.vehicle-option')[0].trigger('click')
    expect(w.emitted('selectVehicle')).toBeTruthy()
  })

  it('shows loading spinner when searching', () => {
    const w = factory({ vehicleSearchLoading: true })
    expect(w.find('.search-loading').exists()).toBe(true)
  })

  it('hides loading spinner when not searching', () => {
    expect(factory().find('.search-loading').exists()).toBe(false)
  })

  it('disables generate button when no vehicle selected', () => {
    expect(factory().find('.btn-generate-confirm').attributes('disabled')).toBeDefined()
  })

  it('enables generate button when vehicle selected', () => {
    const w = factory({ hasSelectedVehicle: true })
    expect(w.find('.btn-generate-confirm').attributes('disabled')).toBeUndefined()
  })

  it('disables generate button when loading', () => {
    const w = factory({ hasSelectedVehicle: true, actionLoading: true })
    expect(w.find('.btn-generate-confirm').attributes('disabled')).toBeDefined()
  })

  it('shows generating text when loading', () => {
    const w = factory({ hasSelectedVehicle: true, actionLoading: true })
    expect(w.find('.btn-generate-confirm').text()).toBe('admin.social.generating')
  })

  it('emits generate on button click', async () => {
    const w = factory({ hasSelectedVehicle: true })
    await w.find('.btn-generate-confirm').trigger('click')
    expect(w.emitted('generate')).toBeTruthy()
  })

  it('emits update:vehicleSearch and search on input', async () => {
    const w = factory()
    const input = w.find('.search-input')
    const el = input.element as HTMLInputElement
    Object.defineProperty(el, 'value', { value: 'scania', writable: true })
    await input.trigger('input')
    expect(w.emitted('update:vehicleSearch')).toBeTruthy()
    expect(w.emitted('search')).toBeTruthy()
  })

  it('emits close on overlay click', async () => {
    const w = factory()
    await w.find('.modal-overlay').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
