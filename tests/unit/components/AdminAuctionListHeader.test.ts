/**
 * Tests for app/components/admin/subastas/AdminAuctionListHeader.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'

beforeAll(() => {
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
})

import AdminAuctionListHeader from '../../../app/components/admin/subastas/AdminAuctionListHeader.vue'

describe('AdminAuctionListHeader', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminAuctionListHeader, {
      props: { count: 12, ...overrides },
    })

  it('renders page header', () => {
    expect(factory().find('.page-header').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h1').text()).toBe('admin.subastas.title')
  })

  it('shows count badge', () => {
    expect(factory().find('.count-badge').text()).toBe('12')
  })

  it('shows create button', () => {
    expect(factory().find('.btn-primary').text()).toContain('admin.subastas.create')
  })

  it('emits create on button click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('create')).toBeTruthy()
  })
})
