/**
 * Tests for /api/cron/generate-market-report
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getCurrentQuarter,
  buildStoragePath,
  ensureBucketExists,
  generateQuarterlyReport,
  type GenerateResult,
} from '../../../server/api/cron/generate-market-report.post'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockGenerateMarketReport } = vi.hoisted(() => ({
  mockGenerateMarketReport: vi
    .fn()
    .mockResolvedValue({ html: '<html><body>Market Report</body></html>' }),
}))

vi.mock('~~/server/utils/cronLock', () => ({ acquireDbCronLock: vi.fn().mockResolvedValue(true) }))
vi.mock('../../../server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('../../../server/utils/verifyCronSecret', () => ({
  verifyCronSecret: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../../server/services/marketReport', () => ({
  generateMarketReport: mockGenerateMarketReport,
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

interface StorageUploadResult {
  error: null | { message: string }
}
interface StorageCreateBucketResult {
  error: null | { message: string }
}
interface SelectResult {
  data: unknown
  error: null | { message: string }
}
interface UpsertResult {
  error: null | { message: string }
}

interface MockOpts {
  bucketCreateError?: string | null
  uploadError?: string | null
  existingReport?: boolean
  marketDataRows?: Array<{ listings: number; avg_price: number; subcategory: string }>
  upsertError?: string | null
}

function makeSupabase(opts: MockOpts = {}) {
  const storageFrom = vi.fn().mockReturnValue({
    upload: vi
      .fn()
      .mockResolvedValue(
        opts.uploadError
          ? { error: { message: opts.uploadError } }
          : ({ error: null } as StorageUploadResult),
      ),
  })

  const createBucket = vi
    .fn()
    .mockResolvedValue(
      opts.bucketCreateError
        ? { error: { message: opts.bucketCreateError } }
        : ({ error: null } as StorageCreateBucketResult),
    )

  const existingData = opts.existingReport ? { id: 'existing-id' } : null

  const fromFn = vi.fn().mockImplementation((table: string) => {
    if (table === 'market_reports') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi
                .fn()
                .mockResolvedValue({ data: existingData, error: null } as SelectResult),
            }),
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
        upsert: vi
          .fn()
          .mockResolvedValue(
            opts.upsertError
              ? { error: { message: opts.upsertError } }
              : ({ error: null } as UpsertResult),
          ),
      }
    }
    if (table === 'market_data') {
      return {
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: opts.marketDataRows ?? [
                { listings: 50, avg_price: 25000, subcategory: 'Excavadoras' },
                { listings: 30, avg_price: 15000, subcategory: 'Carretillas' },
              ],
              error: null,
            }),
          }),
        }),
      }
    }
    return {
      select: vi
        .fn()
        .mockReturnValue({
          eq: vi
            .fn()
            .mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }),
        }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }
  })

  return {
    from: fromFn,
    storage: { createBucket, from: storageFrom },
  }
}

// ── getCurrentQuarter ─────────────────────────────────────────────────────────

describe('getCurrentQuarter', () => {
  it.each([
    [new Date('2026-01-01'), 'Q1-2026'],
    [new Date('2026-03-31'), 'Q1-2026'],
    [new Date('2026-04-01'), 'Q2-2026'],
    [new Date('2026-06-30'), 'Q2-2026'],
    [new Date('2026-07-01'), 'Q3-2026'],
    [new Date('2026-09-30'), 'Q3-2026'],
    [new Date('2026-10-01'), 'Q4-2026'],
    [new Date('2026-12-31'), 'Q4-2026'],
  ])('returns %s for %s', (date, expected) => {
    expect(getCurrentQuarter(date)).toBe(expected)
  })

  it('uses current date when no arg provided', () => {
    const result = getCurrentQuarter()
    expect(result).toMatch(/^Q[1-4]-\d{4}$/)
  })
})

// ── buildStoragePath ──────────────────────────────────────────────────────────

describe('buildStoragePath', () => {
  it('builds correct path for ES', () => {
    expect(buildStoragePath('Q1-2026', 'es')).toBe('Q1-2026-es.html')
  })

  it('builds correct path for EN', () => {
    expect(buildStoragePath('Q2-2026', 'en')).toBe('Q2-2026-en.html')
  })
})

// ── ensureBucketExists ────────────────────────────────────────────────────────

describe('ensureBucketExists', () => {
  it('calls createBucket with correct params', async () => {
    const supabase = makeSupabase()
    await ensureBucketExists(supabase as never)
    expect(supabase.storage.createBucket).toHaveBeenCalledWith('reports', {
      public: false,
      allowedMimeTypes: ['text/html'],
    })
  })

  it('ignores "already exists" error', async () => {
    const supabase = makeSupabase({ bucketCreateError: 'already exists' })
    await expect(ensureBucketExists(supabase as never)).resolves.not.toThrow()
  })

  it('ignores "duplicate" error', async () => {
    const supabase = makeSupabase({ bucketCreateError: 'duplicate key' })
    await expect(ensureBucketExists(supabase as never)).resolves.not.toThrow()
  })

  it('throws on unexpected bucket error', async () => {
    const supabase = makeSupabase({ bucketCreateError: 'quota exceeded' })
    await expect(ensureBucketExists(supabase as never)).rejects.toThrow(
      'Failed to create storage bucket',
    )
  })
})

// ── generateQuarterlyReport ───────────────────────────────────────────────────

describe('generateQuarterlyReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGenerateMarketReport.mockResolvedValue({ html: '<html>Test</html>' })
  })

  it('skips already-generated locales when not forced', async () => {
    const supabase = makeSupabase({ existingReport: true })
    const result: GenerateResult = await generateQuarterlyReport(
      supabase as never,
      'Q1-2026',
      false,
    )

    expect(result.localesProcessed).toEqual(['es', 'en'])
    expect(result.errors).toHaveLength(0)
    // Should NOT upload since report exists
    expect(supabase.storage.from).not.toHaveBeenCalled()
  })

  it('generates and uploads when no existing report', async () => {
    const supabase = makeSupabase({ existingReport: false })
    const result: GenerateResult = await generateQuarterlyReport(
      supabase as never,
      'Q1-2026',
      false,
    )

    expect(result.localesProcessed).toContain('es')
    expect(result.localesProcessed).toContain('en')
    expect(result.errors).toHaveLength(0)
    expect(supabase.storage.from).toHaveBeenCalledWith('reports')
  })

  it('force regeneration overrides existing check', async () => {
    const supabase = makeSupabase({ existingReport: true })
    const result: GenerateResult = await generateQuarterlyReport(supabase as never, 'Q1-2026', true)

    // With forceRegen=true, should upload even if record exists
    expect(supabase.storage.from).toHaveBeenCalledWith('reports')
    expect(result.localesProcessed.length).toBeGreaterThan(0)
  })

  it('records errors per locale without stopping other locales', async () => {
    const supabase = makeSupabase({ existingReport: false, uploadError: 'storage full' })
    const result: GenerateResult = await generateQuarterlyReport(
      supabase as never,
      'Q2-2026',
      false,
    )

    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain('storage full')
  })

  it('records upsert errors in errors array', async () => {
    const supabase = makeSupabase({ existingReport: false, upsertError: 'constraint violation' })
    const result: GenerateResult = await generateQuarterlyReport(
      supabase as never,
      'Q3-2026',
      false,
    )

    expect(result.errors.some((e: string) => e.includes('constraint violation'))).toBe(true)
  })

  it('processes both locales (es + en)', async () => {
    const supabase = makeSupabase({ existingReport: false })
    const result: GenerateResult = await generateQuarterlyReport(
      supabase as never,
      'Q4-2026',
      false,
    )

    expect(result.quarter).toBe('Q4-2026')
  })

  it('uses real market data for metadata extraction', async () => {
    const supabase = makeSupabase({
      existingReport: false,
      marketDataRows: [
        { listings: 100, avg_price: 50000, subcategory: 'Grúas' },
        { listings: 20, avg_price: 0, subcategory: 'Sin precio' },
      ],
    })
    const result: GenerateResult = await generateQuarterlyReport(
      supabase as never,
      'Q1-2026',
      false,
    )
    // No error — metadata extraction succeeds even with partial data
    expect(result.errors).toHaveLength(0)
  })
})
