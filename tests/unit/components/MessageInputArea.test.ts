/**
 * Tests for app/components/perfil/mensajes/MessageInputArea.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import MessageInputArea from '../../../app/components/perfil/mensajes/MessageInputArea.vue'

describe('MessageInputArea', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(MessageInputArea, {
      props: {
        value: '',
        sending: false,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders input area', () => {
    expect(factory().find('.message-input-area').exists()).toBe(true)
  })

  it('renders textarea', () => {
    expect(factory().find('.message-input').exists()).toBe(true)
  })

  it('renders send button', () => {
    expect(factory().find('.message-send-btn').exists()).toBe(true)
  })

  it('disables send button when empty value', () => {
    expect(factory().find('.message-send-btn').attributes('disabled')).toBeDefined()
  })

  it('disables send button when sending', () => {
    const w = factory({ value: 'Hello', sending: true })
    expect(w.find('.message-send-btn').attributes('disabled')).toBeDefined()
  })

  it('enables send button when has value and not sending', () => {
    const w = factory({ value: 'Hello' })
    expect(w.find('.message-send-btn').attributes('disabled')).toBeUndefined()
  })

  it('emits send on button click', async () => {
    const w = factory({ value: 'Hello' })
    await w.find('.message-send-btn').trigger('click')
    expect(w.emitted('send')).toBeTruthy()
  })

  it('emits input on textarea input', async () => {
    const w = factory()
    const textarea = w.find('.message-input')
    // Simulate input event
    const inputEl = textarea.element as HTMLTextAreaElement
    Object.defineProperty(inputEl, 'value', { value: 'test msg', writable: true })
    await textarea.trigger('input')
    expect(w.emitted('input')).toBeTruthy()
  })

  it('shows textarea value', () => {
    const w = factory({ value: 'existing text' })
    expect((w.find('.message-input').element as HTMLTextAreaElement).value).toBe('existing text')
  })

  it('disables send for whitespace-only value', () => {
    const w = factory({ value: '   ' })
    expect(w.find('.message-send-btn').attributes('disabled')).toBeDefined()
  })

  it('emits send on enter key', async () => {
    const w = factory({ value: 'hello' })
    await w.find('.message-input').trigger('keydown.enter')
    expect(w.emitted('send')).toBeTruthy()
  })
})
