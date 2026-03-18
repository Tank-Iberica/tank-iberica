/**
 * useCorrelationId — Generates a per-session correlation ID and provides
 * a fetch wrapper that propagates it via X-Correlation-ID header.
 *
 * This allows tracing a user flow across multiple API requests, jobs, and logs:
 *   Frontend request → API handler → Job queue → Email → Log entries
 *   All share the same correlationId.
 */

const SESSION_KEY = 'correlation_session_id'

/** Get or create a session-scoped correlation ID. */
function getCorrelationId(): string {
  if (!import.meta.client) return 'ssr'

  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}

/** Composable for correlation id. */
export function useCorrelationId() {
  const correlationId = getCorrelationId()

  /**
   * Wrapper around useFetch that adds X-Correlation-ID header automatically.
   * Usage: const { data } = await fetchWithCorrelation('/api/endpoint', { method: 'POST', body })
   */
  function fetchWithCorrelation<T>(
    url: string,
    options: Record<string, unknown> = {},
  ) {
    const existingHeaders = (options.headers as Record<string, string>) || {}
    return useFetch<T>(url, {
      ...options,
      headers: {
        ...existingHeaders,
        'x-correlation-id': correlationId,
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  }

  return {
    correlationId,
    fetchWithCorrelation,
  }
}
