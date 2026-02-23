import { createError, defineEventHandler, readBody } from 'h3'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { processBatch } from '../../utils/batchProcessor'
import { fetchWithRetry } from '../../utils/fetchWithRetry'

interface CronBody {
  secret?: string
}

export default defineEventHandler(async (event) => {
  // Verify cron secret to prevent unauthorized calls
  const body = await readBody<CronBody>(event).catch(() => ({}) as CronBody)
  verifyCronSecret(event, body?.secret)

  const config = useRuntimeConfig()
  const supabaseUrl = config.public?.supabaseUrl || process.env.SUPABASE_URL
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw createError({ statusCode: 500, message: 'Supabase not configured' })
  }

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }

  const now = new Date()
  let reminded = 0
  let paused = 0
  let expired = 0

  // ============================================
  // STEP 1: 30-day reminder
  // Find vehicles published >30 days ago without recent update or reminder
  // ============================================
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const reminderQuery = new URLSearchParams({
    select: 'id,title,dealer_id,freshness_reminder_count',
    status: 'eq.published',
    updated_at: `lt.${thirtyDaysAgo}`,
    freshness_reminder_count: 'lt.3',
  }).toString()

  // We need to handle the OR condition for freshness_reminded_at (NULL or older than 30 days)
  // Using PostgREST OR syntax
  const reminderUrl = `${supabaseUrl}/rest/v1/vehicles?${reminderQuery}&or=(freshness_reminded_at.is.null,freshness_reminded_at.lt.${thirtyDaysAgo})&limit=200`

  const reminderRes = await fetchWithRetry(reminderUrl, { headers })
  const vehiclesToRemind = await reminderRes.json()

  if (Array.isArray(vehiclesToRemind)) {
    const result = await processBatch({
      items: vehiclesToRemind,
      batchSize: 50,
      processor: async (vehicle: Record<string, unknown>) => {
        const updateRes = await fetchWithRetry(
          `${supabaseUrl}/rest/v1/vehicles?id=eq.${vehicle.id}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              freshness_reminded_at: now.toISOString(),
              freshness_reminder_count: ((vehicle.freshness_reminder_count as number) || 0) + 1,
            }),
          },
        )
        if (!updateRes.ok) throw new Error('Update failed')
        // TODO(2026-02): Implement email notification once dealer email is available in the query
        // Call: $fetch('/api/email/send', { method: 'POST', headers: { 'x-internal-secret': internalSecret }, body: { to: dealer.email, subject: 'Freshness reminder', templateKey: 'freshness_reminder', vehicleId: vehicle.id } })
      },
    })
    reminded = result.processed
  }

  // ============================================
  // STEP 2: 14-day auto-pause
  // Vehicles reminded but no response (updated_at still older than freshness_reminded_at)
  // Requires at least 2 reminders sent
  // ============================================
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const pauseQuery = new URLSearchParams({
    select: 'id',
    status: 'eq.published',
    freshness_reminded_at: `not.is.null`,
    freshness_reminder_count: 'gte.2',
  }).toString()

  // Vehicles where freshness_reminded_at < 14 days ago AND updated_at < freshness_reminded_at
  // PostgREST doesn't support column-to-column comparison directly,
  // so we fetch candidates and filter in code
  const pauseCandidatesUrl = `${supabaseUrl}/rest/v1/vehicles?${pauseQuery}&freshness_reminded_at=lt.${fourteenDaysAgo}&limit=200`

  const pauseCandidatesRes = await fetchWithRetry(
    `${pauseCandidatesUrl}&select=id,updated_at,freshness_reminded_at`,
    { headers },
  )
  const pauseCandidates = await pauseCandidatesRes.json()

  if (Array.isArray(pauseCandidates)) {
    const toPause = pauseCandidates.filter(
      (v: { updated_at: string; freshness_reminded_at: string }) => {
        return new Date(v.updated_at) < new Date(v.freshness_reminded_at)
      },
    )

    const pauseResult = await processBatch({
      items: toPause,
      batchSize: 50,
      processor: async (vehicle: Record<string, unknown>) => {
        const updateRes = await fetchWithRetry(
          `${supabaseUrl}/rest/v1/vehicles?id=eq.${vehicle.id}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ status: 'paused' }),
          },
        )
        if (!updateRes.ok) throw new Error('Update failed')
      },
    })
    paused = pauseResult.processed
  }

  // ============================================
  // STEP 3: 90-day auto-expire
  // Vehicles published with no update in 90 days
  // ============================================
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()

  const expireUrl = `${supabaseUrl}/rest/v1/vehicles?status=eq.published&updated_at=lt.${ninetyDaysAgo}&select=id&limit=200`

  const expireCandidatesRes = await fetchWithRetry(expireUrl, { headers })
  const expireCandidates = await expireCandidatesRes.json()

  if (Array.isArray(expireCandidates)) {
    const expireResult = await processBatch({
      items: expireCandidates,
      batchSize: 50,
      processor: async (vehicle: Record<string, unknown>) => {
        const updateRes = await fetchWithRetry(
          `${supabaseUrl}/rest/v1/vehicles?id=eq.${vehicle.id}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ status: 'expired' }),
          },
        )
        if (!updateRes.ok) throw new Error('Update failed')
      },
    })
    expired = expireResult.processed
  }

  return {
    reminded,
    paused,
    expired,
    timestamp: now.toISOString(),
  }
})
