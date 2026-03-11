/**
 * Tests for app/components/dashboard/herramientas/exportar-anuncio/ExportAnuncioPlatformSelector.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'

beforeAll(() => {
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
})

import ExportAnuncioPlatformSelector from '../../../app/components/dashboard/herramientas/exportar-anuncio/ExportAnuncioPlatformSelector.vue'

describe('ExportAnuncioPlatformSelector', () => {
  const platforms = [
    { key: 'wallapop', label: 'Wallapop', maxChars: 640 },
    { key: 'facebook', label: 'Facebook', maxChars: 5000 },
    { key: 'milanuncios', label: 'Milanuncios', maxChars: 4000 },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ExportAnuncioPlatformSelector, {
      props: { platforms, selectedPlatform: 'wallapop', canGenerate: true, ...overrides },
    })

  it('renders card', () => {
    expect(factory().find('.card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.card-title').text()).toBe('dashboard.adExport.selectPlatform')
  })

  it('renders platform buttons', () => {
    expect(factory().findAll('.platform-btn')).toHaveLength(3)
  })

  it('shows platform names', () => {
    const btns = factory().findAll('.platform-btn')
    expect(btns[0].find('.platform-name').text()).toBe('Wallapop')
    expect(btns[1].find('.platform-name').text()).toBe('Facebook')
  })

  it('marks selected platform as active', () => {
    expect(factory().findAll('.platform-btn')[0].classes()).toContain('active')
  })

  it('emits select on platform click', async () => {
    const w = factory()
    await w.findAll('.platform-btn')[1].trigger('click')
    expect(w.emitted('select')![0]).toEqual(['facebook'])
  })

  it('generate button is enabled when canGenerate', () => {
    expect(factory().find('.btn-generate').attributes('disabled')).toBeUndefined()
  })

  it('generate button is disabled when !canGenerate', () => {
    expect(factory({ canGenerate: false }).find('.btn-generate').attributes('disabled')).toBeDefined()
  })

  it('emits generate on button click', async () => {
    const w = factory()
    await w.find('.btn-generate').trigger('click')
    expect(w.emitted('generate')).toBeTruthy()
  })
})
