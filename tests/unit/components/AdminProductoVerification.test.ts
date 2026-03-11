/**
 * Tests for app/components/admin/productos/AdminProductoVerification.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/useVehicleVerification', () => ({
  VERIFICATION_LEVELS: [
    { level: 'none', badge: '', labelKey: 'verification.level.none' },
    { level: 'verified', badge: '✓', labelKey: 'verification.level.verified' },
    { level: 'extended', badge: '✓✓', labelKey: 'verification.level.extended' },
  ],
  LEVEL_ORDER: { none: 0, verified: 1, extended: 2, detailed: 3, audited: 4, certified: 5 },
}))

import AdminProductoVerification from '../../../app/components/admin/productos/AdminProductoVerification.vue'

describe('AdminProductoVerification', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminProductoVerification, {
      props: {
        open: false,
        currentLevel: 'none',
        levelBadge: '',
        documents: [],
        docType: 'itv',
        docTypes: ['itv', 'ficha_tecnica', 'registration'],
        loading: false,
        error: null,
        ...overrides,
      },
      global: {
        mocks: { $t: (key: string) => key },
      },
    })

  it('renders toggle button', () => {
    const w = factory()
    expect(w.find('.section-toggle').exists()).toBe(true)
  })

  it('hides content when closed', () => {
    const w = factory({ open: false })
    expect(w.find('.section-content').exists()).toBe(false)
  })

  it('shows content when open', () => {
    const w = factory({ open: true })
    expect(w.find('.section-content').exists()).toBe(true)
  })

  it('emits update:open on toggle click', async () => {
    const w = factory({ open: false })
    await w.find('.section-toggle').trigger('click')
    expect(w.emitted('update:open')).toEqual([[true]])
  })

  it('emits update:open with false when already open', async () => {
    const w = factory({ open: true })
    await w.find('.section-toggle').trigger('click')
    expect(w.emitted('update:open')).toEqual([[false]])
  })

  it('shows level badge when currentLevel is not none', () => {
    const w = factory({ currentLevel: 'verified', levelBadge: '✓' })
    const badge = w.find('.verif-level-badge')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('✓')
  })

  it('hides level badge when currentLevel is none', () => {
    const w = factory({ currentLevel: 'none' })
    expect(w.find('.verif-level-badge').exists()).toBe(false)
  })

  it('renders progress steps when open', () => {
    const w = factory({ open: true })
    expect(w.findAll('.verif-progress-step').length).toBe(3)
  })

  it('marks active steps based on current level', () => {
    const w = factory({ open: true, currentLevel: 'verified' })
    const steps = w.findAll('.verif-progress-step')
    expect(steps[0].classes()).toContain('active')
    expect(steps[1].classes()).toContain('active')
    expect(steps[1].classes()).toContain('current')
  })

  it('renders doc type select options', () => {
    const w = factory({ open: true })
    const options = w.findAll('.verif-select option')
    expect(options).toHaveLength(3)
  })

  it('shows loading message when loading', () => {
    const w = factory({ open: true, loading: true })
    expect(w.find('.loading-small').exists()).toBe(true)
  })

  it('shows error message when error exists', () => {
    const w = factory({ open: true, error: 'Upload failed' })
    expect(w.find('.error-msg').text()).toBe('Upload failed')
  })

  it('shows empty message when no documents', () => {
    const w = factory({ open: true, documents: [] })
    expect(w.find('.empty-msg').exists()).toBe(true)
  })

  it('renders document rows', () => {
    const docs = [
      { id: 'd1', doc_type: 'itv', status: 'pending', file_url: 'https://example.com/doc.pdf', rejection_reason: null },
      { id: 'd2', doc_type: 'ficha_tecnica', status: 'verified', file_url: null, rejection_reason: null },
    ]
    const w = factory({ open: true, documents: docs })
    expect(w.findAll('.verif-doc-row')).toHaveLength(2)
  })

  it('shows document link when file_url exists', () => {
    const docs = [{ id: 'd1', doc_type: 'itv', status: 'pending', file_url: 'https://example.com/doc.pdf', rejection_reason: null }]
    const w = factory({ open: true, documents: docs })
    const link = w.find('.verif-doc-link')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('https://example.com/doc.pdf')
  })

  it('hides document link when file_url is null', () => {
    const docs = [{ id: 'd1', doc_type: 'itv', status: 'verified', file_url: null, rejection_reason: null }]
    const w = factory({ open: true, documents: docs })
    expect(w.find('.verif-doc-link').exists()).toBe(false)
  })

  it('shows rejection reason when present', () => {
    const docs = [{ id: 'd1', doc_type: 'itv', status: 'rejected', file_url: null, rejection_reason: 'Expired document' }]
    const w = factory({ open: true, documents: docs })
    expect(w.find('.verif-doc-rejection').text()).toBe('Expired document')
  })

  it('applies status class to document status badge', () => {
    const docs = [{ id: 'd1', doc_type: 'itv', status: 'pending', file_url: null, rejection_reason: null }]
    const w = factory({ open: true, documents: docs })
    expect(w.find('.verif-doc-status').classes()).toContain('status-pending')
  })
})
