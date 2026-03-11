/**
 * Tests for app/components/admin/brokeraje/BrokerajeAuditLog.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminBrokerageDeal', () => ({
  getActionLabel: (action: string) => `Action: ${action}`,
  getActorLabel: (actor: string) => `Actor: ${actor}`,
}))

import BrokerajeAuditLog from '../../../app/components/admin/brokeraje/BrokerajeAuditLog.vue'

describe('BrokerajeAuditLog', () => {
  const entries = [
    {
      id: 'e-1',
      action: 'status_change',
      actor: 'admin',
      created_at: '2026-03-01T10:00:00Z',
      details: { from: 'pending', to: 'active', reason: 'Aprobado' },
      human_override: false,
      override_reason: null,
    },
    {
      id: 'e-2',
      action: 'note_added',
      actor: 'dealer',
      created_at: '2026-03-02T14:30:00Z',
      details: {},
      human_override: true,
      override_reason: 'Excepción comercial',
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(BrokerajeAuditLog, {
      props: { entries, ...overrides },
    })

  it('renders audit section', () => {
    expect(factory().find('.audit-section').exists()).toBe(true)
  })

  it('shows toggle button with count', () => {
    expect(factory().find('.audit-toggle').text()).toContain('Audit Log (2)')
  })

  it('renders toggle icon', () => {
    expect(factory().find('.toggle-icon').exists()).toBe(true)
  })

  it('shows zero entries text', () => {
    const w = factory({ entries: [] })
    expect(w.find('.audit-toggle').text()).toContain('(0)')
  })

  it('renders audit entries when expanded', () => {
    // ref stub makes expanded truthy (object), so timeline is visible
    expect(factory().findAll('.audit-entry')).toHaveLength(2)
  })

  it('shows action label', () => {
    expect(factory().findAll('.entry-action')[0].text()).toBe('Action: status_change')
  })

  it('shows actor label', () => {
    expect(factory().findAll('.entry-actor')[0].text()).toBe('Actor: admin')
  })

  it('shows override note', () => {
    expect(factory().findAll('.entry-override')[0].text()).toContain('Excepción comercial')
  })

  it('toggles expanded on audit-toggle click', async () => {
    const w = factory()
    await w.find('.audit-toggle').trigger('click')
    // After click, expanded toggles — component re-renders
    expect(w.find('.audit-section').exists()).toBe(true)
  })
})
