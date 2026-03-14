function isClientError(status: number): boolean {
  return status >= 400 && status < 500 && status !== 429
}

function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 429
}

function sleepBackoff(attempt: number, baseDelayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, baseDelayMs * Math.pow(2, attempt)))
}

/**
 * Fetch with exponential backoff retry for transient errors.
 * Retries on: 429, 500, 502, 503, 504, network errors.
 * Does NOT retry on: 400, 401, 403, 404.
 *
 * Optionally propagates x-request-id header for cross-service correlation (#384).
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  { maxRetries = 3, baseDelayMs = 500, requestId }: { maxRetries?: number; baseDelayMs?: number; requestId?: string } = {},
): Promise<Response> {
  if (requestId) {
    const headers = new Headers(options.headers)
    if (!headers.has('x-request-id')) headers.set('x-request-id', requestId)
    options = { ...options, headers }
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)
      if (isClientError(response.status)) return response
      if (isRetryableStatus(response.status) && attempt < maxRetries) {
        await sleepBackoff(attempt, baseDelayMs)
        continue
      }
      return response
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < maxRetries) await sleepBackoff(attempt, baseDelayMs)
    }
  }

  throw lastError || new Error('fetchWithRetry: all retries exhausted')
}
