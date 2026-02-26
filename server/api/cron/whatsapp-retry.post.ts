import { createError, defineEventHandler, readBody } from 'h3'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { processBatch } from '../../utils/batchProcessor'

interface CronBody {
  secret?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CronBody>(event).catch(() => ({}) as CronBody)
  verifyCronSecret(event, body?.secret)

  const config = useRuntimeConfig()
  const supabaseUrl = config.public?.supabaseUrl || process.env.SUPABASE_URL
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw createError({ statusCode: 500, message: 'Service not configured' })
  }

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }

  // Find failed submissions with retry_count < 3
  const failedUrl = `${supabaseUrl}/rest/v1/whatsapp_submissions?status=eq.failed&retry_count=lt.3&select=id,retry_count&limit=20`
  const res = await fetch(failedUrl, { headers })
  const failedSubmissions = await res.json()

  if (!Array.isArray(failedSubmissions) || failedSubmissions.length === 0) {
    return { retried: 0, timestamp: new Date().toISOString() }
  }

  const result = await processBatch({
    items: failedSubmissions,
    batchSize: 5,
    delayBetweenBatchesMs: 2000,
    processor: async (sub: { id: string; retry_count: number }) => {
      // Increment retry_count and set status back to received for reprocessing
      await fetch(`${supabaseUrl}/rest/v1/whatsapp_submissions?id=eq.${sub.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status: 'received',
          retry_count: (sub.retry_count || 0) + 1,
        }),
      })

      // Trigger reprocessing
      try {
        const internalSecret = config.cronSecret || process.env.CRON_SECRET
        await $fetch('/api/whatsapp/process', {
          method: 'POST',
          headers: internalSecret ? { 'x-internal-secret': internalSecret } : {},
          body: { submissionId: sub.id },
        }).catch(() => {
          // Mark as failed again if processing fails
          fetch(`${supabaseUrl}/rest/v1/whatsapp_submissions?id=eq.${sub.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ status: 'failed' }),
          })
        })
      } catch {
        // Best effort
      }
    },
  })

  // Mark permanently failed submissions (retry_count >= 3)
  await fetch(`${supabaseUrl}/rest/v1/whatsapp_submissions?status=eq.failed&retry_count=gte.3`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'permanently_failed' }),
  })

  return {
    retried: result.processed,
    errors: result.errors,
    timestamp: new Date().toISOString(),
  }
})
