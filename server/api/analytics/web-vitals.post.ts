/**
 * POST /api/analytics/web-vitals
 *
 * Receives Web Vitals metrics from the client plugin.
 * Stores in web_vitals table for aggregation.
 * No auth required (public, rate-limited by Cloudflare).
 */
import { readBody } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

const VALID_METRICS = ['CLS', 'INP', 'LCP', 'FCP', 'TTFB'] as const
type MetricName = (typeof VALID_METRICS)[number]

interface VitalsPayload {
  name: MetricName
  value: number
  id: string
  route: string
  vertical?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<VitalsPayload>(event)

  // Validate required fields
  if (!body?.name || typeof body.value !== 'number' || !body.id || !body.route) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: name, value, id, route',
    })
  }

  // Validate metric name
  if (!VALID_METRICS.includes(body.name)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid metric name. Must be one of: ${VALID_METRICS.join(', ')}`,
    })
  }

  // Validate value range (no negative, reasonable max)
  if (body.value < 0 || body.value > 60000) {
    throw createError({ statusCode: 400, statusMessage: 'Metric value out of range (0-60000)' })
  }

  const db = serverSupabaseServiceRole(event)

  // web_vitals table not yet in generated types — cast needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (db.from as any)('web_vitals').insert({
    metric_name: body.name,
    metric_value: body.value,
    metric_id: body.id,
    route: body.route.slice(0, 500),
    vertical: body.vertical || 'tracciona',
  })

  if (error) {
    // If table doesn't exist, log but don't crash
    if (error.code === '42P01') {
      return { ok: false, reason: 'table_not_found' }
    }
    throw createError({ statusCode: 500, statusMessage: 'Failed to store metric' })
  }

  return { ok: true }
})
