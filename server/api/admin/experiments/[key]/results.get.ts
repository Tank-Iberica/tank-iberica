/**
 * GET /api/admin/experiments/:key/results
 *
 * Get A/B test results with per-variant conversion rates.
 * Admin-only endpoint.
 */
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireRole } from '../../../../utils/rbac'
import { getExperimentResults } from '../../../../utils/experiments'

export default defineEventHandler(async (event) => {
  await requireRole(event, 'admin')

  const key = getRouterParam(event, 'key')
  if (!key) {
    throw createError({ statusCode: 400, statusMessage: 'Experiment key required' })
  }

  const results = await getExperimentResults(event, key)
  if (!results) {
    throw createError({ statusCode: 404, statusMessage: `Experiment "${key}" not found` })
  }

  return results
})
