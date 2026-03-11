/**
 * Tests for app/components/admin/servicios/ServiciosHeader.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ServiciosHeader from '../../../app/components/admin/servicios/ServiciosHeader.vue'

describe('ServiciosHeader', () => {
  const factory = (loading = false) =>
    shallowMount(ServiciosHeader, {
      props: { loading },
      global: { mocks: { $t: (key: string) => key } },
    })

  it('renders page-header', () => {
    const w = factory()
    expect(w.find('.page-header').exists()).toBe(true)
  })

  it('shows title', () => {
    const w = factory()
    expect(w.find('h1').text()).toBe('admin.servicios.title')
  })

  it('shows refresh button', () => {
    const w = factory()
    expect(w.find('.btn-refresh').text()).toBe('admin.servicios.refresh')
  })

  it('disables refresh button when loading', () => {
    const w = factory(true)
    expect(w.find('.btn-refresh').attributes('disabled')).toBeDefined()
  })

  it('enables refresh button when not loading', () => {
    const w = factory(false)
    expect(w.find('.btn-refresh').attributes('disabled')).toBeUndefined()
  })

  it('emits refresh on button click', async () => {
    const w = factory()
    await w.find('.btn-refresh').trigger('click')
    expect(w.emitted('refresh')).toBeTruthy()
  })
})
