/**
 * Tests for app/components/admin/reportes/ReporteCard.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminReportes', () => ({
  statusColors: {
    pending: '#f59e0b',
    reviewing: '#3b82f6',
    resolved_removed: '#ef4444',
    resolved_kept: '#22c55e',
  } as Record<string, string>,
  statusLabels: {
    pending: 'report.status.pending',
    reviewing: 'report.status.reviewing',
    resolved_removed: 'report.status.removed',
    resolved_kept: 'report.status.kept',
  } as Record<string, string>,
  formatReportDate: (date: string) => new Date(date).toLocaleDateString('es-ES'),
  truncateEmail: (email: string) => (email.length > 20 ? email.slice(0, 17) + '...' : email),
}))

import ReporteCard from '../../../app/components/admin/reportes/ReporteCard.vue'

describe('ReporteCard', () => {
  const baseReport = {
    id: 'report-1',
    reporter_email: 'user@example.com',
    entity_type: 'vehicle',
    entity_id: 'vehicle-123',
    reason: 'fraud',
    details: 'This listing looks suspicious',
    status: 'pending' as const,
    admin_notes: '',
    created_at: '2026-02-01T10:00:00Z',
    resolved_at: null,
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ReporteCard, {
      props: {
        report: baseReport,
        isExpanded: false,
        isSaving: false,
        notesValue: '',
        ...overrides,
      },
      global: { mocks: { $t: (key: string) => key } },
    })

  it('renders report-card container', () => {
    const w = factory()
    expect(w.find('.report-card').exists()).toBe(true)
  })

  it('adds pending class for pending reports', () => {
    const w = factory()
    expect(w.find('.report-pending').exists()).toBe(true)
  })

  it('does not add pending class for non-pending reports', () => {
    const w = factory({ report: { ...baseReport, status: 'reviewing' } })
    expect(w.find('.report-pending').exists()).toBe(false)
  })

  it('shows truncated email', () => {
    const w = factory()
    expect(w.find('.reporter-email').text()).toBe('user@example.com')
  })

  it('shows status badge with label', () => {
    const w = factory()
    expect(w.find('.status-badge').text()).toBe('report.status.pending')
  })

  it('shows entity type badge', () => {
    const w = factory()
    expect(w.find('.entity-badge').text()).toBe('vehicle')
  })

  it('shows reason text', () => {
    const w = factory()
    expect(w.find('.reason-text').text()).toBe('report.reasons.fraud')
  })

  it('shows formatted date', () => {
    const w = factory()
    expect(w.find('.report-date').text()).toBeTruthy()
  })

  it('emits toggle-expand on header click', async () => {
    const w = factory()
    await w.find('.report-header').trigger('click')
    expect(w.emitted('toggle-expand')).toBeTruthy()
    expect(w.emitted('toggle-expand')![0]).toEqual(['report-1'])
  })

  it('does not show details when collapsed', () => {
    const w = factory({ isExpanded: false })
    expect(w.find('.report-details').exists()).toBe(false)
  })

  it('shows details when expanded', () => {
    const w = factory({ isExpanded: true })
    expect(w.find('.report-details').exists()).toBe(true)
  })

  it('shows detail grid with reporter email', () => {
    const w = factory({ isExpanded: true })
    const values = w.findAll('.detail-value')
    expect(values[0].text()).toBe('user@example.com')
  })

  it('shows entity id in detail grid', () => {
    const w = factory({ isExpanded: true })
    expect(w.find('.detail-id').text()).toBe('vehicle-123')
  })

  it('shows notes textarea when expanded', () => {
    const w = factory({ isExpanded: true })
    expect(w.find('.notes-textarea').exists()).toBe(true)
  })

  it('shows save notes button', () => {
    const w = factory({ isExpanded: true })
    expect(w.find('.btn-save-notes').text()).toBe('report.admin.saveNotes')
  })

  it('shows ... on save button when saving', () => {
    const w = factory({ isExpanded: true, isSaving: true })
    expect(w.find('.btn-save-notes').text()).toBe('...')
  })

  it('disables save button when saving', () => {
    const w = factory({ isExpanded: true, isSaving: true })
    expect(w.find('.btn-save-notes').attributes('disabled')).toBeDefined()
  })

  it('emits save-notes on save button click', async () => {
    const w = factory({ isExpanded: true })
    await w.find('.btn-save-notes').trigger('click')
    expect(w.emitted('save-notes')).toBeTruthy()
    expect(w.emitted('save-notes')![0]).toEqual(['report-1'])
  })

  it('shows reviewing action for pending report', () => {
    const w = factory({ isExpanded: true })
    expect(w.find('.action-reviewing').exists()).toBe(true)
  })

  it('hides reviewing action when status is reviewing', () => {
    const w = factory({ isExpanded: true, report: { ...baseReport, status: 'reviewing' } })
    expect(w.find('.action-reviewing').exists()).toBe(false)
  })

  it('shows resolve-remove action for non-resolved report', () => {
    const w = factory({ isExpanded: true })
    expect(w.find('.action-remove').exists()).toBe(true)
  })

  it('shows resolve-keep action for non-resolved report', () => {
    const w = factory({ isExpanded: true })
    expect(w.find('.action-keep').exists()).toBe(true)
  })

  it('hides resolve actions for resolved report', () => {
    const w = factory({ isExpanded: true, report: { ...baseReport, status: 'resolved_removed' } })
    expect(w.find('.action-remove').exists()).toBe(false)
    expect(w.find('.action-keep').exists()).toBe(false)
  })

  it('emits update-status on reviewing click', async () => {
    const w = factory({ isExpanded: true })
    await w.find('.action-reviewing').trigger('click')
    expect(w.emitted('update-status')).toBeTruthy()
    expect(w.emitted('update-status')![0]).toEqual(['report-1', 'reviewing'])
  })

  it('emits update-status on resolve-remove click', async () => {
    const w = factory({ isExpanded: true })
    await w.find('.action-remove').trigger('click')
    expect(w.emitted('update-status')![0]).toEqual(['report-1', 'resolved_removed'])
  })

  it('emits update-status on resolve-keep click', async () => {
    const w = factory({ isExpanded: true })
    await w.find('.action-keep').trigger('click')
    expect(w.emitted('update-status')![0]).toEqual(['report-1', 'resolved_kept'])
  })

  it('shows report details text when present', () => {
    const w = factory({ isExpanded: true })
    const fullDetail = w.findAll('.detail-item.detail-full')
    expect(fullDetail.length).toBeGreaterThanOrEqual(1)
  })

  it('adds expanded class when expanded', () => {
    const w = factory({ isExpanded: true })
    expect(w.find('.report-expanded').exists()).toBe(true)
  })

  it('rotates expand indicator when expanded', () => {
    const w = factory({ isExpanded: true })
    expect(w.find('.expand-indicator svg.rotated').exists()).toBe(true)
  })

  it('emits update-notes on notes textarea input', async () => {
    const w = factory({ isExpanded: true })
    const ta = w.find('.notes-textarea')
    if (ta.exists()) {
      Object.defineProperty(ta.element, 'value', { value: 'new note', writable: true })
      await ta.trigger('input')
      expect(w.emitted('update-notes')).toBeTruthy()
    }
  })
})
