/**
 * Tests for app/components/admin/config/branding/BrandingIdentityCard.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import BrandingIdentityCard from '../../../app/components/admin/config/branding/BrandingIdentityCard.vue'

const baseProps = {
  name: { es: 'Tracciona', en: 'Tracciona' },
  tagline: { es: 'Vehiculos industriales', en: 'Industrial vehicles' },
  metaDescription: { es: 'Descripcion SEO', en: 'SEO description' },
}

describe('BrandingIdentityCard', () => {
  const factory = (overrides: Partial<typeof baseProps> = {}) =>
    shallowMount(BrandingIdentityCard, {
      props: { ...baseProps, ...overrides },
    })

  it('renders card title', () => {
    const w = factory()
    expect(w.find('.card-title').text()).toBe('Identidad')
  })

  it('renders subtitle', () => {
    const w = factory()
    expect(w.find('.card-subtitle').text()).toContain('Nombre, lema y descripcion')
  })

  it('renders 3 form groups', () => {
    const w = factory()
    expect(w.findAll('.form-group')).toHaveLength(3)
  })

  it('renders 6 language fields (2 per form group)', () => {
    const w = factory()
    expect(w.findAll('.lang-field')).toHaveLength(6)
  })

  it('renders ES and EN badges', () => {
    const w = factory()
    const badges = w.findAll('.lang-badge')
    expect(badges.length).toBe(6)
    expect(badges[0].text()).toBe('ES')
    expect(badges[1].text()).toBe('EN')
  })

  it('sets input values from props', () => {
    const w = factory()
    const inputs = w.findAll('input')
    expect((inputs[0].element as HTMLInputElement).value).toBe('Tracciona')
    expect((inputs[1].element as HTMLInputElement).value).toBe('Tracciona')
  })

  it('emits update:name on name ES input', async () => {
    const w = factory()
    const inputs = w.findAll('input')
    await inputs[0].setValue('NuevoNombre')
    const emitted = w.emitted('update:name')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual({ es: 'NuevoNombre', en: 'Tracciona' })
  })

  it('emits update:name on name EN input', async () => {
    const w = factory()
    const inputs = w.findAll('input')
    await inputs[1].setValue('NewName')
    const emitted = w.emitted('update:name')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual({ es: 'Tracciona', en: 'NewName' })
  })

  it('emits update:tagline on tagline input', async () => {
    const w = factory()
    const inputs = w.findAll('input')
    await inputs[2].setValue('Nuevo lema')
    const emitted = w.emitted('update:tagline')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual({ es: 'Nuevo lema', en: 'Industrial vehicles' })
  })

  it('emits update:metaDescription on metaDescription input', async () => {
    const w = factory()
    const inputs = w.findAll('input')
    await inputs[4].setValue('Nueva desc')
    const emitted = w.emitted('update:metaDescription')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual({ es: 'Nueva desc', en: 'SEO description' })
  })

  it('shows correct placeholders for name fields', () => {
    const w = factory()
    const inputs = w.findAll('input')
    expect((inputs[0].element as HTMLInputElement).placeholder).toBe('Nombre en espanol')
    expect((inputs[1].element as HTMLInputElement).placeholder).toBe('Site name in English')
  })
})
