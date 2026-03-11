/**
 * Job Queue Worker — processes pending jobs from the job_queue table.
 *
 * Called by external cron (e.g., CF Workers cron, GitHub Actions, or cron-job.org)
 * every 30 seconds to 1 minute.
 *
 * POST /api/cron/process-jobs
 * Header: x-cron-secret: <CRON_SECRET>
 *
 * Flow:
 *   1. Claim batch of pending jobs (SELECT FOR UPDATE SKIP LOCKED)
 *   2. Execute handler for each job type
 *   3. Mark completed or failed (with retry/dead letter)
 *   4. Return summary
 */
import { defineEventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { claimJobs, completeJob, failJob, countDeadJobs } from '../../utils/jobQueue'
import type { Job } from '../../utils/jobQueue'
import { logger } from '../../utils/logger'
import { emit } from '../../utils/eventBus'

// ---------------------------------------------------------------------------
// Job handlers registry
// ---------------------------------------------------------------------------

type JobHandler = (payload: Record<string, unknown>) => Promise<Record<string, unknown>>

const handlers: Record<string, JobHandler> = {
  email_send: handleEmailSend,
  image_process: handleImageProcess,
  ai_description: handleAiDescription,
  import_stock: handleImportStock,
}

// ---------------------------------------------------------------------------
// Individual job handlers
// ---------------------------------------------------------------------------

async function handleEmailSend(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  // Fire internal email send — reuses existing email infrastructure
  const correlationId = (payload.correlation_id as string) || ''
  const result = await $fetch('/api/email/send', {
    method: 'POST',
    headers: {
      'x-internal-secret': process.env.CRON_SECRET || '',
      'x-correlation-id': correlationId,
      'content-type': 'application/json',
    },
    body: payload,
  })
  return { sent: true, result }
}

async function handleImageProcess(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  // Image processing requires auth context — store result for polling
  // For now, log and return placeholder. Full implementation requires
  // the image pipeline to accept service-role calls.
  logger.info('[process-jobs] image_process job received', { vehicleId: payload.vehicleId })
  return { status: 'processed', note: 'Image processing via job queue' }
}

async function handleAiDescription(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  // Import AI provider dynamically to avoid circular deps
  const { callAI } = await import('../../services/aiProvider')

  const prompt = payload.prompt as string
  if (!prompt) {
    throw new Error('Missing prompt in ai_description payload')
  }

  const response = await callAI(
    {
      messages: [{ role: 'user', content: prompt }],
      maxTokens: (payload.maxTokens as number) || 500,
      system: payload.system as string | undefined,
    },
    'background',
    (payload.modelRole as 'fast' | 'vision' | 'content') || 'fast',
  )

  return { description: response.text.trim(), provider: response.provider, latencyMs: response.latencyMs }
}

async function handleImportStock(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  // Stock import is already a long-running operation
  // For now, log and return. Full handler would replicate import-stock logic.
  logger.info('[process-jobs] import_stock job received', { dealerId: payload.dealerId })
  return { status: 'processed', note: 'Import stock via job queue' }
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

async function processJob(job: Job): Promise<void> {
  const handler = handlers[job.job_type]
  if (!handler) {
    logger.error('[process-jobs] Unknown job type', { jobType: job.job_type, jobId: job.id })
    return
  }

  // Get supabase client — we need it for complete/fail calls
  // This is called from the main handler which has event context
  const supabase = (globalThis as Record<string, unknown>).__jobWorkerSupabase as import('@supabase/supabase-js').SupabaseClient

  const start = Date.now()

  try {
    const result = await handler(job.payload)
    await completeJob(supabase, job.id, result)
    logger.info('[process-jobs] Job completed', {
      jobId: job.id,
      jobType: job.job_type,
      correlationId: job.correlation_id,
      durationMs: Date.now() - start,
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    const outcome = await failJob(
      supabase,
      job.id,
      errorMessage,
      job.retries,
      job.max_retries,
      job.backoff_seconds,
    )

    if (outcome === 'dead') {
      logger.error('[process-jobs] Job moved to dead letter', {
        jobId: job.id,
        jobType: job.job_type,
        correlationId: job.correlation_id,
        error: errorMessage,
        retries: job.retries + 1,
      })
      // Emit event for monitoring
      await emit('job:dead_letter', {
        jobId: job.id,
        jobType: job.job_type,
        error: errorMessage,
      })
    } else {
      logger.warn('[process-jobs] Job failed, will retry', {
        jobId: job.id,
        jobType: job.job_type,
        correlationId: job.correlation_id,
        error: errorMessage,
        retry: job.retries + 1,
        maxRetries: job.max_retries,
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default defineEventHandler(async (event) => {
  verifyCronSecret(event)

  const supabase = serverSupabaseServiceRole(event)

  // Store supabase client for job handlers to use
  ;(globalThis as Record<string, unknown>).__jobWorkerSupabase = supabase

  const BATCH_SIZE = 10
  const claimed = await claimJobs(supabase, BATCH_SIZE)

  if (claimed.length === 0) {
    return { processed: 0, message: 'No pending jobs' }
  }

  // Process jobs sequentially to avoid overwhelming resources
  let completed = 0
  let failed = 0

  for (const job of claimed) {
    try {
      await processJob(job)
      completed++
    } catch {
      failed++
    }
  }

  // Check dead letter count for alerting
  const deadCount = await countDeadJobs(supabase)
  if (deadCount > 0) {
    logger.warn('[process-jobs] Dead letter jobs detected', { count: deadCount })
  }

  // Clean up global reference
  delete (globalThis as Record<string, unknown>).__jobWorkerSupabase

  return {
    processed: claimed.length,
    completed,
    failed,
    deadLetterCount: deadCount,
  }
})
