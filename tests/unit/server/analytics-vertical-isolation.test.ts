import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Verifies analytics events include vertical field for multi-vertical isolation.
 * Every analytics event should tag the vertical it belongs to.
 */

const ROOT = resolve(__dirname, '../../..')

function readFile(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), 'utf-8')
}

describe('Analytics vertical isolation', () => {
  const tracking = readFile('app/composables/useAnalyticsTracking.ts')

  it('trackEvent includes vertical field', () => {
    expect(tracking).toContain('vertical: getVerticalSlug()')
  })

  it('imports getVerticalSlug', () => {
    expect(tracking).toContain('getVerticalSlug')
  })

  it('batches events for performance (fire-and-forget)', () => {
    expect(tracking).toContain('batch')
    expect(tracking).toContain("from('analytics_events').insert")
  })

  it('tracks session_id for attribution', () => {
    expect(tracking).toContain('session_id')
  })

  it('includes event schema version', () => {
    expect(tracking).toContain('EVENT_SCHEMA_VERSION')
    expect(tracking).toContain('version:')
  })

  it('includes UTM parameters', () => {
    expect(tracking).toContain('utm_source')
    expect(tracking).toContain('utm_medium')
    expect(tracking).toContain('utm_campaign')
  })

  it('includes device type', () => {
    expect(tracking).toContain('device_type')
  })

  it('only runs on client', () => {
    expect(tracking).toContain('if (!import.meta.client) return')
  })
})
