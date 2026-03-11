/**
 * Tests for app/components/admin/dealer/DealerContactSection.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import DealerContactSection from '../../../app/components/admin/dealer/DealerContactSection.vue'

describe('DealerContactSection', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DealerContactSection, {
      props: {
        phone: '+34 600 000 000',
        email: 'info@empresa.com',
        website: 'https://www.empresa.com',
        address: 'Calle Mayor 1, Madrid',
        whatsapp: '+34 600 000 001',
        phoneMode: 'whatsapp',
        workingHours: { es: 'L-V 9-18', en: 'Mon-Fri 9-18' },
        ctaText: { es: 'Contactar', en: 'Contact' },
        socialLinkedIn: 'https://linkedin.com/company/test',
        socialInstagram: 'https://instagram.com/test',
        socialFacebook: 'https://facebook.com/test',
        socialYouTube: 'https://youtube.com/test',
        phoneModeOptions: [
          { value: 'whatsapp', label: 'WhatsApp' },
          { value: 'phone', label: 'Phone' },
        ],
        ...overrides,
      },
    })

  it('renders config card', () => {
    expect(factory().find('.config-card').exists()).toBe(true)
  })

  it('shows card title', () => {
    expect(factory().find('.card-title').text()).toBe('admin.dealer.contactTitle')
  })

  it('shows phone input', () => {
    const input = factory().find('#dealer-phone')
    expect((input.element as HTMLInputElement).value).toBe('+34 600 000 000')
  })

  it('shows whatsapp input', () => {
    const input = factory().find('#dealer-whatsapp')
    expect((input.element as HTMLInputElement).value).toBe('+34 600 000 001')
  })

  it('shows email input', () => {
    const input = factory().find('#dealer-email')
    expect((input.element as HTMLInputElement).value).toBe('info@empresa.com')
  })

  it('shows website input', () => {
    const input = factory().find('#dealer-website')
    expect((input.element as HTMLInputElement).value).toBe('https://www.empresa.com')
  })

  it('shows address input', () => {
    const input = factory().find('#dealer-address')
    expect((input.element as HTMLInputElement).value).toBe('Calle Mayor 1, Madrid')
  })
})
