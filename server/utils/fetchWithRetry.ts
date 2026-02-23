/**
 * Fetch with exponential backoff retry for transient errors.
 * Retries on: 429, 500, 502, 503, 504, network errors.
 * Does NOT retry on: 400, 401, 403, 404.
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  { maxRetries = 3, baseDelayMs = 500 } = {},
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response
      }

      if (response.status >= 500 || response.status === 429) {
        if (attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
      }

      return response
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('fetchWithRetry: all retries exhausted')
}
