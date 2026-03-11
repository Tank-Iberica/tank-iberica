/**
 * Postgres-backed job queue for async processing of long-running operations.
 *
 * Usage:
 *   import { enqueueJob, claimJobs, completeJob, failJob } from '~~/server/utils/jobQueue'
 *
 * Job types: 'image_process' | 'ai_description' | 'email_send' | 'import_stock'
 *
 * Architecture:
 *   - Endpoints enqueue jobs → return 202 with job_id
 *   - Cron worker (process-jobs.post.ts) polls pending jobs
 *   - Uses SELECT FOR UPDATE SKIP LOCKED for safe concurrent processing
 *   - Exponential backoff on failure: backoff_seconds * 2^retries
 *   - Dead letter after max_retries exceeded
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from './logger'
import { emit } from './eventBus'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JobType = 'image_process' | 'ai_description' | 'email_send' | 'import_stock'
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'dead'

export interface Job {
  id: string
  job_type: JobType
  payload: Record<string, unknown>
  idempotency_key: string | null
  status: JobStatus
  result: Record<string, unknown> | null
  retries: number
  max_retries: number
  backoff_seconds: number
  correlation_id: string | null
  scheduled_at: string
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  created_at: string
}

export interface EnqueueOptions {
  jobType: JobType
  payload: Record<string, unknown>
  idempotencyKey?: string
  correlationId?: string
  maxRetries?: number
  backoffSeconds?: number
  scheduledAt?: Date
  /** Job priority: 1=critical, 3=high, 5=normal (default), 7=low */
  priority?: number
}

// ---------------------------------------------------------------------------
// Enqueue
// ---------------------------------------------------------------------------

/**
 * Add a job to the queue. Returns the job ID.
 * If an idempotency key is provided and a job with that key already exists,
 * returns the existing job's ID without creating a duplicate.
 */
export async function enqueueJob(
  supabase: SupabaseClient,
  options: EnqueueOptions,
): Promise<{ jobId: string; deduplicated: boolean }> {
  // Check idempotency key dedup
  if (options.idempotencyKey) {
    const { data: existing } = await supabase
      .from('job_queue')
      .select('id, status')
      .eq('idempotency_key', options.idempotencyKey)
      .maybeSingle()

    if (existing) {
      return { jobId: existing.id, deduplicated: true }
    }
  }

  const { data, error } = await supabase
    .from('job_queue')
    .insert({
      job_type: options.jobType,
      payload: options.payload,
      idempotency_key: options.idempotencyKey ?? null,
      correlation_id: options.correlationId ?? null,
      max_retries: options.maxRetries ?? 3,
      backoff_seconds: options.backoffSeconds ?? 60,
      priority: options.priority ?? 5,
      scheduled_at: (options.scheduledAt ?? new Date()).toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to enqueue job: ${error.message}`)
  }

  return { jobId: data.id, deduplicated: false }
}

// ---------------------------------------------------------------------------
// Claim (for worker)
// ---------------------------------------------------------------------------

/**
 * Claim a batch of pending jobs for processing.
 * Uses SELECT FOR UPDATE SKIP LOCKED to prevent double-processing.
 * Returns claimed jobs with status set to 'processing'.
 */
export async function claimJobs(supabase: SupabaseClient, batchSize: number = 10): Promise<Job[]> {
  // Use raw SQL for FOR UPDATE SKIP LOCKED (not available via PostgREST)
  const { data, error } = await supabase.rpc('claim_pending_jobs', {
    batch_size: batchSize,
  })

  if (error) {
    logger.error('[jobQueue] Failed to claim jobs', { error: error.message })
    return []
  }

  return (data as Job[]) ?? []
}

// ---------------------------------------------------------------------------
// Complete / Fail
// ---------------------------------------------------------------------------

/**
 * Mark a job as completed with its result.
 */
export async function completeJob(
  supabase: SupabaseClient,
  jobId: string,
  result?: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase
    .from('job_queue')
    .update({
      status: 'completed' as const,
      result: result ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)

  if (error) {
    logger.error('[jobQueue] Failed to complete job', { jobId, error: error.message })
  }
}

/**
 * Mark a job as failed. If retries < max_retries, reschedule with backoff.
 * Otherwise, mark as dead letter.
 */
export async function failJob(
  supabase: SupabaseClient,
  jobId: string,
  errorMessage: string,
  currentRetries: number,
  maxRetries: number,
  backoffSeconds: number,
): Promise<'retrying' | 'dead'> {
  const newRetries = currentRetries + 1

  if (newRetries >= maxRetries) {
    // Dead letter
    const { error } = await supabase
      .from('job_queue')
      .update({
        status: 'dead' as const,
        error_message: errorMessage,
        retries: newRetries,
      })
      .eq('id', jobId)

    if (error) {
      logger.error('[jobQueue] Failed to mark job as dead', { jobId, error: error.message })
    }

    // Emit dead letter alert event
    await emit('job:dead_letter', {
      jobId,
      jobType: 'email_send', // Will be overridden by caller context
      error: errorMessage,
    })

    logger.warn('[jobQueue] Job moved to dead letter queue', {
      jobId,
      retries: newRetries,
      maxRetries,
      error: errorMessage,
    })

    return 'dead'
  }

  // Retry with exponential backoff
  const delaySeconds = backoffSeconds * Math.pow(2, currentRetries)
  const scheduledAt = new Date(Date.now() + delaySeconds * 1000)

  const { error } = await supabase
    .from('job_queue')
    .update({
      status: 'pending' as const,
      error_message: errorMessage,
      retries: newRetries,
      scheduled_at: scheduledAt.toISOString(),
      started_at: null,
    })
    .eq('id', jobId)

  if (error) {
    logger.error('[jobQueue] Failed to reschedule job', { jobId, error: error.message })
  }

  return 'retrying'
}

// ---------------------------------------------------------------------------
// Status query
// ---------------------------------------------------------------------------

/**
 * Get a job by ID (for status polling).
 */
export async function getJob(supabase: SupabaseClient, jobId: string): Promise<Job | null> {
  const { data, error } = await supabase.from('job_queue').select('*').eq('id', jobId).maybeSingle()

  if (error) {
    logger.error('[jobQueue] Failed to get job', { jobId, error: error.message })
    return null
  }

  return data as Job | null
}

/**
 * Count dead letter jobs (for monitoring/alerting).
 */
export async function countDeadJobs(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from('job_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'dead')

  if (error) {
    logger.error('[jobQueue] Failed to count dead jobs', { error: error.message })
    return 0
  }

  return count ?? 0
}
