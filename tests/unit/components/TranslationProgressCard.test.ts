/**
 * Tests for app/components/admin/config/languages/TranslationProgressCard.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import TranslationProgressCard from '../../../app/components/admin/config/languages/TranslationProgressCard.vue'

describe('TranslationProgressCard', () => {
  const progress = [
    { locale: 'en', label: 'English', existing: 80, expected: 100, percentage: 80 },
    { locale: 'fr', label: 'Français', existing: 30, expected: 100, percentage: 30 },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(TranslationProgressCard, {
      props: {
        progress,
        loadingProgress: false,
        visible: true,
        ...overrides,
      },
    })

  it('renders when visible', () => {
    expect(factory().find('.config-card').exists()).toBe(true)
  })

  it('hides when not visible', () => {
    expect(factory({ visible: false }).find('.config-card').exists()).toBe(false)
  })

  it('shows title', () => {
    expect(factory().find('.card-title').text()).toBe('admin.configLanguages.progressTitle')
  })

  it('shows loading state', () => {
    expect(factory({ loadingProgress: true }).find('.progress-loading').text()).toBe('Cargando progreso...')
  })

  it('renders progress items', () => {
    expect(factory().findAll('.progress-item')).toHaveLength(2)
  })

  it('shows locale label', () => {
    expect(factory().find('.progress-locale').text()).toBe('English')
  })

  it('shows count text', () => {
    expect(factory().find('.progress-count').text()).toBe('80 / 100 traducciones')
  })

  it('shows percentage', () => {
    expect(factory().find('.progress-percentage').text()).toBe('80%')
  })

  it('sets bar width from percentage', () => {
    expect(factory().find('.progress-bar-fill').attributes('style')).toContain('width: 80%')
  })

  it('shows empty state when no progress', () => {
    expect(factory({ progress: [] }).find('.progress-empty').text()).toBe(
      'No hay traducciones esperadas todavia.',
    )
  })
})
