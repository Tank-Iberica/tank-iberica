/**
 * Server-side Zod validation for request bodies.
 *
 * Usage:
 *   import { z } from 'zod'
 *   const schema = z.object({ email: z.string().email() })
 *   const body = await validateBody(event, schema)
 *   // body is fully typed, 400 thrown if invalid
 */
import type { H3Event } from 'h3'
import type { ZodSchema, ZodError, z } from 'zod'
import { readBody } from 'h3'
import { safeError } from './safeError'
import { logger } from './logger'

function formatZodErrors(error: ZodError): string {
  return error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
}

export async function validateBody<T extends ZodSchema>(
  event: H3Event,
  schema: T,
): Promise<z.infer<T>> {
  const body = await readBody(event)
  const result = schema.safeParse(body)

  if (!result.success) {
    const details = formatZodErrors(result.error)
    logger.warn('Validation failed', { details, path: event.path })
    throw safeError(400, 'Datos inválidos')
  }

  return result.data
}
