import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const SRC = readFileSync(resolve(ROOT, 'app/composables/useAnalyticsTracking.ts'), 'utf-8')

describe('Batch writes analytics_events (#243)', () => {
  describe('Buffer configuration', () => {
    it('defines BATCH_FLUSH_MS constant (10 seconds)', () => {
      expect(SRC).toContain('BATCH_FLUSH_MS')
      expect(SRC).toContain('10_000')
    })

    it('has an event buffer array', () => {
      expect(SRC).toContain('_eventBuffer')
    })

    it('has a flush timer reference', () => {
      expect(SRC).toContain('_flushTimer')
    })
  })

  describe('Buffer mechanics', () => {
    it('pushes events to buffer instead of immediate INSERT', () => {
      expect(SRC).toContain('_eventBuffer.push(row)')
    })

    it('schedules flush after BATCH_FLUSH_MS', () => {
      expect(SRC).toContain('setTimeout')
      expect(SRC).toContain('BATCH_FLUSH_MS')
      expect(SRC).toContain('flushEventBuffer')
    })

    it('uses nullish coalescing to avoid multiple timers', () => {
      // _flushTimer ??= setTimeout(...)
      expect(SRC).toContain('_flushTimer ??=')
    })

    it('clears timer reference before flushing', () => {
      expect(SRC).toContain('_flushTimer = null')
    })
  })

  describe('Flush behavior', () => {
    it('flushEventBuffer splices the buffer (empties it)', () => {
      expect(SRC).toContain('_eventBuffer.splice(0)')
    })

    it('uses batch INSERT to Supabase', () => {
      expect(SRC).toContain(".from('analytics_events').insert(")
    })

    it('skips flush when buffer is empty', () => {
      expect(SRC).toContain('_eventBuffer.length === 0')
      expect(SRC).toContain('return')
    })
  })

  describe('Page unload handling', () => {
    it('flushes on visibilitychange (hidden)', () => {
      expect(SRC).toContain('visibilitychange')
      expect(SRC).toContain("document.visibilityState === 'hidden'")
      expect(SRC).toContain('flushEventBuffer()')
    })

    it('only adds listener on client side', () => {
      expect(SRC).toContain('import.meta.client')
    })
  })

  describe('Event shape', () => {
    it('includes session_id', () => {
      expect(SRC).toContain('session_id')
      expect(SRC).toContain('getSessionId')
    })

    it('includes user_id (nullable)', () => {
      expect(SRC).toContain('user_id')
    })

    it('includes vertical field', () => {
      expect(SRC).toContain('vertical')
      expect(SRC).toContain('getVerticalSlug')
    })

    it('includes event schema version', () => {
      expect(SRC).toContain('EVENT_SCHEMA_VERSION')
      expect(SRC).toContain('version')
    })

    it('includes UTM parameters', () => {
      expect(SRC).toContain('utm_source')
      expect(SRC).toContain('utm_medium')
      expect(SRC).toContain('utm_campaign')
    })

    it('includes device_type and platform', () => {
      expect(SRC).toContain('device_type')
      expect(SRC).toContain('platform')
    })
  })
})
