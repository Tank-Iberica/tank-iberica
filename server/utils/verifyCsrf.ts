import { createError, getHeader } from 'h3'
import type { H3Event } from 'h3'

/**
 * Verify CSRF protection via X-Requested-With header.
 * Browser-initiated fetch/XHR calls set this header.
 * Server-to-server webhooks should NOT use this check.
 */
export function verifyCsrf(event: H3Event): void {
  const xRequestedWith = getHeader(event, 'x-requested-with')

  if (xRequestedWith !== 'XMLHttpRequest') {
    throw createError({ statusCode: 403, message: 'CSRF validation failed' })
  }
}
