/**
 * Tests for app/components/admin/anunciantes/AnunciantesDetailModal.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/shared/useListingUtils', () => ({
  formatPrice: (p: number | null) => (p ? `${p} €` : 'Consultar'),
}))

vi.mock('~/composables/useLocalized', () => ({
  localizedName: (obj: Record<string, unknown> | null) => obj?.name_es || '',
}))

import AnunciantesDetailModal from '../../../app/components/admin/anunciantes/AnunciantesDetailModal.vue'

describe('AnunciantesDetailModal', () => {
  const advertisement = {
    id: 'ad-1',
    contact_name: 'Juan García',
    contact_phone: '+34 600 111 222',
    contact_email: 'juan@example.com',
    location: 'Madrid',
    brand: 'Volvo',
    model: 'FH 500',
    year: 2022,
    kilometers: 150000,
    price: 85000,
    vehicle_type: 'Cabeza tractora',
    subcategory: null,
    type: null,
    contact_preference: 'WhatsApp',
    description: 'Buen estado general',
    attributes_json: { ejes: 2, potencia: '500 CV' },
    photos: ['https://cdn.example.com/1.jpg', 'https://cdn.example.com/2.jpg'],
    status: 'pending',
    created_at: '2026-03-01',
    admin_notes: '',
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AnunciantesDetailModal, {
      props: {
        show: true,
        advertisement,
        notes: '',
        saving: false,
        ...overrides,
      },
      global: {
        stubs: { Teleport: true },
      },
    })

  it('renders modal when show is true', () => {
    expect(factory().find('.modal-content').exists()).toBe(true)
  })

  it('hides modal when show is false', () => {
    expect(factory({ show: false }).find('.modal-content').exists()).toBe(false)
  })

  it('shows title', () => {
    expect(factory().find('.modal-header h3').text()).toBe('admin.anunciantes.detailTitle')
  })

  it('shows contact name', () => {
    expect(factory().text()).toContain('Juan García')
  })

  it('shows contact phone', () => {
    expect(factory().text()).toContain('+34 600 111 222')
  })

  it('shows contact email', () => {
    expect(factory().text()).toContain('juan@example.com')
  })

  it('shows location', () => {
    expect(factory().text()).toContain('Madrid')
  })

  it('shows brand and model', () => {
    expect(factory().text()).toContain('Volvo')
    expect(factory().text()).toContain('FH 500')
  })

  it('shows year', () => {
    expect(factory().text()).toContain('2022')
  })

  it('shows formatted price', () => {
    expect(factory().text()).toContain('85000 €')
  })

  it('shows characteristics', () => {
    expect(factory().find('.characteristics-grid').exists()).toBe(true)
  })

  it('shows description', () => {
    expect(factory().find('.description-text').text()).toBe('Buen estado general')
  })

  it('shows photos', () => {
    expect(factory().findAll('.photos-grid img')).toHaveLength(2)
  })

  it('shows notes textarea', () => {
    expect(factory().find('textarea').exists()).toBe(true)
  })

  it('shows save button', () => {
    expect(factory().find('.btn-primary').text()).toBe('Guardar')
  })

  it('shows saving text', () => {
    expect(factory({ saving: true }).find('.btn-primary').text()).toBe('Guardando...')
  })

  it('emits close on close click', async () => {
    const w = factory()
    await w.find('.modal-close').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits save on primary click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('save')).toBeTruthy()
  })

  it('emits close on secondary click', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
