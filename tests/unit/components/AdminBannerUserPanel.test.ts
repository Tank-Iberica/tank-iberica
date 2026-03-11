/**
 * Tests for app/components/admin/banner/AdminBannerUserPanel.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminBannerUserPanel from '../../../app/components/admin/banner/AdminBannerUserPanel.vue'

describe('AdminBannerUserPanel', () => {
  const form = {
    text_es: 'Texto ES',
    text_en: 'Text EN',
    url: 'https://tracciona.com',
    from_date: '2026-03-01',
    to_date: '2026-03-31',
    active: true,
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminBannerUserPanel, {
      props: {
        form,
        saving: false,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders section', () => {
    expect(factory().find('.user-panel-banner-section').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h2').text()).toBe('admin.banner.userPanelTitle')
  })

  it('shows hint', () => {
    expect(factory().find('.admin-hint').text()).toBe('admin.banner.userPanelHint')
  })

  it('renders form card', () => {
    expect(factory().find('.form-card').exists()).toBe(true)
  })

  it('renders text inputs', () => {
    expect(factory().findAll('.form-input[type="text"]')).toHaveLength(2)
  })

  it('renders url input', () => {
    expect(factory().find('.form-input[type="url"]').exists()).toBe(true)
  })

  it('renders date inputs', () => {
    expect(factory().findAll('.form-input[type="date"]')).toHaveLength(2)
  })

  it('renders active toggle', () => {
    expect(factory().find('.toggle-input').exists()).toBe(true)
  })

  it('save button enabled when not saving', () => {
    expect(factory().find('.btn-primary').attributes('disabled')).toBeUndefined()
  })

  it('save button disabled when saving', () => {
    expect(factory({ saving: true }).find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('emits save on primary click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('save')).toBeTruthy()
  })
})
