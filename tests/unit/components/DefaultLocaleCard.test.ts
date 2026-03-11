/**
 * Tests for app/components/admin/config/languages/DefaultLocaleCard.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import DefaultLocaleCard from '../../../app/components/admin/config/languages/DefaultLocaleCard.vue'

describe('DefaultLocaleCard', () => {
  const options = [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'English' },
  ]

  const factory = (defaultLocale = 'es') =>
    shallowMount(DefaultLocaleCard, {
      props: { defaultLocale, options },
    })

  it('renders config-card', () => {
    const w = factory()
    expect(w.find('.config-card').exists()).toBe(true)
  })

  it('shows title', () => {
    const w = factory()
    expect(w.find('.card-title').text()).toBe('admin.configLanguages.defaultLocaleTitle')
  })

  it('shows description', () => {
    const w = factory()
    expect(w.find('.card-description').text()).toBeTruthy()
  })

  it('renders select with options', () => {
    const w = factory()
    const opts = w.findAll('.form-select option')
    expect(opts).toHaveLength(2)
    expect(opts[0].text()).toBe('Español')
    expect(opts[1].text()).toBe('English')
  })

  it('select has current value', () => {
    const w = factory('en')
    expect((w.find('.form-select').element as HTMLSelectElement).value).toBe('en')
  })

  it('emits update on select change', async () => {
    const w = factory()
    const select = w.find('.form-select')
    Object.defineProperty(select.element, 'value', { value: 'en', writable: true })
    await select.trigger('change')
    expect(w.emitted('update')).toBeTruthy()
    expect(w.emitted('update')![0]).toEqual(['en'])
  })
})
