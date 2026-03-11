/**
 * Tests for app/components/admin/config/languages/ApiKeyCard.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ApiKeyCard from '../../../app/components/admin/config/languages/ApiKeyCard.vue'

describe('ApiKeyCard', () => {
  const factory = (apiKey = 'sk-test-123') =>
    shallowMount(ApiKeyCard, { props: { apiKey } })

  it('renders config-card', () => {
    expect(factory().find('.config-card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.card-title').text()).toBe('API Key')
  })

  it('renders password input', () => {
    expect(factory().find('.form-input').attributes('type')).toBe('password')
  })

  it('has autocomplete off', () => {
    expect(factory().find('.form-input').attributes('autocomplete')).toBe('off')
  })

  it('input has the api key value', () => {
    expect((factory().find('.form-input').element as HTMLInputElement).value).toBe('sk-test-123')
  })

  it('emits update on input', async () => {
    const w = factory()
    const input = w.find('.form-input')
    Object.defineProperty(input.element, 'value', { value: 'new-key', writable: true })
    await input.trigger('input')
    expect(w.emitted('update')).toBeTruthy()
    expect(w.emitted('update')![0]).toEqual(['new-key'])
  })
})
