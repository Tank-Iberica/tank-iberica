/**
 * Tests for app/components/subastas/index/SubastasError.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import SubastasError from '../../../app/components/subastas/index/SubastasError.vue'

describe('SubastasError', () => {
  const UiErrorStateStub = {
    template: '<div class="auctions-error"><p>{{ description }}</p><slot name="actions" /></div>',
    props: ['type', 'title', 'description', 'hint'],
  }

  const factory = (msg = 'Error al cargar') =>
    shallowMount(SubastasError, {
      props: { message: msg },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: { UiErrorState: UiErrorStateStub },
      },
    })

  it('renders error state', () => {
    expect(factory().find('.auctions-error').exists()).toBe(true)
  })

  it('shows error message', () => {
    expect(factory().find('p').text()).toBe('Error al cargar')
  })

  it('shows retry button', () => {
    expect(factory().find('.btn-retry').text()).toBe('auction.retry')
  })

  it('emits retry on button click', async () => {
    const w = factory()
    await w.find('.btn-retry').trigger('click')
    expect(w.emitted('retry')).toBeTruthy()
  })
})
