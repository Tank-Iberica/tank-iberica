/**
 * Server-Timing Middleware
 *
 * Adds Server-Timing header to responses for performance monitoring
 * Format: Server-Timing: db;dur=45, cache;dur=10, process;dur=5
 *
 * P1 § Request Tracing — Server-side latency visibility
 */

export default defineEventHandler((event) => {
  const startTime = Date.now()

  // Attach timing tracker to event context
  event.context._timings = {
    db: 0,
    cache: 0,
    process: 0,
    external: 0,
  }

  // Hook into response to add Server-Timing header
  const closeHandler = () => {
    const totalTime = Date.now() - startTime
    const timings = event.context._timings || {}

    // Build Server-Timing header
    const timingHeader = [
      timings.cache > 0 && `cache;dur=${timings.cache}`,
      timings.db > 0 && `db;dur=${timings.db}`,
      timings.external > 0 && `external;dur=${timings.external}`,
      `total;dur=${totalTime}`,
    ]
      .filter(Boolean)
      .join(', ')

    if (timingHeader) {
      setHeader(event, 'Server-Timing', timingHeader)
    }

    // Also add to X-Response-Time header for debugging
    setHeader(event, 'X-Response-Time', `${totalTime}ms`)
  }

  // Register response hook via Node.js response finish event
  event.node.res.on('finish', closeHandler)

  return
})
