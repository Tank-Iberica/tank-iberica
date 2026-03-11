/**
 * Tests for app/components/admin/config/languages/TranslationEngineCard.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminLanguages', () => ({
  translationEngines: [
    { value: 'deepl', label: 'DeepL' },
    { value: 'google', label: 'Google Translate' },
    { value: 'openai', label: 'OpenAI' },
  ],
}))

import TranslationEngineCard from '../../../app/components/admin/config/languages/TranslationEngineCard.vue'

describe('TranslationEngineCard', () => {
  const factory = (engine = 'deepl') =>
    shallowMount(TranslationEngineCard, { props: { engine } })

  it('renders config-card', () => {
    expect(factory().find('.config-card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.card-title').text()).toBe('admin.configLanguages.engineTitle')
  })

  it('renders 3 radio options', () => {
    expect(factory().findAll('.radio-label')).toHaveLength(3)
  })

  it('selected engine radio is checked', () => {
    const w = factory('google')
    const radios = w.findAll('input[type="radio"]')
    expect((radios[1].element as HTMLInputElement).checked).toBe(true)
  })

  it('emits update on radio change', async () => {
    const w = factory()
    const radio = w.findAll('input[type="radio"]')[2]
    Object.defineProperty(radio.element, 'value', { value: 'openai', writable: true })
    await radio.trigger('change')
    expect(w.emitted('update')).toBeTruthy()
    expect(w.emitted('update')![0]).toEqual(['openai'])
  })
})
