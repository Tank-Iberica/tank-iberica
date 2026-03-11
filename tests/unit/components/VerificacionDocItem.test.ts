/**
 * Tests for app/components/admin/verificaciones/VerificacionDocItem.vue
 */
import { vi, describe, it, expect } from 'vitest'

vi.mock('~/composables/admin/useAdminVerificaciones', () => ({
  formatPrice: (v: number) => `${v} €`,
}))

import { shallowMount } from '@vue/test-utils'
import VerificacionDocItem from '../../../app/components/admin/verificaciones/VerificacionDocItem.vue'

const baseDoc = {
  id: 'doc1',
  vehicle_id: 'v1',
  doc_type: 'ficha_tecnica',
  status: 'pending',
  file_url: 'https://files.test/doc.pdf',
  generated_at: '2026-01-15T10:00:00Z',
  expires_at: null as string | null,
  notes: null as string | null,
  rejection_reason: null as string | null,
  vehicles: {
    brand: 'Scania',
    model: 'R450',
    year: 2022,
    price: 85000,
    verification_level: 'verified',
    images: [{ url: 'https://img.test/1.jpg' }],
  },
}

const levelInfo = { cssClass: 'level-verified', progress: 40, icon: '✓', label: 'Verificado' }
const vehicleVerificationMap = new Map([
  ['v1', { docs: [{ id: 'doc1', doc_type: 'ficha_tecnica', status: 'pending' }] }],
])

describe('VerificacionDocItem', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(VerificacionDocItem, {
      props: {
        doc: { ...baseDoc },
        expanded: false,
        actionLoading: false,
        rejectionReason: '',
        getVehicleThumbnail: () => 'https://img.test/thumb.jpg',
        getDealerName: () => 'Test Dealer',
        formatDate: (d: string | null) => d || '-',
        getDocTypeLabel: (t: string) => t,
        getStatusClass: (s: string | null) => `status-${s}`,
        getStatusLabel: (s: string | null) => String(s),
        getVerificationLevelInfo: () => levelInfo,
        isFileImage: () => false,
        vehicleVerificationMap,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders doc item', () => {
    expect(factory().find('.doc-item').exists()).toBe(true)
  })

  it('shows vehicle brand and model', () => {
    expect(factory().html()).toContain('Scania')
    expect(factory().html()).toContain('R450')
  })

  it('shows dealer name', () => {
    expect(factory().html()).toContain('Test Dealer')
  })

  it('shows doc type', () => {
    expect(factory().find('.doc-type-badge').text()).toBe('ficha_tecnica')
  })

  it('shows status badge', () => {
    expect(factory().find('.status-badge').classes()).toContain('status-pending')
  })

  it('hides expanded section when not expanded', () => {
    expect(factory().find('.doc-detail').exists()).toBe(false)
  })

  it('shows expanded section when expanded', () => {
    const w = factory({ expanded: true })
    expect(w.find('.doc-detail').exists()).toBe(true)
  })

  it('shows vehicle data in expanded', () => {
    const w = factory({ expanded: true })
    expect(w.html()).toContain('85000 €')
  })

  it('shows approve/reject buttons for pending', () => {
    const w = factory({ expanded: true })
    expect(w.find('.btn-approve').exists()).toBe(true)
    expect(w.find('.btn-reject').exists()).toBe(true)
  })

  it('hides action buttons for non-pending', () => {
    const w = factory({ expanded: true, doc: { ...baseDoc, status: 'verified' } })
    expect(w.find('.btn-approve').exists()).toBe(false)
  })

  it('shows reviewed badge for non-pending', () => {
    const w = factory({ expanded: true, doc: { ...baseDoc, status: 'verified' } })
    expect(w.find('.reviewed-badge').exists()).toBe(true)
  })

  it('emits toggle on row click', async () => {
    const w = factory()
    await w.find('.doc-row').trigger('click')
    expect(w.emitted('toggle')?.[0]).toEqual(['doc1'])
  })

  it('emits approve on approve click', async () => {
    const w = factory({ expanded: true })
    await w.find('.btn-approve').trigger('click')
    expect(w.emitted('approve')).toBeTruthy()
  })

  it('disables reject when no reason', () => {
    const w = factory({ expanded: true })
    expect(w.find('.btn-reject').attributes('disabled')).toBeDefined()
  })

  it('shows verification level info', () => {
    const w = factory({ expanded: true })
    expect(w.find('.level-label').text()).toContain('Verificado')
  })
})
