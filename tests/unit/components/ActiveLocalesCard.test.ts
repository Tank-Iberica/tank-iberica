/**
 * Tests for app/components/admin/config/languages/ActiveLocalesCard.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminLanguages', () => ({
  availableLocales: [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
  ],
}))

import ActiveLocalesCard from '../../../app/components/admin/config/languages/ActiveLocalesCard.vue'

describe('ActiveLocalesCard', () => {
  const factory = (activeLocales = ['es', 'en']) =>
    shallowMount(ActiveLocalesCard, { props: { activeLocales } })

  it('renders config-card', () => {
    expect(factory().find('.config-card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.card-title').text()).toBe('Idiomas Activos')
  })

  it('renders 3 checkboxes', () => {
    expect(factory().findAll('.checkbox-label')).toHaveLength(3)
  })

  it('active locales are checked', () => {
    const w = factory(['es', 'en'])
    const boxes = w.findAll('input[type="checkbox"]')
    expect((boxes[0].element as HTMLInputElement).checked).toBe(true)
    expect((boxes[1].element as HTMLInputElement).checked).toBe(true)
    expect((boxes[2].element as HTMLInputElement).checked).toBe(false)
  })

  it('emits update on checkbox change', async () => {
    const w = factory(['es'])
    const boxes = w.findAll('input[type="checkbox"]')
    Object.defineProperty(boxes[1].element, 'checked', { value: true, writable: true })
    await boxes[1].trigger('change')
    expect(w.emitted('update')).toBeTruthy()
    expect(w.emitted('update')![0][0]).toContain('en')
  })
})
