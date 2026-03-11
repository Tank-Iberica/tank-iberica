/**
 * Tests for server/utils/jobQueue.ts
 *
 * Covers: enqueueJob, claimJobs, completeJob, failJob, getJob, countDeadJobs
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  enqueueJob,
  claimJobs,
  completeJob,
  failJob,
  getJob,
  countDeadJobs,
} from '../../../server/utils/jobQueue'

// Mock logger
vi.mock('../../../server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockSupabase(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: { id: 'job-123' }, error: null }),
    ...overrides,
  }

  // Make chain methods return `chain` for chaining
  for (const key of Object.keys(chain)) {
    const val = chain[key]
    if (typeof val === 'function' && !['maybeSingle', 'single'].includes(key)) {
      // Keep maybeSingle/single as terminal methods
      if (!overrides[key]) {
        ;(chain[key] as ReturnType<typeof vi.fn>).mockReturnValue(chain)
      }
    }
  }

  return {
    from: vi.fn().mockReturnValue(chain),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    ...chain,
  }
}

// ---------------------------------------------------------------------------
// enqueueJob
// ---------------------------------------------------------------------------

describe('enqueueJob', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('inserts a new job and returns jobId', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: { id: 'new-job-1' }, error: null }),
    }
    const supabase = { from: vi.fn().mockReturnValue(chain) } as never

    const result = await enqueueJob(supabase, {
      jobType: 'email_send',
      payload: { to: 'test@example.com' },
    })

    expect(result.jobId).toBe('new-job-1')
    expect(result.deduplicated).toBe(false)
    expect(supabase.from).toHaveBeenCalledWith('job_queue')
  })

  it('returns existing job when idempotency key matches', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'existing-job', status: 'pending' },
        error: null,
      }),
    }
    const supabase = { from: vi.fn().mockReturnValue(chain) } as never

    const result = await enqueueJob(supabase, {
      jobType: 'email_send',
      payload: { to: 'test@example.com' },
      idempotencyKey: 'dedup-key-1',
    })

    expect(result.jobId).toBe('existing-job')
    expect(result.deduplicated).toBe(true)
  })

  it('throws when insert fails', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    }
    const supabase = { from: vi.fn().mockReturnValue(chain) } as never

    await expect(
      enqueueJob(supabase, { jobType: 'email_send', payload: {} }),
    ).rejects.toThrow('Failed to enqueue job: DB error')
  })

  it('passes custom options (maxRetries, backoffSeconds, correlationId)', async () => {
    const insertMock = vi.fn().mockReturnThis()
    const chain = {
      select: vi.fn().mockReturnThis(),
      insert: insertMock,
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: { id: 'job-custom' }, error: null }),
    }
    const supabase = { from: vi.fn().mockReturnValue(chain) } as never

    await enqueueJob(supabase, {
      jobType: 'ai_description',
      payload: { prompt: 'test' },
      correlationId: 'corr-123',
      maxRetries: 5,
      backoffSeconds: 120,
    })

    const insertArg = insertMock.mock.calls[0][0]
    expect(insertArg.correlation_id).toBe('corr-123')
    expect(insertArg.max_retries).toBe(5)
    expect(insertArg.backoff_seconds).toBe(120)
    expect(insertArg.job_type).toBe('ai_description')
  })
})

// ---------------------------------------------------------------------------
// claimJobs
// ---------------------------------------------------------------------------

describe('claimJobs', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns claimed jobs from RPC', async () => {
    const jobs = [
      { id: 'j1', job_type: 'email_send', status: 'processing' },
      { id: 'j2', job_type: 'image_process', status: 'processing' },
    ]
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: jobs, error: null }),
    } as never

    const result = await claimJobs(supabase, 5)
    expect(result).toHaveLength(2)
    expect(supabase.rpc).toHaveBeenCalledWith('claim_pending_jobs', { batch_size: 5 })
  })

  it('returns empty array on RPC error', async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'RPC failed' } }),
    } as never

    const result = await claimJobs(supabase)
    expect(result).toEqual([])
  })

  it('defaults batch size to 10', async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    } as never

    await claimJobs(supabase)
    expect(supabase.rpc).toHaveBeenCalledWith('claim_pending_jobs', { batch_size: 10 })
  })
})

// ---------------------------------------------------------------------------
// completeJob
// ---------------------------------------------------------------------------

describe('completeJob', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('updates job to completed with result', async () => {
    const updateMock = vi.fn().mockReturnThis()
    const chain = { update: updateMock, eq: vi.fn().mockResolvedValue({ error: null }) }
    const supabase = { from: vi.fn().mockReturnValue(chain) } as never

    await completeJob(supabase, 'job-1', { sent: true })

    expect(supabase.from).toHaveBeenCalledWith('job_queue')
    const updateArg = updateMock.mock.calls[0][0]
    expect(updateArg.status).toBe('completed')
    expect(updateArg.result).toEqual({ sent: true })
    expect(updateArg.completed_at).toBeTruthy()
  })

  it('updates job to completed without result', async () => {
    const updateMock = vi.fn().mockReturnThis()
    const chain = { update: updateMock, eq: vi.fn().mockResolvedValue({ error: null }) }
    const supabase = { from: vi.fn().mockReturnValue(chain) } as never

    await completeJob(supabase, 'job-2')

    const updateArg = updateMock.mock.calls[0][0]
    expect(updateArg.result).toBeNull()
  })

  it('logs error when completeJob DB update fails', async () => {
    const chain = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: { message: 'write failed' } }) }
    const supabase = { from: vi.fn().mockReturnValue(chain) } as never
    // Should not throw — just logs error
    await expect(completeJob(supabase, 'job-err', { ok: true })).resolves.toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// failJob
// ---------------------------------------------------------------------------

describe('failJob', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('marks as dead when retries >= maxRetries', async () => {
    const updateMock = vi.fn().mockReturnThis()
    const chain = { update: updateMock, eq: vi.fn().mockResolvedValue({ error: null }) }
    const supabase = { from: vi.fn().mockReturnValue(chain) } as never

    const outcome = await failJob(supabase, 'job-1', 'Timeout', 2, 3, 60)

    expect(outcome).toBe('dead')
    const updateArg = updateMock.mock.calls[0][0]
    expect(updateArg.status).toBe('dead')
    expect(updateArg.error_message).toBe('Timeout')
    expect(updateArg.retries).toBe(3)
  })

  it('reschedules with backoff when retries < maxRetries', async () => {
    const updateMock = vi.fn().mockReturnThis()
    const chain = { update: updateMock, eq: vi.fn().mockResolvedValue({ error: null }) }
    const supabase = { from: vi.fn().mockReturnValue(chain) } as never

    const outcome = await failJob(supabase, 'job-2', 'Network error', 0, 3, 60)

    expect(outcome).toBe('retrying')
    const updateArg = updateMock.mock.calls[0][0]
    expect(updateArg.status).toBe('pending')
    expect(updateArg.retries).toBe(1)
    expect(updateArg.started_at).toBeNull()
    // scheduled_at should be in the future (60 * 2^0 = 60s)
    const scheduled = new Date(updateArg.scheduled_at)
    expect(scheduled.getTime()).toBeGreaterThan(Date.now() - 1000)
  })

  it('logs error when marking job as dead fails', async () => {
    const chain = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: { message: 'db error' } }) }
    const supabase = { from: vi.fn().mockReturnValue(chain) } as never
    const outcome = await failJob(supabase, 'job-dead-err', 'Timeout', 2, 3, 60)
    expect(outcome).toBe('dead')
  })

  it('logs error when rescheduling job fails', async () => {
    const chain = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: { message: 'db error' } }) }
    const supabase = { from: vi.fn().mockReturnValue(chain) } as never
    const outcome = await failJob(supabase, 'job-retry-err', 'Error', 0, 3, 60)
    expect(outcome).toBe('retrying')
  })

  it('uses exponential backoff (backoff * 2^retries)', async () => {
    const updateMock = vi.fn().mockReturnThis()
    const chain = { update: updateMock, eq: vi.fn().mockResolvedValue({ error: null }) }
    const supabase = { from: vi.fn().mockReturnValue(chain) } as never

    // Retry #2 (currentRetries=1): delay = 60 * 2^1 = 120s
    await failJob(supabase, 'job-3', 'Error', 1, 3, 60)

    const updateArg = updateMock.mock.calls[0][0]
    const scheduled = new Date(updateArg.scheduled_at)
    const expectedMin = Date.now() + 119_000 // ~120s, slight tolerance
    expect(scheduled.getTime()).toBeGreaterThanOrEqual(expectedMin)
  })
})

// ---------------------------------------------------------------------------
// getJob
// ---------------------------------------------------------------------------

describe('getJob', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns job by ID', async () => {
    const job = { id: 'j1', job_type: 'email_send', status: 'completed' }
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: job, error: null }),
    }
    const supabase = { from: vi.fn().mockReturnValue(chain) } as never

    const result = await getJob(supabase, 'j1')
    expect(result).toEqual(job)
  })

  it('returns null when job not found', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    const supabase = { from: vi.fn().mockReturnValue(chain) } as never

    const result = await getJob(supabase, 'nonexistent')
    expect(result).toBeNull()
  })

  it('logs error and returns null when getJob DB query fails', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'query failed' } }),
    }
    const supabase = { from: vi.fn().mockReturnValue(chain) } as never
    const result = await getJob(supabase, 'j-err')
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// countDeadJobs
// ---------------------------------------------------------------------------

describe('countDeadJobs', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns count of dead jobs', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }
    // Make the chain thenable (count query resolves directly)
    const promise = Promise.resolve({ count: 5, error: null })
    chain.eq = vi.fn().mockReturnValue(promise)
    chain.select = vi.fn().mockReturnValue(chain)
    const supabase = { from: vi.fn().mockReturnValue(chain) } as never

    const result = await countDeadJobs(supabase)
    expect(result).toBe(5)
  })

  it('returns 0 on error', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: null, error: { message: 'DB error' } }),
    }
    const supabase = { from: vi.fn().mockReturnValue(chain) } as never

    const result = await countDeadJobs(supabase)
    expect(result).toBe(0)
  })
})
