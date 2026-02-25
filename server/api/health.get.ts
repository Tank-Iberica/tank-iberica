import { serverSupabaseServiceRole } from '#supabase/server'

interface HealthResponse {
  status: 'ok' | 'degraded'
  timestamp: string
  db: 'connected' | 'error'
  version: string
  error?: string
}

const APP_VERSION = process.env.APP_VERSION || '1.0.0'
const DB_TIMEOUT_MS = 500
const HEALTH_TOKEN = process.env.HEALTH_CHECK_TOKEN || ''

export default defineEventHandler(async (event): Promise<HealthResponse> => {
  // Protect health endpoint: require token if configured
  if (HEALTH_TOKEN) {
    const authHeader = getRequestHeader(event, 'authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (token !== HEALTH_TOKEN) {
      throw createError({ statusCode: 403, message: 'Forbidden' })
    }
  }

  const timestamp = new Date().toISOString()

  try {
    const supabase = serverSupabaseServiceRole(event)

    // Simple DB connectivity check with timeout
    // Uses vertical_config (always exists, small table) as a lightweight ping
    const dbResult = await Promise.race([
      supabase
        .from('vertical_config')
        .select('id')
        .limit(1)
        .then(({ error: dbError }) => {
          if (dbError) throw new Error(dbError.message)
          return 'connected' as const
        }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DB health check timed out')), DB_TIMEOUT_MS),
      ),
    ])

    return {
      status: 'ok',
      timestamp,
      db: dbResult,
      version: APP_VERSION,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown database error'
    console.error('[health] DB check failed:', message)

    setResponseStatus(event, 503)
    return {
      status: 'degraded',
      timestamp,
      db: 'error',
      version: APP_VERSION,
    }
  }
})
