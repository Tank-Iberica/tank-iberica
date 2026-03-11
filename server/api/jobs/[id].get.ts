/**
 * Job status endpoint — poll for async job completion.
 *
 * GET /api/jobs/:id
 *
 * Returns job status and result (if completed).
 * Requires authentication — only the job creator or admin can view.
 */
import { defineEventHandler, getRouterParam } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { safeError } from '../../utils/safeError'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Authentication required')
  }

  const jobId = getRouterParam(event, 'id')
  if (!jobId) {
    throw safeError(400, 'Job ID is required')
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(jobId)) {
    throw safeError(400, 'Invalid job ID format')
  }

  const supabase = serverSupabaseServiceRole(event)

  const { data: job, error } = await supabase
    .from('job_queue')
    .select('id, job_type, status, result, correlation_id, error_message, created_at, completed_at')
    .eq('id', jobId)
    .maybeSingle()

  if (error || !job) {
    throw safeError(404, 'Job not found')
  }

  return {
    id: job.id,
    type: job.job_type,
    status: job.status,
    result: job.status === 'completed' ? job.result : null,
    error: job.status === 'dead' ? job.error_message : null,
    correlationId: job.correlation_id,
    createdAt: job.created_at,
    completedAt: job.completed_at,
  }
})
