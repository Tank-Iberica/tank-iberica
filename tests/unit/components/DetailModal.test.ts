/**
 * Tests for app/components/admin/solicitantes/DetailModal.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminSolicitantes', () => ({
  getTypeLabel: (demand: Record<string, unknown>, locale: string) =>
    locale === 'es' ? 'Camion' : 'Truck',
  formatPriceRange: (min: number | null, max: number | null) => {
    if (!min && !max) return 'Sin rango'
    return `${min ?? '?'} - ${max ?? '?'}€`
  },
  formatYearRange: (min: number | null, max: number | null) => {
    if (!min && !max) return 'Sin rango'
    return `${min ?? '?'} - ${max ?? '?'}`
  },
}))

import DetailModal from '../../../app/components/admin/solicitantes/DetailModal.vue'

const baseDemand = {
  contact_name: 'Juan Garcia',
  contact_phone: '+34666111222',
  contact_email: 'juan@test.com',
  location: 'Madrid',
  contact_preference: 'phone',
  subcategory: 'camion',
  vehicle_type: null as string | null,
  brand_preference: 'MAN',
  year_min: 2018,
  year_max: 2022,
  price_min: 20000,
  price_max: 50000,
  attributes_json: { ejes: '3', potencia: '400cv' } as Record<string, string>,
  specs: null as Record<string, string> | null,
  description: 'Looking for a truck with low mileage',
}

const baseModal = {
  show: true,
  demand: baseDemand,
  notes: 'Internal note',
}

describe('DetailModal', () => {
  const factory = (modal = baseModal, saving = false) =>
    shallowMount(DetailModal, {
      props: { modal, saving },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
        stubs: {
          Teleport: true,
        },
      },
    })

  it('renders modal when show is true', () => {
    const w = factory()
    expect(w.find('.modal-overlay').exists()).toBe(true)
  })

  it('does not render modal when show is false', () => {
    const w = factory({ ...baseModal, show: false })
    expect(w.find('.modal-overlay').exists()).toBe(false)
  })

  it('renders modal header', () => {
    const w = factory()
    expect(w.find('.modal-header h3').text()).toBe('Detalles del Solicitante')
  })

  it('shows contact name', () => {
    const w = factory()
    expect(w.text()).toContain('Juan Garcia')
  })

  it('shows contact phone', () => {
    const w = factory()
    expect(w.text()).toContain('+34666111222')
  })

  it('shows contact email', () => {
    const w = factory()
    expect(w.text()).toContain('juan@test.com')
  })

  it('shows location', () => {
    const w = factory()
    expect(w.text()).toContain('Madrid')
  })

  it('hides phone when not provided', () => {
    const demand = { ...baseDemand, contact_phone: null }
    const w = factory({ ...baseModal, demand })
    const html = w.html()
    expect(html).not.toContain('Teléfono')
  })

  it('shows brand preference', () => {
    const w = factory()
    expect(w.text()).toContain('MAN')
  })

  it('shows characteristics grid when attributes_json has entries', () => {
    const w = factory()
    expect(w.findAll('.characteristic-item').length).toBe(2)
  })

  it('hides characteristics when attributes_json is empty', () => {
    const demand = { ...baseDemand, attributes_json: {} }
    const w = factory({ ...baseModal, demand })
    expect(w.find('.characteristics-grid').exists()).toBe(false)
  })

  it('shows description', () => {
    const w = factory()
    expect(w.find('.description-text').text()).toBe('Looking for a truck with low mileage')
  })

  it('hides description section when empty', () => {
    const demand = { ...baseDemand, description: '' }
    const w = factory({ ...baseModal, demand })
    expect(w.find('.description-text').exists()).toBe(false)
  })

  it('shows notes textarea with value', () => {
    const w = factory()
    const ta = w.find('textarea')
    expect((ta.element as HTMLTextAreaElement).value).toBe('Internal note')
  })

  it('emits close on close button click', async () => {
    const w = factory()
    await w.find('.modal-close').trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('emits close on secondary button click', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('emits save on primary button click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('save')).toHaveLength(1)
  })

  it('disables save button when saving', () => {
    const w = factory(baseModal, true)
    expect(w.find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('shows "Guardando..." text when saving', () => {
    const w = factory(baseModal, true)
    expect(w.find('.btn-primary').text()).toBe('common.saving')
  })

  it('shows save text when not saving', () => {
    const w = factory(baseModal, false)
    expect(w.find('.btn-primary').text()).toBe('common.save')
  })

  it('emits update:notes on textarea input', async () => {
    const w = factory()
    const ta = w.find('textarea')
    await ta.setValue('New note')
    expect(w.emitted('update:notes')).toBeTruthy()
    expect(w.emitted('update:notes')![0][0]).toBe('New note')
  })
})
