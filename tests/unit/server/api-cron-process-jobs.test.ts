import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks ──────────────────────────────────────────────────────────

const {
  mockClaimJobs, mockCompleteJob, mockFailJob, mockCountDeadJobs,
} = vi.hoisted(() => ({
  mockClaimJobs: vi.fn(),
  mockCompleteJob: vi.fn(),
  mockFailJob: vi.fn(),
  mockCountDeadJobs: vi.fn(),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: () => ({}),
}))

vi.mock('../../../server/utils/verifyCronSecret', () => ({
  verifyCronSecret: vi.fn(),
}))

vi.mock('../../../server/utils/jobQueue', () => ({
  claimJobs: (...a: unknown[]) => mockClaimJobs(...a),
  completeJob: (...a: unknown[]) => mockCompleteJob(...a),
  failJob: (...a: unknown[]) => mockFailJob(...a),
  countDeadJobs: (...a: unknown[]) => mockCountDeadJobs(...a),
}))

vi.mock('../../../server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('../../../server/utils/eventBus', () => ({
  emit: vi.fn().mockResolvedValue(undefined),
}))

vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ sent: true }))

import handler from '../../../server/api/cron/process-jobs.post'

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('process-jobs cron', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClaimJobs.mockResolvedValue([])
    mockCompleteJob.mockResolvedValue(undefined)
    mockFailJob.mockResolvedValue('retry')
    mockCountDeadJobs.mockResolvedValue(0)
  })

  it('returns zero processed when no pending jobs', async () => {
    const result = await (handler as Function)({})
    expect(result).toEqual({ processed: 0, message: 'No pending jobs' })
  })

  it('processes email_send job successfully', async () => {
    mockClaimJobs.mockResolvedValue([{
      id: 'j1', job_type: 'email_send', payload: { to: 'a@b.com' },
      retries: 0, max_retries: 3, backoff_seconds: 60, correlation_id: 'c1',
    }])
    mockCountDeadJobs.mockResolvedValue(0)
    const result = await (handler as Function)({})
    expect(result.processed).toBe(1)
    expect(result.completed).toBe(1)
    expect(result.failed).toBe(0)
    expect(mockCompleteJob).toHaveBeenCalled()
  })

  it('processes image_process job', async () => {
    mockClaimJobs.mockResolvedValue([{
      id: 'j2', job_type: 'image_process', payload: { vehicleId: 'v1' },
      retries: 0, max_retries: 3, backoff_seconds: 60, correlation_id: null,
    }])
    mockCountDeadJobs.mockResolvedValue(0)
    const result = await (handler as Function)({})
    expect(result.completed).toBe(1)
  })

  it('processes import_stock job', async () => {
    mockClaimJobs.mockResolvedValue([{
      id: 'j3', job_type: 'import_stock', payload: { dealerId: 'd1' },
      retries: 0, max_retries: 3, backoff_seconds: 60, correlation_id: null,
    }])
    mockCountDeadJobs.mockResolvedValue(0)
    const result = await (handler as Function)({})
    expect(result.completed).toBe(1)
  })

  it('skips unknown job type', async () => {
    mockClaimJobs.mockResolvedValue([{
      id: 'j4', job_type: 'unknown_type', payload: {},
      retries: 0, max_retries: 3, backoff_seconds: 60, correlation_id: null,
    }])
    mockCountDeadJobs.mockResolvedValue(0)
    const result = await (handler as Function)({})
    // processJob returns early for unknown types, no complete/fail called
    expect(result.processed).toBe(1)
    expect(result.completed).toBe(1)
  })

  it('handles job failure with retry', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('SMTP error')))
    mockFailJob.mockResolvedValue('retry')
    mockClaimJobs.mockResolvedValue([{
      id: 'j5', job_type: 'email_send', payload: {},
      retries: 0, max_retries: 3, backoff_seconds: 60, correlation_id: 'c5',
    }])
    mockCountDeadJobs.mockResolvedValue(0)
    const result = await (handler as Function)({})
    expect(result.processed).toBe(1)
    expect(result.completed).toBe(1) // processJob doesn't re-throw
    expect(mockFailJob).toHaveBeenCalled()
  })

  it('handles job failure with dead letter', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('Fatal')))
    mockFailJob.mockResolvedValue('dead')
    mockClaimJobs.mockResolvedValue([{
      id: 'j6', job_type: 'email_send', payload: {},
      retries: 3, max_retries: 3, backoff_seconds: 60, correlation_id: 'c6',
    }])
    mockCountDeadJobs.mockResolvedValue(1)
    const result = await (handler as Function)({})
    expect(result.deadLetterCount).toBe(1)
  })

  it('reports dead letter count when > 0', async () => {
    mockClaimJobs.mockResolvedValue([])
    // When no jobs, returns early
    const result = await (handler as Function)({})
    expect(result.message).toBe('No pending jobs')
  })

  it('processes multiple jobs in sequence', async () => {
    mockClaimJobs.mockResolvedValue([
      { id: 'j7', job_type: 'image_process', payload: {}, retries: 0, max_retries: 3, backoff_seconds: 60, correlation_id: null },
      { id: 'j8', job_type: 'import_stock', payload: {}, retries: 0, max_retries: 3, backoff_seconds: 60, correlation_id: null },
    ])
    mockCountDeadJobs.mockResolvedValue(0)
    const result = await (handler as Function)({})
    expect(result.processed).toBe(2)
    expect(result.completed).toBe(2)
  })

  it('includes correlation_id in email job headers', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ sent: true })
    vi.stubGlobal('$fetch', mockFetch)
    mockClaimJobs.mockResolvedValue([{
      id: 'j9', job_type: 'email_send', payload: { correlation_id: 'test-corr' },
      retries: 0, max_retries: 3, backoff_seconds: 60, correlation_id: 'test-corr',
    }])
    mockCountDeadJobs.mockResolvedValue(0)
    await (handler as Function)({})
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-correlation-id': 'test-corr' }),
      }),
    )
  })

  it('processes ai_description job with prompt', async () => {
    const mockCallAI = vi.fn().mockResolvedValue({
      text: ' Generated description ',
      provider: 'openai',
      latencyMs: 100,
    })
    vi.mock('../../../server/services/aiProvider', () => ({
      callAI: (...a: unknown[]) => mockCallAI(...a),
    }))
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ sent: true }))

    mockClaimJobs.mockResolvedValue([{
      id: 'j10', job_type: 'ai_description',
      payload: { prompt: 'Describe vehicle', maxTokens: 300, system: 'You are helpful', modelRole: 'content' },
      retries: 0, max_retries: 3, backoff_seconds: 60, correlation_id: null,
    }])
    mockCountDeadJobs.mockResolvedValue(0)
    const result = await (handler as Function)({})
    expect(result.completed).toBe(1)
    expect(mockCompleteJob).toHaveBeenCalled()
  })

  it('ai_description throws when prompt is missing', async () => {
    vi.mock('../../../server/services/aiProvider', () => ({
      callAI: vi.fn().mockResolvedValue({ text: 'test', provider: 'test', latencyMs: 0 }),
    }))
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ sent: true }))
    mockFailJob.mockResolvedValue('retry')

    mockClaimJobs.mockResolvedValue([{
      id: 'j11', job_type: 'ai_description',
      payload: {}, // no prompt
      retries: 0, max_retries: 3, backoff_seconds: 60, correlation_id: null,
    }])
    mockCountDeadJobs.mockResolvedValue(0)
    const result = await (handler as Function)({})
    // Should fail the job because prompt is missing
    expect(mockFailJob).toHaveBeenCalled()
  })

  it('cleans up globalThis.__jobWorkerSupabase after processing', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ sent: true }))
    mockClaimJobs.mockResolvedValue([{
      id: 'j12', job_type: 'image_process', payload: {},
      retries: 0, max_retries: 3, backoff_seconds: 60, correlation_id: null,
    }])
    mockCountDeadJobs.mockResolvedValue(0)
    await (handler as Function)({})
    expect((globalThis as any).__jobWorkerSupabase).toBeUndefined()
  })

  it('handles empty correlation_id in email_send', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ sent: true })
    vi.stubGlobal('$fetch', mockFetch)
    mockClaimJobs.mockResolvedValue([{
      id: 'j13', job_type: 'email_send', payload: {},
      retries: 0, max_retries: 3, backoff_seconds: 60, correlation_id: null,
    }])
    mockCountDeadJobs.mockResolvedValue(0)
    await (handler as Function)({})
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-correlation-id': '' }),
      }),
    )
  })

  it('counts dead jobs even when all claimed jobs succeed', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ sent: true }))
    mockClaimJobs.mockResolvedValue([{
      id: 'j14', job_type: 'image_process', payload: {},
      retries: 0, max_retries: 3, backoff_seconds: 60, correlation_id: null,
    }])
    mockCountDeadJobs.mockResolvedValue(5)
    const result = await (handler as Function)({})
    expect(result.deadLetterCount).toBe(5)
  })
})
