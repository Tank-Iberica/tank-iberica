import { generateOpenApiSpec } from '../utils/openApiSpec'

/**
 * GET /api/docs — Serves the OpenAPI 3.0 specification.
 * No authentication required (public documentation).
 */
export default defineEventHandler(() => {
  return generateOpenApiSpec()
})
