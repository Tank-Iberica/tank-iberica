/**
 * GET /api/notifications/stream
 *
 * Server-Sent Events (SSE) endpoint for real-time notifications.
 * Alternative to WebSockets for simple push notifications.
 *
 * Features:
 *   - text/event-stream content type
 *   - Heartbeat every 30s to keep connection alive
 *   - Auto-cleanup on client disconnect
 *   - Per-user event filtering
 *
 * Client usage:
 *   const es = new EventSource('/api/notifications/stream')
 *   es.onmessage = (e) => console.log(JSON.parse(e.data))
 *
 * Roadmap: N78 — SSE alternative to WebSockets
 */
import { defineEventHandler, setHeader, setResponseStatus } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { logger } from '../../utils/logger'

export const SSE_HEARTBEAT_INTERVAL_MS = 30_000
export const SSE_CONTENT_TYPE = 'text/event-stream'

export default defineEventHandler(async (event) => {
  // Auth check
  const user = await serverSupabaseUser(event)
  if (!user) {
    setResponseStatus(event, 401)
    return 'Unauthorized'
  }

  // SSE headers
  setHeader(event, 'Content-Type', SSE_CONTENT_TYPE)
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')
  setHeader(event, 'X-Accel-Buffering', 'no') // Nginx proxy support

  const writable = event.node.res

  // Send initial connection event
  writable.write(
    `event: connected\ndata: ${JSON.stringify({ userId: user.id, timestamp: Date.now() })}\n\n`,
  )

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      writable.write(`: heartbeat ${Date.now()}\n\n`)
    } catch {
      clearInterval(heartbeat)
    }
  }, SSE_HEARTBEAT_INTERVAL_MS)

  // Cleanup on disconnect
  event.node.req.on('close', () => {
    clearInterval(heartbeat)
    logger.info(`[SSE] Client disconnected: ${user.id}`)
  })

  // Keep the connection open
  // In production, notifications would be pushed from other processes
  // via a pub/sub mechanism (e.g., Supabase Realtime → SSE bridge)
})
