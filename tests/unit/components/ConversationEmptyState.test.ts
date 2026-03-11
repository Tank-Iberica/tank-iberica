/**
 * Tests for app/components/perfil/mensajes/ConversationEmptyState.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import ConversationEmptyState from '../../../app/components/perfil/mensajes/ConversationEmptyState.vue'

describe('ConversationEmptyState', () => {
  const factory = () =>
    shallowMount(ConversationEmptyState, {
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders empty state wrapper', () => {
    expect(factory().find('.conv-detail-empty').exists()).toBe(true)
  })

  it('shows icon svg', () => {
    expect(factory().find('svg').exists()).toBe(true)
  })

  it('shows select conversation text', () => {
    expect(factory().find('.conv-detail-empty__text').text()).toBe('messages.selectConversation')
  })
})
