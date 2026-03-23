/**
 * GET /api/health
 *
 * Light mode (default): status + timestamp + uptime. <5ms. Public.
 * Deep mode (?deep=1):  DB ping + auth check + latencies. ~200ms.
 *                       Requires cron secret (x-cron-secret header or Bearer token).
 * Vertical mode (?vertical=1): verifies vertical_config completeness (name, theme,
 *                       subscription_prices, categories). Requires cron secret.
 */
import { defineEventHandler, getQuery, getHeader } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../utils/verifyCronSecret'
import { timingSafeCompare } from '../utils/timingSafeCompare'

const APP_VERSION = process.env.APP_VERSION || '1.0.0'

/**
 * Verify health-check access: accepts dedicated HEALTH_TOKEN or falls back to cron secret.
 * This allows monitoring services to use a separate token from cron jobs.
 * Uses timing-safe comparison to prevent timing attacks.
 */
function verifyHealthAccess(event: Parameters<Parameters<typeof defineEventHandler>[0]>[0]): void {
  const healthToken = process.env.HEALTH_TOKEN
  if (healthToken) {
    const header =
      getHeader(event, 'x-health-token') ||
      getHeader(event, 'authorization')?.replace('Bearer ', '')
    if (timingSafeCompare(header, healthToken)) return
  }
  // Fallback to cron secret
  verifyCronSecret(event)
}
const DB_TIMEOUT_MS = 3000

interface LightHealthResponse {
  status: 'ok'
  timestamp: string
  uptime: number
  version: string
}

interface DeepHealthResponse {
  status: 'ok' | 'degraded'
  timestamp: string
  uptime: number
  version: string
  db: 'connected' | 'error'
  db_latency_ms: number | null
  auth: 'ok' | 'error'
}

interface VerticalCheckItem {
  check: string
  status: 'ok' | 'warn' | 'error'
  detail?: string
}

interface VerticalHealthResponse {
  status: 'ok' | 'degraded'
  timestamp: string
  vertical: string
  checks: VerticalCheckItem[]
}

/** Required top-level fields in vertical_config */
const REQUIRED_VERTICAL_FIELDS = [
  'name',
  'theme',
  'subscription_prices',
  'commission_rates',
] as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HealthClient = ReturnType<typeof serverSupabaseServiceRole<any>>

async function handleVerticalCheck(
  event: Parameters<Parameters<typeof defineEventHandler>[0]>[0],
  timestamp: string,
): Promise<VerticalHealthResponse> {
  verifyHealthAccess(event)
  const supabase = serverSupabaseServiceRole(event)
  const VERTICAL = process.env.NUXT_PUBLIC_VERTICAL || 'tracciona'
  const checks: VerticalCheckItem[] = []

  const { data: config, error: configErr } = await supabase
    .from('vertical_config')
    .select('name, theme, subscription_prices, commission_rates, feature_flags')
    .eq('vertical', VERTICAL)
    .single()

  if (configErr || !config) {
    checks.push({
      check: 'vertical_config_row',
      status: 'error',
      detail: configErr?.message ?? 'not found',
    })
  } else {
    checks.push({ check: 'vertical_config_row', status: 'ok' })
    for (const field of REQUIRED_VERTICAL_FIELDS) {
      const val = (config as Record<string, unknown>)[field]
      const missing = val === null || val === undefined
      checks.push({
        check: `field_${field}`,
        status: missing ? 'error' : 'ok',
        detail: missing ? 'missing or null' : undefined,
      })
    }
    if (config.feature_flags !== null && config.feature_flags !== undefined) {
      checks.push({ check: 'feature_flags_json', status: 'ok' })
    }
  }

  const { count: catCount, error: catErr } = await supabase
    .from('categories')
    .select('id', { count: 'exact', head: true })
    .eq('vertical', VERTICAL)

  if (catErr) {
    checks.push({ check: 'categories', status: 'error', detail: catErr.message })
  } else if ((catCount ?? 0) === 0) {
    checks.push({ check: 'categories', status: 'warn', detail: 'no categories defined' })
  } else {
    checks.push({ check: 'categories', status: 'ok', detail: `${catCount} found` })
  }

  if (
    config &&
    typeof config.subscription_prices === 'object' &&
    config.subscription_prices !== null
  ) {
    const tiers = Object.keys(config.subscription_prices as Record<string, unknown>)
    checks.push({
      check: 'subscription_tiers',
      status: tiers.length ? 'ok' : 'warn',
      detail: tiers.length ? `${tiers.length} tiers: ${tiers.join(', ')}` : 'no tiers configured',
    })
  }

  const hasError = checks.some((c) => c.status === 'error')
  const status: 'ok' | 'degraded' = hasError ? 'degraded' : 'ok'
  if (hasError) setResponseStatus(event, 503)
  return { status, timestamp, vertical: VERTICAL, checks }
}

async function handleDeepCheck(
  supabase: HealthClient,
  timestamp: string,
  uptime: number,
): Promise<DeepHealthResponse> {
  let db: 'connected' | 'error' = 'error'
  let db_latency_ms: number | null = null
  let auth: 'ok' | 'error' = 'error'

  const dbStart = Date.now()
  try {
    await Promise.race([
      supabase.from('vertical_config').select('id').limit(1).throwOnError(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DB timeout')), DB_TIMEOUT_MS),
      ),
    ])
    db = 'connected'
  } catch {
    // db stays 'error'
  }
  db_latency_ms = Date.now() - dbStart

  try {
    await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })
    auth = 'ok'
  } catch {
    // auth stays 'error'
  }

  let externalOk = true
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      await $fetch.raw('https://api.stripe.com/v1/')
    } catch {
      externalOk = false
    }
  }

  const status = db === 'connected' && auth === 'ok' && externalOk ? 'ok' : 'degraded'
  return { status, timestamp, uptime, version: APP_VERSION, db, db_latency_ms, auth }
}

export default defineEventHandler(
  async (event): Promise<LightHealthResponse | DeepHealthResponse | VerticalHealthResponse> => {
    const timestamp = new Date().toISOString()
    const uptime = Math.floor(process.uptime())
    const query = getQuery(event)

    if (!query.deep && !query.vertical) {
      setHeader(event, 'Cache-Control', 'public, max-age=30, s-maxage=30')
      return { status: 'ok', timestamp, uptime, version: APP_VERSION }
    }

    if (query.vertical) return handleVerticalCheck(event, timestamp)

    verifyHealthAccess(event)
    const supabase = serverSupabaseServiceRole(event)
    const result = await handleDeepCheck(supabase, timestamp, uptime)
    if (result.status === 'degraded') setResponseStatus(event, 503)
    return result
  },
)
