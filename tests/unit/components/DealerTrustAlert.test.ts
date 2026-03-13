/**
 * Tests for app/components/vehicle/DealerTrustAlert.vue
 *
 * Tests:
 *  - No alerts rendered when all signals are clean
 *  - New account alert for dealer created < 7 days ago
 *  - Low trust alert when trust_score < 60
 *  - Unverified alert when trust_score null and verified = false
 *  - Few photos alert when imageCount < 3
 *  - Multiple alerts shown simultaneously
 *  - No unverified alert when trust_score >= 60 (takes precedence)
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { computed } from 'vue'

beforeAll(() => {
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('useI18n', () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }))
})

import DealerTrustAlert from '../../../app/components/vehicle/DealerTrustAlert.vue'

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

function factory(props: {
  dealerVerified?: boolean | null
  dealerTrustScore?: number | null
  dealerCreatedAt?: string | null
  imageCount?: number
  price?: number | null
}) {
  return shallowMount(DealerTrustAlert, {
    props: {
      dealerVerified: props.dealerVerified ?? null,
      dealerTrustScore: props.dealerTrustScore ?? null,
      dealerCreatedAt: props.dealerCreatedAt ?? null,
      imageCount: props.imageCount ?? 5,
      price: props.price ?? null,
    },
    global: { mocks: { $t: (k: string, fb?: string) => fb ?? k } },
  })
}

describe('DealerTrustAlert', () => {
  it('renders no alerts when all signals are clean', () => {
    const wrapper = factory({
      dealerVerified: true,
      dealerTrustScore: 85,
      dealerCreatedAt: daysAgo(60),
      imageCount: 5,
    })
    expect(wrapper.find('.dealer-trust-alerts').exists()).toBe(false)
  })

  it('shows new-account alert when dealer created < 7 days ago', () => {
    const wrapper = factory({ dealerCreatedAt: daysAgo(3) })
    const alerts = wrapper.findAll('.trust-alert')
    const texts = alerts.map((a) => a.text())
    expect(texts.some((t) => t.includes('cuenta reciente') || t.includes('días de actividad'))).toBe(true)
  })

  it('does NOT show new-account alert when dealer is older than 7 days', () => {
    const wrapper = factory({
      dealerCreatedAt: daysAgo(30),
      dealerTrustScore: 80,
      imageCount: 5,
    })
    expect(wrapper.find('.dealer-trust-alerts').exists()).toBe(false)
  })

  it('shows low-trust alert when trust_score < 60', () => {
    const wrapper = factory({ dealerTrustScore: 40, dealerCreatedAt: daysAgo(30) })
    const alerts = wrapper.findAll('.trust-alert')
    const texts = alerts.map((a) => a.text())
    expect(texts.some((t) => t.includes('confianza') || t.includes('perfil'))).toBe(true)
  })

  it('shows unverified alert when trust_score is null and verified is false', () => {
    const wrapper = factory({
      dealerVerified: false,
      dealerTrustScore: null,
      dealerCreatedAt: daysAgo(30),
    })
    const alerts = wrapper.findAll('.trust-alert')
    const texts = alerts.map((a) => a.text())
    expect(texts.some((t) => t.includes('no verificado') || t.includes('verificado'))).toBe(true)
  })

  it('shows unverified alert when trust_score >= 60 but verified is false', () => {
    // verified=false can coexist with a moderate score (other criteria contribute to score)
    const wrapper = factory({
      dealerVerified: false,
      dealerTrustScore: 70,
      dealerCreatedAt: daysAgo(30),
      imageCount: 5,
    })
    const alerts = wrapper.findAll('.trust-alert')
    const texts = alerts.map((a) => a.text())
    expect(texts.some((t) => t.includes('no verificado') || t.includes('verificado'))).toBe(true)
  })

  it('shows few-photos alert when imageCount < 3', () => {
    const wrapper = factory({ imageCount: 2, dealerCreatedAt: daysAgo(30), dealerTrustScore: 80 })
    const alerts = wrapper.findAll('.trust-alert')
    const texts = alerts.map((a) => a.text())
    expect(texts.some((t) => t.includes('fotos') || t.includes('foto'))).toBe(true)
  })

  it('does NOT show few-photos alert when imageCount >= 3', () => {
    const wrapper = factory({
      imageCount: 3,
      dealerCreatedAt: daysAgo(30),
      dealerTrustScore: 80,
    })
    expect(wrapper.find('.dealer-trust-alerts').exists()).toBe(false)
  })

  it('shows multiple alerts simultaneously', () => {
    const wrapper = factory({
      dealerTrustScore: 30,
      dealerCreatedAt: daysAgo(2),
      imageCount: 1,
    })
    const alerts = wrapper.findAll('.trust-alert')
    expect(alerts.length).toBeGreaterThanOrEqual(3)
  })

  it('has role="note" on alerts container', () => {
    const wrapper = factory({ dealerCreatedAt: daysAgo(2) })
    expect(wrapper.find('.dealer-trust-alerts').attributes('role')).toBe('note')
  })
})
