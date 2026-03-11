/**
 * Tests for app/components/admin/config/languages/AutoTranslateCard.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import AutoTranslateCard from '../../../app/components/admin/config/languages/AutoTranslateCard.vue'

describe('AutoTranslateCard', () => {
  const factory = (enabled = false) =>
    shallowMount(AutoTranslateCard, { props: { enabled } })

  it('renders config-card', () => {
    expect(factory().find('.config-card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.card-title').text()).toBe('admin.configLanguages.autoTranslateTitle')
  })

  it('shows "Desactivado" when disabled', () => {
    expect(factory(false).find('.toggle-text').text()).toBe('common.disabled')
  })

  it('shows "Activado" when enabled', () => {
    expect(factory(true).find('.toggle-text').text()).toBe('common.enabled')
  })

  it('checkbox is unchecked when disabled', () => {
    expect((factory(false).find('.toggle-input').element as HTMLInputElement).checked).toBe(false)
  })

  it('checkbox is checked when enabled', () => {
    expect((factory(true).find('.toggle-input').element as HTMLInputElement).checked).toBe(true)
  })

  it('emits update on checkbox change', async () => {
    const w = factory(false)
    const input = w.find('.toggle-input')
    Object.defineProperty(input.element, 'checked', { value: true, writable: true })
    await input.trigger('change')
    expect(w.emitted('update')).toBeTruthy()
    expect(w.emitted('update')![0]).toEqual([true])
  })
})
