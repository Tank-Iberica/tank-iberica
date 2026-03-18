/**
 * defineProtectedHandler — Unified wrapper for server routes.
 *
 * Reduces boilerplate by providing:
 *   1. try/catch with safe error handling
 *   2. Auth check (optional)
 *   3. Role check (optional)
 *   4. Request logging
 *
 * Usage:
 *   export default defineProtectedHandler({
 *     requireAuth: true,
 *     requireRole: 'admin',
 *   }, async (event, { user }) => {
 *     // handler logic
 *   })
 *
 * Roadmap: N63
 */
import type { H3Event } from 'h3'
import { safeError } from './safeError'
import { logger } from './logger'

export interface ProtectedHandlerOptions {
  /** Require authenticated user. Default: false */
  requireAuth?: boolean
  /** Require specific role. Implies requireAuth. */
  requireRole?: string
  /** Log request (method, path). Default: false */
  logRequest?: boolean
}

export interface HandlerContext {
  user: { id: string; email?: string; role?: string } | null
}

type HandlerFn = (event: H3Event, context: HandlerContext) => Promise<unknown>

/**
 * Create a protected event handler with built-in auth, role, and error handling.
 */
export function defineProtectedHandler(
  options: ProtectedHandlerOptions,
  handler: HandlerFn,
) {
  return defineEventHandler(async (event: H3Event) => {
    try {
      // Logging
      if (options.logRequest) {
        const method = event.method || 'GET'
        const path = event.path || ''
        logger.info(`[${method}] ${path}`)
      }

      // Auth
      let user: HandlerContext['user'] = null
      if (options.requireAuth || options.requireRole) {
        const supabaseUser = await serverSupabaseUser(event)
        if (!supabaseUser) {
          throw safeError(401, 'Authentication required')
        }
        const role =
          (supabaseUser.user_metadata?.role as string) ||
          (supabaseUser.app_metadata?.role as string) ||
          'user'
        user = { id: supabaseUser.id, email: supabaseUser.email, role }

        // Role check
        if (options.requireRole && role !== options.requireRole && role !== 'admin') {
          throw safeError(403, `Requires role: ${options.requireRole}`)
        }
      }

      return await handler(event, { user })
    } catch (err: unknown) {
      // Re-throw safe errors (they already have statusCode)
      if (err && typeof err === 'object' && 'statusCode' in err) {
        throw err
      }
      // Wrap unexpected errors
      const message = err instanceof Error ? err.message : 'Internal server error'
      logger.error(`[defineProtectedHandler] ${message}`)
      throw safeError(500, 'Internal server error')
    }
  })
}
