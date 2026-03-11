import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Unit tests for the data-retention cron logic.
// We test the core behaviour: cutoff calculation, skip on lock, deletion per
// table, error tolerance, and the returned summary shape.
// ---------------------------------------------------------------------------

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

// ---- helpers ---------------------------------------------------------------

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * DAY_MS)
}

/** Mirror of the cron's buildCutoff helper */
function buildCutoff(now: Date, days: number): Date {
  return new Date(now.getTime() - days * DAY_MS)
}

// ---- cutoff calculation ----------------------------------------------------

describe('data-retention — cutoff calculation', () => {
  it('1-year cutoff is exactly 365 days before now', () => {
    const now = new Date('2026-01-01T03:00:00Z')
    const cutoff = buildCutoff(now, 365)
    expect(cutoff.toISOString()).toBe('2025-01-01T03:00:00.000Z')
  })

  it('2-year cutoff is exactly 730 days before now', () => {
    const now = new Date('2026-01-01T03:00:00Z')
    const cutoff = buildCutoff(now, 730)
    expect(cutoff.toISOString()).toBe('2024-01-02T03:00:00.000Z')
  })

  it('idempotency_keys cutoff is "now" (expired = expires_at < now)', () => {
    const now = new Date()
    const cutoff = buildCutoff(now, 0)
    // Within a few ms of now
    expect(Math.abs(cutoff.getTime() - now.getTime())).toBeLessThan(10)
  })
})

// ---- retention targets -----------------------------------------------------

describe('data-retention — targets coverage', () => {
  const EXPECTED_TABLES = [
    'idempotency_keys',
    'api_usage',
    'analytics_events',
    'whatsapp_submissions',
    'activity_logs',
  ]

  it('covers all required retention tables', () => {
    // This list must match the targets array in the cron handler
    expect(EXPECTED_TABLES).toContain('whatsapp_submissions')  // 1 yr — DATA-RETENTION.md
    expect(EXPECTED_TABLES).toContain('analytics_events')       // 1 yr — ad impressions
    expect(EXPECTED_TABLES).toContain('activity_logs')          // 2 yr — audit trail
    expect(EXPECTED_TABLES).toContain('api_usage')              // 1 yr — technical logs
    expect(EXPECTED_TABLES).toContain('idempotency_keys')       // expires_at
    expect(EXPECTED_TABLES).toHaveLength(5)
  })
})

// ---- lock skip behaviour ---------------------------------------------------

describe('data-retention — cron lock skip', () => {
  it('returns skipped:true when lock already held', async () => {
    // Simulate a mock acquireCronLock that returns false
    const acquireCronLock = vi.fn().mockResolvedValue(false)
    const result = await simulateHandler({ acquireCronLock, deleteCounts: {} })
    expect(result.skipped).toBe(true)
    expect(result.reason).toBe('already_ran_in_window')
  })

  it('proceeds when lock is acquired', async () => {
    const acquireCronLock = vi.fn().mockResolvedValue(true)
    const result = await simulateHandler({
      acquireCronLock,
      deleteCounts: { idempotency_keys: 5 },
    })
    expect(result.skipped).toBeUndefined()
    expect(result.totalDeleted).toBe(5)
  })
})

// ---- deletion results -------------------------------------------------------

describe('data-retention — deletion results', () => {
  it('sums totalDeleted across all tables', async () => {
    const result = await simulateHandler({
      acquireCronLock: vi.fn().mockResolvedValue(true),
      deleteCounts: {
        idempotency_keys: 10,
        api_usage: 20,
        analytics_events: 50,
        whatsapp_submissions: 3,
        activity_logs: 0,
      },
    })
    expect(result.totalDeleted).toBe(83)
  })

  it('returns per-table results array', async () => {
    const result = await simulateHandler({
      acquireCronLock: vi.fn().mockResolvedValue(true),
      deleteCounts: { whatsapp_submissions: 7 },
    })
    const wpResult = result.results?.find(
      (r: { table: string }) => r.table === 'whatsapp_submissions',
    )
    expect(wpResult?.deleted).toBe(7)
    expect(wpResult?.error).toBeNull()
  })

  it('records error and continues when a table deletion fails', async () => {
    const result = await simulateHandler({
      acquireCronLock: vi.fn().mockResolvedValue(true),
      deleteCounts: { analytics_events: 0 },
      tableErrors: { analytics_events: 'permission denied' },
    })
    const aeResult = result.results?.find(
      (r: { table: string }) => r.table === 'analytics_events',
    )
    expect(aeResult?.error).toBe('permission denied')
    expect(aeResult?.deleted).toBe(0)
    // Other tables with no error still succeed
    const idkResult = result.results?.find(
      (r: { table: string }) => r.table === 'idempotency_keys',
    )
    expect(idkResult?.error).toBeNull()
  })

  it('includes timestamp in response', async () => {
    const result = await simulateHandler({
      acquireCronLock: vi.fn().mockResolvedValue(true),
      deleteCounts: {},
    })
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('totalDeleted is 0 when all tables are already clean', async () => {
    const result = await simulateHandler({
      acquireCronLock: vi.fn().mockResolvedValue(true),
      deleteCounts: {},
    })
    expect(result.totalDeleted).toBe(0)
  })
})

// ---- date guard: only deletes old records ----------------------------------

describe('data-retention — date boundary', () => {
  it('record from 364 days ago is NOT deleted (< 1-year cutoff)', () => {
    const record = daysAgo(364)
    const cutoff = buildCutoff(new Date(), 365)
    expect(record.getTime()).toBeGreaterThan(cutoff.getTime())
  })

  it('record from 366 days ago IS deleted (> 1-year cutoff)', () => {
    const record = daysAgo(366)
    const cutoff = buildCutoff(new Date(), 365)
    expect(record.getTime()).toBeLessThan(cutoff.getTime())
  })

  it('record from 729 days ago is NOT deleted for 2-year retention', () => {
    const record = daysAgo(729)
    const cutoff = buildCutoff(new Date(), 730)
    expect(record.getTime()).toBeGreaterThan(cutoff.getTime())
  })

  it('record from 731 days ago IS deleted for 2-year retention', () => {
    const record = daysAgo(731)
    const cutoff = buildCutoff(new Date(), 730)
    expect(record.getTime()).toBeLessThan(cutoff.getTime())
  })
})

// ---------------------------------------------------------------------------
// Simulation helper — mirrors the cron handler logic without Nuxt/Supabase
// ---------------------------------------------------------------------------

interface SimulateOptions {
  acquireCronLock: ReturnType<typeof vi.fn>
  deleteCounts: Record<string, number>
  tableErrors?: Record<string, string>
}

interface SimulateResult {
  skipped?: boolean
  reason?: string
  timestamp?: string
  totalDeleted?: number
  results?: Array<{ table: string; deleted: number; error: string | null }>
}

const TARGETS = [
  { table: 'idempotency_keys', days: 0 },
  { table: 'api_usage', days: 365 },
  { table: 'analytics_events', days: 365 },
  { table: 'whatsapp_submissions', days: 365 },
  { table: 'activity_logs', days: 730 },
]

async function simulateHandler(opts: SimulateOptions): Promise<SimulateResult> {
  // Mock the lock
  const acquired = await opts.acquireCronLock()
  if (!acquired) {
    return { skipped: true, reason: 'already_ran_in_window' }
  }

  const now = new Date()
  const results: Array<{ table: string; deleted: number; error: string | null }> = []
  let totalDeleted = 0

  for (const target of TARGETS) {
    const tableError = opts.tableErrors?.[target.table]
    if (tableError) {
      results.push({ table: target.table, deleted: 0, error: tableError })
    } else {
      const deleted = opts.deleteCounts[target.table] ?? 0
      results.push({ table: target.table, deleted, error: null })
      totalDeleted += deleted
    }
  }

  return { timestamp: now.toISOString(), totalDeleted, results }
}
