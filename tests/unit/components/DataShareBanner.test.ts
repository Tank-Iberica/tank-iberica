/**
 * Tests for app/components/perfil/mensajes/DataShareBanner.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import DataShareBanner from '../../../app/components/perfil/mensajes/DataShareBanner.vue'

describe('DataShareBanner', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DataShareBanner, {
      props: { hasAcceptedShare: false, ...overrides },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders banner', () => {
    expect(factory().find('.data-share-banner').exists()).toBe(true)
  })

  it('shows data share notice when not accepted', () => {
    expect(factory().find('.data-share-banner__text').text()).toBe('messages.dataShareNotice')
  })

  it('shows waiting message when accepted', () => {
    expect(factory({ hasAcceptedShare: true }).find('.data-share-banner__text').text()).toBe(
      'messages.waitingOtherPartyShare',
    )
  })

  it('shows share button when not accepted', () => {
    expect(factory().find('.data-share-banner__btn').exists()).toBe(true)
  })

  it('hides share button when accepted', () => {
    expect(factory({ hasAcceptedShare: true }).find('.data-share-banner__btn').exists()).toBe(false)
  })

  it('shows share button label', () => {
    expect(factory().find('.data-share-banner__btn').text()).toBe('messages.shareData')
  })

  it('emits accept-share on button click', async () => {
    const w = factory()
    await w.find('.data-share-banner__btn').trigger('click')
    expect(w.emitted('accept-share')).toHaveLength(1)
  })

  it('renders lock icon', () => {
    expect(factory().find('.data-share-banner__icon').exists()).toBe(true)
  })
})
