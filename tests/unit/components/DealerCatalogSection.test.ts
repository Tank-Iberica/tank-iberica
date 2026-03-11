/**
 * Tests for app/components/admin/dealer/DealerCatalogSection.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import DealerCatalogSection from '../../../app/components/admin/dealer/DealerCatalogSection.vue'

describe('DealerCatalogSection', () => {
  const certifications = [
    {
      id: 'cert-1',
      icon: 'shield' as const,
      verified: true,
      label: { es: 'ISO 9001', en: 'ISO 9001' },
    },
    {
      id: 'cert-2',
      icon: 'star' as const,
      verified: false,
      label: { es: 'Premio calidad', en: 'Quality award' },
    },
  ]

  const iconOptions = [
    { value: 'shield', label: 'Escudo' },
    { value: 'star', label: 'Estrella' },
    { value: 'check', label: 'Check' },
  ]

  const sortOptions = [
    { value: 'price_asc', label: 'Precio ascendente' },
    { value: 'price_desc', label: 'Precio descendente' },
    { value: 'date_desc', label: 'Mas recientes' },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DealerCatalogSection, {
      props: {
        certifications,
        catalogSort: 'price_asc',
        pinnedVehicles: ['uuid-1', 'uuid-2'],
        newPinnedUuid: '',
        autoReplyMessage: { es: 'Gracias', en: 'Thanks' },
        iconOptions,
        sortOptions,
        ...overrides,
      },
    })

  // --- Certificaciones section ---
  it('renders config cards', () => {
    expect(factory().findAll('.config-card').length).toBe(3)
  })

  it('shows Certificaciones title', () => {
    expect(factory().findAll('.card-title')[0].text()).toBe('admin.dealer.certificationsTitle')
  })

  it('renders cert items', () => {
    expect(factory().findAll('.cert-item')).toHaveLength(2)
  })

  it('shows empty cert list when none', () => {
    const w = factory({ certifications: [] })
    expect(w.find('.empty-list').text()).toContain('admin.dealer.noCertifications')
  })

  it('shows cert icon select with options', () => {
    const select = factory().find('.cert-icon-select')
    expect(select.findAll('option')).toHaveLength(3)
  })

  it('shows cert verified checkbox', () => {
    const checkbox = factory().find('.cert-verified input')
    expect((checkbox.element as HTMLInputElement).checked).toBe(true)
  })

  it('shows cert lang badges ES/EN', () => {
    const firstCert = factory().findAll('.cert-item')[0]
    const badges = firstCert.findAll('.lang-badge')
    expect(badges[0].text()).toBe('ES')
    expect(badges[1].text()).toBe('EN')
  })

  it('shows cert label ES value', () => {
    const firstCert = factory().findAll('.cert-item')[0]
    const inputs = firstCert.findAll('.lang-field input')
    expect((inputs[0].element as HTMLInputElement).value).toBe('ISO 9001')
  })

  it('shows remove button per cert', () => {
    expect(factory().findAll('.btn-remove')).toHaveLength(2)
  })

  it('emits addCertification on add button click', async () => {
    const w = factory()
    await w.find('.btn-add-item').trigger('click')
    expect(w.emitted('addCertification')).toBeTruthy()
  })

  it('emits removeCertification on remove click', async () => {
    const w = factory()
    await w.find('.btn-remove').trigger('click')
    expect(w.emitted('removeCertification')?.[0]?.[0]).toBe('cert-1')
  })

  // --- Catalogo section ---
  it('shows Catalogo title', () => {
    expect(factory().findAll('.card-title')[1].text()).toBe('admin.dealer.catalogTitle')
  })

  it('shows catalog sort select with options', () => {
    const select = factory().find('#catalog-sort')
    expect(select.findAll('option')).toHaveLength(3)
  })

  it('renders pinned vehicles', () => {
    expect(factory().findAll('.pinned-item')).toHaveLength(2)
  })

  it('shows pinned uuid text', () => {
    expect(factory().find('.pinned-uuid').text()).toBe('uuid-1')
  })

  it('shows empty pinned list when none', () => {
    const w = factory({ pinnedVehicles: [] })
    expect(w.findAll('.pinned-item')).toHaveLength(0)
  })

  it('emits removePinnedVehicle on quitar click', async () => {
    const w = factory()
    await w.find('.btn-remove-sm').trigger('click')
    expect(w.emitted('removePinnedVehicle')?.[0]?.[0]).toBe('uuid-1')
  })

  it('emits addPinnedVehicle on fijar click', async () => {
    const w = factory()
    await w.find('.btn-add-inline').trigger('click')
    expect(w.emitted('addPinnedVehicle')).toBeTruthy()
  })

  // --- Respuesta automatica section ---
  it('shows Respuesta automatica title', () => {
    expect(factory().findAll('.card-title')[2].text()).toBe('admin.dealer.autoReplyTitle')
  })

  it('shows ES/EN lang badges for auto reply', () => {
    const badges = factory().findAll('.lang-field-block .lang-badge')
    expect(badges[0].text()).toBe('ES')
    expect(badges[1].text()).toBe('EN')
  })

  it('shows auto reply ES textarea value', () => {
    const textareas = factory().findAll('.lang-field-block textarea')
    expect((textareas[0].element as HTMLTextAreaElement).value).toBe('Gracias')
  })

  it('shows auto reply EN textarea value', () => {
    const textareas = factory().findAll('.lang-field-block textarea')
    expect((textareas[1].element as HTMLTextAreaElement).value).toBe('Thanks')
  })
})
