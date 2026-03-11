/**
 * Tests for app/components/admin/subastas/AdminAuctionActions.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'

beforeAll(() => {
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
})

import AdminAuctionActions from '../../../app/components/admin/subastas/AdminAuctionActions.vue'

describe('AdminAuctionActions', () => {
  const baseAuction = {
    status: 'active',
    starts_at: '2026-01-01T00:00:00Z',
    ends_at: '2026-12-31T00:00:00Z',
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminAuctionActions, {
      props: { auction: baseAuction, bidsExist: false, actionLoading: false, ...overrides },
    })

  it('renders actions section', () => {
    expect(factory().find('.actions-section').exists()).toBe(true)
  })

  it('shows refresh button always', () => {
    expect(factory().find('.btn-refresh').exists()).toBe(true)
  })

  it('shows end button for active auction', () => {
    expect(factory().find('.btn-end').exists()).toBe(true)
  })

  it('shows cancel button for active auction', () => {
    expect(factory().find('.btn-cancel').exists()).toBe(true)
  })

  it('hides start button for active auction', () => {
    expect(factory().find('.btn-start').exists()).toBe(false)
  })

  it('hides adjudicate button when no bids', () => {
    const w = factory({ auction: { ...baseAuction, status: 'ended' } })
    expect(w.find('.btn-adjudicate').exists()).toBe(false)
  })

  it('shows adjudicate button for ended auction with bids', () => {
    const w = factory({ auction: { ...baseAuction, status: 'ended' }, bidsExist: true })
    expect(w.find('.btn-adjudicate').exists()).toBe(true)
  })

  it('hides cancel for cancelled auction', () => {
    const w = factory({ auction: { ...baseAuction, status: 'cancelled' } })
    expect(w.find('.btn-cancel').exists()).toBe(false)
  })

  it('disables buttons when loading', () => {
    const w = factory({ actionLoading: true })
    expect((w.find('.btn-refresh').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('emits refresh on click', async () => {
    const w = factory()
    await w.find('.btn-refresh').trigger('click')
    expect(w.emitted('refresh')).toBeTruthy()
  })

  it('emits end on end click', async () => {
    const w = factory()
    await w.find('.btn-end').trigger('click')
    expect(w.emitted('end')).toBeTruthy()
  })
})
