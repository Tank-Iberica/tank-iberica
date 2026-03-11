/**
 * Tests for app/components/admin/productos/AdminProductoDocuments.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminProductoDocuments from '../../../app/components/admin/productos/AdminProductoDocuments.vue'

describe('AdminProductoDocuments', () => {
  const documents = [
    { id: 'd1', name: 'Ficha técnica.pdf', url: 'https://example.com/doc1.pdf', type: 'ficha' },
    { id: 'd2', name: 'ITV.pdf', url: 'https://example.com/doc2.pdf', type: 'itv' },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminProductoDocuments, {
      props: {
        open: true,
        documents,
        docTypeToUpload: 'ficha',
        docTypeOptions: ['ficha', 'itv', 'permiso', 'seguro'],
        driveConnected: true,
        driveLoading: false,
        driveError: null,
        fileNamingData: { brand: 'Volvo', model: 'FH', year: 2022 },
        driveSection: 'Vehiculos' as const,
        ...overrides,
      },
    })

  it('renders collapsible section', () => {
    expect(factory().find('.section.collapsible').exists()).toBe(true)
  })

  it('shows toggle with document count', () => {
    expect(factory().find('.section-toggle').text()).toContain('Documentos (2)')
  })

  it('shows content when open', () => {
    expect(factory().find('.section-content').exists()).toBe(true)
  })

  it('hides content when closed', () => {
    const w = factory({ open: false })
    expect(w.find('.section-content').exists()).toBe(false)
  })

  it('shows drive folder button when connected', () => {
    expect(factory().find('.btn-add').exists()).toBe(true)
  })

  it('hides drive folder button when not connected', () => {
    const w = factory({ driveConnected: false })
    expect(w.find('.btn-add').exists()).toBe(false)
  })

  it('shows doc type select with options', () => {
    const select = factory().find('.doc-type-select')
    expect(select.findAll('option')).toHaveLength(4)
  })

  it('shows upload label', () => {
    expect(factory().find('.upload-zone-label').text()).toContain('Subir documento')
  })

  it('shows loading text when driveLoading', () => {
    const w = factory({ driveLoading: true })
    expect(w.find('.upload-zone-label').text()).toContain('Subiendo...')
  })

  it('renders document rows', () => {
    expect(factory().findAll('.doc-row')).toHaveLength(2)
  })

  it('shows document name as link', () => {
    const link = factory().find('.doc-link')
    expect(link.text()).toContain('Ficha técnica.pdf')
    expect(link.attributes('href')).toBe('https://example.com/doc1.pdf')
  })

  it('shows document type badge', () => {
    expect(factory().find('.doc-type-badge').text()).toBe('ficha')
  })

  it('shows remove button per document', () => {
    expect(factory().findAll('.btn-x')).toHaveLength(2)
  })

  it('emits update:open on toggle click', async () => {
    const w = factory()
    await w.find('.section-toggle').trigger('click')
    expect(w.emitted('update:open')?.[0]?.[0]).toBe(false)
  })

  it('emits open-folder on drive button click', async () => {
    const w = factory()
    await w.find('.btn-add').trigger('click')
    expect(w.emitted('open-folder')).toBeTruthy()
  })

  it('emits remove on remove button click', async () => {
    const w = factory()
    await w.find('.btn-x').trigger('click')
    expect(w.emitted('remove')?.[0]?.[0]).toBe('d1')
  })

  it('shows error message when driveError set', () => {
    const w = factory({ driveError: 'Upload failed' })
    expect(w.find('.error-msg').text()).toBe('Upload failed')
  })

  it('shows empty message when no documents', () => {
    const w = factory({ documents: [] })
    expect(w.find('.empty-msg').text()).toContain('Sin documentos')
  })
})
