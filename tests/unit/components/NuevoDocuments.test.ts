/**
 * Tests for app/components/admin/productos/nuevo/NuevoDocuments.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import NuevoDocuments from '../../../app/components/admin/productos/nuevo/NuevoDocuments.vue'

describe('NuevoDocuments', () => {
  const documents = [
    { id: 'd-1', name: 'Ficha tecnica.pdf', url: 'https://example.com/ficha.pdf' },
    { id: 'd-2', name: 'ITV.pdf', url: 'https://example.com/itv.pdf' },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(NuevoDocuments, {
      props: {
        open: true,
        documents,
        ...overrides,
      },
    })

  it('renders collapsible section', () => {
    expect(factory().find('.collapsible').exists()).toBe(true)
  })

  it('shows toggle with count', () => {
    expect(factory().find('.section-toggle').text()).toContain('Documentos (2)')
  })

  it('shows content when open', () => {
    expect(factory().find('.section-content').exists()).toBe(true)
  })

  it('hides content when closed', () => {
    expect(factory({ open: false }).find('.section-content').exists()).toBe(false)
  })

  it('shows upload label', () => {
    expect(factory().find('.upload-zone-label').text()).toContain('Subir documentos')
  })

  it('shows document rows', () => {
    expect(factory().findAll('.doc-row')).toHaveLength(2)
  })

  it('shows document name', () => {
    expect(factory().find('.doc-row span').text()).toBe('Ficha tecnica.pdf')
  })

  it('shows remove button per doc', () => {
    expect(factory().findAll('.btn-x')).toHaveLength(2)
  })

  it('emits remove on remove click', async () => {
    const w = factory()
    await w.find('.btn-x').trigger('click')
    expect(w.emitted('remove')?.[0]?.[0]).toBe('d-1')
  })

  it('shows empty message when no documents', () => {
    const w = factory({ documents: [] })
    expect(w.find('.empty-msg').text()).toBe('Sin documentos.')
  })

  it('emits update:open on toggle click', async () => {
    const w = factory()
    await w.find('.section-toggle').trigger('click')
    expect(w.emitted('update:open')?.[0]?.[0]).toBe(false)
  })

  it('emits upload on file input change', async () => {
    const w = factory()
    await w.find('#doc-upload-input').trigger('change')
    expect(w.emitted('upload')).toBeTruthy()
  })
})
