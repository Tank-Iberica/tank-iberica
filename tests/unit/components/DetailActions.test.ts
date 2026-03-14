/**
 * Tests for app/components/vehicle/DetailActions.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.stubGlobal('getContact', () => ({
  email: 'info@tracciona.com',
  phone: '+34600000000',
  whatsapp: '34600000000',
}))

import DetailActions from '../../../app/components/vehicle/DetailActions.vue'

describe('DetailActions', () => {
  const defaultProps = {
    vehicleId: 'v-1',
    dealerId: 'd-1',
    sellerUserId: 'u-1',
    emailSubject: 'Test Subject',
    emailBody: 'Test Body',
    shareText: 'Check this out',
    isFav: false,
    inComparison: false,
  }

  const factory = (props = {}) =>
    shallowMount(DetailActions, {
      props: { ...defaultProps, ...props },
      global: {
        mocks: {
          $t: (key: string) => key,
          getContact: () => ({
            email: 'info@tracciona.com',
            phone: '+34600000000',
            whatsapp: '34600000000',
          }),
        },
      },
    })

  it('renders PDF download button', () => {
    const w = factory()
    expect(w.find('.vehicle-pdf-btn').exists()).toBe(true)
  })

  it('emits "pdf" on PDF button click', async () => {
    const w = factory()
    await w.find('.vehicle-pdf-btn').trigger('click')
    expect(w.emitted('pdf')).toHaveLength(1)
  })

  it('shows chat button when sellerUserId is provided', () => {
    const w = factory({ sellerUserId: 'u-1' })
    expect(w.find('.contact-chat').exists()).toBe(true)
  })

  it('hides chat button when sellerUserId is null', () => {
    const w = factory({ sellerUserId: null })
    expect(w.find('.contact-chat').exists()).toBe(false)
  })

  it('emits "start-chat" on chat button click', async () => {
    const w = factory()
    await w.find('.contact-chat').trigger('click')
    expect(w.emitted('start-chat')).toHaveLength(1)
  })

  it('renders email link with correct mailto', () => {
    const w = factory({ emailSubject: 'Hello', emailBody: 'Body text' })
    const link = w.find('.contact-email')
    expect(link.attributes('href')).toContain('mailto:')
    expect(link.attributes('href')).toContain(encodeURIComponent('Hello'))
  })

  it('renders WhatsApp link', () => {
    const w = factory()
    const link = w.find('.contact-whatsapp')
    expect(link.attributes('href')).toContain('wa.me')
  })

  it('renders phone link', () => {
    const w = factory()
    const link = w.find('.contact-call')
    expect(link.attributes('href')).toContain('tel:')
  })

  it('emits "favorite" on favorite button click', async () => {
    const w = factory()
    await w.find('.favorite-btn').trigger('click')
    expect(w.emitted('favorite')).toHaveLength(1)
  })

  it('applies active class when isFav is true', () => {
    const w = factory({ isFav: true })
    expect(w.find('.favorite-btn').classes()).toContain('active')
  })

  it('does not apply active class when isFav is false', () => {
    const w = factory({ isFav: false })
    expect(w.find('.favorite-btn').classes()).not.toContain('active')
  })

  it('emits "share" on share button click', async () => {
    const w = factory()
    await w.find('.share-btn').trigger('click')
    expect(w.emitted('share')).toHaveLength(1)
  })

  it('emits "report" on report button click', async () => {
    const w = factory()
    await w.find('.report-btn').trigger('click')
    expect(w.emitted('report')).toHaveLength(1)
  })

  it('emits "compare" on compare button click', async () => {
    const w = factory()
    await w.find('.compare-btn').trigger('click')
    expect(w.emitted('compare')).toHaveLength(1)
  })

  it('applies active class on compare-btn when inComparison is true', () => {
    const w = factory({ inComparison: true })
    expect(w.find('.compare-btn').classes()).toContain('active')
  })

  it('emits "contact-click" with args on email click', async () => {
    const w = factory()
    await w.find('.contact-email').trigger('click')
    const emitted = w.emitted('contact-click')
    expect(emitted).toHaveLength(1)
    expect(emitted![0]).toEqual(['v-1', 'd-1', 'form'])
  })

  it('emits "contact-click" with args on whatsapp click', async () => {
    const w = factory()
    await w.find('.contact-whatsapp').trigger('click')
    const emitted = w.emitted('contact-click')
    expect(emitted).toHaveLength(1)
    expect(emitted![0]).toEqual(['v-1', 'd-1', 'whatsapp'])
  })

  it('emits "contact-click" with args on phone click', async () => {
    const w = factory()
    await w.find('.contact-call').trigger('click')
    const emitted = w.emitted('contact-click')
    expect(emitted).toHaveLength(1)
    expect(emitted![0]).toEqual(['v-1', 'd-1', 'phone'])
  })
})
