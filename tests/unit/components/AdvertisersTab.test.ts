/**
 * Tests for app/components/admin/publicidad/AdvertisersTab.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminPublicidad', () => ({
  getStatusColor: (status: string) => (status === 'active' ? '#22c55e' : '#94a3b8'),
}))

import AdvertisersTab from '../../../app/components/admin/publicidad/AdvertisersTab.vue'

describe('AdvertisersTab', () => {
  const advertisers = [
    {
      id: 'a-1',
      company_name: 'Volvo Trucks',
      contact_email: 'info@volvo.com',
      contact_phone: '+34 900 123 456',
      website: 'https://volvo.com',
      status: 'active',
    },
    {
      id: 'a-2',
      company_name: 'Scania ES',
      contact_email: null,
      contact_phone: null,
      website: null,
      status: 'inactive',
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdvertisersTab, {
      props: { advertisers, ...overrides },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('shows record count badge', () => {
    expect(factory().find('.total-badge').text()).toContain('2')
  })

  it('renders create button', () => {
    expect(factory().find('.btn-primary').text()).toContain('admin.publicidad.createAdvertiser')
  })

  it('renders table rows', () => {
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows company name', () => {
    expect(factory().findAll('strong')[0].text()).toBe('Volvo Trucks')
  })

  it('shows email', () => {
    expect(factory().findAll('.text-muted')[0].text()).toBe('info@volvo.com')
  })

  it('shows dash for missing email', () => {
    expect(factory().findAll('.text-muted')[3].text()).toBe('-')
  })

  it('shows website link', () => {
    expect(factory().find('a[target="_blank"]').text()).toBe('https://volvo.com')
  })

  it('shows status badge', () => {
    expect(factory().findAll('.status-badge')).toHaveLength(2)
  })

  it('emits newAdvertiser on create click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('newAdvertiser')).toHaveLength(1)
  })

  it('emits editAdvertiser on edit click', async () => {
    const w = factory()
    await w.find('.btn-view').trigger('click')
    expect(w.emitted('editAdvertiser')![0]).toEqual([advertisers[0]])
  })

  it('emits deleteAdvertiser on delete click', async () => {
    const w = factory()
    await w.find('.btn-delete').trigger('click')
    expect(w.emitted('deleteAdvertiser')![0]).toEqual([advertisers[0]])
  })

  it('shows empty state when no advertisers', () => {
    expect(factory({ advertisers: [] }).find('.empty-state').exists()).toBe(true)
  })
})
