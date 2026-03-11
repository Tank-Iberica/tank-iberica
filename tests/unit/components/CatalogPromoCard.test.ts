/**
 * Tests for app/components/catalog/CatalogPromoCard.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { computed, ref } from 'vue'

// Use real Vue computed/ref so proxyRefs() in the template unwraps correctly
beforeAll(() => {
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('ref', ref)
})

import CatalogPromoCard from '../../../app/components/catalog/CatalogPromoCard.vue'

const makeSlot = (overrides = {}): Record<string, unknown> => ({
  icon: '\uD83D\uDE9B',
  titleKey: 'promo.title',
  ctaKey: 'promo.cta',
  variant: 'default',
  ...overrides,
})

describe('CatalogPromoCard', () => {
  const factory = (slots: Record<string, unknown>[]) =>
    shallowMount(CatalogPromoCard, {
      props: { slots: slots as any },
      global: {
        mocks: { $t: (key: string) => key },
      },
    })

  // ── Single slot mode ──

  it('renders a single slot card', () => {
    const w = factory([makeSlot()])
    expect(w.find('.promo-card').exists()).toBe(true)
    expect(w.findAll('.promo-slot')).toHaveLength(1)
  })

  it('displays slot title', () => {
    const w = factory([makeSlot({ titleKey: 'promo.myTitle' })])
    expect(w.find('.promo-slot__title').text()).toBe('promo.myTitle')
  })

  it('displays slot description when descKey is provided', () => {
    const w = factory([makeSlot({ descKey: 'promo.desc' })])
    expect(w.find('.promo-slot__desc').text()).toBe('promo.desc')
  })

  it('hides description when descKey is absent', () => {
    const w = factory([makeSlot()])
    expect(w.find('.promo-slot__desc').exists()).toBe(false)
  })

  it('renders emoji icon for short icon strings', () => {
    const w = factory([makeSlot({ icon: '\uD83D\uDD25' })])
    expect(w.find('.promo-slot__emoji').exists()).toBe(true)
  })

  it('renders SVG for long icon strings', () => {
    const w = factory([makeSlot({ icon: '<path d="M0 0"/>' })])
    expect(w.find('.promo-slot__svg').exists()).toBe(true)
  })

  it('renders badge when provided', () => {
    const w = factory([makeSlot({ badge: '12 vehículos' })])
    expect(w.find('.promo-slot__badge').text()).toBe('12 vehículos')
  })

  it('hides badge when not provided', () => {
    const w = factory([makeSlot()])
    expect(w.find('.promo-slot__badge').exists()).toBe(false)
  })

  it('emits "action" with index on CTA click', async () => {
    const w = factory([makeSlot()])
    await w.find('.promo-btn--primary').trigger('click')
    expect(w.emitted('action')).toEqual([[0]])
  })

  it('renders secondary CTA in single mode', () => {
    const w = factory([makeSlot({ ctaSecondaryKey: 'promo.secondary' })])
    expect(w.find('.promo-btn--outline').exists()).toBe(true)
    expect(w.find('.promo-btn--outline').text()).toBe('promo.secondary')
  })

  it('emits "actionSecondary" on secondary CTA click', async () => {
    const w = factory([makeSlot({ ctaSecondaryKey: 'promo.sec' })])
    await w.find('.promo-btn--outline').trigger('click')
    expect(w.emitted('actionSecondary')).toEqual([[0]])
  })

  // ── Split mode (two slots) ──

  it('renders split card with two slots', () => {
    const w = factory([makeSlot(), makeSlot({ titleKey: 'promo.second' })])
    expect(w.find('.promo-card--split').exists()).toBe(true)
    expect(w.findAll('.promo-slot')).toHaveLength(2)
  })

  it('hides secondary CTA in split mode', () => {
    const w = factory([
      makeSlot({ ctaSecondaryKey: 'promo.sec' }),
      makeSlot(),
    ])
    expect(w.findAll('.promo-btn--outline')).toHaveLength(0)
  })

  it('emits "action" with correct index for second slot', async () => {
    const w = factory([makeSlot(), makeSlot()])
    const buttons = w.findAll('.promo-btn--primary')
    await buttons[1].trigger('click')
    expect(w.emitted('action')).toEqual([[1]])
  })

  // ── Variant classes ──

  it('applies variant class to slot', () => {
    const w = factory([makeSlot({ variant: 'gold' })])
    expect(w.find('.promo-slot').classes()).toContain('promo-slot--gold')
  })

  it('applies primary variant class to card root', () => {
    const w = factory([makeSlot({ variant: 'primary' })])
    expect(w.find('.promo-card').classes()).toContain('promo-card--primary-primary')
  })
})
