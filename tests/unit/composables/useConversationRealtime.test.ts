import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const SRC = readFileSync(resolve(ROOT, 'app/composables/useConversation.ts'), 'utf-8')

describe('Supabase Realtime chat buyer↔seller (N40)', () => {
  describe('Realtime subscription', () => {
    it('imports RealtimeChannel type', () => {
      expect(SRC).toContain('RealtimeChannel')
    })

    it('tracks realtimeChannel reference', () => {
      expect(SRC).toContain('let realtimeChannel')
    })

    it('subscribes to realtime updates', () => {
      expect(SRC).toContain('subscribeToRealtime')
    })

    it('creates channel per conversation', () => {
      expect(SRC).toContain('channel(`conv-${conversationId}`)')
    })

    it('calls .subscribe()', () => {
      expect(SRC).toContain('.subscribe()')
    })

    it('has unsubscribeRealtime cleanup', () => {
      expect(SRC).toContain('unsubscribeRealtime')
    })
  })

  describe('Messaging', () => {
    it('tracks messages reactively', () => {
      expect(SRC).toContain('messages = ref')
    })

    it('tracks sending state', () => {
      expect(SRC).toContain('sending')
    })

    it('computes unreadCount', () => {
      expect(SRC).toContain('unreadCount')
      expect(SRC).toContain('!m.is_read')
    })
  })

  describe('Contact data masking', () => {
    it('uses maskContactData for privacy', () => {
      expect(SRC).toContain('maskContactData')
    })

    it('imports from shared helpers', () => {
      expect(SRC).toContain('conversationHelpers')
    })
  })

  describe('Data types', () => {
    it('uses Database type for Supabase client', () => {
      expect(SRC).toContain('useSupabaseClient<Database>()')
    })

    it('exports Conversation type', () => {
      expect(SRC).toContain('export type { Conversation')
    })

    it('exports ConversationMessage type', () => {
      expect(SRC).toContain('ConversationMessage')
    })
  })
})
