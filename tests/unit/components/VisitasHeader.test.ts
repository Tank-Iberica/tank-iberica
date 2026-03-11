/**
 * Tests for app/components/dashboard/herramientas/visitas/VisitasHeader.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import VisitasHeader from '../../../app/components/dashboard/herramientas/visitas/VisitasHeader.vue'

describe('VisitasHeader', () => {
  const factory = (enabled = true) =>
    shallowMount(VisitasHeader, {
      props: { visitsEnabled: enabled },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders header', () => {
    expect(factory().find('.page-header').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h1').text()).toBe('visits.title')
  })

  it('shows subtitle', () => {
    expect(factory().find('.subtitle').text()).toBe('visits.subtitle')
  })

  it('checkbox is checked when enabled', () => {
    expect((factory(true).find('input[type="checkbox"]').element as HTMLInputElement).checked).toBe(true)
  })

  it('checkbox is unchecked when disabled', () => {
    expect((factory(false).find('input[type="checkbox"]').element as HTMLInputElement).checked).toBe(false)
  })

  it('emits toggle-visits on change', async () => {
    const w = factory(false)
    const input = w.find('input[type="checkbox"]')
    Object.defineProperty(input.element, 'checked', { value: true, writable: true })
    await input.trigger('change')
    expect(w.emitted('toggle-visits')).toBeTruthy()
    expect(w.emitted('toggle-visits')![0]).toEqual([true])
  })
})
