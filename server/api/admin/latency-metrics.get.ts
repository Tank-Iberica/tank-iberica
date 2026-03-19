/**
 * GET /api/admin/latency-metrics
 *
 * Admin endpoint for per-endpoint latency metrics (p50/p95/p99).
 * Query params:
 *   - top: number of slowest endpoints to return (default 20)
 *   - path: filter to a specific endpoint path
 *
 * #140 — Custom metrics req/s, p50/p95/p99 latency per endpoint
 */
import { getQuery } from 'h3'
import { requireRole } from '../../utils/rbac'
import { getTopSlowest, getEndpointMetrics, getGlobalMetrics } from '../../utils/latencyMetrics'

export default defineEventHandler(async (event) => {
  await requireRole(event, 'admin')

  const query = getQuery(event)
  const top = Math.min(100, Math.max(1, Number(query.top) || 20))
  const pathFilter = typeof query.path === 'string' ? query.path : undefined

  if (pathFilter) {
    const metrics = getEndpointMetrics(pathFilter)
    return {
      path: pathFilter,
      metrics: metrics ?? null,
      found: metrics !== null,
    }
  }

  const global = getGlobalMetrics()
  const endpoints = getTopSlowest(top)

  return {
    global,
    endpoints,
    count: endpoints.length,
  }
})
