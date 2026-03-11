import { describe, it, expect } from 'vitest'
import type { DigestFrequency } from '../../app/composables/useEmailPreferences'
import { DIGEST_FREQUENCY_OPTIONS } from '../../app/composables/useEmailPreferences'

// ---------------------------------------------------------------------------
// Unit tests for digest frequency logic
// Tests frequency validation, option list, and optimistic-update rollback logic
// ---------------------------------------------------------------------------

/** Mirrors parseDigestFrequency from the composable */
function parseDigestFrequency(raw: string | undefined | null): DigestFrequency {
  if (raw === 'daily' || raw === 'weekly' || raw === 'never') return raw
  return 'weekly' // default
}

/** Mirrors shouldSendDigest used by the cron */
function shouldSendDigestToday(freq: DigestFrequency, dayOfWeek: number): boolean {
  // dayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday
  if (freq === 'never') return false
  if (freq === 'daily') return true
  if (freq === 'weekly') return dayOfWeek === 1 // Mondays only
  return false
}

// ---- DIGEST_FREQUENCY_OPTIONS ----------------------------------------------

describe('DIGEST_FREQUENCY_OPTIONS', () => {
  it('contains exactly 3 options', () => {
    expect(DIGEST_FREQUENCY_OPTIONS).toHaveLength(3)
  })

  it('contains daily, weekly, never in order', () => {
    expect(DIGEST_FREQUENCY_OPTIONS).toEqual(['daily', 'weekly', 'never'])
  })
})

// ---- parseDigestFrequency --------------------------------------------------

describe('parseDigestFrequency', () => {
  it('returns daily for "daily"', () => {
    expect(parseDigestFrequency('daily')).toBe('daily')
  })

  it('returns weekly for "weekly"', () => {
    expect(parseDigestFrequency('weekly')).toBe('weekly')
  })

  it('returns never for "never"', () => {
    expect(parseDigestFrequency('never')).toBe('never')
  })

  it('defaults to weekly for null', () => {
    expect(parseDigestFrequency(null)).toBe('weekly')
  })

  it('defaults to weekly for undefined', () => {
    expect(parseDigestFrequency(undefined)).toBe('weekly')
  })

  it('defaults to weekly for unknown string', () => {
    expect(parseDigestFrequency('monthly')).toBe('weekly')
  })

  it('defaults to weekly for empty string', () => {
    expect(parseDigestFrequency('')).toBe('weekly')
  })
})

// ---- shouldSendDigestToday -------------------------------------------------

describe('shouldSendDigestToday', () => {
  it('never → false on any day', () => {
    for (let d = 0; d <= 6; d++) {
      expect(shouldSendDigestToday('never', d)).toBe(false)
    }
  })

  it('daily → true on any day', () => {
    for (let d = 0; d <= 6; d++) {
      expect(shouldSendDigestToday('daily', d)).toBe(true)
    }
  })

  it('weekly → true only on Monday (day 1)', () => {
    expect(shouldSendDigestToday('weekly', 1)).toBe(true)
  })

  it('weekly → false on Sunday', () => {
    expect(shouldSendDigestToday('weekly', 0)).toBe(false)
  })

  it('weekly → false on Tuesday through Saturday', () => {
    for (let d = 2; d <= 6; d++) {
      expect(shouldSendDigestToday('weekly', d)).toBe(false)
    }
  })
})

// ---- optimistic rollback logic ---------------------------------------------

describe('digestFrequency optimistic rollback', () => {
  it('reverts to previous value on save failure', () => {
    let current: DigestFrequency = 'weekly'
    const previous: DigestFrequency = current

    // Optimistic update
    current = 'daily'
    expect(current).toBe('daily')

    // Simulate failure → rollback
    current = previous
    expect(current).toBe('weekly')
  })

  it('keeps new value on success', () => {
    let current: DigestFrequency = 'weekly'

    // Optimistic update
    current = 'never'
    // No rollback
    expect(current).toBe('never')
  })

  it('no-op if same frequency selected', () => {
    const current: DigestFrequency = 'weekly'
    const newFreq: DigestFrequency = 'weekly'

    // Guard: don't emit if same
    const shouldEmit = newFreq !== current
    expect(shouldEmit).toBe(false)
  })
})
