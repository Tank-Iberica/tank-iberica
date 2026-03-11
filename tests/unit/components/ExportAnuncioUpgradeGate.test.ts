/**
 * Tests for app/components/dashboard/herramientas/exportar-anuncio/ExportAnuncioUpgradeGate.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'

beforeAll(() => {
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
})

import ExportAnuncioUpgradeGate from '../../../app/components/dashboard/herramientas/exportar-anuncio/ExportAnuncioUpgradeGate.vue'

describe('ExportAnuncioUpgradeGate', () => {
  const factory = () =>
    shallowMount(ExportAnuncioUpgradeGate, {
      global: {
        stubs: {
          NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
        },
      },
    })

  it('renders upgrade card', () => {
    expect(factory().find('.upgrade-card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h2').text()).toBe('dashboard.adExport.upgradeTitle')
  })

  it('shows description', () => {
    expect(factory().find('p').text()).toBe('dashboard.adExport.upgradeDesc')
  })

  it('shows CTA button', () => {
    expect(factory().find('.btn-upgrade').text()).toBe('dashboard.adExport.upgradeCta')
  })

  it('CTA links to suscripcion', () => {
    expect(factory().find('.btn-upgrade').attributes('href')).toBe('/dashboard/suscripcion')
  })
})
