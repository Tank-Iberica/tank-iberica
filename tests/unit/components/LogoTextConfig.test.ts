/**
 * Tests for app/components/shared/LogoTextConfig.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { computed } from 'vue'

// Translations needed for LogoTextConfig's i18n calls
const ltcTranslations: Record<string, string> = {
  'shared.logoText.previewFallback': 'Tu empresa',
  'shared.logoText.hint': 'Se mostrará cuando no haya logo subido.',
  'shared.logoText.previewAriaLabel': 'Previsualización del nombre',
  'shared.logoText.fontFamily': 'Tipografía',
  'shared.logoText.fontWeight': 'Peso',
  'shared.logoText.letterSpacing': 'Espaciado de letra',
  'shared.logoText.italic': 'Cursiva',
  'shared.logoText.uppercase': 'Mayúsculas',
}

beforeAll(() => {
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('watch', vi.fn())
  vi.stubGlobal('useI18n', () => ({
    locale: { value: 'es' },
    t: (key: string) => ltcTranslations[key] ?? key,
  }))
  // Prevent import.meta.client check from doing DOM operations
  Object.defineProperty(import.meta, 'client', { value: false, writable: true })
})

import LogoTextConfig, {
  CURATED_FONTS,
  LETTER_SPACING_OPTIONS,
  WEIGHT_LABELS,
} from '../../../app/components/shared/LogoTextConfig.vue'

describe('LogoTextConfig', () => {
  const defaultSettings = {
    font_family: 'Inter',
    font_weight: '600',
    letter_spacing: '0em',
    italic: false,
    uppercase: false,
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(LogoTextConfig, {
      props: {
        previewName: 'Mi Empresa',
        modelValue: defaultSettings,
        ...overrides,
      },
    })

  it('renders logo-text-config container', () => {
    const w = factory()
    expect(w.find('.logo-text-config').exists()).toBe(true)
  })

  it('shows preview text with company name', () => {
    const w = factory()
    expect(w.find('.ltc-preview-text').text()).toBe('Mi Empresa')
  })

  it('shows default company name when previewName is empty', () => {
    const w = factory({ previewName: '' })
    expect(w.find('.ltc-preview-text').text()).toBe('Tu empresa')
  })

  it('renders font family select with all curated fonts', () => {
    const w = factory()
    const options = w.findAll('.ltc-select option')
    expect(options).toHaveLength(CURATED_FONTS.length)
  })

  it('renders weight buttons for selected font', () => {
    const w = factory()
    const font = CURATED_FONTS.find((f) => f.value === 'Inter')!
    const btns = w.findAll('.ltc-weight-btn')
    expect(btns).toHaveLength(font.weights.length)
  })

  it('active weight button has active class', () => {
    const w = factory()
    const activeBtn = w.findAll('.ltc-weight-btn').find((b) => b.classes().includes('active'))
    expect(activeBtn).toBeTruthy()
    expect(activeBtn!.text()).toBe(WEIGHT_LABELS[600])
  })

  it('renders letter spacing buttons', () => {
    const w = factory()
    const btns = w.findAll('.ltc-spacing-btn')
    expect(btns).toHaveLength(LETTER_SPACING_OPTIONS.length)
  })

  it('active spacing button has active class', () => {
    const w = factory()
    const active = w.findAll('.ltc-spacing-btn').find((b) => b.classes().includes('active'))
    expect(active).toBeTruthy()
    expect(active!.text()).toBe('Normal')
  })

  it('renders italic toggle button', () => {
    const w = factory()
    const toggleBtns = w.findAll('.ltc-toggle-btn')
    expect(toggleBtns[0].text()).toContain('Cursiva')
  })

  it('renders uppercase toggle button', () => {
    const w = factory()
    const toggleBtns = w.findAll('.ltc-toggle-btn')
    expect(toggleBtns[1].text()).toContain('Mayúsculas')
  })

  it('italic button has aria-pressed false when not italic', () => {
    const w = factory()
    const toggleBtns = w.findAll('.ltc-toggle-btn')
    expect(toggleBtns[0].attributes('aria-pressed')).toBe('false')
  })

  it('italic button has aria-pressed true when italic', () => {
    const w = factory({ modelValue: { ...defaultSettings, italic: true } })
    const toggleBtns = w.findAll('.ltc-toggle-btn')
    expect(toggleBtns[0].attributes('aria-pressed')).toBe('true')
  })

  it('emits update:modelValue on font weight click', async () => {
    const w = factory()
    const firstBtn = w.findAll('.ltc-weight-btn')[0]
    await firstBtn.trigger('click')
    expect(w.emitted('update:modelValue')).toBeTruthy()
  })

  it('emits update:modelValue on spacing click', async () => {
    const w = factory()
    const firstBtn = w.findAll('.ltc-spacing-btn')[0]
    await firstBtn.trigger('click')
    expect(w.emitted('update:modelValue')).toBeTruthy()
  })

  it('emits update:modelValue on italic toggle', async () => {
    const w = factory()
    await w.findAll('.ltc-toggle-btn')[0].trigger('click')
    const emitted = w.emitted('update:modelValue')!
    expect(emitted[0][0]).toEqual(expect.objectContaining({ italic: true }))
  })

  it('emits update:modelValue on uppercase toggle', async () => {
    const w = factory()
    await w.findAll('.ltc-toggle-btn')[1].trigger('click')
    const emitted = w.emitted('update:modelValue')!
    expect(emitted[0][0]).toEqual(expect.objectContaining({ uppercase: true }))
  })

  it('preview has correct font style', () => {
    const w = factory({ modelValue: { ...defaultSettings, italic: true, uppercase: true } })
    const style = w.find('.ltc-preview-text').attributes('style')
    expect(style).toContain('italic')
    expect(style).toContain('uppercase')
  })

  it('exports CURATED_FONTS with correct structure', () => {
    expect(CURATED_FONTS.length).toBeGreaterThan(0)
    CURATED_FONTS.forEach((font) => {
      expect(font).toHaveProperty('value')
      expect(font).toHaveProperty('label')
      expect(font).toHaveProperty('weights')
      expect(font.weights.length).toBeGreaterThan(0)
    })
  })

  it('exports LETTER_SPACING_OPTIONS with correct structure', () => {
    expect(LETTER_SPACING_OPTIONS.length).toBeGreaterThan(0)
    LETTER_SPACING_OPTIONS.forEach((opt) => {
      expect(opt).toHaveProperty('value')
      expect(opt).toHaveProperty('label')
    })
  })
})
