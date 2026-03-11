/**
 * Tests for app/components/admin/config/navigation/SocialLinks.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import SocialLinks from '../../../app/components/admin/config/navigation/SocialLinks.vue'

describe('SocialLinks', () => {
  const socialLinks = {
    linkedin: 'https://linkedin.com/company/tracciona',
    instagram: 'https://instagram.com/tracciona',
    facebook: '',
    x: '',
  }

  const factory = () =>
    shallowMount(SocialLinks, {
      props: { socialLinks },
    })

  it('renders config-card', () => {
    const w = factory()
    expect(w.find('.config-card').exists()).toBe(true)
  })

  it('shows title', () => {
    const w = factory()
    expect(w.find('.card-title').text()).toBe('Redes Sociales')
  })

  it('renders 4 social fields', () => {
    const w = factory()
    expect(w.findAll('.form-group')).toHaveLength(4)
  })

  it('shows labels for each platform', () => {
    const w = factory()
    const labels = w.findAll('.form-group label')
    expect(labels[0].text()).toBe('LinkedIn')
    expect(labels[1].text()).toBe('Instagram')
    expect(labels[2].text()).toBe('Facebook')
    expect(labels[3].text()).toBe('X (Twitter)')
  })

  it('linkedin input has correct value', () => {
    const w = factory()
    const input = w.find('#social-linkedin')
    expect((input.element as HTMLInputElement).value).toBe('https://linkedin.com/company/tracciona')
  })

  it('empty fields have empty value', () => {
    const w = factory()
    const input = w.find('#social-facebook')
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('emits update-field on input', async () => {
    const w = factory()
    const input = w.find('#social-linkedin')
    Object.defineProperty(input.element, 'value', { value: 'https://linkedin.com/new', writable: true })
    await input.trigger('input')
    expect(w.emitted('update-field')).toBeTruthy()
    expect(w.emitted('update-field')![0]).toEqual(['linkedin', 'https://linkedin.com/new'])
  })

  it('has placeholder for each input', () => {
    const w = factory()
    expect(w.find('#social-linkedin').attributes('placeholder')).toContain('linkedin.com')
    expect(w.find('#social-instagram').attributes('placeholder')).toContain('instagram.com')
  })
})
