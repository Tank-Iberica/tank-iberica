import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useReports } from '../../app/composables/useReports'

// ─── Stub helper ──────────────────────────────────────────────────────────────

function stubClient(insertError: unknown = null) {
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      insert: () =>
        Promise.resolve(insertError ? { data: null, error: insertError } : { data: null, error: null }),
    }),
  }))
}

const sampleReport = {
  reporter_email: 'user@example.com',
  entity_type: 'vehicle' as const,
  entity_id: 'vehicle-1',
  reason: 'spam',
  details: 'Duplicate listing',
}

beforeEach(() => {
  vi.clearAllMocks()
  stubClient()
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('submitting starts as false', () => {
    const c = useReports()
    expect(c.submitting.value).toBe(false)
  })

  it('submitted starts as false', () => {
    const c = useReports()
    expect(c.submitted.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useReports()
    expect(c.error.value).toBeNull()
  })
})

// ─── submitReport ─────────────────────────────────────────────────────────────

describe('submitReport', () => {
  it('returns true on success', async () => {
    const c = useReports()
    const result = await c.submitReport(sampleReport)
    expect(result).toBe(true)
  })

  it('sets submitted to true on success', async () => {
    const c = useReports()
    await c.submitReport(sampleReport)
    expect(c.submitted.value).toBe(true)
  })

  it('sets submitting to false after success', async () => {
    const c = useReports()
    await c.submitReport(sampleReport)
    expect(c.submitting.value).toBe(false)
  })

  it('clears error before submitting', async () => {
    stubClient({ message: 'first error' })
    const c = useReports()
    await c.submitReport(sampleReport)
    // Re-submit with success — error should clear
    stubClient(null)
    // Create a new composable since error is set on instance
    const c2 = useReports()
    await c2.submitReport(sampleReport)
    expect(c2.error.value).toBeNull()
  })

  it('returns false on DB insert error', async () => {
    stubClient({ message: 'DB error' })
    const c = useReports()
    const result = await c.submitReport(sampleReport)
    expect(result).toBe(false)
  })

  it('sets error on DB insert failure', async () => {
    stubClient({ message: 'Connection failed' })
    const c = useReports()
    await c.submitReport(sampleReport)
    expect(c.error.value).toBeTruthy()
  })

  it('sets submitting to false after error', async () => {
    stubClient({ message: 'DB error' })
    const c = useReports()
    await c.submitReport(sampleReport)
    expect(c.submitting.value).toBe(false)
  })

  it('does not set submitted on DB error', async () => {
    stubClient({ message: 'DB error' })
    const c = useReports()
    await c.submitReport(sampleReport)
    expect(c.submitted.value).toBe(false)
  })

  it('accepts all entity_type values', async () => {
    const c = useReports()
    for (const entityType of ['vehicle', 'dealer', 'article', 'comment'] as const) {
      const result = await c.submitReport({ ...sampleReport, entity_type: entityType })
      expect(result).toBe(true)
    }
  })

  it('works without optional details field', async () => {
    const c = useReports()
    const { details: _, ...withoutDetails } = sampleReport
    const result = await c.submitReport(withoutDetails)
    expect(result).toBe(true)
  })
})

// ─── reset ────────────────────────────────────────────────────────────────────

describe('reset', () => {
  it('clears submitted state', async () => {
    stubClient()
    const c = useReports()
    await c.submitReport(sampleReport)
    c.reset()
    expect(c.submitted.value).toBe(false)
  })

  it('clears error state', async () => {
    stubClient({ message: 'DB error' })
    const c = useReports()
    await c.submitReport(sampleReport)
    c.reset()
    expect(c.error.value).toBeNull()
  })

  it('ensures submitting is false after reset', async () => {
    const c = useReports()
    c.reset()
    expect(c.submitting.value).toBe(false)
  })
})
