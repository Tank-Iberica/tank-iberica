/**
 * Tests for app/components/admin/dashboard/BannerStatus.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import BannerStatus from '../../../app/components/admin/dashboard/BannerStatus.vue'

describe('BannerStatus', () => {
  const factory = (props: { enabled: boolean; text: string }) =>
    shallowMount(BannerStatus, {
      props,
      global: {
        stubs: { NuxtLink: { template: '<a><slot /></a>' } },
      },
    })

  it('shows ACTIVO when enabled', () => {
    const w = factory({ enabled: true, text: 'Welcome!' })
    expect(w.find('.status-active').exists()).toBe(true)
    expect(w.find('.status-active').text()).toBe('admin.banner.statusActive')
  })

  it('shows INACTIVO when disabled', () => {
    const w = factory({ enabled: false, text: '' })
    expect(w.find('.status-inactive').exists()).toBe(true)
    expect(w.find('.status-inactive').text()).toBe('admin.banner.statusInactive')
  })

  it('applies active class when enabled', () => {
    const w = factory({ enabled: true, text: '' })
    expect(w.find('.banner-status-card').classes()).toContain('active')
  })

  it('applies inactive class when disabled', () => {
    const w = factory({ enabled: false, text: '' })
    expect(w.find('.banner-status-card').classes()).toContain('inactive')
  })

  it('shows preview text when text is provided', () => {
    const w = factory({ enabled: true, text: 'Hello world' })
    expect(w.find('.banner-preview-text').exists()).toBe(true)
    expect(w.text()).toContain('Hello world')
  })

  it('hides preview text when text is empty', () => {
    const w = factory({ enabled: true, text: '' })
    expect(w.find('.banner-preview-text').exists()).toBe(false)
  })

  it('truncates long text at 40 characters', () => {
    const longText = 'A'.repeat(50)
    const w = factory({ enabled: true, text: longText })
    const preview = w.find('.banner-preview-text').text()
    expect(preview).toContain('...')
    expect(preview.length).toBeLessThan(longText.length + 10) // includes "- " and "..."
  })

  it('shows toggle button with "Desactivar" when enabled', () => {
    const w = factory({ enabled: true, text: '' })
    expect(w.find('.btn-banner-toggle').text()).toBe('admin.banner.deactivate')
    expect(w.find('.btn-banner-toggle').classes()).toContain('btn-deactivate')
  })

  it('shows toggle button with "Activar" when disabled', () => {
    const w = factory({ enabled: false, text: '' })
    expect(w.find('.btn-banner-toggle').text()).toBe('admin.banner.activate')
    expect(w.find('.btn-banner-toggle').classes()).toContain('btn-activate')
  })

  it('emits "toggle" on toggle button click', async () => {
    const w = factory({ enabled: true, text: '' })
    await w.find('.btn-banner-toggle').trigger('click')
    expect(w.emitted('toggle')).toHaveLength(1)
  })

  it('renders edit link', () => {
    const w = factory({ enabled: true, text: '' })
    expect(w.find('.btn-banner-edit').exists()).toBe(true)
  })
})
